-- Sub-Plan-A: SaaS-Pricing Redesign — workspace-level billing + AI metering.
-- Source: docs/plans/saas-pricing-sub-a-db-metering.md (Master: saas-pricing-redesign).
-- Pre-flight gate: scripts/check-billing-migration-safety.ts asserts no
-- live Stripe rows exist before this destructive subscription rewrite.
--
-- Hand-written because drizzle-kit could not disambiguate the
-- userId → workspaceId pivot non-interactively (TTY-only prompt).
-- Future `pnpm db:generate` runs will rebuild the snapshot.

--> statement-breakpoint
-- 1) subscription: pivot user-level → workspace-level + credit-system + BYOK.
DROP TABLE IF EXISTS "subscription" CASCADE;
--> statement-breakpoint
CREATE TABLE "subscription" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL UNIQUE REFERENCES "workspace"("id") ON DELETE CASCADE,
  "tier" varchar(20) NOT NULL DEFAULT 'free',
  "status" varchar(20) NOT NULL DEFAULT 'active',
  "stripe_customer_id" varchar(80),
  "stripe_subscription_id" varchar(80),
  "credits_quota_per_cycle" integer NOT NULL DEFAULT 3,
  "credits_used_this_period" integer NOT NULL DEFAULT 0,
  "byok_enabled" boolean NOT NULL DEFAULT false,
  "byok_provider" varchar(20),
  "byok_key_ciphertext" text,
  "byok_key_iv" text,
  "byok_key_auth_tag" text,
  "auto_overage_enabled" boolean NOT NULL DEFAULT false,
  "spend_cap_microcents" bigint,
  "default_intensity" varchar(10),
  "current_period_end" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

--> statement-breakpoint
-- 2) ai_usage_event: append-only token-usage log per LLM call.
CREATE TABLE "ai_usage_event" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "scan_id" uuid REFERENCES "scan"("id") ON DELETE SET NULL,
  "call_site_id" varchar(40) NOT NULL,
  "provider" varchar(20) NOT NULL,
  "model" varchar(60) NOT NULL,
  "input_tokens" integer NOT NULL DEFAULT 0,
  "output_tokens" integer NOT NULL DEFAULT 0,
  "cache_read_tokens" integer NOT NULL DEFAULT 0,
  "cache_write_tokens" integer NOT NULL DEFAULT 0,
  "cost_microcents" bigint NOT NULL DEFAULT 0,
  "byok_flag" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "ai_usage_event_workspace_created_idx" ON "ai_usage_event" ("workspace_id", "created_at");
--> statement-breakpoint
CREATE INDEX "ai_usage_event_scan_idx" ON "ai_usage_event" ("scan_id");

--> statement-breakpoint
-- 3) audit_run_cost: rollup of AI cost per scan, 1:1 with scan.
CREATE TABLE "audit_run_cost" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "scan_id" uuid NOT NULL UNIQUE REFERENCES "scan"("id") ON DELETE CASCADE,
  "workspace_id" uuid NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "intensity" varchar(10) NOT NULL,
  "credits_consumed" integer NOT NULL,
  "total_cost_microcents" bigint NOT NULL DEFAULT 0,
  "markup_microcents" bigint NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "audit_run_cost_workspace_created_idx" ON "audit_run_cost" ("workspace_id", "created_at");

--> statement-breakpoint
-- 4) credit_ledger: source-of-truth for credit balance. Append-only. Rows
-- carry the post-mutation balance for fast audit reads (no SUM over history).
CREATE TABLE "credit_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "delta" integer NOT NULL,
  "reason" varchar(30) NOT NULL,
  "reference_id" text,
  "balance_after" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "credit_ledger_workspace_created_idx" ON "credit_ledger" ("workspace_id", "created_at" DESC);

--> statement-breakpoint
-- 5) prepaid_credit_grant: Stripe Pre-Paid-Pack tracking, 12-month expiry.
CREATE TABLE "prepaid_credit_grant" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "stripe_invoice_id" varchar(80) NOT NULL UNIQUE,
  "credits_granted" integer NOT NULL,
  "credits_remaining" integer NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "prepaid_credit_grant_workspace_expires_idx" ON "prepaid_credit_grant" ("workspace_id", "expires_at");

--> statement-breakpoint
-- 6) scan: add per-audit intensity + cost-tracking fields.
ALTER TABLE "scan" ADD COLUMN "intensity" varchar(10) NOT NULL DEFAULT 'quick';
--> statement-breakpoint
ALTER TABLE "scan" ADD COLUMN "credits_consumed" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "scan" ADD COLUMN "total_cost_microcents" bigint NOT NULL DEFAULT 0;
