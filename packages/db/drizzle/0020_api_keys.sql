-- Settings backend (nova-2-settings-backend): API keys for programmatic,
-- read-only access to a workspace's scans + findings. Reveal-once tokens —
-- only the SHA-256 hash is stored; token_prefix + last4 are display-only.
-- Workspace-scoped, full-access (no granular scopes in the MVP). Hand-written
-- (snapshot drift since 0015); idempotent so a re-run can't fail a deploy.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_key" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "token_prefix" varchar(16) NOT NULL,
  "last4" varchar(4) NOT NULL,
  "created_by_user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_key_workspace_idx" ON "api_key" ("workspace_id");
