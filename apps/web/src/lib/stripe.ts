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
 * Convention (Sub-Plan-A — new 4-tier ladder):
 *   STRIPE_PRICE_STARTER_MONTHLY = price_xxx
 *   STRIPE_PRICE_STARTER_ANNUAL  = price_yyy (20% off)
 *   STRIPE_PRICE_PRO_MONTHLY / _ANNUAL
 *   STRIPE_PRICE_AGENCY_MONTHLY / _ANNUAL
 *
 * Sub-Plan-B introduces Meter-Prices + Pre-Paid-Packs on top.
 *
 * Backwards-compat: STRIPE_PRICE_<TIER> (no suffix) maps to monthly.
 */
type PaidTier = Exclude<TierId, "free">;
type CycleSuffix = "MONTHLY" | "ANNUAL";

const TIER_ENV_NAME: Record<PaidTier, string> = {
  starter: "STARTER",
  pro: "PRO",
  agency: "AGENCY",
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

// Sub-Plan-B — pre-paid credit packs (one-time `mode=payment` checkout).
export type PrepaidPackSize = 100 | 500;

export function prepaidPackPriceId(size: PrepaidPackSize): string | null {
  return process.env[`STRIPE_PRICE_PACK_${size}`] ?? null;
}

export function prepaidPackCredits(size: PrepaidPackSize): number {
  return size;
}

// Sub-Plan-B — Stripe meter IDs (provisioned by scripts/stripe-test-setup.ts).
export type MeterKind = "overage" | "ai_markup";

const METER_EVENT_NAMES: Record<MeterKind, string> = {
  overage: "audit_credit_overage",
  ai_markup: "ai_cost_markup_microcents",
};

const METER_ENV_KEY: Record<MeterKind, string> = {
  overage: "STRIPE_METER_AUDIT_CREDIT_OVERAGE",
  ai_markup: "STRIPE_METER_AI_COST_MARKUP_MICROCENTS",
};

const METER_PRICE_ENV_KEY: Record<MeterKind, string> = {
  overage: "STRIPE_PRICE_OVERAGE_CREDIT_EUR",
  ai_markup: "STRIPE_PRICE_AI_MARKUP_MICROCENT_EUR",
};

export function meterIdFor(kind: MeterKind): string | null {
  return process.env[METER_ENV_KEY[kind]] ?? null;
}

export function meterPriceIdFor(kind: MeterKind): string | null {
  return process.env[METER_PRICE_ENV_KEY[kind]] ?? null;
}

export function meterEventName(kind: MeterKind): string {
  return METER_EVENT_NAMES[kind];
}

export function billingBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"
  );
}
