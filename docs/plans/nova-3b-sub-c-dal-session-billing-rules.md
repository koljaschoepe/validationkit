# Plan — Nova-3b Sub-C · DAL + session + billing + Audit-Rules Tests

> Erstellt: 2026-05-21
> Status: 🟡 In Review (Sub-Plan)
> Slug: `nova-3b-sub-c-dal-session-billing-rules`
> Voraussetzung: Sub-B abgeschlossen (`docs/plans/done/nova-3b-sub-b-audit-action-api-routes.md`)
> Confidence: Mid

## 1. Ziel

DAL-Layer (~1000 LOC, Sub-8 K9) + lib/session.ts (Sub-8 K10) + billing-actions + stripe-meters (Sub-8 K11) + 4 deterministische Audit-Rules (Sub-8 K12) komplett getestet.

## 2. Schritte

### Phase 1 — DAL-Tests (~5h, integration)

- [ ] `apps/web/src/lib/customer-dal.test.ts` — listCustomers, getCustomerById, workspace-scoped
- [ ] `apps/web/src/lib/apply-dal.test.ts` — apply-flow + dispatch (Nullable-deciders post-Nova-3a Bundle A)
- [ ] `apps/web/src/lib/customers.test.ts` — getRepo + listRepos
- [ ] `apps/web/src/lib/workspace-context.test.ts` — resolveWorkspaceFromSlug + Sub-5 Mid `ensureDefaultWorkspace`-Bug-Reproduktion (failing-test) + Fix als Teil von Sub-C
- [ ] `apps/web/src/lib/install-requests.test.ts` — list + decide (RequesterId nullable post-Bundle-A)

### Phase 2 — session-Tests (~1h)

- [ ] `apps/web/src/lib/session.test.ts`:
  - getSessionUser cached-result (react cache())
  - membership-gate (active vs pending)
  - claimPendingMemberships-Integration (post-Bundle-H wired)

### Phase 3 — billing-Tests (~1h)

- [ ] `apps/web/src/lib/billing-actions.test.ts` — Tier-upgrade-flow + cancel
- [ ] `apps/web/src/lib/stripe-meters.test.ts` — Meter-event with 2-layer idempotency

### Phase 4 — Audit-Rules-Tests (~2h, fixture-based)

- [ ] `packages/audit/src/rules/stale-references.test.ts` — fixture-based pos/neg cases
- [ ] `packages/audit/src/rules/context-bloat.test.ts` — token-budget fixtures
- [ ] `packages/audit/src/rules/duplicate-guidance.test.ts` — fixture-based
- [ ] `packages/audit/src/rules/token-budget.test.ts` — fixture-based (separate von existierender `token-budget.test.ts` falls integration vs unit gemeint)

### Phase 5 — Master-Acceptance

- [ ] Alle 7 Critical-Paths haben Tests
- [ ] Coverage-Report (vitest --coverage) ≥ 70% für kritische Pfade
- [ ] CI: PR + main beide grün
- [ ] Master + alle 3 Subs nach `done/`

## 3. Files-to-Change

Siehe Master §7.

## 4. Geschätzter Aufwand

9h Multi-Session.
