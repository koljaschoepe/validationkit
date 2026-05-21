-- Sub-Plan-B: stripe_meter_event_log — idempotency for Stripe Meter-Event
-- submission. The credit-aggregator Inngest cron submits batches of pending
-- overage rows; each row carries its own `identifier` (UUID) and we never
-- POST the same identifier twice. Stripe's API also dedupes server-side on
-- the same key, so this is belt-and-suspenders.

--> statement-breakpoint
CREATE TABLE "stripe_meter_event_log" (
  "identifier" varchar(80) PRIMARY KEY,
  "workspace_id" uuid NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "event_name" varchar(60) NOT NULL,
  "value" bigint NOT NULL,
  "stripe_customer_id" varchar(80) NOT NULL,
  "credit_ledger_id" uuid REFERENCES "credit_ledger"("id") ON DELETE SET NULL,
  "submitted_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "stripe_meter_event_log_workspace_idx" ON "stripe_meter_event_log" ("workspace_id", "submitted_at");
