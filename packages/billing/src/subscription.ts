import { count, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { TIERS, type TierId, type TierConfig } from "./tiers.js";

export interface SubscriptionSnapshot {
  tier: TierId;
  status: string;
  config: TierConfig;
  paidReposQuota: number;
  runsQuota: number;
  runsUsedThisPeriod: number;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
}

/**
 * Returns the user's subscription, auto-inserting a free-tier row on first call.
 * Idempotent: concurrent inserts on a unique (user_id) hit the conflict path.
 */
export async function ensureSubscription(
  userId: string,
): Promise<SubscriptionSnapshot> {
  const db = getDb();

  const existing = await db
    .select()
    .from(schema.subscription)
    .where(eq(schema.subscription.userId, userId))
    .limit(1);

  let row = existing[0];
  if (!row) {
    const inserted = await db
      .insert(schema.subscription)
      .values({
        userId,
        tier: "free",
        status: "active",
        paidReposQuota: TIERS.free.paidReposQuota,
        runsQuota: TIERS.free.runsQuota,
        runsUsedThisPeriod: 0,
      })
      .onConflictDoNothing({ target: schema.subscription.userId })
      .returning();
    row = inserted[0];
    if (!row) {
      const refetch = await db
        .select()
        .from(schema.subscription)
        .where(eq(schema.subscription.userId, userId))
        .limit(1);
      row = refetch[0];
    }
  }

  if (!row) {
    throw new Error("Failed to ensure subscription row for user.");
  }

  const tier = (row.tier as TierId) in TIERS ? (row.tier as TierId) : "free";
  return {
    tier,
    status: row.status,
    config: TIERS[tier],
    paidReposQuota: row.paidReposQuota,
    runsQuota: row.runsQuota,
    runsUsedThisPeriod: row.runsUsedThisPeriod,
    currentPeriodEnd: row.currentPeriodEnd,
    stripeCustomerId: row.stripeCustomerId,
  };
}

export function isPaid(snap: SubscriptionSnapshot): boolean {
  return snap.tier !== "free" && snap.status === "active";
}

export async function countActiveRepos(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ n: count() })
    .from(schema.repo)
    .innerJoin(
      schema.workspace,
      eq(schema.repo.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, userId));
  return Number(rows[0]?.n ?? 0);
}

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  quota: number;
  reason?: string;
}

export async function canAddRepo(userId: string): Promise<QuotaCheck> {
  const snap = await ensureSubscription(userId);
  const used = await countActiveRepos(userId);
  if (used < snap.paidReposQuota) {
    return { allowed: true, used, quota: snap.paidReposQuota };
  }
  return {
    allowed: false,
    used,
    quota: snap.paidReposQuota,
    reason: `${snap.config.label} tier covers ${snap.paidReposQuota} repo${snap.paidReposQuota === 1 ? "" : "s"}; you already have ${used}.`,
  };
}

export function canRunAudit(snap: SubscriptionSnapshot): QuotaCheck {
  if (snap.runsUsedThisPeriod < snap.runsQuota) {
    return {
      allowed: true,
      used: snap.runsUsedThisPeriod,
      quota: snap.runsQuota,
    };
  }
  return {
    allowed: false,
    used: snap.runsUsedThisPeriod,
    quota: snap.runsQuota,
    reason: `${snap.config.label} tier covers ${snap.runsQuota} audits this period; you've used ${snap.runsUsedThisPeriod}.`,
  };
}
