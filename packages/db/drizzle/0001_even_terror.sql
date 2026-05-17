CREATE TABLE "drift_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"root_path_a" text NOT NULL,
	"root_path_b" text NOT NULL,
	"items_count" integer NOT NULL,
	"overall_severity" varchar(20) NOT NULL,
	"raw_drift" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "install_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"requester_id" text NOT NULL,
	"target_repo_label" varchar(200) NOT NULL,
	"target_root_path" text NOT NULL,
	"requested_scope" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approver_id" text,
	"decided_at" timestamp with time zone,
	"decision_note" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "write_access_granted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "write_approved_by" text;--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "write_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "drift_run" ADD CONSTRAINT "drift_run_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_request" ADD CONSTRAINT "install_request_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_request" ADD CONSTRAINT "install_request_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "install_request" ADD CONSTRAINT "install_request_approver_id_user_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repo" ADD CONSTRAINT "repo_write_approved_by_user_id_fk" FOREIGN KEY ("write_approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;