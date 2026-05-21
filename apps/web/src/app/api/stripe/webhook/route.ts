import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { TIERS, type TierId } from "@vk/billing";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook handler.
 *
 * Sub-Plan-A: lifted to workspace-level subscriptions. Sub-Plan-B will
 * extend with Meter-Events, Pre-Paid-Credit-Grants, `invoice.created`
 * meter-flush, and the Auto-Overage branch. This file is intentionally
 * scoped to the minimum needed for Sub-A's tier-rename to typecheck.
 *
 * Load-bearing constraints:
 *   1. Node runtime (Edge re-encodes the body and breaks signatures).
 *   2. Raw body via req.text() BEFORE JSON-parse.
 *   3. Idempotent: stripe_event PK upsert.
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

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const workspaceId = await lookupWorkspaceByCustomer(
    stringOrNull(invoice.customer),
  );
  if (!workspaceId) return;
  const db = getDb();
  await db
    .update(schema.subscription)
    .set({ creditsUsedThisPeriod: 0, updatedAt: new Date() })
    .where(eq(schema.subscription.workspaceId, workspaceId));
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
