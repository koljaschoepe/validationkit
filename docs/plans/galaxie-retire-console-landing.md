# Plan — Galaxie-Retirement + durchgehendes Konsolen-Surface auf der Landing

> Erstellt: 2026-06-10
> Status: 🟡 In Review
> Slug: `galaxie-retire-console-landing`
> Confidence: **High** — basiert auf 8 User-Entscheidungen (2 Discovery-Runden) + Code-Audit von ~15 Files über 5 Subagenten
> Voraussetzung: keine (PR #1 „Mission-Control Console" ist bereits auf `main` gemergt → Konsole ist Workspace-Default)

---

## 1. Ziel

Die PixiJS-Galaxie wird **vollständig aus Code, Deps und Produkt entfernt**; die Landing-Page wird auf **ein durchgehendes, interaktives Konsolen-Surface** umgebaut: Portfolio-Triage-Liste (viele Kunden-Repos, Severity-Heat-Bars) → Klick auf ein Repo zoomt in den Datei-Tree + Inspector (genau die Darstellung aus dem User-Screenshot) → Klick auf ein File zeigt Finding + „Fix via PR". Live-Paste-Audit bleibt erhalten.

---

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID | Runde | Frage | Antwort |
|----|-------|-------|---------|
| Q1 | 1.1 | Multi-Customer-Story nach Galaxie-Removal | **Konsole-Liste oben + Repo-Tree als Drill-Down** (nicht „nur Single-Repo") |
| Q2 | 1.2 | Galaxie-Removal-Scope | **Überall raus** — auch Workspace-Map-Tab + Pixi-Code + Heavy-Deps löschen |
| Q3 | 1.3 | Platzierung der Tree+Inspector-Konsole | **Ein durchgehendes Surface** — Portfolio-Liste live, Klick zoomt in den Repo-Tree |
| Q4 | 1.4 | Interaktivität | **Voll interaktiv** behalten (klickbar, Paste-URL-Audit, Fix-via-PR-Tease) |
| Q5 | 2.1 | Quelle der Portfolio-Liste | **`SolarListView` wiederverwenden, `readOnly`** (kein Duplikat) |
| Q6 | 2.2 | Drill-Down-Daten-Fidelity | **Jedes Repo zoomt in EIN gemeinsames Demo-Repo** (`fraud-detection`) |
| Q7 | 2.3 | Galaxie-Testimonial (Tomasz K.) | **Durch Konsole-Lob ersetzen, gleiche Person** |
| Q8 | 2.4 | Plan-Struktur | **Ein Master-Plan, intern in 3 Bundles** |

**Claude-Challenge protokolliert:** Ich habe Q2 (radikales Überall-Raus) als riskant markiert. Die Verifikation entkräftet das Risiko: PR #1 ist gemergt, die Konsole ist bereits Workspace-Default, `SolarListView` ist 100 % Pixi-/gsap-frei, alle vier Heavy-Deps sind Galaxie-exklusiv. Das Löschen lässt **kein Loch** im Produkt — nur der „Map"-Tab verschwindet.

---

## 3. Existing-Patterns im Repo (Vorbild)

- `apps/web/src/components/galaxie/GalaxieRoot.tsx:119-152` (`InteractiveGalaxie`) — zeigt das **View-Switcher-Pattern** (`useState<'console'|'map'>`, `role=radiogroup`). Daraus übernehmen wir das State-Toggle-Muster für `portfolio | repo`; die `map`-Branch entfällt komplett.
- `apps/web/src/components/galaxie/SolarListView.tsx` — die wiederzuverwendende Konsole. Props `{ initialData?: GalaxieData; readOnly?: boolean; workspaceSlug?: string }`, rein React + `lib/galaxie`-Helfer (`buildGalaxieTree`, `console-grouping`, `humanize`, `severity-colors`). Wird mit `readOnly` + `initialData={buildLandingMap()}` auf der Landing montiert.
- `apps/web/src/components/landing/HeroSection.tsx` — der bestehende Repo-Tree+Inspector-Demo-Orchestrator (5 Stages: idle/loading/result/background/error, Paste-URL → `auditAction`, Live-Galaxie via `buildGalaxieFromAudit`). Wird zur **Repo-Ebene** des neuen Surface refactored (nicht neu gebaut).
- `apps/web/src/components/landing/RepoTreeView.tsx` + `RepoInspector.tsx` — die zwei Panes aus dem Screenshot. Bleiben unverändert in Funktion, ggf. minimaler Polish.
- `apps/web/src/lib/galaxie/mock-data.ts:195-236` (`buildLandingMap()`) — 6-Kunden-Fixture. Wird vom Galaxie-Konsumenten zum **Konsole-Konsumenten** umgewidmet (gleiche `GalaxieData`, andere Render-Komponente).
- `apps/web/src/components/landing/HeroText.tsx:100-135` — das Browser-Frame-Treatment (Chrome-Bar + `app.validationkit.dev`). Dieses Frame umschließt künftig das **Live-Surface** statt eines statischen PNG.

---

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Galaxie nur von der Landing nehmen, Map-Tab im Produkt behalten** → Verworfen (Q2). Hält 4 Heavy-Deps + ~32 Pixi-Files am Leben für ein selten genutztes Sekundär-Feature.
- **Alt-B: Landing-eigene schlanke Liste neu bauen** → Verworfen (Q5). Duplikat-Pattern gegen `SolarListView`, verstößt gegen das „kein Duplikat"-Constraint, doppelte Wartung.
- **Alt-C: Per-Repo-Fixtures für alle 6 Portfolio-Repos** → Verworfen (Q6). Maximale Fidelity, aber viel Demo-Daten-Pflege ohne Story-Mehrwert; ein hochpolierter Shared-Repo reicht.
- **Alt-D: Statischer Screenshot statt Live-Surface** → Verworfen (Q4). Anfassbar schlägt Bild; die Interaktivität ist bereits gebaut.
- **Alt-E: `RepoTreeView`/`repo-galaxie`-Modell auf `GalaxieData` vereinheitlichen** → Out-of-Scope. Zwei Datenmodelle (Portfolio = `GalaxieData`, Drill = `RepoGalaxieData`) koexistieren bereits sauber; eine Vereinheitlichung ist ein separates Refactor ohne User-Mehrwert für diesen Plan.

---

## 5. Endzustand

**Code/Deps:**
- `pixi.js`, `@pixi/react`, `pixi-filters`, `gsap` aus `apps/web/package.json` entfernt; `pnpm ls` zeigt 0 Vorkommen.
- `apps/web/src/components/galaxie/pixi/**` + alle Pixi-only-Komponenten (`GalaxieScene`, `MiniMap`, `ZoomIndicator`, `StaticGalaxieSVG`, …) gelöscht. `SolarListView`, `Inspector`, `UniversalSearch`, `OnboardingBanner`, `ActivationChecklist`, `EmptyGalaxie` + ihre `lib/galaxie`-Helfer (`tree`, `console-grouping`, `group-findings`, `humanize`, `severity-colors`, `severity-icons`, `types`, `device`, `mock-data`) **bleiben**.
- `apps/web/src/app/[workspace]/page.tsx` rendert die Konsole direkt (kein `GalaxieRoot`-Wrapper mit Map-Tab mehr).
- `apps/web/src/app/[workspace]/settings/galaxie/page.tsx` gelöscht; Link-Referenzen darauf entfernt.
- `pnpm typecheck` grün, `pnpm test` grün (Pixi-only-Tests gelöscht, geteilte Helfer-Tests bestehen weiter).

**Landing-Page (`/`):**
- Genau **eine** interaktive Konsole als Hero-Visual. Default-State = Portfolio-Liste (6 Kunden-Repos, Heat-Bars). Klick auf Repo-Zeile → motion-Zoom-Transition in Datei-Tree + Inspector. „Zurück zum Portfolio"-Affordance führt zurück. Paste-URL-Pill löst echten Audit aus.
- Keine Galaxie mehr sichtbar; Feature-Block 3 zeigt die Konsole statt der `portfolio-map.png`; Tomasz-K.-Testimonial lobt die Konsole.
- Mobile: Portfolio-Liste full-width, Drill öffnet Tree + Bottom-Sheet-Inspector (bestehendes Mobile-Pattern aus `HeroSection`).

---

## 6. Schritte

### Bundle 1 — Galaxie-Stack + Deps + Routes löschen

- [x] **1.1** `apps/web/src/app/[workspace]/page.tsx` umschreiben: `GalaxieRoot` durch direktes Mounten der Konsole ersetzen. `GalaxieRoot` zu einer schlanken, Map-Tab-freien `WorkspaceConsole`-Komponente eindampfen (oder löschen + `SolarListView` direkt). Mobile-/reduced-motion-Pfad: bleibt Konsole (war vorher Fallback, wird jetzt Default).
- [x] **1.1a** (Block-Resolution 2026-06-10) `WorkspaceSwitcher` + `ActivationChecklist` in das Konsolen-Surface portieren — beide leben aktuell NUR in `GalaxieScene`/`StaticGalaxieSVG` und würden sonst ersatzlos verschwinden (In-App-Workspace-Wechsel + Onboarding). `WorkspaceConsole`/`SolarListView`-Wrapper nimmt jetzt `workspaces` + `onboarding` entgegen und rendert Switcher (Header) + ActivationChecklist (Right-Rail/Banner). `OnboardingState`-Type von `OnboardingBanner.tsx` nach einem neutralen Ort verschieben (z. B. `lib/galaxie/types.ts`), damit er die Pixi-Löschung überlebt.
- [x] **1.2** `apps/web/src/components/landing/PortfolioShowcase.tsx` löschen + Import/Usage in `apps/web/src/app/page.tsx` entfernen.
- [x] **1.3** Pixi-Render-Files löschen: `apps/web/src/components/galaxie/pixi/**`, `GalaxieScene.tsx`, `GalaxieRoot.tsx` (nach 1.1), `StaticGalaxieSVG.tsx`, `MiniMap.tsx`, `ZoomIndicator.tsx`, `GalaxieSkeleton.tsx`, sowie deren Pixi-only-Tests (`pixi/Camera.test.ts`, `pixi/quadtree.test.ts`, `pixi/node-label-lod.test.ts`, ggf. `diff-renderer.test.ts`, `inspector-templates.test.ts` — **nur wenn** sie Pixi-Render testen, nicht geteilte Logik).
- [x] **1.4** `apps/web/src/lib/galaxie/`: nur Pixi-Layout-Files löschen (`solar-layout.ts` + `.test.ts`). **Methodik statt Raterei:** zuerst die Render-Files löschen, dann `pnpm typecheck` laufen lassen — jedes Modul, das danach noch von lebendem Code (SolarListView/Inspector/Landing) importiert wird, **bleibt**. `tree.ts` bleibt (SolarListView nutzt `buildGalaxieTree`), `severity-colors`/`humanize`/`console-grouping`/`group-findings`/`types`/`device` bleiben.
- [x] **1.5** `apps/web/src/app/[workspace]/settings/galaxie/page.tsx` löschen; Settings-Nav-Eintrag dahin entfernen (grep nach `settings/galaxie`).
- [x] **1.6** Heavy-Deps aus `apps/web/package.json` entfernen: `pixi.js`, `@pixi/react`, `pixi-filters`, `gsap`. `pnpm install` neu auflösen.
- [x] **1.7** `pnpm typecheck` + `pnpm test` grün ziehen; Orphan-Imports bereinigen.

### Bundle 2 — Durchgehendes Konsolen-Surface auf der Landing

- [ ] **2.1** Neue Komponente `apps/web/src/components/landing/ConsoleSurface.tsx`: hält `view: 'portfolio' | 'repo'` + `activeRepoId`. `portfolio` rendert `<SolarListView readOnly initialData={buildLandingMap()} />` mit Repo-Row-`onClick` → `setView('repo')`. `repo` rendert die aus `HeroSection` extrahierte Repo-Ebene (Tree + Inspector) mit `DEMO_GALAXIE` (shared Fixture, Q6) + „← Portfolio"-Button → `setView('portfolio')`.
- [ ] **2.2** `SolarListView` minimal erweitern: optionaler Prop `onRepoActivate?: (repoId: string) => void`. Wenn gesetzt (Landing-Modus), löst ein Repo-Row-Klick `onRepoActivate` aus statt Inline-Expand. Default (Workspace) unverändert. **Kein Duplikat** — nur ein Hook-Point.
- [ ] **2.3** `HeroSection` zu reiner Repo-Ebene refactoren (oder Repo-View als `RepoConsole.tsx` extrahieren): Paste-Pill, 5-Stage-Logik, Tree+Inspector, Mobile-Bottom-Sheet bleiben; der äußere Section-/Heading-Wrapper wandert nach `ConsoleSurface`.
- [ ] **2.4** Zoom-Transition portfolio⇄repo mit `motion/react` (`AnimatePresence` + shared-axis/scale-fade, `reducedMotion="user"` respektiert). Kein gsap.
- [ ] **2.5** `apps/web/src/components/landing/HeroText.tsx`: statisches `konsole.png` durch `<ConsoleSurface />` im bestehenden Browser-Frame ersetzen. Headline/CTAs bleiben; `priority`-Image-Logik entfernen.
- [ ] **2.6** `apps/web/src/app/page.tsx` Reihenfolge final: `Hero (Text + ConsoleSurface)` → `LandingFeatures` → `LandingSocialProof`. Separates `<HeroSection />` + `<PortfolioShowcase />` entfallen als eigenständige Sections.
- [ ] **2.7** Mobile-QA: Portfolio-Liste + Drill + Bottom-Sheet auf ≤639 px.

### Bundle 3 — Copy, Cleanup, Verify

- [ ] **3.1** `LandingNarrative.tsx`: Feature-Block 3 von „Portfolio-Map"/Galaxie auf Konsole umschreiben (Eyebrow/Title/Body), Bild `portfolio-map.png` → neuer Konsole-Screenshot oder Entfall zugunsten Live-Surface-Verweis.
- [ ] **3.2** `LandingNarrative.tsx:218` Tomasz-K.-Testimonial neu (Q7): Konsole-Lob, z. B. „Die Triage-Konsole zeigt mir in Sekunden, welches Kunden-Repo brennt — Onboarding neuer Kunden dauert jetzt Minuten."
- [ ] **3.3** Dangling-Copy bereinigen: `app/[workspace]/customers/page.tsx`-Subtitle (Galaxie-Satz), `app/[workspace]/scans/page.tsx`-Nav-Link-Text „Galaxie" → „Konsole"/„Dashboard", `HeroSection`-Anchor `#galaxie-findings-list` umbenennen.
- [ ] **3.4** Asset-Cleanup in `public/landing/`: nicht mehr genutzte `portfolio-map.png`/`konsole.png` entfernen (falls Live-Surface sie ersetzt). Datei-Rename beachten wegen next/image-In-Memory-Cache.
- [ ] **3.5** Grep-Sweep „Galaxie"/„Galaxy"/„Sonnensystem"/„Planet"/„Map-Tab" über `apps/web/src` — verbleibende Texte/Alt-Texte/Kommentare prüfen.
- [ ] **3.6** Doku: `docs/changelog.md` + ggf. ein ADR-Stub „Galaxie retired" (nur falls User will — sonst Changelog-Zeile). CLAUDE.md-Tech-Stack-Zeile „Galaxie" aktualisieren.
- [ ] **3.7** Full-Verify: `pnpm typecheck`, `pnpm test`, `pnpm build` (Prod-Build wegen früherer „use server"-Blocker), Dev-Server-Visual-QA Desktop + Mobile.

---

## 7. Files-to-Change

| Datei | Aktion | Was passiert |
|-------|--------|--------------|
| `apps/web/src/app/[workspace]/page.tsx` | EDIT | Konsole direkt mounten statt `GalaxieRoot`+Map-Tab |
| `apps/web/src/components/galaxie/GalaxieRoot.tsx` | DELETE/REWRITE | Map-Tab-Wrapper entfällt (oder → schlanke `WorkspaceConsole`) |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | DELETE | Pixi-Canvas |
| `apps/web/src/components/galaxie/pixi/**` | DELETE | Alle Pixi-Render-Primitives + Pixi-Tests |
| `apps/web/src/components/galaxie/{MiniMap,ZoomIndicator,StaticGalaxieSVG}.tsx` | DELETE ✅ | Pixi-only-Begleiter (`GalaxieSkeleton` BLEIBT — reines CSS, Suspense-Fallback) |
| `apps/web/src/components/galaxie/{GalaxieRoot,GalaxieScene,OnboardingBanner}.tsx` + `pixi/**` | DELETE ✅ | Pixi-Stack; `OnboardingState`-Type nach `lib/galaxie/types.ts` verschoben |
| `apps/web/src/lib/galaxie/solar-layout.ts(+.test)` | **KEEP** ✅ | NICHT Pixi-only — `tree.ts`/Konsole brauchen `computeSolarLayout`+`extractOwningFolder` (Typecheck-Befund 1.4) |
| `apps/web/src/lib/galaxie/{tree,console-grouping,group-findings,humanize,severity-colors,severity-icons,types,device,mock-data,space-bg,layout}.ts` | KEEP | Konsole/Landing nutzen diese |
| `apps/web/src/components/galaxie/{SolarListView,Inspector,UniversalSearch,EmptyGalaxie}.tsx` | KEEP (Inspector: gsap → WAAPI-Port ✅) | Konsole-Stack |
| `apps/web/src/components/galaxie/{WorkspaceSwitcher,ActivationChecklist}.tsx` | KEEP + REWIRE ✅ | Aus Pixi-Chrome in `WorkspaceConsole` portiert (Block-Resolution 1.1a) |
| `apps/web/src/components/galaxie/WorkspaceConsole.tsx` | NEW ✅ | SolarListView + Switcher + Checklist; ersetzt `GalaxieRoot` im Workspace |
| `apps/web/src/app/[workspace]/settings/galaxie/page.tsx` | DELETE | Galaxie-only-Settings |
| `apps/web/src/components/landing/PortfolioShowcase.tsx` | DELETE | Galaxie-Showcase auf Landing |
| `apps/web/src/components/landing/ConsoleSurface.tsx` | NEW | Durchgehendes Surface (portfolio⇄repo) |
| `apps/web/src/components/landing/HeroSection.tsx` | EDIT/EXTRACT | → Repo-Ebene des Surface |
| `apps/web/src/components/landing/HeroText.tsx` | EDIT | Live-Surface statt `konsole.png` im Browser-Frame |
| `apps/web/src/components/landing/LandingNarrative.tsx` | EDIT | Feature-Block 3 + Testimonial neu |
| `apps/web/src/app/page.tsx` | EDIT | Reihenfolge + Imports |
| `apps/web/src/app/[workspace]/{customers,scans}/page.tsx` | EDIT | Galaxie-Copy/Links bereinigen |
| `apps/web/package.json` | EDIT | 4 Heavy-Deps entfernen |
| `public/landing/{portfolio-map,konsole}.png` | DELETE (cond.) | Falls Live-Surface ersetzt |
| `docs/changelog.md`, `.claude/CLAUDE.md` | EDIT | Galaxie-Retirement dokumentieren |

> Die exakte Keep/Delete-Liste der `lib/galaxie`- und `components/galaxie`-Files wird **per Typecheck-Import-Graph** (Schritt 1.4) bestimmt, nicht statisch geraten — zwei Audit-Subagenten waren sich bei `tree.ts` uneinig; maßgeblich ist, was lebender Code importiert.

---

## 8. Test-Plan

**Automatisch:**
- `pnpm typecheck` ✓ — primäres Orphan-Detection-Werkzeug nach Deletion (Schritt 1.4/1.7).
- `pnpm test` ✓ — geteilte Helfer-Tests (`severity-colors`, `humanize`, `console-grouping`, `group-findings`, `tree`) müssen grün bleiben; Pixi-only-Tests gelöscht.
- `pnpm build` ✓ — Prod-Build (es gab zuletzt einen „use server"-Membership-Blocker; nach Dep-Removal voll durchziehen).

**Manuell:**
- [ ] Landing Desktop: Portfolio-Liste lädt, Heat-Bars korrekt, Klick auf Repo zoomt sauber in Tree+Inspector, „← Portfolio" zurück, Paste-URL-Audit läuft, „Fix via PR" → SignUpTease.
- [ ] Landing Mobile ≤639 px: Liste + Drill + Bottom-Sheet.
- [ ] `prefers-reduced-motion`: Transition degradiert sauber (kein Sprung, kein Hydration-Error).
- [ ] Workspace `/[slug]`: Konsole lädt als Default ohne Map-Tab, kein toter Toggle, keine Console-Errors.
- [ ] `/[slug]/settings`: kein toter Galaxie-Settings-Link/404.
- [ ] Grep „Galaxie" über `src` → nur bewusste Treffer.

---

## 9. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| Versehentliches Löschen eines noch-genutzten `lib/galaxie`-Helfers (z. B. `tree.ts`) | **Strong** | Render-Files zuerst löschen, dann `pnpm typecheck` als Import-Graph-Wahrheit; Keep-Liste nicht statisch raten (Schritt 1.4) |
| Prod-Build bricht durch verbleibende Pixi-Referenz / dynamic import | **Strong** | `pnpm build` als Pflicht-Gate in Bundle 1 **und** 3; `pnpm ls pixi.js @pixi/react pixi-filters gsap` muss leer sein |
| Workspace verliert Funktionalität (Map-Tab-Power-User) | **Mid** | Bewusste, vom User bestätigte Entscheidung (Q2). Konsole deckt alle Triage-Pivots ab; spatial-View entfällt absichtlich |
| Datenmodell-Bridge Portfolio (`GalaxieData`) → Drill (`RepoGalaxieData`) fühlt sich inkonsistent an (alle Repos → fraud-detection) | **Mid** | Bewusst (Q6). Drill-Header zeigt den geklickten Repo-Namen; Inhalt ist der polierte Shared-Tree. V2: Per-Repo-Fixtures |
| Bundle-Size-Regression-Annahme falsch (Deps doch woanders genutzt) | **Weak** | Dep-Audit bereits erfolgt: alle 4 Galaxie-exklusiv, Landing nutzt `motion/react`. `pnpm ls`-Gate bestätigt final |
| next/image-In-Memory-Cache zeigt alte Landing-Assets | **Weak** | Bei Asset-Ersatz Datei umbenennen (bekanntes Pattern), nicht überschreiben |
| Reduced-motion-Hydration-Error in der Transition | **Weak** | `MotionConfig reducedMotion="user"`; SVG-/motion.g-Pfade meiden; manueller reduced-motion-Check |

---

## 10. Rollout

- **Strategie:** Branch + Review (`feat/galaxie-retire-console-landing`), PR gegen `main`. **Kein** Direkt-Merge — Blast-Radius berührt Workspace-Produkt + Landing + package.json.
- **Pre-Deploy-Gates:** `pnpm typecheck` ✓ · `pnpm test` ✓ · `pnpm build` ✓ · `pnpm ls`-Dep-Check leer · manuelle Desktop+Mobile-QA durch User.
- **Post-Deploy-Verifikation:** Landing-Surface interaktiv auf Prod-Domain; Workspace-Konsole lädt; keine 404 auf alten Galaxie-Routen (oder Redirect); Bundle-Size-Diff im Vercel-Build-Log gegenchecken.
- **Rollback-Trigger:** Workspace-Konsole rendert nicht / Prod-Build rot / Landing-Surface tot.
- **Rollback-Schritte:** PR-Revert (ein Commit-Range). Da rein additive Deletion ohne DB-/Schema-Touch ist Revert risikolos.
- **Deploy nur auf expliziten User-Request** (CLAUDE.md-Constraint).

---

## 11. Out-of-Scope (V2 / separater Plan)

- Per-Repo-Fixtures für alle 6 Portfolio-Repos (Q6 = Shared-Repo).
- Vereinheitlichung der zwei Datenmodelle (`GalaxieData` ↔ `RepoGalaxieData`) — Alt-E.
- Entfernen der `repo-galaxie`-SVG-`RepoGalaxie.tsx`, falls auf der Landing gar nicht mehr referenziert (separat prüfen, nicht in diesem Scope löschen, solange unklar).
- Neue Konsole-Features (zusätzliche Pivot-Achsen, Suche auf der Landing).
- ADR-Volltext „Galaxie retired" (nur Changelog-Zeile in diesem Plan; Voll-ADR auf Wunsch).

---

## 12. Open Questions (nur Post-Execute-Items)

- Soll der alte Workspace-Root `/[slug]` bei Bookmarks auf die Galaxie weiterhin sauber laden? → Ja, lädt künftig Konsole; kein Redirect nötig (gleiche Route). Kein offener Punkt.
- (Leer im Übrigen — alle load-bearing Entscheidungen in §2.)

---

## 13. Geschätzter Aufwand

- Bundle 1 (Removal + Deps): ~1.5–2 h — viel Löschen, aber Typecheck-getrieben sicher.
- Bundle 2 (Konsolen-Surface): ~3–4 h — die eigentliche Bau-Arbeit (ConsoleSurface + Transition + Refactor HeroSection).
- Bundle 3 (Copy + Cleanup + Verify): ~1–1.5 h.
- **Gesamt: ~6–7.5 h → Multi-Session.** Empfehlung: **1 Branch, 3 Commits** (je Bundle), ein PR. Alternativ 3× `/execute` mit Bundle-Grenzen als Checkpoints.
