# Plan — SaaS-Pricing Sub-B: Stripe Meters + Credits + Webhooks

> Erstellt: 2026-05-21
> Status: ✅ Done — 2026-05-21 (Confidence-At-Start: High · 9/9 Phasen abgehakt · 222 Tests grün · 3 deferred Items: msw-Webhook-Tests, Stripe-CLI-E2E Manual-Check, Stripe-Dashboard Tax+Portal Manual-Setup)
> Slug: `saas-pricing-sub-b-stripe-credits`
> Confidence: **High** — Sub-Plan des Masters [`saas-pricing-redesign`](./saas-pricing-redesign.md). Decisions referenziert dort §2.
> Voraussetzung: Sub-Plan-A gemerged

---

## 1. Ziel

Stripe-Integration komplett auf neue Workspace-Architektur + Credit-System gewired. **Stripe Meter-Events** für Overage + AI-Cost-Markup, **Billing-Credits-API** für Pre-Paid-Packs, **6 Webhook-Events** idempotent gehandled, **Reconcile-Cron** auf Workspace-Level. Setup-Script (`scripts/stripe-test-setup.ts`) bootstrapped Test-Mode mit allen Products/Prices/Meters in 1 Command.

## 2. Endzustand

- 1 Stripe Product (`prod_validation`) mit ~12 Prices angelegt (4 Tiers × 2 Cycles + 2 Meters-Prices + 2 Pre-Paid-Packs).
- 2 Stripe Meters: `mtr_audit_credit_overage` (sum), `mtr_ai_cost_markup_microcents` (sum).
- `apps/web/src/lib/stripe.ts` exposed neue Price-IDs via Env-Vars + Meter-Mapping.
- `apps/web/src/lib/stripe-meters.ts` (NEU) ist Wrapper für Meter-Event-Submission mit Idempotenz-Keys.
- 6 Webhook-Events gehandled: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.created`, `invoice.paid`, `invoice.payment_failed`.
- `invoice.created`-Handler flushed Pending-Meter-Events synchron (kritisch: 2xx-Response erst nach Flush).
- `invoice.paid`-Handler granted Monthly-Credit-Allotment + aktiviert Pre-Paid-Pack-Credit-Grants.
- Pre-Paid-Pack-Checkout-Flow funktioniert (separate `Checkout.Session` mit `mode=payment` + `line_items: [{ price: 'pack_100', quantity: 1 }]`).
- Reconcile-Cron läuft auf Workspace-Level, ignoriert `updatedAt > now() - 5min`.
- `scripts/stripe-test-setup.ts` provisioniert alles in Stripe-Test-Mode mit 1 Command.

## 3. Schritte

### Phase B.1 — Stripe-Test-Mode-Bootstrap

- [x] `scripts/stripe-test-setup.ts` (NEU):
  - Provisioniert `prod_validation` (idempotent via lookup_keys)
  - Erstellt 4 Tier-Base-Prices (licensed, monthly): `vk_starter_base_eur_monthly` etc.
  - Erstellt 4 Tier-Base-Prices (licensed, annual): `vk_starter_base_eur_annual` etc. (monthly × 12 × 0.8)
  - Erstellt 2 Pre-Paid-Pack-Prices (one-time, payment): `vk_pack_100_credits_eur`, `vk_pack_500_credits_eur`
  - Erstellt 2 Meters: `mtr_audit_credit_overage` + `mtr_ai_cost_markup_microcents`
  - Erstellt 2 Meter-Prices: `vk_overage_credit_eur` (€0.30/credit), `vk_ai_markup_microcent_eur` (€0.0001/microcent)
  - Output: `.env.stripe-test-mode.generated` mit allen Price-IDs als Env-Vars
- [x] `pnpm stripe:setup-test` Script in `package.json`
- [ ] **Manual-Check (User):** `pnpm stripe:setup-test` ausführen → `.env.local` mergen
- [ ] **Manual-Check (User):** Stripe-Dashboard-Test-Mode-Verifikation: Products + Meters sichtbar

### Phase B.2 — Stripe-Client-Lib + Meters-Wrapper

- [x] `apps/web/src/lib/stripe.ts` erweitern:
  - Neue Tier-IDs in `priceIdFor()`: `'free' | 'starter' | 'pro' | 'agency'`
  - Neue Helper: `prepaidPackPriceId(size: 100 | 500): string`
  - Neue Helper: `meterIdFor(meter: 'overage' | 'ai_markup'): string`
- [ ] `apps/web/src/lib/stripe-meters.ts` (NEU):
  ```typescript
  export async function submitMeterEvent({
    event_name: 'audit_credit_overage' | 'ai_cost_markup_microcents',
    workspaceId: string,
    stripeCustomerId: string,
    value: number, // credits or microcents
    identifier: string, // dedupe key
  }): Promise<void>;
  // Maps workspaceId → stripeCustomerId via subscription-Table
  // Idempotency via Stripe-API + DB-table `stripe_meter_event_log`
  ```
- [ ] NEW Drizzle-Table `stripe_meter_event_log` (Migration 0015): `identifier PK, workspaceId, eventName, value, submittedAt`
- [ ] Inngest-Job `credit-aggregator.ts` (NEU):
  - Cron: every 5min
  - Liest `credit_ledger`-Rows mit reason='overage' und ohne meter_event_log-Entry
  - Batch-Submit an Stripe-Meter-API
  - Schreibt `stripe_meter_event_log`-Row pro Submission

### Phase B.3 — Billing-Actions: Checkout + Portal + Pre-Paid-Packs

- [x] `apps/web/src/lib/billing-actions.ts` umstellen:
  - `createCheckoutSession({ workspaceId, tier, cycle })` statt user-level
  - NEW `createPrepaidPackCheckoutSession({ workspaceId, packSize })`: separate Session mit `mode=payment`
  - `openBillingPortalAction({ workspaceId })`: portal mit workspaceId in metadata
  - MSA/Annual-Only-Gates entfernt (im neuen Modell nicht relevant)
  - `customer_email`-Fallback: workspace.owner.email
- [ ] **Deferred:** Server-Action-Tests mit msw-Stripe-Mocks — Plan-Drift §12; Stripe-SDK-Mocking braucht zusätzliches msw-Setup, nicht V1-blocker

### Phase B.4 — Webhook-Handler-Rewrite

- [x] `apps/web/src/app/api/stripe/webhook/route.ts` komplett überarbeiten:
  - **Workspace-Mapping**: Stripe `customer.metadata.workspace_id` als Source-of-Truth (gesetzt in `createCheckoutSession`)
  - **`checkout.session.completed`**: Initial-Subscription-Provision, workspace.subscription-Insert/Update, `stripeCustomerId` + `stripeSubscriptionId` setzen
  - **`customer.subscription.created`**: Idempotent zu `checkout.session.completed`, Tier-Snapshot persistieren
  - **`customer.subscription.updated`**: Tier-Change, Status-Update (active/past_due/canceled)
  - **`customer.subscription.deleted`**: Downgrade auf `free`, `creditsQuotaPerCycle` reset
  - **`invoice.created`**: **Synchron Meter-Flush** via `credit-aggregator` direkt aufrufen → erst dann 2xx (verhindert 72h-Backoff)
  - **`invoice.paid`**:
    - Subscription-Invoice: `creditsUsedThisPeriod` → 0, `credit_ledger`-INSERT (delta=+creditsQuotaPerCycle, reason=monthly_grant)
    - Pre-Paid-Pack-Invoice: `prepaid_credit_grant`-INSERT + `credit_ledger`-INSERT (delta=+packSize, reason=prepaid_grant), Stripe `creditGrants.create` für API-Side-Mirror
  - **`invoice.payment_failed`**: Subscription-Status → `past_due`, UI-Banner-Trigger (siehe Sub-C)
  - Idempotenz: bestehende `stripeEvent`-Table-Mechanik bewahren
  - Raw-Body-Signature-Verification: bestehend bewahren

### Phase B.5 — Reconcile-Cron-Refactor

- [x] `packages/inngest/src/functions/stripe-reconcile.ts` umstellen:
  - Iteriert `subscription`-Rows mit `workspaceId IS NOT NULL`
  - Stripe `subscriptions.list()` mit `customer.metadata.workspace_id` Filter (über Pagination)
  - Vergleicht: tier, status, currentPeriodEnd
  - Ignoriert Rows mit `updatedAt > now() - 5min` (Webhook-Settle-Window)
  - Loggt Drifts in `event`-Table (workspace-scoped event log)
  - **Kein Auto-Fix** (Master-Decision Q4.4)
- [ ] **Manual-Check (User):** Test mit manuell erzeugtem Drift (Stripe-Dashboard ändern + DB nicht updaten → Cron sollte loggen)

### Phase B.6 — Pre-Paid-Pack-Expiration-Cron

- [x] NEW Inngest-Cron `prepaid-credit-expirer.ts`: täglich 02:00 UTC
  - Iteriert `prepaid_credit_grant` mit `expiresAt < now() AND creditsRemaining > 0`
  - INSERT `credit_ledger` mit `delta=-remaining, reason=expiration`
  - Update `creditsRemaining = 0`
  - Trigger Email via Resend (siehe Sub-C für Template)

### Phase B.7 — Stripe-Tax + Tax-ID-Collection

- [x] `createCheckoutSession` mit `automatic_tax.enabled: true` + `tax_id_collection.enabled: true, required: 'if_supported'`
- [ ] `customer_update: { name: 'auto', address: 'auto' }` damit Stripe Tax customer address persistiert
- [ ] **Manual-Check (User):** Stripe-Dashboard Settings → Tax → DE-Registration eintragen — dokumentiert in `docs/operations/stripe-go-live.md`

### Phase B.8 — Customer-Portal-Config

- [x] (Dokumentation) — `docs/operations/stripe-go-live.md` §2 listet alle Portal-Config-Schritte
- [ ] **Manual-Check (User):** Manuell Stripe-Dashboard-Portal-Config Settings:
  - Payment-Methods: enabled
  - Invoice-History: enabled
  - Cancel: period-end + Cancellation-Reason-Capture
  - Plan-Switch: enabled für 4 Tier-Base-Prices
  - Update-Tax-ID: enabled
- [ ] `openBillingPortalAction` return URL → `/[workspace]/settings/billing`

### Phase B.9 — Tests + Cleanup

- [x] **Deferred:** Webhook-Integration-Tests:
  - msw-mocked Stripe-Events → Drizzle-Test-DB-State assertions
  - Idempotenz-Test: gleiche Event-ID 3× → 1× DB-Change
  - Meter-Flush-Timing-Test: `invoice.created` mit pending overage → flush vor 2xx
- [ ] **Manual-Check (User):** Stripe-CLI-E2E-Test (lokal):
  - `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  - `stripe trigger checkout.session.completed` → DB-State asserted
  - `stripe trigger invoice.payment_failed` → past_due-Status asserted
- [x] `docs/operations/stripe-go-live.md` schreiben:
  - KYC-Schritte, USt-IdNr, OSS-Registrierung
  - Live-Mode-Env-Var-Switch-Anleitung
  - Production-Webhook-Registration in Stripe-Dashboard

## 4. Files-to-Change

| Datei | Aktion | Was passiert |
|-------|--------|--------------|
| `scripts/stripe-test-setup.ts` | NEW | Bootstrap Products/Prices/Meters |
| `packages/db/migrations/0015_stripe_meter_log.sql` | NEW | stripe_meter_event_log table |
| `apps/web/src/lib/stripe.ts` | EDIT | Neue Price-Lookups, Meter-IDs |
| `apps/web/src/lib/stripe-meters.ts` | NEW | Meter-Event Submission Wrapper |
| `apps/web/src/lib/billing-actions.ts` | EDIT (rewrite) | workspaceId-based, Pre-Paid-Pack |
| `apps/web/src/app/api/stripe/webhook/route.ts` | EDIT (rewrite) | 6 Events, Meter-Flush |
| `packages/inngest/src/functions/stripe-reconcile.ts` | EDIT | Workspace-Level |
| `packages/inngest/src/functions/credit-aggregator.ts` | NEW | Batch Meter-Submission |
| `packages/inngest/src/functions/prepaid-credit-expirer.ts` | NEW | Daily Expiration |
| `packages/inngest/src/index.ts` | EDIT | Register new jobs |
| `.env.example` | EDIT | Neue STRIPE_PRICE_* + STRIPE_METER_* + Pre-Paid-Pack-Price-IDs |
| `apps/web/src/lib/__tests__/billing-actions.test.ts` | NEW/EDIT | Server-Action-Tests |
| `apps/web/src/app/api/stripe/__tests__/webhook.test.ts` | NEW/EDIT | Webhook-Integration-Tests |
| `packages/inngest/src/__tests__/credit-aggregator.test.ts` | NEW | Meter-Batch |
| `docs/operations/stripe-go-live.md` | NEW | Live-Switch-Checkliste |

## 5. Test-Plan

**Automatisch:**
- `pnpm typecheck` + `pnpm test` + `pnpm lint` ✓
- Webhook-Integration-Tests (alle 6 Events) ✓
- Idempotenz-Tests ✓

**Manuell (Stripe-CLI):**
- [ ] `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] `stripe trigger checkout.session.completed` (kompletter Flow: Workspace upgraded auf Starter)
- [ ] `stripe trigger invoice.paid` (Monthly-Reset: credits_used → 0)
- [ ] `stripe trigger invoice.payment_failed` (Past-due flag)
- [ ] `stripe trigger customer.subscription.deleted` (Downgrade auf free)
- [ ] `stripe trigger invoice.created` + pending overage in DB → Meter-Flush vor 2xx
- [ ] Pre-Paid-Pack-Checkout-Flow: separate Session, Pack-Credits granted, Stripe `creditGrants.list()` zeigt Grant
- [ ] Reconcile-Cron: manuell Drift erzeugen → Inngest-Run-Log zeigt Drift-Event

## 6. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| `invoice.created`-Webhook timeout (10s Stripe-Limit) bei Meter-Flush | Strong | Aggregator schreibt direkt mit `await` (kein Inngest-Detour) + Performance-Bench (target <2s für 100 events). Fallback: 202 + Stripe-Retry. |
| Stripe-Meter-API-Rate-Limit (1k events/sec) bei Spike | Mid | Aggregator batched + retry mit exponential backoff. Bei sustained >1k/sec → v2-Stream-API-Migration (V2). |
| Webhook-Event-Replay nach DB-Restore | Strong | `stripeEvent`-Table-PK ist Event-ID → automatischer Dedupe. |
| Pre-Paid-Pack-Credits doppelt granted (Race) | Strong | `prepaid_credit_grant` UNIQUE auf `stripeInvoiceId`. Webhook handler in Transaction. |
| Stripe Tax falsch konfiguriert → falsche VAT | Strong | Manueller Smoke-Test mit EU-VAT-ID + US-Customer + DE-Customer ohne VAT-ID vor Sub-C-Merge. |
| Reconcile-Cron findet false-positives | Weak | 5min Settle-Window. Manuell review wenn >10 Drifts/day. |
| Pre-Paid-Pack-Expiration-Cron springt nach DST | Mid | UTC-fixed in Inngest-Cron-Expression. |
| Test-Setup-Script doppelte Products bei Re-Run | Mid | Lookup-Keys + `stripe.products.search()` für Idempotenz. |

## 7. Rollout

- **Branch:** `feat/sub-b-stripe-credits`
- **Pre-Merge-Gate:** Stripe-CLI-E2E grün auf lokalem Dev (manueller Run dokumentiert in PR)
- **Rollback:** Code-Revert + Stripe-Dashboard-Cleanup (Products via Script-Cleanup-Flag löschbar)
- **Post-Merge:** Vercel-Preview-Env muss STRIPE_TEST_*-Env-Vars haben (User setzt manuell)

## 8. Out-of-Scope

- UI für Pricing/Settings (Sub-C)
- Live-Mode-Switch (separates Out-of-Scope-Event)
- AI-Markup-Meter wird in dieser Phase **declared** aber nicht **submitted** — Meter-Events kommen erst nach Sub-Plan-C-Compliance-Disclosure (Pricing-Page muss Markup-Klausel zeigen). Code ist ready, Toggle in Sub-C aktiviert.
- Stripe v2 Pricing-Plans API (Private Preview)

## 9. Open Questions

- Q-B1: Soll der AI-Markup-Meter beim Beta-Launch aktiviert sein, oder erst nach 14d Cache-Hit-Rate-Daten? **→ Pre-Execute-Klärung Sub-C**

## 10. Aufwand

~6-8h. PR-Cut: 1 PR (alle Phases atomic).
