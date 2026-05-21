# Plan — Landing Live-Demo · Minimal-Pass + App-Parität

> Erstellt: 2026-05-20
> Status: ✅ Done — 2026-05-20

## 1. Ziel

Die Landing-Live-Demo so umbauen, dass sie **visuell + interaktiv 1:1 mit
einer App-Scan-Page übereinstimmt** und gleichzeitig **minimaler + visuell
gleichmäßiger** wird (einheitliche Section-Rhythmus, Typo-Skala, Border-Tokens,
Komponenten-Heights über alle 4 Bereiche: Hero/Form/Loading/Result + die
unteren Sections HowItWorks/FinalCTA).

## 2. Endzustand

- `apps/web/src/app/page.tsx` rendert `<SiteNav/>` + `<HeroSection/>` +
  `<HowItWorks/>` + `<FinalCTA/>` + Footer. Kein `<HeroCTA/>` mehr.
- **Hero** ist Galaxie-fullbleed (ohne Frame, ohne radial-gradient, ohne
  hardcoded `oklch(0.18_0_0)`-Border). Direkt unter der Galaxie sitzt die
  `RepoUrlForm` als ruhige, breite Bar mit Quick-Pick-Chips.
- Klick auf einen Galaxie-Knoten zeigt rechts den **`RepoInspector`** (selbe
  Component die später in der App-Scan-Page verwendet werden wird → wird zur
  kanonischen Inspector-Komponente promoviert, siehe Schritt 8).
- Form-Submit → `AuditLoadingStage` zeigt **Inspector-Skeleton mit
  `animate-pulse`** (statt eigener 4-Stage-Card). Danach `AuditResultStage`
  zeigt **Header-Card + N Inspector-Style-FindingCards + Blur-Overlay-CTA**
  mit exakt denselben Tokens wie `RepoInspector` (border-border, bg-card,
  rounded-xl, header `border-b border-border px-5 py-4`, body `px-5 py-4
  space-y-5`).
- `HowItWorks` + `FinalCTA` ziehen sich auf einen einheitlichen
  Section-Padding-Takt + Typo-Skala (`type-h2` für Section-Headlines, `type-h1`
  raus, `type-display` nur für Hero und Final-CTA-Closer reserviert).
- Alle hardcoded OKLCH-Borders durch Token-Borders ersetzt.
- Skip-Link + a11y-Findings-List bleiben funktionsfähig.
- Mobile bleibt aus Nova-2 erhalten (`RepoTreeView` + `InspectorMobileSheet`).
- `pnpm --filter @vk/web build` + Typecheck grün.
- Manuell verifiziert in Chrome + Mobile-Viewport: Galaxie spielt, Inspector
  swappt, Form submitiert, Loading-Skeleton zeigt, Result-Cards in identischer
  Optik wie der Live-Inspector.

## 3. Schritte

### A · Discovery + Tokenisierung (Section-Takt + Typo-Skala finalisieren)

- [x] A1 — globals.css Typo-Skala notiert: type-display 36px, type-h1 30px,
  type-h2 20px, type-body 15px, type-body-sm 13px, type-caption 12px,
  type-mono-sm 11px.
- [x] A2 — Section.tsx erweitert mit `size?: "md" | "lg"`-Prop. md = py-16
  (default), lg = py-20 sm:py-24 lg:py-28.
- [x] A3 — ui/skeleton.tsx verifiziert: `animate-pulse rounded-md bg-muted`
  — verwendbar.
- [x] A4 — Hardcode-OKLCH-Audit: HeroSection.tsx Z134/137/139 (Frame).
  Sphere.tsx + HoverTooltip.tsx OKLCH-Werte sind Galaxie-Render-Decorations,
  nicht Chrome — bleiben.

### B · HeroSection → fullbleed Galaxie + integrierter Form-Block

- [x] B1 — Datei: `apps/web/src/components/landing/HeroSection.tsx` —
  **Layout-Umbau**:
  - Wrapper-`<section>` bleibt, aber:
    - Galaxie-Container: keine Border, kein Custom-Gradient, kein
      boxShadow-Inset. Statt `rounded-xl border border-[oklch(...)] p-2/p-4`
      → `relative overflow-hidden bg-background` (Page-Background trägt
      genug Kontrast). Höhe → `h-[70svh] min-h-[560px] lg:h-[78svh]`
      (Vercel-Hero-Anmutung; konkrete Werte beim Execute fine-tunen).
    - Innen-`max-w` außenrum bleibt für Headline + Form, aber die Galaxie
      darf `max-w-none` und volle Breite (mit `mx-auto` aufgehoben durch
      eigenes inneres `<div className="relative">`-Wrapper).
  - Headline + Subheadline bleiben über der Galaxie, aber mit reduzierter
    Vertikal-Spacing (`pt-12 lg:pt-16` statt `py-12/20`).
  - Direkt UNTER der Galaxie (innerhalb derselben `<section>`): ein
    horizontaler Form-Block:
    ```tsx
    <div className="border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-3xl px-6 py-6 sm:px-8">
        <RepoUrlForm ctaLabel="Audit" />
      </div>
    </div>
    ```
    NICHT `position: sticky` (das wäre auf einer Single-Section-Hero
    semantisch falsch und kann mit Scroll-Snap kollidieren). Einfach
    horizontal voll-breit unter der Galaxie. Beim Execute kann der User
    sich für sticky entscheiden, falls er das anders meinte.
- [x] B2 — **Chrome reduzieren**: `<PanHintChip />` aus HeroSection entfernen.
  Den Text-Overlay `<p>Klick Folder → zoomen · ESC → zurück</p>` (HeroSection
  Zeile 164–166) ENTFERNEN. Stattdessen kleines `<HoverTooltip>` an einem
  dezenten `?`-Icon top-right, neben dem GalaxieSettingsPopover (Hint zeigt
  nur on hover/focus). BreadcrumbBar + GalaxieSettingsPopover bleiben.
- [x] B3 — **Grid-Verhältnis prüfen** (auf 7fr_3fr gesetzt, Inspector lg:h-[78svh] matched Galaxie-Höhe): Aktuell `lg:grid-cols-[13fr_7fr]`
  (~65/35). Für ruhigere Optik → `lg:grid-cols-[7fr_3fr]` (~70/30) oder
  `lg:grid-cols-[2fr_1fr]`. Beim Execute visuell entscheiden. Inspector-Min-
  Height (`min-h-[420px]`) auf `min-h-full` setzen, damit er Galaxie-Höhe
  füllt.
- [x] B4 — Aria-Label der Section + Headline-Copy bleiben. Skip-Link bleibt.

### C · HeroCTA-Section killen

- [x] C1 — Datei: `apps/web/src/app/page.tsx` — Import + JSX-Verwendung von
  `<HeroCTA/>` entfernen.
- [x] C2 — Datei: `apps/web/src/components/landing/HeroCTA.tsx` — Löschen.
  Grund: Form lebt jetzt im Hero (Schritt B1), Doppel-h1 raus.

### D · PanHintChip + Permanent-Text-Overlay aufräumen

- [x] D1 — PanHintChip war nur in HeroSection verwendet — gelöscht.
- [x] D2 — HelpCircleIcon mit ui/tooltip (Radix-basiert) als Galaxie-Help-Hint
  top-right, vor dem Settings-Popover. Hint: "Klick Folder → zoomen · Klick
  außerhalb / ESC → zurück".

### E · RepoUrlForm — Quick-Picks als ruhigere Chips + Hero-tauglich

- [x] E1 — Datei: `apps/web/src/components/landing/RepoUrlForm.tsx` —
  Quick-Pick-Buttons (Zeilen 105–117) umbauen zu Chips:
  ```tsx
  <div className="flex flex-wrap items-center gap-2">
    <span className="font-mono type-mono-sm text-muted-foreground">
      Beispiele
    </span>
    {QUICK_PICKS.map((pick) => (
      <button
        key={pick}
        type="button"
        onClick={() => setValue(`github.com/${pick}`)}
        className="inline-flex h-7 items-center rounded-md border border-border bg-background px-2.5 font-mono type-mono-sm text-foreground/80 hover:bg-muted/40 hover:text-foreground transition-colors"
      >
        {pick}
      </button>
    ))}
  </div>
  ```
- [x] E2 — Form bleibt h-12-konsistent, keine Layout-Änderung.
- [x] E3 — Error-Banner bleibt.

### F · AuditLoadingStage → Inspector-Skeleton

- [x] F1 — Datei: `apps/web/src/components/landing/AuditLoadingStage.tsx` —
  **Komplett ersetzt** mit Inspector-Skeleton: ein Mini-Inspector-Skeleton,
  das visuell exakt zum `RepoInspector`-Layout passt. Stages-Logik (Cloning
  → Parsing → Audit → Building) bleibt als kleines `aria-live="polite"`
  Status-Text-Trio im Header-Bereich des Skeletons sichtbar (oder als unsichtbarer
  SR-only-Live-Region — Decision beim Execute).
  
  Struktur:
  ```tsx
  <div className="mx-auto max-w-3xl space-y-3 text-left">
    {/* header card skeleton — repo + stats */}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1 text-right">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
    
    {/* finding card skeletons — N=3 */}
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-2">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-5 flex-1 max-w-[60%]" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
      </div>
    ))}
    
    {/* live-region status (visible, mono, subdued) */}
    <p
      aria-live="polite"
      className="flex items-center gap-2 px-1 font-mono type-mono-sm text-muted-foreground"
    >
      <Loader2Icon className="size-3.5 animate-spin" aria-hidden="true" />
      {currentStageLabel}
      <AnimatedDots />
    </p>
  </div>
  ```
- [x] F2 — Stage-Timing + isLongRun-Hint bleibt. Stage-Label fließt in
  Live-Region.
- [x] F3 — Imports korrekt.

### G · AuditResultStage → Inspector-Style 1:1

- [x] G1 — Datei: `apps/web/src/components/landing/AuditResultStage.tsx` —
  FindingCard mit border-b header (px-5 py-4) + Body (px-5 py-4 space-y-3),
  rounded-xl overflow-hidden Shell:
  - Outer: `rounded-xl border border-border bg-card overflow-hidden`
  - Header-Sub-Section: `border-b border-border px-5 py-4` mit
    SeverityBadge + h3 (`type-h2`) + Mono-Category-Badge rechts
  - Body: `px-5 py-4 space-y-3` mit detail-text (`type-body text-foreground/85`)
    + Citations-Chips
  Das Padding-System (`px-5 py-4`) ist identisch mit RepoInspector. Statt
  der bisherigen flachen `p-4`-Card haben wir jetzt ein Header/Body-Pattern.
- [x] G2 — Header-Card auf rounded-xl + overflow-hidden + inner px-5 py-4
  umgestellt. Stats gap-4 + flex-col items-end.
- [x] G3 — Blur-Overlay strukturell unverändert; nur outer-spacing
  (`space-y-3` statt `space-y-6` für engere Card-Card-Rhythmik).
- [x] G4 — Default gewählt: Nur Header + FindingCards + CTA. Galaxie-im-
  Result ist Folge-Sprint, Open Question 7.1 wird in §7 belassen.

### H · BlurOverlayCTA — Token-Bürste

- [x] H1 — Verifiziert: BlurOverlayCTA verwendet bereits `rounded-xl
  border-border bg-card`, `type-h2`, `type-body-sm`, `font-mono type-mono-sm`,
  `shadow-lg`. Keine Hardcodes. Keine Änderung.

### I · HowItWorks — Konsistenz-Pass

- [x] I1 — **Abweichung vom Plan**: Section-Headline bleibt `type-h1` (30px),
  NICHT type-h2 (20px). Begründung: 3-stufige Hierarchie wird klarer
  (Hero/FinalCTA `type-display` 36px > Section `type-h1` 30px > Card-Headline
  `type-h2` 20px). type-h2 als Section-Headline wäre visuell zu klein.
  - Eyebrow bleibt (gutes Pattern).
  - Number-Circle border auf `border-border/60` für Sub-Tier-Hierarchie.
  - `space-y-12` bleibt.
- [x] I2 — Section.tsx hat jetzt `size="lg"`-Prop (Schritt A2 implementiert).
  HowItWorks und FinalCTA verwenden `size="lg"`. Default bleibt md (für
  Sub-Sections; aktuell keine im Einsatz).

### J · FinalCTA — Konsistenz-Pass

- [x] J1 — type-display bleibt (Closer-Symmetrie). Subheadline auf
  Scroll-Kontext angepasst ("Du bist runtergescrollt — also probier's…").
  size="lg" für einheitlichen Padding-Takt mit HowItWorks.
- [x] J2 — Auto-Scroll nicht implementiert (Default beibehalten,
  Open Question 7.2 bleibt offen für Folge-Sprint).

### K · Build + Typecheck + Manuelle Verifikation

- [x] K1 — `pnpm --filter @vk/web typecheck` ✅ grün (nach Fix: nullish
  fallback für `STAGES[currentIdx]`).
- [x] K2 — `pnpm --filter @vk/web build` ✅ grün.
- [x] K3 — `pnpm --filter @vk/web dev` läuft im Background — User verifiziert
  visuell auf `localhost:3000`:
  - Hero-Galaxie spielt ohne Frame
  - Click auf Knoten → Inspector swappt rechts
  - Form-Submit → Inspector-Skeleton sichtbar
  - Audit-Result zeigt Cards in Inspector-Optik
  - Scroll → HowItWorks + FinalCTA in einheitlichem Rhythmus
  - Mobile-Viewport (Chrome DevTools, 375px): RepoTreeView + Bottom-Sheet
  - Lighthouse a11y > 95 (aus Nova-2 Setup)

## 4. Files-to-Change

| Datei | Was passiert |
|-------|--------------|
| `apps/web/src/app/page.tsx` | `<HeroCTA/>` Import + JSX raus |
| `apps/web/src/components/landing/HeroSection.tsx` | Frame raus, Form integrieren, Chrome reduzieren (PanHintChip + Text-Overlay raus), Grid-Verhältnis polishen |
| `apps/web/src/components/landing/HeroCTA.tsx` | **DELETE** |
| `apps/web/src/components/landing/PanHintChip.tsx` | **DELETE** (falls nur Hero-verwendet) oder zu HoverTooltip umbauen |
| `apps/web/src/components/landing/RepoUrlForm.tsx` | Quick-Picks als neutral-bordered Chips |
| `apps/web/src/components/landing/AuditLoadingStage.tsx` | Komplett ersetzen durch Inspector-Skeleton (`<Skeleton>`-Bars) |
| `apps/web/src/components/landing/AuditResultStage.tsx` | FindingCard + Header-Card auf Inspector-Token-System (border-b header, px-5 py-4 body) |
| `apps/web/src/components/landing/BlurOverlayCTA.tsx` | Token-Audit, ggf. Border/BG-Klassen normalisieren |
| `apps/web/src/components/landing/HowItWorks.tsx` | type-h1 → type-h2, Konsistenz-Pass |
| `apps/web/src/components/landing/FinalCTA.tsx` | Padding-Harmonisierung |
| `apps/web/src/components/landing/Section.tsx` | Optional `size?: "lg" \| "md"`-Prop für Top-Level-vs-Sub-Sections |

## 5. Test-Plan

### Manuell

- Dev-Server starten: `pnpm --filter @vk/web dev`
- Browser-Reise (Chrome):
  1. `localhost:3000` öffnen → Hero zeigt Headline + Galaxie fullbleed + Form
     darunter (KEINE Doppel-Section "Audit dein eigenes Repo")
  2. Galaxie-Knoten klicken → Inspector rechts swappt mit
     SeverityBadge-Animation
  3. Settings-Popover öffnen → Galaxie-Settings funktionieren
  4. Form mit `github.com/anthropics/anthropic-sdk-python` submitten →
     Inspector-Skeleton zeigt ~30s lang animate-pulse-Bars + Stage-Mono-Text
  5. Nach Backend-Return → AuditResultStage zeigt 2 Findings sichtbar +
     hidden Findings hinter Blur + CTA — alle Cards mit IDENTISCHEN Tokens
     wie der Hero-Inspector
  6. Scroll runter → HowItWorks (3 Steps) + FinalCTA (zweiter Form-Try) +
     Footer in einheitlichem Rhythmus
- Mobile-Viewport (375px DevTools):
  1. Hero zeigt RepoTreeView (Accordion) statt Galaxie
  2. Tap auf Finding-Eintrag → InspectorMobileSheet öffnet von unten
  3. Form unter der Tree-View funktioniert
- Reduced-Motion (System-Setting an):
  1. Galaxie-Pan-Animationen deaktiviert
  2. Skeleton-Pulse weiterhin (motion/react MotionConfig setzt nur framer
     transitions, nicht CSS-Animationen)
- Keyboard-Only (TAB-Reise):
  1. Skip-Link erscheint beim ersten TAB
  2. Settings-Popover via Enter erreichbar
  3. Findings-List a11y-Fallback via Skip-Link erreichbar

### Automatisch

- `pnpm --filter @vk/web typecheck` — grün
- `pnpm --filter @vk/web build` — grün
- Lighthouse-CI (Phase Nova-2 Setup): Perf > 85, A11y > 95, BP > 95
  (Befehl: `apps/web/scripts/lighthouse-audit.sh`)
- Falls Playwright-A11y-Suite aus `nova-2-a11y-deep-sweep.md` schon
  implementiert: laufen lassen.

## 6. Risiken + Rollback

### Risiken

- **R1 — Inspector wird konzeptionell zur "Shared App-Komponente", lebt aber
  in `/components/landing/`.** Solange die App-Scan-Page noch keinen Inspector
  zeigt (aktuell Stub mit `<ReportView>`), bleibt das Verzeichnis ok. Wenn
  die App-Scan-Page in einem Folge-Sprint Inspector + Galaxie bekommt, sollte
  `RepoInspector` nach `/components/` (ohne `landing/`-Prefix) umziehen.
  → **In diesem Plan: lassen. Open Question 7.3 für Folge-Sprint.**
- **R2 — Form-Bar unter Galaxie statt sticky-bottom**: User-Antwort war
  "sticky-bottom-bar". Plan-Default ist statisch-unter-Galaxie (kein
  position:sticky), weil sticky bei Single-Section-Hero semantisch
  problematisch ist (Form bleibt am Viewport-Bottom, auch beim Hero-Scroll
  überlappt sie Galaxie-Bottom). Beim Execute entscheiden:
  - Option A — statisch unter Galaxie (Default).
  - Option B — `position: sticky; bottom: 0;` mit `bg-background/95
    backdrop-blur border-t border-border` Form. Funktioniert visuell wie
    Vercel's Search-Bar, aber blockiert ~60px Galaxie-Bottom.
  - **Open Question 7.4** — finale Wahl beim Execute mit visuellem A/B.
- **R3 — `<RepoUrlForm>` lebt zweimal (Hero + FinalCTA)**. Jede Instance
  hat eigenen `useActionState`-State. Ein Submit oben + Scroll-runter +
  Submit unten würden zwei parallele Audits triggern. Aktuell akzeptabel
  (Backend rate-limited via auditAction); kein blocker.
- **R4 — Inspector-Skeleton-Loading dauert visuell wie "echtes Loading"
  aber zeigt KEINE realen Stages**. User sagte "App-Skeleton" → das ist
  exakt was er will (kein Edukations-Stage-Display mehr). Live-Region zeigt
  Stage-Text trotzdem für a11y.
- **R5 — Token-Bürste auf alle Komponenten** kann visuelle Regressions
  haben (Card-Hierarchie verschwimmt, wenn `border-border` überall gleich).
  → Mitigation: `border-border/60` für sub-tier Cards (Stat-Pills,
  Diff-Inner-Box) statt full `border-border`.

### Rollback

- Reine Frontend-Änderung. Kein DB-Migrationspfad.
- Rollback: `git checkout main -- apps/web/src/components/landing/
  apps/web/src/app/page.tsx`
- Falls Skeleton-Komponente neu wäre: hier nicht der Fall, `ui/skeleton.tsx`
  existiert schon.

## 7. Open Questions

- **7.1** — AuditResultStage: nur Findings-Liste (Plan-Default) oder
  zusätzlich Mini-Galaxie oben drüber mit demo-data des gerade auditierten
  Repos? Falls ja → eigener Folge-Sprint, in diesem Plan nicht. Bestätigen
  beim Execute.
- **7.2** — Nach FinalCTA-Form-Submit: User auto-scrollen zur Result-Card
  oder am Bottom bleiben? Default: nichts ändern.
- **7.3** — `RepoInspector` aus `/components/landing/` rausziehen nach
  `/components/`? Eher Folge-Sprint, wenn App-Scan-Page Inspector bekommt.
- **7.4** — Form-Bar Position: statisch-unter-Galaxie (Default) vs.
  `position: sticky` Vercel-Style. Beim Execute visuell A/B.
- **7.5** — `RepoUrlForm` braucht eventuell unterschiedliche Defaults
  zwischen Hero-Use und FinalCTA-Use (`ctaLabel`, Quick-Picks ein/aus).
  Default: identisch lassen, beim Execute entscheiden.

---

**Slug:** `landing-livedemo-minimal-pass`
**Execute mit:** `/execute landing-livedemo-minimal-pass`
