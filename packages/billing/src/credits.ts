// Sub-Plan-A — credit ledger source-of-truth. Append-only ledger + denormalized
// balance_after for fast reads. All mutations go through `consumeCredits` /
// `grantCredits` to keep the invariant: latest credit_ledger row's
// balance_after == effective subscription balance.
//
// Race-safety: consume uses a SELECT ... FOR UPDATE on the subscription row,
// then INSERTs the ledger entry in the same transaction.
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { type Db, getDb, schema } from "@vk/db";
import { TIERS, type TierId } from "./tiers.js";

export type CreditReason =
  | "monthly_grant"
  | "audit_consume"
  | "overage"
  | "prepaid_grant"
  | "expiration"
  | "refund"
  | "manual_adjust";

export interface CreditBalance {
  /** Credits left from the current subscription cycle (free for `free` tier). */
  subscriptionRemaining: number;
  /** Credits available across unexpired prepaid packs. */
  prepaidRemaining: number;
  /** Sum of both — what the customer actually has to spend. */
  total: number;
}

export interface ConsumeResult {
  allowed: boolean;
  reason?: string;
  newSubscriptionUsed: number;
  newPrepaidRemaining: number;
}

export async function getCreditBalance(
  workspaceId: string,
  db: Db = getDb(),
): Promise<CreditBalance> {
  const subRow = (
    await db
      .select({
        creditsQuotaPerCycle: schema.subscription.creditsQuotaPerCycle,
        creditsUsedThisPeriod: schema.subscription.creditsUsedThisPeriod,
      })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, workspaceId))
      .limit(1)
  )[0];

  const subscriptionRemaining = subRow
    ? Math.max(0, subRow.creditsQuotaPerCycle - subRow.creditsUsedThisPeriod)
    : 0;

  const now = new Date();
  const prepaidRows = await db
    .select({ creditsRemaining: schema.prepaidCreditGrant.creditsRemaining })
    .from(schema.prepaidCreditGrant)
    .where(
      and(
        eq(schema.prepaidCreditGrant.workspaceId, workspaceId),
        gt(schema.prepaidCreditGrant.expiresAt, now),
      ),
    );

  const prepaidRemaining = prepaidRows.reduce(
    (sum, row) => sum + row.creditsRemaining,
    0,
  );

  return {
    subscriptionRemaining,
    prepaidRemaining,
    total: subscriptionRemaining + prepaidRemaining,
  };
}

export interface CanConsumeResult {
  allowed: boolean;
  reason?: string;
  balance: CreditBalance;
}

export async function canConsume(
  workspaceId: string,
  amount: number,
  options: { allowOverage?: boolean } = {},
  db: Db = getDb(),
): Promise<CanConsumeResult> {
  const balance = await getCreditBalance(workspaceId, db);
  if (balance.total >= amount) {
    return { allowed: true, balance };
  }
  if (options.allowOverage) {
    return { allowed: true, balance };
  }
  return {
    allowed: false,
    reason: `Need ${amount} credit${amount === 1 ? "" : "s"}, have ${balance.total}. Upgrade or buy a credit pack.`,
    balance,
  };
}

/**
 * Consume credits transactionally. Prepaid pool drains before subscription
 * credits (FIFO by expiry) so soonest-to-expire packs go first.
 *
 * Returns an `allowed: false` result without mutating if the workspace can't
 * cover the cost and `allowOverage` is false.
 */
export async function consumeCredits(args: {
  workspaceId: string;
  amount: number;
  reason: CreditReason;
  referenceId?: string;
  allowOverage?: boolean;
  db?: Db;
}): Promise<ConsumeResult> {
  const db = args.db ?? getDb();
  return db.transaction(async (tx) => {
    const subRows = await tx.execute<{
      credits_quota_per_cycle: number;
      credits_used_this_period: number;
    }>(
      sql`SELECT credits_quota_per_cycle, credits_used_this_period
          FROM subscription
          WHERE workspace_id = ${args.workspaceId}
          FOR UPDATE`,
    );
    const subRow = subRows[0];
    if (!subRow) {
      return {
        allowed: false,
        reason: "No subscription row — call ensureSubscription first.",
        newSubscriptionUsed: 0,
        newPrepaidRemaining: 0,
      };
    }
    const subscriptionRemaining = Math.max(
      0,
      subRow.credits_quota_per_cycle - subRow.credits_used_this_period,
    );

    const now = new Date();
    const prepaidRows = await tx
      .select()
      .from(schema.prepaidCreditGrant)
      .where(
        and(
          eq(schema.prepaidCreditGrant.workspaceId, args.workspaceId),
          gt(schema.prepaidCreditGrant.expiresAt, now),
        ),
      )
      .orderBy(schema.prepaidCreditGrant.expiresAt);

    const prepaidTotal = prepaidRows.reduce(
      (sum, row) => sum + row.creditsRemaining,
      0,
    );
    const totalAvailable = subscriptionRemaining + prepaidTotal;

    if (totalAvailable < args.amount && !args.allowOverage) {
      return {
        allowed: false,
        reason: `Insufficient credits. Need ${args.amount}, have ${totalAvailable}.`,
        newSubscriptionUsed: subRow.credits_used_this_period,
        newPrepaidRemaining: prepaidTotal,
      };
    }

    let remaining = args.amount;
    let updatedPrepaidTotal = prepaidTotal;

    for (const row of prepaidRows) {
      if (remaining <= 0) break;
      const take = Math.min(row.creditsRemaining, remaining);
      if (take > 0) {
        await tx
          .update(schema.prepaidCreditGrant)
          .set({ creditsRemaining: row.creditsRemaining - take })
          .where(eq(schema.prepaidCreditGrant.id, row.id));
        remaining -= take;
        updatedPrepaidTotal -= take;
      }
    }

    let newUsed = subRow.credits_used_this_period;
    if (remaining > 0) {
      newUsed = subRow.credits_used_this_period + remaining;
      await tx
        .update(schema.subscription)
        .set({ creditsUsedThisPeriod: newUsed, updatedAt: new Date() })
        .where(eq(schema.subscription.workspaceId, args.workspaceId));
    }

    const newSubscriptionRemaining = Math.max(
      0,
      subRow.credits_quota_per_cycle - newUsed,
    );
    const balanceAfter = newSubscriptionRemaining + updatedPrepaidTotal;

    await tx.insert(schema.creditLedger).values({
      workspaceId: args.workspaceId,
      delta: -args.amount,
      reason: args.reason,
      referenceId: args.referenceId ?? null,
      balanceAfter,
    });

    // K-PAY2 (Launch-Verify): when the spend exceeded the available pool and
    // overage was allowed, emit a SEPARATE reason='overage' ledger row whose
    // |delta| is the metered quantity (= the portion over balance). The
    // credit-aggregator cron / invoice.created flush pick these up (WHERE
    // reason='overage' + no stripe_meter_event_log on the row id) and report
    // |delta| units to the Stripe meter. Without this row the entire
    // overage → meter → invoice pipeline is dead code. The row is a metering
    // marker only — balanceAfter carries the real (already-0) balance so the
    // denormalized-balance invariant holds.
    const overageQty = Math.max(0, args.amount - totalAvailable);
    if (overageQty > 0) {
      await tx.insert(schema.creditLedger).values({
        workspaceId: args.workspaceId,
        delta: -overageQty,
        reason: "overage",
        referenceId: args.referenceId ?? null,
        balanceAfter,
      });
    }

    return {
      allowed: true,
      newSubscriptionUsed: newUsed,
      newPrepaidRemaining: updatedPrepaidTotal,
    };
  });
}

/**
 * Grant credits (monthly reset, refund, prepaid pack). For prepaid_grant
 * callers should additionally create the prepaid_credit_grant row out-of-band
 * (Sub-Plan-B does that in the Stripe webhook).
 */
export async function grantCredits(args: {
  workspaceId: string;
  amount: number;
  reason: CreditReason;
  referenceId?: string;
  db?: Db;
}): Promise<{ balanceAfter: number }> {
  const db = args.db ?? getDb();
  return db.transaction(async (tx) => {
    if (args.reason === "monthly_grant") {
      await tx
        .update(schema.subscription)
        .set({ creditsUsedThisPeriod: 0, updatedAt: new Date() })
        .where(eq(schema.subscription.workspaceId, args.workspaceId));
    }
    const balance = await getCreditBalance(args.workspaceId, tx as unknown as Db);
    // Bundle B: replay-safe via the partial unique index on
    // (workspace_id, reason, reference_id) WHERE reason='monthly_grant'. A
    // duplicate monthly grant for the same invoice is a no-op at the ledger
    // level (second line of defense behind the stripe_event PK). Bare DO NOTHING
    // only fires for monthly_grant — no other reason has a unique constraint.
    await tx
      .insert(schema.creditLedger)
      .values({
        workspaceId: args.workspaceId,
        delta: args.amount,
        reason: args.reason,
        referenceId: args.referenceId ?? null,
        balanceAfter: balance.total,
      })
      .onConflictDoNothing();
    return { balanceAfter: balance.total };
  });
}

/** Resets the per-cycle counter — called by Stripe webhook on `invoice.paid`. */
export async function resetCycleQuota(
  workspaceId: string,
  newQuota: number,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(schema.subscription)
    .set({
      creditsUsedThisPeriod: 0,
      creditsQuotaPerCycle: newQuota,
      updatedAt: new Date(),
    })
    .where(eq(schema.subscription.workspaceId, workspaceId));

  const balance = await getCreditBalance(workspaceId, db);
  await db.insert(schema.creditLedger).values({
    workspaceId,
    delta: newQuota,
    reason: "monthly_grant",
    balanceAfter: balance.total,
  });
}

export async function latestLedgerEntry(
  workspaceId: string,
  db: Db = getDb(),
): Promise<{ balanceAfter: number; createdAt: Date } | null> {
  const rows = await db
    .select({
      balanceAfter: schema.creditLedger.balanceAfter,
      createdAt: schema.creditLedger.createdAt,
    })
    .from(schema.creditLedger)
    .where(eq(schema.creditLedger.workspaceId, workspaceId))
    .orderBy(desc(schema.creditLedger.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Reads the configured-tier credit quota — used by ensureSubscription. */
export function defaultQuotaForTier(tier: TierId): number {
  return TIERS[tier].creditsPerCycle;
}
