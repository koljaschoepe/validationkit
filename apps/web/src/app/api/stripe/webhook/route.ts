import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { TIERS, type TierId } from "@vk/billing";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sprint 0.13 — Stripe webhook handler.
 *
 * Load-bearing constraints (per A11 research + Stripe docs):
 *   1. Node runtime: Edge re-encodes the body and breaks signature verification.
 *   2. Raw body via req.text() BEFORE JSON-parse.
 *   3. Idempotent: upsert event.id into stripe_event PK; replays no-op.
 *   4. Keep handler under 200ms; defer heavy work later via Inngest.
 *
 * Verifies `Stripe-Signature` against STRIPE_WEBHOOK_SECRET. Maps tier from
 * subscription.metadata.tier (we wrote it during checkout creation).
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

  // Idempotency: insert returning the PK; if conflict, we've seen this event.
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
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
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
        // Acknowledged but not acted on; Stripe will not retry.
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[stripe-webhook] handler failed for ${event.type}`, err);
    return NextResponse.json(
      { error: "Handler error." },
      { status: 500 },
    );
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.client_reference_id ?? (session.metadata?.userId as string | undefined);
  if (!userId) return;
  const tier = (session.metadata?.tier as TierId | undefined) ?? "free";
  const customerId = stringOrNull(session.customer);
  const subscriptionId = stringOrNull(session.subscription);
  await applyTierToUser({
    userId,
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
  const userId =
    (sub.metadata?.userId as string | undefined) ??
    (await lookupUserIdByCustomer(stringOrNull(sub.customer)));
  if (!userId) return;
  const tier = (sub.metadata?.tier as TierId | undefined) ?? "free";
  await applyTierToUser({
    userId,
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
  const userId =
    (sub.metadata?.userId as string | undefined) ??
    (await lookupUserIdByCustomer(stringOrNull(sub.customer)));
  if (!userId) return;
  await applyTierToUser({
    userId,
    tier: "free",
    status: "canceled",
    stripeCustomerId: stringOrNull(sub.customer),
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const userId = await lookupUserIdByCustomer(stringOrNull(invoice.customer));
  if (!userId) return;
  const db = getDb();
  await db
    .update(schema.subscription)
    .set({ runsUsedThisPeriod: 0, updatedAt: new Date() })
    .where(eq(schema.subscription.userId, userId));
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const userId = await lookupUserIdByCustomer(stringOrNull(invoice.customer));
  if (!userId) return;
  const db = getDb();
  await db
    .update(schema.subscription)
    .set({ status: "past_due", updatedAt: new Date() })
    .where(eq(schema.subscription.userId, userId));
}

interface ApplyTierInput {
  userId: string;
  tier: TierId;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
}

async function applyTierToUser(input: ApplyTierInput): Promise<void> {
  const db = getDb();
  const config = TIERS[input.tier];
  const updates: Record<string, unknown> = {
    tier: input.tier,
    status: input.status,
    paidReposQuota: config.paidReposQuota,
    runsQuota: config.runsQuota,
    updatedAt: new Date(),
  };
  if (input.stripeCustomerId) updates.stripeCustomerId = input.stripeCustomerId;
  if (input.stripeSubscriptionId)
    updates.stripeSubscriptionId = input.stripeSubscriptionId;
  if (input.currentPeriodEnd) updates.currentPeriodEnd = input.currentPeriodEnd;

  // Upsert via existence check; subscription has UNIQUE(user_id).
  const existing = await db
    .select({ id: schema.subscription.id })
    .from(schema.subscription)
    .where(eq(schema.subscription.userId, input.userId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(schema.subscription)
      .set(updates)
      .where(eq(schema.subscription.userId, input.userId));
  } else {
    await db.insert(schema.subscription).values({
      userId: input.userId,
      tier: input.tier,
      status: input.status,
      paidReposQuota: config.paidReposQuota,
      runsQuota: config.runsQuota,
      runsUsedThisPeriod: 0,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      currentPeriodEnd: input.currentPeriodEnd,
    });
  }
}

async function lookupUserIdByCustomer(
  customerId: string | null,
): Promise<string | null> {
  if (!customerId) return null;
  const db = getDb();
  const rows = await db
    .select({ userId: schema.subscription.userId })
    .from(schema.subscription)
    .where(eq(schema.subscription.stripeCustomerId, customerId))
    .limit(1);
  return rows[0]?.userId ?? null;
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
