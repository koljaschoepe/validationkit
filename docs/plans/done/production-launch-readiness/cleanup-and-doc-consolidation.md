# Plan — Bundle H · Repo-Cleanup + Doc-Konsolidierung

> Master: `production-launch-readiness.md` (Wave 2) · Status: 🔵 Draft
> Slug: `cleanup-and-doc-consolidation` · Confidence: **High** (`_synthesis.md` Dim 4+5, knip-verifiziert)
> User R3: **Aggressiv löschen + konsolidieren, jeder Schritt eigener Commit (git-rückrollbar)**.
> **Reihenfolge: NACH Bundle B** (Credit-Pack-UI-Entscheidung muss erst fallen).

## 1. Ziel

Repo schlank + widerspruchsfrei: toter Code/Deps entfernen, Steuerungs-Docs (CLAUDE.md/changelog) aktualisieren, stale Pläne archivieren. Alles per Git nachvollziehbar, je Cluster ein Commit.

## 2. Sub-Step A — Dead-Code löschen (verifiziert 0 Importer)

`git rm` (eigener Commit „chore: remove dead UI primitives"):
- `components/ui/{avatar,dropdown-menu,popover,scroll-area,alert-dialog,sidebar}.tsx`, `hooks/use-mobile.ts`, `components/landing/GalaxieSettingsPopover.tsx`
- `components/settings/{ApiKeyModal,DangerConfirm}.tsx`, `lib/landing/demo-finding.ts`
- **AUSNAHME:** `components/ui/sheet.tsx` NICHT löschen — wird von Bundle I (Inspector→Radix-Sheet) reaktiviert.
- **NICHT löschen (knip-False-Positives):** `ui/{command,input-group,textarea}.tsx` (UniversalSearch-Chain live), `scripts/{anonymize,check-billing-migration-safety}.ts`, `examples/sample-*`.

Nach Delete: `pnpm install && pnpm typecheck && pnpm --filter @vk/web lint` grün.

## 3. Sub-Step B — Deps entfernen

`apps/web/package.json`: d3-selection, d3-zoom, @types/d3-selection, @types/d3-zoom, gray-matter.
`package.json` (root): lint-staged, @mswjs/data, @eslint/eslintrc, @next/eslint-plugin-next.
→ `pnpm install` + typecheck + lint verifizieren.

## 4. Sub-Step C — Export-Sichtbarkeit (kein File-Delete)

- `health-check.ts`: probe*-Einzelfunktionen un-exportieren (nur `probeAll` bleibt).
- `pr-workflow/src/dispatch.ts:29`: AccessDeniedError-Duplikat-Re-Export entfernen (Original in `access.ts`).
- `galaxie/types.ts`: `LayoutLevel` → lokaler Type. `_exportedForTesting` (token-budget.ts:68): Test ergänzen oder Export weg.

## 5. Sub-Step D — Doc-Updates (commit „docs: sync steering files")

- `.claude/CLAUDE.md:9-11,38`: Aktive Phase Nova-3a → **Production-Launch-Readiness** (Bundle-Status); Cache-Components → „post-launch out-of-scope".
- `docs/changelog.md`: Top-Block „Production-Launch-Readiness 🟡 In Execute" + Bundle-A-Commit-Refs; Nova-3a auf ✅; „Production-Live-Connect"-Backlog-Eintrag streichen.
- `README.md:8,11` + `vision.md:51-67`: Galaxie-Metapher invertieren (**Repo = Sonnensystem/Sonne, Folder = Planet** statt Customer=Sonne); toten `roadmap/phase-galaxie.md`-Link → `roadmap/done/`.
- `architecture.md:101`: Cache-Components als „geplant, 0 Directives" statt „implementiert".
- `schema.ts:74`: PII-Scrub-Kommentar „V2" → „Bundle A Phase 4 ✅, s. pii-scrub.ts".

## 6. Sub-Step E — Plan-/Audit-Archivierung

- `git mv → docs/plans/done/`: `production-live-connect-stub.md` (superseded by C+E).
- Status/Move: `nova-2-live-audit-flow.md` + `nova-2-a11y-deep-sweep.md` → 🔵 Backlog post-launch (oder `done/nova/`); `nova-2-settings-backend.md` erledigte Danger/Sessions/Delete-Sections raus (Bundle A done).
- `git rm` verwaiste 2026-05-Audit-Drafts (nur `01-*..12-*.md` kanonisch): context-files.md, dead-code-apps-web.md, tests-eval-ci.md, adr-vs-code.md, packages-health.md, tech-stack-drift.md, workflow.md. (`settings-backend.md` VORHER prüfen — in nova-2-settings-backend.md zitiert.)

## 7. Out-of-Scope / Risiken

- Credit-Pack-UI: **ENTSCHIEDEN (Bundle B, 2026-06-08) → verdrahten.** `BuyCreditPackModal` ist jetzt auf der Settings-Billing-Page verdrahtet → **NICHT löschen**. `CreditMeter` ist für die Galaxie-HUD reserviert (kommt mit Bundle J Logout-Menü) → **NICHT löschen**. **Korrektur zum Audit:** die 3 `create*`-Funktionen in `billing-actions.ts` (createCheckoutSession/createBillingPortalSession/createPrepaidPackCheckoutSession) sind **NICHT tot** — sie werden von den `*Action`-Wrappern derselben Datei genutzt (Dead-Code-Agent übersah intra-file-Caller). NICHT löschen. **Noch offen für H:** `IntensitySelector` + `cost-estimator` (Audit-Intensity-Kostenschätzung, separat vom Pack-UI) — prüfen ob verwaist, dann löschen oder in die Audit-Form ziehen.
- `lib/galaxie/layout.ts computeLayout` + deprecated Types: **nicht löschen** (live in MiniMap) — Ticket für post-launch MiniMap-Migration.
- Risiko: versehentliches Löschen eines lazy/dynamic-importierten Files → nach jedem Lösch-Commit `pnpm build` (nicht nur typecheck, fängt dynamische Imports).
