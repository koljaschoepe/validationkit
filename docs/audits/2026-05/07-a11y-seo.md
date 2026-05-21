# Audit Sub-7 — A11y · i18n · SEO (Stub)

> Generated: 2026-05-21
> Domain: A11y-Surface · Language · SEO-Basics · Focus · Reduced-Motion
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}
> Note: Deep-Sweep ist eigener Plan (`docs/plans/nova-2-a11y-deep-sweep.md`) — dieser Stub deckt nur die Surface-Befunde + offensichtliche SEO-Lücken.

## Summary

| Metric                                          | Status                                  |
| ----------------------------------------------- | --------------------------------------- |
| Root `<html lang>`                              | `"en"` (Mismatch zu deutscher Zielgruppe — siehe FN-1) |
| Pages mit eigenem `metadata`-Export             | **4 / 27** (`trust`, `legal/*` ×3) — sonst nur Root-Default |
| `openGraph` / `twitter` Tags                    | **0 / 27** Pages — global keine OG-Tags |
| `robots.ts` / `sitemap.ts` / `opengraph-image`  | **alle fehlen** — kein `public/` Ordner |
| Pages mit unique `<h1>`                         | ~20 / 27 — drei Settings-Sub-Pages haben **gar kein** `<h1>` (`integrations`, `ai`, `members`, `billing`, `requests`, `access`); `text-2xl` statt `type-h1` Inkonsistenz |
| Skip-Link Komponente                            | ✅ vorhanden (`SkipToContent` mit dual-target: `#main-content` + `#site-nav`) |
| `id="main-content"` Coverage auf `<main>`       | ~13 / 22 — Legal-Pages, Pricing, Workspace-Customer/Detail/Requests/Access/Scan-Detail/`[workspace]/page.tsx` (Galaxie) ohne ID |
| Lang-Konsistenz UI-Strings                      | Mix de+en (Hero deutsch, alle Pages-H1 englisch, ApiKeyModal englisch) — keine erkennbare Regel |
| `:focus-visible` Global-Style                   | ✅ in `globals.css:188-198` für button/a/input/select/textarea/summary/role=button/menuitem |
| `<MotionConfig reducedMotion="user">` global    | ✅ via `GlobalMotionConfig` in Root-Layout |
| Form-Inputs mit Label/aria-label                | ✅ alle gecheckten Inputs (Login `<Label htmlFor>`, RepoUrlPill `aria-label`, ApiKeyModal `<Label htmlFor>`, DangerConfirm `<Label htmlFor>`) |
| `next/link` vs raw `<a>` für interne Routen     | 5 raw `<a href="/...">` gefunden (Trust ×4 für JSON/RSS/Download — akzeptabel; `[workspace]/error.tsx` für `/dashboard` — fixbar) |
| `<Image>` / `<img>` mit alt                     | **N/A** — kein `next/image` Use, kein `<img>` (außer Radix `AvatarImage`). Public-Ordner fehlt komplett. |

## Findings

### [Kill] FN-1 — Root `<html lang="en">` widerspricht deutschem UI + Zielgruppe
**File:** `apps/web/src/app/layout.tsx:51`
**Issue:** Root-Layout setzt `lang="en"`, aber die Landing-Hero (`HeroSection.tsx`, `RepoUrlPill.tsx`, `BlurOverlayCTA`, Skip-Link "Galaxie überspringen → Findings-Liste") ist auf Deutsch. Screen-Reader sprechen deutsche Strings mit englischer Aussprache aus, Suchmaschinen fehlinterpretieren den Content-Sprach-Mix. Auch `global-error.tsx:20` hat `lang="en"`.
**Why Kill:** SR-Aussprache-Bug + SEO-Sprach-Targeting kaputt. Für eine deutsche Zielgruppe (Lena-Persona, AGB/DPA auf Deutsch) ist `lang="en"` falsch. Wenn die Regel "Code englisch, UI deutsch" gilt, muss das HTML-Element die UI-Sprache reflektieren.
**Suggested Fix:** Entweder a) `lang="de"` setzen und gemischte englische Strings (Settings-Headers, Trust-Page) auf Deutsch übersetzen oder mit `lang="en"` zu wrappen, oder b) Bewusste Entscheidung "UI ist primär englisch" → alle deutschen Strings (Hero, RepoUrlPill ARIA, Skip-Link) auf Englisch. ADR-würdig.

### [Strong] FN-2 — `<main id="main-content">` fehlt auf ~9 Pages, Skip-Link-Target bricht
**File:**
- `apps/web/src/app/legal/agb/page.tsx:18`
- `apps/web/src/app/legal/dpa/page.tsx:17`
- `apps/web/src/app/legal/subprocessors/page.tsx:74`
- `apps/web/src/app/pricing/page.tsx:61`
- `apps/web/src/app/[workspace]/customers/[customerId]/page.tsx:47`
- `apps/web/src/app/[workspace]/repos/[repoId]/page.tsx:38` (hat ID — OK)
- `apps/web/src/app/[workspace]/repos/[repoId]/access/page.tsx:99`
- `apps/web/src/app/[workspace]/requests/page.tsx:41`
- `apps/web/src/app/[workspace]/scans/[id]/page.tsx:54`
- `apps/web/src/app/[workspace]/page.tsx` (Galaxie) — gar kein `<main>`, nur ein `<div>`

**Issue:** `SkipToContent` springt zu `#main-content`, aber auf diesen Pages existiert das Target nicht — der Skip-Link landet im Vakuum (Browser fokussiert nichts oder das `<body>`).
**Why Strong:** Skip-Link ist Keyboard-only A11y-Surface — wenn er auf 9 von ~22 Pages broken ist, ist die Komponente effektiv unbrauchbar. Außerdem fehlt auf `[workspace]/page.tsx` (Galaxie-Root) das `<main>`-Landmark komplett — Screen-Reader Landmark-Navigation versagt.
**Suggested Fix:** Einheitliche `<PageShell as="main" id="main-content">` über alle Pages, oder Lint-Regel die `<main>` ohne ID flaggt.

### [Strong] FN-3 — 5 Settings-/App-Pages ohne `<h1>` (nur `<h2>` oder gar nichts)
**File:**
- `apps/web/src/app/[workspace]/customers/page.tsx` — hat PageHeader (gut via `PageHeader.tsx:43`), aber dann `<h2>` ohne dazwischen liegende h1 wenn PageHeader fehlt
- `apps/web/src/app/[workspace]/scans/[id]/page.tsx:56` — `<h1>Scan detail</h1>` ohne Styles + ohne `id="main-content"` Parent → fast Debug-Stub-Niveau
- `apps/web/src/app/[workspace]/settings/integrations/page.tsx:16` — `text-2xl` statt `type-h1` (Inkonsistenz mit anderen Settings-Sections die `type-h1` nutzen)
- `apps/web/src/app/[workspace]/settings/ai/page.tsx:86` — gleicher Stil-Drift `text-2xl`
- `apps/web/src/app/[workspace]/settings/members/page.tsx:35` — gleich
- `apps/web/src/app/[workspace]/settings/billing/page.tsx:103` — gleich
- `apps/web/src/app/[workspace]/requests/page.tsx:43` — gleich
- `apps/web/src/app/[workspace]/repos/[repoId]/access/page.tsx:103` — gleich
- `apps/web/src/app/[workspace]/page.tsx` (Galaxie-Hub) — **kein `<h1>`** auf der Hauptseite. Nur `EmptyGalaxie.tsx:13` hat einen, wenn die Galaxie leer ist.

**Issue:** Heading-Hierarchie inkonsistent: Settings-Sections nutzen mal `type-h1 font-semibold`, mal `text-2xl font-bold`. Galaxie-Workspace-Root hat gar kein `<h1>` (screen-reader landet auf `<main>`-less Div ohne Section-Title).
**Why Strong:** Multiple-h1-Skip ist semantisch falsch, aber das größere Problem ist `[workspace]/page.tsx` ganz ohne h1 — Hauptansicht des authenticated Products ohne Document-Title-Anchor.
**Suggested Fix:** (1) Galaxie-Page bekommt SR-only `<h1>` mit Workspace-Namen ("`{workspace}` Galaxie"). (2) Alle Settings-Section-Headers auf `type-h1` standardisieren (Drift in 6 Files). (3) Scan-Detail Page bekommt richtiges Layout mit PageHeader.

### [Strong] FN-4 — Marketing-Pages ohne eigenes `metadata` → kein OG-Tag, kein Twitter-Card
**File:**
- `apps/web/src/app/page.tsx` (Landing) — kein `export const metadata`, fällt auf Root-Default zurück
- `apps/web/src/app/pricing/page.tsx` — kein `metadata`-Export
- `apps/web/src/app/login/page.tsx` — kein `metadata`-Export
- `apps/web/src/app/auth/verify/page.tsx` — kein `metadata`-Export
- `apps/web/src/app/status/page.tsx` — kein `metadata`-Export
- `apps/web/src/app/trust/dpa/page.tsx` — kein `metadata`-Export (Eltern-Pfad `/trust` hat eines)
- `apps/web/src/app/trust/eval/page.tsx` — kein `metadata`-Export

**Issue:** Nur `/trust`, `/legal/agb`, `/legal/dpa`, `/legal/subprocessors` haben eigene Metadata. Root `layout.tsx:34-38` definiert nur title+description — **kein `openGraph`-Block, kein `twitter`-Block, keine `metadataBase`**. Wenn jemand die Landing teilt (Twitter/LinkedIn/Slack), gibt es keine Preview-Card, kein Hero-Image. Pricing-Page ist die zentrale Conversion-Surface — die ohne shareable metadata zu lassen ist messbar verlust-treibend.
**Why Strong:** Für ein Produkt das auf Lena (Solo-Consultant) zielt, ist organischer Share-Traffic eine Hauptakquise-Quelle. Pricing + Landing ohne OG → kein Hero-Image bei Share, kein Description-Snippet-Override → SEO-Title aus Root-Layout für ALLE Pages identisch.
**Suggested Fix:**
1. `layout.tsx` `metadata` erweitern: `metadataBase: new URL('https://validationkit.dev')`, `openGraph` mit type/locale/siteName, `twitter` mit `card: 'summary_large_image'`.
2. Per-Page `generateMetadata` für `/`, `/pricing`, `/login`, `/status`.
3. `apps/web/src/app/opengraph-image.tsx` als dynamic OG via `next/og` (matches dem dunklen OKLCH-Token-Look der Landing).

### [Strong] FN-5 — `robots.ts` + `sitemap.ts` fehlen komplett
**File:** kein `apps/web/src/app/robots.ts`, kein `sitemap.ts`, kein `public/` Ordner
**Issue:** Search-Engines bekommen keinen sitemap-Hint und keine robots-Direktive — Default ist "alles crawlen", was inklusive `/auth/verify`, `/billing`, `/[workspace]/*`, `/dashboard` (alles auth-gated und sinnlos für SEO) bedeutet.
**Why Strong:** Marketing-Pages (`/`, `/pricing`, `/trust`, `/legal/*`) sind die einzigen indexierungs-wert, aber ohne sitemap muss Google sie selbst entdecken (langsam). Und auth-routes werden indexiert obwohl sie redirect-only sind → soft-404-Risiko.
**Suggested Fix:**
1. `apps/web/src/app/robots.ts` mit `disallow: ['/auth/*', '/dashboard', '/billing', '/account/*', '/[workspace]/*']`.
2. `apps/web/src/app/sitemap.ts` mit `/`, `/pricing`, `/trust`, `/trust/dpa`, `/trust/eval`, `/legal/agb`, `/legal/dpa`, `/legal/subprocessors`, `/status`.

### [Mid] FN-6 — Sprach-Mix inkonsistent: Hero deutsch, App englisch, Skip-Link deutsch — keine i18n-Regel
**File:**
- `apps/web/src/components/landing/HeroSection.tsx:229` — "ValidationKit — AGENTS.md Audits für Multi-Customer Repos"
- `apps/web/src/components/landing/HeroSection.tsx:237` — "Galaxie überspringen → Findings-Liste" (deutsch)
- `apps/web/src/components/SkipToContent.tsx:14,21` — "Skip to main content" / "Skip to navigation" (englisch)
- `apps/web/src/app/legal/agb/page.tsx` metadata: `"Terms & Pricing — ValidationKit"` (englisch) — Page-Slug aber `agb` (deutsch)
- Alle Settings-Pages: englisch ("Members", "API Keys", "Danger Zone")
- `RepoUrlPill.tsx:65`: `aria-label="Audit läuft"` / `aria-label="Audit starten"` (deutsch)

**Issue:** Keine konsistente Regel: Skip-Link `<SkipToContent>` ist englisch, aber der ALTERNATIVE Skip-Link in HeroSection (`landing-skip-galaxie`) ist deutsch. Inputs in RepoUrlPill haben deutsche aria-labels, aber LoginForm hat "Email" (englisch).
**Why Mid:** Cognitive load für User + SR-User hört Code-Switching. Nicht kill-würdig weil die Funktionalität existiert, aber Polish-Niveau erforderlich für Linear-Aesthetic.
**Suggested Fix:** ADR mit Entscheidung "UI-Sprache Strategie" — entweder Komplett-Deutsch (lang="de") oder Komplett-Englisch (lang="en"). Halbschritt-Lösung: Marketing+Legal deutsch, App englisch (mit zwei distincten Subdomains/Tree-Splits).

### [Mid] FN-7 — Custom `<h1>` Styles drift — `type-h1` vs `text-2xl font-bold`
**File:** siehe FN-3 — 7 Files mit `text-2xl font-bold tracking-tight`, 10 Files mit `type-h1 font-semibold tracking-tight`
**Issue:** Type-Scale `type-h1` ist in `globals.css` als CSS-Utility definiert (Phase Nova-2 Token-System) — neue Settings-Pages umgehen das. Visueller Drift + Wartungs-Drift.
**Why Mid:** Kein Funktionsbug, aber Design-Token-Bypass widerspricht der Nova-2-Foundation-Arbeit (Tokens als single source of truth).
**Suggested Fix:** Migration aller `text-2xl font-bold tracking-tight` → `type-h1 font-semibold tracking-tight`. Lint-Regel oder Stylelint-Plugin um zukünftigen Drift zu verhindern.

### [Mid] FN-8 — `<html lang="en">` in `global-error.tsx` hardcoded (kein dynamisch)
**File:** `apps/web/src/app/global-error.tsx:20`
**Issue:** Wenn FN-1 zu `lang="de"` geändert wird, vergisst man fast den Global-Error-Fallback. Beide Stellen müssen synchron bleiben.
**Why Mid:** Edge-Case bug-prone, aber Global-Error rendert selten.
**Suggested Fix:** Constant `APP_LOCALE` in `@/lib/constants` extrahieren, in beiden HTML-Tags verwenden.

### [Mid] FN-9 — Scan-Detail-Page (`[workspace]/scans/[id]/page.tsx`) ist visuell + a11y-mässig Debug-Stub
**File:** `apps/web/src/app/[workspace]/scans/[id]/page.tsx:53-60`
**Issue:** `<main><header><h1>Scan detail</h1><p><code>{row.rootPath}</code> · {row.createdAt.toISOString()}</p></header>` — keine CSS-Klassen, keine PageShell, keine PageHeader, ISO-String roh angezeigt. Auch fehlt `id="main-content"` (siehe FN-2).
**Why Mid:** Funktional, aber visuell + semantisch unter Nova-2-Standard.
**Suggested Fix:** Refactor zu `<PageShell as="main" id="main-content"><PageHeader title="Scan detail" subtitle={row.rootPath} meta={formatRelative(row.createdAt, 'de-DE')} />…</PageShell>`.

### [Weak] FN-10 — `<a href="/dashboard">` statt `<Link>` in Workspace-Error-Page
**File:** `apps/web/src/app/[workspace]/error.tsx:55`
**Issue:** Raw anchor löst Full-Page-Reload aus statt Client-Side-Navigation. (Trust-Page Anchors für `/api/audit-trail?...` JSON/CSV-Downloads sind korrekt — Download-Links müssen rawe `<a>` bleiben.)
**Why Weak:** Funktional korrekt, aber bricht App-Shell-Persistence.
**Suggested Fix:** `import Link from 'next/link'` und `<Link href="/dashboard">`.

### [Weak] FN-11 — `[workspace]/page.tsx` (Galaxie-Hub) ohne `<main>` Landmark
**File:** `apps/web/src/app/[workspace]/page.tsx:46-47`
**Issue:** Top-level Wrapper ist `<div className="h-screen w-screen">` — kein Landmark, also keine Screen-Reader-Section-Navigation. Galaxie-Inhalt ist primär visuell, aber Inspector + Empty-State + Settings-Popover sind interaktiv.
**Why Weak:** Galaxie ist primär für sighted Users designed, aber das vollständige Fehlen eines Landmarks ist trotzdem ein Audit-Befund.
**Suggested Fix:** `<main id="main-content" aria-label="Workspace Galaxie">` als Top-Wrapper.

### [Weak] FN-12 — `Audit AI consultancies` Badge auf Pricing ohne hidden context für SR
**File:** `apps/web/src/app/pricing/page.tsx:65-67`
**Issue:** Lucide `<Sparkles className="h-3 w-3" />` Icon ohne `aria-hidden`. Mehrere Lucide-Icons im Repo haben `aria-hidden`, aber nicht alle (siehe Mail-Icon in `auth/verify/page.tsx:60` der ist `aria-hidden` — gut).
**Why Weak:** Lucide-Icons sind in SVG `<svg>` rendered, ohne `aria-hidden` werden sie als `<svg>` (presentational) gelesen, was meist OK ist, aber bei dekorativen Icons trotzdem laut.
**Suggested Fix:** Lint-Regel oder Pattern-Etablierung: dekorative Lucide-Icons immer mit `aria-hidden`. Inhaltliche Icons (z.B. Severity-Indikator) bekommen `aria-label`.

### [Exceptional] FN-13 — HeroSection SR-only H1 + dual-skip-link Pattern ist vorbildlich
**File:** `apps/web/src/components/landing/HeroSection.tsx:228-238`
**Issue:** Hero rendert ein `<h1 className="sr-only">ValidationKit — AGENTS.md Audits für Multi-Customer Repos</h1>` (SR + SEO bekommen Title, sighted User sehen Galaxie-Hero) UND einen Skip-Link "Galaxie überspringen → Findings-Liste" der vor der interaktiven Demo positioniert ist.
**Why Exceptional:** Genau die Art von Hidden-A11y-Detail die im Linear-Style-Guide erwähnt aber selten implementiert wird. Sollte als Pattern in `ui-vk/PageShell` für animation-heavy hero-areas adoptiert werden.
**Suggested Fix:** Keep + replicate. In Deep-Sweep dokumentieren als "Hidden-H1 Pattern für Visual-Heavy Sections".

### [Exceptional] FN-14 — Global `:focus-visible` + `GlobalMotionConfig` sind shipped
**File:** `apps/web/src/app/globals.css:188-198` + `apps/web/src/components/GlobalMotionConfig.tsx`
**Issue:** Global-Layer Focus-Outline für 8 Selektoren (button, a, [role=button], [role=menuitem], input, select, textarea, summary) mit 2px ring + 2px offset. Plus `<MotionConfig reducedMotion="user">` im Root-Layout — alle Motion-Animations respektieren `prefers-reduced-motion: reduce` automatisch.
**Why Exceptional:** Diese beiden Foundations sind die Voraussetzung für jeden seriösen a11y-Sweep — viele Codebases haben das nie. Nova-2 P7 hat hier hart geliefert.
**Suggested Fix:** Keep. Im Deep-Sweep darf darauf gebaut werden.

## Out-of-Scope (Deep-Sweep)

Diese Themen sind nicht in diesem Stub gecheckt — sie gehören in `docs/plans/nova-2-a11y-deep-sweep.md`:

- **Color-Contrast Pairs** — OKLCH-Token-Audit (`text-muted-foreground` on `bg-card`, `bg-muted/50` on `bg-background`, etc.). Heuristisch fielen mehrere `text-muted-foreground` auf `bg-muted/50` Stellen auf die unter WCAG-AA 4.5:1 liegen könnten. axe-core in Playwright kann das deterministisch.
- **Keyboard-Navigation Order** — Galaxie-Sphere `role="application"` ist ein Trap-Risiko. Tab-Order in Settings-Sidebar, in Customer-Detail mit ScrollArea + Tabs.
- **ARIA-Live-Regions** — Toaster (Sonner) sollte `aria-live="polite"` haben — nicht gecheckt.
- **Screen-Reader-Walk** — Galaxie-Inspector-Open/Close, Vaul Bottom-Sheet, BlurOverlayCTA Magic-Link-Flow.
- **Form-Error-Announcement** — LoginForm Resend-Throttle-Error wird visuell gezeigt, aber `aria-live`/`role="alert"` auf den Error-Container ist ungecheckt (RepoUrlPill hat es bei `:78`).
- **Tab/Dialog/Tooltip ARIA-Compliance** — radix-ui liefert Defaults; Custom-Wrapper sind nicht durchgegangen.
- **Demo-Recording** — Phase Nova-2 plan-out für E2E demo-flow.

## Priorisierung für Action-Owner

| FN | Severity | Effort | Impact |
| --- | --- | --- | --- |
| FN-1 | Kill | M (ADR + Text-Audit) | SR-Korrektheit + SEO-Lang-Targeting |
| FN-2 | Strong | S | Skip-Link wird auf 9 Pages funktional |
| FN-3 | Strong | M | A11y + Design-Token-Konsistenz |
| FN-4 | Strong | M (OG-Image-Design + per-page) | Share-Traffic + organic SEO |
| FN-5 | Strong | S | `robots.ts` + `sitemap.ts` 2-File-PR |
| FN-6 | Mid | L (ADR + Refactor) | Cognitive consistency |
| FN-7 | Mid | S (find/replace) | Design-Token-Disziplin |
| FN-8 | Mid | XS | Robustheit |
| FN-9 | Mid | S | Scan-Detail-Polish |
| FN-10 | Weak | XS | Performance |
| FN-11 | Weak | XS | Landmark-Coverage |
| FN-12 | Weak | S (Lint-Regel) | SR-Noise-Reduction |

**Recommended Bundle:** FN-2 + FN-5 + FN-8 + FN-10 + FN-11 als single "A11y-Surface-Sweep" PR (~halber Tag). FN-1 + FN-6 als separater i18n-ADR (Discovery erforderlich). FN-3 + FN-7 + FN-9 als "Settings-Heading-Consolidation" PR. FN-4 als "Marketing-SEO-Pass" PR mit OG-Image-Design.
