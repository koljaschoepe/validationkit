import Stripe from "stripe";
import type { BillingCycle, TierId } from "@vk/billing";

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
      appInfo: { name: "ValidationKit", version: "0.0.15" },
    });
  }
  return cached;
}

/**
 * Per-tier × billing-cycle Stripe Price IDs. Wired via env at deploy time.
 *
 * Convention:
 *   STRIPE_PRICE_SOLO_INDIE_MONTHLY   = price_xxx (monthly recurring)
 *   STRIPE_PRICE_SOLO_INDIE_ANNUAL    = price_yyy (annual recurring, 20% off)
 *
 * Backwards-compat: STRIPE_PRICE_SOLO_INDIE (no suffix) maps to monthly.
 *
 * The founder creates one Stripe Product per tier and two recurring Prices
 * per Product (monthly + annual), then drops the IDs into Vercel env vars.
 * agency_scale_plus is annual-only — monthly env var stays unset.
 */
type PaidTier = Exclude<TierId, "free">;
type CycleSuffix = "MONTHLY" | "ANNUAL";

const TIER_ENV_NAME: Record<PaidTier, string> = {
  solo_indie: "SOLO_INDIE",
  solo_pro: "SOLO_PRO",
  agency_pro: "AGENCY_PRO",
  agency_scale: "AGENCY_SCALE",
  agency_scale_plus: "AGENCY_SCALE_PLUS",
};

function envKeyFor(tier: PaidTier, suffix: CycleSuffix): string {
  return `STRIPE_PRICE_${TIER_ENV_NAME[tier]}_${suffix}`;
}

export function priceIdFor(
  tier: TierId,
  cycle: BillingCycle = "monthly",
): string | null {
  if (tier === "free") return null;
  const paidTier = tier as PaidTier;
  const suffix: CycleSuffix = cycle === "annual" ? "ANNUAL" : "MONTHLY";
  const newStyle = process.env[envKeyFor(paidTier, suffix)];
  if (newStyle) return newStyle;
  // Backwards-compat: STRIPE_PRICE_<TIER> with no suffix = monthly.
  if (suffix === "MONTHLY") {
    return process.env[`STRIPE_PRICE_${TIER_ENV_NAME[paidTier]}`] ?? null;
  }
  return null;
}

export function billingBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"
  );
}
