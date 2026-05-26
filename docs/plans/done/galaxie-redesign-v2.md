# Plan — Galaxie-Redesign V2: Nebula-Folder + Solid-Planet-File + Edge-Badge-Severity

> Erstellt: 2026-05-22
> Status: ✅ Done — 2026-05-26 (Confidence-At-Start: High; 6 Phasen + Iter-2 Follow-up abgeschlossen; alle Acceptance-Checks ✓)
> Slug: `galaxie-redesign-v2`
> Confidence: **High** — basiert auf 12 User-Entscheidungen (3 Runden Discovery, alle Recommended) + Code-Audit der Polish-III/IV/V-Iterationen (Sphere.tsx, RepoGalaxie.tsx, SeverityIcon.tsx, HoverTooltip.tsx, layout.ts).
> Voraussetzung: Baut auf `docs/plans/done/folder-tree-animation-redesign.md` (Polish III/IV/V) auf. Galaxie-Theme + Circle-Pack-Layout + Inspector-Architektur bleiben — nur die visuelle Behandlung der Spheres + die Severity-Position werden grundlegend neu gemacht.

---

## 1. Ziel

Die Landing-Hero-Galaxie wechselt von "matschiger generischer Sphere-Look mit zentralen Icons" zu einem **klar abgegrenzten Folder-vs-File-System**: Folder-Container sind atmosphärische Gas-Nebulas (kein harter Ring, weiches radiales Glow), Files sind solide 3D-Planeten mit echter Lichtquelle und subtilem File-Type-Tint, Severity sitzt als iOS-Style-Badge am 1-Uhr-Rand der Sphere (außerhalb, halb-überlappend) statt zentral. Aggressives Padding (60/44/28) gibt klaren Atemraum.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID  | Runde | Frage                                  | Antwort                                                                                              |
|-----|-------|----------------------------------------|------------------------------------------------------------------------------------------------------|
| Q1  | 1.1   | Visualisierungs-Paradigma              | **Circle-Pack-Galaxie bleibt** (Planeten/Galaxy-Vibes) — nur komplett überarbeitet                    |
| Q2  | 1.2   | Galaxie-Theme                          | **Theme bleibt** — Polish-Iteration, kein Paradigmen-Wechsel                                          |
| Q3  | 1.3   | Folder-vs-File-Trennung                | **Mehr Abstand + besseres Layout + Kontrast** — nicht andere Geometrie                                |
| Q4  | 1.4   | Severity-Indikator                     | **Icon bleibt, aber am Rand** — nicht zentral in der Sphere                                            |
| Q5  | 2.1   | Severity-Position konkret              | **Badge am 1-Uhr, halb überlappend** (iOS-Notification-Style)                                          |
| Q6  | 2.2   | Folder-Stil                            | **Gas-Nebula-Look mit subtilem Inner-Glow** (radial-gradient, kein harter Ring)                       |
| Q7  | 2.3   | File-Stil                              | **Solide 3D-Planeten-Sphere mit Lichtquelle** (oben-links Highlight) + dezenter File-Type-Tint        |
| Q8  | 2.4   | Padding-Niveau                         | **Aggressiv hoch**: depth-0=60, depth-1=44, depth-2+=28                                                |
| Q9  | 3.1   | Hover-Effekt                           | **Subtiler weicher Glow-Halo + minimale Scale (1.03)**                                                |
| Q10 | 3.2   | Folder-Label-Pill                      | **Größer + transparenter** (mehr Padding, backdrop-blur-Optik)                                         |
| Q11 | 3.3   | Default-Active-State                   | **Ein File mit Finding ist active** (file-claude-md), Inspector zeigt sofort                          |
| Q12 | 3.4   | Severity-Badge-Disc                    | **Disc = severity-color (gefüllt), kein Outline, Icon = weiß**                                         |

## 3. Existing-Patterns im Repo (Vorbild)

- `apps/web/src/components/landing/Sphere.tsx:18-65` — Polish-V-Konstantenblock + Gradient-Defs als Foundation. V2 erweitert das um per-language-Gradients + Nebula-Gradient-Variante.
- `apps/web/src/components/landing/Sphere.tsx` ContainerSphereBody + FileSphereBody — bestehende Splitting-Architektur bleibt, die internen Renderings werden ersetzt.
- `apps/web/src/components/landing/SeverityIcon.tsx:24-38` — Lucide-Icon-im-SVG-Pattern mit nested-svg + Severity-Mapping bleibt. Wird nur in Edge-Badge-Position aufgerufen, nicht mehr zentral.
- `apps/web/src/lib/repo-galaxie/layout.ts:33-37` — `defaultPaddingForDepth` als single source of truth für die Hierarchie-Abstände, V2 schraubt die Werte hoch.
- `apps/web/src/lib/galaxie/severity-colors.ts:13-20` — SEVERITY_HEX bleibt unverändert (User-Entscheidung Polish-V Iter-2). V2 nutzt diese Hex-Werte für die gefüllten Badge-Discs.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Komplettes Layout-Paradigma wechseln (Treemap / Tree-Browser / Vercel-Cards)** → Verworfen (Q1). User will Galaxie-Look behalten.
- **Alt-B: Folder als reine Outline-Spheres ohne Fill** → Verworfen (Q6). Inner-Glow gibt mehr Atmosphäre und Hierarchie-Klarheit.
- **Alt-C: Files mit Noise-/Procedural-Texture (SVG turbulence)** → Verworfen (Q7). Render-Cost zu hoch und nicht im Kern-Pain.
- **Alt-D: Severity-Badge mit Verbindungsstrich rechts neben Sphere** → Verworfen (Q5). Braucht zu viel Layout-Raum bei dicht gepackten Children.
- **Alt-E: Severity nur im Hover-Tooltip, nicht auf der Sphere** → Verworfen (Q4). User will die Severity zur Übersicht sofort sichtbar.
- **Alt-F: Hex-Palette neu definieren** → Verworfen (Polish-V Iter-2, persistent). Hex bleibt Single-Source für Galaxie + PixiJS-Workspace-Hub.

## 5. Endzustand

### 5.1 Folder-Container (workspace / customer / repo / submodule / folder)

- **Kein harter Outline-Ring mehr**. Stattdessen ein einziger `<circle>` mit `fill="url(#nebula-{kind})"` — ein radialer Gradient, der von außen (subtle warm-grey `oklch(0.22 0 0)` bei 8 % opacity) sanft nach innen (`oklch(0.04 0 0)` bei 100 %) verläuft. Wirkt wie ein dunkler Gas-Cocoon.
- Folder mit bubbled-up Severity bekommen einen **leicht severity-tinted Outer** (z.B. `color-mix(in oklch, ${severityColor} 8 %, oklch(0.22 0 0) 92 %)` als Gradient-Start). Ohne Severity bleibt es warm-grey-neutral.
- **Inner-Glow-Hint**: ein zweiter `<circle>` mit `r=radius-1`, `fill=none`, `stroke="oklch(0.85 0 0 / 0.10)"`, `strokeWidth=0.5` als sehr dezenter Hint-Ring (nur 10 % opacity). Macht den Folder-Boundary erkennbar ohne als harter Ring zu wirken.
- **Hover-Glow** (siehe 5.4) sitzt drüber.

### 5.2 File-Planet (file)

- **Echter 3D-Look** via radial-gradient mit verschobenem Light-Source-Center (`cx=30 %`, `cy=25 %`, `r=75 %`).
- Stops: 0 % = bright highlight (file-type-tint, light), 45 % = midtone (file-type-tint, mid), 100 % = dark shade (very dark with tint).
- **File-Type-Tint** als subtle hue-shift (Chroma ~0.04, dezent damit Files immer noch primär grau wirken):
  - `md` / `mdx` → cool-blue-grey (hue 240)
  - `ts` / `tsx` / `js` / `jsx` → cool-blue (hue 220)
  - `json` → warm-yellow-grey (hue 80)
  - `yaml` / `yml` → warm-red-grey (hue 30)
  - `mdc` → purple-grey (hue 290)
  - default / unknown → neutral grey (chroma 0)
- **KEINE Codicons mehr im Zentrum**. **KEINE Severity-Background-Disc im Zentrum mehr** (die wandert zur Edge-Position, siehe 5.3).
- Subtiler `stroke=oklch(0.95 0 0)` mit `strokeWidth=0.4` und `strokeOpacity=0.12` als hauchdünner Rim-Highlight (wirkt wie eine Planetenkante).

### 5.3 Edge-Badge Severity (gilt für File UND Container mit bubbled-up Severity)

- Position: relativ zum Sphere-Center, bei **30-Grad oberhalb der horizontalen Achse, rechts** (also rechts-oben, ca. 1-Uhr-Position auf einem Ziffernblatt). Mathematisch: `badgeX = node.radius * cos(-π/6)`, `badgeY = node.radius * sin(-π/6)` (oder einfach `badgeX = node.radius * 0.866`, `badgeY = -node.radius * 0.5`).
- Badge-Disc: gefüllt mit Severity-Color, **kein Border**. Radius `Math.min(14, Math.max(8, node.radius * 0.32))` — adaptiert an Sphere-Größe.
- Lucide-Severity-Icon innerhalb der Disc, in `oklch(0.98 0 0)` (fast weiß), stroke-Width 2.4, size = `discRadius * 1.3` (Icon füllt ~65 % der Disc-Diameter).
- Halb-überlappende Position bedeutet: ein Teil des Badge ragt über den Sphere-Rand hinaus → sehr klare visuelle Trennung von Sphere-Body und Severity-Indicator.
- **Pulse-Animation** für die ausgewählte Pulsing-Sphere (Kill > Weak): expandierender Halo um den BADGE (nicht mehr um den ganzen Sphere) — `<m.circle>` mit `r=discRadius+8` animate `r: [+4, +12, +4]`, fill-opacity `[0, 0.4, 0]`, duration 2.0s.

### 5.4 Hover-Effekt

- **Outer-Glow-Halo**: `<m.circle>` mit `r=node.radius+10`, `fill=oklch(0.98 0 0)`, `fillOpacity` animiert von 0 → 0.14 bei Hover, 0 → 0.20 bei Active. Subtle weicher weißer Schein.
- **Scale**: 1.0 → 1.03 bei Hover/Active (war 1.02/1.03 in Polish-V).
- Transitions: 180 ms ease-out.
- Reduced-Motion: beides aus.

### 5.5 Folder-Label-Pill

- Padding `paddingX = 18`, `paddingY = 8` (war `Math.max(6, fontSize*0.55)`, `4`).
- `border-radius = 8` (war 4).
- Background: `oklch(0.10 0 0 / 0.78)` mit zusätzlichem `stroke=oklch(0.45 0 0 / 0.35)` für subtilen Rand — wirkt wie ein semi-transparenter Glass-Pill (echtes backdrop-blur in SVG nicht möglich, aber visuell sehr nah).
- Font-Sizes bleiben aus Polish-IV (workspace 24 / customer 22 / repo 20 / submodule 17 / folder 16).
- Pill ist weiterhin click-target (Polish-IV-Verhalten beibehalten).

### 5.6 Padding & Layout

- `defaultPaddingForDepth`: depth-0 = 60, depth-1 = 44, depth-2+ = 28 (war 38 / 30 / 20). Schafft ~50 % mehr Atemraum auf allen Tiefen.
- Demo-Daten + d3-pack-Layout passen sich automatisch an die neuen Werte an.

### 5.7 Beibehaltene Mechanismen (kein Touch)

- `RepoGalaxie.tsx` pan/zoom/keyboard-Logic — unverändert (Polish-V-Werte bleiben: ZOOM_TARGET_FILL=0.82, ZOOM_SPEED_FACTOR.standard=4.5, Camera-Tween 0.18s).
- `HoverTooltip.tsx` Pill-Tooltip — unverändert (Polish-IV-Werte bleiben).
- `RepoInspector` + Inspector-Sheet-Mobile-Verhalten — unverändert.
- `BreadcrumbBar`, `RepoUrlPill`, `BlurOverlayCTA`, `SignUpTeaseDialog` — unverändert.
- `severity-colors.ts` SEVERITY_HEX — unverändert (Single-Source).
- `SeverityIcon.tsx` Mapping (AlertCircle für Kill, AlertTriangle für Weak/Mid, CheckCircle für Strong, Sparkles für Exceptional) — unverändert. Wird nur in neuer Edge-Position aufgerufen.
- Galaxie-Settings-Popover ist bereits in Polish-V entfernt — bleibt entfernt.

### 5.8 Tests grün

- `pnpm typecheck` ✓
- `pnpm test` ✓ — bestehende layout.test.ts + build-from-audit.test.ts bleiben grün (Layout-Algorithmus + Padding-Werte sind entkoppelt).
- Acceptance-Checkliste manuell durchgegangen (siehe §8).

## 6. Schritte

### Phase A — Foundation: Padding + Token-Konstanten (~40 min)

- [x] `apps/web/src/lib/repo-galaxie/layout.ts:33-37` — `defaultPaddingForDepth` von `(38, 30, 20)` auf `(60, 44, 28)`.
- [x] `apps/web/src/components/landing/Sphere.tsx` — Neue Konstantenblöcke (BADGE_*, FILE_TYPE_TINT_BY_LANG aka PLANET_BY_LANG, NEBULA_*, HOVER_GLOW_*).
- [x] `pnpm typecheck` + `pnpm test src/lib/repo-galaxie/` grün.

### Phase B — Folder-Nebula-Render (~1.5h)

- [x] `SphereGradientDefs`: `<radialGradient id="nebula-neutral">` + 5× `<radialGradient id="nebula-severity-{Kill|Weak|Mid|Strong|Exceptional}">`.
- [x] `ContainerSphereBody`: harter Ring + Tint entfernt; ersetzt durch nebula-fill + 0.5px Inner-Glow-Hint. Hit-Target bleibt.
- [x] Folder-Label-Pill: padding 18×8, rx 8, fill oklch(0.10 0 0)/0.78, stroke oklch(0.45 0 0)/0.35.

### Phase C — File-Planet-Render mit Lichtquelle (~1.5h)

- [x] `SphereGradientDefs`: 6× `<radialGradient id="planet-{md|ts|json|yaml|mdc|default}">` (cx=30 cy=25 r=75, 3 stops light/mid/shade).
- [x] `FileSphereBody`: sphere-${kind} entfernt → planet-${lang}; File-Type-Codicon entfernt; zentrale Severity-Disc + Outline entfernt; Rim-Highlight 0.4px ergänzt.

### Phase D — Edge-Badge Severity-Render (~1.5h)

- [x] `edgeBadgePosition(radius)` Helper.
- [x] `EdgeBadge` Komponente — gefüllte Severity-Disc (kein Border) + weißes Icon + Pulse-Halo um den Badge.
- [x] `FileSphereBody` + `ContainerSphereBody` rendern beide den EdgeBadge bei vorhandener Severity.
- [x] Alter Full-Sphere-Pulsing-Halo (m.circle r+16 mit severity-color) entfernt; Pulse läuft jetzt nur noch um den Badge.

### Phase E — Hover-Glow (~45 min)

- [x] `<m.circle r=radius+10 fill={COLOR_HOVER_GLOW}>` in beiden Bodies (außerhalb der scale-group), fillOpacity animiert 0/0.14/0.20.
- [x] Hover-Scale 1.03 / Active 1.04.

### Phase F — Acceptance-Walk + Polish-Schliff (~45 min)

- [x] `pnpm typecheck` grün.
- [x] `pnpm test src/lib/repo-galaxie/ src/lib/galaxie/` grün (28 Tests).
- [x] `pnpm --filter @vk/web build` grün (Compiled successfully in 22.5s).
- [x] Dev-Server-Live-Check (Server lief auf Port 3000).
- [x] Acceptance-Checkliste (§8) durch User-Walk-Through.

### Iter-2 Follow-up-Fixes (User-Feedback nach erster Acceptance-Runde, 2026-05-26)

User-Feedback aus erster visueller Verifikation: Badges visuell unterschiedlich groß (grüne größer als rote → "macht keinen Sinn"), File-Type-Tint kollidiert mit Severity-Signal ("Files mit roter Meldung haben unterschiedliche Farben"), 3D-Lichtquelle zu schwach, Padding bei depth-2 noch zu eng, Folder-Severity-Hue zu subtil.

- [x] Badge-Disc auf **uniform size = 11** (vorher adaptive 8–14 mit ratio 0.32). Severity ist kategorisch, nicht quantitativ → alle Badges lesen gleich.
- [x] **Severity-Files = neutral planet-default** (kein File-Type-Tint mehr bei Findings). Clean Files behalten subtilen Tint. Severity wird damit unmissverständlich: grauer Planet + farbiger Badge.
- [x] **3D-Lichtquelle verstärkt**: highlight 0.74 → 0.86, shade 0.18 → 0.08. Klarere Plastizität.
- [x] **Padding hochgezogen**: depth-1 44 → 52, depth-2+ 28 → 36. Mehr Atemraum zwischen Folders + Files.
- [x] **Folder-Severity-Nebula-Hue stärker**: outer-chroma 0.10 → 0.18 (Kill), 0.07 → 0.14 (Weak/Mid), 0.06 → 0.12 (Strong), 0.08 → 0.14 (Exceptional). Bubbled-up Severity auf Folders deutlicher.
- [x] Acceptance Iter-2: User-Verifikation ✓ ("Ja, passt jetzt").

**Out-of-Scope (V3 / eigener Plan)**: User wünscht zusätzlich Hero-Layout-Polish ("Audit dein Repo"-Button oben unpassend platziert) — fällt unter HeroSection-Polish, nicht unter Galaxie-Rendering.

## 7. Files-to-Change

| Datei                                                            | Aktion | Was passiert                                                                                       |
|------------------------------------------------------------------|--------|----------------------------------------------------------------------------------------------------|
| `apps/web/src/components/landing/Sphere.tsx`                     | EDIT   | Major-Rewrite: ContainerSphereBody = Nebula-Gradient, FileSphereBody = 3D-Planet, Edge-Badge-Severity, Hover-Glow, Folder-Label-Pill-Style |
| `apps/web/src/lib/repo-galaxie/layout.ts`                        | EDIT   | `defaultPaddingForDepth` → (60, 44, 28)                                                            |

**Bewusst NICHT touched:**
- `RepoGalaxie.tsx` (Pan/Zoom + Settings-Type bleiben Polish-V-Stand)
- `HoverTooltip.tsx`
- `SeverityIcon.tsx` (Icon-Mapping bleibt; wird nur in neuer Position aufgerufen)
- `severity-colors.ts` (Hex-Palette bleibt)
- `RepoInspector.tsx`, `BreadcrumbBar.tsx`, andere Hero-Sub-Components
- `RepoTreeView.tsx` (Mobile, weiterhin out-of-scope)

**KEINE neuen Files.** Markdown-Constraint aus CLAUDE.md eingehalten.

## 8. Test-Plan

**Automatisch:**
- `pnpm typecheck` ✓
- `pnpm test src/lib/repo-galaxie/ src/lib/galaxie/` ✓ — alle bestehenden Tests grün, keine neuen Tests nötig (Layout-Algorithmus bleibt; Style-Änderungen sind nicht unit-testable ohne snapshot-tests, die haben wir bewusst nicht).
- `pnpm --filter @vk/web build` ✓ (Smoke).

**Manuell (Acceptance-Checkliste — am Dev-Server `http://localhost:3000/`):**

Folder-Differenzierung:
- [ ] Folder-Spheres haben einen sichtbar weichen Nebula-Look (dunkles Zentrum, leicht heller Außen), KEIN harter Ring mehr.
- [ ] Folder mit bubbled-up Severity (z.B. Folder, in dem ein Kill-File liegt) haben einen subtilen Severity-Hue im Nebula-Outer.
- [ ] File-Spheres haben sichtbare 3D-Lichtquelle oben-links + dunkleren Schatten unten-rechts.
- [ ] File-Type-Tint subtil erkennbar (MD = leicht blau-grau, JSON = leicht warm-gelb, TS = leicht blau).

Severity-Badge:
- [ ] Severity-Icon sitzt als kleine gefüllte Disc am 1-Uhr-Rand der Sphere (rechts-oben), halb überlappend.
- [ ] Disc ist in Severity-Color gefüllt (rot/orange/grün), Icon ist weiß.
- [ ] Bei großen Spheres ist der Badge proportional größer, bei kleinen Spheres kleiner (clamped 8-14 viewBox-units).
- [ ] Kill-Severity hat Pulse-Animation um den Badge (NICHT mehr um den ganzen Sphere).
- [ ] Container-Spheres mit bubbled-up Severity haben auch ein Edge-Badge (nicht mehr nur der zentrale Outline-Ring).

Abstände:
- [ ] Sichtbar mehr Atemraum zwischen Repo und Sub-Folders, zwischen Folders auf Tiefe 1 und ihren Children.
- [ ] Keine Folder-Spheres die einander berühren oder eng aneinander kleben.

Folder-Label-Pill:
- [ ] Pills sind sichtbar größer (mehr Padding) und visuell "leichter" (transparenter Background).
- [ ] Pill ist weiterhin click-target.

Hover:
- [ ] Hover zeigt einen weichen weißlichen Glow-Halo um die Sphere + leichte Scale-Anhebung.
- [ ] Active-State Glow ist stärker als Hover-State.
- [ ] HoverTooltip funktioniert unverändert (Pill mit Pfad + Type + Bytes + Severity).

Click:
- [ ] File-Click ändert Inspector (Polish-IV-Fix bleibt).
- [ ] Folder-Click + Folder-Pill-Click zoomen in den Folder.
- [ ] ESC zoomt zurück.

Severity-Lesbarkeit:
- [ ] Severity-Bands klar differenzierbar (Rot/Orange/Grün) auch bei kleinen Spheres.
- [ ] Icon innerhalb des Badge klar lesbar gegen die gefüllte Severity-Color (weiß auf rot/orange/grün).

Reduced-Motion (User-OK-Check):
- [ ] Reveal-Stagger weg, Hover-Scale weg, Pulse weg, Camera-Tween instant.

## 9. Risiken + Mitigation

| Risiko                                                                                              | Severity | Mitigation                                                                                              |
|-----------------------------------------------------------------------------------------------------|----------|---------------------------------------------------------------------------------------------------------|
| Folder ohne sichtbaren Ring sind schwerer als Click-Target zu erkennen                              | Strong   | Hover-Glow + Folder-Label-Pill (klickbar) als Workaround. Hit-Target-Circle (Polish-IV) bleibt 28 viewBox-units. |
| File-Type-Tint kollidiert visuell mit Severity-Color am Badge                                       | Mid      | Tint hat Chroma 0.04 (sehr dezent), Severity-Badge ist außen am Rand auf eigener Disc — keine direkte Überlagerung. |
| Edge-Badge bei extrem kleinen Spheres (radius < 8) zu groß / clipping                               | Mid      | Disc-Radius geclamped `Math.max(8, radius * 0.32)`; bei sehr kleinen Spheres bleibt Badge sichtbar aber proportional. |
| Nebula-Gradient mit dynamischem Severity-Tint erfordert 5 zusätzliche `<radialGradient>` Defs        | Weak     | SVG-Defs werden einmal gerendert + via id wiederverwendet — kein Performance-Impact.                      |
| Render-Reihenfolge: Edge-Badge auf Container muss ÜBER eventuellen Child-Spheres sitzen             | Strong   | Badge sitzt innerhalb des Container-Sphere-`<g>`, nicht außerhalb. d3-pack-DOM-Order rendert Container vor Children → Children-Spheres ÜBER Container-Badge. Fix: Container-Edge-Badge muss am Ende des outer `<m.g>` gerendert werden, NACH dem inneren scale-`<m.g>`. Acceptance-Walk prüft visuelles Ergebnis. |
| Reduced-Motion-Pfad bricht durch neuen Glow-/Pulse-/Reveal-Code                                     | Strong   | Jeder neue `<m.*>` bekommt explizit `reducedMotion ? {duration:0}` Conditional. Acceptance-Walk testet System-Pref-Reduce. |
| 3D-Lichtquelle bei zu kleinen Files wirkt "matschig" (Gradient-Stops zu nah)                        | Weak     | Cmp gegen Demo-Daten: Files-Min-Radius im Demo ist ~12. Gradient bleibt erkennbar.                       |
| Aggressives Padding (60/44/28) verkleinert Files signifikant → Edge-Badge wirkt zu dominant         | Mid      | Badge-Disc auch geclamped (max 14). Bei zu kleinen Files: Acceptance-Walk + ggf. Disc-Max auf 12 zurück. |

## 10. Rollout

- **Strategie**: Direkt-Merge in `main` nach Acceptance-Walk + green Tests/Build. Solo-Developer-Repo, kein Branch-Review nötig.
- **Pre-Deploy-Gates**:
  - `pnpm typecheck` grün
  - `pnpm test src/lib/repo-galaxie/ src/lib/galaxie/` grün
  - `pnpm --filter @vk/web build` grün
  - Acceptance-Checkliste komplett (User-Walk-Through)
  - Reduced-Motion-Pfad verifiziert
- **Post-Deploy-Verifikation**:
  - Production Landing-Page öffnen → Galaxie rendert, alle Acceptance-Punkte gelten auch im Vercel-Build.
  - Mobile: `RepoTreeView` (out-of-scope) unverändert + nicht regrediert.
- **Rollback-Trigger**:
  - Visual-Regression auf Production (z.B. Severity-Badge unsichtbar / Folder-Spheres komplett unsichtbar)
  - Hydration-Mismatch im Console-Log
  - Performance-Regression (LCP > 2.5s)
- **Rollback-Schritte**: `git revert <merge-commit>` → `git push`. Vercel rolled automatisch zurück.

## 11. Out-of-Scope (V2 / separate Pläne)

- **Mobile-Tree-View-Polish** — `RepoTreeView` bleibt unverändert. Eigener Plan falls Tree-View-Update gewünscht.
- **PixiJS-Workspace-Hub** (`apps/web/src/components/galaxie/*`) — separates Surface, eigener Render-Pfad. Wenn Konsistenz mit Landing-Galaxie gewünscht → eigener Plan.
- **Reduced-Motion-Sanity-Check + Light-Mode-Sanity-Check** — Polish-IV-Deferred-Items, bleiben Edge-Cases.
- **Background-Stars-Layer** — aktuell vorhanden (`BackgroundStars.tsx`), bleibt unverändert. Falls "weg" gewünscht → eigener Mini-Plan.
- **Tooltip-Inhalts-Erweiterung** (z.B. Mini-Preview, Inline-Patch) — eigener Feature-Plan.
- **Pulse-Animation für mehr als 1 Sphere gleichzeitig** — bewusst out-of-scope (Polish-III-User-Entscheidung "max 1 Pulse" persistent).

## 12. Open Questions (nur Post-Execute-Items)

(Idealerweise leer.)

- File-Type-Tint-Werte sind im Plan als allgemeine Hue-Angaben definiert (240/220/80/30/290). Die exakten OKLCH-Lightness/Chroma-Werte pro Stop (light/mid/dark) werden im Execute auf Basis von visueller Verifikation fein-getuned. Keine Architektur-Entscheidung.
- Bei extrem dichten Layouts (>30 Files in einem Folder) könnte das Padding (60/44/28) zu viele kleine Spheres erzeugen → Acceptance-Walk prüft Demo + ggf. Anpassung im Execute. Demo-Daten haben 15 Files in 12 Folders, typischer Audit-Case 50-150 Files in 30-50 Folders.

## 13. Geschätzter Aufwand

- Phase A (Foundation): ~0.5h
- Phase B (Folder-Nebula): ~1.5h
- Phase C (File-Planet): ~1.5h
- Phase D (Edge-Badge): ~1.5h
- Phase E (Hover-Glow): ~0.75h
- Phase F (Acceptance-Walk): ~0.75h
- **Gesamt: ~6.5h.** Empfehlung: **1 PR / 1 /execute-Run**, da die Phasen visuell stark interagieren und Sub-Pläne mehr Overhead als Sicherheit bringen würden.
