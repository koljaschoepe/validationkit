# Audit Sub-6 — Performance

> Generated: 2026-05-21
> Domain: Bundle-Size · LCP · Cache · Boundaries · Imports
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}

## Summary

- `next.config.ts` exists with `optimizePackageImports: ['lucide-react', 'd3-hierarchy', 'd3-zoom', 'd3-selection']`
- `'use client'` components total: **26 in components/landing+galaxie+settings+ui-vk**, ~40 overall outside `components/ui/*`
- `'use cache'` directive usage: **0 / 39 pages** (Cache-Components/PPR not adopted)
- `unstable_cache` usage: **1 file** (`lib/dal/galaxie.ts`)
- `Suspense` in `app/`: **1 page** (`[workspace]/page.tsx`)
- `loading.tsx`: **5 files** (workspace + customers + scans + requests + billing)
- Lighthouse-CI configured: ❌ no `lighthouserc`; only ad-hoc `scripts/lighthouse-audit.sh` wrapper (perf 85 / a11y 95 / bp 95 thresholds via env)
- Hardcoded `<img>` tags: **0** ✅ (only CSS `background-image`)
- `next/font` with `display: 'swap'`: ✅ both Geist + Geist_Mono
- d3 star-imports: **0**; lucide-react: all named imports ✅
- motion (Framer): only in 7 client components, LazyMotion + domAnimation used in HeroSection ✅
- PixiJS isolated to `/[workspace]` via `next/dynamic({ ssr: false })` ✅, NOT in landing bundle
- API routes: 7 total, 5 explicit `runtime = 'nodejs'`, 2 implicit (auth, inngest, install-webhook — auto-Node)

**Headline finding:** Root layout has `export const dynamic = "force-dynamic"` — this disables static rendering for **every** page including `/` (landing), `/pricing`, `/legal/*`, `/trust` (where it isn't already further overridden). This is the single biggest perf lever in the repo. Combined with **zero** `'use cache'` directives and **zero** PPR adoption, the app pays full SSR cost on cold cache for marketing routes that don't need it.

## Findings

### [Kill] FN-6.1 — `force-dynamic` at root layout blocks static rendering for marketing routes
**File:** `apps/web/src/app/layout.tsx:32`
**Issue:** `export const dynamic = "force-dynamic"` is declared on the root layout. Comment justifies it via Vercel-Marketplace runtime-only env vars (`isAuthEnabled()` check freezing into HTML). Effect: **every** route — landing `/`, `/pricing`, `/legal/dpa`, `/legal/agb`, `/legal/subprocessors`, `/trust` — is rendered dynamically on every request. The comment explicitly calls this out as "Phase-2 optimization: switch to per-route opt-in static where auth-irrelevant", but Phase-2 hasn't landed. Marketing-page LCP and TTFB pay Neon-Postgres cold-start latency on every visit.
**Bundle-Impact:** Not bundle-size, but **TTFB +200–800 ms** on cold-edge for routes that could be statically rendered (and CDN-served). Worst hit: landing `/` (SVG hero is 532-line client component, even with static HTML shell would yield streaming Suspense headroom).
**Suggested Fix:** Invert the default — remove `force-dynamic` from root layout. Gate the `isAuthEnabled()` rendering with a fetch boundary or read it at the route level. Marketing pages (`/`, `/pricing`, `/legal/*`, `/trust`) should be `export const dynamic = 'auto'` (or `'force-static'` after auth refactor). Authenticated routes (`/[workspace]/*`, `/account/*`) already self-declare `force-dynamic`.

### [Strong] FN-6.2 — No `'use cache'` / PPR adoption despite Next.js 16 + Cache-Components stack
**File:** repo-wide (0 hits for `'use cache'`)
**Issue:** Tech-stack header in CLAUDE.md lists "Next.js 16 + App Router + Cache Components". The bootstrap-injection includes `next-cache-components` skill. Yet the codebase has **zero** `'use cache'` directives, **zero** `cacheLife()` / `cacheTag()` annotations from `next/cache`, and exactly **one** legacy `unstable_cache` wrap (`lib/dal/galaxie.ts:284`). `experimental.ppr` is not enabled in `next.config.ts`. The whole Cache-Components value-prop is sitting unused.
**Bundle-Impact:** No bundle change, but missed CDN-cache hits. `/[workspace]/page.tsx` does 3 DB roundtrips per render (`getGalaxieDataForWorkspace` + `listUserWorkspaces` + `getWorkspaceCounts`) — all are tag-cacheable with `cacheTag(workspaceTag(id))` and would let `revalidateTag` (already imported) actually short-circuit re-render.
**Suggested Fix:** Adopt `'use cache'` for DAL functions returning workspace + galaxie data. Add `cacheTag(workspaceTag(id))` everywhere `revalidateTag(workspaceTag(id))` is called (consistency check via the existing `lib/cache-tags.ts` registry + `cache-tags.test.ts` guard). Enable PPR per-route on `/[workspace]/page.tsx` (heavy Suspense + dynamic header read in the same tree — textbook PPR candidate).

### [Strong] FN-6.3 — Pricing page declared `force-dynamic` but renders only static data
**File:** `apps/web/src/app/pricing/page.tsx:24`
**Issue:** `export const dynamic = "force-dynamic"` even though the page imports static `TIERS` from `@vk/billing`. It does call `headers()` for VAT-context — that alone would force dynamic implicitly anyway, but the explicit declaration prevents any partial-prerender or `'use cache'` optimization. The VAT-context section is a perfect PPR cell (dynamic on a static page shell).
**Bundle-Impact:** TTFB on `/pricing` is fully serial: must wait for VAT-resolve before flushing _anything_. Marketing page.
**Suggested Fix:** Drop the explicit `force-dynamic`. Wrap the VAT-display in `<Suspense fallback={<DefaultVat />}>` and let the rest of the tier-grid prerender. With PPR enabled, the shell ships immediately and the VAT amount streams in.

### [Strong] FN-6.4 — Only 1 of 39 pages uses `<Suspense>`; slow DAL waterfalls serialized
**File:** repo-wide (`grep "Suspense" apps/web/src/app/` → only `[workspace]/page.tsx`)
**Issue:** `[workspace]/page.tsx:35` runs `await getWorkspaceCounts(result.workspace.id)` **after** the `Promise.all` for galaxie + workspaces. Counts depends only on `workspace.id` (available right after Promise.all resolves) — could itself be inside Promise.all by re-shaping the resolve. Acceptable, but other pages have worse patterns: `/[workspace]/customers/page.tsx:35-36` serially `resolveWorkspaceFromSlug` then `listCustomers(ws.id)` (forced by dependency, but no `<Suspense>` around it → user sees blank page until both finish).
**Bundle-Impact:** Perceived-load on customer page = `auth + ws-resolve + customer-list` serially; could be `auth + Promise.all([ws, render-shell])` with the customer table streaming-in via Suspense.
**Suggested Fix:** Adopt a streaming pattern repo-wide: render the `PageShell + PageHeader + SiteNav` immediately, wrap heavy DAL reads in Suspense boundaries with skeletons. Already done well in `[workspace]/page.tsx` for galaxie — replicate for `customers`, `scans`, `requests`, `repos/[repoId]`, `settings/billing`.

### [Strong] FN-6.5 — `SettingsLayout` is `'use client'` despite reading only `usePathname()`
**File:** `apps/web/src/components/ui-vk/SettingsLayout.tsx:1`
**Issue:** SettingsLayout is mounted by 2 server-layouts (`/[workspace]/settings/layout.tsx`, `/account/settings/layout.tsx`) and wraps the entire settings-tree (10 + 5 sections). The only client need is `usePathname()` for the active-link bold-bar indicator. This pulls every child + every `lucide` icon prop into the client bundle for what is otherwise a static link list.
**Bundle-Impact:** Estimated +6–10 kB gzip (lucide chevron + active-state computation). Could split: server-rendered nav scaffold + tiny `<ActiveLinkMarker>` client island that reads pathname and toggles a CSS class.
**Suggested Fix:** Mirror the `SiteNav` / `SiteNavLinks` split pattern already used in `components/SiteNav.tsx`. Server-render the nav structure; expose only the active-state pill as a client island.

### [Mid] FN-6.6 — `optimizePackageImports` missing several heavy dependencies
**File:** `apps/web/next.config.ts:36`
**Issue:** Current allowlist: `lucide-react`, `d3-hierarchy`, `d3-zoom`, `d3-selection`. Missing candidates already in `dependencies`:
- `radix-ui` (barrel package, used via `cmdk` + UI primitives)
- `motion` (motion/react has tree-shake-unfriendly defaults; LazyMotion mitigates partly)
- `@radix-ui/*` (multiple sub-packages via `radix-ui`)
- `@use-gesture/react`

**Bundle-Impact:** lucide and d3 already covered; the remaining set is harder to quantify without analyzer output, but `radix-ui` barrel is known to bring 30+ kB unminified into Suspense islands that only need one primitive.
**Suggested Fix:** Add `radix-ui`, `motion`, `@use-gesture/react` to `optimizePackageImports`. Run `next build --debug-build-paths` and measure. The `next-cache-components` skill in the bootstrap-injection hints PPR + optimizePackageImports are the next-step combo.

### [Mid] FN-6.7 — `gsap` imported into PixiJS galaxie scene without code-split
**File:** `apps/web/src/components/galaxie/GalaxieScene.tsx:15`, `apps/web/src/components/galaxie/Inspector.tsx:14`
**Issue:** `gsap` (~28 kB gzip) is bundled into every `/[workspace]` page even when galaxie is empty. GalaxieScene is already dynamic-imported (`GalaxieRoot.tsx:13`) so it sits behind a code-split — but Inspector pulls gsap unconditionally and `Inspector.tsx` is `'use client'` and likely included via the galaxie subtree.
**Bundle-Impact:** ~28 kB gzip on `/[workspace]/*` route chunk. Not on landing.
**Suggested Fix:** Verify gsap actually code-splits with GalaxieScene (analyzer pass). If Inspector is rendered on a synchronous path, lazy-import gsap inside the animation effect: `const { gsap } = await import('gsap')`.

### [Mid] FN-6.8 — `'use client'` boundary scope on landing hero pulls 532 lines into the bundle
**File:** `apps/web/src/components/landing/HeroSection.tsx:1`
**Issue:** HeroSection is the entire LCP element of `/`. The whole 532-line file is client-side because of `useActionState` + `useState` + form interactivity. The internal `RepoGalaxie`, `RepoInspector`, `BreadcrumbBar`, `GalaxieSettingsPopover`, `RepoTreeView`, `InspectorMobileSheet`, `BlurOverlayCTA`, `RepoUrlPill`, `SignUpTeaseDialog` are all separate `'use client'` components — fine, but the entire form lives in one boundary together with all visual chrome.
**Bundle-Impact:** Initial JS for `/` = HeroSection + 7 child clients + motion/LazyMotion + lucide icons. Estimated 90–130 kB gzip for the hero alone (manual estimate, no analyzer run).
**Suggested Fix:** Split the form-island (the URL-input + auditAction) from the visual galaxie tree. Server-render the static demo-galaxie SVG shell as the LCP element; mount the form as a separate small client island below. LCP improves because the static SVG renders without waiting for hydration of the form-state.

### [Mid] FN-6.9 — `unstable_after()` / Inngest not used to defer post-action work
**File:** repo-wide (0 hits for `unstable_after`)
**Issue:** Server actions like `auditAction` in `lib/audit-action.ts` call `revalidatePath` + `updateTag` synchronously within the action response. Inngest is set up (`packages/inngest/`, `api/inngest/route.ts`) for true background jobs, but small post-response side-effects (analytics events, log writes) would benefit from `after()` (the new Next 15+ API) — the user gets the response immediately while the work happens after flush.
**Bundle-Impact:** Wall-clock latency on form-submit actions = ~50–200 ms saved per call. Not bundle-size.
**Suggested Fix:** Audit server-action call paths for fire-and-forget side-effects (audit-trail writes, telemetry). Move them into `after()` from `next/server`. Reserve Inngest for cross-request durable work.

### [Weak] FN-6.10 — Lighthouse only available as ad-hoc bash script, no CI gate
**File:** `apps/web/scripts/lighthouse-audit.sh`, no `.lighthouserc*`
**Issue:** The bash wrapper has Nova-2 thresholds (perf 85 / a11y 95 / bp 95) but it's a manual one-shot. No `lighthouserc.json`, no Vercel commit-comment integration, no GitHub Actions workflow that fails PRs on regression. Phase-Nova-2 callout in CLAUDE.md claims "Lighthouse-CI 3 thresholds" — partially true but not "CI".
**Bundle-Impact:** None directly; but bundle-regression is undetectable without it.
**Suggested Fix:** Either (a) add a real `lighthouserc.json` + a GH Action that runs LHCI on PR-preview-deployments, or (b) rename the shell script to `lighthouse-local.sh` and stop claiming CI in CLAUDE.md / changelog.

### [Weak] FN-6.11 — `'use client'` GalaxieSkeleton, EmptyGalaxie used as Suspense fallbacks
**File:** `apps/web/src/components/galaxie/GalaxieSkeleton.tsx` (server-friendly per comment), `apps/web/src/components/galaxie/EmptyGalaxie.tsx:1` (`'use client'`)
**Issue:** GalaxieSkeleton is server-friendly (good). EmptyGalaxie is `'use client'` despite probably being a pure presentational state. Used as a Suspense-fallback or empty-state visual; if so, client-side adds nothing.
**Bundle-Impact:** Small (single component), but tax-on-empty-workspace is exactly the new-user first-paint moment.
**Suggested Fix:** Remove `'use client'` if EmptyGalaxie has no hooks/interactivity. Check + verify with `grep -E "useState|useEffect|useRef|on[A-Z]" EmptyGalaxie.tsx`.

### [Exceptional] FN-6.12 — PixiJS isolated correctly via `next/dynamic({ ssr: false })`
**File:** `apps/web/src/components/galaxie/GalaxieRoot.tsx:13`
**Issue:** N/A — this is good practice worth noting. Pixi v8 + `@pixi/react` touches `window` at module-eval; the dynamic-import-no-ssr boundary keeps it out of every other route's chunk. Comment even documents why.
**Bundle-Impact:** Saves ~200+ kB gzip from landing + auth + settings bundles.
**Suggested Fix:** None. Extend the same pattern to `gsap` (FN-6.7).

### [Exceptional] FN-6.13 — Font loading via `next/font` with explicit `display: 'swap'` and pinned `adjustFontFallback`
**File:** `apps/web/src/app/layout.tsx:14-25`
**Issue:** N/A — best practice. Comment even pins `adjustFontFallback: true` against future Next regressions.
**Bundle-Impact:** No FOIT, reduced CLS.

## Cross-Cutting Observations

1. **Tech-stack drift:** CLAUDE.md claims "Next.js 16 + Cache Components" but the codebase uses 0 `'use cache'` and 1 `unstable_cache`. Either ship Phase-X to adopt Cache-Components, or revise the architecture doc to "Next.js 16 + App Router (Cache-Components deferred)".
2. **PPR is the highest-leverage missing config.** Single-line `experimental.ppr = 'incremental'` + per-page `export const experimental_ppr = true` would unlock the marketing-page payoff once `force-dynamic` is removed from root.
3. **Bundle-analyzer not configured.** Adding `@next/bundle-analyzer` behind `ANALYZE=true next build` would let every finding above be quantified instead of estimated. Recommended as the first follow-up.
4. **`useMemo` usage in HeroSection/RepoGalaxie is appropriate** (galaxie-layout caching, breadcrumb-path derivation). No premature-pessimization detected. `useTransition` correctly applied in form-submit components.

## Out of Scope / Not Investigated

- Actual bundle-analyzer run (skipped per audit instructions — > 2 min build risk on first cold turbo cache)
- Edge-vs-Node runtime tradeoff for auth route handler (auth lives in `nodejs` implicit; needs full ADR if changed)
- Vercel Fluid Compute config (no `vercel.ts` found; only legacy `vercel.json` — see other audit)
- Server Action chunking strategy / `next dev --turbo` boot time
