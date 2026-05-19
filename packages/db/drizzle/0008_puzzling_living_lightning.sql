CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"default_apply_mode" varchar(20) DEFAULT 'pr' NOT NULL,
	"github_org" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "repo" ADD COLUMN "apply_mode" varchar(20) DEFAULT 'pr' NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_workspace_slug_unique" ON "customer" USING btree ("workspace_id","slug");--> statement-breakpoint
CREATE INDEX "customer_workspace_idx" ON "customer" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "repo" ADD CONSTRAINT "repo_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finding_scan_severity_idx" ON "finding" USING btree ("scan_id","severity");--> statement-breakpoint
CREATE INDEX "repo_customer_idx" ON "repo" USING btree ("customer_id");--> statement-breakpoint
-- Sprint G2 backfill — 1 customer per distinct (workspace_id, label) in repo.
-- Slug normalization: lowercase, replace non-alphanumeric runs with '-', trim leading/trailing '-'.
-- Edge cases: empty/whitespace labels are skipped; slug collisions across different labels
-- (e.g. "Acme" vs "ACME!" both map to "acme") are resolved by DISTINCT ON (workspace_id, slug).
WITH unique_labels AS (
  SELECT DISTINCT ON (workspace_id, btrim(regexp_replace(lower(label), '[^a-z0-9]+', '-', 'g'), '-'))
    workspace_id,
    label,
    btrim(regexp_replace(lower(label), '[^a-z0-9]+', '-', 'g'), '-') AS slug
  FROM repo
  WHERE label IS NOT NULL AND btrim(label) != ''
),
new_customers AS (
  INSERT INTO customer (id, workspace_id, slug, label)
  SELECT gen_random_uuid(), workspace_id, slug, label
  FROM unique_labels
  WHERE slug != ''
  RETURNING id, workspace_id, slug
)
UPDATE repo r
SET customer_id = nc.id
FROM new_customers nc
WHERE r.workspace_id = nc.workspace_id
  AND btrim(regexp_replace(lower(r.label), '[^a-z0-9]+', '-', 'g'), '-') = nc.slug;
