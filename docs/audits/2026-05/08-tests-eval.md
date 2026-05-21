# Audit Sub-8 — Tests + Eval

> Generated: 2026-05-21
> Domain: Vitest-Coverage · Eval-Set · Snapshots · CI-Gates
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}

## Summary

- **Test-Files total:** 32 `*.test.ts(x)` files (no `*.spec.*` used)
- **Test-Cases total:** ~255 `describe`/`it`/`test` blocks across the repo
- **Critical paths uncovered:** 7 (Kill, see Matrix)
- **Skipped tests:** 0 (clean — no `.skip` / `xit` / `xdescribe`)
- **Snapshot folders:** 0 (clean — no `__snapshots__/`)
- **`console.log` in tests:** 0 (clean)
- **Mock usage (`vi.mock`/`vi.fn`):** 0 — **NO MOCKING ANYWHERE**
- **E2E configured:** ❌ no `playwright.config.*`. `scripts/docker-e2e-smoke.sh` is a stack-health smoke, not a UI E2E.
- **Eval-Set last-modified:** golden-set/manifest.json 2026-05-18 · conflicts/dataset.json 2026-05-16. LLM-rules source last-modified 2026-05-21 → **dataset trails source by 5 days**, manifest by 3.
- **CI-Gate:** `pnpm test` + `pnpm eval` + `pnpm eval:conflicts` (push-only, optional) wired in `.github/workflows/ci.yml`. ✅

## Findings

### [Kill] FN-01 — Stripe-Webhook (500 LOC) hat 0 Tests
**Path:** `apps/web/src/app/api/stripe/webhook/route.ts`
**Issue:** 500-Zeilen Webhook-Handler ohne einen einzigen Test. Verarbeitet Signature-Validation, Idempotency, customer.subscription.*, invoice.*, payment_intent.* — Billing-Drift-Surface = maximal.
**Why Kill:** Stripe-Webhook ist das einzige In-Bound für die gesamte Billing-State. Ein Regression-Bug schickt User in falsche Tier-Zustände, false-Charges oder Hängenden-Subscriptions ohne Detection.
**Suggested Fix:** Unit-Tests mit `stripe.webhooks.constructEvent` mock + Fixture-Events (Stripe CLI `stripe trigger > fixtures/*.json`). Mindestens: signature-fail, idempotency, subscription.created/updated/deleted, invoice.payment_failed.

### [Kill] FN-02 — `audit-action.ts` (418 LOC) hat 0 Tests
**Path:** `apps/web/src/lib/audit-action.ts`
**Issue:** Server-Action für den Hauptpfad (Audit triggern). 418 LOC ohne Test. Repo-Lock-File-Pattern, rate-limit, GitHub-Fetch, scan + audit + persist sind hier orchestriert.
**Why Kill:** Wenn das Brot-und-Butter-Feature der App bricht, merkt keine CI das. Die einzige Audit-Coverage ist `packages/audit/src/audit.test.ts` für die Rule-Engine — nicht für die App-Action.
**Suggested Fix:** Integration-Test mit echtem `examples/sample-bad` (already used in audit.test.ts) und gemockten Stripe-Meter-Calls. Asserts auf return-Struktur + DB-Persistence-Aufrufen.

### [Kill] FN-03 — Inngest-Route + Install-Webhook ungetestet
**Path:** `apps/web/src/app/api/inngest/route.ts` (4 LOC, OK trivial), `apps/web/src/app/api/install-webhook/route.ts` (312 LOC, **kritisch**), `apps/web/src/app/api/events/stream/route.ts`, `apps/web/src/app/api/audit-trail/route.ts`, `apps/web/src/app/api/notify-update/route.ts`, `apps/web/src/app/api/auth/[...all]/route.ts`
**Issue:** Alle 7 API-Route-Handler haben 0 Tests. Install-Webhook (312 LOC) verarbeitet GitHub-App-Installation-Events — Drift hier ⇒ Onboarding-bricht-silent.
**Why Kill:** API-Routes sind das Public-Contract gegen Stripe, GitHub und Inngest — alle externen Systeme. Ohne Mocked-Integration-Tests gibt es nichts, was Contract-Drift fängt.
**Suggested Fix:** msw (mock-service-worker) + supertest-Pattern oder direkt `route.POST(new Request(...))` Aufrufe mit Fixture-Bodies pro Event-Type.

### [Kill] FN-04 — DAL-Layer (apply-dal 394 LOC, customer-dal 303 LOC) ungetestet
**Path:** `apps/web/src/lib/apply-dal.ts`, `customer-dal.ts`, `customers.ts`, `workspaces.ts`, `membership.ts`, `install-requests.ts`, `scan-status.ts`
**Issue:** Mehrere Hundert Zeilen DB-Logic mit RBAC-Implications (`requireMember`, `requireOwner`) ohne Tests. Einziger DAL-Test: `dal/galaxie.test.ts` (pure-function Severity-Aggregation, kein DB).
**Why Kill:** RBAC-Bug in einer DAL-Funktion (z.B. missing workspace-id-Check) ⇒ Cross-Tenant-Data-Leak. Höchstes Risiko-Surface im gesamten Repo.
**Suggested Fix:** pg-mem oder testcontainers für Postgres-in-test. Pro Funktion: positive + RBAC-negative-Test (membership-mismatch → throws).

### [Kill] FN-05 — Session-Logic ungetestet
**Path:** `apps/web/src/lib/session.ts` (31 LOC)
**Issue:** Klein aber load-bearing: `requireSession()` und Konsorten. Wenn das schweigend `null` zurückgibt statt zu throwen, sind alle nachgelagerten Auth-Checks broken.
**Why Kill:** Auth-Boundary. `packages/auth/src/server.test.ts` testet nur `isAuthEnabled`, nicht die App-Wrapper.
**Suggested Fix:** Unit-Test mit gemocktem `getAuth().api.getSession()` → assert throw bei null-Session, return bei valid.

### [Kill] FN-06 — Billing-Actions + Stripe-Meters ungetestet
**Path:** `apps/web/src/lib/billing-actions.ts` (231 LOC), `apps/web/src/lib/stripe-meters.ts`, `apps/web/src/lib/stripe.ts`, `apps/web/src/lib/cost-estimator.ts`
**Issue:** Stripe-Wrapper plus meter-event Reporter ohne Tests. Falsch-gemeterte Events ⇒ User wird falsch abgerechnet.
**Why Kill:** Meter-Drift ist invisible-failure: keine Error, einfach falsche Rechnung Wochen später.
**Suggested Fix:** Mocked `stripe.billing.meterEvents.create` mit Spy → assert payload-Shape + idempotency-keys.

### [Kill] FN-07 — Audit-Rules pro File ungetestet
**Path:** `packages/audit/src/rules/*.ts` (5 Files, 279 LOC total)
**Issue:** Nur `audit.test.ts` (integration über `runAudit`) und `token-budget.test.ts` (1 von 5 Rules). Die anderen 4 Rules — `stale-references`, `duplicate-guidance`, `context-bloat`, `unused-agents` — haben keine direkten Unit-Tests, nur indirekt via Integration.
**Why Kill:** Integration-only ⇒ wenn Rule-X einen False-Positive auf einer neuen Eingabe wirft, fängt die `audit.test.ts` das nur, wenn das `examples/sample-bad` Fixture diesen Pfad triggert. Edge-Cases pro Rule sind unverlässlich gecovered.
**Suggested Fix:** Pro-Rule `.test.ts` mit 3–5 fokussierten Fixtures (positive, negative, edge). Pattern wie `token-budget.test.ts` schon vorhanden.

### [Strong] FN-08 — Conflicts-Eval-Dataset trails LLM-Rule by 5 Tage
**Path:** `eval/conflicts/dataset.json` (modified 2026-05-16) vs `packages/llm/src/rules/conflicting-rules.ts` (modified 2026-05-21)
**Issue:** Source-of-truth wurde 5 Tage nach dem Eval-Set updated. `conflicting-rules.test.ts` (das Unit-File) testet nur den No-Op-Pfad (ANTHROPIC_API_KEY unset). Es gibt keine guarantee, dass das Eval-Dataset noch die richtigen Output-Shapes erwartet.
**Why Strong:** Eval-CI-Gate gibt false-confidence wenn Dataset-Schema vs Rule-Output divergiert. Drift > 1 Phase ist die Grenze laut Severity-Konvention.
**Suggested Fix:** Pre-commit-Hook oder `eval:conflicts --check-schema`, der bei Schema-Drift FAIL'd. Schema-Pin via JSON-Schema beim Output.

### [Strong] FN-09 — Context-Bloat-LLM-Rule kein Eval
**Path:** `packages/llm/src/rules/context-bloat-llm.ts` exists; `eval/conflicts/` covers only `conflicting-rules.ts`. Manifest erwähnt 4 `adv-context-bloat-llm-*` Fixtures, aber kein `eval/context-bloat/run.ts` Skript existiert.
**Issue:** Die zweite LLM-Rule wird vom CI-Gate nicht eval'd. Manifest dokumentiert Erwartungswerte ("LLM-eval ground-truth target heading = '## Archive'") aber niemand misst gegen sie.
**Why Strong:** LLM-Rule ohne Eval == LLM-Rule ohne Quality-Bar. CLAUDE.md sagt "Conflict-Eval (CI-Gate)" — context-bloat hat keinen.
**Suggested Fix:** Analog zu `eval/conflicts/run.ts` ein `eval/context-bloat/run.ts` mit FPR-Gate + N=3 Variance + Result-Persist.

### [Strong] FN-10 — Kein API-Route- oder Integration-Test-Pool
**Path:** `vitest.config.ts` + `apps/web/vitest.config.ts`
**Issue:** Root und apps/web haben `vitest.config.ts`. Keine `pool`-Separation für Integration-Tests, kein `setupFiles`, kein `testTimeout`-Override für slow-tests, kein `globalSetup` für DB.
**Why Strong:** Wenn DAL-Tests dazukommen (FN-04), brauchen sie isolated DB-state, deutlich höhere Timeouts und Setup/Teardown. Ohne Pool-Separation laufen sie parallel zu Unit-Tests und flakke.
**Suggested Fix:** `vitest.workspace.ts` mit zwei Projekten: `unit` (default pool=threads, fast) und `integration` (pool=forks, isolate=true, slow). pnpm-Scripts: `test`, `test:integration`.

### [Strong] FN-11 — Apps/web hat eigene `vitest.config.ts`, aber Root läuft auch web-tests
**Path:** `apps/web/vitest.config.ts` vs `vitest.config.ts`
**Issue:** Root-config inkludiert `apps/web/src/**/*.test.{ts,tsx}`. apps/web hat eigene config mit nur `src/**/*.test.{ts,tsx}`. **Doppelausführung möglich**, je nachdem ob `pnpm test` (root) oder `pnpm --filter @vk/web test` läuft. CI nutzt root → ok, aber lokal verwirrend.
**Why Strong:** Confusion + Risk that one config drifts. Galaxie-Tests im `apps/web/src/components/galaxie/pixi/` laufen über root-config aliases, aber `apps/web/vitest.config.ts` hat nur `@` alias. Sub-test-runs scheitern silent.
**Suggested Fix:** Ein einziger root `vitest.workspace.ts` oder klare Documentation: "Always run from root."

### [Strong] FN-12 — promptfoo.yaml ist Dead-Code
**Path:** `eval/promptfoo.yaml`
**Issue:** Datei sagt selbst "Not yet wired (Sprint 0.9)". Verweist auf nicht-existente `./conflicts/prompt-v1.txt`. Wird nirgendwo aufgerufen.
**Why Strong:** Dead-config dokumentiert eine Intention die nicht eingelöst ist — Misleading für jeden, der Eval-Setup verstehen will.
**Suggested Fix:** Entweder wire (anlegen + zu `pnpm eval:promptfoo` Script hinzufügen + zu CI) oder löschen mit ADR.

### [Mid] FN-13 — Keine Mocks irgendwo (`vi.mock` = 0 occurrences)
**Path:** Gesamt-Repo
**Issue:** `grep -r "vi.mock"` returnt nichts. Alle Tests sind reine Unit-Tests gegen pure Funktionen oder direkter env-var-Manipulation (siehe `client.test.ts`, `server.test.ts`).
**Why Mid:** Kein-Mock-Kultur erklärt, warum keine API-Route/Webhook/Action getestet ist — der Codebase hat noch nie versucht, externe Calls zu mocken. Erst-Mock-Setup ist Aktivierungs-Energie.
**Suggested Fix:** Eine Beispiel-Test-Datei (z.B. `stripe-webhook.test.ts`) mit `vi.mock('stripe')` als Template + Doc-Note in `docs/architecture.md`.

### [Mid] FN-14 — Component-Coverage <10% (4 von 79 components)
**Path:** `apps/web/src/components/` (79 .tsx files, 4 .test.ts files alle in `galaxie/`)
**Issue:** Nur Galaxie-Components haben Tests (diff-renderer, inspector-templates, Camera, quadtree). LoginForm, ActivationChecklist, RepoTreeView, GalaxieSettingsPopover, etc. — alle nicht.
**Why Mid:** UI-Tests sind teuer; aber kritische Form-Components (LoginForm — gestern erst gebaut) ohne Tests bedeuten, Magic-Link-Resend kann silent regressen.
**Suggested Fix:** @testing-library/react für die 5–10 form-kritischen Komponenten (LoginForm, MagicLinkResend, BillingForm).

### [Mid] FN-15 — Schwache Assertions in 2 Tests
**Path:** `packages/billing/src/byok-crypto.test.ts:28-29`, `apps/web/src/components/galaxie/inspector-templates.test.ts:21,40`, `apps/web/src/lib/repo-galaxie/layout.test.ts:71`, `apps/web/src/lib/galaxie/layout.test.ts:40,54`
**Issue:** `toBeDefined()` / `toBeTruthy()` ohne behavior-assertion in 6 Stellen. byok-crypto check ob `iv` und `authTag` existieren — aber nicht ob sie die richtige Länge/Format haben.
**Why Mid:** Tests passen, auch wenn Funktion mutiert wird zu `{ iv: '', authTag: '' }`. Low-value-Coverage.
**Suggested Fix:** Replace mit `.toHaveLength(12)` (IV-Bytes) / `.toMatch(/^[a-f0-9]+$/)`.

### [Mid] FN-16 — `apps/web/src/lib/dal/` Sub-Folder existiert, aber nur `galaxie.ts`
**Path:** `apps/web/src/lib/dal/`
**Issue:** Nur eine DAL-Datei lebt im `dal/` Subfolder; der Rest (`customer-dal.ts`, `apply-dal.ts`, `solution-dal.ts`) liegt flach in `lib/`. Inkonsistente Namespace ⇒ Discovery-Penalty für Audit-Coverage-Reviews.
**Why Mid:** Nicht Test-spezifisch, aber Test-Discovery ("welche DAL-Files brauchen Tests?") wird harder. Plus: galaxie/dal hat Tests, andere DALs nicht — Inconsistenz pre-existing.
**Suggested Fix:** Outside-Scope hier, aber dokumentieren in Audit-Sub-2 (Architecture).

### [Weak] FN-17 — Eval-Smoke `tsx eval/smoke.ts` ist sequenziell ohne Parallelism
**Path:** `eval/smoke.ts:50`
**Issue:** 34 Entries in golden-set, sequenziell durchgewalkt. Tests ohne await Promise.all = unnötig serial.
**Why Weak:** Performance-Hit in CI (~Sekunden), nicht kritisch.
**Suggested Fix:** `await Promise.all(manifest.entries.map(...))` mit kleinerem `p-limit` falls fs-thrashing.

### [Weak] FN-18 — `eval:conflicts` no-ops silently bei missing key
**Path:** `eval/conflicts/run.ts:124-130`
**Issue:** Wenn `ANTHROPIC_API_KEY` unset, exit 0 mit info-message. CI gate akzeptiert das als "pass". Lokale PR-Reviewer können nicht sehen, dass kein echter Eval lief.
**Why Weak:** Akzeptabel für Open-Source-Forks, aber CI auf `main` sollte den Key requiren. `.github/workflows/ci.yml` runt es nur on push to main → ok, aber falls Secret fehlt = false-green.
**Suggested Fix:** Auf `main`-push: fail wenn Key unset. Auf PRs: skip ok. Required-Check Logik in run.ts: `if (process.env.CI === 'true' && process.env.GITHUB_REF === 'refs/heads/main') throw`.

### [Exceptional] FN-19 — Eval-Conflicts Setup mit Per-Band-FPR + Variance-Runs
**Path:** `eval/conflicts/run.ts`
**Issue:** Sehr hochwertiges Eval-Pattern: N=3 runs/pair, majority-vote, per-band-FPR-tracking, persisted-results für `/trust/eval` page, CI-Gate nur bei `mid` band. Klar dokumentiert Intent.
**Why Exceptional:** Industry-standard für LLM-Eval-Reliability (variance-aware, confidence-band-aware). Sollte als Vorbild für FN-09 (context-bloat-eval) dienen.
**Suggested Fix:** Keep + replicate für context-bloat-llm.

### [Exceptional] FN-20 — Golden-Set mit 34 entries + adversarial taxonomy
**Path:** `eval/golden-set/manifest.json`
**Issue:** Hand-crafted 34-Entry Golden-Set mit `fixture` / `dogfood` / `adversarial` / `real-world` Taxonomy, FPR-target = 15%. Schema versioned. Klar dokumentierte Edge-Cases (BOM, CRLF, bilingual, oversize, symlink).
**Why Exceptional:** Domain-Knowledge sehr gut encoded. Wenn Parser regresst (z.B. UTF-8-BOM-Bug), fängt Eval das mit Confidence.
**Suggested Fix:** Keep + erweitern wie growth_plan beschreibt.

## Test-Coverage-Matrix

| Critical Path                                  | Has Tests | Severity      |
|------------------------------------------------|-----------|---------------|
| `apps/web/src/app/api/stripe/webhook/route.ts` | ❌        | Kill (FN-01)  |
| `apps/web/src/lib/audit-action.ts`             | ❌        | Kill (FN-02)  |
| `apps/web/src/app/api/inngest/route.ts`        | ❌        | Kill (FN-03)  |
| `apps/web/src/app/api/install-webhook/route.ts`| ❌        | Kill (FN-03)  |
| `apps/web/src/app/api/auth/[...all]/route.ts`  | ❌        | Kill (FN-03)  |
| `apps/web/src/app/api/events/stream/route.ts`  | ❌        | Kill (FN-03)  |
| `apps/web/src/lib/apply-dal.ts`                | ❌        | Kill (FN-04)  |
| `apps/web/src/lib/customer-dal.ts`             | ❌        | Kill (FN-04)  |
| `apps/web/src/lib/customers.ts`                | ❌        | Kill (FN-04)  |
| `apps/web/src/lib/workspaces.ts`               | ❌        | Kill (FN-04)  |
| `apps/web/src/lib/membership.ts`               | ❌        | Kill (FN-04)  |
| `apps/web/src/lib/session.ts`                  | ❌        | Kill (FN-05)  |
| `apps/web/src/lib/billing-actions.ts`          | ❌        | Kill (FN-06)  |
| `apps/web/src/lib/stripe-meters.ts`            | ❌        | Kill (FN-06)  |
| `apps/web/src/lib/stripe.ts`                   | ❌        | Kill (FN-06)  |
| `packages/audit/src/rules/stale-references.ts` | indirect  | Kill (FN-07)  |
| `packages/audit/src/rules/duplicate-guidance.ts`| indirect | Kill (FN-07)  |
| `packages/audit/src/rules/context-bloat.ts`    | indirect  | Kill (FN-07)  |
| `packages/audit/src/rules/unused-agents.ts`    | indirect  | Kill (FN-07)  |
| `packages/audit/src/rules/token-budget.ts`     | ✅        | -             |
| `packages/llm/src/rules/conflicting-rules.ts`  | partial¹  | -             |
| `packages/llm/src/rules/context-bloat-llm.ts`  | ❌ eval   | Strong (FN-09)|
| `packages/parser/src/parse-file.ts`            | ✅        | -             |
| `packages/parser/src/classify.ts`              | ✅        | -             |
| `packages/parser/src/scan.ts`                  | indirect  | Mid           |
| `packages/parser/src/tokens.ts`                | indirect  | Mid           |
| `packages/db/src/client.ts`                    | ✅        | -             |
| `packages/auth/src/server.ts`                  | ✅ partial²| -             |
| `packages/billing/src/byok-crypto.ts`          | ✅ weak³  | Mid (FN-15)   |
| `packages/billing/src/tiers.ts`                | ✅        | -             |
| `packages/billing/src/intensity.ts`            | ✅        | -             |
| `packages/inngest/src/client.ts`               | ✅        | -             |
| `packages/github-app/src/webhook.ts`           | ✅        | -             |
| `packages/github-app/src/manifest.ts`          | ✅        | -             |
| `packages/pr-workflow/src/pr-workflow.ts`      | ✅        | -             |
| `packages/fixes/src/generate.ts`               | ✅        | -             |
| `apps/web/src/lib/dal/galaxie.ts`              | ✅        | -             |
| `apps/web/src/lib/middleware-redirects.ts`     | ✅        | -             |
| `apps/web/src/lib/apply-mode.ts`               | ✅        | -             |
| `apps/web/src/lib/cache-tags.ts`               | ✅        | -             |
| `apps/web/src/lib/solution-dal.ts`             | ✅        | -             |
| `apps/web/src/lib/galaxie/*`                   | ✅        | -             |
| `apps/web/src/lib/repo-galaxie/*`              | ✅        | -             |

¹ `conflicting-rules.test.ts` deckt nur den `ANTHROPIC_API_KEY` no-op-Pfad ab — kein LLM-Mock-Test.
² `server.test.ts` deckt nur `isAuthEnabled` und `getAuth`-Throw — nicht die Session-Handling-Wrapper.
³ `byok-crypto.test.ts` nutzt `toBeDefined()` ohne Format-Check (FN-15).

## CI-Gate Status

| Gate                             | Wired                 | Comment                                       |
|----------------------------------|-----------------------|-----------------------------------------------|
| Typecheck                        | ✅ `pnpm typecheck`   | turbo                                         |
| Lint                             | ❌ commented-out      | "Next 16 removed `next lint`" — Follow-Up Sub-Plan offen |
| Unit tests                       | ✅ `pnpm test`        | `vitest run` — alle 32 test-files             |
| Golden-Set Eval                  | ✅ `pnpm eval`        | `tsx eval/smoke.ts`                           |
| Conflict-Eval                    | ✅ `pnpm eval:conflicts` | only on push to main, no-op without secret |
| Context-Bloat-LLM-Eval           | ❌                    | FN-09 — Rule existiert, kein Eval-Skript      |
| Doc-Consistency                  | ⚠ warning-only        | doesn't gate                                   |
| Build                            | ✅                    | `pnpm build`                                  |
| E2E (Playwright)                 | ❌                    | kein playwright.config existiert              |
| Stack-Smoke (Docker)             | ⚠ not in CI           | `scripts/docker-e2e-smoke.sh` local-only      |

## Top 5 Empfehlungen (priorisiert)

1. **Stripe-Webhook + audit-action Tests** (Kill, FN-01/FN-02) — größtes Risiko-pro-Stunde-Investment.
2. **DAL-Integration-Tests** mit testcontainers oder pg-mem (Kill, FN-04) — RBAC-Drift = Cross-Tenant-Leak.
3. **Per-Rule Audit-Tests** (Kill, FN-07) — Pattern bereits via `token-budget.test.ts` etabliert, nur replizieren.
4. **vitest.workspace.ts** mit unit/integration-Pool-Separation (Strong, FN-10) — Pre-Requisite für #1–#3.
5. **context-bloat-llm Eval-Skript** (Strong, FN-09) — Manifest hat Fixtures, fehlt nur Runner.

## Out-of-Scope (für andere Sub-Audits)

- Lint-Config (Sub-9?)
- Snapshot-Stability für Visual-Regression (Sub-3 UI-Audit?)
- DAL-RBAC-Coverage als RBAC-Audit (Sub-5 Security?)
- Eval-Result-Trends auf `/trust/eval` page (Sub-?)
