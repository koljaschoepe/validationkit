CREATE TABLE "event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" varchar(60) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "last_commit_sha" varchar(64);--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "last_polled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "canonical_repo_id" uuid;--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "notify_secret" varchar(64);--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_workspace_id_idx" ON "event" USING btree ("workspace_id","id");--> statement-breakpoint
ALTER TABLE "repo" ADD CONSTRAINT "repo_canonical_repo_id_repo_id_fk" FOREIGN KEY ("canonical_repo_id") REFERENCES "public"."repo"("id") ON DELETE set null ON UPDATE no action;