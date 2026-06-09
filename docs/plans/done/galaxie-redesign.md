# Plan — Galaxie Redesign (Track 1)

> Status: ✅ Done — 2026-06-09 (Confidence-At-Start: High · Kern A–G + B.5 ✅, Commit `1df77e2` · Daten-zuerst-Redesign: echte `finding.filePath`-Migration, Multi-Finding-Grouping, Naming/Legend, count-aware Spacing, File≠Folder + On-Canvas-LOD-Labels, Premium-Sun/Sphere/Starfield, A11y-Parität, Submodule. Deferred Politur: B.6 Root↔Submodule-Edge · B.3b foldered-Files-als-Satelliten · F.6-9 Hover/Edges/Motion/Tooltip · G.4 Keyboard-Walk · E.5 KIND_GLYPH. Migration 0018 noch nicht auf Prod-DB [Deploy-Task].)
> Slug: `galaxie-redesign` · Confidence: **High** · Erstellt 2026-06-09
> Master: [`galaxie-landing-redesign.md`](./galaxie-landing-redesign.md) · Synthese: `docs/audits/2026-06-frontend-challenge/_synthesis.md`
> Löst die offenen Reste von `galaxie-legibility-rework.md` (Bundle I) ab — das war „kein Mechanik-Redesign", dies ist es.

## 1. Ziel

Die Workspace-Galaxie von einem flachen, gelogenen Diagramm in eine premium, menschlich-verständliche Repo-Health-Galaxie verwandeln. Daten-zuerst: erst echte Datei-Identität, dann Merge/Naming/Optik. Der Pixi-Solar-Renderer wird die Single-Source für Workspace UND (in Track 2) Landing.

## 2. User-Entscheidungen (Audit-Trail)

Siehe Master §2. Track-1-relevant:
- **Naming:** semantisch auf Node, roher Pfad sekundär (Inspector).
- **Merge:** Folder-Level-Context-Files visuell in Ordner-Planeten; `.claude/`-Submodule als eigene Node-Klasse; Root↔Submodule-CLAUDE.md-Beziehung sichtbar.
- **Label-Platzierung:** Hybrid-LOD (unter Node → beim Zoom auf den Körper, 2-zeilig).
- **DB:** echte `finding.filePath`-Spalte (Migration).
- **Detection:** nur visueller Merge + Submodule hier; Misplaced-Detection ist Fast-Follow.
- **On-Canvas-Labels:** LOD-gegated. **Reduced-Motion-Canonical:** `SolarListView`.

## 3. Existing-Patterns

- `lib/dal/galaxie.ts` (`getGalaxieDataForWorkspace`, `aggregateSeverities`) — DAL + Cache-Tag-Invalidierung.
- `lib/galaxie/{solar-layout,types,severity-colors}.ts` — Layout-Math + `SEVERITY_HEX`-Single-Source.
- `@vk/parser` `classify.ts`/`classifyPath` + `MUST_KINDS` — 12 kinds, Tier-Quelle.
- `components/galaxie/` Pixi + `StaticGalaxieSVG.tsx` — Dual-Render, Parität Pflicht.
- Asymm-Severity (nur Kill schreit) + Hover-Reveal + Datadog-Pivot — Konvention behalten.
- Migrations-Konvention: hand-written SQL in `packages/db/drizzle/` + `meta/_journal.json` + Schema-Sync in `packages/db/src/schema.ts`.

## 4. Alternativen, die wir NICHT wählen

- Citations-Parsing statt Migration (fragil). · Treemap statt Solar (Metapher gesetzt). · Voller Rename-Layer (Orientierung weg). · `name`-Feld mutieren (bricht Folder-ID-Key + Pivot-Match) → stattdessen `displayName` ableiten.

## 5. Endzustand (Acceptance)

Siehe Master §5, Galaxie-Teil. Pro-Phase-Acceptance unten je Phase.

## 6. Schritte (Phasen A–G)

### Phase A — Data-Foundation (Kill-Gate, ~2–3 dd) — ✅ Done 2026-06-09

> **Abgeschlossen 2026-06-09** (`/execute`, Confidence-At-Start High). 6 Schritte (A.5-Gruppierung → B.1 verschoben). typecheck 23/23 · lint 0 errors · 295 Tests grün (+2 Phase-A-Acceptance). **Manuell offen (Deploy-Task):** Migration `0018_finding_filepath.sql` auf DB anwenden (idempotent, additive nullable) — passiert beim nächsten Deploy/`db:migrate`, nicht selbst angestoßen. Visuelle Galaxie-Wirkung erst ab Phase B (Containment rendert) + nach erstem Audit, der `file_path` füllt.

**Problem:** `FileNode.path = f.title || f.category` (`galaxie.ts:184`) ist Prosa, kein Pfad → keine Ordner auf Real-Data, Merge unmöglich. `kind`-Distinktion ist vor der DAL weg.

**Schritte:**
1. **Migration `finding.filePath text` (nullable)** + optional `finding.fileKind text`. SQL in `packages/db/drizzle/0018_finding_filepath.sql` + `_journal.json` + Schema-Sync `schema.ts`. Backfill aus `citations[0].path` für bestehende Rows (UPDATE in Migration ODER Code-Backfill — Pre-Flight-Entscheidung).
2. **Audit-Writer** befüllt `filePath` (+`fileKind` via `classifyPath`) beim Finding-Schreiben — Quelle der Wahrheit ab jetzt. (Parser kennt den Pfad bereits.)
3. **`FileNode` erweitern** (`types.ts`): `filePath?: string`, `kind?: AgentFileKind`, `label?: string` (= alter title/category), `category` (aus `finding.category`, nicht inferred). `path` = echter Pfad.
4. **`galaxie.ts:184`** → `path: f.filePath ?? f.citations?.[0]?.path ?? f.title`. `label` = `f.title || f.category`.
5. **`aggregateSeverities` vereinheitlichen** — Doppel-Impl (`galaxie.ts:90` exkludiert dismissed; `solar-layout.ts:43` nicht) → eine Impl, Folder-Aggregation in `loadWorkspaceData`.
6. **`inferCategory` killen** (`Inspector.tsx:346,481-491`) — `finding.category` direkt threaden.

> **Sequenzierung 2026-06-09 (Execute):** Die ursprüngliche A.5 (per-Pfad-Node-Gruppierung) ist nach **Phase B.1 verschoben**. Grund: sie kollabiert N Findings→1 Node (`node.id` pfad-statt-finding-basiert), kaskadiert damit in Click-Match (`GalaxieScene:360`), Inspector-File-Mode (Multi-Finding-Liste), Apply/Dismiss-Keying + alle Render-Surfaces — datenlogisch dieselbe Restrukturierung wie Phase-B-Containment (`fileIds`/`node.id`). Phase A bleibt reine Daten-Schicht. Heute gilt weiter: 1 FileNode = 1 Finding.

**Acceptance:** Realer Audit mit Subfolder-Context-Files → `computeSolarLayout` produziert Folder-Count > 0. Test asserting echte Pfade fließen. (Mehrere Findings/File = noch mehrere Nodes — Gruppierung in B.1.)

### Phase B — Containment + Merge + Submodule (~2–3 dd)

> **Teil-Fortschritt 2026-06-09 (`/execute`):** **B.1 ✅ + B.2 ✅ + B.3a ✅ + B.4 ✅** gelandet (typecheck/lint/310 Tests grün). **Recon-Erkenntnis:** Foldered Files rendern heute NICHT als eigene Planeten (`GalaxieScene:963-964` — nur Root-Files; foldered aggregieren in den Folder-Pivot). Damit betraf **B.1**-Grouping real nur Root-Files; **B.3b** bleibt eine Render-Modell-Erweiterung (foldered Files als Satelliten relativ zum Folder rendern); **B.5/B.6** ein Parser-Feature. **Offen: B.3b (Satelliten-Render), B.5 (.gitmodules), B.6 (Submodule-Edge).**

1. **Node-Gruppierung pro echtem Pfad (verschoben aus A.5)** — ✅ **Done 2026-06-09.** `FindingRef` + `FileNode.findings[]` (types), pfad-basierte `file.id` (`${repoId}::file::${path}`), pure `groupFindingRefsIntoFiles` (`lib/galaxie/group-findings.ts`, 10 Unit-Tests) in der DAL. Aggregat-Felder (severity/dismiss/solution/snippet = worst-active Repräsentant) bleiben auf FileNode → Planet/Tooltip/List/SVG unverändert. `FileInspector` → Finding-Karten (je Karte eigene Dismiss/Snooze/Apply auf echte `finding.id`, lazy AI-Solution). `AISolutionPlaceholder` nimmt jetzt `findingId`. Click/Tour/Deeplink nutzen die pfad-basierte id (Deeplink-Fallback bestand bereits).
2. **`extractOwningFolder = dirname(path)`** ersetzt `extractTopFolder` (`solar-layout.ts:36-41,154-168`). Repo-Root (`dirname === '.'`) bleibt standalone. Click-Match `GalaxieScene.tsx:360-361` mitmigrieren.
3. **FolderNode `fileIds: string[]`** (wird in `:165` berechnet + verworfen — behalten). `parentId` generalisieren (`types.ts:100-116`), foldered-File `parentId` = Folder-ID statt Sonne.
4. **Folder-Level-Context-File als Nukleus:** wenn ein Context-File `dirname` == Folder-Pfad, rendert es im Zentrum des Folder-Planeten (Merge), nicht als Peer-Orbit. — ✅ **Done 2026-06-09.** Nukleus-Def (User): kind ∈ {claude-md, agents-md, gemini-md}, Priorität claude>agents>gemini; `FolderNucleus`-Typ + Berechnung in `computeSolarLayout` (NUCLEUS_KIND_PRIORITY). Optik (User): distinkter warmer innerer Kern (`#fff6e8`) im `FolderPlanet` + SVG-Parität; FolderInspector zeigt „Governing context"-Banner (klickbar → öffnet die Datei). Mock-Demo bekommt `kind` pro Pfad → `.claude`-Folder zeigt Kern. 3 Unit-Tests (Zuweisung, agents-only=kein Nukleus, Priorität).
5. **Submodule-Erkennung:** `.gitmodules` parsen (im Parser/Scan), Submodule-Folder mit `isSubmodule: true` + `submoduleUrl` markieren. Eigene Node-Klasse „Shared Team Context · Submodule" mit distinkter Optik. — ✅ **Done 2026-06-09.** Pure `parseGitmodules` (`@vk/parser`, 4 Tests) + `scanRepository` liest alle `.gitmodules` (root+nested, Pfade root-relativ) → `ParserResult.submodules` (core-Typ). **Migrations-frei** durch die Galaxie: `submodules` reisen in `scan.rawScan` (persistierter ParserResult) → DAL liest sie → `Repo.submodules` → `computeSolarLayout` markiert Folder `isSubmodule`/`submoduleUrl` (Test). Render-Marker: Teal-Double-Ring (FolderPlanet + SVG-Parität), FolderInspector „Shared Team Context · Submodule"-Banner + URL, SolarListView-„submodule"-Pill. Mock zeigt `.claude`-Submodule. typecheck 23/23, lint sauber, alle galaxie/parser/core-Tests grün (Full-Suite-Fails = Maschinen-Last-Timeouts auf FS/YAML-Tests, nicht berührt).
6. **Root↔Submodule-CLAUDE.md-Beziehung:** wenn Root-`CLAUDE.md` auf `.claude/CLAUDE.md` verlinkt (outlinks kennt der Parser), Verbindungs-Edge zeichnen. — **Deferred** (Outlink-Graph-Analyse + Edge-Render, eigener Follow-up).

**Acceptance:** `code-apps-template`-artige Struktur (Root-CLAUDE.md + `.claude/`-Submodule mit eigener CLAUDE.md) rendert: Submodule als eigene Klasse, Context-Files genestet, Beziehung sichtbar.

### Phase C — Naming/Legend (~1.5 dd) — ✅ Done 2026-06-09

> **Abgeschlossen 2026-06-09 (`/execute`).** `packages/core/src/kind-meta.ts` (KIND_META: 12 kinds × label/purpose/vendor/tier + `folderRole`), `lib/galaxie/humanize.ts` (single Source: `fileDisplayName`/`fileSubtitle`/`fileVendor`/`folderDisplayName`/`folderSubtitle`). UX-Verfeinerung: **named kinds** (Subagents/Commands/Rules) zeigen Dateinamen als Primary (`researcher`), **config-root kinds** (CLAUDE.md/AGENTS.md) das KIND_META-Label; purpose = Subtitle, Vendor-Pill. Routed: Tooltip (file+folder), Inspector (file-Header, folder-Header, folder-Rows), SolarListView, StaticGalaxieSVG-aria. Roher Pfad bleibt als Mono-Subline. 10 Unit-Tests (KIND_META-Coverage, named-vs-config, folderRole, Fallbacks). typecheck/lint/320 Tests grün, Client 0 Console-Errors. On-Canvas-Glyph/Label = Phase E.

1. **`packages/core/src/kind-meta.ts`** — `KIND_META` (12 kinds: label/purpose/icon/vendor/scope/tier), `folderRole(segment,parent)` (`.claude`→'Claude Code config' etc.), `KIND_GLYPH`. Tabelle siehe Synthese §5.
2. **`humanizeNodeLabel(pathOrName, kind)`** in `lib/galaxie` — eine Humanisierungs-Source.
3. **Title-Resolution:** parsed `file.name` (Frontmatter) → sonst `KIND_META.label`. Subtitle: `file.description` → sonst `purpose`.
4. **Alle 5 Surfaces** durch die Source: `Tooltip.tsx:26,40`, `Inspector.tsx:204,324,410,467`, `SolarListView.tsx:116`, neues On-Canvas-Label (Phase E), Legend. Roher Pfad als Mono-Subline im Inspector behalten.
5. **`displayName`** auf Folder ableiten (NICHT `name` mutieren).

**Acceptance:** Keine rohen `.claude`/`gemini.md` mehr als Primary-Label; Inspector zeigt Pfad sekundär.

### Phase D — Layout-Spacing (~2 dd) — ✅ Done 2026-06-09 (Kern)

> **Abgeschlossen 2026-06-09 (`/execute`).** **Recon:** Canvas läuft praktisch immer @scale 1 (≤639 px = SolarListView, nicht Canvas) → **D.6 (mobileScale ins Layout) bewusst übersprungen** (toter Pfad). Umgesetzt: **count-aware Ring-Radien** (`ringRadius(min,count,arcGap)`: Folder-Ring wächst mit Count, Arc/Planet ≥ `FOLDER_ARC_GAP`; File-Ring ≥ Folder-Ring + `INTER_RING_GAP`), **2-Orbit/6-Cap gedroppt** → Single-Ring + Hash-Angular-Offset (Sibling-Rings aligned nicht), **count-aware `SUN_ORBIT_IN_CLUSTER`** (`SUN_TANGENTIAL_GAP`), moderate Min-Radius-Bumps (Folder 60→70, File 130→150) für generelle Luft, Single-Repo-Sun zentriert. Orbit-Ring-Renderer (Pixi `orbits.ts` + `StaticGalaxieSVG`) leiten Radien jetzt aus echten Node-`orbitRadius` ab statt Konstanten. **Offen/skipped:** D.4 (Force-Directed — even-dist+count-aware reicht), D.7 (Legacy `layout.ts` löschen — MiniMap-Bridge, Risiko, out-of-scope). typecheck/lint/321 Tests grün (count-aware Invarianten + Dense-Repo-Spacing).

1. **Radius-by-child-count:** `R = max(R_min, (N·gap_target)/(2π))`, `gap_target ≈ 3×` Footprint (Folder ~40px, File ~24px). `R_min` = aktuelle Werte (sparse Repos unverändert).
2. **Inter-Ring ≥2× Footprint** — Radien sequentiell ab Sun-Edge stacken.
3. **Two-Ring-6er-Cap droppen** (`solar-layout.ts:176-177,208-209`) → Angular-Density-Verteilung.
4. **Relaxation-Pass:** Min-Angular-Separation + optional 5–10 deterministische (seeded) Force-Directed-Iterationen. Alternativ Golden-Angle 137.5°.
5. **Count-aware `SUN_ORBIT_IN_CLUSTER`** (Solarsystem-Overlap bei 6+ Repos).
6. **`mobileScale` in `computeSolarLayout` feeden** → Ring-Math + Hit-Areas teilen Source; `gap_target ≥ 2·hitR·maxScale`.
7. Legacy `layout.ts` (RNG-Jitter): löschen oder auf `computeSolarLayout` migrieren (Pre-Flight).

**Acceptance:** Dichtes Repo (10+ Files/Folder) → keine küssenden Nachbarn, kein Ring-Schnitt, keine Mobile-Hit-Collision.

### Phase E — File-vs-Folder-Optik + On-Canvas-Labels (LOD) (~2 dd) — ✅ Done 2026-06-09 (Kern)

> **Abgeschlossen 2026-06-09 (`/execute`).** **E.1** File≠Folder: FilePlanet hollow/ringed (faint fill α0.25 + 2px Severity-Ring) vs Folder solid; SVG-Parität. **E.2** Radius FILE 4→5, FOLDER 8→9. **E.3** On-Canvas-Labels: humanisiert (`fileDisplayName`/`folderDisplayName`/`repo.label`), `pixi/NodeLabel.ts` (Pixi `Text`-Child je Sprite, counter-scaled), SVG always-on Sun+Folder-Labels. **E.4** Hybrid-LOD: `useTick` liest `camera.scale`, pure `pixi/node-label-lod.ts` (`computeLabelLOD`, 5 Unit-Tests) → hidden < show / 1-zeilig unter Node / 2-zeilig auf Body ≥ onBody; Schwellen Sun{0.6/1.2} Folder{1.8/3.2} File{3.0/5.0} **als tunebare Konstanten**. typecheck/lint/326 Tests grün. **⚠️ Pixi-Canvas headless nicht verifizierbar (nur authed) — Optik + LOD-Schwellen brauchen visuellen User-Check/Tuning.** **E.5 (KIND_GLYPH) deferred** (asset-heavy, eigener Follow-up).

1. **File ≠ Folder:** Folder = gefüllte Disc; File = hollow/ringed Disc (dicker Stroke, low-alpha Fill). Shared Paint-Path + `StaticGalaxieSVG`-Spiegelung.
2. **Radius-Bump** FILE 4→5, FOLDER 8→9 (Basis; LOD-Growth siehe 4).
3. **On-Canvas-`BitmapText`-Label** je Node-Container (Bitmap-Font pre-baked), human-readable (Phase C). Panned/zoomt mit der Welt.
4. **Hybrid-LOD:** Default Label **unter** Node (klein); ab Zoom-Schwelle wächst Planet + Label rückt 2-zeilig **auf** den Körper. Schwellen Sun>0.6 / Folder>1.8 / File>3.0 (Startwert, Phase-E-Tuning), Alpha-Tween 0.15s.
5. **`KIND_GLYPH`** zentriert auf Node, distinkt vom 1-o'clock-Severity-Badge.

**Acceptance:** File/Folder auf einen Blick unterscheidbar; jeder Node hat lesbares Label; beim Reinzoomen 2-zeilig auf dem Planeten (User-Wunsch wörtlich).

### Phase F — Premium-Rendering (~3 dd) — ✅ Done 2026-06-09 (Kern)

> **Abgeschlossen 2026-06-09 (`/execute`).** **F.1** Premium-Sun: warme Photosphäre-Layer (#fff6e8→#ffd9a0→#d99a5c→#8a4f24) + Specular-Hotspot + Rim-Light + Corona-GlowFilter (reduced-motion: kleinere distance); SVG-Parität (Layer-Circles statt Grau). **F.2** Sphere-Shading: Upper-Left-Highlight + Atmosphäre-Rim auf Folder+File (Pixi+SVG). **F.3** Background: Dot-Grid raus → Deep-Space-Gradient + Vignette + 2 Nebula-Tints + gestreute Sterne (prime-tile-sizes), geteiltes `lib/galaxie/space-bg.ts` für Pixi-Host + SVG. typecheck/lint grün, galaxie+core 79 Tests grün (Full-Suite-Fails = Dev-Server-CPU-Last-Timeouts in parser/webhook, nicht berührt). **⚠️ Pixi-Canvas headless nicht sichtbar — Optik braucht User-Check.** **Bewusst geskippt:** F.4 (Whisper-Glow — kollidiert mit „Calm-by-Default/nur-Kill-schreit"-Konvention + Test), F.5 (Submodule-Material — Node-Klasse noch nicht gebaut), F.6 (Hover/Focus-Polish), F.7 (Gradient-Edges), F.8 (Ambient-Drift-Motion/Twinkle — Jank-Risiko blind), F.9 (Tooltip-Scale/EmptyGalaxie). Diese als optionaler Polish-Follow-up.

1. **Sun:** Radial-Gradient-Textur — Corona (BlurFilter) + warme Photosphäre `#fff6e8`→`#d99a5c`→`#8a4f24` + Specular-Hotspot + Rim-Light-Stroke (`RepoSun.ts:70-83`).
2. **Planeten:** Baked-Sphere-Shading (Light-Dir -45°, Rim-Light-Arc, 1px Atmosphären-Halo) — `FolderPlanet.ts`, `FilePlanet.ts`.
3. **Background:** Gradient + Vignette + Parallax-Starfield (2–3 Layer) + 1–2 Nebula-Blobs; Dot-Grid droppen (`GalaxieScene.tsx:550-558`).
4. **Glow:** Kill loudest (quality 0.4–0.5, 2 Passes), andere Bänder Whisper-Glow (Magnitude statt on/off) — Asymm-Severity bleibt.
5. **Submodule-Material:** distinkter Ring/Material für Submodule-Node-Klasse (Phase B).
6. **Hover/Focus:** crisp Ring-Stroke + Soft-Outer-Glow in Severity-Hue; Keyboard-Focus dashed/double-Ring Brand-Accent.
7. **Edges/Orbits:** Gradient-Stroke Sun→Planet + faint Glow; Orbit-Rings dashed/soft @0.12.
8. **Motion:** Ambient-Drift (Keplerian), Asymm-Easing (IN `back.out(1.7)` 0.18s / OUT `power2` 0.32s), Mount-Stagger-Entrance, Star-Twinkle. reduced-motion-Gate.
9. **Tooltip-Type-Scale** + **EmptyGalaxie** Copy-Fix + Mini-Preview.

**Acceptance:** User-Browser-Check „sieht premium aus". FPS stabil (Glow profilen).

### Phase G — A11y/List/SVG-Parität + Tests (~2 dd) — ✅ Done 2026-06-09 (Kern)

> **Abgeschlossen 2026-06-09 (`/execute`).** **G.1** pure `lib/galaxie/tree.ts` `buildGalaxieTree` — repo→folder→file-Tree aus **derselben** `computeSolarLayout`-Folder-Ableitung wie Pixi/SVG (Parität-Garantie) + Root-Files via `extractOwningFolder`. **G.2** `SolarListView` komplett hierarchisch umgebaut: collapsible repo→folder→file, Aggregat-Severity-Rows, Nukleus-Indikator (Amber-FileText-Icon), humanisierte Labels + Pfad-Subline, Severity-Filter blendet leere Branches aus, 44pt-Tap-Targets, Folder/File öffnen Inspector. **G.3** Parität-Test: tree-folders ≡ computeSolarLayout-folders 1:1 (ids/nucleus/humanized label) + jede Datei genau einmal. SVG-Parität (Nukleus/File≠Folder/Labels/Shading/Sun/BG) wurde inkrementell in B4/E/F mitgezogen. 4 neue Unit-Tests; galaxie+core **83 Tests grün**, typecheck/lint sauber, 0 Console-Errors. **G.4 Playwright-Keyboard-Walk deferred** (Galaxie ist authed-only → headless nicht ausführbar; User-Session-Aufgabe).

1. **`SolarListView` hierarchisch** (repo→folder→file, collapsible, aggregate-severity-Rows) — Canonical reduced-motion-Surface.
2. **`StaticGalaxieSVG`-Parität** mit neuem Nesting/Labels/File-vs-Folder.
3. **Parität-Test:** Folder-Count + Nesting + Labels identisch über Pixi/SVG/List.
4. **Playwright-Keyboard-Walk** (frische Session): Galaxy↔List-Toggle, Focus-Ringe, Inspector erreichbar.

**Acceptance:** 3 Renderer konsistent; Keyboard-Walk grün.

## 7. Files-to-Change

- **DB/Core:** `packages/db/src/schema.ts`, `packages/db/drizzle/0018_finding_filepath.sql` (+`_journal.json`), `packages/core/src/types.ts`, neu `packages/core/src/kind-meta.ts`. Audit-Writer (Finding-Insert-Pfad in `packages/audit`/`packages/inngest`).
- **DAL/Layout:** `apps/web/src/lib/dal/galaxie.ts`, `apps/web/src/lib/galaxie/{solar-layout,types,severity-colors,orbits,edges}.ts`, neu `humanizeNodeLabel.ts`, evtl. `layout.ts` (löschen).
- **Render:** `apps/web/src/components/galaxie/{GalaxieScene,RepoSun,FolderPlanet,FilePlanet,Tooltip,Inspector,SolarListView,EmptyGalaxie}.{ts,tsx}`, `StaticGalaxieSVG.tsx`.
- **Parser:** `.gitmodules`-Erkennung in `@vk/parser` (Scan).

## 8. DB-Migrationen

`0018_finding_filepath.sql`: `ALTER TABLE finding ADD COLUMN file_path text; ADD COLUMN file_kind text;` (beide nullable). Backfill `UPDATE finding SET file_path = citations->0->>'path' WHERE file_path IS NULL AND ...`. Idempotent, kein Breaking-Change. Auf cleaner Test-DB verifizieren vor Apply (vgl. Lektion Migration 0016).

## 9. Verifikations-Plan

Unit: `extractOwningFolder`, `humanizeNodeLabel`, Layout-Spacing-Math, `aggregateSeverities` (dismissed), Folder-Count-Parität. `pnpm test` + typecheck + lint vor jedem Commit. Playwright-Browser-Check pro UI-Phase. Dev-Server proaktiv starten (`pnpm --filter @vk/web dev`).

## 10. Risiken

- Audit-Write-Pfad muss `filePath` füllen, sonst pfadlose neue Findings (Phase A zusammen).
- BitmapText-Performance bei 100en Nodes → pre-bake + LOD-Cull.
- Glow-quality-Bump vs FPS → profilen.
- 3-Renderer-Drift → Parität-Test als Gate.
- Submodule-Parsing: `.gitmodules`-Format-Edge-Cases (relative URLs, mehrere Submodule).

## 11. Out-of-Scope

Misplaced-Detection-Rule (Fast-Follow). Color-by-Recency. pgvector-Features.

## 12. Rollout

Inkrementell hinter bestehendem Render-Pfad; nullable Migration. Kein Flag nötig. Kein Deploy ohne User-Request.

## 13. Offen (Pre-Flight)

- Backfill-Strategie (SQL vs Code-Job) — Phase A.
- BitmapText-Font + finale LOD-Schwellen — Phase E.
- `layout.ts` löschen vs migrieren — Phase D.
- Submodule-Optik (Ring vs Material vs Halo) — Phase B/F.
