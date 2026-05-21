# Plan — Galaxie Circle-Pack v2 (Repository-Filesystem-Visualisierung)

> Erstellt: 2026-05-20
> Status: ✅ Done — 2026-05-20 (Hot-Reload, Browser-Verifikation steht aus)
> Slug: `galaxie-circle-pack-v2`
> Basis: 5 erfolgreiche Sub-Agents (Repo-Viz / D3-Force / Radial-Tree / Treemap / Context-Files / Inspector)
> Voraussetzung: `repo-galaxie-mvp.md` ist gemerged (in `docs/plans/done/`)

---

## 1. USP-Refinement (User-Klärung 2026-05-20)

Die Hero-Galaxie zeigt eine **echte Repository-Filesystem-Struktur** mit Fokus auf **AI-Context-Files** (AGENTS.md = Linux-Foundation-Standard 2026, .claude/, .cursor/rules/, .windsurfrules, .aider.conf.yml, GEMINI.md, etc.). Alle Files sind klickbar. Inspector zeigt **raw File-Metadata + Content-Preview** (kein LLM-Output). Severity-Findings sind Akzente.

---

## 2. Stack-Entscheidung: Circle-Pack

3 von 5 Sub-Agents empfehlen **`d3-hierarchy.pack()`** als Layout — Begründung kondensiert:

- **Brand-Fit:** Kreise = Planeten/Monde matched die Galaxie-Metapher 1:1
- **Skaliert:** github/repo-visualizer beweist Circle-Pack auf 10k+ Files; wir bleiben bei ~15 Files MVP, aber Layout-Stack hält für später ohne Rewrite
- **Drill-In via Bostock-Zoomable-Pack:** Klick auf Folder → smooth zoom-to-circle, andere Knoten faden raus
- **Bundle:** d3-hierarchy + d3-zoom + d3-selection ≈ 18 KB gzipped
- **Deterministisch:** d3.pack output ist pure function von input data

**Verworfen:**
- d3-force: organischer, aber weniger Hierarchie-Klarheit (Agent 2 erwähnt Cluster-Force; bei N=15 unsicht­bar)
- Radial-Tidy-Tree: lesbarer bei <30 Files, bricht bei 100+ (Agent 3)
- Squarified/Voronoi Treemap: zu Excel-corporate (Agent 4)
- PixiJS/R3F: Bundle-Overhead 150-260 KB, nicht nötig bei N<500

---

## 3. Demo-Repo-Story: 15 Files, 6 Findings

Customer: **acme-bank**, Repo: **fraud-detection-monorepo** (mit `apps/api/`, `apps/web/`). Realistische Linux-Foundation-AGENTS.md-Standard-Setup.

### Files

| # | Path | Bytes | Lines | Lang | Finding |
|---|------|-------|-------|------|---------|
| 1 | `/AGENTS.md` | 8200 | 220 | md | — |
| 2 | `/CLAUDE.md` | 16400 | 412 | md | **Weak**: 8.4k tokens, exceeds agency budget |
| 3 | `/GEMINI.md` | 15800 | 398 | md | **Strong**: best-practice — synchronized with CLAUDE.md |
| 4 | `/apps/api/AGENTS.md` | 3100 | 82 | md | — |
| 5 | `/apps/web/AGENTS.md` | 1200 | 35 | md | — |
| 6 | `/.claude/skills/db-migration/SKILL.md` | 1450 | 38 | md | **Mid**: Frontmatter missing `description` (Auto-Discovery broken) |
| 7 | `/.claude/skills/deploy/SKILL.md` | 2200 | 58 | md | — |
| 8 | `/.claude/skills/audit-rules/SKILL.md` | 3400 | 92 | md | — |
| 9 | `/.claude/agents/security-reviewer.md` | 3500 | 95 | md | — |
| 10 | `/.claude/agents/test-runner.md` | 2800 | 76 | md | — |
| 11 | `/.claude/settings.local.json` | 800 | 18 | json | **Kill**: committed file with secrets |
| 12 | `/.github/copilot-instructions.md` | 5100 | 132 | md | **Mid**: conflicts CLAUDE.md re Vitest vs Jest |
| 13 | `/.cursor/rules/typescript.mdc` | 7200 | 198 | mdc | **Mid**: `alwaysApply:true` + 7k tokens injected every request |
| 14 | `/.windsurfrules` | 5400 | 175 | md | — |
| 15 | `/.aider.conf.yml` | 410 | 12 | yaml | **Kill**: `read: CONVENTIONS.md` — file doesn't exist (stale ref) |

**6 Findings** verteilt über Severity-Bänder (2× Kill, 3× Mid, 1× Weak, 1× Strong).

---

## 4. Datenmodell-Erweiterung

`GraphNode` bekommt optional fields für File-Display und Audit-Inhalte. Keine Breaking-Changes — alles optional:

```typescript
interface GraphNode {
  // existing fields ...
  
  // V2 File-Metadata (für Inspector + d3.pack-value)
  bytes?: number;        // file size
  lines?: number;        // line count
  language?: string;     // 'md' | 'ts' | 'json' | 'yaml' | 'mdc' | ...
  lastModified?: string; // ISO date
  previewLines?: string[]; // first ~10 lines for inspector content-preview
  
  // V2 Finding-Detail (carry on the node itself, not a separate Map)
  findingTitle?: string;
  findingRule?: string;
  findingDescription?: string;
  findingDiffBefore?: string;
  findingDiffAfter?: string;
}
```

`computeLayout` wird komplett ersetzt durch d3.pack-basierte Variante. Existierende Tests müssen angepasst werden (kein Center-of-Mass-Shift mehr — pack zentriert automatisch).

---

## 5. Komponenten-Refactor

### Behält
- `types.ts` (extends, no breakage)
- `Sphere.tsx`-Konzept (m.g Reveal + Hover + Pulse), aber Coords kommen aus pack
- `BackgroundStars.tsx` (atmosphäre)
- `HoverTooltip.tsx`
- A11y-Setup (Skip-Link, hidden-list)
- LazyMotion-Wrapper + Linear-Aesthetic-Tokens

### Komplett neu
- `lib/repo-galaxie/layout.ts` → wrapper um d3.pack mit deterministischer Sort
- `lib/repo-galaxie/demo-data.ts` → 15-Files-Liste
- `components/landing/RepoGalaxie.tsx` → zoomable circle-pack
- `components/landing/RepoInspector.tsx` → File-Metadata + Pill-Row + Content-Preview (Shiki light)

### Wegfällt
- `components/landing/RelationEdge.tsx` — Circle-Pack nutzt Nesting statt Edges
- `RADIUS_BY_KIND` + `ORBIT_RADIUS_BY_DEPTH` aus `layout.ts` — pack berechnet selbst

---

## 6. Inspector-Spec (aus Agent 6)

```
┌─ INSPECTOR (~400 px) ──────────────────────┐
│ CLAUDE.md                          [copy]  │  ← H2 16px semibold
│ acme-bank / fraud-detection / .            │  ← breadcrumb mono 12px muted
│                                            │
│ ┌─────┬─────┬─────┬─────────────────────┐ │
│ │ MD  │ 412 │ 16  │ updated 4d ago       │ │  ← Pill-Row
│ │lang │lines│ KB  │                     │ │
│ └─────┴─────┴─────┴─────────────────────┘ │
│                                            │
│ ── if finding ──                           │
│ ▣ WEAK  token-budget-overshoot             │  ← Severity-Pill (layoutId-Morph)
│                                            │
│ CLAUDE.md überschreitet Agency-Token-Budget│
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ - context_budget: 8400 tokens         │  │  ← Diff (sev-kill rot)
│ │ + context_budget: 5000 tokens         │  │  ← Diff (sev-strong grün)
│ └──────────────────────────────────────┘  │
│                                            │
│ ▸ Warum wichtig                            │
│                                            │
│ ── always ──                               │
│ Content Preview (first 8 lines)            │
│ ┌──────────────────────────────────────┐  │
│ │  1  # acme-bank/fraud-detection      │  │  ← Shiki static syntax-HL
│ │  2  context_budget: 8400 tokens      │  │
│ │  3                                    │  │
│ │     ...                               │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ [ Fix via PR → ]                           │
└────────────────────────────────────────────┘
```

---

## 7. Schritte (Tag 1-3, kompakt — User will Speed)

- [ ] **Tag 1 — Daten + Layout-Engine**
  - `pnpm add d3-hierarchy d3-zoom d3-selection` + types ✅ (parallel)
  - `types.ts` erweitern (V2-fields optional)
  - `demo-data.ts` neu — 15 Files mit allen Metadata + 6 Findings + preview-lines
  - `layout.ts` → d3.pack-wrapper (deterministische Sort by id, fixed-seed)
  - `layout.test.ts` aktualisieren (kein workspace-at-0,0 Test mehr; statt: hierarchie respektiert, alle nodes platziert, deterministisch)
  - typecheck + tests grün

- [ ] **Tag 2 — Rendering + Zoom**
  - `RepoGalaxie.tsx` → d3.pack-Layout + SVG-Render + d3-zoom-basierte Pan/Zoom
  - `Sphere.tsx` → angepasste Props (`packedNode` statt LayoutNode mit fixed radius)
  - Bostock-Zoomable-Pack-Pattern: Klick auf Folder → tween focus to circle, klick außerhalb → tween back to root
  - Reveal-Choreographie behalten (stagger über depth via d3-traversal)
  - Hover-Tooltip + Severity-Outlines

- [ ] **Tag 3 — Inspector v2 + Cleanup**
  - `RepoInspector.tsx` → File-Metadata-Pill-Row + Content-Preview (Shiki via `shiki/bundle/web`)
  - HeroSection.tsx → `activeNodeId` zeigt jedes File, nicht nur findings
  - `RelationEdge.tsx` löschen
  - Build + Typecheck + Lighthouse-Check
  - Plan-File nach done/

---

## 8. Risiken + Rollback

- **Risiko 1:** d3.pack-Coords zu klein wenn ein Folder viele Files hat (Repo-Knoten dominiert). Mitigation: `padding(8)` + sqrt-scale für `value()`.
- **Risiko 2:** Shiki-Bundle (~50 KB initial) ist nicht trivial. Mitigation: dynamic-import nur in Inspector, kein Initial-Hero-Bundle.
- **Risiko 3:** Zoom-Animation könnte bei reduced-motion janken. Mitigation: instant-snap-mode.
- **Risiko 4:** A11y bei 15 SVG-Buttons (statt 3) — Tab-Reihenfolge muss semantisch sein (parent before children).
- **Rollback:** `git checkout main -- apps/web/src/lib/repo-galaxie apps/web/src/components/landing` → vorheriger MVP zurück.

---

## 9. Status

**Tag 1 startet sofort nach Plan-Anlage.**
