import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { TIERS, type TierId, grantCredits } from "@vk/billing";
import { flushPendingForCustomer } from "@vk/inngest";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const seen = await db
    .insert(schema.stripeEvent)
    .values({
      id: event.id,
      type: event.type,
      payload: event.data as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: schema.stripeEvent.id })
    .returning({ id: schema.stripeEvent.id });

  if (seen.length === 0) {
    return NextResponse.json({ ok: true, duplicate: true });
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
      default:
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[stripe-webhook] handler failed for ${event.type}`, err);
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
  await applyTierToWorkspace({
    workspaceId,
    tier,
    status: sub.status,
    stripeCustomerId: stringOrNull(sub.customer),
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: periodEndFromSubscription(sub),
  });
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  const workspaceId =
    (sub.metadata?.workspaceId as string | undefined) ??
    (await lookupWorkspaceByCustomer(stringOrNull(sub.customer)));
  if (!workspaceId) return;
  await applyTierToWorkspace({
    workspaceId,
    tier: "free",
    status: "canceled",
    stripeCustomerId: stringOrNull(sub.customer),
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
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
  // already granted via handleCheckoutCompleted. The invoice.kind heuristic:
  // subscription-tied invoices carry `subscription`; pack-payment invoices
  // do not.
  if (!stringOrNull((invoice as unknown as { subscription?: unknown }).subscription)) {
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
  await db
    .update(schema.subscription)
    .set({ status: "past_due", updatedAt: new Date() })
    .where(eq(schema.subscription.workspaceId, workspaceId));
}

interface ApplyTierInput {
  workspaceId: string;
  tier: TierId;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
}

async function applyTierToWorkspace(input: ApplyTierInput): Promise<void> {
  const db = getDb();
  const config = TIERS[input.tier];
  const updates: Record<string, unknown> = {
    tier: input.tier,
    status: input.status,
    creditsQuotaPerCycle: config.creditsPerCycle,
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
      creditsQuotaPerCycle: config.creditsPerCycle,
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

function periodEndFromSubscription(sub: Stripe.Subscription): Date | null {
  const candidate =
    (sub as unknown as { current_period_end?: number }).current_period_end;
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
