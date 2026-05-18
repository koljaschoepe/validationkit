CREATE TABLE "dpa_acceptance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"dpa_version" varchar(20) NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
ALTER TABLE "dpa_acceptance" ADD CONSTRAINT "dpa_acceptance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dpa_acceptance_user_version_unique" ON "dpa_acceptance" USING btree ("user_id","dpa_version");