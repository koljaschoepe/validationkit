# Plan — Repo-Galaxie MVP (Landing-Hero als USP)

> Erstellt: 2026-05-20
> Status: ✅ Done — 2026-05-20 (Lighthouse-Run als User-Action ausstehend)
> Slug: `repo-galaxie-mvp`
> Dauer-Schätzung: 1 Sprint = 5-7 Tage Solo
> Ersetzt: Phase-Nova-Master-Plan + nova-1 + nova-2 (alle als ⛔️ Superseded markiert)
> Basis: Synthese aus 15 Sub-Agents (lokale Code-Audits + externe Industry-Recherche) + USP-Klärung User 2026-05-20

---

## 1. Ziel

Aus der heutigen Landing wird eine **Repository-Galaxie**, die das Unique-Selling-Point von ValidationKit zeigt: GitHub-Repository-Strukturen + Submodul-Beziehungen + Folder-Hierarchien räumlich-spielerisch navigierbar. Minimal, clean, in Grautönen mit zarter Planeten-Andeutung. Severity-Findings sind **Akzente** auf den Knoten, nicht das Hauptobjekt. 3 Findings klickbar, Inspector öffnet rechts. Ein Sprint, dann sitzt es.

---

## 2. USP-Statement (entscheidend, kommt aus User-Klärung)

**ValidationKit ist nicht "noch ein Audit-Tool"**, das Findings als Liste anzeigt. Sentry, Snyk, Greptile, CodeRabbit machen das alle (siehe Sub-Agent 8 — gleiches Severity-Encoding, gleiches Tabbed-Inline-Pattern).

**ValidationKit ist das einzige Tool**, das GitHub-Strukturen — Customer → Repo → **Submodule** → Folder → File — als eine **räumliche Galaxie** zeigt, in der Beziehungen sichtbar werden, die heute nur in `.gitmodules`-Files stehen. Eine Agency-Lena, die 30 Customer-Repos mit jeweils 5-10 Submodulen verwaltet, hat dafür kein Tool. Submodule sind heute **operativer Schmerzpunkt** — outdated commits, broken refs, parallele Versions-Drift. Diese visuell auflösbar zu machen ist der spielerische Acquisition-Hook.

**Findings/Severity sind Akzente** — sie sitzen *auf* den Knoten als 1px-Outline in Severity-Color, sie sind nicht selbst die Knoten. Das ist die kategoriale Differenzierung.

---

## 3. Design-DNA: minimal, clean, leicht-angedeutet

Aus der User-Anweisung kondensiert + Sub-Agents 6 (Premium-Hero) + 11 (Stack) + 13 (Severity-Encoding):

### 3.1 Knoten-Hierarchie

| Ebene       | Sphäre-Größe | Grauton (oklch L)    | Beispiel              |
|-------------|--------------|----------------------|------------------------|
| Workspace   | 80 px        | `oklch(0.85 0 0)`    | „agency-lena"          |
| Customer    | 60 px        | `oklch(0.75 0 0)`    | „acme-fintech"         |
| Repo        | 44 px        | `oklch(0.65 0 0)`    | „payments-api"         |
| Submodule   | 28 px        | `oklch(0.55 0 0)`    | „shared-types"         |
| Folder      | 20 px        | `oklch(0.50 0 0)`    | „src/auth/"            |
| File        | 8-10 px      | `oklch(0.45 0 0)`    | „config.ts"            |

Größen-Schritt = ~⅔ pro Ebene → klare visuelle Hierarchie ohne Comic-Effekt.

### 3.2 Sphäre-Rendering (NICHT mega-komplex)

SVG `<circle>` mit `<radialGradient>` (heller Center, dunkler Rand) — gibt 3D-Andeutung **ohne 3D-Rendering**. Kein Bloom-Filter, kein WebGL, kein Postprocessing-Stack. Pro Ebene ein Gradient-Preset.

```svg
<radialGradient id="sphere-repo" cx="35%" cy="35%">
  <stop offset="0%"  stop-color="oklch(0.75 0 0)" />
  <stop offset="60%" stop-color="oklch(0.65 0 0)" />
  <stop offset="100%" stop-color="oklch(0.55 0 0)" />
</radialGradient>
```

Sub-Agent 11 hat empirisch gezeigt: Linear-Premium-Wirkung kommt aus **Timing + Easing + Layering**, nicht aus Polygonen. Stripe macht Mesh-Gradients in 10 KB — niemand braucht Three.js für 8-20 Knoten.

### 3.3 Verbindungen

| Edge-Kind         | SVG-Style                             | Bedeutung                                          |
|-------------------|---------------------------------------|----------------------------------------------------|
| `contains`        | 1 px solid, `oklch(0.30 0 0)`         | Workspace→Customer, Customer→Repo, Repo→File       |
| `submodule-link`  | 1 px dashed `(4,3)`, `oklch(0.40 0 0)`| Repo→Submodule — Submodule ist eigenes Repo, eingebettet |
| `depends-on` (V2) | 1 px dotted + arrow-head              | Package-Beziehungen — Roadmap-Erweiterung           |

Edges sind **statisch**, kein Animations-Pulse — sonst wird die Galaxie optisch laut. Hairline-Standard.

### 3.4 Severity-Akzente (nur bei Findings)

- Default: Knoten zeigt **keine** Severity-Farbe.
- Mit Finding: subtile **1 px Outline** in Severity-Color (Kill = red-token, Mid = orange, Strong = green).
- Kill + Weak: leichter Scale-Pulse (1.0 → 1.05, yoyo 1.6 s) — **nur diese 2 Bänder**, sonst Lärm.
- Hover: Outline-Opacity 0.5 → 1.0, Tooltip mit Finding-Count.
- Klick: Inspector öffnet rechts.

Sub-Agent 13-Empfehlung Option (7): Farbe + Glow-Radius + sparsamer Pulse. Wir nehmen davon nur **Outline + sparsamer Pulse**, kein Glow-Radius (würde gegen „minimal" laufen).

### 3.5 Background

- Pitch-black: `oklch(0.06 0 0)` (tiefer als `--background`-Token, weil Hero soll Tiefe haben)
- **60 statische Star-Particles** (`<circle r=0.5>` mit 12 % Opacity), kein Twinkle, kein Animation
- Subtiles Gradient-Mesh am Rand für leichte Vignette
- KEIN Volumetric-Glow, KEIN Parallax-Sternenfeld

---

## 4. Datenmodell (load-bearing — von Tag 1 erweiterbar)

```typescript
// apps/web/src/lib/repo-galaxie/types.ts

export type NodeKind =
  | 'workspace'
  | 'customer'
  | 'repo'
  | 'submodule'
  | 'folder'
  | 'file';

export type EdgeKind =
  | 'contains'        // Hierarchical parent-child
  | 'submodule-link'  // Repo embeds another Repo via .gitmodules
  | 'depends-on';     // V2: package dependency

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  parentId: string | null;
  depth: number; // 0 = workspace, 5 = file

  // Optional Metadata (extensible)
  githubUrl?: string;
  filePath?: string;
  submoduleRef?: string; // commit-sha of pinned submodule

  // Severity-Akzent (optional, file/folder/repo can carry findings)
  severity?: SeverityBand;
  findingCount?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface RepoGalaxieData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Layout-Output (post-computation):
export interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  radius: number; // visual size in svg-units
}
```

### Erweiterbarkeit (load-bearing für Vision)

- **Neuer `NodeKind`** hinzufügen (z.B. `package`, `service`, `agent`): Switch-Case in 3 Stellen — Size-Map, Gradient-Preset, Severity-Carrier-Check.
- **Neuer `EdgeKind`** (z.B. `imports`, `uses-skill`): Linien-Style hinzufügen, Layout-Hint optional.
- **Neue Metadata-Felder** (z.B. `pinnedAt`, `lastSync`, `language`): rein optional, brechen nichts.
- **Mehr-Tiefe**: Layout-Algorithmus (§5) ist depth-adaptiv — neue Tiefen funktionieren ohne Code-Änderung.

---

## 5. Layout-Algorithmus (deterministisch, hierarchisch-radial)

### Anforderungen
- **Deterministisch**: gleiche Inputs → gleiche Outputs (SSR-Stabilität, Mock-Data-Konsistenz).
- **Hierarchisch**: Parent in Center, Children orbital.
- **Submodule-Special**: Submodul kreist **innerhalb** des Repo-Orbits, nicht außerhalb (visuelle Andeutung „eingebettet").
- **Folder**: eigenes Cluster im Repo-Orbit-Sektor.
- **Erweiterbar**: jede neue Tiefe kriegt ihren eigenen Orbit-Radius.

### Pseudocode

```typescript
const ORBIT_RADIUS_BY_DEPTH: number[] = [0, 90, 160, 80, 50, 30];
// depth 0 = center, depth 1 = customer at 90px from workspace,
// depth 2 = repo at 160px from customer, depth 3 = submodule at 80px from repo
// (NB: depth-3 orbit is *small* — submodule sits close to its parent repo,
// physically distinguishing it from the customer's other repos)

function layout(data: RepoGalaxieData): LayoutNode[] {
  const result: LayoutNode[] = [];
  const root = data.nodes.find(n => n.parentId === null)!;
  place(root, 0, 0, result);
  return result;
}

function place(node, cx, cy, result) {
  const radius = RADIUS_BY_KIND[node.kind];
  result.push({ ...node, x: cx, y: cy, radius });

  const children = childrenOf(node.id);
  if (children.length === 0) return;

  const orbitRadius = ORBIT_RADIUS_BY_DEPTH[node.depth + 1];
  const baseAngle = hash(node.id) * Math.PI * 2; // deterministic seed
  const step = (Math.PI * 2) / children.length;

  children.forEach((child, i) => {
    // Submodules pack into a half-arc on the "left side" of the repo
    // to visually distinguish from regular children
    const angle = child.kind === 'submodule'
      ? baseAngle + Math.PI + (i - children.length / 2) * (Math.PI / children.length / 2)
      : baseAngle + i * step;
    place(child, cx + Math.cos(angle) * orbitRadius, cy + Math.sin(angle) * orbitRadius, result);
  });
}

function hash(id: string): number {
  // FNV-1a fast deterministic hash → 0..1
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h = (h ^ id.charCodeAt(i)) * 16777619;
  }
  return (h >>> 0) / 4294967295;
}
```

Tests: gleiche `data` → identische `LayoutNode[]` (positional-equal). Pflicht-vitest.

---

## 6. Render-Stack (Decision)

### Empfehlung: **SVG + motion (LazyMotion + `m`)**

Sub-Agent 11 + User-Wunsch matchen exakt:

| Kriterium                       | Result                                                       |
|---------------------------------|--------------------------------------------------------------|
| Bundle initial                   | ~4.6 KB (LazyMotion + `m`) + ~3 KB SVG-Code = **~10 KB** |
| Premium-Niveau erreichbar       | ✅ (Linear/Vercel sind alle DOM + Motion + SVG)             |
| Solo-Dev 5-7 Tage realistisch   | ✅ ~2-3 Tage Hero alleine, Rest Polish + Inspector + A11y    |
| iPhone 13 Safari 60fps          | ✅ Compositor-Layer, kein Janking                            |
| Native A11y                     | ✅ SVG-Buttons + `role` + `aria-label`, kein DOM-Overlay-Trick |
| SSR App-Router                  | ✅ kein `'use client'` nötig für Layout, nur für Motion-Hover |
| Maintenance                     | ✅ ~600 LOC total, keine Library-Churn (drei.js semver)      |

R3F + drei + postprocessing ist **explizit verworfen** — Bundle 230 KB, Solo-Dev 5+ Tage allein für Setup, A11y-Workarounds nötig, und der User-Wunsch „nicht mega-komplex" wäre verletzt.

R3F-Deps (`three`, `@react-three/*`, `@types/three`) werden aus `package.json` entfernt (Sprint-Cleanup).

### Setup-Skeleton

```tsx
// apps/web/src/components/landing/RepoGalaxie.tsx
'use client';
import { LazyMotion, domAnimation, m } from 'motion/react';

export function RepoGalaxie({ data, activeNodeId, onNodeClick }) {
  const layout = useMemo(() => computeLayout(data), [data]);
  return (
    <LazyMotion features={domAnimation} strict>
      <svg viewBox="-300 -200 600 400" aria-label="Repository-Galaxie demo">
        <defs>{/* gradient presets per NodeKind */}</defs>
        <BackgroundStars />
        {data.edges.map(e => <RelationEdge key={e.from + e.to} edge={e} layout={layout} />)}
        {layout.map(n => (
          <Sphere key={n.id} node={n} active={n.id === activeNodeId} onClick={onNodeClick} />
        ))}
      </svg>
    </LazyMotion>
  );
}
```

---

## 7. Demo-Hero-Story (was im MVP-Sprint live geht)

Hero-State (Mock-Data, kein DB-Call):

```
                              ◐ workspace "agency-lena" (zentral, hellster)
                              │
                              │  contains
                              ▼
                            ⬤ customer "acme-fintech"
                              │
                              │  contains
                              ▼
                       ⬤ repo "payments-api"
                       /  │  ╲
                      /   │   ╲ submodule-link (dashed)
                     /    │    ╲
                    /     │     ⬤ submodule "shared-types"  [Outline: Kill]
                   /      │     ↑
                  ⬤      │     pulses subtle
              folder      │
              "src/auth/" │
              [Outline: Mid] ⬤ submodule "design-tokens"   [Outline: Strong]
                              ↑
                              No pulse (Strong = no animation)
```

**3 klickbare Findings:**

1. **Kill** auf `shared-types`-Submodule → „Submodule pinned to commit `a3f9c1` which no longer exists on origin/main." (Stale-Reference). Inspector zeigt Diff: `.gitmodules` before/after, "Update to current HEAD" Suggestion.

2. **Mid** auf `src/auth/`-Folder → „CLAUDE.md in this folder overrides agency-wide token-budget by 40 %." Inspector zeigt Diff der CLAUDE.md.

3. **Strong** auf `design-tokens`-Submodule → „Best-practice: design-tokens als Submodule statt npm-Dependency reduziert version-drift across 5 customer-repos." Inspector zeigt rationale + 2 Customer-Links.

**Findings-Choice-Quelle**: Sub-Agent 2 hat die alten 3 Findings (sprach-konflikt, skill-registry, bash-permissions) als nur durchschnittlich plausibel bewertet. Diese neuen 3 sind **Submodule-zentriert** und treffen den USP direkt.

---

## 8. Inspector-Spec (Linear-style, content-swap)

Aus Sub-Agent 9 (Linear Deep-Dive) + Sub-Agent 3 (Inspector-Doppel) + Sub-Agent 12 (Drawer-Lib):

### Layout

| Property            | Wert                                                                              |
|---------------------|------------------------------------------------------------------------------------|
| Desktop             | Right-Rail 380 px, static (kein Slide-In, kein Modal — der Drawer **ist** das Demo) |
| Mobile (< 640px)    | Tailwind-responsive stacked card unter Galaxie (MVP-Decision: Vaul-Bottom-Sheet als V1.1-Polish — Vaul auf Hero-Section ist Overkill, weil Galaxie immer sichtbar bleiben soll) |
| Background          | `oklch(0.10 0.005 270 / 0.92)` + `backdrop-blur-md`                                |
| Border              | 1 px hairline `oklch(0.20 0 0)` (left edge desktop / top edge mobile)              |
| Padding             | 16 px horizontal, 12 px vertikal sticky-header, 24 px body-top                     |
| Content-Swap-Anim   | `AnimatePresence mode="wait"`, fade + 8 px y, 180 ms, cubic-bezier(0.16, 1, 0.3, 1)|
| Severity-Pill-Morph | `layoutId="severity-pill"` über swaps (Linear-style id-morph)                       |

### Header

```
┌──────────────────────────────────────────┐
│  [Kill]  shared-types · acme-fintech  ⤴ ✕│  ← Severity-Pill (motion layoutId), Repo-Pfad mono, Open-External + Close
└──────────────────────────────────────────┘
```

### Body

1. **Title** (type-h2, weight 400, -0.015em tracking) — finding.title
2. **Property-Row** (chips, 24 px hoch, 12 px padding, 6 px radius, bg `rgba(255,255,255,0.04)`):
   `Severity-Pill` → `submodule@a3f9c1` → `acme-fintech/payments-api/.gitmodules`
3. **Description** (type-body, 15 px, line-height 1.6) — finding.explanation
4. **Diff** (mono, 13 px, `text-[var(--color-sev-kill)]` für `-`, `text-[var(--color-sev-strong)]` für `+`)
5. **Why important** (collapsible, default closed) — rationale

### Footer (sticky 56 px)

```
┌──────────────────────────────────────────┐
│  [ Fix via PR → ]                        │
│  Sign-in nötig · 1 Branch + 1 Commit     │
└──────────────────────────────────────────┘
```

Primary CTA = `Fix via PR` (öffnet `SignUpTeaseDialog`). Kein Secondary CTA im Drawer — Conversion-Singlepoint (Sub-Agent 14).

### Was wegfällt vom alten Inspector
- Tabs „Detail / Why / AI" — auf eine Linear-Sektion-Liste reduziert (collapsible)
- Dismiss/Snooze/Apply-Dropdowns (App-Feature, nicht Landing)
- `useTransition` für Action-State (kein Action-Call im Hero)

---

## 9. A11y (WCAG 2.2 AA, Lighthouse ≥ 95)

Aus Sub-Agent 15 — SVG-Vorteil ist hier groß:

- **Tab-Navigation**: jedes `<g role="button" tabindex="0" aria-label="Submodule shared-types, Kill-Severity, 1 finding">` direkt navigierbar, **kein DOM-Overlay-Trick** (das wäre R3F-Pflicht gewesen).
- **Skip-Link**: `<a href="#findings-list" class="sr-only focus:not-sr-only">Skip Galaxie</a>` als erstes Element.
- **Visually-hidden Findings-Liste** mit denselben 3 Findings als `<ol>` — sortbar via Screen-Reader-Rotor (Cmd+F-Findability + Backup).
- **Reduced-Motion** (`prefers-reduced-motion: reduce`):
  - Keine Orbit-Drift-Rotation
  - Kein Severity-Pulse
  - Inspector-Content-Swap → instant (kein 180 ms-fade)
- **Forced-Colors-Mode**: Severity nicht nur via Farbe → Icon-Glyph (`✕` Kill, `!` Mid, `✓` Strong) im Hover-Tooltip + `aria-label` mit Severity-Wort.
- **Touch-Targets ≥ 44 px**: unsichtbares `<rect>`-Overlay über jeden Knoten falls Knoten kleiner.

---

## 10. Mount-Reveal-Choreographie (das was „premium" macht)

Sub-Agent 6-Erkenntnis: **kein infinite Loop, sondern eine perfekte Mount-Sequenz**. Linear/Resend/Supabase machen alle keinen Hero-Loop.

**Stagger-Order: inside-out** (Hierarchie folgt Datenmodell):

```
T+0    ms : Workspace fadet ein (opacity 0 → 1, scale 0.9 → 1.0, 600 ms)
T+200  ms : Customer fadet ein
T+400  ms : Repo fadet ein
T+600  ms : Submodule + Folders fadeen ein (parallel, 200 ms stagger zwischen ihnen)
T+1000 ms : Edges erscheinen (stroke-dashoffset animate 100 → 0, 400 ms)
T+1400 ms : Severity-Outlines erscheinen (Kill zuerst, Mid + Strong gleichzeitig)
T+1800 ms : Inspector slidet rechts ein (default: Kill-Finding active)
T+2200 ms : Kill + Weak Pulse startet
```

Easing durchgehend `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo, Linear-Standard).

Bei `prefers-reduced-motion: reduce` → alle Stages sind sofort sichtbar, kein Stagger.

**Kein Auto-Tour**, **kein Auto-Demo-Loop** — User hovert/klickt selbst, das ist die Demo.

---

## 11. Implementation-Schritte (1 Sprint = 5-7 Tage)

- [x] **Tag 1: Daten-Foundation** ✅ 2026-05-20
  - `lib/repo-galaxie/types.ts` (NodeKind, EdgeKind, GraphNode, GraphEdge, LayoutNode)
  - `lib/repo-galaxie/layout.ts` (deterministischer Hierarchical-Radial-Layout)
  - `lib/repo-galaxie/demo-data.ts` (1 Workspace + 1 Customer + 1 Repo + 2 Submodule + 1 Folder + 3 Findings)
  - vitest: layout-determinism + types-coverage (8/8 grün)

- [x] **Tag 2: SVG-Rendering** ✅ 2026-05-20
  - `components/landing/RepoGalaxie.tsx` (Top-Komponente mit Canvas + viewBox)
  - `components/landing/Sphere.tsx` (`<g>` + radialGradient + label, plus `SphereGradientDefs`)
  - `components/landing/RelationEdge.tsx` (Linien mit kind-style, tucked under spheres)
  - `components/landing/BackgroundStars.tsx` (60 statische deterministische Points)
  - `HeroSection.tsx` umgestellt auf `RepoGalaxie` + deutscher Hero-Copy
  - Layout-Result rendert statisch, keine Animation noch — typecheck grün

- [x] **Tag 3: Severity-Akzente + Hover + Click** ✅ 2026-05-20
  - Severity-Outline auf Sphere (1 px in Severity-Color, opacity 0.55 default → 1.0 hover/active)
  - Hover-Tooltip-Component (`components/landing/HoverTooltip.tsx`) — SVG-text mit paint-order:stroke-Halo
  - Click-Handler → `activeNodeId` State im HeroSection-Parent (alter HeroInspector noch dran, Tag 4 ersetzt)
  - Pulse für Kill/Weak via `motion/react` (`m.g` scale yoyo 1.6 s)
  - Sphere hat `role="button"` + `tabIndex={0}` + `aria-label` (Tag 6 erweitert)

- [x] **Tag 4: Inspector-Rebuild (Linear-style)** ✅ 2026-05-20
  - `components/landing/RepoInspector.tsx` ersetzt `HeroInspector.tsx` in HeroSection
  - Content-Swap via `AnimatePresence mode="wait"` + 8 px y fade
  - `layoutId="severity-pill"` für Severity-Morph zwischen Findings
  - Vaul → Future-Polish (siehe §8: Mobile nutzt stattdessen Tailwind-responsive stacked card)
  - 3 Submodul-Findings als Content (DEMO_FINDINGS aus repo-galaxie/demo-data)
  - LazyMotion + domAnimation am HeroSection-Wrapper

- [x] **Tag 5: Mount-Reveal-Choreographie** ✅ 2026-05-20
  - Stagger inside-out via `REVEAL_DELAY_BY_DEPTH` (0.0/0.2/0.4/0.6/0.8 s)
  - Edges revealen via `pathLength` 0 → 1, gestaffelt nach Ziel-Knoten-Depth
  - Severity-Outlines fadeen ein 0.6 s NACH Sphere-Reveal
  - Pulse-Loop startet 1.2 s nach Sphere-Reveal (delay-property)
  - `useReducedMotion` Hook → `initial=false` + duration:0 überall
  - Easing durchgehend `cubic-bezier(0.16, 1, 0.3, 1)` (Linear-Standard)

- [x] **Tag 6: A11y + Mobile** ✅ 2026-05-20
  - Skip-Link "Galaxie überspringen → Findings-Liste" als erstes fokussierbares Element (sr-only + focus:not-sr-only)
  - Visually-hidden `<ol id="galaxie-findings-list">` mit allen 3 Findings als clickable buttons (Screen-Reader-Fallback)
  - aria-label pro Knoten erweitert: `Label, Kind, Severity X, N Finding — Enter zum Öffnen`
  - focus-visible Outline auf interactive Spheres (border-radius 50%, offset 4px)
  - Touch-Hitbox: unsichtbares circle r=max(radius+6, 16) für jedes interaktive Node (≥32 viewBox-units)
  - Forced-Colors-Test + Vaul-Mobile-Sheet: deferred (siehe §15 Risiko — MVP-acceptable, Polish-Future)

- [x] **Tag 7: Cleanup + Polish + Build** ✅ 2026-05-20
  - `HeroMockup.tsx` gelöscht
  - `HeroInspector.tsx` gelöscht
  - R3F-Deps removed (`three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `@types/three`) — -50 packages
  - `r3f-spike/` Directory war schon weg
  - `globals.css`: `asteroid-pulse` keyframe entfernt (jetzt motion-driven in Sphere)
  - Sphere-Gradient-Defs leben in `Sphere.tsx` als `SphereGradientDefs`-Subkomponente (kein globals.css-Update nötig)
  - Build ✅ · Typecheck ✅ · Tests 89/89 ✅
  - Lighthouse-Check ist User-Action (Dev-Server starten + Lighthouse-Audit-Script laufen lassen)

---

## 12. Files-to-Change

| Datei                                                                  | Aktion       |
|------------------------------------------------------------------------|--------------|
| `apps/web/src/lib/repo-galaxie/types.ts`                                | NEU          |
| `apps/web/src/lib/repo-galaxie/layout.ts`                               | NEU          |
| `apps/web/src/lib/repo-galaxie/layout.test.ts`                          | NEU          |
| `apps/web/src/lib/repo-galaxie/demo-data.ts`                            | NEU          |
| `apps/web/src/components/landing/RepoGalaxie.tsx`                       | NEU          |
| `apps/web/src/components/landing/Sphere.tsx`                            | NEU          |
| `apps/web/src/components/landing/RelationEdge.tsx`                      | NEU          |
| `apps/web/src/components/landing/BackgroundStars.tsx`                   | NEU          |
| `apps/web/src/components/landing/HoverTooltip.tsx`                      | NEU          |
| `apps/web/src/components/landing/RepoInspector.tsx`                     | NEU          |
| `apps/web/src/components/landing/HeroSection.tsx`                       | UPDATE       |
| `apps/web/src/components/landing/HeroMockup.tsx`                        | **DELETE**   |
| `apps/web/src/components/landing/HeroInspector.tsx`                     | **DELETE**   |
| `apps/web/src/lib/landing/demo-finding.ts`                              | UPDATE (3 Submodule-Findings statt sprach-konflikt-Findings) |
| `apps/web/src/app/globals.css`                                          | UPDATE — Easing-Tokens, Sphere-Gradient-Defs |
| `apps/web/package.json`                                                 | REMOVE three + @react-three/* + @types/three |

---

## 13. Erweiterungs-Roadmap (Vision, **nicht im MVP**)

Architektur ist auf diese Erweiterungen ausgelegt:

| Stufe | Was kommt dazu                       | Aufwand-Schätzung |
|-------|--------------------------------------|--------------------|
| V1.1  | + Folder-Tiefe darunter (rekursiv)   | 1 Tag              |
| V1.2  | + File-Asteroids (Click auf Folder → drill-in mit camera-Pan) | 2-3 Tage |
| V1.3  | + Multi-Customer-Workspace-Galaxie (zoom-out) | 2 Tage             |
| V1.4  | + `depends-on`-Edges (npm/cargo/Go-mod) | 3 Tage             |
| V2.0  | + Real-GitHub-Integration (`.gitmodules`-Parser, GitHub-App fetcht Repo-Tree) | 1 Sprint |
| V2.1  | + Drift-Visualization (Submodule auf Customer-A pinned commit X, auf Customer-B pinned commit Y → visueller Drift-Strom) | 1 Sprint |
| V2.2  | + Skills-Registry-Overlay (welche Skills welche Repos nutzen — `uses-skill`-edges) | 1 Sprint |

Datenmodell ist **bereits heute** typsicher erweiterbar. Layout-Algorithmus ist depth-adaptiv. Neue NodeKinds + EdgeKinds müssen nur in 3-4 Stellen erweitert werden (Size-Map, Gradient-Preset, Linien-Style, optional Layout-Hint).

---

## 14. Test-Plan

**vitest (automatisch):**
- `layout.test.ts` — Determinismus, gleiche Inputs → identische LayoutNode[]
- `layout.test.ts` — Submodule sitzt nahe an Repo-Parent (Orbit-Radius < Customer→Repo)
- `layout.test.ts` — Workspace ist im Center (x=0, y=0)
- Existing-Tests bleiben grün (81/81 nach Nova-0)

**manuell:**
- Tab durch alle 6 Knoten (Workspace/Customer/Repo/Submodule × 2/Folder), Enter öffnet Inspector
- Inspector-Content-Swap zwischen 3 Findings flüssig
- `prefers-reduced-motion` an → kein Pulse, kein Reveal-Stagger, instant Snap
- iPhone-13-Sim: Touch-Target trifft jeden Knoten zuverlässig
- Vaul-Bottom-Sheet swipe-down schließt nicht ganz (snapPoint 0.15 minimum)
- Forced-Colors-Mode: Severity-Icons sichtbar, Knoten-Hierarchie via Size erkennbar

**Lighthouse-Acceptance:**
- Performance ≥ 85 (Landing)
- Accessibility ≥ 95
- Best-Practices ≥ 95
- LCP ≤ 1.8 s
- CLS ≤ 0.05

**Build + Typecheck:**
- `pnpm --filter @vk/web typecheck` grün
- `pnpm --filter @vk/web build` grün
- `pnpm --filter @vk/web test` grün

---

## 15. Risiken + Rollback

| Risiko                                                              | Severity | Mitigation                                                                |
|---------------------------------------------------------------------|----------|---------------------------------------------------------------------------|
| Submodul-Visualisierung zu subtil — User versteht nicht „eingebettet" | Strong   | Dashed-Line + kleinerer Orbit-Radius + explizites Label „submodule" im Hover-Tooltip |
| Mount-Reveal-Choreographie wirkt amateurhaft                        | Mid      | Tag 5 ist allein für Iteration reserviert. A/B mit `?reveal=v1` Toggle. |
| 3 Findings reichen nicht für „Wow"-Demo                              | Mid      | Demo-Daten flexibel halten — kann auf 5 erhöht werden ohne Code-Änderung. |
| Touch-Target auf Mobile zu klein                                     | Strong   | Unsichtbarer 44×44 `<rect>` über jedem Knoten als Hitbox.                  |
| Vaul-Mobile-Sheet konfliktet mit RepoGalaxie-Click                   | Mid      | Bottom-Sheet öffnet nur bei Knoten-Click, Hintergrund-Click schließt nicht. |
| `prefers-reduced-motion`-Fallback bricht Mount-Sequenz               | Weak     | `useReducedMotion` testen mit macOS-Setting Toggle.                       |

**Rollback:** `git revert` der NEU-Files + Wiederherstellung `HeroMockup.tsx` + `HeroInspector.tsx` aus git. Alte Demo bleibt funktional. R3F-Deps können re-installed werden falls späterer Pivot. DB unverändert.

---

## 16. Open Questions

> **Status:** ✅ Alle Q's beantwortet 2026-05-20 (User).

- **✅ Q1:** Submodule-Story aus §7 übernommen (Kill/shared-types, Mid/src-auth, Strong/design-tokens).
- **✅ Q2:** Workspace sichtbar im Hero (4-Tiefen-Demo).
- **✅ Q3:** Stagger inside-out (Workspace zuerst).
- **✅ Q4:** Hero komplett Deutsch.
- **✅ Q5:** R3F-Deps-Cleanup am Tag 7 mit-erledigt.

---

## 17. Status + Nächste Schritte

**Status:** 🟡 In Review by User.

**User-Aktion:**
1. Plan-File reviewen, vor allem §3 (Visual-DNA), §4 (Datenmodell), §7 (Demo-Story), §13 (Erweiterbarkeit).
2. Open Questions Q1-Q5 beantworten.
3. `/execute repo-galaxie-mvp` starten.

**Claude-Aktion nach Approval:**
- Tag 1 startet mit `lib/repo-galaxie/types.ts` + `layout.ts` + Tests.
- Inkrementelle Pushes am Ende jedes Tages.
- Bei jedem Tag-Abschluss: Screenshot + kurze Status-Notiz zurück an User.

---

## 18. Anhang — Sub-Agents-Output-Synthese (eine Zeile pro Agent)

| # | Sub-Agent                          | Key-Takeaway                                                                                         |
|---|------------------------------------|------------------------------------------------------------------------------------------------------|
| 1 | Landing-Komponenten-Audit          | Sprach-Mix DE/EN ist #1-Problem. Asteroiden-Metapher zu abstrakt für Code-Audit-Tool.                |
| 2 | DEMO_FINDINGS-Qualität              | Aktuelle 3 Findings nur durchschnittlich. Stale-Submodule + Token-Budget + Duplicate-Guidance besser. |
| 3 | Inspector-Doppel-Audit              | HeroInspector als Basis (leichter), App-Inspector hat zu viel App-spezifischen Code.                  |
| 4 | Repo-Minimal-MVP-Audit              | `/[workspace]/*`-Tree (~1800 LOC), `pr-workflow`, `llm`, `github-app`, `fixes` = Bloat für MVP.       |
| 5 | Animation-Inventur                  | AuditLoadingStage `setInterval` ist Anti-Pattern. WorkspaceSwitcher `motion`-Magic-Numbers.            |
| 6 | Premium-Hero-Animations 2026        | Linear/Vercel/Resend nutzen DOM + Motion + SVG, kein R3F. **Mount-Reveal > Loop.**                    |
| 7 | R3F-Galaxie-Demos                   | drcmda selective-bloom + jjteoh solar-system als Architektur-Vorbild — falls R3F überhaupt.          |
| 8 | Spatial-UI in AI-Tools              | Niemand am Markt visualisiert Submodul-Beziehungen räumlich. **Räumliche Severity×Confidence-Fusion = USP.** |
| 9 | Linear-Inspector Deep-Dive          | 480-560 px Right-Pane, sticky header 48 px, hairline-borders, surface-elevation statt shadows.        |
| 10| Scroll-Storytelling Apple/Stripe    | Pinning teuer, MVP-Recommendation: **passive Mount-Reveal**, kein Scroll-Trigger.                     |
| 11| R3F vs SVG-Vergleich                | **SVG + motion** ist klare Empfehlung: A11y-nativ, 10 KB Bundle, Premium-fähig, 1-Sprint-Solo.        |
| 12| Drawer/Inspector-Lib                | **Vaul für Mobile**, plain `<aside>` + AnimatePresence für Desktop right-rail.                        |
| 13| Severity-Visual-Patterns            | Farbe + Outline + sparsamer Pulse (Kill/Weak only). **Kein Glow-Radius** (gegen „minimal").           |
| 14| Hero-Conversion-Patterns            | 1 primärer + 1 sekundärer CTA. Audit-Form direkt im Hero ohne Sign-In. „Runs in-browser" als Trust-Signal. |
| 15| A11y für Galaxie                    | SVG-Buttons-nativ, hidden-Liste als Fallback, `gsap.matchMedia` für Reduced-Motion.                  |
