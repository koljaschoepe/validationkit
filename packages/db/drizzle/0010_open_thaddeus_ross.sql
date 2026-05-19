CREATE TABLE "apply_action" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"solution_id" uuid,
	"finding_id" uuid NOT NULL,
	"repo_id" uuid,
	"workspace_id" uuid NOT NULL,
	"mode" varchar(20) NOT NULL,
	"decision" varchar(20) NOT NULL,
	"reason" text,
	"target_url" text,
	"target_ref" varchar(200),
	"target_sha" varchar(80),
	"target_status" varchar(20),
	"snooze_until" timestamp with time zone,
	"decided_by" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finding" ADD COLUMN "dismiss_status" varchar(20) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "finding" ADD COLUMN "dismiss_reason" varchar(40);--> statement-breakpoint
ALTER TABLE "finding" ADD COLUMN "snoozed_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "apply_action" ADD CONSTRAINT "apply_action_solution_id_solution_id_fk" FOREIGN KEY ("solution_id") REFERENCES "public"."solution"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apply_action" ADD CONSTRAINT "apply_action_finding_id_finding_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."finding"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apply_action" ADD CONSTRAINT "apply_action_repo_id_repo_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apply_action" ADD CONSTRAINT "apply_action_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apply_action" ADD CONSTRAINT "apply_action_decided_by_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finding_scan_dismiss_idx" ON "finding" USING btree ("scan_id","dismiss_status");