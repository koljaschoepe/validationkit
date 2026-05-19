# Plan — Master-Vision Galaxie-Refactor

> Erstellt: 2026-05-19
> Status: 🟢 Approved (User-Decisions Q1/Q3/Q7/Q9 ✅ 2026-05-19; Q2/Q4/Q5/Q6/Q8/Q10 = Default-Empfehlungen)
> Slug: `master-vision-galaxie`
> Umfang: Multi-Sprint-Initiative (5–10 Sprints). Dieses File ist Master-Doc; einzelne Sprints werden als Sub-Plans (`docs/plans/galaxie-<sub-slug>.md`) ausgeführt.
> Nächster Schritt: `/execute galaxie-pre-work` (Doc-Konsolidierung + Vision-File + ADRs, ~1-2 Tage).

---

## 1. Ziel

Die ValidationKit-Web-App wird zu einem **kategorie-definierenden Multi-Tenant-SaaS-Tool für AI-Consultancies**, dessen Kern-USP eine **spielerische "Galaxie"-Navigation** mit räumlichem Zoom durch Workspace → Customer → Repo → File und **Zero-Code-UX für Apply-Workflows** ist. Nach diesem Plan ist klar, **was wir bauen, wie es technisch funktioniert, in welcher Reihenfolge**, und die Doku-Inkonsistenzen sind aufgelöst.

---

## 2. Endzustand

**Code-Endzustand (nach allen Sub-Plans):**
- Frontend ist **komplett refactored**: bestehende ~21 Routen sind eingedampft auf Galaxie-Workspace-Layout + 3 Settings-Routen + Auth/Public.
- Galaxie-View funktioniert: User loggt sich ein → landet auf `/[workspace]` → sieht Customer-Planeten mit Severity-Hotspots → kann zoomen bis File-Asteroid → kann Findings/AI-Solutions/Apply-Workflow nutzen.
- DB hat eine echte `customer`-Tabelle (oder das Schema ist explizit so dokumentiert, dass `repo.customer_label` als 1st-class-Customer-Entity zählt — siehe Open-Question Q3).
- Multi-Tenant ist via URL-Slug `/[workspace]/...` durchgängig, Better-Auth-Organization-Plugin aktiv, DAL-Pattern auf jeder Query, `cacheTag("workspace:<id>:*")` durchgängig.
- 11 nicht-existente Doc-Referenzen (PRD, STATUS.md, docs/roadmap/, docs/decisions/) sind aus den .md-Files entfernt.
- `docs/vision.md` + `docs/roadmap/phase-galaxie.md` existieren als 3-Layer-Doc-Struktur.

**UX-Endzustand:**
- User-Persona Agency-Lena loggt sich auf `agency-lena.app.com/[ihr-workspace]` ein, sieht die Galaxie ihrer 5–30 Customer (jeder ein Planet), kann pannen/zoomen, sieht Severity-Hotspots auf einen Blick, klickt einen Hotspot → Side-Panel mit Finding-Detail → AI-Solution → Apply-Button → PR im Customer-Repo. Alles ohne Code zu schreiben.

**Sprint-1-Wow (das erste Shippable):**
- Galaxie-View funktioniert visualisierend mit Echt-Daten aus der DB. Pan, Zoom, Hover, Severity-Color-Coding, Customer→Repo→File-Drill-In. **Noch keine AI-Solutions, kein Apply-Workflow.** Das ist das öffentlich zeigbare Demo nach 4–6 Wochen.

---

## 3. Vision-Summary

### 3.1 Persona + Scope

**Wer:** AI-Consultancies / Boutique-Agencies (8–25 MA), die 5–30 Customer-Repos für ihre Kunden managen. Working-Name "Agency-Lena". Beispiel-Profil: technische Lead-Person mit 2–4 Implementation-Devs, betreibt Custom-Agent-Setups für mehrere Unternehmens-Kunden, muss Context-Engineering-Files (CLAUDE.md / AGENTS.md / .cursor/rules/ / .windsurf/ / .clinerules / .codex/ / aider.conf.yml) über alle Customer-Repos hinweg konsistent halten.

**Nicht-Persona (out-of-scope in diesem Repo):**
- Indie-Founder-Validate-Wedge (lebt im separaten Framework)
- Pricing/Sales-Strategy-PRDs (im separaten Framework)
- Customer-Outreach / Recruitment / BiP-Posts (im separaten Framework)

### 3.2 Capability-Set (was die App TUT)

Reihenfolge = Sprint-Reihenfolge:

1. **Audit + Visualization** (Sprint 1, "shippable Wow"): Multi-Repo-Audit liefert Findings mit Severity-Bändern (Kill/Weak/Mid/Strong/Exceptional). Galaxie-UI rendert diese als räumliche Hotspots über Customer-Planet → Repo-Mond → File-Asteroid.
2. **Drift-Detection** (Sprint 2): Diffs zwischen Repos sind sichtbar (existiert in `@vk/drift`). Galaxie zeigt Drift als "Gravitations-Strom" zwischen Planeten.
3. **AI-Solution-Generation** (Sprint 3): Pro Finding generiert die App via Anthropic Claude Opus (Single-Pass) einen konkreten Edit-Vorschlag mit Diff-Preview.
4. **Zero-Code-Apply** (Sprint 4): Apply-Button → PR im Customer-Repo via GitHub-App (Default) ODER Direct-Commit (pro Repo konfigurierbar). User schreibt nie Code.
5. **Settings + Billing + Onboarding** (Sprint 5): SaaS-Bestandteile poliert. Settings als "Singularität am Galaxie-Rand", Onboarding als Activation-Checklist innerhalb des Workspace-Layouts (kein separater /onboarding-Page).

### 3.3 Differenzierungs-These

Niemand am Markt (Mai 2026) kombiniert: **Multi-Tool Polyglot-Audit** (12 Vendor-Formate) × **Multi-Tenant Agency-Workspaces** (5–30 Customer-Repos) × **Galaxie-Visualization** (räumliche Drift-Sicht) × **Zero-Code-Apply-via-PR**. Closest: grekt (CLI-only), Cursor Team (IDE-bound), GitHub ACP (governs runtime, nicht context-files), Cody Enterprise (Code-Suche, nicht Context-Audit). Detail: [siehe Competitor-Recherche](#appendix-recherche).

---

## 4. UI-Vision: Galaxie-Metapher konkret

### 4.1 Hierarchie (4 Zoom-Levels)

```
Zoom-Level 1: Galaxie               Zoom-Level 2: Customer-System
  ✷    ✷    ✷                          ☆ Customer-A (Sonne)
 ✷  ✷  ✷  ✷                           ○ ○ ○ (Repo-Monde)
  ✷    ✷                              · · · (File-Asteroiden)
  
Zoom-Level 3: Repo-Mond              Zoom-Level 4: File-Asteroid
  ○ Repo-Foo                          △ CLAUDE.md
   · CLAUDE.md (Asteroid)              ┌─────────────────┐
   · AGENTS.md                          │ Inspector-Panel │
   · .cursor/rules/foo.mdc              │ Severity: Kill  │
   · .claude/skills/                    │ Finding: ...     │
                                         │ AI-Solution: …  │
                                         │ [Apply as PR]   │
                                         └─────────────────┘
```

- **Level 1 (Galaxie-Overview):** zeigt alle Customer als Sterne/Sonnen, Größe = Anzahl Repos × Severity-Density, Farbe = Aggregate-Severity-Band. Click/Zoom → Level 2.
- **Level 2 (Customer-System):** Sonne im Zentrum (= Customer), umkreist von Repo-Monden. Severity sichtbar als Mond-Farbe + Glow.
- **Level 3 (Repo-Mond):** Mond in Closeup, File-Asteroiden in Orbit. Severity-Color pro Asteroid.
- **Level 4 (File-Detail):** Asteroid wird zentriert, **Inspector-Panel** öffnet von rechts mit Findings-Liste, Tabs (Findings / History / Solutions), Apply-Buttons.

### 4.2 Visuelle Severity-Encoding

Adapted aus Sentry/Snyk/Greptile-Patterns (Audit-Tool-UX-Research, siehe Appendix):

| Severity | Visual | Begründung |
|---|---|---|
| **Kill** | Pulsierende rote Supernova, immer sichtbar (ignoriert Zoom) | Sentry-Pattern "Escalating" |
| **Weak** | Großer roter Planet/Mond/Asteroid, deutlicher Glow | Snyk-High-Equivalent |
| **Mid** | Mittelgroßer orange-gelb, normaler Glow | Standard-Issue |
| **Strong** | Kleiner blauer Punkt, schwacher Glow, optional kollabiert | "Best Practice erfüllt" |
| **Exceptional** | Goldener Stern mit Strahlenkranz, eigene "Achievement"-Konstellation | USP, niemand anders macht das |

**Zwei orthogonale Achsen:**
- **Severity → Farbe** (Rot → Orange → Gelb → Blau → Gold)
- **Confidence (Low/Mid/High) → Opacity** (Geister-Planet bei Low)
- **Customer-Impact-Count → Größe** (mehr betroffene Repos → größerer Planet)
- **Age/Regressed-State → Pulsing** (neu = pulsiert 24h, regressed = rot-blink)

### 4.3 Critical UX-Affordances

Aus der Spatial-UI-Research:
- **Mini-Map** unten-rechts mit Workspace-Overview + Click-to-Center (Goodnotes-Pattern).
- **Cmd+K Universal-Search**: jump-to-Customer / jump-to-Finding / jump-to-File (Vercel-Pattern).
- **Dot-Grid-Backdrop** als räumliche Orientierung (Figma-Pattern).
- **Zoom-Indikator** oben-rechts + Keyboard-Shortcuts (Cmd+0 = home, Cmd+1/2/3/4 = Levels).
- **Workspace-Switcher** als Topbar-Dropdown mit Favorites + Search (Vercel-Pattern), nicht Sidebar.
- **Empty-State**: erstes Login = Onboarding-Card "Add your first Customer-Repo" mitten in der leeren Galaxie. KEIN separater `/onboarding`-Page (Linear-Pattern, +45% Activation).

### 4.4 Inspector-Panel (Level 4)

Sentry/Greptile-inspired:
- **3 Sektionen:** (a) Was wurde gefunden — Finding-Snippet + file:line, (b) Warum wichtig — Severity-Rationale + Confidence-Score, (c) AI-Solution — Diff-Preview.
- **Apply-Buttons:** [Apply as PR] (Default) + [Apply directly] (nur wenn Repo so konfiguriert).
- **Triage-Actions:** Dismiss-with-Reason (False-Positive / Acceptable-Risk / Won't-Fix → Semgrep-Pattern), Snooze (Sentry-Pattern), Assign-to-Team-Member.
- **Tabs:** Findings | History | Solutions | Comments

---

## 5. Stack-Entscheidungen

### 5.1 UI-Rendering-Stack (KRITISCH — Open Question Q1)

**Zwei Sub-Agents haben divergierende Empfehlungen abgegeben:**

| Option | Pro | Contra | Bundle | Solo-Buildability |
|---|---|---|---|---|
| **A: PixiJS v8 + GSAP + Motion (UI-Chrome)** | Single-Lib für 2D + WebGL-Wow. GSAP animiert Pixi-Objects direkt. PixiJS v8 macht 10k+ Sprites @60fps. Mobile-OK. | DIY für Force-Layout, Picking, Selection, Persistence. Mehr Engine-Code. | ~80–120 KB Pixi + 25 KB GSAP | 4–6 Wochen Sprint-1 |
| **B: tldraw SDK + Konva (custom) + Framer Motion** | Spart 3–6 Monate Engine-Code (R-Tree, Culling, Camera). SDK-first mit Custom-Shapes. | DOM-Heavy in tldraw, kann ab >2k Shapes ruckeln (Obsidian-Canvas-Risiko). Lizenz-Check tldraw nötig. | ~150+ KB tldraw + 55 KB Konva | 3–4 Wochen Sprint-1 |

**Empfehlung:** **Option A (PixiJS + GSAP).** Begründung:
- Wir haben **streng definierte Hierarchie** (4 Zoom-Levels, fester Layout-Algorithmus) — wir brauchen keinen freien Whiteboard-Editor.
- WebGL-Performance ist unsere Wette für Multi-Customer-Skalierung (Lena mit 30 Customers × 10 Repos × ~50 Files = 15k Asteroiden).
- GSAP animiert Pixi-Display-Objects direkt — kein React-Re-Render pro Frame.
- Solo-Dev-Risk: Engine-Code ist überschaubar weil Layout determiniert ist (kein Force-Sim notwendig — wir können Layout server-seitig berechnen und cachen).

**Risiko-Mitigation:** Falls in Sprint-1 Pixi-Komplexität explodiert → Fallback auf tldraw als "Plan B" akzeptabel (Custom-Shapes API ist gut dokumentiert).

### 5.2 Animation-Layer

- **Inside Canvas (Pixi):** GSAP 3 Core + ScrollTrigger only. Animiert `sprite.x/y/scale/alpha` direkt.
- **Outside Canvas (UI-Chrome):** Motion (ex-Framer Motion) mit LazyMotion + `m` (~4.6 KB) für Modals, Drawers, Sidepanels, Page-Transitions.
- **Verbot:** Motion-Variants auf Pixi-Objects. Frame-Re-Renders im React-Tree für 10k Sprites = Performance-Tod.

### 5.3 Multi-Tenant Architecture

Aus Next.js-16-Research:

- **URL-Slug `/[workspace]/...`** (kein Subdomain). Solo-buildable, kein DNS-Setup.
- **Data Access Layer (DAL)** Pattern: `lib/dal/*.ts` mit `server-only`, jede Query nimmt `workspaceId` aus `getTenantContext(workspaceSlug)` (cached via `React.cache`).
- **Better-Auth Organization Plugin (v1.6)**: Workspaces = Better-Auth-Organizations. `setActive(workspaceSlug)` Server-side im `app/[workspace]/layout.tsx`.
- **Cache-Tagging-Konvention:** `workspace:<id>:<resource>` (feingranular) + `workspace:<id>` (bulk). Max 128 Tags pro Call, Max 256 Chars.
- **Slug-Hijacking-Schutz:** Layout validiert Membership, sonst `forbidden()`.
- **proxy.ts** (Next 16 rename) nur für Auth-Gating + Session-Refresh. Tenant-Detection im DAL, nicht im Proxy.
- **pgvector:** Single-Table mit `workspace_id` + composite btree + RLS-Policy. Double-Belt (WHERE + RLS).

### 5.4 AI-Solution-Pipeline

- **Single-Pass Anthropic Claude Opus** (User-Wahl).
- Generation in `@vk/fixes` (existiert schon, "Solid"-Reife).
- **Eingabe:** Finding-Context (file-snippet, severity, rule, related-files-summary).
- **Ausgabe:** Strukturierter Patch (Diff-Format) + Rationale-Text + Confidence-Self-Estimate (Low/Mid/High).
- **No Multi-Pass / Self-Critique / Ensemble** für jetzt — wenn Quality nicht reicht, Re-Open-Trigger für Sprint-N+.

### 5.5 Apply-Workflow

- **Default: PR über GitHub-App** (existiert in `@vk/github-app` + `@vk/pr-workflow`).
- **Optional pro Repo: Direct-Commit-Mode** (Toggle in Repo-Settings).
- **Audit-Trail:** jeder Apply erzeugt einen `install_decision`-Eintrag (existiert).
- **Repo-Config:** neue Spalte `repo.apply_mode` (enum: 'pr' | 'direct'), Default 'pr'. → Migration `0008_apply_mode.sql`.

---

## 6. Frontend-Refactor: Route-by-Route

**Strategie: "Komplett-Refactor zur Galaxie"** (User-Wahl). Bestehende Routen werden klassifiziert:

| Route | Aktion | Begründung |
|---|---|---|
| `/` (Public Audit-Form) | **KEEP, redesign** | Public Demo bleibt sinnvoll als Lead-Magnet. Wird zu "Try without account"-Galaxie-Demo mit 1 fake-Customer + 3 fake-Repos. |
| `/login` | **KEEP, redesign** | Magic-Link bleibt. Visual-Refresh. |
| `/dashboard` | **DELETE → wird `/[workspace]`** | Galaxie ersetzt das Dashboard. |
| `/customers` | **MERGE → in Galaxie Level 1** | Wird Customer-Sonnen in der Galaxie. Liste ist Cmd+K-Search. |
| `/customers/[id]` | **MERGE → in Galaxie Level 2** | Customer-System-View. |
| `/customers/[id]/access` | **MERGE → in Repo-Inspector** | Write-Access-Grants als Settings-Tab pro Customer-Sonne. |
| `/scans` | **DELETE** | Scan-History wird im Customer-Inspector pro Repo gezeigt. |
| `/scans/[id]` | **MERGE → Inspector-Panel** | Findings sind in Galaxie sichtbar; Detail im Inspector. |
| `/drift` | **DELETE** | Drift-Form-Eingabe wird zu Right-Click-Action "Compare with..." in Galaxie. |
| `/drifts` | **MERGE → Galaxie-Layer "Drift-Strom"** | Drift-Runs sind Edges/Streams zwischen Planeten. |
| `/drifts/[id]` | **MERGE → Inspector mit Drift-Tab** | |
| `/requests` | **MOVE → /[workspace]/requests** | Behält klassische Route (Admin-Workflow, nicht Galaxie-tauglich). |
| `/skills` | **MOVE → /[workspace]/skills** | Skills-Registry behält klassische Listen-UI. Vielleicht Sprint-N+ als "Konstellation" visualisieren. |
| `/trust` (main) | **MOVE → /trust** (außerhalb Workspace) | Public Compliance-Page. |
| `/trust/dpa` | **KEEP** | DPA-Acceptance. |
| `/trust/eval` | **MOVE → /[workspace]/admin/eval** | LLM-Eval History gehört in Admin-Settings. |
| `/billing` | **MOVE → /[workspace]/settings/billing** | Settings-Subsection. |
| `/pricing` | **KEEP** (außerhalb Workspace) | Public Marketing. |
| `/onboarding/[slug]` | **DELETE** | Onboarding als Activation-Checklist innerhalb der Galaxie. Linear-Pattern. |
| `/status` | **KEEP** (außerhalb Workspace) | Public Status. |
| `/bip` | **MOVE → /[workspace]/bip** | Bleibt utility-tool, evtl. später ins Inspector als Export-Action. |

**Neue Routen (Galaxie):**
- `/[workspace]` — Galaxie-Hauptansicht (Level 1)
- `/[workspace]/c/[customer]` — Direct-Link zu Customer-System (Level 2)
- `/[workspace]/c/[customer]/r/[repo]` — Direct-Link zu Repo-Mond (Level 3)
- `/[workspace]/c/[customer]/r/[repo]/f/[file]` — Direct-Link zu File-Asteroid (Level 4) — wird in der Galaxie als Inspector-State persistiert
- `/[workspace]/settings` — Settings-Subtree
- `/[workspace]/admin` — Admin-Tools (eval, audit-trail, etc.)

### 6.1 Component-Migration

- **Behalten als Building-Blocks:** alle shadcn-Primitives, `SeverityBadge`, `FindingsList`, `DriftView`, `ReportView`, `RequestActions`, alle Forms.
- **Refactor zu Galaxie-Components:** `RepoGraph` + `RepoGraphClient` werden zu `GalaxieScene` + `GalaxieScene.Pixi` + `Inspector`.
- **Neu:** `WorkspaceShell`, `GalaxieScene`, `CustomerStar`, `RepoMoon`, `FileAsteroid`, `Inspector`, `MiniMap`, `ZoomIndicator`, `UniversalSearch (Cmd+K)`, `WorkspaceSwitcher`, `OnboardingChecklistOverlay`.

---

## 7. Backend-Implikationen

### 7.1 DB-Schema-Anpassungen

**Kritische Open-Question Q3:** Es gibt KEINE `customer`-Tabelle in `packages/db/src/schema.ts`. Die UI hat aber `/customers/[id]`. Wo lebt das Customer-Konzept?

Aus dem Schema (Zeilen 82, 238): `repo` und `scan` haben direkt `workspace_id` — kein dazwischenliegender Customer. Heißt: **aktuell ist die Hierarchie 3-Layer (Workspace → Repo → File), nicht 4-Layer**.

Drei Optionen für die User-Entscheidung:

| Option | Beschreibung | Migration | Galaxie-Implikation |
|---|---|---|---|
| **C1: Customer = Workspace** | Jeder Customer ist ein eigener Workspace (= eine Better-Auth-Org). Lena hat dann N Workspaces, einen pro Customer. | Keine Migration. Aber UI muss Workspace-Switcher hyper-prominent. Sub-Workspaces Lena → Customer wären schöner. | Galaxie = 1 Customer. Lena switcht Galaxien. Kein "Galaxie-Overview" über Customers. |
| **C2: Echte Customer-Tabelle einführen** | `customer (id, workspace_id, label, slug, ...)` + `repo.customer_id` FK | Migration 0008_add_customer.sql + Backfill via vorhandenem `repo.customer_label`-Feld. | Galaxie = 4 Layer wie geplant. Sauberste Variante. |
| **C3: Customer als virtuelles Konstrukt** | `customer` ist nur ein UI-Group-Key (`repo.customer_label` Spalte exists in `/customers/[id]/access`-Route). Galaxie gruppiert visuell. | Keine Migration. Aber Cross-Cutting-Logik (Findings pro Customer aggregieren) muss überall in der UI nachgebaut werden. | Galaxie macht Customer-Grouping client-seitig. |

**Empfehlung:** **C2 (Customer-Tabelle einführen).** Grund: cleanste Architektur, robusteste Multi-Tenant-Boundaries, ermöglicht Customer-spezifische Settings (apply_mode pro Customer vs pro Repo), saubere Aggregate-Queries. Migration ist überschaubar (1 Tabelle, 1 FK, 1 Backfill).

**TODO bei C2:** Customer-Tabelle mit Spalten: id, workspace_id, slug, label, created_at, default_apply_mode, github_org (für GitHub-App-Scope), notes.

### 7.2 Weitere Migrations

- `0008_add_customer.sql` (siehe oben, falls C2)
- `0009_repo_apply_mode.sql` — `repo.apply_mode enum('pr','direct') NOT NULL DEFAULT 'pr'`
- `0010_finding_severity_index.sql` — Composite Index `(scan_id, severity)` für Galaxie-Query "Findings pro Repo gruppiert nach Severity"
- `0011_galaxie_layout_cache.sql` — neue Tabelle `galaxie_layout` mit (workspace_id, customer_id, repo_id, file_id, coord_x, coord_y, computed_at, version) für deterministisches Server-Side-Layout

### 7.3 Cache-Tag-Konvention (verpflichtend)

Jede `'use cache'` Function in `lib/dal/*.ts`:

```ts
cacheTag(`workspace:${workspaceId}:customers`)
cacheTag(`workspace:${workspaceId}:c:${customerId}:repos`)
cacheTag(`workspace:${workspaceId}:c:${customerId}:r:${repoId}:files`)
cacheTag(`workspace:${workspaceId}:c:${customerId}:r:${repoId}:findings`)
cacheTag(`workspace:${workspaceId}`) // bulk-invalidate für Workspace-Delete
```

### 7.4 Galaxie-Layout-Berechnung

- **Berechnet server-seitig**, gecached pro Workspace, invalidiert bei Customer/Repo-Add/Delete.
- **Layout-Algorithmus:** deterministisches Force-Directed (hash-based seed, damit gleiche Inputs → gleiche Outputs). Server-tick auf `requestIdleCallback`-Äquivalent, max 200ms Budget.
- **Storage:** `galaxie_layout` Tabelle (siehe 7.2).
- **Streaming:** RSC streamt initial-Layout als JSON-Prop in Client-Island, dann Pixi mountet drüber.

### 7.5 Package-Reifegrad-Implikationen

Aus dem Code-Audit:
- **WIP, brauchen Polish vor Apply-Sprint:** `@vk/pr-workflow` (Access-Control, Diff-Preview, Merge-Strategies), `@vk/drift` (3 Files), `@vk/bip-generator`.
- **Schema-Sync-Problem:** `@vk/db` Schema + `@vk/core` Types teilweise duplex (Quota-Fields auskommentiert in schema.ts). Müssen konsolidiert werden.
- **Fehlend für Vision:** kein `@vk/frontend-sdk` als Typed-Boundary zwischen App-Router und Business-Logic-Packages. Nice-to-have, später.

---

## 8. Doc-Konsolidierung — 3-Layer-Struktur

### 8.1 Aktion-Plan (aus Doc-Konsolidierungs-Agent)

**Severity Exceptional Kill:**
- `TODO.md §Header` referenziert nicht-existente `STATUS.md` + `docs/roadmap/phase-0.md` → **Fix:** Header umschreiben, "Source-of-Truth ist `docs/vision.md` + `docs/roadmap/phase-galaxie.md` + `docs/plans/`".
- `CONTRIBUTING.md` referenziert nicht-existente `docs/roadmap/`, `docs/decisions/`, PRD → **Fix:** alle Referenzen entfernen oder auf real-existing Files umlenken.

**Severity Strong:**
- `SECURITY.md` referenziert PRD §9 → **Fix:** inline machen ("solo-maintained pre-revenue"), kein Link.

**Severity Mid:**
- `TODO.md` enthält 109 Zeilen Sprint-History inline → **Fix:** History in einen Anhang `TODO.md §History` oder ganz in `docs/roadmap/phase-galaxie.md`.

### 8.2 Neue 3-Layer-Struktur

```
docs/
  vision.md                    ← Warum bauen wir das (Persona, Capabilities, 50J-Sicht in Operations-Scope)
  roadmap/
    phase-galaxie.md           ← Was wann (Sprint-Reihenfolge dieses Refactors)
    phase-future.md (later)    ← Was nach Galaxie kommt
  plans/
    master-vision-galaxie.md   ← Dieses File (Master)
    galaxie-sprint-1-ui-skeleton.md
    galaxie-sprint-2-data-binding.md
    ...
    done/                       ← Archiv
  adrs/ (optional, später)
    0001-customer-schema-decision.md  ← Wenn C2 gewählt
    0002-pixi-vs-tldraw.md            ← Stack-Entscheidung
```

### 8.3 Was NICHT mehr in Doku gehört

- Pricing-Tiers / Sales-Sprints / LOIs / Customer-Outreach
- Validate-Wedge-Discussion / ContextForge-Strategy
- 50-Jahr-Vision für Indie-Founders
- Mom-Test-Outreach / BiP-Posts-Strategy

Alles in separates Framework. Wenn doch Referenz nötig: `docs/vision.md` darf 1 Satz haben "Strategie + GTM lebt in separatem Framework, nicht hier."

---

## 9. Sprint-Roadmap (Phase-Galaxie)

Granularität: 6 Sprints à 2–4 Wochen.

### Sprint G1 — UI-Skeleton (Wochen 1–4) — "Galaxie-Wow"

**Ziel:** Galaxie-View rendert echt-Daten visualisierend. Pan/Zoom/Hover funktioniert.

- [ ] PixiJS v8 + `@pixi/react` Setup in Next-Island
- [ ] `WorkspaceShell` + `GalaxieScene` Component-Skelette
- [ ] DAL `getGalaxieLayout(workspaceId)` mit Stub-Daten
- [ ] Customer-Star + Repo-Moon + File-Asteroid Pixi-Display-Objects
- [ ] Pan/Zoom über `@use-gesture/react`
- [ ] Severity-Color-Coding (statisch aus Mock-Daten)
- [ ] Mini-Map + Zoom-Indicator
- [ ] **Test:** Pan/Zoom auf 3 fake-Customers × 5 fake-Repos × 10 fake-Files = 150 Asteroiden, 60fps Desktop, ≥30fps mobile
- **Plan-File:** `docs/plans/galaxie-sprint-1-ui-skeleton.md` (wird vor Sprint-Start geschrieben)

### Sprint G2 — Data-Binding + DB-Migration (Wochen 5–6) — "Echt-Daten"

- [ ] Customer-Tabelle einführen (Migration 0008, falls C2 gewählt)
- [ ] Backfill via existing `repo.customer_label`
- [ ] DAL-Layer komplett (`lib/dal/galaxie.ts`)
- [ ] Cache-Tagging-Konvention durchgesetzt
- [ ] `apps/web/src/app/[workspace]/layout.tsx` mit Better-Auth-Organization-Active-Set
- [ ] Galaxie zeigt echte Customers/Repos/Files aus DB
- [ ] Severity aggregiert aus echten Findings
- **Plan-File:** `docs/plans/galaxie-sprint-2-data-binding.md`

### Sprint G3 — Inspector + Drill-In (Wochen 7–9) — "Click & Drill"

- [ ] Click auf Customer → Zoom in Level 2 mit GSAP-Camera-Tween
- [ ] Click auf Repo-Mond → Zoom in Level 3
- [ ] Click auf File-Asteroid → Inspector-Panel öffnet
- [ ] Inspector mit 3 Sektionen + Tabs (Findings | History | Solutions | Comments)
- [ ] Direct-Links `/[workspace]/c/[customer]/r/[repo]/f/[file]`
- [ ] Cmd+K Universal-Search
- [ ] WorkspaceSwitcher
- **Plan-File:** `docs/plans/galaxie-sprint-3-inspector.md`

### Sprint G4 — AI-Solutions (Wochen 10–12) — "AI-Vorschläge"

- [ ] `@vk/fixes` Single-Pass Claude Opus Integration (existiert teilweise)
- [ ] Inspector "Solutions"-Tab: Diff-Preview
- [ ] Confidence-Visualization (Opacity auf Asteroid)
- [ ] Solution-Cache: pro Finding 1 Solution, gecached bis Finding-Mutation
- **Plan-File:** `docs/plans/galaxie-sprint-4-ai-solutions.md`

### Sprint G5 — Apply-Workflow (Wochen 13–16) — "Zero-Code-Apply"

- [ ] Repo-Setting `apply_mode` UI + Migration 0009
- [ ] Apply-as-PR Button + GitHub-App-Roundtrip
- [ ] Apply-direct Button + Confirmation
- [ ] Audit-Trail jedes Apply
- [ ] Dismiss-with-Reason + Snooze + Assign
- [ ] PR-Status-Polling im Inspector
- **Plan-File:** `docs/plans/galaxie-sprint-5-apply.md`

### Sprint G6 — Settings + Onboarding + Polish (Wochen 17–20) — "Shippable Beta"

- [ ] Settings-Subtree `/[workspace]/settings`
- [ ] Billing-Migration zu `/[workspace]/settings/billing`
- [ ] Onboarding als Inline-Checklist in Galaxie (kein /onboarding-Page)
- [ ] Empty-State für leere Galaxien
- [ ] Mobile-Tuning + Touch-Gestures
- [ ] Performance-Tuning (Quadtree-Culling bei ≥5k Asteroiden)
- [ ] Doc-Konsolidierung-Final (siehe §8)
- [ ] **Beta-Launch:** öffentliche Galaxie-Demo
- **Plan-File:** `docs/plans/galaxie-sprint-6-polish.md`

---

## 10. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|---|---|---|
| Pixi-Komplexität explodiert in Sprint G1 | Strong | Fallback auf tldraw als Plan B (Sprint G1 enthält Decision-Gate W3). |
| Customer-Schema-Migration verzögert Sprint G2 | Mid | Schema in W1 schon entscheiden + Migration in W2 schreiben, parallel zu UI. |
| AI-Solution-Quality reicht nicht (Single-Pass) | Mid | Re-Open-Trigger: wenn ≥30% Solutions als "False" dismissed → Sprint-N Multi-Pass-Upgrade. |
| Galaxie zu langsam auf mobile (10k+ Asteroiden) | Strong | Quadtree-Culling + Reduced-Motion-Toggle als Sprint G6 Pflicht. |
| Cache-Component-Bug mit selektivem WebGL | Mid | R3F vermeiden (siehe Stack-Entscheidung). Pixi ist isoliert in 'use client' Island. |
| Better-Auth Organization-Plugin Edge-Cases | Mid | Sprint G2 enthält Slug-Hijacking-Test + Active-Org-Drift-Test. |
| Drift zwischen Doc-Layern (vision vs roadmap vs plans) | Weak | Sprint G6 enthält Final-Doc-Pass. CLAUDE.md erinnert Workflow. |

---

## 11. Decisions (alle 10 Q's gelöst)

### ✅ Q1: UI-Stack = **PixiJS v8 + GSAP + Motion (UI-Chrome)** (User 2026-05-19)
ADR-0002 wird in Pre-Work geschrieben.

### ✅ Q2: Animation-Lib UI-Chrome = **Motion LazyMotion + `m`** (~4.6 KB) (Default-Empfehlung)
Innerhalb Canvas: GSAP. Außerhalb: Motion LazyMotion. Strict-Verbot: Motion auf Pixi-Objects.

### ✅ Q3: Customer-Schema = **C2 — echte Customer-Tabelle** (User 2026-05-19)
Migration 0008 mit Backfill via `repo.customer_label`. ADR-0001 wird in Pre-Work geschrieben.

### ✅ Q4: Multi-Tenant = **URL-Slug `/[workspace]/...`** (Default-Empfehlung)
Solo-buildable, UX-Standard (Linear/Vercel/Clerk). Subdomain als optionales Later-Feature für White-Label.

### ✅ Q5: Default Apply-Mode = **'pr'** (Default-Empfehlung)
`repo.apply_mode` enum mit Default 'pr'. Pro-Repo umstellbar auf 'direct' via Settings.

### ✅ Q6: Sprint-Reihenfolge = **G1 → G2 → G3 → G4 → G5 → G6** (Default)
UI zuerst (Wow-Demo), dann Daten, dann Interaction, dann AI, dann Apply, dann Polish.

### ✅ Q7: Doc-Konsolidierung = **JETZT, als Pre-Work** (User 2026-05-19)
Pre-Work-Sprint `galaxie-pre-work` (1-2 Tage) macht Doc-Cleanup + ADRs + Vision-File + Sprint-G1-Plan-Detail.

### ✅ Q8: GitHub-App-Setup = **Parallel zu Sprint G1 als Background-Task** (Default-Empfehlung)
Sprint 0.11 (User-Side-Execution: GitHub-App registrieren, E2E-Smoke) läuft parallel zu G1. Muss vor Sprint G5 fertig sein.

### ✅ Q9: Public Demo = **JA — Public Galaxie-Demo auf `/`** (User 2026-05-19)
`/` zeigt fake-Galaxie (3 Customers, 9 Repos, 30 Files). Lead-Magnet. Ergänzt um Anonymous-Audit-Form als Sekundär-CTA.

### ✅ Q10: Billing-Refactor = **Sprint G6 Polish** (Default-Empfehlung)
`/billing` → `/[workspace]/settings/billing` Migration am Ende, weil Risiko-Sensitiv (Stripe-Webhooks, Sub-States).

---

## 12. Pre-Sprint-G1 Hausaufgaben (Pre-Work-Sprint)

Bevor Sprint G1 startet, sind diese Konsolidierungs-Schritte zu erledigen (eigener Pre-Plan):

### Pre-Work A: Doc-Konsolidierung (1 Tag)
- Update `TODO.md` Header (Source-of-Truth korrigieren)
- Update `CONTRIBUTING.md` (PRD/docs/roadmap/docs/decisions Referenzen weg)
- Update `SECURITY.md` (PRD-Refs weg)
- Erstelle `docs/vision.md` (knapp, basiert auf §3 dieses Plans)
- Erstelle `docs/roadmap/phase-galaxie.md` (basiert auf §9 dieses Plans)

### Pre-Work B: User-Entscheidungen (1 Tag)
- User beantwortet Q1–Q10 (oben)
- Schreibe ADRs für Q1 + Q3 + Q4 nach `docs/adrs/`
- Update CLAUDE.md mit Galaxie-Vision-Ref + 3-Layer-Doc-Pointer

### Pre-Work C: Sprint-G1-Plan-File schreiben (1 Tag)
- `docs/plans/galaxie-sprint-1-ui-skeleton.md` mit konkreten Files + Steps + Test-Plan
- Slack/Trello/Whatever-Tracking für 4-Wochen-Sprint

---

## 13. Rollback-Strategie

Falls Galaxie-Refactor stoppt (Q-Decision-Reverse, Burn-Out, andere Priorität):
- Bestehende Routen (`/dashboard`, `/customers`, `/scans`, etc.) bleiben funktional, weil Refactor sie nicht löscht bis Sprint G2+ (= ab dem Punkt, wo Galaxie echte Daten zeigt).
- DB-Migrationen sind additiv (Customer-Tabelle, repo.apply_mode) — keine destruktiven Schema-Changes.
- Pixi-Code lebt in einem isolierten `'use client'` Island — kann gelöscht werden ohne Backend-Impact.
- Rollback-Plan pro Sprint im jeweiligen Sub-Plan-File.

---

## 14. Appendix — Recherche

Komplette Sub-Agent-Outputs sind in der ursprünglichen Conversation. Hier nur die Kern-Quellen für spätere Referenz:

**Spatial-UI Best-Practices:**
- tldraw Performance — https://tldraw.dev/sdk-features/performance
- Excalidraw Dual-Canvas — https://deepwiki.com/excalidraw/excalidraw/5.1-canvas-rendering-pipeline
- React Flow Contextual Zoom — https://reactflow.dev/examples/interaction/contextual-zoom
- Figma WebGPU Rendering — https://www.figma.com/blog/figma-rendering-powered-by-webgpu/

**Audit-Tool-UX:**
- Sentry Issue Triage — https://docs.sentry.io/product/issues/states-triage/
- Greptile Code-Review — https://www.greptile.com/docs/code-review/first-pr-review
- Semgrep Triage-Reason Workflows — https://semgrep.dev/products/product-updates/new-triage-reason-workflows-filter-by-triage-reason-in-platform/
- Snyk Severity Levels — https://docs.snyk.io/manage-risk/prioritize-issues-for-fixing/severity-levels

**Multi-Tenant-Dashboards:**
- Linear FTUX — https://supademo.com/user-flow-examples/linear
- Vercel Universal Search — https://vercel.com/changelog/dashboard-universal-search
- WorkOS Multi-Tenant Permissions — https://workos.com/blog/multi-tenant-permissions-slack-notion-linear

**Next.js 16 Multi-Tenant:**
- Next.js Multi-Tenant Guide — https://nextjs.org/docs/app/guides/multi-tenant
- Next.js cacheTag API — https://nextjs.org/docs/app/api-reference/functions/cacheTag
- Better-Auth Organization Plugin — https://www.better-auth.com/docs/plugins/organization
- Vercel Platforms Starter Kit — https://github.com/vercel/platforms

**Canvas/WebGL Stack:**
- PixiJS v8 Launch — https://pixijs.com/blog/pixi-v8-launches
- R3F + Next 16 Cache Bug — https://github.com/pmndrs/react-three-fiber/issues/3595
- GSAP vs Motion — https://motion.dev/docs/gsap-vs-motion

**Competitor:**
- GitHub Agent Control Plane GA — https://github.blog/changelog/2026-02-26-enterprise-ai-controls-agent-control-plane-now-generally-available/
- Microsoft Agent 365 GA — https://techcommunity.microsoft.com/discussions/agent-365-discussions/agent-365-will-be-generally-available-on-may-1-2026/4500380
- grekt OSS — https://grekt.com/

---

## 15. Status + Nächste Schritte

**Status:** 🟡 In Review by User.

**User-Aktion erforderlich:**
1. Q1–Q10 beantworten (§11) → Plan wird auf 🟢 gesetzt.
2. Pre-Work-Sprint freigeben (Doc-Konsolidierung + ADRs + Sprint-G1-Plan).
3. Sprint G1 starten via `/execute galaxie-sprint-1-ui-skeleton`.

**Claude-Aktion (nach Q1–Q10):**
- ADRs schreiben (1 pro kritische Entscheidung Q1, Q3, Q4).
- Sprint-G1-Plan-File detaillieren.
- `docs/vision.md` + `docs/roadmap/phase-galaxie.md` anlegen.
- CLAUDE.md + MEMORY.md mit Galaxie-Vision update.
- Doc-Konsolidierung-Mini-PRs vorbereiten.
