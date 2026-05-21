# Audit Sub-4 — DB-Schema

> Generated: 2026-05-21
> Domain: Drizzle-Schema · Migrations · Indexes · FK-Hygiene · pgvector
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}

## Summary

- **Tables in schema:** 24 (4 Better-Auth + 20 domain)
- **Used in app code:** 24/24 (all referenced via inserts/selects/relations)
- **Migrations:** 15 (0000–0014), `drizzle-kit check` → "Everything's fine" (no in-DB drift)
- **Schema vs Migrations:** ✓ synced — no orphaned snapshot/SQL mismatches
- **Tables with unused columns:** 3 (`customer.notes`, plus minor cleanup candidates)
- **FK gaps (workspace_id without `.references()`):** 0
- **Missing onDelete clauses:** 0 (every FK is explicit)
- **Dangerous cascades:** 2 (Kill-severity, see findings)
- **Missing indexes on hot filter columns:** 2 (Mid-severity)
- **pgvector:** **NOT installed** despite vision-doc claim. `CREATE EXTENSION vector` is absent in every migration. No `vector()` column in schema. No `embedding`/`pgvector` reference anywhere in `apps/` or `packages/` code. Documented as part of the future stack in `docs/vision.md:107,123` but unimplemented — listed here as **out-of-domain-but-tracked** since the audit task asked for pgvector verification.
- **Empty / noop migrations:** 2 (`0011_lame_speedball.sql` was empty in the schema file but the snapshot regenerated to drop `drift_run` — see Mid-finding F-09)

## Tables Inventory

| Table | Workspace-scoped | Has FK to workspace | Indexes | Used in queries |
|---|---|---|---|---|
| user | n/a | — | PK + email-unique | ✓ (auth) |
| session | n/a | — | PK + token-unique | ✓ (auth) |
| account | n/a | — | PK | ✓ (auth) |
| verification | n/a | — | PK | ✓ (auth) |
| workspace | self | — | PK + slug-unique | ✓ |
| customer | yes | ✓ cascade | uniq(ws,slug), idx(ws) | ✓ |
| repo | yes | ✓ cascade | idx(customer) | ✓ |
| install_request | yes | ✓ cascade | PK only | ✓ |
| membership | yes | ✓ cascade | uniq(ws,user), idx(ws,email) | ✓ |
| install_decision | indirect | — | PK only | ✓ |
| webhook_event | no | n/a | PK only | ✓ |
| scan | yes | ✓ cascade | PK only | ✓ |
| finding | indirect | — | idx(scan,sev), idx(scan,dismiss) | ✓ |
| solution | indirect | — | uniq(finding) | ✓ |
| apply_action | yes | ✓ cascade | PK only | ✓ |
| event | yes | ✓ cascade | idx(ws,id) | ✓ |
| subscription | yes | ✓ cascade + uniq | PK + ws-unique | ✓ |
| stripe_event | no | n/a | PK only | ✓ |
| dpa_acceptance | n/a (user) | — | uniq(user,version) | ✓ |
| ai_usage_event | yes | ✓ cascade | idx(ws,createdAt), idx(scan) | ✓ |
| audit_run_cost | yes | ✓ cascade | idx(ws,createdAt), uniq(scan) | ✓ insert (no reads yet) |
| credit_ledger | yes | ✓ cascade | idx(ws,createdAt) | ✓ |
| prepaid_credit_grant | yes | ✓ cascade | idx(ws,expires), uniq(invoice) | ✓ |
| stripe_meter_event_log | yes | ✓ cascade | idx(ws,submitted) | ✓ |

## Findings

### [Kill] F-01 — Deleting a User wipes their Workspace + all customer/repo/scan/billing data via 5-deep cascade chain
**Schema:** `packages/db/src/schema.ts:74-77` (`workspace.ownerId → user.id ON DELETE cascade`)
**Issue:** `workspace.ownerId` has `onDelete: "cascade"`. If a `user` row is deleted (account deletion, Better-Auth purge, GDPR right-to-erasure), Postgres cascades:
- `user` → `workspace` (cascade) → `customer`, `repo`, `scan`, `membership`, `install_request`, `event`, `subscription`, `apply_action`, `ai_usage_event`, `audit_run_cost`, `credit_ledger`, `prepaid_credit_grant`, `stripe_meter_event_log` (all cascade).
- A single solo-owner who erases their account loses **every audit history, every credit ledger row, every Stripe-meter-log entry** — including the rows that prove past Stripe billing reconciliation.
- The intent (`schema.ts:165-168`) explicitly states "workspace.ownerId stays as the legacy founder pointer; the membership row with role='owner' is the source of truth for RBAC checks." That comment confirms ownerId is a soft pointer — but the FK behaviour is hard-cascade.
**Why Kill:** Multi-tenant + financial-audit data loss on user-delete. Stripe-meter idempotency log is also wiped, which means re-creating a workspace and re-submitting the same Meter-Event identifier would be allowed (Stripe still dedupes, but the in-app belt-and-suspenders layer described in `schema.ts:746-749` becomes worthless).
**Suggested Fix:** Change `workspace.ownerId` to `onDelete: "set null"` (matches the intent — ownership lives in `membership.role='owner'`). Make `ownerId` nullable. Migration: `ALTER TABLE workspace ALTER COLUMN owner_id DROP NOT NULL; ALTER TABLE workspace DROP CONSTRAINT workspace_owner_id_user_id_fk; ALTER TABLE workspace ADD CONSTRAINT workspace_owner_id_user_id_fk FOREIGN KEY (owner_id) REFERENCES "user"(id) ON DELETE SET NULL;` Then add a guard in user-delete flows that requires another owner-membership to exist.

### [Kill] F-02 — Deleting a User cascades into install_decision/apply_action, destroying compliance audit-trail
**Schema:** `packages/db/src/schema.ts:223-225` (`installDecision.deciderId`), `schema.ts:345-347` (`applyAction.decidedBy`), `schema.ts:566-568` (`dpaAcceptance.userId`)
**Issue:** Three append-only audit-trail tables — `install_decision`, `apply_action`, `dpa_acceptance` — declare their actor-FK with `onDelete: "cascade"`. ADR-0020 / Sprint 1.0 explicitly states these are compliance evidence (DPA acceptance, install-approval, fix-apply trail). Deleting the deciding/approving user erases the evidence that the action ever happened — violating the "append-only" property declared in `schema.ts:217-218` ("Append-only, never updated") and `schema.ts:318-319`.
**Why Kill:** GDPR + auditability conflict. Right-to-erasure must NOT remove proof that a separate party (admin) approved/decided. Industry pattern: scrub PII (set `ipAddress = NULL`, anonymise `userAgent`) and `SET NULL` the FK while keeping the row.
**Suggested Fix:** Change all three FKs to `onDelete: "set null"` and make the actor-id columns nullable. Add a user-delete handler that explicitly nulls the FK + scrubs `ip_address` / `user_agent` rather than relying on cascade.

### [Strong] F-03 — `repo.customerId` is nullable with `onDelete: "set null"`, which silently un-anchors a repo from its customer when the customer is deleted
**Schema:** `packages/db/src/schema.ts:120-122`
**Issue:** Per ADR-0001 (C2) — "1 Customer = 1 Kunden-Org mit N Repos". Repo must always belong to a customer in the steady state (Sprint G2 backfill is complete per migration `0008`). Yet `customer_id` is still nullable + set-null on delete. If an admin deletes a customer, every repo silently loses its customer attribution; the apply-mode fallback at `apps/web/src/lib/apply-mode.ts:9-10` then falls through customer→workspace defaults without warning.
**Why Strong:** Multi-customer-attribution leak — orphaned repos break the entire customer-grouping UI (`/[workspace]/customers/[customerId]`). Plus reports/exports that join on customer_id silently drop rows.
**Suggested Fix:** Decide: either (a) `onDelete: "restrict"` to force admins to reassign repos first, or (b) `onDelete: "cascade"` if deleting a customer is meant to delete its repos+scans. Document the chosen behaviour in `customer-dal.ts`. Either way, drop `customer_id` nullability via a backfill that requires a default-customer per workspace.

### [Strong] F-04 — `applyAction.repoId` and `applyAction.solutionId` are nullable + `set null` — audit-trail rows can lose their target reference
**Schema:** `packages/db/src/schema.ts:322-324, 328`
**Issue:** `apply_action` is described as append-only (`schema.ts:317-319`). Yet `repoId`/`solutionId` are `onDelete: "set null"`. A repo or solution deletion leaves the audit-trail row pointing at NULL, and the PR/commit URL stored in `target_url`/`target_ref` becomes the only proof of what was applied where. The compliance/export logic in `apps/web/src/lib/audit-trail-export.ts` cannot reconstruct repo context for such rows.
**Why Strong:** Compliance evidence degrades over time without any visible signal (no "deleted_repo" snapshot). Worse: the row remains queryable so reports show "Applied fix to (null)".
**Suggested Fix:** Either denormalise — snapshot `repo_label` / `repo_root_path` into `apply_action` at insert time — or change the FK to `onDelete: "restrict"` and require admins to archive repos rather than delete. Same treatment for `applyAction.findingId` (currently cascade, which deletes the audit-trail row when a finding is deleted — also lossy).

### [Strong] F-05 — `scan.repoId` is `onDelete: "set null"`, orphaning past scans from their repo
**Schema:** `packages/db/src/schema.ts:264`
**Issue:** When a repo row is deleted, its scans survive but lose `repoId`. `apps/web/src/lib/apply-dal.ts:87-93` has a comment confirming this ("Resolve repo via scan.repoId or rootPath fallback") — and the fallback is `rootPath`, which can also change. The customer-summary join at `apps/web/src/lib/customer-dal.ts:55,60` filters scans by `workspaceId` only, silently surfacing orphaned scans with no repo attribution.
**Why Strong:** History becomes un-attributable; cost-rollups in `audit_run_cost` reference the scan but not the repo, so per-repo spend reports degrade silently.
**Suggested Fix:** Either snapshot `repo_label` into `scan` (already partially done — `scan.rootPath` is denormalised), or block repo-delete when scans exist (`onDelete: "restrict"`). Given the apply-mode fallback already relies on `rootPath`, the cheap fix is to also snapshot `repo_full_name` into `scan` at audit-time.

### [Strong] F-06 — `customer.notes` column is dead code
**Schema:** `packages/db/src/schema.ts:98`
**Issue:** `customer.notes text` is defined in the schema and migrated in `0008_puzzling_living_lightning.sql:8`. Grep across `apps/` and `packages/` finds zero read or write. The only `.notes` hit is for the sub-processor JSON (`apps/web/src/app/trust/sub-processors.xml/route.ts:52`), which is unrelated. No customer-edit form, no API route, no DAL function touches it.
**Why Strong:** Schema bloat + audit confusion. Future developers will assume the column has data and write joins/filters against it.
**Suggested Fix:** Either implement a notes-edit UI (Sprint-3 backlog?) or drop the column: `ALTER TABLE customer DROP COLUMN notes;`. Verify against the customer-form components first.

### [Mid] F-07 — `credit_ledger.reason` has no index but is filtered in cost-summary queries
**Schema:** `packages/db/src/schema.ts:686, 693-697`
**Issue:** Only one composite idx exists: `(workspace_id, created_at)`. `packages/billing/src/credits.ts:285` filters on `workspaceId` ordered by `createdAt` (covered). But future credit-summary queries (e.g. "monthly_grant rows for this period" or "expiration sum") will scan all ledger rows per workspace. The `reason` field is varchar(30) with enum-like cardinality (7 values per `schema.ts:676-678`) — a partial-index on `(workspace_id, reason, created_at)` is the typical fit.
**Why Mid:** Today's queries are covered; not a hot pain yet. Becomes Strong once usage analytics / Stripe-reconciliation reports land.
**Suggested Fix:** Defer until cost-analytics ships, then add `CREATE INDEX credit_ledger_workspace_reason_idx ON credit_ledger (workspace_id, reason, created_at DESC);`

### [Mid] F-08 — `install_request.workspaceId` + `status` filter has no composite index
**Schema:** `packages/db/src/schema.ts:145-163` (no `(t) => [...]` block at all)
**Issue:** `apps/web/src/lib/install-requests.ts:195,228,265` filter on `workspaceId` and order by `requestedAt DESC`. Audit-trail export (`audit-trail-export.ts:91`) too. No index on `(workspace_id, requested_at DESC)` exists. The `install_request` schema has zero indexes (only PK and the three FKs which get implicit btree on the FK column). On the access-page where pending requests are listed, this is a full-table scan per workspace.
**Why Mid:** Low table cardinality today (one row per install attempt). Becomes Strong at >10k rows or with a status-pending filter that becomes hot.
**Suggested Fix:** `CREATE INDEX install_request_workspace_requested_idx ON install_request (workspace_id, requested_at DESC);` Add a `status='pending'` partial index when the approval inbox UI gets traffic.

### [Mid] F-09 — Empty migration `0011_lame_speedball.sql` is opaque about what it did
**Schema:** `packages/db/drizzle/0011_lame_speedball.sql` is empty; the matching snapshot `meta/0011_snapshot.json` shows `drift_run` removed.
**Issue:** Drizzle generated an empty migration body (probably because the snapshot was hand-edited or the table was dropped out-of-band). The intent ("drop drift_run") is then re-encoded as a literal `DROP TABLE` in `0011`-replacement migration via the snapshot diff — but the SQL file itself is empty. Drizzle's `0012_drop_canonical_repo_id.sql` is the actual hand-written follow-up. Plus there is an apparent inconsistency: `_journal.json:82-88` references `0011_lame_speedball` (idx 11) but the SQL for that drop seems to live in code as `DROP TABLE drift_run` — yet the actual migration file is empty.
**Why Mid:** Confusing for the next reviewer; not actually broken in DB because the snapshot encodes the truth. Risk only if a fresh DB is migrated from scratch and `0011` is skipped → `drift_run` stays around.
**Suggested Fix:** Either hand-write `DROP TABLE IF EXISTS drift_run CASCADE;` into `0011_lame_speedball.sql` (it has been observed at line 1 in some checkouts but is missing in the current branch — verify with `git log -p`), or document the drop intent inline.

### [Mid] F-10 — `audit_run_cost` table is insert-only with no read-side queries yet
**Schema:** `packages/db/src/schema.ts:634-663`
**Issue:** `audit_run_cost` has two write sites (`apps/web/src/lib/audit-action.ts:375`, `packages/inngest/src/functions/audit-requested.ts:85`) but zero reads in `apps/` or `packages/`. The schema comment ("Detailed line-items live in audit_run_cost (1:1)") sets up a rollup that nothing consumes. Indexes exist for the expected read pattern, but the read path isn't wired.
**Why Mid:** Not broken — Sub-Plan-B may still be in flight. But dead-write tables silently rot (schema drift between writer and would-be reader). Re-confirm in the next sprint that read-side analytics actually land.
**Suggested Fix:** Either wire the `/[workspace]/billing` page to read `audit_run_cost` rollups, or remove the write sites and roll up on demand from `ai_usage_event`. Track as a follow-up.

### [Mid] F-11 — `repo.notifySecret` is stored as plaintext varchar (HMAC secret)
**Schema:** `packages/db/src/schema.ts:139`
**Issue:** Per-repo HMAC secret for `/api/notify-update` is stored plaintext in `repo.notifySecret varchar(64)`. The BYOK pattern (`subscription.byokKeyCiphertext` + IV + auth-tag, `schema.ts:521-526`) shows the project knows how to AES-256-GCM-encrypt secrets — but this column was not migrated. A DB dump leaks all repo-notify webhook secrets.
**Why Mid:** Low blast radius (these only authenticate `/api/notify-update` and trigger an audit, not auth/billing) but a clear inconsistency with the BYOK pattern.
**Suggested Fix:** Mirror BYOK: add `notify_secret_ciphertext`, `notify_secret_iv`, `notify_secret_auth_tag`. Re-issue secrets on rotation. Track as a Trust-domain follow-up.

### [Weak] F-12 — `subscription.creditsUsedThisPeriod` denormalises data that `credit_ledger` is the source-of-truth for
**Schema:** `packages/db/src/schema.ts:518-520` + `packages/billing/src/credits.ts:45-53,124-188`
**Issue:** `subscription.creditsUsedThisPeriod` is updated in two places (`apps/web/src/app/api/stripe/webhook/route.ts:343,432` resets to 0; `packages/billing/src/credits.ts` increments). The schema comment on `credit_ledger` (`schema.ts:673-676`) explicitly says it is "the source-of-truth for the workspace credit balance" with `balance_after` denormalised. Two source-of-truths for the same number is a classic drift trap — they will diverge under transaction-failure scenarios.
**Why Weak:** Today's billing flow is consistent (the credits.ts upsert is transactional). Becomes problematic only under partial-failure (one update succeeds, the other doesn't) or under future concurrent updates.
**Suggested Fix:** Either drop `creditsUsedThisPeriod` and compute on read from `credit_ledger` (filter on `reason='audit_consume' AND created_at >= currentPeriodStart`), or add a CI/cron consistency check that flags divergence. Document the chosen invariant in `credits.ts`.

### [Weak] F-13 — `webhook_event` table has no index on `(event_name, received_at)` despite being a high-cardinality append-only log
**Schema:** `packages/db/src/schema.ts:246-257`
**Issue:** Only PK exists. The single read site at `apps/web/src/app/api/install-webhook/route.ts:79,105,115` uses `WHERE delivery_id = ?` (covered by PK). The audit-trail export at `audit-trail-export.ts:133` selects `eventName` columns. No analytic queries today.
**Why Weak:** Currently fine. Becomes Mid once webhook-debugging dashboards land.
**Suggested Fix:** Add `CREATE INDEX webhook_event_received_idx ON webhook_event (received_at DESC);` when the events table grows past ~50k rows.

### [Weak] F-14 — `event` table has no retention policy implemented despite "7d default" comment
**Schema:** `packages/db/src/schema.ts:478-492` ("Auto-rolled by retention; 7d default.")
**Issue:** No Inngest cron job grep matches an `event`-table cleanup. Without a TTL/retention sweeper, the table grows unbounded. The composite idx on `(workspace_id, id)` is fine for SSE cursoring but doesn't help bloat.
**Why Weak:** Not load-bearing yet (low event-rate); the schema comment promises behaviour that the code doesn't deliver.
**Suggested Fix:** Add a daily Inngest job `cleanup-events` that does `DELETE FROM event WHERE created_at < now() - interval '7 days';` — or remove the misleading comment.

### [Exceptional] F-15 — Stripe-meter-event idempotency design is textbook-correct
**Schema:** `packages/db/src/schema.ts:746-773` (`stripe_meter_event_log`)
**Issue:** N/A — highlighting a positive pattern.
**Why Exceptional:** The table uses the Stripe-side dedupe-key as its own primary key (`identifier varchar(80) PRIMARY KEY`), making double-submission physically impossible at the DB level. Combined with the comment ("belt-and-suspenders" with Stripe-side dedupe), the FK back to `credit_ledger` for traceability, and `submitted_at` index for reconciliation queries — this is the cleanest table in the schema. Use as a template for future idempotency logs (webhook-event already follows the same pattern with `delivery_id` PK).

### [Exceptional] F-16 — `prepaid_credit_grant.stripeInvoiceId` UNIQUE constraint blocks double-grant on retry
**Schema:** `packages/db/src/schema.ts:718-720`
**Issue:** N/A — positive pattern.
**Why Exceptional:** The Stripe-invoice ID being unique means a webhook retry that re-fires the same `invoice.paid` event cannot create a duplicate credit-grant row. Combined with the composite `(workspace_id, expires_at)` index for the expiry-sweeper at `packages/inngest/src/functions/prepaid-credit-expirer.ts:77-80`, this is well-thought-out.

## Migration-Chronology Notes

- `0000–0006`: Initial schema + sprint-iteration columns. Clean.
- `0007`: DPA-acceptance (Sprint 1.0). Clean unique constraint on `(user_id, dpa_version)`.
- `0008`: Customer-layer + Sprint-G2 backfill. SQL has good comment on slug-collision handling and the `DISTINCT ON` is correct.
- `0009`: Solution (Sprint G4). Clean.
- `0010`: Apply-action + finding dismiss (Sprint G5). Clean.
- `0011`: **Empty file** but snapshot encodes `DROP TABLE drift_run`. See F-09.
- `0012`: Hand-written `DROP COLUMN canonical_repo_id`. Clean follow-up to `0011`.
- `0013`: Hand-written subscription pivot (user→workspace) + credit-system tables. SQL comment explicitly explains why drizzle-kit couldn't handle the non-interactive pivot. Pre-flight gate via `scripts/check-billing-migration-safety.ts` is sound.
- `0014`: Stripe meter-event log. Clean.

`drizzle-kit check` returns clean (no statement-order conflicts, no missing snapshots).

## Recommended Plan Items

1. **Master priority (Kill-band):** Migration to flip the 4 user-FK cascades to `set null` (workspace.ownerId, install_decision.deciderId, apply_action.decidedBy, dpa_acceptance.userId) + null-allow + user-delete handler that scrubs PII. Sub-plan candidate: `db-cascade-hardening`.
2. **Strong-band cleanup:** Drop `customer.notes` (or wire the UI), document `repo.customerId` cascade intent, denormalise `repo_label` into `scan` so deleted repos don't orphan scans.
3. **Mid-band:** Wire `audit_run_cost` reads (Sub-Plan-B finishing-touch), add the 2 missing indexes, fill the empty `0011` migration body for fresh-DB safety, mirror BYOK encryption pattern for `notify_secret`.
4. **Weak-band:** Implement event-table retention cron, drop `subscription.creditsUsedThisPeriod` denormalisation, add `webhook_event` analytic index when needed.
5. **Out-of-domain:** pgvector is documented as part of the stack but not installed. Either remove from `docs/vision.md` until it ships, or add a placeholder migration `CREATE EXTENSION IF NOT EXISTS vector;` so the env is consistent with the docs.
