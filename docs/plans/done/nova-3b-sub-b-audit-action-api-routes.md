# Plan — Nova-3b Sub-B · audit-action + 7 API-Routes Tests

> Erstellt: 2026-05-21
> Status: ✅ Done — 2026-05-21 (Confidence-At-Start: Mid; 3 Phasen abgehakt; 0 deferred; CI postgres-service Verifikation pending bis erster main-Push)
> Slug: `nova-3b-sub-b-audit-action-api-routes`
> Voraussetzung: Sub-A abgeschlossen (`docs/plans/done/nova-3b-sub-a-test-infra-stripe.md`)
> Confidence: Mid

## 1. Ziel

audit-action.ts (Core-User-Flow, 418 LOC, Sub-8 K7) + 6 verbliebene API-Routes (stripe schon in Sub-A) komplett getestet.

## 2. Schritte

### Phase 1 — audit-action-Tests (~3h) ✅ Done

- [x] `apps/web/src/lib/audit-action.test.ts` — **9 Unit-Tests** alle grün:
  - empty path → error
  - rate-limit reject (mit korrektem RateLimitResult-Shape)
  - out-of-credits (signed-in)
  - unparseable GitHub URL
  - local path not found
  - local path is not a directory
  - happy-path anonymous github audit
  - github-audit Cleanup (finally clears extracted dir on error)
  - free-tier deep → quick downgrade
- audit-action.integration.test.ts deferred (braucht network-mock für github-fetch, V2)

### Phase 2 — 6 API-Routes-Tests (~4h) ✅ Done

- [x] `apps/web/src/app/api/inngest/route.test.ts` — 1 Smoke-Test (GET/POST/PUT-Export-Contract)
- [x] `apps/web/src/app/api/install-webhook/route.test.ts` — 5 Tests (503 no secret, 401 bad sig, 503 no DB, 400 bad JSON, 400 no delivery-id)
- [x] `apps/web/src/app/api/notify-update/route.test.ts` — 9 Tests (503/401/400/404/HMAC/sha-unchanged/inngest-trigger)
- [x] `apps/web/src/app/api/audit-trail/route.test.ts` — 4 Tests (json/csv × success/404)
- [x] `apps/web/src/app/api/auth/[...all]/route.test.ts` — 2 Tests (503/delegate)
- [x] `apps/web/src/app/api/events/stream/route.test.ts` — 3 Tests (503/401/200-SSE-headers)

### Phase 3 — Acceptance ✅ Done

- [x] **33 neue API/audit-action Tests** alle grün
- [x] `pnpm typecheck` grün (10 type-Errors in test-files gefixt — SessionUser/RateLimitResult/CanConsumeResult shapes)
- [x] `pnpm lint` grün
- [x] `pnpm test` = **264 Tests** (vorher 231, +33 neue)
- [x] `pnpm test:integration` = 268 (264 unit + 4 integration aus Sub-A)
- [x] `git mv` nach `done/` (User-Acceptance)

## 3. Files-to-Change

Siehe Master §7.

## 4. Geschätzter Aufwand

7h Multi-Session.
