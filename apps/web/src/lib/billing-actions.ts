"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema, isDbEnabled } from "@vk/db";
import { ensureSubscription, type TierId } from "@vk/billing";
import { getSessionUser } from "./session";
import {
  billingBaseUrl,
  getStripe,
  isStripeEnabled,
  priceIdFor,
} from "./stripe";

export type ActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createCheckoutSession(
  tier: TierId,
): Promise<ActionResult> {
  if (!isDbEnabled()) {
    return { ok: false, error: "Database is not enabled on this deployment." };
  }
  if (!isStripeEnabled()) {
    return {
      ok: false,
      error:
        "Stripe is not configured. Set STRIPE_SECRET_KEY and per-tier price IDs to enable checkout.",
    };
  }
  if (tier === "free") {
    return { ok: false, error: "The free tier has no checkout." };
  }
  const priceId = priceIdFor(tier);
  if (!priceId) {
    return {
      ok: false,
      error: `Stripe price ID for tier "${tier}" is not configured.`,
    };
  }
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Sign in before subscribing." };
  }

  const snap = await ensureSubscription(user.id);
  const stripe = getStripe();
  const baseUrl = billingBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: snap.stripeCustomerId ?? undefined,
    customer_email: snap.stripeCustomerId ? undefined : user.email,
    client_reference_id: user.id,
    subscription_data: {
      metadata: { userId: user.id, tier },
    },
    metadata: { userId: user.id, tier },
    success_url: `${baseUrl}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/billing?status=cancelled`,
  });
  if (!session.url) {
    return { ok: false, error: "Stripe did not return a checkout URL." };
  }
  return { ok: true, url: session.url };
}

export async function startCheckoutAction(formData: FormData): Promise<void> {
  const tier = String(formData.get("tier") ?? "") as TierId;
  const result = await createCheckoutSession(tier);
  if (!result.ok) {
    redirect(
      `/billing?status=error&reason=${encodeURIComponent(result.error)}`,
    );
  }
  // Stripe-hosted Checkout URL is external; typedRoutes can't model it.
  redirect(result.url as never);
}

export async function createBillingPortalSession(): Promise<ActionResult> {
  if (!isDbEnabled()) {
    return { ok: false, error: "Database is not enabled on this deployment." };
  }
  if (!isStripeEnabled()) {
    return { ok: false, error: "Stripe is not configured." };
  }
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Sign in before managing billing." };
  }

  const db = getDb();
  const rows = await db
    .select({ stripeCustomerId: schema.subscription.stripeCustomerId })
    .from(schema.subscription)
    .where(eq(schema.subscription.userId, user.id))
    .limit(1);
  const customerId = rows[0]?.stripeCustomerId;
  if (!customerId) {
    return {
      ok: false,
      error: "No Stripe customer on file yet. Subscribe to a paid tier first.",
    };
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${billingBaseUrl()}/billing`,
  });
  return { ok: true, url: portal.url };
}

export async function openBillingPortalAction(): Promise<void> {
  const result = await createBillingPortalSession();
  if (!result.ok) {
    redirect(
      `/billing?status=error&reason=${encodeURIComponent(result.error)}`,
    );
  }
  redirect(result.url as never);
}
