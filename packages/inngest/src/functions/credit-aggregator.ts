// Sub-Plan-B — Credit-Aggregator Inngest cron.
//
// Every 5 minutes: find credit_ledger rows with reason='overage' that have
// no matching stripe_meter_event_log entry, group by workspace, and submit
// one meter event per row. Each row's primary key is the dedupe identifier
// — Stripe and stripe_meter_event_log both reject re-submissions.
//
// Performance budget: aim for < 2s per batch of 100 rows. If a sustained
// spike exceeds 1000 events/sec we migrate to the v2 Meter-Event-Stream API
// (out-of-scope for Sub-B per Master §11).
import { and, eq, isNull, sql } from "drizzle-orm";
import Stripe from "stripe";
import { getDb, schema } from "@vk/db";
import { inngest } from "../client.js";

const BATCH_LIMIT = 100;

function loadStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
    appInfo: { name: "ValidationKit credit-aggregator", version: "0.0.20" },
  });
}

interface PendingRow {
  ledgerId: string;
  workspaceId: string;
  delta: number;
  stripeCustomerId: string | null;
}

async function fetchPending(): Promise<PendingRow[]> {
  const db = getDb();
  // Pending = overage ledger rows WITHOUT a meter-event-log entry on
  // (identifier = credit_ledger.id). We use a LEFT JOIN + IS NULL to drive
  // the gap-fill semantic; LIMIT bounds the per-tick work.
  const rows = await db.execute<{
    ledger_id: string;
    workspace_id: string;
    delta: number;
    stripe_customer_id: string | null;
  }>(sql`
    SELECT
      cl.id           AS ledger_id,
      cl.workspace_id AS workspace_id,
      cl.delta        AS delta,
      sub.stripe_customer_id AS stripe_customer_id
    FROM credit_ledger AS cl
    LEFT JOIN stripe_meter_event_log AS log
      ON log.identifier = cl.id::text
    LEFT JOIN subscription AS sub
      ON sub.workspace_id = cl.workspace_id
    WHERE cl.reason = 'overage'
      AND log.identifier IS NULL
    ORDER BY cl.created_at
    LIMIT ${BATCH_LIMIT}
  `);
  return rows.map((r) => ({
    ledgerId: r.ledger_id,
    workspaceId: r.workspace_id,
    delta: r.delta,
    stripeCustomerId: r.stripe_customer_id,
  }));
}

async function submitRow(stripe: Stripe, row: PendingRow): Promise<boolean> {
  if (!row.stripeCustomerId) return false; // No Stripe customer = no metered billing.
  // Overage rows in credit_ledger are stored as a *negative* delta
  // (consumeCredits writes delta=-amount). The meter wants positive units.
  const value = Math.abs(row.delta);
  if (value <= 0) return false;

  await stripe.billing.meterEvents.create({
    event_name: "audit_credit_overage",
    identifier: row.ledgerId,
    timestamp: Math.floor(Date.now() / 1000),
    payload: {
      value: String(value),
      stripe_customer_id: row.stripeCustomerId,
    },
  });

  const db = getDb();
  await db
    .insert(schema.stripeMeterEventLog)
    .values({
      identifier: row.ledgerId,
      workspaceId: row.workspaceId,
      eventName: "audit_credit_overage",
      value,
      stripeCustomerId: row.stripeCustomerId,
      creditLedgerId: row.ledgerId,
    })
    .onConflictDoNothing({
      target: schema.stripeMeterEventLog.identifier,
    });
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const creditAggregator: any = inngest.createFunction(
  {
    id: "credit-aggregator",
    triggers: [{ cron: "*/5 * * * *" }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: any) => {
    const stripe = loadStripe();
    if (!stripe) return { ok: false, skipped: "no STRIPE_SECRET_KEY" };

    const pending = await step.run("fetch-pending", () => fetchPending());
    if (pending.length === 0) {
      return { ok: true, submitted: 0 };
    }

    let submitted = 0;
    for (const row of pending) {
      const ok = await step.run(`submit-${row.ledgerId}`, () =>
        submitRow(stripe, row),
      );
      if (ok) submitted += 1;
    }
    return { ok: true, submitted, pending: pending.length };
  },
);

/**
 * Flush hook for the `invoice.created` webhook. Stripe gives us a 10s budget
 * per webhook and waits up to 72h before retrying the invoice if we 5xx —
 * which would block the invoice from finalizing. So instead of returning a
 * 202 and queueing into Inngest, we run a synchronous flush here and only
 * 200 back to Stripe once meter events are accepted.
 */
export async function flushPendingForCustomer(args: {
  stripeCustomerId: string;
}): Promise<{ submitted: number; pending: number }> {
  const stripe = loadStripe();
  if (!stripe) return { submitted: 0, pending: 0 };
  const db = getDb();
  const rows = await db.execute<{
    ledger_id: string;
    workspace_id: string;
    delta: number;
  }>(sql`
    SELECT cl.id AS ledger_id, cl.workspace_id, cl.delta
    FROM credit_ledger AS cl
    JOIN subscription AS sub ON sub.workspace_id = cl.workspace_id
    LEFT JOIN stripe_meter_event_log AS log ON log.identifier = cl.id::text
    WHERE cl.reason = 'overage'
      AND log.identifier IS NULL
      AND sub.stripe_customer_id = ${args.stripeCustomerId}
    ORDER BY cl.created_at
    LIMIT ${BATCH_LIMIT}
  `);
  let submitted = 0;
  for (const r of rows) {
    const ok = await submitRow(stripe, {
      ledgerId: r.ledger_id,
      workspaceId: r.workspace_id,
      delta: r.delta,
      stripeCustomerId: args.stripeCustomerId,
    });
    if (ok) submitted += 1;
  }
  return { submitted, pending: rows.length };
}

void and;
void eq;
void isNull;
