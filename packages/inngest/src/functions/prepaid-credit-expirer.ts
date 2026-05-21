// Sub-Plan-B — daily cron that retires expired pre-paid credit grants.
//
// Runs at 02:00 UTC. For every prepaid_credit_grant where expires_at < now()
// and credits_remaining > 0, we:
//   1. INSERT a credit_ledger row (delta = -remaining, reason='expiration')
//   2. UPDATE the grant row to credits_remaining = 0
//
// Both steps happen in a transaction so the ledger never disagrees with the
// remaining balance. Sub-Plan-C will wire the React-Email expire-warning
// notifications (30d / 7d / 1d before expiry) on top of this job.
import { and, eq, gt, lt } from "drizzle-orm";
import { getCreditBalance } from "@vk/billing";
import { type Db, getDb, schema } from "@vk/db";
import { inngest } from "../client.js";

const BATCH_LIMIT = 200;

interface ExpireResult {
  expired: number;
  creditsRetired: number;
}

async function expireOnce(db: Db = getDb()): Promise<ExpireResult> {
  const now = new Date();
  const dueRows = await db
    .select()
    .from(schema.prepaidCreditGrant)
    .where(
      and(
        lt(schema.prepaidCreditGrant.expiresAt, now),
        gt(schema.prepaidCreditGrant.creditsRemaining, 0),
      ),
    )
    .limit(BATCH_LIMIT);

  let creditsRetired = 0;
  for (const row of dueRows) {
    await db.transaction(async (tx) => {
      const remaining = row.creditsRemaining;
      if (remaining <= 0) return;
      await tx
        .update(schema.prepaidCreditGrant)
        .set({ creditsRemaining: 0 })
        .where(eq(schema.prepaidCreditGrant.id, row.id));
      const balance = await getCreditBalance(row.workspaceId, tx as unknown as Db);
      await tx.insert(schema.creditLedger).values({
        workspaceId: row.workspaceId,
        delta: -remaining,
        reason: "expiration",
        referenceId: row.id,
        balanceAfter: balance.total,
      });
      creditsRetired += remaining;
    });
  }

  return { expired: dueRows.length, creditsRetired };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prepaidCreditExpirer: any = inngest.createFunction(
  {
    id: "prepaid-credit-expirer",
    triggers: [{ cron: "0 2 * * *" }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: any) => {
    return await step.run("expire-prepaid", () => expireOnce());
  },
);

export { expireOnce as expirePrepaidCreditsOnce };
