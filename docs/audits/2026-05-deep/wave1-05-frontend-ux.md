# Wave-1 / Sub-05 — Frontend UI/UX + Mobile + Broken-Flows

Scope: functional UX bugs, broken interactions, mobile-regressions, empty/loading/error-states across all public + authenticated routes. Read-only audit. Severity bands per CLAUDE.md convention: {Kill, Weak, Mid, Strong, Exceptional}.

Method: walked every `apps/web/src/app/**/page.tsx` + every `loading.tsx` / `error.tsx`; read all landing components, settings sub-pages, both Galaxies, all modals, all forms. No browser execution — code-review only. Findings include `file:line` references for triage.

---

## Headline (TL;DR)

- **3 Kill findings** — all gate launch:
  - K1 — `/[workspace]/scans/[id]/page.tsx` is **completely unstyled** (no layout, no shell, no header chrome). The single most important post-audit screen for paying customers has no design.
  - K2 — `[workspace]/loading.tsx` shows a list-skeleton over a route that renders a **fullscreen black Galaxie** → massive CLS on every workspace entry.
  - K3 — `BuyCreditPackModal`, `CreditMeter`, `GalaxieSettingsPopover` are imported nowhere in the app (dead code). Sub-11 S1 from the 2026-05 audit flagged this; "V2 polish wired up Pack-Modal" claim in CLAUDE.md is **not true on disk**.

- **5 Strong findings**, all material:
  - S1 — 10 of the 17 settings pages (workspace + account) are "Coming with nova-2-settings-backend" stubs. Users will sign up, click "Profile", and see a placeholder. Either ship them or hide them behind feature-flag until backend lands.
  - S2 — shadcn-ui Button + Input default heights are 28–32 px → **fails WCAG 2.5.5 (44×44 px)** on touch. Affects every mobile form.
  - S3 — Settings sidebar (`SettingsLayout`) stacks above content on `<lg` (`<1024px`), pushing the actual form ~15 nav rows below the fold on 375 px viewport. No accordion/select mobile pattern.
  - S4 — `global-error.tsx` declares `<html lang="en">` while root layout declares `lang="de"` → SR-language mismatch on top-level crashes.
  - S5 — No success-toast/visible feedback on most form submits (AddCustomer, AddRepo, BYOK, Spend-Cap, Auto-Overage, Intensity). Silent state-reset only. User has no way to tell the action worked unless they read the DB.

- **9 Mid findings** documented below.

- **Aesthetic-level wins** worth keeping: Magic-link `LoginForm.tsx`, `ScanStatusBanner` polling, `EmptyState` primitive coverage, Vaul drawer mobile pattern, Galaxie-Skeleton-during-load, `AccessForms` toast wiring, `BlurOverlayCTA` re-run-after-login flow.

---

## Part A — Route-by-route walk-through

Inventory matrix. ✓ = present, ✗ = missing, ~ = partial.

### Public

| Route | `<h1>` | `metadata` | `loading.tsx` | `error.tsx` | Empty-State | Mobile |
|---|---|---|---|---|---|---|
| `/` | ~ sr-only only | ✓ inherited from layout | ✗ | ✓ root | n/a (always demo) | ✓ TreeView fallback |
| `/pricing` | ✓ | ✓ | ✗ | ✓ root | n/a | ~ grid collapses |
| `/login` | ✓ ("Sign in") | ✓ noindex | ✗ | ✓ root | n/a | ✓ |
| `/auth/verify` | ✗ (no h1) | ✗ | ✗ | ✓ root | n/a | ✓ |
| `/legal/agb` | ✓ | ✓ | ✗ | ✓ root | n/a | ✓ |
| `/legal/dpa` | ✓ | ✓ | ✗ | ✓ root | n/a | ✓ |
| `/legal/subprocessors` | ✓ | ✓ | ✗ | ✓ root | n/a | ✓ |
| `/trust` | ✓ | ✓ | ✗ | ✓ root | n/a | ~ |
| `/trust/dpa` | n/a (file not read; route exists) | ? | ✗ | ✓ root | n/a | ? |
| `/trust/eval` | n/a (file not read; route exists) | ? | ✗ | ✓ root | n/a | ? |
| `/status` | ✓ | ✓ | ✗ | ✓ root | n/a | ✓ |
| `/not-found` | ✓ | n/a | n/a | n/a | n/a | ✓ |

### Authenticated

| Route | `<h1>` | `metadata` | `loading.tsx` | `error.tsx` | Empty-State | Mobile |
|---|---|---|---|---|---|---|
| `/dashboard` | n/a (redirect only) | ✗ | ✗ | ✓ root | n/a | n/a |
| `/billing` | n/a (redirect only) | ✗ | ✓ but dead | ✓ root | n/a | n/a |
| `/[workspace]` | ✗ (Galaxie has none) | ✗ | ✓ but **CLS-broken** | ✓ workspace/error | ✓ EmptyGalaxie | ✓ SolarListView |
| `/[workspace]/customers` | ✓ | ✗ | ✓ | inherits | ✓ EmptyState | ~ form below table |
| `/[workspace]/customers/[id]` | ✓ | ✗ | ✗ | inherits | ✓ inline | ~ |
| `/[workspace]/repos/[id]` | ✓ | ✗ | ✗ | inherits | ✓ inline | ~ |
| `/[workspace]/repos/[id]/access` | ✓ | ✗ | ✗ | inherits | ✓ inline | ~ |
| `/[workspace]/scans` | ✓ | ✗ | ✓ | inherits | ✓ EmptyState | ~ table x-scroll |
| `/[workspace]/scans/[id]` | ✓ but **no styling at all** | ✗ | ✗ | inherits | n/a | **broken** |
| `/[workspace]/requests` | ✓ | ✗ | ✓ | inherits | ✓ inline | ~ table |
| `/[workspace]/settings` | n/a (redirect) | n/a | ✗ | inherits | n/a | n/a |
| `/[workspace]/settings/general` | ✓ | ✗ | ✗ | inherits | stub-only | **see S3** |
| `/[workspace]/settings/members` | ✓ | ✗ | ✗ | inherits | n/a (auto member-1) | **see S3** |
| `/[workspace]/settings/billing` | ✓ | ✗ | ✗ | inherits | ✓ inline | **see S3** |
| `/[workspace]/settings/integrations` | ✓ | ✗ | ✗ | inherits | ~ | **see S3** |
| `/[workspace]/settings/api-keys` | ✓ | ✗ | ✗ | inherits | ✓ EmptyState (disabled CTA) | **see S3** |
| `/[workspace]/settings/ai` | ✓ | ✗ | ✗ | inherits | n/a | **see S3** |
| `/[workspace]/settings/audit-apply` | ✓ | ✗ | ✗ | inherits | stub | **see S3** |
| `/[workspace]/settings/galaxie` | ✓ | ✗ | ✗ | inherits | stub | **see S3** |
| `/[workspace]/settings/notifications` | ✓ | ✗ | ✗ | inherits | preview-only | **see S3** |
| `/[workspace]/settings/webhooks` | ✓ | ✗ | ✗ | inherits | ✓ EmptyState (disabled CTA) | **see S3** |
| `/[workspace]/settings/danger` | ✓ | ✗ | ✗ | inherits | stub | **see S3** |
| `/account/settings/*` (5 pages) | ✓ all | ✗ all | ✗ all | inherits | mostly stubs | **see S3** |

**No `/signup`, no `/onboarding/*` routes exist.** The audit task referenced these as focus pages — they were never built. Magic-link login is the only entry, and there's no first-run wizard. Activation-Checklist sits inside the workspace galaxie as a right-rail card.

### Per-route notable issues

- `apps/web/src/app/page.tsx:9` — Landing `<main>` has no visible `<h1>` (line 227 in HeroSection: `<h1 className="sr-only">`). Acceptable for SEO/SR but Google Lighthouse may flag the visual hierarchy as "no headline on hero".
- `apps/web/src/app/auth/verify/page.tsx:52-83` — Verify-loading page has no `<h1>`. Status-paragraph + skeletons only. Lighthouse a11y miss.
- `apps/web/src/app/billing/loading.tsx:1-18` — Dead `loading.tsx` for a redirect-stub page. Visible briefly during navigation → user sees billing-skeleton flash before being bounced to `/[workspace]/settings/billing`. Delete the file or remove the redirect.
- `apps/web/src/app/[workspace]/loading.tsx:1-5` — see K2.

---

## Part B — Broken-Flows

### B1. Anonymous → Signup → First-Workspace → First-Audit

The actual implemented flow:

1. Anonymous user lands on `/`, sees Galaxie + RepoUrlPill (`HeroSection.tsx:218`).
2. They submit a URL → `auditAction` runs anonymously (`HeroSection.tsx:194-200`).
3. If audit completes → results shown in the same Hero with the live galaxy (no DB persistence).
4. If they click "Fix via PR" on a finding → `SignUpTeaseDialog` opens → magic-link sent with `callbackURL: /dashboard` (`SignUpTeaseDialog.tsx:43`).
5. They click the magic-link → `/auth/verify` → `redirect /dashboard` (`auth/verify/page.tsx:46`).
6. `/dashboard` creates default workspace via `ensureDefaultWorkspace` (implicit through `listUserWorkspaces[0]`), claims pending memberships, redirects to `/[workspace]` (`dashboard/page.tsx:65-69`).
7. **The anonymous audit they just ran is NOT persisted into their new workspace.** They are dropped into an empty workspace galaxie.

**Issues:**

- The audit they just ran is gone unless they used the **BlurOverlayCTA `?intent=audit&repo=…`** path, which is **only shown when the audit goes to background (`stage === "background"`)**. The normal completed-audit flow shows `SignUpTeaseDialog` instead, which uses `callbackURL: /dashboard` with no `intent=audit` carry-over.
  - File: `SignUpTeaseDialog.tsx:43` vs `BlurOverlayCTA.tsx:44`. Two divergent magic-link flows.
  - **User-impact: Mid** — user runs an audit, signs up, lands in an empty workspace, has to re-paste the URL. Confusion + lost trust.
  - **Fix**: pass the URL through `SignUpTeaseDialog` the same way `BlurOverlayCTA` does.

- No onboarding-wizard. New user sees `ActivationChecklist` (a right-rail card in `GalaxieScene`) as the only first-run guidance. No greeting, no `welcome.tsx`, no tour.
  - **User-impact: Mid** — Activation step "first scan" is the hardest because Galaxie is empty + the way to start an audit isn't obvious from the workspace UI.

### B2. Free-Tier → Hit-Limit → Upgrade

- Credit limit is enforced in `auditAction` server-side. UI affordance lives in `/[workspace]/settings/billing` (`apps/web/src/app/[workspace]/settings/billing/page.tsx:167-212`). Good visual: bar + numeric counter + reset-date.
- **BUT**: there is no in-app "credits left" indicator outside the billing settings page. `CreditMeter` exists (`apps/web/src/components/CreditMeter.tsx`) but is **never imported anywhere**.
  - File: `CreditMeter.tsx` orphaned.
  - **User-impact: Strong** — user can't tell they're running low. They only see "out of credits" when an audit fails.
  - **Fix**: mount `CreditMeter` in the workspace right-rail next to ActivationChecklist, or in SiteNav when user.email is present.

- Upgrade-CTA flow: billing-page → checkout (`startCheckoutAction`) → Stripe → return to `/billing?status=success` → redirect to `/[workspace]/settings/billing?status=success`. Banner shown via `<StatusBanner kind="success">` (`billing/page.tsx:111`).
- Past-due banner is correctly highlighted with destructive styling + portal CTA (`billing/page.tsx:125-142`). Good.

### B3. Pack-Modal (Buy-Credit)

- `BuyCreditPackModal` lives at `apps/web/src/components/BuyCreditPackModal.tsx`. The component itself is well-built (vaul-style picker, sr-only legend, Stripe-link disclaimer).
- **`grep -rn "BuyCreditPackModal" apps/web/src/` returns only the file itself.** The modal is wired up nowhere. CLAUDE.md says "BuyCreditPackModal — wired up in V2 polish (Recently Shipped)". This is not true.
  - **User-impact: Strong** — the modal CTA the recent commit said it was shipping is invisible.
  - **Fix**: mount the modal trigger in the billing-page (next to the inline-form pack-buys), and in the workspace right-rail when `prepaidRemaining < 100`.

### B4. Workspace-Switch

- `WorkspaceSwitcher.tsx` exists inside `components/galaxie/`. Mounted via `GalaxieScene.tsx`. **Only visible inside the PixiJS Galaxie**, not in SiteNav, not in any settings page.
  - **User-impact: Mid** — multi-workspace user on settings page has no way to switch context. They have to click "Back to galaxy" → switcher → back to settings.
  - **Fix**: surface the switcher in SiteNav (when `workspaces.length > 1`), in SettingsLayout sidebar, or in PageHeader actions.

- `SiteNav` has no workspace context at all — it always shows `Dashboard` button without indication of which workspace it leads to (`SiteNav.tsx:36-39`). Multi-workspace users get one Dashboard CTA that lands on "default workspace" (whatever cookie says).

### B5. Settings — every section

Counted by stub status:
- **Functional**: `members` (read-only), `billing` (full), `ai` (BYOK + overage + cap + intensity, all server-actions), `integrations` (read-only GitHub-App status).
- **Stubs (UI but no backend)**: `general`, `audit-apply`, `galaxie`, `notifications` (matrix is disabled), `webhooks`, `danger`, `api-keys`, plus all 5 of `/account/settings/*` (except profile which shows read-only email/id).

That's **11 of ~17 settings pages = 65 % shell-only**.

- BYOK form (`settings/ai/page.tsx:124-173`): plain `<input type="checkbox">` (line 132–137) — no shadcn Checkbox component used. Inconsistent with the rest of the UI. Same with auto-overage (line 191), spend-cap (line 218), intensity (line 255).
- Forms have no client-side validation. Server-action returns errors, but the user sees no error feedback for invalid input (e.g., entering "abc" into the spend-cap number field).
- No success-toast/banner after Save on any settings form. The form just re-renders. User has no confirmation the save worked (S5).
- Mobile-layout: see S3.

### B6. Logout → Re-Login

- Logout is not implemented as a UI button anywhere in the read pages. `SiteNav.tsx` has no sign-out CTA. The only auth-bound element is `<span>{user.email}</span>` on line 41.
  - **User-impact: Strong** — user can't sign out of the application without manually deleting cookies. There is no logout button in SiteNav, no dropdown menu, no `/api/auth/signout` link surfaced.
  - **Fix**: add a dropdown menu (avatar → email → "Sign out") in SiteNav. Also add it in SettingsLayout sidebar.

- Re-login flow with `next=/some-workspace` param works (`LoginForm.tsx:58-59`).

---

## Part C — Interaction-States

### C1. Touch-targets (WCAG 2.5.5 — 44×44 minimum)

shadcn button-variant defaults (`components/ui/button.tsx:23-35`):
- `default` → `h-8` = **32 px** (below)
- `xs` → `h-6` = **24 px** (well below)
- `sm` → `h-7` = **28 px** (below)
- `lg` → `h-9` = **36 px** (below)
- `icon` → `size-8` = **32 px** (below)
- `icon-xs` → `size-6` = **24 px** (well below)
- `icon-sm` → `size-7` = **28 px** (below)

Input default (`components/ui/input.tsx:11`): `h-8` = **32 px**.

The codebase uses these primitives 53 times by my grep count vs 5 explicit `min-h-[44px]` overrides. Mobile users **systematically fail to hit buttons** unless they tap precisely.

Exception: `RepoTreeView` correctly uses `min-h-[44px]` (`RepoTreeView.tsx:140`); `SolarListView` uses `style={{ minHeight: 44 }}` (line 112); `Drawer` content is fine. These are the only properly-sized touch surfaces.

- **File: components/ui/button.tsx:23-35, components/ui/input.tsx:11**
- **User-impact: Strong on mobile**
- **Fix-direction**: bump default Button/Input to `h-10` (40 px) or `h-11` (44 px) on mobile breakpoints. Add a `touch:` variant if desktop-density matters. Override Dialog close button (`dialog.tsx:75`: `icon-sm` = 28 px) similarly.

### C2. Hover / focus / active / disabled

- shadcn Button has all four states (default variant `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50`). Exceptional default coverage.
- Input has `focus-visible:ring-3` and `aria-invalid:` patterns. Good.
- Custom buttons in `landing/RepoUrlPill.tsx:82-86` define focus-visible but no active/pressed state. Minor.
- **Bug**: `apps/web/src/app/[workspace]/settings/billing/page.tsx:298-305` — the Change-plan "Upgrade" button is rendered inside a `<form>`. Clicking submits Stripe checkout. **No loading state** while Stripe redirect is being prepared. User can double-click and hit the action twice.
  - **User-impact: Mid** — pending state missing on Stripe redirect. Likely benign because Stripe deduplicates, but UX-wise it looks frozen.

### C3. Loading-states on async actions

- `LoginForm.tsx:114-135` — proper button states (sending / sent / throttle countdown). Exceptional.
- `AddCustomerForm.tsx:55-64` — has pending Loader2 spinner. Good.
- `AddRepoForm.tsx:90-92` — text-only "Adding…" indicator, no spinner. Inconsistent with AddCustomerForm.
- `settings/billing/page.tsx:243-254`, `297-309` — all Stripe-redirect `<form action={…}>` buttons have **no pending state at all**. Form submission to a server-action returning a redirect doesn't expose `useFormStatus` here.
  - **File: settings/billing/page.tsx:243-309**
  - **User-impact: Mid** — visible during the Stripe network round-trip on a slow connection.

### C4. Error-recovery paths

- `LoginForm` distinguishes 4 error variants with copy. Exceptional.
- Most form errors are surfaced as `<p className="text-sm text-destructive">` (e.g. `AddRepoForm.tsx:93`). Functional but minimal — no icon, no recovery suggestion.
- `error.tsx` boundaries are well-written but link to `/dashboard` from anywhere → not always the right return point for the user (`error.tsx:54`, `workspace/error.tsx:55`).

### C5. Success-states

- `AccessForms`: toast on success. Good.
- `FindingsList`: toast on success. Good.
- All other forms (AddCustomer, AddRepo, BYOK, intensity, spend-cap, overage): no toast, no banner, no inline success message. Form just re-renders with cleared values.
  - **File: AddCustomerForm.tsx:31-32, AddRepoForm.tsx:40-43, settings/ai/page.tsx:171, 199, 227, 268**
  - **User-impact: Strong** (S5 in headline) — silent successes feel broken.
  - **Fix-direction**: standardize on `toast.success(…)` in every server-action wrapper, or surface a `status=success` query-param banner pattern like the billing page.

---

## Part D — Galaxie-Health

### D1. Landing-Hero-Galaxie (`components/landing/*`, SVG + motion)

- Implementation: `RepoGalaxie.tsx` with two transform layers (user-pan/zoom + semantic-camera). Sphere fillings use OKLCH gradients. Good architecture.
- Reduced-motion respected: `SeverityIcon.tsx:46`, `RepoGalaxie.tsx:75-76`, `HeroSection.tsx:168-173` (three-way override Auto/On/Off via `GalaxieSettingsPopover`).
- **`GalaxieSettingsPopover` is imported NOWHERE** (`grep -rn` confirms). The Auto/On/Off override sits in `galaxieSettings` state but the user has no way to flip it from the UI. Dead code.
  - **File: components/landing/GalaxieSettingsPopover.tsx (orphaned)**
  - **User-impact: Mid** — users can't override the reduced-motion default. Stuck with browser-pref.
- Hover-Tooltip is desktop-only. Touch users get nothing on `HoverTooltip.tsx`. Mobile path uses `RepoTreeView`, which is fine, but the tooltip's information (lines/lang/bytes/severity) isn't surfaced on mobile until they tap to open the inspector.
- Background-stars render via `BackgroundStars.tsx`. Always-on. On mobile reduced-motion preference this should probably still render the stars but skip the twinkle animation — check the file if motion is gated.
- Audit-tour key bindings work: ESC, ⌘+[ to zoom out, arrows, +/-, 0 reset (`RepoGalaxie.tsx:276-332`). Excellent keyboard-a11y.

### D2. Workspace-Solar-Galaxie (PixiJS via `components/galaxie/*`)

- File: `GalaxieScene.tsx` is **1159 lines**. Largest non-trivial client component in the repo. Hard to reason about at a glance.
- Cleanup is wired (`GalaxieScene.tsx:887-907`): `ctx.revert()` for GSAP, sprite/layer `destroy({children:true})`, listener-detach. Looks correct.
- Mobile fallback: `GalaxieRoot.tsx:70` routes mobile to `SolarListView` (severity-filter chips + flat list). Good pattern. `SolarListView.tsx:112` uses 44pt touch target. **Filter chips at lines 83-96 use `px-2 py-1` only → height ~24 px, fails 44 px**. Touch target failure on the filter row.
- `EmptyGalaxie` renders for `customers.length === 0` (`GalaxieScene.tsx:54` + `SolarListView.tsx:71-73`). Good.
- Reduced-motion: `GalaxieRoot.tsx:79` falls back to `StaticGalaxieSVG`. Good.
- **PixiJS bundle**: `dynamic({ ssr: false })` correctly defers it. But the Pixi bundle is shipped on every workspace-hub load — no way to opt out for non-mobile, non-reduced-motion. For LCP this is acceptable because the layout reserves screen real-estate (h-screen), but TTI is hit hard.

### D3. EmptyGalaxie

- Not reviewed deeply but exists at `components/galaxie/EmptyGalaxie.tsx`. SolarListView delegates to it. Need to confirm it has a primary CTA pointing at "create your first customer".

---

## Part E — Accessibility

### E1. ARIA-labels on icon-only buttons

- ✓ `RepoUrlPill.tsx:81` — `aria-label="Audit läuft"` / `"Audit starten"`
- ✓ `HeroSection.tsx:307` — `aria-label="Hinweise zur Galaxie-Bedienung"` on help button
- ✓ `GalaxieSettingsPopover.tsx:38` — `aria-label="Galaxie-Einstellungen"`
- ✓ `DialogContent.tsx:79` — `sr-only` "Close" on X button
- ✗ `SiteNav.tsx:22-28` — Logo link has no `aria-label`; the `▸` glyph + "ValidationKit" text is fine as long as text is visible. OK.
- ~ `landing/HeroSection.tsx:275-282` — "zurück zur Demo" back button — has visible text. OK.

Status: generally good. No major omissions found.

### E2. Form-label association

- All `Label htmlFor=…` patterns I sampled (`LoginForm.tsx`, `AddCustomerForm.tsx`, `settings/ai/page.tsx`) are correctly paired. Pass.

### E3. Color-contrast on OKLCH-tokens

- Could not measure precisely without rendering. Linear-aesthetic-dark uses near-black foreground tokens which is forgiving. `severity-colors.ts` (referenced) and the `severity-icons.ts` mapping use mid-chroma colors — possible contrast issue on Mid (yellow) tokens against Card backgrounds.
- Suggest: run axe or Lighthouse a11y audit on `/` and `/pricing` to confirm.

### E4. Skip-link

- ✓ `SkipToContent.tsx` renders two anchor links targeting `#main-content` and `#site-nav`.
- ✓ Every page I read has `id="main-content"` on `<main>`.
- ✓ `SiteNav.tsx:18` has `id="site-nav"`.
- ~ `legal/agb`, `legal/dpa`, `legal/subprocessors` use `<main id="main-content">` but `SiteNav` is rendered inside `<main>`, not outside. That means the skip-to-content link skips past nothing meaningful. Minor.

### E5. Modal focus-trap

- shadcn `Dialog` uses radix `DialogPrimitive` → focus-trap handled by Radix. ✓

### E6. Screen-reader live-regions

- ✓ `HeroSection.tsx:374` — `aria-live="polite"` on loading-stage label
- ✓ `RepoInspector.tsx:32,58` — `aria-live="polite"` on inspector content swap
- ✓ `landing/HeroSection.tsx:413-426` — sr-only `<ol>` with clickable findings — gives keyboard / screen-reader users a way out of the SVG application. Good.
- ✗ Status-banners on billing page (`billing/page.tsx:381-397`) are `role="status"` — that's a live-region, OK.
- ✗ No `aria-busy` on form-submitting buttons (except `LoginForm` indirect via disabled).

### E7. Reduced-motion

- 19 occurrences of `useReducedMotion` / `motion-safe` / `motion-reduce` in the code. Generally good coverage.
- `BackgroundStars.tsx` (file not read for time) — verify it respects reduced-motion.
- `motion-safe:animate-pulse` on `auth/verify/page.tsx:60` — good.
- `GalaxieScene.tsx` — GSAP context-wrapped (`ctxRef.current`); should be checked for an explicit reduced-motion gate.

### E8. global-error.tsx language mismatch

- **S4 in headline.** `global-error.tsx:20` uses `<html lang="en">`. Root layout uses `<html lang="de">`. SR reads the wrong locale on top-level crashes.
- **Fix**: change to `lang="de"` or compute from a runtime constant.

---

## Part F — Performance (frontend-specific)

### F1. Bundle outliers

- No `pnpm build` available without execution. From source review:
  - GalaxieScene.tsx (1159 lines, Pixi + GSAP + use-gesture). Largest interactive chunk.
  - HeroSection.tsx (537 lines, motion + galaxie children). Major landing chunk.
- Recommend running `pnpm dlx @next/bundle-analyzer` before launch.

### F2. Image optimization

- **Grep for `<img ` returns 0 hits in src.** No raw img tags. Pass.
- No `<Image>` imports either — the app uses 0 images. Logo is text glyph (`SiteNav.tsx:26`). OG image is generated via `metadataBase`. Minimal-image philosophy is intentional and works.

### F3. Font-loading

- `apps/web/src/app/layout.tsx:14-25` — Geist + Geist_Mono via `next/font/google` with `display: "swap"` + `adjustFontFallback: true`. Exceptional.

### F4. Third-party scripts

- None visible in source. No GA, no Mixpanel, no Sentry. Clean.

### F5. CSS-in-JS at runtime

- Tailwind only + inline styles (a few `style={{}}` for dynamic widths/colors). No runtime CSS-in-JS. Pass.

### F6. Re-render explosions

- `HeroSection.tsx` has 13 `useState` calls + 5 `useEffect`s. State is mostly local; `useMemo` is used for `liveGalaxieData`, `breadcrumbPath`, `activeNode`, `currentLoadingStage`. Looks fine.
- `RepoGalaxie.tsx:99-112` — `userPan` + `userZoom` state on the SVG. Reset on focusId change. Re-render on every pointer-move during drag (`setUserPan` on line 256). For a 1000-node graph this could be hot — but the SVG is composited and motion uses GPU. Acceptable.

### F7. `'use cache'` adoption

- **0 occurrences in source code.** `apps/web/.next/types/cache-life.d.ts` exists (build artifact), but no `'use cache'` directives anywhere in `apps/web/src/`. CLAUDE.md flags this as a Nova-3a goal.
- **User-impact: Mid** — every request to legal/marketing pages hits full SSR. `/legal/agb`, `/legal/dpa`, `/legal/subprocessors`, `/trust`, `/trust/dpa` are all pure-static content but render through dynamic-rendering because the root layout-removed-`force-dynamic` claim is correct, but SiteNav reads cookies (`SiteNav.tsx:14`) which makes them dynamic anyway.
- **Fix**: extract a separate marketing-layout that doesn't read cookies; add `'use cache'` + `cacheLife("static")` to pure-content pages.

---

## Part G — Cross-Browser / Cross-Device

### G1. Browser APIs

- `grep -rn "structuredClone\|URLPattern\|hasOwn"` returns 0 hits.
- `Promise.allSettled` not used in src either. Code uses `Promise.all` only. Safe across all browsers.

### G2. Modern CSS

- `text-balance` is used at `pricing/page.tsx:76`, `ui/alert.tsx:58`, `ui/alert-dialog.tsx:142`. Falls back to normal wrap in older browsers. Safe.
- `text-wrap: pretty` (via `text-pretty`) in `ui/alert.tsx:58`, `ui/alert-dialog.tsx:142`. Same.
- `:has(…)`: grep returns 0 hits in src. Safe.
- `backdrop-blur` used 24 times. Most are `backdrop-blur` (default) or `backdrop-blur-xs`. iOS Safari 14+ supports it. Acceptable.
- `supports-backdrop-filter:` used in `dialog.tsx:42` — proper feature-query guard. Exceptional.

### G3. Safari iOS OKLCH

- OKLCH is used everywhere (`Sphere.tsx:13-15, 27-39, 83-95`, `HoverTooltip.tsx:13-15`, `globals.css`). Safari iOS 16.4+ supports OKLCH. Older iOS (still ~5% of mobile users) will get serialization → fallback color or invalid. No `@supports` guard found.
  - **User-impact: Weak** — older-iOS users may see wrong colors on Galaxie spheres.
  - **Fix**: emit an OKLCH fallback via `color-mix` or per-token sRGB fallback in `globals.css`.

---

## Per-finding Severity Roll-up

### Kill (3)

| # | File | Problem | Impact | Fix-direction |
|---|---|---|---|---|
| K1 | `apps/web/src/app/[workspace]/scans/[id]/page.tsx:53-78` | Scan-detail page has no design at all — bare `<main><h1>Scan detail</h1>…</main>` with no PageShell, no Card, no PageHeader. Most-load-bearing post-audit page renders as raw HTML. | User runs audit, signs up, gets bounced to a scan-detail page that looks broken / unstyled. Critical launch-blocker. | Wrap in `<PageShell>` + `<PageHeader title={path} eyebrow={createdAt}>`. Move `<ScanStatusBanner>` into header-actions. Add a breadcrumb back to `/scans`. |
| K2 | `apps/web/src/app/[workspace]/loading.tsx:1-5` + `PageSkeleton variant="list"` (`components/ui-vk/PageSkeleton.tsx:53-66`) | Loading state for the workspace galaxie is a list-skeleton (`max-w-6xl px-6 py-10`), but the actual page renders a fullscreen black PixiJS galaxie (`h-screen w-screen`). Massive layout-shift on every workspace entry. | Visible CLS on the most-frequently-visited page. Lighthouse will tank. User perceives the app as flaky. | Replace with `<GalaxieSkeleton />` (which exists and is correct — dot-grid + 3 pulsing circles). |
| K3 | `apps/web/src/components/BuyCreditPackModal.tsx`, `apps/web/src/components/CreditMeter.tsx`, `apps/web/src/components/landing/GalaxieSettingsPopover.tsx` | All three components are imported nowhere outside their own files. `grep -rn` confirms. CLAUDE.md says V2 polish wired up the Pack-Modal — **this is incorrect**. | Pack-Modal is invisible; recent commit shipped dead code. CreditMeter is the only in-app "credits remaining" affordance and is unmounted. GalaxieSettingsPopover should be the user's reduced-motion override surface. | Mount `BuyCreditPackModal` trigger in billing page next to inline pack buttons. Mount `CreditMeter` in workspace right-rail or SiteNav. Mount `GalaxieSettingsPopover` somewhere on the landing-hero or wire into HeroSection's top toolbar. |

### Strong (5)

| # | File | Problem | Impact | Fix-direction |
|---|---|---|---|---|
| S1 | `/[workspace]/settings/{general,audit-apply,galaxie,notifications,webhooks,danger,api-keys}/page.tsx`, `/account/settings/{sessions,notifications,connections,delete}/page.tsx` | 11 of 17 settings sub-pages are "Coming with nova-2-settings-backend" stubs. User clicks Profile/Notifications/Sessions — gets a placeholder Card. | Brand-damage. New users will think the app is half-built (and they'd be correct). | Either ship the backend sub-plan now or hide stubs behind a feature-flag and remove from sidebar until functional. Show NavLinks only for sections that have a working backend. |
| S2 | `apps/web/src/components/ui/button.tsx:23-35`, `apps/web/src/components/ui/input.tsx:11` | Default Button/Input height is 28–32 px. WCAG 2.5.5 requires 44×44 minimum on touch surfaces. Used 53 times in src. | All forms on mobile fail touch-accessibility. | Bump defaults to `h-10` (40 px) or add `mobile:h-11` modifier. Alternatively introduce a `density="comfortable" | "compact"` prop. Override `Dialog`'s X-close (`dialog.tsx:75`) too. |
| S3 | `apps/web/src/components/ui-vk/SettingsLayout.tsx:43`  | Sidebar uses `lg:flex-row` — at `<1024px` (i.e. all mobile and tablet) the sidebar (10 entries + 3 group headers + back-link) stacks above the content. On 375 px, the user scrolls past ~20 rows before seeing the actual form. | Settings UX is broken below tablet. Mobile-Adaptation (Nova-2) claim not delivered for settings. | Convert sidebar to a `<select>` dropdown or shadcn `Sheet` for `<lg`. Keep desktop sidebar unchanged. |
| S4 | `apps/web/src/app/global-error.tsx:20` | `<html lang="en">` while root layout uses `lang="de"`. Screen-readers pronounce the error page wrong. | Minor a11y miss, but trivial to fix. | Change to `lang="de"` (or read NEXT_PUBLIC_LOCALE). |
| S5 | `AddCustomerForm.tsx:31-32`, `AddRepoForm.tsx:40-43`, `settings/ai/page.tsx` (all 4 forms) | Silent success state. Form resets fields, no toast, no banner, no inline confirmation. | Users don't know if their save worked. They try again, double-write, then panic. | Standardize on `toast.success(label)` after every server-action success. Or use search-param banners as billing page does. |

### Mid (9)

| # | File | Problem | Impact | Fix-direction |
|---|---|---|---|---|
| M1 | `HeroSection.tsx:43` ("SignUpTeaseDialog") vs `BlurOverlayCTA.tsx:44` | Two divergent magic-link sign-up flows. Tease-dialog drops the audit URL; BlurOverlay carries it via `intent=audit&repo=…`. Anonymous→paid users that hit "Fix via PR" lose their audit. | User has to re-paste URL after sign-in. Confusion. | Pass `submittedUrl` into `SignUpTeaseDialog` and use the same callback pattern. |
| M2 | `SiteNav.tsx:36-43` | No sign-out button anywhere in the UI. User has to clear cookies manually. | Users can't sign out. Privacy + multi-tenant concern. | Add a dropdown menu (avatar/email → "Sign out"). |
| M3 | `SiteNav.tsx:22-53` | No workspace-switcher in SiteNav. Multi-workspace users have to backtrack to the Galaxie to swap context. | Friction for Agency-tier users with multiple customer workspaces. | Move/duplicate `WorkspaceSwitcher` into SiteNav. |
| M4 | All settings pages, all `[workspace]/*` routes | No `metadata` export. Page titles all default to "%s · ValidationKit" template but the `%s` is blank. So title is just "ValidationKit · ValidationKit" or similar. | Bad browser-tab titles. SEO loss on indexable settings (none are indexable but tab UX matters). | Add explicit `metadata: Metadata` per route. |
| M5 | `app/billing/loading.tsx` + `app/billing/page.tsx:11-37` | Loading.tsx exists for a redirect-only page. User briefly sees a billing-skeleton then gets redirected to `/[workspace]/settings/billing`. Double-flash. | Visible "broken-looking" state during navigation. | Delete the `loading.tsx` for routes that only redirect. |
| M6 | `apps/web/src/app/[workspace]/scans/loading.tsx`, `apps/web/src/app/[workspace]/customers/loading.tsx`, etc. | Skeletons use `max-w-6xl px-4` while actual pages use `<PageShell>` (default `max-w-7xl px-6 sm:px-8`). Off-by-one max-width and padding → visible jiggle when loading finishes. | Small CLS on every list-page navigation. | Re-use `<PageSkeleton variant>` consistently OR match the actual PageShell sizing per page. |
| M7 | `apps/web/src/components/landing/HoverTooltip.tsx` | Desktop-only — no touch fallback. Mobile users get the inspector via tap-into-tree, but the tooltip's quick-info isn't surfaced anywhere on the touch path during browse. | Mid — touch users miss the quick-glance hover info. | Either show the tooltip below the active node on tap (using activeNode state) OR add a "preview" line in `RepoTreeView` rows. |
| M8 | `apps/web/src/components/galaxie/SolarListView.tsx:83-96` | Filter chips ("3 Kill", "12 Weak", etc.) use `px-2 py-1` → ~24 px tap target. Fails WCAG on touch. | The mobile primary filter UI is hard to tap precisely. | Bump to `min-h-[44px]` or `px-3 py-2.5`. |
| M9 | `apps/web/src/app/[workspace]/settings/billing/page.tsx:243-309` | Stripe-checkout `<form action={…}>` submits have no `useFormStatus` pending state. Button shows static text while Stripe redirect is being built. | Looks frozen during slow network. User may double-click. | Wrap submit buttons in a Client Component that consumes `useFormStatus()` and toggles `disabled` + spinner. |

### Weak (2)

| # | File | Problem | Impact | Fix-direction |
|---|---|---|---|---|
| W1 | `globals.css` + Sphere component tokens | OKLCH tokens used everywhere without sRGB fallback. Pre-16.4 iOS Safari may render as transparent/invalid color. | ~5% mobile users see wrong colors on Galaxie spheres. | Add `@supports not (color: oklch(0 0 0))` fallback rules. Or accept the regression and bump min-supported iOS in docs. |
| W2 | `apps/web/src/app/auth/verify/page.tsx:52-83` | No `<h1>` on the verify-landing page. Skip-link target is `#main-content` (correct) but the page itself has no heading for SR users. | Minor SR landmark miss. | Add `<h1 className="sr-only">Signing you in…</h1>` or visible. |

---

## Recommended fix order for launch

1. **K1 — Style scan-detail page.** ~30 min effort. Single highest-payoff UX fix.
2. **K2 — Fix workspace loading skeleton.** Swap `PageSkeleton variant="list"` for `<GalaxieSkeleton />`. 5 lines.
3. **K3 + B3 + B2 — Mount CreditMeter + BuyCreditPackModal.** ~1 hr; these are the primary upgrade-path affordances.
4. **S1 — Hide stub-settings sections** behind a feature-flag in `settings/layout.tsx` `buildGroups()`. Show only `general` (still stub for now), `members`, `billing`, `ai`, `integrations`. Move the rest behind `process.env.NEXT_PUBLIC_NOVA2_BACKEND === '1'`.
5. **S2 — Bump touch-target heights** in `ui/button.tsx` + `ui/input.tsx`. Single file, single-line change for defaults.
6. **S3 — Mobile settings layout.** Add a Sheet-based mobile-nav.
7. **M2 — Sign-out menu in SiteNav.** Add `DropdownMenu` with email + Sign out.
8. **S5 + M1 — Toast standardization + sign-up tease URL passthrough.**
9. **S4 — `lang="de"` in global-error.tsx.** One char.

Total estimated effort to clear all Kill + Strong: ~1 day of focused work.

---

## Out-of-scope but flagged for follow-up

- Cache Components migration (Nova-3a). 0 `'use cache'` directives. Marketing pages (legal, trust, pricing) are dynamic because SiteNav reads cookies — separate marketing-layout would unlock static rendering.
- PixiJS workspace galaxy GSAP cleanup looks correct but the 1159-line scene component is a refactor candidate.
- No `<Image>` usage at all — when the marketing team eventually adds an OG image / product screenshot, the discipline should hold.
- `ScansPage` (`[workspace]/scans/page.tsx:90`) uses `s.createdAt.toISOString().slice(0,16).replace("T"," ")` — same pattern in 6 other files. Pull into a `formatTimestamp()` utility before launch.
- No CSP. No nonce. No `headers()` config in `next.config.ts`. Out of scope for this audit (Wave-1 Sub-09 territory) but worth a note.

---

End of `wave1-05-frontend-ux.md`. 2026-05-22, single pass, German UI strings preserved verbatim.
