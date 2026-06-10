# Linear-Aesthetic — Style-Guide für Phase Nova

> Erstellt: 2026-05-20
> Status: 🟢 Living-Doc (wird mit Tokens & Komponenten erweitert; Workspace-Hub-Polish in Nova-3b)
> Phase: Nova (Foundation: `docs/plans/done/nova/nova-2-full-product.md`; Polish-Iteration: `docs/plans/nova-3-repo-polish-and-prod-prep.md`)

Dieses Doc ist die single source of truth für visuelle Sprache, Schriften, Tokens und Motion in Phase Nova. Es dokumentiert, was schon im Bestand ist, und legt fest, was neu kommt.

---

## 1. Grund-DNA

**Pitch-black, monochrom, Mono-Typo-Akzente, Hairline-Borders, severity-only-color.**

Der visuelle Eindruck ist „Operator-Konsole für Premium-B2B" — keine Gradients als Schmuck, keine Bunt-Akzente. Farbe trägt **ausschließlich Severity-Information** (Kill/Weak/Mid/Strong/Exceptional). Alles andere ist Grauskala mit kühlem Blau-Stich (Hue 270).

Inspiration: Linear · Vercel Dashboard · Stripe Dashboard · Arc Browser (Calm-Mode).
Anti-Inspiration: Stripe-Press Editorial · Bunte SaaS-Marketing-Sites · Game-HUDs.

---

## 2. Schriften

| Rolle           | Schrift                | Quelle                          | Gewichte    |
|-----------------|------------------------|---------------------------------|-------------|
| Display + Body  | **Geist Sans**         | `next/font/google` (bereits da) | 400/500/600 |
| Labels + Code   | **Geist Mono**         | `next/font/google` (bereits da) | 400/500     |

**Plan-Empfehlung:** Master-Plan §3 N12 nannte *„Geist Sans + JetBrains Mono"*. Die Code-Basis nutzt aber bereits **Geist Mono** — Konsistenz mit Geist Sans (gleicher Provider, gleiche optical-tuning, ein Font-Family-Concern weniger). **Empfehlung: Geist Mono behalten, nicht auf JetBrains Mono wechseln.** Falls JetBrains Mono explizit gewünscht ist, muss Master-Plan §3 N12 bestätigt und globals.css `--font-mono` umgestellt werden.

**Type-Scale** (bereits in globals.css `@utility type-*` definiert, **behalten 1:1**):

| Klasse           | Größe    | Line-Height | Verwendung                          |
|------------------|----------|-------------|-------------------------------------|
| `type-display`   | 36px     | 1.2         | Hero-Headlines (Landing)             |
| `type-h1`        | 30px     | 1.25        | Page-Headlines                       |
| `type-h2`        | 20px     | 1.3         | Section-Headlines                    |
| `type-body`      | 15px     | 1.5         | Default Body                         |
| `type-body-sm`   | 13px     | 1.5         | Compact Body                         |
| `type-caption`   | 12px     | 1.4         | Captions, Metadata                   |
| `type-mono-sm`   | 11px     | 1.4         | Mono-Labels, Severity-Pills, Codes   |

**Letter-Spacing-Konvention:** nur Display + H1 leicht negativ (-0.015 bis -0.02em), alles andere normal. Mono-Klassen nie letter-spaced.

---

## 3. Farb-Tokens (oklch)

### 3.1 Grayscale (Hue 270 = kühles Blau-Grau, Linear-typisch)

Aktuelles Token-Set ist **Linear-nah** und wird behalten. Im Vergleich:

| Token                  | Heute (globals.css)           | Linear-Reference            | Diff   |
|------------------------|-------------------------------|------------------------------|--------|
| `--background`         | `oklch(0.155 0.004 270)`     | ~`oklch(0.13 0 0)`           | leicht heller, leichter Blau-Stich. **Empfehlung: behalten.** Pitch-black ist zu hart für lange Lese-Sessions. |
| `--card`               | `oklch(0.205 0.005 270)`     | ~`oklch(0.18 0 0)`           | behalten |
| `--foreground`         | `oklch(0.94 0.005 270)`      | ~`oklch(0.95 0 0)`           | behalten |
| `--muted-foreground`   | `oklch(0.66 0.012 270)`      | ~`oklch(0.65 0 0)`           | behalten |
| `--border`             | `oklch(0.295 0.006 270)`     | ~`oklch(0.25 0 0)`           | leicht heller — könnte für noch hairlinere Anmutung auf `oklch(0.25 0.004 270)` gehen. **Decision in Nova-8.** |

**Pitch-Black-Hero:** Für den R3F-Background (außerhalb der DOM-Hierarchie) wird `oklch(0.05 0.004 270)` als drei.js-Scene-Background gesetzt — das ist tiefer als `--background` und schafft Tiefe im Übergang Galaxie ↔ Side-Routes.

### 3.2 Severity-Skala (load-bearing — striktes 3-Farben-System)

**SSOT = `globals.css` `--sev-*`** (Tailwind: `--color-sev-*`). `lib/galaxie/severity-colors.ts` ist nur noch ein Var-Mapper (`severityColorVar` → `var(--color-sev-*)`) — kein Hex-Duplikat. Genau **3 Akzent-Hues** app-weit: Rot=negativ, Orange=neutral, Grün=positiv (visual-overhaul, 2026-06-10):

| Severity        | OKLCH                     | Achse / Rolle                         |
|-----------------|---------------------------|---------------------------------------|
| **Kill**        | `oklch(0.62 0.24 25)`     | Rot, voll — die einzige laute Band    |
| **Weak**        | `oklch(0.55 0.15 28)`     | Rot, gedämpft (dunkler, weniger Chroma)|
| **Mid**         | `oklch(0.68 0.13 65)`     | EIN gedämpftes Orange (nicht grell)   |
| **Strong**      | `oklch(0.62 0.15 150)`    | Grün                                  |
| **Exceptional** | `oklch(0.74 0.16 150)`    | Grün, heller (= „special")            |

Severity ist die **einzige Farbquelle** in der App. CTAs, Links, Active-States nutzen Grauskala (`--primary` = near-white). **Badge-Konvention** (`SeverityBadge`): einheitliche 1px-Hairline-Pills, nur **Kill** gefüllt (`--sev-on-kill` Text) — kein border-2/3px, kein dashed, kein italic. Disambiguierung innerhalb Rot/Grün trägt das **Textlabel + Fill-vs-Outline**, nie der Hue allein → color-blind-safe trotz Rot-Grün-Achse.

### 3.3 Gradient-Mesh (NEU für Phase Nova)

Für Hero-Backgrounds + leere Galaxie-Räume wird ein dezenter Gradient-Mesh als CSS-Pattern eingeführt:

```css
.bg-gradient-mesh {
  background:
    radial-gradient(at 20% 30%, oklch(0.20 0.01 270 / 0.5) 0px, transparent 50%),
    radial-gradient(at 80% 60%, oklch(0.18 0.02 280 / 0.4) 0px, transparent 50%),
    radial-gradient(at 50% 90%, oklch(0.22 0.01 260 / 0.3) 0px, transparent 50%),
    var(--background);
}
```

Anwendung: Hero-Section-Background, Empty-Galaxie-Layer, Onboarding-Card-Backdrop. **Nicht** auf Form-Pages oder Tabellen.

---

## 4. Spacing + Radii

### 4.1 Spacing-Skala (Tailwind-Default reicht, dokumentiert):

`4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px` — entspricht `space-1` bis `space-16` in Tailwind.

**Konvention:**
- Component-Internal-Spacing: `8px` (gap-2) oder `12px` (gap-3)
- Section-Spacing: `24px` (gap-6) oder `48px` (gap-12)
- Page-Padding: `24px` mobile, `32px` desktop
- Nie inline-pixel-Werte wie `text-[10px]`.

### 4.2 Radii (bereits in globals.css als `--radius-*`):

| Token         | Wert      | Verwendung                          |
|---------------|-----------|-------------------------------------|
| `--radius-sm` | `0.3rem`  | Input, kleine Buttons               |
| `--radius-md` | `0.4rem`  | Standard Card-Corners               |
| `--radius-lg` | `0.5rem`  | Modal, Drawer, große Cards          |
| `--radius-xl` | `0.7rem`  | Hero-Container                      |
| `--radius-2xl`| `0.9rem`  | Selten, Special-Cases               |

**Linear-Konvention:** Linear nutzt `4px` (sm) und `6px` (md) durchgängig. **RESOLVED 2026-06-10 (app-visual-overhaul):** `--radius` auf `0.375rem` (6px) gesenkt — alle `--radius-*` skalieren via `calc()` mit. Linear-Härte umgesetzt.

---

## 5. Borders + Shadows

**Hairline-Konvention:** Alle visuellen Trennlinien sind **1px solid**, Farbe `--border` (oklch 0.295). Keine `border-2`, keine doppelten Borders. Nie `box-shadow` als Border-Ersatz.

**Shadow-Konvention:** Linear nutzt fast keine Drop-Shadows — Tiefe wird über **Background-Color-Layering** erzeugt (Card heller als Background heller als Modal-Backdrop). Phase Nova folgt dem. Erlaubte Shadows:
- Modal/Drawer: `shadow-2xl` mit `shadow-black/40` (sehr subtil).
- Hover-Lift auf Cards: nicht zugelassen. Stattdessen `bg-card` → `bg-secondary` Background-Wechsel.

**Glassmorphism:** **Nein.** Ist Apple/Arc-DNA, nicht Linear. `backdrop-blur` nur für Inspector-Header (über R3F-Canvas) und Tooltip-Overlay.

---

## 6. Motion + Easings

### 6.1 Easing-Token

Neu für Phase Nova, in globals.css als CSS-Vars aufnehmen (Nova-1):

```css
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
}
```

**Anwendung:**
- Modal/Drawer Slide-In: `var(--ease-out-expo)`, 280ms.
- Tab-Wechsel: `var(--ease-out-quart)`, 180ms.
- Camera-Tween (R3F): `easeOutCubic` (react-spring built-in).
- Pulse-Animation (Severity Kill/Weak): `ease-in-out` (Sinus-Yoyo, 1.6s / 1.0Hz / 0.56s Halbperiode).

### 6.2 Reduced-Motion

Bereits in globals.css `@media (prefers-reduced-motion: reduce)` implementiert: alle Animations + Transitions → 0.01ms. Phase Nova **behält** das + erweitert:
- R3F: keine Pulse-Uniforms, kein Auto-Tour.
- Camera-Tween → instant-snap statt Spring.
- Postprocessing-Bloom bleibt (statisch, kein Animation-Concern).

### 6.3 Strict-Verbote

- Keine GSAP-Tween auf React-State (Re-Renders pro Frame = Tod).
- Keine `motion`-Variants auf R3F-Meshes (Reconciler-Roundtrip).
- Keine CSS-`transition: all` (Performance-Tax + überraschende Animations).

---

## 7. Komponentensprache (Linear-Vokabular)

### 7.1 Buttons

```
┌─────────────────────────────┐
│  Primary Button             │  ← near-white bg, near-black text, kein Gradient
└─────────────────────────────┘

┌─────────────────────────────┐
│  Secondary Button           │  ← --secondary bg, --foreground text, hairline border
└─────────────────────────────┘

  Tertiary Action  →             ← Text-only, hover: bg-secondary/50
```

- Höhe: 32px (sm), 36px (md, default), 40px (lg)
- Padding: 12px / 16px / 20px horizontal
- Border-Radius: `--radius-sm` durchgehend
- Mono-Typo für Action-Labels in Galaxie-Kontext (z.B. "Apply", "Dismiss"), Sans für Standard-CTAs

### 7.2 Cards

```
┌─────────────────────────────────────────┐
│  ╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴  │
│                                          │
│   Card Title                             │
│   ──                                     │  ← Caption (mono-sm, muted)
│                                          │
│   Body content goes here.                │
│   Multi-line is allowed.                 │
│                                          │
│   [ Action ]      [ Secondary ]          │
│                                          │
└─────────────────────────────────────────┘
```

- Background: `--card`
- Border: 1px `--border`
- Padding: 24px innen
- Title: `type-h2`, Body: `type-body`, Captions: `type-mono-sm uppercase tracking-wider`

### 7.3 Inspector-Drawer (Linear-Issue-Sidepanel-Inspired)

```
                                          ┌──────────────────────────┐
                                          │ Kill  payments/auth.ts   │ ← Severity-Pill + Mono-Path
                                          │ ╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴╴ │
                                          │                          │
                                          │ ┌─Detail──Why─AI Sol──┐  │ ← Tabs (Linear-Style)
                                          │                          │
                                          │  Finding                 │ ← mono-sm uppercase
                                          │  payments/auth.ts        │
                                          │                          │
                                          │  Detail                  │
                                          │  Lorem ipsum dolor sit   │
                                          │  amet, consectetur ...   │
                                          │                          │
                                          │  ─────────────────       │
                                          │                          │
                                          │   [ Apply as PR ]        │
                                          │   [ Dismiss ▾ ]          │
                                          │                          │
                                          └──────────────────────────┘
```

- Width: 380px desktop, 100vw mobile (Bottom-Sheet)
- Background: `oklch(0.10 0.004 270 / 0.92)` + `backdrop-blur-md` (über R3F-Canvas)
- Border-Left: 1px `--border` (Desktop) / Border-Top + Rounded-Top (Mobile)

### 7.4 Topbar (Linear-Workspace-Style)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ◉ vk     Workspace ▾     ⌘K Search…                              [ User ▾ ]│
└────────────────────────────────────────────────────────────────────────────┘
```

- Höhe: 48px
- Background: `--background` (kein Border-Bottom, Galaxie blendet drunter durch)
- Logo: 24px, monochrom
- Workspace-Switcher: Dropdown mit Recent + Search (Q-N2: Topbar-Dropdown)
- Search-Trigger: `cmdk` (⌘K-Hint visible) — öffnet Command-Palette

### 7.5 Empty-State (First-Run-Card)

```
                      ┌────────────────────────────────────┐
                      │                                    │
                      │    Audit your first repo           │ ← type-h1
                      │                                    │
                      │    ┌──────────────────────────┐    │
                      │    │ https://github.com/...   │    │ ← Input
                      │    └──────────────────────────┘    │
                      │                                    │
                      │    [ Run audit ]                   │ ← Primary CTA
                      │                                    │
                      │    or skip to the demo galaxy →    │ ← Tertiary
                      │                                    │
                      └────────────────────────────────────┘
                          centered, ~480px max-width
                          bg-gradient-mesh layer behind
```

---

## 8. R3F-spezifische Aesthetic-Notes

> ⚠ **Stand 2026-05-20: Diese gesamte Sektion ist superseded.** R3F wurde verworfen — Landing nutzt SVG + motion (siehe ADR-0004), Workspace-Galaxie bleibt auf PixiJS v8 (ADR-0002). Sektion bleibt als Referenz für eine eventuelle Nova-3+ Migration auf einen einheitlichen 3D-Stack. Aktuell **keine** dieser Konventionen sind im Code wirksam.

Da Nova primär die Galaxie auf R3F portiert, hier explizit:

### 8.1 Material-Konvention

- File-Asteroiden + Repo-Monde + Customer-Sterne: `MeshStandardMaterial` mit
  - `color` = Severity-Hex (3.2)
  - `emissive` = gleiche Farbe, `emissiveIntensity` ~0.8–1.5 je nach Severity (Kill > Strong)
  - `roughness` = 0.4
  - `metalness` = 0.0

### 8.2 Lighting

- Eine globale `ambientLight` mit `intensity={0.15}` (kühl-blau).
- Eine `directionalLight` von hoch-rechts, `intensity={0.5}`, `color={'#9aa4b8'}` — für leichtes Modeling.
- Keine Point-Lights pro Asteroid (Performance-Killer bei 500 Knoten).

### 8.3 Postprocessing-Stack

In Reihenfolge:
1. **Bloom** (selektiv auf emissive Material): `intensity={0.6}`, `luminanceThreshold={0.3}`.
2. **Vignette**: subtil, `darkness={0.3}`, `offset={0.5}`.
3. **ChromaticAberration**: sehr leicht, `offset={[0.0005, 0.0005]}` — nur bei Idle, deaktiviert während Pan/Zoom.
4. **Tonemapping**: ACES-Filmic via `gl.toneMapping = THREE.ACESFilmicToneMapping`.

Kein SSAO, kein DepthOfField (Mobile-Tax zu hoch).

### 8.4 Background

R3F-Scene-Background: `oklch(0.05 0.004 270)` (tiefer als `--background`). Vor den Knoten:
- Particle-Field (BufferGeometry-Points), ~1000 statische Sterne, Größe 0.5–1.5, weiß bei 30% Opacity.
- Subtiler Volumetric-Fog (FogExp2, `density=0.008`) — gibt Tiefe für Parallax.

### 8.5 Connection-Lines (Customer→Repo→File)

- `THREE.Line2` mit `LineMaterial`, `linewidth={1}` (entspricht 1px), `color={'#2a2e36'}`.
- Opacity 0.4 default, 0.8 wenn Customer/Repo hovered.
- Keine Animationen — statisch, sonst optischer Lärm.

---

## 9. Beispiel-Composition: Landing-Hero

```
┌──────────────────────────────────────────────────────────────────────┐
│  Topbar (48px, transparent)                                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│              Headline: type-display, near-white                     │
│              Subhead: type-body, muted-foreground                   │
│              [ CTA Primary ]    [ CTA Secondary ]                   │
│                                                                      │
│              ╶── R3F-Hero Canvas ──╴                                │
│                                                                      │
│                  ✦                                                   │
│                  │\                                                  │
│                  │ \    ●  payments-api                              │
│                  │  \  / \                                           │
│                  ● ● ● ● ● ●   ← Asteroiden                          │
│                                                                      │
│              (Single-Repo Premium · 3 klickbare Findings)            │
│                                                                      │
│              Inspector slides in von rechts ↗                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 10. Token-Audit: globals.css heute → Phase-Nova-Ziel

| Token                          | Heute                          | Phase-Nova-Aktion       |
|--------------------------------|--------------------------------|--------------------------|
| `--font-sans`                  | `"Geist", ...`                 | **behalten**             |
| `--font-mono`                  | `"Geist Mono", ...`            | **behalten** (vs. JetBrains: siehe §2 Empfehlung) |
| `--background`                 | `oklch(0.155 0.004 270)`      | behalten                 |
| `--card` ... `--ring`          | oklch-grayscale Hue 270        | behalten 1:1             |
| `--sev-*` (5 Bänder)           | siehe §3.2                     | behalten 1:1             |
| `--radius`                     | `0.375rem` (6px)               | ✅ RESOLVED 2026-06-10: von 8px auf 6px (Linear-Härte) |
| Type-Scale `type-*`            | display→mono-sm                | behalten                 |
| `--ease-*` Easings             | **fehlt**                      | **Nova-1 NEU**           |
| Gradient-Mesh Background-Pattern | **fehlt**                    | **Nova-1 NEU**           |
| `.asteroid-pulse` keyframes    | für statisches SVG-Hero        | **Nova-2 RAUS** (R3F übernimmt) |
| Reduced-Motion `@media`        | vorhanden                      | behalten + erweitern (R3F) |

---

## 11. Was bewusst NICHT im Style-Guide steht

- Konkrete Komponenten-Implementierungen (das ist Sub-Plan-Sache, hier nur Visual-Sprache)
- Severity-Triage-Workflow (das ist UX, nicht Visual)
- Galaxie-Layout-Algorithmus (das ist `lib/galaxie/layout.ts`)
- A11y-Implementierung (das ist Nova-10)

---

## 12. Offene Sub-Decisions (parked, ohne Sprint-Slot)

Diese 3 Sub-Decisions hingen ursprünglich an Nova-1/Nova-8, die beide verworfen wurden (R3F-Pivot). Sie sind kein Sprint-Block — wenn die Anmutung in der täglichen Arbeit als unrund wahrgenommen wird, kann ein einzelner Mini-Plan jeden Punkt anfassen.

1. **Geist Mono behalten oder zu JetBrains Mono wechseln?** (§2) — Empfehlung: behalten.
2. ✅ **RESOLVED 2026-06-10:** Radius auf 6px gesenkt (`--radius: 0.375rem`, app-visual-overhaul).
3. **Border-Token leicht dunkler (`oklch(0.25 0.004 270)`) für hairlinere Anmutung?** (§3.1) — Empfehlung: erst nach Side-by-Side-Test entscheiden.
