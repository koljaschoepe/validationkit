# Wave-1 Sub-6 — Test-Coverage + Build-Health + Type-Strictness Deep-Audit

> Generated: 2026-06-06
> Scope: Re-spawn after the Wave-1 original sub-6 timed out. Build + lint + test commands executed locally. Type-strictness pass via `grep` + manual inspection. CI workflow + Lighthouse + eval drift analysed against `docs/audits/2026-05-deep/_wave1-synthesis.md`.
> Baseline: 2026-05 Sub-8 (`docs/audits/2026-05/08-tests-eval.md`) — 7 Kill (Stripe-Webhook, audit-action, API-Routes, DAL, session, billing, audit-rules). Audit-Diff (`wave1-01`) already confirmed K6/K7/K8/K10 resolved; K9 (DAL) + K11 (billing) + K12 (audit-rules) partial.
> Method-Convention: Severity-Bänder `{Kill, Strong, Mid, Weak, Exceptional}`.

---

## TL;DR — Verdict

**🟡 Test infra solid, build green, type-strictness solid in production code. But three audit-confirmed coverage gaps remain (apply-dal, customers/install-requests, billing-actions), plus 1 critical + 2 high CVEs at the dev-dep level. Eval drift exists but is benign. CI pipeline is appropriate for a solo-dev.**

| Bucket               | Status | Kill | Strong | Mid | Weak | Notes                                                    |
|----------------------|--------|-----:|-------:|----:|-----:|----------------------------------------------------------|
| Build + lint         | 🟢     |    0 |      0 |   1 |    1 | 1 warn (NFT trace), 1 lint-warning (unused setter)       |
| Test-Coverage Map    | 🟡     |    1 |      4 |   3 |    1 | apply-dal/customers/install-requests/billing-actions     |
| Test-Quality         | 🟢     |    0 |      1 |   2 |    1 | No assertions-safety pattern, no time-mocking            |
| Type-Strictness      | 🟢     |    0 |      0 |   3 |    1 | strict+nUIA on, only 1 expect-error, `as unknown as` × 19 |
| CI Pipeline          | 🟡     |    0 |      2 |   2 |    0 | Integration only on main, LHCI gates may flake           |
| Eval / Golden-Set    | 🟢     |    0 |      0 |   1 |    1 | Drift cosmetic, results-dir empty                        |
| Deps / `pnpm audit`  | 🔴     |    1 |      2 |   3 |    3 | vitest <4.1 critical (dev-dep), tmp + hono moderate     |
| Pre-Launch Test-Gaps | —      |    — |      — |   — |    — | See Part G — Bundle-A IDOR-tests + Bundle-B overage E2E |
| **TOTAL**            | **🟡** | **2** |    **9** | **12** | **7** |                                                       |

**Bottom-line:** The Nova-3b test-infra (vitest projects, MSW, integration-fork pool) is well-architected. Sub-A/B/C delivered the most load-bearing paths (Stripe-Webhook, audit-action, API-Routes, session). What's missing is mostly the "second pass" of high-risk business-logic modules — `apply-dal.ts` (auto-fix branch), `customers.ts` (cross-tenant join, K2-Auth), `install-requests.ts` (token-issuer), `billing-actions.ts` (Checkout/Portal). All three carry IDOR/replay-risk if mishandled. Type-strictness is clean — no `: any`, only 1 `@ts-expect-error` (in a Stripe-mock narrowing), 19 `as unknown as X` (mostly justified — Drizzle JSON columns + Stripe SDK-shape gaps).

**Launch-blocker among findings:** `vitest <4.1` critical-CVE (dev-only, low actual risk — the vulnerable UI server is never started in CI/dev) + the `apply-dal.ts`/`install-requests.ts` zero-coverage Kill below.

---

## Part A — Build-Health (executed)

All commands run from `/Users/koljaschope/Documents/rohan` on macOS 24.6 / Node 22 / pnpm 10.18.1.

### A.1 `pnpm install --frozen-lockfile`

```
Scope: all 13 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 1.3s using pnpm v10.18.1
```

* No lockfile drift. **Exceptional**.
* **Weak**: pnpm `10.18.1 → 11.5.2` upgrade nag. Worth bumping during a quiet window — pnpm 11 has improved peer-deps resolution.
* **Mid**: `Ignored build scripts: unrs-resolver` — postinstall script is blocked. Not a launch-issue but a `pnpm approve-builds` once would be cleaner.

### A.2 `pnpm typecheck` (after `--force` to bust turbo cache)

```
 Tasks:    23 successful, 23 total
 Cached:    0 cached, 23 total
   Time:    17.423s
```

* 0 errors across all 13 workspaces. **Exceptional**.
* All `tsc -p tsconfig.json --noEmit` pass. `strict: true` + `noUncheckedIndexedAccess: true` + `noImplicitOverride: true` confirmed in `tsconfig.base.json:1-19`.

### A.3 `pnpm --filter @vk/web lint`

```
src/components/landing/HeroSection.tsx
  113:27  warning  'setGalaxieSettings' is assigned a value but never used.
✖ 1 problem (0 errors, 1 warning)
```

* **Weak**: stale unused setter from the Galaxie-Settings-Popover wire-up. Was flagged in Wave-1 Frontend as K18 (orphaned `GalaxieSettingsPopover`). Same root cause.
* **Mid**: `eslint.config.js:32` disables `@typescript-eslint/no-explicit-any` globally. The Wave-1 Auth report leaned on `grep "as any"` returning zero, and that was correct in app/web — but the disable means future regressions won't be caught. Recommend flipping to `warn` once Wave-2 lands.

### A.4 `pnpm test` (unit project)

```
 Test Files  43 passed (43)
      Tests  293 passed (293)
   Duration  4.20s
```

* 293 tests across 43 files, 0 fail, 0 skip, 0 `.only`. **Exceptional**.

### A.5 `pnpm test:integration`

Not executed in this sandbox (`.env.test:DATABASE_URL` points at `postgres://vk:vk_local@127.0.0.1:5432/validationkit_test`, no Postgres running). The vitest project is configured (`vitest.config.ts:57-72`, pool=forks, testTimeout=30s) and CI has matching `services.postgres` in `.github/workflows/ci.yml:56-72`. Integration tests use `describe.skipIf(!isDbEnabled())` (3 files: `route.integration.test.ts`, `customer-dal.integration.test.ts`, `workspace-context.integration.test.ts`), so they're safe to skip locally.

* **Mid**: integration-pool only runs on `push to main` (`.github/workflows/ci.yml:48-49`). PR-path is fast (unit + lint + build + eval + LHCI) but a Cross-Tenant-IDOR test on a PR cannot fail the merge. With Bundle-A landing 5 new cross-tenant fixes, integration-on-PR is recommended.

### A.6 `pnpm build`

```
@vk/web:build: ✓ Compiled successfully in 52s
@vk/web:build:   Finished TypeScript in 37.6s ...
@vk/web:build: ✓ Generating static pages using 7 workers (18/18) in 6.5s
@vk/web:build: Turbopack build encountered 1 warnings:
@vk/web:build: ./apps/web/next.config.ts
@vk/web:build: Encountered unexpected file in NFT list
@vk/web:build: A file was traced that indicates that the whole project was traced unintentionally.
@vk/web:build:   ./apps/web/src/lib/apply-dal.ts
@vk/web:build:   ./apps/web/src/lib/apply-actions.ts
```

* Build succeeds, 49 routes generated (mix of `ƒ Dynamic` + `○ Static`).
* **Mid (build-warning)** at `apps/web/src/lib/apply-dal.ts` + `apply-actions.ts` — Turbopack NFT (Node File Tracer) detected dynamic `fs`/`path.join` patterns that drag the whole project into the function bundle. This inflates the cold-start (Fluid Compute) payload. Likely a `fs.readFile(path.join(repoRoot, …))` in apply-dal. Worth fixing — Wave-1 Infra Strong-list S-suspect.
* No errors. No `outputFileTracingIncludes` warnings. `next.config.ts:46-51` does declare `outputFileTracingIncludes` for `/trust/dpa`, `/trust/sub-processors.*` — good practice.

### A.7 `pnpm audit`

```
13 vulnerabilities found
Severity: 3 low | 7 moderate | 2 high | 1 critical
```

Concrete findings:

| Severity   | Package                | Path                                          | Patched    | Production impact |
|------------|------------------------|-----------------------------------------------|------------|--------------------|
| **Critical** | `vitest <4.1.0`        | `.>vitest`                                    | `>=4.1.0`  | **No (dev-dep, vitest-UI is never started)** |
| High       | `tmp <0.2.6`           | `@lhci/cli>tmp` + `@lhci/cli>inquirer>external-editor>tmp` | `>=0.2.6`  | No (LHCI is CI-only) |
| Moderate   | `esbuild <=0.24.2`     | `drizzle-kit>@esbuild-kit>esbuild`            | `>=0.25.0` | No (drizzle-kit is dev-only) |
| Moderate   | `postcss <8.5.10`      | `next>postcss`                                | `>=8.5.10` | **Yes — runs in build, accepts arbitrary CSS via Tailwind** |
| Moderate   | `uuid <11.1.1`         | `@lhci/cli>uuid`                              | `>=11.1.1` | No (CI-only) |
| Moderate × 4 | `hono <4.12.21`      | `apps/web>shadcn>@modelcontextprotocol/sdk>hono` | `>=4.12.21` | No (`shadcn` is a CLI dev-dep) |
| Moderate   | `tmp <=0.2.3`          | same as high                                  | `>=0.2.4`  | No |
| Low × 3    | `tmp / diff / esbuild` | various                                       | n/a        | No |

* **Kill**: `vitest <4.1.0` critical CVE was raised in Wave-1 Auth Sub-3. Still present. Confirmed dev-only (no `vitest --ui` in CI/dev scripts). Fix: `pnpm up vitest@latest` in root `package.json`.
* **Strong**: `postcss <8.5.10` ships in the production build via Next.js. The XSS is in `</style>` stringify-output — not directly exploited but in scope for B2B-Compliance. Bump `next` patch-version (currently 16.2.x).
* **Strong**: `hono <4.12.21` × 4 advisories — all transitive via `shadcn` CLI. Re-confirm `shadcn` is in `devDependencies` (yes — `apps/web/package.json`). Low actual risk, but bumping `shadcn` is easy.
* **Mid**: `tmp`, `uuid`, `diff` low/moderate — all transitive dev-deps. Defer.

---

## Part B — Test-Coverage Map

### B.1 DAL + lib (apps/web/src/lib)

| Module | Test-File | Tests | Status | Severity if missing |
|---|---|--:|---|---|
| `lib/session.ts` | `session.test.ts` | 6 | ✓ | — |
| `lib/dal/galaxie.ts` | `dal/galaxie.test.ts` | 12 | ✓ | — |
| `lib/customer-dal.ts` | `customer-dal.integration.test.ts` | 6 | ✓ | — |
| `lib/workspace-context.ts` | `workspace-context.integration.test.ts` | 6 | ✓ | — |
| `lib/audit-action.ts` | `audit-action.test.ts` | 9 | ✓ | — |
| `lib/stripe-meters.ts` | `stripe-meters.test.ts` | 4 | ✓ | — |
| `lib/solution-dal.ts` | `solution-dal.test.ts` | 10 | ✓ | — |
| `lib/apply-mode.ts` | `apply-mode.test.ts` | 12 | ✓ | — |
| `lib/middleware-redirects.ts` | `middleware-redirects.test.ts` | 15 | ✓ | — |
| `lib/cache-tags.ts` | `cache-tags.test.ts` | 3 | ✓ | — |
| `lib/apply-dal.ts` (228 LOC, "use server") | — | 0 | **✗** | **Kill** |
| `lib/customers.ts` (164 LOC, "use server", K2-Auth lives here) | — | 0 | **✗** | **Strong** |
| `lib/install-requests.ts` (220 LOC, "use server", token-issuer) | — | 0 | **✗** | **Strong** |
| `lib/billing-actions.ts` (231 LOC, "use server", Stripe Checkout + Portal) | — | 0 | **✗** | **Strong** |
| `lib/audit-trail-export.ts` (167 LOC, K3+K4-Auth lives here) | indirect via `audit-trail/route.test.ts` (4 tests, mocked) | 0 direct | partial | **Strong** |
| `lib/membership.ts` (211 LOC, K5-Auth lives here) | — | 0 | ✗ | **Kill** (the cross-workspace revokeMember is here) |
| `lib/solution-actions.ts` (24 LOC, K1-Auth lives here) | — | 0 | ✗ | Mid (small surface, but cross-tenant IDOR risk) |
| `lib/scan-status.ts` (50 LOC, K6-Auth lives here) | — | 0 | ✗ | Mid |
| `lib/fix-actions.ts` (97 LOC) | — | 0 | ✗ | Mid |
| `lib/workspace-ai-actions.ts` (175 LOC, BYOK + intensity) | — | 0 | ✗ | Mid |
| `lib/workspaces.ts` (37 LOC) | — | 0 | ✗ | Weak |
| `lib/customer-actions.ts` (73 LOC) | — | 0 | ✗ | Mid |
| `lib/dpa-actions.ts` (78 LOC) | — | 0 | ✗ | Weak |
| `lib/rate-limit.ts` (115 LOC, K10-Auth: in-memory limiter) | — | 0 | ✗ | Strong (live-fire path with cross-region drift) |
| `lib/vat.ts` (55 LOC) | — | 0 | ✗ | Weak |
| `lib/health-check.ts` (137 LOC) | — | 0 | ✗ | Weak |
| `lib/github-fetch.ts` (143 LOC, ZIP-extract path) | — | 0 | ✗ | Mid (Path-Traversal risk on ZIP entries) |

**Confirmed Kill (B.K1):** `lib/apply-dal.ts` zero coverage. 228 LOC of "use server" — auto-fix orchestration. Wave-1 Audit-Diff (`wave1-01-audit-diff.md`) calls this out. Build-warning in A.6 even points at this file as the NFT-trace culprit.

**Confirmed Kill (B.K2):** `lib/membership.ts` — Wave-1 Auth `K5: revokeMember cross-workspace IDOR` is in here at line 211-223. The fix is 4 LOC. Without a unit test, regression-risk is high.

### B.2 API routes (apps/web/src/app/api)

| Route | Test-File | Tests | Notes |
|---|---|--:|---|
| `/api/stripe/webhook/route.ts` | `route.test.ts` + `route.integration.test.ts` | 9 + 4 | ✓ Comprehensive — 503-gates, signature-fail, replay, unhandled, invoice.created, 500-path; integration: subscription-upgrade, replay-dedupe, sub.deleted-downgrade, payment-failed |
| `/api/inngest/route.ts` | `route.test.ts` | 1 | Smoke only — checks GET/POST/PUT exist |
| `/api/audit-trail/route.ts` | `route.test.ts` | 4 | ✓ JSON-200, 404-null, CSV-200, CSV-404. **All mocked** — underlying `exportAuditTrail` (K3/K4-Auth) is `vi.mock`ed (line 5) |
| `/api/auth/[...all]/route.ts` | `route.test.ts` | 2 | ✓ 503-when-disabled, delegates-to-handler |
| `/api/events/stream/route.ts` | `route.test.ts` | 3 | ✓ 503-DB, 401-unauth, 200-SSE-headers |
| `/api/install-webhook/route.ts` | `route.test.ts` | 5 | ✓ 503-secret-missing, 401-bad-sig, 503-DB, 400-bad-JSON, 400-no-delivery |
| `/api/notify-update/route.ts` | `route.test.ts` | 9 | ✓ Most thorough — 503, 401, 401-prefix, 400-JSON, 400-no-repoId, 404-unknown, 401-bad-HMAC, 200-skipped, 200-scan-trigger |

**Mid (B.M1):** `/api/inngest/route.test.ts` is a single smoke-test. Wave-1 Infra K13 is `INNGEST_SIGNING_KEY` never read by `serve()`. A test verifying the signing-key wiring + 503-guard would catch that regression.

**Strong (B.S1):** `/api/audit-trail/route.test.ts` mocks `exportAuditTrail` — so the K3 finding (queries `webhook_event` without workspaceId filter) is **not** caught by any test. The 4 route-level tests pass because the gate is mocked away. After fix, an integration-test against Postgres + a multi-workspace fixture is required.

### B.3 packages

| Module | Test-File | Tests | Status |
|---|---|--:|---|
| `packages/audit/src/run.ts` (orchestrator) | `audit.test.ts` | 3 | ✓ E2E against `examples/sample-good` + `sample-bad` |
| `packages/audit/src/rules/context-bloat.ts` | `context-bloat.test.ts` | 7 | ✓ Dedicated unit-tests |
| `packages/audit/src/rules/duplicate-guidance.ts` | — | 0 | ✗ Covered indirectly via `audit.test.ts` (1 assertion) |
| `packages/audit/src/rules/stale-references.ts` | — | 0 | ✗ Covered indirectly via `audit.test.ts` (1 assertion) |
| `packages/audit/src/rules/unused-agents.ts` | — | 0 | ✗ Covered indirectly via `audit.test.ts` (2 assertions) |
| `packages/audit/src/token-budget.ts` | `token-budget.test.ts` | 5 | ✓ |
| `packages/billing/src/byok-crypto.ts` | `byok-crypto.test.ts` | 8 | ✓ |
| `packages/billing/src/intensity.ts` | `intensity.test.ts` | 5 | ✓ |
| `packages/billing/src/tiers.ts` | `tiers.test.ts` | 11 | ✓ Catalog + price + feature-flags |
| `packages/billing/src/credits.ts` (300 LOC — `getCreditBalance`, `consumeCredits`, `grantCredits`, `resetCycleQuota`) | — | 0 | **✗ Kill** |
| `packages/billing/src/subscription.ts` (240 LOC — `ensureSubscription`, `canRunAudit`, quota-checks) | — | 0 | **✗ Strong** |
| `packages/auth/src/server.ts` | `server.test.ts` | 4 | ✓ Enabled-gate + getAuth-throw |
| `packages/db/src/client.ts` | `client.test.ts` | 3 | ✓ |
| `packages/fixes/src/generate.ts` | `generate.test.ts` | 6 | ✓ |
| `packages/github-app/src/manifest.ts` | `manifest.test.ts` | 7 | ✓ |
| `packages/github-app/src/webhook.ts` | `webhook.test.ts` | 8 | ✓ |
| `packages/inngest/src/client.ts` | `client.test.ts` | 5 | ✓ |
| `packages/inngest/src/functions/audit-requested.ts` | — | 0 | ✗ Strong |
| `packages/inngest/src/functions/credit-aggregator.ts` (cron) | — | 0 | ✗ Strong |
| `packages/inngest/src/functions/prepaid-credit-expirer.ts` (cron) | — | 0 | ✗ Strong |
| `packages/inngest/src/functions/stripe-reconcile.ts` (cron) | — | 0 | ✗ Strong |
| `packages/inngest/src/functions/auto-track-repos.ts` | — | 0 | ✗ Mid |
| `packages/llm/src/pricing.ts` | `pricing.test.ts` | 13 | ✓ |
| `packages/llm/src/select.ts` | `select.test.ts` | 7 | ✓ |
| `packages/llm/src/rules/conflicting-rules.ts` | `conflicting-rules.test.ts` | 2 | ✓ (real coverage is the eval at `eval/conflicts/`) |
| `packages/parser/src/aider-parser.ts` | `aider-parser.test.ts` | 3 | ✓ |
| `packages/parser/src/classify.ts` | `classify.test.ts` | 14+5 (it.each) | ✓ Very thorough |
| `packages/parser/src/parse-file.ts` | `parse-file.test.ts` | 6 | ✓ |
| `packages/pr-workflow/src/pr-workflow.ts` | `pr-workflow.test.ts` | 3 | ✓ |
| `packages/db/src/schema.ts` | — | 0 (migration-by-running) | ✗ Weak |
| `packages/auth/src/emails/*` | — | 0 | ✗ Mid (render-smoke would catch broken HTML) |

**Confirmed Kill (B.K3):** `packages/billing/src/credits.ts` (300 LOC) has zero dedicated tests. This is the **core money-path** — `consumeCredits` writes to `credit_ledger`, `grantCredits` is called by `handleInvoicePaid` + `handleCheckoutCompleted`, `resetCycleQuota` is cron-invoked. If any of these double-grants or zero-grants, customers lose trust or revenue.

**Strong (B.S2):** All 5 Inngest functions are untested. K11-Payment ("Auto-Overage end-to-end dead code") is partially because the function bodies (`audit-requested.ts:70`, `credit-aggregator.ts`) are never exercised by tests. An Inngest function-test harness (`step.run` mocks) would unlock these.

**Mid (B.M2):** Audit-rules `duplicate-guidance`, `stale-references`, `unused-agents` only have integration-coverage via `audit.test.ts`. Each rule's edge-cases (file-kind variants, alias resolution) are not exercised. Wave-1 Audit-Diff acknowledges this as K12-partial. Not launch-blocking but lowers refactor-confidence.

### B.4 UI Components

| File | Test-File | Tests | Status |
|---|---|--:|---|
| `components/galaxie/diff-renderer.ts` | `diff-renderer.test.ts` | 6 | ✓ |
| `components/galaxie/inspector-templates.ts` | `inspector-templates.test.ts` | 4 | ✓ |
| `components/galaxie/pixi/Camera.ts` | `Camera.test.ts` | 6 | ✓ |
| `components/galaxie/pixi/quadtree.ts` | `quadtree.test.ts` | 4 | ✓ |
| `lib/galaxie/solar-layout.ts` | `solar-layout.test.ts` | 7 | ✓ |
| `lib/galaxie/severity-colors.ts` | `severity-colors.test.ts` | 8 | ✓ |
| `lib/galaxie/mock-data.ts` | `mock-data.test.ts` | 6 | ✓ |
| `lib/repo-galaxie/build-from-audit.ts` | `build-from-audit.test.ts` | 7 | ✓ |
| `lib/repo-galaxie/layout.ts` | `layout.test.ts` | 7 | ✓ |
| `components/BuyCreditPackModal.tsx` | — | 0 | ✗ Mid (Wave-1 Frontend K18: orphaned, but if wired up needs test) |
| `components/CreditMeter.tsx` | — | 0 | ✗ Weak |
| `components/IntensitySelector.tsx` | — | 0 | ✗ Weak |
| `components/checkout-button*` / `components/PortalButton*` (Stripe-Checkout entry) | — | 0 | ✗ Strong (lives in `billing-actions.ts` — see B.K1) |
| `components/FindingsList.tsx` (top-of-funnel result-view) | — | 0 | ✗ Mid |

No `.test.tsx` in `components/`. The galaxie helpers and pure-logic colour/layout fns are well-covered. UI-rendering tests (React Testing Library) are entirely absent — acceptable for a solo-dev pre-launch if Playwright/E2E lands later (currently `scripts/docker-e2e-smoke.sh` exists but isn't in CI).

---

## Part C — Test-Quality

### C.1 Realism vs mock-results

* **Stripe-webhook (route.test.ts)**: realistic — full `vi.mock` of `@vk/db`, MSW handles outbound Stripe HTTP. Constructs Stripe `Event` shape correctly (lines 80-110). **Exceptional**.
* **Stripe-webhook integration (route.integration.test.ts)**: hits real Postgres, inserts fixtures via Drizzle, verifies tier transitions in DB. **Exceptional**.
* **Audit-action (audit-action.test.ts)**: mocks `@vk/audit`, `@/lib/customer-dal`, `@/lib/rate-limit`. Tests cover credits-burn, intensity-downgrade, error-paths, temp-dir cleanup. **Strong**.
* **events/stream (route.test.ts:3-77)**: mocks Drizzle query-chain manually. Verifies 503/401/200-SSE — but the SSE body is `cancel()`ed immediately, so the actual stream-loop is untested.
* **audit-trail (route.test.ts)**: mocks `exportAuditTrail` itself. Critical-path NOT exercised — only the route adapter. See B.S1.

### C.2 MSW handlers

`apps/web/src/test/msw/handlers.ts` — default handlers for Stripe (`/v1/customers/:id`, `/v1/checkout/sessions`, `/v1/billing/meter_events`) + Anthropic stub. `server.listen({ onUnhandledRequest: "error" })` in `setup.ts:18` — **any unmocked HTTPS call is a loud test-failure, not a silent hang**. **Exceptional pattern**.

### C.3 Integration vs mocked

3 `.integration.test.ts` files, all `describe.skipIf(!isDbEnabled())`:

* `customer-dal.integration.test.ts` — multi-tenant tenancy gate (95-104), notes-column-still-readable smoke. **Strong**.
* `workspace-context.integration.test.ts` — 6 cases including dangling-ownerId after deletion (Nova-3a Bundle-A regression-test). **Strong**.
* `stripe/webhook/route.integration.test.ts` — 4 cases: upgrade, replay, downgrade, payment-failed. **Strong**.

CI integration-pool runs on `push to main` only (`.github/workflows/ci.yml:48-49`). PRs skip. **Mid**.

### C.4 Snapshot tests

None. **Exceptional** — snapshot-tests are notoriously noisy in B2B-products.

### C.5 Flaky signals

* 0 `test.skip` / `it.only` / `describe.only` across the codebase (grep confirmed).
* 3 `describe.skipIf(!isDbEnabled())` — these are gated, not flaky. **Exceptional**.
* No `--retry` or retry-config in `vitest.config.ts`. Good.

### C.6 Time-mocking

`grep -r "vi.useFakeTimers\|vi.setSystemTime\|vi.advanceTimers"` returns **zero results** across the entire repo. **Mid**.

This is a gap for:
* `packages/billing/src/credits.ts` — `getCreditBalance` queries `credit_ledger` with `createdAt > cycleStart`. Cycle-rollover edge-cases need `vi.setSystemTime`.
* `packages/inngest/src/functions/prepaid-credit-expirer.ts` — 30-day expiry logic.
* `apps/web/src/lib/rate-limit.ts` — sliding-window logic. Currently uncovered (B-table).

### C.7 `expect.assertions` for async-throws

`grep -r "expect.assertions\|expect.hasAssertions"` returns **zero**. **Weak**.

Async-throws inside `await` that never resolve get silently swallowed by vitest without `expect.assertions(N)`. Some of the audit-action tests (`it("rejects unparseable GitHub URL")` at line 174) rely on `result.success: false` checks rather than `.toThrow()` — that's actually safer here because the action returns errors-as-values. So the absence is mostly fine for this codebase's style.

---

## Part D — Type-Strictness

### D.1 `@ts-ignore` / `@ts-expect-error`

**1 total** across the whole codebase:

```
apps/web/src/app/api/stripe/webhook/route.test.ts:178:      // @ts-expect-error narrow mock — only constructEvent is called.
```

* Justified — test-narrowing the Stripe SDK mock. **Exceptional**.

### D.2 `as any` casts

```
$ grep -rn " as any\b" --include="*.ts" --include="*.tsx" apps/web/src packages/*/src
(no output)
```

**Zero** `as any` in production code. **Exceptional**.

### D.3 `as unknown as X`

**19 occurrences**, all in 7 files:

| File | Count | Justification |
|---|--:|---|
| `apps/web/src/app/[workspace]/scans/[id]/page.tsx` | 3 | Date-revival from Drizzle JSON column — Drizzle types `jsonb` as the raw shape, runtime is `string`. **Justified**. |
| `apps/web/src/app/api/stripe/webhook/route.ts` | 4 (lines 109, 336, 379, 463) | Stripe API shape gaps — `subscription` field type, `attempt_count`, `current_period_end` (which moved in `2026-04-22.dahlia`). **K12-Payment** flagged the `current_period_end` cast as a 5-LOC fix. The others are SDK-version drift. **Justified but should age out**. |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | 2 | Pixi `world.__startPulse` augmentation — escape-hatch on Pixi `Container` type. **Mid** — could declare module-augment instead. |
| `apps/web/src/lib/audit-action.ts` | 3 (lines 391, 392, 408) | `ParserResult`/`AuditReport`/`Finding` → Drizzle `jsonb`. **Justified**. |
| `apps/web/src/lib/fix-actions.ts` | 4 | Same pattern — Date revival from JSON. **Justified**. |
| `apps/web/src/lib/audit-trail-export.ts` | 3 (lines 77, 99, 121) | Drizzle row → `Record<string, unknown>` for CSV-emit. **Justified**. |
| `apps/web/src/app/auth/verify/page.tsx:46` | 1 | `redirect(next as unknown as Parameters<typeof redirect>[0])` — Next 16 typedRoutes vs dynamic `?next=` param. **Mid** — could be a Zod-parse to a known route-union. |

**Pattern verdict**: ~85% of casts are at the Drizzle-JSON / SDK-version boundary, which is the legitimate use of `as unknown as X`. **Strong**.

### D.4 `Record<string, any>`

```
$ grep -rn "Record<string, any>" --include="*.ts" --include="*.tsx" apps/web/src packages/*/src
(no output)
```

**Zero**. Codebase uses `Record<string, unknown>` consistently. **Exceptional**.

### D.5 Naked `: any`

Production code: **9 occurrences, all in `packages/inngest/src/functions/*.ts`** (lines like `export const auditRequested: any` and `async ({ step }: any)`).

```
packages/inngest/src/functions/credit-aggregator.ts:104:  export const creditAggregator: any
packages/inngest/src/functions/credit-aggregator.ts:110:  async ({ step }: any)
packages/inngest/src/functions/prepaid-credit-expirer.ts:154,160
packages/inngest/src/functions/auto-track-repos.ts:22,28
packages/inngest/src/functions/audit-requested.ts:34,37
packages/inngest/src/functions/stripe-reconcile.ts:36,42
packages/inngest/src/functions/index.ts:8: export const functions: any[]
```

* **Mid (D.M1):** Inngest's TS-types for `createFunction` are notoriously brittle across versions. The `any` here is a pragmatic dodge, but it disables inference for `step.run`, `step.sleep`, `event.data`. This is one reason the Inngest functions are also untested (B.S2) — the type signal is gone.
* Fix: import explicit `InngestFunction` + `Context` types. ~1 dev-day.

### D.6 Explicit return-types on public DAL functions

Spot-check:

* `packages/billing/src/credits.ts` — every export has explicit return type: `Promise<CreditBalance>`, `Promise<ConsumeResult>`, etc. **Exceptional**.
* `packages/billing/src/subscription.ts` — same. `ensureSubscription(): Promise<SubscriptionSnapshot>`, `canRunAudit(): QuotaCheck`. **Exceptional**.
* `apps/web/src/lib/dal/galaxie.ts` — checked via Wave-1 Audit-Diff: explicit. **Exceptional**.

### D.7 Drizzle-schema → TS-types pipeline

* `packages/db/src/schema.ts` defines tables with `pgTable(...)`, types come via `typeof workspace.$inferSelect`.
* `apps/web/src/lib/customer-dal.ts:7` imports `schema` from `@vk/db` and uses inferred types — no manual `interface Customer { ... }` duplication detected.
* **Strong**. One drift-vector: `audit-trail-export.ts` uses `Record<string, unknown>` for CSV-emit which loses the Drizzle inference. Acceptable trade-off.

### D.8 Zod schemas at API boundaries

```
$ grep -rn "from \"zod\"\|from 'zod'" --include="*.ts" --include="*.tsx" apps packages
packages/llm/src/rules/conflicting-rules.ts:5
packages/llm/src/rules/context-bloat-llm.ts:12
```

**Only 2 imports total** — both inside `@vk/llm` (Anthropic structured-output validation, which is correct).

**Mid (D.M2):** No Zod-validation at:
* `/api/install-webhook/route.ts:59` — `payload = JSON.parse(rawBody) as Record<string, unknown>` (raw cast)
* `/api/notify-update/route.ts:61` — `body = JSON.parse(rawBody) as NotifyBody` (cast)
* All "use server" actions in `apps/web/src/lib/*-actions.ts` — `FormData` / args validated by type-shape only

Server-actions in Next 16 can use `formData.get()` with a Zod parse — none do. The route-handlers cast JSON-input directly. For a B2B-launch with Bundle-B input-validation hardening, Zod at the boundary is non-negotiable. **Strong-recommend** during Bundle-A/B.

### D.9 `noUncheckedIndexedAccess`

Confirmed ON at `tsconfig.base.json:10`. All package `tsconfig.json` files extend the base. **Exceptional**.

### D.10 Next.js 16 Promise-params

Audited all 16 dynamic-route pages — all use `params: Promise<{ … }>`:

```
apps/web/src/app/[workspace]/layout.tsx:21
apps/web/src/app/[workspace]/page.tsx:18
apps/web/src/app/[workspace]/scans/[id]/page.tsx:15
apps/web/src/app/[workspace]/customers/[customerId]/page.tsx:28
apps/web/src/app/[workspace]/repos/[repoId]/page.tsx:22
apps/web/src/app/[workspace]/repos/[repoId]/access/page.tsx:35
… (all 16 checked)
```

**Exceptional**. The Next 16 migration is correctly done.

---

## Part E — CI Pipeline

`.github/workflows/ci.yml` (single workflow, 4 jobs).

### E.1 Jobs

| Job | Trigger | Steps | Duration cap |
|---|---|---|---|
| `gates` | push + PR to main | install → typecheck → lint → unit-tests → eval (smoke) → doc:check (warn-only) → build | 15min |
| `integration` | **push to main only** | install → migrate → test:integration | 15min |
| `lighthouse` | **PR only** | install → build → `lhci autorun` | 15min |
| `conflict-eval` | push + PR | install → eval:conflicts (no-op without `ANTHROPIC_API_KEY`) | 20min |

### E.2 Required-checks for main-merge

GitHub doesn't expose required-status-checks in `ci.yml` — that's a repo-settings flag (`gh api repos/.../branches/main/protection`). Not verifiable from this sandbox. **Strong (E.S1):** verify in GitHub UI before launch that `gates`, `lighthouse`, `conflict-eval` are required for PR-merge.

### E.3 Test-times + caching

* Turbo cache enabled for typecheck + build (verified `>>> FULL TURBO` in §A.2 above).
* `actions/setup-node@v4` uses `cache: pnpm` — pnpm-store cached across runs.
* Unit-tests: 4.2s locally. CI likely 6-8s. Fast.
* Integration: skipped on PR — limits MTTR-detection of cross-tenant regressions. **Mid (E.M1)**.

### E.4 Drift-detection (schema/env-vars)

* No `drizzle-kit check` step. The migration runs in `integration` job (line 76 in CI) — if a developer added a column without generating a migration, it'd surface there. Acceptable for solo-dev.
* No env-var-schema validator. Wave-1 Infra S7 ("typos in 14 Stripe-Price vars silently `null`") — relevant here. `apps/web/src/lib/env.ts` doesn't exist (verified).
* **Strong (E.S2)**: add a `pnpm doc:check`-style script for env-var drift before launch.

### E.5 Lighthouse-CI thresholds

`.lighthouserc.json:20-26`:
```
"categories:performance": ["error", { "minScore": 0.85 }],
"categories:accessibility": ["error", { "minScore": 0.95 }],
"categories:best-practices": ["error", { "minScore": 0.95 }]
```

* `"error"` blocks merge. Wave-1 Infra S9 flagged this as flake-risk. Confirmed.
* `numberOfRuns: 1` — single Lighthouse run, no median. **Strong (E.S3)**: bump to `numberOfRuns: 3` + use median, OR switch `"error"` to `"warn"` for the perf-category at minimum (a11y/BP are more deterministic).

### E.6 Production-deploy gate

`vercel.json:1-6`:
```
"buildCommand": "cd ../.. && pnpm turbo run build --filter=@vk/web && pnpm --filter @vk/db exec tsx src/migrate.ts"
```

* No deploy-gate beyond Vercel's own (auto-deploys main on push).
* `pnpm install --frozen-lockfile=false` (in `installCommand`) is a known Wave-1 Infra S6 finding — lockfile-drift can land in production.
* Migration runs **in build** — Wave-1 Infra S6 calls this a rollout-race (Vercel-Fluid-Compute regions migrate concurrently). **Strong** but logged in Infra report.

---

## Part F — Eval / Golden-Set

### F.1 `eval/conflicts/` drift

```
$ stat -f "%Sm %N" eval/conflicts/run.ts eval/conflicts/dataset.json
May 18 08:37 2026 eval/conflicts/run.ts
May 16 22:21 2026 eval/conflicts/dataset.json
```

* `run.ts` is **2 days newer** than `dataset.json`. Wave-1 Audit-Diff flagged this.
* Read `run.ts:1-40` + `dataset.json:1-30`: the dataset has 6 pairs + `fpr_target: 0.15`. `run.ts` reads `RUNS_PER_PAIR = Number(process.env.VK_EVAL_N ?? 3)` and parses `data.fpr_target`. Schema is **compatible** — drift is purely cosmetic (run.ts added the per-band reporting, dataset unchanged).
* **Mid (F.M1)**: 6 pairs is thin for a true FPR-test. PRD constraint #13 mentions "30-File-Golden-Set" — the golden-set covers that (34 entries in `manifest.json`), but the conflict-eval is separate and small.

### F.2 `eval/golden-set/`

* `manifest.json`: 34 entries, schema-validated against `manifest.schema.json`.
* Runs via `pnpm eval` (= `tsx eval/smoke.ts`) — assertion-based walk per entry against `examples/sample-{good,bad}/`.
* Wired into CI `gates` job step "Golden-set eval".
* **Exceptional**.

### F.3 Eval runs in CI

* `gates: pnpm eval` — yes.
* `conflict-eval: pnpm eval:conflicts` — yes, but no-ops without `ANTHROPIC_API_KEY` secret.
* `eval/conflicts/results/` directory exists but is **empty** (verified). The artifact-upload step in `ci.yml:151-156` has `if-no-files-found: ignore` — so empty-results is silent.
* **Mid (F.M2)**: empty results-dir suggests `conflict-eval` either never ran with the key or the key isn't in repo-secrets. Pre-launch: ensure `ANTHROPIC_API_KEY` secret is set so the trust-center page (`/trust/eval`, which reads from `eval/conflicts/results/*.json`) has actual data.

### F.4 Threshold / gate-config

* `dataset.json:109: "fpr_target": 0.15` — 15% FPR ceiling at the `mid` confidence band.
* `run.ts:227-228`: hard-fails if exceeded.
* **Strong**. Matches PRD constraint #13.

---

## Part G — Pre-Launch Test-Gaps (Recommendation)

Tied to `docs/plans/production-launch-readiness.md` Bundle-A (Auth-Hardening) + Bundle-B (Payment-Fix).

### G.1 Bundle-A Auth-Hardening — required new tests

Each of K1-K5 (Wave-1 Auth) introduces a cross-tenant fix. **Pattern**: replicate `customer-dal.integration.test.ts:95-104` which proves "Workspace-B's row is NOT returned to Workspace-A's user".

| Auth-Kill | Test required | Where to add |
|---|---|---|
| K1 `pollSolution` IDOR | Integration: two workspaces, both with a findingId, ensure cross-fetch returns null | new `apps/web/src/lib/solution-actions.integration.test.ts` |
| K2 `getRepo` cross-tenant via `rootPath` | Integration: two workspaces audit the same `github.com/foo/bar`, ensure scans are workspace-scoped | new `apps/web/src/lib/customers.integration.test.ts` |
| K3 `audit-trail-export` no workspaceId filter on `webhook_event` | Integration: insert webhook_event rows for two workspaces, ensure exporter only returns own | new `apps/web/src/lib/audit-trail-export.integration.test.ts` |
| K4 `exportAuditTrail` owner-only + single-workspace | Integration: admin/member roles, multi-workspace owners | extend file above |
| K5 `revokeMember` cross-workspace | Unit OR integration: try to revoke Workspace-B membership while authed-as Workspace-A owner | new `apps/web/src/lib/membership.test.ts` |
| K7 Better-Auth hardening (`rateLimit`, `__Host-` cookie) | Unit: assert auth-config has `rateLimit: { … }`, `cookies.sessionToken.attributes` | extend `packages/auth/src/server.test.ts` |
| K8 Security headers | Integration via Next 16 `Response` snapshot of `/` — assert `Content-Security-Policy`, `Strict-Transport-Security`, etc | new `apps/web/src/middleware.test.ts` or via Playwright |
| K9 Magic-link server-side rate-limit | Unit: assert `magicLink` plugin config has `rateLimit` | `packages/auth/src/server.test.ts` |
| K10 In-memory rate-limiter → Upstash/KV | Replace with stub + add deterministic time-based test (uses `vi.useFakeTimers`) | new `apps/web/src/lib/rate-limit.test.ts` |

**Tests-effort:** ~8 new test-files, ~50 new test-cases. ~2 dev-days if Cluster-A code-fixes ship in parallel.

### G.2 Bundle-B Payment-Fix — required new tests

| Payment-Kill | Test required | Where to add |
|---|---|---|
| K11 Auto-Overage E2E | Integration: workspace at credit-balance=0 with `autoOverageEnabled=true`, run audit, assert `credit_ledger` row `reason='overage'` + meter-event submitted via MSW | new `apps/web/src/lib/audit-action.overage.integration.test.ts` |
| K12 `sub.current_period_end` deprecated | Unit: webhook fires `customer.subscription.updated` with new shape (`items.data[0].current_period_end`) — assert DB row has non-null `renewsAt` | extend `apps/web/src/app/api/stripe/webhook/route.test.ts` |
| S1 `handleInvoicePaid` idempotency on `invoice.id` | Integration: dispatch the same `invoice.paid` event twice, assert credits granted **once** | extend `route.integration.test.ts` |
| S2 `customer.deleted` handler missing | Integration: dispatch event, assert workspace.stripeCustomerId is nulled-out gracefully | extend `route.integration.test.ts` |

**Tests-effort:** ~3 new test-files / extensions, ~15 new test-cases. ~1 dev-day.

### G.3 Test-strategy patterns to replicate

Nova-3b Sub-A established three patterns worth replicating in Bundle-A/B:

1. **MSW with `onUnhandledRequest: "error"`** (`setup.ts:18`) — guarantees no silent network call escapes. Replicate for Bundle-A K7 (Better-Auth) tests that hit `/api/auth/*`.
2. **`describe.skipIf(!isDbEnabled())`** — lets integration-tests live alongside unit-tests in the same file-tree without breaking local-dev when Postgres isn't up.
3. **`vi.mocked(getDb).mockReturnValueOnce({…select-chain…})`** for unit-level DAL-tests — see `events/stream/route.test.ts:6-25`. This pattern is mockheavy but lets unit-tests run in <100ms without Postgres.

### G.4 Other recommendations

* **Add `expect.assertions(N)` for async-throw cases** in any Bundle-A/B test that uses `await expect(…).rejects.toThrow()`. Codebase currently has zero — acceptable now because tests use "errors-as-values" pattern, but Bundle-A IDOR-tests will use `rejects.toThrow` for the failure-path.
* **Add `vi.useFakeTimers` for cycle/expiry tests** — `prepaid-credit-expirer.ts` (30-day), `rate-limit.ts` (sliding-window), `credits.ts` (cycle-rollover). Wave-1 Sub-6 (this doc) Mid-finding.
* **Flip integration-job to PR + main** (not just main) — for Bundle-A IDOR-tests to gate the PR. CI-cost is acceptable (~2min Postgres-startup + ~5min test-time).

---

## Appendix — Findings Index by Severity

### Kill (2)

* **B.K1** `apps/web/src/lib/apply-dal.ts` (228 LOC) — zero coverage on auto-fix orchestration. Also the NFT-trace culprit (A.6 build-warning).
* **B.K2** `apps/web/src/lib/membership.ts` (211 LOC) — Wave-1 Auth K5 (cross-workspace revoke IDOR) lives here, zero tests.
* **B.K3** `packages/billing/src/credits.ts` (300 LOC) — core money-path (`consumeCredits`, `grantCredits`, `resetCycleQuota`), zero dedicated tests.
* **Deps.K1** `vitest <4.1.0` critical CVE (`pnpm audit`) — dev-only, low actual risk, easy fix (`pnpm up vitest@latest`).

### Strong (9)

* **B.S1** `audit-trail/route.test.ts` mocks `exportAuditTrail` — Wave-1 Auth K3/K4 not detectable by current tests.
* **B.S2** All 5 Inngest functions (audit-requested, credit-aggregator, prepaid-credit-expirer, stripe-reconcile, auto-track-repos) untested.
* **B.S3** `apps/web/src/lib/customers.ts` (164 LOC) — Wave-1 Auth K2 lives here, zero tests.
* **B.S4** `apps/web/src/lib/install-requests.ts` (220 LOC) — token-issuer, zero tests.
* **B.S5** `apps/web/src/lib/billing-actions.ts` (231 LOC) — Stripe Checkout + Portal entry, zero tests.
* **B.S6** `apps/web/src/lib/rate-limit.ts` (115 LOC) — K10-Auth in-memory limiter, zero tests.
* **B.S7** `packages/billing/src/subscription.ts` (240 LOC) — quota-check + ensureSubscription, zero tests.
* **E.S1** Required-checks for main-merge not verifiable from sandbox — confirm in GitHub UI.
* **E.S2** Add env-var-schema validator (Wave-1 Infra S7).
* **E.S3** Lighthouse-CI `numberOfRuns: 1` + `"error"` threshold → flake-risk.
* **Deps.S1** `postcss <8.5.10` ships in production build (bump `next` patch).
* **Deps.S2** `hono <4.12.21` × 4 (via `shadcn` CLI) — dev-only.

### Mid (12)

* **A.Mid1** Build-warning: NFT-trace at `apply-dal.ts` + `apply-actions.ts`.
* **A.Mid2** `eslint.config.js:32` disables `no-explicit-any` globally.
* **B.M1** `/api/inngest/route.test.ts` is a 1-test smoke — INNGEST_SIGNING_KEY wiring untested.
* **B.M2** Audit-rules `duplicate-guidance` / `stale-references` / `unused-agents` only integration-covered.
* **B.M3** `lib/solution-actions.ts`, `lib/scan-status.ts`, `lib/fix-actions.ts`, `lib/workspace-ai-actions.ts`, `lib/customer-actions.ts`, `lib/github-fetch.ts` (ZIP-Traversal) — all untested.
* **C.M1** Zero `vi.useFakeTimers` — cycle/expiry edge-cases uncovered.
* **D.M1** 9 `: any` in `packages/inngest/src/functions/*.ts` — Inngest types disabled.
* **D.M2** Zero Zod-validation at API/server-action boundaries (`@vk/llm` is the only Zod consumer).
* **E.M1** Integration-tests skip on PR — IDOR-regressions not gated.
* **F.M1** Conflict-eval dataset has only 6 pairs (vs golden-set's 34).
* **F.M2** `eval/conflicts/results/` is empty — `ANTHROPIC_API_KEY` likely not configured in repo-secrets.
* **Deps.M** `tmp`, `uuid`, `diff` moderates — defer.

### Weak (7)

* **A.Weak1** pnpm 10.18.1 → 11.5.2 nag.
* **A.Weak2** `Ignored build scripts: unrs-resolver`.
* **A.Weak3** ESLint warning at `HeroSection.tsx:113` — unused `setGalaxieSettings`.
* **B.W1** `lib/dpa-actions.ts`, `lib/vat.ts`, `lib/workspaces.ts`, `lib/health-check.ts` — untested.
* **B.W2** `packages/db/src/schema.ts` migration-tests = none (run-by-using).
* **B.W3** `packages/auth/src/emails/*` template-render tests = none.
* **C.W1** Zero `expect.assertions(N)` — acceptable given errors-as-values style.
* **F.W1** `eval/conflicts/dataset.json` 2-day-older-than `run.ts` — cosmetic only.
