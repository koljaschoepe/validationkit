"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema, isDbEnabled } from "@vk/db";
import {
  ensureSubscription,
  type BillingCycle,
  type TierId,
} from "@vk/billing";
import { getSessionUser } from "./session";
import { ensureDefaultWorkspace } from "./workspaces";
import {
  billingBaseUrl,
  getStripe,
  isStripeEnabled,
  prepaidPackCredits,
  prepaidPackPriceId,
  type PrepaidPackSize,
  priceIdFor,
} from "./stripe";

// Sub-Plan-A: workspace-level subscriptions. Sub-Plan-B will rewrite this
// file end-to-end (metered subscription items, pre-paid credit packs, AI-
// cost-markup meter). Until then this is the minimum-viable subscribe flow
// — annual-only/MSA gates are dropped along with the old agency_scale_plus
// tier; the new 4-tier ladder has no such constraints.

export type ActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function normaliseCycle(input: unknown): BillingCycle {
  return input === "annual" ? "annual" : "monthly";
}

export async function createCheckoutSession(
  tier: TierId,
  cycle: BillingCycle = "monthly",
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
  const priceId = priceIdFor(tier, cycle);
  if (!priceId) {
    return {
      ok: false,
      error: `Stripe price ID for tier "${tier}" (${cycle}) is not configured.`,
    };
  }
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Sign in before subscribing." };
  }

  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const snap = await ensureSubscription(workspaceId);
  const stripe = getStripe();
  const baseUrl = billingBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: snap.stripeCustomerId ?? undefined,
    customer_email: snap.stripeCustomerId ? undefined : user.email,
    client_reference_id: workspaceId,
    subscription_data: {
      metadata: { workspaceId, userId: user.id, tier, cycle },
    },
    metadata: { workspaceId, userId: user.id, tier, cycle },
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    customer_update: snap.stripeCustomerId ? { address: "auto" } : undefined,
    tax_id_collection: { enabled: true },
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
  const cycle = normaliseCycle(formData.get("cycle"));
  const result = await createCheckoutSession(tier, cycle);
  if (!result.ok) {
    redirect(
      `/billing?status=error&reason=${encodeURIComponent(result.error)}`,
    );
  }
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

  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();
  const rows = await db
    .select({ stripeCustomerId: schema.subscription.stripeCustomerId })
    .from(schema.subscription)
    .where(eq(schema.subscription.workspaceId, workspaceId))
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

// Sub-Plan-B — pre-paid credit pack checkout. Separate `mode=payment` session
// (not a subscription) so the invoice flows through `invoice.paid` once and
// triggers a one-time credit grant in the webhook.
export async function createPrepaidPackCheckoutSession(
  packSize: PrepaidPackSize,
): Promise<ActionResult> {
  if (!isDbEnabled()) {
    return { ok: false, error: "Database is not enabled on this deployment." };
  }
  if (!isStripeEnabled()) {
    return { ok: false, error: "Stripe is not configured." };
  }
  const priceId = prepaidPackPriceId(packSize);
  if (!priceId) {
    return {
      ok: false,
      error: `Pre-paid pack price for size ${packSize} is not configured (STRIPE_PRICE_PACK_${packSize}).`,
    };
  }
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Sign in before purchasing credits." };
  }

  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const snap = await ensureSubscription(workspaceId);
  const stripe = getStripe();
  const baseUrl = billingBaseUrl();
  const credits = prepaidPackCredits(packSize);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: snap.stripeCustomerId ?? undefined,
    customer_email: snap.stripeCustomerId ? undefined : user.email,
    client_reference_id: workspaceId,
    payment_intent_data: {
      metadata: {
        workspaceId,
        userId: user.id,
        credits: String(credits),
        kind: "prepaid_pack",
      },
    },
    metadata: {
      workspaceId,
      userId: user.id,
      credits: String(credits),
      kind: "prepaid_pack",
    },
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    customer_update: snap.stripeCustomerId ? { address: "auto" } : undefined,
    tax_id_collection: { enabled: true },
    success_url: `${baseUrl}/billing?status=pack_success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/billing?status=pack_cancelled`,
  });
  if (!session.url) {
    return { ok: false, error: "Stripe did not return a checkout URL." };
  }
  return { ok: true, url: session.url };
}

export async function buyPrepaidPackAction(formData: FormData): Promise<void> {
  const raw = String(formData.get("size") ?? "");
  const sizeNum = Number(raw);
  if (sizeNum !== 100 && sizeNum !== 500) {
    redirect(
      `/billing?status=error&reason=${encodeURIComponent("Invalid pack size.")}`,
    );
  }
  const result = await createPrepaidPackCheckoutSession(
    sizeNum as PrepaidPackSize,
  );
  if (!result.ok) {
    redirect(
      `/billing?status=error&reason=${encodeURIComponent(result.error)}`,
    );
  }
  redirect(result.url as never);
}
