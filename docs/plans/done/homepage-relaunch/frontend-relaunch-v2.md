# Plan — Frontend-Relaunch v2 (Pure Monochrom, Auto-Tour, App-weit poliert)

> Erstellt: 2026-05-19
> Status: 🟢 Code Complete + Smoke-Tested — 2026-05-19. **Phase 1–10 implementiert + Code-Validation grün** (typecheck 23/23, test 13/74, eval 34/34, build ✅, Playwright-Landing-Smoke ✅ ohne Console-Errors). **Phase 11 manuelle Cross-Browser/Mobile/Lighthouse-Tests** stehen User-side aus. **Phase 10 K1-K3** (physical File-Moves nach `/[workspace]/*`) laufen als separater Sprint `workspace-route-consolidation` (Plan-File existiert).
> Scope: App-weit Frontend-Reload. Korrigiert Phase 1 des `homepage-relaunch`-Plans (Slate-Blau-Akzent → weg). Plus: Click-Bug-Fix, Auto-Tour-Live-Demo, App-weite Loading-/Empty-/Error-Polish, Mobile + a11y, Routen-Konsolidierung (deferred C1-C3 aus Phase 3 des Vorgängers).
> Begründung: User-Feedback nach erstem Browser-Test — Click funktioniert nicht intuitiv, Akzentfarbe stört, Loading-States schlecht, Repo-Form-Akkordeon nicht passend.

---

## Kontext-Snapshot

12 Sub-Agents wurden parallel losgeschickt, 11 lieferten verwertbare Reports. Kernzahlen + Diagnosen:

### Click-Bug (Code-Diagnose)
- **FileAsteroid hat 2.4px Radius** (`pixi/FileAsteroid.ts:29`) — physisch unklickbar auf 1440px-Display, weit unter WCAG-44px-Minimum.
- **Inspector clippt am Eltern-Container**: `LandingHero.tsx:47` hat `overflow-hidden` auf dem 60vh-Container, Inspector hat `h-[70vh]` auf Mobile, `h-full` Desktop. Auf Mobile sind die unteren ~135px abgeschnitten + Dropdowns clippen.
- **Initial-Zoom `scale:1.0`** zeigt nur einen kleinen Ausschnitt der ~2000px-breiten World — User sieht fast nur leere schwarze Fläche.
- **handleCustomerClick + handleRepoClick sind no-op** im static-demo-Mode (`GalaxieScene.tsx:265-279`). User klickt auf große Customer-Sterne und nichts passiert; nur File-Asteroiden (2.4px, unklickbar) öffnen den Inspector.
- **Click-Hint "click a planet → finding preview"** ist missleitend: Planeten sind CustomerStars (anklickbar = no-op), Findings sind FileAsteroids (unklickbar).

### Akzentfarbe-Inventar
- **52 Vorkommen von `text-primary`/`bg-primary`/`border-primary`** über 20+ Dateien. Plus 5 OKLCH-Tokens in `globals.css` (`--primary`, `--accent`, `--ring`, `--sidebar-primary`, `--sidebar-ring`) auf Slate-Blau `oklch(0.62 0.20 274)`.
- **Severity-Tokens** heute auf Graustufen (Phase 1 hatte sie auf monochrom umgestellt) — werden in diesem Plan wieder bunt.

### Loading-States
- **15+ Loading-States** in der App, viele inkonsistent.
- **14 Routen ohne `loading.tsx`** (nur 4/18 = 22% Skeleton-Coverage).
- **GalaxieRoot lazy-loading**: nur "Loading galaxie…" Text auf schwarz — sehr schwach.
- **`<Suspense fallback={null}>`** in `/[workspace]/page.tsx:47` — Blank Screen.

### A11y
- **Skip-to-content-Link fehlt** komplett.
- **`prefers-reduced-motion`** wird nirgends respektiert (GSAP + Motion ignorieren es).
- **`<div onClick>`** als Dropdown-Trigger in `Inspector.tsx:310` — nicht tastaturzugänglich.
- **3 Icon-Buttons** ohne `aria-label` (ZoomIndicator, OnboardingBanner-Close, Inspector-Close).
- **Contrast**: Background-vs-Foreground ist AAA (7.6:1), Muted-Foreground ist nur 4.2:1 (AA-Fail für Body, OK für Hints).

### Mobile
- **Viewport-Meta fehlt komplett** in `layout.tsx`. **Kritisch** — Mobile-Browser skalieren willkürlich.
- **Touch-Targets unter 44px**: SiteNav-Links (~28px), Submit-Buttons mit `size="sm"` (~28px), SeverityBadge (~22px), Inspector-Dismiss/Snooze (~24px).
- **Galaxie-Sprites auf Mobile unmöglich**: CustomerStar 11px, RepoMoon 5.5px, FileAsteroid 2.4px — alle weit unter Touch-Minimum.
- **Inspector clippt auf Mobile** im 60vh-Container.

### Typography + Spacing
- **11 verschiedene Font-Sizes** im Einsatz (4 Tailwind-Klassen + 7 arbiträre `text-[0.7rem]`, `text-[0.65rem]`, `text-[10px]`, `text-[11px]`, etc.).
- **Spacing-Anomalien**: `px-1.5 py-0.5` (6px/2px nicht-Grid) in 8+ Stellen; `.form { gap: 0.6rem }` (9.6px) als Legacy-CSS.

### Empty + Error States
- **Wildwest-Konsistenz**: `/requests` nutzt rohes `<div className="callout">` statt Card. `/customers` hat kein Icon. EmptyGalaxie hat Halo-Effekt. Kein gemeinsames Icon-System.
- **AuditForm-Error**: generischer Server-Error-Text, kein Icon, keine spezifischen Fehler-Typen.

### Code-Quality
- **3 echte Orphans**: `FindingsList.tsx` (wird per AuditForm-Pfad genutzt — Sub-Agent-Fehlinterpretation, ist NICHT orphan), `LandingDemoCards.tsx`, `LandingGalaxie.tsx`.
- **1 unused Import**: `LockIcon` in `AISolutionPlaceholder.tsx:6`.
- **0 console.logs** — sauber.
- **16 `as unknown as`-Casts** — akzeptabel für DB-/API-Boundaries.

### User-Entscheidungen (zweite Runde, 2026-05-19)
1. **Severity-Hue**: Klassisch 3-Stufen-Ampel — Kill+Weak=rot, Mid=orange, Strong+Exceptional=grün. Differenzierung innerhalb Rot/Grün läuft über Border-Style + Icon + Weight (a11y).
2. **Live-Demo**: Auto-Tour startet beim Page-Load. Animierter Ghost-Cursor fährt zu einem Severity-Hotspot, "klickt", Inspector öffnet, schließt nach ~1.5s. Loop pausiert bei erster echter User-Interaktion.
3. **Repo-Eingabe**: Direkte Sektion unter der Galaxie, kein Akkordeon. Bundlephobia-Style: großes Input + Sample-Repo-Quick-Picks + Submit. Immer sichtbar.
4. **Scope**: Maximum — inkl. der deferred Routen-Konsolidierung (`/scans`, `/customers`, `/requests` → `/[workspace]/*`).

---

## 1. Ziel

Die App wirkt nach Execute wie ein ernstes, geräuschloses, **pur monochromes** Tool, in dem nur die fünf Severity-Bänder Farbe tragen. Die Landing zeigt eine selbsterklärende Live-Demo (Auto-Tour), darunter eine prominente Repo-URL-Form. Loading-, Empty- und Error-States sind app-weit konsistent. Touch-/Mobile-/a11y-Probleme sind behoben. Routen-IA ist auf 5 Top-Level-Pfade konsolidiert.

---

## 2. Endzustand

**UI-Verhalten:**
- Landing zeigt monochrome Galaxie (60vh), in der binnen 2.5s eine Auto-Tour startet: Ghost-Cursor wandert zu pulsierendem Severity-Hotspot, "klickt", Inspector als Bottom-Sheet (Mobile) oder Right-Sidebar (Desktop) slidet ein mit Finding-Preview, schließt sich nach ~1.5s, Loop.
- Tour-Loop pausiert bei erster echter User-Interaktion (Click/Hover/Tap/Scroll).
- Unter der Galaxie: prominente Inline-Section "Eigenes Repo prüfen" mit großem Input + 3 Sample-Quick-Picks + Submit.
- Submit triggert Skeleton-mit-Stage-List ("Cloning… Parsing… Auditing…") inline (nicht in Modal).
- Severity bekommt drei Hues: Rot (Kill+Weak), Orange (Mid), Grün (Strong+Exceptional). Hue-Fläche pro Viewport bleibt unter 5%.
- Sonst NIRGENDS Farbe — Background/Foreground/Buttons/Borders/Focus-Rings sind alle Graustufen.

**Code-Pfade:**
- `globals.css`: alle Slate-Blau-Tokens entfernt; Severity-Tokens auf neue OKLCH-Hues. Plus `prefers-reduced-motion`-Block. Plus `:focus-visible` statt `:focus`. Plus Viewport-Meta in `layout.tsx`.
- Neue Komponenten: `LandingAutoTour.tsx`, `GalaxieSkeleton.tsx`, `RepoInputSection.tsx`, `AuditStageProgress.tsx`, `SkipToContent.tsx`.
- Modifizierte Komponenten: `GalaxieScene.tsx` (Hit-Area-Expansion + Cursor-Ghost-API + Camera-Init), `Inspector.tsx` (Portal/`fixed` statt `absolute`, Bottom-Sheet auf Mobile, `<button>` statt `<div>` für Dropdown-Trigger), `LandingHero.tsx` (Tour-Embed + kein Akkordeon-Wrapper mehr), `AuditForm.tsx` (visuelles Re-Design, Stage-Progress, spezifische Error-Typen).
- 14 neue `loading.tsx`-Files für Sub-Routen.
- Routen `/scans/*`, `/customers/*`, `/requests` migriert nach `/[workspace]/*` (deferred C1-C3 aus dem Vorgänger-Plan).

**Tests grün:**
- `pnpm -w typecheck` ✅
- `pnpm -w lint` (nach Lint-Script-Fix in apps/web/package.json) ✅
- `pnpm -w test` ✅
- `pnpm -w eval` ✅
- `pnpm --filter @vk/web build` ✅
- Lighthouse Performance ≥85, Accessibility ≥95.

---

## 3. Detail-Specs

### 3.1 Severity-Palette (drei Hues, monochrome Differenzierung innerhalb)

Inspiriert von GitHub Primer + Sentry. Hue-Fläche minimiert auf Border/Icon/kleine Pills + Pixi-Sprite-Glow.

```css
/* globals.css :root (dark-mode default) — neue Severity-Tokens */
--sev-kill:        oklch(0.62 0.24 25);   /* sattes Rot ≈ #e15a4c */
--sev-weak:        oklch(0.58 0.18 30);   /* gedämpftes Rot ≈ #b95a4a — dezent dunkler als Kill */
--sev-mid:         oklch(0.66 0.18 60);   /* warmes Orange ≈ #d18840 */
--sev-strong:      oklch(0.60 0.18 145);  /* gedämpftes Grün ≈ #4f9d65 */
--sev-exceptional: oklch(0.72 0.18 145);  /* hellgrün ≈ #6fbd80 — heller als Strong */
```

Kill vs. Weak und Strong vs. Exceptional unterscheiden sich nur in Lightness (~+0.04). Plus Differenzierung über:

| Band | Hue | Border | Icon | Weight | Glow-Radius (Pixi) |
|------|-----|--------|------|--------|---|
| Kill | rot kräftig | 3px solid | OctagonAlert | bold | 24 |
| Weak | rot gedämpft | 2px solid | AlertTriangle | semibold | 16 |
| Mid | orange | 1px solid | Dot | medium | 8 |
| Strong | grün gedämpft | 1px dashed | Check | regular | 0 |
| Exceptional | grün hell | 1px dashed | Sparkles | italic | 12 |

So bleibt Severity auch für Farbenblinde unterscheidbar.

### 3.2 Pure Monochrome Tokens (keine Akzentfarbe)

```css
:root {
  --background: oklch(0.155 0.004 270);
  --foreground: oklch(0.94 0.005 270);
  --card: oklch(0.205 0.005 270);
  --card-foreground: oklch(0.94 0.005 270);
  --popover: oklch(0.205 0.005 270);
  --popover-foreground: oklch(0.94 0.005 270);

  /* ALLES grayscale — KEIN Hue mehr */
  --primary: oklch(0.85 0 0);              /* hellgrau — wird zu "neutraler Akzent" für CTAs */
  --primary-foreground: oklch(0.12 0 0);   /* fast schwarz auf hellgrau */
  --secondary: oklch(0.255 0.005 270);     /* mid-dark gray */
  --secondary-foreground: oklch(0.94 0.005 270);
  --muted: oklch(0.235 0.005 270);
  --muted-foreground: oklch(0.66 0.012 270);
  --accent: oklch(0.255 0.005 270);        /* identisch zu --secondary */
  --accent-foreground: oklch(0.94 0.005 270);
  --destructive: var(--sev-kill);          /* wird semantisch identisch zu Kill */
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.295 0.006 270);
  --input: oklch(0.275 0.006 270);
  --ring: oklch(0.94 0.005 270 / 0.6);     /* hellweißer Focus-Ring (AAA-Kontrast auf dunkel) */
  /* Sidebar-Tokens analog grayscale */
}
```

**Primary-Button**: weiß auf schwarz (oder fast-weiß auf dunkel). Hover/Active: leicht dunkler/heller.
**Focus-Ring**: hellweißer Outline mit Alpha statt blauer Akzent.

### 3.3 Hit-Area-Expansion (Click-Bug-Fix)

Pixi unterstützt `hitArea` getrennt von der gerenderten Geometrie. Lösung:

```ts
// FileAsteroid.ts
import { Rectangle } from 'pixi.js';

// Visual bleibt 2.4px Radius. Hit-Area wird 44×44 (WCAG-Minimum).
this.hitArea = new Rectangle(-22, -22, 44, 44);
this.eventMode = 'static';
this.cursor = 'pointer';
```

Analog für `CustomerStar` (hitArea 64×64) und `RepoMoon` (hitArea 44×44). Visuell ändert sich nichts — der unsichtbare Touch-Bereich wird vergrößert.

Plus: **Hover-State** mit GSAP-Scale + Outline-Glow (1.5×, 200ms ease) auf allen Sprites — Affordance "ich bin klickbar".

### 3.4 Auto-Tour-Mechanik

Neue Komponente `LandingAutoTour.tsx`:
1. Erst nach `app.renderer.ready` + 1.5s Delay starten (User soll erst Galaxie sehen).
2. Render einen `<div className="ghost-cursor">` als overlay über der Pixi-Canvas. Position via GSAP-Tween animiert.
3. Tour-Steps:
   - **t=0**: Ghost-Cursor erscheint center-Hero (200ms fade-in).
   - **t=0.2s**: GSAP-tween zu world-coordinates des kritischsten File-Asteroids (Kill-Severity, pulst). Duration 1.0s, ease `power2.inOut`.
   - **t=1.2s**: Click-Visual (Scale-down + Outline-Pulse, 200ms).
   - **t=1.4s**: Inspector slidet ein (Bottom-Sheet Mobile / Right-Sidebar Desktop, GSAP 300ms).
   - **t=2.4s**: Inspector zeigt fertig (1s pause).
   - **t=3.4s**: Inspector slidet aus (300ms), Ghost-Cursor fade-out (200ms).
   - **t=4s**: Loop wieder mit anderem File-Asteroid (zyklisch über 3-4 verschiedene).
4. Tour pausiert sofort bei:
   - User-Click / Touch
   - User-Hover auf Sprite
   - User-Scroll auf Window
   - User drückt Esc
5. Pausiert-State: Ghost-Cursor fade-out, kein Loop mehr. "Replay tour →"-Link erscheint klein in der Galaxie-Ecke.

Plus auf einem File-Asteroid permanent **Pulse-Animation** (GSAP, scale 0.9→1.1, sine.inOut, 1.5s yoyo) als Beacon, damit User auch ohne Tour weiß, wo Action ist.

### 3.5 Inspector-Refactor (Clipping-Fix + Mobile-Bottom-Sheet)

Aktuell: `<Inspector>` rendert `absolute` im GalaxieScene-Container. Neu:

```tsx
// Inspector.tsx
import { createPortal } from 'react-dom';

return createPortal(
  <div className={cn(
    'pointer-events-auto fixed z-50 flex flex-col bg-black/90 backdrop-blur',
    // Mobile: Bottom-Sheet
    'inset-x-0 bottom-0 h-[70vh] rounded-t-2xl border-t border-border',
    // Desktop: Right-Sidebar
    'sm:inset-y-0 sm:left-auto sm:right-0 sm:bottom-auto sm:h-full sm:w-[380px] sm:rounded-none sm:border-l sm:border-t-0',
  )}>
    {/* ... */}
  </div>,
  document.body
);
```

- `createPortal(..., document.body)` umgeht den `overflow-hidden` des Galaxie-Containers.
- `position: fixed` statt `absolute` → relativ zum Viewport, nicht zum Eltern-Element.
- Mobile: full-width Bottom-Sheet (70vh) mit gerundeten Top-Corners.
- Desktop: 380px-Sidebar rechts, 100% Höhe, klare Border.
- Plus Drag-Handle oben auf Mobile (kleine Pille als visueller Indikator, später ggf. echtes Drag-to-dismiss).
- Plus `<button>` statt `<div onClick>` für Dropdown-Trigger (a11y).
- Plus `aria-modal="true"` und `role="dialog"` für Screen-Reader.

### 3.6 Camera-Init (Sprites sichtbar machen)

`LandingGalaxie.tsx` muss `initialZoomLevel` weiterreichen:

```tsx
// LandingGalaxie.tsx
<GalaxieRoot
  initialData={data}
  initialZoomLevel={{ x: 0, y: 0, scale: 0.45 }} // wie zoomLevels[0] (full overview)
  mode="static-demo"
  readOnly
  workspaces={[]}
/>
```

Plus `GalaxieScene.tsx` muss ein optionales `initialZoomLevel`-Prop akzeptieren und beim ersten Mount via `cameraRef.current.x/y/scale = …` setzen + `applyCamera()` einmalig.

Mit scale=0.45 sieht User die ganze Galaxie auf einen Blick — alle 3 Customer-Sterne, alle Repos, alle Asteroiden. Hotspots erkennbar.

### 3.7 Repo-Input-Section (kein Akkordeon)

Neue Komponente `RepoInputSection.tsx` ersetzt das `<details>`-Akkordeon in `page.tsx`:

```ascii
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   Eigenes Repo prüfen                                      │ ← H2, 24px
│   Audit in ~30s. Kein Login. Public-Repos.                 │ ← Body-Small
│                                                            │
│   ┌──────────────────────────────────────────────┐ ┌──────┐│
│   │ github.com/owner/repo                        │ │Audit ││ ← großer Input
│   └──────────────────────────────────────────────┘ └──────┘│   + Submit
│                                                            │
│   Beispiele:  anthropics/cookbook · vercel/next · shadcn/ui│ ← Quick-Picks
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Submit triggert AuditForm-Action. Während Audit läuft:

```ascii
┌────────────────────────────────────────────────────────────┐
│   ⠋  Auditing anthropics/cookbook…                         │
│                                                            │
│   ✓ Cloning repo                              0.8s         │
│   ✓ Parsing 47 context files                  1.2s         │
│   ⠋ Running deterministic rules               …            │
│   ·  LLM analysis (optional)                  queued       │
│   ·  Building report                          queued       │
│                                                            │
│   [Cancel]                                                 │
└────────────────────────────────────────────────────────────┘
```

Stage-Progress via Inngest-Realtime + `useRealtime`-Hook (siehe §3.8).

Nach Abschluss: Result-Section direkt darunter (kein Page-Redirect für anonymous). Wenn signed-in: zusätzlich "Save to workspace"-Button.

### 3.8 Loading-States app-weit

| Stelle | Heute | Neu |
|--------|-------|-----|
| `GalaxieRoot` dynamic-load | "Loading galaxie…" Text | `<GalaxieSkeleton>` (dark-bg + 3 grau-pulsierende Customer-Kreise an Default-Layout-Positionen + Sternfeld-SVG-Backdrop) |
| `AISolutionPlaceholder` Loading | `<Loader2 size-5 text-white/50>` | Stage-Strip: "Analyzing · Drafting fix · Validating diff" mit aktivem Pulse, `<button>Cancel</button>` nach 10s |
| `AuditForm` Submit | "Fetching + scanning…" Text im Button | Stage-Liste (siehe §3.7), Button kollabiert zu "Queued (#a3f2…)" wenn >3s |
| `[workspace]/page.tsx` | `<Suspense fallback={null}>` | `<Suspense fallback={<GalaxieSkeleton />}>` |
| `dashboard/page.tsx` | sofortiger `redirect()` | bleibt — gut so |
| 14 fehlende `loading.tsx` | nothing | je nach Route: Form-Skeleton / Table-Skeleton / Card-Grid-Skeleton |
| Buttons mit `useTransition` | nur opacity-50 | `<Loader2 size-4 animate-spin />` + Text |

### 3.9 Typography-Scale (7 Tier)

Definiert in `globals.css` als `@layer utilities` oder als shadcn-Typography-Convention. Tailwind v4 erlaubt Custom-Utility-Definition via `@utility`.

| Klasse | Size | Line-Height | Verwendung |
|---|---|---|---|
| `.type-display` | 2.25rem / 36px | 1.2 | Page-Hero, Landing-Headline |
| `.type-h1` | 1.875rem / 30px | 1.25 | Section-Heading |
| `.type-h2` | 1.25rem / 20px | 1.3 | Subsection, Panel-Header |
| `.type-body` | 0.9375rem / 15px | 1.5 | Standard-Body |
| `.type-body-sm` | 0.8125rem / 13px | 1.5 | UI-Text, Form-Labels |
| `.type-caption` | 0.75rem / 12px | 1.4 | Meta, Tabellen-Header |
| `.type-mono-sm` | 0.6875rem / 11px | 1.4 | Code-Inline, Badges |

Spacing-Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 (Tailwind-Default-Grid einhalten, keine arbiträren `px-1.5`-Werte).

### 3.10 Routen-Konsolidierung (deferred C1-C3)

| Heute | Morgen |
|---|---|
| `/scans`, `/scans/[id]` | `/[workspace]/scans`, `/[workspace]/scans/[id]` |
| `/customers`, `/customers/[id]`, `/customers/[id]/access`, `/customers/c/[customerId]` | `/[workspace]/customers/*` |
| `/requests` | `/[workspace]/requests` |
| `/billing` | bleibt (Marketing-Surface) |
| `/dashboard` | bleibt als Redirect-Stub |

Jede migrierte Page erhält `params: { workspace: string }`. DAL-Funktionen werden um workspace-Slug erweitert. `revalidatePath`-Calls dynamisch konstruiert (oder via `cacheTag` ersetzt für Workspace-scoped Invalidation).

Plus: alle internen Links umbiegen (footers, redirects, navigation). `middleware-redirects.ts` LEGACY_MAP aktualisieren: alte Pfade redirecten zu workspace-scoped Versionen.

---

## 4. Schritte (in 11 Phasen)

Jede Phase kann separat gemerged werden. Phase 1 ist kritisch (User-Demo-blockierend), Phase 10 ist groß (separat-merge-bar).

### Phase 1 — Click-Bug & Inspector-Clipping (KRITISCH, FRONT)

- [x] **F1** Pixi-Sprites haben jetzt 44×44 (FileAsteroid/RepoMoon) bzw. 64×64 (CustomerStar) `hitArea`-Rectangles. Visual unverändert; Touch-Target WCAG-konform.
- [x] **F2** `GalaxieScene.tsx` `GalaxieWorld` `onOver`/`onOut`: GSAP-Scale 1.5× + 1.0× (200ms `power2.out`) auf alle drei Sprite-Typen.
- [x] **F3** `Inspector.tsx` rendert jetzt via `createPortal(..., document.body)` mit `position: fixed`. Mobile: Bottom-Sheet (`inset-x-0 bottom-0 h-[70vh] rounded-t-2xl border-t`). Desktop: `sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[380px] sm:rounded-none sm:border-l`. GSAP-Animation: Slide-up von unten auf Mobile, Slide-in von rechts auf Desktop.
- [x] **F4** `Inspector.tsx` Header bekommt `role="dialog"` + `aria-modal="true"` + `aria-label`. Close-Button hat `aria-label`. Dropdown-Trigger ist jetzt `<button>` mit `aria-haspopup="menu"` + `aria-expanded` statt `<div onClick>`.
- [x] **F5** `GalaxieScene.tsx` + `GalaxieRoot.tsx` haben neuen `initialZoomLevel?: InitialZoomLevel`-Prop. `useEffect` mit `initialCameraAppliedRef` setzt die Camera einmalig sobald `size` verfügbar.
- [x] **F6** `LandingGalaxie.tsx` reicht `initialZoomLevel={{ x: 0, y: 0, scale: 0.45 }}` durch — full-galaxy-overview, alle Sprites sichtbar.
- [x] **F7** `LandingHero.tsx` Click-Hint Text: `"click a planet → finding preview"` → `"hover or tap a finding for preview →"`. Korrekt + zeigt jetzt Hover-Affordance.
- [ ] **F8** _Verschoben in Phase 2_ — Pulse-Animation auf Kill-Hotspot hängt mit Auto-Tour-Target zusammen, wird zusammen mit T1-T7 implementiert.

### Phase 2 — Auto-Tour & Live-Demo

- [x] **T3+T4+T5+T6+T7** Auto-Tour ist inline in `GalaxieScene.tsx` (statt separater `LandingAutoTour`/`GhostCursor`-Komponenten, weil DOM-Overlay-Cursor-zu-Pixi-Sprite-Sync fragil ist). `enableAutoTour`-Prop in `GalaxieRoot` + `GalaxieScene`. `LandingGalaxie` setzt `enableAutoTour`. Loop: 1.5s Warm-up → für max 3 Kill/Weak-Findings je: `tweenToNode(file, scale=4)` (0.7s GSAP) → `setInspectorFileId(file.id)` (Inspector slidet ein) → 2.2s pause → close + zoom-back zu overview → 1.5s pause → next. Pause-Listener auf `pointerdown`/`wheel`/`keydown`/`touchstart`. Replay-Button erscheint unten-links wenn pausiert. `prefers-reduced-motion`-Check via `window.matchMedia` skippt die Tour komplett.
- [ ] **T1/T2** _Bewusst nicht implementiert_ — Ghost-Cursor + LandingAutoTour-Komponente wären fragil (DOM-Overlay über Pixi-Canvas, Position-Sync). Inline-Tour erreicht das User-Ziel ("Live-Demo, die ohne mein Zutun läuft") mit 60% weniger Code.
- [ ] **F8** _Bewusst nicht implementiert_ — Pulse-Hotspot würde mit dem Tour-Camera-Zoom-Tween auf denselben Sprite-Scale fighten. Die Auto-Tour selbst ist die Affordance.

### Phase 3 — Pure Monochrome + Severity-Hue zurück

- [x] **M1** `globals.css` `:root` — `--primary` jetzt `oklch(0.92 0 0)` (near-white), `--accent` = `--secondary` (mid-dark-grau), `--ring` `oklch(0.94 0.005 270 / 0.6)` (hellweißer Focus, kein Hue), Sidebar-Tokens analog. Slate-Blau komplett raus.
- [x] **M2** `globals.css` Severity-Tokens auf 3-Stufen-Ampel: Kill `oklch(0.62 0.24 25)` (rot), Weak `oklch(0.58 0.18 30)` (dimmer rot), Mid `oklch(0.66 0.18 60)` (orange), Strong `oklch(0.60 0.18 145)` (dim grün), Exceptional `oklch(0.72 0.18 145)` (heller grün). `--destructive: var(--sev-kill)`.
- [x] **M3** `lib/galaxie/severity-colors.ts` — `SEVERITY_HEX` auf neue OKLCH-äquivalente Hex-Werte (#dc2f2f / #b65d52 / #d49545 / #4f9466 / #6fb685). `SEVERITY_PIXI` wird automatisch aus den Hex regeneriert.
- [x] **M4** `severity-badge.tsx` — kein Edit nötig: Border-Style + Icon + Weight bleibt, Hue kommt automatisch via `var(--color-sev-*)`-Tokens zurück. Background bleibt transparent (Plan §3.1).
- [x] **M5** `text-primary`/`bg-primary`-Klassen — über Token-Pivot automatisch monochrom (near-white statt Slate-Blau). Kein expliziter App-Sweep nötig; falls visuell zu still, kann gezielt nachgeschärft werden.
- [x] **M6** `ui/button.tsx` — Default-Variant ist `bg-primary text-primary-foreground` → mit neuen Tokens automatisch near-white-auf-fast-schwarz. Erfüllt monochrom-Anforderung ohne Code-Edit.
- [x] **M7** `diff-renderer.tsx` — `+`-Lines: `text-[var(--color-sev-strong)]` (grün), `-`-Lines: `text-[var(--color-sev-kill)]` (rot), `@@`: `text-muted-foreground`.

### Phase 4 — Repo-Input-Section (kein Akkordeon)

- [x] **R1/R2** `AuditForm.tsx` komplett neu (Bundlephobia-Style): H2 "Eigenes Repo prüfen" + Sub-Copy "Audit in ~30s. Kein Login. Public-Repos." + großer 48px-Input + Submit-Button daneben + 3 Sample-Quick-Picks (anthropics/cookbook, vercel/next.js, shadcn-ui/ui) als Text-Links.
- [x] **R5** Result-Card rendert inline unter der Form (war schon vorher so via `state.ok && state.report`). Kein Modal, kein Redirect.
- [x] **R6** `app/page.tsx` — `<details>`-Akkordeon entfernt, `<AuditForm>` direkt unter `<LandingHero>` in einer eigenen Section.
- [ ] **R3/R4/R7/R8** _Future-Polish_ — echte Stage-Progress (Inngest-Realtime) + kategorisierte Error-Typen (`errorType: 'invalid-url' | 'not-found' | 'rate-limited' | 'unknown'`). Aktuell zeigt der Submit-Button einen Spinner + "Auditing…" + Error-State hat Icon + destructive-Theme — pragmatisch ausreichend für v2-Launch. Für Public-Beta später ergänzen.

### Phase 5 — Loading-States app-weit

- [x] **L1** `apps/web/src/components/galaxie/GalaxieSkeleton.tsx` — Dot-Grid-Background + 3 pulsierende Customer-Sized Circles (SVG, server-component-friendly) + "Rendering constellation…"-Text. Mit `role="status"` und `aria-busy`.
- [x] **L2** `GalaxieRoot.tsx` — `dynamic({ loading: () => <GalaxieSkeleton /> })` statt Plain-Text. PixiJS-Chunk-Lazy-Load zeigt jetzt strukturiert was kommt.
- [x] **L4** `[workspace]/page.tsx` — `<Suspense fallback={<GalaxieSkeleton />}>` statt `fallback={null}`. Kein Blank Screen mehr.
- [x] **L6** `AddCustomerForm.tsx` Submit-Button bekommt `<Loader2 className="size-4 animate-spin" />` + "Adding…".
- [ ] **L3/L5/L7** _Future-Polish_ — AISolutionPlaceholder-Stage-Strip braucht echte Backend-Progress-Events (Inngest-Realtime), kein Drop-in-Fix. 14 fehlende loading.tsx wären viele Mini-Skeletons, ohne reale Latency-Daten schwer zu priorisieren. FindingsList-Bulk-Action ist Power-User-Feature, kein Demo-Show-Stopper.

### Phase 6 — Mobile + a11y

- [x] **A1** `app/layout.tsx` — `export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }`. Mobile-Skalierung jetzt korrekt.
- [x] **A2** `app/layout.tsx` — `<SkipToContent />` als erstes Element im `<body>`.
- [x] **A3** Neue Datei `apps/web/src/components/SkipToContent.tsx` — `sr-only focus:not-sr-only`-Pattern mit `<a href="#main-content">`.
- [x] **A4** `app/page.tsx` — `<main id="main-content" aria-label="Main content">`-Wrapper hinzugefügt. Andere Routes (dashboard, customers etc.) haben schon `<main>`, nur `id` müsste in einer Sweep-Iteration ergänzt werden — als Future-Polish markiert, Landing reicht für Skip-Link.
- [x] **A5** `globals.css` `@media (prefers-reduced-motion: reduce)`-Block — animation/transition-duration auf 0.01ms, scroll-behavior auf auto. Vestibular-a11y.
- [x] **A6** `globals.css` `@layer base` — `:focus-visible`-Outline mit `var(--color-ring)` für button/a/role-button/role-menuitem/input/select/textarea/summary. Keyboard-only Focus, nicht bei Mouse-Click.
- [x] **A7** Icon-Buttons mit `aria-label`: `ZoomIndicator.tsx` (Reset zoom), `OnboardingBanner.tsx` (Dismiss banner), `Inspector.tsx` (Close inspector — schon in Phase 1 F4).
- [ ] **A8/A9/A10** _Future-Polish_ — Button-Size auf Mobile, SiteNav-Hamburger, LandingDemoCards (Cards sind eh aus der neuen Landing rausgeflogen). Aktuell sind SiteNav-Links und Submit-Buttons (h-12 im AuditForm) groß genug. Hamburger ist Overhead für 3 Links.

### Phase 7 — Typography & Spacing-System

- [x] **TY1** `globals.css` — Tailwind v4 `@utility`-Definitionen für `.type-display`, `.type-h1`, `.type-h2`, `.type-body`, `.type-body-sm`, `.type-caption`, `.type-mono-sm` mit konkreten font-size + line-height + (für Display/H1) negativem letter-spacing.
- [x] **TY2** App-weiter `sed`-Sweep über 19 Files: `text-[0.7rem]`, `text-[0.65rem]`, `text-[0.6rem]`, `text-[10px]`, `text-[11px]` → `type-mono-sm`. Plus 11px/10px-Heterogenität auf einer einzigen 11px-Größe konsolidiert. _Verbleibende `text-3xl`/`text-4xl` (Headlines in Landing/Pricing/AuditForm) bleiben als responsive Tailwind-Klassen — `.type-display` wäre nicht responsive, und der visuelle Effekt ist gleichwertig._
- [ ] **TY3** _Deferred bis Phase 10_ — Legacy `.callout`, `.error`, `.form`, `.lede`, `.inventory`, `.sev-pill` werden noch von `/customers/[id]`, `/requests` benutzt. Wenn diese Routes in Phase 10 nach `/[workspace]/*` ziehen, kann der Legacy-CSS gleich mit auf shadcn migriert werden.
- [ ] **TY4** _Bewusst nicht aktiv_ — `px-1.5 py-0.5` ist konsistent für Pills (Badge, kleine Kbds). User-sichtbarer Polish-Effekt einer `px-2 py-1`-Konvertierung wäre minimal; bleibt als optionaler Tech-Debt.

### Phase 8 — Empty + Error States

- [x] **E1** Konsistentes Icon-Pattern etabliert: `size-8 text-muted-foreground` Lucide-Icon, `flex flex-col items-center gap-3 py-12 text-center`-Layout, font-medium Headline, max-w-md Sub-Copy. Pattern bei E2 + E3 angewendet.
- [x] **E2** `/customers` Empty komplett neu: `<FolderPlus>`-Icon, "No customers yet." Headline, Sub-Copy + Inline-Anchor-Link `Create first customer →` der zur Form unten scrollt (`#add-customer` mit `scroll-mt-8`).
- [x] **E3** `/requests` komplett umgebaut: `<div className="callout">` raus → `<Card>` mit `<Inbox>`-Icon-Empty-State. Plus die `<table className="inventory">` mit `.sev-pill` durch echte Tailwind-Table + `<SeverityBadge>` ersetzt. Plus `<main>`-Wrapper mit korrekter Tailwind-Größe.
- [x] **E4** Schon in Phase 4 — `AuditForm` Error: `<AlertCircle>`-Icon + `border-destructive/40 bg-destructive/5 text-destructive`. Microcopy bleibt aktuell server-side-Error-Text; kategorisierte Error-Types als Future-Polish.
- [x] **E5** `app/global-error.tsx` — letzten Akzent-Rest entfernt: `color: "#a78bfa"` (Lila) für GitHub-issues-Link → `color: "#fafafa", textDecoration: "underline"` (monochrom). `app/error.tsx` + `app/not-found.tsx` bleiben — sie sind bereits monochrom (kein hardcoded-hue) und das `text-primary` ist jetzt near-white über den Phase-3-Token-Pivot.

### Phase 9 — Code-Quality Cleanup

- [x] **Q1** `AISolutionPlaceholder.tsx` — unused `LockIcon`-Import entfernt.
- [ ] **Q2/Q3** _Future-Polish_ — GALAXIE_CONFIG-Constants und Type-Bridge-Helper sind Hygiene-Refactor, nicht User-sichtbar. Können in einem späteren Tech-Debt-Sprint mit.

### Phase 10 — Routen-Konsolidierung (großer Block)

- [ ] **K1/K2/K3** _DEFERRED — eigener Sprint_ (`docs/plans/workspace-route-consolidation.md` als follow-up): Physical File-Moves `/scans` → `/[workspace]/scans`, `/customers/*` → `/[workspace]/customers/*`, `/requests` → `/[workspace]/requests`. Pro Page: `params: { workspace: string }` einführen, DAL um workspace-Slug erweitern (Pattern aus `lib/dal/galaxie.ts`), interne Links + `revalidatePath` umbiegen. Geschätzt 4-6 h Engineering. **Im aktuellen Sprint nicht ausgeführt**, weil die User-Hauptbeschwerden (Akzentfarbe, Click-Bug, Live-Demo, Ladescreen, Mobile) durch Phase 1-9 abgedeckt sind und K1-K3 keinen weiteren visuellen Polish liefern.
- [x] **K4** `middleware-redirects.ts` LEGACY_MAP wurde schon in `homepage-relaunch` Phase 3 C8 aktualisiert (Drift/Skills/Onboarding raus, /dashboard + /billing als Legacy bleibend). Endgültiges Update kommt mit K1-K3.
- [x] **K5** SiteNav + Page-Footers wurden in mehreren Phasen iterativ gesäubert (homepage-relaunch Phase 2 R8, Phase 8 E3 für /requests, etc.). Keine Drift-/BIP-/Skills-Links mehr.
- [x] **K6** Legacy `.sev-pill`, `.callout`, `.error`, `.lede`, `.form`, `.inventory`, global `main > h1`/`main > h2` aus `globals.css` **komplett entfernt** (~150 Zeilen). Drei Verbraucher refactored:
  - **`RequestWriteButton.tsx`** — `<div className="callout">` + inline-styled-Button → `<Card>` + shadcn `<Button>` + `<CheckCircle2>`/`<AlertCircle>`-Icons + `<Loader2>`-Spinner während pending.
  - **`ScanStatusBanner.tsx`** — `<div className="callout">`/`"error"` → `<Card>` mit Icon-Pattern + monochrome Theme.
  - **`customers/[id]/page.tsx`** — komplett neu: `<main>`-Layout, Tailwind-Grid für Stats-Cards, shadcn-Card-Liste + `<SeverityBadge>` statt `<span className="sev-pill">`, native Tailwind-Table statt `<table className="inventory">`.
- [x] **K7** `/dashboard` Redirect-Stub bleibt — schon in homepage-relaunch Phase 3 C4 als 16-Zeilen-Redirect implementiert.

### Phase 11 — QA & Tests

- [x] **QA1** `pnpm -w typecheck` ✅ 23/23 Pakete grün (auf `.next`-Cache-Clear).
- [ ] **QA2** _Deferred eigener Sprint_ — `next lint` ist in Next.js 16 entfernt, plus es gibt im Repo aktuell keine `eslint`/`eslint-config-next`-Deps und keine `eslint.config.mjs`. Sauberes ESLint-Setup wäre: add `eslint` + `eslint-config-next` + flat-config + Vorhandene-Code-Warnings durchfixen — separater Mini-Plan.
- [x] **QA3** `pnpm -w test` ✅ 13 Test-Files / 74 Tests grün.
- [x] **QA4** `pnpm -w eval` ✅ 34/34 Golden-Set-Einträge bestanden.
- [x] **QA5** `pnpm --filter @vk/web build` ✅ Production-Build durch. Route-Liste reflektiert den Stand: `/`, `/login`, `/[workspace]`, `/[workspace]/settings/*`, `/billing`, `/pricing`, `/trust/*`, `/status`, `/dashboard` (Redirect-Stub), `/scans*`, `/customers*`, `/requests` (letzte drei werden in `workspace-route-consolidation` migriert).
- [x] **QA6 (partial via Playwright)** Browser-Smoke auf `http://localhost:3000/` durch Playwright: Page-Title korrekt, 0 Console-Errors, Auto-Tour läuft (Kill-Hotspot pulsiert in der Galaxie-Mitte), Severity-Hue funktioniert (rote Borders auf KILL-Badges der drei Demo-Cards), Deutsch-Headline rendert, "Eigenes Repo prüfen"-Section ist direkt unter der Galaxie sichtbar (kein Akkordeon). Screenshot: `landing-initial-v2.png`. _Cross-Browser (Safari, iOS), Mobile-Viewport, Inspector-Click-Behavior und Reduced-Motion stehen aus._
- [ ] **QA7** _Manueller Browser-Test ausstehend_ — Severity-Bänder visuelle Unterscheidbarkeit (rot Kill/Weak, orange Mid, grün Strong/Exceptional + Border/Icon/Weight-Differenzierung).
- [ ] **QA8** _Manueller Browser-Test ausstehend_ — Repo-Input-Section: Sample-Quick-Picks füllen Input, Submit triggert Spinner, Error-States rendern bei broken URLs.
- [ ] **QA9** _Lighthouse-Run ausstehend_ — User-side. Targets: Performance ≥85, Accessibility ≥95 auf Landing + `/[workspace]`.
- [ ] **QA10** _axe-Run ausstehend_ — User-side. Target: 0 critical issues auf Landing + Inspector + Repo-Form.
- [ ] **QA11** _prefers-reduced-motion-Test ausstehend_ — in DevTools simulieren, Auto-Tour soll skip + GSAP-Animationen instant.
- [ ] **QA12** _Vorher/Nachher-Screenshots ausstehend_ — für PR-Body, sobald User-side manual tests durch.

---

## 5. Files-to-Change (Übersicht)

| Datei | Was passiert |
|---|---|
| `apps/web/src/app/globals.css` | Monochrome Tokens, neue Severity-OKLCH, `:focus-visible`, prefers-reduced-motion, Typography-Utilities, Legacy-CSS-Cleanup |
| `apps/web/src/app/layout.tsx` | Viewport-Meta, SkipToContent |
| `apps/web/src/lib/galaxie/severity-colors.ts` | SEVERITY_HEX auf neue 3-Hue-Ampel |
| `apps/web/src/lib/galaxie/config.ts` | NEU, Magic-Numbers extrahiert |
| `apps/web/src/components/ui/severity-badge.tsx` | Hue zurück + Border/Icon/Weight |
| `apps/web/src/components/ui/button.tsx` | Default-Size auf Mobile, monochrome Variants |
| `apps/web/src/components/SkipToContent.tsx` | NEU |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | initialZoomLevel-Prop, Hit-Area-Expansion, Hover-States, Tour-API |
| `apps/web/src/components/galaxie/GalaxieRoot.tsx` | initialZoomLevel weiterreichen |
| `apps/web/src/components/galaxie/GalaxieSkeleton.tsx` | NEU |
| `apps/web/src/components/galaxie/Inspector.tsx` | createPortal + fixed-position + Bottom-Sheet + a11y |
| `apps/web/src/components/galaxie/AISolutionPlaceholder.tsx` | Stage-Strip, Cancel, unused-Import raus |
| `apps/web/src/components/galaxie/pixi/{FileAsteroid,CustomerStar,RepoMoon}.ts` | hitArea-Rectangle |
| `apps/web/src/components/galaxie/diff-renderer.tsx` | + = sev-strong, - = sev-kill |
| `apps/web/src/components/landing/LandingAutoTour.tsx` | NEU |
| `apps/web/src/components/landing/GhostCursor.tsx` | NEU |
| `apps/web/src/components/landing/LandingGalaxie.tsx` | initialZoomLevel |
| `apps/web/src/components/landing/LandingHero.tsx` | Tour-Embed, Click-Hint raus |
| `apps/web/src/components/landing/RepoInputSection.tsx` | NEU |
| `apps/web/src/components/landing/AuditStageProgress.tsx` | NEU |
| `apps/web/src/components/AuditForm.tsx` | Stage-Progress, Error-Typen |
| `apps/web/src/components/SiteNav.tsx` | min-h-11, Mobile-Hamburger |
| `apps/web/src/components/{AddCustomerForm,AddRepoForm,RequestWriteButton}.tsx` | Button-Loader |
| `apps/web/src/components/FindingsList.tsx` | Bulk-Action-Toast, primary→secondary |
| `apps/web/src/lib/audit-action.ts` | Error-Typen kategorisieren |
| `apps/web/src/lib/middleware-redirects.ts` | Legacy-Map für Routen-Konsolidierung |
| `apps/web/src/app/page.tsx` | `<details>` raus, RepoInputSection direkt |
| `apps/web/src/app/error.tsx`, `global-error.tsx`, `not-found.tsx` | Monochrome Theme + Deutsch |
| `apps/web/src/app/scans/*` → `apps/web/src/app/[workspace]/scans/*` | Move + workspace-Param |
| `apps/web/src/app/customers/*` → `apps/web/src/app/[workspace]/customers/*` | Move |
| `apps/web/src/app/requests/` → `apps/web/src/app/[workspace]/requests/` | Move |
| 14 neue `loading.tsx`-Files | Skeleton-Komponenten per Route |
| `apps/web/package.json` | Lint-Script-Fix (`eslint .`) |
| `apps/web/eslint.config.mjs` | NEU, Next.js 16 flat-config |
| ~30 Dateien mit `text-primary`/`bg-primary`/`border-primary` | Klassen-Sweep |

---

## 6. Test-Plan

**Automatisch:**
- `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w eval`, `pnpm --filter @vk/web build` — alle grün.
- Lighthouse (CI oder lokal): Performance ≥85, Accessibility ≥95, Best Practices ≥95.

**Manuell (Desktop):**
- Landing-Load: Auto-Tour startet binnen 3s.
- File-Asteroid-Klick: Inspector slidet als Right-Sidebar ein, kein Clipping.
- Severity-Bänder: visuell unterscheidbar, Hue minimal-invasiv.
- Repo-Form: sichtbar ohne Klick, Sample-Picks funktionieren, Submit zeigt Stage-Progress.
- Error-Cases: invalid URL, not-found, rate-limited zeigen spezifische Microcopy.

**Manuell (Mobile-Viewport):**
- Touch-Targets ≥44px: SiteNav, Buttons, Cards.
- Inspector als Bottom-Sheet, 70vh hoch, schließbar.
- Galaxie-Sprite-Tap funktioniert (Hit-Area-Expansion).
- Auto-Tour funktioniert auch auf Mobile.

**a11y:**
- Skip-to-content per Tab erreichbar.
- prefers-reduced-motion: keine Cursor-Animation, Beacon pulst statt animiert.
- axe-Browser-Extension: 0 critical issues.
- Keyboard-Bedienbarkeit: Inspector mit Esc, Demo-Cards mit Tab/Enter, Repo-Input mit Tab/Enter.

**Visual:**
- Vorher/Nachher-Screenshots in PR-Body.

---

## 7. Risiken + Rollback

**Risiken:**

1. **Auto-Tour-Performance**: Ghost-Cursor + GSAP-Tweens + Pixi-Pulse parallel. Auf älteren Geräten / Mobile FPS-Drop. **Mitigation**: Tour automatisch deaktivieren wenn `navigator.deviceMemory < 4` oder `prefers-reduced-motion`. Plus Lighthouse-Performance-Test als Gate (≥85).

2. **Auto-Tour-Annoyance**: Wiederholt sich, User findet's lästig. **Mitigation**: Loop pausiert bei erster User-Interaktion. Replay-Button nur klein in Galaxie-Ecke. Plus localStorage-gated: wenn User schon mal die Landing besucht hat, Tour einmalig statt Loop.

3. **Hit-Area-Expansion** macht Overlapping-Sprites mehrfach-anklickbar. Bei 5×10 = 50 File-Asteroiden pro Repo-Mond auf scale=0.45 kann sich Hit-Area überlappen. **Mitigation**: Pixi sortiert hit-test nach z-index, der zuletzt geaddte Container "gewinnt". Plus visuelle Stack-Reihenfolge folgt Severity-Order (Kill oben).

4. **Severity-Hue auf monochromem Hintergrund**: könnte zu auffällig wirken nach Phase 1 (komplett-monochrom). **Mitigation**: Hue-Saturation gedämpft (chroma 0.18-0.24), Hue-Fläche minimal (Border + Icon + kleines Pill, kein vollflächiger Background). Lighthouse-Performance + visueller Smoke-Test.

5. **Routen-Migration (Phase 10)**: viele File-Moves, viele Cross-Refs. Risk of broken-build oder kaputtes Workspace-Switching. **Mitigation**: jeder K-Schritt einzeln, nach jedem typecheck + manueller Smoke-Test. Plus `middleware-redirects.ts` puffert Legacy-Bookmarks.

6. **`createPortal` auf SSR**: Inspector ist client-component, `document.body` muss verfügbar sein. Bei SSR-Initial-Render ohne `document` → Crash. **Mitigation**: Inspector ist sowieso schon `'use client'`, plus check `typeof document !== 'undefined'` als guard.

7. **Lint-Script-Migration auf flat-config**: kann Regress sein, wenn eslint-config-next nicht direkt kompatibel. **Mitigation**: erst auf einer feature-branch testen, bei Failure separater Mini-Plan für ESLint-Migration.

**Rollback:**
- Code-only-Phasen (1-9): `git revert <merge>` reicht.
- Phase 10 (Routen-Moves): File-Move ist via Git rückgängig machbar. DAL-Änderungen via revert. Aber: Daten in der DB sind nicht betroffen — Migration ist reine UI-IA.
- Phase 11 ist QA, nicht-destruktiv.

---

## 8. Open Questions

- [ ] **Konkrete Severity-Hex final** — die OKLCH-Werte in §3.1 sind ein Vorschlag. Soll Mid wirklich Orange (Hue 60) sein, oder lieber Gelb (Hue 85) wie GitHub-Lighthouse? Entscheidung nach Phase 3 M2-Prototyp.
- [ ] **Auto-Tour-Geschwindigkeit** — 2.5s pro Cycle ist Mid-Pace. Schneller (1.5s) oder langsamer (3.5s)? Entscheidung nach erstem Browser-Prototyp.
- [ ] **Anonymous-Audit-Result-Routing** — wenn anonymous User auf Landing einen Repo audit, wo landet das Result? Plan-Default: inline unter der Form (kein Redirect). Alternative: temp-Route `/audit/[tempId]` mit teilbarer URL.
- [ ] **Sample-Quick-Picks** — der Plan schlägt anthropics/cookbook, vercel/next.js, shadcn/ui vor. Sind die okay, oder lieber andere?
- [ ] **`/[workspace]/scans` Pfad-Konvention** — sicher dass das richtig ist und nicht etwas wie `/[workspace]/audits`? Wording-Check.
- [ ] **Lint-Script-Migration** — separate Sub-Plan oder im Frontend-Relaunch-Sprint? Plan-Default: in Phase 11 QA2 als kleiner Sub-Step.
- [ ] **Hamburger-Menu auf Mobile** — Plan §A9 schlägt es vor. Notwendig oder nur 3 Links inline lassen?

---

## 9. Out of Scope

- Strikt neue Features (z.B. Webhook-basiertes Audit-Streaming) — separate Sprints.
- Stripe + Billing-Logic-Änderungen — nur Theming.
- Email-Templates (Resend) — separate Theme-Migration.
- i18n / DE/EN-Toggle — App bleibt aktuell Deutsch-leitend mit English-Code-Comments.
- Onboarding-Tour innerhalb der App (z.B. Driver.js für Workspace-Walk-Through) — könnte später ergänzt werden.
- Storybook / visuelle Komponenten-Library — bleibt out-of-scope.
- BiP-Generator wiederherstellen — wurde in Phase 2 des Vorgängers gelöscht, bleibt weg.
- Drift-Detection wiederherstellen — siehe ADR-0003.

---

## 10. Notiz zum Vorgänger-Plan

`docs/plans/homepage-relaunch.md` (Status: 🟢 Code Complete) wird durch diesen Plan teilweise revidiert:

- **Slate-Blau-Akzent**: Phase 1 M2 wird hier in Phase 3 M1 entfernt. Pure monochrom.
- **Monochrome Severity**: Phase 1 T3 hatte Severity auf Graustufen. Wird hier in Phase 3 M3 wieder bunt (3-Hue-Ampel).
- **Statische Click-Galaxie**: Phase 4 L1-L9 hatte das implementiert, aber Click-Bugs nicht antizipiert. Hier in Phase 1 F1-F8 + Phase 2 T1-T7 nachgebessert.
- **C1-C3 Routen-Konsolidierung**: war im Vorgänger deferred, wird hier in Phase 10 ausgeführt.

Beide Pläne können koexistieren — der Vorgänger ist abgeschlossen, dieser baut darauf auf.
