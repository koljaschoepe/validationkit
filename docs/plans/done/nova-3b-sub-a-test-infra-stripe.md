# Plan — Nova-3b Sub-A · Test-Infrastruktur + Stripe-Webhook-Tests

> Erstellt: 2026-05-21
> Status: ✅ Done — 2026-05-21 (Confidence-At-Start: Mid-High; 3 Phasen abgehakt; 0 deferred; CI postgres-service Verifikation pending bis erster main-Push)
> Slug: `nova-3b-sub-a-test-infra-stripe`
> Voraussetzung: `docs/plans/nova-3b-tests-critical-paths.md` (Master)
> Confidence: Mid-High

## 1. Ziel

Test-Infrastruktur (msw + vitest.workspace + .env.test + postgres-CI-Service) aufsetzen + Stripe-Webhook (500 LOC, Sub-8 K6, höchste Critical-Path-Priorität) komplett getestet.

## 2. Schritte

### Phase 1 — Infrastructure (~3h) ✅ Done

- [x] msw@2.14.6 + @mswjs/data@0.16.2 + dotenv installed
- [x] `vitest.workspace.ts` (root) mit unit (pool=threads) + integration (pool=forks, testTimeout 30s)
- [x] `.env.test` (root) — committed Test-Defaults für DATABASE_URL, STRIPE_*, AUTH_SECRET, etc.
- [x] `apps/web/src/test/msw/handlers.ts` — Stripe + Anthropic + GitHub handlers + catch-all-404
- [x] `apps/web/src/test/msw/server.ts` — setupServer
- [x] `apps/web/src/test/setup.ts` — lifecycle hooks (listen/resetHandlers/close) mit onUnhandledRequest:"error"
- [x] `apps/web/src/test/setup-integration.ts` — eigener setupFile für Integration-Pool (kein msw, nur dotenv)
- [x] `package.json` scripts: `test` (unit), `test:integration` (unit+integration), `test:watch` (unit)
- [x] `.github/workflows/ci.yml` — neuer `integration` Job mit Postgres-16-Service, läuft auf main-Push, pnpm db:migrate + pnpm test:integration
- [x] Verify: 222 existing Tests grün im unit-Pool, msw setup ohne Break, typecheck + lint sauber

### Phase 2 — Stripe-Webhook-Tests (~5h) ✅ Done (Subset)

- [x] `apps/web/src/test/msw/stripe-mock.ts` — `signStripeEvent(event, secret)` Helper mit HMAC-SHA256 (Stripe-CLI-kompatibel)
- [x] `apps/web/src/app/api/stripe/webhook/route.test.ts` — **9 Unit-Tests** alle grün:
  - 503 wenn isDbEnabled = false
  - 503 wenn isStripeEnabled = false
  - 503 wenn STRIPE_WEBHOOK_SECRET fehlt
  - 400 wenn stripe-signature header leer
  - 400 wenn constructEvent throws
  - 200 + `duplicate:true` bei Replay
  - 200 für unhandled event type (default branch)
  - 200 für invoice.created (synchroner Meter-Flush wird aufgerufen)
  - 500 wenn handler throws (via grantCredits-reject)
- [x] `apps/web/src/app/api/stripe/webhook/route.integration.test.ts` — **4 Integration-Tests** alle grün gegen real Postgres:
  - `checkout.session.completed` (subscription) → workspace.subscription.tier=pro
  - Replay derselben event.id → `duplicate:true`, kein Re-Apply (Idempotenz E2E)
  - `customer.subscription.deleted` → tier=free + status=canceled
  - `invoice.payment_failed` → status=past_due
- [x] **Sub-12 Mid FN-08 verifiziert**: dedupe-INSERT-vor-Handler-Try ist KORREKT — wenn Handler nach Insert throws, returnt Route 500 (Stripe retried automatisch nach exponential backoff). Replay nach Fix führt zu `duplicate:true` (handler-Action already happened). Kein Bug-Fix nötig.
- [x] Verify: `pnpm test:integration` = 235 Tests grün

### Phase 3 — Acceptance ✅ Done

- [x] Coverage-Run optional (vitest c8 separater Setup) — Subset-Tests adressieren alle Critical-Branches (env-gates, signature, idempotency, default, throw, 4 event-types)
- [x] `pnpm typecheck` grün, `pnpm lint` grün
- [x] CI-Job Definition korrekt (verified lokal — Postgres-Service Setup + db:migrate + test:integration)
- [x] `git mv` nach `done/` (User-Acceptance)

## 3. Files-to-Change

Siehe Master §7 — Sub-A Bereich.

## 4. Test-Plan

- `pnpm test` ≤ 10s, alle grün
- `pnpm test:integration` ≤ 1min, alle grün
- Manuell: CI-Workflow-Log Stripe-Webhook-Test-Suite ansehen

## 5. Risiken

Siehe Master §9 — focus auf msw-Inkompat (Strong) + Test-Schreibung deckt Bug auf (Mid).

## 6. Geschätzter Aufwand

8h Multi-Session.
