CREATE TABLE "install_decision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"install_request_id" uuid NOT NULL,
	"decider_id" text NOT NULL,
	"decision" varchar(20) NOT NULL,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" text,
	"invited_email" varchar(320),
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"invited_by_id" text,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "install_decision" ADD CONSTRAINT "install_decision_install_request_id_install_request_id_fk" FOREIGN KEY ("install_request_id") REFERENCES "public"."install_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_decision" ADD CONSTRAINT "install_decision_decider_id_user_id_fk" FOREIGN KEY ("decider_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_workspace_user_unique" ON "membership" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "membership_workspace_email_idx" ON "membership" USING btree ("workspace_id","invited_email");--> statement-breakpoint
-- Backfill: every existing workspace gets an owner-membership row pointing
-- at workspace.owner_id. Idempotent via the unique (workspace_id, user_id)
-- index.
INSERT INTO "membership" ("workspace_id", "user_id", "role", "status", "accepted_at")
SELECT "id", "owner_id", 'owner', 'active', now()
FROM "workspace"
ON CONFLICT ("workspace_id", "user_id") DO NOTHING;