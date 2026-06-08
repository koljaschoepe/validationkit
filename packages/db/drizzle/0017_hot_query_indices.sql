-- Bundle C (Launch-Verify): hot-query indices. Every workspace-scoped list did a
-- full table scan once a second workspace had data; Better-Auth also reads
-- session/account by user_id on every request. These cover the hot paths.
-- All IF NOT EXISTS so the migration is re-runnable.

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scan_workspace_created_idx" ON "scan" ("workspace_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scan_repo_idx" ON "scan" ("repo_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "repo_workspace_idx" ON "repo" ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_user_idx" ON "session" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_user_idx" ON "account" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "install_request_workspace_idx" ON "install_request" ("workspace_id", "requested_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_owner_idx" ON "workspace" ("owner_id");
