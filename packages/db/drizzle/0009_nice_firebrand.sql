CREATE TABLE "solution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"finding_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"patch" text,
	"rationale" text,
	"confidence" varchar(10),
	"deterministic" boolean,
	"files_touched" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generator_version" varchar(40),
	"failure_reason" text,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "solution_finding_id_unique" UNIQUE("finding_id")
);
--> statement-breakpoint
ALTER TABLE "solution" ADD CONSTRAINT "solution_finding_id_finding_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."finding"("id") ON DELETE cascade ON UPDATE no action;