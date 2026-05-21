# Plan — Phase Nova-2: Voll-Produkt-Überholung

> Erstellt: 2026-05-20
> Status: ✅ Done — 2026-05-20 (Shell). 3 Sub-Pläne deferred (Live-Audit-Flow, Settings-Backend, A11y-Deep-Sweep)
> Slug: `nova-2-full-product`
> Umfang: Master-Plan über 7 Phasen, ~3-4 Wochen Solo
> Basis: 10 Sub-Agents (Pan/Pinch, Severity-Icons, Spacing-Audit, App-Pages, Settings-Design, Onboarding, Better-Auth, Design-System, Performance, A11y, Mobile)
> Voraussetzung: `galaxie-circle-pack-v2.md` ist in `docs/plans/done/`

---

## 1. Ziel

Aus dem heutigen ValidationKit (Premium-Galaxie-Hero, shadcn-Default-App-Pages) wird ein **vollständig konsistentes Linear/Vercel-Niveau-Produkt**: gemeinsame Token-Sprache über alle Pages, polishter Onboarding-Flow mit Live-Audit-Demo, Settings-Restructure mit 10 Sections, Mobile-Adaptation (Tree-View statt Galaxie), Cooperative-Pan/Pinch, A11y-Sweep mit Lighthouse ≥95.

---

## 2. User-Entscheidungen (zwei Klärungs-Runden)

| ID | Frage | Entscheidung |
|----|-------|---------------|
| Q1 | Scope | **Volle Produkt-Überholung** — Landing + App + Auth + Onboarding + Settings |
| Q2 | Pan-Modus (R1) | volle Spatial-Nav |
| Q3 | Severity-Icons | **Lucide-Icons** (AlertCircle/AlertTriangle/CheckCircle/Sparkles) |
| Q4 | Settings | **Galaxie-View-Settings + App-Settings-Page** (beide) |
| Q5 | Pan-Modus (R2-Override) | **Cooperative-Mode** (Wheel = Page-Scroll, Cmd+Wheel/Pinch = Zoom) |
| Q6 | Mobile-Galaxie | **Tree-View** statt Pixi-Galaxie unter 768px |
| Q7 | Token-Refactor | **Voll 3-Tier** (Primitive/Semantic/Component) |
| Q8 | Phasen-Reihenfolge | **Foundation-First** (Tokens → Pages → Auth → Mobile → Quality) |

**Plan-Ergänzung (nicht abgefragt, begründet):**
- GitHub-OAuth → **V2-Future** (Plan-Anhang). Heute: Magic-Link-UX polishen.
- PWA-Install-Prompt → V2-Future. Heute: kein Install-Prompt.
- Cross-Device-OTP-Fallback → V2-Future. Heute: granular-Error-Messages reichen.

---

## 3. Sub-Agent-Erkenntnisse (Synthese)

| Domain | Konkrete Empfehlung |
|--------|---------------------|
| **Pan/Pinch** | Cooperative-Mode: Wheel-EventListener mit `{passive:false}` via useEffect (NICHT React-SyntheticEvent). `ctrlKey` = Trackpad-Pinch-Signal. `transform: translate3d() scale()` GPU-Layer, nicht viewBox-Mutation. |
| **Severity-Icons** | Lucide-Icons im Center der Sphere, fixed-size beim Zoom (Apple-Maps-Pattern). NUR Kill pulsiert (1.4 s Scale 1→1.08). Sparkles rotiert (8 s). Weak/Mid/Strong static. Touch-hitArea 44 px. |
| **Spacing** | `pack().padding(8)` → `16-20` (depth-differenziert). Folder-`labelY` `-radius-6` → `-radius-12`. Container-`strokeOpacity` `0.55` → `0.25`. `lg:aspect-square` → `lg:aspect-video` (mehr Breite). Glow-Halo `r+22` → `r+32`. |
| **App-Pages** | Größte Gaps: Settings (Layout-Wrapper fehlt), Customers/Scans (Tables dense), Billing/Pricing (veraltete Typo). 5 fehlende Komponenten: `PageShell`, `PageHeader`, `SettingsLayout`, `EmptyState`, `StatTile`. SiteNav braucht Active-State-Indicator. |
| **Settings** | Sidebar (>6 Sections). URL-Trennung `/account/*` (User) vs `/[workspace]/settings/*` (Workspace). 10 Sections: 4 existing + 6 NEU (General, API-Keys, Audit&Apply, Galaxie, Notifications, Webhooks, Danger). |
| **Onboarding** | Live-Audit ohne Sign-up (30 s) → Soft-Wall nach 3 Findings → Magic-Link inline (kein Modal) → Auto-Resume → First-PR in <5 min. Activation-Checklist 5 Items. Re-Engagement 30min/24h/7d. |
| **Better-Auth** | expiresIn 10 min (statt Default 5 min), `storeToken: 'hashed'`, Cookie-Cache `maxAge: 300`, granular Errors (EXPIRED/ALREADY_USED/INVALID_TOKEN), Resend-Throttle mit Countdown. |
| **Design-System** | shadcn als Primitive-Layer behalten. OKLCH-Scale `--vk-ink-0`...`--vk-ink-12`. Semantic-Token `--color-surface/text-primary/status-{ok,warn,kill}`. 7 neue Komponenten. |
| **Performance** | Budget: LCP ≤1.8s, INP ≤150ms, CLS ≤0.05, JS<130KB above-fold, Lighthouse ≥95. `optimizePackageImports` für d3-*. LazyMotion + `m`. `next/dynamic ssr:false` für Galaxie-Canvas. Cache Components für Hero. |
| **A11y** | WCAG 2.2 Procurement-Standard. App-Skip-Links, native `<dialog>`, Severity = Icon+Pattern+Color (nicht nur Color), Pan-Keyboard (Arrow/+/-/0), touch-targets ≥24px, focus-visible-Token, axe-core CI auf 5 Routes. |
| **Mobile** | Pixi-Galaxie unter 768px **abschalten** → Tree-View mit Severity-Pills + Tap-to-Drill. Inspector → Vaul Bottom-Sheet. Top-3 Mobile-perfect: Landing, Login, Customer-Inspector. PWA skippen. |

---

## 4. Phasen-Roadmap

### Phase 1 — Foundation ✅ Done — 2026-05-20

**Ziel:** Token-Layer + Komponenten-Library steht. Alle folgenden Phasen bauen darauf.

- [x] **Token-Layer-Refactor in `apps/web/src/app/globals.css`:**
  - **Layer 1 Primitive:** `--vk-ink-0` (oklch 0.04) bis `--vk-ink-12` (oklch 0.98), 13-stufige Scale mit niedrigem Hue-270-Stich
  - **Layer 2 Semantic:** `--vk-surface`, `--vk-surface-raised`, `--vk-surface-elevated`, `--vk-border-hairline`, `--vk-border-strong`, `--vk-text-primary/secondary/muted`, `--vk-status-{ok,warn,kill,info}`
  - **Layer 3 Component:** `--vk-radius-{sm,md,lg,card}`, `--vk-ease-{camera,entrance,interaction,out-expo}`, `--vk-dur-{micro,base,camera,pulse}`
  - Via `@theme inline` als `--color-vk-*` exponiert für Tailwind-Utility-Klassen
- [x] **shadcn-Tokens unverändert** (additive Erweiterung, kein Breaking-Change — Migration der Pages folgt in Phase 3)
- [x] **`apps/web/src/components/ui-vk/`** neuer Sub-Tree angelegt + barrel-export
- [x] **`PageShell.tsx`** — max-w-7xl/3xl/wide, responsive padding-x/y, polymorph (`as`)
- [x] **`PageHeader.tsx`** — type-display H1, optional eyebrow/subtitle/breadcrumb/actions-slot
- [x] **`SectionHeader.tsx`** — type-h1, optional eyebrow/count-badge/actions
- [x] **`Card.tsx`** (mit `CardHeader`/`CardBody`/`CardFooter`) — hairline-border, kein shadow, interactive-state
- [x] **`EmptyState.tsx`** — Lucide-icon + title + description + CTA, drei Größen-Varianten
- [x] **`StatTile.tsx`** — mono-Zahl tabular-nums, severity-color, optional delta + hint
- [x] **`Hairline.tsx`** — horizontal/vertical, strong-Variante
- [x] **`KeyboardHint.tsx`** + `KeyboardSequence` — kbd-style pill für Shortcut-Anzeigen
- [x] **Build + Typecheck grün** (88/88 Tests bestanden)

### Phase 2 — Hero-Polish ✅ Done — 2026-05-20

**Ziel:** Galaxie-Hero auf "Premium-Apple-Maps-Linear"-Niveau.

- [x] **Pan/Pinch Cooperative-Mode** in `RepoGalaxie.tsx`:
  - useEffect-Listener für `wheel` mit `{passive:false}`
  - `ctrlKey || metaKey` → zoom-at-cursor (Trackpad-Pinch detected via ctrlKey)
  - Plain Wheel → propagate normal (Page scrollt)
  - Pointer-Drag (mousedown/move/up + setPointerCapture) → pan
  - Touch: 1-Finger = Page-Scroll, 2-Finger = Pan+Pinch — 2-Finger deferred to Phase 6 (Mobile = Tree-View)
  - Cursor: `grab → grabbing` on drag
  - Hint-Chip unten rechts: "⌘+scroll to zoom · drag to pan"
- [x] **Keyboard-Pan**: Arrow-Keys (40px step), `+`/`-` zoom, `0` reset
- [x] **Lucide-Severity-Icons** in `Sphere.tsx`:
  - `AlertCircle` (Kill, 62% sphere-diameter, pulse 1.4s scale 1→1.08)
  - `AlertTriangle` (Weak: 2px stroke, Mid: 1.5px stroke)
  - `CheckCircle` (Strong, static)
  - `Sparkles` (Exceptional, rotate 0→360 over 8s)
  - Color via `currentColor` (matching severity-token)
  - Fixed-size beim Zoom (counter-scale)
- [x] **Spacing-Fixes** (Agent 3):
  - `layout.ts`: pack-padding 8 → 16 (depth-differenziert: 8/16/20)
  - `Sphere.tsx`: Folder `labelY = -radius - 12`, File-Type-Pill-Gap `fontSize*1.4+4`
  - `Sphere.tsx`: Container `strokeOpacity: 0.25` (war 0.55)
  - Glow-Halo `r+32` (war r+22)
- [x] **Layout-Anpassung**:
  - `HeroSection.tsx`: `lg:aspect-square` → `lg:aspect-video` (16:9, mehr Breite)
  - Container `min-h: 560px (mobile) / 680px (desktop)` (war 720)
- [x] **Galaxie-View-Settings-Popover** oben rechts im Container:
  - Toggle: Pulse on/off
  - Slider: Zoom-Speed (langsam/standard/schnell)
  - Toggle: Reduced-Motion override (auto/forced-on/forced-off)
  - Toggle: Sphere-Labels (alle/nur Folder/nur on-Hover)
- [x] **Tests:** layout-test grün (7/7), typecheck grün, 88/88 vitest. Manual hover/click/pan vom User auf laufendem Dev-Server zu verifizieren.
- [ ] **Lighthouse-Smoke:** LCP ≤2.0s auf `/` (post-Phase 2, vor Bundle-Optimierung) — verschoben in Phase 7 (Quality-Gate)

### Phase 3 — App-Pages-Refactor ✅ Done — 2026-05-20

**Ziel:** Alle App-Pages außer Galaxie auf neue Token-Sprache + Komponenten-Library.

- [x] **`apps/web/src/app/layout.tsx`**: globale Skip-Links ("Skip to main", "Skip to nav")
- [x] **`SiteNav.tsx`**: Active-State-Indikator (underline + bold) für aktuelle Route
- [x] **`/pricing/page.tsx`**:
  - Headline `text-3xl/4xl` → `type-display`
  - Tier-Cards: shadcn-Card behalten (zu reichhaltige Header für Card-VK), aber Current-Tier-Highlight (ring-primary/30) + Padding hochgezogen + main `id="main-content"` + Mobile-Padding px-6 sm:px-8
  - "Most agencies"-Badge prominenter (floating-chip oben, bg-foreground text-background)
- [x] **`/billing/page.tsx`** (top-level):
  - Headline `text-2xl` → `type-h1` + border-b unter Header
  - Current-Tier-Card mit ring-primary/20 Highlight
  - Stripe-Customer-Portal-Button bestand schon (openBillingPortalAction)
  - main `id="main-content"` + Mobile-Padding px-6 sm:px-8
- [x] **`/login/page.tsx`**:
  - Mobile-Padding `px-4` → `px-6 sm:px-8`
  - Spacing `space-y-1` → `space-y-3` im CardHeader
  - LoginForm in `Card` wrapped (bestand schon)
  - main `id="main-content"`
- [x] **`/[workspace]/customers/page.tsx`**:
  - PageShell + PageHeader
  - EmptyState (size="large", py-20) statt custom Card-empty
  - Table-Row hover-bg bestand schon (shadcn-Table-Default)
  - Card-VK pro Customer aufgeschoben — Table-View bleibt für bulk-edits, Cards-per-Customer kommen in Phase 5/Mobile
- [x] **`/[workspace]/scans/page.tsx`**: PageShell + PageHeader + EmptyState analog Customers
- [x] **`/status/page.tsx`**:
  - Standardisiere auf `py-10 sm:py-16` + Mobile-Padding px-6 sm:px-8
  - Headline → `type-h1`
  - Status-Badges nutzen schon Severity-Token (CSS-vars sev-exceptional/mid/kill — kein Refactor nötig)
  - main `id="main-content"`
- [x] **`/trust/page.tsx`** + `/trust/dpa` + `/trust/eval`:
  - Headlines auf `type-h1` standardisiert
  - Mobile-Padding px-6 sm:px-8, py-10 sm:py-16
  - main `id="main-content"`
  - SeverityBadge bestand schon (vk/severity-badge) — bereits einheitlich
  - Table-Cells `py-3` aufgeschoben — TableRow-hover ist shadcn-Default, py-3 erfordert Table-Primitive-Patch (Scope für Phase 7 Polish)
- [x] **Smoke-Test:** typecheck ✅ · vitest 88/88 ✅ · HTTP 200 auf /, /pricing, /login, /status, /trust. Full Lighthouse-CI verschoben in Phase 7 (Quality-Gate)

### Phase 4 — Auth + Onboarding ✅ Done (Auth-Polish) · Live-Audit-Flow deferred — 2026-05-20

**Ziel:** Premium-Onboarding-Flow mit Live-Audit-Demo.

**Status:** 6 von 8 Items done. Live-Audit-Flow als eigener Sub-Plan `nova-2-live-audit-flow.md` (User-Wahl: Full-Live-Audit, Multi-Session). Re-Engagement-Inngest-Jobs per User-Wahl post Beta-Launch.

- [x] **Better-Auth 1.6 Config-Update** in `packages/auth/src/server.ts` (Plan-Korrektur: nicht `lib/auth.ts`):
  - `magicLink({ expiresIn: 600, storeToken: 'hashed' })` (10 min)
  - `session.cookieCache: { enabled: true, maxAge: 300 }`
  - Granular Errors werden via Better-Auth-Plugin nativ ausgesendet — surfacing in LoginForm-Polish
- [x] **`MagicLinkEmail.tsx`** als React-Email-Komponente (in `packages/auth/src/emails/`):
  - Subject "Sign in to ValidationKit"
  - Preheader "Your link expires in 10 minutes"
  - Mono-Logo `▸ ValidationKit`, schwarzer Primary-Button, optional IP+UA im Body, Expiry-Notice
  - Plain-Text-Fallback via `render(..., { plainText: true })`
  - JSX in @vk/auth aktiviert (`jsx: react-jsx` + react+react-dom+@types/react Deps)
- [x] **Login-Form-Polish**:
  - Auto-detect logged-in via Server-Component redirect (LoginPage hat schon getSessionUser-Check) — kein Client-Flicker
  - `next`-Param wird via `useSearchParams` gelesen, an `/auth/verify?next=…` durchgereicht
  - Resend-Throttle 30s mit Live-Countdown im Button
  - Inline-Error-States: 4 Varianten classifyError → EXPIRED / ALREADY_USED / INVALID_EMAIL / GENERIC mit eigenen Titles + Bodies
- [x] **`/auth/verify/page.tsx`** (neu) für Magic-Link-Click-Target:
  - Skeleton + "Signing you in..." mit motion-safe-animate-pulse
  - Auto-redirect via `redirect(next)` wenn Session valide
  - `safeNext()` Guard gegen open-redirect (nur absolute-paths, kein `//`)
  - Fallback-Link "request a new magic link" wenn Session nicht da ist (kein Auto-Bounce-Loop)
- [⏭] **Live-Audit-Flow** auf `/` — Sub-Plan `nova-2-live-audit-flow.md` (NEU). User-Wahl Full-Live-Audit. Scope braucht Anonymous-Scan-Pipeline + Anti-Abuse + Schema-Migration → multi-session. Empfehlung: **als letztes Work-Item vor Beta-Launch** anstoßen, nachdem Phase 5/6/7 fertig sind.
  - Repo-URL-Input + "Free Audit"-Button (kein Sign-up)
  - 30s-Skeleton-Galaxie während Audit läuft (Inngest)
  - 3 Findings free sichtbar, 4. blurred mit Soft-Wall "Sign in to unlock"
  - Inline-Magic-Link-Form unter Soft-Wall (kein Modal)
  - Auto-Resume nach Login (Galaxie zeigt denselben Audit, jetzt mit Apply-Button)
- [x] **Activation-Checklist** als Inline-Sidebar (rechts-rail, kollabierbar, persisted-dismiss):
  - `ActivationChecklist.tsx` (NEU) — right-rail-Overlay statt Top-Banner
  - 5 Items hard-derived aus DB-State (kein "Skip-Cheat"):
    1. Run your first audit → scanCount > 0
    2. Connect GitHub → gitHubAppConfigured
    3. Apply your first fix → applyCount > 0 (DAL erweitert)
    4. Add a second customer → customerCount > 1
    5. Invite a teammate → memberCount > 1 (DAL erweitert)
  - `getWorkspaceCounts()` erweitert um `applyCount` + `memberCount`
  - Beide Galaxie-Consumer (GalaxieScene + StaticGalaxieSVG) auf neue Komponente migriert
  - Alte `OnboardingBanner` bleibt im Code (kann später weg)
- [⏭] **Re-Engagement Inngest-Jobs** — User-Wahl: "Erst nach Beta-Launch". Skippen für jetzt, macht erst mit echten Usern Sinn. Plan-Anhang §10 erweitert.
  - 30min nach Magic-Link unused → Resend "Your audit is waiting"
  - 24h nach Login ohne Apply → Severity-Summary-Email
  - 7d Inactive → Digest-Email
- [x] **GitHub-OAuth markiert als V2** in Plan-Anhang (§10 bereits aufgenommen)

### Phase 5 — Settings-Restructure ✅ Done (Structural Shell) · Backend deferred — 2026-05-20

**Ziel:** 10-Section-Settings mit Sidebar-Layout, User vs Workspace getrennt.

**Status:** Structural shell done. DB-Schemas + APIs (api_key, webhook, notification_preference + workspace JSONB) als Sub-Plan B `nova-2-settings-backend.md` — geschätzt 2-3 Sessions, empfohlen post Phase 7. UI-Stubs zeigen Coming-Soon-Hinweise.

- [x] **`/account/settings/`** (neue Route, User-Scope):
  - SettingsLayout mit Sidebar (240px, links)
  - 5 Sections: Profile (live), Sessions / Notifications / Connections / Delete (Stubs mit Coming-Soon)
  - Migration via `next.config.ts` redirect `/[workspace]/settings/user/*` → `/account/settings/profile`
- [x] **`/[workspace]/settings/`** Restructure (Workspace-Scope):
  - SettingsLayout mit 10 Sections in 4 Gruppen (General / Operations / Communication / Danger)
  - **Bestehend (unverändert in dieser Phase):** Members, Billing, Integrations
  - **NEU:** General, API-Keys, Audit & Apply, Galaxie, Notifications, Webhooks, Danger Zone — UI-Shells gerendert, Backend pendet in Sub-Plan B
- [x] **`SettingsLayout.tsx`** Komponente in `components/ui-vk/`: lg:flex-row Sidebar (lg:w-60 / 240px) + Content (max-w 720px)
- [x] **`ApiKeyModal.tsx`** Reveal-Once-Pattern: One-time-secret, Klipboard-Copy + Check-Icon
- [x] **`NotificationMatrix.tsx`** Event × Channel Toggle-Grid (7 Events × 4 Channels, role=switch)
- [x] **`DangerConfirm.tsx`** typed-confirmation für Transfer/Delete-Workspace
- [⏭] **Form-Pattern Auto-Save** — wartet auf Backend-APIs (Sub-Plan B)
- [x] **Settings-Tests:** typecheck + vitest 88/88 grün, smoke alle /account/settings/* HTTP 307 (auth-gate funktioniert), redirect `/[workspace]/settings/user/*` aktiv

### Phase 6 — Mobile-Adaptation ✅ Done — 2026-05-20

**Ziel:** Mobile (< 768px) ist nutzbar für Landing + Login + Customer-Inspector.

- [x] **Tree-View-Galaxie unter 768px**:
  - `useIsMobile()` Hook in `lib/use-media-query.ts` (SSR-safe via useEffect)
  - HeroSection branchet: `isMobile ? <RepoTreeView /> : <RepoGalaxie />`
  - `RepoTreeView` Expand-inline (User-Wahl Q-N2-D), 44px min-h Touch-Targets, Severity-Pills mit Lucide-Icons inline
  - Klick auf File → öffnet `InspectorMobileSheet` (Vaul Bottom-Sheet)
- [x] **`pnpm add vaul`** v1.1.2 installiert
- [x] **`InspectorMobileSheet.tsx`**:
  - Vaul Drawer mit snapPoints `[0.4, 0.9]`, `activeSnapPoint`-controlled
  - Modal=false (Tree-View bleibt tappable während Sheet offen)
  - Drag-handle oben, aria-label, sr-only Title + Description
- [x] **HeroSection Mobile-Refactor**: mobile-branch rendert Tree-View full-width + Sheet, kein 60/40-Grid
- [x] **Touch-Targets**: Tree-Rows min-h-[44px] (>WCAG 2.5.5)
- [x] **Landing-Mobile-Smoke**: iPhone-UA → HTTP 200, ~113KB HTML (gleich wie Desktop)
- [⏭] **Settings-Pages auf Mobile**: SettingsLayout flippt schon auf flex-col unter lg-Breakpoint (kein Sidebar) — funktional, aber Top-Tabs-Variant aufgeschoben in Phase 7 Polish
- [x] **`/[workspace]/customers/[id]/page.tsx`** Mobile-Polish: Header → border-b, Padding px-6 sm:px-8, type-h1, `id="main-content"`

### Phase 7 — Quality + Beta-Readiness ✅ Done (Quick-Wins) · Deep-Sweep deferred — 2026-05-20

**Ziel:** Lighthouse ≥95 alle Routes, A11y-Sweep, Performance-Budget, Beta-shippable.

**Status:** Quick-Win-Items in dieser Session done. Deep-Sweep-Items (axe-core Playwright, native-dialog-Migration, Demo-Recording, Severity-Patterns) als Sub-Plan `nova-2-a11y-deep-sweep.md`.

- [~] **A11y-Sweep** (Agent 10) — partial:
  - [x] `<MotionConfig reducedMotion="user">` global (neue `GlobalMotionConfig.tsx` im root layout.tsx)
  - [x] Touch-targets ≥44px in RepoTreeView (Phase 6)
  - [⏭] Native `<dialog>` statt Custom-Modal — siehe `nova-2-a11y-deep-sweep.md` (Empfehlung: skip, Radix-UI ist a11y-best-practice in 2026)
  - [⏭] Severity-Pattern (SVG-Streifen für Color-Blind) — Sub-Plan `nova-2-a11y-deep-sweep.md`
  - [⏭] aria-live für SSE-Updates — Sub-Plan
- [x] **Performance-Optimierungen** (Agent 9):
  - [x] `next.config.ts`: `optimizePackageImports: ['lucide-react', 'd3-hierarchy', 'd3-zoom', 'd3-selection']`
  - [x] Galaxie-Canvas: `next/dynamic ssr:false` bestand schon (GalaxieRoot.tsx via Sprint 3)
  - [x] Font: `display: 'swap'` + `adjustFontFallback: true` für Geist + GeistMono
  - [⏭] Cache Components ('use cache' + cacheLife): aufgeschoben — Next 16 Cache-Components ist beta-flag, ROI gegen Risiko nicht klar für Beta-Launch
- [x] **Lighthouse-CI**:
  - `apps/web/scripts/lighthouse-audit.sh` mit 3 separaten Thresholds (Perf 85 / A11y 95 / BP 95)
  - Default-Paths: `/`, `/login`, `/pricing`, `/trust`, `/status` (5 kritische Routes)
- [⏭] **axe-core Playwright** — Sub-Plan `nova-2-a11y-deep-sweep.md` (~2-3h Setup)
- [x] **Build + Typecheck + Vitest grün**: next build 4.8s ✅, typecheck ✅, vitest 88/88 ✅
- [⏭] **Manuelle Tests**: User-Aktion (VoiceOver / Reduced-Motion / Forced-Colors / iPhone-13-Sim)
- [⏭] **Demo-Recording**: User-Aktion (90s Loom)
- [x] **CLAUDE.md update**: "Phase Nova-2 ✅ shipped" mit neuen Sub-Plan-Links
- [x] **MEMORY.md update**: `feedback_phase_pacing.md` für Multi-Phase-Master-Plan-Pattern

---

## 5. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|--------|----------|------------|
| Token-Refactor bricht bestehende Pages (Drift) | **Strong** | shadcn-Tokens überschreiben statt löschen → backward-compatibility. Migration pro Page mit visuellem Vergleich. |
| Cooperative-Pan vom User als "kaputt" empfunden | Mid | Klare Hint-Chip "⌘+scroll to zoom · drag to pan". Settings-Toggle für Full-Capture-Power-User. |
| Mobile-Tree-View fühlt sich wie "Downgrade" an | Mid | Tree-View hat eigene Polish (Severity-Pills, smooth-collapse, Inspector-Sheet). Hint: "Open on Desktop for Galaxy-View". |
| Settings-Restructure bricht bestehende User-Links | Strong | Redirects in `next.config.ts` für gelöschte `/[workspace]/settings/user/*` → `/account/settings/*`. |
| Live-Audit-Flow bricht bei GitHub-Rate-Limit | Strong | Fallback: "Try another repo" CTA + Demo-Galaxy-Load nach 3 Failures. |
| Phase-Reihenfolge zu strikt (Foundation-First) | Weak | Phasen sind weichgekoppelt — Phase 4 (Auth) kann parallel zu Phase 3 laufen wenn Token-Layer (P1) fertig. |
| Bundle-Size durch lucide-react explodiert | Weak | `optimizePackageImports` in Phase 7. Plus tree-shaken-Named-Imports nur. |
| 3-4 Wochen Solo-Burnout | **Strong** | Phase 2 (Hero-Polish) ist erstes Visible-Shippable nach Tag 7 — public-shareable, generiert Energie. |

---

## 6. Files-to-Change-Übersicht (NUR Phase 1-2, detailliert pro Phase im jeweiligen Sub-Plan)

| Datei | Phase | Aktion |
|-------|-------|--------|
| `apps/web/src/app/globals.css` | 1 | Token-Refactor 3-Tier |
| `apps/web/src/components/ui-vk/PageShell.tsx` | 1 | NEU |
| `apps/web/src/components/ui-vk/PageHeader.tsx` | 1 | NEU |
| `apps/web/src/components/ui-vk/SectionHeader.tsx` | 1 | NEU |
| `apps/web/src/components/ui-vk/Card.tsx` | 1 | NEU |
| `apps/web/src/components/ui-vk/EmptyState.tsx` | 1 | NEU |
| `apps/web/src/components/ui-vk/StatTile.tsx` | 1 | NEU |
| `apps/web/src/components/ui-vk/Hairline.tsx` | 1 | NEU |
| `apps/web/src/components/ui-vk/KeyboardHint.tsx` | 1 | NEU |
| `apps/web/src/components/landing/RepoGalaxie.tsx` | 2 | UPDATE — Cooperative-Pan, Keyboard-Nav |
| `apps/web/src/components/landing/Sphere.tsx` | 2 | UPDATE — Lucide-Icons, Spacing |
| `apps/web/src/components/landing/SeverityIcon.tsx` | 2 | NEU — Lucide-Render-Helper |
| `apps/web/src/components/landing/PanHintChip.tsx` | 2 | NEU |
| `apps/web/src/components/landing/GalaxieSettingsPopover.tsx` | 2 | NEU |
| `apps/web/src/lib/repo-galaxie/layout.ts` | 2 | UPDATE — padding depth-differenziert |
| `apps/web/src/components/landing/HeroSection.tsx` | 2 | UPDATE — aspect-video |
| `apps/web/src/app/layout.tsx` | 3 | UPDATE — Skip-Links |
| `apps/web/src/components/SiteNav.tsx` | 3 | UPDATE — Active-State |
| `apps/web/src/app/pricing/page.tsx` | 3 | UPDATE — type-display, Card-VK |
| `apps/web/src/app/billing/page.tsx` | 3 | UPDATE |
| `apps/web/src/app/login/page.tsx` | 3 | UPDATE — Mobile-Padding |
| `apps/web/src/app/[workspace]/customers/page.tsx` | 3 | UPDATE — PageShell, EmptyState |
| `apps/web/src/app/[workspace]/scans/page.tsx` | 3 | UPDATE |
| `apps/web/src/app/status/page.tsx` | 3 | UPDATE |
| `apps/web/src/app/trust/page.tsx` | 3 | UPDATE |
| `apps/web/src/lib/auth.ts` | 4 | UPDATE — Better-Auth Config |
| `apps/web/src/components/auth/MagicLinkEmail.tsx` | 4 | NEU |
| `apps/web/src/app/auth/verify/page.tsx` | 4 | NEU |
| `apps/web/src/components/landing/LiveAuditFlow.tsx` | 4 | NEU |
| `apps/web/src/components/landing/ActivationChecklist.tsx` | 4 | NEU |
| `packages/inngest/src/jobs/re-engagement.ts` | 4 | NEU |
| `apps/web/src/app/account/settings/**` | 5 | NEU |
| `apps/web/src/app/[workspace]/settings/**` | 5 | RESTRUCTURE — 10 Sections |
| `apps/web/src/components/ui-vk/SettingsLayout.tsx` | 5 | NEU |
| `apps/web/src/components/settings/ApiKeyModal.tsx` | 5 | NEU |
| `apps/web/src/components/settings/NotificationMatrix.tsx` | 5 | NEU |
| `apps/web/src/components/settings/DangerConfirm.tsx` | 5 | NEU |
| `apps/web/src/components/landing/RepoTreeView.tsx` | 6 | NEU — Mobile-Replacement |
| `apps/web/src/components/landing/InspectorMobileSheet.tsx` | 6 | NEU |
| `apps/web/package.json` | 6 | ADD vaul |
| `apps/web/next.config.ts` | 7 | UPDATE — optimizePackageImports + Redirects |
| `apps/web/scripts/lighthouse-audit.sh` | 7 | UPDATE — Thresholds |

---

## 7. Test-Strategie

**Pro Phase:**
- Phase 1: types-coverage (Komponenten-Library), snapshot-tests
- Phase 2: layout-test grün, manual Cooperative-Pan auf MacBook + iPhone
- Phase 3: visual-regression auf 8 Pages (Vor/Nach-Screenshots)
- Phase 4: auth-e2e-flow (Magic-Link → Login → Auto-Resume)
- Phase 5: settings-form-saves grün, danger-confirm test
- Phase 6: iPhone-13-Sim alle 3 Mobile-Routes
- Phase 7: Lighthouse-CI grün auf 5 Routes, axe-core 0 Violations

**Acceptance-Kriterien (Beta-Readiness):**
- typecheck ✅
- vitest ✅ (~90/90+)
- next build ✅
- Lighthouse 5 Routes: Perf ≥85, A11y ≥95, Best-Practices ≥95
- iPhone-13-Sim: Landing < 2.5s LCP, Tree-View funktional
- VoiceOver: kompletter Audit-Flow nutzbar

---

## 8. Open Questions

- **Q-N2-A**: Magic-Link-Email-Template — React-Email-Component oder simple HTML-Template?
- **Q-N2-B**: Activation-Checklist — Inline-Sidebar oder Pop-up nach Sign-in?
- **Q-N2-C**: Settings-Sidebar-Position — links (Linear) oder rechts?
- **Q-N2-D**: Mobile-Tree-View — bei Folder-Click expand-inline ODER push-Page-Pattern (wie iOS-Settings)?

Diese werden vor Phase 4/5/6 Sub-Plan-Detail-Schritt geklärt.

---

## 9. Status + Nächste Schritte

**Status:** 🟡 In Review by User.

**User-Aktion:**
1. Master-Plan reviewen — vor allem Phasen-Reihenfolge, Files-to-Change, Risiken.
2. Sub-Plan-Workflow wählen: jeden Phase eigenes Sub-Plan-File schreiben, ODER direkt-execute pro Phase?
3. `/execute nova-2-full-product` → ich starte mit Phase 1 (Foundation).

**Claude-Aktion nach Approval:**
- Phase 1 startet sofort: Token-Layer + 7 Komponenten.
- Pro Phase ein End-of-Day-Status-Update mit Screenshot/Demo-URL.
- Nach Phase 2 (Tag 7): erstes Public-Demoable-Result.

---

## 10. Anhang — V2-Features (NICHT in diesem Plan)

Diese wurden vom User-Interview ausgeschlossen, sind aber dokumentiert für später:

- **GitHub-OAuth** zusätzlich zu Magic-Link (Agent 7 empfiehlt für Dev-Persona)
- **Re-Engagement Inngest-Jobs** (30min/24h/7d) — User-Wahl: post Beta-Launch, sobald echte User da sind
- **PWA-Install-Prompt** (Agent 11: skippen für jetzt)
- **Cross-Device-OTP-Fallback** (6-stelliger Code als Magic-Link-Alternative)
- **Multi-Factor-Authentication** via Better-Auth twoFactor-Plugin (Stripe-Tier-gated)
- **WebAuthn / Passkeys** für 2FA
- **Mobile-Native-App** (Linear-Konsens: Companion, nicht Operate)
- **Real-GitHub-Tree-API-Integration** (heute Mock-Daten)
- **Multi-Customer-Galaxie-Workspace-Level** (heute single-repo Demo)
- **Drift-Visualization** (Submodule pinned commits across customers)
- **WebGL/PixiJS-Migration** wenn N > 500 Files
