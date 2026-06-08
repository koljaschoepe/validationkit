# Wave-2 Sub-3 — DB Schema + Migration Deep-Audit

> Generated: 2026-06-06
> Scope: `packages/db/src/schema.ts`, `packages/db/drizzle/0000–0015_*.sql`, `packages/db/src/client.ts`, DAL hot-query paths under `apps/web/src/lib/**`, `packages/billing/src/credits.ts`, `packages/inngest/src/functions/*`.
> Method: read-only static analysis. Severity bands `{Kill, Strong, Mid, Weak, Exceptional}` per `packages/core/src/severity.ts`.
> Companion: Wave-1-Infra Parts C.1–C.7 (`wave1-04-prod-infra-vercel.md`) covered Drizzle-client choice, pool math, schema-drift health, backup-policy gap, RLS-by-design, A.3 buildCommand-race. This report does NOT re-detail those; it extends with the schema-walkthrough, GDPR-chain, hot-query indices, and Drizzle-pattern findings Wave-1 deferred.

---

## TL;DR — Schema-Integrity Verdict

**🟡 Schema is internally consistent, foreign keys form a clean tree, append-only audit tables are correctly modelled. BUT three classes of issues block a credible "production-ready DB" label:**

1. **K-DB-1 (Kill) — Three hot-query paths use `scan.rootPath` joins instead of `scan.repoId`**, leaking scans between workspaces that audit the same public URL. This is the same defect Wave-1-Auth K2 flagged (`customers.ts:178-189`) — confirmed identical pattern reused in `customers.ts:117-132` (listRepos) and `dal/galaxie.ts:168-174`. Cross-tenant scan-leak is a deal-breaker for DACH-B2B.
2. **K-DB-2 (Kill) — GDPR Art. 17 PII-scrub helper missing.** Comment at `schema.ts:74` admits "PII-scrub helper that runs on user-delete is a V2 item" — but `apply_action.ipAddress`, `apply_action.userAgent`, `install_decision.ipAddress/userAgent`, `dpa_acceptance.ipAddress/userAgent`, `session.ipAddress/userAgent` are denormalised PII that **survive a user-delete via SET NULL**. After Bundle-A K2/K3 hardening, the user FK becomes null but the IP+UA columns remain — that is still personal data under GDPR Recital 30.
3. **S-DB-1 (Strong) — Connection-pool math from Wave-1-Infra C.7 understates worst case.** `client.ts:29` sets `max=10`. Web (Vercel Fluid-Compute, ~3 instances) + Inngest (5 cron-functions + audit-requested worker × concurrent scans) + migrate script + drizzle-studio (rare) = realistic peak ~45-60 conns, NOT the ~32 Wave-1 estimated. Free-tier Neon caps ~100 (autoscale), Pro at 1000 — fits, but headroom is thinner than Wave-1 implied, and `prepare: false` (line 33) means every query re-parses (CPU on the DB side).

**Detailed severity table:**

| Severity | Count | Examples |
|----------|------:|----------|
| Kill     | 2     | K-DB-1 cross-tenant rootPath-join, K-DB-2 PII residue after user-delete |
| Strong   | 5     | S-DB-1 pool-math, S-DB-2 missing covering indices on hot paths, S-DB-3 hand-written 0013/0015 + deferred snapshot, S-DB-4 no Neon PITR / no DR drill (= Wave-1 C.5), S-DB-5 `consumeCredits` FOR UPDATE on `subscription` but ledger-balance race on prepaid pool |
| Mid      | 8     | M-DB-1 to M-DB-8 (detail below) |
| Weak     | 4     | W-DB-1 to W-DB-4 |
| Exceptional | 2  | E-DB-1 stripe_event idempotency, E-DB-2 credit_ledger append-only design |

---

## Part A — Schema Walkthrough

23 tables. Naming: snake_case (`casing: "snake_case"` in `client.ts:34` + `drizzle.config.ts:10`). All timestamps `with time zone`. Mixed PK strategies: Better-Auth tables use `text` (Better-Auth contract), domain tables use `uuid` with `gen_random_uuid()`, idempotency tables use external IDs as PKs.

### A.1 — Better-Auth Tables

#### `user` (`schema.ts:20-28`)
- **Purpose:** Better-Auth user record. Single source of truth for identity.
- **PK:** `id` text (Better-Auth-issued).
- **FKs out:** none.
- **FKs in:** session, account, workspace.ownerId (SET NULL), repo.writeApprovedBy (SET NULL), install_request.requesterId (SET NULL), install_request.approverId (SET NULL), membership.userId (CASCADE), membership.invitedById (SET NULL), install_decision.deciderId (SET NULL), apply_action.decidedBy (SET NULL), dpa_acceptance.userId (SET NULL).
- **Soft-delete?** No — hard-delete.
- **Indices:** PK (`id`), unique on `email`.
- **Constraints:** `email` UNIQUE NOT NULL.
- **Size @ 100 paying customers:** 100–300 (multiple users per workspace, 2–4 avg).

#### `session` (`schema.ts:30-41`)
- **Purpose:** Better-Auth session storage (sessions live ~7d).
- **PK:** `id` text.
- **FKs:** `user_id → user(id) ON DELETE CASCADE`.
- **Indices declared:** none (only PK + unique token). **Missing:** `(user_id)` index for session-revoke / listSessions queries. CASCADE-delete on user-delete will table-scan without it.
- **Constraints:** `token` UNIQUE NOT NULL.
- **Size @ 100:** 100 × 3 active sessions × 7d rotation = ~2-5k active rows.

#### `account` (`schema.ts:43-59`)
- **Purpose:** OAuth/credential-link storage.
- **PK:** `id` text.
- **FKs:** `user_id → user(id) ON DELETE CASCADE`.
- **Indices:** **Missing** `(user_id)` index. Better-Auth lookups `user_id + provider_id` on login.
- **Size @ 100:** 100–500.

#### `verification` (`schema.ts:61-68`)
- **Purpose:** Magic-link / email-verification tokens.
- **PK:** `id` text.
- **No user FK** — uses `identifier` (email) instead. **No index on `identifier`** — Better-Auth verifies by identifier-lookup, hot-path table-scan as the table grows.
- **Soft-delete:** No. Better-Auth lets rows accumulate forever; no TTL/cron observed. **M-DB-1 (Mid):** add `(identifier)` index + a daily cleanup cron filtering by `expires_at < now() - interval '30 days'`.

### A.2 — Workspace + RBAC

#### `workspace` (`schema.ts:76-84`)
- **Purpose:** Top-level tenant container.
- **PK:** `uuid`, `gen_random_uuid()`.
- **FKs out:** `owner_id → user(id) ON DELETE SET NULL` (Migration 0015 hardening).
- **FKs in (cascade fan-out):** customer, repo, scan, install_request, membership, apply_action, event, subscription (unique), ai_usage_event, audit_run_cost, credit_ledger, prepaid_credit_grant, stripe_meter_event_log — **all CASCADE**.
- **Indices:** PK, unique on `slug`. **Missing** `(owner_id)` index — `ensureDefaultWorkspace` (`workspaces.ts:21`) + `audit-trail-export.ts:43` both filter by ownerId.
- **Constraints:** `slug` UNIQUE NOT NULL.
- **Size @ 100:** 100.

#### `customer` (`schema.ts:89-114`)
- **Purpose:** Customer-Org layer (ADR-0001 C2).
- **PK:** `uuid`.
- **FKs:** `workspace_id → workspace(id) CASCADE`.
- **Indices:** PK; `customer_workspace_slug_unique (workspace_id, slug)` UNIQUE; `customer_workspace_idx (workspace_id)`.
- **Size @ 100:** 100 × 3-5 customers = ~500.

#### `repo` (`schema.ts:116-147`)
- **Purpose:** Per-customer repository.
- **PK:** `uuid`.
- **FKs:** `workspace_id CASCADE`, `customer_id → customer(id) SET NULL` (nullable backfill window), `write_approved_by → user SET NULL`.
- **Indices:** PK; `repo_customer_idx (customer_id)`. **Missing:** `(workspace_id)` index — every `listRepos` and `addRepo` filters by it.
- **No UNIQUE on `(workspace_id, root_path)`** — silently allows duplicate repos in the same workspace. **M-DB-2 (Mid)**.
- **Size @ 100:** 100 × 5 repos = ~500.

#### `membership` (`schema.ts:175-207`)
- **Purpose:** Workspace RBAC source-of-truth (Sprint 1.2).
- **PK:** `uuid`.
- **FKs:** workspaceId CASCADE, userId CASCADE (Migration 0010 — **note inconsistency** with the Bundle-A SET NULL hardening on other user-FKs; see GDPR-chain Part B), invitedById SET NULL.
- **Indices:** PK; `membership_workspace_user_unique (workspaceId, userId)` UNIQUE — **caveat:** unique on a nullable column allows multiple `userId=NULL` rows per workspace (PostgreSQL semantics), so the same email can be invited twice for the same workspace before sign-in resolves the `userId`. Confirmed by `inviteAdmin` (`membership.ts:135-147`) explicitly checking for existing invite-by-email before insert — application-level dedupe required. **M-DB-3 (Mid):** add `UNIQUE (workspace_id, invited_email) WHERE user_id IS NULL` partial index.
- `membership_workspace_email_idx (workspaceId, invitedEmail)` covers the pending-invite lookup.

### A.3 — Audit-Trail Tables (append-only)

All five of these are marked "compliance audit-trail" in comments and use `ON DELETE SET NULL` on the user FK (Migration 0015) so the row survives the user-delete:

#### `install_request` (`schema.ts:149-169`)
- Append-only? Yes by convention (`status` mutates in place, but the request itself is immutable).
- FKs: workspaceId CASCADE, requesterId SET NULL, approverId SET NULL.
- **No indices declared.** **S-DB-2.a (Strong):** `(workspaceId, requestedAt DESC)` needed for audit-trail-export (`audit-trail-export.ts:90-92`).

#### `install_decision` (`schema.ts:224-241`)
- Append-only: yes ("never updated" per comment).
- FKs: installRequestId CASCADE (cascades on parent delete — but parent itself never deletes), deciderId SET NULL.
- **No index on `installRequestId`** — every decision-listing lookup table-scans. **S-DB-2.b (Strong)**.

#### `webhook_event` (`schema.ts:254-265`)
- PK: `delivery_id` text — GitHub `x-github-delivery` (idempotency key). **Exceptional design**.
- No workspace FK at all — global table. This is the design that drove Wave-1-Auth K3 (`audit-trail-export.ts:129-148` joins this table without a workspace filter — cross-tenant data leak). Schema-wise that's a missing column / missing index; auth-wise it's a Kill.
- **Indices:** PK only. **M-DB-4 (Mid):** add `(received_at DESC)` for the global event-stream lookup.

#### `apply_action` (`schema.ts:328-363`)
- Append-only ("One row per action. … the row itself is immutable").
- FKs: solutionId SET NULL, findingId CASCADE, repoId SET NULL, workspaceId CASCADE, decidedBy SET NULL (0015 hardening).
- **No indices declared.** Hot path: `getWorkspaceCounts` aggregates by workspaceId (`dal/galaxie.ts:64-66`) — full table scan. **S-DB-2.c (Strong):** `(workspace_id, decided_at DESC)`.

#### `dpa_acceptance` (`schema.ts:572-595`)
- Append-only.
- FK: userId SET NULL (0015 hardening).
- Indices: PK, `dpa_acceptance_user_version_unique (userId, dpaVersion)` UNIQUE. **Caveat same as membership:** unique-on-nullable allows multiple `userId=NULL` rows after user-delete (zombie compliance records).

### A.4 — Audit / Scan / Finding

#### `scan` (`schema.ts:267-294`)
- PK uuid, FKs workspaceId CASCADE, repoId SET NULL.
- **No indices declared.** Hot: `(workspaceId, createdAt DESC)` (listScans, scans-page, customer-dal, audit-trail-export — 6 callers all do this query). **S-DB-2.d (Strong):** the most-impactful single index in the schema.
- Append-only: status mutates (queued → running → complete/failed). `rawScan`/`rawReport` jsonb can balloon if a deep scan returns megabytes — no LOB-management policy.
- **Size @ 100:** 100 wkspc × 5 repos × 10 scans/mo × 12 mo = 60k rows/yr (year 1). Without the index, list-queries degrade linearly past ~10k rows.

#### `finding` (`schema.ts:296-323`)
- PK uuid, FK scanId CASCADE.
- Indices: `finding_scan_severity_idx (scan_id, severity)` (0008), `finding_scan_dismiss_idx (scan_id, dismiss_status)` (0010). **Good.**
- Append-only-ish: dismissStatus mutates in place (Sprint G5).
- **Size @ 100:** 60k scans × 15 findings avg = ~900k/yr. Indices are healthy.

#### `solution` (`schema.ts:438-459`)
- 1:1 with finding via `solution_finding_id_unique`.
- PK uuid, FK findingId CASCADE+UNIQUE.
- No additional indices needed (the unique covers all callers).
- **Size:** same magnitude as `finding` (lazy-generated).

### A.5 — Event / Stripe / Billing

#### `event` (`schema.ts:488-502`)
- PK: `bigserial` (rare in this schema — only one). Auto-incrementing for cursor-based polling via the SSE endpoint.
- FK: workspaceId CASCADE.
- Index: `event_workspace_id_idx (workspace_id, id)` — well-suited to "give me events since last_id".
- **No retention:** comment says "7d default" but no cron observed (grep "retention" returns nothing in inngest functions). **M-DB-5 (Mid):** table grows unbounded.

#### `stripe_event` (`schema.ts:560-567`)
- PK: stripe event id varchar(80) — **exceptional idempotency design (E-DB-1).**
- No FKs.
- Indices: PK only.

#### `subscription` (`schema.ts:516-549`)
- PK uuid, FK workspaceId CASCADE+UNIQUE (one sub per workspace).
- Indices: PK + UNIQUE on workspaceId — sufficient.
- **PII concern:** `byokKeyCiphertext / byokKeyIv / byokKeyAuthTag` (AES-256-GCM-encrypted, ADR-0007). Encrypted at-rest at app-level; Neon's at-rest encryption is additional. Good.
- **Size @ 100:** 100.

#### `ai_usage_event` (`schema.ts:604-634`)
- Append-only.
- FKs: workspaceId CASCADE, scanId SET NULL.
- Indices: `(workspaceId, createdAt)`, `(scanId)`. **Good.**
- **Size @ 100:** 60k scans × ~5 AI calls/scan = ~300k/yr. Will need periodic archive past year-2.

#### `audit_run_cost` (`schema.ts:647-676`)
- 1:1 with scan via `audit_run_cost_scan_id_unique`.
- FKs: scanId CASCADE+UNIQUE, workspaceId CASCADE.
- Index: `(workspaceId, createdAt)`. Adequate.

#### `credit_ledger` (`schema.ts:691-712`)
- **Exceptional design (E-DB-2):** append-only with denormalised `balance_after` for O(1) balance reads.
- PK uuid, FK workspaceId CASCADE.
- Index: `(workspaceId, createdAt DESC)` (0013 explicitly `DESC` — good).
- **But:** the credit-aggregator (`credit-aggregator.ts:51-60`) LEFT-JOINs on `stripe_meter_event_log.identifier = credit_ledger.id::text` — that LIKE-cast prevents index use on the join side. **W-DB-1 (Weak):** consider native uuid column on `stripe_meter_event_log.identifier` (currently varchar(80) — see `schema.ts:766`).

#### `prepaid_credit_grant` (`schema.ts:724-747`)
- PK uuid, FK workspaceId CASCADE, `stripeInvoiceId` UNIQUE.
- Index: `(workspaceId, expiresAt)`. Adequate for FIFO drain queries (`credits.ts:152-155`).

#### `stripe_meter_event_log` (`schema.ts:763-786`)
- PK: `identifier` varchar(80) — Stripe-side dedupe key.
- FKs: workspaceId CASCADE, creditLedgerId SET NULL.
- Index: `(workspaceId, submittedAt)`. **No index on creditLedgerId** — but the JOIN above is `log.identifier = cl.id::text`, not `log.credit_ledger_id`, so no scan via FK column. Inconsistency: the schema has both `identifier=ledger.id` (used for joining) and `credit_ledger_id` (set, not used). **W-DB-2 (Weak):** drop one of them or document the dual purpose.

---

## Part B — GDPR Art. 17 Erasure Chain

Trigger: user invokes "Delete my account" (Wave-1-Auth S15 — not implemented; planned in Bundle-A). When code lands, executing `DELETE FROM user WHERE id = $1` fires this chain:

### B.1 — Cascade behavior table

| Row referencing user | FK action | After delete | PII residue | Notes |
|---|---|---|---|---|
| `session.user_id` | CASCADE | gone | none (session-level PII like IP+UA also gone) | Better-Auth |
| `account.user_id` | CASCADE | gone | none | Better-Auth |
| `membership.user_id` | **CASCADE** | row gone | `invited_email` (denormalised PII) still in OTHER membership rows if invited multiple times before sign-in | **inconsistent with rest of 0015 hardening — see M-DB-6 below** |
| `membership.invited_by_id` | SET NULL | retained | `invited_email` retained on row | retained for audit |
| `workspace.owner_id` | SET NULL (0015) | retained | none on workspace itself | ownership-transfer must be handled in app — see B.3 |
| `repo.write_approved_by` | SET NULL | retained | none | OK |
| `install_request.requester_id` | SET NULL (0015) | retained | none on this row | OK |
| `install_request.approver_id` | SET NULL | retained | none | OK |
| `install_decision.decider_id` | SET NULL (0015) | retained | **`ip_address` + `user_agent` PII residue** | **K-DB-2 trigger** |
| `apply_action.decided_by` | SET NULL (0015) | retained | **`ip_address` + `user_agent` PII residue** | **K-DB-2 trigger** |
| `dpa_acceptance.user_id` | SET NULL (0015) | retained | **`ip_address` + `user_agent` PII residue** | **K-DB-2 trigger — and per GDPR Art. 28 the DPA record MUST be retained for the auditable retention window** |
| `subscription` (no FK on user — workspace-scoped) | n/a | retained via workspace | `stripe_customer_id` + `byok_*` ciphertext | These belong to the workspace, not the user — OK if workspace continues |
| `audit_trail_export.exporterEmail` (transient) | n/a | n/a | denormalised email captured at export time | OK — exports are transient files, not stored rows |
| `webhook_event` | no user FK | retained | full GitHub payload (`jsonb`) may contain author username | M-DB-7 — scrub or retain? GDPR says scrub. |

### B.2 — K-DB-2 detail (Kill)

**Finding:** After Bundle-A K2/K3 hardening (Migration 0015), `apply_action`, `install_decision`, and `dpa_acceptance` keep the row but null the user-FK. They still hold `ip_address text` + `user_agent text` columns — these are personal data under GDPR Art. 4(1) + Recital 30. A user-delete erases the user but leaves their IP fingerprint trail across all three tables (and `session.ipAddress` which is CASCADEd — OK).

**Files:**
- `schema.ts:236-237` install_decision
- `schema.ts:358-359` apply_action
- `schema.ts:586-587` dpa_acceptance

**Fix-class:** Add an app-level scrub on user-delete that runs UPDATE … SET ip_address=NULL, user_agent=NULL WHERE … the affected rows for the deleted user (using a snapshot of the user's prior membership/decision history before the user row deletes — chicken-and-egg requires a soft-delete or pre-flight scrub-then-delete).

**Compliance vs operational tension:**
- DPA-acceptance: legal team will say "keep for 7 years" for B2B contract evidence. Scrubbing IP+UA is fine; the timestamp + dpa_version + workspace context remains, which is what auditors care about.
- Apply-action: same — the "who acted" can be `null` (user-deleted), the "what happened" + "when" + "PR-URL" are operational.
- Install-decision: same.

**Recommended cleanup function** (sketch — not implementation):
```sql
-- Run BEFORE DELETE FROM user WHERE id = $uid
UPDATE install_decision SET ip_address=NULL, user_agent=NULL WHERE decider_id = $uid;
UPDATE apply_action SET ip_address=NULL, user_agent=NULL WHERE decided_by = $uid;
UPDATE dpa_acceptance SET ip_address=NULL, user_agent=NULL WHERE user_id = $uid;
-- Then null FK + delete (via CASCADE handles session/account)
```

### B.3 — Workspace ownership transfer

`schema.ts:74` admits: "After a user delete, ownership transfers to the membership row with role='owner' (validated in the DAL)." But:

1. The DAL function performing this transfer **does not exist yet** (grep "transferOwnership" / "promoteToOwner" returns no matches).
2. Edge case: what if the workspace has NO other `role='owner'` membership? `workspace.owner_id` becomes NULL and the workspace is now ownerless. Should fall back to the most senior admin → no business rule documented. **M-DB-8 (Mid).**

### B.4 — `membership.user_id` inconsistency

Migration 0015 hardened 5 user-FKs from CASCADE to SET NULL but **left `membership.user_id` as CASCADE** (`schema.ts:182`). Rationale presumably: a deleted user has no membership claim. But this is inconsistent with the audit-trail logic. If the same workspace later wants to show "User X (deleted) was member from 2024–2026", that history is gone with the membership row.

**M-DB-6 (Mid):** decide policy. Either:
- Keep CASCADE on membership (current) and accept that membership-history is purged with the user, OR
- Switch to SET NULL + add `deleted_at` to membership and treat user-NULL rows as "former member, identity erased".

### B.5 — Non-deterministic cascade order

Postgres documents cascade-order as "unspecified". With:
- `user` → `workspace.owner_id` (SET NULL)
- `user` → `membership.user_id` (CASCADE) → membership row deleted

If `membership` cascades first and `workspace.owner_id` SET-NULLs second, the workspace momentarily has no owner row in `membership` AND `workspace.owner_id=NULL`. Anyone reading mid-transaction (e.g. an SSR request) sees an ownerless workspace. Single-statement DELETE is atomic at COMMIT, so external readers see the post-state — but in-transaction triggers (none present) would see inconsistent intermediate states. **Currently safe; document the invariant.** W-DB-3.

### B.6 — User-PII in denormalised text

Searched for `user.email` references stored as denormalised text. Found:
- `membership.invited_email` (`schema.ts:186`) — denormalised email, retained when user-FK CASCADEs. **Should be scrubbed on user-delete.** Currently the membership row is destroyed by CASCADE anyway, so this is fine.
- `audit-trail-export.ts:155` writes `exporterEmail` into the export blob — transient, OK.
- `stripe-webhook/route.ts:28` joins `workspace → user` to fetch email for transactional emails — read, not stored.

**Conclusion:** no other denormalised email storage found beyond `membership.invited_email`. Acceptable.

---

## Part C — Hot-Query Index Coverage

10 hot read paths, status of supporting indices:

| # | Query | Predicate | Index? | Verdict |
|---|---|---|---|---|
| 1 | `getWorkspaceFromSlug` (`dal/galaxie.ts:271-275`) | `workspace.slug = ?` | ✅ UNIQUE on slug | OK |
| 2 | `userIsMember` (`dal/galaxie.ts:118-128`) | `(workspace_id, user_id, status)` | ✅ UNIQUE `(workspace_id, user_id)` — covers prefix | OK (status filter is a post-index check) |
| 3 | `listScans` (`scans/page.tsx:46-49`) | `workspace_id = ? ORDER BY created_at DESC LIMIT 50` | ❌ **no index on `(workspace_id, created_at)`** | **S-DB-2.d (Strong)** |
| 4 | `listFindings` for scan (`dal/galaxie.ts:185-188`) | `scan_id IN (…)` | ✅ `finding_scan_severity_idx` covers `(scan_id, …)` prefix | OK |
| 5 | `getCreditBalance` (`credits.ts:42-65`) | `subscription.workspace_id = ?` + `prepaid.workspace_id = ? AND expires_at > now()` | ✅ UNIQUE on subscription.workspace_id, ✅ `prepaid_credit_grant_workspace_expires_idx` | OK |
| 6 | `stripeEventExists` (Stripe webhook) | `id = ?` | ✅ PK | OK |
| 7 | `webhookEventExists` (`install-webhook/route.ts`) | `delivery_id = ?` | ✅ PK | OK |
| 8 | `getScanStatus` (`scan-status.ts:29-46`) | INNER JOIN scan + workspace, `scan.id = ? AND workspace.owner_id = ?` | ✅ scan.id PK; ❌ no `workspace.owner_id` index | **M-DB-9 (Mid)** — owner-only check is a Wave-1-Auth Kill anyway (K6); will be replaced by membership-based gate |
| 9 | `getActiveSubscription` | `workspace_id = ?` (no status filter — `subscription.status` defaults `active`) | ✅ UNIQUE on workspace_id | OK |
| 10 | `auditTrailExport` for workspace (`audit-trail-export.ts:59-114`) | `scan.workspace_id = ?` + `install_request.workspace_id = ?` + `repo.workspace_id = ?` + global webhook scan | ❌ no `(workspace_id, created_at)` on any of scan/install_request/repo | **S-DB-2.a (Strong)** combined |

**Aggregate index gaps (combined into S-DB-2 Strong recommendation):**
- `scan (workspace_id, created_at DESC)` — used in 6 callers
- `repo (workspace_id, created_at DESC)` — 3 callers
- `install_request (workspace_id, requested_at DESC)` — audit-trail
- `install_decision (install_request_id)` — every audit-trail lookup
- `apply_action (workspace_id, decided_at DESC)` — getWorkspaceCounts + audit
- `account (user_id)`, `session (user_id)` — Better-Auth + cascades
- `workspace (owner_id)` — multiple owner-checks until membership-based gate replaces them

**Scaling forecast:**
- @ 10× rows (year 1 → 10k repos, 600k scans): unindexed queries degrade from O(log n) to O(n). 50ms → 500ms is the rough degradation for the unindexed scan-list. Still tolerable.
- @ 100× rows: hits 5s; UI timeouts; cron-jobs (credit-aggregator scans `credit_ledger` LEFT JOIN — currently indexed) stay healthy. Web reads break.

---

## Part D — Migration Order + Rollback Safety

### D.1 — Files in order

| # | File | What | Reversible? |
|---|---|---|---|
| 0000 | concerned_nicolaos.sql | Initial schema | n/a (drop database) |
| 0001 | even_terror.sql | drift_run + install_request + repo write_access cols | partially — would need DROP TABLE |
| 0002 | outgoing_longshot.sql | scan column defaults + scan.status/started_at/completed_at + repo.github_* | **NO — DROP NOT NULL on raw_scan/raw_report is non-reversible without data loss** |
| 0003 | gifted_loki.sql | webhook_event | DROP TABLE |
| 0004 | superb_puff_adder.sql | event + repo poller columns + repo.canonical_repo_id | DROP TABLE event |
| 0005 | square_forge.sql | stripe_event + subscription (legacy user-level) | DROP TABLE |
| 0006 | secret_tigra.sql | dpa_acceptance + unique idx | DROP TABLE |
| 0007 | narrow_randall_flagg.sql | install_decision + membership + backfill INSERT | **partially — backfill INSERT is forward-only; reverse would orphan owner-memberships** |
| 0008 | puzzling_living_lightning.sql | customer + repo.customer_id + repo.apply_mode + backfill | **NO — backfill creates customer rows from repo.label; reverse needs to deduce the mapping** |
| 0009 | nice_firebrand.sql | solution | DROP TABLE |
| 0010 | open_thaddeus_ross.sql | apply_action + finding dismiss cols | DROP TABLE apply_action; **DROP COLUMNS on finding — non-reversible if data present** |
| 0011 | lame_speedball.sql | (need to read) | TBD |
| 0012 | drop_canonical_repo_id.sql | ALTER TABLE repo DROP COLUMN canonical_repo_id | **NO — DROP COLUMN, data lost** |
| 0013 | saas_pricing_redesign.sql | **DROP TABLE subscription CASCADE + recreate** | **NO — DROPS all live subscription rows** |
| 0014 | stripe_meter_event_log.sql | new table | DROP TABLE |
| 0015 | user_cascade_hardening.sql | FK constraint swap CASCADE→SET NULL on 5 cols | **Reversible to CASCADE but data-mapping needed** |

**Non-reversible migrations:** 0002 (NOT NULL drop), 0007/0008 (backfills), 0010 (DROP COLUMN on finding — wait, this ADDs columns, so reverse = DROP COLUMN dismiss_status/dismiss_reason/snoozed_until which is non-reversible if data present), 0012 (DROP COLUMN), 0013 (DROP TABLE), 0015 (FK-swap requires constraint dance).

### D.2 — Idempotency

drizzle-orm/postgres-js/migrator tracks applied migrations in `__drizzle_migrations` (the journal table). Re-running `pnpm db:migrate` is safe — already-applied migrations are skipped by hash. **But individual SQL statements in some files are NOT idempotent:**

- 0007 line 34: `INSERT INTO membership … ON CONFLICT … DO NOTHING` — idempotent. ✅
- 0008 line 25-44: backfill `INSERT INTO customer` — **NOT idempotent on replay**, would create duplicate customers. The migration framework skips entire files based on hash, so this is fine for the framework but a danger if a developer manually re-runs the SQL.
- 0013 line 12: `DROP TABLE IF EXISTS "subscription" CASCADE` — **destructive replay**. The pre-flight gate `scripts/check-billing-migration-safety.ts` (referenced in line 3) prevents this on live Stripe rows. **S-DB-3 (Strong):** verify the gate is still wired and tested.

### D.3 — Migration-in-buildCommand (Wave-1-Infra A.3 race)

`vercel.json:5` runs `pnpm --filter @vk/db exec tsx src/migrate.ts` as part of the build. Wave-1 already flagged Strong. **Confirmed:** this remains the active pattern. Combined with the destructive migrations above (0013 drops subscription), a half-failed deploy could leave the system in an unrecoverable state.

**Recommended cutover (from Wave-1 A.3 + this audit):**

1. Remove migration from `vercel.json:5`.
2. Add a pre-deploy script: `pnpm db:migrate` invoked by the developer (or in a separate CI step BEFORE the Vercel deploy starts).
3. Document in `docs/operations/deploy.md`.
4. For zero-downtime breaking migrations (DROP COLUMN, type change): use the two-phase pattern (deploy A adds new column, code writes to both; deploy B removes old column).

### D.4 — Schema-snapshot drift

`schema.ts:74` + 0015 SQL header confirm: "Schema-snapshot regenerate (drizzle-kit generate) is deferred — the existing 0011 + saas-pricing-sub-a snapshots have pre-existing rename-conflicts". The `meta/_journal.json` only lists snapshots through 0011 (`packages/db/drizzle/meta/ — 0000..0011_snapshot.json + _journal.json`).

This means `drizzle-kit check` cannot verify 0012–0015 schema drift. **S-DB-3 (Strong):** the snapshot-regenerate is overdue. Without it, future `drizzle-kit generate` runs may produce surprise migrations to "reconcile" the schema with the stale snapshot.

---

## Part E — Connection-Pool Reality Check

### E.1 — Client config

`packages/db/src/client.ts:28-33`:
```ts
_sql = postgres(url, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
  prepare: false,
});
```

- `max: 10` — per-instance.
- `prepare: false` — disables Postgres prepared statements (good for pgbouncer transaction-pooling compat; bad for query-plan caching).
- No `ssl` directive — relies on Neon's connection string `?sslmode=require`.
- `idle_timeout: 20s` — fine for Fluid Compute.

### E.2 — Realistic worst case

| Caller | Max instances | Conns per instance | Total |
|---|---|---|---|
| `apps/web` SSR/Server-Actions | Vercel Fluid (Standard tier, ~3 active regions × ~2 instances per region warm) ≈ 6 | 10 | 60 |
| Inngest (in same node bundle, separate instance for cron) | ~3 (5 cron functions, but only 1-2 active at any minute) | 10 | 20-30 |
| `migrate.ts` during deploy | 1 | 1 (creates one connection) | 1 |
| `drizzle-kit studio` (dev-only, rare in prod) | 0 (prod) | — | — |
| **Worst-case launch** | | | **~80** |

Wave-1-Infra C.7 estimated ~32. Real worst-case at light launch traffic is **~60-80** — still under Neon's free-tier soft cap (~100 with autoscale) but **leaves <40% headroom**.

**Mitigations:**
- Neon offers a connection-pooler endpoint (`pooler.region.aws.neon.tech`) — transaction-mode pooler. **Not confirmed in use** (default `DATABASE_URL` in `drizzle.config.ts:8` is `127.0.0.1:5432` for dev). Production should use the pooler endpoint.
- Reduce `max` from 10 → 5: many DAL queries serialise anyway, fan-out is bounded.
- Upgrade Neon Pro ($19/mo) — 1000 conn cap, removes the headroom anxiety.

### E.3 — Pool-exhaustion behaviour

`postgres` library default: queries `await` for a free connection up to `idle_timeout * 2` (~40s effective with these settings), then throws. Inngest functions would retry per its standard policy (5 attempts, exponential backoff). Web requests would 500 to the user.

**No queue-depth metric / no observability** — Wave-1-Infra K14 already calls out no Sentry. Without it, pool-exhaustion is invisible.

---

## Part F — Drizzle-Patterns Audit

### F.1 — Drizzle-Zod integration

`grep drizzle-zod` returns **zero hits** across the repo. Server-Action inputs are not auto-validated against the schema; they're manually typed (e.g. `inviteAdmin(workspaceId: string, email: string)` in `membership.ts:80-83`). Manual `.trim()`, `.includes('@')`, etc.

**M-DB-10 (Mid):** install `drizzle-zod` + define `createInsertSchema` / `createSelectSchema` for the dozen tables that have user-facing writes. Wire into Server-Actions via `safeParse`. Reduces drift between schema and validation code.

### F.2 — `db.transaction()` usage

3 callers (`grep`):
- `packages/billing/src/credits.ts:121` — `consumeCredits` (FOR UPDATE on subscription + ledger insert)
- `packages/billing/src/credits.ts:232` — `grantCredits` (subscription update + ledger insert)
- `packages/inngest/src/functions/prepaid-credit-expirer.ts:88` — per-row prepaid expiry (update grant + ledger insert)

**Coverage gap:** the Stripe webhook handler (`route.ts`) issues multiple `db.update(schema.subscription)` + `db.insert(schema.creditLedger)` sequences NOT wrapped in a transaction — e.g. `route.ts:341-344` updates subscription tier without atomicity vs. the credit_ledger row that should follow. **S-DB-5 (Strong):** wrap subscription-state-changes in `db.transaction()`.

### F.3 — `consumeCredits` race-safety

`credits.ts:121-217` uses `SELECT … FOR UPDATE` on the subscription row. Good for serialising subscription-balance updates. **But:** the prepaid pool reads (`tx.select … from prepaidCreditGrant … orderBy expiresAt`) at line 146-155 do NOT use FOR UPDATE. Two concurrent consumes that drain the same prepaid grant can over-deduct:

```
T1: read pack X (10 credits), needs 7
T2: read pack X (10 credits), needs 7  
T1: update pack X → 3 remaining
T2: update pack X → 3 remaining  ← LOST UPDATE
```

The subscription FOR UPDATE serialises them ONLY IF both consumes hit the same workspace-subscription row (they do — both lock the row at `SELECT … FOR UPDATE`). So in practice the subscription-row lock acts as a workspace-wide mutex and serialises prepaid-pack reads too. **S-DB-5b (Strong)** — verify this is intentional via comment, and consider adding explicit FOR UPDATE on prepaid_credit_grant for defense-in-depth. Currently safe by side effect.

### F.4 — Raw SQL template-literal injection vector

`grep "sql\`"` finds 5 sites (excluding schema defaults):
1. `health-check.ts:75` — `sql\`SELECT 1\`` — static, no user input. Safe.
2. `credits.ts:126` — `sql\`SELECT … FROM subscription WHERE workspace_id = ${args.workspaceId} FOR UPDATE\`` — `args.workspaceId` is a parameterised binding (Drizzle's `sql\`\`` interpolation uses prepared params, NOT string concat). Safe.
3. `prepaid-credit-expirer.ts:62` — `sql\`SELECT … WHERE workspace_id = ${workspaceId} AND … payload->>'grantId' = ${grantId}\`` — parameterised. Safe.
4. `credit-aggregator.ts:45-60` — `sql\`SELECT … LIMIT ${BATCH_LIMIT}\`` — `BATCH_LIMIT` is a const (not user input). Safe.
5. `credit-aggregator.ts:147-157` — `sql\`… AND sub.stripe_customer_id = ${args.stripeCustomerId} …\`` — parameterised. Safe.

**No SQL-injection vectors found.** Drizzle's `sql\`\`` template literal is parameterised by design.

### F.5 — Drizzle-Studio risk

`packages/db/package.json:31`: `"studio": "dotenv -e ../../.env -e ../../.env.local -- drizzle-kit studio"`. Reads `.env.local` (which can contain prod `DATABASE_URL` if a developer copy-pasted it). Studio binds to `localhost:4983` by default — local-only, no remote-access risk. **W-DB-4 (Weak):** add a check in the script that refuses to start if `DATABASE_URL` contains `neon.tech` or `prod`. Defense against accidental prod-data exposure during demo / pair-debug.

---

## Part G — Backup + Disaster Recovery

Wave-1-Infra C.5 already flagged "Neon PITR not configured" (Strong). This audit confirms + extends:

### G.1 — Current state

- **Neon plan:** assumed Free Tier (Wave-1 inferred). Free tier = 24h history window, no manual checkpoints.
- **Backup-restore drill:** none documented in `docs/operations/` (verified via `ls`).
- **No `pg_dump` cron / no S3 export job** observed in `packages/inngest/src/functions/`.

### G.2 — Required for DACH-B2B paying customers

| Tier | Recommendation |
|---|---|
| Pre-launch (zero paying customers) | Free OK if accepting 24h RPO risk. |
| First paying customer | **Neon Pro ($19/mo)** — 7-day PITR + branching. |
| 10+ paying customers / DPA committed RPO | Neon Scale ($69/mo) — 30-day PITR. |
| Enterprise / >100k MRR | Add weekly `pg_dump` → S3 in eu-central-1 (offsite backup, DR scenario). |

### G.3 — Cross-region DR

Neon is single-region per-database (the region is set at project create). **No DR plan exists** for a Neon-region outage. For DACH-B2B GDPR:
- Project in `eu-central-1` (Frankfurt) — verify.
- Cross-region replica is a Neon Enterprise feature only — out of solo-dev budget.
- **Realistic interim:** weekly `pg_dump` to S3 in `eu-west-1` (Ireland — still EU jurisdiction). RPO 7 days, RTO ~hours-for-restore. Document in DPA "best-effort DR" section.

### G.4 — Restore-drill checklist (recommended for pre-launch)

1. Create a Neon branch from `main` checkpoint (Pro plan required).
2. Run `pnpm db:migrate` against the branch URL.
3. Verify `__drizzle_migrations` table has 16 rows.
4. Sample 5 random tables, assert row-count > 0 for tables that should have data.
5. Run integration test suite against branch URL: `DATABASE_URL=<branch> pnpm test:integration`.
6. Delete branch.

---

## Severity-Indexed Summary

### Kill (2)

- **K-DB-1** Cross-tenant scan-leak via `scan.rootPath` joins — confirmed in `customers.ts:117-132`, `customers.ts:178-189`, `dal/galaxie.ts:168-174`. Same root cause as Wave-1-Auth K2. **Fix in Wave-1 Bundle-A.**
- **K-DB-2** Denormalised PII (`ip_address` + `user_agent`) survives user-delete in 3 audit-trail tables. `schema.ts:236-237` `install_decision`, `schema.ts:358-359` `apply_action`, `schema.ts:586-587` `dpa_acceptance`. Fix: app-level scrub on user-delete (Bundle-A S15 implementation MUST include this).

### Strong (5)

- **S-DB-1** Pool-math undercounted (~60-80 realistic vs. ~32 in Wave-1-Infra C.7). `client.ts:29` `max: 10`. Mitigate by using Neon pooler endpoint + lowering `max` to 5.
- **S-DB-2** Six hot-query indices missing — most-impactful is `scan (workspace_id, created_at DESC)`. Files: see Part C table.
- **S-DB-3** Schema-snapshot drift since 0011 (`packages/db/drizzle/meta/` only has 0000-0011). `drizzle-kit check` cannot verify 0012-0015. Plus hand-written 0013 (DROP TABLE subscription CASCADE) needs the pre-flight gate verified.
- **S-DB-4** Neon PITR not configured + no DR drill — same as Wave-1-Infra C.5. Restate: $19/mo gate before first paying customer.
- **S-DB-5** Stripe-webhook handler issues multi-statement updates outside `db.transaction()`. `route.ts` subscription state-changes can fail partway and leave inconsistency. Plus `consumeCredits` prepaid-pool reads safe-by-side-effect, not by design — document or harden.

### Mid (10)

- **M-DB-1** `verification` table — no index on `identifier`, no TTL cron.
- **M-DB-2** `repo` table — no `(workspace_id, root_path)` UNIQUE — silently allows duplicates.
- **M-DB-3** `membership` — UNIQUE-on-nullable lets duplicate email-invites slip through; needs partial unique index.
- **M-DB-4** `webhook_event` — no index on `received_at` (audit-trail-export sorts on it).
- **M-DB-5** `event` table — comment says "7d retention" but no cron exists.
- **M-DB-6** `membership.user_id` CASCADE inconsistent with 0015 SET NULL on other user-FKs — decide policy.
- **M-DB-7** `webhook_event.payload` jsonb retains GitHub author username — GDPR Art. 17 says scrub on user-delete (if user-author is identifiable EU subject).
- **M-DB-8** Workspace ownership-transfer on user-delete — DAL function not implemented + no fallback business rule (what if no other owner?).
- **M-DB-9** `scan-status.ts:45` joins on `workspace.owner_id` — no index; also Wave-1-Auth K6 owner-only auth gap.
- **M-DB-10** No `drizzle-zod` integration — manual input validation across Server-Actions.

### Weak (4)

- **W-DB-1** `stripe_meter_event_log.identifier varchar(80)` joined with `credit_ledger.id::text` — cast prevents index use; consider uuid type.
- **W-DB-2** `stripe_meter_event_log` has both `identifier=ledger.id` and unused `credit_ledger_id` — clarify dual purpose.
- **W-DB-3** Cascade-order on user-delete unspecified by Postgres — document the invariant (currently safe at COMMIT).
- **W-DB-4** `drizzle-kit studio` reads `.env.local` — add prod-DB-URL refusal in the script.

### Exceptional (2)

- **E-DB-1** `stripe_event.id` PK (Stripe event id) — idempotent upsert design.
- **E-DB-2** `credit_ledger` append-only with denormalised `balance_after` — O(1) balance reads, full ledger history retained.

---

## Suggested Sub-Plan Bundles

| Bundle | Items | Effort |
|---|---|---|
| **DB-Hot-Index** (Strong) | S-DB-2 — add 6 missing indices. Single migration file. | 0.5 dev-day |
| **DB-GDPR-Cleanup** (Kill+Mid) | K-DB-2 + M-DB-7 + M-DB-8 — app-level PII-scrub on user-delete; ownership-transfer DAL; webhook-payload-scrub. | 1.5 dev-days. Belongs in Bundle-A alongside S15 Account-Delete. |
| **DB-Migration-Hygiene** (Strong) | S-DB-3 — regenerate drizzle-kit snapshot from current 0015 state; A.3 cutover (Wave-1) for buildCommand decoupling. | 1 dev-day |
| **DB-Transactional-Hardening** (Strong) | S-DB-5 — wrap stripe-webhook subscription state-changes in transactions. | 0.5 dev-day |
| **DB-Backup-Drill** (Strong) | S-DB-4 — Neon Pro upgrade + restore-drill checklist signoff. | 0.25 dev-day code + Neon Pro subscribe |
| **DB-Polish** (Mid + Weak) | M-DB-1/2/3/4/5/6/9/10 + W-* — composite migration + drizzle-zod intro. | 1 dev-day |

Critical-path before paying customers: **DB-Hot-Index** + **DB-GDPR-Cleanup** + **DB-Backup-Drill** = ~2.5 dev-days.

---

End of Wave-2 Sub-3 DB Schema + Migration Deep-Audit.
