# Plan — Frontend & Non-Go-Live Polish

> Erstellt: 2026-06-18 · Status: 🔵 Offen — **alles, was ohne Domain/Geld/externe Accounts machbar ist, aber dein visuelles QA oder eine Produktentscheidung braucht.**
> Slug: `frontend-and-polish`
> Confidence: **High** — aus der 16-Subagent-Plan-Reconciliation (2026-06-18), jeder Punkt code-verifiziert.
> Schwester-Plan (manuell/extern/Geld): `docs/plans/production-go-live.md`.

## 1. Ziel

Die **letzte Code-Schicht** über der Test-Mode-fertigen SaaS — Frontend-Politur, Produkt-Feature-Backends und nicht-launch-blockierende Resilience. Bewusst **nicht** autonom abgearbeitet, weil jeder Block entweder (a) dein visuelles Urteil braucht, (b) eine offene Produktentscheidung hat, oder (c) ein Architektur-Refactor mit Regressions-Risiko ist, das du begleiten willst. **Keine externen Kosten, keine Domain.** Kann jederzeit vor oder nach dem Go-Live laufen.

## 2. Was schon erledigt ist (nicht mehr zu tun)
Auf Branch `launch-prep-execute` autonom erledigt: J5-Refund, B-Resilience (customer-name, deterministic enqueue-id), J6-List-Refresh, AGB-de + OSS + LegalFooter + Subprozessor-Single-Source, 3 Orphan-Deletes, Doc-Sync (Galaxie-Metapher raus). Visual-Overhaul-3-Farben + Galaxie-Retire sind bereits auf `main`.

## 3. Blöcke

### A · Frontend-Visual-Politur (braucht dein Auge) — ex-Bundle D + I
- [ ] **S11 Touch-Targets ≥44px**: `components/ui/button.tsx`/`input.tsx` Mobile-Variante (`h-11 sm:h-8` o.ä.) — visuelles QA über alle Formulare.
- [ ] **S12 Settings-Mobile-Accordion**: `SettingsLayout.tsx:43-44` stapelt nur; `<details>`-Accordion gewünscht? Design-Entscheidung.
- [ ] **I-Kontrast**: `text-white/40 → /58` in `SolarListView.tsx` (Zeilen 255/264/572/645/647) + `Inspector.tsx` (209/390/483/526/551) für WCAG-Lesbarkeit — visuell prüfen.
- [ ] **saas-Bundle-H Billing-Premium-Surface**: `settings/billing/page.tsx` Premium-Politur (Plan-Status, Credit-Stand mit Heat/Trend, transparente Usage-Breakdown, deutsche Quota-/Error-States) gegen die „200 €/Monat"-Erwartung. *(ex `done/saas-premium-overhaul/h-billing-premium-surface.md`)*
- [ ] Feature-Screenshots-Regen (4 Stück, Playwright-Env war blockiert).

### B · Frontend-Code (sicher, aber UX-Politur) — ex-Bundle D
- [ ] **S13** `global-error.tsx:20` `lang="en" → "de"` (DACH).
- [ ] **S14 Toasts** auf `AddCustomerForm`/`AddRepoForm`/`IntensitySelector`-Nachfolger + BYOK/SpendCap/Overage-Settings (aktuell stilles `router.refresh()`).
- [ ] **SessionList** `window.confirm()` → shadcn `AlertDialog`.
- [ ] **S20 Inspector-Focus-Trap**: `galaxie/Inspector.tsx` (`createPortal`, `aria-modal` ohne Containment) → Radix `Sheet` (`components/ui/sheet.tsx` liegt ungenutzt bereit). *(Damit wird `sheet.tsx` wieder genutzt — nicht löschen.)*

### C · Produkt-Feature-Backends (offene Produktentscheidungen!) — ex `nova-2-settings-backend`
> ⚠️ Der Plan hat **4 offene Open-Questions** (§7 im Original) — vor Bau klären. Settings-Stubs sind aktuell aus der Nav versteckt, also **nicht launch-blockierend**. Galaxie-Settings-Teile sind obsolet (Pixi retired).
- [ ] **API-Keys**: `api_key`-Tabelle + create/list/revoke-Routes + Bearer-Middleware + Modal. *(large)*
- [ ] **Outbound-Webhooks**: `webhook`-Tabelle + CRUD + Test-Ping + `webhook-deliver`-Inngest-Job (HMAC). *(large)*
- [ ] **Notification-Preferences**: `notification_preference`-Tabelle + GET/PUT + `NotificationMatrix`-Save-Wiring. *(large)*
- [ ] **Workspace-General-Settings** (name/slug-rename mit Redirect-Schutz/logo/timezone) + **Audit&Apply-Settings** (`applySettings` JSONB) + **Account-Profile** (name/avatar/locale) + **Ownership-Transfer**.

### D · Non-Go-Live-Backend-Resilience & Architektur — ex-Bundle B/J/G
- [ ] **J1 GitHub-Background-Audit**: großer GitHub-Repo läuft aktuell immer Foreground (Timeout-Risiko). Sauber = `github-fetch` in ein Shared-Package ziehen, damit der Inngest-Worker den Zipball selbst re-fetchen kann + Threshold-Routing. **Architektur-Refactor — bewusst nicht blind autonom.**
- [ ] **J4 `requestSolution` async**: läuft synchron blockierend (`solution-dal.ts:257`) → pending-Row + Inngest, oder ehrlich-blockierend mit Timeout-Guard.
- [ ] **B-Phase-6 Inngest-Resilience**: `onFailure`-Handler auf den 5 Functions (aktuell 0).
- [ ] **Email-de-Copy + neue Templates** (ohne Domain machbar): Template-Bodies de-DE übersetzen + `de-DE`-Datums-Helper (aktuell `en-US` in `PlanChangeConfirmation`/`PrepaidPackExpireWarning`); optional `InvoicePaidReceipt` (nur falls Stripe-native Belege nicht reichen — siehe Go-Live §3 G4) + `CreditLowWarning`-Cron + 30/7-Tage-Pack-Warn-Stufen. *(Marken-Voice → dein Review.)*

### E · Test-/Tooling-Harness (Code) — ex `nova-2-a11y-deep-sweep` + A
- [ ] **axe-core Playwright-Harness**: `@axe-core/playwright` + `playwright.config.ts` + `tests/a11y/critical-routes.spec.ts` + `pnpm a11y`-CI-Gate. *(Wertvoll für Procurement-Audits.)*
- [ ] **Saved-Views / URL-State** für die Konsole (`SolarListView` hält Group-by/Filter nur in lokalem `useState`) — teilbare/deep-linkbare Triage-Filter. *(ex saas-Bundle-G)*
- [ ] Optional: Phase-5 IDOR-Negative-Tests (User hat Tests bisher abgelehnt) · `vitest` 3→4-Bump (CVE, kann Suite brechen — vorsichtig).
- [ ] Trivial-Export-Hygiene: `probe*`/`AccessDeniedError`/`LayoutLevel`/`_exportedForTesting` un-exporten (rein kosmetisch).

## 4. Bewusst NICHT in diesem Plan (obsolet/verworfen)
- Galaxie-Legibility-Mechanik (Pixi retired — 80 % des alten `galaxie-legibility-rework`-Plans tot).
- `gray-matter` entfernen (alter Cleanup-Plan-Irrtum — `gray-matter` ist live im Parser).
- `sheet.tsx` löschen (alter Cleanup-Plan-Irrtum — wird für Block-B Inspector-Focus-Trap gebraucht).
- K16 Inngest-Local-Path-Reject (Intake ist GitHub-URL-getrieben — geringes Realrisiko).
- S34 MarketingNav / S36 /status-Caching (Ziel bereits via Nova-3a / `'use cache'`-post-launch erreicht).
- B2C-Cookie-Banner (DACH-B2B, 0 Analytics-SDK).

## 5. Reihenfolge-Empfehlung
B (schnelle UX-Wins) → A (Visual mit deinem QA) → E (Harness) → D (Resilience) → C (Feature-Backends, nach Klärung der Open-Questions). Jeder Block eigener Commit; nichts hiervon blockiert den Go-Live.
