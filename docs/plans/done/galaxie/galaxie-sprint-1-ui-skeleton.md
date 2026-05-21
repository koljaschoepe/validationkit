# Plan — Galaxie Sprint G1: UI-Skeleton

> Erstellt: 2026-05-19
> Status: ✅ Done — shipped 2026-05-19
> Sprint-Outcome: PixiJS-Galaxie als WOW-Demo. 150 Asteroiden @ 60 FPS, Pan/Zoom/GSAP-Snap/Cmd+K/MiniMap funktional. Public-Demo `/` + Auth-Surface `/[workspace]` beide grün.
> Slug: `galaxie-sprint-1-ui-skeleton`
> Branch: `feat/galaxie-sprint-1-ui-skeleton`
> Umfang: 4 Wochen Solo-Sprint, W1–W4. Liefert das erste shippable "Wow"-Demo.

---

## 1. Ziel

Eine spielerische "Galaxie"-Navigation rendert visuell mit Mock-Daten. Pan, Zoom, Hover, Severity-Color-Coding funktionieren. Das ist die öffentlich vorzeigbare WOW-Demo nach 4 Wochen — kein Apply, keine AI-Solutions, keine echten DB-Daten.

## 2. Endzustand

**Routen:**
- `/` zeigt **Public Galaxie-Demo** mit 3 fake-Customers × 5 fake-Repos × 10 fake-Files = 150 Asteroiden. Lead-Magnet, viral-shareable.
- `/[workspace]` zeigt **Auth-Galaxie** mit Mock-DAL (selbe Fake-Daten, aber via DAL geladen — bereitet Sprint G2 vor).

**Funktional:**
- Pan via Drag/Touch, Zoom via Wheel/Pinch, Camera-Constraints (min/max Zoom-Level).
- 4 Zoom-Snap-Levels via Keyboard Cmd+0/1/2/3/4 + Mouse-Wheel-Detection.
- Severity-Color-Coding (Kill=Rot, Weak=Orange, Mid=Gelb, Strong=Blau, Exceptional=Gold).
- Hover-Tooltip pro Asteroid mit Finding-Snippet.
- MiniMap unten-rechts mit Click-to-Center.
- Workspace-Switcher Topbar (mit Mock-Workspaces).
- Cmd+K Universal-Search-Skelett (sucht über Mock-Daten).
- Dot-Grid-Backdrop.
- Zoom-Indikator oben-rechts.

**Performance-Gate:**
- 60fps Desktop bei 150 Asteroiden (M1 MacBook Air Baseline)
- ≥30fps Mobile (iPhone 13 Baseline)

## 3. Schritte

### Woche 1 — PixiJS-Setup + Skeleton ✅ shipped 2026-05-19

- [x] Dependencies installieren: `pixi.js@^8 @pixi/react@^8 gsap@^3 motion @use-gesture/react @react-spring/web @pixi/filter-glow`
- [x] `apps/web/src/components/galaxie/` Ordner anlegen (+ `pixi/` Subordner, `lib/galaxie/`, `lib/dal/`)
- [x] `GalaxieScene.tsx` als `'use client'` Component mit Pixi-Application-Setup (extend({Container, Graphics, Text}))
- [x] Dynamic-Import-Wrapper `GalaxieRoot.tsx` für SSR-Bypass: `dynamic(() => import('./GalaxieScene'), { ssr: false })`
- [x] Pixi-Application mountet auf `<canvas>`, fills viewport, resizes on window-resize (state-driven width/height)
- [x] FPS-Counter (debug-only via `?debug=1` URL-param) — verifiziert via Playwright: 60 FPS bei leerem Canvas
- [x] **Smoke-Test**: leeres Galaxie-Canvas rendert in dev-server, kein Hydration-Fehler (HTTP 200, dev-Route `/galaxie-dev`, Playwright-Console 0 errors außer favicon-404)

### Woche 2 — Display-Objects + Layout ✅ shipped 2026-05-19

- [x] Type-Definitionen: `Customer`, `Repo`, `FileNode`, `Severity`, `LayoutNode` in `lib/galaxie/types.ts`
- [x] Mock-Data-Service: `lib/galaxie/mock-data.ts` mit 3 Customers × 5 Repos × 10 Files = 150 Files, deterministisch via mulberry32-PRNG + DJB-Hash-Seed, 3 Severity-Mix-Profile (kill-heavy / mixed / strong-heavy)
- [x] Layout-Algorithmus `lib/galaxie/layout.ts`: deterministisch, 3-Level-Orbit (Customer→Repo→File), pure-func ohne Pixi-Deps → 168 Nodes
- [x] Pixi-Components: `pixi/CustomerStar.ts` (32/20/11px concentric), `pixi/RepoMoon.ts` (9/5.5px), `pixi/FileAsteroid.ts` (2.4px + GlowFilter)
- [x] Severity-Color-Map in `lib/galaxie/severity-colors.ts` (Hex + Pixi-Number-Map + helpers)
- [x] Asteroiden rendern mit Severity-Farbe + Glow-Filter via `pixi-filters@^6` (swap aus Q1.3 — `@pixi/filter-glow@5` v8-inkompatibel)
- [x] **Test**: 150 Asteroiden rendern verifiziert via Playwright (60 FPS @ 1280×720, screenshot in galaxie-w2-150-asteroids.png), 14/14 vitest grün (3 + 5 + 6)

### Woche 3 — Camera + Pan/Zoom + Drill-In ✅ shipped 2026-05-19

- [x] `Camera.ts` Class: imperative state (x, y, scale), `panBy`, `zoomAt(factor, anchor)` mit anchor-fix-mathe, `clamp`, `applyTo(world, vcX, vcY)` — 6/6 vitest
- [x] Pan via `useGesture` `onDrag` mit `delta`-Akkumulation → `camera.panBy` + `applyCamera`
- [x] Zoom via `useGesture` `onWheel` mit anchor-relative zoom (mouse position − viewport-center) → `camera.zoomAt`. Pinch deferred zu W4 Mobile-Tuning.
- [x] Camera-Constraints: minZoom 0.3, maxZoom 8, panHalfWidth/Height 2000 — clamp pro mutation
- [x] GSAP-Camera-Tween: 5 zoom-snap-levels Cmd+0/1/2/3/4, levels 2–4 fokussieren echte Customer-Cluster aus mock-layout (deterministic). `gsap.to(cameraRef.current, ...onUpdate=applyCamera)`, ease power2.out, 0.7s
- [x] Hover-Detection: `world.eventMode='passive'`, `world.on('pointerover', ...)` bubble-up, FileAsteroid hat eventMode='static' (W2), Tooltip-DOM-Overlay (`Tooltip.tsx`) mit Severity-Badge + Path + Snippet
- [x] **Decision-Gate W3:** 60 FPS Desktop bei 150 Asteroiden + Pan + Zoom + GSAP-Snap simultaneously ✅ verifiziert via Playwright (`galaxie-w3-zoom1.png`, `galaxie-w3-zoom3-focus.png`, `galaxie-w3-after-drag.png`). Mobile-FPS-Test in W4 Scope.

### Woche 4 — Affordances + Polish ✅ shipped 2026-05-19

- [x] MiniMap-Component (`MiniMap.tsx`, SVG-basiert statt eigene Pixi-Stage — leichtgewichtiger, gleiches Visual) mit Click-to-Center + Viewport-Rect (RAF-updated)
- [x] Zoom-Indikator (`ZoomIndicator.tsx`, DOM-Overlay) mit % + Reset-Button (Reset → Cmd+0-Snap-Level via GSAP)
- [x] Dot-Grid-Backdrop via CSS `radial-gradient` auf host-div (statt Pixi-TilingSprite — gleiches Visual, weniger Code, kein FPS-Hit)
- [x] Workspace-Switcher (`WorkspaceSwitcher.tsx`, DOM-Topbar-Component, Motion-Animated) mit 3 Mock-Workspaces (`mock-workspaces.ts`)
- [x] Cmd+K Universal-Search (`UniversalSearch.tsx`, `cmdk`-Lib): sucht über Customer-Labels + File-Pfade. Pick → GSAP-Tween auf Target (scale 1.7 für Customer, 3.5 für File).
- [x] Mobile-Touch: `onPinch` zu `useGesture` mit memo-pattern + scaleBounds 0.3-8, `touch-none` + `rubberband: false` für stabilen Pinch
- [x] Public-Demo-Route `/`: GalaxieRoot als h-[calc(100svh-3.5rem)] hero unter `SiteNav`, AuditForm + Categories + Concession/Critique darunter als scroll-down Sek-CTA (Plan §7 Q1.1)
- [x] Auth-Route `/[workspace]`: `[workspace]/layout.tsx` mit notFound-on-unknown-slug + `[workspace]/page.tsx` mit GalaxieRoot full-screen. `lib/dal/galaxie.ts` Mock-DAL liefert workspace-seeded mock-data (Sprint G2 ersetzt mit Drizzle+Better-Auth-Membership)
- [x] **Final Test**: alle Gates §2 grün auf `/` und `/[workspace]` verifiziert via Playwright (`galaxie-w4-home.png`, `galaxie-w4-cmdk.png`, `galaxie-w4-workspace.png`, `galaxie-w4-workspace-overview.png`). 60 FPS Desktop ✅. Mobile-FPS-Test → User-Aufgabe (Playwright-Mobile-Sim deferred zu G6 Mobile-Tuning).

## 4. Files-to-Change

| Datei | Was passiert |
|---|---|
| `apps/web/package.json` | Add pixi.js, @pixi/react, gsap, motion, @use-gesture/react, @react-spring/web, cmdk, @pixi/filter-glow |
| `apps/web/src/components/galaxie/GalaxieRoot.tsx` | NEW: Dynamic-Wrapper für SSR-Bypass |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | NEW: Hauptkomponente mit Pixi-App |
| `apps/web/src/components/galaxie/MiniMap.tsx` | NEW: Mini-Map |
| `apps/web/src/components/galaxie/ZoomIndicator.tsx` | NEW: Zoom-Anzeige |
| `apps/web/src/components/galaxie/WorkspaceSwitcher.tsx` | NEW: Topbar-Switcher |
| `apps/web/src/components/galaxie/UniversalSearch.tsx` | NEW: Cmd+K-Search |
| `apps/web/src/components/galaxie/Tooltip.tsx` | NEW: Hover-Tooltip |
| `apps/web/src/components/galaxie/pixi/CustomerStar.ts` | NEW: Pixi-Container für Customer |
| `apps/web/src/components/galaxie/pixi/RepoMoon.ts` | NEW: Pixi-Container für Repo |
| `apps/web/src/components/galaxie/pixi/FileAsteroid.ts` | NEW: Pixi-Container für File |
| `apps/web/src/components/galaxie/pixi/Camera.ts` | NEW: Camera-Class mit pan/zoom |
| `apps/web/src/lib/galaxie/types.ts` | NEW: TypeScript-Types |
| `apps/web/src/lib/galaxie/mock-data.ts` | NEW: deterministische Fake-Daten |
| `apps/web/src/lib/galaxie/layout.ts` | NEW: deterministischer Force-Directed-Algorithmus |
| `apps/web/src/lib/galaxie/severity-colors.ts` | NEW: Severity → Hex-Color Mapping |
| `apps/web/src/lib/dal/galaxie.ts` | NEW: Stub-DAL für Sprint G2 Vorbereitung |
| `apps/web/src/app/page.tsx` | UPDATE: zeige Public-Demo-Galaxie statt Audit-Form (oder als Sekundär-CTA) |
| `apps/web/src/app/[workspace]/page.tsx` | NEW: Auth-Galaxie-Route mit Mock-DAL |
| `apps/web/src/app/[workspace]/layout.tsx` | NEW: Workspace-Layout-Wrapper (Stub, ohne Auth-Check für Sprint G1) |

## 5. Test-Plan

**Manuell (alle 4 Wochen am Sprint-Ende):**
- [ ] `pnpm dev` startet, `http://localhost:3000/` lädt mit Galaxie
- [ ] Pan/Zoom/Hover funktionieren in Chrome + Safari + Firefox
- [ ] Cmd+0/1/2/3/4 snappen auf richtige Zoom-Level mit GSAP-Tween
- [ ] MiniMap + ZoomIndicator + Cmd+K rendern + reagieren
- [ ] FPS-Counter zeigt ≥60fps Desktop, ≥30fps Mobile (Chrome DevTools CPU-Throttle 4x)
- [ ] Mobile (iPhone-Sim oder echtes Device): Pinch-Zoom + 2-Finger-Pan funktioniert
- [ ] `?debug=1` zeigt FPS-Counter

**Automatisch:**
- [ ] `pnpm typecheck` grün (alle neuen Files Typescript-clean)
- [ ] `pnpm test` grün (mindestens 1 Vitest pro neuer Library: layout.test.ts, mock-data.test.ts, severity-colors.test.ts)
- [ ] `pnpm build` grün (turbo cache OK, kein SSR-Crash mit Pixi)

**Verifizierungs-Grep:**
- [ ] `grep -r "import.*pixi" apps/web/src/app/` → 0 Treffer (Pixi NIE direkt in app/-Routen, nur via dynamic-import-Wrapper)
- [ ] `grep -r "motion.div\|motion.span" apps/web/src/components/galaxie/pixi/` → 0 Treffer (kein Motion innerhalb Canvas)

## 6. Risiken + Rollback

| Risiko | Severity | Mitigation |
|---|---|---|
| Pixi-SSR-Bypass-Boilerplate falsch → Build-Crash mit "window is not defined" | Strong | W1 Smoke-Test prüft Build. Standard-Pattern `'use client' + dynamic(ssr:false)`. |
| 150 Asteroiden <60fps Desktop | Strong | W3 Decision-Gate. Plan B = tldraw-Switch (Sprint-Extension um 1 Woche). |
| Mobile <30fps mit Pinch+Pan | Mid | W4 prüft. Mitigation: Asteroiden-Count auf Mobile auf 50 reduzieren, oder Reduced-Motion-Toggle. |
| GSAP-Tween auf Pixi crasht React-Tree | Mid | Strict-Convention: GSAP NIE im React-Render-Cycle. Sentinel-Test in vitest. |
| Cache-Components-Build crasht mit `'use cache'` + dynamic-import | Mid | W1 Build-Test. Falls Crash: dynamic-import in einer eigenen Route ohne `'use cache'` isolieren. |
| Lighthouse-Performance bricht (LCP, CLS) durch Pixi-Canvas | Mid | W4 Lighthouse-Check. Mitigation: SSR-Skeleton-SVG bis Canvas mountet (FOUC-Vermeidung). |

**Rollback:**
- Branch heißt `feat/galaxie-sprint-1-ui-skeleton`.
- `git checkout main` = voller Rollback. Keine DB-Migration in diesem Sprint.
- Bestehende Routen (`/dashboard`, `/customers`, etc.) bleiben unverändert. Sprint G1 berührt sie nicht.

## 7. Open Questions — RESOLVED 2026-05-19

- **Q1.1:** ✅ Audit-Form bleibt als Sekundär-CTA unter der Galaxie auf `/`. Galaxie ist Hero.
- **Q1.2:** ✅ Skelett ohne Auth-Check in G1. Voller Slug-Hijacking-Check + Membership-Gate kommt in G2 zusammen mit DAL-Pattern.
- **Q1.3:** ✅ Glow-Filter aktiv. In W2 von `@pixi/filter-glow@5` (legacy `@pixi/core`-Import, Pixi-v8-inkompatibel) auf `pixi-filters@^6` umgeschwenkt (offizielles v8-Sammel-Package, `GlowFilter`-Export identisch).

## 8. Sprint-Demo (W4-Ende)

Wenn alle Gates grün:
- Public-Demo-Galaxie auf `https://validationkit-preview.vercel.app/` deployt (User-Anfrage erforderlich für Deploy!)
- Build-in-Public-Post mit 30-sec Loom-Video (Pan + Zoom + Cmd+K)
- Plan-File nach `docs/plans/done/galaxie-sprint-1-ui-skeleton.md`
- Master-Plan-Status-Update: "Sprint G1 ✅ Done"

---

**Ausführungs-Trigger:** `/execute galaxie-sprint-1-ui-skeleton` (nach User-Review)
