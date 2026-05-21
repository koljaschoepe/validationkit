// Sub-Plan-B — Stripe Meter-Event submission wrapper.
//
// Two safety layers:
//   1. Each call sends an `identifier` (UUID) to Stripe — Stripe dedupes
//      server-side. Replays of the same identifier are no-ops on Stripe.
//   2. We persist `stripe_meter_event_log` rows pre-submission. If a row
//      already exists for this identifier, we skip the POST. This shields
//      us from accidental double-flushes within the same Inngest run.
//
// Sub-Plan-A's credit_ledger is the source of truth for *what* needs flushing.
// This wrapper is the bridge: ledger row → meter event → Stripe + log row.
import { eq } from "drizzle-orm";
import { type Db, getDb, schema } from "@vk/db";
import { getStripe, meterEventName, type MeterKind } from "./stripe";

export interface MeterEventInput {
  kind: MeterKind;
  workspaceId: string;
  stripeCustomerId: string;
  /** Credits for `overage`; microcents for `ai_markup`. Integer required. */
  value: number;
  /** Stable per-row dedupe key. Use the credit_ledger.id when applicable. */
  identifier: string;
  /** Optional FK so audit-trail can correlate Stripe events back to the ledger. */
  creditLedgerId?: string;
}

export interface MeterEventResult {
  submitted: boolean;
  skipReason?: "already_logged" | "zero_value";
}

export async function submitMeterEvent(
  input: MeterEventInput,
  db: Db = getDb(),
): Promise<MeterEventResult> {
  if (input.value <= 0) {
    return { submitted: false, skipReason: "zero_value" };
  }

  // Pre-flight idempotency — does our log already carry this identifier?
  const prior = await db
    .select({ identifier: schema.stripeMeterEventLog.identifier })
    .from(schema.stripeMeterEventLog)
    .where(eq(schema.stripeMeterEventLog.identifier, input.identifier))
    .limit(1);
  if (prior[0]) {
    return { submitted: false, skipReason: "already_logged" };
  }

  const stripe = getStripe();
  const eventName = meterEventName(input.kind);

  await stripe.billing.meterEvents.create({
    event_name: eventName,
    identifier: input.identifier,
    timestamp: Math.floor(Date.now() / 1000),
    payload: {
      value: String(input.value),
      stripe_customer_id: input.stripeCustomerId,
    },
  });

  await db.insert(schema.stripeMeterEventLog).values({
    identifier: input.identifier,
    workspaceId: input.workspaceId,
    eventName,
    value: input.value,
    stripeCustomerId: input.stripeCustomerId,
    creditLedgerId: input.creditLedgerId ?? null,
  });

  return { submitted: true };
}
