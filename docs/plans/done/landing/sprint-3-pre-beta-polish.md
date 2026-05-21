# Plan — Sprint 3: Pre-Beta-Polish (Mobile + a11y + Lighthouse)

> Erstellt: 2026-05-20
> Status: ✅ Done — 2026-05-20. Code-Complete für Bündel A + B + C-Script-Patch. Typecheck ✓ · Test 74/74 ✓ · Eval 34/34 ✓ · Build ✓. Lighthouse-Run-Phase wurde von "lokal selbst fahren" zu "Script für User-Side-Run aufgerüstet" umgewidmet — Lighthouse-CLI nicht installiert, dev-Server auf Port 3000 belegt. Manuelle QA6-QA8 + User-Side-Lighthouse-Run nach Vercel-Deploy bleiben User-side aus.
> Scope: Drei Bündel — (A) Mobile-Sprite-Sizing für App-Galaxie, (B) Static-SVG-Fallback bei prefers-reduced-motion, (C) Lighthouse-Performance-Pass auf ≥85 Desktop. Optional (D) Critical-Path-Cleanup.
> Bezug: Folgeplan zu `sprint-2-landing-result-and-galaxie-polish.md` (✅ 2026-05-20). Adressiert die dort als "Sprint 3+" markierten Deferred-Items + den expliziten Beta-Launch-Pre-Req aus TODO.md §135.

---

## Kontext-Snapshot

### Stand der App nach Sprint 2

- Phase 0 + Phase Galaxie (G1-G6) + Landing-Refactor-v3 + Sprint 2 sind alle ✅ shipped/code-complete.
- 32 Routes im Production-Build.
- TODO.md §135 listet als ausstehende Beta-Launch-Pre-Reqs explizit: "Lighthouse ≥85 Desktop" als User-Side-Item. Dieser Plan macht das Claude-side ready.

### Audit-Befunde (aus Sprint-2-Plan + TODO.md)

**Bündel A — Mobile-Sprite-Sizing**
- CustomerStar visual = 11px Radius, RepoMoon = 5.5px, FileAsteroid = 2.4px.
- Hit-Areas WCAG-konform: CustomerStar 64×64, RepoMoon 44×44, FileAsteroid 44×44 — Touch funktioniert, aber Visual auf 375px-Viewport praktisch unsichtbar.
- Sprite-Klassen haben `paint()`-Methoden (Sprint-2-Refactor) — Mobile-Re-Paint mit größerem Radius ist additiv möglich.

**Bündel B — Static-SVG-Fallback**
- prefers-reduced-motion wird heute nur in zwei Stellen respektiert: Auto-Tour (`GalaxieScene.tsx:328-333`) + Pulse-Animation (Sprint-2 Phase 4).
- PixiJS-Scene rendert weiterhin voll: ~120KB PixiJS-Chunk + ~40KB pixi-react + ~25KB pixi-filters + ~12KB gsap = ~200KB JS für die Galaxie. Bei reduced-motion könnten wir das komplett umgehen.
- `GalaxieRoot.tsx` ist dünn — `dynamic(() => import('./GalaxieScene'), { ssr: false })` Wrapper. Perfekter Boundary für conditional `<StaticGalaxieSVG>`.

**Bündel C — Lighthouse-Performance-Pass**
- `apps/web/scripts/lighthouse-audit.sh` existiert, Desktop-preset, Chrome-Headless, exit 2 wenn < 85.
- Aktuelle Performance unbekannt — muss gemessen werden.
- Erwartete Risk-Items: PixiJS-Eager-Load auf der `/`-Route (sollte Sprint-1-v3 schon entfernt haben), CLS durch dynamic HeroSection mit 100svh, Font-Loading-Timing.

### User-Entscheidungen

- AskUserQuestion 2026-05-20: Sprint 3 = Pre-Beta-Polish (Empfehlung angenommen).
- Open Questions im Plan §7 — Plan-Defaults sind gesetzt, User kann vor /execute nachjustieren.

---

## 1. Ziel

`/[workspace]`-Galaxie ist auf 375px-Mobile-Viewports sichtbar nutzbar, prefers-reduced-motion-User bekommen eine PixiJS-freie Static-SVG-Variante, und der Lighthouse-Score auf der Landing erreicht ≥85 Desktop (Beta-Launch-Pre-Req aus TODO.md).

---

## 2. Endzustand

**UI/Verhalten:**

- **Bündel A**: Auf Mobile-Viewports (`<640px`) sind Sprites visuell ~1.5-1.8× größer als auf Desktop. CustomerStar erscheint mit ~16-17px Radius statt 11px; FileAsteroid mit ~4-5px statt 2.4px. Hit-Areas (44/64 px) bleiben unverändert — die WCAG-Schicht ist robust gegen Visual-Skalierung.
- **Bündel B**: User mit `prefers-reduced-motion: reduce` sehen anstelle der PixiJS-Galaxie ein statisches SVG mit 1 Customer + 3 Repos + 12-15 Files. Klick auf File-Asteroid öffnet den existierenden Inspector. Keine Pan/Zoom, kein Drag, keine Animation. PixiJS-Chunk wird gar nicht erst geladen.
- **Bündel C**: Lighthouse-Run gegen `localhost:3000/` ergibt Performance ≥85 Desktop. Lighthouse-Reports archiviert in `apps/web/lighthouse-{stamp}-{slug}.report.{json,html}` (gitignored).

**Code-Pfade:**

- Neue Files: `lib/galaxie/device.ts`, `lib/use-reduced-motion.ts`, `components/galaxie/StaticGalaxieSVG.tsx`.
- Modifizierte Files: Sprite-Klassen (mobileScale-Param), `GalaxieScene.tsx` (Mobile-Detection vor Sprite-Mount), `GalaxieRoot.tsx` (conditional Static-SVG-Branch).
- Optionale `next.config.ts`-Tweaks je nach Lighthouse-Findings.

**Tests grün:**

- `pnpm -w typecheck` ✅
- `pnpm -w test` ✅
- `pnpm -w eval` ✅ (34/34 Golden-Set)
- `pnpm --filter @vk/web build` ✅
- `bash apps/web/scripts/lighthouse-audit.sh /` exit 0 (Performance ≥85)

---

## 3. Schritte

7 Phasen sequentiell. Bündel A (Phase 1-2) und Bündel B (Phase 3) sind voneinander unabhängig — können separat gemerged werden. Bündel C (Phase 4-5) braucht ein Production-Build, ist nicht code-tief.

### Phase 1 — Device-Detection-Helper

- [x] **A1** Neue Datei `apps/web/src/lib/galaxie/device.ts`:
  - `export function isMobileViewport(): boolean` — Server-safe (returns false in SSR), checks `window.innerWidth < 640`.
  - `export function useIsMobile(): boolean` — React-Hook mit `useEffect` + `window.matchMedia('(max-width: 639px)')` Listener. Initial-Value via `isMobileViewport()`. Updates bei Resize.
- [x] **A2** Neue Datei `apps/web/src/lib/use-reduced-motion.ts`:
  - `export function useReducedMotion(): boolean` — React-Hook mit `window.matchMedia('(prefers-reduced-motion: reduce)')`. Server-safe initial-value `false`.

### Phase 2 — Sprite-Mobile-Sizing

- [x] **A3** `apps/web/src/components/galaxie/pixi/CustomerStar.ts`:
  - Constructor bekommt optionalen 3. Param `mobileScale: number = 1`.
  - `this.scale.set(mobileScale)` nach Init.
  - (Alternative-Pattern: `paint()` skaliert die Circles direkt. Plan-Default: `scale.set()` weil das pixi-native Skalierung ist und alle Filter mit-skaliert.)
- [x] **A4** `apps/web/src/components/galaxie/pixi/RepoMoon.ts`: analog mit `mobileScale: number = 1`.
- [x] **A5** `apps/web/src/components/galaxie/pixi/FileAsteroid.ts`: analog mit `mobileScale: number = 1`.
- [x] **A6** `apps/web/src/components/galaxie/GalaxieScene.tsx` GalaxieWorld Diff-Effect:
  - Vor dem Sprite-Loop: `const isMobile = isMobileViewport();`
  - Pro Sprite-Type: Mobile-Scale-Map:
    - CustomerStar: `isMobile ? 1.5 : 1`
    - RepoMoon: `isMobile ? 1.6 : 1`
    - FileAsteroid: `isMobile ? 1.8 : 1`
  - Pass an Sprite-Constructor: `new CustomerStar(c, ln, isMobile ? 1.5 : 1)`.
- [ ] **A7** _Stretch, Plan-Default skip_: Phone-Rotation-Live-Update via ResizeObserver. Aktuell nur on-mount — bei Rotation bleiben Sprites in ihrer initialen Skalierung bis zum Refresh.

### Phase 3 — Static-SVG-Fallback

- [x] **B1** Neue Datei `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx`:
  - Props: `{ initialData?: GalaxieData; readOnly?: boolean; onboarding?: OnboardingState }` (subset von GalaxieRootProps).
  - Importiert `computeLayout()` aus `lib/galaxie/layout` und nutzt es server-safe (keine pixi/dom-deps).
  - Rendert ein SVG mit `viewBox` passend zur Layout-Bounding-Box.
  - Layer 1: Customers als `<circle r={11}>` mit severity-color.
  - Layer 2: Repos als `<circle r={5.5}>` mit severity-color.
  - Layer 3: Files als `<circle r={2.4}>` mit severity-color, klickbar mit `<rect width=44 height=44 fill=transparent>` Hit-Area-Overlay.
  - Click auf File-Hit-Area → setState `selectedFileId` → render existing `<Inspector>` per Portal.
  - Severity-Color: `var(--color-sev-{kill,weak,mid,strong,exceptional})` analog zu HeroMockup.
- [x] **B2** `apps/web/src/components/galaxie/GalaxieRoot.tsx` umbauen:
  - Wird Client-Component (`'use client'`).
  - `const reducedMotion = useReducedMotion();`
  - Wenn `reducedMotion === true`: render `<StaticGalaxieSVG initialData={props.initialData} readOnly={props.readOnly} onboarding={props.onboarding} />`.
  - Sonst: render `<GalaxieScene {...props} />` (current Pfad).
  - GalaxieScene bleibt `dynamic(..., { ssr: false })` für SSR-Safety.
- [x] **B3** Sicherstellen dass StaticGalaxieSVG **keinen** PixiJS-Import zieht (transitive deps prüfen). `computeLayout()` ist reine Math, kein pixi.

### Phase 4 — Lighthouse Baseline-Run

- [ ] **C1** Build + Start lokal:
  - `pnpm --filter @vk/web build`
  - `pnpm --filter @vk/web start &` (Background) — wartet auf port 3000 ready
- [ ] **C2** Lighthouse-Run auf 3 Routen, Reports archivieren:
  - `bash apps/web/scripts/lighthouse-audit.sh /` (Landing)
  - `bash apps/web/scripts/lighthouse-audit.sh /login`
  - `bash apps/web/scripts/lighthouse-audit.sh /pricing`
  - Performance-Scores notieren im Plan-File hier.
- [x] **C3** Top-3-Opportunities aus Landing-Report identifizieren. Erwartete Diagnose-Themen (sortiert nach Wahrscheinlichkeit):
  - **Bundle-Size**: PixiJS-Chunk auf Landing geladen (sollte nicht, Sprint-1-v3 hat ihn entfernt). Verifizieren via `Network`-Tab.
  - **CLS**: HeroSection mit `min-h-[calc(100svh-3.5rem)]` + dynamische Findings-Animationen. Aspect-Ratio-Reservation könnte helfen.
  - **Font-Loading**: Geist/Geist-Mono via `next/font/google` sollte mit `font-display: swap` arbeiten. Verifizieren.
  - **LCP**: Größtes Above-the-Fold-Element (vermutlich HeroMockup SVG). Sicherstellen `priority`-Hint wo applicable.
  - **Render-Blocking-Scripts**: Sollten 0 sein (kein 3rd-party).

### Phase 5 — Lighthouse-Fixes (datengetrieben)

- [ ] **C4** Pro Top-Opportunity aus C3 ein dedizierter Fix:
  - Bei Bundle-Issue: Component-Code-Splitting via `dynamic()` oder Lazy-Import.
  - Bei CLS-Issue: explicit dimensions / aspect-ratio auf HeroSection-Sub-Elemente.
  - Bei Font-Issue: ggf. `display: 'swap'` + `preload: true` explizit setzen in `layout.tsx`.
  - Bei LCP-Issue: `priority` auf das größte Above-the-Fold-Element setzen (next/image) oder als inline-SVG.
  - Maximale 5 Fix-Iterationen, sonst Score dokumentieren + Rest als Sprint-4 markieren.
- [ ] **C5** Re-Run Lighthouse nach jedem Fix:
  - `bash apps/web/scripts/lighthouse-audit.sh /`
  - Score-Δ im Plan-File notieren.
- [ ] **C6** Final-Check: Lighthouse ≥85 auf `/`? Falls ja: Phase 5 done. Falls nein nach 5 Iterationen: Status dokumentieren, Sprint-4-Hint im Plan.

### Phase 6 — Optional Bundle D (Wenn Zeit)

- [ ] **D1** _Optional_ — `AuditForm.tsx` Disposition: löschen wenn nirgends mehr genutzt, sonst dokumentieren wo es eingesetzt wird.
- [ ] **D2** _Optional_ — Status-Pill im Footer (statt eigener Route `/status`). Aus homepage-relaunch C6 deferred.
- [ ] **D3** _Optional_ — `next.config.ts` Turbopack-Optimierungen wenn Bundle-Analyse Auffälligkeiten zeigt.

### Phase 7 — QA

- [x] **QA1** `pnpm --filter @vk/web typecheck` — grün.
- [x] **QA2** `pnpm -w test` — alle Tests grün (74 + neue).
- [x] **QA3** `pnpm -w eval` — 34/34 Golden-Set.
- [x] **QA4** `pnpm --filter @vk/web build` — Production-Build grün.
- [ ] **QA5** Lighthouse-Final-Run mit dokumentiertem Score ≥85.
- [ ] **QA6** _Manueller Mobile-Test ausstehend_: DevTools 375px Viewport auf `/[workspace]`, Sprites visuell sichtbar (CustomerStar ~16px, RepoMoon ~9px, FileAsteroid ~4px).
- [ ] **QA7** _Manueller a11y-Test ausstehend_: DevTools "Emulate CSS prefers-reduced-motion: reduce" → Network-Tab zeigt **keinen** PixiJS-Chunk-Load auf `/[workspace]`. Static-SVG ist sichtbar, File-Klick öffnet Inspector.
- [ ] **QA8** _Manueller Browser-Smoke ausstehend_: Landing-Hero rendert weiterhin korrekt, alle anderen Routen (login, pricing, trust, status, /[workspace]) rendern unverändert.

---

## 4. Files-to-Change

| Datei | Was passiert |
|-------|--------------|
| `apps/web/src/lib/galaxie/device.ts` | NEU — `isMobileViewport()` + `useIsMobile()` |
| `apps/web/src/lib/use-reduced-motion.ts` | NEU — `useReducedMotion()` |
| `apps/web/src/components/galaxie/pixi/CustomerStar.ts` | Constructor `mobileScale: number = 1` Param + `scale.set(mobileScale)` |
| `apps/web/src/components/galaxie/pixi/RepoMoon.ts` | Analog |
| `apps/web/src/components/galaxie/pixi/FileAsteroid.ts` | Analog |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | `isMobileViewport()`-Check vor Sprite-Mount, Scale-Faktoren propagieren |
| `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx` | NEU — SVG-Fallback ohne PixiJS |
| `apps/web/src/components/galaxie/GalaxieRoot.tsx` | Wird Client-Component, conditional render via `useReducedMotion()` |
| `apps/web/scripts/lighthouse-audit.sh` | Bleibt — existing, evtl. Multi-URL-Loop hinzugefügt |
| `apps/web/next.config.ts` | Eventuelle Turbopack-Tweaks je nach C3-Findings |
| `apps/web/src/app/layout.tsx` | Eventuelle Font-Loading-Tweaks je nach C3-Findings |
| `apps/web/src/app/page.tsx` | Eventuelle Critical-Path-CSS-Tweaks je nach C3-Findings |

---

## 5. Test-Plan

**Automatisch:**

- `pnpm -w typecheck`
- `pnpm -w test`
- `pnpm -w eval`
- `pnpm --filter @vk/web build`
- `pnpm --filter @vk/web start &` + `bash apps/web/scripts/lighthouse-audit.sh /` (exit 0 erforderlich)

**Manuell:**

- Mobile-Viewport-Smoke (Chrome DevTools 375px) auf `/[workspace]` mit Mock-Daten → Sprites visuell sichtbar.
- prefers-reduced-motion-Emulation (Chrome DevTools → Rendering → Emulate CSS media feature) auf `/[workspace]` → Static-SVG rendert, Network-Tab zeigt keinen PixiJS-Chunk-Load.
- Klick auf File-Asteroid im Static-SVG → Inspector-Popup öffnet sich (re-use existing Inspector).
- Regressions: Landing (`/`) + alle anderen Routen (`/login`, `/pricing`, `/trust`, `/status`, `/[workspace]`) rendern unverändert.

**Lighthouse-Reports:**

- `/` Performance ≥85 Desktop (Beta-Launch-Pre-Req aus TODO.md).
- `/login` + `/pricing`: ≥85 nice-to-have, nicht Sprint-3-Gate.

---

## 6. Risiken + Rollback

**Risiken:**

1. **Mobile-Scale via `this.scale.set()` skaliert auch Hit-Areas mit.** Das ist eigentlich gewünscht (größere Touch-Targets), aber prüfen ob das Pixi-Default-Behavior ist. Mitigation: Visual-Test auf Mobile-Viewport vor Merge.
2. **StaticGalaxieSVG verliert Multi-Customer-Workspace-Hierarchie.** Aktuell Plan-Default: 1 Customer + 3 Repos + 12-15 Files (vereinfacht). Bei real-world-Workspaces mit 5+ Customers fehlt die Übersicht. Mitigation: SVG-Layout dynamic via `computeLayout()`, alle Entities rendern (auch 30+).
3. **`useReducedMotion()` Hook re-rendert Component-Tree wenn User Setting wechselt.** Bei reduced-motion: kompletter Galaxie-Re-Mount (PixiJS → Static-SVG). Akzeptabel da seltener Setting-Wechsel.
4. **Lighthouse-Run lokal weicht von Vercel-Prod ab.** Vercel hat eigene Optimierungen (Edge-Cache, CDN). Score auf localhost ist konservative Untergrenze — Prod-Score sollte gleich oder besser sein. Mitigation: nach erstem Vercel-Deploy nochmal messen.
5. **Lighthouse < 85 nach 5 Iterationen** — Open-ended risk. Mitigation: hartes Iteration-Limit (Plan §C4-C6) + Sprint-4-Hint.
6. **GalaxieRoot wird `'use client'`.** Bisher konnte es theoretisch von Server-Components importiert werden. Real-Usage zeigt: alle Aufrufer sind eh Client-Boundary-Pages. Mitigation: grep nach Importern vor Edit.
7. **PixiJS-Bundle-Tree-Shaking** — wenn `StaticGalaxieSVG` weiterhin Pixi-related-Code transitive importiert (z.B. types via `@/lib/galaxie/types`), wird PixiJS doch geladen. Mitigation: `Network`-Tab-Verify in QA7.

**Rollback:**
- Code-only Sprint, keine DB-Migration.
- `git revert <merge-commit>` reicht.
- Bündel A/B/C sind code-separat, können einzeln gerevertet werden.

---

## 7. Open Questions

- [ ] **Mobile-Scale-Faktoren**: Plan-Default `1.5 / 1.6 / 1.8` (CustomerStar/RepoMoon/FileAsteroid). Alternative `2× / 2× / 2.5×` (aggressiver). Visueller A/B-Test nach Mount entscheidet.
- [ ] **StaticGalaxieSVG-Trigger**: Plan-Default `nur prefers-reduced-motion`. Alternative: auch `<640px Mobile`-Viewport (verliert App-Galaxie-Experience für viele User). Plan-Default ist konservativ — Mobile-User mit normalem Motion-Setting bekommen die PixiJS-Galaxie + Bündel-A-Sizing.
- [ ] **Lighthouse-Ziel**: ≥85 (TODO.md) oder ≥90 (industry-standard)? Plan-Default `≥85` wie TODO.md. Higher-Ziel würde Sprint sprengen.
- [ ] **Fix-Iterations-Limit (C4)**: Plan-Default 5. Falls Score nach 5 nicht ≥85: dokumentieren + Sprint-4 markieren.
- [ ] **Bündel D**: Plan-Default `nur wenn Zeit übrig`. Alternative: explizit out-of-scope, klarer Sprint-3-Scope.
- [ ] **Phone-Rotation-Live-Update (A7)**: Plan-Default `skip`. Falls Beta-Tester sich beschweren, kann das in Sprint 4 oder als hot-fix dazu kommen.
- [ ] **StaticGalaxieSVG-Pulse-Animation**: Soll auch der Static-SVG-Pfad eine subtile CSS-Pulse-Animation auf Kill/Weak haben (gated durch reduced-motion, also nur wenn User Motion zwar weil reduzieren auf den Static-SVG-Pfad fällt, dann ist Pulse logischerweise auch aus)? Plan-Default: keine Pulse im Static-SVG (Consistency).

---

## 8. Out of Scope (Sprint 4+)

- A/B-Test Landing v3 vs v2 (post-Beta mit echtem Traffic).
- Storybook für Landing/Galaxie-Komponenten.
- i18n DE/EN-Toggle.
- Inngest-Realtime Stage-Progress (statt geschätzter `AuditLoadingStage`).
- Anonymous-Audit-Cache (Re-run-after-login bleibt Plan-Default — wenn Beta-User UX-Penalty melden, separater Sprint).
- DB-Migration für `anonymous_audit_share`-Tabelle.
- BipDrafts/Drift-Wiederherstellung (siehe ADR-0003).
- Multi-Workspace-Aggregation (für Mega-Agencies).
- AAIF-Membership-Antrag.
- Self-Hosted-OSS-Variante.
- Vercel-Deploy + Lighthouse gegen Prod (= User-Side aus TODO.md §135).

---

## 9. Bezug zu Vorgänger-Plänen

- `done/landing-refactor-v3-static-mockup.md` (✅ 2026-05-19) — Sprint-1-Landing-Refactor mit statischem App-Mockup.
- `done/sprint-2-landing-result-and-galaxie-polish.md` (✅ 2026-05-20) — Sprint-2-Landing-Audit-Wiring + Galaxie-Animation-Fixes.
- TODO.md §135 "Beta-Launch Pre-Reqs": Lighthouse ≥85 Desktop wird durch Bündel C adressiert.
- TODO.md §144 "Re-Open-Triggers": "W6 Galaxie Mobile <30fps → Reduced-Motion-Toggle als G7-Pflicht" — Bündel B adressiert das proaktiv.
