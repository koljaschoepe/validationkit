# Plan — App-Visual-Overhaul: 3-Farben-System · Hero-Viewport · Konsole-Ruhe · Trust-Ehrlichkeit

> **Status:** 📝 Ready für `/execute` · **Confidence: High** · **Slug:** `app-visual-overhaul-3color`
> **Erstellt:** 2026-06-10 · **Autor:** Kolja + Claude (Opus 4.8 1M)
> **Scope:** App-weiter Visual-Sweep (Landing + Konsole + alle App-Seiten) in einem Durchlauf.

---

## §1 — Ziel & Begründung (Warum)

Der User hat die neue Konsolen-Surface-Landing (post Galaxie-Retire) gesehen und als „deutlich
besser, aber noch nicht optimiert" bewertet. Vier konkrete Schmerzpunkte, plus ein app-weiter
Anspruch:

1. **Hero ist kein Ein-Bildschirm-Erlebnis.** Beim Laden sieht man nicht „nur den Startbildschirm" —
   Text + Demo sind vertikal gestapelt und überlaufen den Viewport. Soll: immer genau 100dvh,
   side-by-side ab Desktop, gestapelt auf Mobile.
2. **Zu viele Farben.** Gefühlt bunt. Soll: maximal 3 Akzentfarben — Rot, EIN gedämpftes Orange,
   Grün. Alles andere monochrom (Hue-270-Graustufen bleiben).
3. **Severity-Styling sprengt ins Gesicht.** Kill = 3px-Rahmen, Weak = 2px, Strong = gestrichelt,
   Exceptional = gestrichelt+kursiv. Wirkt überladen/komisch. Soll: ruhige einheitliche Hairline-Pills.
4. **Konsolen-Gruppierung unübersichtlich.** 5 Modi (Repo/Severity/Regel/Kunde/Ordner) + 5-farbige
   HeatBar mit „2 Kill, 2 Weak"-Anzeige. Soll: nur Repo+Kunde gruppieren, Severity+Regel als Filter,
   Ordner nested, ruhiger Schwere-Indikator.
5. **Landing-Politur:** Demo-Screenshots geiler/rangezoomter + Hover-Zoom-Animation; unterer CTA mit
   Repo-URL-Eingabe (echtes Anon-Audit) statt fadem Sign-in-Button; Testimonials weniger technisch;
   Trust-Bausteine ehrlich (Fakes raus).

**Root-Cause „zu viele Farben" (durch Subagent-Audit bestätigt):** Es gibt **zwei widersprüchliche
Severity-Farbquellen**. `globals.css` (`--sev-*`, Z.117–121) ist bereits auf das 3-Farben-Ampel-
Mapping (rot/orange/grün) migriert; `lib/galaxie/severity-colors.ts` (`SEVERITY_HEX`, Z.25–31) hängt
aber noch in der alten 5-Hue-Palette (Coral/Amber/Amber/Teal/Indigo). JS-Code (HeatBar, Dots, Pills)
liest die alte Datei → Konflikt am Bildschirm. Zusätzliche Lärmquellen: Deko-Nebula-Gradienten
(Purpur+Blau), Plan-Indikator-Farben, Inline-Hex.

---

## §2 — Discovery: User-Entscheidungen (Audit-Trail)

Drei AskUserQuestion-Runden (je 3–4 Fragen). Erste Option jeweils `(Recommended)`.

**Runde 1 — Kern-Trade-offs:**
| Frage | Entscheidung | Recommended? |
|-------|--------------|--------------|
| 5 Severity-Bänder → 3 Farben | **Semantisch −/0/+:** Rot=negativ (Kill voll, Weak gedämpft), Orange=neutral (Mid), Grün=positiv (Strong, Exceptional heller/markiert) | ✅ |
| Hero-Viewport-Form | **Side-by-side ab Desktop, gestapelt mobil, 100dvh** | ✅ |
| Erfundene Testimonials/Logos/Stat | **Fakes raus → ehrliches Early-Access-Framing** | ✅ |
| Scope des Farb-Sweeps | **Voller app-weiter Visual-Sweep** | ❌ (User wählte größeren Scope) |

**Runde 2 — Ausführungs-Shape:**
| Frage | Entscheidung | Recommended? |
|-------|--------------|--------------|
| Gruppierung Severity/Regel/Ordner | **Regel als Filter behalten** (Repo+Kunde gruppieren; Severity+Regel als Filter; Ordner nested) | ❌ (Recommended war „Regel raus") |
| Severity-Look | **Einheitliche Hairline-Pills, nur Kill gefüllt** | ✅ |
| HeatBar-Ersatz | **Worst-Dot + Kill-Zahl** | ✅ |
| Screenshots | **Frisch via Playwright nach Redesign + CSS-Hover-Zoom** | ✅ |

**Runde 3 — Struktur & Details:**
| Frage | Entscheidung | Recommended? |
|-------|--------------|--------------|
| Plan-Struktur / Ship-Modus | **Alles in einem Rutsch** (ein Plan, ein Durchlauf, finale QA statt Zwischen-Checkpoints) | ❌ (Recommended war „5 Bundles inkrementell") |
| Border-Radius / Härte | **Ja, Radius 8→6px + Hairline-Borders überall** | ✅ |
| Repo-URL-Eingabe-Platzierung | **Nur unten den CTA ersetzen** (Hero behält seine Buttons) | ❌ (Recommended war „Hero+unten beide") |

---

## §3 — Goals & Non-Goals

**Goals:**
- G1: Genau **3 Akzentfarben** app-weit (rot/orange/grün), eine einzige SSOT für Severity-Hex.
- G2: Hero füllt exakt **100dvh** (Desktop side-by-side, Mobile gestapelt), kein Scroll für „alles".
- G3: Severity-Badges = **einheitliche Hairline-Pills**, nur Kill gefüllt. Kein border-2/3px/dashed/italic.
- G4: Konsole = **Repo+Kunde-Gruppierung**, Severity+Regel als Filter, Ordner nested, **Worst-Dot+Kill-Zahl** statt 5-Farb-HeatBar.
- G5: **Radius 8→6px**, alle Borders 1px solid in einer Border-Farbe.
- G6: Unterer CTA = **RepoUrlPill** (echtes Anon-Audit).
- G7: Demo-Screenshots **frisch + eng gecroppt** (neue Farben) + CSS-Hover-Zoom.
- G8: **Fakes raus** (Logo-Wall, Placeholder-Stat, erfundene Testimonials) → ehrliche Proof-Punkte.
- G9: **App-weiter Sweep:** jede Seite (Settings, Billing, Scans, Members, Customers, Repos, Pricing, Trust, Legal) visuell auf das neue System ziehen.

**Non-Goals (Out-of-Scope):**
- N1: Keine Schema-/DB-Änderungen (kein Migration-Bedarf → §10 leer).
- N2: Keine neuen Audit-Regeln, kein Severity-Band-**Set**-Change (die fünf Bänder bleiben {Kill, Weak, Mid, Strong, Exceptional} — nur ihr **Farb-Mapping** ändert sich; CLAUDE.md-Konvention bleibt intakt).
- N3: Kein Re-Wiring des Audit-/Stripe-/Auth-Backends.
- N4: Kein Deploy (nur auf expliziten User-Request).
- N5: Keine neuen Skills/Agents/Commands, keine neuen MD-Files außerhalb `docs/plans/`.
- N6: Trust-Seite inhaltlich-rechtlicher Tiefenumbau (DPA/AGB) bleibt — nur Proof-/Stat-/Logo-Fakes + visuelle Anpassung in Scope.

---

## §4 — Existing Patterns (kartiert, file:line)

**Farb-/Token-Layer:**
- `apps/web/src/app/globals.css:117–121` — `--sev-*` Tokens (BEREITS 3-Farben-Ampel, SSOT-Ziel).
- `apps/web/src/app/globals.css:110` — `--radius: 0.5rem` (→ 0.375rem).
- `apps/web/src/lib/galaxie/severity-colors.ts:25–31` — `SEVERITY_HEX` (ALT, 5-Hue → angleichen).
- `…severity-colors.ts:37–39, 51–99` — toter Pixi-Code (`SEVERITY_OUTLINE_HEX`, `SEVERITY_PIXI`, `hexToPixiNumber`, `severityPixiColor`, `SEVERITY_GLOW_RADIUS`, `SEVERITY_PULSE_RATE`, `getPulseDuration`) — Pixi retired → entfernen (nach Consumer-Check via typecheck).
- `docs/design/linear-aesthetic.md` §1/§3.2/§4.2 — Style-Guide (severity-only-color, Radius-Decision pending).

**Severity-Badge:**
- `apps/web/src/components/ui/severity-badge.tsx:29–46` — cva mit border-[3px]/border-2/dashed/italic-Ladder → auf Hairline-Pills (nur Kill gefüllt) umbauen.

**Konsole-Gruppierung:**
- `apps/web/src/lib/galaxie/console-grouping.ts:18–26` — `GroupBy` Typ + `GROUP_BY_OPTIONS` (5 Modi).
- `…console-grouping.ts:78–86` — `heatSegments()`.
- `apps/web/src/components/galaxie/SolarListView.tsx:83,203,277–389` — groupBy-State + Render-Switch.
- `…SolarListView.tsx:407–502` — `RepoGroup`.
- `…SolarListView.tsx:534–567` — `HeatBar` (5-Farb-Stack + aria „X Kill, Y Weak").
- `…SolarListView.tsx:638–671` — `FileRow`.
- `…SolarListView.tsx:active`-State — Severity-Filter-Chips (bereits vorhanden).

**Severity-Hex-Consumer (lesen `severityHex()`):**
- `apps/web/src/components/galaxie/diff-renderer.tsx` — Diff +grün/−rot.
- `apps/web/src/components/galaxie/UniversalSearch.tsx:100,148` — Severity-Dots.
- `apps/web/src/components/landing/RepoTreeView.tsx:115` — Severity-Pills.
- `apps/web/src/components/landing/RepoInspector.tsx:118–127` — Diff + Severity.
- `apps/web/src/components/galaxie/WorkspaceSwitcher.tsx:74–83` — `planColor()` (Plan→Severity-Farbe; entfernen/neutralisieren).
- `apps/web/src/components/CreditMeter.tsx:60–69` — 3-Farben-Meter (destructive/sev-mid/primary → behalten, ist semantisch korrekt).
- `apps/web/src/lib/galaxie/space-bg.ts:9–22` — Nebula-Gradienten (Purpur+Blau → entfernen).

**Landing:**
- `apps/web/src/app/page.tsx:16–68` — `SiteNav` → `HeroText` → `LandingFeatures` → `LandingSocialProof`.
- `apps/web/src/components/landing/HeroText.tsx:45–132` — Hero (gestapelt zentriert; Console `h-[clamp(520px,68vh,760px)]` Z.128).
- `apps/web/src/components/landing/ConsoleSurface.tsx` — Portfolio→Repo-Drill; Inline-Hex `bg-[#06080c]`.
- `apps/web/src/components/landing/RepoConsole.tsx` — Repo-Detail + `RepoUrlPill` (auditAction).
- `apps/web/src/components/landing/RepoUrlPill.tsx` — wiederverwendbarer URL-Input (`size="hero"|"compact"`).
- `apps/web/src/lib/audit-action.ts:86–208` — `auditAction()` (Anon-Audit).
- `apps/web/src/components/landing/LandingNarrative.tsx`:
  - `:72,74–98` — `LogoStrip` (Fake-Logos + Placeholder-Stat „2.400+/18.000+").
  - `:156–202` — 4 Feature-Blöcke + Bild-Render (contain-Logik).
  - `:209–228,230–265` — Testimonials (Lena/Tomasz/Priya, erfunden).
  - `:373–391` — `FinalCTA` (Sign-in-Button → RepoUrlPill).
  - Inline-Hex `bg-[#07080a]`.
- `apps/web/public/landing/` — `intake-pill.png`, `audit-finding.png`, `konsole.png`, `fix-pr.png`.

**Trust:**
- `apps/web/src/app/trust/page.tsx` — Trust Center (ehrlich strukturiert; CCA-Badge env-based, 6 Sektionen).

---

## §5 — Bundle 1: Token- & Severity-Core (wirkt app-weit)

> Ziel: EINE Severity-SSOT, 3 Farben, Radius/Border-Härte. Propagiert automatisch durch alle Token-Consumer.

**1.1 — `globals.css` Severity-Tokens finalisieren** (`:117–121`)
Mapping bestätigen/feinjustieren (User-Wunsch: EIN gedämpftes, nicht zu grelles Orange):
```css
--sev-kill:        oklch(0.62 0.24 25);   /* voll rot, laut */
--sev-weak:        oklch(0.55 0.15 28);   /* gedämpftes rot (dunkler/weniger Chroma als Kill) */
--sev-mid:         oklch(0.68 0.13 65);   /* EIN gedämpftes Orange, nicht grell (Chroma runter 0.18→0.13) */
--sev-strong:      oklch(0.62 0.15 150);  /* grün */
--sev-exceptional: oklch(0.74 0.16 150);  /* helleres grün (selbe Hue, höhere Lightness = „special") */
```
Kommentar aktualisieren (Pixi-Referenz raus, „three-tier traffic-light, disambiguation via label+fill not hue").

**1.2 — `--radius: 0.5rem → 0.375rem`** (`:110`). `--vk-radius-*` (`:159–162`) bleiben (sind schon 4/6/8) — ggf. `--vk-radius-lg` 8→6 angleichen für Konsistenz.

**1.3 — `severity-colors.ts` zur reinen SSOT machen:**
- `SEVERITY_HEX` (`:25–31`) auf die `--sev-*`-Werte angleichen (gerenderte Hex-Äquivalente der OKLCH oben). Diese Hex müssen visuell == CSS-Token sein (Single Source of Truth in zwei Formaten, da JS RGB braucht).
- Toten Pixi-Code entfernen: `SEVERITY_OUTLINE_HEX`, `SEVERITY_PIXI`, `hexToPixiNumber`, `severityPixiColor`, `SEVERITY_GLOW_RADIUS`, `SEVERITY_PULSE_RATE`, `getPulseDuration`, `DISMISSED_*` (falls ungenutzt). **Vorgehen:** erst `pnpm --filter @vk/web typecheck` als Orphan-Detektor — nur entfernen was keinen Consumer hat; was noch genutzt wird, bleibt (oder Consumer mitziehen).
- Datei-Header-Kommentar entrümpeln (Pixi/Glow/Pulse-Erklärung raus).

**1.4 — `severity-badge.tsx` cva neu** (`:29–46`):
```
base:        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 type-mono-sm
              tracking-wide uppercase font-mono border"   // 1px solid, einheitlich
Kill:        "border-[var(--color-sev-kill)] bg-[var(--color-sev-kill)] text-[var(--sev-on-kill)] font-semibold"  // GEFÜLLT
Weak:        "border-[var(--color-sev-weak)] text-[var(--color-sev-weak)]"
Mid:         "border-[var(--color-sev-mid)] text-[var(--color-sev-mid)]"
Strong:      "border-[var(--color-sev-strong)] text-[var(--color-sev-strong)]"
Exceptional: "border-[var(--color-sev-exceptional)] text-[var(--color-sev-exceptional)]"
```
- `--sev-on-kill` = dunkler Text für Kontrast auf gefülltem Rot (z.B. `oklch(0.14 0 0)`), als Token in globals.css ergänzen.
- Kein `border-dashed`, kein `italic`, kein border-2/3px mehr. Disambiguierung trägt das **Textlabel** (KILL/WEAK/…) + Fill-vs-Outline (Kill).

**1.5 — Plan-Farben + Nebula-Gradienten + Inline-Hex entfernen:**
- `WorkspaceSwitcher.tsx:74–83` — `planColor()` auf neutral (Graustufe / `--vk-text-secondary`) oder Plan-Label ohne Farbe.
- `space-bg.ts:9–22` — Purpur/Blau-Nebula-Gradienten raus (nur Sternfeld + Vignette behalten, oder ganz flat `--background`).
- Inline-Hex `bg-[#06080c]` (ConsoleSurface), `bg-[#07080a]` (LandingNarrative) → `bg-background` bzw. neues `--vk-ink-1`.

**Verify 1:** `typecheck` grün · `lint` grün · visuell: Severity-Farben app-weit konsistent rot/orange/grün.

---

## §6 — Bundle 2: Konsole-Redesign

**2.1 — `console-grouping.ts` Group-By reduzieren** (`:18–26`):
```ts
export type GroupBy = 'repo' | 'customer';
export const GROUP_BY_OPTIONS = [
  { value: 'repo', label: 'Repo' },
  { value: 'customer', label: 'Kunde' },
];
```
- `sectionsBySeverity` / `sectionsByRule` / `sectionsByFolder`: aus dem Group-By-Switch entfernen. `sectionsByFolder`-Logik bleibt **als Nesting innerhalb RepoGroup** erhalten (Ordner sind Verschachtelung, kein Top-Level-Modus). `sectionsByRule` → in einen **Regel-Filter** umfunktionieren (s. 2.3).

**2.2 — SolarListView Render-Switch** (`:277–389`): nur noch `repo` + `customer` Branches. Severity/Rule/Folder-Branches raus.

**2.3 — Filter-Leiste:**
- Severity-Filter-Chips (`active` Set) bleiben.
- **Neu: Regel-Filter** (Dropdown/Multi-Select über Audit-Kategorien aus `sectionsByRule`-Datenquelle) — filtert die sichtbaren Findings, gruppiert aber nicht.
- UI: kompakte Leiste „Gruppieren: [Repo][Kunde] · Filter: [Severity-Chips] [Regel ▾]".

**2.4 — HeatBar → Worst-Dot + Kill-Zahl** (`:534–567` + Header-Render `:463,526`):
- Neue `SeverityIndicator`-Komponente: farbiger Punkt in `severityHex(worstSeverity)` + Kill-Count als rote Zahl (nur >0) + Gesamt-Findings.
- **a11y:** Punkt nicht nur Farbe — `aria-label="Schlimmste Severity: Kill, 3 kritisch, 24 gesamt"`; optional kleine Form/Icon-Variante für Kill (z.B. gefüllter vs. Ring-Dot) damit nicht farb-allein.
- Alte `HeatBar` + `heatSegments`-Aufrufe entfernen (heatSegments-Funktion löschen falls kein Consumer).

**2.5 — Severity-Konsistenz in Konsolen-Sub-Komponenten:** `FileRow` (`:638–671`), `RepoGroup`-Header, Inspector/FindingCard nutzen neuen Badge automatisch (1.4). Diff-Renderer +grün/−rot bleibt (semantisch, nutzt jetzt neue grün/rot Tokens).

**Verify 2:** Konsole zeigt nur Repo+Kunde-Gruppierung, ruhige Pills, Worst-Dot. `typecheck`+`lint` grün. Keyboard-Nav + Screenreader unverändert funktional.

---

## §7 — Bundle 3: Hero + Landing

**3.1 — Hero 100dvh side-by-side/stacked** (`HeroText.tsx:45–132`):
- Wrapper: `min-h-[100dvh] flex flex-col` (Mobile: Visual oben, Text+CTA unten) → `lg:grid lg:grid-cols-2 lg:items-center` (Desktop: Text links, Surface rechts).
- Mobile-Reihenfolge: Demo-Visual zuerst (order), Headline/CTA darunter — via `flex-col` + `order`-Utilities oder DOM-Reihenfolge + `lg:`-Umordnung.
- ConsoleSurface-Höhe an Spaltenhöhe koppeln statt fixe clamp; Mobile kompakter (`h-[38dvh]` o.ä.), Desktop füllt Spalte.
- `dvh` statt `vh` (mobile Browser-Chrome). Test bei 16:9 Desktop + typischem Handy-Viewport.
- SiteNav-Höhe (`page.tsx`) in 100dvh einrechnen (Hero = `100dvh` minus Nav, oder Nav transparent overlay).

**3.2 — Demo-Visual-Politur:** ConsoleSurface im Hero behalten (interaktiv), aber Inline-Hex weg (1.5), Browser-Frame-Radius an 6px, Schatten dezenter.

**3.3 — Unterer CTA → RepoUrlPill** (`LandingNarrative.tsx:373–391`):
- Sign-in-Button ersetzen durch `<RepoUrlPill size="hero" />`, der `auditAction` triggert (gleicher Flow wie Hero-Demo).
- Headline „Audit dein erstes Repo in unter einer Minute" behalten/schärfen, darunter der Pill + „Kostenlos · ohne Kreditkarte".

**3.4 — Feature-Block-Bilder Hover-Zoom** (`LandingNarrative.tsx:156–202`):
- CSS: `group-hover:scale-[1.04] transition-transform duration-300 ease-out` + sanfterer Schatten. `motion-reduce:` neutralisieren.
- Bild-Container-Radius 6px, `object-top`-Crop enger.

**3.5 — page.tsx:** Reihenfolge bleibt; nur sicherstellen dass Hero 100dvh isoliert steht.

**Verify 3:** Hero = exakt ein Viewport (Desktop+Mobile-Sim), unterer CTA löst Anon-Audit aus, Hover-Zoom smooth, reduced-motion respektiert.

---

## §8 — Bundle 4: Trust / Proof / Screenshots

**4.1 — Fakes raus** (`LandingNarrative.tsx`):
- `LogoStrip` (`:72,74–98`): Fake-Logos (Acme/Globex/…) + Placeholder-Stat „2.400+/18.000+" **entfernen**. Ersatz: ehrliche Proof-Zeile („5 von 6 Audit-Regeln deterministisch · jedes Finding mit `file:line` · Early Access · DACH-B2B").
- Testimonials (`:209–265`): erfundene Personen-Zitate **entfernen**. Ersatz: entweder (a) ehrliche Founder-Note (echt, du) + Produkt-Prinzipien, oder (b) „So sieht der Workflow aus"-Szenario klar als illustrativ. Default = Founder-Note + Prinzipien (kein Fake-Social-Proof).

**4.2 — Trust-Seite** (`trust/page.tsx`): visuell auf neue Tokens (automatisch via §5); Tabellen-Borders Hairline; CCA-Badge-Farbe neutral; Inhalt bleibt (ehrlich, in Scope nur Visual + ggf. Wording-Glättung, kein Rechts-Umbau, N6).

**4.3 — Frische Screenshots (Playwright):** NACH Bundle 1–3 (neue Farben müssen drin sein):
- Dev-Server läuft (`pnpm --filter @vk/web dev`, :3000).
- Via Playwright-MCP: Routen ansteuern, eng croppen, 4 PNGs neu aufnehmen → `public/landing/{intake-pill,audit-finding,konsole,fix-pr}.png` ersetzen.
- Alt-Texte aktualisieren (neue Severity-Sprache).

**Verify 4:** Keine erfundenen Claims mehr · neue Screenshots zeigen 3-Farben-System · Trust-Seite sauber.

---

## §9 — Bundle 5: App-weiter Visual-Sweep

> Token-Änderungen (§5) propagieren automatisch. Dieser Schritt = gezielte visuelle Kontrolle + Aufräumen pro Seite.

Seiten-Checkliste (`apps/web/src/app/`):
- `[workspace]/page.tsx` (Konsole — via §6 erledigt)
- `[workspace]/customers/`, `…/scans/`, `…/repos/[repoId]/`, `…/repos/[repoId]/access/`
- `[workspace]/settings/{members,billing,integrations,ai,danger}/`
- `pricing/`, `trust/`, `legal/{impressum,datenschutz,agb,dpa,subprocessors}/`
- `login/`, Onboarding, `ActivationChecklist`, `CreditMeter`, `WorkspaceSwitcher`

Pro Seite: (1) keine Fremd-Hues mehr (nur rot/orange/grün + Graustufen), (2) Radius 6px greift, (3) Borders 1px solid einheitlich, (4) keine border-2/3px/dashed-Reste, (5) keine Inline-Hex.

Methode: nach Token-Änderung `grep` nach `border-2`, `border-[3px]`, `border-dashed`, `bg-[#`, `text-[#`, `oklch(` außerhalb globals.css, Plan-/Severity-Farb-Fehlnutzung. Treffer einzeln bereinigen.

**Verify 5:** `grep` sauber · `typecheck`+`lint`+`build` grün · Stichproben-QA je Seitengruppe.

---

## §10 — DB-Migration

**Keine.** Rein visuell/Frontend. (Pflicht-Sektion, bewusst leer.)

---

## §11 — Alternativen (erwogen & verworfen)

- **5 Hues behalten, nur abdunkeln** — verworfen: User will explizit ≤3 Farben; löst „bunt"-Gefühl nicht.
- **Nur Kill rot, Rest komplett mono** (R1-Option B) — verworfen: User wählte semantisch −/0/+; mono-Rest verliert die Orange/Grün-Information die er ausdrücklich nannte.
- **Hero als statisches Standbild** (R1-Q2 Option B) — verworfen: interaktives Surface ist der USP post-Galaxie-Retire; User wählte side-by-side mit echtem Surface.
- **Inkrementelles Ship in 5 Bundles** (R3 Recommended) — vom User zugunsten „alles in einem Rutsch" verworfen. **Risiko akzeptiert** (s. §12); ich verifiziere trotzdem nach jedem internen Bundle per typecheck, committe aber als ein zusammenhängender Block.
- **Repo-Pill auch im Hero** (R3 Recommended) — verworfen: User will Hero-Buttons behalten, Pill nur unten.
- **Testimonials nur umtexten** — verworfen: Rechts-/Glaubwürdigkeitsrisiko bleibt; User wählte Fakes-raus.

---

## §12 — Rollout, Risiken & Verification

**Rollout:** Branch `feat/app-visual-overhaul-3color` (nicht main). Ein zusammenhängender Arbeitsblock,
intern in Bundle-Reihenfolge 1→2→3→4→5. Commits logisch je Bundle (für Reviewbarkeit), aber ohne
Zwischen-User-QA (R3-Entscheidung). **Finale** visuelle QA vor Acceptance. Kein Deploy ohne Request.

**Risiken & Mitigation:**
1. **Rot-Grün-Achse / Deuteranopie** (Kill/Weak vs. Strong/Exceptional). Mitigation: Badges tragen
   immer Textlabel (KILL/WEAK/…); Kill zusätzlich gefüllt; Worst-Dot mit aria-label + Zahl. Farbe ist
   redundant, nicht alleinige Information. → akzeptabel.
2. **Regression durch app-weiten Token-Change** (alles-in-einem-Rutsch, kein Zwischen-Ship). Mitigation:
   typecheck nach jedem internen Bundle, `grep`-Sweep (§9), `build` vor Acceptance, Playwright-Stichproben.
3. **Toter Pixi-Code-Removal bricht versteckten Consumer.** Mitigation: typecheck-getriebenes Entfernen
   (nur was 0 Consumer hat), wie bei Galaxie-Retire bewährt.
4. **Screenshots veralten erneut bei späterem Re-Design.** Akzeptiert; Playwright-Methode dokumentiert
   für Reproduzierbarkeit.
5. **`.next/types` stale nach evtl. Route-Touch.** Mitigation: `rm -rf apps/web/.next/types` bei TS2307.
6. **HeroText 100dvh vs. SiteNav-Höhe** Layout-Shift. Mitigation: dvh-Rechnung inkl. Nav, real testen.

**Verification (Acceptance-Gates):**
- [ ] `pnpm --filter @vk/web typecheck` grün
- [ ] `pnpm --filter @vk/web lint` grün
- [ ] `pnpm --filter @vk/web build` grün (Prod-Build)
- [ ] `grep`-Sweep: keine border-2/3px/dashed/Inline-Hex/Fremd-Hue-Reste
- [ ] Hero = exakt 100dvh (Desktop 16:9 + Mobile-Sim)
- [ ] Konsole: nur Repo+Kunde-Gruppierung, Severity+Regel-Filter, Worst-Dot
- [ ] Severity-Badges = Hairline-Pills (nur Kill gefüllt)
- [ ] Unterer CTA löst echtes Anon-Audit aus
- [ ] Keine erfundenen Testimonials/Logos/Stats mehr
- [ ] 4 neue Screenshots zeigen 3-Farben-System
- [ ] Finale visuelle QA durch User

---

## §13 — Execution-Checkliste (Schritt-für-Schritt)

**Bundle 1 — Token/Severity-Core:**
- [ ] 1.1 globals.css `--sev-*` finalisieren (gedämpftes Orange) + `--sev-on-kill` ergänzen
- [ ] 1.2 `--radius` 0.5→0.375rem
- [ ] 1.3 severity-colors.ts: SEVERITY_HEX angleichen + toten Pixi-Code typecheck-getrieben entfernen
- [ ] 1.4 severity-badge.tsx cva → Hairline-Pills (nur Kill gefüllt)
- [ ] 1.5 planColor neutralisieren · Nebula-Gradienten raus · Inline-Hex weg
- [ ] Verify 1 (typecheck+lint)

**Bundle 2 — Konsole:**
- [ ] 2.1 GroupBy → repo|customer · sectionsByRule→Filter · Folder bleibt nested
- [ ] 2.2 SolarListView Render-Switch reduzieren
- [ ] 2.3 Filter-Leiste (Severity-Chips + Regel-Filter)
- [ ] 2.4 HeatBar → SeverityIndicator (Worst-Dot + Kill-Zahl, a11y)
- [ ] 2.5 Sub-Komponenten-Konsistenz
- [ ] Verify 2

**Bundle 3 — Hero/Landing:**
- [ ] 3.1 Hero 100dvh side-by-side/stacked (dvh, Nav-Höhe)
- [ ] 3.2 Demo-Visual-Politur (Radius/Schatten/Hex)
- [ ] 3.3 Unterer CTA → RepoUrlPill (Anon-Audit)
- [ ] 3.4 Feature-Bilder Hover-Zoom (reduced-motion safe)
- [ ] Verify 3

**Bundle 4 — Trust/Proof/Screenshots:**
- [ ] 4.1 Fakes raus (Logos/Stat/Testimonials) → ehrliches Framing
- [ ] 4.2 Trust-Seite visuell + Wording-Glättung
- [ ] 4.3 Playwright: 4 frische Screenshots + Alt-Texte
- [ ] Verify 4

**Bundle 5 — App-Sweep:**
- [ ] 5.1 Seiten-Checkliste durchgehen
- [ ] 5.2 grep-Sweep + Einzel-Bereinigung
- [ ] Verify 5 (typecheck+lint+build+grep)

**Abschluss:**
- [ ] Finale visuelle QA durch User
- [ ] Doku: changelog.md + CLAUDE.md (Severity-Mapping/Radius) + linear-aesthetic.md (Radius-Decision aufgelöst)
- [ ] Plan → `docs/plans/done/`
