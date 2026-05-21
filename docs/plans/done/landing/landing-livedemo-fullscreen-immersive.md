# Plan — Landing Live-Demo Fullscreen + Real-Audit-Galaxie

> Erstellt: 2026-05-21
> Status: ✅ Done — 2026-05-21 (manuelle Visual-Verifikation durch User ausstehend)

## 1. Ziel

Die Landing-Live-Demo füllt direkt unter der SiteNav den gesamten Viewport
(100svh − 56px), die RepoUrlForm sitzt als immer-sichtbare Pill in der
Galaxie-Toolbar, und nach Submit zeigt die Galaxie nicht mehr Demo-Daten
sondern die ECHTE Repo-Galaxie aus den Audit-Ergebnissen — gleicher Look,
gleiche Interaktion, nur Live-Daten.

## 2. Endzustand

Drei sichtbare Stages:

```
IDLE  (Demo-Repo)
  ┌──────────────────────────────────────────────────────┐
  │ SiteNav (h-14 = 56px)                                │
  ├──────────────────────────────────────────┬───────────┤
  │ ┌─ acme-bank > fraud-…  github.com/…  →  ?  ⚙ │     │
  │                                          │ ┌───────┐ │
  │           DEMO-Galaxie (SVG)             │ │Insp.  │ │
  │                                          │ │(Card) │ │
  │                                          │ │       │ │
  │              (h-[calc(100svh-56px)])     │ │       │ │
  │                                          │ └───────┘ │
  └──────────────────────────────────────────┴───────────┘
       ↓ user pastes URL + submit
LOADING (~3-30s)
  ┌──────────────────────────────────────────────────────┐
  │ Demo-Galaxie pulsiert (opacity-40, animate-pulse)    │
  │ + Stage-Label oben „Cloning Repo… · Parsing… · …"   │
  │ Inspector behält den Demo-Finding sichtbar           │
  └──────────────────────────────────────────────────────┘
       ↓ scan + report ready
RESULT (Real-Repo)
  ┌──────────────────────────────────────────────────────┐
  │ ┌─ ← zurück  · vercel/next.js    │ github.com/...  → ?⚙
  │                                          │ ┌───────┐ │
  │  REAL-Repo-Galaxie (aus scan+report)     │ │Insp.  │ │
  │  (selbe RepoGalaxie-Komponente, andere Daten)│       │ │
  │                                          │ └───────┘ │
  └──────────────────────────────────────────┴───────────┘
       ↓ click „← zurück zur Demo"
zurück zu IDLE
```

Plus: HowItWorks-Section bleibt darunter, FinalCTA-Section entfernt,
Footer bleibt.

Test grün: `pnpm --filter @vk/web build` + `pnpm typecheck` + manueller
Click-Test (Demo → Audit-Submit → Real-Galaxie → Reset).

## 3. Schritte

### Phase A — Build-Helper + Hero-State-Lift

- [x] **A1** `apps/web/src/lib/repo-galaxie/build-from-audit.ts` neu:
      `buildGalaxieFromAudit(scan: ParserResult, report: AuditReport):
      RepoGalaxieData`. Mapping-Regeln:
      - Root-Node: `{ id: 'root', kind: 'repo', depth: 0, label:
        scan.rootPath, parentId: null, githubUrl: scan.rootPath }`
      - Folder-Nodes: Unique parents von `scan.files[].relativePath`,
        rekursiv erzeugt (`depth = 1..n`, parentId = parent-folder-id),
        `kind: 'folder'`
      - File-Nodes: pro `ParsedAgentFile` → `{ kind: 'file', label:
        basename, lines: lineCount, bytes: byteSize, language:
        inferFromKind(kind), lastModified: lastModified?.toISOString(),
        previewLines: bodyToFirst20Lines(body), filePath: relativePath
        }`
      - Findings-Attachment: Loop `report.findings[]` → für jede Citation
        finde matching file-node via `relativePath` → set `severity`,
        `findingTitle`, `findingDescription`, `findingWhyImportant`,
        `findingDiffBefore/After`, `findingRule`, `findingCount`
      - Severity-Bubbling: für jeden Folder-Node = worst-Severity der
        Descendants
      - Edges: `{ from: parent, to: child, kind: 'contains' }` für alle
        parent→child Paare

- [x] **A2** Tests für build-from-audit (Vitest):
      `apps/web/src/lib/repo-galaxie/build-from-audit.test.ts`
      - Empty scan → root-only Galaxie
      - 3 files in 2 folders → korrekte Hierarchie + Severity-Bubbling
      - Finding-Citation auf einem file → Severity + Title gesetzt
      - Finding-Citation auf einer Datei die nicht in scan.files → silent skip

- [x] **A3** `apps/web/src/components/landing/HeroSection.tsx`:
      State-Lift — `useActionState(auditAction, INITIAL)` rauf in
      HeroSection. Neue lokale States: `submittedUrl: string | null`,
      `stage: 'idle' | 'loading' | 'result' | 'error'`. Resultierender
      `galaxieData: RepoGalaxieData` = `DEMO_GALAXIE` in idle, undefined
      in loading (Demo behalten + pulse), `buildGalaxieFromAudit(scan,
      report)` in result.

### Phase B — Layout-Refactor

- [x] **B1** `apps/web/src/app/page.tsx`: `FinalCTA`-Import + JSX raus.
      Page-Flow: `SiteNav + HeroSection + HowItWorks + Footer`.

- [x] **B2** `apps/web/src/components/landing/FinalCTA.tsx`: DELETE.

- [x] **B3** `apps/web/src/components/landing/HeroSection.tsx` (rewrite):
      - Headline + Eyebrow (Zeilen 98–106) ENTFERNEN
      - Outer container: `h-[calc(100svh-3.5rem)]` (= 100svh − 56px für
        h-14 SiteNav). Auf Mobile: `min-h-screen` über RepoTreeView-Pfad
      - Inner Grid: `lg:grid-cols-[7fr_3fr] lg:gap-6 px-6 sm:px-8 pt-6
        pb-8` (oder ähnlich — Konsistenz mit App-Inspector-Padding)
      - Galaxie-Container: `relative overflow-hidden h-full
        rounded-xl border border-border` (NEU: leichte Card-Bgrenzung
        für die Pane statt fullbleed — sonst kollidiert sie visuell mit
        der Inspector-Card)
      - Inspector-Container: `h-full` (Card-Look bleibt via RepoInspector
        intern). Spalten beide synchron auf `100svh-56px - padding`
      - Form-Bar unter Demo (mt-10 border-t…) ENTFERNEN

- [x] **B4** Neue Top-Toolbar in der Galaxie-Pane (innerhalb der
      Galaxie-Card, absolute positioniert):
      `BreadcrumbBar (left)` · `RepoUrlPill (center, flex-1 max-w-md)` ·
      `Help-Tooltip + GalaxieSettingsPopover (right)`. Z-Index +20.
      Bei Result-State: BreadcrumbBar ersetzen durch
      `← zurück zur Demo` Button (gleicher Slot).

### Phase C — RepoUrlPill + RepoUrlForm-Split

- [x] **C1** `apps/web/src/components/landing/RepoUrlPill.tsx` neu:
      Kompakte Variante der Form, ein Input + Submit-Pfeil-Button, h-9,
      keine Quick-Picks, keine Example-Hints. Props: `{ pending: boolean,
      onSubmit: (url: string) => void, error?: string }`. Inline-Error
      darunter als `type-mono-sm text-destructive`. Styling: `bg-card/80
      backdrop-blur border border-border rounded-md`.

- [x] **C2** `apps/web/src/components/landing/RepoUrlForm.tsx`: DELETED — nur HeroSection + FinalCTA waren Importeure.
      als Standalone für nicht-mehr-existente FinalCTA — aber da FinalCTA
      gelöscht wird, kann RepoUrlForm.tsx selbst DELETED werden? Check:
      grep alle imports → wenn nur HeroSection + FinalCTA → DELETE.
      Sonst behalten + zu UMI verschieben.

- [x] **C3** `apps/web/src/components/landing/AuditLoadingStage.tsx`:
      DELETE — Loading wird inline via Pulse-Effekt auf der Galaxie +
      Stage-Label-Toast oben gerendert (keine separate Page-Stage mehr).

- [x] **C4** `apps/web/src/components/landing/AuditResultStage.tsx`:
      DELETE — Result wird inline via RepoGalaxie + RepoInspector mit
      `buildGalaxieFromAudit(...)`-Daten gerendert. BlurOverlayCTA wird
      bei `state.background === true` weiter oben in HeroSection-State-
      Machine als Vollflächen-Replacement gezeigt.

### Phase D — Inspector kompakter

- [x] **D1** `apps/web/src/components/landing/RepoInspector.tsx`:
      Density-Pass:
      - Header padding `px-5 py-4` → `px-4 py-3`
      - Stats: aktuelles `grid-cols-4` behalten, aber Cell-Höhe schrumpfen
        (label uppercase-10px, value 14px), padding intern `p-2.5` statt
        `p-3`
      - "WARUM WICHTIG" + "CONTENT PREVIEW" Sections → als
        `<details><summary>` collapsible mit chevron-Icon (lucide
        ChevronRightIcon → ChevronDownIcon open). Standardmäßig **geschlossen**
      - Body-Scroll bleibt, Body-Padding `px-5 py-4` → `px-4 py-3`
      - Footer-Button bleibt
      - Header-Backbutton (im Result-State) wird im **Galaxie-Pane**
        gezeigt, NICHT im Inspector — Inspector bleibt unverändert
        zwischen Demo + Result

### Phase E — Pulse-Effekt + Stage-Label

- [x] **E1** In HeroSection: wenn `stage === 'loading'`, Galaxie-Container
      bekommt `[&>svg]:opacity-40 [&>svg]:animate-pulse` (oder pulse via
      framer-motion `<motion.div animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity }}>`).
      Stage-Label (z.B. "Cloning Repo… · Parsing Context-Files…") als
      kleine zentrierte Card über der pulsenden Galaxie. Reuse
      Stage-Liste aus aktuellem AuditLoadingStage (STAGES const).

- [x] **E2** Lange Loads (>30s): kleine Hint-Card unter Stage-Label:
      „Großes Repo — kann ein paar Minuten dauern. Sign-in für
      Background-Audit." (aus altem AuditLoadingStage übernehmen).

### Phase F — Reset + Background-Path

- [x] **F1** In HeroSection: `← zurück zur Demo` Button setzt
      lokalen State zurück (`stage='idle'`, `submittedUrl=null`, evtl.
      `useActionState` reset via key-bump-Trick). RepoGalaxie bekommt
      wieder `DEMO_GALAXIE` als data.

- [x] **F2** `state.background === true` Behandlung: HeroSection rendert
      stattdessen BlurOverlayCTA wie bisher (over the full grid, beide
      Spalten ersetzt). Reset bleibt erreichbar via Logo / SiteNav.

### Phase G — Mobile-Adaption

- [x] **G1** Mobile (isMobile=true) bleibt RepoTreeView + Mobile-Sheet.
      Pill wird als Sticky-Bottom-Bar gezeigt (h-12, full-width, border-t,
      bg-card/95 backdrop-blur). Loading + Result auf Mobile: kein
      Pulse-Effekt, sondern reine Findings-Liste in der TreeView-Pane.

### Phase H — Tests + Build

- [x] **H1** `pnpm --filter @vk/web exec tsc --noEmit` → exit 0 ✓
- [x] **H2** `pnpm --filter @vk/web build` → ✓ Compiled successfully in 4.6s
- [x] **H3** `pnpm vitest run src/lib/repo-galaxie/` → 14/14 grün (7 layout + 7 build-from-audit)
- [ ] **H4** Manuell: Click-Test — Dev-Server live auf http://localhost:3000, User-Verifikation ausstehend
- [ ] **H5** Lighthouse-Quick-Check (User-Verifikation ausstehend)

## 4. Files-to-Change

| Datei                                                            | Was passiert                                              |
|------------------------------------------------------------------|-----------------------------------------------------------|
| `apps/web/src/lib/repo-galaxie/build-from-audit.ts`              | **NEU** — `buildGalaxieFromAudit(scan, report)`           |
| `apps/web/src/lib/repo-galaxie/build-from-audit.test.ts`         | **NEU** — Vitest                                          |
| `apps/web/src/components/landing/HeroSection.tsx`                | Major rewrite (Headline raus, Fullscreen, State-Machine)  |
| `apps/web/src/app/page.tsx`                                      | `FinalCTA`-Import + JSX raus                              |
| `apps/web/src/components/landing/FinalCTA.tsx`                   | **DELETE**                                                |
| `apps/web/src/components/landing/RepoUrlPill.tsx`                | **NEU** — kompakte Pill-Form für Galaxie-Toolbar          |
| `apps/web/src/components/landing/RepoUrlForm.tsx`                | **DELETE** (falls keine anderen Importeure)               |
| `apps/web/src/components/landing/AuditLoadingStage.tsx`          | **DELETE** — Logic inline in HeroSection                  |
| `apps/web/src/components/landing/AuditResultStage.tsx`           | **DELETE** — Logic inline in HeroSection                  |
| `apps/web/src/components/landing/RepoInspector.tsx`              | Density-Pass (compact paddings + collapsible Sections)    |

## 5. Test-Plan

### Automatisch
```bash
pnpm --filter @vk/web typecheck
pnpm --filter @vk/web build
pnpm vitest run apps/web/src/lib/repo-galaxie/build-from-audit.test.ts
```

### Manuell (Dev-Server)
1. `pnpm --filter @vk/web dev` (im Background)
2. Browser → `http://localhost:3000`
3. **Idle**: SiteNav (56px) → direkt Fullscreen-Demo, keine Headline, Pill
   in Galaxie-Toolbar, Inspector als Card rechts mit Demo-Finding
4. **Submit**: `github.com/anthropics/anthropic-sdk-python` eingeben +
   Audit → Galaxie pulst + Stage-Label oben, Inspector bleibt
5. **Result**: Echte Galaxie erscheint (Folder + Files aus Agent-Files-
   Tree), Findings als Severity-gefärbte Knoten, Inspector zeigt erstes
   Finding-Detail bei Klick
6. **Reset**: `← zurück zur Demo` → Demo wiederhergestellt, Pill leer
7. **Error**: ungültige URL → Pill zeigt Inline-Error, Galaxie bleibt Demo
8. **Background**: simulate large repo (oder skipped wenn Inngest nicht
   aktiviert) → BlurOverlayCTA replaces both columns
9. **Mobile (≤768px)**: Browser auf 375px resize → TreeView statt
   Galaxie, Sticky-Bottom-Pill, Mobile-Sheet auf Tap

## 6. Risiken + Rollback

| Risiko | Mitigation | Rollback |
|--------|------------|----------|
| `buildGalaxieFromAudit` produziert Layout-Performance-Probleme bei großen Repos (z.B. `vercel/next.js` mit 30+ Agent-Files) | Limit auf max 50 file-nodes, sonst nur Top-Level-Folders zeigen; benchmark in H3 | `git revert` Phase A — Result-State zeigt dann nur FindingsList |
| RepoGalaxie-Komponente erwartet bestimmte Demo-Datenstruktur die wir nicht ableiten können | Tests in A2 deckt das ab; Worst-Case: Fallback auf Demo-Galaxie + textuelle FindingsList drüber | siehe oben |
| State-Lift von `useActionState` in HeroSection bricht Submit-Reset-Logik | Mit `key`-Prop auf Form-Element zwingen Reset; explizit testen H4 | Rollback Phase A3 → Form bleibt in RepoUrlPill |
| Fullscreen-Demo verdrängt Hero-Headline → SEO-H1 fehlt | Visuell-versteckte `<h1 className="sr-only">ValidationKit — AGENTS.md Audits für Multi-Customer Repos</h1>` hinzufügen | trivial |
| `<details>` summary-Toggle ohne Animation wirkt ruckartig | Mit Tailwind `[&[open]>summary>svg]:rotate-90 transition-transform` smooth machen | low |
| Pulse-Animation auf SVG verursacht layout-shift | `will-change: opacity` setzen + `transform: translateZ(0)` für GPU-layer | low |

Rollback gesamt: `git revert` der Execute-Commits + alte Files aus
`done/landing-livedemo-minimal-pass.md`-Zustand wiederherstellen.

## 7. Open Questions

(Werden während `/execute` aufgelöst, falls dann offen → AskUserQuestion.)

- **7.1** Welche `language: string` Mapping-Regel? `AgentFileKind` →
  `'markdown'` für alle MD-Kinds, `'json'` für `aider-conf` (ggf.
  TOML/YAML), `'mdc'` für `cursor-rule-mdc`. Erstmal alle → `'md'`.
- **7.2** Severity-Bubbling-Algorithm bei Folder-Nodes: max-severity der
  Descendants? Oder count-weighted? Vorschlag: max-severity (matches
  aktuelles DEMO_GALAXIE-Verhalten).
- **7.3** Pill-Auto-Focus bei Idle? Wenn ja: erste Page-Load fokussiert
  den Pill, was Screen-Reader stört. Vorschlag: NICHT auto-focus, User
  muss aktiv klicken/tabben.
- **7.4** Was tun bei `scan.warnings.length > 0` aber `report.findings ==
  []`? Galaxie ohne Severity-Accents → wirkt leer. Vorschlag: kleine
  Toast-Card "Audit fertig — keine Findings. Repo sieht sauber aus."
- **7.5** SkipLink-Target ändert sich (idle → `#galaxie-findings-list`,
  result → real findings). Lösung: ID stabil halten, der Inhalt darunter
  ist die jeweils aktuelle Findings-Liste (sr-only).
