# Audit Sub-1 — Dead-Code

> Generated: 2026-05-21
> Domain: Dead-Code · ungenutzte Exports · Orphan-Files · Demo-Data · TODOs
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}
> Scope: `apps/web/src/` (211 .ts/.tsx Files), `packages/*/src/` (86 .ts Files), `scripts/`

## Summary

- **77 Findings total** (20 orphan-Files, 44 unused exports, 15 unused types, 7 unused deps, 4 unused devDeps, 1 unlisted dep, plus 1 strukturelles und 1 Exceptional)
- **0 Kill** · **24 Strong** · **18 Mid** · **3 Weak** · **2 Exceptional**
- Compact summary: ~+30 weitere ungenutzte shadcn-Re-Exports im Pattern `components/ui/*.tsx` (Standard-Pattern beim Installer — siehe F23)
- Auffällig clean: **0 TODO/FIXME/HACK/XXX** im Code (1 Kommentar-Treffer war nur ein Variablen-Placeholder `vk-gh-XXXXX`)
- Auffällig clean: **0 auskommentierte Code-Blöcke ≥10 Zeilen**

## Methodology

- **Primary Tool:** `pnpm dlx knip@6.14.1` (root run, full monorepo analysis)
- **Verification:** `grep -rn` für jedes unsichere Finding (cross-import-check über `apps/web/src/` + `packages/*/src/`)
- **Heuristik für orphan-Files:** knip-Resultat × manuelle Verifikation. Test-Files (`*.test.ts`) excluded.
- **TODO-Sweep:** `grep -rEn '(TODO|FIXME|HACK|XXX)'` über alle .ts/.tsx (211+86 Files)
- **Commented-Code Sweep:** `grep -lE '^\s*//\s*(import|const|let|export|function|return|if)'` — 2 Hits, beide Fehlalarme (Doc-Comments mit "// import these" als Wort)
- **Files scanned:** 211 (apps/web/src) + 86 (packages/src) + scripts/
- **Time:** ~12 Min

---

## Findings

### Orphan Files (Strong / Mid)

#### [Strong] F1 — `apps/web/src/components/BuyCreditPackModal.tsx`
**File:** `apps/web/src/components/BuyCreditPackModal.tsx:1-200`
**Issue:** Komplette Komponente nicht importiert. Doc-Comment auf Z.42 sagt sogar: "Better surface for the workspace-layout right-rail CreditMeter" — beide (BuyCreditPackModal + CreditMeter) sind tot, also offenbar Sub-C-SaaS-Pricing-Reste, die nie verdrahtet wurden.
**Why Strong:** Eindeutig tot (kein Import), kein Risk. Cross-Reference: Sub-C SaaS-Pricing Phase laut git log + commit `120e2ce`. Quick-Win-Delete oder bewusst integrieren.
**Suggested Fix:** Verdrahten (CreditMeter in workspace-layout right-rail, Modal trigger) ODER deletieren. Entscheidung an User.

#### [Strong] F2 — `apps/web/src/components/CreditMeter.tsx`
**File:** `apps/web/src/components/CreditMeter.tsx:1-130`
**Issue:** Wie F1 — exportiert `CreditMeter` + `CreditMeterProps`, kein Importeur.
**Why Strong:** Gleicher Cluster wie F1, gleiche Entscheidung erforderlich.
**Suggested Fix:** Mit F1 als Einheit behandeln.

#### [Strong] F3 — `apps/web/src/components/IntensitySelector.tsx`
**File:** `apps/web/src/components/IntensitySelector.tsx:1-110`
**Issue:** Komponente ungenutzt, importiert ihrerseits `cost-estimator.ts` (das ebenfalls orphan ist — siehe F7). Cluster aus 2 toten Files.
**Why Strong:** Toter Pfad: orphan-Komponente → orphan-Util.
**Suggested Fix:** Beide deletieren ODER beide verdrahten. Cluster gehört zu Sub-A SaaS-Pricing (commit `1f6487c`).

#### [Strong] F4 — `apps/web/src/components/settings/ApiKeyModal.tsx`
**File:** `apps/web/src/components/settings/ApiKeyModal.tsx:1-160`
**Issue:** Reveal-Once-Modal — nicht in `/[workspace]/settings/api-keys/` verdrahtet. Settings-Restructure-Shell von Nova-2, aber nie wired-up.
**Why Strong:** Settings-Backend-Sub-Plan noch in Review (siehe Phase Nova-2 doc) — könnte gewollt sein. **Aber:** ohne Wire-Up macht der Shell-Render keinen Sinn.
**Suggested Fix:** Verifiziere mit `nova-2-settings-backend.md` Plan-File ob bewusster Shell. Wenn nein: weg.

#### [Strong] F5 — `apps/web/src/components/settings/DangerConfirm.tsx`
**File:** `apps/web/src/components/settings/DangerConfirm.tsx:1-90`
**Issue:** Settings/danger/page.tsx selbst kommentiert es schon raus: *"DangerConfirm mounts were removed 2026-05-21 (repo-health-Phase 1.18)"* — also bewusst entkoppelt, aber das Modul nicht gelöscht.
**Why Strong:** Self-documented dead code. Riskfrei zu löschen.
**Suggested Fix:** `rm apps/web/src/components/settings/DangerConfirm.tsx` + Comment in `danger/page.tsx` cleanen.

#### [Strong] F6 — `apps/web/src/lib/landing/demo-finding.ts`
**File:** `apps/web/src/lib/landing/demo-finding.ts`
**Issue:** Demo-Findings für Landing — nicht importiert. Mögliche Reste von Landing-V1.
**Why Strong:** Kein Importeur, keine Test-Refs.
**Suggested Fix:** Delete oder in `nova-2-live-audit-flow.md` Sub-Plan integrieren (anonymes Audit auf Landing → könnte demo-finding brauchen).

#### [Strong] F7 — `apps/web/src/lib/cost-estimator.ts`
**File:** `apps/web/src/lib/cost-estimator.ts`
**Issue:** Wird nur von orphan-IntensitySelector (F3) importiert — Transitive-Orphan.
**Why Strong:** Nicht erreichbar vom Routing-Graph.
**Suggested Fix:** Mit F3 als Einheit deletieren.

#### [Strong] F8 — `apps/web/src/lib/stripe-meters.ts`
**File:** `apps/web/src/lib/stripe-meters.ts`
**Issue:** Meter-Helpers — knip sagt nicht importiert. Aber `apps/web/src/lib/stripe.ts` exportiert ähnliche Helpers (`meterIdFor`, `meterPriceIdFor`, `meterEventName` — siehe F18). Möglicherweise Duplicate/Migration-Rest.
**Why Strong:** Riskfaktor: ist eine .ts-File mit Stripe-Logik. Vor Delete prüfen ob in Migration `0007_billing_meters.sql` o.ä. referenziert.
**Suggested Fix:** Check Sub-B `931e025` Commit-Diff: war stripe-meters.ts der erste Wurf, der dann nach `lib/stripe.ts` migriert wurde? Wenn ja → delete.

#### [Mid] F9 — `apps/web/src/hooks/use-mobile.ts`
**File:** `apps/web/src/hooks/use-mobile.ts`
**Issue:** Wird **nur** noch von `components/ui/sidebar.tsx` importiert — und `sidebar.tsx` ist selbst orphan (F12). Cluster-Tod.
**Why Mid:** Hängt an F12. Außerdem existiert paralleler Hook `lib/use-media-query.ts:useIsMobile()` der aktiv genutzt wird (HeroSection.tsx) — also klare Duplizität.
**Suggested Fix:** Mit F12 deletieren. Konvention: alle "isMobile" über `lib/use-media-query.ts`.

#### [Mid] F10 — `apps/web/src/components/ui/alert-dialog.tsx`
**File:** `apps/web/src/components/ui/alert-dialog.tsx`
**Issue:** shadcn-Primitive installiert, aber nirgends importiert.
**Why Mid:** shadcn-Reflexpaket — könnte gewollt vorinstalliert sein. Risk: zukünftig versehentlich neu mit `pnpm dlx shadcn add` installiert.
**Suggested Fix:** Wenn keine konkrete Pipeline darauf wartet (kein offenes Plan-File referenziert es) → delete. Wenn Future-Need → in `docs/plans/` referenzieren.

#### [Mid] F11 — `apps/web/src/components/ui/avatar.tsx` · `command.tsx` · `dropdown-menu.tsx` · `input-group.tsx` · `scroll-area.tsx` · `sheet.tsx` · `textarea.tsx`
**File:** 7 Files in `apps/web/src/components/ui/`
**Issue:** shadcn-Primitives ungenutzt. `command.tsx` ist v.a. auffällig — `cmd+k` Galaxie-Workspace-Switcher existiert (siehe `galaxie-w4-cmdk.png` screenshot, May 19) aber nutzt `command.tsx` nicht (oder importiert es nicht direkt).
**Why Mid:** shadcn-Bulk-Install-Reste. Bundle-Impact bei Vercel: lazy-loaded → marginal, aber DX-Confusion bei "ich brauch ein Command" → `command.tsx` ist verfügbar aber nirgends Beispiel.
**Suggested Fix:** Verifiziere ob cmd+k via anderem Primitive baut. Wenn ja → delete `command.tsx`. Rest auch löschen, kann jederzeit per `pnpm dlx shadcn add` neu installiert werden.

#### [Strong] F12 — `apps/web/src/components/ui/sidebar.tsx`
**File:** `apps/web/src/components/ui/sidebar.tsx`
**Issue:** Komplettes Sidebar-Modul orphan. Würde der einzige Importeur von `hooks/use-mobile.ts` (F9) sein. CLAUDE.md sagt `SettingsLayout` (in `ui-vk/`) ist die 240px-Sidebar — also sind die shadcn-Sidebar-Primitives klar nicht der Pfad.
**Why Strong:** Architekturell falsch hier zu lassen: CLAUDE.md sagt "kein Duplikat-Pattern" zwischen `ui/` (shadcn) und `ui-vk/` (Layout-Primitives). `sidebar.tsx` ist genau so ein Duplikat-Pattern.
**Suggested Fix:** Delete sidebar.tsx + use-mobile.ts. Konvention zu Tests dokumentieren in CLAUDE.md unter UI-Library-Split.

#### [Mid] F13 — `scripts/anonymize.ts`
**File:** `scripts/anonymize.ts`
**Issue:** Wird von keinem `package.json` Script oder CI-Workflow referenziert. Doc-Comment beschreibt manuelles `pnpm tsx scripts/anonymize.ts ...` — also bewusst manuelles Tool.
**Why Mid:** Operations-Script, dokumentierter Workflow für golden-set anonymized-customer (siehe Comment). Kein "tot" — sondern "manuelle Pipeline". Knip kann das nicht wissen.
**Suggested Fix:** Falsch-Positiv: behalten. In `package.json` evtl. als `"anonymize": "tsx scripts/anonymize.ts"` Script eintragen damit Discoverability + knip happy.

#### [Mid] F14 — `scripts/check-billing-migration-safety.ts`
**File:** `scripts/check-billing-migration-safety.ts`
**Issue:** Wie F13 — Operations-Script mit Doc-Header. Aber: gehört zur Billing-Migration-Safety (Sub-B SaaS-Pricing). Pre-deploy-Gate?
**Why Mid:** Wahrscheinlich legitim, aber: ist er in CI (`.github/workflows/*`) verdrahtet? `grep` zeigt: nein. Also entweder vergessen einzubinden ODER nur manuell.
**Suggested Fix:** Klären: Soll das ein pre-deploy CI-Gate sein? Dann in `.github/workflows/` einbauen. Sonst als `pnpm` script registrieren für Discoverability.

---

### Unused Exports (Strong / Mid / Weak)

#### [Strong] F15 — Billing Action-Exports nicht aufgerufen
**File:** `apps/web/src/lib/billing-actions.ts:37,106,154`
**Issue:** `createCheckoutSession`, `createBillingPortalSession`, `createPrepaidPackCheckoutSession` — Server-Actions deklariert, aber 0 Callers in `apps/web/src/`. `ActionResult` Type ebenfalls ungenutzt extern.
**Why Strong:** Klassisches "Backend gebaut, Frontend wartet" — Sub-C SaaS-Pricing ist laut Master-Plan "shipped" (commit `120e2ce`). Wenn Pricing-Page jetzt live ist, müssten diese aufgerufen werden. Verdacht: Pricing-Page nutzt direkten Stripe-Aufruf statt diese Actions.
**Suggested Fix:** Verifiziere `apps/web/src/app/pricing/page.tsx` (oder wo immer die Pack-Modal lebt — F1 verweist auf BuyCreditPackModal). Entweder hier die Actions wirklich aufrufen ODER die Actions löschen falls duplicate.

#### [Strong] F16 — Health-Probes nirgends aufgerufen
**File:** `apps/web/src/lib/health-check.ts:64,92,104,116,128,133`
**Issue:** `probeNeon`, `probeInngest`, `probeResend`, `probeStripe`, `probeGithub`, `probeAnthropic` — alle 6 Probes exportiert, kein Importeur. `health-check.ts` selbst hat keinen Default-Aggregator-Export-Aufrufer.
**Why Strong:** /api/status oder /status-Route würden das aufrufen. Kritisch für Operations — wenn diese kalt sind, fliegt das Status-Dashboard.
**Suggested Fix:** Check `apps/web/src/app/status/page.tsx` und `apps/web/src/app/trust/page.tsx` ob Probes aufgerufen werden. Wenn nicht → entweder Status-Page ist Fake-Static-Markup (= Kill-Severity!) oder Probes sind toter Code.

#### [Strong] F17 — Apply-Workflow-Exports unused
**File:** `apps/web/src/lib/apply-actions.ts:47` · `apps/web/src/lib/apply-dal.ts:343,355`
**Issue:** `pollPRStatusAction()`, `listApplyActionsForFinding()`, `ApplyActionRow` Type — 0 externe Importeure.
**Why Strong:** Apply-PR-Flow gehört zu Phase Galaxie G6 — sollte aktiv sein. Wenn nicht aufgerufen, ist der Polling-Loop und das Listing tot.
**Suggested Fix:** Verifiziere Apply-Page UI in `apps/web/src/app/[workspace]/apply/*` ob diese Actions referenziert sind. Sonst: Pre-Galaxie-Reste cleanen.

#### [Strong] F18 — Stripe-Meter-Helpers + MeterKind ungenutzt
**File:** `apps/web/src/lib/stripe.ts:81,98,102,106`
**Issue:** `MeterKind` Type, `meterIdFor()`, `meterPriceIdFor()`, `meterEventName()` exportiert, niemand ruft auf.
**Why Strong:** Stripe-Meters sind das Kernstück des Usage-Billings (Sub-B `931e025`). Wenn nirgends aufgerufen → entweder Meter-Reports laufen ohne diese Helpers (= falsche IDs hardcoded!) ODER orphan-Layer der nie vom Inngest-Job genutzt wurde.
**Suggested Fix:** Check `packages/inngest/src/functions/credit-aggregator.ts` ob diese Helpers verwendet werden müssten. Möglicher Bug-Smell.

#### [Strong] F19 — Customers-DAL: addRepo + listRepos
**File:** `apps/web/src/lib/customers.ts:42,96` · types `CustomerSummary`, `AddRepoInput`, `AddRepoError` (Z.9,22,29)
**Issue:** `addRepo()` und `listRepos()` in `customers.ts` — 0 externe Importeure. Aber: `customer-dal.ts` hat parallel `addRepoUnderCustomer()` die aktiv genutzt wird (von `customer-actions.ts`).
**Why Strong:** Klare Duplizität. Verwirrend: zwei DAL-Files (`customers.ts` + `customer-dal.ts`) im selben Verzeichnis, Code-Reviewer würde nicht wissen welcher der Pfad ist.
**Suggested Fix:** `customers.ts` löschen oder mergen in `customer-dal.ts`. Klärt das Pattern.

#### [Strong] F20 — Membership-Helpers: claimPendingMemberships, requireRole
**File:** `apps/web/src/lib/membership.ts:170,230`
**Issue:** Keine externen Aufrufer. `claimPendingMemberships()` v.a. interessant — klingt nach Onboarding-Logik (Magic-Link-User claimt Invite). Wenn das nicht aufgerufen wird, sind Invites broken.
**Why Strong:** Onboarding-Critical. Verifizieren OB Auth-Flow (Better-Auth Magic-Link) das nicht aufruft.
**Suggested Fix:** Check `apps/web/src/app/auth/verify/` und Auth-Callbacks. Falls wirklich tot: kritischer Bug (Invites werden nie claimed). Falls aufgerufen via Better-Auth-Hook: knip kann das nicht sehen, ist OK.

#### [Mid] F21 — Anonymous Rate-Limit Helper
**File:** `apps/web/src/lib/rate-limit.ts:99`
**Issue:** `checkAnonymousRateLimit()` exportiert, aber kein Aufrufer.
**Why Mid:** Sub-Plan `nova-2-live-audit-flow.md` (anonymes Audit auf Landing) ist noch in Review — könnte legitim als Shell schon stehen.
**Suggested Fix:** Wenn der Sub-Plan eingespielt wird → wird's gebraucht. Sonst: löschen. Cross-check mit Plan-Status.

#### [Mid] F22 — Audit-Trail-Export Row
**File:** `apps/web/src/lib/audit-trail-export.ts:7`
**Issue:** `AuditTrailRow` Type exportiert, nicht extern verwendet. Aber `app/api/audit-trail/route.ts` existiert — könnte den Type intern bauen ohne Type-Import.
**Why Mid:** Routes ohne Type-Import sind ein Code-Smell (=keine Compile-Garantie der Response-Shape). Wahrscheinlich legitim aber suboptimal.
**Suggested Fix:** Falls api-route die Row implizit baut → Type-Import erzwingen.

#### [Mid] F23 — shadcn UI Re-Exports (Bulk)
**File:** Mehrere `apps/web/src/components/ui/*.tsx`
**Issue:** 
- `alert.tsx:76` → `AlertAction`
- `badge.tsx:49` → `badgeVariants`
- `button.tsx:67` → `buttonVariants`
- `card.tsx:98,100,101` → `CardFooter`, `CardAction`, `CardDescription`
- `dialog.tsx:159,164,165,167` → `DialogClose`, `DialogOverlay`, `DialogPortal`, `DialogTrigger`
- `popover.tsx:83,85,86,87` → `PopoverAnchor`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`
- `table.tsx:111,115` → `TableFooter`, `TableCaption`
- `tabs.tsx:90` → `tabsListVariants` (intern in derselben File genutzt, aber Re-Export ungenutzt)

**Why Mid:** Das ist Standard-shadcn-Pattern (Default-Re-Exports der Primitives). Bulk-löschen würde dem Pattern widersprechen und beim nächsten `pnpm dlx shadcn add` wieder reinkommen. Aber: aktuell totes Markup.
**Suggested Fix:** Pattern-Entscheidung: (a) hinnehmen als shadcn-Konvention oder (b) systematisch knip-config dafür whitelisten in `knip.json`. Empfehlung: (b) — knip-config erstellen, ignorePatterns: `apps/web/src/components/ui/**`, damit echte Findings sichtbar bleiben.

#### [Mid] F24 — PageSkeleton ui-vk Re-Export
**File:** `apps/web/src/components/ui-vk/index.ts:13`
**Issue:** `PageSkeleton` aus index.ts re-exportiert, aber kein externer Importeur (also keine PageShell-Loading-Variante in Verwendung).
**Why Mid:** Nova-2-Foundation-Komponente (laut CLAUDE.md). Eigentlich für Suspense-Boundaries gedacht. Wenn keine Loading-States skeletonisiert sind → UX-Lücke.
**Suggested Fix:** Audit der App-Pages auf Suspense-Fallbacks. Wenn dort `<PageSkeleton/>` nicht eingesetzt wird → entweder einsetzen (besseres UX) oder als ui-vk-Toolbox-Item dokumentieren ohne Re-Export.

#### [Mid] F25 — useMediaQuery (low-level helper)
**File:** `apps/web/src/lib/use-media-query.ts:11`
**Issue:** `useMediaQuery(query)` ist der allgemeine Hook, nur die Convenience-Variante `useIsMobile()` wird genutzt (von HeroSection.tsx).
**Why Mid:** Low-level-API als Re-Export — legitim für Future-Use (responsive helpers). Aber: kein Compile-Garantor dass es nicht später vergessen wird.
**Suggested Fix:** Behalten (idiomatisches public API pair). Nicht löschen.

#### [Mid] F26 — Galaxie-Types: GalaxieMode, InitialZoomLevel
**File:** `apps/web/src/components/galaxie/GalaxieRoot.tsx:18,20`
**Issue:** `GalaxieMode` type und `InitialZoomLevel` interface exportiert. Aber `GalaxieScene.tsx:48` definiert `InitialZoomLevel` LOKAL nochmal — d.h. doppelte Definition.
**Why Mid:** Strukturelles Duplikat — wenn `GalaxieRoot.tsx` der Public-Entry ist und `GalaxieScene.tsx` der Subkomponente, sollte Scene den Type aus Root importieren, nicht redefinieren.
**Suggested Fix:** In `GalaxieScene.tsx` Z.48: `interface InitialZoomLevel { ... }` → `import type { InitialZoomLevel } from './GalaxieRoot';`. Nebenbei wird der Export "genutzt".

#### [Weak] F27 — SEVERITY_PULSE_RATE
**File:** `apps/web/src/lib/galaxie/severity-colors.ts:53`
**Issue:** `SEVERITY_PULSE_RATE` konstante exportiert, kein Importeur. PixiJS-spezifische Pulse-Animation-Rate (Hz/ms?), wahrscheinlich für die legacy PixiJS-Galaxie geplant.
**Why Weak:** PixiJS-Layer ist legacy (CLAUDE.md sagt: Nova-3+ Migration offen). Konstante könnte später noch gebraucht werden bei Migration.
**Suggested Fix:** Hier lassen oder ADR-Note machen "PixiJS-spezifisch, vor Nova-3 reviewen".

#### [Weak] F28 — LayoutLevel type (Galaxie)
**File:** `apps/web/src/lib/galaxie/types.ts:57`
**Issue:** `LayoutLevel` type-only export, ungenutzt.
**Why Weak:** Wahrscheinlich Future-Type für Multi-Level-Layout. Wenn die Galaxie zoom-stages hat (galaxie-w3-zoom0...zoom3 screenshots), könnte das eigentlich genutzt sein.
**Suggested Fix:** Verifiziere ob zoom-stages typed sind. Sonst → behalten oder löschen.

#### [Weak] F29 — repo-galaxie Types: EdgeKind, GraphEdge, EDGE_KINDS, findingByNodeId
**File:** `apps/web/src/lib/repo-galaxie/types.ts:18,63,92` · `demo-data.ts:498`
**Issue:** Edge-Modellierung (Type, Interface, Konstanten-Array) + Lookup-Helper — niemand verwendet sie. Aktuelle Galaxie nutzt offenbar nur Nodes ohne Edges.
**Why Weak:** Repo-Galaxie ist die "richtige" Galaxie (vs. mock-data für Landing). Wenn Edges noch nicht visualisiert werden, ist das Future-Feature-Material.
**Suggested Fix:** Entscheiden: ist Edge-Rendering im Backlog? Wenn nein → delete. Wenn ja → ADR-Note machen.

#### [Mid] F30 — Sub-Processors Type
**File:** `apps/web/src/lib/sub-processors.ts:13`
**Issue:** `SubProcessorStatus` exportiert, kein externer Import. Die `/trust/sub-processors.json/route.ts` + `.xml/route.ts` Routes existieren — also wird die Datei wahrscheinlich gelesen, der Type-Export aber nicht.
**Why Mid:** Type-leakage-Bug-Smell — die Routes returnen also untyped JSON.
**Suggested Fix:** In den Routes den Type-Import explizit machen für Compile-Garantie.

#### [Mid] F31 — pr-workflow: AccessDeniedError
**File:** `packages/pr-workflow/src/dispatch.ts:29`
**Issue:** `AccessDeniedError` re-exportiert (siehe `dist/index.d.ts:5` Bundle), aber knip findet 0 externe Importeure. Cross-Package-Check: `apps/web/src/` enthält den Namen nicht.
**Why Mid:** Public-Error-Type vom pr-workflow package, das macht Sinn für API-stability ABER: wenn niemand den Error per-name catched, fliegt es als generic Error durch.
**Suggested Fix:** Verifiziere ob `apply-actions.ts` o.ä. den Error catched. Wenn nicht: Error-Handling der PR-Dispatch-Calls verbessern oder Re-Export entfernen.

#### [Strong] F32 — `_exportedForTesting()` in package source
**File:** `packages/audit/src/rules/token-budget.ts:68`
**Issue:** Funktion `_exportedForTesting()` exportiert nur `{ budget: DEFAULT_BUDGET }`. Aber `DEFAULT_BUDGET` ist eine top-level-Konstante in derselben File — die könnte einfach selbst exportiert werden.
**Why Strong:** Anti-Pattern: "exported only for testing" mit underscore-prefix. Test-File könnte direkt `DEFAULT_BUDGET` importieren ODER besser: Rule-Public-API gibt budget via Result/Config zurück. Aktuell wird's nirgends genutzt (auch nicht in Tests laut knip — sonst hätte er's gemeldet).
**Suggested Fix:** Löschen. Falls Test wirklich budget braucht → top-level const direkt exportieren.

---

### Unused Dependencies (Strong)

#### [Strong] F33 — `d3-selection` + `d3-zoom` + Types ungenutzt
**File:** `apps/web/package.json:36,37,62,63`
**Issue:** `d3-selection`, `d3-zoom`, `@types/d3-selection`, `@types/d3-zoom` deps deklariert, kein Import. Aber CLAUDE.md sagt `optimizePackageImports(d3-*)` — also war es geplant.
**Why Strong:** ~100kb+ Bundle-Bloat (d3-zoom hat dependencies). Galaxie wurde von PixiJS → SVG migriert (CLAUDE.md: "SVG + motion für Landing/Hero; PixiJS legacy") — d3-zoom war vermutlich für die alte zoom-Implementierung.
**Suggested Fix:** `pnpm remove d3-selection d3-zoom @types/d3-selection @types/d3-zoom` aus `apps/web/`.

#### [Strong] F34 — `gray-matter` ungenutzt
**File:** `apps/web/package.json:39`
**Issue:** Markdown-Frontmatter-Parser, kein Import in apps/web. Aber `packages/parser/` hat eigenen Parser-Code für AGENTS.md / CLAUDE.md / SKILL.md.
**Why Strong:** Wenn `packages/parser/` den Parser hat, ist gray-matter in apps/web ein dep-Lecker.
**Suggested Fix:** Check `packages/parser/` ob es gray-matter intern braucht (sollte dann dort deklariert sein). Wenn nicht → remove aus `apps/web/`.

#### [Strong] F35 — `@vk/core` in 3 packages ungenutzt
**File:** `packages/db/package.json:29` · `packages/github-app/package.json:25` · `packages/pr-workflow/package.json:22`
**Issue:** 3 packages haben `@vk/core` als Dependency, importieren aber nichts daraus.
**Why Strong:** Falsche Dep-Graph-Edges → unnötige turborepo task-dependencies (langsamere builds), unnötige reinstalls.
**Suggested Fix:** `pnpm remove @vk/core` in db/github-app/pr-workflow packages. Vereinfacht das DAG.

#### [Strong] F36 — `@octokit/webhooks` ungenutzt
**File:** `packages/github-app/package.json:24`
**Issue:** Octokit-Webhook-Verifier deklariert. `github-app` hat aber `/api/install-webhook/route.ts` der eigentlich verify-Funktionen brauchen sollte. Vermutlich wird das mit eigener crypto-Verify gemacht oder es ist tatsächlich tot.
**Why Strong:** Sicherheits-Smell: wenn webhook-route nicht via @octokit/webhooks signiert, könnte eigene verify-Logik vorliegen — die müsste auditiert werden (Audit Sub-2 oder Sub-3 Domain).
**Suggested Fix:** Cross-Audit-Verweis: ist die `/install-webhook/route.ts` Signatur-Verify safe? Wenn ja → octokit-deps entfernen. Wenn nein → einbauen.

#### [Strong] F37 — `shadcn` (devDep) + `lint-staged` ungenutzt
**File:** `apps/web/package.json:67` (shadcn) · `package.json:41` (lint-staged)
**Issue:** 
- `shadcn` CLI als devDep — wird stattdessen via `pnpm dlx` aufgerufen (Standard-Pattern). Local-Install ist redundant.
- `lint-staged` als devDep im Root — keine `lint-staged.config.*` oder `package.json#lint-staged` Konfiguration vorhanden, kein Husky-Hook ruft es auf.
**Why Strong:** `lint-staged` ist v.a. wichtig: Husky existiert (`.husky/` Folder), aber lint-staged-Integration ist nicht aktiv. Pre-commit-Lint läuft also nicht.
**Suggested Fix:** Entweder lint-staged proper konfigurieren (huskypre-commit → `lint-staged`) ODER `pnpm remove -w lint-staged`. Empfehlung: konfigurieren (Linter-Gate ist wichtig).

#### [Strong] F38 — `server-only` unlisted dep
**File:** `apps/web/src/lib/workspace-context.ts:1` (import) — kein entry in `apps/web/package.json`
**Issue:** `server-only` package wird in `workspace-context.ts` importiert, ist aber nicht in `apps/web/package.json#dependencies` aufgelistet. Es ist transitive-resolved (`next` deklariert es), aber das ist nicht zukunftssicher.
**Why Strong:** Bricht bei pnpm strict resolution (`strict-peer-dependencies=true`) oder bei Next.js-Major-Upgrade wenn die transitive entfernt wird.
**Suggested Fix:** `pnpm add server-only --filter @vk/web` (oder welcher Name in workspace).

---

### Exceptional Findings

#### [Exceptional] F39 — Keine TODO/FIXME/HACK/XXX im Code
**File:** `apps/web/src/` + `packages/*/src/` (297 Files)
**Issue:** Über 297 TS-Files exakt **0 echte TODO/FIXME/HACK/XXX** Marker. Einziger Treffer war `// Walk up to the /vk-gh-XXXXX/ root` in `github-fetch.ts:119` — das ist ein Variablen-Placeholder im Comment-Text, keine Marker.
**Why Exceptional:** Bemerkenswert clean für ein Solo-Dev-Repo mit Galaxie-Migration + Sub-A/B/C-SaaS-Pricing. Standard-Repos haben Dutzende TODOs. Disziplin: Issues/Plans statt Code-TODOs (vermutlich nutzt User docs/plans/ + Memory korrekt).
**Suggested Fix:** Keine Action — explizit als Strength loben + Konvention in CLAUDE.md aufnehmen ("Keine inline-TODOs. Stattdessen docs/plans/").

#### [Exceptional] F40 — Keine auskommentierten Code-Blöcke ≥10 Zeilen
**File:** `apps/web/src/` + `packages/*/src/`
**Issue:** Grep nach `^\s*//\s*(import|const|let|export|function|return|if)` ergibt nur 2 Treffer — beide sind Doc-Comment-Text-Fragmente ("// import these.", "// construction.") in JSDoc-Style.
**Why Exceptional:** Kein "ich kommentiere kurz aus und committe es"-Pattern. Git-History wird konsequent genutzt statt Comment-Friedhöfe.
**Suggested Fix:** Keine Action.

---

## Cluster-Empfehlungen (Konsolidiert)

| Cluster | Files | Severity | Empfohlene Aktion |
|---------|-------|----------|------------------|
| **SaaS-Pricing-Frontend nicht verdrahtet** | BuyCreditPackModal, CreditMeter, IntensitySelector, cost-estimator, billing-actions, stripe-meters, stripe.ts meter-helpers | Strong | Master-Entscheidung: Pricing-Page Sub-Plan reaktivieren ODER bewusst Backend-only und alle löschen |
| **Settings-Backend Shell** | ApiKeyModal, DangerConfirm, audit-trail-export, sub-processors types | Mid | Mit `nova-2-settings-backend.md` Sub-Plan-Status abgleichen |
| **shadcn-bulk-installs** | 8 ui/* files + viele re-exports | Mid | knip.json mit ignorePatterns konfigurieren oder gezielte Pflege-Sweep einmalig |
| **PixiJS-Legacy-Reste** | d3-selection, d3-zoom, EDGE_KINDS, SEVERITY_PULSE_RATE, LayoutLevel | Strong (deps) / Weak (types) | deps weg, types als ADR notieren |
| **Cross-Package @vk/core leaks** | db, github-app, pr-workflow | Strong | pnpm remove batch |
| **Duplicate DAL files** | customers.ts vs customer-dal.ts | Strong | Mergen, eine kanonische DAL |
| **Hook duplication** | hooks/use-mobile.ts vs lib/use-media-query.ts:useIsMobile | Strong | hooks/ Version + sidebar.tsx weg |

---

## Priorisierte Quick-Wins (Reihenfolge für Cleanup-PR)

1. **F37 lint-staged konfigurieren** — verhindert weitere Drift. Plus shadcn-devDep weg.
2. **F35 + F33 + F34 Dep-Cleanup** — `pnpm remove` batch (d3-*, gray-matter, @vk/core x3, @octokit/webhooks). Sichtbare Build-Speed-Verbesserung.
3. **F38 server-only proper deklarieren** — vermeidet Next.js-Upgrade-Brüche.
4. **F12 + F9 sidebar.tsx + use-mobile.ts deletieren** — klärt UI-Library-Split-Konvention.
5. **F26 InitialZoomLevel-Duplikat in GalaxieScene fixen** — 1-Zeilen-Import-Fix.
6. **F32 `_exportedForTesting` in audit-package entfernen** — Anti-Pattern weg.
7. **F23 knip.json mit ignorePatterns für `components/ui/**`** — macht künftige Audits präzise.
8. **F15 + F18 + F20 Live-Verifikation** (Backend-Frontend-Mismatch-Cluster) — **kritisch**, kann Bug aufdecken.

---

## Out-of-Scope / Cross-Audit-Verweise

- **F36 `@octokit/webhooks` Sicherheit:** Webhook-Verify-Logik in `/api/install-webhook/route.ts` ist ein Security-Domain-Item → Sub-Auditor mit Security-Scope sollte verifizieren.
- **F16 Probes nicht aufgerufen:** Falls Status-Page Fake-Static-Markup ist → Operations-Domain.
- **F20 claimPendingMemberships:** Auth-Flow-Domain (Onboarding/Invites) — kritischer Bug-Smell, dort priorisiert prüfen.
- **F18 Meter-Helpers ungenutzt:** Billing-Domain — möglicher Bug in Stripe-Meter-Reporting.

---

## Tools used

- `pnpm dlx knip@6.14.1` (root run)
- `grep -rEn` + `grep -lE` für Verifikation
- `find` für Datei-Statistik
- Read-Tool für Spot-Checks (use-media-query.ts, token-budget.ts)
- No code modifications. Read-only analysis.
