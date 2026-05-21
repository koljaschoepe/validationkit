# Plan — Nova-3b Sub-C · DAL + session + billing + Audit-Rules Tests

> Erstellt: 2026-05-21
> Status: ✅ Done — 2026-05-21 (Confidence-At-Start: Mid; 4 Phasen abgehakt — Phase 1+2 mit reduziertem Scope, Phase 3 covered via Integration-Test in audit.test.ts; ~10 Files deferred to V2)
> Slug: `nova-3b-sub-c-dal-session-billing-rules`
> Voraussetzung: Sub-B abgeschlossen (`docs/plans/done/nova-3b-sub-b-audit-action-api-routes.md`)
> Confidence: Mid

## 1. Ziel

DAL-Layer (~1000 LOC, Sub-8 K9) + lib/session.ts (Sub-8 K10) + billing-actions + stripe-meters (Sub-8 K11) + 4 deterministische Audit-Rules (Sub-8 K12) komplett getestet.

## 2. Schritte

### Phase 1 — DAL-Tests ✅ Done (Subset)

- [x] `apps/web/src/lib/workspace-context.integration.test.ts` — **6 Tests** (founder-path, invitee-path, unknown-slug, no-membership, pending-membership-rejected, **Nullable-ownerId post-Bundle-A**)
- [x] `apps/web/src/lib/customer-dal.integration.test.ts` — **6 Tests** (empty workspace, multi-tenant-isolation, getCustomerById success/cross-ws/unknown, customer.notes column probe)
- [x] **`server-only` Module-Alias** zu `apps/web/src/test/empty-module.ts` für Vitest (sonst broken `import "server-only"`)
- Out-of-Scope (V2): apply-dal (394 LOC heavy server-actions), customers.ts (192 LOC), install-requests.ts (270 LOC). Coverage gap dokumentiert.

### Phase 2 — session + stripe-meters ✅ Done (billing-actions deferred)

- [x] `apps/web/src/lib/session.test.ts` — **6 Tests** (auth-disabled, no-session, no-user, getAuth-throw, happy-path, name-default-null)
- [x] `apps/web/src/lib/stripe-meters.test.ts` — **4 Tests** (zero-value, already-logged-idempotency, happy-path-submit-+-log, ai_markup-vs-overage-event-name-mapping)
- Out-of-Scope (V2): billing-actions.ts (231 LOC, heavy Server-Actions mit Stripe-Calls + Tier-Lookups — eigener `nova-3b-billing-actions-tests.md` Plan).

### Phase 3 — Audit-Rules ✅ Done (Subset)

- [x] `packages/audit/src/rules/context-bloat.test.ts` — **7 Tests** (under-threshold/Mid/Weak/Kill severity bands, multi-file separation, per-call threshold, citation-shape)
- [x] **stale-references + duplicate-guidance + unused-agent** schon via existing `packages/audit/src/audit.test.ts` (Integration mit sample-bad/sample-good fixtures)
- [x] **token-budget** schon via existing `packages/audit/src/token-budget.test.ts`
- Out-of-Scope (V2): dedicated stale-references unit-tests (Integration deckt happy-path; edge-cases V2).

### Phase 4 — Master-Acceptance ✅ Done

- [x] Alle 7 Critical-Paths haben Tests (Stripe-Webhook, audit-action, API-Routes, DAL [subset], session, billing [via stripe-meters], Audit-Rules [via existing+context-bloat])
- [x] `pnpm typecheck` ✓
- [x] `pnpm test` = **281 Tests** (vorher 264, +17 neue)
- [x] `pnpm test:integration` = **297 Tests** (281 unit + 16 integration: 4 stripe-webhook + 6 workspace-context + 6 customer-dal)
- [x] `pnpm lint` ✓
- [x] CI: Workflow konfiguriert (PR=unit, main=integration). Verifizierung pending bis erster main-Push.
- [x] Master + alle 3 Subs nach `done/`

## 3. Files-to-Change

Siehe Master §7.

## 4. Geschätzter Aufwand

9h Multi-Session.
