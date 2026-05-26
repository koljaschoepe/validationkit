# Plan — Galaxie-Workspace-Solar Sub-Phase A: Layout-Foundation

> Erstellt: 2026-05-26
> Status: 🟡 In Review
> Slug: `galaxie-workspace-solar-A-layout`
> Confidence: **High** — basiert auf 4 User-Entscheidungen (1 Discovery-Runde, 3 Recommended + 1 Override) + Code-Audit von `layout.ts` (113 LOC), `GalaxieScene.tsx` (Header + Layout-Wiring), `pixi/*.ts` (7 Files, 485 LOC) + Master-Plan
> Voraussetzung: Sub-Plan von `docs/plans/galaxie-workspace-solar-redesign.md` (Master). Sub-A ist die erste von 3 Sub-Phasen (A Layout → B Severity → C Hover+Mobile).

---

## 1. Ziel

Workspace-Galaxie wechselt von **flachem 3-Level-Layout (Customer→Repo→File mit Random-Jitter)** zu **deterministischem Multi-Sonnen-Cluster-Layout** mit Top-Folder-Ebene. Sub-A ist **pure Layout-Stufe**: neue Datenmodelle, neuer Layout-Algorithmus, neue PIXI-Klassen, alle Knoten rendern in **neutral-grey** ohne Severity-Farben, ohne Orbits, ohne Edges, ohne Hover-Interaktion. Severity + Edges + Hover folgen in Sub-B + Sub-C.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID    | Runde | Frage                                          | Antwort                                                                 |
|-------|-------|------------------------------------------------|-------------------------------------------------------------------------|
| QA1   | 1.1   | Multi-Repo-View bei 15 Repos                   | **Multi-Sonnen-Cluster** — jeder Repo = Sonne, Customer-Layer als räumliche Gruppierung der Sonnen (Cluster-Center pro Customer) |
| QA2   | 1.2   | Folder-Hierarchie-Tiefe                        | **Nur Top-Folder, 1 Ebene** — `apps/web/src/lib/auth.ts` → Folder `apps`. Rekursion ist Sub-C-Concern. |
| QA3   | 1.3   | Legacy-API-Migration                           | **Neue API parallel, MiniMap-bridge** — `solar-layout.ts` + `SolarLayoutNode` neu; alte `layout.ts` + `LayoutNode` bleiben unverändert für MiniMap (Out-of-Scope Phase-1) |
| QA4   | 1.4   | Test-Migration                                 | **Alte löschen, neue schreiben** (User-Override vs. Recommended "behalten") — `git rm layout.test.ts`, neue `solar-layout.test.ts` schreiben. Legacy `layout.ts` bleibt frozen + untested (akzeptiert, siehe §9). |

## 3. Existing-Patterns im Repo (Vorbild + zu Touch)

- **`apps/web/src/lib/galaxie/layout.ts:35-112`** — `computeLayout(data, opts)` mit `mulberry32`-RNG + `hashString`-Seed. **Pattern für Hash-Sortierung übernehmen** in neuer `solar-layout.ts` (deterministisch via Hash → reproducible Positions). Aber: ohne Random-Jitter (Sub-A ist deterministisch ohne Jitter, damit Tests einfach assertierbar).
- **`apps/web/src/lib/galaxie/types.ts:35-49`** — `FileNode` hat `path: string` (z.B. `apps/web/src/lib/auth.ts`). Aus diesem Path wird Top-Folder extrahiert.
- **`apps/web/src/components/galaxie/pixi/CustomerStar.ts`** (70 LOC), **`RepoMoon.ts`** (63 LOC), **`FileAsteroid.ts`** (74 LOC) — bestehende PIXI-Container-Klassen-Pattern (Class extending `Container`, Konstruktor `(entity, node, mobileScale)`, public `render()` oder Constructor-Render). Pattern wird übernommen für `RepoSun` / `FolderPlanet` / `FilePlanet`.
- **`apps/web/src/lib/galaxie/layout.test.ts:5-58`** — Vitest-Test-Pattern (5 it-blocks: Determinismus, Cardinality, Orbit-Distance, Parent-Mapping). **Pattern übernehmen** für neue `solar-layout.test.ts`.
- **`apps/web/src/components/galaxie/GalaxieScene.tsx:110-130`** — `computeLayout(galaxieData)` + `layoutById`-Map + `zoomLevels`-Memo aus Customer-Positionen. Wird auf `computeSolarLayout` + `SolarLayoutNode` umgestellt.
- **`apps/web/src/components/galaxie/StaticGalaxieSVG.tsx:58-60, 208`** — Parallele `computeLayout`-Konsumption + ViewBox-Berechnung aus Node-Coords. Gleiche Umstellung.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Single-Repo-Drill** (User wählt 1 Repo, sieht NUR diese Sonne) → Verworfen (QA1). Bricht Galaxie-Overview-USP, Power-User muss durch alle Repos scrollen.
- **Alt-B: Customer = Mega-Sonne, Repos = Planeten** (4-Ebenen-Hierarchie) → Verworfen (QA1 + Master-Q5). Master hat 4 Ebenen explizit als kognitiv schwerer abgelehnt; "Repo = Sonne" ist kompromisslos klarer Ankerpunkt.
- **Alt-C: Rekursive Folder-Hierarchie + Voll-Render in Sub-A** → Verworfen (QA2). Sprengt 3-4h-Sub-A-Scope auf 6-7h, Überschneidung mit Sub-C-Hover/Pivot-Mechanik.
- **Alt-D: Rekursive Datenstruktur in Sub-A, aber nur flacher Render** → Verworfen (QA2). +30 min Komplexität für hypothetisches Sub-C-Convenience. Sub-C kann das Datenmodell selbst rekursiv erweitern (additiv, kein Refactor nötig).
- **Alt-E: Hard-Replace `layout.ts` direkt in Sub-A** → Verworfen (QA3). MiniMap bricht visuell. Risk-Acceptance unklar, schlechter Diff für Code-Review.
- **Alt-F: MiniMap in Sub-A mitziehen** → Verworfen (QA3 + Master-§11). MiniMap = Out-of-Scope Phase-1, Scope-Bleed +1h.
- **Alt-G: Alte `layout.test.ts` umschreiben statt löschen** → Verworfen (QA4). Macht `git blame` schlechter, semantisch dieselbe Arbeit, andere Datei-Identität sauberer.

## 5. Endzustand

### 5.1 Datenmodell-Erweiterung (`apps/web/src/lib/galaxie/types.ts`)

Neuer `FolderNode`-Typ (synthetisch, aus Path-Aggregation):

```ts
export interface FolderNode {
  id: string;          // synthetic: `${repoId}::folder::${topFolderName}`
  repoId: string;
  customerId: string;
  name: string;        // Top-Folder-Name (z.B. 'apps', '.claude', 'src')
  fileCount: number;   // Anzahl Files unter diesem Top-Folder
  aggregateSeverity: Severity; // worst-child unter den Files dieses Folders
}
```

Neuer `SolarLayoutNode`-Typ (parallel zu altem `LayoutNode`, alter bleibt unverändert für MiniMap):

```ts
export type SolarNodeKind = 'sun' | 'folder' | 'file';

export interface SolarLayoutNode {
  id: string;
  kind: SolarNodeKind;
  repoId: string;          // alle Knoten gehören zu einem Repo-Cluster (sun.repoId == self.id)
  customerId: string;      // Cluster-Gruppierung
  x: number;               // global world coords
  y: number;
  orbitRadius?: number;    // distance vom Sun-Center, undefined für Sun selbst
  parentSunId?: string;    // = repoId, undefined für Sun selbst
}

export interface SolarLayout {
  nodes: SolarLayoutNode[];
  folders: FolderNode[];   // synthetische Folder-Knoten, parallel zu nodes
}
```

Alte `LayoutNode` + `GalaxieLayout` bleiben unverändert (für MiniMap-Bridge). JSDoc-Annotation `@deprecated Use SolarLayoutNode from solar-layout.ts. Will be removed in MiniMap-Migration-Phase.` als Lese-Hinweis.

### 5.2 Layout-Berechnung (`apps/web/src/lib/galaxie/solar-layout.ts` — NEW)

Konstanten (Co-located, ohne separates Config-File):

```ts
export const SOLAR_LAYOUT_CONSTANTS = {
  CUSTOMER_CLUSTER_RADIUS: 600,   // Customer-Cluster-Center auf Kreis um Origin
  SUN_ORBIT_IN_CLUSTER: 220,      // Sonnen verteilt auf Inner-Ring um Customer-Center
  FOLDER_ORBITS: [60, 95] as const, // 2 innere Orbits für Folder-Planeten
  FILE_ORBIT: 130,                // Outer-Orbit für Root-Files (Files ohne Folder)
  SUN_RADIUS: 28,                 // PIXI-Render-Radius (Layout: nur als Sun-Position-Marker)
  FOLDER_PLANET_RADIUS: 8,
  FILE_PLANET_RADIUS: 4,
} as const;

export function computeSolarLayout(data: GalaxieData): SolarLayout;
```

Algorithmus:

1. **Customer-Cluster-Centers** auf Kreis Radius `CUSTOMER_CLUSTER_RADIUS` um Origin. Customer-Index sortiert by `customer.slug` (deterministisch). Pro Customer ein Cluster-Center `(cx_c, cy_c)`.
2. **Sun-Positionen pro Customer**: Sonnen (Repos) dieses Customers verteilt auf Inner-Ring `SUN_ORBIT_IN_CLUSTER` um Cluster-Center. Repo-Sort by `hashString(repo.slug)` ASC, dann gleichmäßiges Winkel-Spreading `(2π/n)`. Sun-Position `(cx_c + cos(angle) * 220, cy_c + sin(angle) * 220)`.
3. **Folder-Extraction**: pro Repo gruppiere Files by Top-Folder. Top-Folder-Extraction: `path.split('/')[0]` wenn Path Slashes enthält, sonst `null` (= Root-File). `fileCount` + `aggregateSeverity` werden aggregiert.
4. **Folder-Planet-Positionen**: pro Sun verteile Folder-Knoten deterministisch auf `FOLDER_ORBITS[0]=60` (erste 6 Folder) und `FOLDER_ORBITS[1]=95` (Folder 7+). Innerhalb eines Orbits gleichmäßiges Winkel-Spreading, sortiert by `hashString(folder.name)`. Position relativ zur Sun + dann auf World-Coords addiert.
5. **File-Planet-Positionen** (nur Root-Files ohne Top-Folder): auf `FILE_ORBIT=130`, gleichmäßiges Winkel-Spreading, sortiert by `hashString(file.id)`.
6. **Output**: flache `nodes`-Liste (Sun + Folder + File) + `folders`-Liste (für UI-Konsumption der `FolderNode`-Aggregat-Properties).

**Determinismus**: kein RNG, kein Jitter. Nur Hash-basierte Sortierung + Modular-Winkel. Identischer Input → identischer Output, byte-für-byte.

**Edge-Cases**:
- Customer mit 0 Repos: Cluster-Center wird übersprungen (kein Sun emittiert).
- Repo mit 0 Files: Sun emittiert, keine Folder/Files. Sonne erscheint nackt im Cluster.
- Folder mit > N Children → in Sub-A nicht relevant (Folder-Knoten sind synthetisch, halten nur `fileCount`; Children werden in Sub-A noch nicht gezeigt — sind Sub-C-Concern bei rekursivem Pivot).
- File ohne Slash im Path (z.B. `README.md`): Root-File, kein Folder.
- File mit Leading-Slash oder Dot-Slash (`.claude/...`): Top-Folder = `.claude` (Standard `split('/')[0]`).

### 5.3 PIXI-Klassen-Ersetzung (`apps/web/src/components/galaxie/pixi/*`)

**DELETE**:
- `CustomerStar.ts`
- `RepoMoon.ts`
- `FileAsteroid.ts`

**CREATE**:
- `RepoSun.ts` — Sun-Sprite. PIXI-Graphics-Render mit 3 konzentrischen Layers (Inner-Core, Mid-Halo, Outer-Corona, alle neutral-grey OKLCH oder hex-Approximation in Sub-A). Konstruktor `(repo, sunNode, mobileScale)`. **Keine Severity-Color, keine Pulse, keine Hover-Glow** (kommt in Sub-B/C).
- `FolderPlanet.ts` — Folder-Sprite. PIXI-Graphics-Circle Radius 8, neutral-grey-Fill (`oklch(0.70 0 0)` als hex approximiert). Konstruktor `(folder, folderNode, mobileScale)`. **Keine Severity, keine Edge-Badge, kein Gradient** (kommt in Sub-B).
- `FilePlanet.ts` — File-Sprite. PIXI-Graphics-Circle Radius 4, neutral-grey-Fill. Konstruktor `(file, fileNode, mobileScale)`. Gleiche Constraints wie FolderPlanet.

**OrbitRing**: nicht als separate Klasse-Datei in Sub-A. Orbits sind in Sub-A **invisible** (Master §5.2: Default-Alpha 0.0). Sub-C macht Hover-Reveal. In Sub-A werden keine Orbit-Graphics emittiert (späterer Add in Sub-C, dort als separate Klasse oder inline).

**KEEP unverändert**:
- `Camera.ts` (82 LOC) — Camera-Math + applyTo-Logic
- `Camera.test.ts` (62 LOC) — bleibt grün
- `quadtree.ts` (94 LOC) — Spatial-Index für Hit-Testing (wird in Sub-C aktiv genutzt)
- `quadtree.test.ts` (40 LOC) — bleibt grün

### 5.4 GalaxieScene.tsx Umstellung

- Import-Swap: `computeLayout` → `computeSolarLayout`, `LayoutNode` → `SolarLayoutNode`, alte 3 PIXI-Klassen → neue 3.
- `layoutById`-Map: jetzt `Map<string, SolarLayoutNode>`.
- `zoomLevels`-Memo: war auf `customers[0..2]` (Customer-Positionen) fokussiert. Jetzt: Snap-Levels 2-4 fokussieren auf die **3 Customer-Cluster-Centers** (gleiche Positionen wie früher, nur logisch jetzt "Cluster" statt "Customer"). Wide-Out + Default-Zoom bleiben unverändert.
- Render-Loop: für jeden `SolarLayoutNode` instanziiere die passende Klasse (`switch (node.kind)`). Keine Severity-Color-Lookups in Sub-A (alle neutral-grey).
- Hover/Click/Pivot-Logik: **bleibt strukturell vorhanden** aber wird auf neutral-grey Knoten degradiert (kein Severity-Glow, kein Pulse). Sub-B + Sub-C aktivieren das.
- `inspectorFileId`-State + `Inspector`-Komponente: **bleiben unverändert in Sub-A** (Inspector-Modal funktioniert weiter, wird in Sub-C zum Side-Panel umgebaut).

### 5.5 StaticGalaxieSVG.tsx Umstellung

- Gleicher Import-Swap.
- `viewBox`-Berechnung: `computeViewBox(nodes)` bekommt `SolarLayoutNode[]`. Math identisch (min/max der x/y).
- SVG-Render: pro Node ein `<circle>` mit passendem Radius (28/8/4), neutral-grey-Fill. Keine Severity-Color, keine Orbits, keine Edges in Sub-A.

### 5.6 Tests grün (Acceptance Bottom-Line Sub-A)

- `pnpm typecheck` ✓
- `pnpm test apps/web/src/lib/galaxie/` ✓ — `mock-data.test.ts`, `severity-colors.test.ts`, `solar-layout.test.ts` (neu) grün
- `pnpm test apps/web/src/components/galaxie/pixi/` ✓ — `Camera.test.ts`, `quadtree.test.ts` grün
- `pnpm --filter @vk/web build` ✓
- Acceptance-Walk auf `http://localhost:3000/[workspace]` (siehe §8 Manuell-Checkliste)

## 6. Schritte

- [ ] **Step 1**: `apps/web/src/lib/galaxie/types.ts` erweitern um `FolderNode`, `SolarNodeKind`, `SolarLayoutNode`, `SolarLayout`. Alte Typen mit `@deprecated`-JSDoc annotieren.
- [ ] **Step 2**: `apps/web/src/lib/galaxie/solar-layout.ts` (NEW) schreiben — `computeSolarLayout()` + `SOLAR_LAYOUT_CONSTANTS`-Export + Hash-Util (DRY-share aus `layout.ts` durch Re-Import oder Copy — Copy ist OK, 8 LOC).
- [ ] **Step 3**: `apps/web/src/lib/galaxie/solar-layout.test.ts` (NEW) schreiben — 6 Tests (siehe §8 Auto-Test-Liste).
- [ ] **Step 4**: `apps/web/src/lib/galaxie/layout.test.ts` löschen via `git rm`.
- [ ] **Step 5**: `apps/web/src/components/galaxie/pixi/RepoSun.ts` (NEW), `FolderPlanet.ts` (NEW), `FilePlanet.ts` (NEW) schreiben. Pattern aus alten Klassen übernehmen (Container-Extension, Constructor mit Mobile-Scale, neutral-grey-Render).
- [ ] **Step 6**: `apps/web/src/components/galaxie/pixi/CustomerStar.ts`, `RepoMoon.ts`, `FileAsteroid.ts` löschen via `git rm`.
- [ ] **Step 7**: `apps/web/src/components/galaxie/GalaxieScene.tsx` umstellen — Imports + `layoutById` + `zoomLevels`-Memo (Cluster-Centers statt Customer-Positions) + Render-Loop (`switch node.kind`).
- [ ] **Step 8**: `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx` umstellen — gleicher Import-Swap, SVG-Render-Loop, ViewBox-Berechnung.
- [ ] **Step 9**: `pnpm typecheck` + `pnpm test apps/web/src/lib/galaxie/` + `pnpm test apps/web/src/components/galaxie/pixi/` + `pnpm --filter @vk/web build` — alle grün.
- [ ] **Step 10**: Dev-Server `pnpm --filter @vk/web dev` starten, Acceptance-Walk auf `http://localhost:3000/[workspace]` durch §8 Manuell-Checkliste.

## 7. Files-to-Change

| Datei                                                                  | Aktion | Was passiert                                                                                              |
|------------------------------------------------------------------------|--------|-----------------------------------------------------------------------------------------------------------|
| `apps/web/src/lib/galaxie/types.ts`                                    | EDIT   | Erweitert um `FolderNode`, `SolarNodeKind`, `SolarLayoutNode`, `SolarLayout`. Alte `LayoutNode`/`GalaxieLayout`/`LayoutLevel` bleiben + `@deprecated` JSDoc. |
| `apps/web/src/lib/galaxie/solar-layout.ts`                             | CREATE | `computeSolarLayout()` + `SOLAR_LAYOUT_CONSTANTS`-Export. Deterministisches Multi-Sonnen-Cluster-Layout mit Top-Folder-Aggregation. |
| `apps/web/src/lib/galaxie/solar-layout.test.ts`                        | CREATE | 6 Vitest-Tests (Determinismus, Cardinality pro Repo, Top-Folder-Extraction inkl. Edge-Cases, Cluster-Distance-Bounds, Orbit-Distance-Bounds, Parent-Sun-ID-Mapping). |
| `apps/web/src/lib/galaxie/layout.test.ts`                              | DELETE | `git rm` — alte Tests gehören zur alten `computeLayout`, die in Sub-A nicht mehr von GalaxieScene/StaticGalaxieSVG konsumiert wird. `layout.ts` selbst bleibt für MiniMap-Bridge. |
| `apps/web/src/components/galaxie/pixi/RepoSun.ts`                      | CREATE | PIXI-Container-Klasse für Sun-Body. Neutral-grey 3-Layer-Render (Inner/Mid/Outer). Constructor `(repo, sunNode, mobileScale)`. |
| `apps/web/src/components/galaxie/pixi/FolderPlanet.ts`                 | CREATE | PIXI-Container-Klasse für Folder-Planet. Neutral-grey Circle Radius 8. |
| `apps/web/src/components/galaxie/pixi/FilePlanet.ts`                   | CREATE | PIXI-Container-Klasse für File-Planet. Neutral-grey Circle Radius 4. |
| `apps/web/src/components/galaxie/pixi/CustomerStar.ts`                 | DELETE | Ersetzt durch neues `RepoSun.ts`. |
| `apps/web/src/components/galaxie/pixi/RepoMoon.ts`                     | DELETE | Ersetzt durch neues `RepoSun.ts` + `FolderPlanet.ts`-Konzept. |
| `apps/web/src/components/galaxie/pixi/FileAsteroid.ts`                 | DELETE | Ersetzt durch neues `FilePlanet.ts`. |
| `apps/web/src/components/galaxie/GalaxieScene.tsx`                     | EDIT   | Import-Swap (`computeSolarLayout`, `SolarLayoutNode`, 3 neue PIXI-Klassen). `layoutById`-Map-Typ. `zoomLevels`-Memo nutzt Cluster-Centers. Render-Loop `switch (node.kind)`. Hover/Click/Pivot-Strukturen bleiben, nur Knoten-Render ist neutral-grey. |
| `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx`                 | EDIT   | Gleicher Import-Swap + ViewBox-Berechnung + SVG-Render-Loop (kein Severity, kein Orbit, neutral-grey Circles). |

**Bewusst NICHT touched in Sub-A**:
- `apps/web/src/lib/galaxie/layout.ts` (frozen für MiniMap-Bridge per QA3)
- `apps/web/src/components/galaxie/MiniMap.tsx` (Out-of-Scope Phase-1)
- `apps/web/src/components/galaxie/Inspector.tsx` (bleibt funktional, wird erst in Sub-C zum Side-Panel)
- `apps/web/src/lib/galaxie/severity-colors.ts` (Sub-B-Concern)
- `apps/web/src/lib/galaxie/mock-data.ts` + `mock-data.test.ts` (Daten + Tests bleiben unverändert)
- `apps/web/src/components/galaxie/pixi/Camera.ts` + `quadtree.ts` (+ deren Tests)
- `apps/web/src/components/galaxie/UniversalSearch.tsx`, `Tooltip.tsx`, `ZoomIndicator.tsx`, `WorkspaceSwitcher.tsx`, `OnboardingBanner.tsx`, `ActivationChecklist.tsx`, `EmptyGalaxie.tsx`, `GalaxieRoot.tsx`, `GalaxieSkeleton.tsx`

## 8. Test-Plan

**Automatisch:**

- `pnpm typecheck` ✓ (whole monorepo)
- `pnpm test apps/web/src/lib/galaxie/` ✓ — neue Tests in `solar-layout.test.ts`:
  - Test 1: `computeSolarLayout` ist deterministisch (gleicher Input → identische Output-Struktur, byte-für-byte via `toEqual`).
  - Test 2: Pro Repo wird genau 1 Sun-Knoten emittiert. Mock-Data (15 Repos) → 15 Suns in `nodes`.
  - Test 3: Top-Folder-Extraction — assertet `folders.length` für deterministisches Input. Edge-Cases: Path mit Slash (`apps/web/src/...` → folder `apps`), Path ohne Slash (`README.md` → Root-File, kein Folder), Dot-Path (`.claude/agents/...` → folder `.claude`).
  - Test 4: Sonnen eines Customers liegen innerhalb `SUN_ORBIT_IN_CLUSTER + 1px` Distanz vom Cluster-Center.
  - Test 5: Folder-Planeten liegen exakt auf einem der `FOLDER_ORBITS` Radii (60 oder 95) vom Sun-Center (distance-bounds ±0.001).
  - Test 6: Alle Folder + File Knoten haben `parentSunId === repoId` und der Sun mit `id === parentSunId` existiert in `nodes`.
- `pnpm test apps/web/src/components/galaxie/pixi/` ✓ — bestehende `Camera.test.ts` + `quadtree.test.ts` bleiben grün (kein Touch).
- `pnpm --filter @vk/web build` ✓ — Smoke-Check Next.js-Build.

**Manuell (Acceptance-Checkliste — am Dev-Server `http://localhost:3000/[workspace]`):**

Layout-Rendering:
- [ ] Sonnensystem-Layout sichtbar: 3 Customer-Cluster verteilt auf großem Kreis, in jedem Cluster 5 Sonnen auf Inner-Ring.
- [ ] Repo-Sonnen sind deutlich größer (Radius 28) als Planeten (Folder 8 / File 4).
- [ ] Pro Sonne sind Folder-Planeten auf zwei inneren Orbits (60/95), File-Planeten (Root-Files ohne Folder) auf äußerem Orbit (130).
- [ ] Reload der Seite → identische Positionen aller Knoten (Determinismus visuell verifizierbar via überlagernde Screenshots oder DOM-Inspect).
- [ ] Default-Render ist monochrom: alle Knoten neutral-grey, keine Severity-Farbe sichtbar.
- [ ] Keine Orbits, keine Edges, keine Labels, keine Tooltips sichtbar im Default-State.

Bestehende Interaktion (degradiert):
- [ ] Pan via Mouse-Drag funktioniert wie vorher.
- [ ] Wheel-Zoom + Pinch-Zoom funktionieren wie vorher.
- [ ] Snap-Zoom-Levels (Keyboard 1-4 falls eingerichtet) fokussieren auf die 3 Customer-Cluster-Centers + Wide-Out + Default.
- [ ] Hover auf Knoten zeigt Tooltip (bestehende Logik, keine visuelle Severity-Highlight in Sub-A — degradiert OK).
- [ ] Click auf Knoten öffnet bestehenden Inspector-Modal (bleibt unverändert in Sub-A, wird in Sub-C ersetzt).
- [ ] WorkspaceSwitcher funktioniert (wechselt Mock-Daten + re-rendert Galaxie).

Konsole:
- [ ] Keine React-Hydration-Warnings, keine PixiJS-Errors, keine Typecheck-Errors.

Reduced-Motion (System-Pref Reduce-Motion ON):
- [ ] Static-SVG-Fallback rendert das gleiche Multi-Sonnen-Cluster-Layout (kein Severity, keine Orbits, keine Edges in Sub-A).

## 9. Risiken + Mitigation

| Risiko                                                                                                                | Severity | Mitigation                                                                                                                                                                                                       |
|-----------------------------------------------------------------------------------------------------------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Legacy `layout.ts` ohne Tests (QA4 löschte `layout.test.ts`, aber `layout.ts` bleibt für MiniMap-Bridge)              | Mid      | `layout.ts` + `LayoutNode` mit `@deprecated`-JSDoc annotieren ("Will be removed in MiniMap-Migration-Phase"). MiniMap konsumiert nur den `LayoutNode`-Typ; Code-Pfad ist frozen, kein erwarteter Edit in Phase-1. |
| Cluster-Layout: 5 Sonnen pro Customer auf 220-Inner-Ring + Sun-Total-Reach 158 → Sonnen-Overlap                       | Strong   | Tangential-Distance bei 5 Sonnen auf 220-Ring = 2·220·sin(36°) ≈ 259 px. Sun-Total-Diameter 316 px → leichter Overlap der äußeren Orbits zwischen Nachbarsonnen. **Acceptance-Walk-Visual-Check**. Wenn Overlap visuell stört → `SUN_ORBIT_IN_CLUSTER` auf 280 erhöhen (Folge-Iter). Akzeptiertes Phase-1-Risiko. |
| Camera-zoomLevels nutzte `customers[0..2]` aus altem Layout — neue API hat keine Customer-Knoten im `nodes`-Array      | Mid      | `zoomLevels`-Memo aus den 3 Cluster-Centers ableiten (deterministisch berechnet by Customer-Slug-Sort). Cluster-Centers werden im `solar-layout.ts` als Hilfs-Funktion `getClusterCenters(data)` exportiert. |
| `mock-data.ts` hat 5 fixe Repo-Namen (`['core', 'agents', 'docs-portal', 'pipeline', 'platform']`) + 10 fixe FILE_PATHS pro Repo → Top-Folder-Verteilung könnte Cluster ungleichmäßig füllen | Weak     | Mock-Daten sind static + bekannt. Test 3 (Top-Folder-Extraction) assertet konkrete Folder-Anzahl für Mock-Input. Wenn Verteilung visuell unausgewogen → Out-of-Scope-Note für Folge-Phase (Mock-Data-Tuning). |
| GalaxieScene `aggregateSeverity` auf `RepoSun`-Sprites gerendert (alter `RepoMoon.constructor` hatte `repo.aggregateSeverity`) — in Sub-A nicht sichtbar weil neutral-grey, aber Code-Pfad muss erhalten bleiben | Mid      | `RepoSun.constructor(repo, sunNode, mobileScale)` nimmt `repo` als Param (analog zu `RepoMoon`). Severity-Property wird intern als Klassen-Field gespeichert, in Sub-A nicht zum Render genutzt. Sub-B/C aktivieren den Render. |
| `Inspector.tsx` consumiert in `searchParams?.get('file')` ein File-ID + matched gegen `galaxieData.files`. Neues Layout ändert das `files`-Array nicht → Inspector-Open funktioniert weiter. | Weak     | Verifiziert über Acceptance-Walk-Manuell-Check (Click auf Planet öffnet bestehenden Inspector). |
| `MiniMap.tsx` consumiert `LayoutNode[]` aus altem `computeLayout` — in Sub-A wird das ABER nicht mehr aus `GalaxieScene` gepasst, MiniMap müsste eigene `computeLayout`-Instanz haben | Strong   | **Check Step 7**: schaut wie `MiniMap` heute `layoutById` bekommt (Prop von GalaxieScene? eigene Instanz?). Wenn Prop: GalaxieScene erstellt zusätzlich `legacyLayout = computeLayout(galaxieData)` nur für MiniMap-Prop-Pass. Block-Step-Resolver-Trigger wenn Architektur anders. |
| Vitest schreibt `apps/web/src/lib/galaxie/solar-layout.test.ts` Snapshot-Frei (kein `toMatchSnapshot`)                | Weak     | Tests basieren auf assertable Properties (Cardinality, Distance-Bounds), nicht auf Snapshots. Snapshots wären brittle bei Hash-Function-Änderungen. |
| PIXI-Klassen-Render-Pattern: alte Klassen haben `addChild(graphic)` im Constructor; neue müssen gleiches Pattern erhalten damit `worldRef.current.addChild(repoSun)` funktioniert | Mid      | Klassen extenden `Container` (PIXI). Constructor füllt `this` via `this.addChild(...)`. Pattern aus `CustomerStar.ts` als Vorbild übernehmen (vor Delete kopieren). |
| Build-Time-Bundle-Size: 3 neue PIXI-Klassen-Files vs 3 gelöschte → Netto-Null, aber Implementation-Komplexität pro Klasse größer (3-Layer-Sun-Body)  | Weak     | Sun-Body-Render ist ~30 LOC PIXI-Graphics. Acceptance-Walk-Bundle-Check via `pnpm --filter @vk/web build` Output (sollte ~ähnlich groß bleiben). |
| Z-Order: Sonnen müssen unter Planeten gerendert werden, damit Planet-Overlap auf Sun nicht von Sun-Halo überdeckt wird | Mid      | `worldRef.current.addChild(...)` Reihenfolge: erst alle Sonnen, dann alle Folder-Planeten, dann alle File-Planeten. Sortierung im Render-Loop: `nodes.sort((a,b) => kindOrder(a.kind) - kindOrder(b.kind))` wo Sun < Folder < File. |
| User-Override QA4 (Tests löschen statt behalten): `layout.test.ts` weg, `layout.ts` bleibt → Legacy-Drift-Risk in Folge-Sessions | Weak     | Mitigation siehe oben (@deprecated JSDoc). User-Override ist bewusste Entscheidung, dokumentiert in §2 Audit-Trail. |

## 10. Rollout

- **Strategie**: Hard-Replace (per Master-Q12). Solo-Developer-Repo, kein Branch-Review nötig. **Sub-A = 1 PR oder Direct-Commit auf `main`**. Sub-B + Sub-C bekommen jeweils eigenen PR/Commit (Pacing-Pattern).
- **Pre-Deploy-Gates** (vor Sub-A-Done):
  - `pnpm typecheck` grün
  - `pnpm test apps/web/src/lib/galaxie/` grün (inkl. neue `solar-layout.test.ts`)
  - `pnpm test apps/web/src/components/galaxie/pixi/` grün (Camera + quadtree)
  - `pnpm --filter @vk/web build` grün
  - Acceptance-Walk §8 Manuell-Checkliste komplett (User-Verifikation)
  - Reduced-Motion-Pfad (Static-SVG) zeigt Multi-Sonnen-Cluster-Layout
- **Post-Deploy-Verifikation**: (kein Deploy in Sub-A — Sub-C wird deployed; Sub-A geht in `main`)
- **Rollback-Trigger**:
  - Visual-Regression: Galaxie rendert gar nichts mehr, oder Layout ist visuell broken (Sonnen weit außerhalb Viewport, etc.).
  - Console-Errors: PixiJS-Errors, Hydration-Warnings.
  - MiniMap visuell broken (sollte funktional bleiben da Bridge).
- **Rollback-Schritte**: `git revert <sub-A-commit>` → MiniMap zurück auf alten Layout-Pfad, GalaxieScene/StaticGalaxieSVG zurück auf alte 3-Level-Klassen. Sub-Plan-File bleibt in `docs/plans/`, Status auf 🟡 In Review zurück.

## 11. Out-of-Scope (Sub-B / Sub-C / V2)

- **Severity-Farben + Asymm-Salienz-Palette** (`severity-colors.ts` Update) → **Sub-B** (`galaxie-workspace-solar-B-severity`)
- **Kill-Pulse via GSAP-Tween** → **Sub-B**
- **Edge-Badges (Lucide-Icons via PIXI-Texture)** → **Sub-B**
- **Sun-Body Light-Layers in Severity-Color** → bleibt neutral-grey auch nach Sub-B (Master §5.1 sagt "Keine Severity-Farbe auf der Sonne"); Worst-Child-Aggregate-Badge auf Sun ist Sub-B
- **Orbit-Rings sichtbar machen + Hover-Reveal** → **Sub-C**
- **Hierarchie-Edges Sun → Children** → **Sub-C**
- **Datadog-Pivot (Center-Tween + Side-Panel)** → **Sub-C**
- **Side-Panel-Komponente** (`SolarInspectorPanel.tsx`) → **Sub-C**, ersetzt bestehenden Inspector-Modal
- **Mobile-List-View** (`SolarListView.tsx`) ≤768 px → **Sub-C**
- **Rekursive Folder-Hierarchie** (Pivot in Folder → Sub-Sonne) → **Sub-C** (Folder-Knoten in Sub-A halten `fileCount`, aber Sub-C entscheidet ob Folder-Click rekursiv pivotiert oder direkt zum Folder-Inspektor öffnet)
- **MiniMap-Migration** auf Sonnensystem-Layout → Folge-Phase nach Sub-C
- **UniversalSearch-Anpassung** an Sonnensystem-Navigation → Folge-Phase
- **Performance-Tuning** für 1000+ File-Repos → Folge-Phase
- **Multi-Cluster-Overflow-Mitigation** (wenn 1 Customer > 8 Repos → 2-Ring-Verteilung) → Folge-Iter wenn Acceptance-Walk visuell stört

## 12. Open Questions (Post-Execute-Items)

- **`MiniMap.tsx` Prop-Architektur**: Step 7 verifiziert ob `layoutById` als Prop von GalaxieScene gepasst wird oder MiniMap eigene `computeLayout`-Instanz baut. Wenn Prop-Pass → GalaxieScene muss `legacyLayout = computeLayout(galaxieData)` zusätzlich erstellen für MiniMap-Prop. Wenn eigene Instanz in MiniMap → kein GalaxieScene-Touch nötig. Block-Step-Resolver bei Architektur-Mismatch.
- **Sonnen-Overlap-Visual-Check**: Inner-Ring 220 + 5 Sonnen/Customer + Sun-Total-Reach 158 → äußere Orbits benachbarter Sonnen werden sich leicht überlappen. Acceptance-Walk klärt ob das visuell OK ist oder `SUN_ORBIT_IN_CLUSTER`-Tuning braucht.
- **`extractTopFolder` Edge-Case `path === ''`**: Unwahrscheinlich (Mock-Data hat keine leeren Paths), aber defensiv: leerer Path → Root-File (kein Folder).

## 13. Geschätzter Aufwand

- **Step 1 (types.ts)**: ~15 min
- **Step 2 (solar-layout.ts)**: ~60 min
- **Step 3 (solar-layout.test.ts)**: ~30 min
- **Step 4 (git rm layout.test.ts)**: ~2 min
- **Step 5 (3 neue PIXI-Klassen)**: ~50 min
- **Step 6 (git rm 3 alte PIXI-Klassen)**: ~3 min
- **Step 7 (GalaxieScene Umstellung + MiniMap-Bridge)**: ~45 min
- **Step 8 (StaticGalaxieSVG Umstellung)**: ~25 min
- **Step 9 (Auto-Tests + Build)**: ~15 min
- **Step 10 (Dev-Server + Acceptance-Walk)**: ~30 min

**Gesamt Sub-A: ~4–4.5 h** (Master schätzte 3–4 h; +30 min wegen MiniMap-Bridge-Architektur-Check und Sun-Body-3-Layer-Render-Komplexität). 1 PR oder Direct-Commit auf `main`.

**Nach Sub-A-Done**: User reviewt Acceptance-Walk → `/plan galaxie-workspace-solar-B-severity` als nächster Sub-Plan-Cycle.
