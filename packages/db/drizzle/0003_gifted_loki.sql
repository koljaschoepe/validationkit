CREATE TABLE "webhook_event" (
	"delivery_id" text PRIMARY KEY NOT NULL,
	"event_name" varchar(60) NOT NULL,
	"action" varchar(60),
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'processed' NOT NULL,
	"failure_reason" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
