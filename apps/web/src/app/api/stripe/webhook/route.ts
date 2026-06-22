import * as React from "react";
import { NextResponse } from "next/server";
import { and, eq, lt, or } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb, isDbEnabled, schema } from "@vk/db";
import {
  TIERS,
  type TierId,
  type BillingCycle,
  grantCredits,
} from "@vk/billing";
import { flushPendingForCustomer } from "@vk/inngest";
import {
  PlanChangeConfirmation,
  SubscriptionPastDue,
  sendTransactionalEmail,
} from "@vk/auth";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import { isEmailNotificationEnabled } from "@/lib/notification-prefs";

function billingUrlForWorkspace(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_BASE_URL ??
    "http://localhost:3000";
  return `${base}/${slug}/settings/billing`;
}

async function fetchWorkspaceContact(workspaceId: string): Promise<
  { email: string; workspaceName: string; slug: string } | null
> {
  const rows = await getDb()
    .select({
      email: schema.user.email,
      workspaceName: schema.workspace.name,
      slug: schema.workspace.slug,
    })
    .from(schema.workspace)
    .innerJoin(schema.user, eq(schema.workspace.ownerId, schema.user.id))
    .where(eq(schema.workspace.id, workspaceId))
    .limit(1);
  return rows[0] ?? null;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A 'processing' row older than this is treated as a crashed first attempt
// and may be re-claimed by a retry. Must comfortably exceed the function's
// real handler runtime (seconds) while staying far below Stripe's retry
// spacing (minutes-hours).
const STALE_PROCESSING_MS = 5 * 60_000;

/**
 * Stripe webhook handler.
 *
 * Sub-Plan-B-final: workspace-level subscriptions + Meter-Event flush on
 * invoice.created + pre-paid credit pack grants on invoice.paid.
 *
 * Six handled events:
 *   checkout.session.completed         — initial provision + pre-paid pack credit grant
 *   customer.subscription.created      — idempotent re-affirm of tier snapshot
 *   customer.subscription.updated      — tier / status change
 *   customer.subscription.deleted      — downgrade to free
 *   invoice.created                    — synchronous meter-flush BEFORE 2xx
 *   invoice.paid                       — monthly credit grant + reset
 *   invoice.payment_failed             — flag past_due
 *
 * Load-bearing constraints:
 *   1. Node runtime (Edge re-encodes the body and breaks signatures).
 *   2. Raw body via req.text() BEFORE JSON-parse.
 *   3. Idempotent: stripe_event PK upsert.
 *   4. invoice.created MUST 2xx only AFTER meter-flush — Stripe waits up to
 *      72h for finalization otherwise and the invoice would settle without
 *      overage. Hand off to flushPendingForCustomer synchronously here.
 */
export async function POST(req: Request): Promise<Response> {
  if (!isDbEnabled() || !isStripeEnabled()) {
    return NextResponse.json(
      { error: "Stripe webhook is not enabled on this deployment." },
      { status: 503 },
    );
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set." },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature") ?? "";
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe-Signature header." },
      { status: 400 },
    );
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err);
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  const db = getDb();

  // S3-01 (second-opinion audit): the stripe_event row is a processing-state
  // machine, not a plain dedupe. The previous insert-before-process marked
  // the event as seen BEFORE the handler ran — a transient handler failure
  // (Neon hiccup, Stripe API error) left the row in place, so Stripe's retry
  // of the same event id short-circuited as `duplicate` and the event (e.g.
  // a paid invoice's monthly credit grant) was lost permanently, with no
  // reconcile path to heal it. Now: claim as 'processing', mark 'processed'
  // on success / 'failed' on error, and let Stripe's 72h retry re-run failed
  // or stale-processing events. Handlers are idempotent (grant idempotency
  // index, PK/unique upserts), so replaying a partial first attempt is safe.
  const claimed = await db
    .insert(schema.stripeEvent)
    .values({
      id: event.id,
      type: event.type,
      status: "processing",
      payload: event.data as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: schema.stripeEvent.id })
    .returning({ id: schema.stripeEvent.id });

  if (claimed.length === 0) {
    // Row exists. Atomically re-claim iff it is 'failed' or has been stuck
    // 'processing' past the stale window (process died mid-handler) — the
    // conditional UPDATE guarantees only one concurrent delivery wins.
    const reclaimed = await db
      .update(schema.stripeEvent)
      .set({ status: "processing", processedAt: new Date() })
      .where(
        and(
          eq(schema.stripeEvent.id, event.id),
          or(
            eq(schema.stripeEvent.status, "failed"),
            and(
              eq(schema.stripeEvent.status, "processing"),
              lt(
                schema.stripeEvent.processedAt,
                new Date(Date.now() - STALE_PROCESSING_MS),
              ),
            ),
          ),
        ),
      )
      .returning({ id: schema.stripeEvent.id });

    if (reclaimed.length === 0) {
      const existing = await db
        .select({ status: schema.stripeEvent.status })
        .from(schema.stripeEvent)
        .where(eq(schema.stripeEvent.id, event.id))
        .limit(1);
      if (existing[0]?.status === "processed") {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      // Fresh 'processing': the first delivery is still in flight (handlers
      // finish well under the stale window). 500 → Stripe retries later, by
      // which point the row is 'processed' or 'failed'.
      return NextResponse.json(
        { error: "Event is currently being processed." },
        { status: 500 },
      );
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.created":
        // Idempotent with checkout.session.completed; reaffirms the tier
        // snapshot in case the checkout handler missed metadata.
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.created":
        await handleInvoiceCreated(event.data.object as Stripe.Invoice);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "customer.deleted":
        await handleCustomerDeleted(event.data.object as Stripe.Customer);
        break;
      default:
        break;
    }
    await db
      .update(schema.stripeEvent)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(schema.stripeEvent.id, event.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[stripe-webhook] handler failed for ${event.type}`, err);
    // Mark 'failed' so the next Stripe delivery re-runs the handler instead
    // of short-circuiting as a duplicate. Best-effort: if even this UPDATE
    // fails, the row stays 'processing' and the stale window re-opens it.
    try {
      await db
        .update(schema.stripeEvent)
        .set({ status: "failed", processedAt: new Date() })
        .where(eq(schema.stripeEvent.id, event.id));
    } catch (markErr) {
      console.error("[stripe-webhook] could not mark event failed", markErr);
    }
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const workspaceId =
    (session.metadata?.workspaceId as string | undefined) ??
    session.client_reference_id ??
    undefined;
  if (!workspaceId) return;

  // Pre-paid-pack checkout sessions ride `mode=payment` with metadata.kind
  // = "prepaid_pack". They don't carry a subscription — just grant credits.
  if (session.metadata?.kind === "prepaid_pack") {
    const credits = Number(session.metadata?.credits ?? "0");
    if (credits > 0) {
      await grantPrepaidPack({
        workspaceId,
        credits,
        stripeInvoiceId:
          stringOrNull(session.invoice) ??
          stringOrNull(session.payment_intent) ??
          session.id,
      });
    }
    return;
  }

  const tier = (session.metadata?.tier as TierId | undefined) ?? "free";
  const customerId = stringOrNull(session.customer);
  const subscriptionId = stringOrNull(session.subscription);
  await applyTierToWorkspace({
    workspaceId,
    tier,
    status: "active",
    cycle: cycleFromMetadata(session.metadata),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd: null,
  });
}

async function handleSubscriptionUpdated(
  sub: Stripe.Subscription,
): Promise<void> {
  const workspaceId =
    (sub.metadata?.workspaceId as string | undefined) ??
    (await lookupWorkspaceByCustomer(stringOrNull(sub.customer)));
  if (!workspaceId) return;
  const tier = (sub.metadata?.tier as TierId | undefined) ?? "free";

  // Detect tier change before we overwrite the DB row, so the email knows
  // the old + new label. Skip the email if tier didn't actually change.
  const db = getDb();
  const prior = await db
    .select({ tier: schema.subscription.tier })
    .from(schema.subscription)
    .where(eq(schema.subscription.workspaceId, workspaceId))
    .limit(1);
  const previousTier = (prior[0]?.tier as TierId | undefined) ?? "free";

  await applyTierToWorkspace({
    workspaceId,
    tier,
    status: sub.status,
    cycle: cycleFromSubscription(sub),
    stripeCustomerId: stringOrNull(sub.customer),
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: periodEndFromSubscription(sub),
  });

  if (previousTier === tier) return;
  const contact = await fetchWorkspaceContact(workspaceId);
  if (!contact) return;
  const tierOrder: TierId[] = ["free", "starter", "pro", "agency"];
  const previousIdx = tierOrder.indexOf(previousTier);
  const newIdx = tierOrder.indexOf(tier);
  const kind: "upgrade" | "downgrade" =
    newIdx > previousIdx ? "upgrade" : "downgrade";
  // Block C — the plan-change confirmation is informational; respect the
  // workspace's billing.event email preference. The critical past-due alert
  // (handleInvoicePaymentFailed) is never gated.
  if (!(await isEmailNotificationEnabled(workspaceId, "billing.event"))) return;
  await sendTransactionalEmail({
    to: contact.email,
    subject:
      kind === "upgrade"
        ? `Willkommen bei ${TIERS[tier].label}`
        : `Plan geändert auf ${TIERS[tier].label}`,
    react: React.createElement(PlanChangeConfirmation, {
      workspaceName: contact.workspaceName,
      previousTierLabel: TIERS[previousTier].label,
      newTierLabel: TIERS[tier].label,
      newCreditsPerCycle: TIERS[tier].creditsPerCycle,
      kind,
      effectiveAt: periodEndFromSubscription(sub) ?? new Date(),
      billingUrl: billingUrlForWorkspace(contact.slug),
    }),
  });
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  const workspaceId =
    (sub.metadata?.workspaceId as string | undefined) ??
    (await lookupWorkspaceByCustomer(stringOrNull(sub.customer)));
  if (!workspaceId) return;

  // Capture the prior tier for the cancellation email before the row is
  // reset to free.
  const db = getDb();
  const prior = await db
    .select({ tier: schema.subscription.tier })
    .from(schema.subscription)
    .where(eq(schema.subscription.workspaceId, workspaceId))
    .limit(1);
  const previousTier = (prior[0]?.tier as TierId | undefined) ?? "free";

  await applyTierToWorkspace({
    workspaceId,
    tier: "free",
    status: "canceled",
    cycle: "monthly",
    stripeCustomerId: stringOrNull(sub.customer),
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
  });

  if (previousTier === "free") return;
  const contact = await fetchWorkspaceContact(workspaceId);
  if (!contact) return;
  // Block C — informational cancellation mail respects billing.event.
  if (!(await isEmailNotificationEnabled(workspaceId, "billing.event"))) return;
  await sendTransactionalEmail({
    to: contact.email,
    subject: "Abonnement gekündigt",
    react: React.createElement(PlanChangeConfirmation, {
      workspaceName: contact.workspaceName,
      previousTierLabel: TIERS[previousTier].label,
      newTierLabel: TIERS.free.label,
      newCreditsPerCycle: TIERS.free.creditsPerCycle,
      kind: "canceled",
      effectiveAt: periodEndFromSubscription(sub) ?? new Date(),
      billingUrl: billingUrlForWorkspace(contact.slug),
    }),
  });
}

async function handleInvoiceCreated(invoice: Stripe.Invoice): Promise<void> {
  const customerId = stringOrNull(invoice.customer);
  if (!customerId) return;
  // Synchronous flush of any pending overage rows for this customer so the
  // upcoming finalization captures them. Without this Stripe would settle
  // the invoice without our metered line and we'd have to issue a separate
  // credit note next cycle.
  try {
    await flushPendingForCustomer({ stripeCustomerId: customerId });
  } catch (err) {
    // If the flush fails we still want a 2xx — Stripe will re-deliver the
    // invoice.created event up to 72h, giving the next attempt a chance.
    console.error("[stripe-webhook] meter flush failed", err);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const workspaceId = await lookupWorkspaceByCustomer(
    stringOrNull(invoice.customer),
  );
  if (!workspaceId) return;
  const db = getDb();
  const subRow = await db
    .select({
      tier: schema.subscription.tier,
      creditsQuotaPerCycle: schema.subscription.creditsQuotaPerCycle,
    })
    .from(schema.subscription)
    .where(eq(schema.subscription.workspaceId, workspaceId))
    .limit(1);
  const row = subRow[0];
  if (!row) return;

  // Skip the monthly-grant path for one-time pack invoices — those are
  // already granted via handleCheckoutCompleted. Subscription-tied invoices
  // carry a subscription (under parent.subscription_details in dahlia);
  // pack-payment invoices do not.
  if (!subscriptionIdFromInvoice(invoice)) {
    return;
  }

  // Reset per-cycle counter + emit a ledger row for the fresh allotment.
  await db
    .update(schema.subscription)
    .set({ creditsUsedThisPeriod: 0, updatedAt: new Date() })
    .where(eq(schema.subscription.workspaceId, workspaceId));

  await grantCredits({
    workspaceId,
    amount: row.creditsQuotaPerCycle,
    reason: "monthly_grant",
    referenceId: invoice.id ?? null,
  });
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const workspaceId = await lookupWorkspaceByCustomer(
    stringOrNull(invoice.customer),
  );
  if (!workspaceId) return;
  const db = getDb();
  const subRow = await db
    .select({ tier: schema.subscription.tier })
    .from(schema.subscription)
    .where(eq(schema.subscription.workspaceId, workspaceId))
    .limit(1);
  await db
    .update(schema.subscription)
    .set({ status: "past_due", updatedAt: new Date() })
    .where(eq(schema.subscription.workspaceId, workspaceId));

  // V2 polish — email the workspace owner so they can update their card
  // before Stripe gives up. Soft-fail: we never block the webhook on email.
  const contact = await fetchWorkspaceContact(workspaceId);
  if (!contact) return;
  const tier = (subRow[0]?.tier as TierId | undefined) ?? "free";
  const amount = ((invoice.amount_due ?? 0) / 100).toFixed(2);
  const attempts =
    (invoice as unknown as { attempt_count?: number }).attempt_count ?? 1;
  // Dunning-cap (Bundle G): Stripe smart-retries make ~4 attempts; only email the
  // first 3 so a paying customer isn't spammed with a "payment failed" mail on
  // every retry. Beyond that we stay silent and rely on the in-app past-due
  // banner + the Stripe dunning emails.
  if (attempts > 3) {
    console.warn(
      `[stripe-webhook] dunning cap hit for workspace ${workspaceId} (attempt ${attempts}) — skipping past-due email`,
    );
    return;
  }
  await sendTransactionalEmail({
    to: contact.email,
    subject: `Zahlung für ${contact.workspaceName} fehlgeschlagen`,
    react: React.createElement(SubscriptionPastDue, {
      workspaceName: contact.workspaceName,
      tierLabel: TIERS[tier].label,
      amountDueEur: `€${amount}`,
      attemptCount: attempts,
      billingUrl: billingUrlForWorkspace(contact.slug),
    }),
  });
}

// S2 (Launch-Verify): when a customer is deleted in Stripe, null the dangling
// refs and downgrade to free. Otherwise lookupWorkspaceByCustomer keeps matching
// a dead customer id and the billing-portal flow opens a portal on a customer
// that no longer exists (Stripe error). Idempotent: after nulling, a replay
// finds no workspace and returns early.
async function handleCustomerDeleted(
  customer: Stripe.Customer,
): Promise<void> {
  const workspaceId = await lookupWorkspaceByCustomer(customer.id);
  if (!workspaceId) return;
  await getDb()
    .update(schema.subscription)
    .set({
      tier: "free",
      status: "canceled",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      creditsQuotaPerCycle: TIERS.free.creditsPerCycle,
      updatedAt: new Date(),
    })
    .where(eq(schema.subscription.workspaceId, workspaceId));
}

interface ApplyTierInput {
  workspaceId: string;
  tier: TierId;
  status: string;
  cycle: BillingCycle;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
}

/** Cycle from our own checkout/subscription metadata (set in billing-actions). */
function cycleFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): BillingCycle {
  return metadata?.cycle === "annual" ? "annual" : "monthly";
}

/**
 * Cycle for a live Stripe subscription: own metadata first, price interval as
 * fallback (covers subscriptions created outside our checkout). Unknown
 * intervals fall back to 'monthly' — under-granting is the safe direction.
 */
function cycleFromSubscription(sub: Stripe.Subscription): BillingCycle {
  const meta = sub.metadata?.cycle;
  if (meta === "annual" || meta === "monthly") return meta;
  const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
  return interval === "year" ? "annual" : "monthly";
}

async function applyTierToWorkspace(input: ApplyTierInput): Promise<void> {
  const db = getDb();
  const config = TIERS[input.tier];
  // S2-01: invoice.paid fires once per billing interval, so an annual sub
  // gets its whole year of credits as one up-front allotment. The quota is
  // what handleInvoicePaid grants and what consumeCredits gates on.
  const quotaPerCycle =
    config.creditsPerCycle * (input.cycle === "annual" ? 12 : 1);
  const updates: Record<string, unknown> = {
    tier: input.tier,
    status: input.status,
    billingCycle: input.cycle,
    creditsQuotaPerCycle: quotaPerCycle,
    updatedAt: new Date(),
  };
  if (input.stripeCustomerId) updates.stripeCustomerId = input.stripeCustomerId;
  if (input.stripeSubscriptionId)
    updates.stripeSubscriptionId = input.stripeSubscriptionId;
  if (input.currentPeriodEnd) updates.currentPeriodEnd = input.currentPeriodEnd;

  const existing = await db
    .select({ id: schema.subscription.id })
    .from(schema.subscription)
    .where(eq(schema.subscription.workspaceId, input.workspaceId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(schema.subscription)
      .set(updates)
      .where(eq(schema.subscription.workspaceId, input.workspaceId));
  } else {
    await db.insert(schema.subscription).values({
      workspaceId: input.workspaceId,
      tier: input.tier,
      status: input.status,
      billingCycle: input.cycle,
      creditsQuotaPerCycle: quotaPerCycle,
      creditsUsedThisPeriod: 0,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      currentPeriodEnd: input.currentPeriodEnd,
    });
  }
}

async function lookupWorkspaceByCustomer(
  customerId: string | null,
): Promise<string | null> {
  if (!customerId) return null;
  const db = getDb();
  const rows = await db
    .select({ workspaceId: schema.subscription.workspaceId })
    .from(schema.subscription)
    .where(eq(schema.subscription.stripeCustomerId, customerId))
    .limit(1);
  return rows[0]?.workspaceId ?? null;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id: unknown }).id);
  }
  return null;
}

// K-PAY1 (Launch-Verify): Stripe API 2026-04-22.dahlia REMOVED the top-level
// `invoice.subscription` field — it now lives under
// `invoice.parent.subscription_details.subscription`. The old guard read the
// dead top-level field, so it was always null and the monthly credit-grant in
// handleInvoicePaid never fired for real invoices. Read the dahlia path first,
// fall back to the legacy top-level field for replays / older fixtures.
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parentSub = (
    invoice as unknown as {
      parent?: {
        subscription_details?: { subscription?: unknown } | null;
      } | null;
    }
  ).parent?.subscription_details?.subscription;
  const legacy = (invoice as unknown as { subscription?: unknown }).subscription;
  return stringOrNull(parentSub) ?? stringOrNull(legacy);
}

function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
  // 2026-04-22.dahlia moved `current_period_end` from the Subscription onto each
  // SubscriptionItem. Read the first item, fall back to the legacy top-level
  // field for older fixtures / replays. Without this the billing page renders an
  // empty/invalid reset date.
  const itemEnd = sub.items?.data?.[0]?.current_period_end;
  const legacy = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const candidate = typeof itemEnd === "number" ? itemEnd : legacy;
  return typeof candidate === "number" ? new Date(candidate * 1000) : null;
}

// Sub-Plan-B — grant credits for a pre-paid pack purchase. Idempotent on
// stripe_invoice_id (UNIQUE constraint catches replays).
async function grantPrepaidPack(args: {
  workspaceId: string;
  credits: number;
  stripeInvoiceId: string;
}): Promise<void> {
  const db = getDb();
  // 12-month expiry per Master-Plan §2 Q4.2.
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const inserted = await db
    .insert(schema.prepaidCreditGrant)
    .values({
      workspaceId: args.workspaceId,
      stripeInvoiceId: args.stripeInvoiceId,
      creditsGranted: args.credits,
      creditsRemaining: args.credits,
      expiresAt,
    })
    .onConflictDoNothing({ target: schema.prepaidCreditGrant.stripeInvoiceId })
    .returning({ id: schema.prepaidCreditGrant.id });

  // If the grant row already existed (replay), the ledger row also exists.
  if (inserted.length === 0) return;

  await grantCredits({
    workspaceId: args.workspaceId,
    amount: args.credits,
    reason: "prepaid_grant",
    referenceId: args.stripeInvoiceId,
  });
}
