# Plan — SaaS-Pricing Sub-C: UI + Compliance + E2E-Tests

> Erstellt: 2026-05-21
> Status: 🟡 In Review
> Slug: `saas-pricing-sub-c-ui-compliance`
> Confidence: **High** — Sub-Plan des Masters [`saas-pricing-redesign`](./saas-pricing-redesign.md). Decisions referenziert dort §2.
> Voraussetzung: Sub-Plan-A + Sub-Plan-B gemerged

---

## 1. Ziel

User-Facing-Layer: neue Pricing-Page mit 4 Tiers + Quick/Deep-Erklärung, Workspace-Settings-Billing-Page (ersetzt Top-Level `/billing`), neue `/settings/ai`-Page für BYOK + Auto-Overage-Toggle + Spend-Cap, Audit-Trigger-UI mit Intensitäts-Toggle + Cost-Preview, Credit-Meter-Komponente im Right-Rail. Plus: 3 Legal-Pages (Sub-Processors + DPA + AGB-Update), Compliance-Disclosure für Markup, Playwright-E2E-Coverage des kompletten Flows.

## 2. Endzustand

- `/pricing` zeigt **4 Tier-Karten** (Free/Starter/Pro/Agency) mit klarer Credit-Quota + Quick/Deep-Erklärung + Markup-Footnote.
- `/[workspace]/settings/billing` ersetzt `/billing` als Workspace-Level Billing-Dashboard.
- `/[workspace]/settings/ai` (NEU) zeigt BYOK-Toggle + Auto-Overage-Switch + Spend-Cap-Slider.
- `AuditTriggerForm` zeigt Quick/Deep-Toggle mit Live-Cost-Preview ("This Quick audit will consume 1 credit (≈€0.05)").
- `CreditMeter`-Komponente in Right-Rail zeigt aktuelle Credits + Reset-Datum + Top-up-CTA.
- Pre-Paid-Pack-Buy-Flow funktioniert (Modal mit 2 Pack-Optionen → Stripe-Checkout → Webhook → Credits sichtbar).
- `/legal/subprocessors` listet alle Sub-Processoren.
- `/legal/dpa` zeigt DPA-Template (markdown→html, mit Download-Button).
- `/legal/agb` updated mit Pricing-Klausel + Markup-Disclosure + 30d-Notice + Fair-Use.
- Email-Templates: Pre-Paid-Pack-Expire-Warnings (30d/7d/1d), Past-Due-Notice, Plan-Change-Confirmation.
- Playwright-E2E-Suite covered: Sign-up → Checkout → Audit-Quick → Audit-Deep-blocked-as-Free → Upgrade → Audit-Deep → Pre-Paid-Pack-Buy → BYOK-Toggle.
- `docs/operations/transfer-impact-assessment.md` skizziert TIA.

## 3. Schritte

### Phase C.1 — Pricing-Page-Rewrite

- [ ] `apps/web/src/app/pricing/page.tsx` komplett umschreiben:
  - 4 Tier-Karten responsive Grid (1 col mobile, 2 col tablet, 4 col desktop)
  - Per Karte: Tier-Name, Preis (Monthly + Annual mit 20%-Discount-Highlight), Credit-Quota, Customer-Workspaces-Included, Features-Liste, CTA-Button
  - Cycle-Toggle (Monthly/Annual) bestehend bewahren
  - **Quick/Deep-Erklärungs-Sektion** (Hero-Section unter Karten): "Quick = 1 Credit, Deep = 5 Credits. Deep nutzt Claude Sonnet 4.6 mit Multi-Pass für maximale Quality. Free-Tier ist immer Quick."
  - **Markup-Disclosure-Footnote**: "Audit-Preise sind Subscription + AI-Compute. Overage-Credits werden zu €0.30/Stück (≈ AI-Cost + Service-Margin) abgerechnet."
  - FAQ-Sektion: Was sind Credits? · Quick vs Deep? · Was passiert wenn Credits aus sind? · BYOK? · Reverse-Charge für EU-B2B?
  - VAT-Logik bestehend bewahren (Vercel-Edge x-vercel-ip-country)
  - Lighthouse-Score ≥85 Perf / ≥95 A11y / ≥95 BP

### Phase C.2 — Workspace-Settings-Billing-Page

- [ ] `apps/web/src/app/[workspace]/settings/billing/page.tsx` komplett ersetzen (war Stub):
  - **Current-Plan-Card**: Tier-Name, Cycle, Next-Renewal, Status-Badge (active/past_due/canceled)
  - **Credit-Balance-Card**: Aktuelle Credits / Quota, Progress-Bar, Reset-Datum
  - **Pre-Paid-Packs-Card**: Liste aktiver Grants mit Remaining + Expires-At
  - **Plan-Change-Buttons**: Upgrade-Tier-Picker (Modal mit 4 Tiers) → `createCheckoutSession`
  - **Buy-Credit-Pack-Buttons**: 100 (€25) / 500 (€99) → `createPrepaidPackCheckoutSession`
  - **Manage-Subscription-Button**: → Stripe Customer-Portal (`openBillingPortalAction`)
  - **Invoice-History-Link**: → Stripe-Portal-Direct-Link
  - **Past-Due-Banner** (wenn Status = past_due): Update Payment-Method-CTA
- [ ] `/billing/page.tsx` (Top-Level) durch Redirect auf `/[firstWorkspace]/settings/billing` ersetzen (Backwards-Compat)

### Phase C.3 — Workspace-Settings-AI-Page (NEU)

- [ ] `apps/web/src/app/[workspace]/settings/ai/page.tsx` (NEU):
  - **BYOK-Toggle-Card**: Switch + API-Key-Input (Anthropic ODER OpenAI) + Validate-Button
    - On-Toggle-On: Test-Call gegen Provider → Error if invalid
    - On-Toggle-On: Settings-Update via Server-Action, key encrypted-stored
    - UI-Hint: "BYOK deaktiviert Cost-Pass-Through für Audits. Du zahlst Subscription weiterhin, aber AI-Costs gehen direkt an deinen Provider-Account."
    - Tier-Gate: Nur ab Pro-Tier verfügbar (greyed-out + Upgrade-Hint für Starter/Free)
  - **Auto-Overage-Card**: Switch (On/Off)
    - Off = Audits blocken wenn Credits aus
    - On = Auto-Buy-Overage zum Stripe-Meter-Rate (€0.30/Credit)
  - **Spend-Cap-Card**: Slider mit €-Amount, prevent Overage-Charges über X
  - **Default-Intensity-Card**: Radio (Quick / Deep / Ask-Per-Audit) — Workspace-Default-Pref
- [ ] Server-Action `lib/workspace-ai-actions.ts` (NEU): `updateByokSettings`, `toggleAutoOverage`, `setSpendCap`, `setDefaultIntensity`
- [ ] Workspace-Settings-Sidebar in `[workspace]/settings/layout.tsx` updaten: neuer "AI" Nav-Item

### Phase C.4 — Audit-Trigger-UI-Update

- [ ] `apps/web/src/components/AuditTriggerForm.tsx` (oder ähnlich — exakter Pfad in Pre-Execute-Check verifizieren):
  - **Intensity-Toggle-Component** (Pill-Group): Quick / Deep
    - Tier-Gate: Free-Tier zeigt Deep als greyed-out mit Tooltip "Upgrade to Pro for Deep audits"
    - Cost-Preview: "This Quick audit will consume **1 credit** (≈€0.05 AI-cost-equivalent)"
  - **Credits-Available-Hint**: "You have 47 of 50 credits this period"
  - On-Submit: `intensity` als Form-Field, Server-Action liest's
- [ ] Cost-Estimator `apps/web/src/lib/cost-estimator.ts` (NEU): `estimateAuditCost({ intensity, repoSize? }): { credits: number; eurEstimate: number; aiModelLabel: string }`

### Phase C.5 — Credit-Meter-Komponente

- [ ] `apps/web/src/components/CreditMeter.tsx` (NEU):
  - Right-Rail-Komponente, 240px breit
  - Zeigt: Aktuelle Credits / Quota (z.B. "47 / 50"), Progress-Bar (OKLCH-Token), Reset-Datum, Top-up-CTA-Button
  - Integration in `[workspace]/layout.tsx` Right-Rail (neben ActivationChecklist, conditional rendering)
  - Live-Updates: bei Audit-Completion (via SWR-Mutate oder Server-Action-Revalidation)
- [ ] Pre-Paid-Pack-Buy-Modal `apps/web/src/components/BuyCreditPackModal.tsx` (NEU):
  - 2 Pack-Optionen (100/500 Credits)
  - On-Click: `createPrepaidPackCheckoutSession` → Stripe-Checkout-Redirect

### Phase C.6 — Legal-Pages

- [ ] `apps/web/src/app/legal/subprocessors/page.tsx` (NEU):
  - Listet Sub-Processors: Anthropic (US), OpenAI (US), Stripe (IE+US), Vercel (US), Neon (EU+US), Resend (US), Inngest (US)
  - Pro Eintrag: Purpose, Region, DPA-Link, Last-Updated
  - 30d-Notice-Mechanismus: "We'll notify customers 30 days before adding a new sub-processor."
  - Markdown-driven, Source in `apps/web/src/content/legal/subprocessors.md` für leichte Updates
- [ ] `apps/web/src/app/legal/dpa/page.tsx` (NEU):
  - DPA-Template-Text (markdown-rendered)
  - Download-PDF-Button (server-rendered PDF mit `@react-pdf/renderer` oder simpler markdown→PDF-Library)
  - Reference zu Sub-Processors-Page
- [ ] `apps/web/src/app/legal/agb/page.tsx` (EDIT — falls existiert; sonst NEW):
  - **Neue Pricing-Klausel**: Markup-Disclosure (Subscription-Base + AI-Compute-Cost × 1.5 in Sub, × 2 in Overage), 30d-Notice bei Pricing-Changes
  - **Sub-Processor-Klausel**: Verweis auf `/legal/subprocessors`
  - **Fair-Use-Klausel**: Rate-Limit-Reference
  - Cost-Volatility-Klausel: AI-Provider-Preise können sich ändern → Recht zur 30d-Notice-Anpassung
- [ ] Footer-Links updaten: `/legal/subprocessors`, `/legal/dpa`, `/legal/agb` sichtbar im Site-Footer
- [ ] `docs/operations/transfer-impact-assessment.md` (NEU):
  - TIA für Anthropic (US, AWS), OpenAI (US, Azure)
  - SCC-Reference, Encryption-in-Transit, Data-Minimization-Note
  - Out-of-scope: Anwaltliche Review (User-Verantwortung)

### Phase C.7 — Email-Templates

- [ ] `apps/web/src/emails/PrepaidPackExpireWarning.tsx` (NEU, React-Email): 30d/7d/1d-Varianten
- [ ] `apps/web/src/emails/SubscriptionPastDue.tsx` (NEU)
- [ ] `apps/web/src/emails/PlanChangeConfirmation.tsx` (NEU)
- [ ] Trigger-Wiring: Inngest-Job in `prepaid-credit-expirer.ts` (Sub-B) ruft Email-Send für 30d/7d/1d
- [ ] Webhook-Handler `invoice.payment_failed` triggert Past-Due-Email

### Phase C.8 — Playwright-E2E-Suite

- [ ] `apps/web/tests/e2e/pricing-flow.spec.ts` (NEU):
  - **Test 1 — Free-Tier-Sign-up:** Magic-Link-Sign-up → Default-Workspace → Workspace-Settings-Billing zeigt "Free, 3 credits lifetime"
  - **Test 2 — Quick-Audit-Free:** Audit-Form mit intensity=quick → Submit → Credit-Meter 2/3 → Audit-Completion-View
  - **Test 3 — Deep-Audit-Free-Blocked:** Audit-Form mit intensity=deep → Submit → Error "Upgrade required for Deep audits"
  - **Test 4 — Checkout-Starter:** Pricing-Page → Starter-CTA → Stripe-Checkout (Test-Card 4242) → Webhook (gewartet) → Billing-Page zeigt "Starter, 50 credits"
  - **Test 5 — Deep-Audit-Starter:** Audit-Form intensity=deep → Submit → Credit-Meter 45/50 → Audit-Completion
  - **Test 6 — Pre-Paid-Pack-Buy:** Buy-Pack-Modal → 100-Credit-Pack → Stripe-Checkout → Webhook → Credit-Meter 145/50 (50 base + 95 remaining from pack after audit)
  - **Test 7 — BYOK-Toggle:** Workspace-Settings-AI → BYOK-Toggle (Pro-Tier required → test mit Pro-Workspace) → Test-Audit → `ai_usage_event` Row mit byokFlag=true (DB-assertion)
  - **Test 8 — Cancel-Flow:** Billing-Portal → Cancel → Webhook (`subscription.deleted`) → Workspace zurück auf Free

### Phase C.9 — Vision-Update + Changelog

- [ ] `docs/vision.md` — Pricing-Sektion (§5 SaaS-Polish) updaten:
  - 4 Tiers statt 6
  - Credit-System + Quick/Deep
  - BYOK als Workspace-Setting
- [ ] `docs/changelog.md` — Sub-Plan-C-Entry + Master-Phase-Ship-Marker
- [ ] `docs/roadmap/phase-nova-2.md` — Pricing-System ✅-Marker

## 4. Files-to-Change

| Datei | Aktion | Was passiert |
|-------|--------|--------------|
| `apps/web/src/app/pricing/page.tsx` | EDIT (rewrite) | 4 Tiers, Quick/Deep-Erklärung, Markup-Disclosure |
| `apps/web/src/app/[workspace]/settings/billing/page.tsx` | EDIT (rewrite) | Workspace-Level Billing-Dashboard |
| `apps/web/src/app/billing/page.tsx` | EDIT | Redirect zu /[ws]/settings/billing |
| `apps/web/src/app/[workspace]/settings/ai/page.tsx` | NEW | BYOK + Auto-Overage + Spend-Cap |
| `apps/web/src/app/[workspace]/settings/layout.tsx` | EDIT | AI Nav-Item |
| `apps/web/src/lib/workspace-ai-actions.ts` | NEW | Server-Actions für AI-Settings |
| `apps/web/src/components/AuditTriggerForm.tsx` | EDIT | Intensity-Toggle + Cost-Preview |
| `apps/web/src/components/CreditMeter.tsx` | NEW | Right-Rail Credit-Display |
| `apps/web/src/components/BuyCreditPackModal.tsx` | NEW | Pre-Paid-Pack-Buy-UI |
| `apps/web/src/lib/cost-estimator.ts` | NEW | Pre-Audit Cost-Preview |
| `apps/web/src/app/legal/subprocessors/page.tsx` | NEW | Sub-Processors-Listing |
| `apps/web/src/content/legal/subprocessors.md` | NEW | Markdown-Source |
| `apps/web/src/app/legal/dpa/page.tsx` | NEW | DPA-Template + PDF-Download |
| `apps/web/src/app/legal/agb/page.tsx` | NEW/EDIT | Pricing-Klausel + Markup-Disclosure |
| `apps/web/src/components/SiteFooter.tsx` | EDIT | Legal-Links |
| `apps/web/src/emails/PrepaidPackExpireWarning.tsx` | NEW | Email-Template |
| `apps/web/src/emails/SubscriptionPastDue.tsx` | NEW | Email-Template |
| `apps/web/src/emails/PlanChangeConfirmation.tsx` | NEW | Email-Template |
| `apps/web/tests/e2e/pricing-flow.spec.ts` | NEW | Playwright-Suite (8 Tests) |
| `docs/operations/transfer-impact-assessment.md` | NEW | TIA-Skizze |
| `docs/vision.md` | EDIT | Pricing-Sektion |
| `docs/changelog.md` | EDIT | Phase-Ship-Marker |
| `docs/roadmap/phase-nova-2.md` | EDIT | ✅-Marker |

## 5. Test-Plan

**Automatisch:**
- `pnpm typecheck` + `pnpm test` + `pnpm lint` ✓
- Lighthouse-CI auf `/pricing`, `/[ws]/settings/billing`, `/legal/*` (≥85/95/95)
- axe-core auf neuen Pages via Playwright

**Playwright-E2E (siehe Phase C.8):**
- 8 Tests cover Sign-up → Checkout → Audit-Quick → Audit-Deep-blocked → Upgrade → Audit-Deep → Pack-Buy → BYOK → Cancel
- Stripe-Test-Mode + Webhook-Forward (CI-Setup)

**Manuell (Pre-Merge):**
- [ ] `/pricing` in 3 Viewports (mobile/tablet/desktop) durchklicken
- [ ] `/[ws]/settings/billing` mit Free + Starter + Pro-Workspace
- [ ] `/[ws]/settings/ai` BYOK-Toggle mit echtem Anthropic-Test-Key
- [ ] AuditTriggerForm Quick/Deep-Toggle, Cost-Preview verifizieren
- [ ] CreditMeter live-update nach Audit
- [ ] Pre-Paid-Pack-Buy-Flow (komplett, Webhook → DB → UI)
- [ ] Legal-Pages: Sub-Processors-List korrekt, DPA-PDF-Download funktioniert, AGB-Pricing-Klausel präsent
- [ ] Email-Templates: in Mailpit (dev) sichtbar, alle Vars rendered

## 6. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| BYOK-API-Key-Storage unsicher | Strong | Column-Encryption (Sub-A definiert), Server-Action darf Key nie ans Frontend zurückgeben (write-only). |
| Cost-Preview falsch (Cache-Hit-Rate unbekannt) | Mid | Disclaimer "estimate" + Fußnote. Bei Deep "Deep audits use Claude Sonnet — exact cost depends on repo size." |
| Markup-Disclosure rechtlich unzureichend (DE-AGB) | Strong | Anwaltliche Review nach Sub-Plan-Ship (out-of-scope für Code-Plan, dokumentiert in Master-§11). Pre-Live-Gate. |
| Playwright-E2E flaky wegen Webhook-Lag | Mid | Test-Webhook-Forward via Stripe-CLI in CI mit retry-until-DB-state-converges (10s timeout). |
| Free-Tier-User missversteht Lifetime-Cap | Mid | UI-Tooltip: "3 audits total — no monthly reset. Upgrade for monthly quota." + FAQ-Entry. |
| Pre-Paid-Pack-Buy-Flow bei BYOK-Workspace verwirrend | Weak | BYOK-Workspace zeigt Buy-Pack-Buttons als greyed-out mit Hint. |
| Lighthouse-A11y <95 auf neuen Pages | Mid | axe-core in CI als Pre-Merge-Gate. Tab-Order + Focus-Trap + ARIA-Live-Region für Credit-Meter. |
| DPA-PDF-Render-Bug | Weak | Smoke-Test in CI: PDF-Bytes >0 + valides Magic-Header. |

## 7. Rollout

- **Branch:** `feat/sub-c-ui-compliance`
- **Pre-Merge-Gate:** alle 8 Playwright-E2E grün auf Vercel-Preview + Lighthouse-CI grün + manueller Smoke-Test
- **Post-Merge:** Dev-Server-Auto-Start + Browser-Verifikation der neuen Pages
- **Rollback:** Code-Revert (UI-only, kein DB-Impact). Legal-Pages bleiben verfügbar.

## 8. Out-of-Scope

- Anwaltliche AGB/DPA-Review (out-of-scope, separater Concern, dokumentiert)
- Mehrsprachige Legal-Pages (Phase-1 EN-only mit DE-Übersetzung später)
- Custom-Domain für Customer-Portal (Stripe-default reicht)
- AI-Cost-Dashboard mit Per-Audit-Breakdown (V2)
- Webhook-Failure-Notification-UI (V2 — aktuell nur Logs)

## 9. Open Questions

- Q-C1: `/legal/agb`-Page existiert noch nicht aktuell — Wo aktuell verlinkt? Pre-Execute grep nach `/legal/`-Refs im Code.
- Q-C2: React-Email + Resend-Templates für `PrepaidPackExpireWarning` etc. — vorhandene Email-Setup-Konvention bewahren? Pre-Execute Check `apps/web/src/emails/`.
- Q-C3: TIA-Doku-Format — Markdown reicht oder PDF nötig? Pre-Execute User-Klarstellung.

## 10. Aufwand

~6-8h. PR-Cut: 1 PR (alle Phases atomic).
