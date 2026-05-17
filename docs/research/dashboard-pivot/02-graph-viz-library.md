# A2 — Graph-Viz-Library für Repo-Connections-View

**Scope:** 5–30 Customer-Repos als Knoten + Drift-Kanten zum Canonical-Template. Embed Next.js 16 App Router. Dark-Mode + Severity-Bänder. OSS, kein Paid-Tier.

**Date:** 2026-05-17 · **Agent:** A2 · **Cost:** $0

## Comparison Table

| Library | Version 2026 | Stars | License | Bundle (min+gz) | SSR / App-Router | Layouting | Customization | Maintenance |
|---|---|---|---|---|---|---|---|---|
| **React Flow** (`@xyflow/react`) | v12.x, Mar 2026 | 36.6k | MIT | ~45–55 kB + CSS | v12 hat SSR/SSG-Support; Wrapper `"use client"` | Manuell oder + ELK/dagre | Hoch — Nodes/Edges als TSX | Sehr aktiv |
| **D3.js + visx** | visx 3.x | D3 113k / visx 19k | ISC/MIT | ~15 kB visx + 20–30 kB D3-Module | visx ≥3.2 Next-kompatibel | D3 force/hierarchy | Maximum, viel Boilerplate | D3 stabil, visx aktiv |
| **Cytoscape.js** + `react-cytoscapejs` | 3.33.3 (Apr 29, 2026) | 11k | MIT | ~120 kB + 5 kB wrapper | Canvas, client-only (`ssr:false`) | Eingebaut (cose, dagre-plugin) | Mittel — Selector-API | Aktiv |
| **ELK.js + React Flow** | elkjs 0.11.1 (Mar 3, 2026) | 2.6k | EPL-2.0 (⚠️) | ~500 kB ELK + React Flow | Layout-Engine, Worker-tauglich | Best-in-class | Erbt von React Flow | Eclipse Foundation |
| **vis-network** | v10.1.0 (May 15, 2026) | 3.6k | Apache-2.0/MIT | ~150 kB Canvas | Client-only, kein offizieller React-Wrapper | Physics + hierarchical | Niedrig — Options-Object | Core-Repo träge |

## Recommendation: **React Flow (`@xyflow/react`)** — Severity **Strong**

1. **React-native + App-Router-ready.** Nodes/Edges sind TSX-Components in `apps/web/components/graph/`. Severity-Bänder via Tailwind-Klassen direkt im Node-JSX. Dark-Mode via CSS-Variables. Kein Canvas-Imperative-Bruch.
2. **Bundle realistisch.** ~50 kB für 30 Knoten (kein Minimap-/Background-Pattern initial). Cytoscape 120 kB Canvas, vis-network 150 kB ohne React-Wrapper.
3. **Skalierungs-Pfad ohne Library-Switch.** Bei 100+ Repos oder hierarchischen Layouts in Phase 3: ELK.js als Plugin dazu (React Flow rendert, ELK layoutet). Kein Rewrite.

**Pro-Features (Hosted-Themes, Helpers) sind hinter Bezahlschranke — brauchen wir nicht. MIT-Core deckt alles.**

**Discarded:**
- **D3/visx:** Boilerplate-Overhead für Standard-Node-Edge-Graph. Erst >100 Knoten / Custom-Force-Simulationen rechtfertigen das.
- **Cytoscape:** Canvas bricht React-DevTools. Selector-API ist Fremd-Pattern neben Tailwind.
- **ELK standalone:** EPL-2.0 ist Copyleft-light — als Layout-Worker OK, nicht als Renderer.
- **vis-network:** Kein offizieller React-Wrapper 2026, Options-Object-API anachronistisch.

## Implementation Sketch

```tsx
// apps/web/app/operations/[org]/graph/page.tsx (Server Component)
import dynamic from 'next/dynamic';
const RepoGraph = dynamic(() => import('@/components/graph/repo-graph'), { ssr: false });

// apps/web/components/graph/repo-graph.tsx  ('use client')
import { ReactFlow, Background, Controls } from '@xyflow/react';
const nodeTypes = { repo: RepoNode };  // severity-banded TSX
return <ReactFlow nodes={driftNodes} edges={driftEdges} nodeTypes={nodeTypes} fitView />;
```

`driftNodes`/`driftEdges` werden im Server Component aus Drizzle gequeried, als Props weitergereicht. `RepoNode` mappt `severity ∈ {Kill,Weak,Mid,Strong,Exceptional}` auf 5 Tailwind-Variants. Edges tragen `data.driftScore` und färben sich entsprechend.

## Sources

- [xyflow/xyflow (36.6k, MIT)](https://github.com/xyflow/xyflow)
- [React Flow v12 SSR](https://github.com/xyflow/xyflow/discussions/3764)
- [Next.js App-Router Example](https://github.com/xyflow/react-flow-example-apps/tree/main/reactflow-nextjs-app-router)
- [React Flow + ELK.js](https://reactflow.dev/examples/layout/elkjs)
- [cytoscape.js v3.33.3, Apr 29 2026 (11k, MIT)](https://github.com/cytoscape/cytoscape.js)
- [vis-network v10.1.0, May 15 2026 (3.6k)](https://github.com/visjs/vis-network)
- [elkjs v0.11.1, Mar 3 2026 (2.6k, EPL-2.0)](https://github.com/kieler/elkjs)
- [d3/d3 (113k, ISC)](https://github.com/d3/d3)
- [visx Next.js v3.2](https://staedi.github.io/posts/visx-next)
- [plotly/react-cytoscapejs](https://github.com/plotly/react-cytoscapejs)
