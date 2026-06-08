# Plan — Bundle D · Frontend-Pre-GA-Polish

> Erstellt: 2026-06-08
> Status: 🔵 Skelett — /execute parallel zu C, F, G
> Master: `docs/plans/production-launch-readiness.md`
> Slug: `frontend-pre-ga-polish`
> Confidence: **High** — wave1-05 + wave2-04 file:line-zitiert

## 1. Ziel

Frontend von "Solid mit 3 Kill-Items + 5 Strong-Polish-Debts" auf credible-B2B-Niveau. Scan-Detail-Page bekommt Design, Loading-CLS gefixt, orphaned Modals wired-oder-deleted, Settings-Stubs hidden, Touch-Targets WCAG-konform, SiteNav unblockt SSG für Marketing-Pages.

## 2. User-Entscheidungen

Master §2. Bundle-spezifisch:
- BuyCreditPackModal: in Billing-Settings inline ODER Pricing-Page-Modal-Trigger?
- Settings-Stubs: per `feature-flag` hidden ODER auf 503-page redirect?

## 3. Existing-Patterns

- `PageShell` + `PageHeader` aus `ui-vk` (verwendet in 2/23 Pages)
- shadcn-ui `Button`, `Input` mit default `h-8` (32px)
- `<GalaxieSkeleton />` existiert bereits (in `components/galaxie/`)
- `Sonner` / toast-system existiert via shadcn (verify usage in `AccessForms`)
- `useReducedMotion` Hook bereits dependent

## 4. Alternativen

- **Alt-A: Settings-Stubs shippen statt hidden** → Backend fehlt (nova-2-settings-backend out-of-scope). Hidden via `feature-flag` ist Quick-Cut.
- **Alt-B: BuyCreditPackModal deleten statt wiren** → V2-Polish-Investment wäre verloren. Wir wiren in Billing-Settings.
- **Alt-C: shadcn Button-Heights global ändern** → bricht Linear-Aesthetic. Wir nutzen `data-touch` Variant ODER Mobile-only `h-11`.

## 5. Endzustand

- `/[workspace]/scans/[id]/page.tsx` mit `<PageShell>` + `<PageHeader>` + Card-Layout
- `/[workspace]/loading.tsx` zeigt `<GalaxieSkeleton />` statt list-skeleton
- `BuyCreditPackModal` in `/[workspace]/settings/billing/page.tsx` inline mounted, mit "Buy more credits"-Button
- `CreditMeter` + `GalaxieSettingsPopover` deleted (orphan, no V2-decision)
- 10/17 Settings-Stubs hidden hinter `FEATURE_FLAG_SETTINGS_BACKEND` env (default off)
- shadcn `Button` + `Input` mit `data-touch` variant für Mobile (= `h-11 sm:h-8`)
- `SettingsLayout` Mobile-Pattern: `<details>` Accordion statt sidebar-stack
- `global-error.tsx` `<html lang="de">`
- Toast-Wrapper-Helper `toast.success("...")` in `AddCustomer`, `AddRepo`, `BYOK`, `SpendCap`, `Intensity`, `Auto-Overage` actions
- `Inspector.tsx` mit `<FocusScope>` aus `radix-ui` für aria-modal=true
- **SiteNav-Static-Block (S34)**: `SiteNav` aus marketing-page `app/layout.tsx` raus, separater `<MarketingNav>` ohne cookies()-Call. App-Routes behalten den auth-aware SiteNav.
- `/status` cached `probeAll()` ergebnisse (5min, S36)

## 6. Schritte

### Phase 1 — Quick-Wins (~2h)
- [ ] K23 `loading.tsx` → `<GalaxieSkeleton />` (5 LOC swap)
- [ ] S13 `global-error.tsx` lang="de"
- [ ] Sun-color Hex-Constants in `severity-colors.ts` co-locaten (Wave-1 R1)

### Phase 2 — Scan-Detail-Page Design (~4h)
- [ ] K22 `/[workspace]/scans/[id]/page.tsx` mit `<PageShell>` + `<PageHeader>` + `<Card>` für Summary + `<Card>` pro Finding-Section
- [ ] Loading-Skeleton match Final-Layout
- [ ] Mobile-Layout verifiziert

### Phase 3 — Modals + Stubs (~4h)
- [ ] K24 BuyCreditPackModal in `settings/billing/page.tsx` inline mounten
- [ ] CreditMeter delete + Verweise weg
- [ ] GalaxieSettingsPopover delete + Verweise weg
- [ ] S10 Settings-Stubs hinter `FEATURE_FLAG_SETTINGS_BACKEND` env, sonst aus Sidebar entfernen

### Phase 4 — Touch-Targets + Mobile-Settings (~4h)
- [ ] S11 shadcn `Button` mit `data-touch` Variant (`h-11`), oder Tailwind-class-extension `sm:h-8 h-11`
- [ ] Apply auf alle Form-CTAs (53 Stellen via grep)
- [ ] S12 `SettingsLayout` Mobile-Accordion-Pattern (`<details>` für `<lg`)

### Phase 5 — Toast-System (~2h)
- [ ] S14 Toast-Wrapper-Helper (Sonner)
- [ ] Apply auf 6 silent-success Forms
- [ ] Inline-Confirmation-Banner-Alternative wo Toast unangebracht

### Phase 6 — SiteNav-Static-Fix + Inspector-Focus-Trap (~3h)
- [ ] S34 SiteNav aus marketing-`app/layout.tsx` extrahieren in `<MarketingNav>` (no-cookies)
- [ ] App-Routes (`/[workspace]/*`) eigenes Layout mit auth-aware SiteNav
- [ ] Verify `pnpm build` zeigt jetzt `○ Static` für `/`, `/pricing`, `/legal/*`, `/trust`
- [ ] S20 Inspector.tsx mit `<FocusScope>` wrap
- [ ] S36 `/status` cached `probeAll()` mit `unstable_cache` (oder Bundle-C `'use cache'` post-launch)

### Phase 7 — Acceptance
- [ ] Lighthouse-CI green auf Marketing (Perf ≥ 85)
- [ ] axe-core run auf alle Settings-Routes
- [ ] Manual: Mobile 375px viewport für alle Pages
- [ ] `git mv` → done

## 7. Files-to-Change

**New:**
- `apps/web/src/components/MarketingNav.tsx`
- `apps/web/src/lib/toast.ts` (Wrapper)

**Modified:**
- `apps/web/src/app/[workspace]/loading.tsx`
- `apps/web/src/app/[workspace]/scans/[id]/page.tsx`
- `apps/web/src/app/[workspace]/settings/billing/page.tsx` (Modal mount)
- `apps/web/src/app/[workspace]/settings/layout.tsx` (mobile-accordion)
- `apps/web/src/app/global-error.tsx`
- `apps/web/src/app/layout.tsx` (SiteNav-split)
- `apps/web/src/components/ui/button.tsx` + `input.tsx` (touch-variant)
- `apps/web/src/components/galaxie/Inspector.tsx` (FocusScope)
- `apps/web/src/components/SettingsNavLink.tsx` (stub-flag)
- 6 form-files (AddCustomer/AddRepo/BYOK/SpendCap/Intensity/Overage) für Toast

**Deleted:**
- `apps/web/src/components/CreditMeter.tsx` (orphan)
- `apps/web/src/components/landing/GalaxieSettingsPopover.tsx` (orphan)

## 8. DB-Migration

Keine.

## 9. Test-Plan

- axe-core via Playwright auf 5 main routes
- Manual: Mobile 375px, Tablet 768px, Desktop 1280px
- Lighthouse-CI auf Marketing nach SiteNav-Fix

## 10. Risiken

| Risiko | Mitigation |
|---|---|
| SiteNav-Split bricht Marketing-Auth-Banner (logged-in user sieht falsches Nav) | MarketingNav mit `<Suspense>` für client-side-auth-state |
| Touch-Variant via data-attribute schwer zu pflegen | Tailwind-Class direkt; document Convention |
| Settings-Stubs entfernen → URLs landen auf 404 | Redirect zu Billing oder zeigen `<EmptyState>` mit "Coming soon" |

## 11. Aufwand

**3-4 dev-days** Single/Multi-Session.

## 12. Out-of-Scope

- Workspace-Hub-Polish-Phase-3 (eigener Plan)
- Cache-Components-Adoption (`'use cache'`)
- nova-2-settings-backend (= eigener Plan)
- Lighthouse-A11y-95 (Bundle C nuanciert)
- Demo-Recording (Marketing post-launch)

## 13. Open Items

- BuyCreditPackModal-Mount-Position: Billing-Settings vs Pricing-Page-Modal-Trigger?
- Settings-Stubs: feature-flag-hidden (Default) vs 404-redirect vs `<EmptyState>`?
- Touch-Variant: `data-touch` attribute vs Tailwind-class-Convention?
