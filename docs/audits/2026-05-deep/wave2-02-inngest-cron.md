# Wave-2 Audit 02 — Inngest Functions + Cron Deep-Dive

> Generated: 2026-06-06
> Scope: Production-grade durability for every Inngest function + cron
> Domain: function inventory · happy-path + failure-mode tracing · cron health · signing-key enforcement · function-timeout vs Vercel-timeout · observability · DB-race conditions
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}
> Method: read-only, file:line citations, references Wave-1 findings where overlap exists

---

## TL;DR — Production-Readiness Matrix (Inngest layer)

| Area                                    | Status | Headline                                                                                                |
|-----------------------------------------|--------|---------------------------------------------------------------------------------------------------------|
| A. Function inventory                   | 🟡     | Wave-1 said "5 functions" — confirmed. Zero `concurrency`, zero `onFailure`, zero `retries` overrides anywhere. |
| B. Critical-path tracing                | 🔴     | `audit-requested` has a fatal cross-instance bug (local-disk paths can't be re-read by a separate Inngest worker); credit-aggregator polls dead data (Wave-1 carry); prepaid-expirer warning email is fire-and-forget; stripe-reconcile pages 5000 subs in a hot loop. |
| C. Cron health                          | 🟡     | All 4 crons run on Inngest UTC. No DACH-DST awareness (matters for the 02:00 / 03:00 jobs). `auto-track-repos` cron is mis-named "every 4h" but actually fires at 0:00/4:00/8:00/12:00/16:00/20:00 UTC. |
| D. INNGEST_SIGNING_KEY enforcement      | 🔴     | Wave-1 B-K1 reaffirmed — no `signingKey`, no `runtime`, no `dynamic`, no `maxDuration`, no 503-guard. Stripe-webhook, install-webhook, notify-update all have the guard pattern; `/api/inngest` is the only outlier. |
| E. Function-timeout                     | 🔴     | `audit-requested` "audit" step calls `runAudit({ includeLLM: true })` synchronously — one step, no decomposition, potentially >300s on Deep-intensity. `stripe-reconcile` could span >300s if `pageCount<50` ever loaded.  |
| F. Observability                        | 🔴     | No alerting on any of: signing-key failure, function dead-letter, cron-skip, partial-write. Failure surface is silent. |
| G. DB-race conditions                   | 🟠     | `audit-requested` consume-credits + persist are non-atomic across step retries → ledger double-debit possible. `auto-track-repos` `poll-${repoId}` step inserts a scan row WITHOUT `audit/requested` send being in the same step → orphaned `queued` scans on retry. |

**Bottom line:** the 2026-05-22 launch is **blocked** by D (signing-key) and B (cross-instance audit-requested path), plus the Auto-Overage Kill from Wave-1-Payment that this audit cannot fix from the Inngest layer alone.

---

## Part A — Inngest Function Inventory

Verified against `packages/inngest/src/functions/index.ts:1-14`. **Five functions exist** (matches Wave-1 count). Detailed inventory:

### A.1 — `audit-requested`

| Property        | Value                                                                 |
|-----------------|-----------------------------------------------------------------------|
| File            | `packages/inngest/src/functions/audit-requested.ts:34-188`            |
| ID              | `audit-requested`                                                     |
| Trigger         | event `audit/requested`                                               |
| Purpose         | Background scan + LLM audit. Pushed when probe.files > 30 (`apps/web/src/lib/audit-action.ts:158` `BACKGROUND_THRESHOLD`). |
| Inputs          | `{ scanId, rootPath, intensity?, workspaceId?, byokFlag? }` (`audit-requested.ts:16-22`) |
| DB writes       | `scan` (running → complete/failed), `finding` (insert N), `audit_run_cost` (insert 1), `credit_ledger` (insert via `consumeCredits`), `event` (publish audit.completed/failed) |
| Stripe calls    | None directly. Indirect via `runAudit → @vk/llm` which writes `ai_usage_event` rows (and the Stripe meter for AI markup is **never** submitted — see Wave-1-Payment). |
| Email sends     | None.                                                                 |
| Idempotency     | **Inngest-level only** — Inngest event_id deduplicates duplicate `audit/requested` sends within ~24h. Function body has NO business-key idempotency (no `ON CONFLICT` on scan row, no check whether `status='complete'` before re-running). See §G.1. |
| Retry policy    | Inngest default (4 attempts, exponential backoff). **Per-step retries are catastrophic** — see §B.1 failure-mode F2. |
| Concurrency     | **Not set** — Inngest default = unlimited within the account quota. No per-workspace lock. Two concurrent `audit/requested` events for the same scanId would both run end-to-end (Inngest dedupes only on event-id, not on `data.scanId`). |
| Timeout         | **Not set** — Inngest function-level default. Each step is a separate HTTP call; the underlying Vercel function has 300s (Pro plan default per knowledge-update §2026-02). See §E.1. |
| `onFailure`     | **Not set.** A scan that exhausts retries silently goes to dead-letter — there is NO email to the workspace owner, no row update beyond what the `catch` block did on the LAST attempt. |

### A.2 — `auto-track-repos`

| Property        | Value                                                                 |
|-----------------|-----------------------------------------------------------------------|
| File            | `packages/inngest/src/functions/auto-track-repos.ts:22-101`           |
| ID              | `auto-track-repos`                                                    |
| Trigger         | cron `0 */4 * * *` (every 4h at :00) — UTC                            |
| Purpose         | Poll all `repo` rows with `github_full_name` set, compare HEAD SHA, enqueue audit if changed. |
| Inputs          | None (cron).                                                          |
| DB writes       | `repo` (set `last_polled_at` + `last_commit_sha`), `scan` (insert queued). Sends `audit/requested` events. |
| Stripe calls    | None.                                                                 |
| Email sends     | None.                                                                 |
| Idempotency     | **None.** If the function partially completes and retries, scans get duplicated for any repo whose SHA-update was persisted but whose `inngest.send` failed. See §B.2 failure-mode F2. |
| Retry policy    | Inngest default.                                                      |
| Concurrency     | **Not set** — but a cron only fires one instance at a time, so this is OK at the cron-trigger level. The internal `for (const r of repos)` loop is sequential. |
| Timeout         | **Not set.** With 30 repos × ~500ms per GitHub fetch = 15s typical. Worst-case at 100 repos × 2s = 200s — close to but under 300s. |
| `onFailure`     | **Not set.**                                                          |

### A.3 — `credit-aggregator`

| Property        | Value                                                                 |
|-----------------|-----------------------------------------------------------------------|
| File            | `packages/inngest/src/functions/credit-aggregator.ts:104-128`         |
| ID              | `credit-aggregator`                                                   |
| Trigger         | cron `*/5 * * * *` (every 5 min) — UTC                                |
| Purpose         | Flush `credit_ledger` rows with `reason='overage'` to Stripe Meter Events. |
| Inputs          | None (cron).                                                          |
| DB writes       | `stripe_meter_event_log` (insert per submitted row).                  |
| Stripe calls    | `stripe.billing.meterEvents.create({ event_name: "audit_credit_overage", identifier, ... })` — one per pending row. |
| Email sends     | None.                                                                 |
| Idempotency     | **Two layers, both correct in isolation.** (a) Drizzle insert into `stripe_meter_event_log` uses `.onConflictDoNothing({ target: identifier })` (`credit-aggregator.ts:97-99`). (b) Stripe Meter-Event API dedupes on `identifier` server-side. |
| Retry policy    | Inngest default; per-row safety: if Stripe call succeeds but DB insert fails, the next run re-calls Stripe with the same identifier (Stripe dedupes), then succeeds on the DB insert. **Mostly safe.** |
| Concurrency     | **Not set** — single cron instance, OK. |
| Timeout         | **Not set.** `BATCH_LIMIT = 100` (`:16`) — 100 Stripe API calls per run, ~200-300ms each = ~20-30s worst case. Comfortably under 300s. |
| `onFailure`     | **Not set.** |

**KEY FINDING (carry-over from Wave-1-Payment K11):** the `credit_ledger.reason='overage'` rows that this function polls **are never inserted by any code path** — grep across all of `/packages` and `/apps` finds zero call sites that write that reason. `consumeCredits` (`packages/billing/src/credits.ts:203-209`) writes `delta: -args.amount, reason: args.reason` where `args.reason` is always `'audit_consume'` from `audit-action.ts:354-356` and `audit-requested.ts:70-77`. **The cron polls a perpetually empty result set.** This cron is a no-op in production today. See §B.3.

### A.4 — `prepaid-credit-expirer`

| Property        | Value                                                                 |
|-----------------|-----------------------------------------------------------------------|
| File            | `packages/inngest/src/functions/prepaid-credit-expirer.ts:154-163`    |
| ID              | `prepaid-credit-expirer`                                              |
| Trigger         | cron `0 2 * * *` (02:00 UTC daily)                                    |
| Purpose         | (a) expire `prepaid_credit_grant` rows where `expires_at < now()`; (b) send 1-day warning emails for grants expiring in (now, now+24h]. |
| Inputs          | None (cron).                                                          |
| DB writes       | `prepaid_credit_grant.credits_remaining = 0`, `credit_ledger` (insert expiration row), `event` (insert `prepaid_pack_warning`). |
| Stripe calls    | None.                                                                 |
| Email sends     | `PrepaidPackExpireWarning` via `sendTransactionalEmail` (`prepaid-credit-expirer.ts:125-135`). |
| Idempotency     | **Mixed.** Expiry-pass is idempotent via the `credits_remaining > 0` guard. Warning-pass uses `hasRecentWarning` (`:56-71`) which checks the `event` table for a `prepaid_pack_warning` of this grant in the last 48h. **Race:** if the cron retries within the same hour, two warning emails could be sent because the `event` insert happens AFTER the email send (`:137-145`), so a crash between send + insert duplicates the email. |
| Retry policy    | Inngest default.                                                      |
| Concurrency     | **Not set** — single cron instance. |
| Timeout         | **Not set.** `BATCH_LIMIT = 200` rows × ~50ms per email-send = 10s. Safe. |
| `onFailure`     | **Not set.** |

### A.5 — `stripe-reconcile`

| Property        | Value                                                                 |
|-----------------|-----------------------------------------------------------------------|
| File            | `packages/inngest/src/functions/stripe-reconcile.ts:36-145`           |
| ID              | `stripe-reconcile`                                                    |
| Trigger         | cron `0 3 * * *` (03:00 UTC daily)                                    |
| Purpose         | Paginate Stripe subscriptions, compare tier/status to local `subscription` table, publish `audit.failed` event with drift details. **Detection-only**, no auto-fix (Wave-1 Strong, confirmed). |
| Inputs          | None (cron).                                                          |
| DB writes       | `event` (insert per drift row).                                       |
| Stripe calls    | `stripe.subscriptions.list({ status: "all", limit: 100, starting_after })` — up to 50 pages = 5000 subs. |
| Email sends     | None — drift events go to the `event` table only. |
| Idempotency     | **Read-only logical operation.** Re-running just regenerates `event` rows, which is noisy but safe. There IS no idempotency key, so detection events stack up day-over-day. |
| Retry policy    | Inngest default. Each `page-${pageCount}` step retries on Stripe 5xx — see §B.4 failure-mode F2. |
| Concurrency     | **Not set** — single cron instance. |
| Timeout         | **Not set.** 50 pages × ~400ms Stripe API + ~50ms per DB lookup × 100 subs = potentially 40-90s. Safe under 300s. |
| `onFailure`     | **Not set.** |

### A.6 — Functions/crons that DO NOT exist (Wave-1 reality-check)

- No `packages/inngest/src/crons/` directory exists. All cron triggers live alongside event-triggered functions in `functions/`.
- No bounce/complaint handler (Resend webhook back into Inngest).
- No DLQ-replay function — failed events sit in Inngest dead-letter view forever or until manually replayed via Inngest CLI/dashboard.
- No GDPR data-retention purge cron. `scan.raw_scan` + `raw_report` jsonb grow unbounded.

---

## Part B — Critical-Path Functions — Deep-Dive

### B.1 — `audit-requested` (the user-facing background audit path)

#### Happy path

1. User pastes a local path / GitHub URL in the landing form. `auditAction` (`apps/web/src/lib/audit-action.ts:82`) handles the request.
2. For local paths only: if `probe.files.length > 30`, `enqueueBackgroundAudit` (`audit-action.ts:258-291`) inserts a `scan` row with `status='queued'` and sends `audit/requested` event.
3. Inngest worker receives the event in a **separate Vercel function instance** (post-launch, this is a different region/container than the request that enqueued).
4. `mark-running` step: `UPDATE scan SET status='running'`.
5. `scan` step: `scanRepository(rootPath)`.
6. `audit` step: `runAudit(scan, { includeLLM: true, intensity, meteringContext })`.
7. `consume-credits` step: `consumeCredits(...)`.
8. Inline (NOT in a step): aggregate `ai_usage_event` cost rows, insert `audit_run_cost`.
9. `persist` step: update `scan` to complete + insert `finding` rows.
10. `publish-event` step: insert `event` row of type `audit.completed`.

#### Failure modes

**[Kill] F1 — Cross-instance file-access crash for local-disk audits**

The background path is only taken for local-disk paths (the GitHub URL path runs entirely synchronously in `auditGithubUrl` and `cleanupTempDir` is in `finally`). For local-disk paths, `rootPath` (`audit-action.ts:282-283`) is a server-side absolute filesystem path on the instance that **received** the request.

When Inngest dispatches the `audit/requested` event, the function runs on a **different Vercel Fluid Compute instance**, which has no shared `/tmp`, no shared filesystem, and the resolved local path **does not exist there**.

`scan` step (`audit-requested.ts:53`) calls `scanRepository(rootPath)`. `scanRepository` will return an empty `{ files: [] }` because `fast-glob` finds nothing. `runAudit` then runs against an empty parse tree. The scan completes successfully with zero findings. **Silent data-loss bug.**

The only reason this hasn't surfaced as a bug today is the `BACKGROUND_THRESHOLD = 30` gate (`packages/inngest/src/client.ts:7`). On the dev server (local single-process Inngest), the `rootPath` IS visible. In Vercel-prod, it is not.

Severity: **Kill** for prod. Did not show in Wave-1 because Wave-1 didn't trace cross-instance filesystem semantics.

**Fix:** The background path should ONLY accept GitHub URLs (or future S3-fetched zip URLs). Either:
- (a) Remove the local-disk background path entirely — `audit-action.ts:152-176` should `runForegroundAudit` even for >30 files.
- (b) For GitHub URLs >30 files, move the zip-fetch INTO `audit-requested`, not before. The Inngest worker becomes self-contained.

**[Strong] F2 — Per-step retry under default policy double-charges credits**

If the `consume-credits` step succeeds (DB transaction commits, credit_ledger row inserted, `subscription.credits_used_this_period` incremented) but a transient network failure causes Inngest to mark the step as failed, the SAME step will retry on the next invocation. The `consumeCredits` function has no business-key idempotency on `referenceId=scanId` — it appends a NEW negative-delta `credit_ledger` row. Result: the workspace is debited twice for the same scan.

The `audit_run_cost` insert is similarly unprotected: it has a `UNIQUE` constraint on `scan_id` (`packages/db/src/schema.ts:653`), but the insert (`audit-requested.ts:85-92`) does **not** use `.onConflictDoNothing`. A retry after `consume-credits` succeeded but before `persist` ran would throw a duplicate-key error on the second attempt — failing the function permanently mid-pipeline. Scan row is then stuck in `running` until the catch block fires on the LAST retry attempt.

Severity: **Strong** — data-correctness issue.

**Fix:**
1. Wrap `consume-credits` + `audit_run_cost` insert + scan-row finalize in a single Drizzle transaction.
2. Use idempotency-key on `consumeCredits` via an existence-check before the negative-ledger insert (e.g., `SELECT 1 FROM credit_ledger WHERE workspace_id=? AND reason='audit_consume' AND reference_id=?`).
3. Add `.onConflictDoNothing({ target: schema.auditRunCost.scanId })` on the `audit_run_cost` insert.

**[Strong] F3 — `mark-failed` step itself can fail; dead-letter scan stuck `running`**

The `try { ... } catch (err) { await step.run("mark-failed", ...); throw err; }` pattern (`audit-requested.ts:160-186`) re-throws after attempting to mark the scan failed. If the `mark-failed` step ITSELF fails (DB outage), Inngest will retry the whole function from scratch. The first surviving attempt re-enters the `try` block, re-runs `scan` + `audit` + `consume-credits` — which now needs a re-debit, see F2.

Worse: if after all retries are exhausted, the LAST attempt's `mark-failed` still fails, the scan stays at `status='running'` forever, with the workspace credits gone, no audit-completed event, no audit-failed event. UI shows "spinning" forever.

There is NO `onFailure` handler that would fire after exhausting retries to write a terminal `failed` state.

Severity: **Strong**.

**Fix:** add an `onFailure` to the function config (Inngest supports a per-function failure handler that runs in a separate step-context):

```ts
inngest.createFunction({
  id: "audit-requested",
  triggers: [{ event: "audit/requested" }],
  onFailure: async ({ event, error }) => {
    const scanId = event.data.event.data.scanId;
    await getDb().update(schema.scan).set({
      status: "failed",
      failureReason: `terminal: ${error.message}`,
      completedAt: new Date(),
    }).where(eq(schema.scan.id, scanId));
  },
}, ...);
```

### B.2 — `auto-track-repos` (4h cron)

#### Happy path

1. Cron fires at :00 of every 4h slot.
2. `fetch-tracked-repos` step pulls all repos with non-null `github_full_name`.
3. For each repo, `poll-${repoId}` step: GitHub HEAD-SHA fetch → if changed, insert `scan` (queued) + update repo SHA + send `audit/requested` event.

#### Failure modes

**[Strong] F1 — GitHub anonymous rate-limit (60 req/h per IP) shared across all repos**

`fetchLatestCommitSha` (`auto-track-repos.ts:103-122`) uses unauthenticated `api.github.com`. Anonymous calls share a **60-req/hour per source-IP limit**, and Vercel Fluid-Compute instances rotate IPs. At 100 repos × 6 polls/day = 600 calls/day, this is fine in steady-state but a 100-repo single-tick run will hit rate-limit mid-loop. The catch-block (`:118-121`) swallows the error and returns `null`, which the calling step interprets as "no change" — silent data-loss (we miss a real SHA update for that polling window).

There is NO retry on a fresh window: `last_polled_at` is updated to "now" even when the SHA fetch was rate-limited.

Severity: **Strong**.

**Fix:** authenticate with a GitHub App token if `repo.github_installation_id` is set (already in schema). For unauthenticated repos, detect 403 + `X-RateLimit-Remaining: 0` and SKIP the `last_polled_at` update so the next tick retries.

**[Strong] F2 — Partial-write on cron retry creates orphaned `queued` scans**

Inside `poll-${repoId}` step (`auto-track-repos.ts:48-92`):
- Line 66-77: inserts `scan` row (queued).
- Line 81-84: updates `repo.last_commit_sha` to the new SHA.
- Line 86-89: `inngest.send` for `audit/requested`.

If step succeeds at line 77 but throws at line 89 (Inngest API hiccup), Inngest retries the WHOLE step. The retry sees `r.lastCommitSha` still at the OLD value (DB rollback was per-statement, not per-step), so line 57's equality check fails, line 66-77 inserts ANOTHER `scan` row, and again tries to send the event. End state: N orphaned `scan` rows in `queued` for each retry attempt.

Inngest step retries are **at-least-once**; the code assumes at-most-once.

Severity: **Strong**.

**Fix:** wrap the three DB+API operations in a single Drizzle transaction; capture the inserted scanId; do `inngest.send` AFTER the transaction commits, but use `.send` with an `event.id` set to a deterministic value like `audit-requested:${scanId}`. Inngest dedupes on event-id within ~24h.

### B.3 — `credit-aggregator` (5min cron)

#### Happy path

Function fires every 5 min; `fetchPending` (`credit-aggregator.ts:35-67`) runs a LEFT JOIN looking for `credit_ledger` rows with `reason='overage'` that have no matching `stripe_meter_event_log` row. For each found row, submit Stripe Meter Event + log it.

#### Failure modes

**[Kill] F1 — Polls dead data; Auto-Overage Stripe revenue path is silently broken**

As established in §A.3 and Wave-1-Payment K11: NO code path writes `credit_ledger.reason='overage'`. `consumeCredits` always uses `reason='audit_consume'` (callers: `audit-action.ts:355`, `audit-requested.ts:74`). The Auto-Overage feature (gated by `subscription.auto_overage_enabled`) has no code that:
- detects a credit-zero state during `consumeCredits`
- if `autoOverageEnabled=true`, inserts a separate `credit_ledger` row with `reason='overage'`

So the cron runs every 5 min for the lifetime of the deployment and the `pending.length === 0` early-return (`credit-aggregator.ts:115`) is the only path it ever takes.

The marketing/billing copy on `/pricing` documents an Auto-Overage feature that is **not implemented end-to-end**. This is fraud-adjacent if a customer enables it expecting overage billing.

Severity: **Kill** (carry-over but escalated — Wave-1 caught the "rows never exist" but didn't trace the customer-facing implications).

**Fix:** Out-of-scope for Inngest layer. The fix lives in `consumeCredits` (`packages/billing/src/credits.ts`): when `allowOverage=true` AND the cap is exceeded, split the delta into a subscription-debit + an overage-debit, write TWO ledger rows (one `audit_consume`, one `overage`). Document this in a new ADR + a follow-up payment-flow plan.

**[Mid] F2 — Stripe meter-event timestamp drift on cron retry**

`submitRow` (`credit-aggregator.ts:69-101`) uses `timestamp: Math.floor(Date.now() / 1000)` — the time when the cron submission ran, NOT the time the original `credit_ledger` row was inserted. This means usage measured "this period" can attribute to the wrong Stripe billing cycle if a row sits for >5 min crossing a period boundary (Stripe meters bucket by event timestamp).

Severity: **Mid** — relevant only when the function eventually has work to do (post-F1 fix).

**Fix:** pass `cl.created_at` from `fetchPending` and use `Math.floor(row.createdAt.getTime() / 1000)` for the meter event.

**[Mid] F3 — `flushPendingForCustomer` race vs cron**

`flushPendingForCustomer` is called synchronously from `invoice.created` webhook (`apps/web/src/app/api/stripe/webhook/route.ts:307`). If a cron fires at the exact same moment, both the webhook + cron run `fetchPending`-style queries simultaneously, get the same row-set, and try to `stripe.billing.meterEvents.create` with the same `identifier`. Stripe-side dedupe rescues us (returns success without double-billing); the DB-side `.onConflictDoNothing` rescues the second `stripe_meter_event_log` insert. **Safe, but only because both upstream APIs have dedupe.**

There is no DB-level lock on `credit_ledger` rows during the submit-pass — `FOR UPDATE` is not used.

Severity: **Mid** (no real harm because of double-dedupe, but architecturally fragile).

### B.4 — `prepaid-credit-expirer` (daily 02:00 UTC)

#### Happy path

1. Pull all `prepaid_credit_grant` rows where `expires_at < now()` AND `credits_remaining > 0`.
2. For each: transactionally zero out remaining + insert expiration ledger row.
3. Pull all grants where `expires_at` ∈ `(now, now+24h]` AND `credits_remaining > 0`.
4. For each: check 48h-lookback for prior warning email; if not warned, send + insert `event` row.

#### Failure modes

**[Strong] F1 — Email-send then event-insert race (duplicate warning emails)**

`:125-148`:
```ts
const result = await sendTransactionalEmail({ ... });
if (result.ok) {
  await db.insert(schema.event).values({ ... type: 'prepaid_pack_warning' ... });
  warned += 1;
}
```

If `sendTransactionalEmail` succeeds (SMTP returns 250 OK) but the connection drops before the response is fully read, or if the function crashes between `sendMail` resolution and the `db.insert`, the next retry — at most 48h later given `WARNING_LOOKBACK_HOURS = 48` — would re-send the warning. The `between(...,now,soonCutoff)` predicate ensures the grant is still in the warning window for up to 24h, so this race is a real ~24h window.

Severity: **Strong** for trust / professionalism (customer gets two "expires tomorrow" emails).

**Fix:** flip the order — insert the `event` row FIRST (with status='pending-email'), then send, then update status='sent'. Or, use an idempotency-key on the email send itself (Resend supports `Idempotency-Key` header — not currently passed through `sendTransactionalEmail`).

**[Mid] F2 — Expiry transaction holds row-level lock during getCreditBalance**

`:88-104`:
```ts
await db.transaction(async (tx) => {
  ...
  const balance = await getCreditBalance(row.workspaceId, tx as unknown as Db);
  await tx.insert(schema.creditLedger).values({ ..., balanceAfter: balance.total });
});
```

`getCreditBalance` (`packages/billing/src/credits.ts:37-77`) issues TWO SELECTs against `subscription` + `prepaidCreditGrant`. With BATCH_LIMIT=200 grants, this is 400 extra queries inside the transactional loop. Each iteration locks the row being expired AND reads the workspace subscription. At launch scale this is fine; at 10k workspaces this becomes a bottleneck (each iteration = 2 lookups + 1 update + 1 insert = 4 statements × 200 rows = 800 statements in <1 cron tick).

Severity: **Mid** for launch scale; **Strong** at 10k+ workspaces.

**Fix:** batch the expiry pass — group rows by workspace, call `getCreditBalance` once per workspace.

**[Mid] F3 — Cron retry within 24h triple-counts expiration**

The expiry-pass is gated by `credits_remaining > 0`. Once set to 0, a retry is a no-op on the grant row. **But the ledger row is inserted UNCONDITIONALLY inside the transaction.** If the transaction commits the ledger insert but then the cron crashes BEFORE the SAME tick's email batch, the cron will retry. Retry re-enters `expireOnce` — the `dueRows` query now returns ZERO matching rows (because `credits_remaining = 0`), so no double-ledger insert. **Actually safe.** Strike F3.

### B.5 — `stripe-reconcile` (daily 03:00 UTC)

#### Happy path

Paginate up to 50 pages × 100 subs = 5000 subs. For each sub: compare to local DB row; if drift, insert `event` row.

#### Failure modes

**[Strong] F1 — `pageCount < 50` hard ceiling silently truncates large accounts**

At 50 pages × 100 = 5000 subscriptions. Wave-1-Payment notes there's likely <100 prod-subs at launch. But the cap is silent: if Stripe has 5001+ subs, the 5001st onwards never gets reconciled, and `event` table never logs a drift for them. No alert.

Severity: **Strong** (correctness ceiling that's not enforced).

**Fix:** if `pageCount === 50 && page.has_more`, write a structured `console.error` + publish a `system.reconcile-truncated` event so operators see the ceiling getting hit.

**[Strong] F2 — Stripe 429 retries are page-scoped, not request-scoped**

Each `page-${pageCount}` is its own step. If page-3 returns 429, that step retries 4 times with Inngest exponential backoff, but the underlying `stripe.subscriptions.list({ starting_after: cursor })` uses the SAME `cursor` (closure-captured). At Inngest retry, the NEW step invocation re-evaluates the closure — but `cursor` is a `let` in the outer function scope. On step-level retry, the FUNCTION resumes from after the step boundary, so `cursor` is restored to the pre-step value via Inngest's step-state replay. **Safe in theory** — but only if Inngest's replay model perfectly serialises the captured `cursor`. This is documented Inngest behavior; trust it.

The real failure: if Stripe is having a sustained outage, all 4 retries fail, and the function dies at page-3. The next day's cron starts fresh from page-0 — pages 4-50 are never seen for THAT day's snapshot. There's no backfill.

Severity: **Strong**.

**Fix:** wrap the whole pagination in a "for each chunk-of-N-pages, save cursor to a DB checkpoint table" pattern. Or accept the daily-cadence rerun as the recovery and document it.

**[Mid] F3 — `audit.failed` is the wrong event type for subscription drift**

`:113-130` publishes `type: "audit.failed"` for a subscription-drift event. The discriminator in `events.ts:3-7` only knows about `"audit.completed" | "audit.failed" | "repo.auto-tracked" | "repo.access-changed"`. **Drift is being shoehorned into the audit-failed bucket** — downstream consumers (Galaxie real-time UI) will see ghost audit-failed alerts for billing-drift events.

Severity: **Mid** — semantic-error / future-tech-debt.

**Fix:** add `"subscription.drift"` to the EventType union.

---

## Part C — Cron Health

| Function                | Cron               | Schedule (UTC)             | DACH local (CET / CEST)         | Notes                                                  |
|-------------------------|--------------------|----------------------------|---------------------------------|--------------------------------------------------------|
| `auto-track-repos`      | `0 */4 * * *`      | every 4h, on the hour       | 01:00/05:00/09:00/13:00/17:00/21:00 (CET); +1h CEST | Code comment claims "every 4h"; cron-string IS valid every-4h syntax (NOT `0 0 */4 * *` which would be wrong). ✅ |
| `credit-aggregator`     | `*/5 * * * *`      | every 5 min                | every 5 min                      | Valid. Resource-thin; OK to leave despite F1 dead-data finding.  |
| `prepaid-credit-expirer`| `0 2 * * *`        | daily 02:00 UTC            | 03:00 CET / 04:00 CEST          | DST-sensitive — see C.1.                              |
| `stripe-reconcile`      | `0 3 * * *`        | daily 03:00 UTC            | 04:00 CET / 05:00 CEST          | DST-sensitive — see C.1.                              |

### C.1 — DACH-DST awareness [Mid]

All four crons run on Inngest UTC. The two daily-runner crons (`02:00` and `03:00` UTC) shift between 03:00 and 04:00 local DACH time twice a year (last Sunday in March / October).

**Impact:**
- Customer perception: "credit expires tomorrow" warning email arriving at 04:00 CEST in summer (vs 03:00 CET in winter) is fine, but the WARNING is tied to a 24h window — when DST switches forward (March), one cron tick is **skipped** (Inngest crons don't auto-replay missed UTC windows when local DST shifts). When DST shifts back (October), the tick is **doubled** (cron fires at 02:00 UTC, local CET was 03:00, then back to 02:00 CET, same UTC = single fire actually). Inngest internally only sees UTC, so the actual behaviour is: cron runs reliably every UTC day, customer experience is "warning arrives in the small hours, time shifts by 1h twice a year." Not a real issue.

**Real issue:** the 24h `between(now, soonCutoff)` predicate in `prepaid-credit-expirer.ts:108-118` is also UTC-aligned. If the customer's `expiresAt` was inserted at a time computed in CET (e.g., `addYears(now, 1)` from a webhook firing at 23:30 CEST = 21:30 UTC), the expiry can fall on the wrong UTC-day for the warning pass. There's a 1-2h window each year where a grant could expire WITHOUT a warning. Edge-case.

### C.2 — Cron schedule overlap / catch-up

Inngest crons:
- Do NOT backfill missed windows by default (if the Inngest worker is down at 02:00 UTC, the 02:00 run is **lost forever**).
- Do NOT alert on skipped windows (you would have to look at the Inngest dashboard).

**Vercel Cron** would have similar behaviour, but is NOT in use here (`vercel.json` has no `crons` block; all four crons are Inngest-internal — confirmed at `vercel.json:1-6`).

### C.3 — Cron-string validity

All four cron-strings are syntactically valid POSIX cron (verified by mental execution + matching Inngest documentation). Comments in the source files correctly describe the schedule.

---

## Part D — INNGEST_SIGNING_KEY Enforcement Deep-Dive

### D.1 — Current code

`apps/web/src/app/api/inngest/route.ts:1-4`:

```ts
import { serve } from "inngest/next";
import { inngest, functions } from "@vk/inngest";

export const { GET, POST, PUT } = serve({ client: inngest, functions });
```

`packages/inngest/src/client.ts:18-21`:

```ts
export const inngest = new Inngest({
  id: "validationkit",
  // The dev server picks this up automatically when INNGEST_BASE_URL is set.
});
```

The Inngest client is constructed at module-load with **no event-key, no signing-key, no env-key, no eventKey, no signingKey** passed explicitly. The SDK falls back to reading `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` from `process.env` at the time of the call.

### D.2 — What happens at runtime if `INNGEST_SIGNING_KEY` is unset in prod

1. Inngest Cloud sends a POST to `https://app.validationkit.app/api/inngest/...` with header `X-Inngest-Signature: t=…&s=…`.
2. `serve()` reads `process.env.INNGEST_SIGNING_KEY` at request-time → returns `undefined`.
3. The Inngest SDK behavior with unset signing-key in production: **either** (a) accepts the request unauthenticated (oldcontract), (b) returns 401 (newcontract since SDK v3.x+ which `inngest@^4.4.0` follows). Inngest 4.x DOES require signing-key in production — verified by source — so behavior is (b).
4. Inngest Cloud sees 401 → marks the deployment as "unreachable" → all background jobs queue up but never get processed → silent.

**No 503 fallback** unlike every other webhook (see D.4 below).

### D.3 — What happens if a non-Inngest source POSTs the endpoint

Without `runtime="nodejs"` declaration, Next.js may default to Node anyway (App-Router default is Node), but there is **no defense-in-depth**: nothing prevents an unauthenticated attacker from POSTing arbitrary `audit/requested` payloads. If Inngest's HEADERS check passes (the `X-Inngest-Signature` header is present), `serve()` verifies signature. If the signature is missing, `serve()` returns 401. **Safe in theory** as long as the SDK enforces. Trust matrix: we're trusting `inngest@^4.4.0` to never regress its signature check.

### D.4 — Comparison vs other webhooks (the 503-guard pattern)

| Route                          | 503-guard?                                        | `runtime`?            | `dynamic`?             | Signing-key explicit? |
|--------------------------------|---------------------------------------------------|------------------------|------------------------|------------------------|
| `/api/stripe/webhook`          | ✅ `STRIPE_WEBHOOK_SECRET` (`route.ts:73-78`)     | ✅ `"nodejs"`          | ✅ `"force-dynamic"`   | ✅ `secret` arg to `constructEvent` |
| `/api/install-webhook` (GitHub)| ✅ `GITHUB_APP_WEBHOOK_SECRET` (`route.ts:23-32`) | ❌ (defaults to nodejs)| ❌                     | ✅ `secret` arg to `verifyWebhookSignature` |
| `/api/notify-update`           | ✅ DB+Inngest both required (`route.ts:42-47`)    | ✅ `"nodejs"`          | ✅ `"force-dynamic"`   | ✅ `notifySecret` HMAC inline       |
| `/api/inngest`                 | ❌ none                                            | ❌                     | ❌                     | ❌ implicit via env-fallback         |

### D.5 — Recommended fix (mirror existing pattern) [Kill]

```ts
// apps/web/src/app/api/inngest/route.ts
import { NextResponse } from "next/server";
import { serve } from "inngest/next";
import { inngest, functions } from "@vk/inngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const signingKey = process.env.INNGEST_SIGNING_KEY;
const eventKey = process.env.INNGEST_EVENT_KEY;
const baseUrl = process.env.INNGEST_BASE_URL;

// Dev: INNGEST_BASE_URL set, no signing-key needed.
// Prod: INNGEST_SIGNING_KEY required, INNGEST_EVENT_KEY required.
if (!baseUrl && process.env.NODE_ENV === "production") {
  if (!signingKey || !eventKey) {
    // Don't crash module-load (Next.js needs the route exports). Fail-shut at request time:
    const guard = (): Response =>
      NextResponse.json(
        { error: "Inngest is not configured on this deployment. Set INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY." },
        { status: 503 },
      );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module.exports = { GET: guard, POST: guard, PUT: guard };
  }
}

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey,
});
```

**Caveats with the above pattern:**
- `module.exports` re-assignment is hacky in ESM. Cleaner: wrap `serve()`'s returned handlers in a fail-shut HOF that checks the env at each request.
- Module-load checking + request-time checking covers both startup-misconfig (alerts in build-logs) and per-request safety.

The above is suggestive — the **actual implementation must NOT use `module.exports = ...`** in an ESM module. The clean pattern:

```ts
import { NextResponse } from "next/server";
import { serve } from "inngest/next";
import { inngest, functions } from "@vk/inngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const isProdInngestEnabled =
  Boolean(process.env.INNGEST_EVENT_KEY) &&
  Boolean(process.env.INNGEST_SIGNING_KEY);
const isDevInngestEnabled = Boolean(process.env.INNGEST_BASE_URL);
const enabled = isProdInngestEnabled || isDevInngestEnabled;

const handlers = enabled
  ? serve({
      client: inngest,
      functions,
      signingKey: process.env.INNGEST_SIGNING_KEY,
    })
  : {
      GET: () => NextResponse.json({ error: "Inngest not configured." }, { status: 503 }),
      POST: () => NextResponse.json({ error: "Inngest not configured." }, { status: 503 }),
      PUT: () => NextResponse.json({ error: "Inngest not configured." }, { status: 503 }),
    };

export const { GET, POST, PUT } = handlers;
```

Severity: **Kill** — re-affirms Wave-1 B-K1. All Inngest functions silently break in prod without this guard.

---

## Part E — Function-Timeout vs Vercel-Function-Timeout

Vercel Fluid Compute default: **300s** (knowledge-update §2026-02 — was 60-90s in older docs). Pro plan parity with Enterprise on default timeout. Per `apps/web/src/app/api/events/stream/route.ts:12` we already declare `maxDuration = 300` for the SSE route.

The Inngest serve route does NOT declare `maxDuration`. Inngest's design assumes the function HTTP-call returns quickly when it's a step boundary (the HTTP call carries state to step N, returns immediately). **But the very FIRST invocation of a function — and any synchronous-region step — runs the body until the next step boundary, which CAN exceed 300s.**

| Function                | Worst-case single-step duration | Vercel timeout risk |
|-------------------------|---------------------------------|---------------------|
| `audit-requested`       | `audit` step calls `runAudit({ includeLLM: true, intensity: 'deep' })`. Deep audits invoke multiple LLM calls in series, each 5-20s, plus deterministic-rules pass on a large repo. Worst-case: 5 LLM calls × 20s + 30s file-parse = 130s. **Within budget, but tight.** | 🟡 Tight; 50% headroom on Deep-intensity 500-file repos. |
| `auto-track-repos`      | `fetch-tracked-repos` step is one DB query (~50ms). Each `poll-${id}` step does one GitHub fetch + one DB write + one Inngest send = ~1.5s. With 100 repos total, the LOOP runs sequentially in the outer function, but each step is a separate HTTP-call to the Inngest serve endpoint, so each step IS bounded by 300s individually. | 🟢 No issue. |
| `credit-aggregator`     | `submit-${ledgerId}` step = 1 Stripe API + 1 DB write = ~400ms. | 🟢 No issue. |
| `prepaid-credit-expirer`| Single `expire-prepaid` step. Worst-case 200 expiries × ~50ms (DB tx) + 200 warnings × ~200ms (email send) = ~50s. | 🟡 Within budget but the email-send loop is the bottleneck. |
| `stripe-reconcile`      | Each `page-${n}` step = 1 Stripe API + 100 DB lookups + N event-publish = ~500ms-1.5s. | 🟢 No issue. |

### E.1 — `audit-requested` `audit` step exceeds 300s on large repos [Strong]

The `audit` step (`audit-requested.ts:62-64`) is a SINGLE `step.run("audit", () => runAudit(...))`. There is NO sub-step decomposition: file-parse, deterministic-rules, LLM-rule-1, LLM-rule-2, ... all run inside ONE step.

If we ever audit a repo with 1000+ AGENT.md/CLAUDE.md files and Deep-intensity does 8+ LLM calls × 30s each, we hit Vercel's 300s wall. Inngest will mark the step failed, retry, hit the same wall again.

Severity: **Strong**.

**Fix:** decompose `audit` into:
- `audit-deterministic` step
- `audit-llm-rule-1` step ... `audit-llm-rule-N` step

Each sub-step's result accumulates into the report. Each is independently retryable AND each individually fits in 300s.

### E.2 — All Inngest functions should declare `maxDuration` explicitly [Mid]

The serve-route should declare `maxDuration = 300` to match the SSE route (which is the project's canonical "long-running" route). Future Vercel-default changes shouldn't surprise us.

---

## Part F — Background-Job Observability

### F.1 — Inngest dashboard alerts [Strong, missing]

There is no `docs/operations/` or `docs/runbooks/` entry for Inngest alerting. Search of `/docs/operations/` shows: `deploy.md`, `secrets-rotation.md`, `stripe-go-live.md`, `transfer-impact-assessment.md`. None of these mention Inngest alerts.

Inngest Cloud supports email-on-function-failure (per their dashboard UX), but it requires explicit subscriber-setup in the Inngest dashboard. There's no doc that says "Kolja must enable function-failure alerts in Inngest before launch".

Severity: **Strong** — operationally invisible failure mode.

**Fix:** add a `docs/operations/inngest-alerts.md` (or extend `deploy.md` §post-deploy step) requiring:
- Enable email-on-failure for ALL five functions in Inngest dashboard.
- Configure threshold: alert on >5% failure rate over 1h.

### F.2 — Failure-rate alerting; who's notified [Strong, missing]

The only error-signal today is `console.error` → Vercel function logs. Wave-1-Infra F (Observability) tagged this Red. Inngest layer has the same gap.

There is no Sentry, no Axiom, no Datadog, no PagerDuty — confirmed in Wave-1-Infra Part F.

### F.3 — Dead-Letter-Queue concept

Inngest has built-in DLQ semantics: after exhausting retries (4 attempts on default policy), the failed event sits in a "Failed" tab in the dashboard indefinitely. There is NO automatic re-drive, NO automatic alerting (unless §F.1 is configured), NO programmatic API to replay (well, there is via Inngest CLI, but it's manual).

**Risk:** a single bad deploy causes `audit-requested` to throw → 4 retries × N customers = 4N events in the DLQ that need manual replay. With no alert (§F.1), the developer doesn't know to look.

Severity: **Strong**.

### F.4 — How would a dev know `credit-aggregator` started silently failing?

They wouldn't.
1. The function's "success" state today is the empty-result early-return at `:115-117` — it returns `{ ok: true, submitted: 0 }` indistinguishably from "no overage rows ever exist" (B.3-F1) vs "the query crashed and exception was swallowed somewhere" (it isn't — Drizzle would throw — but the point stands: success looks identical to no-op).
2. If the function DID start failing (`fetchPending` SQL syntax error after a schema migration), Inngest retries 4x then DLQs. Vercel function logs show the error. Dashboard alerts off. **The developer learns of the issue when a customer reports their overage was never billed** — which could be 30+ days post-fact.

Severity: **Strong**.

**Fix:** instrument: emit a structured metric (Inngest custom event, or eventually Sentry breadcrumb) on every cron tick. Dashboard a "ticks-per-day" panel; alert on count<expected_count.

---

## Part G — DB-Race Conditions in Functions

### G.1 — `audit-requested` non-atomic credit + persist [Strong]

Already covered in §B.1-F2. Steps `consume-credits` + inline `audit_run_cost` insert + step `persist` are three separate atomic units. A retry between them can:
- Double-debit credits (no idempotency-key on `consumeCredits`).
- Crash on the second `audit_run_cost` insert (UNIQUE on scan_id, no `onConflictDoNothing`).
- Leave a "complete" scan row without an audit_run_cost rollup (if `audit_run_cost` insert succeeds but `persist` step fails — recovery sees a half-baked state).

### G.2 — `auto-track-repos` non-transactional scan-insert + repo-update + send [Strong]

Already covered in §B.2-F2. Three statements not in a transaction; step retry creates orphaned `queued` scans.

### G.3 — Webhook → Inngest chain idempotency

| Chain                                            | Idempotency-key on the webhook side    | Idempotency-key on Inngest-receive side |
|--------------------------------------------------|-----------------------------------------|----------------------------------------|
| Stripe `invoice.paid` → `grantCredits`           | ✅ `stripe_event.id` PK upsert (`route.ts:104-115`) | N/A — synchronous, not Inngest |
| Stripe `checkout.session.completed` → `grantPrepaidPack` | ✅ `stripe_event.id` + `prepaid_credit_grant.stripe_invoice_id` UNIQUE | N/A — synchronous |
| Stripe `invoice.created` → `flushPendingForCustomer` | ✅ `stripe_event.id` | ⚠️ `stripe_meter_event_log.identifier` PK (defensive depth-2) |
| GitHub install webhook → `repo` insert / scan enqueue | ✅ `webhook_event.delivery_id` (`install-webhook/route.ts:76-86`) | N/A — synchronous |
| `notify-update` HMAC → `audit/requested` send    | ❌ No event-id passed to `inngest.send`; relies on Inngest's natural dedupe window (~24h on event.id, but no event.id set here) | ❌ `audit-requested` has no idempotency |
| `auditAction` → `audit/requested` send           | ❌ Same as above                        | ❌ Same |

**[Strong] G3-1 — Inngest event.send calls don't set `event.id` for idempotency**

Inngest's `inngest.send({ name, data })` allows an optional `id` field that, when set, dedupes the event within a 24h window. Currently:
- `apps/web/src/lib/audit-action.ts:279-288` — no `id`.
- `apps/web/src/app/api/notify-update/route.ts:146-149` — no `id`.
- `packages/inngest/src/functions/auto-track-repos.ts:86-89` — no `id`.

A double-click on the audit form, a webhook redelivery, or a step-retry that re-sends would all trigger duplicate audit runs.

Severity: **Strong**.

**Fix:** pass `id: scanId` to every `inngest.send` so the scanId becomes the natural dedupe key.

### G.4 — Concurrent-region writes

Inngest functions can run in multiple regions concurrently (knowledge-update §Fluid-Compute reuses instances across regions). For our 5 functions:

| Function          | Cross-region race? | Why / Why not |
|-------------------|--------------------|---------------|
| `audit-requested` | YES if event-id collisions allowed (G3-1) | Default Inngest behavior is single-instance-per-event, but if same event-id is sent from two regions simultaneously, both could process. Set `id` per G3-1 to dedupe. |
| `auto-track-repos`| NO — single-cron-instance | Inngest's cron-trigger guarantees one instance per cron window. |
| `credit-aggregator` | NO — single-cron-instance |  ditto |
| `prepaid-credit-expirer` | NO — single-cron-instance | ditto |
| `stripe-reconcile` | NO — single-cron-instance | ditto |

So the cron-triggered functions are inherently single-instance; only `audit-requested` is exposed to concurrent-execution issues, addressed by G3-1.

---

## Summary — New Kill / Strong items NOT in Wave-1

| # | Severity | Title | File:Line | Wave-1 ref |
|---|----------|-------|-----------|------------|
| K-INNG-1 | [Kill] | `audit-requested` background path silently fails for local-disk audits on Vercel (cross-instance filesystem) | `apps/web/src/lib/audit-action.ts:152-176` | NEW |
| K-INNG-2 | [Kill] | `INNGEST_SIGNING_KEY` not enforced — re-affirms Wave-1 B-K1 with concrete fix pattern | `apps/web/src/app/api/inngest/route.ts:1-4` | Carry (B-K1) |
| K-INNG-3 | [Kill] | `credit-aggregator` polls a perpetually empty result set; Auto-Overage Stripe flow is incomplete end-to-end | `packages/inngest/src/functions/credit-aggregator.ts:35-67` + `packages/billing/src/credits.ts:203-209` | Carry (Wave-1-Payment K11) |
| S-INNG-1 | [Strong] | `audit-requested` non-atomic credit+persist enables double-debit on retry | `packages/inngest/src/functions/audit-requested.ts:68-92` | NEW |
| S-INNG-2 | [Strong] | `audit-requested` has no `onFailure` handler — scans stuck `running` forever after retries exhausted | `packages/inngest/src/functions/audit-requested.ts:34-188` | NEW |
| S-INNG-3 | [Strong] | `auto-track-repos` non-transactional scan-insert + repo-update + send → orphaned `queued` scans on retry | `packages/inngest/src/functions/auto-track-repos.ts:48-92` | NEW |
| S-INNG-4 | [Strong] | `auto-track-repos` GitHub anonymous rate-limit silent data loss | `packages/inngest/src/functions/auto-track-repos.ts:103-122` | NEW |
| S-INNG-5 | [Strong] | `prepaid-credit-expirer` email-send → event-insert race can duplicate "expires tomorrow" emails | `packages/inngest/src/functions/prepaid-credit-expirer.ts:125-148` | NEW |
| S-INNG-6 | [Strong] | `stripe-reconcile` 50-page hard ceiling silently truncates large accounts | `packages/inngest/src/functions/stripe-reconcile.ts:59` | NEW |
| S-INNG-7 | [Strong] | `audit-requested` `audit` step is single-blob, will hit 300s wall on Deep-intensity large repos | `packages/inngest/src/functions/audit-requested.ts:62-64` | NEW |
| S-INNG-8 | [Strong] | No Inngest dashboard alerting setup → background-job failures are operationally invisible | `docs/operations/` (no entry) | Carry (Wave-1-Infra F) |
| S-INNG-9 | [Strong] | `inngest.send` calls don't pass `id` for idempotency — double-click / retry creates duplicate audits | 3 call sites: `audit-action.ts:279`, `notify-update/route.ts:146`, `auto-track-repos.ts:86` | NEW |
| M-INNG-1 | [Mid] | DACH-DST awareness for the 02:00 / 03:00 UTC daily crons (warning-window edge case) | `prepaid-credit-expirer.ts:108-118` | NEW |
| M-INNG-2 | [Mid] | `credit-aggregator` Stripe meter-event uses now() timestamp not ledger-row-created timestamp (period-boundary attribution drift) | `credit-aggregator.ts:79` | NEW |
| M-INNG-3 | [Mid] | `stripe-reconcile` publishes `audit.failed` event type for subscription-drift — wrong discriminator | `stripe-reconcile.ts:113-130` | NEW |
| M-INNG-4 | [Mid] | `prepaid-credit-expirer` expiry-pass holds row-lock during inline `getCreditBalance` — scales poorly | `prepaid-credit-expirer.ts:88-104` | NEW |

---

## Recommended priority for launch

**Must-fix-before-launch (Kill-band):**
1. K-INNG-2 — INNGEST_SIGNING_KEY guard. ~15 min.
2. K-INNG-1 — fix or document the local-disk background path. ~30 min if we just remove the background path for local-disk; ~half-day if we want to keep it.
3. K-INNG-3 — wire overage ledger inserts OR remove the Auto-Overage feature from `/pricing` until implemented. ~half-day for either path. (Out-of-Inngest-layer concern.)

**Should-fix-before-launch (Strong-band):**
4. S-INNG-2 — `onFailure` handler on `audit-requested`. ~30 min.
5. S-INNG-9 — pass `id` to `inngest.send`. 3 one-line changes.
6. S-INNG-3 — wrap `auto-track-repos` step body in a transaction. ~1h.
7. S-INNG-1 — wrap `audit-requested` credit-consume + cost-rollup + persist in one transaction. ~2h (needs tests).
8. S-INNG-8 — enable Inngest dashboard alerts + document. ~30 min in dashboard + ~30 min docs.

**Defer (Mid-band):** all M-INNG-* items can wait for a Nova-3c iteration.

---

> Read-only audit; no code changes made. Sources cited inline.
