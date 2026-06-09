# Frontend-Challenge Synthese — Landing + Galaxie

> Quelle: 14-Agent-Workflow (13 Analyse/Research + 1 Synthese), 2026-06-09.
> Auftrag: Landing-Page + Galaxie tiefgründig challengen → Grundlage für Redesign-Plan.

## 1. Executive Summary (was ist heute kaputt, was ist die Vision)

Die Landing-Page und die Galaxie sind **technisch poliert, aber strategisch falsch ausgerichtet** — und das an genau den beiden Stellen, die den Verkauf tragen.

**Landing (Ist):** Es gibt keinen echten Text-Hero. Die `<h1>` ist `sr-only` (`HeroSection.tsx:227`), die volle Galaxie-Demo füllt das gesamte Above-the-Fold (`min-height: calc(100svh - 3.5rem)`), das erste fokussierbare Element ist ein Skip-Link `skip-the-galaxie`, und die einzige CTA ist eine nackte Toolbar-Pill (`Audit Dein Repo →`). Ein Besucher landet auf einem interaktiven Spielzeug ohne Plain-Language-Value-Prop — die exakte Inversion jeder Best-in-Class-Devtool-Page 2026 (Linear, Vercel, Resend, Raycast), die **text-first** führen und das Demo eine Scroll-Tiefe darunter framen.

**Galaxie (Ist):** Drei sich überlagernde Fundamentalprobleme:
1. **Datenmodell-Lüge (Kill):** Die „file"-Nodes der Galaxie sind gar keine geparsten Agent-Files — es sind Audit-`finding`-Rows. `FileNode.path` wird auf `f.title || f.category` gesetzt (`galaxie.ts:184`), also auf einen Prosa-Titel ohne Slash. Auf echten Daten entstehen daher **null Ordner** — die gesamte Folder-Nesting-Maschinerie ist totes Holz, das nur auf Mock-Daten mit Slash-Pfaden „funktioniert".
2. **Keine Labels auf der Canvas (Kill):** Es existiert kein einziges On-Canvas-Text-Label. Der `Text`-Import in `GalaxieScene.tsx:4,56` ist tot (`new Text` = 0 Treffer). Was der Owner als „rohe Labels" sieht (`.claude`, `AGENTS.md`), sind HTML-Overlays (Tooltip/Inspector/SolarListView), die `file.path` verbatim drucken — ohne jede Humanisierung.
3. **Flacher Diagramm-Look statt Premium-„Space" (Kill):** Jeder Himmelskörper ist ein hart-gefüllter Flat-Vektorkreis. Die Sonne sind drei gestapelte graue Scheiben, Planeten sind solide Punkte, der Hintergrund ist ein statisches Dot-Grid (Engineering-Millimeterpapier). Files und Folder unterscheiden sich **nur im Radius (4 vs 8)**.

**Vision (Soll):** Eine text-first Landing, die in 3 Sekunden „was bringt mir das" beantwortet, mit einer **eine-Scroll-tiefer gerahmten, scroll-choreografierten** Live-Demo. Eine Galaxie, die echte Datei-Identität trägt (kind, echter Pfad, Frontmatter-Name), Context-Files **visuell in ihren Ordner merged**, human-readable Labels per LOD auf der Canvas zeigt, Files-vs-Folder klar unterscheidet, und als **Portfolio-Health-Surface** öffnet (nicht als Single-Repo-Filetree) — damit Agency-Lena auf den ersten Blick sieht „wo brennt's bei welchem Kunden". Plus echtes stellares Rendering (Radial-Gradients, Rim-Light, Starfield, Nebula), das das Premium-Versprechen einlöst.

---

## 2. Landing — Ist-Zustand, Soll-Zustand, konkrete Lücken

**Ist:** Single-Full-Screen-Galaxie-Demo als Above-the-Fold, keine Narrative-Sektionen darunter, kein Social-Proof, keine Feature-Story, kein Pricing-On-Ramp, keine Closing-CTA.

**Soll (kanonische Devtool-Reihenfolge):** (1) Text-Hero → (2) gerahmte Live-Galaxie-Demo + Explainer → (3) Logo-Strip + Usage-Stat → (4) 4–6 alternierende Chess-Feature-Sektionen → (5) kontextuelle Testimonials → (6) Pricing-Teaser → (7) Full-Width Final-CTA. Konsistente ~96px Section-Gaps.

| # | Lücke | Severity | Location | Konkreter Fix |
|---|-------|----------|----------|---------------|
| L1 | Kein echter Text-Hero — Galaxie-Demo IST das Above-the-Fold | **Kill** | `HeroSection.tsx:227` (sr-only h1), `:255-411` (full-bleed) | Dedizierten Text-Hero ÜBER die Galaxie setzen: sichtbare gestylte H1 (sr-only promoten), Outcome-Subhead, Primary+Secondary-CTA-Row. Galaxie auf eigene Sektion ~1 Scroll tiefer demoten. |
| L2 | Hero-Framing signalisiert internes Tool, kein Produkt | Mid | `HeroSection.tsx:222-237, 263-265` | Marketing-Narrativ oben (Headline + Value-Prop + CTA); Galaxie als klar gelabelte „Live demo"-Sektion mit eigener Heading. |
| L3 | Keine Headline-Formel / kein Positioning above the fold | Strong | Linear/Vercel-Pattern | Outcome-led H1, ≤8 Wörter / ~44 Zeichen, `[Outcome] + [Audience/Era-Qualifier]`. Subhead z.B. „Audit every customer repo's AGENTS.md before drift ships". |
| L4 | CTA-Pattern fehlt — nur nackte RepoUrlPill | Strong | `HeroSection.tsx:263-273` | Primary Bold-Button mit Produkt-Verb + distinkt sichtbarer Secondary (ghost: `Live-Demo ansehen` → Galaxie-Anchor). Friction-Reducer-Microline `Keine Kreditkarte`. (`Trial for free` schlug `Sign up for free` um 104%.) |
| L5 | Demo-Placement: full-bleed als Hero statt gerahmt 1-Scroll-tiefer | **Exceptional** | Raycast/Linear-Pattern | „See it live"-Sektion unter Hero. Galaxie in Card mit App-Chrome (border, hairline, rounded 10–16px, Surface-Ladder: canvas `#07080a`, surface `#0d0d0d`, border `#242728`). Eyebrow + Headline + 1–2-Satz-Explainer. Auf ~60–72vh constrainen. |
| L6 | Keine Scroll-Choreografie um die Demo | Strong | `HeroSection.tsx:325-360` | Sticky-Graphic-Scrollytelling: Galaxie via `position:sticky` pinnen, Caption-Steps scrollen vorbei (Kill-Node-Pulse → Folder-Zoom → Inspector-Reveal). reduced-motion gaten. |
| L7 | Keine Narrative-Section-Order unter der Demo | Strong | Linear/Vercel/Raycast | Hero → Logos → Chess-Feature-Blocks → Testimonials → Pricing-Teaser → Final-CTA. ~96px Gaps. |
| L8 | Kein Social-Proof | Mid | — | Logo-Strip + 2–3 kontextuelle Testimonials + harte Usage-Stat. Metrik-Quote schlägt Generic-Praise. |
| L9 | Keine Feature-Sektionen | Mid | — | Problem-orientierte Narrative-Headlines, Chess/Alternating-Layout, je EIN Screenshot, nummeriert wie Linear. |
| L10 | Kein Pricing-On-Ramp + keine Closing-CTA | Mid | — | Pricing-Teaser (3 Cards) → `/pricing`. Full-Width dunkler Final-CTA-Block. |

---

## 3. Galaxie — Ist-Zustand + die 5 Kern-Probleme

**Ist-Zustand:** Deterministisches 3-Ring-Polar-Layout (`solar-layout.ts`): Customers auf 750px-Kreis, Repos (Suns) auf 300px-In-Cluster-Ring, Folder auf zwei Fix-Orbits (60/95px), Root-Files auf einem Fix-Orbit (130px). Zwei parallele Renderpfade: PixiJS-Canvas + Static-SVG-Fallback. Keiner zeichnet On-Canvas-Text.

### Problem 1 — Rohe Labels (`.claude`, `AGENTS.md` verbatim)

| Severity | Location | Problem | Fix |
|---|---|---|---|
| **Kill** | `GalaxieScene.tsx:4,56` + `FilePlanet.ts:34-37`, `FolderPlanet.ts:45-48`, `RepoSun.ts:33-36` | Kein On-Canvas-Label existiert. `Text` importiert + registriert, aber NIE instanziiert. `this.label = file.id` ist die Pixi-Debug-Property, kein gerenderter Text. „Schwebendes Label" = HTML-Tooltip. | Echte Label-Layer: `BitmapText`-Child je Planet-Container, zentriert/unterhalb, gegen Camera-Zoom LOD-gegated. In Sprite-Constructors bauen. |
| **Strong** | `Tooltip.tsx:26,40` | Hover-Tooltip druckt `{file.path}`/`{folder.name}/` verbatim in `font-mono` → `.claude/CLAUDE.md` roh. | Single `humanizeNodeLabel(path|name, kind)`-Helper: `.claude`→'Claude', `gemini.md`→'Gemini'. In allen Surfaces — eine Humanisierungs-Source-of-Truth. |
| Mid | `solar-layout.ts:36-41, 186-195` | `folder.name = path.split('/')[0]` fließt unmodifiziert weiter. | `displayName` via Helper ableiten. `name` NICHT mutieren — stabiler Key für Folder-ID + Pivot-Match. |
| Mid | `Inspector.tsx:204,324,410,467` + `SolarListView.tsx:116` | 4 weitere Surfaces drucken rohe `file.path`/`folder.name`. | Alle durch `humanizeNodeLabel` routen. Roh-Pfad als sekundäre Mono-Subline im Inspector behalten. |

### Problem 2 — File-in-Folder-Merge (Context-Files nicht im Ordner genestet)

| Severity | Location | Problem | Fix |
|---|---|---|---|
| **Kill** | `galaxie.ts:184` | Merge heute **unmöglich**: `FileNode.path = f.title || f.category` (Prosa-Titel, kein Pfad). `extractTopFolder` splittet auf `/` → fast immer `null` → jedes Context-File wird Root-File. Echter Pfad lebt in `finding.citations[0].path`, wird nie gelesen. | `path: citations[0].path || f.title || f.category`. `title`/`category` als separates `label`-Feld. Dann nesten extractTopFolder + Folder-Code automatisch, **null Layout-Änderung**. |
| **Strong** | `solar-layout.ts:36-41, 154-168` | `extractTopFolder` nestet nur nach TOP-Segment → `apps/web/AGENTS.md` landet unter `apps` statt `apps/web`. | `extractOwningFolder = dirname(path)`. Repo-Root bleibt standalone. Click-Match in `GalaxieScene.tsx:360-361` mitmigrieren. |
| **Strong** | `types.ts:91-98`, `solar-layout.ts:129-209` | Folder synthetisch, render-time-only, NICHT in `GalaxieData`. Keine member-`fileIds`. Foldered-Files `parentSunId=repoId` (nicht folder-id) → File ist Sibling seines Folders. **Null Containment-Edge.** | FolderNode `fileIds: string[]` (wird bereits berechnet, verworfen!). Foldered-File parent auf Folder-ID. Dann kann folder-level CLAUDE.md als Folder-**Nukleus** rendern. |
| Mid | `types.ts:100-116` | `SolarLayoutNode` hat nur `parentSunId`, kein generalisierter Parent. | Generalisierten `parentId` addieren, Parent-Edge folder-aware machen. |

### Problem 3 — Spacing / Cramped („glued on top of each other")

| Severity | Location | Problem | Fix |
|---|---|---|---|
| **Kill** | `solar-layout.ts:17-18` (FOLDER_ORBITS `[60,95]`, FILE_ORBIT `130`) | **Root-Cause:** Orbit-Radien FIX, ignorieren Child-Count. Bei N=6 auf R=60 nur ~63px Center-to-Center, Footprint ~26–34px → Nachbarn küssen sich. Density unbounded. | Radius als Funktion der Occupancy: `R = max(R_min, (N·gap_target)/(2π))`, `gap_target ≈ 3×` Footprint. Sparse Repos identisch, busy Repos atmen. |
| Strong | `solar-layout.ts:17-18`, `orbits.ts:6`, `FolderPlanet.ts:88-112` | Drei Ringe nur ~35px auseinander, Glow überlappt nächsten Ring → visuelle Mush. | Inter-Ring ≥2× Footprint: Folder `[70,120]`, File `180`. Besser: Radien sequentiell ab Sun-Edge ableiten. |
| Strong | `solar-layout.ts:176-177, 208-209` | Folder-Orbit[0] hart auf 6 gecappt → 6 Folder cloggen tightesten Ring. | Nach Angular-Density verteilen, nicht Fix-Count. |
| Strong | `solar-layout.ts:179-228` | Kein Collision-Avoidance / Min-Angle-Pass — open-loop Polar. | Light-Relaxation-Pass: Min-Angular-Separation + optional 5–10 Force-Directed-Iterationen (deterministisch, seeded). Alternativ Golden-Angle 137.5°. |
| Mid | `FolderPlanet.ts:50`/`FilePlanet.ts:39` vs `solar-layout.ts:17-18` | Hit-Areas (44px WCAG) >> Arc-Gap (~63px). Mobile-Scale multipliziert Hit-Areas, Orbit-Radien NICHT → Mobile-Collision garantiert. | `gap_target ≥ 2·hitR·maxScale`. `mobileScale` in `computeSolarLayout` feeden → eine Source-of-Truth. |
| Mid | `solar-layout.ts:16` (SUN_ORBIT 300) | Bei 6+ Repos/Customer überlappen ganze Solarsysteme. | `SUN_ORBIT` count-aware. |
| Mid | `layout.ts:28-33` (Legacy MiniMap, RNG-Jitter ±8) | Noch engere Radien + Randomness reduziert Separation. | Niedrigste Prio (deprecated). Bei MiniMap-Migration `layout.ts` löschen. |

### Problem 4 — File-vs-Folder-Optik (nur Radius 4 vs 8)

| Severity | Location | Problem | Fix |
|---|---|---|---|
| **Strong** | `solar-layout.ts:20-21` (FOLDER 8, FILE 4); `FilePlanet.ts:77-120`, `FolderPlanet.ts:86-113` | Identisches Primitive: `circle().fill()` + gleicher Outline/Glow/Badge. EINZIGER Unterschied: `r`. | Folder = gefüllte Disc. File = **hollow/ringed Disc** (dicker Stroke, low-alpha Fill) ODER rounded-rect-Card. In shared Paint-Path + `StaticGalaxieSVG` spiegeln. |
| Mid | `solar-layout.ts:17-22` | Geometrie zu klein für On-Planet-Label (r=4/8). | FILE/FOLDER_RADIUS bumpen ODER Zoom-LOD wo Planeten wachsen + Inside-Label. Hit-Area ist bereits 22px. |

### Problem 5 — „nicht geil genug" (flacher Diagramm-Look statt Premium-Space)

| Severity | Location | Problem | Fix |
|---|---|---|---|
| **Kill** | `RepoSun.ts:70-83` | Sonne = 3 flat-alpha Scheiben → Bullseye, kein Leuchtkörper. Hard-Edges, keine Corona/Specular. Größter „not premium"-Tell. | Radial-Gradient-Textur: Corona (BlurFilter) + warme Photosphäre `#fff6e8`→`#d99a5c`→`#8a4f24` + Specular-Hotspot offset + Rim-Light-Stroke. |
| Strong | `FolderPlanet.ts:86-113`, `FilePlanet.ts:77-120` | Planeten = Flat-Fill-Discs → Sticker, kein Körper. | Baked-Sphere: Radial-Gradient offset zur Light-Dir (-45°), Rim-Light-Arc, 1px Atmosphären-Halo. FILE 4→5, FOLDER 8→9. |
| Strong | `GalaxieScene.tsx:550-558` | Hintergrund = flat Dot-Grid → Millimeterpapier. | Gradient + Vignette + echtes Parallax-Starfield (2–3 Layer) + 1–2 Nebula-Blobs. Dot-Grid droppen/0.02. |
| Strong | `RepoSun.ts` (kein Text), `GalaxieScene.tsx:586-600` | Keine In-Canvas-Labels → ohne Hover unlesbar, wirkt unfertig. | Pixi-Text/BitmapText unter Nodes. LOD: Sun @ scale>0.6, Folder>1.8, File>3.0, Alpha-Tween. |
| Strong | `GalaxieScene.tsx:764-...` (alle 0.2/power2.out) | Motion monoton, kein Stagger/Ambient/Entrance. | Ambient-Drift (Keplerian), Asymm-Easing (IN back.out 0.18s / OUT power2 0.32s), Mount-Stagger-Entrance, Star-Twinkle. reduced-motion-Gate. |
| Mid | `severity-colors.ts:67-73` | Glow binär (Kill 8, sonst 0), quality 0.2 = stepped. | Kill loudest behalten, quality 0.4–0.5, 2 Passes für Kill, Whisper-Glow für andere Bänder (Magnitude, nicht on/off). |
| Mid | Hover-States | Hover = flat White-Wash @0.14 → cheap. | Crisp Ring-Stroke + Soft-Outer-Glow in Severity-Hue. Keyboard-Focus = dashed/double-Ring Brand-Accent. |
| Mid | `edges.ts`, `orbits.ts` | Edges/Orbits = pure-white 0.5px Hairlines → CAD-Wireframe. | Gradient-Stroke Sun→Planet, faint additive Glow. Orbit-Rings dashed/soft @0.12. |
| Mid | `EmptyGalaxie.tsx:6-26` | Copy widerspricht shipped Solar-Modell. | Copy fixen + Live-Mini-Galaxie-Preview. |
| Weak | `Tooltip.tsx:21-47` | Alles `font-mono text-xs`, keine Hierarchie → Debug-Overlay. | Micro-Type-Scale: sans-body vs mono-identifier Pairing, Card mit border/shadow/Top-Highlight. |

---

## 4. Die File-in-Folder-Merge-Logik — Datenmodell-Analyse + was sich ändern muss

**Zentrale Erkenntnis (von 5 Agenten unabhängig bestätigt):** Es gibt zwei divergierende Galaxie-Pipelines, und die Datenmodell-Lüge sitzt in beiden.

**Pipeline A — Workspace-Galaxie (`lib/dal/galaxie.ts` → `lib/galaxie/solar-layout.ts`):** `GalaxieData = { customers[], repos[], files[] }` ist ein **flaches relationales Triple, kein Baum**. Kein `folder`-Feld, kein Parent-Pointer, kein `skill`/`command`/`context-file`-kind. `FileNode.path = f.title || f.category` — nicht der Pfad. `finding`-Tabelle hat **keine File-Path-Spalte**; echter Pfad nur in `citations` (jsonb). Folder render-time synthetisiert, `fileIds` verworfen. Skills/Commands/CLAUDE.md sind upstream im Parser real (12 kinds), werden aber **vor der DAL zu finding-Rows geflattet** — kind-Distinktion ist weg.

**Pipeline B — Landing-Galaxie (`lib/repo-galaxie/`):** d3-Circle-Pack, trägt `filePath` + `file.kind` bereits, aber Circle-Size = **Bytes** (prominenteste Variable trägt keinen Decision-Value); Labels = rohe Basenames.

**Was sich ändern MUSS (Abhängigkeits-Sequenz):**
1. **Echter Pfad in `FileNode` (Kill-Prerequisite):** `path: citations[0].path`. Sauberer langfristig: echte `finding.filePath`-Spalte (→ DB-Migration-Sektion Pflicht).
2. **`kind` + Frontmatter-Identität:** via `classifyPath(citations[0].path)` aus `@vk/parser`. Nodes nach echtem Pfad gruppieren → ein Node = ein Agent-File (statt = ein Finding).
3. **Owning-Folder:** `extractOwningFolder = dirname(path)`.
4. **Echte Containment-Relation:** FolderNode `fileIds`, foldered-Files `parentId`=Folder. Erst dann „Merge".
5. **Placement-State (greenfield):** `placement?: {status; suggestedFolder?}`. Neue Audit-Rule `misplaced-context` (heute existiert KEINE Placement-Rule). Heuristiken: outlinks zeigen in Sibling-Subtree / Frontmatter-globs außerhalb / Context-File ohne Source-Siblings / Duplicate-Shadow. Misplaced-File rendert mit Pull-Animation zum Suggested-Folder.
6. **Aggregation vereinheitlichen:** `aggregateSeverities` existiert doppelt + divergiert bei dismissed.
7. **`inferCategory` killen:** Inspector leitet Category per Keyword-Scan auf `path` ab → bricht silent zu 'unknown' bei echtem Pfad. `finding.category` existiert → threaden.

---

## 5. Naming/Legend-Modell — konkrete human-readable Labels pro kind

**Single Source-of-Truth:** neue `packages/core/src/kind-meta.ts` (core, damit Audit + Web + Inspector dasselbe Vokabular teilen). `KindMeta = { label; purpose; icon; vendor; scope; tier }`.

**Title-Resolution pro Node:** parsed `file.name` (Author-Titel) → sonst `KIND_META[kind].label`. **Subtitle:** parsed `file.description` → sonst `KIND_META[kind].purpose`.

| kind | label | purpose | vendor | tier |
|---|---|---|---|---|
| `claude-md` | Project Guidance | Repo-wide instructions for Claude | Claude Code | primary |
| `agents-md` | Agent Guidance | Cross-tool instructions (AGENTS.md standard) | Open standard | primary |
| `claude-agent` | Subagent | A specialised agent definition | Claude Code | primary |
| `claude-command` | Slash Command | A reusable /command for Claude | Claude Code | primary |
| `claude-skill` | Skill | A packaged, reusable capability | Claude Code | primary |
| `gemini-md` | Gemini Guidance | Repo instructions for Gemini | Gemini | vendor |
| `cursor-rule-mdc` | Cursor Rule | A scoped editor rule (.mdc) | Cursor | vendor |
| `cursor-rules-legacy` | Cursor Rule (legacy) | Old-style — consider migrating | Cursor | vendor |
| `windsurf-rule` | Windsurf Rule | A scoped Windsurf rule | Windsurf | vendor |
| `cline-rule` | Cline Rule | Repo instructions for Cline | Cline | vendor |
| `codex-rule` | Codex Config | Codex agent settings & rules | Codex | vendor |
| `aider-conf` | Aider Config | Aider settings | Aider | vendor |

**Folder-Rollen** (`folderRole(segment, parent)`): `.claude`→'Claude Code config', `.claude/agents`→'Subagents', `.claude/commands`→'Slash commands', `.claude/skills`→'Skills', `.cursor`→'Cursor config', `.cursor/rules`→'Cursor rules', `.windsurf`→'Windsurf config', `.codex`→'Codex config'. Nicht-gemappt → `<segment>` mit Purpose „Context files governing `<segment>/`".

**3-Tier-Surfacing:** (1) Node-Primary-Label. (2) Hover Zeile 2 = purpose + Vendor-Pill. (3) Inspector = Mono-`filePath` unter „Source". **Tier-Bänderung:** MUST-5 full-weight, Vendor muted Color-Dot. **On-Node-Glyph-Map** distinkt vom Severity-Badge.

> **Submodule-Erweiterung (aus User-Beispiel `code-apps-template`):** `.claude/` kann ein **git-Submodule** sein (geteilter Team-Kontext über viele Repos, z.B. `code-apps-context`). Das ist eine eigene Node-Klasse („Shared Team Context · Submodule") mit distinkter Optik (anderer Ring/Material) — NICHT ein normaler Folder. Zwei `CLAUDE.md` (Root projekt-spezifisch + `.claude/CLAUDE.md` shared) haben eine **Lade-/Abhängigkeits-Beziehung** (Root verweist „wird automatisch zusätzlich geladen") → als Verbindung zeigen. Submodule-Pin-Staleness + falsche Referenz = Review-Findings. `.gitmodules` parsen, um Submodule-Folder zu erkennen.

---

## 6. Research-Erkenntnisse — adoptierbare Patterns mit Quellen

### Landing-Anatomie (2026 Devtool-Best-Practice)
- **Text-first Hero, Demo zweitens** — nie Live-Demo als Hero bei komplexen Produkten. (Linear, Vercel, Resend, Raycast)
- **H1-Formel:** `[Outcome] + [Audience/Era-Qualifier]`, ≤8 Wörter. Linear: „The product development system for teams and agents".
- **CTA:** Produkt-Verb + distinkte Secondary. „Trial for free" schlug „Sign up for free" um 104%. (evilmartians.com)
- **Demo gerahmt in App-Chrome, ~60–72vh, eine-Scroll-tiefer.** (Raycast, Linear)
- **Section-Order:** Hero → Logos+Stat → 4–6 nummerierte Chess-Features → Testimonials → Pricing-Teaser → Final-CTA.
- **Social-Proof kontextuell** + harte Usage-Stat.

### Graph-UX (Repo-Visualisierung)
- **LOD-Labeling 3 Tiers:** Icon+Color → humanized Name für große Nodes → full Name+Meta auf Hover/Zoom. (openlayers Decluttering)
- **Hover-Reveal Edges statt Hairball.** (githubnext repo-visualization) — matcht bestehendes Sub-C Hover-Reveal.
- **Enclosure/Circle-Packing für Nesting** liest Topologie besser als Treemap. Cluster aus echter Hierarchie, nie `cluster_7`.
- **Humanize Identifiers:** Leaf-Name statt Pfad, Type-Color + Icon (VS Code Material/Seti-Konvention), kein Rot-Grün.
- **Leader-Lines + 8-Position Collision-Avoidance** für always-on Labels. (ArcGIS)
- **Detail-Panel statt Tooltip-only** für load-bearing Info. Mobile-List ≤639px = Escape-Hatch.

### Animation (Scroll-Choreografie, motion + GSAP)
- **scroll-TRIGGERED (whileInView, once)** für Entrances vs **scroll-LINKED (useScroll+useTransform)** für Galaxie-Walkthrough — NICHT mischen. (motion.dev)
- **Hero-Entrance:** motion variants + `staggerChildren:0.08`, ease `[0.22,1,0.36,1]`, ~0.5s, mount-`animate`.
- **Galaxie-Reveal = Pin+Scrub Sticky-Scrollytelling:** Outer 300–400vh, Graphic `sticky;top:0`, Step-Sections. Variante A (CSS+motion useScroll) bevorzugt; GSAP `pin:true,scrub:1` nur für Pin-Präzision. **NIE das gepinnte Element selbst animieren** — nur Children.
- **Jitter glätten:** `useSpring(scrollYProgress)` vor `useTransform`. Pixi aus spring-smoothed Progress in rAF treiben.
- **Reduced-Motion = Pflicht-Gate** (`useReducedMotion`/`gsap.matchMedia`). matchMedia auch für Mobile-Pin-Disable.
- **`useGSAP({scope})` aus `@gsap/react`** gegen ScrollTrigger-Leaks. `ScrollTrigger.refresh()` nach Pixi-Mount.
- **Performance:** nur transform+opacity, kein transform/filter auf Pin-Ancestors.

---

## 7. Empfohlene Plan-Struktur (Master + Sub-Pläne) + grobe Sequenz

**Master:** `docs/plans/galaxie-landing-redesign.md` — koordiniert beide Tracks. **DB-Migration-Sektion Pflicht.** Der bestehende `galaxie-legibility-rework.md` (Bundle I) ist „kein Mechanik-Redesign" und deckt nichts davon ab.

**Track 1 — Galaxie (Daten-zuerst):**
- **Sub-A · Data-Foundation (Kill-Gate):** `finding.filePath`-Spalte + Migration; `FileNode` erweitern (filePath/kind/label/category/placement); `path` aus citations; Node-Gruppierung pro Pfad; `aggregateSeverities` vereinheitlichen; `inferCategory` killen. **Acceptance:** echte Folder auf Real-Data.
- **Sub-B · Containment + Merge:** `extractOwningFolder`; FolderNode `fileIds`; foldered-File `parentId`; folder-level Context-File als Nukleus. Misplaced-Detection + Pull-Animation. **+ Submodule-Erkennung (`.gitmodules`).**
- **Sub-C · Naming/Legend:** `kind-meta.ts`; `humanizeNodeLabel`; Title-Resolution; alle 5 Label-Surfaces durch eine Source.
- **Sub-D · Layout-Spacing:** Radius-by-child-count; Inter-Ring-Widening; Cap droppen; Relaxation/Golden-Angle; count-aware SUN_ORBIT; Mobile-Scale.
- **Sub-E · File-vs-Folder-Optik:** Folder=filled / File=ringed; Radius-Bump; On-Canvas-BitmapText-Label mit LOD.
- **Sub-F · Premium-Rendering:** Sun-Gradient+Corona; Planet-Sphere; Starfield+Nebula+Vignette; Glow-2-Pass; Hover-Ring; Edge/Orbit-Gradient; Ambient-Drift+Entrance+Twinkle; Tooltip-Type-Scale; EmptyGalaxie-Fix.
- **Sub-G · A11y/List/SVG-Parität:** SolarListView hierarchisch; StaticGalaxieSVG-Parität; reduced-motion-Canonical; Test Folder-Count/Nesting-Parität + Playwright-Keyboard-Walk.

**Track 2 — Landing:**
- **Sub-H · Hero-Restructure:** Text-Hero (sichtbare H1 + Subhead + CTAs); Galaxie demoten.
- **Sub-I · Live-Demo-Section:** App-Chrome-Frame ~60–72vh, Explainer, Sticky-Scrollytelling, reduced-motion-Gate.
- **Sub-J · Narrative-Sections:** Logo-Strip+Stat, Chess-Features, Testimonials, Pricing-Teaser, Final-CTA.
- **Sub-K · Portfolio-Demo-Data:** Demo als Agency-Workspace (~6 Customers, 1–2 on fire); Size=severity-weight; HUD-Rollup; Default-Focus auf Worst-Finding; Asymm-Severity portieren.

**Sequenz:** Sub-A (Kill-Gate) → parallel {B, C} → D → E → F → G; Track 2 H → I → {J, K}. Sub-A zuerst, weil Merge + Naming + List-Surfaces auf der `FileNode`-Shape-Änderung gaten.

---

## 8. Offene Entscheidungen (in Discovery R2 mit User geklärt)

1. Landing-Galaxie = Workspace-Galaxie oder eigene Pipeline? (zwei divergierende Renderer)
2. DB-Migration jetzt oder Citations-Parsing für v1?
3. Portfolio-Open vs Single-Repo-Open auf der Landing?
4. Size-Encoding Bytes → Severity-Weight?
5. Reduced-Motion-Canonical-Surface (SolarListView vs StaticGalaxieSVG)?
6. Misplaced-Context-Detection im Scope dieses Redesigns?
7. On-Canvas-Labels: alle oder LOD-gegated?
8. Geometry-Bump-Magnitude für lesbares Inside-Label?
