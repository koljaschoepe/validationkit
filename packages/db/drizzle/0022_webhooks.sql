-- Settings backend (nova-2-settings-backend): outbound webhooks. Per-workspace
-- endpoints that receive Stripe-style signed POSTs (X-VK-Signature) for their
-- subscribed event types. The signing secret is stored plaintext (needed to
-- compute the HMAC per delivery). Hand-written + idempotent.

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspace"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "secret" varchar(80) NOT NULL,
  "events" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "enabled" boolean NOT NULL DEFAULT true,
  "last_status" varchar(40),
  "last_delivery_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_workspace_idx" ON "webhook" ("workspace_id");
