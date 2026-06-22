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
- [x] **S11 Touch-Targets ≥44px** (2026-06-22): `button.tsx` default `h-11 sm:h-8` + icon `size-11 sm:size-8`, `input.tsx` `h-11 sm:h-8`. Dichte `sm/xs/lg`-Varianten + Konsolen-Rows (eigenes `min-h-44`) bewusst unberührt. Mobile 44px, Desktop unverändert 32px.
- [x] **S12 Settings-Mobile-Accordion** (2026-06-22): **Entscheidung = stacked beibehalten** (kein Accordion). Wenige Sektionen lesen sich als vertikale Liste übersichtlich; `<details>` fügt nur Klick-Reibung ohne Platzgewinn hinzu. → §4 (bewusst verworfen).
- [x] **I-Kontrast** (2026-06-22): `text-white/40 → /58` in `SolarListView.tsx` (alle 5 Vorkommen) + `Inspector.tsx` (6 inkl. Empty-State Z.562) für WCAG-Lesbarkeit.
- [x] **saas-Bundle-H Billing-Premium-Surface** (2026-06-22): `[workspace]/settings/billing/page.tsx` neu — Premium-Plan-Status-Header (Tier als Headline + Status-Pill), Credit-Stand mit Heat-Färbung (3-Farben-System) + transparente 3-Spalten-Usage-Breakdown (Verbraucht/Kontingent/Prepaid), komplette deutsche Copy inkl. Quota-/Error-States. *(ex `done/saas-premium-overhaul/h-billing-premium-surface.md`)*
- [ ] Feature-Screenshots-Regen (4 Stück) — **deferred: Playwright-MCP in dieser Env tot (Calls timeouten)**. Bleibt offen bis lauffähiges Playwright-Env.

### B · Frontend-Code (sicher, aber UX-Politur) — ex-Bundle D
- [x] **S13** (2026-06-22): `global-error.tsx` `lang="de"` + komplette deutsche Copy (DACH).
- [x] **S14 Toasts (Client-Forms)** (2026-06-22): `AddCustomerForm` + `AddRepoForm` mit `toast.success`/`toast.error` (deutsch) statt stillem `router.refresh()`. **IntensitySelector existiert nicht mehr** (gelöscht). BYOK/SpendCap/Overage/Intensity sind **Server-Action-Forms** (kein `router.refresh()`) → eigener Sub-Schritt **S14b** (Client-Wrapper-Refactor, siehe unten).
- [ ] **S14b AI-Settings-Toasts**: `settings/ai/page.tsx` 4 Server-Action-Forms (BYOK/SpendCap/Overage/Intensity) brauchen Client-Wrapper (`useActionState`/onClick) für Toast-Feedback. *(scope-expansion, vom Quick-Win-Pass getrennt)*
- [x] **SessionList** (2026-06-22): `window.confirm()` → shadcn `AlertDialog` (neue `components/ui/alert-dialog.tsx`, unified-`radix-ui`-Stil wie `sheet.tsx`), deutsche Copy.
- [ ] **S20 Inspector-Focus-Trap**: `galaxie/Inspector.tsx` (`createPortal`, `aria-modal` ohne Containment) → Radix `Sheet` (`components/ui/sheet.tsx` liegt ungenutzt bereit). *(Damit wird `sheet.tsx` wieder genutzt — nicht löschen.)* **669-Zeilen-Konsolen-Refactor — schwerer als die übrigen B-Items.**

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
