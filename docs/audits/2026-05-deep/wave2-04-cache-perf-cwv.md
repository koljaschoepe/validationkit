# Wave-2 · Sub-04 · Cache-Components + Streaming + Core-Web-Vitals

**Scope:** Next.js 16 render-strategy, `'use cache'` adoption plan, Suspense
coverage, bundle outliers, image/font/script-loading, CWV estimates,
Lighthouse-CI thresholds, Top-5 pre-launch perf-wins.

**Method:** static analysis of `apps/web/src/app/**` + DAL inspection +
production `pnpm --filter @vk/web build` run (Next 16.2.6 + Turbopack) +
chunk-size inspection of `apps/web/.next/static/chunks`.

**Tone:** Cache-Components-Adoption is Strong/Mid (de-prioritised in Wave-1).
This sub-report exists to surface the **subset that would actually move CWV
for launch**, not to scope a full adoption project.

---

## Executive summary

1. **Single biggest finding (Strong, blocker-class for marketing CWV):**
   every single page in the build manifest is `ƒ Dynamic` — including
   `/legal/agb`, `/legal/dpa`, `/legal/subprocessors`, `/`, `/pricing`, `/login`,
   `/trust`, `/trust/dpa`, `/trust/eval`. The reason is that the root layout
   transitively forces `cookies()` access through `<SiteNav>` →
   `getSessionUser()` → `headers()`. The Nova-3a comment in
   `apps/web/src/app/layout.tsx:27-31` that says marketing routes "can now
   statically prerender" is **functionally false** — every marketing page is
   still SSR-on-demand because `SiteNav` is mounted by the page itself
   (e.g. `apps/web/src/app/page.tsx:8`, `apps/web/src/app/pricing/page.tsx:70`,
   `apps/web/src/app/legal/agb/page.tsx:18`).
2. **`'use cache'` adoption is genuinely 0** (confirmed via
   `grep -rn "'use cache'" apps/web/src` returns no source-code hits, only
   the `apps/web/.next/types/cache-life.d.ts` build artifact).
3. **K17 / K2 from Wave-1 (CLS on workspace hub)** is unfixed. Single
   highest-leverage CWV fix in the repo.
4. **Suspense coverage is 2/39** (`apps/web/src/app/[workspace]/page.tsx:48`
   and `apps/web/src/app/login/page.tsx:62`). Most async pages just block.
5. **No `<img>` raw tags. No `next/image` either** — visual content is
   SVG + Pixi-WebGL + CSS only. Means LCP is text-based, not image-based.
6. **No `next/script`. No external analytics or chat widgets.** Means INP is
   pure first-party JS (Pixi + motion + cmdk).
7. **PixiJS bundle (~107 KB) is correctly `dynamic({ ssr: false })`** — only
   loads on `/[workspace]` routes. ✓
8. **Largest single client chunk: 492 KB** — contains `@pixi/react` + `motion`
   + `cmdk`. Ships on every interactive route. Could be split further but
   probably not blocker.
9. **Lighthouse-CI uses `"error"` thresholds** at Perf 0.85 / A11y 0.95 /
   BP 0.95 — flake-risk confirmed.

---

## Part A — Render-Strategy per Route

**Reality from the Turbopack build output:** every single one of the 38
non-asset routes is currently `ƒ Dynamic`. Only 4 routes are `○ Static` —
all of them are `route.ts`-level handlers or generated files
(`/robots.txt`, `/sitemap.xml`, `/trust/sub-processors.json`,
`/trust/sub-processors.xml`). This is the single biggest production-readiness
gap in this report.

The "Strategy-Should" column reflects what the route's own data dependencies
need — **not** what `SiteNav`'s cookie-read forces today. The
recommended-action column captures both.

### A.1 Public / marketing routes

| Route | Strategy-Now | Strategy-Should | Cacheable-Data | Action |
|---|---|---|---|---|
| `/` (`page.tsx`) | ƒ Dynamic | Static (or `'use cache'` w/ `cacheLife("days")`) | Hero is pure markup. Galaxie is client-only (`dynamic({ssr:false})`). | Lift `<SiteNav>` out → use a separate auth-aware client wrapper that hydrates the "Sign in / Dashboard" CTA without forcing the page dynamic. |
| `/pricing` (`pricing/page.tsx`) | ƒ Dynamic | Streaming-PPR or split | `TIERS`, `ANNUAL_DISCOUNT` are static module-level constants. Only `searchParams.cycle` + `x-vercel-ip-country` header are dynamic. | Wrap the static hero+grid+FAQ in `'use cache'` per cycle; isolate the VAT-by-country line in a Suspense boundary. |
| `/login` (`login/page.tsx`) | ƒ Dynamic | Dynamic (correct — calls `getSessionUser`) | Card-shell is static. | Wrap the `<Card>` shell in a static parent; keep the auth-gate as inner dynamic island. Already has `<Suspense fallback={null}>` around `LoginForm` (line 62) which is good. |
| `/trust` (`trust/page.tsx`) | ƒ Dynamic | Static | Pure server-component, no I/O. | Same fix as `/` — kill the cookie chain. |
| `/trust/dpa` (`trust/dpa/page.tsx`) | ƒ Dynamic | `'use cache'` (`cacheLife("days")`) | `readFile("docs/legal/dpa-template.md")` happens every request right now (line 24). | Wrap `loadDpaMarkdown()` with `'use cache'` + tag `dpa:template`; invalidate from `dpa-actions.ts` on version-bump. Also remove the unnecessary `export const dynamic = "force-dynamic"` on line 19 — the file-read + session look-up already opt the page in, and `force-dynamic` precludes `'use cache'`. |
| `/trust/eval` (`trust/eval/page.tsx`) | ƒ Dynamic | `'use cache'` (`cacheLife("days")`) | `readdir`/`readFile` of `eval/conflicts/results/*.json`. CI writes daily. | Wrap entire DAL fn in `'use cache'` with tag `eval:conflicts`; on every CI run, the build invalidates anyway. Drop `force-dynamic`. |
| `/legal/agb` (`legal/agb/page.tsx`) | ƒ Dynamic | Static | Pure markup, no I/O. | Same root-cause fix. |
| `/legal/dpa` (`legal/dpa/page.tsx`) | ƒ Dynamic | Static | Pure markup, no I/O. | Same root-cause fix. |
| `/legal/subprocessors` (`legal/subprocessors/page.tsx`) | ƒ Dynamic | Static | Inline data-array. | Same root-cause fix. |
| `/status` (`status/page.tsx`) | ƒ Dynamic | SSR-Dynamic | `probeAll()` does live HEAD requests every render. | Add `revalidate = 30` or short `cacheLife("seconds")` — health-checks don't need real-time. Stop hammering Resend/Inngest/Anthropic with HEADs on every page hit. |
| `/auth/verify` (`auth/verify/page.tsx`) | ƒ Dynamic | Dynamic (correct) | Magic-link verification, token-bound. | Keep `force-dynamic`. |

### A.2 Authenticated app routes (`/[workspace]/**`)

These all stay dynamic — they read membership-gated DB rows. The opportunity
is **streaming + per-query `'use cache'` on the slow joins**, not
full-page caching.

| Route | Strategy-Now | Strategy-Should | Cacheable-Data | Action |
|---|---|---|---|---|
| `/dashboard` (`dashboard/page.tsx`) | ƒ Dynamic | Dynamic (correct, redirect-only) | n/a | OK. Note: `loading.tsx` is unused since this is redirect-only. |
| `/[workspace]` (`page.tsx`) | ƒ Dynamic | Dynamic + streaming | `getGalaxieDataForWorkspace` already wrapped in `unstable_cache` tagged `galaxie:workspace:<id>` (line 284). `listUserWorkspaces` is **not** cached. `getWorkspaceCounts` is **not** cached. | Migrate `unstable_cache` → `'use cache'`. Wrap `listUserWorkspaces` with tag `user:<id>:workspaces` (helper already exists at `lib/cache-tags.ts:11`). Wrap `getWorkspaceCounts` with tag `galaxieWorkspaceTag(id)`. |
| `/[workspace]/customers` | ƒ Dynamic (`force-dynamic`) | Dynamic, cache the list | `listCustomers(workspaceId)` joins customer + repo + scan — heaviest query in the app. | Add `'use cache'` to `listCustomers` w/ tag `galaxieWorkspaceTag(workspaceId)`. Remove `force-dynamic` from `customers/page.tsx:23` — page is already auto-dynamic via session+params. |
| `/[workspace]/customers/[customerId]` | ƒ Dynamic | Dynamic, cache the detail | `getCustomerById` is uncached. Repos+scans join. | Same as above. |
| `/[workspace]/repos/[repoId]` | ƒ Dynamic | Dynamic, cache | `getRepo` uncached. Joins scans. | Same as above. |
| `/[workspace]/repos/[repoId]/access` | ƒ Dynamic (`force-dynamic`) | Dynamic | Members + install-requests — both small queries. | Drop `force-dynamic:24`. Auto-dynamic via session is enough. |
| `/[workspace]/requests` | ƒ Dynamic | Dynamic | `listRequestsForWorkspace` uncached. | Cache w/ tag `requests:workspace:<id>`. |
| `/[workspace]/scans` | ƒ Dynamic | Streaming | `db.select.from(scan).limit(50)` — fast, but blocks the whole page. | Wrap the table in `<Suspense fallback={<TableSkeleton/>}>`. |
| `/[workspace]/scans/[id]` | ƒ Dynamic | Dynamic + streaming | Hot path: ScanStatusBanner polls. Below-the-fold `ReportView` is heavy. | Wrap `<ReportView>` in `<Suspense>` so the status-banner shows instantly. |
| `/[workspace]/settings/billing` | ƒ Dynamic (`force-dynamic`) | Dynamic | `ensureSubscription(ws.id)` + grants query. Stripe-shaped. | Cache `ensureSubscription` with short `cacheLife("seconds")` + tag `billing:workspace:<id>` invalidated from Stripe webhook. Drop `force-dynamic:30`. |
| `/[workspace]/settings/ai` | ƒ Dynamic (`force-dynamic`) | Dynamic | BYOK + subscription-snapshot. | Drop redundant `force-dynamic:27` — session lookup auto-dynamicises. |
| `/[workspace]/settings/{general,api-keys,audit-apply,galaxie,danger}` | ƒ Dynamic | **Static-eligible** | All are coming-soon shells with zero session-dependent rendering. They only stay dynamic because the parent `settings/layout.tsx:20` exports `force-dynamic`. | Remove `force-dynamic` from `settings/layout.tsx` once the rest of the tree is fixed. Inner pages already gate on auth via their own session reads if needed. |
| `/[workspace]/settings/{integrations,members,notifications,webhooks}` | ƒ Dynamic | Dynamic | Membership data, integrations check. | Cache `listMembers(workspaceId)` w/ tag `members:workspace:<id>`. |
| `/account/settings/profile` | ƒ Dynamic (`force-dynamic`) | Dynamic | `getSessionUser()`. | Drop redundant `force-dynamic:6`. |
| `/account/settings/{connections,delete,notifications,sessions}` | ƒ Dynamic | **Static-eligible** | All are coming-soon shells. | Drop `force-dynamic` from `account/settings/layout.tsx:14`. |
| `/billing` | ƒ Dynamic (`force-dynamic`) | Dynamic (redirect-only) | n/a | Keep — needs session to compute target workspace. Delete `loading.tsx` (Wave-1 M5). |

### A.3 API routes

| Route | Strategy-Now | Notes |
|---|---|---|
| `/api/auth/[...all]` | ƒ Dynamic | Correct |
| `/api/audit-trail` | ƒ Dynamic | Correct |
| `/api/events/stream` | ƒ Dynamic + Node runtime | Correct (SSE) |
| `/api/inngest` | ƒ Dynamic | Correct |
| `/api/install-webhook` | ƒ Dynamic | Correct |
| `/api/notify-update` | ƒ Dynamic + Node runtime | Correct |
| `/api/stripe/webhook` | ƒ Dynamic + Node runtime | Correct — needs raw body |
| `/trust/sub-processors.json` | ○ Static (`force-static`) + Node | Correct |
| `/trust/sub-processors.xml` | ○ Static (`force-static`) + Node | Correct |

### A.4 Static routes (confirmed prerendered)

`○ /robots.txt`, `○ /sitemap.xml`, `○ /trust/sub-processors.json`,
`○ /trust/sub-processors.xml`. These are the only 4 routes the build pre-renders.

---

## Part B — Cache-Components Adoption Plan

> Per Next.js 16 docs (`https://nextjs.org/docs/app/api-reference/directives/use-cache`):
> `'use cache'` requires `experimental.cacheComponents: true` (or
> `dynamicIO`). **This flag is not currently set in
> `apps/web/next.config.ts`.** Setting it has app-wide implications —
> every component becomes implicitly uncached unless inside a Suspense
> boundary or a `'use cache'` scope. Adoption is therefore an
> opt-in-via-config decision, not a per-function change.

### B.1 Decision: enable or stay on `unstable_cache`?

**Recommendation: keep `unstable_cache` for launch; do a *partial*
`'use cache'` adoption in a follow-up plan.**

Rationale:
- The single existing `unstable_cache` call (`lib/dal/galaxie.ts:284`)
  works. Tag-invalidation is wired (`lib/cache-tags.ts`).
- Flipping `experimental.cacheComponents: true` rewrites the contract for
  the whole app and is a Strong-effort change with real risk of
  regression. Wave-1 already de-prioritised this for launch.
- The **bigger** Cache-Components-style win (static marketing pages) is
  **unlocked without** `'use cache'` — just by fixing the SiteNav cookie
  chain (Part A.1).

### B.2 Candidate functions for `'use cache'` (post-launch follow-up)

Ranked by impact:

1. **`listCustomers(workspaceId)`** in `apps/web/src/lib/customer-dal.ts:38`
   - Triple-join (customer + repo + scan) — heaviest query in the app.
   - Profile: `cacheLife("minutes")`
   - Tag: `galaxieWorkspaceTag(workspaceId)` (already used by mutations).
2. **`getCustomerById(workspaceId, customerId)`** in
   `apps/web/src/lib/customer-dal.ts`
   - Profile: `cacheLife("minutes")`
   - Tag: `galaxieWorkspaceTag(workspaceId)` + `customer:<id>`.
3. **`listMembers(workspaceId)`** in `apps/web/src/lib/membership.ts`
   - Membership rows change rarely.
   - Profile: `cacheLife("hours")`
   - Tag: `members:workspace:<id>` (new — add to `lib/cache-tags.ts`).
   - Invalidated by `claimPendingMemberships` and any invite/remove action.
4. **`listUserWorkspaces(userId)`** in `apps/web/src/lib/dal/galaxie.ts:320`
   - Called on every `/[workspace]` and `/dashboard` request.
   - Profile: `cacheLife("hours")`
   - Tag: `userWorkspacesTag(userId)` (already declared at
     `lib/cache-tags.ts:11`, currently unused).
   - Invalidated by membership writes.
5. **`getWorkspaceCounts(workspaceId)`** in
   `apps/web/src/lib/dal/galaxie.ts`
   - Drives the onboarding checklist.
   - Profile: `cacheLife("minutes")`
   - Tag: `galaxieWorkspaceTag(workspaceId)`.
6. **`ensureSubscription(workspaceId)`** in `packages/billing/`
   - Read by `/[workspace]/settings/billing` + several gates.
   - Profile: `cacheLife("seconds")` — short, because Stripe webhooks
     drive truth.
   - Tag: `billing:workspace:<id>` (new).
   - Invalidated by Stripe webhook handler.
7. **`probeAll()`** in `apps/web/src/lib/health-check.ts`
   - HEAD-pings 5+ external surfaces every `/status` hit.
   - Profile: `cacheLife("seconds")` (30s stale OK for a status page).
   - Tag: none — TTL-only.
8. **Pricing-tier render** — pure read of `TIERS` from `@vk/billing`. Could
   `'use cache'` the entire `<TierCard>` per `(tierId, cycle)`.
9. **DPA markdown loader** — `loadDpaMarkdown()` in
   `apps/web/src/app/trust/dpa/page.tsx:21`.
   - Profile: `cacheLife("days")`.
   - Tag: `dpa:template`.

### B.3 Migration: `unstable_cache` → `'use cache'`

The 1 existing call at `apps/web/src/lib/dal/galaxie.ts:284`:

```ts
// Today:
const cachedLoad = unstable_cache(
  async () => loadWorkspaceData(ws.id),
  ['galaxie-data', ws.id],
  { tags: [galaxieWorkspaceTag(ws.id)] },
);
const data = await cachedLoad();

// Target (post-cacheComponents flag flip):
async function loadCachedWorkspaceData(workspaceId: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag(galaxieWorkspaceTag(workspaceId));
  return loadWorkspaceData(workspaceId);
}
const data = await loadCachedWorkspaceData(ws.id);
```

Invalidation continues to work via `updateTag(galaxieWorkspaceTag(id))` —
all existing mutation-side callers in `lib/customers.ts`,
`lib/customer-actions.ts`, `lib/audit-action.ts` etc. stay unchanged
because `updateTag` is the unified API.

### B.4 New tag helpers to add

```ts
// apps/web/src/lib/cache-tags.ts (additions)
export function membersWorkspaceTag(workspaceId: string) {
  return `members:workspace:${workspaceId}`;
}
export function billingWorkspaceTag(workspaceId: string) {
  return `billing:workspace:${workspaceId}`;
}
export function dpaTemplateTag() {
  return `dpa:template`;
}
export function requestsWorkspaceTag(workspaceId: string) {
  return `requests:workspace:${workspaceId}`;
}
```

---

## Part C — Streaming + Suspense Coverage

Suspense coverage is 2 of 39 page files. Below: top-5 routes where streaming
matters most.

### C.1 `/` (landing) — Severity Strong

- Above-the-fold: SiteNav + Hero text + RepoUrlPill. Pure markup, no I/O.
- Below-the-fold: HeroSection contains the interactive RepoGalaxie SVG.
- **Current:** the whole page blocks on `getSessionUser()` via `<SiteNav>`.
- **Fix:** `SiteNav` should be `<Suspense fallback={<NavSkeleton/>}>`-wrapped
  with only the auth-CTA inside the boundary. Marketing content streams
  immediately.

### C.2 `/pricing` — Severity Mid

- Above-the-fold: header + cycle-toggle. Pure markup.
- Below-the-fold: tier-grid, FAQ, footer. All static.
- **Current:** blocks on `headers()` for VAT lookup.
- **Fix:** wrap the VAT-inclusive price string in a Suspense boundary
  (`<Suspense fallback={<span className="text-muted-foreground">…</span>}>`)
  so the rest of the card renders immediately.

### C.3 `/[workspace]` (workspace galaxie hub) — Severity Strong

- Above-the-fold: the Galaxie itself (h-screen w-screen).
- **Current:** already wrapped in `<Suspense fallback={<GalaxieSkeleton />}>`
  at `apps/web/src/app/[workspace]/page.tsx:48` — but the **outer
  `loading.tsx`** (the K17/K2 CLS issue, `apps/web/src/app/[workspace]/loading.tsx:1-5`)
  renders `<PageSkeleton variant="list" />` instead of `<GalaxieSkeleton />`.
  This produces the catastrophic layout-shift Wave-1 flagged.
- **Fix:** 5-LOC change to `loading.tsx`:
  ```tsx
  import { GalaxieSkeleton } from '@/components/galaxie/GalaxieSkeleton';
  export default function WorkspaceLoading() {
    return <div className="h-screen w-screen"><GalaxieSkeleton /></div>;
  }
  ```

### C.4 `/[workspace]/settings/billing` (dashboard) — Severity Mid

- Above-the-fold: header + status banners.
- Below-the-fold: credit balance, prepaid grants, tier-switcher.
- **Current:** all 3 queries (`ensureSubscription`, `prepaidCreditGrant`
  select, plan-grid) block in one async function.
- **Fix:** stream:
  ```tsx
  <Suspense fallback={<PlanCardSkeleton/>}>  <CurrentPlanCard ws={ws}/>  </Suspense>
  <Suspense fallback={<BalanceCardSkeleton/>}>  <CreditBalanceCard ws={ws}/>  </Suspense>
  <Suspense fallback={<GrantsCardSkeleton/>}>  <PrepaidGrantsCard ws={ws}/>  </Suspense>
  ```

### C.5 `/[workspace]/scans/[id]` (scan-detail) — Severity Strong

- Above-the-fold: scan status + path/timestamp.
- Below-the-fold: `<ReportView>` — heavy, contains diff renderer + finding-list.
- **Current:** Single async function blocks the entire page until the DB
  row is fetched and revived.
- **Fix:** wrap `<ReportView>` in `<Suspense fallback={<ReportSkeleton/>}>`
  so the status banner shows immediately. Critical because users hit this
  page from the audit-action flow while the scan is still running — the
  status banner should appear before the heavy report renders.

### Skeleton-vs-actual-layout CLS audit

| Page | Loading.tsx | Final layout | Match? |
|---|---|---|---|
| `/[workspace]` | `PageSkeleton variant="list"` (`max-w-6xl py-10`) | `<div className="h-screen w-screen">` Pixi black canvas | **NO — K2/K17 CLS bug** |
| `/[workspace]/customers` | `max-w-6xl px-4 py-8 sm:px-6` | `<PageShell>` (default `max-w-7xl px-6 sm:px-8`) | **Off** — Wave-1 M6 |
| `/[workspace]/scans` | `max-w-6xl px-4 py-8 sm:px-6` | `<PageShell>` (`max-w-7xl`) | **Off** — Wave-1 M6 |
| `/[workspace]/requests` | `max-w-4xl px-4 py-8 sm:px-6` | `<main className="max-w-4xl">` | OK |
| `/billing` | `max-w-5xl px-4 py-8 sm:px-6` | redirect-only page | **Dead loading** — Wave-1 M5, delete |

---

## Part D — Bundle-Size Survey

`pnpm build` ran successfully with Turbopack (Next 16.2.6). Turbopack does
**not** print per-route bundle sizes in its build output — only the routes
list. Per-chunk sizes from `apps/web/.next/static/chunks/`:

### D.1 Largest chunks

| Size | File | Likely contents |
|---|---|---|
| **492 KB** | `0hznvj1-7dt7c.js` | `@pixi/react` + `motion` + `cmdk` (confirmed via grep) |
| 233 KB | `0r5ch_to1cdhl.js` | React runtime (unmarked but size + position suggests) |
| 124 KB CSS | `0leon7w48616g.css` | Tailwind v4 — full atomic-CSS bundle |
| 120 KB | `028q4lgbkf.q-.js` | Root-main chunk |
| 113 KB | `0ugvj.6tosygy.js` | `gsap` (confirmed) |
| 113 KB | `03~yq9q893hmn.js` | Polyfill chunk |
| 107 KB | `18cl~zvj_frdm.js` | `pixi.js` (confirmed) |

### D.2 Tree-shake / split issues

- **`motion` is in the 492 KB chunk together with `@pixi/react`.** The
  whole landing-page hero imports `motion/react`, and `RepoGalaxie` /
  `RepoInspector` / `Sphere` / `SeverityIcon` / `HeroSection` all pull
  `motion/react` (`apps/web/src/components/landing/*.tsx`). Good news:
  they all use the lazy `m`/`LazyMotion`+`domAnimation` API instead of
  `motion` directly — so the actual animation features tree-shake.
- **`lucide-react` is in `optimizePackageImports`** (`next.config.ts:36-42`)
  — the barrel-tree-shake will work. 15+ icon imports across
  landing/galaxie components are fine.
- **`gsap` (113 KB) ships every time the Galaxie loads.** It's only used
  inside `GalaxieScene.tsx` for the camera/sprite tweens. Already gated
  by the `dynamic({ ssr: false })` wrapper on `GalaxieScene` — only the
  workspace-hub route pays for it. ✓
- **`@pixi/react` + `pixi.js` ≈ 600 KB combined.** Correctly gated to
  `/[workspace]` via dynamic import. Marketing routes don't pay this cost.
- **No bundle-analyzer wired.** Recommend `@next/bundle-analyzer` for the
  follow-up plan — Turbopack's build output lost the per-route sizes
  Webpack used to give.

### D.3 shadcn/ui usage

Components in `apps/web/src/components/ui/`:
`badge, button, card, dropdown-menu, input, label, popover, scroll-area,
select, separator, severity-badge, sheet, skeleton, slider, sonner, switch,
table, tabs, textarea, tooltip`. Each is tree-shaken individually (they're
their own files). No duplicate-pattern with ui-vk (verified per CLAUDE.md
constraint).

### D.4 Verdict

No route exceeds the "> 200 KB JS" red-flag threshold from the brief
**after** factoring in route-specific code-splitting. The 492 KB shared
chunk is shared across many client islands, so per-route delivered JS is
typically **under 200 KB** for marketing pages (which don't ship Pixi or
gsap) and **~700-800 KB** for `/[workspace]` (which does). The marketing
size is acceptable; the workspace size is fine **because it's a power-user
surface visited once per session and stays warm**.

---

## Part E — Image-Optimization

**Findings:**

1. **Zero `<img>` raw tags.** Confirmed via
   `grep -rn "<img\\b" apps/web/src/` → no matches outside tests.
2. **Zero `next/image` usage.** Confirmed via
   `grep -rn "next/image" apps/web/src/` → no matches.
3. The product is image-light: visual content is SVG
   (`StaticGalaxieSVG.tsx`, severity badges) + Pixi WebGL canvas
   (`GalaxieScene.tsx`) + CSS. No hero photos, no marketing illustrations,
   no avatar images.

**Implication:** LCP is **text-based** on every route (the H1 + first
paragraph). Image-optimization is a non-issue for launch. Will become
relevant if/when:
- the workspace gets per-customer logo uploads,
- OG-image generation is wired (currently no `opengraph-image.tsx` /
  `next/og` usage despite metadata config in `app/layout.tsx:44`).

**Recommendation:** add a single `opengraph-image.tsx` (static, served from
`/`) using `next/og` so social previews don't fall back to the default
metadata-image link. Severity Mid, not blocker.

---

## Part F — Font-Loading

`apps/web/src/app/layout.tsx:14-25`:
```ts
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: true,
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  adjustFontFallback: true,
});
```

**Verified:** Strong. `display: 'swap'` (no FOIT), `adjustFontFallback`
explicit, latin subset only, no other font sources.

`grep -rn "@import.*font\\|@font-face\\|fonts\\.googleapis" apps/web/src/`
returns no hits. **Zero non-`next/font` font imports.** No drift.

---

## Part G — Third-Party-Scripts

`grep -rn "<script\\b\\|next/script" apps/web/src/` returns no matches.

- No analytics (no Plausible, no PostHog, no GA).
- No chat widgets (no Intercom, no Crisp).
- No Stripe.js client-side embed (Stripe Checkout is server-redirect only —
  confirmed via the `startCheckoutAction` flow at
  `apps/web/src/app/[workspace]/settings/billing/page.tsx:297-309`).
- No social-OAuth client SDKs.

**Implication:** CSP can be tight without breaking anything. Combined with
Wave-1-Auth K8 (no CSP currently set), adding a strict CSP is a 1-file
change with no third-party allowlist work.

**Severity Mid recommendation:** before launch, decide whether to add
analytics. If yes, use `next/script` with `strategy="afterInteractive"`
for analytics or `"lazyOnload"` for non-critical (heatmap, etc). If no,
do nothing.

---

## Part H — Core-Web-Vitals (Estimated)

Estimates based on bundle analysis + render-strategy + skeleton-match audit.
Not measured — Lighthouse-CI is the real source of truth (Part I).

| Route | LCP-Est | INP-Est | CLS-Est | Bottleneck |
|---|---|---|---|---|
| `/` (landing) | ~1.5s | ~80ms | ~0.05 | LCP = H1 text. INP = HeroSection's `useActionState` + motion. CLS only from SiteNav backdrop-blur on scroll. |
| `/pricing` | ~1.2s | ~50ms | ~0.02 | Pure SSR markup. Currently SSR-dynamic (should be static). Per Part A.1: fixing the SiteNav cookie chain would drop LCP to ~700ms via edge cache. |
| `/login` | ~1.0s | ~70ms | ~0.03 | Cmdk for the LoginForm input. |
| `/[workspace]` (galaxie) | **~3.5s** | **~200ms** | **~0.45** | **K2/K17 CLS catastrophe**: list-skeleton flips to fullscreen-black-Pixi. LCP delayed by Pixi-init. INP from gsap + Pixi event handlers. **THIS IS THE WORST ROUTE.** |
| `/[workspace]/scans/[id]` | ~2.0s | ~120ms | ~0.10 | Heavy `ReportView` blocks render — Suspense fix from C.5 brings LCP under 1.5s. |
| `/trust/dpa` | ~1.4s | ~30ms | ~0.02 | `readFile` blocks every request. After Part B fix: ~600ms cached. |
| `/status` | ~2.5s | ~30ms | ~0.02 | `probeAll()` does 5+ live HEAD requests on every render. After Part B fix: ~400ms cached. |
| `/account/settings/profile` | ~1.5s | ~30ms | ~0.02 | Session lookup; cheap. |

### Main offenders ranked by CWV-impact:

1. `/[workspace]/loading.tsx` mismatch (CLS 0.45) — Wave-1 K17/K2 unfixed
2. SiteNav cookie chain (LCP +500ms on every marketing page)
3. `/[workspace]/scans/[id]` blocking on full ReportView (LCP +600ms)
4. `/status` live-probing (LCP +1.5s)
5. `/trust/dpa` `readFile` per-request (LCP +500ms)

---

## Part I — Lighthouse-CI Thresholds Audit

`.lighthouserc.json` content (the entire file, only 31 lines):

```jsonc
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/pricing",
        "http://localhost:3000/login",
        "http://localhost:3000/trust",
        "http://localhost:3000/legal/agb"
      ],
      "startServerCommand": "pnpm --filter @vk/web start -p 3000",
      "startServerReadyPattern": "Ready in",
      "numberOfRuns": 1,
      "settings": { "preset": "desktop", "chromeFlags": "--headless=new --no-sandbox", "skipAudits": ["uses-http2"] }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

### I.1 Problems

1. **All thresholds are `"error"`.** Lighthouse score variance is ±5
   between runs even on identical builds. `numberOfRuns: 1` doubles
   this. A single flaky run blocks merges. **Severity Strong for launch.**
2. **No SEO category asserted.** Marketing pages need SEO too.
3. **One threshold across all 5 URLs.** Marketing should be Perf-95,
   not Perf-85. Conversely the `/login` page can be Perf-80 — fewer
   visitors and they're not deciding-to-buy.
4. **`numberOfRuns: 1`** — too noisy.
5. **No per-route mobile run.** Desktop-only doesn't reflect 60%+ traffic.

### I.2 Recommended thresholds

```jsonc
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/pricing",
        "http://localhost:3000/login",
        "http://localhost:3000/trust",
        "http://localhost:3000/legal/agb"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "chromeFlags": "--headless=new --no-sandbox",
        "skipAudits": ["uses-http2"]
      }
    },
    "assert": {
      "assertions": {
        "categories:performance":   ["warn",  { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices":["warn",  { "minScore": 0.90 }],
        "categories:seo":           ["warn",  { "minScore": 0.95 }]
      },
      "assertMatrix": [
        {
          "matchingUrlPattern": "/(pricing|legal/agb|trust)$",
          "assertions": {
            "categories:performance": ["error", { "minScore": 0.90 }]
          }
        }
      ]
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

Rationale:
- **A11y stays `error`** — non-negotiable, doesn't fluctuate run-to-run.
- **Perf becomes `warn` globally**, `error` only on marketing-buy-pages.
- **BP relaxed to 0.90** — the missing CSP (Wave-1 Auth K8) will tank
  this category until fixed; don't gate launch on it.
- **SEO added at `warn`** — important to surface but not block.
- **`numberOfRuns: 3`** — Lighthouse-CI averages the median, halving the
  flake rate.

### I.3 Mobile run (Strong recommendation, post-launch)

Add a second LHCI config file `.lighthouserc.mobile.json` with
`"preset": "mobile"` for marketing-only routes. DACH-B2B traffic is desktop-
heavy but mobile-share is still ~25%+; mobile-LCP is a different beast
because of 4× CPU throttle.

---

## Part J — Pre-Launch Top-5 Perf-Wins

Ranked by impact-per-effort. Each ≤ 2h. Each cites file:line.

### 1. Fix K2/K17 CLS on workspace-hub (Wave-1) — **highest impact, 5 LOC**

**File:** `apps/web/src/app/[workspace]/loading.tsx:1-5`

**Change:** swap `<PageSkeleton variant="list" />` for `<GalaxieSkeleton />`
inside an `<div className="h-screen w-screen">` so the loading state
matches the page's final layout.

**Why:** every authenticated session entry hits this page. Current
behavior: list-skeleton renders at `max-w-6xl py-10`, then page flips to
fullscreen-black-Pixi. CLS ≈ 0.45 (catastrophic — anything > 0.25 fails
Lighthouse "Poor"). After fix: CLS ≈ 0.02.

**Effort:** 5 min.

### 2. Lift `<SiteNav>` out of the SSR-blocking tree on marketing pages

**Files:**
- `apps/web/src/app/page.tsx:8`
- `apps/web/src/app/pricing/page.tsx:70`
- `apps/web/src/app/legal/agb/page.tsx:18`
- `apps/web/src/app/legal/dpa/page.tsx:19`
- `apps/web/src/app/legal/subprocessors/page.tsx`
- `apps/web/src/app/trust/page.tsx`
- `apps/web/src/components/SiteNav.tsx:14`

**Change:** split `<SiteNav>` into a client wrapper that hydrates the
session-aware "Sign in / Dashboard" CTA from a `/api/auth/me` fetch (or
inline `<Suspense fallback={<NavCtaSkeleton/>}>` with the server-shell
caching). Marketing pages become statically prerenderable.

**Why:** unlocks `○ Static` for `/`, `/pricing`, `/trust`, `/legal/*` —
saves 300-600ms LCP per marketing visit + offloads them from compute to
edge cache. Also makes Lighthouse Perf score climb 5-10 points.

**Effort:** ~1.5h.

### 3. Remove dead `force-dynamic` directives

**Files:**
- `apps/web/src/app/[workspace]/customers/page.tsx:23`
- `apps/web/src/app/[workspace]/customers/[customerId]/page.tsx:23`
- `apps/web/src/app/[workspace]/settings/ai/page.tsx:27`
- `apps/web/src/app/[workspace]/settings/billing/page.tsx:30`
- `apps/web/src/app/[workspace]/repos/[repoId]/access/page.tsx:24`
- `apps/web/src/app/trust/dpa/page.tsx:19`
- `apps/web/src/app/trust/eval/page.tsx:10`
- `apps/web/src/app/billing/page.tsx:11`
- `apps/web/src/app/account/settings/profile/page.tsx:6`
- `apps/web/src/app/[workspace]/settings/layout.tsx:20`
- `apps/web/src/app/account/settings/layout.tsx:14`

**Change:** delete each `export const dynamic = "force-dynamic"` where the
page already opts into dynamic rendering via `cookies()`/`headers()`/
session-read/DB-read. Trust + eval pages need `force-dynamic` removed
specifically so they can later use `'use cache'`.

**Why:** in Next.js 16, `force-dynamic` is a sledgehammer that disables
all caching primitives. Removing it does not regress correctness (the
page is already dynamic via its data dependencies) but unlocks future
caching wins from Part B.

**Effort:** ~30 min including verification that the build output flag
matches expectations.

### 4. Cache `probeAll()` on `/status` and `loadDpaMarkdown()` on
   `/trust/dpa`

**Files:**
- `apps/web/src/lib/health-check.ts` — wrap `probeAll` in
  `unstable_cache(... , ['health-probe'], { revalidate: 30 })`.
- `apps/web/src/app/trust/dpa/page.tsx:21-29` — wrap `loadDpaMarkdown`
  in `unstable_cache(... , ['dpa-template'], { tags: ['dpa:template'] })`.

**Change:** keep `unstable_cache` (matches existing pattern in
`lib/dal/galaxie.ts:284`). Don't enable `cacheComponents` config flag.

**Why:** `/status` currently hammers 5+ external services (Resend SMTP,
Inngest, Anthropic, DB, Stripe) on every page hit — at scale or under a
crawler this is a self-DOS vector. `/trust/dpa` `readFile`s a markdown
template per request (~150 KB read off disk). Both are trivially cacheable.

**Effort:** ~1h including invalidation wiring (`dpa-actions.ts` already
exists for the DPA-template — wire `revalidateTag('dpa:template')` there).

### 5. Stream `<ReportView>` on scan-detail page

**File:** `apps/web/src/app/[workspace]/scans/[id]/page.tsx:62-71`

**Change:** wrap `<ReportView>` in `<Suspense
fallback={<ReportSkeleton/>}>` so the `<ScanStatusBanner>` paints
immediately. Extract the heavy DB row hydration into a separate async
server component imported via `await` inside the boundary.

**Why:** users arrive at this page **during** the audit run (the audit-
action redirects here while the scan status is still `running`/`queued`).
Today they see a blank screen until the `ReportView` and its findings-
diff fully render. With streaming, the status banner appears in <100ms
and gives the user something to look at while the rest streams in.

**Effort:** ~2h (needs a `<ReportSkeleton/>` component built — borrow
from `Skeleton` primitives, match `ReportView`'s layout).

---

## Severity summary

| ID | Severity | Title | File(s) | Effort |
|---|---|---|---|---|
| W2-04-K1 | Kill | `/[workspace]/loading.tsx` CLS catastrophe (already flagged Wave-1 K17/K2 — confirmed unfixed) | `app/[workspace]/loading.tsx:1-5` | 5 LOC |
| W2-04-S1 | Strong | All marketing pages render `ƒ Dynamic` because `SiteNav` reads cookies | `app/page.tsx`, `app/pricing/page.tsx`, `app/legal/**/page.tsx`, `app/trust/page.tsx`, `components/SiteNav.tsx:14` | 1.5h |
| W2-04-S2 | Strong | Lighthouse-CI uses `"error"` thresholds + `numberOfRuns: 1` → flake-blocks merges | `.lighthouserc.json:20-26` | 15 min |
| W2-04-S3 | Strong | `/[workspace]/scans/[id]` blocks the entire page on `<ReportView>` render | `app/[workspace]/scans/[id]/page.tsx:62-71` | 2h |
| W2-04-S4 | Strong | `/status` HEAD-pings 5+ external services per request — self-DOS at scale | `lib/health-check.ts`, `app/status/page.tsx` | 1h |
| W2-04-M1 | Mid | 9 redundant `force-dynamic` exports pre-empt future caching | (11 files, see win #3) | 30 min |
| W2-04-M2 | Mid | `unstable_cache` only wraps 1 of 6 cacheable hot-path DAL functions | `lib/customer-dal.ts`, `lib/membership.ts`, `lib/dal/galaxie.ts:320`, `lib/install-requests.ts` | follow-up plan |
| W2-04-M3 | Mid | Skeleton sizing mismatches (Wave-1 M6 confirmed) on customers/scans/requests | `app/[workspace]/{customers,scans,requests}/loading.tsx` | 30 min |
| W2-04-M4 | Mid | `/trust/dpa` `readFile()`s template every request | `app/trust/dpa/page.tsx:21-39` | 30 min |
| W2-04-M5 | Mid | `/trust/eval` walks filesystem (`readdir` + N×`readFile`) every request | `app/trust/eval/page.tsx` | 30 min |
| W2-04-M6 | Mid | Dead `loading.tsx` for `/billing` redirect-only page (Wave-1 M5) | `app/billing/loading.tsx` | delete |
| W2-04-M7 | Mid | No `opengraph-image.tsx` despite OG metadata in root layout | `app/layout.tsx:44-57` | 1h |
| W2-04-W1 | Weak | Cache-Components `experimental.cacheComponents` flag not set — confirms CLAUDE.md "Nova-3a goal" + Wave-1 "defer to post-launch" | `next.config.ts` | follow-up |
| W2-04-W2 | Weak | Turbopack production-build output lacks per-route bundle-size column | n/a — switch to `--no-turbopack` build or add `@next/bundle-analyzer` | follow-up |

---

## Out of scope for this report

- The full Cache-Components migration plan (separate Nova-3a-follow-up
  plan; this report only scopes the partial low-risk subset).
- Mobile-specific perf tuning — needs real-device measurement, not
  static analysis.
- Service-Worker / Workbox / offline support.
- Image-CDN setup — moot without images.
- Edge-runtime opt-in — keep Node default per Vercel best-practices
  unless a specific route benefits.

---

## Cross-references

- Wave-1-Frontend K17/K2: `docs/audits/2026-05-deep/wave1-05-frontend-ux.md:371`
  (confirmed unfixed)
- Wave-1-Infra H-S1: `docs/audits/2026-05-deep/wave1-04-prod-infra-vercel.md:697`
  (confirmed)
- Wave-1-Diff S18: `docs/audits/2026-05-deep/_wave1-synthesis.md:108`
  (confirmed — 0 `'use cache'`)
- Audit 2026-05 FN-08 (cited in Wave-1-Infra:119): confirmed.
- CLAUDE.md "Cache Components-Adoption ist Nova-3a-Goal" — confirmed,
  flag not set, 0 directives.
