# Plan — Bundle I · Galaxie-Legibility-Rework

> Master: `production-launch-readiness.md` (Wave 2) · Status: 🔵 Draft
> Slug: `galaxie-legibility-rework` · Confidence: **High** (pixelgenaue Audit-Werte, `_synthesis.md` Dim 6+7+14)
> Scope (User R4): **Beide Galaxien**, gezielter Legibility-/Kontrast-Pass — **kein** Mechanik-Redesign.

## 1. Ziel

Die User-Kritik beheben: „Kontraste zu niedrig, Sachen/Ausrufezeichen zu klein, nicht übersichtlich, nicht professionell genug." Beide Galaxien — Landing-Hero (SVG+motion) und Workspace-Solar (PixiJS) — auf ein professionelles, lesbares, WCAG-konformes Niveau heben, OHNE die Solar-Mechanik (Diff-Loop, Reveal-Layers, Calm-by-Default) umzubauen. Plus die a11y-Kill-Lücke (Galaxie tastatur-unzugänglich).

**Kern-Ironie, die wir fixen:** Aktuell hat **Kill** den *schwächsten* BG-Kontrast (CR 4.19) aller Bänder (Strong 8.75, Mid 7.79) — exakt invertiert zur „nur Kill schreit"-Absicht. Und der Kill-Marker rendert nur 6px (Default) / 2.7px (Overview).

## 2. Existing-Patterns

- `SEVERITY_HEX` (`lib/galaxie/severity-colors.ts`) ist Single-Source für Pixi + SVG + Landing → Paletten-Änderung an **einer** Stelle.
- `SOLAR_LAYOUT_CONSTANTS` (`lib/galaxie/solar-layout.ts`) ist Single-Source für alle Radien/Orbits.
- `StaticGalaxieSVG.tsx:289` ist a11y-Vorbild (tastaturzugängliche `rect role=button tabIndex=0` + Enter/Space) — Muster für den List-Fallback.
- Counter-Scale-Vorbild: keines im Repo — neu einzuführen (POI-Verhalten: Element bleibt screen-px-konstant statt mit Zoom zu skalieren).

## 3. Sub-Step A — Palette & Kontrast (`severity-colors.ts`, ~0.75 dd)

| Band | Heute | Neu | Grund |
|------|-------|-----|-------|
| Kill | `#c64a3a` (CR 4.19) | `#e8503f` (CR~5.6) oder `#f4604e` (CR~7) | Salienz-Inversion fixen — Kill MUSS der auffälligste Punkt sein |
| Mid | `#9aa3b3` (chroma 0.02, Grau) | `#b88a52` (oklch 0.66 0.10 65, gedämpftes Bernstein) | Häufigstes Finding liest sich als Finding |
| Exceptional | `#acacac` (chroma 0, Grau) | `#8a82e0` (Indigo-Tint, = `SEVERITY_OUTLINE_HEX`) | Aus dem Grau holen, konsistent mit Outline |
| Strong | `#7eb8a4` | behalten, aber dunkles Icon | Disc ok, nur Icon-Kontrast |
| Weak | `#cf8a4f` | behalten, dunkles Icon | dito |
| Dismissed | `#4d4d4d` (CR 2.34) | `#6b6b6b` (CR~3.9) + gestrichelter 0.75px-Outline statt alpha 0.2 | Dismissed wiederfindbar |

- Glow: `SEVERITY_GLOW_RADIUS.Kill 6→8`, outerStrength 1.4→1.8 (flächigere Kill-Salienz).
- **Galaxie-Kill an CSS `--sev-kill`** (`globals.css:117`) angleichen — Hero zeigt sonst zwei Kill-Rottöne (Badge vs Inspector-Diff).
- Inter-Band-Check: nach Änderung müssen Mid/Strong/Exceptional als nackte Fills unterscheidbar sein (heute Strong vs Exceptional CR 1.00).

## 4. Sub-Step B — Marker-Größe + Counter-Scale-LOD (~2 dd)

**Solar (Pixi):**
- `severity-icons.ts`: Kill-spezifisch `KILL_BADGE_DISC=8`, `KILL_BADGE_ICON=11` (andere Bänder 5/6 belassen).
- `edge-badge-texture.ts`: `ICON_SIZE 12→16`, DPR `2→3` (crispere Rasterung).
- `FolderPlanet.ts`/`FilePlanet.ts`/`RepoSun.ts` `buildBadge`: Disc + Icon mit `*mobileScale` multiplizieren (heute ignoriert → Marker auf Mobile proportional kleiner).
- **Counter-Scale-Layer** (neu): Badge-Container + Orbit-Stroke-Width an `cameraScale` clampen → Kill-Marker screen-min ~12px, Orbit-Stroke screen-konstant ~1px. Subscribe an `cameraRef` in der `applyCamera`-Schleife (`GalaxieScene.tsx:912`). Reduced-Motion-Pfad (StaticGalaxieSVG) separat prüfen.

**Landing (SVG):**
- `Sphere.tsx`: `BADGE_DISC_RADIUS 11→16`, `BADGE_ICON_RATIO 1.3→1.4` (Icon ~8px→~13px @ Root); optional counter-scale gegen Kamera-Zoom für px-Konstanz ≥16px.
- Badge-Icon-Farbe pro Band an Disc-Lightness koppeln: dunkles Icon `oklch(0.18)` auf hellen Discs (Strong/Mid/Exceptional/Weak), weiß nur auf Kill (behebt CR 1.9-2.5:1 AA-Fail).

## 5. Sub-Step C — Spacing + Labels + Lesbarkeit (~1.5 dd)

**Solar-Spacing (`solar-layout.ts`):**
- `SUN_ORBIT_IN_CLUSTER 220→300` (Sun-Overlap auflösen: 5 Suns Tangential 353px > 260px Reach).
- `CUSTOMER_CLUSTER_RADIUS 600→750` (Cluster nicht überlappen). Visual-Check im Dev-Server (betrifft zoomLevels-Snap-Targets).
- Persistente **Sun-Labels** (nur Repo-Name) ab `cameraScale≥1.2` (Pixi Text, white/70, 11px counter-scale) — löst Overview-Blindheit (15 graue Scheiben), ohne Calm-Prinzip zu verletzen (Planeten/Files bleiben hover-only). Optional: Sun-Hover triggert Repo-Name-Tooltip.

**Landing-Labels (`Sphere.tsx`):**
- folder 16→20, submodule 17→20, repo 20→24, customer 22→26, workspace 24→28; Ancestor-Opacity `0.32→0.5`.

## 6. Sub-Step D — a11y (~3 dd, enthält K-A11Y1 Kill)

- **K-A11Y1 (Kill):** Desktop-Keyboard-Pfad. `SolarListView` (existiert, mobile-only, nimmt schon `initialData`+`readOnly`, wired denselben Inspector) als optionalen **„List"-Toggle** für Desktop exponieren (`GalaxieRoot` `isMobile`-Gate um User-Toggle erweitern) — günstigste Variante. Alternativ: parallele sr-only/Sidebar-Findings-Liste mit Enter/Space → `openFileInspector`/`handleSunClick`.
- **Inspector-Focus-Trap:** `Inspector.tsx` von handgebautem `createPortal`-Dialog auf Radix Sheet (`components/ui/sheet.tsx`) umstellen → Focus-Trap + Initial-Focus + Restore + Escape gratis. Betrifft alle 3 Render-Pfade (Scene/StaticSVG/SolarListView). *(Hinweis: `sheet.tsx` steht auf Bundle-H-Löschliste — hier wird es REAKTIVIERT statt gelöscht; in Bundle H ausnehmen.)*
- **Skip-Link:** `[workspace]/page.tsx:46` Wrapper-`div`→`<main id="main-content" tabIndex={-1}>`.
- **Kontrast-Text:** `text-white/40 → text-white/58` an ~6 Stellen (SolarListView Filter-Chips, Inspector Folder-Counts/Empty-State, UniversalSearch Severity-Label).
- Inspector Dismiss/Snooze `aria-disabled` auch funktional disablen.

## 7. Acceptance — Browser-Verifikation (Playwright, frische Session)

- Dev-Server, **Landing** Desktop (1440px) + Mobile (390px): Kill-Badge deutlich sichtbar/groß, Labels lesbar, Kill satt-rot.
- **Workspace-Solar** (eingeloggt, Seed-Daten): Kill-Marker ≥12px im Overview, kein Sun-Overlap, Sun-Labels ab Zoom, List-Toggle keyboard-bedienbar, Inspector Focus-Trap.
- axe-core optional gegen `text-white`-Kontraste.
- Reduced-Motion-Pfad (StaticGalaxieSVG) gegenprüfen (darf nicht regressieren).

## 8. Files-to-Change

`lib/galaxie/severity-colors.ts`, `lib/galaxie/severity-icons.ts`, `lib/galaxie/solar-layout.ts`, `components/galaxie/pixi/{FolderPlanet,FilePlanet,RepoSun,edge-badge-texture}.ts`, `components/galaxie/{GalaxieScene,GalaxieRoot,Inspector,SolarListView}.tsx`, `components/landing/Sphere.tsx`, `app/[workspace]/page.tsx`, `app/globals.css` (Kill-Angleich).

## 9. Out-of-Scope

MiniMap-Solar-Migration (Legacy-Layout-Debt, eigenes Ticket) · Galaxie-Mechanik/Interaktions-Redesign (R4: nur Legibility) · neue Galaxie-Features.

## 10. Risiken

Counter-Scale-LOD kann GSAP-Tweens/Perf beeinflussen → inkrementell + Browser-Check je Schritt. Paletten-Änderung wirkt auf Landing UND Workspace gleichzeitig (Single-Source) → beide Surfaces nach jeder Farbänderung sichten.
