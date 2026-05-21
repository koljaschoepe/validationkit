// Sub-Plan-A (saas-pricing-sub-a-db-metering) — new 4-tier ladder, EUR-priced,
// credit-based. Replaces the legacy 6-tier USD ladder. Master-Plan §2 Q4.3
// authorizes the wipe — no migration table since no live customer rows exist.

export type TierId = "free" | "starter" | "pro" | "agency";

export type BillingCycle = "monthly" | "annual";

/** 20% off the headline monthly across all paid tiers (carried from ADR-0020). */
export const ANNUAL_DISCOUNT = 0.2;

export interface TierConfig {
  id: TierId;
  label: string;
  /** Monthly headline price in EUR cents (e.g. 2900 = €29.00). 0 for free. */
  monthlyEurCents: number;
  /** Credits included per billing cycle. For `free` this is lifetime (no reset). */
  creditsPerCycle: number;
  /**
   * True for `free` only — credits never reset, the workspace is capped for
   * the lifetime of its existence. Paid tiers reset on `invoice.paid`.
   */
  isLifetimeCap: boolean;
  /** Distinct customer rows the workspace may track. */
  customerWorkspacesIncluded: number;
  /** Seat-quota (membership rows). Soft-gated in UI, not enforced server-side yet. */
  seatsIncluded: number;
  /** Feature toggles. Strings keep the set open-ended without enum churn. */
  features: ReadonlyArray<TierFeature>;
  /** BYOK opt-in is gated to higher tiers — Free/Starter use managed AI only. */
  byokAllowed: boolean;
  /** Customer-facing description. */
  description: string;
}

export type TierFeature =
  | "white_label_pdf"
  | "sso_oidc"
  | "priority_support"
  | "byok"
  | "audit_export"
  | "custom_dpa";

export const TIERS: Record<TierId, TierConfig> = {
  free: {
    id: "free",
    label: "Free",
    monthlyEurCents: 0,
    creditsPerCycle: 3,
    isLifetimeCap: true,
    customerWorkspacesIncluded: 1,
    seatsIncluded: 1,
    features: [],
    byokAllowed: false,
    description:
      "3 audit credits total (lifetime). 1 customer workspace. Quick audits only. Card-free trial.",
  },
  starter: {
    id: "starter",
    label: "Starter",
    monthlyEurCents: 2900,
    creditsPerCycle: 50,
    isLifetimeCap: false,
    customerWorkspacesIncluded: 3,
    seatsIncluded: 1,
    features: ["audit_export"],
    byokAllowed: false,
    description:
      "50 credits / month, 3 customer workspaces, audit export. Best for solo consultants.",
  },
  pro: {
    id: "pro",
    label: "Pro",
    monthlyEurCents: 9900,
    creditsPerCycle: 300,
    isLifetimeCap: false,
    customerWorkspacesIncluded: 10,
    seatsIncluded: 3,
    features: ["audit_export", "white_label_pdf", "byok"],
    byokAllowed: true,
    description:
      "300 credits / month, 10 customer workspaces, white-label PDF, BYOK provider keys.",
  },
  agency: {
    id: "agency",
    label: "Agency",
    monthlyEurCents: 29900,
    creditsPerCycle: 1500,
    isLifetimeCap: false,
    customerWorkspacesIncluded: 50,
    seatsIncluded: 10,
    features: [
      "audit_export",
      "white_label_pdf",
      "byok",
      "sso_oidc",
      "priority_support",
      "custom_dpa",
    ],
    byokAllowed: true,
    description:
      "1500 credits / month, 50 customer workspaces, SSO, priority support, custom DPA.",
  },
};

export function isPaidTier(tier: TierId): boolean {
  return tier !== "free";
}

export function tierConfig(tier: string): TierConfig {
  return TIERS[(tier as TierId) in TIERS ? (tier as TierId) : "free"];
}

/** EUR cents for a tier × cycle. Annual = 12 × monthly × (1 − discount). */
export function priceForCycle(
  config: TierConfig,
  cycle: BillingCycle,
): number {
  if (config.monthlyEurCents === 0) return 0;
  if (cycle === "monthly") return config.monthlyEurCents;
  return Math.round(config.monthlyEurCents * 12 * (1 - ANNUAL_DISCOUNT));
}

export function monthlyEquivalent(
  config: TierConfig,
  cycle: BillingCycle,
): number {
  if (cycle === "monthly") return config.monthlyEurCents;
  return Math.round(priceForCycle(config, "annual") / 12);
}

export function hasFeature(config: TierConfig, feature: TierFeature): boolean {
  return config.features.includes(feature);
}
