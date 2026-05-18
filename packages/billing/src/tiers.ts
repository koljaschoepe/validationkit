export type TierId =
  | "free"
  | "solo_indie"
  | "solo_pro"
  | "agency_pro"
  | "agency_scale"
  | "agency_scale_plus";

export type BillingCycle = "monthly" | "annual";

/** 20% off the monthly headline price across all paid tiers (ADR-0020). */
export const ANNUAL_DISCOUNT = 0.2;

export interface TierConfig {
  id: TierId;
  label: string;
  /** Monthly headline price in USD. */
  priceUsd: number;
  /** True when the tier ships annual-only (no self-serve monthly checkout). */
  annualOnly: boolean;
  /** True when an MSA contract is required before live activation. */
  msaRequired: boolean;
  paidReposQuota: number;
  runsQuota: number;
  seatsQuota: number;
  description: string;
}

/**
 * Single source of truth for tier quotas + pricing. Sprint 0.13.
 * Mirrored into the `subscription` row on each webhook write so app-side
 * gates can decide without round-tripping Stripe.
 *
 * Pricing pulled from PRD §6 + docs/research/dashboard-pivot/06-freemium-pricing.md.
 * No $99 sandwich tier (PRD constraint #15).
 */
export const TIERS: Record<TierId, TierConfig> = {
  free: {
    id: "free",
    label: "Solo Free",
    priceUsd: 0,
    annualOnly: false,
    msaRequired: false,
    paidReposQuota: 1,
    runsQuota: 20,
    seatsQuota: 1,
    description: "1 repo, 20 audits/mo, 30-day retention.",
  },
  solo_indie: {
    id: "solo_indie",
    label: "Solo Indie",
    priceUsd: 25,
    annualOnly: false,
    msaRequired: false,
    paidReposQuota: 3,
    runsQuota: 50,
    seatsQuota: 1,
    description: "3 repos, 50 audits/mo, 90-day retention.",
  },
  solo_pro: {
    id: "solo_pro",
    label: "Solo Pro",
    priceUsd: 79,
    annualOnly: false,
    msaRequired: false,
    paidReposQuota: 10,
    runsQuota: 250,
    seatsQuota: 1,
    description: "10 repos, 250 audits/mo, audit-report export, 1-year retention.",
  },
  agency_pro: {
    id: "agency_pro",
    label: "Agency Pro",
    priceUsd: 299,
    annualOnly: false,
    msaRequired: false,
    paidReposQuota: 30,
    runsQuota: 1000,
    seatsQuota: 5,
    description: "30 customer repos, 5 seats, drift-detection, cross-vendor parser, 2-year retention.",
  },
  agency_scale: {
    id: "agency_scale",
    label: "Agency Scale",
    priceUsd: 799,
    annualOnly: false,
    msaRequired: false,
    paidReposQuota: 100,
    runsQuota: 5000,
    seatsQuota: 15,
    description: "100 customer repos, 15 seats, SSO, audit-trail export, white-label, priority support.",
  },
  agency_scale_plus: {
    id: "agency_scale_plus",
    label: "Agency Scale Plus",
    priceUsd: 1499,
    annualOnly: true,
    msaRequired: true,
    paidReposQuota: 300,
    runsQuota: 20000,
    seatsQuota: 30,
    description:
      "300 customer repos, 30 seats, annual-only (MSA required), dedicated success contact, custom DPA. M3-M9 LOI absorption tier.",
  },
};

/**
 * USD price for a tier × billing-cycle. Annual = 12 × monthly × (1-discount).
 * Free tier returns 0 either way.
 */
export function priceForCycle(
  config: TierConfig,
  cycle: BillingCycle,
): number {
  if (config.priceUsd === 0) return 0;
  if (cycle === "monthly") return config.priceUsd;
  return Math.round(config.priceUsd * 12 * (1 - ANNUAL_DISCOUNT));
}

export function monthlyEquivalent(
  config: TierConfig,
  cycle: BillingCycle,
): number {
  if (cycle === "monthly") return config.priceUsd;
  return Math.round(priceForCycle(config, "annual") / 12);
}

export function isPaidTier(tier: TierId): boolean {
  return tier !== "free";
}

export function tierConfig(tier: string): TierConfig {
  return TIERS[(tier as TierId) in TIERS ? (tier as TierId) : "free"];
}
