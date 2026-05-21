// Sub-Plan-A — subscription helper. One row per workspace, auto-inserted as
// `free` on first dashboard hit, mutated by the Stripe webhook on plan
// changes (Sub-Plan-B). Credit-quota fields are mirrored from tier-config so
// app-side gates don't have to round-trip Stripe.
import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { getCreditBalance } from "./credits.js";
import { creditsForIntensity, type Intensity } from "./intensity.js";
import { TIERS, type TierConfig, type TierId } from "./tiers.js";

export interface SubscriptionSnapshot {
  workspaceId: string;
  tier: TierId;
  status: string;
  config: TierConfig;
  creditsQuotaPerCycle: number;
  creditsUsedThisPeriod: number;
  creditsRemaining: number;
  prepaidRemaining: number;
  totalCreditsAvailable: number;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  byokEnabled: boolean;
  autoOverageEnabled: boolean;
  spendCapMicrocents: number | null;
  defaultIntensity: Intensity | null;
}

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  quota: number;
  reason?: string;
}

/**
 * Idempotent: concurrent inserts on a unique (workspace_id) hit the conflict
 * path and re-select. Free-tier defaults pulled from tier-config.
 */
export async function ensureSubscription(
  workspaceId: string,
): Promise<SubscriptionSnapshot> {
  const db = getDb();

  const existing = await db
    .select()
    .from(schema.subscription)
    .where(eq(schema.subscription.workspaceId, workspaceId))
    .limit(1);

  let row = existing[0];
  if (!row) {
    const inserted = await db
      .insert(schema.subscription)
      .values({
        workspaceId,
        tier: "free",
        status: "active",
        creditsQuotaPerCycle: TIERS.free.creditsPerCycle,
        creditsUsedThisPeriod: 0,
      })
      .onConflictDoNothing({ target: schema.subscription.workspaceId })
      .returning();
    row = inserted[0];
    if (!row) {
      const refetch = await db
        .select()
        .from(schema.subscription)
        .where(eq(schema.subscription.workspaceId, workspaceId))
        .limit(1);
      row = refetch[0];
    }
  }

  if (!row) {
    throw new Error("Failed to ensure subscription row for workspace.");
  }

  const tier =
    (row.tier as TierId) in TIERS ? (row.tier as TierId) : "free";
  const balance = await getCreditBalance(workspaceId, db);

  return {
    workspaceId,
    tier,
    status: row.status,
    config: TIERS[tier],
    creditsQuotaPerCycle: row.creditsQuotaPerCycle,
    creditsUsedThisPeriod: row.creditsUsedThisPeriod,
    creditsRemaining: balance.subscriptionRemaining,
    prepaidRemaining: balance.prepaidRemaining,
    totalCreditsAvailable: balance.total,
    currentPeriodEnd: row.currentPeriodEnd,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    byokEnabled: row.byokEnabled,
    autoOverageEnabled: row.autoOverageEnabled,
    spendCapMicrocents: row.spendCapMicrocents,
    defaultIntensity:
      row.defaultIntensity === "quick" || row.defaultIntensity === "deep"
        ? row.defaultIntensity
        : null,
  };
}

export function isPaid(snap: SubscriptionSnapshot): boolean {
  return snap.tier !== "free" && snap.status === "active";
}

/**
 * Counts repos (one row per audit target) inside a workspace. The legacy
 * `canAddRepo` semantics — repos owned across a user's workspaces — went
 * away with the user→workspace pivot; tier limits now bind per workspace.
 */
export async function countActiveRepos(workspaceId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ n: count() })
    .from(schema.repo)
    .where(eq(schema.repo.workspaceId, workspaceId));
  return Number(rows[0]?.n ?? 0);
}

export async function countActiveCustomers(
  workspaceId: string,
): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ n: count() })
    .from(schema.customer)
    .where(eq(schema.customer.workspaceId, workspaceId));
  return Number(rows[0]?.n ?? 0);
}

/**
 * Tier-gates the count of customer-workspaces a paid workspace can manage.
 * `free` covers 1 by default; `agency` covers 50. Sub-Plan-C uses this in
 * the customer-create form.
 */
export async function canAddCustomer(
  workspaceId: string,
): Promise<QuotaCheck> {
  const snap = await ensureSubscription(workspaceId);
  const used = await countActiveCustomers(workspaceId);
  const quota = snap.config.customerWorkspacesIncluded;
  if (used < quota) {
    return { allowed: true, used, quota };
  }
  return {
    allowed: false,
    used,
    quota,
    reason: `${snap.config.label} covers ${quota} customer workspace${quota === 1 ? "" : "s"}; you already have ${used}. Upgrade for more.`,
  };
}

/**
 * Pre-audit credit gate (was Dead-Code in the legacy stub — now live).
 * Mirrors `canConsume` but reads the snapshot so callers can keep the same
 * shape they used for `canAddRepo`.
 */
export function canRunAudit(
  snap: SubscriptionSnapshot,
  intensity: Intensity,
): QuotaCheck {
  const need = creditsForIntensity(intensity);
  const have = snap.totalCreditsAvailable;
  if (have >= need) {
    return { allowed: true, used: need, quota: have };
  }
  return {
    allowed: false,
    used: need,
    quota: have,
    reason: `${snap.config.label} has ${have} credit${have === 1 ? "" : "s"} left; ${intensity} audit needs ${need}.`,
  };
}
