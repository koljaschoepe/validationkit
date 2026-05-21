# Plan — Nova-3b · Tests-Critical-Paths (Master)

> Erstellt: 2026-05-21
> Status: 🟡 In Review (Master)
> Slug: `nova-3b-tests-critical-paths`
> Confidence: Mid-High — basiert auf 8 User-Entscheidungen aus 2 Discovery-Runden + Sub-8 Audit (`docs/audits/2026-05/08-tests-eval.md` — 7 Kill / 0 mocks im Repo) + Code-Audit von Schlüssel-Files (7 API-Routes, audit-action.ts, DAL-Layer, session.ts, billing-actions, packages/audit/rules/).
> Voraussetzung: Nova-3a abgeschlossen (`docs/plans/done/nova-3-repo-polish-and-prod-prep.md` — ESLint + lint-Script aus Bundle E).
> Sub-Pläne (3): Sub-A (Setup + Stripe-Webhook) · Sub-B (audit-action + API-Routes) · Sub-C (DAL + session + billing + Audit-Rules).

## 1. Ziel

Alle 7 von Sub-8 als `Kill`-Severity markierten Critical-Paths bekommen Unit + Integration-Tests mit msw-Network-Mocking + echter Postgres-DB (via GitHub-Actions postgres-service). CI gewinnt einen Tier-Split (PR=unit-fast, main=integration-slow). Repo-Test-Coverage steigt von Status quo (DAL: 1 von 10, API-Routes: 0 von 7) auf vollständige Kill-Path-Coverage.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID | Runde | Frage | Antwort |
|----|-------|-------|---------|
| Q1 | 1.1 | Scope-Priority | **Alle 7 Kill in 1 großem Plan** (split in 3 Sub-Pläne) |
| Q2 | 1.2 | Mocking-Strategy | **msw + vi.mock** (Network = msw, Module = vi.mock) |
| Q3 | 1.3 | Test-Tier | **Vitest Unit + Integration**, kein Playwright |
| Q4 | 1.4 | CI-Strategie | **Tier-Split**: PR=unit only, main-Push=unit+integration |
| Q5 | 2.1 | Test-DB | **GitHub-Actions postgres-Service** (Container fresh per Job) + lokal docker-compose |
| Q6 | 2.2 | Test-Env | **`.env.test` + vitest setupFiles** mit `dotenv/config` |
| Q7 | 2.3 | Vitest-Setup | **`vitest.workspace.ts` mit Pool-Split** (unit/integration) |
| Q8 | 2.4 | PR-Schnitt | **3 Sub-Pläne** Sub-A/B/C, Master koordiniert |

## 3. Existing-Patterns im Repo (Vorbild)

- **`apps/web/src/lib/dal/galaxie.test.ts`** — einziges DAL-Test-File, nutzt direkte DB-Calls. Pattern für unsere DAL-Tests in Sub-C.
- **`apps/web/src/lib/solution-dal.test.ts`** — zweites DAL-Test-File, ähnliches Pattern.
- **`packages/auth/src/server.test.ts`** — Auth-Server-Test mit env-mocking (`vi.stubEnv` indirekt via DATABASE_URL/AUTH_SECRET checks). Pattern für lib/session.ts in Sub-C.
- **`eval/conflicts/run.ts`** — Sub-8 Exceptional: N=3 variance + per-band-FPR + persistierte Results. Vorbild für robustes Eval-Pattern.
- **`packages/audit/src/audit.test.ts`** — bestehender Integration-Style-Test für Audit-Rules. Pattern für `Sub-C`.
- **Webhook-Idempotenz-Pattern aus Nova-3a Bundle A** — `stripe_meter_event_log` als natural-PK-Dedup. Tests müssen das verifizieren.
- **Nova-2 Plan-Master+Sub-Pattern** (`docs/plans/done/nova/`) — Master koordiniert, Sub-A/B/C werden einzeln executed. Wir folgen exakt.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Playwright E2E** — V2 (Q3). Stripe-Test-Mode-Roundtrip ist Manual-QA in `stripe-go-live.md` §0.
- **Alt-B: testcontainers Library für Postgres** — Verworfen (Q5): GitHub-Actions postgres-Service ist schneller + simpler. Lokal nutzen wir docker-compose das schon läuft.
- **Alt-C: Shared test-DB mit Truncate** — Verworfen (Q5): Pollution-Risk + parallele Tests konfliktigen.
- **Alt-D: Inline-Env in vitest.config** — Verworfen (Q6): test-keys in Repo-Source. `.env.test` ist getrennt.
- **Alt-E: Mock-Provider statt msw** — Verworfen (Q2): Webhook-Signature-Verify braucht echten HTTP-Layer; msw ist Industry-Standard.
- **Alt-F: 1 Mega-PR** — Verworfen (Q8): 24h Effort + 7 Pfade = unreviewbar.
- **Alt-G: DAL-First (Foundation-Up)** — Verworfen (Q1): längste Bauzeit ohne sichtbares Feature; Stripe-Webhook hat Doppel-Charging-Risk, daher Priority.

## 5. Endzustand (nach Master + alle 3 Sub-Pläne)

**Infrastruktur:**
- `vitest.workspace.ts` mit Pool-Projekten `unit` (threads, fast) + `integration` (forks, real-DB).
- `.env.test` enthält Test-Defaults (`DATABASE_URL=…test`, `STRIPE_SECRET_KEY=sk_test_dummy`, `ANTHROPIC_API_KEY=test-anthropic`, etc.).
- `msw` + `@mswjs/data` installed; `apps/web/src/test/msw/` enthält `handlers.ts` (Stripe + Anthropic + GitHub-API) + `server.ts`.
- `pnpm test` läuft Unit-only (default, fast). `pnpm test:integration` läuft beide Pools.
- CI: PR-Job `pnpm test` (unit), main-Push-Job `pnpm test:integration` (unit+integration mit postgres-service).

**Coverage (jede Datei nach Sub-X Done):**
- `apps/web/src/app/api/stripe/webhook/route.ts` (Sub-A) — 6 Event-Types getestet, Signature-Verify (msw + signed mock), Idempotenz (Replay), 503-Fallback.
- `apps/web/src/lib/audit-action.ts` (Sub-B) — happy-path + error-paths + intent-audit-flow + workspace-creation.
- 7 API-Routes (Sub-B) — alle GET/POST handler-shapes + auth-gate.
- DAL-Layer (Sub-C) — `customer-dal`, `apply-dal`, `customers`, `workspace-context`, `install-requests`, `solution-dal` (schon getestet), `dal/galaxie` (schon getestet).
- `lib/session.ts` (Sub-C) — getSessionUser + cache-behavior.
- `lib/billing-actions.ts` + `lib/stripe-meters.ts` (Sub-C).
- 4 von 5 deterministischen Audit-Rules in `packages/audit/src/rules/` (Sub-C) — `stale-references`, `context-bloat`, `duplicate-guidance`, `token-budget`.

**Test-Count (Ziel):** 222 → ~400 Tests (+~180), alle grün.

## 6. Schritte (Master koordiniert; Detail in Sub-A/B/C)

### Master-Pre-Work

- [ ] Sub-A Plan-File schreiben: `docs/plans/nova-3b-sub-a-test-infra-stripe.md`
- [ ] Sub-B Plan-File schreiben: `docs/plans/nova-3b-sub-b-audit-action-api-routes.md`
- [ ] Sub-C Plan-File schreiben: `docs/plans/nova-3b-sub-c-dal-session-billing-rules.md`

### Sub-A — Test-Infrastruktur + Stripe-Webhook (~8h)

1. **Infrastruktur (~3h)**
   - Install msw, msw-trpc (falls relevant), @mswjs/data (optional für DB-fixtures)
   - `vitest.workspace.ts` mit unit + integration Projekten
   - `.env.test` mit Test-Konstanten
   - `apps/web/src/test/msw/handlers.ts` — Stripe-API-Handlers (constructEvent-compatible signed payloads)
   - `apps/web/src/test/msw/server.ts` — setup-server für Node-tests
   - `apps/web/src/test/setup.ts` — beforeAll → server.listen, afterEach → resetHandlers, afterAll → server.close
   - `.github/workflows/ci.yml` — neuer Job `integration` mit `services: postgres`, läuft auf `push` zu main + manuell trigger
   - `package.json` neue Scripts: `test`, `test:integration`, `test:all`

2. **Stripe-Webhook-Tests (~5h)**
   - `apps/web/src/app/api/stripe/webhook/route.test.ts` (~250 LOC):
     - 503-Fallback wenn keys missing
     - Signature-Verify: valid signed payload → 200, invalid → 400
     - Idempotenz: Replay derselben event.id → `duplicate:true`
     - 6 Event-Handler-Cases: checkout.session.completed (subscription), checkout.session.completed (prepaid-pack), customer.subscription.created/updated/deleted, invoice.created, invoice.paid, invoice.payment_failed
   - Integration-Test: echter DB-Roundtrip für jeden Event → verifiziert workspace.tier / subscription.status / credit_ledger Mutations
   - Fix bei Found-Bug: Sub-12 Mid FN-08 (dedupe-INSERT vor Handler-Try → bei Handler-Failure kein Retry möglich)

### Sub-B — audit-action + 7 API-Routes (~7h)

1. **audit-action-Tests (~3h)** — `apps/web/src/lib/audit-action.test.ts`:
   - Happy-Path: form-submission → repo-clone (mock) → parser → audit → DB-write → success-response
   - Error-Paths: invalid URL, clone-failure, parser-error, audit-rule-failure
   - Intent-Audit-Flow: post-magic-link re-run path
   - Background-Path: long-running audit → Inngest-queue (mock)
2. **API-Routes-Tests (~4h)**:
   - `api/inngest/route.test.ts` — serve()-mock + signing-key-verify
   - `api/install-webhook/route.test.ts` — GitHub-HMAC signing-verify
   - `api/notify-update/route.test.ts` — per-repo-Secret HMAC
   - `api/audit-trail/route.test.ts` — workspace-scoped export
   - `api/auth/[...all]/route.test.ts` — better-auth handler (light coverage, lib ist eh getestet)
   - `api/events/stream/route.test.ts` — SSE-Response Headers + workspace-membership-gate
   - `api/stripe/webhook/route.test.ts` — schon in Sub-A

### Sub-C — DAL + session + billing + Audit-Rules (~9h)

1. **DAL-Tests (~5h)** — integration mit real Postgres:
   - `customer-dal.test.ts` — listCustomers, getCustomerById (workspace-scoped)
   - `apply-dal.test.ts` — apply-flow + dispatch
   - `customers.test.ts` — getRepo + listRepos
   - `workspace-context.test.ts` — resolveWorkspaceFromSlug (Nullable-ownerId post-Nova-3a!)
   - `install-requests.test.ts` — list + decide
2. **session-Tests (~1h)** — `lib/session.test.ts`:
   - getSessionUser cached-result
   - membership-gate
   - claimPendingMemberships hook from dashboard
3. **billing-Tests (~1h)** — `lib/billing-actions.test.ts` + `lib/stripe-meters.test.ts`:
   - Tier-upgrade-flow
   - Meter-event with idempotency-key
4. **Audit-Rules-Tests (~2h)** — `packages/audit/src/rules/*.test.ts`:
   - stale-references — fixture-based
   - context-bloat — token-budget fixtures
   - duplicate-guidance — fixture-based
   - token-budget — fixture-based
   - (5th rule `conflicting-rules` ist LLM, schon getestet)

### Master-Acceptance

- [ ] Alle 3 Sub-Pläne nach `done/`
- [ ] `pnpm test` (unit) ≤ 10s
- [ ] `pnpm test:integration` (unit+integration) ≤ 3min
- [ ] CI grün auf PR + main
- [ ] Coverage-Report (Vitest C8) ≥ 70% für kritische Pfade

## 7. Files-to-Change (Master-Aggregat — Detail in Sub-Plänen)

| Datei | Aktion | Was passiert |
|-------|--------|--------------|
| `vitest.workspace.ts` (NEW, root) | NEW | Pool-Split unit/integration |
| `.env.test` (NEW, root) | NEW | Test-Defaults |
| `apps/web/src/test/msw/handlers.ts` | NEW | Stripe + Anthropic + GitHub Network-Handlers |
| `apps/web/src/test/msw/server.ts` | NEW | setupServer für Node |
| `apps/web/src/test/setup.ts` | NEW | msw lifecycle hooks |
| `package.json` (root) | EDIT | `test:integration` + `test:all` scripts |
| `.github/workflows/ci.yml` | EDIT | neuer `integration`-Job mit postgres-service |
| `apps/web/vitest.config.ts` | EDIT | von eigenständig → Teil des workspace |
| `vitest.config.ts` (root) | DELETE oder EDIT | konsolidiert in workspace |
| `apps/web/src/app/api/**/route.test.ts` | NEW (7 Files) | API-Route-Tests |
| `apps/web/src/lib/audit-action.test.ts` | NEW | audit-action coverage |
| `apps/web/src/lib/{customer-dal,apply-dal,customers,workspace-context,install-requests,session,billing-actions,stripe-meters}.test.ts` | NEW (8 Files) | DAL + lib-Tests |
| `packages/audit/src/rules/{stale-references,context-bloat,duplicate-guidance,token-budget}.test.ts` | NEW (4 Files) | Rule-Tests |
| `docs/plans/nova-3b-sub-a-test-infra-stripe.md` | NEW | Sub-A |
| `docs/plans/nova-3b-sub-b-audit-action-api-routes.md` | NEW | Sub-B |
| `docs/plans/nova-3b-sub-c-dal-session-billing-rules.md` | NEW | Sub-C |

## 8. Test-Plan (für diesen Plan selbst — wir bauen Tests, also ist es meta)

**Automatisch:**
- `pnpm typecheck` ✓
- `pnpm test` ✓ — alle 222 existing + ~180 neuen Tests grün (unit only)
- `pnpm test:integration` ✓ — Integration-Tests grün gegen postgres-service
- `pnpm lint` ✓
- CI: PR-Job grün (unit), main-Push-Job grün (unit + integration)

**Manuell:**
- [ ] CI-Logs prüfen: postgres-service startet, Migrations laufen, Tests laufen, Cleanup OK
- [ ] Lokal: `pnpm test:integration` mit laufendem docker-compose stack
- [ ] Coverage-Report inspizieren: keine Kill-Path-Lücken

## 9. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| msw + Next.js 16 + Node 22 Inkompatibilität (msw v2 ist new) | Strong | Sub-A startet mit msw-Setup + Smoke-Test bevor Sub-B/C anfangen. Bei Inkompatibilität → fallback auf nock oder native fetch-mocks. |
| postgres-service in GitHub-Actions ist langsam (jeder Job-Run ist fresh) | Mid | Tier-Split (Q4): nur main-Push, nicht jedes PR. Plus Drizzle-migrate per Job ist ~10s. |
| Integration-Tests sind flaky wegen parallelem DB-Zugriff | Strong | Pool=forks für integration (Q7), pro Test-Suite eigenes Schema oder transaction-wrap mit rollback. |
| Test-Schreibung deckt Bugs auf (z.B. Sub-12 Mid Stripe-Idempotenz) → Plan-Drift | Mid | Block-Resolver: AskUserQuestion bevor in-Plan-Code-Fixes. Bug-Fixes als separate Commits. |
| `vitest.workspace.ts` bricht bestehende 222 Tests | Strong | Sub-A-Phase 1 (Infra) endet mit `pnpm test` grün vor Sub-A-Phase 2 (Stripe-Tests). |
| msw-Handlers für Stripe sind komplex (signed payloads) | Strong | Helper-Function `mockSignedStripeEvent(eventType, data)` aus `stripe-go-live.md`-Smoke-Test-Pattern. |
| Coverage-Pflicht ≥70% in CI = harter Cut für künftige PRs | Mid | Coverage-Threshold in `.lighthouserc`-Style Config setzen, aber als WARNING erst, dann ERROR nach 2 Sprints. |
| Sub-B audit-action ist 418 LOC + heavy DB-Mocking | Strong | DAL-Layer-Mock via vi.mock — testen audit-action gegen interfaces, nicht echte DB. Integration-Variante separate. |
| LLM-Audit-Rule conflicting-rules nicht testbar ohne ANTHROPIC_API_KEY | Weak | Existing-Test (Sub-3) verifiziert: returns [] when API_KEY unset. Bleibt unverändert. |
| Sub-C Audit-Rule-Tests reproduzieren `packages/audit/src/audit.test.ts` Setup | Mid | Pattern-Match aus audit.test.ts — fixture-based, shared test-helpers. |

## 10. Rollout

- **Strategie**: Direkt-Merge auf `main`, Sub-für-Sub (Sub-A → Sub-B → Sub-C). Solo-Dev-Pattern, kein Branch-Review.
- **Pre-Deploy-Gates**: Sub-A merge-blocked auf `test` + `test:integration` grün. Gleiches für Sub-B + Sub-C.
- **Post-Deploy-Verifikation**: Out-of-Scope (kein Deploy in Nova-3b).
- **Rollback-Trigger**: CI rot > 2 sequentielle Merges nach einem Sub. Coverage-Drop > 5%.
- **Rollback-Schritte**: `git revert <sub-commit>`. Plan-Status zurück auf 🟡.

## 11. Out-of-Scope (V2 / separater Plan)

- **Playwright E2E** — Pricing → Checkout → Webhook Roundtrip (Q3 ablehnt).
- **UI-Component-Tests** — React Testing Library + Storybook (V2 mit `nova-3b2-ui-tests`).
- **Snapshot-Tests** — bewusst weggelassen (Sub-8: aktuell 0 Snapshots, sauber).
- **conflicting-rules LLM-Test** — schon getestet (Sub-3 verifiziert), keine Erweiterung.
- **packages/parser-Tests** — schon vorhanden, kein Critical-Path-Gap.
- **packages/inngest-Step-Tests** — Sub-12 Mid (not Kill); V2.
- **Coverage-Threshold-Enforce** — Plan ergänzt aber nicht enforced (warning-only).
- **Test-Pollution-Detector** — vitest --shuffle + --reporter=verbose; V2.
- **Mutation-Testing (Stryker)** — V2.

## 12. Open Questions

- **OQ-1** (Sub-A): exakte msw-Version + Stripe-Mock-Pattern. Erst im Execute-Schritt durch hands-on-Test.
- **OQ-2** (Sub-C): Test-DB-Isolation-Pattern — transaction-rollback vs fresh-DB-pro-Suite. Pragmatic decision im Execute.
- **OQ-3** (Sub-B Inngest-Route): Sub-12 Strong FN-Inngest sagt `signingKey` + `runtime` fehlen. Wenn wir die in Sub-B Test ergänzen → Bug-Fix oder Test-Skip mit TODO? AskUserQuestion bei Step.

## 13. Geschätzter Aufwand

- Master (Plan-File + 3 Sub-Stubs): 1h
- Sub-A (Infra + Stripe-Webhook): 8h
- Sub-B (audit-action + API-Routes): 7h
- Sub-C (DAL + session + billing + Audit-Rules): 9h
- **Master-Gesamt**: ~25h
- **Empfehlung**: 3 sequentielle `/execute`-Sessions (Sub-A → Sub-B → Sub-C). Jede ~1 Arbeitstag. Master bleibt 🟡 bis alle 3 Subs ✓.
