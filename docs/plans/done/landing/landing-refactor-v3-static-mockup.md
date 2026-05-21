# Plan — Landing-Refactor v3 (Statisches App-Mockup, kein PixiJS, kein Karussell)

> Erstellt: 2026-05-19
> Status: ✅ Done — 2026-05-19. Code-Complete. Typecheck ✓ · Test 74/74 ✓ · Eval 34/34 ✓ · Build ✓. Manuelle Browser-/Mobile-/Lighthouse-Tests (QA5-QA12) stehen User-side aus.
> Scope: Public-Landing-Page (`/`) — komplett-Replace der heutigen `<LandingHero>`-Komposition. App-Area (`/[workspace]/*`) bleibt unangetastet.
> Bezug zu Vorgänger-Plänen: Revidiert die Landing-Sections von `homepage-relaunch.md` (🟢 Code Complete) und `frontend-relaunch-v2.md` (🟢 Code Complete). Behält Theme/Severity-Hue/Inspector-Portal/Mobile-a11y aus v2, entfernt Auto-Tour + PixiJS + Multi-Demo-Karussell von der Landing.

---

## Kontext-Snapshot

Sieben Sub-Agents (4 Code-Audit + 3 Web-Research) wurden parallel losgeschickt. Kernbefunde:

### Was heute fehlerhaft ist
- **Pulse-Animation 100% missing**: `severity-colors.ts:53-59` definiert `SEVERITY_PULSE_RATE` (Kill=1.8Hz, Weak=1.0Hz), aber kein Code nutzt die Konstante. Sprites sehen "tot" aus.
- **Container-Inkonsistenz**: `page.tsx:18` setzt `max-w-3xl` auf Anonymous-Audit-Section, während Hero/Nav/Footer `max-w-6xl` nutzen. Sichtbarer Bruch.
- **Root-Layout ohne Constraints**: `layout.tsx:38` ist nur `font-sans antialiased`. Jede Page implementiert eigenes `mx-auto max-w-*` — Fehlerquelle für "komische Ränder".
- **Border-Radius-Wildwuchs**: 33× `rounded-md`, 18× `rounded-lg`, 7× `rounded-xl` codebase-weit. Kein Konsens.
- **Type-Mix**: `LandingHero.tsx:23` nutzt `text-3xl` statt `type-h1`-Token. Type-Skala existiert (globals.css:131-164) aber wird inkonsistent genutzt.
- **Auto-Tour irritiert**: v2-Plan T3-T7 hat Auto-Tour als "selbsterklärende Live-Demo" implementiert. User-Feedback nach Test: "Animation funktioniert nicht zuverlässig" + "Wahl unterschiedlicher Repositories brauchen wir nicht".

### Was aus den Vorgängerplänen BEHALTEN wird
- Pure-Monochrome-Tokens (v2 M1)
- Severity-Hue 3-Stufen-Ampel (v2 M2-M3)
- Inspector via `createPortal` + `position: fixed` (v2 F3-F4) — aber für die Landing wird ein **eigenständiges, embedded Inspector-Mockup** verwendet, nicht das App-Inspector-Portal
- Hit-Area-Expansion-Pattern (v2 F1) — adaptiert für SVG-Asteroiden
- Viewport-Meta + SkipToContent + prefers-reduced-motion + :focus-visible (v2 A1-A6)
- Typography-Scale `.type-display`/`.type-h1`/`.type-body`/`.type-mono-sm` (v2 TY1)
- Empty/Error-Icon-Pattern (v2 E1)
- Loading-States (v2 L1-L6)

### Was REVIDIERT wird (v2 → v3 für Landing)
- v2 T3-T7 Auto-Tour: Code bleibt in `GalaxieScene.tsx` (für `/[workspace]/*` möglich) aber **`enableAutoTour`-Prop wird auf Landing nicht mehr gesetzt** — und Landing rendert sowieso keine `GalaxieScene` mehr.
- v2 R1-R6 Repo-Input-Section direkt unter Galaxie: bleibt **konzeptuell**, wandert aber in einen anderen Seitenbereich (siehe §3.2).
- v1 L1-L4 LandingDemoCards-Karussell: **wird gelöscht**.
- v1 L1 LandingGalaxie-PixiJS-Wrapper auf Landing: **wird gelöscht**.

### User-Entscheidungen (zwei AskUserQuestion-Runden, 2026-05-19)

Runde 1 (strategische Achsen):
- **Hero-Demo**: kein Auto-Tour, kein "durchscrollen". Statt dessen statisch-aufgeklapptes App-Mockup, das die App-Wirklichkeit in einem Bild zeigt.
- **Repo-Input**: echtes Audit + blurred Result + Magic-Link inline (Greptile-Style Wedge).
- **Layout**: Edge-to-edge Hero + max-w-7xl Sections darunter.
- **Sprint-Schnitt**: zwei Sprints — Sprint 1 = Landing-UI + Cleanup; Sprint 2 = Animation-Fix (App-Area) + Result-Wall + Magic-Link.

Runde 2 (Implementation-Details):
- **Hero-Visual**: Single-Mond (Repo) statisch mit ~6 File-Asteroiden + Verbindungslinien, 1 Asteroid pulsiert orange (Mid), Inspector-Panel rechts aufgeklappt mit konkretem Finding.
- **Demo-Finding-Story**: AGENTS.md ↔ CLAUDE.md Sprach-Konflikt — Agency-Lena versteht das in 3s.
- **Cleanup**: aggressives Refactor — löschen + neu, parallel-halten nicht.

---

## 1. Ziel

`/` zeigt nach Execute einen **statisch-aufgeklappten App-Mockup-Hero**: links ein Single-Repo-SVG-Mockup mit klickbaren Asteroiden, rechts ein permanent sichtbares Inspector-Panel mit einem konkreten AGENTS.md↔CLAUDE.md-Finding und "Fix via PR"-Button — die App erklärt sich durch genau ein Beispiel, ohne Auto-Tour, ohne Karussell.

---

## 2. Endzustand

**UI/Verhalten** (`/`):
- Floating SiteNav (sticky, blur-background, max-w-7xl)
- Hero **edge-to-edge 100vh** mit zweigeteiltem Layout:
  - **Linke Hälfte (60%, Desktop)**: SVG-Mockup eines fiktiven Repos "acme-fintech/payments-api"
    - 1 zentraler Repo-Mond
    - ~6 File-Asteroiden mit dünnen Verbindungslinien zum Mond
    - 1 Asteroid pulsiert orange via CSS-Keyframes (Severity: Mid)
    - 2 weitere Asteroiden sind klickbar (haben eigene Findings)
    - Hit-Area 44×44 (WCAG-konform) auch wenn Visual kleiner
  - **Rechte Hälfte (40%, Desktop)**: Inspector-Panel statisch sichtbar (kein Slide-in)
    - Active Finding: AGENTS.md↔CLAUDE.md-Sprach-Konflikt (Default beim Page-Load)
    - File-Pfad als Mono-Text
    - Diff-Preview (Vorher/Nachher)
    - Severity-Badge "Mid" (Orange)
    - "Fix via PR"-Button → öffnet Sign-Up-Tease-Dialog (shadcn Dialog)
    - Click auf einen anderen Asteroid → Inspector-Content switcht zu jenem Finding (useState)
  - **Mobile**: Mockup oben (50vh), Inspector darunter (50vh, scrollbar)
- **CTA-Block** (unter Hero, eigene Section): GitHub-URL-Input + "Audit dein Repo →"-Button
  - In Sprint 1: redirected zu `/login?intent=audit&repo=<encoded>` (echte Audit-Anbindung kommt in Sprint 2)
- **Section: How-it-works** (3 Steps, max-w-7xl)
- **Section: Final-CTA** (Wiederholung des URL-Inputs, max-w-7xl)
- **Footer** (1-Zeile, minimal, max-w-7xl)

**Code-Pfade**:
- `apps/web/src/app/page.tsx` ist 30-40 Zeilen, importiert nur neue Landing-Komponenten + SiteNav + Footer
- `apps/web/src/components/landing/LandingHero.tsx`, `LandingGalaxie.tsx`, `LandingDemoCards.tsx` sind **gelöscht**
- `apps/web/src/components/landing/HeroMockup.tsx`, `HeroInspector.tsx`, `HeroCTA.tsx`, `HowItWorks.tsx`, `FinalCTA.tsx`, `SignUpTeaseDialog.tsx` sind **neu**
- `apps/web/src/lib/landing/demo-finding.ts` ist **neu** (3 hardcodete Findings als Mock-Daten)
- `apps/web/src/lib/landing/demo-workspaces.ts` wird gelöscht (war Multi-Workspace-Karussell-Datenbasis)
- `apps/web/src/components/SiteNav.tsx` ist refactored (max-w-7xl, sticky+blur, kein eigener `mx-auto`-Container mehr)
- `apps/web/src/components/AuditForm.tsx` Komponente bleibt für Sprint 2, ist aber nicht mehr in `page.tsx` referenziert
- Keine PixiJS-/GSAP-Imports mehr im Landing-Bundle

**Tests grün**:
- `pnpm -w typecheck` ✅
- `pnpm -w test` ✅
- `pnpm --filter @vk/web build` ✅
- Manueller Browser-Smoke: Hero rendert edge-to-edge, Asteroiden-Click switcht Inspector-Finding, Fix-via-PR-Button öffnet Dialog, URL-Input redirected zu `/login`.

---

## 3. Detail-Specs

### 3.1 Hero-Layout (ASCII-Wireframe Desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ValidationKit                          Pricing  Trust  [Sign in →]   │ ← SiteNav floating, blur
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Audit every repo your agency ships.                                │ ← type-display
│   Severity-Hotspots, Zero-Code-Apply, kein Vibe-Score.               │ ← type-body
│                                                                      │
│   ┌───────────────────────────┐  ┌────────────────────────────────┐  │
│   │                           │  │  acme-fintech/payments-api     │  │
│   │      ●                    │  │  ─────────────────────────────  │  │
│   │     ╱│╲                   │  │  ⚠ AGENTS.md ↔ CLAUDE.md       │  │
│   │    ● │ ●  ← Verbindungen  │  │     Sprach-Konflikt    [Mid]   │  │
│   │   ╱  │  ╲                 │  │                                │  │
│   │  ●   ●   ◉ ← pulsing      │  │  agents/skills/code-review.md  │  │
│   │   ╲  │  ╱                 │  │  ───────────────────────────── │  │
│   │    ● │ ●                  │  │  - Respond in English          │  │
│   │      ╲│                   │  │  + Antworte auf Deutsch        │  │
│   │       ●                   │  │                                │  │
│   │                           │  │  ┌───────────────────────────┐ │  │
│   │  acme-fintech/payments-api│  │  │ Fix via PR  →             │ │  │
│   │  6 files · 3 findings     │  │  └───────────────────────────┘ │  │
│   └───────────────────────────┘  └────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│   Audit dein eigenes Repo                                            │ ← Section 2: HeroCTA
│   ┌────────────────────────────────────────────┐  ┌──────────────┐   │
│   │ github.com/owner/repo                      │  │ Audit  →     │   │
│   └────────────────────────────────────────────┘  └──────────────┘   │
│   Beispiele: anthropics/cookbook · vercel/next.js · shadcn-ui/ui     │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│   So funktioniert's                                                  │ ← Section 3: HowItWorks
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                        │
│   │ 1. Paste │ → │ 2. Audit │ → │ 3. Apply │                        │
│   │ Repo URL │   │ Findings │   │ via PR   │                        │
│   └──────────┘   └──────────┘   └──────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│   Audit your first repo free.                                        │ ← Section 4: FinalCTA
│   ┌────────────────────────────────────────────┐  ┌──────────────┐   │
│   │ github.com/owner/repo                      │  │ Audit  →     │   │
│   └────────────────────────────────────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│   ValidationKit · Pricing · Trust · GitHub                  Status ● │ ← Footer 1-Zeile
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 HeroMockup (SVG, klickbar, CSS-Pulse)

Komponente: `apps/web/src/components/landing/HeroMockup.tsx`

- Reine SVG-Komposition, kein Canvas, kein PixiJS
- Layout: 1 zentraler Repo-Mond (großer Kreis, gefüllt mit `var(--card)`, Border `var(--border)`), ~6 File-Asteroiden (kleine Kreise) gleichmäßig drumrum positioniert, Verbindungslinien als `<line>` mit `stroke="var(--border)"` und `stroke-width="1"`
- 1 Asteroid hat CSS-Klasse `.asteroid-pulse-mid` mit Keyframe-Animation (1s ease-in-out infinite, scale 0.95 ↔ 1.15, opacity 0.7 ↔ 1.0, fill auf `var(--sev-mid)`)
- 3 Asteroiden sind `eventMode`-klickbar via React `onClick` auf dem SVG-Sub-Element, mit unsichtbarem 44×44 `<rect>`-Overlay für Hit-Area-Expansion (WCAG)
- Props: `activeFindingId: string`, `onAsteroidClick: (findingId: string) => void`
- Repo-Label "acme-fintech/payments-api" + "6 files · 3 findings" als `<text>` unten im SVG
- ARIA: `<svg role="img" aria-label="Demo repository visualization with 3 findings">`, klickbare Elements bekommen `role="button"` + `aria-label`
- prefers-reduced-motion → Pulse-Animation aus (über `@media (prefers-reduced-motion: reduce)` in `globals.css`)

### 3.3 HeroInspector (statisch sichtbar, kein Slide-in)

Komponente: `apps/web/src/components/landing/HeroInspector.tsx`

- **Eigenständige Komponente** — nicht das App-Inspector via Portal. Hier ist es ein normales, statisches Element im Flow rechts neben dem Mockup.
- Layout: Card mit Border, Padding, abgerundet (`rounded-xl`)
- Inhalt (von `demo-finding.ts` gesteuert):
  - Repo-Header: "acme-fintech/payments-api" als type-h2 mono
  - Finding-Title mit Icon (lucide `AlertTriangle`) + SeverityBadge
  - File-Pfad als `<code className="type-mono-sm">`
  - Diff-Preview (zwei Zeilen, Tailwind-Klassen `text-[var(--color-sev-kill)]` für `-` und `text-[var(--color-sev-strong)]` für `+`)
  - Optional: Conflict-Beschreibung als 1-Satz-Erklärung
  - Primary-Button "Fix via PR →" am Ende
- Props: `activeFinding: DemoFinding`, `onFixClick: () => void`
- Click auf "Fix via PR" → öffnet `SignUpTeaseDialog`

### 3.4 SignUpTeaseDialog

Komponente: `apps/web/src/components/landing/SignUpTeaseDialog.tsx`

- Basiert auf shadcn Dialog (existiert bereits in `components/ui/dialog.tsx`)
- Inhalt:
  - Header: "Bereit den Fix zu senden?"
  - Body: "Sign in to apply via PR — wir machen den Branch + Commit + PR-Body für dich."
  - Email-Input (Magic-Link via Better-Auth — vorhandener Sign-In-Flow)
  - "Send magic link"-Button → triggert `signIn.magicLink({ email })` (siehe `LoginForm.tsx` Pattern)
  - Sekundär-Link: "Lieber zuerst die ganze Tour →" → führt zu `/login` mit Marketing-Variante
- Verbinden mit existierender Better-Auth-Magic-Link-Integration

### 3.5 HeroCTA (Section 2: Repo-Input)

Komponente: `apps/web/src/components/landing/HeroCTA.tsx`

- Section unter dem Hero, max-w-7xl, `py-16`
- H2 "Audit dein eigenes Repo" (`type-h1`)
- Sub-Copy: "Audit in ~30s. Public-Repos. Anmelden für Full-Report." (`type-body`)
- Form:
  - Single Input (groß, h-12, `border border-input bg-input/30 rounded-lg`)
  - Placeholder rotiert (`useState` + `useEffect` interval): "github.com/vercel/next.js", "github.com/anthropics/anthropic-sdk-python", "github.com/shadcn-ui/ui"
  - Submit-Button daneben: "Audit →"
  - Submit-Handler in Sprint 1: `router.push(`/login?intent=audit&repo=${encodeURIComponent(value)}`)`
  - **Out-of-Scope für Sprint 1**: echtes Audit + Result-Wall + Magic-Link inline (Sprint 2)
- Quick-Pick-Links unter dem Input (3 Beispiele als Anchor-Links, die das Input prefillen)

### 3.6 HowItWorks (Section 3)

Komponente: `apps/web/src/components/landing/HowItWorks.tsx`

- 3 Tiles in Grid (`grid-cols-1 md:grid-cols-3 gap-8`)
- Pro Tile: Number-Badge (1, 2, 3) + H3 + Sub-Copy
  - "1. Paste Repo URL" — "Public-GitHub-URL, kein OAuth."
  - "2. Severity-Hotspots" — "Audit-Findings nach Severity (Kill, Weak, Mid, Strong, Exceptional)."
  - "3. Apply via PR" — "Zero-Code-Fix als GitHub-PR."
- Optional kleine Icons (lucide) pro Tile
- max-w-7xl, `py-16`

### 3.7 FinalCTA (Section 4)

Komponente: `apps/web/src/components/landing/FinalCTA.tsx`

- Wiederholung von HeroCTA mit anderer Headline: "Audit your first repo free."
- Selber Input + Button (kann via Prop oder gemeinsamer Sub-Komponente teilen)
- max-w-7xl, `py-20`

### 3.8 Demo-Finding-Story (Mock-Daten)

Datei: `apps/web/src/lib/landing/demo-finding.ts`

```ts
export type DemoFinding = {
  id: string;
  file: string;
  title: string;
  severity: 'kill' | 'weak' | 'mid' | 'strong' | 'exceptional';
  diffBefore: string;
  diffAfter: string;
  explanation: string;
};

export const DEMO_REPO = {
  slug: 'acme-fintech/payments-api',
  fileCount: 6,
  findingCount: 3,
};

export const DEMO_FINDINGS: DemoFinding[] = [
  {
    id: 'agents-claude-language',
    file: 'agents/skills/code-review.md',
    title: 'AGENTS.md ↔ CLAUDE.md Sprach-Konflikt',
    severity: 'mid',
    diffBefore: '- Respond in English to all code reviews',
    diffAfter: '+ Antworte auf Deutsch (Default Workspace-Sprache)',
    explanation: 'AGENTS.md erzwingt Englisch, CLAUDE.md erzwingt Deutsch — die KI bekommt widersprüchliche Anweisungen.',
  },
  // 2 weitere Findings ähnlicher Struktur
];

export const DEFAULT_FINDING_ID = 'agents-claude-language';
```

Komponente speichert `activeFindingId` in `useState`, default = `DEFAULT_FINDING_ID`. Click auf Asteroid switcht Finding.

### 3.9 Root-Layout: Container-System

Datei: `apps/web/src/app/layout.tsx`

- Body bleibt `font-sans antialiased` (kein globales `max-w-*`!)
- **Begründung**: Hero soll edge-to-edge sein, das geht nur wenn das Root-Layout nicht zentriert. Sections darunter setzen selbst `max-w-7xl` über eine wiederverwendbare `<Section>`-Wrapper-Komponente (siehe §3.10).

### 3.10 Section-Wrapper (neues Pattern)

Datei: `apps/web/src/components/landing/Section.tsx` (oder direkt inline in HowItWorks/FinalCTA)

- Reine Layout-Komponente: `<section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8">`
- Verhindert die `max-w-3xl` vs `max-w-6xl`-Inkonsistenz von vorher
- Kann in HowItWorks, HeroCTA, FinalCTA, Footer wiederverwendet werden

### 3.11 SiteNav-Refactor

Datei: `apps/web/src/components/SiteNav.tsx`

- Existierende Nav bleibt funktional, wird leicht angepasst:
  - Container von `max-w-6xl` auf `max-w-7xl` umstellen
  - Position: `sticky top-0 z-40` (falls noch nicht so)
  - Background: `backdrop-blur-md bg-background/80 border-b border-border/40`
  - Items bleiben: ValidationKit-Logo links, {Pricing, Trust} mittig, {Login/Workspace-Switcher} rechts
- **WICHTIG**: SiteNav wird in 16+ Routes verwendet (App-Area + Trust + Pricing + Billing + Status). Refactor muss diese nicht brechen. Tests dafür im Test-Plan.

### 3.12 Footer-Refactor

In `page.tsx` direkt (kein eigenes Component nötig), 1-Zeile:

```tsx
<footer className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 type-mono-sm text-muted-foreground">
  <div>© 2026 ValidationKit</div>
  <div className="flex gap-6">
    <Link href="/pricing">Pricing</Link>
    <Link href="/trust">Trust</Link>
    <Link href="https://github.com/...">GitHub</Link>
    <Link href="/status">Status ●</Link>
  </div>
</footer>
```

---

## 4. Schritte

Sortiert nach Reihenfolge. `/execute` arbeitet die Boxen sequentiell ab.

### Phase 1 — Mock-Data + Section-Wrapper

- [x] **D1** Datei `apps/web/src/lib/landing/demo-finding.ts` angelegt mit `DemoFinding`-Type, `DEMO_REPO`, `DEMO_FINDINGS` (3 Findings: Mid AGENTS↔CLAUDE-Sprache als Default, Weak Skill-Registry-Inkonsistenz, Kill Tool-Permissions-Conflict), `DEFAULT_FINDING_ID`.
- [x] **D2** Datei `apps/web/src/components/landing/Section.tsx` angelegt — Layout-Wrapper mit `max-w-7xl px-6 py-16 sm:px-8`.

### Phase 2 — HeroMockup (SVG)

- [x] **H1** `apps/web/src/components/landing/HeroMockup.tsx` angelegt.
- [x] **H2** SVG-Komposition: 1 zentraler Repo-Mond (radius 70) mit Repo-Label, 6 File-Asteroiden auf einem Hexagon (radius 195) mit Verbindungslinien zum Zentrum.
- [x] **H3** CSS-Keyframe `@keyframes asteroid-pulse` in `globals.css` definiert (1.6s ease-in-out infinite, scale 1↔1.18, opacity 0.85↔1).
- [x] **H4** Active Asteroid (via `activeFindingId`-Prop) bekommt `.asteroid-pulse`-Klasse — Severity-Farbe via `fill`-Attribut.
- [x] **H5** Click-Hit-Area: unsichtbare `<rect width=44 height=44>` (WCAG 2.5.5) mit `role="button"` + `aria-label` + Keyboard-Support (Enter/Space).
- [x] **H6** prefers-reduced-motion ist im globals.css `*`-Override schon abgedeckt (animation-duration 0.01ms).
- [x] **H7** Props-Interface: `{ activeFindingId: string, onAsteroidClick: (id: string) => void }`.

### Phase 3 — HeroInspector (statisches Panel)

- [x] **I1** `apps/web/src/components/landing/HeroInspector.tsx` angelegt.
- [x] **I2** Card-Layout: `rounded-xl border border-border bg-card p-6 shadow-sm`.
- [x] **I3** Repo-Header: `DEMO_REPO.slug` + Stats (`6 files · 3 findings`) in `font-mono type-body-sm` / `type-mono-sm`.
- [x] **I4** Finding-Title mit `AlertTriangleIcon` (in Severity-Farbe) + `<SeverityBadge>`.
- [x] **I5** File-Pfad als `<code className="font-mono type-mono-sm text-muted-foreground">`.
- [x] **I6** Diff-Preview: `-`-Zeilen in `var(--color-sev-kill)`, `+`-Zeilen in `var(--color-sev-strong)`, in einer `rounded-lg border bg-background/40`-Box.
- [x] **I7** Conflict-Explanation als `type-body text-muted-foreground`.
- [x] **I8** Primary-Button `size="lg" w-full` "Fix via PR →" mit `ArrowRightIcon` + Sign-in-Hint-Mono-Subline.
- [x] **I9** Props-Interface: `{ activeFinding: DemoFinding, onFixClick: () => void }`.

### Phase 4 — SignUpTeaseDialog

- [x] **S1** `apps/web/src/components/landing/SignUpTeaseDialog.tsx` angelegt, basiert auf shadcn `<Dialog>` + `<DialogContent className="sm:max-w-md">`.
- [x] **S2** Dialog-Content: `<DialogHeader>` mit Title + Description, Email-Input + Label, Magic-Link-Button.
- [x] **S3** Magic-Link-Handler: `signIn.magicLink({ email, callbackURL: "/dashboard" })` aus `@vk/auth/client`, States `idle/sending/sent/error` analog LoginForm.tsx.
- [x] **S4** Success-State: `<Alert>` "Magic-Link unterwegs" mit gerenderter Email, Button disabled.
- [x] **S5** Sekundär-Link `<Link href="/login">` "Lieber zuerst die ganze Tour →" am Footer des Dialogs.

### Phase 5 — HeroCTA, HowItWorks, FinalCTA

- [x] **C1** + **C2** `apps/web/src/components/landing/RepoUrlForm.tsx` (shared) + `HeroCTA.tsx` angelegt. Submit-Handler: `router.push(`/login?intent=audit&repo=<encoded>`)`.
- [x] **C3** Placeholder-Rotation alle 3.5s via `useEffect` + `setInterval` über 3 Beispiel-URLs.
- [x] **C4** Quick-Pick-Buttons (`anthropics/anthropic-sdk-python`, `vercel/next.js`, `shadcn-ui/ui`) prefillen das Input.
- [x] **C5** `apps/web/src/components/landing/HowItWorks.tsx` angelegt — 3-Step-Grid mit Number-Badge + Lucide-Icon pro Tile.
- [x] **C6** `apps/web/src/components/landing/FinalCTA.tsx` angelegt — `type-display` Headline + RepoUrlForm-Reuse.

### Phase 6 — page.tsx neu zusammensetzen

- [x] **P1** `apps/web/src/app/page.tsx` neu geschrieben (32 Zeilen statt vorher 40): SiteNav → HeroSection → HeroCTA → HowItWorks → FinalCTA → Footer.
- [x] **P2** `HeroSection.tsx` als Client-Component angelegt mit `useState<string>(DEFAULT_FINDING_ID)`, leitet an HeroMockup + HeroInspector weiter.
- [x] **P3** SignUpTeaseDialog-State (`useState<boolean>(false)`) im HeroSection — `onFixClick` setzt `dialogOpen = true`.
- [x] **P4** Hero ist edge-to-edge: outer Section ohne `max-w`, innerer Wrapper bei `max-w-[1800px]` (4K-Cap aus Risk 7). Andere Sections nutzen `Section`-Wrapper mit `max-w-7xl`.

### Phase 7 — SiteNav + Footer-Refactor

- [x] **N1** `apps/web/src/components/SiteNav.tsx`: `max-w-6xl` → `max-w-7xl` + `px-4 sm:px-6` → `px-6 sm:px-8` (konsistent mit Section).
- [x] **N2** SiteNav hat `sticky top-0 z-30 backdrop-blur bg-background/80 border-b` schon aus v2 — keine Änderung nötig.
- [x] **N3** App-Routes-Smoke per Build-Output verifiziert — alle Routes `/[workspace]/*`, `/trust/*`, `/pricing`, `/billing`, `/status` bauen weiterhin. Manueller Browser-Check in QA11.

### Phase 8 — Delete + Cleanup

- [x] **R1** `apps/web/src/components/landing/LandingHero.tsx` gelöscht.
- [x] **R2** `apps/web/src/components/landing/LandingDemoCards.tsx` gelöscht.
- [x] **R3** `apps/web/src/components/landing/LandingGalaxie.tsx` gelöscht.
- [x] **R4** `apps/web/src/lib/landing/demo-workspaces.ts` gelöscht.
- [x] **R5** `AuditForm.tsx` bleibt orphan im Codebase (für Sprint 2 anonymous-audit Wiring). Backend `lib/audit-action.ts` unangetastet.
- [x] **R6** `grep "LandingHero\|LandingDemoCards\|LandingGalaxie\|demo-workspaces"` über apps/web/src — 0 Treffer.
- [x] **R7** Pre-existierende `D`-Files (bip/drift) stammen aus homepage-relaunch Phase 2 R3-R5 — bleiben als deleted im git status, kein zusätzliches Cleanup nötig.

### Phase 9 — Typography + Border-Radius-Konsens

- [x] **T1** Audit der 8 neuen Komponenten: alle Headlines nutzen `.type-display` / `.type-h1` / `.type-h2`. Body nutzt `.type-body`, Mono nutzt `.type-mono-sm`. Keine `text-3xl`/`text-4xl` mehr.
- [x] **T2** Border-Radius: `rounded-xl` für HeroInspector-Card + HowItWorks-Tiles + Hero-Mockup-Container, `rounded-lg` für Diff-Preview-Box, `rounded-full` für Number-Badges. Kein `rounded-md` in den neuen Komponenten.
- [ ] **T3** Optional Future-Polish — App-Area-Border-Radius-Sweep bleibt out-of-scope (Plan-Default).

### Phase 10 — QA

- [x] **QA1** `pnpm --filter @vk/web typecheck` — grün (0 Errors).
- [x] **QA2** `pnpm -w test` — 13 Test-Files, 74 Tests grün.
- [x] **QA3** `pnpm -w eval` — 34/34 Golden-Set-Einträge bestanden.
- [x] **QA4** `pnpm --filter @vk/web build` — Production-Build grün, 32 Routes generiert.
- [ ] **QA5** _Manueller Browser-Test ausstehend_: Hero edge-to-edge, kein Seitenrand auf `/`.
- [ ] **QA6** _Manueller Browser-Test ausstehend_: Click auf 3 verschiedene Asteroiden → Inspector switcht Finding-Content ohne Page-Reload.
- [ ] **QA7** _Manueller Browser-Test ausstehend_: Click auf "Fix via PR" → SignUpTeaseDialog öffnet.
- [ ] **QA8** _Manueller Browser-Test ausstehend_: URL-Input + Enter → redirected zu `/login?intent=audit&repo=...`.
- [ ] **QA9** _Manueller Mobile-Test ausstehend_: 375px-Viewport, Hero stackt vertikal, kein horizontal-Scroll.
- [ ] **QA10** _Manueller a11y-Test ausstehend_: prefers-reduced-motion simulieren → Asteroid-Pulse aus.
- [ ] **QA11** _Manueller Regressions-Test ausstehend_: `/login`, `/[workspace]`, `/pricing`, `/trust`, `/status` rendern noch.
- [ ] **QA12** _Lighthouse ausstehend_: Performance ≥85, Accessibility ≥95.

---

## 5. Files-to-Change

| Datei | Was passiert |
|-------|--------------|
| `apps/web/src/app/page.tsx` | Komplett neu — 40 Zeilen, nur Section-Composition |
| `apps/web/src/app/layout.tsx` | KEINE Änderung am Container (Hero soll edge-to-edge) |
| `apps/web/src/app/globals.css` | Neue CSS-Keyframe `asteroid-pulse-mid`, prefers-reduced-motion-Override |
| `apps/web/src/components/landing/HeroMockup.tsx` | NEU — SVG-Komposition, klickbar, CSS-Pulse |
| `apps/web/src/components/landing/HeroInspector.tsx` | NEU — statisches Inspector-Panel mit Demo-Finding |
| `apps/web/src/components/landing/SignUpTeaseDialog.tsx` | NEU — shadcn Dialog mit Magic-Link-Input |
| `apps/web/src/components/landing/HeroCTA.tsx` | NEU — URL-Input + Submit-Redirect |
| `apps/web/src/components/landing/HowItWorks.tsx` | NEU — 3-Step-Grid |
| `apps/web/src/components/landing/FinalCTA.tsx` | NEU — Repeat HeroCTA |
| `apps/web/src/components/landing/Section.tsx` | NEU (optional) — Layout-Wrapper |
| `apps/web/src/lib/landing/demo-finding.ts` | NEU — 3 Mock-Findings |
| `apps/web/src/components/SiteNav.tsx` | Refactor: max-w-7xl, sticky+blur |
| `apps/web/src/components/landing/LandingHero.tsx` | DELETE |
| `apps/web/src/components/landing/LandingDemoCards.tsx` | DELETE |
| `apps/web/src/components/landing/LandingGalaxie.tsx` | DELETE |
| `apps/web/src/lib/landing/demo-workspaces.ts` | DELETE |
| `apps/web/src/components/AuditForm.tsx` | KEINE Änderung (Komponente bleibt für Sprint 2) |

---

## 6. Test-Plan

**Automatisch:**
- `pnpm -w typecheck` — alle 23+ Pakete grün
- `pnpm -w test` — Vitest-Suite (74 Tests aus v2) bleibt grün
- `pnpm -w eval` — 34/34 Golden-Set-Einträge bestehen
- `pnpm --filter @vk/web build` — Production-Build grün, Bundle-Size der Landing-Route sinkt (kein PixiJS-Import mehr)

**Manuell Desktop:**
- Hero edge-to-edge, kein sichtbarer Seitenrand, kein `max-w` auf Hero-Ebene
- Click auf jeden der 3 klickbaren Asteroiden switcht Inspector-Content ohne Page-Reload
- Click auf "Fix via PR" öffnet Dialog
- URL-Input + Submit redirected korrekt zu `/login?intent=audit&repo=...`
- Quick-Pick-Links prefillen das Input
- Scroll runter: HowItWorks, FinalCTA, Footer alle in einheitlichem max-w-7xl
- Border-Radius konsistent (rounded-lg / rounded-xl)
- Type-Tokens werden verwendet (kein `text-3xl` mehr in den neuen Komponenten)

**Manuell Mobile (375px Viewport):**
- Hero stackt vertikal: Mockup oben, Inspector darunter
- Beide sind sichtbar ohne horizontal-Scroll
- Touch-Targets ≥44px auf Asteroid-Click
- Fix-via-PR-Dialog ist auf Mobile lesbar (Bottom-Sheet oder zentriert)

**a11y:**
- prefers-reduced-motion → Asteroid-Pulse aus
- SVG-Asteroiden haben `role="button"` + `aria-label`
- Keyboard-Navigation: Tab durch Asteroiden, Enter triggert Click
- Dialog keyboard-trap funktioniert
- Skip-to-content-Link (aus v2 A2-A3) funktioniert weiterhin

**Regressions:**
- `/login` rendert (SiteNav-Refactor hat Login-Page nicht gebrochen)
- `/[workspace]` rendert (SiteNav + alle App-Routes)
- `/pricing`, `/trust`, `/status`, `/billing` rendern
- Better-Auth Magic-Link-Flow funktioniert vom Dialog aus

**Performance:**
- Landing-Bundle-Size: PixiJS-Chunk darf nicht mehr eager-geladen werden
- Lighthouse Performance ≥85, Accessibility ≥95 auf `/`
- LCP <2.5s (idealerweise <1.5s — SVG ist klein und inline)

---

## 7. Risiken + Rollback

**Risiken:**

1. **SiteNav-Refactor bricht App-Area-Layout.** SiteNav wird in 16+ Routes verwendet. Container-Width-Change könnte Workspace-Switcher oder andere App-Komponenten visuell verziehen. **Mitigation:** Vor Merge alle 16+ Routes manuell besuchen + QA11 nicht skippen.

2. **Verlust des Galaxie-Wow-Effekts auf Landing.** v1 und v2 hatten beide PixiJS-Galaxie auf Landing als Differentiator. v3 ersetzt das mit einem statischen SVG-Mockup. Risiko: weniger "interessant" für Erst-Besucher. **Mitigation:** User hat explizit darum gebeten — die App-Galaxie bleibt sichtbar, sobald User sich einloggt. Die Landing soll "selbsterklärend" sein, nicht "visuell beeindruckend". Falls Conversion sinkt: A/B-Test in einem späteren Sprint.

3. **Wieviele Vorgängerpläne wird das Repo akzeptieren bevor User-Vertrauen sinkt?** Das ist v3 in zwei Tagen. **Mitigation:** Klare Begründung im Plan-Header, expliziter Bezug zu Vorgängern, klare Endzustands-Beschreibung im Wireframe. Nicht in v4 enden.

4. **AuditForm-Komponente wird zur Karteileiche.** Wenn Sprint 2 nicht zeitnah kommt, hängt der Code orphan im Repo. **Mitigation:** Im git-status nach Sprint 1 dokumentieren ("AuditForm hibernating für Sprint 2"). In `/components/AuditForm.tsx` einen kurzen Header-Kommentar setzen.

5. **demo-finding.ts mit hardcodeden Findings kann nicht mit AGENTS.md-Schema-Änderungen mithalten.** Falls das echte AGENTS.md-Parser-Schema sich ändert, divergieren Demo und Realität. **Mitigation:** Demo-Findings sind nur als Visual-Mock gedacht, nicht als Auditing-Examples. Ein TODO-Kommentar in der Datei reicht.

6. **Sign-Up-Dialog-Flow ist neu** — bisher hatten wir nur die `/login`-Page. Magic-Link-Flow aus einem Dialog braucht: Email-Input, Loading-State, Success-State, Error-Handling. Tests dafür gibt's noch keine. **Mitigation:** Pattern direkt aus `LoginForm.tsx` (lines 1-80) übernehmen, nicht neu erfinden.

7. **Edge-to-edge Hero auf 4K-Displays sieht "leer" aus.** Bei sehr breiten Viewports wird Hero-Inhalt klein wirken. **Mitigation:** Innerhalb des Hero einen `max-w-[1800px]` Wrapper um den 60/40-Split — Hero selbst bleibt edge-to-edge (Background, eventuell SiteNav-Linie), aber der Mockup-Content cap'ed.

**Rollback:**
- Code-only-Refactor, keine DB-Migration. `git revert <merge-commit>` reicht.
- Vor Merge: Pre-Production-Smoke auf Preview-Deployment (Vercel).

---

## 8. Open Questions

- [ ] **URL-Input-Verhalten in Sprint 1**: Plan-Default: redirect zu `/login?intent=audit&repo=<encoded>`. Alternative: disabled mit "Coming in next sprint"-Tooltip. → entscheiden vor Phase 5 C2.
- [ ] **Hero-Layout bei sehr breiten Viewports**: Wrap-Cap bei 1800px? Oder bleibt es voll edge-to-edge? → entscheiden vor Phase 6 P1.
- [ ] **Soll der 4. Asteroid (mit Severity "Strong" / "OK") sichtbar sein?**: Demo zeigt nur Mid-Findings — wäre die Galaxie ausgewogener mit einem positiven Beispiel (z.B. "code-review.md ist clean")? → entscheiden vor Phase 1 D1.
- [ ] **SiteNav-Items für die Public-Landing**: heute {Audit, Pricing, Trust, Login}. Bleibt das gleich, oder vereinfachen auf {Pricing, Trust, Sign in}? → entscheiden vor Phase 7 N1.
- [ ] **Hero-Headline auf Deutsch oder Englisch?**: ValidationKit nutzt heute primär Deutsch (siehe v2 Phase 4 R1). Plan-Default: Deutsch. → vor Phase 6 P1 final entscheiden.

---

## 9. Out of Scope (bewusst nicht in diesem Plan)

- **Anonymes Audit-Backend an Hero-Input verdrahten** — Sprint 2.
- **Blurred-Result-Stage + Magic-Link inline nach Audit** — Sprint 2.
- **PixiJS-Pulse-Animation in `/[workspace]/*`-App-Area** (SEVERITY_PULSE_RATE wiring) — Sprint 2.
- **GSAP-Cleanup-Fix in App-Galaxie** — Sprint 2.
- **Sprite-Recreation-Bug in GalaxieScene** — Sprint 2.
- **Mobile-Polish für App-Galaxie + prefers-reduced-motion-Static-SVG-Fallback** — Sprint 2.
- **A/B-Test Landing v3 vs v2** — separater Plan, sobald v3 live ist und mind. 100 Visitors pro Variante drauf sind.
- **Logo-/Branding-Refresh** — separat.
- **Pricing-Page-Inhalt** — Theme-Tokens werden adoptiert, Copy bleibt.
- **i18n / Deutsch-Englisch-Toggle** — out-of-scope.
- **Storybook für Landing-Komponenten** — out-of-scope.

---

## 10. Notiz zur Plan-Reihe

- **v1**: `docs/plans/homepage-relaunch.md` (🟢 Code Complete) — Multi-Demo-Karussell, statische Click-Galaxie, monochrome Severity, Slate-Blau-Akzent, Drift-Drop, IA-Konsolidierung.
- **v2**: `docs/plans/frontend-relaunch-v2.md` (🟢 Code Complete + Smoke-Tested) — revidiert v1: Slate-Blau raus, Severity-Hue zurück, Auto-Tour, Inspector-Portal, Hit-Area, Typography, Mobile/a11y.
- **v3** (dieser Plan): revidiert die Landing-Section von v2 + entfernt v1-Multi-Demo-Karussell-Reste. Behält Theme/Severity/a11y/Typography aus v2. Ersetzt PixiJS-Landing-Galaxie durch statisches SVG-Mockup. Fügt SignUp-Tease-Dialog-Flow hinzu.

Sprint 2 (separater Plan, später): die in v2 noch existierenden App-Galaxie-Animation-Bugs (Pulse-Wiring, GSAP-Cleanup, Sprite-Recreation, K1-K3 Routen-Konsolidierung) bleiben Sprint 2 Aufgabe.
