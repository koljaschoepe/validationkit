# Plan — Galaxie + Landing Redesign (Master)

> Slug: `galaxie-landing-redesign` · Confidence: **High** · Erstellt 2026-06-09
> Quelle: 14-Agent-Frontend-Challenge-Workflow → `docs/audits/2026-06-frontend-challenge/_synthesis.md`
> Koordiniert zwei Sub-Pläne: [`galaxie-redesign.md`](./galaxie-redesign.md) (Track 1) + [`landing-redesign.md`](./landing-redesign.md) (Track 2).

## 1. Ziel

Die zwei Frontend-Flächen, die den Verkauf tragen, von „technisch poliert, strategisch falsch" auf „premium SaaS, das man ausprobieren will" heben:

1. **Galaxie** soll echte Datei-Identität tragen (echter Pfad + `kind` + Frontmatter-Name statt Audit-Finding-Prosa), Context-Files **visuell in ihren Ordner mergen**, human-readable Labels per LOD **auf der Canvas** zeigen, Files klar von Folder unterscheiden, geteilten Submodule-Kontext als eigene Node-Klasse darstellen, und premium aussehen (Sphere-Shading, Corona, Starfield) — statt flacher Diagramm-Optik.
2. **Landing** soll text-first führen (echter Hero + Headline + CTA), die Live-Galaxie-Demo eine Scroll-Tiefe darunter gerahmt + scroll-choreografiert zeigen, und die kanonische Devtool-Section-Order ergänzen (Social-Proof, Features, Pricing-Teaser, Final-CTA).

**Nicht-verhandelbare Reihenfolge:** Galaxie startet *daten-zuerst*. Der Merge ist heute physikalisch unmöglich, weil `FileNode.path = f.title || f.category` (Prosa, kein Pfad) ist — siehe Synthese §4. Erst echten Pfad + `kind` ins Modell, dann Merge/Naming/Optik. Die Landing-Demo konsolidiert auf den **echten** Pixi-Solar-Renderer (heute nutzt sie d3-Circle-Pack — zwei visuelle Sprachen, Demo ≠ Produkt).

## 2. User-Entscheidungen (Audit-Trail)

Discovery: 2 AskUserQuestion-Runden (2026-06-09) nach dem 14-Agent-Workflow.

**Runde 1 (strategisch):**
- **Landing-Scope:** Volle SaaS-Landing (Hero → verkleinerte Demo + Erklärtext/Scroll-Animation → Value-Props → Social-Proof → Pricing-Teaser → CTA). Copy separat.
- **Naming-Modell:** Semantisch auf dem Node, roher Pfad sekundär im Hover/Inspector.
- **Merge-Logik:** Folder-Level-Kontextfiles wandern visuell in den Planeten **+** Fehl-am-Platz wird als Drift/Fix geflaggt. User-Beispiel `code-apps-template`: `.claude/` ist ein git-**Submodule** (geteilter Team-Kontext über viele Repos); zwei `CLAUDE.md` (Root + `.claude/`) mit Lade-/Abhängigkeits-Beziehung. → eigene Node-Klasse + Submodule-Drift-Findings.
- **Plan-Shape:** Master + 2 Sub-Pläne (Galaxie zuerst, Landing baut darauf auf).

**Runde 2 (gegroundet):**
- **Renderer:** Auf EINEN konsolidieren — Pixi-Solar auch auf der Landing mit Demo-Daten. Demo = Produkt.
- **Demo-Fokus:** Portfolio → Zoom-Scrollytelling (öffnet auf Agency-Portfolio ~6 Kunden, 1–2 brennen; scrollt in ein Repo rein).
- **Detection-Scope:** Visueller Merge + Submodule jetzt; Misplaced-Detection-Audit-Rule als Fast-Follow-Sub-Plan im selben Master.
- **Label-Platzierung:** Hybrid-LOD (Default unter Node, beim Reinzoomen wächst Planet + Label 2-zeilig auf den Körper).

**Claude-Empfehlungen (low-stakes, im Plan gesetzt — User kann widersprechen):**
- DB: echte `finding.filePath`-Spalte (Migration) statt fragiles Citations-Parsing.
- Landing-Demo-Size-Encoding: Severity-Weight statt Bytes.
- Reduced-Motion-Canonical-Surface: hierarchische `SolarListView`.
- On-Canvas-Labels: LOD-gegated.

## 3. Existing-Patterns im Repo (Vorbild)

- **DAL + Cache-Tags:** `lib/dal/galaxie.ts` (`getGalaxieDataForWorkspace`) + `revalidateTag(galaxieWorkspaceTag(id))`. Neue Felder dort durchschleifen.
- **Severity-Single-Source:** `lib/galaxie/severity-colors.ts` (`SEVERITY_HEX`) speist Pixi + SVG + Landing. Naming-Source-of-Truth wird ein analoges `packages/core/src/kind-meta.ts`.
- **Parser-Kinds:** `@vk/parser` `classifyPath`/`classify.ts` kennt 12 Vendor-Surfaces + `MUST_KINDS` — Quelle für `kind` + Tier.
- **Render-Split:** Pixi-Canvas (`components/galaxie/`) + `StaticGalaxieSVG` (reduced-motion). Parität ist Pflicht.
- **Asymm-Severity + Hover-Reveal + Datadog-Pivot:** Galaxie-Workspace-Solar (`docs/plans/done/galaxie-workspace-solar-redesign/`) — Konvention beibehalten.
- **Landing-SVG-Stack:** ADR-0004 (motion). GSAP ist für Workspace-Solar bereits im Stack.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Citations-Parsing statt DB-Migration** — verworfen: fragil, `finding` sollte den Pfad nativ tragen (Parser kennt ihn ohnehin).
- **Zwei Renderer pflegen** — verworfen: Demo ≠ Produkt, doppelter Daten-Fix.
- **Treemap statt Solar-Nesting** — verworfen: Circle-Packing/Enclosure liest Topologie besser, Solar-Metapher ist bereits etabliert + verkauft.
- **Vollständiger Rename-Layer (roher Pfad ganz versteckt)** — verworfen: Entwickler verlieren Orientierung; semantisch führen, Pfad sekundär halten.
- **Misplaced-Detection in diesen Redesign ziehen** — verschoben: greenfield Audit-Rule braucht eigene Eval/Korrektheit (Fast-Follow).

## 5. Endzustand (Acceptance-Kriterien)

- [ ] Galaxie rendert auf **echten** Workspace-Daten echte Ordner (nicht nur Mock) — Folder-Count > 0 in einem realen Audit mit Subfolder-Context-Files.
- [ ] Folder-Level `CLAUDE.md`/`AGENTS.md`/`gemini.md` rendert als **Nukleus seines Ordner-Planeten**, nicht als Peer.
- [ ] `.claude/` als git-Submodule wird als eigene Node-Klasse erkannt + gelabelt; Root↔Submodule-`CLAUDE.md`-Beziehung sichtbar.
- [ ] Jeder Node trägt ein **human-readable On-Canvas-Label** (LOD-gegated); roher Pfad nur sekundär (Inspector).
- [ ] File vs Folder optisch eindeutig unterscheidbar (nicht nur Größe).
- [ ] Galaxie sieht premium aus: Sun mit Corona/Specular, Planeten mit Sphere-Shading, Starfield-BG, kein flaches Dot-Grid. Subjektiver Browser-Check durch User.
- [ ] Kein Cramping: bei dichten Repos atmen Orbits nach außen (Radius-by-child-count), keine küssenden Nachbarn, keine Mobile-Hit-Collision.
- [ ] Landing: sichtbarer Text-Hero + H1 + Primary/Secondary-CTA above the fold; Galaxie-Demo ~1 Scroll tiefer, gerahmt, ~60–72vh.
- [ ] Landing-Demo nutzt den echten Pixi-Solar-Renderer, öffnet auf Portfolio, scrollt in ein Repo (reduced-motion-gegated).
- [ ] Landing hat Logo-Strip/Stat, Feature-Sektionen, Testimonials, Pricing-Teaser, Final-CTA.
- [ ] `StaticGalaxieSVG` + `SolarListView` halten Parität (gleiche Folder/Nesting/Labels). Test + Playwright-Keyboard-Walk grün.
- [ ] typecheck + lint + `pnpm test` grün vor jedem Commit.

## 6. Schritte (Master-Sequenz)

**Track 1 — Galaxie** (`galaxie-redesign.md`, daten-zuerst):
- **Phase A · Data-Foundation** (Kill-Gate, blockiert B–G) — echter Pfad + `kind` + Migration.
- **Phase B · Containment + Merge + Submodule** — `extractOwningFolder`, FolderNode `fileIds`, Nukleus-Render, `.gitmodules`-Erkennung.
- **Phase C · Naming/Legend** — `kind-meta.ts`, `humanizeNodeLabel`, alle 5 Label-Surfaces.
- **Phase D · Layout-Spacing** — Radius-by-child-count, Inter-Ring, Relaxation, Mobile-Scale.
- **Phase E · File-vs-Folder-Optik + On-Canvas-Labels (LOD)**.
- **Phase F · Premium-Rendering** — Sun/Planet-Shading, Starfield, Motion.
- **Phase G · A11y/List/SVG-Parität + Tests**.

**Track 2 — Landing** (`landing-redesign.md`, nach Galaxie-Phase-F genug für ehrliche Demo):
- **Phase H · Hero-Restructure**.
- **Phase I · Live-Demo-Section (Renderer-Konsolidierung + Scrollytelling)**.
- **Phase J · Narrative-Sections**.
- **Phase K · Portfolio-Demo-Data**.

**Fast-Follow (eigener Sub-Plan, nach diesem Master):** `misplaced-context`-Audit-Rule + Pull-Animation + Submodule-Staleness-Findings.

**Sequenz:** A → {B, C} parallel → D → E → F → G; dann H → I → {J, K}. Nach jeder abgeschlossenen Phase Acceptance-Check; nach komplettem Track `git mv` Sub-Plan → `done/galaxie-landing-redesign/`.

## 7. Files-to-Change (Master-Überblick)

Detaillierte Listen in den Sub-Plänen. Hotspots:
- **DB/Core:** `packages/db/src/schema.ts` (+ Migration `finding.filePath`), `packages/core/src/types.ts`, neu `packages/core/src/kind-meta.ts`.
- **DAL/Layout:** `apps/web/src/lib/dal/galaxie.ts`, `apps/web/src/lib/galaxie/{solar-layout,types,severity-colors}.ts`, neu `humanizeNodeLabel`.
- **Render:** `apps/web/src/components/galaxie/{GalaxieScene,RepoSun,FolderPlanet,FilePlanet,Tooltip,Inspector,SolarListView,EmptyGalaxie}.{ts,tsx}`, `StaticGalaxieSVG.tsx`, `edges.ts`, `orbits.ts`.
- **Landing:** `apps/web/src/components/landing/HeroSection.tsx` + neue Section-Komponenten, `apps/web/src/app/page.tsx`, Konsolidierung `lib/repo-galaxie/` → Pixi-Solar-Demo-Adapter.

## 8. DB-Migrationen

- **`finding.filePath text` (nullable)** — neue Spalte, vom Parser/Audit-Writer gefüllt; backfill-fähig aus `citations[0].path`. Migration als hand-written SQL in `packages/db/drizzle/` + `meta/_journal.json`-Entry (Konvention). Optional `finding.fileKind`-Spalte ODER kind zur Load-Zeit via `classifyPath`. Detail + Backfill-Strategie in `galaxie-redesign.md` Phase A.
- Idempotent + nullable → kein Breaking-Change für bestehende Rows.

## 9. Verifikations-Plan

Keine neuen schweren Test-Suites außer der Parität-/Nesting-Assertion (User-Entscheidung: Verifikation manuell + Playwright). Pro Phase:
- Unit/Integration wo Logik (Layout-Math, `extractOwningFolder`, `humanizeNodeLabel`, Folder-Count-Parität der 3 Renderer).
- `pnpm test` + typecheck + lint vor jedem Commit (Pre-Commit-Hook macht nur typecheck+lint — `pnpm test` manuell).
- Playwright-Browser-Check pro UI-Phase (frische Session): On-Canvas-Labels, Merge-Nesting, Spacing, Premium-Look, Keyboard-Walk. Dev-Server proaktiv starten.

## 10. Risiken

- **Daten-Migration berührt Audit-Write-Pfad** — `finding.filePath` muss vom Audit-Writer befüllt werden, sonst bleiben neue Findings pfadlos. Backfill + Writer-Update zusammen in Phase A.
- **Renderer-Konsolidierung** (d3-Pack → Pixi-Solar auf Landing) ist die riskanteste Einzeländerung — Landing nutzt heute SSR-freundliches SVG; Pixi lädt `dynamic(ssr:false)`. FCP/LCP der Landing im Auge behalten (Lighthouse).
- **Scrollytelling + Pixi** — scroll-linked State darf Pixi nicht per Scroll-Event treiben (Jank); `useSpring`-smoothed Progress in rAF. reduced-motion + Mobile-Pin-Disable Pflicht.
- **Performance** — On-Canvas-`BitmapText` für 100e Nodes: Bitmap-Font pre-baken, LOD-Culling. Glow-quality-Bump gegen FPS profilen.
- **3-Renderer-Drift** (Pixi/SVG/List) — Parität-Test als Gate.

## 11. Out-of-Scope (eigene Pläne / später)

- Misplaced-Context-Detection-Audit-Rule + Eval (Fast-Follow-Sub-Plan).
- Neue Copy/Brand-Sprache der Landing (Texte feilt User separat; Plan liefert Struktur + Platzhalter-Copy).
- Color-by-Recency-Toggle (git-timestamp Mode) — optional, später.
- pgvector/Embeddings-Galaxie-Features (V2).

## 12. Rollout

Rein additive UI + nullable Migration → kein Feature-Flag nötig, aber phasenweise mergebar. Galaxie-Phasen sind hinter dem bestehenden Render-Pfad inkrementell; Landing-Redesign ersetzt `page.tsx`-Hero erst in Phase H–J. Kein Deploy ohne User-Request. Lighthouse-Check der Landing vor finalem Merge von Track 2.

## 13. Offen (in Phasen-Pre-Flights zu klären)

- Exakte `finding.filePath`-Backfill-Strategie (Migration-SQL vs Code-Backfill-Job) — Phase A Pre-Flight.
- BitmapText-Font-Wahl + LOD-Schwellen final (Sun>0.6 / Folder>1.8 / File>3.0 als Startwert) — Phase E.
- Ob `lib/galaxie/layout.ts` (Legacy-MiniMap) gelöscht oder migriert wird — Phase D.
- Landing-Hero-Copy-Platzhalter vs finale Texte — Phase H (User liefert Copy).
