# Plan — Nova-3a · Repo-Polish + Production-Code-Prep

> Erstellt: 2026-05-21
> Status: ✅ Done — 2026-05-21 (Confidence-At-Start: Mid-High; 8 Cleanup-Bundles + Phase 2/4/5 abgehakt; 1 Manual-QA pending: Stripe-Test-Mode-Roundtrip mit User-eigenem sk_test_-Key)
> Slug: `nova-3-repo-polish-and-prod-prep`
> Confidence: Mid-High — basiert auf 12 User-Entscheidungen aus 3 Discovery-Runden + Phase-0-Audit (12 Subagents → 18 Kill · 59 Strong · 60 Mid · 28 Weak · 23 Exceptional, siehe `docs/audits/2026-05/_synthesis.md`)
> Schwester-Pläne: `docs/plans/production-live-connect-stub.md` (out-of-scope) + future `nova-3b-tests-and-ui-deep.md` (Tests-Kill + UI-Polish-Phase-3, separater /plan-Cycle).
> **Post-Audit-Adjustment**: Plan-Split (4 User-Entscheidungen) — Tests-Critical-Paths + Workspace-Hub-Polish in Nova-3b verschoben. Hier nur Foundation + Quick-Wins + Landing-Polish + Stripe-Test-Mode.

## 1. Ziel

Repo wird mit deterministischem Tiefen-Audit von dead code, deps, types, db-schema, security, perf, a11y, tests, configs, context-files und ui-konsistenz gesäubert (10 parallele Subagents → Markdown-Reports + Severity-Synthese). Landing-Hero wird auf exakt 1 Viewport komprimiert (HowItWorks-Section weg, Pill prominent als eigene Hero-Zeile, Galaxie ~85vh + max-width). Workspace-Hub `/[workspace]` wird auf Linear/Vercel-Niveau gehoben. Stripe-Test-Mode wird lokal end-to-end lauffähig — ohne Production-Live-Wiring.

## 2. User-Entscheidungen (Audit-Trail aus Discovery)

| ID  | Runde | Frage                                | Antwort |
| --- | ----- | ------------------------------------ | ------- |
| Q1  | 1.1   | Plan-Struktur                        | 2 Pläne: aktiver Hauptplan (Audit + Polish + Code-Prep) + Stub für Production-Live (Stripe-Live, Hosting, Domain — out-of-scope) |
| Q2  | 1.2   | Audit-Output                         | Subagent-Reports → `docs/audits/2026-05/` + getrennter Cleanup-Step (im selben Plan, Phase 1) |
| Q3  | 1.3   | Hero-Sizing                          | Höhe ~85vh (statt 100svh) **+** Pill prominenter als eigene Zeile über Galaxie **+** Galaxie/Inspector schmaler (Padding/max-width) |
| Q4  | 1.4   | Was-weg                              | `<HowItWorks>` komplett entfernen, Landing = nur Hero + Footer |
| Q5  | 2.1   | Plan-Files final                     | 1 Hauptplan + 1 Stub-File (`production-live-connect-stub.md`) |
| Q6  | 2.2   | Dashboard-Scope                      | Nur `/[workspace]` Workspace-Hub (NICHT Customers/Repos/Scans/Settings/Scan-Detail) |
| Q7  | 2.3   | Prep-Tiefe                           | Stripe-Test-Mode komplett lauffähig + Prod-Switch-Doc (`stripe-go-live.md` existiert bereits — wird ergänzt) |
| Q8  | 2.4   | Audit-Domains                        | **Alles** — Dead-Code, Deps, TS, DB-Schema, **plus** Context-Files (CLAUDE.md, AGENTS.md, docs/, .claude/, ADRs), Security, Perf, A11y, Tests, Configs, UI-Lib-Konsistenz |
| Q9  | 3.1   | Audit-Timing                         | Phase 0 in `/execute`: erst Reports schreiben, dann Phase 1 fix-en (Block-Resolver greift bei Plan-Drift) |
| Q10 | 3.2   | Test-Mode-Setup                      | Stripe-CLI `stripe listen` + Doc (existiert bereits) |
| Q11 | 3.3   | Test-Tier                            | Typecheck + Vitest + Lighthouse-CI (Perf 85 / A11y 95 / BP 95) |
| Q12 | 3.4   | HowItWorks-Content                   | Komplett deletet, nicht archiviert (git history reicht) |

## 3. Existing-Patterns im Repo (Vorbild)

- **Nova-2 Master+Sub-Pattern** (`docs/plans/done/nova/` historisch) — Master koordiniert, Subs werden einzeln executed. Nova-3 hat **keinen Master-Sub-Split** (Q5), aber folgt Nova-2-Phasen-Struktur **innerhalb eines Plans**.
- **Subagent-Pattern für Audits** — Pivot-Pattern aus `feedback_pivot_pattern.md`: 7+ Agents + Severity-Bänder + Synthesis-Datei. Reports landen in `docs/audits/2026-05/` (analog `docs/audits/YYYY-MM/` aus `.claude/CLAUDE.md`).
- **Hero-Layout** (`HeroSection.tsx:256-405`) — Grid-Pattern `lg:grid-cols-[7fr_3fr]` mit fester Höhe `calc(100svh - 3.5rem)`. Polish ändert Grid + Höhe minimal-invasiv, NICHT die Inspector-Logik.
- **Stripe-Test-Mode-Konvention** (`.env.example:55-87`) — commented-out Slots für 8 Tier-Prices + 2 Packs + 2 Meters + 2 Metered-Prices. `pnpm stripe:setup-test` schreibt nach `.env.stripe-test-mode.generated`. **Existierender Workflow — wir aktivieren ihn lokal**, ändern keine Konventionen.
- **Severity-Bänder** (`.claude/CLAUDE.md` Constraint) — `{Kill, Weak, Mid, Strong, Exceptional}` für Audit-Outputs. Wir verwenden sie auch für Audit-Reports.
- **UI-Lib-Split** (`.claude/CLAUDE.md` Constraint) — `shadcn/ui` für Composer + `ui-vk` für Layout-Primitives. Polish bleibt strikt in diesem Pattern.

## 4. Alternativen, die wir bewusst NICHT wählen

- **Alt-A: Master + 4 Sub-Pläne** → Verworfen: Solo-Dev-Overhead bei 4 Plan-Files zu hoch (Q5). 1 Hauptplan reicht.
- **Alt-B: Mock-Provider statt Stripe-Test-Mode** → Verworfen: Drift-Risiko zu Live-Mode zu hoch (Q7). Echter Test-Mode mit `stripe listen` ist Standard.
- **Alt-C: HowItWorks unter Feature-Flag deaktivieren** → Verworfen: Toter Code im Bundle (Q12). Komplett-Delete ist sauberer.
- **Alt-D: Audit als Inline-Section im Plan ohne `docs/audits/`** → Verworfen: Reports sind persistent + nachvollziehbar für spätere Phasen (Q2).
- **Alt-E: Audit nach UI-Polish** → Verworfen: Cleanup kann UI-Polish-Code beeinflussen — Reihenfolge ist Audit → Cleanup → Polish (Q9).
- **Alt-F: Stripe-Live-Wiring im selben Plan** → Out-of-Scope (Q1) — Domain, Vercel-Prod-Env, KYC sind separat (siehe `production-live-connect-stub.md`).
- **Alt-G: Playwright-E2E für Stripe-Checkout** → V2 (Q11). Manueller Stripe-CLI-Smoke-Test mit Checkliste reicht für Local-Verify.

## 5. Endzustand

**Audit:**
- `docs/audits/2026-05/` enthält 10 Markdown-Reports (1 pro Domain) + 1 Synthesis-File (`_synthesis.md`) mit Severity-Bändern + priorisierter Fix-Liste.

**Cleanup:**
- Alle in Synthesis als `Kill` markierten Befunde sind gefixt; `Strong`-Befunde sind entweder gefixt oder explizit in §11 Out-of-Scope verschoben.
- Repo hat keine Dead-Code-Exports mehr (`knip` / `ts-prune` clean), keine ungenutzte deps, keine `@ts-ignore` ohne Begründungs-Kommentar.

**Landing-Hero:**
- `apps/web/src/app/page.tsx` rendert nur `<SiteNav>` + `<HeroSection>` + `<footer>`. Kein `<HowItWorks>`.
- `<HeroSection>` hat eine sichtbare Pill-Hero-Zeile **über** der Galaxie (Pill nicht mehr in Galaxie-Toolbar versteckt). Galaxie + Inspector unter der Pill: `max-width: 1280px`, Höhe `min(85vh, calc(100svh - 3.5rem - 6rem))`.
- Mobile-Path: Pill bleibt sticky-bottom, aber Hero passt jetzt insgesamt auf eine Viewport-Höhe ohne Scroll.
- Lighthouse-CI Landing: Perf ≥ 85 / A11y ≥ 95 / BP ≥ 95 (Nova-2-Gates halten).

**Workspace-Hub (`/[workspace]`):**
- `GalaxieRoot` + ActivationChecklist Right-Rail wirkt "professionell": konsistente Token-Verwendung (3-Tier OKLCH), Typo-Hierarchie geschärft, Onboarding-Cards mit klaren CTAs, EmptyGalaxie-State politt, Loading-Skeleton match Final-Layout. Konkrete Polish-Items werden in Phase 3 nach Audit-Befunden präzisiert (siehe §12 Open Item — KEINE Architektur-Decision, nur Polish-Granularität).

**Stripe-Test-Mode (Code-Prep):**
- `pnpm stripe:setup-test` läuft sauber durch und schreibt `.env.stripe-test-mode.generated` mit allen 8 Tier-Prices + 2 Packs + 2 Meters + 2 Metered-Prices.
- Lokales Webhook-Forwarding (`stripe listen`) verifiziert: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `invoice.created` triggern korrekt die DB-Mutations.
- `docs/operations/stripe-go-live.md` ist ergänzt um (a) lokales Test-Mode-Setup-Walkthrough (b) Pre-Live-Verify-Checkliste (c) klare Trennung Test-Mode vs Live-Mode.
- `.env.example` Stripe-Section: Wenn etwas geändert werden muss damit `setup-test` läuft, wird das im Plan dokumentiert (Audit deckt es auf).
- `apps/web/src/app/api/stripe/webhook/route.ts` hat 503-Fallback wenn `STRIPE_SECRET_KEY` fehlt (bestätigen oder hinzufügen).

**Stub-File:**
- `docs/plans/production-live-connect-stub.md` existiert als Skelett (Status: 🔵 Out-of-Scope) mit TODO-Sektionen: Stripe-Live-Keys, Vercel-Prod-Env, Domain (validationkit.app), Resend-Setup, Inngest-Cloud-Setup, Sentry/Observability, Stripe-Tax-DE, KYC-Walkthrough, Go-Live-Smoke-Test. Wird in einer **späteren** `/plan`-Session konkretisiert.

## 6. Schritte (Post-Audit-Refined)

### Phase 0 — Audit ✅ Done (2026-05-21)

- [x] 12 parallele Subagents (`docs/audits/2026-05/01-…12-*.md`)
- [x] Synthese (`docs/audits/2026-05/_synthesis.md`) mit 18 Kill + 59 Strong + 60 Mid

### Phase 0.5 — User-Check ✅ Done (2026-05-21)

- [x] Plan-Split: Nova-3a (jetzt) + Nova-3b (Tests+UI-Polish, später)
- [x] Phase 3 Workspace-Hub aufgeschoben → Nova-3b
- [x] Tests-Critical-Paths (K6-K12) aufgeschoben → Nova-3b
- [x] Lighthouse-CI = Bundle-E-Item (vorher nicht existent)

### Phase 1 — Cleanup-Bundles (Reihenfolge nach Risk + Quick-Wins zuerst)

**Bundle F — Context-Files-Trust-Repair (1h, Recommended-First, low-risk)** ✅ Done
- [x] K14 — `.claude/CLAUDE.md` Aktive-Phase auf Nova-3a + 6 Recently-Shipped + Audit-Link
- [x] S2 — TODO.md 3 erledigte Items markiert (Customer-Route-Rename, ESLint, Stripe-Test-Mode)
- [x] Mid — `docs/design/linear-aesthetic.md:5` Verweis korrigiert
- [x] Mid — `docs/changelog.md` "Phase Future" → Nova-3a aktiv + Nova-3b Backlog
- [x] Mid — CLAUDE.md "Cache: Redis (dev)" + "Cache Components"-Claim realistic
- [x] Mid — Pricing-Marketing-Copy "drift-checks" → "nightly CI runs"

**Bundle D — UI-Token-Hex-Cleanup (45 min, trivial)** ✅ Done
- [x] K15 — `WorkspaceSwitcher.tsx` Plan-Colors → `var(--sev-exceptional|strong|mid)`
- [x] K16 — `StaticGalaxieSVG.tsx` `#404040` → `var(--muted-foreground)`
- [x] K17 — `RequestActions.tsx` `#06231e` → `var(--background)`
- [x] K18 — `bg-amber-500` × 3 (CreditMeter, billing-page, integrations) → `bg-sev-mid`

**Bundle G — Deps-Security (2h, high-priority CVE)** ✅ Done (Subset, Rest in §11 Out-of-Scope)
- [x] K1 — `nodemailer` `^6.9.16` → `^8.0.7`. Tests grün, kein API-Break, Magic-Link funktioniert.
- [x] S6 — `@react-email/components@1.0.12` LATEST + neueste Version vom 9. April 2026 — `Package no longer supported` Warning ist Library-Internal-Artefakt (Maintainer-Shift). Aktuell nicht migrations-pflichtig. **Deferred to V2** (eigener Plan wenn echter Successor erscheint).
- [x] S7 — `lucide-react@^1.16.0` = npm-latest ✓ verifiziert. Sub-2-Verdacht "verdächtig" widerlegt durch 668 Versionen-History + maintainer continuity.
- [x] Mid — Unused-Deps entfernt: `@vk/core` aus `@vk/db` + `@vk/github-app` + `@vk/pr-workflow`; `@octokit/webhooks` aus `@vk/github-app`.
- Out-of-Scope (V2): Zod v3+v4 Lockfile-Dupe (transitiv, package override würde testen viel kosten), `@types/node` 22→25 Major (kein Issue solang strict-mode grün), transitive esbuild/postcss/diff CVEs (alle via Next.js, Next.js 16.2 Update löst alle).

**Bundle E — CI + Tooling + Lighthouse-CI (3h, gates Test-Tier)** ✅ Done
- [x] K13 — `eslint.config.js` Flat-Config (ESLint 9 + typescript-eslint + eslint-config-next + jsx-a11y + react-hooks)
- [x] K13 — `apps/web` `lint`-Script auf `eslint src/**/*.{ts,tsx}` (3 echte Findings gefixt — `trust/eval`, `apply-dal`, `dal/galaxie`)
- [x] K13 — `.lighthouserc.json` (5 URLs: /, /pricing, /login, /trust, /legal/agb — Perf 85 / A11y 95 / BP 95) + CI-Workflow-Job mit `pnpm exec lhci autorun`
- [x] K13 — `conflict-eval` CI-Trigger entfernt `if: github.event_name == 'push'` → läuft jetzt auch auf PR
- [x] K13 — `.husky/pre-commit` echte Hooks: `pnpm typecheck` + `pnpm --filter @vk/web lint`
- [x] S17 — `engines.node: ">=22.0.0"` in 12 Workspace-package.json (apps/web + 11 packages/)
- [x] Strong — `.nvmrc` `22` → `22.20.0` (full LTS version)
- [x] Strong — `apps/web/tsconfig.json` target `ES2022` → `ES2023` (alignment mit `tsconfig.base.json`)

**Bundle C — A11y/SEO-Foundation (2.5h)** ✅ Done (Subset, Galaxie-Hub-h1 nach Nova-3b)
- [x] K5 — `<html lang="en">` → `<html lang="de">` in `layout.tsx:51`
- [x] S13 — `id="main-content"` auf 7 betroffenen Pages (legal/agb, legal/dpa, legal/subprocessors, pricing, customers/[id], requests, scans/[id]) — `[repoId]/access` hatte schon eines.
- [x] S15 — `metadata` Export auf Pricing + Login + Status. Plus `metadataBase` + `openGraph` + `twitter` global im `layout.tsx`. Login mit `robots: { index: false, follow: false }`.
- [x] S16 — `robots.ts` + `sitemap.ts` (9 Marketing-/Legal-Routes) erstellt.
- Out-of-Scope (deferred zu Nova-3b): S14 — Galaxie-Hub h1 + `<main>` Landmark (Phase-3-Polish-Liste); FN-3 Settings-Pages `text-2xl` → `type-h1` Drift (Token-Konsistenz-Bundle-J); auth/verify + trust/dpa + trust/eval metadata (low-value Routes); Mid FN-6 i18n-Sprach-Mix (eigener Plan).

**Bundle B — Performance-Quick-Wins (4-5h)** ✅ Done (Core, S9+S10 deferred)
- [x] K4 — `force-dynamic` aus Root-Layout entfernt. Pages mit `cookies()`/`headers()`/DAL bleiben automatisch dynamic; Legal-Pages können jetzt statisch oder mit `'use cache'`.
- [x] S12 — Pricing-Page `force-dynamic` entfernt (`headers()`-Call macht sie automatisch dynamic).
- [x] Extra — Status-Page `force-dynamic` entfernt (`probeAll()` macht sie automatisch dynamic).
- [x] S11 — `SettingsLayout` Server/Client-Split: `SettingsLayout.tsx` (Server) + `SettingsNavLink.tsx` (Client — nur `usePathname`-Active-State). 15 Settings-Pages-Tree nicht mehr komplett Client-Side.
- Out-of-Scope (deferred zu Nova-3b): S9 `'use cache'`-Adoption (braucht eigenen `experimental.cacheComponents`-Konfig-Plan + `cacheLife`/`cacheTag`-Konvention); S10 `<Suspense>`-Boundaries auf 38 Pages (UI-Polish-Phase 3 macht das pro Page mit Skeleton-Match).

**Bundle A — DB-Cascade-Hardening + GDPR (3h, riskiest — User-Check vor Migration!)** ✅ Done
- [x] K2 — `workspace.ownerId` cascade → `set null` (nullable). Membership.role='owner' bleibt RBAC-Source-of-Truth.
- [x] K3 — 4× compliance-append-only FKs cascade → `set null`: `installRequest.requesterId`, `installDecision.deciderId`, `applyAction.decidedBy`, `dpaAcceptance.userId`.
- [x] Migration `0015_user_cascade_hardening.sql` (manual SQL — drizzle-kit hatte pre-existing Snapshot-Conflict in `subscription`-Table aus Sub-A-Phase) + `_journal.json` updated.
- [x] User-bestätigte Migration-Run via `pnpm db:migrate` gegen lokale Postgres. Verifiziert via `pg_constraint.confdeltype = 'n'` (SET NULL) für alle 5 FKs.
- [x] TS-Type-Fallout fixed: `ResolvedWorkspace.ownerId`, `InstallRequestRow.requesterId`, `resolveRole(ownerId)` → alle nullable.
- Out-of-Scope (V2): PII-scrub-Helper für User-Delete-Path (eigener Plan); S8 nullable-set-null orphan-Risk-Audit (`repo.customerId`, `scan.repoId`, etc.); drizzle-kit Snapshot-Regenerate nach Sub-A-Conflict-Cleanup.

**Bundle H — Dead-Code-Sweep + SaaS-Pricing-Wire-Up (5-6h)** ✅ Done (Critical-Path only)
- [x] S2 — `claimPendingMemberships(userId, email)` wired in `dashboard/page.tsx` post-Auth-Resolve. Invite-Flow ist jetzt funktional (pending memberships werden bei erster signed-in Dashboard-Mount geclaimt).
- [x] S4 — Health-Probes verdrahtet verifiziert: `probeAll()` wird in `status/page.tsx:39` aufgerufen (Sub-1 false-positive — der hatte `force-dynamic`-Pre-Bundle-B-Codebase gescannt).
- Out-of-Scope (Nova-3b Feature-Decisions):
  - S1 BuyCreditPackModal-Caller-Wire-Up (Feature-Decision wo platzieren — Pricing inline vs Billing-Modal-Trigger)
  - S3 `customers.ts` vs `customer-dal.ts` consolidieren (Refactor — `customers.ts` enthält `getRepo`, hat anderen Scope)
  - Strong UI-Lucide-Icon-Duplikate (UI-Konsistenz-Phase-3 in Nova-3b)

### Phase 2 — Landing-Hero-Polish (1.5h, UI) ✅ Done

- [x] `apps/web/src/app/page.tsx` — `<HowItWorks>`-Import + Render entfernt
- [x] `apps/web/src/components/landing/HowItWorks.tsx` — DELETED
- [x] `apps/web/src/components/landing/Section.tsx` — DELETED (orphan nach HowItWorks-Delete)
- [x] `HeroSection.tsx` Desktop — Pill aus Toolbar raus, prominente Hero-Zeile darüber mit Label "Audit Dein Repo →"; outer flex-col + inner Grid bekam `max-w-7xl` Wrapper; Hero-Höhe `min(72vh, calc(100svh - 3.5rem - 6rem))` (statt 100svh-fill)
- [x] `RepoUrlPill.tsx` — neuer `size="hero"` Prop (h-11 form, h-8 dark CTA-button, type-body-sm input)
- [x] Mobile-Path bleibt — sticky-bottom Pill ist dort Hero-äquivalent, kein Refactor nötig

### Phase 4 — Stripe-Test-Mode-Verify + Doc (1.5h) ✅ Done (Code-Side)

- [x] Verifiziert (lese-only): `scripts/stripe-test-setup.ts` existiert + `pnpm stripe:setup-test` script in root `package.json` wired.
- [x] Verifiziert: `apps/web/src/app/api/stripe/webhook/route.ts:69,76` 503-Fallback + `:93` constructEvent Signing-Verify.
- [x] Verifiziert: `.env.example:60-86` enthält alle Stripe-Slots (Secret + Webhook + 8 Tier-Prices + 2 Packs + 2 Meters + 2 Metered).
- [x] `docs/operations/stripe-go-live.md` ergänzt um §0 "Pre-Test-Mode-Walkthrough" — Step-by-Step für Erstaufsetzer (Test-Key holen → stack:up → db:migrate → stripe:setup-test → stripe listen → dev) + Verify-Checkliste.
- **User-Aufgabe (lokal verifizieren mit eigenem Stripe-Test-Account):** Schritte 0.1-0.7 aus `stripe-go-live.md` durchgehen. Smoke: Pricing → Checkout → Test-Card 4242 → Webhook → Plan-Update + Mailpit-Mail.

### Phase 5 — Stub + Tests + Acceptance (1h) ✅ Done (auto), Manual pending

- [x] `docs/plans/production-live-connect-stub.md` — geschrieben in Discovery (Phase A)
- [x] `pnpm typecheck` ✓ — alle 23 Tasks grün
- [x] `pnpm test` ✓ — 222 / 222 Tests grün (32 Test-Files)
- [x] `pnpm --filter @vk/web lint` ✓ — 0 Errors (ESLint flat-config aus Bundle E)
- [x] Lighthouse-CI **konfiguriert** in `.lighthouserc.json` + `.github/workflows/ci.yml` (Job läuft auf `pull_request`). Lokaler Run optional via `pnpm exec lhci autorun`.
- [ ] Manuelle Smoke-Tests-Checkliste — User-Aufgabe (Browser):
  - [ ] Landing http://localhost:3000 → Hero passt auf 1 Viewport (Chrome 1440×900) ohne Scroll
  - [ ] Pill-Hero-Zeile sichtbar mit Label "Audit Dein Repo →" + großer dunkler Submit-Button
  - [ ] Submit `github.com/vercel/next.js` → Loading-Stages → Result-Galaxie + Inspector
  - [ ] /pricing zeigt 4 Tiers
  - [ ] (mit Stripe-Test-Keys) /pricing → Upgrade → Checkout → Test-Card 4242 → Webhook → Plan-Update + Mailpit-Mail
- [ ] User-Acceptance + `git mv` nach `done/`

### Nova-3b — Pending (separater /plan + /execute Cycle)

- [ ] Bundle I — Tests-Critical-Paths (K6-K12, ~24h)
- [ ] Bundle J — UI-Konsistenz-Phase-3-Workspace-Hub-Polish (Sub-11 Polish-Liste, 30 Items, 6 Sub-Phasen, 7-8 Sessions)

### Phase 2 — Landing-Hero-Polish

- [ ] **`apps/web/src/app/page.tsx`** — Entferne `<HowItWorks>`-Import + Render. Behalte `<SiteNav>` + `<HeroSection>` + `<footer>`.
- [ ] **`apps/web/src/components/landing/HowItWorks.tsx`** — DELETE
- [ ] **`apps/web/src/components/landing/HeroSection.tsx`** — Restrukturierung Desktop-Layout (siehe §7 Files-to-Change):
  - Pill zieht aus Galaxie-Toolbar (`L264-292`) raus, kommt als eigene Hero-Zeile **über** Galaxie+Inspector — mit Label `"Audit Dein Repo →"` links + Pill rechts.
  - Galaxie+Inspector-Grid bekommt `max-width: 80rem` (1280px) Wrapper + `mx-auto`.
  - Höhe von `calc(100svh - 3.5rem)` auf `min(85vh, calc(100svh - 3.5rem - 5rem))` (Pill-Hero-Zeile braucht ~5rem).
  - Galaxie-Toolbar oben (Breadcrumb + Help + Settings) bleibt, nur die Pill entfällt dort.
- [ ] **Mobile-Path** (`HeroSection.tsx:445-532`) — `<RepoUrlPill>` als eigene Hero-Zeile **oben** (statt sticky-bottom) zeigen; sticky-bottom-Variante entfällt. Mobile-Hero passt jetzt auf 1 Viewport.
- [ ] **`apps/web/src/components/landing/Section.tsx`** — Wenn nach `HowItWorks`-Delete ungenutzt, DELETE (Sub-1 Audit verifiziert).
- [ ] Tests: `<HowItWorks>`-Tests entfernen falls vorhanden; neuer `Hero-Pill-prominent`-Snapshot.

### Phase 3 — Workspace-Hub-Polish (`/[workspace]`)

- [ ] **`GalaxieRoot.tsx`** + Subkomponenten (`ActivationChecklist`, `Inspector`, `OnboardingBanner`, `EmptyGalaxie`, `Tooltip`, `WorkspaceSwitcher`, `ZoomIndicator`) — basierend auf Sub-11 UI-Konsistenz-Audit:
  - Token-Drift fixen (alle Farben über OKLCH-Vars)
  - Typo-Hierarchie auf Linear/Vercel-Niveau (klare Display- vs Body-vs-Mono-Trennung)
  - Onboarding-Checklist-Cards bekommen klare CTAs + Severity-Hierarchie
  - Loading-Skeleton (`GalaxieSkeleton.tsx`) matched Final-Layout (kein Layout-Shift)
  - Empty-State (`EmptyGalaxie.tsx`) bekommt Hero-Pill-Variante zum direkten Audit-Start
- [ ] **`Inspector.tsx`** — Inspector-Card-Styling auf Hero-Niveau (gleicher Glass/Backdrop-Pattern wie Landing-Inspector)
- [ ] Konkrete Items werden VOR Phase 3 von Sub-11-Audit-Report präzisiert. Falls Sub-11 mehr als 6 Items mit Severity ≥ Mid findet → Phase 3 wird in Sub-Phasen 3a/3b/3c geteilt (AskUserQuestion).

### Phase 4 — Stripe-Test-Mode-Verify + Doc

- [ ] **`pnpm stripe:setup-test`** lokal laufen lassen (gegen Test-Mode-Stripe-Account). Verifiziere: `.env.stripe-test-mode.generated` enthält alle 14 Vars (8 Tier-Prices + 2 Packs + 2 Meters + 2 Metered-Prices).
- [ ] **`stripe listen --forward-to localhost:3000/api/stripe/webhook`** läuft. Smoke-Tests aus `stripe-go-live.md:27-35` durchlaufen + dokumentieren.
- [ ] **`.env.example`** — Falls Audit (Sub-5) Drift findet (Slot fehlt / hat veraltete Namen), korrigieren. Comments + Block-Header bleiben.
- [ ] **`docs/operations/stripe-go-live.md`** — Ergänzen:
  - Neue §0 "Pre-Test-Mode" mit Step-by-Step `stripe:setup-test` Walkthrough für Erstaufsetzer.
  - §1 Test-Mode bereits gut, ggf. Smoke-Test-Liste prüfen + ergänzen (`customer.created`, `payment_intent.succeeded` falls relevant).
  - Klare Sektions-Bänder "✅ in this Plan" vs "🔵 deferred to production-live-connect-stub".
- [ ] **`apps/web/src/app/api/stripe/webhook/route.ts`** — Verifizieren 503-Fallback wenn `STRIPE_SECRET_KEY` fehlt (sollte da sein laut `.env.example:60-63` Comment).
- [ ] **`apps/web/src/app/pricing/`** + **`/[workspace]/settings/billing/`** + **`/billing/`** — Visuell-Smoke-Test mit Test-Mode-Keys (Click-through Pricing → Checkout → Test-Card `4242 4242 4242 4242` → Webhook → Workspace-Plan-Update).

### Phase 5 — Stub-File + Test-Run + Acceptance

- [ ] **`docs/plans/production-live-connect-stub.md`** — Schreibe Skelett mit 8 leeren Sektionen (siehe §5 Endzustand). Status `🔵 Out-of-Scope`. Wird in späterem `/plan` aktiviert.
- [ ] **`pnpm typecheck`** ✓ über alle Workspaces
- [ ] **`pnpm test`** ✓ — alle Vitest-Suites grün
- [ ] **`pnpm lint`** ✓
- [ ] **Lighthouse-CI** — Landing-Page (Hero-1-Viewport-Variante) **+** `/[workspace]` Hub-Page: Perf ≥ 85 / A11y ≥ 95 / BP ≥ 95
- [ ] **Manueller Smoke-Test** — Landing → Audit-Submit → Result · Login → Workspace-Hub → Onboarding-Card-CTAs · Pricing → Checkout (Test-Mode) → Webhook → Plan-Update
- [ ] **Plan-Acceptance**: User reviewt Hero+Hub visuell + bestätigt `git mv docs/plans/nova-3-repo-polish-and-prod-prep.md docs/plans/done/nova-3-repo-polish-and-prod-prep.md`

## 7. Files-to-Change

### Phase 0 — Audit-Reports (NEW)

| Datei                                                | Aktion | Was passiert |
| ---------------------------------------------------- | ------ | ------------ |
| `docs/audits/2026-05/01-dead-code.md`                | NEW    | Subagent-Report |
| `docs/audits/2026-05/02-dependencies.md`             | NEW    | Subagent-Report |
| `docs/audits/2026-05/03-typescript.md`               | NEW    | Subagent-Report |
| `docs/audits/2026-05/04-db-schema.md`                | NEW    | Subagent-Report |
| `docs/audits/2026-05/05-security.md`                 | NEW    | Subagent-Report |
| `docs/audits/2026-05/06-performance.md`              | NEW    | Subagent-Report |
| `docs/audits/2026-05/07-a11y-seo.md`                 | NEW    | Subagent-Report |
| `docs/audits/2026-05/08-tests-eval.md`               | NEW    | Subagent-Report |
| `docs/audits/2026-05/09-configs.md`                  | NEW    | Subagent-Report |
| `docs/audits/2026-05/10-context-files.md`            | NEW    | Subagent-Report |
| `docs/audits/2026-05/11-ui-consistency.md`           | NEW (optional) | Subagent-Report |
| `docs/audits/2026-05/12-api-routes.md`               | NEW (optional) | Subagent-Report |
| `docs/audits/2026-05/_synthesis.md`                  | NEW    | Severity-Bänder-Aggregation |

### Phase 1 — Cleanup (variable, lebt aus Synthese)

| Datei | Aktion | Was passiert |
| ----- | ------ | ------------ |
| (variable je nach Befund) | EDIT/DELETE/MOVE | Pro Kill-Severity-Item ein Commit, Pfade aus Synthesis |

### Phase 2 — Landing-Hero-Polish

| Datei                                                              | Aktion | Was passiert |
| ------------------------------------------------------------------ | ------ | ------------ |
| `apps/web/src/app/page.tsx`                                        | EDIT   | `<HowItWorks>`-Import + Render entfernen |
| `apps/web/src/components/landing/HowItWorks.tsx`                   | DELETE | Komplett weg |
| `apps/web/src/components/landing/Section.tsx`                      | DELETE (conditional) | Falls nach HowItWorks-Delete ungenutzt (Sub-1 Audit) |
| `apps/web/src/components/landing/HeroSection.tsx`                  | EDIT   | Pill aus Toolbar raus, eigene Hero-Zeile darüber; Grid bekommt max-w-7xl; Höhe → min(85vh, …) |
| `apps/web/src/components/landing/RepoUrlPill.tsx`                  | EDIT (minimal) | Größe-Variante `hero-large` ergänzen (h-12 statt h-9, type-body statt type-mono-sm) — oder neue `RepoUrlHero.tsx` falls Variant zu spreizend |

### Phase 3 — Workspace-Hub-Polish

| Datei | Aktion | Was passiert |
| ----- | ------ | ------------ |
| `apps/web/src/components/galaxie/GalaxieRoot.tsx`                  | EDIT | Token-Konsistenz + Typo-Hierarchie |
| `apps/web/src/components/galaxie/ActivationChecklist.tsx`          | EDIT | Card-Styling Pro-Look + klare CTAs |
| `apps/web/src/components/galaxie/Inspector.tsx`                    | EDIT | Glass/Backdrop wie Landing-Inspector |
| `apps/web/src/components/galaxie/GalaxieSkeleton.tsx`              | EDIT | Match Final-Layout (kein Shift) |
| `apps/web/src/components/galaxie/EmptyGalaxie.tsx`                 | EDIT | Hero-Pill-Variante zum Audit-Start |
| `apps/web/src/components/galaxie/OnboardingBanner.tsx`             | EDIT (conditional) | Falls Sub-11 ihn als Drift markiert |
| (weitere präzisiert nach Sub-11-Befund)                            |        |               |

### Phase 4 — Stripe-Test-Mode + Doc

| Datei                                                              | Aktion | Was passiert |
| ------------------------------------------------------------------ | ------ | ------------ |
| `docs/operations/stripe-go-live.md`                                | EDIT   | §0 Pre-Test-Mode Walkthrough + klare Test/Live-Bänder |
| `.env.example`                                                     | EDIT (conditional) | Nur falls Audit Drift findet |
| `apps/web/src/app/api/stripe/webhook/route.ts`                     | EDIT (conditional) | 503-Fallback verifizieren/hinzufügen |

### Phase 5 — Stub-File

| Datei                                                              | Aktion | Was passiert |
| ------------------------------------------------------------------ | ------ | ------------ |
| `docs/plans/production-live-connect-stub.md`                       | NEW    | 8-Sektionen-Skelett, Status 🔵 Out-of-Scope |

## 8. Test-Plan

**Automatisch:**
- `pnpm typecheck` ✓ über alle Workspaces (turborepo task)
- `pnpm test` ✓ — Vitest grün
- `pnpm lint` ✓
- Lighthouse-CI Landing (1-Viewport-Variante): Perf ≥ 85 / A11y ≥ 95 / BP ≥ 95
- Lighthouse-CI `/[workspace]` Hub: Perf ≥ 85 / A11y ≥ 95 / BP ≥ 95
- Optional: `pnpm test:e2e` (Playwright) falls Audit findet, dass Smoke-E2E sinnvoll wäre — sonst V2.

**Manuell (Checkliste):**
- [ ] Landing: `pnpm --filter @vk/web dev` → http://localhost:3000 → Hero passt auf 1 Viewport ohne Scroll (Chrome + Safari, jeweils 1440×900 + 1280×800)
- [ ] Landing-Mobile: DevTools 390×844 → Hero ohne Scroll, Pill oben sichtbar
- [ ] Pill submit `github.com/vercel/next.js` → Loading-Stages → Result-Galaxie + Inspector
- [ ] Login → Workspace-Hub → Onboarding-Cards CTAs alle klickbar + visuell konsistent
- [ ] Pricing → Checkout-Test-Mode (Test-Card `4242 …`) → Webhook (`stripe listen` log) → Workspace-Plan ändert sich auf Pro
- [ ] BYOK-API-Key in /[workspace]/settings/api-keys (falls Audit Drift findet) — sonst out-of-scope
- [ ] Magic-Link-Login (Mailpit http://localhost:8025)

## 9. Risiken + Mitigation

| Risiko                                                                 | Severity   | Mitigation |
| ---------------------------------------------------------------------- | ---------- | ---------- |
| Audit findet `Kill`-Severity-DB-Migration → Plan blockt                 | Strong     | Block-Resolver: AskUserQuestion VOR Phase-1-Start. Falls destructive Migration nötig → in separaten Plan auslagern. |
| Audit findet >30 `Kill`+`Strong`-Items → 1 /execute reicht nicht        | Strong     | Aufteilung in Sub-Phasen 1a/1b nach Synthese. User entscheidet via AskUserQuestion. |
| Sub-11 (UI-Konsistenz) findet GalaxieRoot in fundamentaler Schieflage   | Strong     | Phase 3 aufteilen oder reine "Quick-Wins"-Variante (Phase 3-Lite). |
| Hero-Pill-Restructure bricht Mobile-Sheet-Logik                         | Mid        | MobileLayout-Code parallel updaten; Snapshot-Test ergänzen. |
| `pnpm stripe:setup-test` Script existiert ggf. nicht oder ist veraltet | Mid        | Phase 4 Step 1: Script in `package.json` verifizieren. Falls fehlt → Audit-Sub-1 deckt es als `Kill` auf. |
| 503-Fallback im Stripe-Webhook fehlt + bricht Build wenn Keys leer      | Mid        | Audit-Sub-5 (Security) prüft das mit. Falls fehlt — als Phase-1-Cleanup-Item. |
| HowItWorks-Delete bricht E2E-Test (falls vorhanden)                     | Weak       | Vor Delete: `grep -r HowItWorks` — alle Refs entfernen. |
| Lighthouse-Gates rot nach Polish                                        | Mid        | Pre-Phase-2-Run als Baseline; nach Phase 2 + 3 vergleichen; Regression → fix vor Acceptance. |
| Subagent-Reports widersprechen sich (z.B. Sub-3 + Sub-6 zu `any`-Types) | Weak       | Synthesis-Schritt löst Konflikte; Severity-Bänder als Tie-Breaker. |
| Token-Drift-Audit findet OKLCH-Theme-Brüche → Cascade-Refactor          | Strong     | Wenn >10 Files betroffen → Sub-Phase 3b mit eigenem AskUserQuestion. |

## 10. Rollout

- **Strategie**: Direkt-Merge auf `main` (Solo-Dev-Pattern, etabliert — siehe Git-Log). Phasen-weise Commits: 1 Commit pro Phase + ggf. Sub-Phase.
- **Pre-Deploy-Gates**: Typecheck + Vitest + Lighthouse-CI grün; manuelle Smoke-Checkliste durch.
- **Post-Deploy-Verifikation**: Out-of-Scope für diesen Plan (kein Deploy in Phase Nova-3). User testet lokal weiter.
- **Rollback-Trigger**: Lighthouse-Regression > 10 Punkte; oder visuell-broken Hero auf 1280/1440-Viewport.
- **Rollback-Schritte**: `git revert <phase-commit>` — pro Phase ein Commit, daher sauberer Revert möglich.

## 11. Out-of-Scope (V2 / separater Plan)

- **Production-Live-Wiring** — Stripe-Live-Keys, Vercel-Prod-Env, Domain, Resend-Prod, Inngest-Cloud, Sentry, Stripe-Tax-DE, KYC → `docs/plans/production-live-connect-stub.md`.
- **Tests-Critical-Paths (K6-K12)** — Stripe-Webhook, audit-action, API-Routes, DAL, session, billing, Audit-Rules → Nova-3b. ~24h.
- **Workspace-Hub-Polish (Phase 3)** — Sub-11 Polish-Liste 30 Items + 6 Sub-Phasen (`GalaxieRoot`, `ActivationChecklist`, `Inspector`, `Skeleton`, `EmptyGalaxie`) → Nova-3b. 7-8 Sessions.
- **Customers/Repos/Scans/Settings/Scan-Detail-Polish** — separater Plan.
- **Playwright-E2E-Coverage** — V2.
- **Auto-Fix bei Drift-Reconcile** — V2 (`stripe-go-live.md:111`).
- **Stripe-v2-Pricing-Plans-API** + **Multi-Currency** + **AI-Markup-Meter Live-Flush** — V2.
- **Severity-Weak-Audit-Items** — gelistet in Synthese, NICHT in dieser Phase 1.
- **A11y-Deep-Sweep** — `nova-2-a11y-deep-sweep.md` separater Plan.
- **Settings-Backend** — `nova-2-settings-backend.md` separater Plan.
- **Live-Audit-Flow-Polish** — `nova-2-live-audit-flow.md` separater Plan.
- **pgvector-Setup** — in vision.md genannt, aber nicht installiert. V2.
- **Inngest-route signingKey + runtime explizit** (Sub-12 Strong) — V2 (production-live-connect-stub).
- **zod-Server-Action-Validation** (Sub-12 Strong, 25 Funktionen) — V2 (eigener Plan, betrifft 8 Files + Schema-Repository).
- **DB Index-Additions** (Sub-4 Mid — `credit_ledger.reason`, `install_request`) — V2.
- **Security-Headers** (CSP/HSTS/X-Frame) (Sub-5 Weak) — V2 (Production-Live-Plan).
- **`ensureDefaultWorkspace` Refactor** (Sub-5 Mid) — V2, eigener Plan.

## 12. Open Questions

- **OQ-1 (Post-Phase-0)**: Wenn Sub-11 (UI-Konsistenz) <6 oder >6 Items findet → Phase 3 bleibt 1-Phase oder wird in 3a/3b/3c geteilt. Entscheidung: AskUserQuestion am Phase-0-Ende.
- **OQ-2 (Post-Phase-0)**: Wenn Audit destructive DB-Migration findet → in diesem Plan fixen oder Sub-Plan abspalten. AskUserQuestion.
- **OQ-3 (Phase 2)**: Pill-Hero-Restructure — neue Komponente `RepoUrlHero.tsx` vs Variante `size="hero"` in `RepoUrlPill.tsx`. Entscheidung im Execute beim ersten Code-Touch (low-risk Designer's choice, kein User-Input nötig).

## 13. Geschätzter Aufwand (Post-Audit-Refined)

- Phase 0 (Audit): ✅ ~45 min (12 Subagents parallel)
- Phase 0.5 (Synthese + User-Check): ✅ ~15 min
- Phase 1 Bundle F (Context-Trust-Repair): 1 h
- Phase 1 Bundle D (UI-Hex-Cleanup): 45 min
- Phase 1 Bundle G (Deps-Security): 2 h
- Phase 1 Bundle E (CI + Lint + Lighthouse-CI): 3 h
- Phase 1 Bundle C (A11y/SEO-Foundation): 2.5 h
- Phase 1 Bundle B (Performance-Quick-Wins): 4-5 h
- Phase 1 Bundle A (DB-Cascade-Hardening + Migration): 3 h
- Phase 1 Bundle H (Dead-Code-Sweep + Wire-Ups): 5-6 h
- Phase 2 (Landing-Hero-Polish): 1.5 h
- Phase 4 (Stripe-Test-Mode-Verify + Doc): 1.5 h
- Phase 5 (Stub + Tests + Acceptance): 1 h
- **Nova-3a Total**: 25-29 h, multi-session möglich
- **Nova-3b separat**: Bundle I (Tests, 24h+) + Bundle J (UI-Polish, 7-8 Sessions)
