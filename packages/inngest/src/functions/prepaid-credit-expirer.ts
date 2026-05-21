// Sub-Plan-B + V2 polish — daily cron that retires expired pre-paid credit
// grants AND emails a 1-day heads-up before retirement.
//
// Runs at 02:00 UTC. For every prepaid_credit_grant:
//   1. expires_at < now() AND credits_remaining > 0 → retire (ledger + zero out)
//   2. expires_at ∈ (now, now + 24h) AND credits_remaining > 0 AND no recent
//      "prepaid_pack_warning" event for the grant → send 1-day warning email
//
// State for "already-warned" lives in the workspace event table so we avoid
// a Migration for a single flag. Cron retries within 24h won't re-warn the
// same grant.
import * as React from "react";
import { and, between, eq, gt, gte, lt, sql } from "drizzle-orm";
import { getCreditBalance } from "@vk/billing";
import { type Db, getDb, schema } from "@vk/db";
import {
  PrepaidPackExpireWarning,
  sendTransactionalEmail,
} from "@vk/auth";
import { inngest } from "../client.js";

const BATCH_LIMIT = 200;
const WARNING_LOOKBACK_HOURS = 48;

interface ExpireResult {
  expired: number;
  creditsRetired: number;
  warned: number;
}

function billingUrlForWorkspace(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_BASE_URL ??
    "http://localhost:3000";
  return `${base}/${slug}/settings/billing`;
}

async function fetchWorkspaceContact(
  db: Db,
  workspaceId: string,
): Promise<{ email: string; workspaceName: string; slug: string } | null> {
  const rows = await db
    .select({
      email: schema.user.email,
      workspaceName: schema.workspace.name,
      slug: schema.workspace.slug,
    })
    .from(schema.workspace)
    .innerJoin(schema.user, eq(schema.workspace.ownerId, schema.user.id))
    .where(eq(schema.workspace.id, workspaceId))
    .limit(1);
  return rows[0] ?? null;
}

async function hasRecentWarning(
  db: Db,
  workspaceId: string,
  grantId: string,
): Promise<boolean> {
  const cutoff = new Date(Date.now() - WARNING_LOOKBACK_HOURS * 60 * 60 * 1000);
  const rows = await db.execute<{ count: number }>(sql`
    SELECT count(*)::int AS count
    FROM event
    WHERE workspace_id = ${workspaceId}
      AND type = 'prepaid_pack_warning'
      AND created_at > ${cutoff}
      AND payload ->> 'grantId' = ${grantId}
  `);
  return (rows[0]?.count ?? 0) > 0;
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

  // 1-day warning pass — find grants expiring in (now, now+24h] with credits left.
  const soonCutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const soonRows = await db
    .select()
    .from(schema.prepaidCreditGrant)
    .where(
      and(
        between(schema.prepaidCreditGrant.expiresAt, now, soonCutoff),
        gt(schema.prepaidCreditGrant.creditsRemaining, 0),
      ),
    )
    .limit(BATCH_LIMIT);

  let warned = 0;
  for (const row of soonRows) {
    if (await hasRecentWarning(db, row.workspaceId, row.id)) continue;
    const contact = await fetchWorkspaceContact(db, row.workspaceId);
    if (!contact) continue;
    const result = await sendTransactionalEmail({
      to: contact.email,
      subject: `${row.creditsRemaining} pre-paid credits expire tomorrow`,
      react: React.createElement(PrepaidPackExpireWarning, {
        workspaceName: contact.workspaceName,
        creditsRemaining: row.creditsRemaining,
        expiresAt: row.expiresAt,
        daysUntilExpiry: 1,
        billingUrl: billingUrlForWorkspace(contact.slug),
      }),
    });
    if (result.ok) {
      await db.insert(schema.event).values({
        workspaceId: row.workspaceId,
        type: "prepaid_pack_warning",
        payload: {
          grantId: row.id,
          daysUntilExpiry: 1,
          creditsRemaining: row.creditsRemaining,
        },
      });
      warned += 1;
    }
  }

  return { expired: dueRows.length, creditsRetired, warned };
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
void gte;
