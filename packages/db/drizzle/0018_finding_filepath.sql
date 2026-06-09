-- Galaxie-Redesign Phase A (Data-Foundation): give findings a real file path +
-- kind so the Workspace galaxy can render honest folders/files instead of prose
-- titles (the previous FileNode.path = finding.title was the data-model lie).
-- Both columns nullable + additive — no breaking change.
--   * file_path is backfilled from the first citation's path.
--   * file_kind populates on new writes only (classifyPath is TS logic in
--     @vk/parser, not expressible in SQL) — stays NULL for legacy rows.
-- Re-runnable: ADD COLUMN IF NOT EXISTS + idempotent backfill (WHERE file_path IS NULL).

--> statement-breakpoint
ALTER TABLE "finding" ADD COLUMN IF NOT EXISTS "file_path" text;
--> statement-breakpoint
ALTER TABLE "finding" ADD COLUMN IF NOT EXISTS "file_kind" text;
--> statement-breakpoint
UPDATE "finding"
  SET "file_path" = "citations"->0->>'path'
  WHERE "file_path" IS NULL
    AND jsonb_typeof("citations") = 'array'
    AND jsonb_array_length("citations") > 0
    AND "citations"->0->>'path' IS NOT NULL;
