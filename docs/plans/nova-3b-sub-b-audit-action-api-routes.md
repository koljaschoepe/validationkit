# Plan — Nova-3b Sub-B · audit-action + 7 API-Routes Tests

> Erstellt: 2026-05-21
> Status: 🟡 In Review (Sub-Plan)
> Slug: `nova-3b-sub-b-audit-action-api-routes`
> Voraussetzung: Sub-A abgeschlossen (`docs/plans/done/nova-3b-sub-a-test-infra-stripe.md`)
> Confidence: Mid

## 1. Ziel

audit-action.ts (Core-User-Flow, 418 LOC, Sub-8 K7) + 6 verbliebene API-Routes (stripe schon in Sub-A) komplett getestet.

## 2. Schritte

### Phase 1 — audit-action-Tests (~3h)

- [ ] `apps/web/src/lib/audit-action.test.ts` — Unit-Tests mit DAL/Parser/Audit-Mocks:
  - Happy-Path: form-submission → repo-clone (mock) → parser (mock) → audit (mock) → DB-write (mock) → success
  - Error-Paths: invalid URL, clone-failure, parser-error, audit-rule-failure
  - Intent-Audit-Flow: post-magic-link re-run path
  - Background-Path: long-running → Inngest-queue (mock)
- [ ] `apps/web/src/lib/audit-action.integration.test.ts` — Integration:
  - Real-DB roundtrip mit dummy github-URL (vermutlich skip on CI ohne network)

### Phase 2 — 6 API-Routes-Tests (~4h)

- [ ] `apps/web/src/app/api/inngest/route.test.ts` — serve()-mock + signing-key-verify + Sub-12 Strong (runtime/signingKey fix)
- [ ] `apps/web/src/app/api/install-webhook/route.test.ts` — GitHub-HMAC SHA-256 verify (signed payload helper)
- [ ] `apps/web/src/app/api/notify-update/route.test.ts` — per-repo-Secret HMAC
- [ ] `apps/web/src/app/api/audit-trail/route.test.ts` — workspace-scoped export + Sub-5 Mid Cross-Tenant-Leak-Fix
- [ ] `apps/web/src/app/api/auth/[...all]/route.test.ts` — better-auth handler smoke-Test
- [ ] `apps/web/src/app/api/events/stream/route.test.ts` — SSE Headers + workspace-Membership-Gate + Sub-5 Mid `resolveWorkspaceFromSlug` integration

### Phase 3 — Acceptance

- [ ] Coverage ≥ 80% pro Route
- [ ] CI grün
- [ ] `git mv` nach `done/`

## 3. Files-to-Change

Siehe Master §7.

## 4. Geschätzter Aufwand

7h Multi-Session.
