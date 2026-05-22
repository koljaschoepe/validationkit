# Plan — Galaxie-Polish III: Readability & Layout-Clarity

> Erstellt: 2026-05-21
> Status: ✅ Done — 2026-05-21 (Confidence-At-Start: High, 24 Steps abgehakt, 2 deferred, 4 manuelle Acceptance-Checks ✓, **Polish-IV-Followup ✓** — siehe Block unten)
> Slug: `folder-tree-animation-redesign`

> ### Polish-IV-Followup (2026-05-21, post-Done, user-confirmed live):
> Direkt nach Plan-Done identifizierte der User 3 weitere Pain-Points am laufenden Dev-Server: (1) File-Click ändert den Inspector nicht, (2) Default-Zoom füllt die Fläche nicht, (3) Schriften auch nach manuellem Zoom-In unlesbar klein. 8 Fixes, alle live-verifiziert (User-OK auf Lesbarkeit + Click + Zoom):
> 1. `ZOOM_TARGET_FILL` 0.45 → 0.82 — Galaxie nutzt jetzt ~82 % der viewBox.
> 2. Container-Font-Sizes deutlich erhöht: workspace 16→24, customer 14→22, repo 13→20, submodule 12→17, folder 11→16.
> 3. File-Hit-Target min 14 → 22 viewBox-units.
> 4. Container-Hit-Target min radius → 28 viewBox-units.
> 5. Container-Pill ist jetzt selbst Click-Target (vorher `pointerEvents=none`, User-Klicks auf Folder-Label landeten im SVG-Background).
> 6. File-Type-Codicon: max 28 → 40, min-radius 14 → 12 (auch kleinere Files bekommen jetzt Icon).
> 7. **Wahrer Click-Bug-Fix in `RepoGalaxie.tsx`**: `setPointerCapture` wurde unbedingt im `pointerDown` aufgerufen → Browser ordnete `pointerup` dem SVG zu, NICHT der darunterliegenden Sphere → `click` wurde nicht auf der Sphere generiert. Jetzt: capture erst wenn drag-threshold überschritten ist.
> 8. HoverTooltip-Font 11 → 14, Padding analog hochgesetzt.

> ### Polish-V-Followup (2026-05-22, post-Done, user-confirmed live):
> User fand nach Polish-IV-Live-Check: Severity-Indicators wirken nicht professionell, Galaxie-Settings-Popover ist unnötig, Zoom-Speed zu langsam, Kontrast bei den Severity-Markern stimmt nicht. 8 weitere Fixes:
> 1. **Settings-Popover komplett aus Hero-Toolbar entfernt** (HeroSection.tsx) — Settings-Icon-Button + GalaxieSettingsPopover-Render raus. Component-File bleibt für ggf. spätere Re-Use.
> 2. `ZOOM_SPEED_FACTOR.standard` 1.0 → 1.8 (Wheel-Zoom ~80 % schneller). Slow 0.5 → 1.0, Fast 1.8 → 3.0.
> 3. Camera-Tween-Duration in `RepoGalaxie.tsx` 0.7s → 0.4s (Zoom-In/Out auf Folder spürbar straffer).
> 4. `defaultPaddingForDepth` (28,22,12) → (38,30,20) — noch mehr Atemraum pro Hierarchie-Tiefe.
> 5. File-Severity-Outline: strokeWidth 1.2/1.8 → 2.2/3.0; Rest-Opacity 0.7 → 0.85 → Outline ist im Ruhezustand klar erkennbar.
> 6. **Severity-Icon-Background-Disc**: vor jedem SeverityIcon liegt jetzt ein dunkler Disc (`oklch(0.10 0 0)` + 1.5px Severity-Border) — Icon wirkt als klare Badge gegen den Gradient-Sphere, nicht mehr verschwommen.
> 7. `SeverityIcon` Strokes vereinheitlicht & verstärkt: 1.5–2 → 2.4–2.6 (Kill leicht dicker). Klarere visuelle Hierarchie zwischen "gut/mittel/schlecht".
> 8. Icon-Größe relativ zur Sphere: max 32 → 26, min 8 → 10 (passt jetzt zur Background-Disc, kein Clipping).
>
> **Polish-V Iteration 2** (selbe Session, nach User-Feedback "Zoom noch nicht schnell genug" + "Disc-Proportionen nicht ideal"):
> - `ZOOM_SPEED_FACTOR` weiter hoch: slow 1.0→1.8, standard 1.8→3.2, fast 3.0→5.0.
> - Camera-Tween-Duration 0.4s → 0.25s.
> - Severity-Disc-Formel proportional zur Sphere-Größe: `Math.min(22, Math.max(10, node.radius * 0.55))`; Icon-Size = Disc-Radius × 1.4. Klare Badge-Proportionen unabhängig von Sphere-Größe. **User-OK** auf Disc-Proportionen.
>
> **Polish-V Iteration 3** (Zoom noch einen Tick schneller, User-Request):
> - `ZOOM_SPEED_FACTOR` slow 1.8→2.4, standard 3.2→4.5, fast 5.0→7.0.
> - Camera-Tween-Duration 0.25s → 0.18s.

> Confidence: **High** — basiert auf 12 User-Entscheidungen (3 Runden Discovery) + Code-Audit von 7 Files (`Sphere.tsx`, `RepoGalaxie.tsx`, `HoverTooltip.tsx`, `layout.ts`, `HeroSection.tsx`, `GalaxieSettingsPopover.tsx`, `severity-colors.ts`).
> Voraussetzung: keine — eigenständiger Polish-Plan; baut auf Galaxie Sprint G6 (`docs/plans/done/galaxie/galaxie-sprint-6-polish.md`) + Nova-2 Hero-Polish (`docs/plans/done/nova/nova-2-full-product.md`) auf.

---

## 1. Ziel

Die Landing-Hero-Repo-Galaxie (`RepoGalaxie.tsx`) wird auf Linear-Aesthetic-Niveau lesbar: Container-Ring statt matschiger Fill-Container, Folder-Header-Labels statt Stroke-Outline-Trick, Files icon-only mit ausgebautem Hover-Tooltip, calm Motion. Polish-Iteration #3 nach G6 + Nova-2.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID  | Runde | Frage                            | Antwort                                                                                  |
|-----|-------|----------------------------------|------------------------------------------------------------------------------------------|
| Q1  | 1.1   | Surface                          | **SVG-Galaxie (Desktop-Hero)** — `RepoTreeView` out-of-scope                              |
| Q2  | 1.2   | Change-Art                       | **Polish** — Galaxie-Idee behalten, Lesbarkeit/Abstände/Kontrast/Typografie überarbeiten   |
| Q3  | 1.3   | Haupt-Pain (multi)               | **Alle vier**: Lesbarkeit der Labels + Abstände/Layout-Dichte + Kontrast + Motion         |
| Q4  | 1.4   | Aufwand                          | **Multi-Session (>1 Tag, eigener Sub-Plan)** — ehrliche Polish-Phase, kein Quick-Win      |
| Q5  | 2.1   | Vorbild                          | **Linear-Aesthetic + Vercel-Files** — gedeckt, hochkontrastig, Mono-Labels, sparsame Motion |
| Q6  | 2.2   | Container-Stil                   | **Subtiler Ring + dezenter Tint (≤5% fill)** — Hierarchie via Outline + Padding           |
| Q7  | 2.3   | Label-Strategie                  | **Folder-Header oberhalb, Files Icon-only + Hover-Tooltip**                              |
| Q8  | 2.4   | Motion-Budget                    | **Calm** — Reveal-Stagger straffen, 1-Node-Pulse behalten, Hover 1.04→1.02                |
| Q9  | 3.1   | `labelMode`-Setting              | **Toggle entfernen, ein konsequenter Modus** — Migration der gespeicherten Preference     |
| Q10 | 3.2   | Files ohne Severity              | **Sphere mit zentralem File-Type-Codicon wenn Radius ≥ 14** — sonst plain Sphere          |
| Q11 | 3.3   | Mobile-Tree-View                 | **Nein — unverändert** — Tree-View ist sauber, out-of-scope                                |
| Q12 | 3.4   | Verifikation                     | **Dev-Server + manueller Walk-Through gegen Acceptance-Checkliste** — kein Playwright-Setup |

## 3. Existing-Patterns im Repo (Vorbild)

- `apps/web/src/components/landing/Sphere.tsx:67-78` — `labelFontSize()` ist clamped-by-radius, aber Files unter Radius 10 fallen auf `0` (Label verschwindet) → wir formalisieren das in einer Container-vs-Leaf-Strategie.
- `apps/web/src/components/landing/HoverTooltip.tsx:11-40` — bestehender In-SVG-Tooltip-Pattern mit `paintOrder: stroke` → wir bauen ihn auf alle Files aus (nicht nur Findings), mit Pfad + Severity + File-Type, und ersetzen den Stroke-Halo durch eine Pill (border + bg).
- `apps/web/src/lib/repo-galaxie/layout.ts:33-37` — `defaultPaddingForDepth(depth)` ist die zentrale Padding-Stellschraube → wir tunen dort, nicht in Sphere-Rendering.
- `apps/web/src/lib/galaxie/severity-colors.ts:13-20` — `SEVERITY_HEX` ist die Single-Source — alle neuen Outline/Pill-Farben werden von hier abgeleitet, keine Hex-Duplikate.
- `apps/web/src/app/globals.css` — OKLCH-Tokens + `--vk-radius-*` + `type-mono-*`-Utilities sind die Foundation; wir konsumieren sie via CSS-Variablen statt OKLCH-Werte hardzucoden.
- `docs/design/linear-aesthetic.md` — Style-Guide, treibt Farb-Kontraste + Mono-Label-Wahl.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Container-Transluzenz aufdrehen (0.14 → 0.35)** → Verworfen, weil der Outline-Trick bei Labels dann immer noch nötig wäre und die "matschig"-Wahrnehmung nicht löst (Q6).
- **Alt-B: Container ohne Kreis (nur als beschrifteter Bereich)** → Verworfen, weil semantic-zoom + parent-ghost-ring-Effekt einen sichtbaren Container-Anker brauchen, sonst kollabiert die Apple-Maps-Logik (Q6).
- **Alt-C: Adaptive Label-Skalierung mit Zoom** → Verworfen, weil komplexer + invariant über User-Scroll. Stattdessen: ein konsequenter Modus (Q9).
- **Alt-D: Treemap / Sunburst / Sourcegraph-Tree als Replacement** → Verworfen, weil "Polish" gewählt wurde, nicht "Re-Design" (Q2).
- **Alt-E: Playwright-Visual-Diff** → Verworfen, weil Playwright noch nicht eingerichtet ist und der Setup-Overhead (4-6h) im Polish-Budget verloren ist (Q12). Verifikation per Acceptance-Checkliste.
- **Alt-F: Atmosphärische Motion (Parallax + Idle-Drift)** → Verworfen, weil Calm-Modus gewählt (Q8) und Linear-Aesthetic gegen Magic-Effects spricht.

## 5. Endzustand

**Visuell:**
- Container-Spheres (Workspace/Customer/Repo/Submodule/Folder) sind im Ruhezustand: 1.5-2px sichtbarer Ring (`oklch(0.55 0 0)`, opacity 0.55) + Innen-Fill ≤5% (`oklch(0.30 0 0 / 0.05)`). Kein matschiger Gradient-Fill mehr.
- Container-Label sitzt **innerhalb** des Container-Rings als "Header"-Text oberhalb (Position-Y = `-radius + fontSize + 6`), Mono-Font-Variant für Folder/Repo, Sans für Workspace. Pill mit Background-`color-mix(var(--background) 80%, transparent)` + 1px-Outline statt `paintOrder: stroke`-Trick.
- File-Spheres ohne Severity: Gradient-Sphere (aktueller Look) **plus** zentrales File-Type-Codicon (TS/TSX/MD/JSON/YAML/MDC) wenn Radius ≥ 14; sonst nur Sphere-Dot. **Kein Text-Label, keine File-Type-Pille mehr im Rest-Zustand.**
- File-Spheres mit Severity: gleicher Render + Severity-Icon overlayed (aktueller `SeverityIcon`-Mechanismus), Severity-Outline mit `color-mix` auf 1.8px-Border, Glow-Halo nur auf 1 ausgewählter Sphere.
- Hover über jede Sphere (File ODER Container): Tooltip-Pill erscheint oberhalb mit Pfad (z.B. `apps/web/src/components/Foo.tsx`) + Severity-Badge wenn vorhanden + File-Type + Bytes. Pill hat echte `background-color` + `border` + `border-radius`, kein Stroke-Outline-Halo.
- Motion: Reveal-Delays von `[0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]` (depth-indexed) auf `[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]` halbiert. Hover-Scale 1.04 → 1.02. Active-Scale 1.05 → 1.03. Severity-Outline-Reveal-Delay 0.6s → 0.3s. Pulse + Zoom-Tween unverändert.
- Padding: `defaultPaddingForDepth` von `(20, 16, 8)` auf `(28, 22, 12)` — mehr Atemraum auf jeder Tiefe, dadurch sichtbar getrennte Hierarchie-Stufen.

**Settings:**
- `GalaxieSettings.labelMode` ist entfernt aus dem Type. `GalaxieSettingsPopover` zeigt nur noch `pulseOn` + `zoomSpeed` + `reducedMotionMode`. DB-Spalte `label_mode` in `/settings/galaxie` wird im Plan als deprecated markiert (NULL-able, nicht gelesen) — Migration zum vollständigen Entfernen ist eigener Plan.

**Code:**
- `Sphere.tsx` Container- und Leaf-Rendering sind klar getrennt; keine `containerOpacity`-Mischvariable mehr, sondern zwei Render-Pfade (`ContainerSphere` + `FileSphere`).
- `HoverTooltip.tsx` zeigt Pfad + Type + Severity + Bytes für **alle** Nodes (nicht nur Findings); Pill statt Stroke-Halo.
- `layout.ts` Padding-Funktion aktualisiert; Tests in `layout.test.ts` bleiben grün (Padding-Constants entkoppelt von Layout-Algorithmus).
- `RepoGalaxie.tsx`: `labelMode`-Prop entfernt, `REVEAL_DELAYS` ersetzt mit kürzeren Werten, sonst unverändert.
- `GalaxieSettingsPopover.tsx`: labelMode-Section raus.

**Tests grün:**
- `pnpm typecheck` ✓
- `pnpm test` ✓ — existierende Layout-Tests in `repo-galaxie/layout.test.ts` updated für neue Padding-Werte
- Acceptance-Checkliste (in §8) manuell durchgegangen am Dev-Server

## 6. Schritte

### Phase A — Foundation & Token-Mapping (~1.5h)

- [x] `apps/web/src/components/landing/Sphere.tsx` — Color-Konstanten am File-Anfang als named exports. Bewusste Entscheidung: SVG kann CSS-Variablen nicht direkt in OKLCH-Mix-Funktionen konsumieren, deswegen bleiben die OKLCH-Literale, werden aber als benannte Konstanten gebündelt (`COLOR_RING`, `COLOR_TINT`, `COLOR_LABEL_BG`, etc.) damit sie zentral änderbar sind und semantisch zum Token-System passen.
- [x] `apps/web/src/lib/repo-galaxie/layout.ts:33-37` — `defaultPaddingForDepth` von `(20, 16, 8)` auf `(28, 22, 12)`.
- [x] `apps/web/src/lib/repo-galaxie/layout.test.ts` — **kein Update nötig** (Drift-Befund: Tests assertieren nur Container-Invarianten + Determinismus, keine Padding-Werte).
- [x] `pnpm test` für layout.ts grün.

### Phase B — Container-Sphere-Refactor (~3h)

- [x] `apps/web/src/components/landing/Sphere.tsx` — Sphere in 2 interne Sub-Komponenten splitten: `ContainerSphereBody` + `FileSphereBody`, dispatch über `node.kind === 'file'` im exported `Sphere`-Wrapper.
- [x] `ContainerSphereBody`: `<circle>` mit COLOR_CONTAINER_TINT (5% Opacity) + COLOR_CONTAINER_RING + Ring-Opacity/Width-Variation. Kein Gradient mehr.
- [x] `ContainerSphereBody`-Label: Pill oberhalb (Position-Y = `-radius - 6 - pillHeight`). `<rect>` background `oklch(0.155 0.004 270)` (--background-Match) + `<text>` mit Mono/Sans per Kind. Font-size deterministisch: workspace 16/customer 14/repo 13/submodule 12/folder 11.
- [x] `FileSphereBody`: Gradient-Sphere bleibt, Severity-Outline + Glow-Halo + SeverityIcon-Pattern bleibt. **Neu**: zentrales File-Type-Codicon (FileCode2/FileJson/FileText/File) wenn `radius ≥ 14` UND keine Severity. Mapping in `FILE_TYPE_ICON`.
- [x] `FileSphereBody`: kein Text-Label, keine File-Type-Text-Pille mehr.
- [x] Hover-Interaktion bleibt; `labelMode`-Prop aus `Sphere`-Signature **atomar entfernt** (zog Phase-E-Teile vor, siehe Update §6.E).
- [x] **Update an verwandten Sites (atomar, weil Type-Constraint)**: `RepoGalaxie.tsx` – `labelMode` aus `GalaxieSettings`-Type + `DEFAULT_GALAXIE_SETTINGS` + Sphere-Prop-Übergabe raus; `GalaxieSettingsPopover.tsx` – Labels-Section raus + Header-Comment angepasst.

### Phase C — Hover-Tooltip-Ausbau (~2h)

- [x] `apps/web/src/components/landing/HoverTooltip.tsx` — Refactor: zeigt für **alle** Nodes (Container UND Files), nicht nur Findings.
- [x] **Plan-Drift-Befund**: `GraphNode.filePath` existiert bereits (`types.ts:37`); `build-from-audit.ts:77` setzt es schon; `demo-data.ts` hat es auf allen Files. Kein Type-/build-from-audit-/demo-data-Update nötig.
- [x] `HoverTooltip`-Rendering: Pill statt Stroke-Halo. `<rect>` rounded fill `oklch(0.155 …)` (--background-Match) + stroke `oklch(0.295 …)` (--border-Match); bei Severity wird der Border auf den Severity-Hex umgestellt + dickerer Stroke. 2-Zeilen: Pfad (`truncateLeft` auf 48 chars) + Sekundär-Zeile mit Kind + Type + Bytes + Severity-Counter.
- [x] HoverTooltip ist motion-frei → reduced-motion-safe by default.
- [x] `RepoGalaxie.tsx:387` — HoverTooltip-Render-Bedingung unverändert.

### Phase D — Motion-Calming (~1h)

- [x] `RepoGalaxie.tsx` — `REVEAL_DELAYS` von `[0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2]` auf `[0.0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48]` (atomar mit Phase B umgesetzt).
- [x] `Sphere.tsx` — `OUTLINE_DELAY_AFTER_REVEAL` 0.6 → 0.3; `GLOW_START_AFTER_REVEAL` 1.2 → 0.6.
- [x] `Sphere.tsx` — Hover-Scale 1.04 → 1.02; Active-Scale 1.05 → 1.03.
- [x] `Sphere.tsx` — Reveal-`duration` 0.7 → 0.5.
- [ ] Visuelle Verifikation am Dev-Server → Phase F.

### Phase E — Settings-Toggle entfernen (~1.5h)

- [x] `RepoGalaxie.tsx` — `labelMode` aus `GalaxieSettings`-Type + `DEFAULT_GALAXIE_SETTINGS` entfernt; Sphere-Prop-Übergabe entfernt (atomar in Phase B).
- [x] `Sphere.tsx` — `labelMode`-Prop + `labelVisible`-Logic raus; Folder-Header ist immer sichtbar, Files haben nie ein Text-Label (atomar in Phase B).
- [x] `GalaxieSettingsPopover.tsx` — Labels-SettingRow entfernt + Header-Comment angepasst.
- [x] `apps/web/src/app/[workspace]/settings/galaxie/page.tsx` — **Drift-Befund**: Page ist Placeholder ("Coming with nova-2-settings-backend"), hat KEIN labelMode-Form-Field. Kein Code-Update nötig. DB-Spalte (nova-2-settings-backend) noch nicht angelegt, daher auch keine Deprecation-Maßnahme nötig.
- [x] Kein localStorage-Persistierung für labelMode im aktuellen Code (Verified).

### Phase F — Acceptance-Walk + Polish-Schliff (~1h)

- [x] `pnpm typecheck` ✓
- [x] `pnpm test` (galaxie + landing) — 28 Tests grün
- [x] `pnpm --filter @vk/web build` — grün (nach Bonus-Fixes: `@vk/fixes/client` Subpath + `<Suspense>` um LoginForm — siehe §11 Out-of-Scope-Update unten)
- [x] Dev-Server läuft auf `http://localhost:3000` (lief bereits — HMR hat die Änderungen gepickt)
- [ ] Acceptance-Checkliste (§8) durch User-Walk-Through (pending — visuelle Verifikation ist User-Aufgabe)
- [ ] Reduced-Motion-Check durch User
- [ ] Dark-Mode-sanity-check durch User

## 7. Files-to-Change

| Datei                                                                       | Aktion | Was passiert                                                                                                |
|-----------------------------------------------------------------------------|--------|-------------------------------------------------------------------------------------------------------------|
| `apps/web/src/components/landing/Sphere.tsx`                                | EDIT   | Split in ContainerSphere + FileSphere; Ring-Style; Header-Label-Pill; File-Type-Codicon; Motion-Tuning      |
| `apps/web/src/components/landing/RepoGalaxie.tsx`                           | EDIT   | `labelMode` aus Type+Prop raus; `REVEAL_DELAYS` halbiert                                                     |
| `apps/web/src/components/landing/HoverTooltip.tsx`                          | EDIT   | Render für alle Nodes; Pill statt Stroke-Halo; Pfad + Type + Severity + Bytes                                 |
| `apps/web/src/components/landing/GalaxieSettingsPopover.tsx`                | EDIT   | labelMode-Section entfernen                                                                                  |
| `apps/web/src/lib/repo-galaxie/layout.ts`                                   | EDIT   | `defaultPaddingForDepth` auf (28, 22, 12)                                                                     |
| `apps/web/src/lib/repo-galaxie/layout.test.ts`                              | EDIT   | Test-Assertions an neue Padding-Werte                                                                        |
| `apps/web/src/lib/repo-galaxie/types.ts`                                    | EDIT   | `path?: string` Field auf `GraphNode` (falls noch nicht vorhanden — sonst skip)                              |
| `apps/web/src/lib/repo-galaxie/build-from-audit.ts`                         | EDIT   | `path` propagieren in built nodes                                                                            |
| `apps/web/src/lib/repo-galaxie/build-from-audit.test.ts`                    | EDIT   | Tests für `path`-Field                                                                                       |
| `apps/web/src/lib/repo-galaxie/demo-data.ts`                                | EDIT   | `path`-Field zu Demo-Nodes hinzufügen                                                                        |
| `apps/web/src/app/[workspace]/settings/galaxie/page.tsx`                    | EDIT   | labelMode-Form-Field entfernen aus UI                                                                        |

**KEINE neuen Files.** Markdown-Constraint aus CLAUDE.md eingehalten (nur dieser Plan).

## 8. Test-Plan

**Automatisch:**
- `pnpm typecheck` ✓ — Type-Sauberkeit, vor allem nach `labelMode`-Removal.
- `pnpm test` ✓ — alle bestehenden Vitest grün, insbesondere:
  - `apps/web/src/lib/repo-galaxie/layout.test.ts` (Padding-Werte updated)
  - `apps/web/src/lib/repo-galaxie/build-from-audit.test.ts` (Path-Field falls neu)
- `pnpm build` ✓ — Production-Build smoke-test, fängt SSR-Inkompatibilitäten.

**Manuell (Acceptance-Checkliste — am Dev-Server `pnpm --filter @vk/web dev`):**

Lesbarkeit:
- [ ] Folder-Labels (workspace/customer/repo/submodule/folder) sind in jeder Hierarchie-Tiefe einwandfrei lesbar — gegen den schwarz-grauen Background im Dark-Mode bei 100% Zoom.
- [ ] Folder-Label-Pill hat sichtbaren Background + Border, kein verschwommener Stroke-Halo-Effekt mehr.
- [ ] Files ohne Severity zeigen ein File-Type-Icon mittig wenn Sphere groß genug; bei winzigen Spheres bleibt nur die Sphere-Form ohne Icon-Clipping.
- [ ] Files mit Severity zeigen Severity-Icon mittig + farbigen Outline-Ring — Severity-Farbe (rot/orange/grün) klar gegen den Sphere-Gradient erkennbar.

Hover:
- [ ] Hover über eine Container-Sphere → Tooltip oberhalb zeigt Pfad + Anzahl Findings (falls Container Findings hat).
- [ ] Hover über eine File-Sphere ohne Severity → Tooltip zeigt Pfad + Type + Bytes.
- [ ] Hover über eine File-Sphere mit Severity → Tooltip zeigt Pfad + Severity-Badge + Type + Bytes.
- [ ] Tooltip-Pill hat Background + Border, ist auch bei dunklen Sphere-Hintergründen lesbar.
- [ ] Lange Pfade truncaten links: `…/components/landing/HeroSection.tsx`.

Abstände:
- [ ] Sichtbarer Atemraum zwischen Repo und Sub-Folders auf depth=0/1; Sub-Folder kleben nicht mehr am Repo-Rand.
- [ ] Files innerhalb eines Folders haben deutlich erkennbaren Padding zum Folder-Ring.

Motion:
- [ ] Reveal-Stagger ist subjektiv ≤500ms (statt zähem 1.2s) — Galaxie ist sofort "da", flackert nicht durch.
- [ ] Hover-Scale ist deutlich subtiler — kein Wackel-Effekt mehr beim hin-her-Bewegen.
- [ ] Pulse läuft auf max. 1 Sphere; rest der Galaxie ist visuell ruhig.
- [ ] Zoom-Tween in Folder rein/raus läuft unverändert mit Camera-Easing.

Settings:
- [ ] `GalaxieSettingsPopover` zeigt nur noch 3 Settings (Pulse, Zoom-Speed, Reduced-Motion).
- [ ] `/[workspace]/settings/galaxie` zeigt keine labelMode-Option mehr.
- [ ] Reduced-Motion (System-Pref auf "reduce") kappt alle Reveal-Animationen, Pulse, Hover-Scale.

Cross-Browser:
- [ ] Safari Desktop — SVG `paintOrder`-Replacement durch Pill-Background funktioniert.
- [ ] Chrome Desktop — Codicons rendern scharf.
- [ ] Firefox Desktop — Sphere-Gradient + Severity-Outline-Tween nicht jankig.

## 9. Risiken + Mitigation

| Risiko                                                                                              | Severity | Mitigation                                                                                                              |
|-----------------------------------------------------------------------------------------------------|----------|-------------------------------------------------------------------------------------------------------------------------|
| Header-Label-Pill innerhalb des Container-Rings kollidiert mit Sub-Children (überlappt File-Spheres) | Strong   | Padding-Topup um Header-Höhe (`Math.max(20, fontSize + 6)`) im Layout-Padding; Verifikation in Acceptance-Checkliste     |
| File-Type-Codicon-Render verschlechtert Sphere-Klarheit (zu busy) bei Findings-heavy Galaxien        | Mid      | Codicon nur bei `radius ≥ 14` UND ohne Severity (Severity-Icon hat Priorität); kein Overlap                              |
| HoverTooltip-Pill-Rendering ist langsamer als Stroke-Halo (zusätzlicher `<rect>` pro Hover)         | Weak     | Tooltip rendert nur 1× pro hovered Node; React-DOM hat keine 60fps-Last hier; Memo nicht nötig                            |
| `labelMode`-Removal bricht User mit gespeicherter Preference                                         | Weak     | DB-Spalte bleibt, Form ignoriert sie still; kein Crash, kein User-Visible-Bug. Sauberes Drop in eigenem Plan (siehe §11) |
| Padding-Aufweitung verkleinert sichtbare Spheres bei vielen Files → kleinere File-Spheres            | Mid      | Manuell in Acceptance-Checkliste prüfen — falls Spheres zu klein, Padding-Werte um 2-3 zurückfahren                       |
| `REVEAL_DELAYS`-Halbierung führt zu spürbarem "Sofort-Pop" statt cinematischem Reveal                | Weak     | Subjektive Wertung in Acceptance-Walk; einfach reversibel falls User die längere Variante bevorzugt                       |
| Reduced-Motion-Pfad bricht durch Refactor (z.B. Reveal-Initial-State sichtbar bei Reload)            | Strong   | Reduced-Motion-Conditional in jeder neuen `m.*`-Komponente erhalten; explizit in §6-F gegentesten                          |
| `path`-Field-Erweiterung in `GraphNode` bricht andere Konsumenten (Galaxie-PixiJS, Tests)            | Mid      | Field ist `optional` — kein Brechen von Konsumenten, die nur den Pflicht-Anteil lesen. TypeScript-Pass via `pnpm typecheck` |
| Container-Ring-Style verliert Apple-Maps-Tiefenwirkung (parent-ghost-ring-Effekt)                    | Mid      | `roleOpacity` (focus/descendant/ancestor/sibling)-Logik unverändert; Ghost-Effekt wirkt durch Opacity, nicht Fill           |

## 10. Rollout

- **Strategie:** Direkt-Merge in `main` nach Acceptance-Walk + green Tests/Build. Solo-Developer-Repo, kein Branch-Review nötig.
- **Pre-Deploy-Gates:**
  - `pnpm typecheck` grün
  - `pnpm test` grün
  - `pnpm build` grün
  - Acceptance-Checkliste (§8) komplett abgehakt am laufenden Dev-Server
  - Reduced-Motion-Pfad verifiziert
- **Post-Deploy-Verifikation:**
  - Production Landing-Page öffnen → Galaxie rendert, alle 12 Acceptance-Punkte gelten auch auf Vercel-Build.
  - Mobile: `RepoTreeView` (out-of-scope) unverändert, nicht regrediert.
- **Rollback-Trigger:**
  - Visual-Regression auf Production (Galaxie unleserlich / kollidierende Pills / Codicons clipping)
  - Hydration-Mismatch im Console-Log
  - Performance-Regression (CLS > 0.1, LCP > 2.5s) — checkbar in Vercel-Analytics
- **Rollback-Schritte:** `git revert <merge-commit>` → `git push`. Vercel rolled automatisch zurück auf den vorherigen Deploy. Plan zurück auf 🟡 In Review.

## 11. Out-of-Scope (V2 / separate Pläne)

- **Bonus-Fixes während Execute** (Sub-Step-Adjustment, User-bestätigt):
  - `packages/fixes/src/client.ts` + subpath-export `@vk/fixes/client` — entkoppelt pure functions (`isSupported`/`isDeterministicCategory`/`isLlmAugmentedCategory`) vom LLM/DB-bundle. `FindingsList.tsx` zieht jetzt nur den client-safe Pfad.
  - `apps/web/src/app/login/page.tsx` — `<Suspense>` um `<LoginForm>` (Next.js 16 erfordert das wegen `useSearchParams()` in CSR-bailout). Beide Fixes haben den blockierenden `pnpm build` auf grün gebracht.
- **Mobile-Tree-View-Polish** — `RepoTreeView` bleibt unverändert (Q11). Eigener Plan falls Tree-View-Update gewünscht.
- **DB-Spalte `label_mode` droppen** — Migration eigenständig (Q9): Spalte erst NULL-able machen, dann nach 1-2 Wochen DROP per Drizzle-Migration. Eigener Plan.
- **Playwright-Setup für Visual-Diff** — eigene Infrastruktur-Phase (Q12). Vorerst genügt manuelle Acceptance-Checkliste.
- **PixiJS-Galaxie im Workspace-Hub** — separates Surface (`apps/web/src/components/galaxie/*`), nicht Teil dieses Plans. PixiJS-Render verwendet anderen Code-Pfad.
- **Touch-Gestures für mobile Galaxie** — laut Sphere-G6-Plan auf Mobile gar nicht aktiv (Tree-View statt). Bleibt deferred.
- **Atmosphärische Motion (Parallax + Idle-Drift)** — bewusst abgelehnt (Q8, Alt-F), kein Folge-Plan vorgesehen.
- **Vollständig wiederverwendbarer `<Galaxie>`-Component** — Sphere/RepoGalaxie sind landing-spezifisch; falls die Polish-III-Renderlogik in den Workspace-Hub übernommen werden soll, eigener Refactor-Plan.

## 12. Open Questions (nur Post-Execute-Items)

(Idealerweise leer.)

- Falls in Phase B die Header-Pill den Sphere-Rand kollidieren lässt bei extremen Depths (>5) — fallback auf außen oberhalb? Wird im Execute entschieden basierend auf der visuellen Beobachtung. Nicht load-bearing.
- Demo-Daten in `demo-data.ts` haben aktuell vermutlich kein `path`-Field — Konstruktion eines plausiblen Demo-Pfads (z.B. `apps/web/src/lib/foo.ts` für File X) liegt im Execute, keine Architektur-Entscheidung.

## 13. Geschätzter Aufwand

- Phase A (Foundation): ~1.5h
- Phase B (Container-Refactor): ~3h
- Phase C (Hover-Tooltip-Ausbau): ~2h
- Phase D (Motion-Calm): ~1h
- Phase E (Settings-Cleanup): ~1.5h
- Phase F (Acceptance-Walk): ~1h
- **Gesamt: ~10h.** Empfehlung: **1 PR / 1 /execute-Run**. Multi-Session-Budget wurde gewählt (Q4), aber realistischer Scope passt in 1.5 Sessions ohne Split — Phasen sind Linear-Sequence, keine Sub-Pläne nötig.
