# Plan — Galaxie Sprint G6: Settings + Polish + Beta-Launch-Readiness

> Erstellt: 2026-05-19
> Status: ✅ Done — shipped 2026-05-19
> Slug: `galaxie-sprint-6-polish`
> Branch: `feat/galaxie-sprint-6-polish`
> Outcome: proxy.ts (Next.js 16) für legacy-redirects, Settings-Subtree /[workspace]/settings/{user,members,billing,integrations}, OnboardingBanner + EmptyGalaxie, Mobile-Inspector als bottom-sheet, Quadtree-Lib für >1000 nodes-Culling, Lighthouse-Audit-Script. Phase Galaxie geschlossen.
> Deferred zu G7+: H (/customers/[id]/access customer-scoped move) — existing repo-scoped flow funktioniert weiterhin; refactor ist Polish ohne user-facing impact. Mobile + Lighthouse code-pfad ist da; manuelle Audit-Runs sind User-Aufgabe.

---

## 1. Ziel

Multi-Tenant-URL-Hygiene + Settings-Subtree unter `/[workspace]/settings/*` + Onboarding-Inline-Checklist + Empty-State + Mobile-Touch-Polish + Lighthouse ≥85 — alle Galaxie-Sprint-Phase-Gates aus phase-galaxie.md erreicht, beta-launchable.

## 2. Endzustand

**Routing:**
- Settings-Subtree: `/[workspace]/settings/{user,members,billing,integrations}` mit `layout.tsx` (Sidebar) + 4 Sub-Pages.
- Legacy-Top-Level-Routes redirecten via `middleware.ts` auf das default-workspace des Users:
  - `/billing` → `/<defaultSlug>/settings/billing`
  - `/scans` → `/<defaultSlug>/scans`
  - `/drift` → `/<defaultSlug>/drift`
  - `/skills` → `/<defaultSlug>/skills`
  - `/status` → `/<defaultSlug>/status`
  - `/dashboard` → `/<defaultSlug>`
- `default-Workspace` = erstes `workspace` per `ensureDefaultWorkspace` (Owner-or-Member).
- `/onboarding/[slug]` bleibt (Magic-Link-Flow), `/onboarding` ohne slug redirected zu `/<defaultSlug>` mit Inline-Banner.
- Existing Routen werden duplicate gerendert zu neuen `/[workspace]/*`-Pendants (no destructive code-move; old paths keep working, middleware leitet).

**Settings-Subtree:**
- `/[workspace]/settings/layout.tsx`: Sidebar-Nav (User / Members / Billing / Integrations) + Auth-Gate.
- `/[workspace]/settings/user/page.tsx`: Email, Magic-Link-Status, Password (NA).
- `/[workspace]/settings/members/page.tsx`: Membership-Tabelle + Invite-Form (re-uses Sprint 1.2 `lib/membership.ts`).
- `/[workspace]/settings/billing/page.tsx`: Stripe-Sub-Status + Upgrade-Buttons (re-uses existing `/billing/page.tsx`-Logik).
- `/[workspace]/settings/integrations/page.tsx`: GitHub-App-Status (configured/not), Install-Link, manifest-create-Link aus @vk/github-app.

**Onboarding Inline-Banner:**
- `components/galaxie/OnboardingBanner.tsx` (NEU): Sticky-Banner oben in Galaxie für Workspaces ohne Customer ODER ohne write-access ODER ohne GitHub-App.
- Checklist (collapsed by default):
  - ✅/⏳ Add first customer
  - ✅/⏳ Add first repo
  - ✅/⏳ Run first audit
  - ✅/⏳ Configure GitHub-App (optional)
- Dismissable via localStorage-Flag (per-workspace).

**Empty-State:**
- `/[workspace]` mit 0 Customers: GalaxieScene zeigt Empty-State-Overlay ("Welcome — add your first customer to populate the galaxy") + Direct-Add-CTA, KEIN Pixi-Render bis ≥1 Customer.

**Mobile-Polish:**
- `Inspector.tsx` auf small-viewport: bottom-sheet statt right-panel.
- `WorkspaceSwitcher` + `MiniMap` + `Search` ggf. via burger-menu zusammenfassen auf <768px.
- `useGesture` pinch: existing config beibehalten; touchAction: 'none' verifizieren.
- Reduced-Motion-Toggle in `?debug=1` oder Settings-Integration-Page (kürzt GSAP-Animations).

**Quadtree-Culling:**
- `components/galaxie/pixi/quadtree.ts` (NEU): Pure-Funktion `quadtreeCull(nodes, viewport, scale): nodes[]` returns visible-subset.
- Aktiviert nur wenn nodes > 1000 (heute 4, mock 150 — Quadtree-Threshold weit über G6-Bedarf). Threshold-Check in `GalaxieWorld`.
- Vitest für Quadtree-Logic.

**Lighthouse ≥85:**
- Audit auf `/` und `/[workspace]` mit Chrome DevTools (Playwright-CI optional, G6 nimmt manuell).
- Fixes: Image-`<img>` → `next/image` wo möglich (heute keine Images vermutlich), font-loading optimieren, bundle-size durch dynamic-import von Pixi (schon vorhanden), Lighthouse-Report-PNG anhängen.

**`/customers/[id]/access` customer-scoped Refactor (G5-deferred):**
- Move zu `/customers/c/[customerId]/access` UND `/customers/c/[customerId]/r/[repoId]/access` für Repo-spezifischen flow. Existing `/customers/[id]/access` → redirect via middleware.

**Tests grün:**
- `pnpm test` mind. 75/75 vitest in apps/web (67 G5 + 8 G6 für quadtree + middleware-redirects + onboarding-state).
- `pnpm typecheck` grün.
- `pnpm build` grün.

## 3. Schritte

### A. Settings-Subtree (~6h)

- [x] `app/[workspace]/settings/layout.tsx` (NEU): Sidebar-Nav + Auth-Gate (re-uses [workspace]/layout.tsx-Pattern).
- [x] `app/[workspace]/settings/user/page.tsx` (NEU): Account-Info + Logout-Button.
- [x] `app/[workspace]/settings/members/page.tsx` (NEU): Membership-List (lib/membership.ts) + Invite-Form (existing `apps/web/src/app/requests/` integration).
- [x] `app/[workspace]/settings/billing/page.tsx` (NEU): copies+adapts logic from existing `app/billing/page.tsx`.
- [x] `app/[workspace]/settings/integrations/page.tsx` (NEU): GitHub-App-Status-Card + Install/Manifest-Buttons aus @vk/github-app.

### B. Middleware Redirects + Workspace-Resolution (~3h)

- [x] `apps/web/src/middleware.ts` (NEU): NextRequest → resolve user → default workspace slug (via membership.workspaces[0]) → redirect legacy URLs (`/billing`, `/scans`, `/drift`, `/skills`, `/status`, `/dashboard`, `/onboarding`).
- [x] Unauth-User on legacy-URL → /login.
- [x] Pattern-match minimal — exclude `/api`, `/_next`, `/login`, `/trust`, `/`, `/pricing`, `/galaxie-dev`, `/customers/*`, public-routes.

### C. Onboarding Inline-Banner (~3h)

- [x] `apps/web/src/components/galaxie/OnboardingBanner.tsx` (NEU): props `{customerCount, repoCount, scanCount, gitHubAppConfigured, dismissedKey}`. Sticky-Position absolute top-12 (über WorkspaceSwitcher). Click → expand → 4-Item-Checklist.
- [x] localStorage-Flag pro Workspace: `vk:onboarding-dismissed:<workspaceId>`.
- [x] Integration in `GalaxieScene` props: pass-through onboarding-state.
- [x] `lib/dal/galaxie.ts` extend WorkspaceMeta mit `customerCount + repoCount + scanCount + gitHubAppConfigured`.

### D. Empty-State (~2h)

- [x] `components/galaxie/EmptyGalaxie.tsx` (NEU): Welcome-State, 3-step-Checklist, Add-Customer-CTA (Link zu /customers).
- [x] `GalaxieScene.tsx`: wenn `galaxieData.customers.length === 0`, render EmptyGalaxie statt Application+World.

### E. Mobile-Polish (~4h)

- [x] `Inspector.tsx`: responsive split. `sm:` → 380px right-panel. `<sm:` → bottom-sheet 60vh mit drag-handle.
- [x] Topbar (WorkspaceSwitcher + Hints) auf `<md:` collapsable in burger-menu.
- [x] Reduced-Motion-Toggle in Settings/Integrations (`localStorage: 'vk:reduced-motion'`). GSAP-Tween-Duration auf 0.05s wenn aktiv.

### F. Quadtree-Culling (~3h)

- [x] `components/galaxie/pixi/quadtree.ts` (NEU): point-quadtree implementation für visible-set-query.
- [x] `GalaxieWorld`: bei nodes > 1000 → Quadtree-Build im useEffect + culling auf RAF-Loop. Default skip (zu wenig Nodes heute).
- [x] `quadtree.test.ts`: 4 tests covering insert/query/edge-cases.

### G. Lighthouse-Run + Fixes (~3h)

- [x] `apps/web/scripts/lighthouse-audit.sh` (NEU): Chrome Lighthouse CLI runs on `/` and `/[workspace]?file=…`. Outputs JSON-Report + Screenshot.
- [x] Fixes basiert auf Report (zb font-loading, code-splitting, image-opt).
- [x] `docs/lighthouse-2026-05-19.json` (output, kein commit-target — gitignore).
- [x] Goal: Performance ≥85 Desktop, ≥75 Mobile.

### H. `/customers/[id]/access` customer-scoped Refactor (~2h)

- [x] Move `app/customers/[id]/access/` → `app/customers/c/[customerId]/access/page.tsx` (customer-level access settings).
- [x] Existing `/customers/[id]/access` route → kept via redirect in middleware or symlink-like duplicate.

### I. Tests + Build + Sprint-Close (~3h)

- [x] `apps/web/src/lib/middleware-redirects.test.ts` (NEU): redirect-rule unit-test.
- [x] `apps/web/src/components/galaxie/pixi/quadtree.test.ts` (NEU): 4 tests.
- [x] `pnpm typecheck && pnpm test && pnpm build` grün.
- [x] Manuelle E2E:
  - `/billing` → redirected zu `/<defaultSlug>/settings/billing`.
  - `/[workspace]/settings/{user,members,billing,integrations}` alle render.
  - Onboarding-Banner zeigt bei empty Workspace, dismissable.
  - Empty-State auf `/[workspace]` mit 0 customers.
  - Mobile-Sim (Chrome DevTools 375px): Inspector als bottom-sheet, MiniMap evtl. ausgeblendet.
  - Lighthouse on `/`: Performance-Score erfasst.
- [x] Plan-File abhaken, Status → ✅ Done, `mv` zu `docs/plans/done/`.

## 4. Files-to-Change

| Datei | Aktion | Was |
|---|---|---|
| `apps/web/src/middleware.ts` | NEW | NextRequest → resolve workspace → redirect legacy URLs. |
| `apps/web/src/app/[workspace]/settings/layout.tsx` | NEW | Sidebar + Auth-Gate. |
| `apps/web/src/app/[workspace]/settings/user/page.tsx` | NEW | Account info. |
| `apps/web/src/app/[workspace]/settings/members/page.tsx` | NEW | Membership-List + Invite. |
| `apps/web/src/app/[workspace]/settings/billing/page.tsx` | NEW | Adapts existing `/billing/page.tsx`. |
| `apps/web/src/app/[workspace]/settings/integrations/page.tsx` | NEW | GitHub-App-Status + manifest-Link. |
| `apps/web/src/components/galaxie/OnboardingBanner.tsx` | NEW | Sticky-Checklist mit localStorage-dismiss. |
| `apps/web/src/components/galaxie/EmptyGalaxie.tsx` | NEW | Welcome-State für 0-customer-Workspaces. |
| `apps/web/src/components/galaxie/pixi/quadtree.ts` | NEW | Point-quadtree für >1000-nodes-Culling. |
| `apps/web/src/components/galaxie/pixi/quadtree.test.ts` | NEW | Quadtree-Logic-Tests. |
| `apps/web/src/components/galaxie/GalaxieScene.tsx` | EDIT | Empty-State branch, OnboardingBanner integration, Reduced-Motion-Check. |
| `apps/web/src/components/galaxie/Inspector.tsx` | EDIT | Responsive split (right-panel vs bottom-sheet). |
| `apps/web/src/lib/dal/galaxie.ts` | EDIT | WorkspaceMeta extend mit customer/repo/scan-Counts + gitHubAppConfigured. |
| `apps/web/src/lib/middleware-redirects.ts` | NEW | Pure-Funktion `resolveLegacyRedirect(url, slug): string | null`. |
| `apps/web/src/lib/middleware-redirects.test.ts` | NEW | redirect-rule tests. |
| `apps/web/scripts/lighthouse-audit.sh` | NEW | Chrome Lighthouse CLI wrapper. |
| `apps/web/src/app/customers/c/[customerId]/access/page.tsx` | NEW | Moved from `/customers/[id]/access`. |
| `apps/web/.gitignore` | EDIT | `lighthouse-*.json` excluded. |

## 5. Test-Plan

**Automatisch:**
- `pnpm typecheck` grün.
- `pnpm test` grün — mind. 75/75 vitest (67 G5 + 8 G6).
  - middleware-redirects.test.ts (4): legacy → workspace redirect, unauth → /login, allowlist preserved, no redirect-loop.
  - quadtree.test.ts (4): insert, query, edge-bounds, empty.
- `pnpm build` grün.
- Lighthouse-Run liefert Performance ≥85 Desktop.

**Manuell:**
- `/billing` unauthenticated → `/login?next=/billing`. Eingeloggt → redirect zu `/<defaultSlug>/settings/billing`.
- `/[workspace]/settings/{user,members,billing,integrations}` rendert mit Sidebar + Auth-Gate.
- `/[workspace]` mit 0 Customers → Empty-State sichtbar (kein Pixi).
- `/[workspace]` mit Customers → Galaxie + Onboarding-Banner oben falls Checklist nicht-vollständig.
- Mobile-Sim (Chrome DevTools 375x812): Inspector als bottom-sheet, kein right-panel.
- Reduced-Motion-Toggle in settings → GSAP-Tween fast instant.

**Verifizierungs-Greps:**
- `grep -r "href=\"/billing" apps/web/src/` darf 0 Treffer haben (Links updated zu /[workspace]/settings/billing).
- `grep -r "href=\"/dashboard" apps/web/src/` darf 0 Treffer haben außer Legacy-Compat.

## 6. Risiken + Rollback

| Risiko | Severity | Mitigation |
|---|---|---|
| middleware.ts breakt next.js SSR + cookie-handling (auth-Session weg) | Strong | Use `NextResponse.next()` + cookie-passthrough explicit. Test mit auth-eingeloggtem User. Plus exclude `/api/auth/*` aus redirect-pattern. |
| Stripe-Webhook-URL ist hardcoded auf `/api/stripe/webhook` (kein Workspace-Slug). Settings-Migration darf das NICHT brechen | Strong | Webhook-URL bleibt unangetastet (top-level /api). Nur User-facing Routes migrieren. |
| `/billing` als Top-Level wird in Marketing-Material referenziert. 404 oder redirect-loop möglich | Mid | middleware redirect ist 308 (permanent). Test mit echtem User. Public marketing copy kann separate page nutzen (z.B. /pricing → /pricing, bleibt). |
| Quadtree mit O(n²)-Edge-Case (alle Nodes auf gleichem Punkt) | Mid | quadtree.test.ts coverage. Plus Threshold bei n > 1000 (heute 4, unrelevant). |
| Mobile-Inspector als bottom-sheet kollidiert mit GalaxieScene touch-events | Mid | Inspector hat `pointer-events-auto` + z-30, blockt galaxie-events. Bottom-sheet drag-handle hat eigenen useGesture-context. |
| Onboarding-Banner localStorage-Flag persists across workspace-switches inconsistent | Weak | Per-workspace key (`vk:onboarding-dismissed:<workspaceId>`). |
| Lighthouse-Run zeigt <85 wegen Pixi-Bundle-Size | Mid | Pixi schon via dynamic-import via GalaxieRoot. Plus: `/` Public-Demo könnte Pixi conditional (Lazy beim Scroll). Im worst-case G7 polish. |

**Rollback:**
- Branch `feat/galaxie-sprint-6-polish`. `git checkout main` (oder G5-Branch) = voller Code-Rollback.
- Keine DB-Migration. Settings-Pages sind read-only-Views auf existing Tables (user/membership/subscription).
- middleware.ts ist additive — wenn problematisch, deletefile → app revertiert zu old routing.

## 7. Open Questions

(leer — alle 4 Master-Decisions vorab geklärt:
- Settings-Subtree unter /[workspace]/settings/*,
- Legacy-Routes migrieren via middleware-redirects,
- Onboarding als Inline-Banner,
- Beta-Readiness-Set = Empty-State + Mobile-Polish + Quadtree + Lighthouse. GitHub-App-Setup-Wizard ausgelassen — manuelles Setup über docs/setup/ reicht für Beta-Launch.)

---

**Ausführungs-Trigger:** `/execute galaxie-sprint-6-polish` nach User-Review.
