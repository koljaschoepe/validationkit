-- Settings backend (nova-2-settings-backend): per-workspace notification
-- preferences. One row per (event, channel); a missing row means "use the
-- curated opt-out default" (lib/notification-prefs). Email is the only wired
-- channel for now. Hand-written + idempotent.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preference" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "event_id" varchar(40) NOT NULL,
  "channel" varchar(20) NOT NULL,
  "enabled" boolean NOT NULL DEFAULT false,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notification_preference_unique" ON "notification_preference" ("workspace_id", "event_id", "channel");
