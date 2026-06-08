-- Bundle B (Launch-Verify): credit_ledger idempotency for the monthly grant.
-- The monthly allotment row carries reference_id = invoice.id. The stripe_event
-- PK is the primary replay guard; this partial unique index is a second layer so
-- a monthly_grant for a given (workspace, invoice) can never be double-written
-- even if two distinct events try to grant the same invoice.
--
-- Scoped to monthly_grant ONLY — audit_consume / overage rows legitimately share
-- a reference_id (the scan id, K-PAY2 writes both) and MUST NOT be deduped.

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_ledger_monthly_grant_idem_idx"
  ON "credit_ledger" ("workspace_id", "reason", "reference_id")
  WHERE "reason" = 'monthly_grant';
