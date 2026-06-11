-- 0019: second-opinion-audit fixes (S3-01 + S2-01). Hand-written + additive
-- (drizzle-kit generate is blocked by the pre-existing snapshot drift, see
-- 0015 header note). Idempotent: safe to run multiple times / in parallel
-- with the Vercel buildCommand migration step.

-- S3-01: webhook events get a processing state so a transient handler
-- failure can be re-processed by Stripe's retry instead of being swallowed
-- as a duplicate. Default 'processed' = pre-existing rows count as done.
ALTER TABLE "stripe_event"
  ADD COLUMN IF NOT EXISTS "status" varchar(12) NOT NULL DEFAULT 'processed';

-- S2-01: persist the billing cycle so annual subscriptions get their full
-- year credit allotment up-front (invoice.paid fires once per year).
ALTER TABLE "subscription"
  ADD COLUMN IF NOT EXISTS "billing_cycle" varchar(10) NOT NULL DEFAULT 'monthly';
