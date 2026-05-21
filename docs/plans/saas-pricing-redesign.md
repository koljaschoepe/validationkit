# Plan — SaaS-Pricing-Redesign (Master)

> Erstellt: 2026-05-21
> Status: 🟡 In Review
> Slug: `saas-pricing-redesign`
> Confidence: **High** — 16 User-Decisions in 4 Discovery-Runden + Audit von 22 Files (`packages/billing/`, `packages/db/src/schema.ts`, `packages/llm/src/{select.ts,rules/*}`, `apps/web/src/app/api/stripe/webhook/route.ts`, `apps/web/src/lib/{stripe.ts,billing-actions.ts}`, `apps/web/src/app/{pricing,billing}/page.tsx`, `packages/inngest/src/functions/stripe-reconcile.ts`)
> Sub-Plans: [`saas-pricing-sub-a-db-metering`](./saas-pricing-sub-a-db-metering.md) · [`saas-pricing-sub-b-stripe-credits`](./saas-pricing-sub-b-stripe-credits.md) · [`saas-pricing-sub-c-ui-compliance`](./saas-pricing-sub-c-ui-compliance.md)

---

## 1. Ziel

ValidationKit bekommt ein produktionstaugliches Hybrid-Pricing: **4 Tiers (Free/Starter/Pro/Agency)** auf **Workspace-Ebene** mit **Credits-System** ("Quick" = 1 Credit, "Deep" = 5 Credits) und **Stripe-Meters + Credit-Grants** für transparente Cost-Pass-Through bei Overage. Multi-Provider-AI wird **per Intensität gewählt** (nicht per Modell-Name) — Quick nutzt GPT-5-mini, Deep nutzt Claude Sonnet 4.6 + Multi-Pass. Plan endet mit Stripe-**Test-Mode** vollständig wired, allen Compliance-Pages live, und einer dokumentierten Live-Switch-Checkliste.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID | Runde | Frage | Antwort |
|----|-------|-------|---------|
| Q1.1 | R1 | Pricing-Modell-Kern | **Hybrid Subscription + Audit-Overage** (10% pure pass-through verworfen — Stripe-Fees fressen es auf) |
| Q1.2 | R1 | Quota-Ebene | **Workspace-Level** (1 Workspace = 1 Stripe-Sub, multiple Customers gemeinsam ins Kontingent) |
| Q1.3 | R1 | BYOK-Support | **Ja, als Workspace-Settings-Toggle** (Default: managed AI) |
| Q1.4 | R1 | Plan-Scope | **Multi-Phase-Master mit 3 Sub-Plans** |
| Q2.1 | R2 | DB-Migration-Destruktivität | **Fresh Schema, Migration-Wipe akzeptabel** (keine Live-Customer) |
| Q2.2 | R2 | Tier-Cut + Preise (EUR) | **Free €0 / Starter €29 / Pro €99 / Agency €299**, jeweils annual mit 20% Discount |
| Q2.3 | R2 | AI-Default | Ursprünglich GPT-5-mini → **modifiziert zu Intensitäts-Pattern** (Q3.1) |
| Q2.4 | R2 | Compliance-Scope | **Sub-Processor-Page + AGB-Pricing-Klausel + DPA-Template** (Steuer-Setup out-of-scope) |
| Q3.1 | R3 | AI-Modell-Wahl-UI | **Intensitäts-Toggle pro Audit-Run** (Quick=GPT-5-mini, Deep=Sonnet 4.6 + Multi-Pass). Free-Tier zwingt Quick. |
| Q3.2 | R3 | Free-Tier-Reset | **Lifetime-Cap 3 Audits pro Workspace** (kein Monats-Reset — Trial-Mindset, Conversion-driver) |
| Q3.3 | R3 | Stripe-Mode | **Test-Mode komplett, Live-Switch dokumentiert in `docs/operations/stripe-go-live.md`** |
| Q3.4 | R3 | Test-Tier | **Vitest + Stripe-Mocks + Stripe-CLI-Webhook-Forward E2E** |
| Q4.1 | R4 | Credit-Ratio | **Quick=1, Deep=5** |
| Q4.2 | R4 | Top-up-Mechanik | **Hybrid: Auto-Overage (€0.30/Credit) + Pre-Paid-Packs (100=€25, 500=€99)** mit 12-Monats-Expire |
| Q4.3 | R4 | Tier-Cleanup | **packages/billing/src/tiers.ts komplett ersetzen** — alte 6 Tiers werden gewipet (keine Map-Tabelle) |
| Q4.4 | R4 | Stripe-Reconcile-Cron | **Behalten, an Workspace-Level anpassen** (Auto-Fix bleibt OFF) |

## 3. Existing-Patterns im Repo (Vorbild)

- **Stripe-Client-Singleton**: `apps/web/src/lib/stripe.ts:1-79` zeigt `isStripeEnabled()` + `priceIdFor(tier, cycle)`-Pattern. Neue Tier-Namen folgen `STRIPE_PRICE_<TIER>_<CYCLE>`-Konvention.
- **Webhook-Idempotenz**: `apps/web/src/app/api/stripe/webhook/route.ts:1-263` zeigt `stripeEvent`-Table als Dedupe-Lock + Raw-Body-Signature-Verification. Neue Events folgen exakt diesem Pattern.
- **Tier-Snapshot-Mirroring**: `packages/billing/src/subscription.ts:1-126` zeigt `ensureSubscription()` + DB-mirrored Quotas (kein Stripe-Round-Trip bei jedem Gate-Check). Wird auf Workspace-Level übertragen, Pattern bleibt.
- **Drizzle-Schema**: `packages/db/src/schema.ts` zeigt Unique-Constraints + JSONB-Payload-Felder für `stripeEvent`. Neue Tables (`ai_usage_event`, `credit_ledger`) folgen.
- **Inngest-Cron**: `packages/inngest/src/functions/stripe-reconcile.ts` zeigt Nightly-Reconcile + Audit-Event-Logging. Bleibt strukturell gleich, wird auf workspace_id umgestellt.
- **AI-SDK-Provider-Select**: `packages/llm/src/select.ts:37-61` zeigt Conditional Provider-Auswahl via Env-Var. Wird erweitert um Intensitäts-Param + BYOK-Pfad.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Pure 10%-Pass-Through (User-Original-Wunsch)** → Verworfen weil Stripe-Fee (2.9% + €0.30) bei kleinen Audit-Volumina 89% der Marge frisst, kein Puffer für Support/Refunds, industry-Default ist 25-40%. **Stattdessen** transparente Disclosure: "Audits zum AI-Cost × 1.5 (in Subscription inkludiert) + Overage zum AI-Cost × 2".
- **Pure Pre-Paid-Credits (Cursor-Style)** → Verworfen weil Subscription-Base als Marge-Anker fehlt, Cashflow-Lag, kein Upsell-Pfad.
- **Pure Usage-Metered ohne Subscription** → Verworfen weil Bill-Shock-Risiko (Cursor-Skandal Juni 2025) + keine Cashflow-Predictability für Solo-Dev.
- **User-Level-Quotas (Status-Quo)** → Verworfen weil Agency-Persona (mehrere Berater im selben Workspace) gebrochen ist.
- **Sonnet 4.6 als Default ohne Intensitäts-Wahl** → Verworfen weil Free-Tier-Cost explodiert. Intensitäts-Pattern erlaubt Cost-Cap auf Free.
- **6-Tier-Mapping mit deprecated-Flag** → Verworfen weil keine Live-Customer existieren (Test-Mode only), Mapping-Komplexität spart nichts.
- **Vercel AI Gateway** → Verworfen per ADR-0005 (Vendor-Lock-in-Vermeidung).
- **Credit-Top-up nur Pre-Paid (kein Auto-Overage)** → Verworfen weil Productive-Flow-Block ("Audit nicht möglich") schlechte Conversion.

## 5. Endzustand (was ist nach allen 3 Sub-Plans anders?)

**Backend:**
- `subscription`-Table ist auf `workspaceId` (UNIQUE) statt `userId` umgestellt; 4 neue Tabellen existieren (`ai_usage_event`, `audit_run_cost`, `credit_ledger`, `prepaid_credit_grant`).
- `packages/billing/src/tiers.ts` hat 4 Tier-Definitionen: `free / starter / pro / agency` mit Credit-Quotas (3 lifetime / 50 mo / 300 mo / 1500 mo).
- `packages/billing/src/credits.ts` (NEU) ist die Source-of-Truth für `consumeCredits()`, `grantCredits()`, `getCreditBalance()`.
- Jeder LLM-Call in `packages/llm/src/rules/*` extrahiert `usage` + persistiert eine Row in `ai_usage_event` (mit `provider`, `model`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cost_microcents`).
- `packages/llm/src/select.ts` wählt Provider/Modell basierend auf `intensity: 'quick' | 'deep'` + Workspace-BYOK-Toggle.
- Inngest-Job `credit-aggregator` (NEU) sendet Meter-Events an Stripe alle 5 Min batched.
- Reconcile-Cron läuft auf Workspace-Level, loggt Drifts.

**Stripe:**
- 1 Product (`prod_validation`) mit 12 Prices (4 Tiers × 2 Cycles + Overage-Meter + AI-Markup-Meter + 2 Pre-Paid-Packs).
- 2 Meters: `mtr_audit_credit_overage`, `mtr_ai_cost_markup_microcents`.
- 6 Webhook-Events handled mit Idempotenz.
- Stripe Tax aktiv + Tax-ID-Collection im Checkout.

**Frontend:**
- `/pricing` zeigt 4 neue Tier-Karten mit Cost-Pass-Through-Footnote + EUR-Preisen + VAT-Logic.
- `/[workspace]/settings/billing` ersetzt `/billing` (workspace-scoped).
- `/[workspace]/settings/ai` (NEU) zeigt BYOK-Toggle + Auto-Overage-Switch + Spend-Cap.
- `AuditTriggerForm` zeigt Quick/Deep-Toggle + Live-Cost-Preview ("This audit will consume 1 credit").
- `CreditMeter`-Komponente in Right-Rail zeigt aktuelle Credits + Resets-Datum + Top-up-CTA.
- 3 neue Legal-Pages: `/legal/subprocessors`, `/legal/dpa`, `/legal/agb` (Update mit Pricing-Klausel).

**Tests:**
- 80%+ Coverage auf Webhook-Pfaden (alle 6 Events).
- Playwright-E2E-Flow: Checkout → Webhook → DB-State → Quota-Check → Audit-Trigger → Credit-Consumption → Overage-Meter.
- Vitest mit msw-Stripe-Handlers für Unit-Layer.

**Compliance:**
- `/legal/subprocessors` listet Anthropic, OpenAI, Stripe, Vercel, Neon, Resend, Inngest (mit Regions + Purpose).
- AGB hat Pricing-Klausel mit Markup-Disclosure + 30-Tage-Notice-Klausel bei Provider-Wechsel.
- `docs/operations/stripe-go-live.md` listet KYC, USt-IdNr, OSS-Registrierung als out-of-scope-Checkliste.
- `docs/operations/transfer-impact-assessment.md` skizziert TIA für US-Sub-Processors.

## 6. Master-Phase-Plan + Sub-Plan-Schnitt

| Sub-Plan | Scope | Aufwand | Dependencies |
|----------|-------|---------|--------------|
| **A — DB + Metering** | Schema-Migration, AI-Usage-Tracking, Credit-Ledger, neue Tier-Definitionen, `consumeCredits()`-Logik. Backend-Pure. | ~6-8h | Keine. Starts first. |
| **B — Stripe + Credits** | Stripe Meters + Products + Prices + Webhook-Erweiterung, Credit-Grants, Reconcile-Cron-Refactor, Test-Mode-Setup-Script. | ~6-8h | Blockiert von A (braucht neue DB-Schemas). |
| **C — UI + Compliance** | Pricing-Page-Rewrite, Workspace-Settings-Billing+AI, Quick/Deep-Toggle, Credit-Meter, 3 Legal-Pages, E2E-Tests. | ~6-8h | Blockiert von A+B (braucht Backend-APIs). |

**Master-File-PR:** Doc-only, mergt diesen Master + 3 Sub-Plan-Stubs. **Pre-Execute-Step für jeden Sub-Plan:** Realitäts-Check ob Sub-Plan-Decisions noch stimmen (Phase-Pacing-Pattern aus User-Memory).

## 7. Hoch-Level Files-to-Change (Master-Übersicht)

| Bereich | Sub-Plan | Neue Files (NEW) | Edits (EDIT) | Deletes |
|---------|----------|------------------|--------------|---------|
| DB-Schema | A | 2 Migrations + 1 Drizzle-File-Update | `packages/db/src/schema.ts` | — |
| Billing-Pkg | A | `credits.ts`, `intensity.ts` | `tiers.ts`, `subscription.ts`, `index.ts` | — |
| LLM-Pkg | A | `usage.ts` | `select.ts`, `rules/conflicting-rules.ts`, `rules/context-bloat-llm.ts` | — |
| Audit/Inngest | A | — | `packages/audit/`, `packages/inngest/src/functions/audit-requested.ts` | — |
| Stripe-Lib | B | `stripe-meters.ts`, `scripts/stripe-test-setup.ts` | `apps/web/src/lib/stripe.ts`, `lib/billing-actions.ts` | — |
| Webhook | B | — | `apps/web/src/app/api/stripe/webhook/route.ts` (+ 2 neue Events) | — |
| Cron | B | `credit-aggregator.ts` | `stripe-reconcile.ts` | — |
| Pricing-UI | C | `cost-estimator.ts`, `CreditMeter.tsx` | `apps/web/src/app/pricing/page.tsx` | `/billing/page.tsx` (replaced) |
| Workspace-Settings | C | `[workspace]/settings/billing/page.tsx`, `[workspace]/settings/ai/page.tsx` | `[workspace]/settings/billing/page.tsx` (stub) | — |
| Audit-UI | C | — | `AuditTriggerForm.tsx`, `audit-action.ts` | — |
| Legal | C | `/legal/subprocessors/page.tsx`, `/legal/dpa/page.tsx` | `/legal/agb/page.tsx` (oder NEW falls fehlt) | — |
| Docs | C | `docs/operations/stripe-go-live.md`, `docs/operations/transfer-impact-assessment.md`, `docs/adrs/0006-credit-system-and-intensity.md` | `docs/vision.md` (Pricing-Sektion) | — |

**Volumen-Schätzung:** ~22 NEW Files, ~18 EDIT Files. Total LOC ~3200 (Code + Schema + Docs + Tests).

## 8. Master Test-Plan

**Automatisch (jeder Sub-Plan-PR):**
- `pnpm typecheck` ✓
- `pnpm test` ✓ — Vitest Unit-Tests (≥80% Coverage auf neuen Files)
- `pnpm test:integration` ✓ — Stripe-Mocks via msw + Drizzle-Test-DB
- `pnpm test:e2e` ✓ — Playwright-Flows (Sub-Plan-C-PR-Gate)
- `pnpm lint` ✓
- Lighthouse-CI auf neuen Pages (≥85 Perf / ≥95 A11y / ≥95 BP)

**Stripe-Spezifisch (Sub-Plan B):**
- `stripe trigger checkout.session.completed` lokal forwarded → Webhook → DB-State asserted
- `stripe trigger invoice.created` mit Meter-Events asserted
- Idempotenz-Test: Webhook 3× zustellen → exakt 1 DB-State-Change
- Reconcile-Cron-Test: Manuelle Drift-Erzeugung in Test-DB → Cron loggt Drift

**Manuell (Pre-Execute Final-Gate):**
- [ ] Test-Mode Checkout-Flow (Free → Starter): Card 4242, Webhook trifft ein, Workspace-Tier updated.
- [ ] Quick-Audit auf Free-Tier: 3× erfolgreich, 4. blockiert mit Upgrade-CTA.
- [ ] Deep-Audit auf Starter: konsumiert 5 Credits, Credit-Meter-UI updated live.
- [ ] Overage-Trigger: Pro-Workspace verbraucht 301. Credit → Stripe Meter-Event abgesetzt + nächste Invoice zeigt Overage-Line.
- [ ] BYOK-Toggle: Workspace setzt eigenen Anthropic-Key → AI-Usage wird nicht mehr in `ai_usage_event` gelogged (oder mit `byok=true`-Flag).
- [ ] Customer-Portal: Self-Serve-Cancel funktioniert, Subscription-Cancel-Webhook downgraded auf Free.
- [ ] EU-VAT-ID-Test: Customer mit valider DE-VAT-ID → Reverse-Charge auf Invoice.

## 9. Master Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| Cache-Hit-Rate < 50% drückt Sonnet-Marge ins Minus | **Strong** | Sub-Plan-A persistiert `cache_read_tokens` pro Call → Sub-Plan-C-Dashboard zeigt 7d-Rolling Cache-Hit-Rate. Bei <50%: Alert + Re-Pricing-Review. |
| Stripe-Meter-Events laggen Invoice-Finalization → Customer kriegt "free Overage" | **Mid** | Sub-Plan-B implementiert `invoice.created`-Webhook der 2xx erst nach Meter-Flush antwortet (Stripe 72h-Backoff bei non-2xx ist Sicherheitsnetz). |
| DB-Migration-Wipe trifft doch versteckte Test-Daten | **Mid** | Pre-Migration-Script in Sub-Plan-A: `SELECT count(*) FROM subscription WHERE stripeSubscriptionId IS NOT NULL` muss = 0 sein. Manueller Override-Flag in Migration-File. |
| Intensitäts-Toggle missverstanden ("warum kostet Deep 5x?") | **Mid** | Sub-Plan-C: Cost-Preview im AuditTriggerForm + Tooltip ("Deep-Audit nutzt Claude Sonnet mit Multi-Pass-Analyse — bessere Findings, höherer Compute"). FAQ-Eintrag. |
| Compliance-Lücke beim Go-Live (DSGVO Art. 28) | **Strong** | Sub-Plan-C blockt Go-Live bis `/legal/subprocessors` + DPA-Template live sind. `docs/operations/stripe-go-live.md` als Hard-Gate. |
| BYOK-Customer hat fehlerhaften API-Key → Audits silent fail | **Mid** | Sub-Plan-A: BYOK-Validation beim Toggle-On (Test-Call gegen Anthropic) + UI-Error wenn invalid. |
| Credit-Race-Conditions bei parallel-Audits | **Strong** | Sub-Plan-A: `consumeCredits()` mit Drizzle-Transaction + `SELECT ... FOR UPDATE` Lock auf credit_ledger-Row. |
| Stripe-Reconcile-Cron findet false-positives nach Webhook-Lag | **Weak** | Reconcile ignoriert Subscriptions mit `updatedAt > now() - 5min` (Webhook-Settle-Window). |
| Free-Tier-Lifetime-Cap umgehbar via neuen Workspace pro User | **Mid** | Akzeptiert. Per-User-Workspace-Limit (max 3 Free-Workspaces/User) in Sub-Plan-A. Reduziert Abuse-Surface. |
| Pre-Paid-Pack-Expiration trifft Customer überraschend nach 12mo | **Mid** | Email-Notice 30d/7d/1d vor Expire (Resend). UI-Banner. |

## 10. Rollout

**Strategie:** **Branch + Review pro Sub-Plan**, NICHT Feature-Flag (Stripe-Code ist getoggled via `isStripeEnabled()` + Test-Mode-Env-Vars). Direct-Merge nach grünem CI + manueller Smoke-Test.

**Pre-Deploy-Gates (Master-Level):**
1. Sub-Plan-A merged + grün → Sub-Plan-B kann starten
2. Sub-Plan-B merged + grün + manuelle Stripe-Test-Mode-Smoke-Tests grün → Sub-Plan-C kann starten
3. Sub-Plan-C merged + grün + alle Playwright-E2E-Flows grün → **Pricing-System ist Beta-Launch-ready in Test-Mode**

**Post-Deploy-Verifikation (nach jedem Sub-Plan-PR):**
- Dev-Server-Auto-Start (`pnpm --filter @vk/web dev`)
- Browser-Check der neuen Pages
- `pnpm db:studio` Check der neuen Schemas
- `stripe events resend evt_xxx` für Webhook-Reprozessierung-Test

**Rollback-Trigger:**
- Wachstum von `stripeEvent`-Table mit `processedAt = null` Rows (Webhook-Failures)
- Credit-Ledger-Inkonsistenz (`SUM(delta)` != `getCreditBalance()`)
- DB-Migration-Failure auf Vercel-Preview-Deploy

**Rollback-Schritte:**
- Sub-Plan-A: `pnpm db:rollback` → Migration 0013/0014 revert + Code-Branch-Revert via `git revert`
- Sub-Plan-B: Stripe-Test-Mode-Resources via `stripe products delete` cleanen + Code-Revert
- Sub-Plan-C: UI-only-Revert via `git revert` (kein DB-Impact)

**Pricing-Live-Switch (separates Out-of-Scope-Event):**
- Manuelle Checkliste in `docs/operations/stripe-go-live.md`
- KYC + USt-IdNr + OSS-Registrierung + Stripe-Live-Mode-Activation passieren außerhalb dieses Plans

## 11. Out-of-Scope (V2 / separater Plan)

- **Stripe Live-Mode-Activation:** KYC, USt-IdNr-Beantragung, OSS-Registrierung, Stripe-Atlas-Identity-Verification. Nur Checkliste, kein Code.
- **Enterprise-Tier-Custom-Pricing:** Sales-Flow, MSA-Templates, Vertrags-Sign-Off-UI. Out-of-scope.
- **Multi-Currency-Support:** EUR-only Phase 1. USD/GBP/CHF in V2.
- **Annual-Billing-Cycle-Upsell-Flow:** UI für Monthly→Annual-Switch mit Pro-Rata-Refund. Out-of-scope (Customer-Portal kann es).
- **Promotion-Codes / Discounts:** Stripe-Coupons-UI. Out-of-scope (manuell im Dashboard möglich).
- **Affiliate / Referral-Programm:** Out-of-scope, ggf. V2.
- **Migrationsweg von User-Level zu Workspace-Level für bestehende Test-Subscriptions:** Nicht nötig (Wipe).
- **Sales-Tax in US-States:** Stripe-Tax monitort Schwellen, Registrierung manuell wenn nötig.
- **Auto-Fix im Reconcile-Cron:** Bleibt OFF (manuelle Eingriffe).
- **AI-Cost-Dashboard mit Per-Customer-Breakdown:** Aggregate-View in Sub-Plan-C, granulare Per-Customer-View in V2.
- **Workflow für USt-Voranmeldungs-Export:** Stripe-Tax-Report manuell ziehen.

## 12. Open Questions

*Idealerweise leer — alle load-bearing Decisions sind in §2 dokumentiert.*

- Q-Post-A: Wenn Cache-Hit-Rate <50% nach 14d Live-Traffic → Re-Pricing-Review (Overage-Rate von €0.30 zu €0.40?). Daten-getrieben in V2.
- Q-Post-B: Stripe **v2 Pricing-Plans API** (Private Preview seit April 2026) — Migration evaluieren wenn GA wird.

## 13. Aufwand-Schätzung

| Phase | Aufwand | Wann |
|-------|---------|------|
| Master-File-Review + Merge | 0.5h | Jetzt |
| Sub-Plan-A (DB + Metering) | 6-8h | Nach Master-Merge |
| Sub-Plan-B (Stripe + Credits) | 6-8h | Nach A |
| Sub-Plan-C (UI + Compliance) | 6-8h | Nach B |
| Manuelle Stripe-Test-Mode-Setup (außerhalb Code) | 1-2h | Während B |
| **Gesamt-Code** | **~20-26h** | 3-4 Execute-Sessions |
| Live-Mode-Switch (out-of-scope) | ~4-8h zusätzlich | Separater Plan |

**PR-Schnitt:** 4 PRs total (Master Doc-only + 3 Code-PRs). Master ist Approval-Gate.
