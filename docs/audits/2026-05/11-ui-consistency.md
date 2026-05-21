# Audit Sub-11 — UI-Konsistenz

> Generated: 2026-05-21
> Domain: shadcn/ui-vk-Split · OKLCH-Tokens · Patterns · Pro-Look
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}
> Repo-Root: `/Users/koljaschope/Documents/rohan`

## Summary

- **shadcn-Compliance**: PARTIAL — App-Pages importieren Card/Button/Tabs/Badge sauber aus `@/components/ui/*`. ABER: Die komplette Galaxie-Chrome (`Inspector`, `ActivationChecklist`, `WorkspaceSwitcher`, `ZoomIndicator`, `UniversalSearch`, `Tooltip`, `EmptyGalaxie`, `AISolutionPlaceholder`) bypassed shadcn vollständig — eigene `<button>`-Roll-Ups mit hardcoded Tailwind statt `Button`/`Dropdown-Menu`/`Tooltip`/`Card`/`Popover`-Imports. **0** shadcn-Imports in `apps/web/src/components/galaxie/`.
- **ui-vk-Compliance**: **2 von 23 App-Pages** verwenden `PageShell` + `PageHeader` (`/[workspace]/customers`, `/[workspace]/scans`). Die anderen 21 Pages (Settings × 11, Customer-Detail, Repo-Detail, Status, Trust, Pricing, Login, Legal × 3, Account-Settings × 5) verwenden ad-hoc `<main>`-Wrapper, inkonsistente Padding, inkonsistente Header-Markup.
- **Token-Drift (hardcoded color/spacing)**:
  - **5 hardcoded Hex** in Production-Path (`WorkspaceSwitcher.tsx:77/79/81` Plan-Colors; `StaticGalaxieSVG.tsx:163` dimmed-grey; `RequestActions.tsx:26` toast color)
  - **8 hardcoded `rgba()`** Galaxie-Backgrounds (Skeleton, MiniMap, Scene, StaticSVG)
  - **84 Vorkommnisse** `text-white|border-white|bg-white` in galaxie-Components (statt vk-Tokens / shadcn-Semantics)
  - **18 Vorkommnisse** `bg-black|text-black` in galaxie (statt `bg-vk-ink-0/1/2` oder `bg-card/popover/background`)
  - **3 hardcoded amber/green** Tailwind-Farben in production (`settings/integrations:37`, `GalaxieScene:857` FPS-Counter green-400, `CreditMeter:65` / `billing/page:200` bg-amber-500)
- **Page-Layout-Consistency**: 2 / 23 pages verwenden ui-vk-Primitives. Score ~9%.
- **GalaxieRoot Pro-Look-Status**: **Mid — wirkt funktional aber unfinished gegen Linear/Vercel-Standard.** Hauptprobleme: (1) komplettes Bypass des Design-Systems mit Tailwind-Inline-Styles; (2) Glass-Pattern uneinheitlich (5 verschiedene `bg-black/XX` Werte zwischen 0.70 und 0.95); (3) Border-Radius-Soup (`rounded` ohne Suffix mischt sich mit `rounded-md`, `rounded-lg`, `rounded-2xl`, `rounded-t-2xl`); (4) Kein `focus-visible` auf den Custom-Buttons der Galaxie-Chrome; (5) Icons ohne `aria-hidden` außer in `ActivationChecklist`; (6) Mono-vs-Sans-Mix inkonsistent (manchmal `font-mono text-xs`, manchmal `type-mono-sm` — beides existiert nebeneinander).

---

## Findings

### Kill FN-01 — Hardcoded Hex in WorkspaceSwitcher Plan-Colors
**File:** `apps/web/src/components/galaxie/WorkspaceSwitcher.tsx:77-81`
**Issue:** Plan-Indicator nutzt 3 hardcoded Hex (`#3b82f6` solo, `#eab308` team, `#fbbf24` agency). Nicht im OKLCH-Token-System.
**Why Kill:** Hex in Production-Path; bricht Dark-Mode-Theming; jeder Theme-Wechsel würde die Indicator-Farbe ignorieren; entspricht nicht der 3-Tier-Tokens-Konvention (Nova-2 Foundation).
**Suggested Fix:** `--vk-plan-solo / --vk-plan-team / --vk-plan-agency` als CSS-Vars in `globals.css` definieren, dann `style={{ background: 'var(--vk-plan-solo)' }}` oder besser Tailwind-Utility `bg-[var(--vk-plan-solo)]`.

### Kill FN-02 — Hardcoded #404040 in StaticGalaxieSVG dimmed-state
**File:** `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx:163`
**Issue:** `const color = dimmed ? "#404040" : SEVERITY_COLOR_VAR[f.severity];`
**Why Kill:** Hex direkt in Production-Render-Path. Die dimmed-state sollte über `var(--vk-ink-5)` o.ä. laufen — der Rest des Renderers nutzt korrekt `SEVERITY_COLOR_VAR` mit CSS-Vars.
**Suggested Fix:** `const DIMMED_COLOR_VAR = "var(--vk-ink-5)"; const color = dimmed ? DIMMED_COLOR_VAR : SEVERITY_COLOR_VAR[f.severity];`

### Kill FN-03 — Hardcoded #06231e in RequestActions
**File:** `apps/web/src/components/RequestActions.tsx:26`
**Issue:** `color: "#06231e"` in inline-style.
**Why Kill:** Hex in Production-Path außerhalb Token-System.
**Suggested Fix:** Via `--color-primary-foreground` oder ähnlichem semantischen Token ersetzen.

### Kill FN-04 — Hardcoded amber-Farben (3 Stellen)
**Files:**
- `apps/web/src/app/[workspace]/settings/integrations/page.tsx:37` — `border-amber-500/30 bg-amber-500/5 text-amber-200`
- `apps/web/src/app/[workspace]/settings/billing/page.tsx:200` — `bg-amber-500`
- `apps/web/src/components/CreditMeter.tsx:65` — `bg-amber-500`

**Issue:** Tailwind-Default-Palette (amber-500/200) in Production statt `--vk-status-warn` oder `--color-sev-mid`.
**Why Kill:** Bricht das deterministische 3-Tier-System. Inkonsistent zu `severity-colors.ts` das alle Warnsignale über OKLCH-Tokens routet.
**Suggested Fix:** `bg-[var(--vk-status-warn)] text-[var(--vk-status-warn)]` o.ä. — semantischer Token "warning".

### Strong FN-05 — Galaxie-Chrome reimplementiert shadcn-Komponenten von Hand
**Files:**
- `Inspector.tsx:312-356` — `Dropdown` von Hand mit `useEffect` click-outside (shadcn `DropdownMenu` existiert)
- `Inspector.tsx:148-201` — Dismiss/Snooze Buttons als rohe `<button>` mit Tailwind statt shadcn `Button` `variant=ghost size=sm`
- `WorkspaceSwitcher.tsx:25-71` — Komplettes Custom-Dropdown mit `motion.div` (shadcn `Popover` oder `DropdownMenu` würden Active-State, Keyboard-Nav, ARIA `role=menu/menuitem` mitliefern)
- `UniversalSearch.tsx:66-117` — Custom-Modal mit `bg-neutral-950` border-`white/15` (shadcn `CommandDialog` existiert; `cmdk` ist schon importiert!)
- `EmptyGalaxie.tsx:6-27` — Eigene EmptyState-Implementation; `EmptyState` in `ui-vk` existiert.
- `Tooltip.tsx:14-26` — Eigene Tooltip; shadcn `Tooltip` existiert (`@/components/ui/tooltip`)
- `AISolutionPlaceholder.tsx:158-164, 240-242` — Custom Retry/Apply-Buttons mit `border border-white/15 bg-white/5`

**Issue:** Komplettes Bypass des shadcn-Layers. Keyboard-Navigation, focus-trap, ARIA-Patterns sind manuell rekonstruiert (oft unvollständig).
**Why Strong:** Konvention aus `CLAUDE.md` ist klar — Composer aus `@/components/ui/*`. Galaxie hat 0 shadcn-Imports. Pattern-Duplication. Wartungslast. A11y-Probleme (kein `role=menu`, kein focus-trap im Inspector-Dropdown).
**Suggested Fix (Phase 3 Priority)**:
1. `UniversalSearch` → shadcn `CommandDialog` (cmdk ist schon dep).
2. `Inspector` Dropdown → `DropdownMenu` aus shadcn.
3. `Inspector` Buttons → shadcn `Button` `variant=ghost`.
4. `WorkspaceSwitcher` → `Popover` + Custom-List inside (Plan-Indicator als Custom).
5. `EmptyGalaxie` → ui-vk `EmptyState` (Icon-prop, title, description, action).
6. `Tooltip` (Galaxie-Hover) bleibt Custom — ist anchored an Mouse-X/Y nicht an Element, shadcn Tooltip kann das nicht.

### Strong FN-06 — App-Pages bypassen PageShell/PageHeader
**Files:**
- `apps/web/src/app/[workspace]/customers/[customerId]/page.tsx:47-58`
- `apps/web/src/app/[workspace]/requests/page.tsx:40-43`
- `apps/web/src/app/[workspace]/repos/[repoId]/page.tsx`
- `apps/web/src/app/[workspace]/repos/[repoId]/access/page.tsx:103`
- `apps/web/src/app/status/page.tsx`
- `apps/web/src/app/trust/page.tsx`
- `apps/web/src/app/trust/dpa/page.tsx`
- `apps/web/src/app/trust/eval/page.tsx`
- `apps/web/src/app/pricing/page.tsx:68`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/billing/page.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/legal/agb/page.tsx:21`
- `apps/web/src/app/legal/dpa/page.tsx:20`
- `apps/web/src/app/legal/subprocessors/page.tsx:77`
- `apps/web/src/app/auth/verify/page.tsx`

Ad-hoc Wrapper: `<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">` (customer-detail) oder `<main className="mx-auto max-w-3xl py-12 px-6">` (legal). Inkonsistente Max-Width (3xl/6xl/7xl), unkontrollierte Padding (`p-4 py-8 sm:px-6` vs `px-6 py-10 sm:px-8 sm:py-12 lg:py-16` in PageShell).

**Why Strong:** Linear/Vercel-Aesthetic erfordert konsistente Page-Rhythmen. PageShell + PageHeader sind das Vehikel. 2/23 (~9%) Adoption ist Drift, nicht Convention.
**Suggested Fix:** Phase-3-Pass — alle non-Workspace-Settings + non-Galaxie pages auf `<PageShell as="main" id="main-content"><PageHeader title="…" subtitle="…" />…</PageShell>` migrieren. Settings haben bereits ihre eigene `SettingsLayout`-Section — gut.

### Strong FN-07 — Settings-Page-Typography-Drift: 7/11 Pages verwenden `text-2xl font-bold` statt `type-h1`
**Files:**
- `apps/web/src/app/[workspace]/settings/integrations/page.tsx:16` — `text-2xl font-bold tracking-tight`
- `apps/web/src/app/[workspace]/settings/ai/page.tsx:86` — `text-2xl font-bold tracking-tight`
- `apps/web/src/app/[workspace]/settings/members/page.tsx:35` — `text-2xl font-bold tracking-tight`
- `apps/web/src/app/[workspace]/settings/billing/page.tsx:103` — `text-2xl font-bold tracking-tight`
- `apps/web/src/app/[workspace]/requests/page.tsx:43` — `text-2xl font-bold tracking-tight`
- `apps/web/src/app/[workspace]/customers/[customerId]/page.tsx:58` — `text-2xl font-bold tracking-tight`
- `apps/web/src/app/[workspace]/repos/[repoId]/access/page.tsx:103` — `text-2xl font-bold tracking-tight`

Korrekt machen es: `general`, `api-keys`, `audit-apply`, `galaxie`, `notifications`, `webhooks`, `danger` mit `type-h1 font-semibold tracking-tight`. **Direkter Side-by-Side-Drift im selben Settings-Layout.**

**Why Strong:** Mid + Strong — schmerzt direkt visuell, da User von General → Integrations → AI navigiert und H1-Größe + Weight zwischen Pages wechselt. Bricht die Linear-typische "page feels the same"-Stabilität.
**Suggested Fix:** Sweep — alle 7 Pages auf `<h1 className="type-h1 font-semibold tracking-tight">` migrieren + die `space-y-1` Header durch das Pattern aus `general/page.tsx:7-12` (`space-y-2 border-b border-border pb-6`) ersetzen für konsistenten Section-Header.

### Strong FN-08 — Lucide Icons in Galaxie-Chrome ohne `aria-hidden`
**Files (alle):**
- `Inspector.tsx:158, 160, 185, 187, 210, 280, 383` — 7 Icons ohne `aria-hidden`
- `WorkspaceSwitcher.tsx:36, 63` — 2 Icons
- `ZoomIndicator.tsx:33` — 1 Icon
- `UniversalSearch.tsx:52, 72` — 2 Icons
- `EmptyGalaxie.tsx:10, 22` — 2 Icons
- `AISolutionPlaceholder.tsx:162, 175, 242, 266` — 4 Icons
- `diff-renderer.tsx` (nicht geprüft, aber wahrscheinlich)

**Why Strong:** Screen-Reader liest jedes Decorative-Icon vor; Inspector-Header heißt damit "EyeOff Dismiss ChevronDown" statt "Dismiss". A11y-Konvention aus Nova-2 (siehe `ActivationChecklist` — macht es korrekt mit `aria-hidden`-Prop). Galaxie-Pages haben damit konsistente A11y-Regression gegen Foundation-Pages.
**Suggested Fix:** Pattern aus `ActivationChecklist.tsx:138, 141, 145` (`aria-hidden` ohne Wert ist short-form für `aria-hidden="true"`) durchgängig anwenden.

### Strong FN-09 — Focus-Ring fehlt komplett in Galaxie-Chrome
**Files:** Galaxie-Chrome hat **0 (null)** `focus-visible:` Vorkommnisse (geprüft via grep — nur `UniversalSearch.tsx:77` hat `outline-none` ohne ersetzendes `focus-visible:` Ring).
**Why Strong:** Tab-Navigation durch Inspector ist invisible. WCAG 2.1 SC 2.4.7 violation. Bricht Linear-Aesthetic-Konvention (Style-Guide `docs/design/linear-aesthetic.md` definiert focus-ring als load-bearing).
**Suggested Fix:** Pattern aus `HeroSection.tsx:270` (`focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2`) auf alle interaktiven Galaxie-Buttons applicen. Mindestens: Dismiss/Snooze/Close in Inspector, alle Buttons in WorkspaceSwitcher + ZoomIndicator + UniversalSearch + ActivationChecklist.

### Strong FN-10 — Glass-Pattern uneinheitlich (5 verschiedene Black-Opazitäten)
**Files & Werte:**
- `bg-black/70` — `WorkspaceSwitcher:29`, `ZoomIndicator:25`, `MiniMap` (nicht), `UniversalSearch:50`, `GalaxieScene:530, 857, 865`
- `bg-black/85` — `WorkspaceSwitcher:45`, `Tooltip:16`, `MiniMap:84`, `ActivationChecklist:95`
- `bg-black/90` — `Inspector:129`
- `bg-black/95` — `Inspector:349` (dropdown)
- `bg-black/40` — `UniversalSearch:61` (modal-overlay)

Plus: `bg-black/80` (`WorkspaceSwitcher` hover), `bg-card/40, bg-card/80, bg-card/90, bg-card/95` in Landing.

**Why Strong:** Pro-Look erfordert dokumentierte Tier-Hierarchie (z.B. `--vk-glass-light`, `--vk-glass-mid`, `--vk-glass-strong`). 5 verschiedene Werte signalisieren Ad-hoc-Tuning statt System.
**Suggested Fix:** 3 Tier-Tokens in `globals.css`:
- `--vk-glass-subtle: oklch(0.06 0.003 270 / 0.7)` für Floating-Chrome (Switcher, Zoom, Search-Trigger)
- `--vk-glass-elevated: oklch(0.06 0.003 270 / 0.85)` für Tooltips, Dropdowns
- `--vk-glass-overlay: oklch(0.06 0.003 270 / 0.92)` für Inspector-Panel, Modal-Dialogs

### Strong FN-11 — Border-Radius-Soup in Galaxie
**Files & Werte (alle in Galaxie-Chrome):**
- `rounded` (= 4px) — Inspector, ZoomIndicator, MiniMap, ActivationChecklist, WorkspaceSwitcher, UniversalSearch
- `rounded-md` (= 6px) — ActivationChecklist:95, GalaxieScene:530
- `rounded-lg` (= 8px) — UniversalSearch:69 (Command-Modal)
- `rounded-2xl` — Inspector:131 (mobile sheet top)
- `rounded-t-2xl` (= 16px top only) — Inspector:131 (mobile bottom-sheet)
- Plus inline `style={{ borderRadius: 'var(--vk-radius-card)' }}` in `ActivationChecklist:96`

**Why Strong:** Pro-Look erfordert Border-Radius-Hierarchie. ActivationChecklist mischt `rounded-md` (className) + `style.borderRadius: var(--vk-radius-card)` (style) — letztes überschreibt, aber das Pattern ist schmutzig.
**Suggested Fix:** 3-Tier-Radius-Tokens (existieren wahrscheinlich schon: `--vk-radius-pill`, `--vk-radius-card`, `--vk-radius-panel`). Galaxie-Chrome auf konsistente Werte:
- Pills (Plan-Indicator, Search-Trigger): `rounded-md` (`--radius-md` = 6px)
- Floating-Cards (Switcher-Dropdown, ZoomIndicator, Tooltip, MiniMap): `rounded-lg` (`--radius-lg` = 8px)
- Inspector-Panel (full-height-sidebar): `rounded-none` (kein border-radius weil flush-right)
- Mobile-Bottom-Sheet: `rounded-t-2xl` (bleibt, ist iOS-Standard)

### Strong FN-12 — Inspector ist eigene Card-Implementation statt shadcn-Sheet
**File:** `apps/web/src/components/galaxie/Inspector.tsx:122-300`
**Issue:** Inspector ist ein `createPortal` zu `document.body` mit eigenem `pointer-events-auto fixed z-50 …` Drawer. shadcn `Sheet` (`@/components/ui/sheet`) bietet exakt das Use-Case: Mobile-Bottom-Sheet + Desktop-Right-Sheet, mit Focus-Trap, ESC-Handling, Aria-Labelling, Animation-Built-In.
**Why Strong:** Inspector hat manuelle ESC-Handler (Z.72-77), manuelle GSAP-Animation (Z.52-69), eigenes `role=dialog aria-modal`. shadcn Sheet macht all das + bringt focus-trap (fehlt aktuell — Tab-Loop entkommt aus dem Inspector!).
**Suggested Fix (Phase 3 Priority)**: Migration auf `Sheet`/`SheetContent` mit `side="right" className="sm:max-w-[380px]"` und `side="bottom"` für Mobile (via responsive prop or 2 Sheets).

### Mid FN-13 — `font-mono text-xs` vs `type-mono-sm` Inkonsistenz
**Files:** Komplette Galaxie-Chrome mixt:
- `font-mono text-xs` — Tooltip:16, Inspector:140, Inspector:155 (rauh: kombiniert `type-mono-sm` mit Custom-Font-Mono)
- `font-mono type-mono-sm` — GalaxieScene:530 (korrekt)
- `font-mono text-[10px]` — ActivationChecklist:144 (raw)
- `type-mono-sm` only — Inspector:381, ZoomIndicator:25 (korrekt aber redundant — `type-mono-sm` setzt schon `font-mono`?)

**Why Mid:** `type-mono-sm` ist die Token-Form aus `globals.css:231`. `font-mono text-xs` ist die Pre-Nova-2-Form. Beide existieren parallel und treiben Sub-Pixel-Drift (`text-xs` = 12px, `type-mono-sm` evtl. 11px o.ä.).
**Suggested Fix:** `type-mono-sm` als kanonisch festlegen, alle `font-mono text-xs` Galaxie-Vorkommnisse migrieren.

### Mid FN-14 — Settings-Header-Pattern uneinheitlich
**Files:**
- `general/page.tsx:7-12` (KORREKT): `<header className="space-y-2 border-b border-border pb-6"><h1 className="type-h1 font-semibold tracking-tight">…</h1><p className="type-body text-muted-foreground">…</p></header>`
- `integrations/page.tsx:15-20` (DRIFT): `<header className="space-y-1"><h1 className="text-2xl font-bold tracking-tight">…</h1><p className="text-sm text-muted-foreground">…</p></header>` — Kein border, kein `pb-6`, anderer `space-y`.

**Why Mid:** SettingsLayout-Pages stehen *direkt nebeneinander* in der Sidebar — Header-Drift fühlt sich an wie "neuer Designer pro Page". Linear/Vercel-Killer.
**Suggested Fix:** Pattern aus `general` als kanonisch dokumentieren in `linear-aesthetic.md` und auf alle 7 abweichenden Settings-Pages applicen.

### Mid FN-15 — Customer-Detail bypassed ui-vk
**File:** `apps/web/src/app/[workspace]/customers/[customerId]/page.tsx:47-72`
**Issue:** `<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">` ad-hoc — `PageShell size="default"` würde `max-w-7xl + px-6 py-10 sm:px-8 sm:py-12 lg:py-16` liefern. Header ist ein eigenes Konstrukt (`<header className="flex flex-wrap items-end justify-between gap-4">`) — `PageHeader` mit `breadcrumb` + `title` + `actions` würde es ersetzen.
**Why Mid:** Customer-Listen-Page (`/customers`) verwendet `PageShell + PageHeader`. User klickt auf einen Customer → Drift in max-width, padding, header-spacing.
**Suggested Fix:** Refactor zu `<PageShell as="main" id="main-content"><PageHeader title={customer.label} eyebrow={customer.slug} breadcrumb={…} actions={<SeverityBadge…/>} />…</PageShell>`.

### Mid FN-16 — GalaxieSkeleton hat eigene SVG-Implementation statt shadcn Skeleton
**File:** `apps/web/src/components/galaxie/GalaxieSkeleton.tsx`
**Issue:** Custom-SVG mit 3 pulsing circles + `rgba(255,255,255,0.04)` background-dots. Funktioniert visuell (mimics Galaxie-Layout) — aber andere Skeletons im Repo nutzen shadcn `Skeleton` (`apps/web/src/app/[workspace]/customers/loading.tsx`, `scans/loading.tsx`).
**Why Mid:** Inkonsistenz zwischen Loading-States. Galaxie-spezifischer Skeleton ist konzeptuell ok (3 circles = mock customers), aber das `rgba(...)` background-pattern sollte über CSS-var laufen.
**Suggested Fix:** Behalte Custom-Implementation, aber:
1. Background-radial-gradient als `var(--vk-bg-dot-grid)` Token (auch von GalaxieScene + StaticGalaxieSVG verwendet, also DRY-Win).
2. Circle-fills: `fill="var(--vk-ink-3)"` statt `rgba(255,255,255,0.08)`.

### Mid FN-17 — EmptyGalaxie reimplementiert EmptyState
**File:** `apps/web/src/components/galaxie/EmptyGalaxie.tsx`
**Issue:** Eigene flex-col-Centered Empty-Page mit Sparkles + headline + description + CTA-Link. **Exakt** das `ui-vk` `EmptyState`-Pattern (`size: 'compact' | 'default' | 'large'` + `icon` + `title` + `description` + `action`).
**Why Mid:** ui-vk `EmptyState` ist als Standard für `~14 custom implementations` (laut Doc-Comment in `EmptyState.tsx`) dokumentiert. EmptyGalaxie bricht das.
**Suggested Fix:**
```tsx
<EmptyState
  icon={SparklesIcon}
  title="Your galaxy is empty."
  description="Add a customer to start. Each customer becomes a planet — repos are its moons, findings are the asteroids around each moon."
  action={
    <Button asChild size="sm">
      <Link href={`/${workspaceSlug}/customers`}>
        <PlusIcon className="size-3.5" aria-hidden />
        Add customer
      </Link>
    </Button>
  }
  size="large"
  className="h-full bg-black text-white" // Galaxie context still needs dark bg
/>
```

### Mid FN-18 — `bg-neutral-950` als Magic-Color in UniversalSearch
**File:** `apps/web/src/components/galaxie/UniversalSearch.tsx:69`
**Issue:** `bg-neutral-950` ist einziges Vorkommnis im Repo. Sonst überall `bg-black/XX` oder `bg-card`.
**Why Mid:** Tailwind-Default-Neutral-Palette bricht OKLCH-System. `neutral-950` ≠ `oklch(0.04 0.003 270)` exakt.
**Suggested Fix:** `bg-popover` (shadcn) oder `bg-[var(--vk-ink-1)]`.

### Mid FN-19 — ActivationChecklist Animation/Transition fehlt
**File:** `apps/web/src/components/galaxie/ActivationChecklist.tsx:92-164`
**Issue:** Toggle expand/collapse hat keine Transition — Snap-Open/Close. Im Vergleich: WorkspaceSwitcher nutzt `motion.div` mit `initial/animate/exit` (sieht butter-smooth aus).
**Why Mid:** Pro-Look Polish — Linear-Sidebar animiert immer. Sub-200ms ease-out transition macht den Unterschied.
**Suggested Fix:** `<motion.ul>` mit `initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }}`.

### Mid FN-20 — Inspector hat keine `focus-trap` und Tab entkommt
**File:** `apps/web/src/components/galaxie/Inspector.tsx:122-300`
**Issue:** `role="dialog" aria-modal="true"` ist gesetzt, aber kein focus-trap implementiert. Tab durch den Inspector landet bei den nächsten Elementen unter dem Portal (Galaxie-Canvas, dann Page-Body).
**Why Mid:** A11y-Regression vs WCAG 2.1 SC 2.4.3. shadcn `Sheet` würde das automatisch fixen via Radix-Primitives.
**Suggested Fix:** Migration zu `Sheet` (siehe FN-12) löst beides gleichzeitig.

### Mid FN-21 — Hardcoded `text-green-400` für FPS-Counter (Debug)
**File:** `apps/web/src/components/galaxie/GalaxieScene.tsx:857`
**Issue:** `text-green-400` — Tailwind-Palette, kein VK-Token.
**Why Mid:** Debug-only path (`isDebug && <FPSCounter />`), aber existiert in Production-Bundle.
**Suggested Fix:** `text-[var(--vk-status-ok)]` oder `text-emerald-400` wenn explizit Performance-Indicator-Grün gewollt ist.

### Mid FN-22 — Spacing-Drift in Customer-Detail Header
**File:** `apps/web/src/app/[workspace]/customers/[customerId]/page.tsx:47`
**Issue:** `mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8` — `py-8` (32px) ist im 8-System, `px-4 sm:px-6` (16px/24px) ist Mobile zu eng. PageShell gibt `py-10 sm:py-12 lg:py-16` (40/48/64px) — gleichwertiger Vertical-Rhythm.
**Why Mid:** Spacing-System-Drift; nicht das richtige Tier (Detail-Page = `default`-Shell-Tier).
**Suggested Fix:** PageShell-Migration siehe FN-15.

### Weak FN-23 — `text-white/30` für Tab-Numbers in ActivationChecklist
**File:** `apps/web/src/components/galaxie/ActivationChecklist.tsx:144`
**Issue:** `font-mono text-[10px] tabular-nums text-white/30` — `text-[10px]` ist arbitrary-value statt `type-mono-sm` (11px) oder eigener `type-mono-xs` Token (10px).
**Why Weak:** Arbitrary-value-Drift; lebt einsam in einer Component.
**Suggested Fix:** Entweder `type-mono-sm` (11px ist ok) oder neuen Token `--type-mono-xs` definieren wenn 10px load-bearing ist.

### Weak FN-24 — `ZoomIndicator` Polling via setInterval mit Race-Condition
**File:** `apps/web/src/components/galaxie/ZoomIndicator.tsx:16-21`
**Issue:** `useEffect(() => { const id = setInterval(...); return () => clearInterval(id); });` — Effect-Dependency-Array fehlt → effect läuft auf jedem Render → setInterval wird ständig zerstört + neu aufgesetzt.
**Why Weak:** Performance-Anti-Pattern aber kein User-Visible-Bug (setInterval(80ms) ist günstig). Aber Pro-Look-Code sollte sauber sein.
**Suggested Fix:** `useEffect(() => { …; return () => clearInterval(id); }, [camera, scale]);` — oder besser RAF + camera subscribe pattern.

### Weak FN-25 — `MiniMap` SVG-Stroke nutzt `rgba()` statt Token
**File:** `apps/web/src/components/galaxie/MiniMap.tsx:135-136`
**Issue:** `fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.55)"` — magic numbers in SVG-Attribute (kann Tailwind nicht erreichen, aber CSS-Var via `style={{ fill: 'var(--vk-ink-2)' }}` möglich).
**Why Weak:** Galaxie-spezifischer kosmetischer Drift, aber Pattern bricht Token-Konvention.
**Suggested Fix:** SVG-Attribute mit `style={{ fill: 'var(--vk-ink-2)', stroke: 'var(--vk-ink-9)' }}` für Theme-Robustheit.

### Weak FN-26 — Universal-Search hat `outline-none` ohne focus-visible Ersatz
**File:** `apps/web/src/components/galaxie/UniversalSearch.tsx:77`
**Issue:** `outline-none` auf `<Command.Input>` ohne `focus-visible:ring-…`. Native-Outline killt + nichts ersetzt.
**Why Weak:** A11y-Issue für Keyboard-Users die ⌘K nutzen.
**Suggested Fix:** `outline-none focus-visible:ring-2 focus-visible:ring-ring/50` (matchen shadcn `Input` pattern).

### Weak FN-27 — `bg-amber-500` in CreditMeter ohne ARIA-Status
**File:** `apps/web/src/components/CreditMeter.tsx:65`
**Issue:** Amber-Color als Warning-Indicator aber kein `aria-label="Warning: credit balance low"` o.ä.
**Why Weak:** A11y-light + color-only-signaling.
**Suggested Fix:** Token-Migration (Kill FN-04) + `aria-label`.

### Exceptional FN-28 — `SeverityBadge` ist vorbildlich gekapselt
**File:** `apps/web/src/components/ui/severity-badge.tsx` (über `severity-colors.ts`)
**Why Exceptional:** Single Source of Truth, 5-Tier-Token-System (`--color-sev-*`), Pixi-Number-Mapping über `hexToPixiNumber`, Tests in `severity-colors.test.ts`. Severity = redundant signal (color + icon + border-style + font-weight). Color-Blind-friendly.
**Best-Practice that should be copied:** Plan-Indicator (`WorkspaceSwitcher.tsx`) und Status-Tokens (warning/info/success) sollten *exakt* dieses Muster nachbauen: Token-Map in CSS-Vars + `*-colors.ts` helpers + shared Badge-Komponente.

### Exceptional FN-29 — `EmptyState` (ui-vk) und `PageHeader` API-Design
**Files:** `apps/web/src/components/ui-vk/EmptyState.tsx`, `PageHeader.tsx`
**Why Exceptional:** Props-Design ist Linear-typisch konsistent: `icon` (ComponentType), `title` (required), `description` (optional), `action` (ReactNode), `size` (3-Tier compact/default/large). `PageHeader` hat 5 saubere Props (`title, subtitle, breadcrumb, eyebrow, actions`). Doc-Comments dokumentieren intent.
**Best-Practice:** Galaxie-Components sollten diese API-Design-Philosophie übernehmen (Inspector hat 3 Props, gut; aber `EmptyGalaxie` ist 1-Prop ohne Konfigurierbarkeit).

### Exceptional FN-30 — `SettingsLayout` Active-State + Left-Bar Indicator
**File:** `apps/web/src/components/ui-vk/SettingsLayout.tsx:71-87`
**Why Exceptional:** Active-State via `usePathname()` + `before:absolute before:-left-0.5 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-foreground` — Linear-typischer 2px Indicator-Bar links. `aria-current="page"` korrekt gesetzt. Group-Headings mit `font-mono type-mono-sm uppercase tracking-wider`. Pixel-perfect Linear-Mimic.
**Best-Practice:** `SiteNavLinks` (Top-Nav) sollte Same-Pattern: Aktuell macht es `after:` underline — gut, aber `WorkspaceSwitcher` braucht *exakt* dieses `before:` left-bar Pattern.

---

## GalaxieRoot-Polish-Priority-List (Phase 3 Input)

| # | Item | Current | Target | Severity | File |
|---|------|---------|--------|----------|------|
| 1 | Inspector → shadcn Sheet | createPortal + manual ESC/focus + GSAP | `<Sheet>` `<SheetContent side="right" / "bottom">` | Strong | Inspector.tsx:122-300 |
| 2 | Inspector Dropdown → shadcn DropdownMenu | Custom click-outside + role=menu manuell | `<DropdownMenu><DropdownMenuTrigger>` | Strong | Inspector.tsx:314-356 |
| 3 | Inspector Buttons → shadcn Button ghost | Raw `<button>` + Tailwind-Inline | `<Button variant="ghost" size="sm">` | Strong | Inspector.tsx:151-211 |
| 4 | UniversalSearch → shadcn CommandDialog | Raw cmdk + Custom Modal-Overlay | `<CommandDialog>` + custom Trigger | Strong | UniversalSearch.tsx:59-117 |
| 5 | WorkspaceSwitcher → shadcn Popover | motion.div + custom outside-click | `<Popover><PopoverTrigger>` | Strong | WorkspaceSwitcher.tsx:25-71 |
| 6 | EmptyGalaxie → ui-vk EmptyState | Custom flex-col implementation | `<EmptyState icon={…} title={…} action={…} size="large">` | Mid | EmptyGalaxie.tsx:7-27 |
| 7 | Lucide aria-hidden sweep (12 icons) | Missing in Inspector, Switcher, Zoom, Search, AISol | `<Icon aria-hidden />` durchgängig | Strong | siehe FN-08 |
| 8 | focus-visible ring sweep (10+ buttons) | Komplett fehlt | `focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2` | Strong | siehe FN-09 |
| 9 | Glass-Tokens definieren + apply | 5 verschiedene `bg-black/XX` Werte | 3 Tokens: subtle/elevated/overlay | Strong | siehe FN-10 |
| 10 | Border-Radius-System apply | rounded/rounded-md/rounded-lg/rounded-2xl mixed | 3-Tier: pill/card/panel | Strong | siehe FN-11 |
| 11 | WorkspaceSwitcher Plan-Colors → Tokens | 3 hardcoded hex | `var(--vk-plan-solo/team/agency)` | Kill | WorkspaceSwitcher.tsx:74-83 |
| 12 | StaticGalaxieSVG dimmed-color → Token | `#404040` | `var(--vk-ink-5)` | Kill | StaticGalaxieSVG.tsx:163 |
| 13 | Galaxie text-white/X → semantic tokens | 84 Vorkommnisse | `text-foreground/X` oder `text-vk-text-secondary` | Mid | siehe Summary |
| 14 | Galaxie bg-black → semantic | 18 Vorkommnisse | `bg-popover` oder `bg-[var(--vk-ink-0)]` | Mid | siehe Summary |
| 15 | ActivationChecklist Card-Padding tighten | `px-3 py-2.5 + mt-2.5 pt-2.5` | Standard 12/16 grid (`px-3 py-3 + mt-3 pt-3`) | Weak | ActivationChecklist.tsx:95, 131 |
| 16 | ActivationChecklist expand/collapse transition | Snap | `<motion.ul>` height auto + 180ms ease-out | Mid | ActivationChecklist.tsx:128-162 |
| 17 | ActivationChecklist Numbers — Token | `text-[10px] text-white/30` | `type-mono-sm text-muted-foreground/60` | Weak | ActivationChecklist.tsx:144 |
| 18 | ActivationChecklist Border-Radius mixed | className `rounded-md` + style `borderRadius` | Eins davon, nicht beides | Weak | ActivationChecklist.tsx:95-96 |
| 19 | ActivationChecklist Item-Hover State | hover:underline only | + bg-white/5 subtle hover background | Weak | ActivationChecklist.tsx:152-155 |
| 20 | ActivationChecklist Completion-Anim | Items just appear with line-through | Soft scale + check pop-in (gsap timeline) | Weak | ActivationChecklist.tsx:135-142 |
| 21 | ZoomIndicator setInterval cleanup | Effect-deps fehlt | Add `[camera, scale]` to deps | Weak | ZoomIndicator.tsx:16-21 |
| 22 | MiniMap SVG-fill via CSS-Vars | `rgba()` in attrs | `style={{ fill: 'var(--vk-ink-2)' }}` | Weak | MiniMap.tsx:135-136 |
| 23 | UniversalSearch Input focus-ring | `outline-none` ohne Ersatz | + `focus-visible:ring-2 focus-visible:ring-ring/50` | Weak | UniversalSearch.tsx:77 |
| 24 | GalaxieScene Replay-Tour Button → shadcn | Custom border + bg-black/70 | `<Button variant="outline" size="sm">` mit dark-mode-glass | Mid | GalaxieScene.tsx:526-534 |
| 25 | GalaxieSkeleton Dot-Grid → Token | Inline `rgba()` background-image | `var(--vk-bg-dot-grid)` shared with Scene + StaticSVG | Mid | GalaxieSkeleton.tsx:18-21 |
| 26 | Inspector Dismiss-State-Banner Polish | flat `bg-white/5` | More distinct: amber-tinted for snoozed, red-tinted for dismissed | Weak | Inspector.tsx:358-388 |
| 27 | Inspector AI-Apply CTA pattern → shadcn Button | Custom border + bg-primary/15 | `<Button variant="default" size="sm">` consistent with rest | Mid | Inspector.tsx:275-283, AISolutionPlaceholder:240 |
| 28 | Tooltip GalaxieHover Position-Logic | Fixed `+16/+12` offsets | Smart edge-detection (flip when near right/bottom) | Mid | Tooltip.tsx:14-26 |
| 29 | Inspector "X close" Button → shadcn Sheet built-in | Manual XIcon button | Sheet's built-in close button | Strong (via #1) | Inspector.tsx:204-211 |
| 30 | Galaxie kbd-Component → shadcn | Raw `<kbd>` with Tailwind | Shared `<Kbd>` component (or shadcn `<CommandShortcut>`) | Weak | UniversalSearch.tsx:54, 80 |

---

## Non-Galaxie Pages — Sweep Priority

| # | Page | Issue | Severity |
|---|------|-------|----------|
| 1 | `[workspace]/customers/[customerId]/page.tsx` | No PageShell/PageHeader | Strong |
| 2 | `[workspace]/repos/[repoId]/page.tsx` | No PageShell/PageHeader | Strong |
| 3 | `[workspace]/repos/[repoId]/access/page.tsx` | No PageShell + text-2xl font-bold | Strong |
| 4 | `[workspace]/requests/page.tsx` | No PageShell + text-2xl font-bold | Strong |
| 5 | `[workspace]/settings/integrations/page.tsx` | text-2xl font-bold + amber-500 hardcoded + space-y-1 header drift | Strong |
| 6 | `[workspace]/settings/ai/page.tsx` | text-2xl font-bold + space-y-1 header drift | Mid |
| 7 | `[workspace]/settings/members/page.tsx` | text-2xl font-bold | Mid |
| 8 | `[workspace]/settings/billing/page.tsx` | text-2xl + text-3xl + amber-500 + space-y-1 | Mid |
| 9 | `status/page.tsx` | No PageShell, manual bg-card/40 wrapper | Mid |
| 10 | `trust/page.tsx`, `trust/dpa/page.tsx`, `trust/eval/page.tsx` | No PageShell | Mid |
| 11 | `legal/agb/page.tsx`, `legal/dpa/page.tsx`, `legal/subprocessors/page.tsx` | No PageShell + text-3xl raw | Mid |
| 12 | `pricing/page.tsx` | No PageShell + text-4xl/5xl raw | Weak (Landing-page kann eigene Typo) |
| 13 | `billing/page.tsx` | No PageShell | Mid |
| 14 | `dashboard/page.tsx` | (nicht geprüft im Detail) | unbekannt |
| 15 | `auth/verify/page.tsx` | No PageShell | Weak (Auth-Flow eigene Aesthetic ok) |
| 16 | `account/settings/*` (5 pages) | (nicht im Detail geprüft, aber Layout via SettingsLayout ist gut) | unbekannt |

---

## Compliance-Metriken

| Metrik | Target | Actual | Status |
|--------|--------|--------|--------|
| App-Pages mit PageShell/PageHeader | ≥ 80% | 2/23 (9%) | RED |
| Settings-Pages mit type-h1 statt text-2xl | 100% | 4/11 (36%) | RED |
| Galaxie-Components mit shadcn-Imports | ≥ 50% | 0/11 (0%) | RED |
| Hardcoded Hex in Production | 0 | 5 | RED |
| Hardcoded Tailwind-Color (amber/green/red/blue/yellow) | 0 (außer destructive/primary) | 4 | RED |
| Lucide-Icons mit aria-hidden in Galaxie | 100% | ~25% (nur ActivationChecklist) | RED |
| focus-visible auf Custom-Buttons in Galaxie | 100% | 0% | RED |
| Glass-Pattern Tier-Konsistenz | 3 Tokens | 5 verschiedene Werte | YELLOW |
| Border-Radius-Konsistenz | 3-Tier-System | 5 verschiedene Werte mixed | YELLOW |
| SettingsLayout active-state | Vorhanden | Vorhanden (Exceptional) | GREEN |
| ui-vk EmptyState Adoption | Wenn DAL leer | 2/3 (EmptyGalaxie bypassed) | YELLOW |

---

## Empfehlungen für Phase 3 Sequenzierung

**P3.1 — Token-Drift sealing (1 Session)**
- FN-01, FN-02, FN-03, FN-04 (alle 4 Kill-Findings) — alle hardcoded Hex/amber raus, neue VK-Tokens `--vk-plan-*` + `--vk-status-warn` + dimmed-grey-Token in `globals.css`.

**P3.2 — Galaxie-Chrome shadcn-Migration (2 Sessions)**
- FN-05 Inspector → Sheet (Tab-Trap-Fix included)
- FN-05 UniversalSearch → CommandDialog
- FN-05 WorkspaceSwitcher → Popover + Plan-Indicator-Component
- FN-08 aria-hidden sweep
- FN-09 focus-visible sweep

**P3.3 — Settings-Page Header-Pattern Sweep (1 Session)**
- FN-07: 7 Settings-Pages auf `<header className="space-y-2 border-b border-border pb-6"><h1 className="type-h1 …">…</h1></header>` migrieren.

**P3.4 — App-Pages PageShell-Migration (2 Sessions)**
- FN-06, FN-15, FN-22: 16 Non-Galaxie-Pages auf `PageShell + PageHeader` migrieren.

**P3.5 — Glass-Tokens + Radius-System (1 Session)**
- FN-10 + FN-11: 3-Tier-Glass-Tokens + 3-Tier-Radius-Tokens definieren + Galaxie-Chrome applicen.

**P3.6 — Polish-Pass (1 Session)**
- FN-19 ActivationChecklist transition
- FN-13 type-mono-sm sweep
- FN-25 MiniMap SVG-Tokens
- FN-24 ZoomIndicator effect-deps fix
- FN-28 Tooltip edge-detection
- FN-23 ActivationChecklist Number-Token
- FN-30 Kbd shared component

**Gesamt-Aufwand-Schätzung Phase 3:** 7-8 Sessions für vollständige Linear/Vercel-Niveau-Polish.

---

## Anti-Patterns (gefunden, dokumentiert für Future-Reference)

1. **Tailwind-Inline statt Token-Wrapper** — Galaxie-Components nutzen `text-white/85 border-white/10 bg-black/70` durchgängig. Diese Werte sollten in 3 semantische Tokens kollabiert werden (`text-fg-strong`, `border-default`, `bg-glass-subtle`).
2. **Duplicate Empty-State** — `EmptyGalaxie` exists obwohl `EmptyState` (ui-vk) explizit zur Konsolidierung gebaut wurde (laut Doc-Comment "Replaces ~14 custom implementations").
3. **Inline-style + className Border-Radius-Mix** — ActivationChecklist hat `rounded-md` (className) + `style.borderRadius: var(--vk-radius-card)` (inline). Letztes überschreibt — Code-Smell.
4. **Effect ohne deps** — ZoomIndicator setInterval läuft bei jedem Render (effect-deps fehlt).
5. **Mock Workspace-Data leaked into UI** — `MOCK_WORKSPACES` als Default-Fallback in `WorkspaceSwitcher` ist Dev-Convenience, bricht aber Prod-Boundary. Sollte `null`-Handling auf Caller-Seite haben.
6. **Settings-Page-Header-Pattern uneinheitlich obwohl im selben Layout** — direkt sichtbarer Drift wenn User von General → Integrations navigiert.

---

## Style-Guide-Vorschläge (`docs/design/linear-aesthetic.md` Erweiterungen)

1. **Galaxie-Chrome Section** — definiere für Floating-Chrome (Tooltips, Floating-Cards, Inspector) die 3 Glass-Tiers + Radius-Tiers + Spacing-Grid (4/8/12/16/24/32).
2. **Severity-Color-Usage** — dokumentiere `--color-sev-*` als Single Source of Truth + Verbot von Tailwind-Default-Palette (red-500, amber-500, green-400 explizit als Anti-Pattern listen).
3. **Page-Layout-Convention** — alle App-Pages MÜSSEN `<PageShell>` als outermost wrapper + `<PageHeader>` als first child. SettingsLayout = Exception (eigene Sub-Layout).
4. **Icon-Convention** — alle Lucide-Icons MÜSSEN `aria-hidden` haben (es sei denn semantisches Icon mit `aria-label`). Default-Sizes: `size-3` (inline-with-text-xs), `size-3.5` (inline-with-text-sm), `size-4` (inline-with-text-base), `size-5` (header-decoration), `size-10/12` (empty-state).
5. **Focus-Ring-Convention** — alle interaktiven Elemente brauchen `focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2`. shadcn-Components haben das built-in; Custom-Buttons MÜSSEN es applien.
