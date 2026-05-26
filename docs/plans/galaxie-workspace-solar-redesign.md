# Plan — Galaxie-Workspace-Redesign: Sonnensystem-pro-Folder + Asymm-Severity + Calm-by-Default

> Erstellt: 2026-05-26
> Status: 📋 Draft — bereit für /execute
> Slug: `galaxie-workspace-solar-redesign`
> Confidence: **High** — basiert auf 12 User-Entscheidungen (3 Runden Discovery, alle Recommended), Code-Audit von `GalaxieScene.tsx` (872 LOC) + `RepoGalaxie.tsx` (406 LOC), und 12 parallelen Web-Research-Agents (Linear/Stripe/Vercel/Cursor, Sci-Fi-Game-Maps Stellaris/EVE/Mass-Effect/ES2, Astronomy-Tools Stellarium/Gaia-Sky/NASA-Eyes, Codebase-Visualizer CodeFlower/CodeScene/Wattenberger, Hierarchy-Patterns d3.pack/Voronoi/Icicle, Severity-Encoding Snyk/SonarQube/Lighthouse, Tufte/Few/Victor-Prinzipien, Coleran/Territory-FUI, R3F/PixiJS-v8 Tech-Stack, Mobile-Map-UX, Alternative-Metaphern, Datadog/Mapbox/Figma-Layered-Patterns).
> Voraussetzung: Baut auf `docs/plans/done/galaxie-redesign-v2.md` (Landing-Hero V2) auf — Severity-Hex bleibt Single-Source, Lucide-Icon-Mapping wird übernommen. Workspace-Hub (`apps/web/src/components/galaxie/*`) ist seit V2-Out-of-Scope dieses Plans Owner.

---

## 1. Ziel

Die Workspace-Audit-Galaxie wechselt von **"frei schwebende Planeten in 5 verschiedenen Severity-Hues mit always-on Glow + Pulse + Labels"** zu einem **strukturierten Sonnensystem-Modell mit Calm-by-Default-Severity**:

- **Repo = Sonne**, Top-Folder + Root-Files = Planeten auf konzentrischen Orbits. Reinzoomen auf einen Folder-Planet pivotiert ihn rekursiv zur neuen Sonne (Galaxy → System → Subsystem).
- **Asymmetrische Severity-Salienz**: nur Kill schreit (sattes Rot + Pulse), Weak gedämpft, Mid neutral-grau (Anker), Strong leiser Teal-Tint, Exceptional 1px Indigo-Outline. Linear/Cursor/Zed-Pattern.
- **Calm-by-Default**: Edges erst on-hover, Labels erst on-hover, Pulse nur Kill, kein always-on Glow.
- **Datadog-Pivot statt Modal**: Click zentriert Planet, dimmt Rest auf 0.15, slidet Side-Panel von rechts ein. Spatial-Memory bleibt erhalten.
- **Mobile ≤768px = List-View**: sortier-/filterbare Severity-Liste mit Bottom-Sheet-Drill, Galaxie nur als optionaler "Galaxy-Mode"-Tab. GitHub-Mobile-Pattern.

Tech-Stack bleibt **PixiJS v8 + GSAP** (kein R3F-Bundle-Tax, kein 2026-Migrationsrisiko). Renderer-Migration zu R3F bleibt als Nova-3+-Option offen.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID  | Runde | Frage                              | Antwort                                                                                              |
|-----|-------|------------------------------------|------------------------------------------------------------------------------------------------------|
| Q1  | 1.1   | Scope: welche Galaxie?             | **Workspace zuerst, Landing in Folge-Phase** (Landing-V2 ist frisch, Workspace ist der eigentliche Pain) |
| Q2  | 1.2   | Struktur-Pattern                   | **Sonnensystem-pro-Folder** (akademisch validiert Graham 2004, behält Planeten 100 %, Galaxy→System→Detail) |
| Q3  | 1.3   | Severity-Strategie                 | **Asymmetrische Salienz** — nur Kill schreit (Linear/Cursor/Zed), kein 5-Hue-Bunt-Trap                |
| Q4  | 1.4   | Default-State                      | **Calm** — Severity-Farbe + Edges + Labels nur on-hover/select (Datadog+Cytoscape+Mapbox-Pattern)    |
| Q5  | 2.1   | Sonnensystem-Mapping               | **Repo = Sonne**, Top-Folder + Root-Files = Planeten auf Orbits, rekursiv bei Zoom-In                |
| Q6  | 2.2   | Renderer                           | **PixiJS v8 bleibt** — Orbits + Severity-Polish in-place, kein R3F-Migrationsrisiko in Phase-1       |
| Q7  | 2.3   | Mobile-Strategie                   | **List-View-First ≤768px**, Galaxie nur ≥768px (Apple-HIG-44pt + GitHub-Mobile-Pattern)              |
| Q8  | 2.4   | Phase-1-Scope                      | **Core-Set**: Sonnen + Orbits + Asymm-Severity + Edge-Rendering + Calm-Default. EXCL: Semantic-Zoom-Cutoffs, Filter-Chips, Saved-Views, Mini-Map-Update, Search-Update |
| Q9  | 3.1   | Sub-Phasen-Schnitt                 | **3 Sub-Phasen** — A Layout → B Severity → C Edges+Hover                                              |
| Q10 | 3.2   | Hover/Select-Mechanik              | **Datadog-Pivot** — Click zentriert, dimmt Rest auf 0.15, Side-Panel slidet von rechts ein            |
| Q11 | 3.3   | Edge-Render                        | **Hierarchie-Edges nur on-hover** (Wattenberger-Repo-Visualizer-Pattern)                              |
| Q12 | 3.4   | Rollout                            | **Hard-Replace** — alte `GalaxieScene.tsx`-Innereien werden ersetzt, no Feature-Flag                  |

## 3. Existing-Patterns im Repo (Vorbild + zu Touch)

- **`apps/web/src/components/galaxie/GalaxieScene.tsx`** (~872 LOC) — Master-Komponente. PixiJS-World mit CustomerStar / RepoMoon / FileAsteroid-Klassen, GSAP-Pulse/Hover, GlowFilter. Wird Major-Rewrite (siehe §7).
- **`apps/web/src/components/galaxie/StaticGalaxieSVG.tsx`** — Reduced-Motion-Fallback. Muss parallel auf Sonnensystem-Layout umgestellt werden.
- **`apps/web/src/lib/galaxie/types.ts`** — `GalaxieData`, `LayoutNode`, Severity-Bänder. Erweiterung um `FolderNode`-Variante (heute fehlt die explizite Folder-Ebene).
- **`apps/web/src/lib/galaxie/severity-colors.ts`** — `SEVERITY_HEX` Single-Source. Wird auf neue OKLCH-Skala umgestellt (siehe §5.3).
- **`apps/web/src/components/landing/SeverityIcon.tsx`** (V2) — Lucide-Mapping (Kill=AlertCircle/octagon-x, Weak=AlertTriangle, Mid=minus-circle, Strong=CheckCircle, Exceptional=Sparkles). Pattern wird via PIXI-Texture-Render in Workspace übernommen.
- **`apps/web/src/components/galaxie/UniversalSearch.tsx`** — bleibt unverändert (Out-of-Scope Phase-1).
- **`apps/web/src/components/galaxie/MiniMap.tsx`** — bleibt unverändert in Phase-1 (Anpassung an Sonnensystem in Folge-Phase).
- **`apps/web/src/components/galaxie/RepoInspector.tsx`** (oder äquivalentes Panel) — wird zum **Datadog-Pivot-Panel** umgebaut (slidet von rechts statt Modal).

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Constellation-Lines (freie Planeten + Folder-Outline-Linien)** → Verworfen (Q2). Bei tiefer Verschachtelung Linien-Spaghetti-Risiko, Struktur weniger zwingend.
- **Alt-B: Hex-Sektoren-Overlay (Stellaris-Style)** → Verworfen (Q2). Layout-Algorithmus (Voronoi-zu-Hex) ist disproportionaler Engineering-Aufwand für Solo-Dev-Cut.
- **Alt-C: Circle-Pack-Pivot (Workspace wird Treemap statt Galaxie)** → Verworfen (Q2). Galaxie-Identität als USP-Element verloren; Treemap ist Pack-View-Material für Folge-Phase als Sekundär-Vis.
- **Alt-D: R3F-Migration (3D-Kamera-Tilt, Bloom-Postprocessing)** → Verworfen (Q6). ~150 kB Bundle-Tax + ~3–5 Tage Voll-Refactor disproportional zum Schmerz-Niveau. Bleibt offen für Nova-3+.
- **Alt-E: SVG+motion für beide Surfaces** → Verworfen (Q6). >500 sichtbare Files = Reflow-Hölle auf Mobile/Mid-Range-Desktop.
- **Alt-F: Severity als 5 OKLCH-Bänder voll sichtbar (mit Icon-Redundanz)** → Verworfen (Q3). Linear/Stripe/Vercel/Cursor-Anti-Pattern: 5 sichtbare Hues = "Bunt-Trap", kein visueller Anker.
- **Alt-G: Mono + 1 Akzent, Severity nur über Größe/Helligkeit** → Verworfen (Q3). Differenzierung bei Mid/Weak schwer, würde Lucide-Icon-Redundanz erzwingen aber Asymm-Salienz tut das eleganter.
- **Alt-H: Semantic-Zoom mit harten Layer-Cutoffs (Mapbox-Style)** → Verworfen für Phase-1 (Q8). Killer-Pattern für Folge-Phase, aber Phase-1 fokussiert Foundation.
- **Alt-I: Folder = Sonne (4-Ebenen-Hierarchie Customer→Repo→Folder→File)** → Verworfen (Q5). 4 Ebenen kognitiv schwerer; Repo=Sonne ist kompromisslos klarer Ankerpunkt.
- **Alt-J: Customer = Sonne (2-stufiger Zoom-Switch)** → Verworfen (Q5). Galaxy-Overview wird zu leer, zweistufiger Mental-Switch erhöht Time-to-Insight.
- **Alt-K: Mobile-Galaxie mit Cursor-Snap (No-Man's-Sky-Switch-Pattern)** → Verworfen (Q7). WCAG 2.5.1 Risk (Single-Point-Alternative für Pinch-Zoom), und GitHub-Mobile-Pattern (Liste statt Tree-Vis) ist die ehrlichere Lösung für ≤375 px.
- **Alt-L: Feature-Flag GALAXIE_V3=true** → Verworfen (Q12). Solo-Dev, kein Live-Traffic-Risiko, kein Stakeholder-Demo-Bedarf. Dual-Code-Pflege = Tech-Debt.
- **Alt-M: Modal-Inspector statt Side-Panel-Pivot** → Verworfen (Q10). Bricht Spatial-Memory, das Datadog explizit als Anti-Pattern dokumentiert.

## 5. Endzustand

### 5.1 Repo-Sonne

- **Position**: Zentrum des aktuellen Zoom-Frames (für gewählten Repo-Knoten).
- **Body**: PixiJS-Sprite, Radius 28 (war RepoMoon 7–24). Body-Render via Graphics-API mit 3 konzentrischen Layers:
  - Inner-Core: `oklch(0.92 0 0)` (off-white), Alpha 1.0, Radius 0.45×.
  - Mid-Halo: `oklch(0.55 0 0)` (mid-grey), Alpha 0.45, Radius 0.75×.
  - Outer-Corona: `oklch(0.20 0 0)` (deep-grey), Alpha 0.18, Radius 1.0×.
- **Keine Severity-Farbe auf der Sonne**. Sonne aggregiert, signalisiert nicht. Severity wird auf den Planeten gezeigt.
- **Optional Sonnen-Aggregat-Badge** (Edge-Position 1-Uhr, Landing-V2-Pattern konsistent): zeigt höchste Severity unter den Children als kleines weißes Icon auf farbiger Disc — aber nur wenn `worstChildSeverity === Kill`. Sonst kein Badge auf der Sonne.
- **Hover-Effekt**: Outer-Glow-Halo (Alpha 0 → 0.14, 200 ms) + Orbits werden sichtbar (siehe §5.2).

### 5.2 Orbits

- **PixiJS.Graphics-Linien**, dünn (lineWidth 0.5), kreisförmig um die Sonne.
- **Default-Alpha**: 0.0 (unsichtbar).
- **On-Hover-Sonne**: alle Orbits fade-in zu Alpha 0.18 (200 ms ease-out). On-Hover-Out: fade-out zu 0.0.
- **Radien**: Orbit-1 = 60, Orbit-2 = 95, Orbit-3 = 130 (in Local-Repo-Space, Sonne ist Origin). Bei >3 Orbits werden zusätzliche im 35-Schritt-Abstand angefügt.
- **Severity-On-Selected**: Wenn ein einzelner Planet selektiert ist, leuchtet **nur sein Orbit** auf Alpha 0.30 (statt aller).
- **Reduced-Motion**: Orbits sind permanent sichtbar bei Alpha 0.10 (kein Fade).

### 5.3 Planeten (Folder + File)

#### 5.3.1 Folder-Planet

- **Radius**: 8 (zwischen Sonne 28 und File 4).
- **Body**: 3D-Light-Source-Gradient via PixiJS-Texture (oben-links Highlight, unten-rechts Shade), Default-Fill `oklch(0.70 0 0)` (neutral-grey).
- **Position auf Orbit**: deterministisch sortiert nach Folder-Name (gleicher Hash → gleiche Position, damit re-renders nicht hin-und-her-springen).

#### 5.3.2 File-Planet

- **Radius**: 4 (deutlich kleiner als Folder).
- **Body**: gleicher 3D-Gradient wie Folder, aber kleiner.
- **Position auf Orbit**: gleicher Sort wie Folder; Files auf höchstem Orbit (außen), Folder auf inneren Orbits.

#### 5.3.3 Severity-Encoding (Asymmetrische Salienz, OKLCH)

| Band         | Default-Fill                         | Pulse | Glow-Halo | Edge-Badge-Icon (Lucide) |
|--------------|--------------------------------------|-------|-----------|--------------------------|
| Kill         | `oklch(0.58 0.20 25)` — sattes Rot   | Ja, 1.6 s yoyo (scale 1.0 ↔ 1.12) | Ja, 6 px Bloom in Severity-Color | `octagon-x` weiß |
| Weak         | `oklch(0.70 0.13 55)` — Orange (gedämpft) | Nein  | Nein      | `triangle-alert` weiß |
| Mid          | `oklch(0.68 0.02 250)` — neutral-blau-grau (Anker) | Nein  | Nein      | `minus-circle` weiß |
| Strong       | `oklch(0.74 0.06 165)` — leiser Teal-Tint | Nein  | Nein      | `check-circle` weiß |
| Exceptional  | `oklch(0.70 0 0)` neutral + 1 px Stroke `oklch(0.62 0.14 270)` Indigo | Nein  | Nein      | `sparkles` weiß |
| (Dismissed)  | `oklch(0.40 0 0)` Dark-Grey, Alpha 0.35 | Nein  | Nein      | — |

**Begründung**: Lightness 0.58–0.74 ist ein schmales Band → keine Stufe wirkt durch reine Helligkeit "lauter" außer Kill (dunkler + max Chroma 0.20). Chroma-Sprung Kill 0.20 → Rest ≤ 0.13 schafft die Asymmetrie. Mid bei Chroma 0.02 ist quasi-neutral → echter "Anker". Teal (165°) und Indigo (270°) für Strong/Exceptional umgehen die Rot-Grün-Achse → Deuteranopie-safe. Exceptional als Outline-only signalisiert "rare/special", nicht "noch besser als Strong".

#### 5.3.4 Edge-Badge-Severity (konsistent zu Landing-V2)

- Position relativ zum Planet-Center: 1-Uhr (`badgeX = radius * 0.866`, `badgeY = -radius * 0.5`).
- Badge-Disc: gefüllt mit Severity-Color (siehe Tabelle), uniform Radius 5 (kein adaptiver Sizing — kategorisch, nicht quantitativ).
- Lucide-Icon innerhalb der Disc, weiß, Stroke-Width 2.0, Icon-Size 6.
- Half-überlappend mit Planet-Rand.
- **Mid bekommt KEIN Edge-Badge** (Mid ist Anker, nicht "Issue"). Edge-Badge nur für Kill/Weak/Strong/Exceptional.

### 5.4 Edges (Hierarchie nur on-hover)

- **Default**: keine Edges sichtbar.
- **On-Hover-Sonne**: alle Edges Sonne → direkte Children fade-in (Alpha 0 → 0.15, 200 ms).
- **On-Hover-Planet**: einzelne Edge Planet → Sonne fade-in (Alpha 0 → 0.25, 200 ms).
- **On-Select-Planet**: Edge zur Sonne bleibt sticky bei Alpha 0.30 (siehe §5.6).
- **Edge-Stil**: PixiJS.Graphics dünne Linie (lineWidth 0.5), gerade Verbindung (keine Curves in Phase-1 — Curves sind Folge-Polish).
- **Reduced-Motion**: alle Edges permanent sichtbar bei Alpha 0.10.

### 5.5 Calm-Default-Layer

Was im Default-State (kein Hover, kein Select) sichtbar ist:

- ✅ Sonne (Body-Layers, kein Hover-Glow)
- ✅ Planeten in Severity-Fill (asymm-Variante, also Mid/Weak/Strong/Exc fast neutral, nur Kill sticht raus)
- ✅ Edge-Badges (Lucide-Icons in Severity-Disc) **außer Mid**
- ✅ Kill-Planeten pulsen (1 von 5 Bändern hat Pulse → ehrliches "Hier ist was kaputt"-Signal)
- ❌ Orbits — invisible
- ❌ Edges — invisible
- ❌ Labels (File-Path, Folder-Name) — invisible
- ❌ Hover-Glow-Halos
- ❌ Tooltips

Was bei Hover hinzukommt:

- Orbits (wenn Sonne gehovered) oder einzelne Edge-zur-Sonne (wenn Planet gehovered)
- Tooltip-Pill (File-Path · Severity · Findings-Count)
- Hover-Glow-Halo um den Knoten (subtle, Alpha 0.14)
- Planet skaliert auf 1.08

Was bei Select/Click hinzukommt:

- Knoten zentriert smooth (GSAP 400 ms ease-out)
- Rest-Galaxie dimmt auf opacity 0.15 (Sonne + alle anderen Planeten + Orbits)
- Selected-Knoten + dessen Edge zur Sonne bleiben volle Opacity
- Right-Side-Panel slidet ein (siehe §5.6)
- Sticky-State bis ESC oder Click-Outside

### 5.6 Datadog-Pivot Side-Panel

- **Position**: rechts, slide-in von rechts.
- **Breite**: 380 px Desktop, 100 % Mobile (aber Mobile = List-View, also nicht zutreffend).
- **Höhe**: full-height des Workspace-Containers.
- **Inhalt**:
  - Header: File-Path oder Folder-Name + Severity-Badge (Lucide-Icon + Label).
  - Severity-Breakdown (wenn Folder): "12 Kill · 47 Weak · 89 Strong" als klickbare Chips → filtern Findings-Liste im Panel.
  - Findings-Liste (wenn File): Liste mit Rule-Name, Severity, Description, Source-Link (Zeile im File).
  - Actions: "Open in IDE" (deep-link `vscode://file/{absPath}:{line}`), "Mark as Dismissed", "Copy Path".
- **Animation**: 240 ms ease-out slide-in. Reduced-Motion → instant.
- **Close**: X-Button im Panel-Header, ESC-Key, Click-Outside-Detection.

### 5.7 Mobile-List-View (≤768 px)

- **Default-Render**: List statt Galaxie (Galaxie wird gar nicht gemountet, kein PixiJS-Init).
- **Layout**: full-width Liste, virtual-scrolled (`@tanstack/react-virtual` falls noch nicht im Repo, sonst native scroll).
- **Sortierung**: default by Severity DESC (Kill zuerst). Sortier-Header oben mit Severity / Folder-Path / Last-Changed-Toggles.
- **Filter-Chips** (Persistent oben): Severity-Multi-Select (Kill/Weak/Mid/Strong/Exceptional), Folder-Type-ahead-Search (1 zentrales Input).
- **Row-Layout**: `[Severity-Badge-Disc] [Folder-Path / File-Name] [Last-Audit-Time]` — 44 pt Höhe (Apple-HIG-Target).
- **Tap auf Row**: öffnet Bottom-Sheet (`presentationDetents([.medium])`) mit Findings-Liste + Actions.
- **Optional Galaxy-Mode-Tab**: für iPad-Landscape ein Toggle in Toolbar `[Liste | Galaxie]`. Tab-Switch unmounted Liste → mountet Galaxie (oder umgekehrt).
- **A11y**: Liste ist Source-of-Truth fürs A11y-Tree auch auf Desktop (`aria-hidden` auf Galaxie + parallele Listen-Repräsentation in DOM, visuell hidden via `sr-only`).

### 5.8 Reduced-Motion-Fallback (`StaticGalaxieSVG.tsx`)

- Wird umgestellt auf Sonnensystem-Layout: SVG-Render mit deterministischen Sonne + Orbit-Linien + Planeten.
- **Orbits permanent sichtbar** bei Alpha 0.10 (kein Hover-Reveal).
- **Edges permanent sichtbar** bei Alpha 0.10 (kein Hover-Reveal).
- **Kein Pulse**, **kein Hover-Glow**, **kein Pivot-Tween** — Click öffnet sofort das Side-Panel (kein Center-Tween).
- Identische Daten wie PixiJS-Version, identische Severity-Palette + Lucide-Icons als inline-SVG.

### 5.9 Beibehaltene Mechanismen (kein Touch in Phase-1)

- **`UniversalSearch.tsx`** — bleibt funktional unverändert (Anpassung an Sonnensystem-Result-Layout in Folge-Phase).
- **`MiniMap.tsx`** — bleibt funktional unverändert (Sonne wird nur als Punkt gerendert, Orbits nicht im MiniMap).
- **Keyboard-Shortcuts ⌘0–4** — bleiben (Zoom-Snaps werden auf neue Layout-Coords angepasst).
- **Pan/Wheel/Pinch via `@use-gesture/react`** — bleiben unverändert.
- **`severity-colors.ts` SEVERITY_HEX** — wird auf neue OKLCH-Werte umgestellt (siehe §5.3.3), aber Single-Source-Pattern bleibt.

### 5.10 Tests grün (Acceptance Bottom-Line)

- `pnpm typecheck` ✓
- `pnpm test apps/web/src/lib/galaxie/` ✓
- `pnpm --filter @vk/web build` ✓
- Acceptance-Walk auf `http://localhost:3000/[workspace]` (§8) komplett.

## 6. Schritte / Sub-Pläne

Master-Plan + 3 Sub-Pläne (Standard-Pattern: bei /execute jeweils via /plan-Discovery angelegt, wenn Sub-Phase startet — Realitäts-Check vor jeder Phase).

### Sub-Phase A — Layout-Foundation: Sonne + Orbits + Planet-Positionen (~3–4 h)

**Slug**: `galaxie-workspace-solar-A-layout`

- Datenmodell: `apps/web/src/lib/galaxie/types.ts` — `FolderNode` einführen, Repo-Children als `(FolderNode | FileNode)[]` typisieren.
- Layout-Berechnung: neue `apps/web/src/lib/galaxie/solar-layout.ts` — deterministisches Layout: Sonne = (0,0), Orbits 60/95/130, Children sortiert by Hash auf Orbits verteilt.
- `GalaxieScene.tsx`: alte `CustomerStar` / `RepoMoon` / `FileAsteroid`-Klassen ersetzt durch `RepoSun` / `OrbitRing` / `FolderPlanet` / `FilePlanet`. Default-Renders ohne Severity-Farbe (alles neutral-grey), ohne Edges, ohne Hover. **Pure Layout-Stufe — keine Severity-Polish, keine Interaktion.**
- `StaticGalaxieSVG.tsx`: gleiche Layout-Umstellung in SVG (parallel).
- Acceptance A: Galaxie rendert Sonnensystem-Layout, alle Knoten neutral-grey, Orbits/Edges/Labels alle unsichtbar.

### Sub-Phase B — Asymm-Severity-Palette + Edge-Badges + Default-Calm (~2.5–3 h)

**Slug**: `galaxie-workspace-solar-B-severity`

- `severity-colors.ts` — neue OKLCH-Werte (§5.3.3), `SEVERITY_HEX` Single-Source aktualisiert.
- Planet-Render: Severity-Fill nach asymmetrischer Skala anwenden. Kill-Pulse via GSAP-Tween (1.6 s yoyo).
- Edge-Badge-Render in `RepoSun` / `FolderPlanet` / `FilePlanet`: Lucide-Icon-Mapping via PIXI-Texture (z.B. `RenderTexture` aus rasterisierter SVG, einmal cached). 1-Uhr-Position, uniform Disc-Radius 5, weißes Icon.
- `StaticGalaxieSVG.tsx` parallel: gleiche Severity-Palette + inline-SVG-Icons.
- Acceptance B: Kill-Planeten leuchten + pulsen, Weak gedämpft sichtbar, Mid neutral (kein Badge), Strong/Exceptional sehr ruhig. Galaxie wirkt monochromatisch-ruhig mit punktuellen Kill-Akzenten.

### Sub-Phase C — Edge-Render + Hover-Reveal + Datadog-Pivot + Mobile-List (~4–5 h)

**Slug**: `galaxie-workspace-solar-C-hover-mobile`

- Edge-Render: PixiJS.Graphics-Linien Sonne → Planet, Alpha-Animation via GSAP (0 → 0.15 on-hover-sun, 0 → 0.25 on-hover-planet).
- Orbit-Reveal: bei Hover-Sun Orbits fade-in Alpha 0.18.
- Hover-Mechanik: Scale 1.08, Glow-Halo Alpha 0.14, Tooltip-Pill mit Path+Severity (oben rechts vom Planet, 8 px Offset).
- Click-Mechanik (Datadog-Pivot): GSAP-Tween zentriert Selected-Knoten (400 ms ease-out), Rest-Galaxie dimmt auf Alpha 0.15. Side-Panel slidet ein (240 ms).
- Side-Panel-Komponente: `apps/web/src/components/galaxie/SolarInspectorPanel.tsx` — neue Komponente (oder Rewrite von `RepoInspector.tsx`), 380 px breit, slidet von rechts. Header + Severity-Breakdown + Findings-Liste + Actions.
- ESC-Handler + Click-Outside-Detection.
- Mobile-List-View: `apps/web/src/components/galaxie/SolarListView.tsx` — neue Komponente. Breakpoint-Check via `window.matchMedia('(max-width: 768px)')` mountet List vs. Galaxie. Filter-Chips, sortier-Header, virtual-scrolled Liste, Bottom-Sheet-Drill.
- `StaticGalaxieSVG.tsx` Final-Tune: Orbits + Edges permanent sichtbar bei Alpha 0.10, Click → Side-Panel (kein Tween).
- Acceptance C: Hover/Click funktioniert exakt wie spec'd, Side-Panel slidet sauber, Mobile ≤768 px zeigt List-View, Reduced-Motion-Fallback hat funktionierende Static-Vis.

**Reihenfolge ist load-bearing**: A liefert Layout-Coords, B nutzt sie für Severity-Render, C nutzt sie für Edge/Hover-Anchor-Points. Aufteilung in 3 Sub-Pläne entspricht User-Pacing-Pattern (`feedback_phase_pacing.md`).

## 7. Files-to-Change (Master-Übersicht)

| Datei                                                                  | Aktion | Sub-Phase | Was passiert                                                                                              |
|------------------------------------------------------------------------|--------|-----------|-----------------------------------------------------------------------------------------------------------|
| `apps/web/src/lib/galaxie/types.ts`                                    | EDIT   | A         | `FolderNode` einführen, Repo-Children-Typ erweitert                                                       |
| `apps/web/src/lib/galaxie/solar-layout.ts`                             | CREATE | A         | Neue Layout-Berechnung Sonne+Orbits+Planeten (deterministisch, hash-sortiert)                              |
| `apps/web/src/components/galaxie/GalaxieScene.tsx`                     | EDIT   | A, B, C   | Major-Rewrite: alte 3 Klassen ersetzt durch RepoSun/OrbitRing/Folder+FilePlanet; Hover/Click/Pivot-Logic neu |
| `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx`                 | EDIT   | A, B, C   | Parallel-Umstellung auf Sonnensystem-Layout + Severity-Palette + Static-Edges                              |
| `apps/web/src/lib/galaxie/severity-colors.ts`                          | EDIT   | B         | Neue OKLCH-Werte (asymmetrische Salienz), `SEVERITY_HEX` aktualisiert                                     |
| `apps/web/src/components/galaxie/SolarInspectorPanel.tsx`              | CREATE | C         | Datadog-Pivot-Side-Panel (slidet von rechts, ESC/Click-Outside-Close)                                    |
| `apps/web/src/components/galaxie/RepoInspector.tsx` (alt)              | DELETE | C         | Modal-Inspector ersetzt durch Side-Panel-Pivot (Hard-Replace per Q12)                                     |
| `apps/web/src/components/galaxie/SolarListView.tsx`                    | CREATE | C         | Mobile-List-View (≤768 px), Filter-Chips, Bottom-Sheet-Drill                                              |
| `apps/web/src/components/galaxie/[parent].tsx` (Workspace-Page-Mount)  | EDIT   | C         | Breakpoint-Check `matchMedia('(max-width: 768px)')` rendert List vs. Galaxie                              |

**Bewusst NICHT touched in Phase-1:**
- `UniversalSearch.tsx`, `MiniMap.tsx`, Keyboard-Shortcuts-Wiring (Out-of-Scope-Anpassung in Folge-Phase)
- Landing-Hero `Sphere.tsx`, `RepoGalaxie.tsx` (Landing-V2 ist frisch, Workspace-First per Q1)
- Inngest-Audit-Pipeline, DAL, Drizzle-Schema, API-Routes (rein UI-Refactor, kein Backend-Touch)
- Stripe-Tier-Definitionen, Billing-Logic
- ADR-Files (keine Architektur-Decision-Changes)

**Neue Files erlaubt** für Workspace-Komponenten (Komponenten-Convention, nicht docs/-Markdown). Markdown-Constraint (CLAUDE.md) gilt nur für Docs.

## 8. Test-Plan

**Automatisch:**

- `pnpm typecheck` ✓ — bei jedem Sub-Phase-Done.
- `pnpm test apps/web/src/lib/galaxie/` ✓ — neue Unit-Tests für `solar-layout.ts` (Determinismus: gleicher Input → gleicher Output, Hash-Sort-Stabilität).
- `pnpm --filter @vk/web build` ✓ — Smoke-Check bei jedem Sub-Phase-Done.
- A11y-Sanity: `playwright axe-core` (falls vorhanden, sonst manueller axe-devtools-Check) auf Workspace-Route.

**Manuell (Acceptance-Checkliste — am Dev-Server `http://localhost:3000/[workspace]`):**

Layout (nach Sub-A):
- [ ] Repo-Sonne sitzt klar zentral, deutlich größer als Planeten.
- [ ] Top-Folder + Root-Files liegen auf konzentrischen Orbits, deterministisch positioniert (Reload → gleiche Positionen).
- [ ] Default-Render ist neutral-monochrom: Sonne + Planeten alle grey, keine Severity-Farbe.
- [ ] Keine Orbits, keine Edges, keine Labels sichtbar im Default-State.

Severity (nach Sub-B):
- [ ] Kill-Planeten leuchten sattes Rot + pulsen sichtbar (1.6 s yoyo, scale 1.0 ↔ 1.12).
- [ ] Weak-Planeten gedämpft Orange-Tint, kein Pulse.
- [ ] Mid-Planeten neutral-grau (kein erkennbarer Hue), KEIN Edge-Badge.
- [ ] Strong-Planeten haben leisen Teal-Tint, sehr ruhig.
- [ ] Exceptional-Planeten: 1 px Indigo-Outline, kein Fill-Tint.
- [ ] Edge-Badge (Lucide-Icon auf Severity-Disc) sitzt 1-Uhr halb-überlappend bei Kill/Weak/Strong/Exceptional.
- [ ] Galaxie wirkt überwiegend monochromatisch-ruhig, Blick wandert automatisch zu Kill-Planeten (Asymm-Salienz).

Hover (nach Sub-C):
- [ ] Hover auf Sonne → alle Orbits fade-in (Alpha 0.18, 200 ms), alle Edges Sonne → Children fade-in (Alpha 0.15).
- [ ] Hover auf Planet → einzelne Edge zur Sonne fade-in (Alpha 0.25), Planet skaliert auf 1.08, Glow-Halo erscheint.
- [ ] Tooltip-Pill mit Path+Severity erscheint oben rechts vom Planet.
- [ ] Hover-Out → alle Reveal-Layers fade-out smooth.

Click/Pivot (nach Sub-C):
- [ ] Click auf Planet → Knoten zentriert smooth (400 ms ease-out), Rest dimmt auf opacity 0.15.
- [ ] Selected-Edge zur Sonne bleibt sticky bei Alpha 0.30.
- [ ] Side-Panel slidet von rechts ein (240 ms), zeigt Header + Severity-Breakdown + Findings-Liste + Actions.
- [ ] ESC schließt Panel + cleared Selection + un-dim.
- [ ] Click-Outside (auf gedimmten Bereich) schließt Panel.
- [ ] "Open in IDE"-Button öffnet `vscode://file/...`-Deep-Link.

Mobile (nach Sub-C, am Mobile-Viewport im Browser-DevTools oder echtem Device):
- [ ] ≤768 px: Galaxie wird gar nicht gemountet (keine PixiJS-Init im Network-Tab).
- [ ] List-View rendert: sortier-Header, Filter-Chips, virtual-scrolled Liste mit 44 pt Row-Höhe.
- [ ] Tap auf Row → Bottom-Sheet öffnet mit Findings + Actions.
- [ ] Filter-Chip "Kill" toggelt → Liste zeigt nur Kill-Files.
- [ ] iPad-Landscape (≥768 px): Galaxie rendert; optional Galaxy-Mode-Tab wirkt.

Reduced-Motion (System-Pref Reduce-Motion = ON):
- [ ] Static-SVG-Fallback rendert Sonnensystem-Layout.
- [ ] Orbits + Edges permanent sichtbar bei Alpha 0.10.
- [ ] Kein Pulse, kein Hover-Glow, kein Pivot-Tween.
- [ ] Click → Side-Panel öffnet ohne Tween, instant.

A11y:
- [ ] Galaxie hat `aria-hidden="true"` auf Desktop.
- [ ] Parallele Listen-Repräsentation im DOM (sr-only auf Desktop, visible auf Mobile) ist von Screenreader navigierbar.
- [ ] Side-Panel hat `role="dialog"` + `aria-labelledby` + Focus-Trap.
- [ ] ESC schließt Panel + restored Focus auf Trigger-Knoten.
- [ ] Tab-Reihenfolge sinnvoll (Filter-Chips → Sortier-Header → List-Items oder Galaxie-Knoten).

## 9. Risiken + Mitigation

| Risiko                                                                                              | Severity | Mitigation                                                                                              |
|-----------------------------------------------------------------------------------------------------|----------|---------------------------------------------------------------------------------------------------------|
| Sonnensystem-Layout schlägt bei dichten Repos (>50 Children) in eine einzige Orbit-Reihe um         | Strong   | Auto-Stack: bei >12 Children pro Orbit Auto-Wrap auf nächsten Orbit. Acceptance-Walk mit Demo-Repo + großem Real-Audit-Data-Sample. |
| Lucide-Icons als PIXI-Texture: Performance bei vielen Edge-Badges                                   | Strong   | Texture-Cache: 5 Severity-Icons werden einmal rasterisiert + via Sprite-Reuse gezeigt. Kein Re-Render pro Frame. Profile mit 200+ File-Repo. |
| Pulse-Tween auf Kill-Planeten: bei >20 Kill-Files gleichzeitig CPU-Spike                            | Mid      | GSAP-Tween-Pooling (shared Timeline für alle Kill-Planeten), `requestAnimationFrame`-Aware. Hard-Cap auf 50 simultane Pulses, Rest pulst gemeinsam mit Master-Beat. |
| Datadog-Pivot-Tween auf Selected-Node: Camera-Coords-Math mit Pan/Zoom-State                        | Strong   | Camera-Center-Calculation via existierender Viewport-Helper. Acceptance-Walk: Pan zur Außenseite, dann Click → muss korrekt zentrieren. |
| Side-Panel-Slide-In kollidiert visuell mit dimmed Galaxie (Z-Layer)                                 | Mid      | Panel = `z-index: 50`, Galaxie = `z-index: 10`, Backdrop-Dim-Overlay = `z-index: 20`. Klare Stacking. |
| Mobile-Breakpoint-Switch: SSR rendert falsche View bei initial render                               | Strong   | `useSyncExternalStore` für matchMedia (hydration-safe), oder Server-Defaults auf Mobile bei `userAgent`-Sniffing. Acceptance-Walk: Hydration-Mismatch-Console-Watch. |
| Reduced-Motion-Fallback: Sonnensystem-Layout in SVG ist 3× größer als alter Static-Render            | Mid      | SVG bleibt unter 80 KB compressed. LCP-Check via Lighthouse. Demo-Data + Real-Audit-Sample. |
| Severity-Hex-Change bricht andere Render-Pfade (z.B. Landing-Hero-V2, das auf SEVERITY_HEX lookt)   | Strong   | **Phase-B-Hard-Check**: nach SEVERITY_HEX-Update den Landing-Hero auf `localhost:3000/` aufrufen + Acceptance-Walk durch V2-Plan §8 (Folder-Differenzierung, Edge-Badge, Hover) re-walken. Falls Landing-Hero visuell regrediert → Severity-Palette nur in Workspace-Module isolieren (`apps/web/src/lib/galaxie/severity-colors-solar.ts`), Landing behält `severity-colors.ts`. |
| Edge-Render-Performance: PixiJS.Graphics-Clear+Redraw pro Hover-Frame                                | Strong   | Edges in separatem Container, Alpha-Tween statt Re-Draw. Profile: hover-test mit 50-Children-Sonne. |
| ESC-Key + Click-Outside-Detection interferieren mit UniversalSearch (auch ESC-handler)               | Mid      | Event-Listener-Priority: Search-Open → Search-ESC priorisiert; Search-Closed → Panel-ESC priorisiert. State-Machine in Page-Container. |
| Lucide-Severity-Icons als Stroke-Icons: bei Disc-Radius 5 + Icon-Size 6 möglicherweise unscharf      | Mid      | Texture rasterisiert mit DPR-2 (Retina), Sprite skaliert linear. Acceptance-Walk: Icon klar erkennbar bei Default-Zoom. |
| Tests: bestehende GalaxieScene-Snapshot/Render-Tests brechen durch Component-Rewrite                | Strong   | Pre-Phase-A: alle bestehenden Tests-Pfade auflisten (`pnpm test --listTests apps/web/src/components/galaxie/`). Bei Rewrite parallel rewriten oder deleten + neue Tests in Sub-A schreiben. |
| Solo-Dev: 3 Sub-Phasen sind ~10–12 h Arbeit, jede Session bricht Context                            | Weak     | Master-Plan dient als persistenter Kontext, jede Sub-Phase ist eigenständig executable. /plan-Discovery vor jeder Sub-Phase = Realitäts-Check. |

## 10. Rollout

- **Strategie**: Hard-Replace per Q12. Solo-Developer-Repo, kein Branch-Review nötig. **Pro Sub-Phase ein PR** (oder Direct-Merge in `main`), nicht ein großer Mega-PR — minimiert Block-Risiko bei Bugs.
- **Pre-Deploy-Gates** (vor jedem Sub-Phase-Done):
  - `pnpm typecheck` grün
  - `pnpm test apps/web/src/lib/galaxie/` grün
  - `pnpm --filter @vk/web build` grün
  - Acceptance-Checkliste der jeweiligen Sub-Phase komplett (User-Walk-Through)
  - Reduced-Motion-Pfad verifiziert
  - Landing-Hero-Re-Walk bei Sub-B (Severity-Hex-Cross-Impact, siehe §9)
- **Post-Deploy-Verifikation** (nach Sub-C):
  - Production Workspace-Route öffnen → Sonnensystem rendert, alle Acceptance-Punkte gelten auch im Vercel-Build.
  - Mobile-Device-Real-Test (iPhone Safari, Pixel Chrome): List-View funktioniert, Filter-Chips, Bottom-Sheet.
  - Lighthouse-Check: LCP, CLS, Performance-Score nicht regrediert ggü. V1.
- **Rollback-Trigger**:
  - Visual-Regression auf Production (z.B. Sonne unsichtbar, Pulse pulst alle Planeten, Side-Panel blockiert Workspace).
  - Hydration-Mismatch im Console-Log (Mobile-Breakpoint-Switch).
  - Performance-Regression (LCP > 2.5 s oder TTI > 5 s auf Mid-Range-Device).
  - Severity-Hex-Cross-Impact: Landing-Hero visuell regrediert.
- **Rollback-Schritte**: `git revert <merge-commit>` der jeweiligen Sub-Phase → `git push`. Vercel rolled automatisch zurück. Master-Plan-File bleibt in `docs/plans/` bis alle 3 Sub-Phasen ✅, dann `git mv` nach `docs/plans/done/`.

## 11. Out-of-Scope (separate Pläne)

- **Landing-Hero `RepoGalaxie.tsx` Sonnensystem-Konsistenz** — V2 ist frisch, separater Plan bei Bedarf (User-Entscheidung Q1).
- **Semantic-Zoom mit harten Layer-Cutoffs** (Mapbox-Style) — Killer-Pattern für Folge-Phase, EXCL aus Phase-1-Scope (Q8).
- **Filter-Chips in Galaxie-Toolbar** (Severity / Last-Changed / Folder) — Folge-Phase. Mobile hat Filter-Chips bereits in List-View.
- **Saved-Views (Linear-Style)** — Folge-Phase.
- **MiniMap-Update auf Sonnensystem-Layout** — Folge-Phase, bleibt vorerst bei alter Punkt-Repräsentation.
- **UniversalSearch-Result-Layout** an Sonnensystem-Navigation anpassen — Folge-Phase.
- **Keyboard-Shortcuts erweitern** (z.B. `[`/`]` für Pivot-Sonnen-Wechsel) — Folge-Phase.
- **Submodul-Drift-Edges** (Cross-Repo, dashed) — Folge-Phase, derzeit kein Audit-Output dafür im Repo.
- **Performance-Profiling + Worker-Auslagerung für 1000+ File-Repos** — Folge-Phase bei Bedarf.
- **R3F-Migration für 3D-Tilt / Bloom-Postprocessing** — Nova-3+ Roadmap (Q6).
- **Live-Galaxy auf Landing-Page** (anonym, OPP `docs/plans/nova-2-live-audit-flow.md`) — eigener Plan, läuft parallel, kein Overlap.

## 12. Open Questions (Post-Execute-Items, idealerweise leer)

- **Lucide-Icons bei sehr kleinen Planeten (Radius < 4)**: Disc-Radius 5 macht Badge größer als Planet. Acceptance-Walk Phase-B prüft visuelle Hierarchie; ggf. Disc-Radius adaptiv bei Files mit Radius < 4 auf 4 reduzieren.
- **Severity-Aggregation auf Folder-Planeten**: Soll ein Folder mit Kill-Children selbst pulsen? Default-Annahme: **Nein** — nur File-Planeten pulsen, Folder-Planet zeigt nur Edge-Badge mit worst-child-Severity. Validiert beim Acceptance-Walk; falls "Folder sollte mit-pulsen" gewünscht → Mini-Iter nach Sub-B.
- **Hover auf mehreren Knoten gleichzeitig** (Pan-while-Hover): nicht spezifiziert. Default-Annahme: nur eine Hover-State zur Zeit (zuletzt gehoverter Knoten gewinnt). Acceptance-Walk-Edge-Case.
- **Side-Panel-Verhalten bei sehr kleinen Viewports zwischen 768–1024 px**: 380 px Panel + Galaxie auf 768–1024 px = sehr eng. Annahme: Panel-Breite auf `min(380, 40vw)` clampen. Validiert beim Acceptance-Walk auf iPad-Landscape.

## 13. Geschätzter Aufwand

- **Sub-Phase A (Layout)**: ~3–4 h — Datenmodell + solar-layout.ts + Component-Rewrite-Skeleton. Eigene /plan-Discovery + /execute-Run.
- **Sub-Phase B (Severity)**: ~2.5–3 h — Palette-Update + Edge-Badge-Render + Kill-Pulse. Cross-Impact-Check mit Landing-Hero. Eigene /plan-Discovery + /execute-Run.
- **Sub-Phase C (Hover + Datadog-Pivot + Mobile-List)**: ~4–5 h — die anspruchsvollste Sub-Phase. Side-Panel-Komponente, ESC/Click-Outside-Handling, Mobile-List + Bottom-Sheet, A11y-Sanity. Eigene /plan-Discovery + /execute-Run.
- **Gesamt: ~10–12 h** — 3 Sessions à ~3–4 h. Empfehlung: **3 Sub-PRs nacheinander**, nicht ein Mega-PR (Pacing-Pattern `feedback_phase_pacing.md`, Block-Risiko-Minimierung).

---

**Nach Acceptance-C**: Master-Plan + alle 3 Sub-Pläne via `git mv` nach `docs/plans/done/galaxie-workspace-solar-redesign/`. Changelog-Update in `docs/changelog.md` mit Commit-Hashes. Optionaler Folge-Plan für Semantic-Zoom-Cutoffs + Filter-Chips (siehe §11).
