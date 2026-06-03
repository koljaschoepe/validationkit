# Plan — Galaxie-Workspace-Solar Sub-Phase C: Hover-Reveal + Datadog-Pivot + Mobile-List

> Erstellt: 2026-06-03
> Status: 🟡 In Review
> Slug: `galaxie-workspace-solar-C-hover-mobile`
> Confidence: **High** — basiert auf 4 User-Entscheidungen (1 Discovery-Runde, alle Recommended) + Code-Audit von `Inspector.tsx` (388 LOC, schon Side-Panel mit slide-from-right/ESC/Mobile-Bottom-Sheet) + `device.ts` (`useIsMobile`-Hook hydration-safe) + `GalaxieRoot.tsx` (dynamic-import-Mount-Logik) + Master-Plan §5.4-5.7
> Voraussetzung: Baut auf Sub-A + Sub-B auf (`docs/plans/done/galaxie-workspace-solar-A-layout.md` + `B-severity.md`). Finaler Sub-Plan; nach Sub-C ✅ wird Master-Plan + alle 3 Sub-Pläne nach `done/galaxie-workspace-solar-redesign/` gemoved.

---

## 1. Ziel

Workspace-Galaxie bekommt **Hover-Reveal** (Orbits + Edges + Tooltip-Pill on-hover statt always-on), **Datadog-Pivot** (Click zentriert + dimmt Rest + Side-Panel slidet ein) und **Mobile-List-View ≤639 px** (Filter-Chips + Severity-Sortierung + Bottom-Sheet-Drill statt PixiJS). Bestehender `Inspector.tsx` wird Major-erweitert auf Folder-Mode + Click-Outside (kein Hard-Replace, keine neue `SolarInspectorPanel.tsx`); foldered Files werden im Folder-Side-Panel erreichbar (keine rekursive Sub-Sonnen-Pivot — bleibt Folge-Phase). `StaticGalaxieSVG.tsx` zeigt Orbits + Edges permanent bei Alpha 0.10 (Reduced-Motion-Spirit).

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID  | Runde | Frage                                          | Antwort                                                                                              |
|-----|-------|------------------------------------------------|------------------------------------------------------------------------------------------------------|
| QC1 | 1.1   | Inspector → SolarInspectorPanel Migration      | **Major-Refactor von Inspector.tsx, kein Rename** — bestehende 388 LOC haben 80 % der Master-Spec schon (slide-from-right, ESC, Mobile-Bottom-Sheet); Erweiterung um Folder-Mode + Click-Outside + Center-Tween-Hook. |
| QC2 | 1.2   | Folder-Click-Verhalten                          | **Side-Panel im Folder-Mode** — Aggregat-Header + Severity-Breakdown-Chips + scrollable Findings-Liste. Visual-Sub-Sonnen-Pivot bleibt Folge-Phase (Master §11 OoS). |
| QC3 | 1.3   | Mobile-Breakpoint List vs Galaxie               | **639 px (Repo-Convention)** — reuse `useIsMobile()` aus `lib/galaxie/device.ts`. Master-768 wird verworfen wegen Drift-Cost mit existing Inspector-Bottom-Sheet (640) + Sprite-Scaling (640). |
| QC4 | 1.4   | Edge-Render-Animation                          | **Alle Edges gleichzeitig, single Alpha-State auf Container** — ein GSAP-Tween, alle Edges synchron, performance-effizient + Calm-by-Default. |

## 3. Existing-Patterns im Repo (Vorbild + zu Touch)

- **`apps/web/src/components/galaxie/Inspector.tsx`** (388 LOC) — bereits Side-Panel mit:
  - `PANEL_WIDTH = 380` (slidet von rechts)
  - `gsap.fromTo` slide-in 300 ms (Desktop von rechts, Mobile von unten)
  - `useEffect` ESC-Handler (line 71-77)
  - Tabs (Why / Solution / Activity), SeverityBadge, AISolutionPlaceholder, Dismiss/Snooze-Buttons
  - createPortal-Mount
  **Wird Major-Edit**: neue `target`-Prop-Union (file | folder), Click-Outside-Detection, Folder-Mode-Header/Breakdown.
- **`apps/web/src/lib/galaxie/device.ts`** (~45 LOC) — `MOBILE_QUERY = '(max-width: 639px)'`, `isMobileViewport()` sync + `useIsMobile()` Hook (matchMedia + useState + listener). **Reuse, kein Edit**.
- **`apps/web/src/components/galaxie/GalaxieRoot.tsx`** — `GalaxieScene = dynamic(... ssr:false)` + `useReducedMotion()` triggert StaticGalaxieSVG. **Erweitert um** `useIsMobile()` → `SolarListView` Branch.
- **`apps/web/src/components/galaxie/GalaxieScene.tsx`** (Sub-A/Sub-B-Endzustand) — Hover-Scale 1.5x existing, Diff-Sweep für Severity, Auto-Tour, Camera-Tween via GSAP. **Erweitert um** Edge/Orbit-Container-Mounting, Hover-Reveal-Logic, Datadog-Pivot-State (`selectedNodeId`), Dim-Other-Sprites-Tween.
- **`apps/web/src/components/galaxie/MiniMap.tsx`** — bleibt unverändert (Legacy-Bridge weiter). Pivot-Indicator ist Folge-Phase.
- **`apps/web/src/lib/galaxie/solar-layout.ts`** (Sub-A) — `SolarLayoutNode` + `FolderNode` + `SOLAR_LAYOUT_CONSTANTS`. **Reuse + Erweiterung**: neue Konstante `ORBIT_RADII` extrahiert oder direkt aus `FOLDER_ORBITS + FILE_ORBIT` abgeleitet für Orbit-Render.
- **`apps/web/src/components/galaxie/pixi/{FolderPlanet,FilePlanet,RepoSun}.ts`** — Hover-Scale-1.5 wird auf 1.08 reduziert (Master §5.5). Neue Methode `setHoverGlow(active: boolean)` für Halo-Effekt (Alpha 0.14).
- **GSAP-Context-Pattern in `GalaxieScene.tsx`** — `ctxRef.current = gsap.context(...)` für Lifecycle-Teardown. Übernommen für Pivot-Tween + Hover-Reveal-Tween.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Hard-Replace Inspector mit neuer `SolarInspectorPanel.tsx`** → Verworfen (QC1). 2-3 h Mehrarbeit für 80 % schon-vorhandene Funktionalität. AISolutionPlaceholder + inspector-templates + Dismiss-API Neu-Verkabeln = unnötiges Regression-Risiko.
- **Alt-B: Adapter-Layer `SolarInspectorPanel` als Thin-Wrapper** → Verworfen (QC1). Verschachtelung ohne klare Verantwortungsgrenze.
- **Alt-C: Visual Sub-Sonnen-Pivot (rekursive Folder-Hierarchie)** → Verworfen (QC2). Rekursion in `computeSolarLayout` + Zoom-Level-State + Rückweg-UI ist 3-4 h Mehrarbeit, sprengt Sub-C-Scope. Master §11 listet als OoS Phase-1.
- **Alt-D: Folder-Click no-op** → Verworfen (QC2). Folder-Planeten wären visuelles Dekor ohne Funktion, schlägt sich mit Master-Sun-Drilldown-Pattern.
- **Alt-E: Master-768 px Breakpoint** → Verworfen (QC3). Drift mit Inspector-Bottom-Sheet (640) + Sprite-Scaling (640) wäre Tech-Debt. Repo-Konvention >Master-Spec.
- **Alt-F: Inkonsistent 768/639** → Verworfen (QC3). Edge-Case-Hölle bei Tablet-Landscape.
- **Alt-G: Gestaffelter Edge-fade-in (Stagger 20 ms)** → Verworfen (QC4). Bei 50+ Children sichtbares Strobe, mehr Tweens = mehr CPU, nicht spec'd.
- **Alt-H: Tooltip-Pill als DOM-Overlay (React-portal)** → Verworfen. Bestehender `GalaxieTooltip` ist schon DOM-portal, wird wieder genutzt. Nur Inhalt erweitert.
- **Alt-I: `useSyncExternalStore` für Mobile-Detection** → Verworfen. `useIsMobile()` ist schon hydration-safe (returns `false` initial → useEffect setzt Wahrheitswert), reuse statt parallel-impl.

## 5. Endzustand

### 5.1 Hover-Reveal-Layer (`GalaxieScene.tsx` + neue Pixi-Container)

**Hover auf Sun**:
- `EdgeContainer` (siehe §5.3) fade-in: Alpha 0 → 0.15 für alle Edges Sun→Children, single GSAP-Tween auf Container.alpha, 200 ms ease-out.
- `OrbitContainer` (siehe §5.4) fade-in: Alpha 0 → 0.18 für alle Orbit-Ringe, single Tween, 200 ms ease-out.
- Sun-Hover-Glow-Halo: Outer-Korona Alpha 0 → 0.14 (subtle), 200 ms.
- Sun-Scale: bleibt 1.0 (Sun-Body ist bereits groß genug — kein Scale-Hover).

**Hover auf Folder/File-Planet**:
- Einzelne Edge zur Sun fade-in: Alpha 0 → 0.25, 200 ms.
- Planet-Scale: 1.0 → **1.08** (Master §5.5, reduziert von Sub-B-1.5).
- Hover-Glow-Halo um Planet: Alpha 0 → 0.14, 200 ms.
- Tooltip-Pill: bestehender `GalaxieTooltip`, Inhalt erweitert um Folder-Path / File-Path + Severity-Badge + Findings-Count (für File: 1 Finding immer; für Folder: `fileCount`).

**Hover-Out**:
- Alle reveal-Layers fade-out 200 ms ease-out.
- Planet-Scale zurück auf 1.0; bei Kill-File: Pulse-Restart über `onComplete: startPulse` (existierender Sub-B-Pfad bleibt).

### 5.2 Datadog-Pivot (`GalaxieScene.tsx` State + Tween)

Neuer State: `selectedNodeId: string | null` (im GalaxieScene-Component).

**Click auf Sun/Folder/File**:
1. Setze `selectedNodeId` auf clicked id.
2. GSAP-Tween Camera: Knoten ins Zentrum (existierender `tweenToNode` Pattern, 400 ms ease-out, scale je nach kind: Sun=2.5, Folder=4, File=5).
3. **Dim-Other-Sprites-Tween**: alle sprites außer selected + dessen Edge zur Sun → opacity 0 → 0.15 (200 ms). Selected-Sprite + Selected-Edge bleiben opacity 1.
4. Selected-Edge zur Sun: bleibt sticky bei Alpha 0.30 (statt Hover-0.25).
5. Inspector öffnen mit `target = { kind: 'file' | 'folder', file? | folder? }`.

**ESC oder Click-Outside oder X-Button**:
1. Setze `selectedNodeId = null`.
2. Dim-Restore-Tween: alle Sprites opacity 0.15 → 1 (200 ms).
3. Selected-Edge fade-out.
4. Inspector close (bestehender `onClose` callback).

**ESC-Priority-Coordination**: bestehende `UniversalSearch` hat eigenen ESC-Handler. Order: wenn Search-Open + User-ESC → Search closes, Pivot bleibt. Wenn Search-Closed + Pivot-Open + User-ESC → Pivot closes. State-Machine im GalaxieScene-Top-Level.

### 5.3 Edge-Render (`pixi/edges.ts` NEW)

```ts
import { Container, Graphics } from 'pixi.js';
import type { SolarLayoutNode } from '@/lib/galaxie/types';

export class EdgeContainer extends Container {
  private graphics: Graphics;
  constructor() {
    super();
    this.alpha = 0; // hidden by default
    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }
  /** Re-draw all sun→child edges from the current solar layout. Called once
   *  per data/layout change in the diff-effect. */
  redraw(suns: Map<string, SolarLayoutNode>, children: SolarLayoutNode[]): void {
    this.graphics.clear();
    for (const child of children) {
      if (!child.parentSunId) continue;
      const sun = suns.get(child.parentSunId);
      if (!sun) continue;
      this.graphics
        .moveTo(sun.x, sun.y)
        .lineTo(child.x, child.y)
        .stroke({ width: 0.5, color: 0xffffff, alpha: 1 });
    }
  }
}
```

- Container.alpha steuert den Reveal — single GSAP-Tween auf `.alpha` bei Hover-Sun.
- Selected-Edge ist eine **separate** Graphics-Linie (separate Klasse `SelectedEdge` oder Inline), nicht Teil der EdgeContainer-Alpha-Gruppe.

### 5.4 Orbit-Render (`pixi/orbits.ts` NEW)

```ts
import { Container, Graphics } from 'pixi.js';
import { SOLAR_LAYOUT_CONSTANTS } from '@/lib/galaxie/solar-layout';
import type { SolarLayoutNode } from '@/lib/galaxie/types';

const { FOLDER_ORBITS, FILE_ORBIT } = SOLAR_LAYOUT_CONSTANTS;
const ORBIT_RADII = [...FOLDER_ORBITS, FILE_ORBIT] as const;

export class OrbitContainer extends Container {
  private graphics: Graphics;
  constructor() {
    super();
    this.alpha = 0;
    this.graphics = new Graphics();
    this.addChild(this.graphics);
  }
  redraw(suns: SolarLayoutNode[]): void {
    this.graphics.clear();
    for (const sun of suns) {
      for (const r of ORBIT_RADII) {
        this.graphics
          .circle(sun.x, sun.y, r)
          .stroke({ width: 0.5, color: 0xffffff, alpha: 1 });
      }
    }
  }
}
```

- Default Alpha 0; Hover-Sun-Tween auf 0.18.
- Reduced-Motion-Pfad: kein OrbitContainer in PIXI (Reduced nutzt nur StaticGalaxieSVG; Orbits dort permanent gerendert bei Alpha 0.10).

### 5.5 Inspector erweitert auf Folder-Mode (`Inspector.tsx` Edit)

Neue Prop-Union:

```ts
export type InspectorTarget =
  | { kind: 'file'; file: FileNode }
  | { kind: 'folder'; folder: FolderNode; files: FileNode[] };

export function Inspector({
  target,
  onClose,
  readOnly = false,
}: {
  target: InspectorTarget;
  onClose: () => void;
  readOnly?: boolean;
}) { ... }
```

**File-Mode** (Default, vorhanden in Sub-B): bestehender Code bleibt im `target.kind === 'file'`-Branch.

**Folder-Mode** (NEW):
- Header: Folder-Name + Aggregate-Severity-Badge.
- Severity-Breakdown-Chips: aus `files`-Array gerechnet, z.B. `[Kill: 12] [Weak: 47] [Strong: 89]`. Click auf Chip filtert `Findings-Liste`.
- Findings-Liste: scrollable, jede Row `[SeverityBadge] [File-Path] [Open-Pfeil]`. Click auf Row öffnet Inspector im File-Mode für diese File.
- Keine AI-Solution / Apply / Dismiss-Buttons im Folder-Mode (Aggregat-View, keine Per-File-Actions).

**Click-Outside-Detection** (NEW, beide Modes):
- `useEffect` mit `document.addEventListener('mousedown', handler)`.
- Handler prüft ob `target` außerhalb `panelRef.current` ist; wenn ja → `onClose()`.
- Ignoriere Click auf den Galaxie-Canvas (`<canvas>` hat `pointermove`-Events, aber `mousedown` darauf soll Close triggern — das ist tatsächlich gewünschtes Verhalten).

### 5.6 Mobile-List-View (`SolarListView.tsx` NEW)

```ts
'use client';
import { useMemo, useState } from 'react';
import type { GalaxieData, Severity } from '@/lib/galaxie/types';
import { Inspector } from './Inspector';

export function SolarListView({ data, readOnly = false }: { data: GalaxieData; readOnly?: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Set<Severity>>(new Set(['Kill', 'Weak', 'Mid', 'Strong', 'Exceptional']));
  const filtered = useMemo(() =>
    data.files
      .filter((f) => severityFilter.has(f.severity))
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]),
    [data.files, severityFilter]
  );
  // ... render filter chips + virtual-list + Inspector-Modal-Bottom-Sheet
}
```

- **Filter-Chips persistent oben**: 5 Severity-Chips. Default alle aktiv. Klick toggelt.
- **Sortier-Header**: Default Severity DESC (Kill zuerst). Optional Folder-Path / Last-Audit-Time.
- **Row-Layout**: `[SeverityBadge] [File-Path] [chevron-right]`, 44 pt Höhe (Apple-HIG).
- **Virtual-Scrolling**: bei ≤500 Files native scroll (kein extra Dep); bei >500 → `@tanstack/react-virtual` (Pre-Check, ggf. dependency-add, Open-Question §12).
- **Tap auf Row**: öffnet `Inspector` im File-Mode (existierender Mobile-Bottom-Sheet-Slide-Pattern via `gsap.fromTo` Mobile-Branch).

### 5.7 GalaxieRoot Mobile-Switch (`GalaxieRoot.tsx` Edit)

```tsx
'use client';
// imports …
import { useIsMobile } from '@/lib/galaxie/device';
import { SolarListView } from './SolarListView';

export function GalaxieRoot(props: GalaxieRootProps) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  if (props.mode !== 'static-demo' && isMobile && props.initialData) {
    return <SolarListView data={props.initialData} readOnly={props.readOnly} />;
  }
  if (reducedMotion) return <StaticGalaxieSVG {...props} />;
  return <GalaxieScene {...props} />;
}
```

- **Static-Demo-Mode bleibt PIXI** (Landing-Hero soll Galaxie-Demo zeigen, nicht List).
- **Mobile + interactive + has-data → List**.
- **Real-Workspace ohne Data + Mobile → leerer List (statt PixiJS-Skeleton)**.
- **Reduced-Motion-Pfad bleibt SVG**.

### 5.8 StaticGalaxieSVG-Tune (`StaticGalaxieSVG.tsx` Edit)

- Orbits permanent gerendert mit Alpha 0.10 (vor Layer 2 = Folder-Planeten).
- Edges Sun→Children permanent gerendert mit Alpha 0.10 (vor Layer 2 = Folder-Planeten, nach Layer 1 = Suns).
- Kein Hover-Reveal-Logic (Reduced-Motion → kein Hover-Affordance).
- Click auf File-Planet → Inspector öffnet **instant** (kein slide-in-Tween).

### 5.9 Hover-Glow-Halo (Pixi-Klassen-Erweiterung)

Neue Methoden auf RepoSun/FolderPlanet/FilePlanet:

```ts
private hoverGlow: Graphics | null = null;
setHoverGlow(active: boolean): void {
  if (active && !this.hoverGlow) {
    this.hoverGlow = new Graphics();
    this.hoverGlow.circle(0, 0, /* parentRadius * 1.4 */).fill({ color: 0xffffff, alpha: 0.14 });
    this.addChildAt(this.hoverGlow, 0); // unter dem body
  } else if (!active && this.hoverGlow) {
    this.removeChild(this.hoverGlow);
    this.hoverGlow.destroy();
    this.hoverGlow = null;
  }
}
```

Aufgerufen aus `GalaxieWorld.onOver` (active=true) und `onOut` (active=false). GSAP-Tween auf Hover-Glow-Alpha 0 → 0.14 / zurück, in den existierenden Hover-Tween-Block integriert.

### 5.10 Tests grün (Acceptance Bottom-Line)

- `pnpm typecheck` ✓
- `pnpm test apps/web/src/lib/galaxie/` ✓ — `solar-layout`, `severity-colors`, `mock-data` bleiben grün; keine neuen Unit-Tests nötig (rein UI-State + GSAP-Tween).
- `pnpm test apps/web/src/components/galaxie/pixi/` ✓ — `Camera`, `quadtree` bleiben grün.
- `pnpm --filter @vk/web build` ✓
- Acceptance-Walk auf `/[workspace]` (Desktop + Mobile-Emulation) + `/` (Landing-Hero regression-Check).

## 6. Schritte

- [ ] **Step 1**: `apps/web/src/lib/galaxie/types.ts` — `InspectorTarget`-Union-Typ exportieren (oder direkt in `Inspector.tsx` lokal definieren, je nach Sauberkeit).
- [ ] **Step 2**: `apps/web/src/components/galaxie/pixi/edges.ts` (NEW) — `EdgeContainer`-Klasse mit `redraw(suns, children)` + Container.alpha-Steuerung.
- [ ] **Step 3**: `apps/web/src/components/galaxie/pixi/orbits.ts` (NEW) — `OrbitContainer`-Klasse mit `redraw(suns)` + Container.alpha-Steuerung.
- [ ] **Step 4**: `pixi/RepoSun.ts` + `pixi/FolderPlanet.ts` + `pixi/FilePlanet.ts` — `setHoverGlow(active)`-Methode hinzufügen.
- [ ] **Step 5**: `GalaxieScene.tsx` — `EdgeContainer` + `OrbitContainer` in Mount-Effect instantiate + addChild-en. Diff-Effect ruft `redraw` bei `data`/`layoutById`-Change.
- [ ] **Step 6**: `GalaxieScene.tsx` — Hover-Logic-Refactor: Hover-Sun → Edge+Orbit reveal-Tween; Hover-Planet → Single-Edge reveal + Tooltip-Pill mit erweiterten Inhalten + Hover-Glow + Scale-1.08 (statt 1.5).
- [ ] **Step 7**: `GalaxieScene.tsx` — `selectedNodeId`-State, Click-Handlers (Sun/Folder/File) triggern Pivot-Sequenz (camera-tween + dim-others-tween + Inspector öffnen). ESC + Click-Outside via Inspector-Handler.
- [ ] **Step 8**: `Inspector.tsx` — `target`-Prop-Union (file | folder), Folder-Mode-Header + Severity-Breakdown-Chips + Findings-Liste, Click-Outside-Detection. Existing File-Mode bleibt strukturell unverändert.
- [ ] **Step 9**: `SolarListView.tsx` (NEW) — Filter-Chips + Severity-Sort + Row-Layout + Tap → Inspector-Mobile-Sheet.
- [ ] **Step 10**: `GalaxieRoot.tsx` — `useIsMobile()` Branch zwischen GalaxieScene und SolarListView. Static-demo bleibt PixiJS.
- [ ] **Step 11**: `StaticGalaxieSVG.tsx` — Orbits + Edges permanent bei Alpha 0.10, vor den Planeten-Layern.
- [ ] **Step 12**: `pnpm typecheck` + `pnpm test apps/web/src/lib/galaxie/ apps/web/src/components/galaxie/pixi/` + `pnpm --filter @vk/web build` — alle grün.
- [ ] **Step 13**: Dev-Server starten, Acceptance-Walk auf `/[workspace]` (Hover + Pivot + Folder-Click + ESC/Click-Outside), Mobile-Emulation (List + Filter + Tap), `/` (Landing-Hero-Regression), Reduced-Motion (permanent-visible Orbits/Edges).

## 7. Files-to-Change

| Datei                                                                  | Aktion | Was passiert                                                                                              |
|------------------------------------------------------------------------|--------|-----------------------------------------------------------------------------------------------------------|
| `apps/web/src/components/galaxie/pixi/edges.ts`                        | CREATE | `EdgeContainer`-Klasse, Sun→Children Graphics-Linien, Container.alpha-State.                              |
| `apps/web/src/components/galaxie/pixi/orbits.ts`                       | CREATE | `OrbitContainer`-Klasse, konzentrische Ringe pro Sun, Container.alpha-State.                              |
| `apps/web/src/components/galaxie/pixi/RepoSun.ts`                      | EDIT   | `setHoverGlow(active)`-Methode für Halo-Alpha-Animation.                                                  |
| `apps/web/src/components/galaxie/pixi/FolderPlanet.ts`                 | EDIT   | `setHoverGlow(active)`-Methode.                                                                            |
| `apps/web/src/components/galaxie/pixi/FilePlanet.ts`                   | EDIT   | `setHoverGlow(active)`-Methode.                                                                            |
| `apps/web/src/components/galaxie/GalaxieScene.tsx`                     | EDIT   | EdgeContainer + OrbitContainer mount + diff-redraw, Hover-Reveal-Refactor (Scale 1.08, Glow-Halo, Reveal-Tween), Datadog-Pivot (`selectedNodeId` State, Camera-Tween, Dim-Others-Tween), ESC + Click-Outside, Inspector mit `target`-Prop. |
| `apps/web/src/components/galaxie/Inspector.tsx`                        | EDIT   | `target`-Prop-Union (file | folder), Folder-Mode-Render (Header + Breakdown-Chips + Findings-Liste), Click-Outside-Detection. File-Mode-Branch bleibt funktional unverändert. |
| `apps/web/src/components/galaxie/SolarListView.tsx`                    | CREATE | Mobile-≤639-Komponente: Filter-Chips, Severity-Sort, virtual/native-Scroll, Tap → Inspector-Bottom-Sheet. |
| `apps/web/src/components/galaxie/GalaxieRoot.tsx`                      | EDIT   | `useIsMobile()` → SolarListView Branch (vor reducedMotion-Check, weil Reduced-Motion auf Mobile ebenfalls List bekommt — ist semantisch sauberer als SVG-Galaxie auf Phone). |
| `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx`                 | EDIT   | Orbits (`<circle>` mit fillOpacity 0) + Edges (`<line>`) permanent bei `strokeOpacity 0.10`, zwischen Sun- und Folder-Layer.                                                |

**Bewusst NICHT touched in Sub-C**:
- `MiniMap.tsx` (bleibt Legacy-Bridge, Pivot-Indicator = Folge-Phase)
- `UniversalSearch.tsx` (bleibt unverändert, ESC-Priority via State-Machine in GalaxieScene)
- `solar-layout.ts` (Layout-Coords bleiben Sub-A-stabile Konstanten; nur ORBIT_RADII-Re-Export in `orbits.ts`)
- `severity-colors.ts` / `severity-icons.ts` / `edge-badge-texture.ts` (Sub-B-stabile)
- `lib/galaxie/device.ts` (reuse, kein Edit)
- `lib/galaxie/types.ts` (eventuell `InspectorTarget` re-export wenn aus Inspector zu Inspector-Konsumenten propagiert)
- `lib/galaxie/layout.ts` (Legacy-Bridge frozen)
- Landing-Hero (`Sphere.tsx`, `RepoTreeView.tsx` etc.) — keine Änderung in Sub-C (Sub-B hatte Cross-Impact via SEVERITY_HEX; Sub-C ändert nur Workspace-Verhalten).
- Inngest, DAL, Drizzle-Schema, API-Routes (rein UI-Refactor).

## 8. Test-Plan

**Automatisch:**

- `pnpm typecheck` ✓ (monorepo)
- `pnpm test apps/web/src/lib/galaxie/` ✓ — bestehend grün, keine neuen Unit-Tests.
- `pnpm test apps/web/src/components/galaxie/pixi/` ✓ — bestehend grün.
- `pnpm --filter @vk/web build` ✓

**Manuell (Acceptance-Checkliste — `http://localhost:3000/[workspace]` Desktop):**

Hover-Reveal:
- [ ] Hover auf Sun → alle Orbits fade-in (200 ms, Alpha 0.18), alle Edges Sun→Children fade-in (200 ms, Alpha 0.15), Sun-Hover-Glow erscheint.
- [ ] Hover auf Folder/File-Planet → einzelne Edge zur Sun fade-in (Alpha 0.25), Planet skaliert auf 1.08 (sanfter als Sub-B-1.5), Hover-Glow-Halo Alpha 0.14, Tooltip-Pill mit Path + Severity + Findings-Count.
- [ ] Hover-Out → alle Reveal-Layers fade-out smooth.
- [ ] Hover-Out auf Kill-File → Kill-Pulse restartet sauber (Sub-B-Pfad bleibt).

Datadog-Pivot (Click):
- [ ] Click auf File-Planet → Camera zentriert smooth (400 ms ease-out), Rest-Galaxie dimmt opacity 0.15.
- [ ] Selected-Edge zur Sun bleibt sticky bei Alpha 0.30.
- [ ] Inspector slidet von rechts ein (existing 300 ms slide).
- [ ] Click auf Folder-Planet → Inspector öffnet im **Folder-Mode** (Header mit Folder-Name + Aggregate-Severity, Breakdown-Chips, Findings-Liste).
- [ ] Click auf Folder-Findings-Row öffnet Inspector im File-Mode für diese File.
- [ ] Click auf Sun → Camera zentriert auf Sun, Rest dimmt, Inspector öffnet (Folder-Mode mit ALLEN Repo-Files? oder einfach Camera-Zoom ohne Panel? — siehe Open Question §12).

ESC + Click-Outside:
- [ ] ESC schließt Panel + cleared Selection + un-dim.
- [ ] Click auf gedimmten Galaxie-Bereich schließt Panel.
- [ ] Click auf X-Button im Panel schließt Panel.
- [ ] UniversalSearch-Open + ESC → Search schließt, Pivot bleibt offen.
- [ ] UniversalSearch-Closed + Pivot-Open + ESC → Pivot schließt.

Mobile-List-View (Browser DevTools Mobile-Emulation iPhone 14 oder echtes Device, ≤639 px):
- [ ] Bei ≤639 px wird statt PixiJS die `SolarListView` gerendert (kein Canvas im DOM).
- [ ] Filter-Chips oben sichtbar (Kill/Weak/Mid/Strong/Exceptional), klick toggelt.
- [ ] Liste sortiert default Severity DESC (Kill zuerst).
- [ ] Row-Höhe ≥44 pt (Apple-HIG-Touch).
- [ ] Tap auf Row → Inspector öffnet als Bottom-Sheet (slidet von unten).
- [ ] Filter "Kill" + alles andere off → Liste zeigt nur Kill-Files.
- [ ] iPad-Landscape (≥640 px) → Galaxie rendert.

Console:
- [ ] Keine React-Hydration-Warnings.
- [ ] Keine PixiJS-Errors.
- [ ] Keine Tween-Konflikt-Warnings (Tween-Pool sauber).

Reduced-Motion (System-Pref ON):
- [ ] StaticGalaxieSVG rendert Sonnensystem mit **permanent sichtbaren Orbits + Edges** (Alpha 0.10).
- [ ] Click auf File-Planet → Inspector öffnet **instant** (kein slide-Tween).
- [ ] Kein Hover-Reveal (Reduced-Motion-Spirit).

Landing-Hero Regression (`/`):
- [ ] Landing-Hero rendert weiter ohne Console-Errors.
- [ ] Sub-B-Severity-Palette + Lucide-Icons bleiben sichtbar (kein Sub-C-Side-Effect).

## 9. Risiken + Mitigation

| Risiko                                                                                              | Severity | Mitigation                                                                                              |
|-----------------------------------------------------------------------------------------------------|----------|---------------------------------------------------------------------------------------------------------|
| Hover-Tween-Konflikt: Hover-Out-Pulse-Restart (Sub-B) + Reveal-Layer-Tweens überlagern              | Strong   | GSAP-Context-Pattern + `gsap.killTweensOf(sprite.scale)` vor jedem Hover-Tween. Reveal-Layers haben eigenen Tween-Pool auf Container.alpha — keine Sprite-Scale-Konflikte. |
| Datadog-Pivot-Dim-Tween auf 200+ Sprites: CPU-Spike bei großen Repos                                | Strong   | Statt per-Sprite-Tween: ein parent-Container (`worldRef`) zwischen Camera + Knoten mit zwei Kindern (selected + others). Tween nur `others.alpha`. Single GSAP-Property-Tween. |
| Click-Outside-Detection: trifft auch PixiJS-Canvas, was Pivot sofort wieder schließt nach Click-Open | Strong   | Click-Outside-Handler nutzt `setTimeout(..., 0)` oder `requestAnimationFrame` Defer, damit der Pivot-Open-Click nicht im selben Tick als Outside-Click counted. Alternativ Click-Capture auf Backdrop-Overlay (Pointerevents). |
| Inspector-`target`-Prop-Union: bestehende Konsumenten (StaticGalaxieSVG, Auto-Tour) müssen mitmigriert| Mid      | Grep nach `<Inspector` im Repo, alle Stellen auf neue API umstellen. StaticGalaxieSVG Sub-B nutzt schon `file={selectedFile}` als Prop — wird auf `target={{ kind: 'file', file: selectedFile }}` umgestellt. |
| Mobile-List-View mit 500+ Files ohne Virtualisierung: scroll-jank                                    | Mid      | Mock-Data hat ≤150 Files, real audits typisch 100-500. Native-scroll reicht. Bei >500 → `@tanstack/react-virtual` als Folge-Iter (Open Question §12). |
| SolarListView mountet Inspector-Bottom-Sheet, aber Inspector-Slide-In-Logic prüft `window.innerWidth < 640` direkt | Mid | Inspector behält Mobile-Branch (already there). Mobile-Mount-Check funktioniert weiter. Konsistenz mit useIsMobile durch direkten Prop oder selbst-detect. |
| Tooltip-Pill-Inhalt-Erweiterung: bestehender `GalaxieTooltip` rendert `file: FileNode` als Layout — neue Folder/Severity-Count-Felder müssen passen | Mid | `Tooltip.tsx` ist 26 LOC, kleine Erweiterung: `target?: { path: string; severity: Severity; findingsCount?: number }`. Folder-Hover passt Daten ein.                                                  |
| Auto-Tour-Pfad (Landing-Demo) interagiert mit Sub-C-Pivot-State                                      | Mid      | Auto-Tour läuft nur in `static-demo`-Mode (Landing). Pivot-State + Click-Outside ist im `interactive`-Mode. Trennung sauber, kein Konflikt. |
| Pivot-Camera-Tween + Pan-Gesture-Drag während Tween                                                  | Weak     | Bestehender `gsap.killTweensOf(cameraRef.current)` bei jedem User-Pan (existing Sub-A). Drag during Tween cancelt Tween. |
| Reveal-Layer-Edges + Pivot-Selected-Edge: doppelte Linie auf selected node                          | Weak     | Bei Pivot-Open: alle Reveal-Layer-Edges fade-out (single Container.alpha → 0). Nur Selected-Edge bleibt (in eigenem Container). |
| `useIsMobile()` Hydration-Mismatch: Server rendert false → Client switcht zu true                    | Mid      | `useIsMobile()` returns `false` initial (server-safe), useEffect setzt nach Mount. Bei Mobile-Initial-Load: kurzer Flash von Galaxie-Skeleton, dann List. Akzeptabel; Alternative `userAgent`-Sniffing wäre fragile. |
| `EdgeContainer.redraw` + `OrbitContainer.redraw` werden bei jedem Data-Change ausgeführt              | Weak     | Diff-Effect-Deps `[data, layoutById]` triggert nur bei Mock-Data-Wechsel (Workspace-Switch) oder Real-Audit-Refresh. Pro Workspace 1 Redraw, akzeptabel. |
| Reduced-Motion + Click-Outside in StaticGalaxieSVG                                                   | Weak     | StaticGalaxieSVG hat eigenen Selected-State (`selectedFileId`), bestehend, kein Click-Outside nötig (kein Dim/Pivot in SVG-Pfad). |

## 10. Rollout

- **Strategie**: Hard-Replace (Master Q12). Solo-Dev. **Sub-C = 1 PR oder Direct-Commit auf `main`**.
- **Pre-Deploy-Gates** (vor Sub-C-Done):
  - `pnpm typecheck` grün
  - `pnpm test apps/web/src/lib/galaxie/ apps/web/src/components/galaxie/pixi/` grün
  - `pnpm --filter @vk/web build` grün
  - Acceptance-Walk `/[workspace]` Desktop komplett (Hover + Pivot + Folder-Mode + ESC/Click-Outside)
  - Acceptance-Walk Mobile-Emulation komplett (List + Filter + Tap → Bottom-Sheet)
  - Acceptance-Walk Landing-Hero (`/`) — Regression-Check (Sub-B-Severity bleibt sauber)
  - Reduced-Motion-Pfad verifiziert
- **Post-Deploy-Verifikation**: Sub-C wird **deployed** (Master-Plan finaler Sub). Production-Workspace-Route + Real-Mobile-Device-Test.
- **Rollback-Trigger**:
  - Pivot-State stuck (Knoten zentriert, Inspector offen, ESC kein-op)
  - Mobile-List-View rendert nicht oder zeigt Galaxie statt List
  - Hover-Reveal-Tween führt zu Visual-Artefakten (z.B. Orbits flicker, Edges bleiben permanent sichtbar nach Hover-Out)
  - Click-Outside schließt Inspector sofort nach Open
  - Landing-Hero regrediert
- **Rollback-Schritte**: `git revert <sub-C-commit>` → zurück zu Sub-B-Endzustand. Sub-C-Plan-File bleibt in `docs/plans/` bis Re-Issue.
- **Post-Sub-C Master-Abschluss**: Master-Plan + alle 3 Sub-Pläne `git mv` nach `docs/plans/done/galaxie-workspace-solar-redesign/`. Changelog-Update in `docs/changelog.md`.

## 11. Out-of-Scope (V2 / Folge-Pläne)

- **Rekursive Folder-Hierarchie + visueller Sub-Sonnen-Pivot** → Folge-Phase (QC2-Alt-B abgelehnt).
- **MiniMap-Migration** auf Sonnensystem-Layout + Pivot-Indicator → Folge-Phase.
- **UniversalSearch-Layout-Anpassung** an Sonnensystem-Result-Layout → Folge-Phase.
- **Semantic-Zoom-Cutoffs** (Mapbox-Style) → Folge-Phase.
- **Filter-Chips in Desktop-Galaxie-Toolbar** → Folge-Phase. Mobile-List hat Filter-Chips schon.
- **Saved-Views (Linear-Style)** → Folge-Phase.
- **Keyboard-Shortcuts erweitern** (`[`/`]` für Pivot-Sonnen-Wechsel) → Folge-Phase.
- **Submodul-Drift-Edges** (Cross-Repo, dashed) → Folge-Phase.
- **Performance-Tuning** für 1000+ File-Repos (Worker, Tween-Pooling) → Folge-Phase.
- **R3F-Migration** → Nova-3+ Roadmap.
- **`@tanstack/react-virtual`** für SolarListView bei >500 Files → Folge-Iter (siehe §12).
- **Sun-Click Folder-Mode-Panel** mit allen Repo-Files → siehe §12.

## 12. Open Questions (Post-Execute-Items)

- **Sun-Click-Verhalten**: Sub-C öffnet bei Sun-Click den Inspector im **Folder-Mode** oder **gar kein Panel** (nur Camera-Pivot)? Bias: kein Panel — Sun ist Aggregat, klick zoomt rein, dann erst kann der User Planeten anklicken. Acceptance-Walk: User probiert beide Varianten, entscheidet.
- **`@tanstack/react-virtual`-Dependency**: Pre-Check ob schon installiert. Wenn nicht und Mock-Data ≤500 Files → native-scroll. Bei Production-Audits >500 Files → Folge-Iter mit Dep-Add.
- **Click-Outside auf gedimmten Galaxie-Bereich**: Pivot-Open + Pan-Drag-Versuch — soll Pan starten oder Pivot schließen? Annahme: Pan startet (Pan-Drag ist `pointerdown`+`pointermove`, Outside-Detection nur `pointerdown`-without-move). State-Machine-Detail im Step 7 verifiziert.
- **Hover-Glow-Halo-Radius**: für RepoSun `r * 1.4` ist großzügig; für FilePlanet `r * 1.4 = 5.6 px` ist eventuell unsichtbar. Adaptive Halo-Radius (min 8 px) — Acceptance-Walk-Tune.
- **Auto-Tour-Pivot-Interferenz**: Auto-Tour öffnet Inspector via `setInspectorFileId(file.id)` — nutzt bestehenden File-Mode. Sub-C-`target`-Prop-Migration darf nicht brechen. Step 8 verifiziert.

## 13. Geschätzter Aufwand

- **Step 1 (types.ts Erweiterung)**: ~5 min
- **Step 2 (edges.ts)**: ~25 min
- **Step 3 (orbits.ts)**: ~20 min
- **Step 4 (Hover-Glow auf 3 PIXI-Klassen)**: ~30 min
- **Step 5 (GalaxieScene Edge+Orbit mount + redraw)**: ~30 min
- **Step 6 (GalaxieScene Hover-Reveal-Refactor)**: ~40 min
- **Step 7 (GalaxieScene Datadog-Pivot + Dim-Others + ESC)**: ~60 min
- **Step 8 (Inspector Folder-Mode + Click-Outside)**: ~70 min (größter Block: Tabs + Breakdown-Chips + Findings-Liste + Click-Outside-State-Coord)
- **Step 9 (SolarListView NEW)**: ~50 min
- **Step 10 (GalaxieRoot Mobile-Branch)**: ~10 min
- **Step 11 (StaticGalaxieSVG Orbits + Edges permanent)**: ~20 min
- **Step 12 (Tests + Build)**: ~15 min
- **Step 13 (Dev-Server + Acceptance-Walk Desktop + Mobile + Landing + Reduced-Motion)**: ~40 min

**Gesamt Sub-C: ~5.5–6 h** (Master schätzte 4–5 h; +1 h wegen Inspector-Folder-Mode-Komplexität + ESC/Click-Outside-State-Coord). 1 PR oder Direct-Commit auf `main`.

**Nach Sub-C-Done**: Master-Plan + alle 3 Sub-Pläne via `git mv` nach `docs/plans/done/galaxie-workspace-solar-redesign/`. Changelog-Update. Galaxie-Workspace-Solar-Master ✅.
