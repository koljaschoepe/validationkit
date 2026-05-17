import Stripe from "stripe";
import type { TierId } from "@vk/billing";

let cached: Stripe | null = null;

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "Stripe is not configured — set STRIPE_SECRET_KEY to enable billing.",
      );
    }
    cached = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
      appInfo: { name: "ValidationKit", version: "0.0.13" },
    });
  }
  return cached;
}

/**
 * Per-tier Stripe Price IDs. Wired via env vars at deploy time. When a tier
 * has no Price ID configured we treat checkout as disabled for that tier.
 *
 * Setup-flip lives outside the codebase: founder creates 5 Products + Prices
 * in Stripe Dashboard, copies the price_xxx IDs into the env vars below.
 */
export const STRIPE_PRICE_IDS: Record<Exclude<TierId, "free">, string | null> = {
  solo_indie: process.env.STRIPE_PRICE_SOLO_INDIE ?? null,
  solo_pro: process.env.STRIPE_PRICE_SOLO_PRO ?? null,
  agency_pro: process.env.STRIPE_PRICE_AGENCY_PRO ?? null,
  agency_scale: process.env.STRIPE_PRICE_AGENCY_SCALE ?? null,
};

export function priceIdFor(tier: TierId): string | null {
  if (tier === "free") return null;
  return STRIPE_PRICE_IDS[tier];
}

export function billingBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"
  );
}
