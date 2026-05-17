ALTER TABLE "scan" ALTER COLUMN "file_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "scan" ALTER COLUMN "overall_severity" SET DEFAULT 'Exceptional';--> statement-breakpoint
ALTER TABLE "scan" ALTER COLUMN "findings_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "scan" ALTER COLUMN "warnings_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "scan" ALTER COLUMN "raw_scan" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scan" ALTER COLUMN "raw_report" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "github_installation_id" integer;--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "github_full_name" varchar(300);--> statement-breakpoint
ALTER TABLE "scan" ADD COLUMN "status" varchar(20) DEFAULT 'complete' NOT NULL;--> statement-breakpoint
ALTER TABLE "scan" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "scan" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "scan" ADD COLUMN "completed_at" timestamp with time zone;