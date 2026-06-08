# Plan — Bundle B · Payment-Fix-Block + Inngest-Idempotency

> Erstellt: 2026-06-08
> Status: 🟡 In Execute (2026-06-08) — ✅ K-PAY1 (dahlia invoice-shape, `a8a2d56`) · K-PAY2 (auto-overage pipeline, `9757a0d`) · credit_ledger-Idempotenz-Migration 0016 + Stripe-Cancel-on-workspace-delete (`22dc50c`) · tax_code txcd_10103001 + tax_behavior. **Offen:** Credit-Pack-UI verdrahten (User: JA, ~0.5 dd UI), Integration-Test-Fixtures auf dahlia (CI-only, grün via Fallback). **AI-Markup-Meter = GA-out-of-scope** (User-Entscheidung 2026-06-08, s. §12). Inngest-Atomicity (Phase 6) bleibt in B-Scope. **Plan-Drift-Hinweis:** Audit fand K-PAY1 (`invoice.subscription` ganz entfernt) zusätzlich zum geplanten `current_period_end` — beide gefixt.
> Master: `docs/plans/production-launch-readiness.md`
> Slug: `payment-fix-block`
> Confidence: **High** — wave1-02 + wave2-02 file:line-zitiert

## 1. Ziel

Stripe-Payment-Path production-grade: Auto-Overage-Pfad end-to-end funktional (verspricht Pricing-Page = liefert Code), Stripe-API `2026-04-22.dahlia` korrekt konsumiert (`current_period_end` aus `sub.items.data[0]`), Webhook-Replay-Idempotenz auf Business-Key, `customer.deleted`-Handler, Tax-Codes auf Prices, Customer-Update mit `name: "auto"`. Inngest: Cross-Instance-Bug fixen, Atomic-Transactions, onFailure-Handler.

## 2. User-Entscheidungen

Master §2. Bundle-spezifisch: Auto-Overage UI bleibt unverändert; Inngest-Local-Path-Audit wird auf "GitHub-URL only" eingeschränkt (Kurz-Cut für K16) — S3/Blob-Upload ist V2.

## 3. Existing-Patterns

- `stripeEvent.id` PK-Idempotenz im Webhook (Exceptional Pattern)
- `prepaid_credit_grant` natural-PK auf Stripe-ID (Exceptional)
- `consumeCredits` schreibt overage-Row bei negative-balance (existiert, wird nicht erreicht)
- Stripe-API-Version pinned in `lib/stripe.ts:19`

## 4. Alternativen

- **Alt-A: S3/Blob-Upload für Inngest-Local-Path** → V2. Quick-Cut: nur GitHub-URL erlauben in Inngest-Path.
- **Alt-B: Stripe-Smart-Retries statt manual dunning** → Stripe-Smart-Retries sind bereits an (Stripe-default). Wir capped die Email-Sends.
- **Alt-C: Auto-Overage feature-flag deaktivieren statt fixen** → Pricing-Page verspricht es → muss funktionieren. Alternative wäre Pricing-Page-Copy ändern (out-of-scope).

## 5. Endzustand

- `audit-action.ts:122,352` + `audit-requested.ts:70` reichen `snap.autoOverageEnabled ? { allowOverage: true } : undefined` durch
- `consumeCredits` schreibt `credit_ledger` mit `reason='overage'` bei negative balance
- `credit-aggregator` flushed overage-rows zu Stripe-Meter `audit_credit_overage`
- `webhook/route.ts:461-465` liest `sub.items.data[0].current_period_end`
- `handleInvoicePaid` Idempotency-Index `(workspace_id, reason='monthly_grant', reference_id=invoice.id)` → replay-safe
- `customer.deleted` Webhook-Handler null'ed `stripe_customer_id` + `stripe_subscription_id`, downgrade auf free
- Alle Stripe Prices haben `tax_code: txcd_10103001` (B2B SaaS)
- `billing-actions.ts:83,203` `customer_update: { address: "auto", name: "auto" }`
- AI-Markup-Meter wired + flushed (S5)
- Inngest-Path: nur GitHub-URLs akzeptiert (K16 Quick-Cut)
- Alle Inngest-Functions in `db.transaction()` (S24)
- Alle Inngest-Functions haben `onFailure` Handler (S25)
- `inngest.send({id})` mit deterministic-ID auf allen 3 send-sites (S27)
- `prepaid-credit-expirer`: event-row insert BEFORE email-send (S28)
- Dunning-Cap (Bundle G überlappt)

## 6. Schritte

### Phase 1 — K14 Auto-Overage End-to-End (~4h)
- [ ] Lese `autoOverageEnabled` + `spendCapMicrocents` in `audit-action.ts` + `audit-requested.ts`
- [ ] Pass `allowOverage` zu `canConsume` + `consumeCredits`
- [ ] Spend-Cap-Check in `consumeCredits` (currently never read)
- [ ] Integration-Test: workspace mit `autoOverageEnabled=true` + `credits_used >= quota` → audit succeeds + ledger-row geschrieben
- [ ] Integration-Test: credit-aggregator findet overage-row + Stripe-Meter-Event gesendet (MSW-Mock)

### Phase 2 — K15 + K16 + S33 (~3h)
- [ ] K15 `current_period_end` → `sub.items.data[0].current_period_end` mit Type-Safety-Helper
- [ ] K16 Inngest local-path reject — `audit-requested.ts:70` mit `if (input.rootPath.startsWith("/")) throw new NonRetriableError(...)`
- [ ] S33 Stripe-Webhook multi-statement updates in `db.transaction()`

### Phase 3 — S1 Idempotenz auf invoice.id (~3h)
- [ ] Migration 0017: partial unique index `(workspace_id, reason, reference_id) WHERE reason IN ('monthly_grant')`
- [ ] `grantCredits()` mit `.onConflictDoNothing()` keyed on Index
- [ ] Replay-Test (Dashboard-resend) verifiziert duplicate=true

### Phase 4 — S2 + S3 + S4 (~2h)
- [ ] S2 `case "customer.deleted":` Handler in webhook/route.ts
- [ ] S3 `tax_code: txcd_10103001` Migration für alle Prices (Bootstrap-Skript-Update + Stripe-Dashboard-Manual ODER API-Patch)
- [ ] S4 `customer_update.name: "auto"` in billing-actions.ts:83,203

### Phase 5 — S5 AI-Markup-Meter (~3h)
- [ ] `audit_run_cost.markupMicrocents` berechnen statt 0
- [ ] Inngest-Function `flush-markup-meter` (oder in credit-aggregator-Pfad integrieren)
- [ ] Stripe-Meter `ai_markup` Bootstrap

### Phase 6 — Inngest Atomicity (~4h)
- [ ] S24 `audit-requested` in `db.transaction()`
- [ ] S25 `onFailure` Handler auf allen 5 Functions
- [ ] S26 `auto-track-repos` 3 statements in transaction
- [ ] S27 `inngest.send({id: deterministicKey})` auf 3 send-sites
- [ ] S28 `prepaid-credit-expirer` reorder: insert-event-row BEFORE email-send
- [ ] S29 `stripe-reconcile` pageCount-Truncation-Alert

### Phase 7 — K34 Email-Triggers (überlappt Bundle G)
- [ ] Invoice-paid receipt-email (`handleInvoicePaid`)
- [ ] Credit-low-warning-Cron (Inngest, daily, sendet wenn balance < 10%)

### Phase 8 — Acceptance
- [ ] All tests green
- [ ] Manual: Stripe-CLI replay `invoice.paid` → duplicate=true bestätigt
- [ ] Manual: Test-customer Tier-Upgrade + Auto-Overage-Trigger + Stripe-Meter im Dashboard
- [ ] `git mv` → done

## 7. Files-to-Change

**Modified:**
- `apps/web/src/lib/audit-action.ts:122,352`
- `apps/web/src/lib/billing-actions.ts:83,203`
- `apps/web/src/app/api/stripe/webhook/route.ts:461-465,315-352, switch+case "customer.deleted"`
- `packages/billing/src/credits.ts:163-194, 240-246`
- `packages/inngest/src/functions/audit-requested.ts:70`
- `packages/inngest/src/functions/credit-aggregator.ts`
- `packages/inngest/src/functions/prepaid-credit-expirer.ts:125-148`
- `packages/inngest/src/functions/stripe-reconcile.ts`
- `packages/inngest/src/functions/auto-track-repos.ts`
- `scripts/stripe-test-setup.ts` (tax_code on Prices)

**New:**
- Integration-Test-Files für Auto-Overage E2E
- Migration 0017

## 8. DB-Migration

```sql
-- Migration 0017 (Bundle B): credit_ledger idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_invoice_grant
  ON credit_ledger (workspace_id, reason, reference_id)
  WHERE reason = 'monthly_grant';
```

## 9. Test-Plan

- Unit: `grantCredits` idempotency, `consumeCredits` overage-branch
- Integration: Auto-Overage E2E, invoice.paid replay, customer.deleted, Inngest-Atomicity
- Manual: Stripe-CLI smoke (Test-Mode)

## 10. Risiken

| Risiko | Mitigation |
|---|---|
| Migration 0017 läuft langsam auf großer credit_ledger | partial-index, CONCURRENTLY-build (PG) |
| `current_period_end`-fix bricht existierende Integration-Tests | Test-Mock-Updates parallel |
| tax_code update auf bestehende Prices in Test-Stripe | Bootstrap-Skript idempotent re-run |
| Inngest in `db.transaction()` + DB-Lock-Contention | Step-Decomposition, transactions kurz halten |

## 11. Aufwand

**5-6 dev-days** Multi-Session.

## 12. Out-of-Scope

- **AI-Markup-Meter (S5)** — GA-out-of-scope (User-Entscheidung 2026-06-08). `markupMicrocents` bleibt 0, kein Flush. Beim Stripe-Live-Bootstrap (Bundle E) den ai_markup-Meter/Price hinter ein Flag legen, damit kein Phantom-Price im Live-Account liegt. Aktivierung post-launch.
- S3/Blob-Upload für Inngest-Local-Path (V2)
- Refund-Flow für Credits (V2)
- Spend-Cap-Soft-Warning-UI (V2 — Bundle G hat nur Email)
- Past-due-Feature-Gating (V2 — Wave-1 M-Item)
- Subscription-Schedule-Events (Stripe `subscription_schedule.*`)

## 13. Open Items

- Auto-Overage Quick-Cut für Inngest-Path: nur GitHub-URLs erlauben — bestätigen?
- Tax-Code: `txcd_10103001` (SaaS B2B) bestätigen, oder andere Code mit Tax-Berater verifizieren?
- Credit-Low-Threshold: 10% Default → User-konfigurierbar später?
