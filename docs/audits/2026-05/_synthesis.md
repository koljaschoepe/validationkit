# Audit-Synthese — Nova-3 Repo-Audit

> Generated: 2026-05-21
> Plan: `docs/plans/nova-3-repo-polish-and-prod-prep.md`
> Method: 12 parallele general-purpose-Subagents · Reports in `01-*.md` bis `12-*.md`
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional} (siehe `packages/core/src/severity.ts`)

---

## TL;DR

**Repo-Health-Score:** 🟡 Solid mit ein paar load-bearing Bugs.

- **Code-Quality**: TypeScript, Webhooks, BYOK-Crypto, Inngest-Konventionen sind *exceptional*.
- **Hot-Spots**: DB-Cascades (GDPR-Risk), Performance (Root-Layout `force-dynamic`), Test-Coverage (7 kritische Pfade ungetestet), UI-Konsistenz in Galaxie-Chrome (0% shadcn).
- **Out-of-Repo-Drift**: CLAUDE.md lügt über die aktive Phase; A11y-Lang-Tag falsch.

**18 Kill · 59 Strong · 60 Mid · 28 Weak · 23 Exceptional.**

**Konsequenz für Nova-3-Plan**: >30 Kill+Strong → 1 /execute reicht NICHT. User-Check vor Phase 1 (Block-Resolver).

---

## Severity-Verteilung pro Domain

| # | Domain                    | Kill | Strong | Mid | Weak | Exceptional |
|---|---------------------------|------|--------|-----|------|-------------|
| 01 | Dead-Code                 | 0    | 24     | 18  | 3    | 2           |
| 02 | Dependencies              | 1    | 3      | 4   | 1    | 1           |
| 03 | TypeScript                | 0    | 0      | 5   | 3    | 2           |
| 04 | DB-Schema                 | **2** | 4     | 5   | 3    | 2           |
| 05 | Security                  | 0    | 0      | 3   | 3    | 2           |
| 06 | Performance               | 1    | 4      | 0   | 0    | 2           |
| 07 | A11y/SEO                  | 1    | 4      | 4   | 3    | 2           |
| 08 | Tests + Eval              | **7** | 2     | 0   | 0    | 2           |
| 09 | Configs                   | 1    | 3      | 5   | 3    | 1           |
| 10 | Context-Files             | 1    | 2      | 4   | 4    | 3           |
| 11 | UI-Konsistenz             | **4** | 9     | 10  | 5    | 3           |
| 12 | API-Routes                | 0    | 4      | 2   | 0    | 1           |
| **Σ** | **Total**             | **18** | **59** | **60** | **28** | **23** |

---

## Kill-Items — Top-Priority (alle 18)

| # | Domain | Finding | File:Line | Effort |
|---|--------|---------|-----------|--------|
| K1 | Deps | `nodemailer@6.10.1` High-CVE GHSA-rcmh-qjqh-p98v (CVSS 7.5, DoS) | `packages/auth/package.json` | 15 min (bump zu 8.x) |
| K2 | DB | `workspace.ownerId` cascade-delete wipes ganzes Workspace bei User-delete | `packages/db/src/schema/workspace.ts` | 1h (Migration + RLS-Test) |
| K3 | DB | User-delete cascades zerstören compliance audit-trail (install_decision, apply_action, dpa_acceptance) — violates GDPR append-only | `packages/db/src/schema/*` | 1h (Migration + PII-scrub-Helper) |
| K4 | Perf | `force-dynamic` im Root-Layout deaktiviert SSG für alle Marketing-Routes (/, /pricing, /legal/*, /trust) | `apps/web/src/app/layout.tsx:32` | 30 min |
| K5 | A11y | `<html lang="en">` widerspricht deutschem UI → SR-Aussprache + SEO-Lang-Targeting kaputt | `apps/web/src/app/layout.tsx` | 5 min |
| K6 | Tests | `stripe/webhook/route.ts` (500 LOC) ohne Tests — Doppel-Charging-Risk | `apps/web/src/app/api/stripe/webhook/route.ts` | 4h |
| K7 | Tests | `audit-action.ts` (418 LOC) ohne Tests — Core-Flow | `apps/web/src/lib/audit-action.ts` | 3h |
| K8 | Tests | Alle 7 API-Routes ohne Tests | `apps/web/src/app/api/**/route.ts` | 6h |
| K9 | Tests | DAL-Layer (~1000 LOC) ohne Tests | `apps/web/src/lib/dal/*.ts` | 8h |
| K10 | Tests | `session.ts` ohne Tests — Auth-kritisch | `apps/web/src/lib/session.ts` | 2h |
| K11 | Tests | `billing-actions` + `stripe-meters` ohne Tests | `apps/web/src/lib/billing-*.ts` | 2h |
| K12 | Tests | 4 von 5 Audit-Rules ohne dedicated unit-tests | `packages/audit/src/rules/*.ts` | 3h |
| K13 | Configs | CI hat keinen Lint, keine ESLint-Config, husky `exit 0`, kein Lighthouse-CI | `.github/workflows/*`, root | 3h |
| K14 | Context-Files | CLAUDE.md lügt über aktive Phase (sagt Nova-2 shipped → Subs in Review, 5 Phasen weiter shipped) | `.claude/CLAUDE.md:9-22` | 10 min |
| K15 | UI | Hardcoded Hex `#3b82f6/#eab308/#fbbf24` in WorkspaceSwitcher-Plan-Colors | `apps/web/src/components/galaxie/WorkspaceSwitcher.tsx` | 15 min |
| K16 | UI | Hardcoded `#404040` in StaticGalaxieSVG | `apps/web/src/components/galaxie/StaticGalaxieSVG.tsx` | 5 min |
| K17 | UI | Hardcoded `#06231e` in RequestActions | `apps/web/src/components/RequestActions.tsx` | 5 min |
| K18 | UI | `bg-amber-500` × 3 (Tailwind-Default statt OKLCH-Token) | mehrere Files | 15 min |

**Effort-Subtotal (Kill nur):** ~36h, davon **24h Tests** (K6-K12). Ohne Tests-Kill: ~12h.

---

## Strong-Items — Highlights (Top-20 von 59)

| # | Domain | Finding | File | Effort |
|---|--------|---------|------|--------|
| S1 | Dead-Code | SaaS-Pricing-Frontend nicht verdrahtet — BuyCreditPackModal + Meters-Helpers 0 Caller (Backend hängt im Vakuum) | `apps/web/src/components/BuyCreditPackModal.tsx`, `packages/billing/src/meters/*` | 4h (Wire-Up) |
| S2 | Dead-Code | `claimPendingMemberships` ungenutzt → Invite-Flow vermutlich broken | `apps/web/src/lib/dal/membership.ts` | 2h |
| S3 | Dead-Code | Duplicate DAL: `customers.ts` vs `customer-dal.ts` | `apps/web/src/lib/dal/` | 1h (consolidate) |
| S4 | Dead-Code | 6 Health-Probes mit 0 Callern → Status-Page evtl. fake | `apps/web/src/lib/health/*.ts` | 30 min |
| S5 | Dead-Code | 6 unused deps (d3-selection/zoom Legacy, gray-matter, @vk/core in 3 packages, @octokit/webhooks, shadcn-devDep, lint-staged unkonfiguriert) | mehrere `package.json` | 30 min |
| S6 | Deps | `@react-email/components@1.0.12` deprecated auf npm + 21 transitive Deprecations | `packages/email/package.json` | 1h (Alternative finden) |
| S7 | Deps | `lucide-react@1.x` verdächtig (historisch 0.x) — Supply-Chain-Verifikation | `apps/web/package.json` | 30 min |
| S8 | DB | Nullable+set-null FKs orphan-Risk: `repo.customerId`, `applyAction.repoId/solutionId`, `scan.repoId` | `packages/db/src/schema/*` | 2h |
| S9 | Perf | Zero `'use cache'`-Directives + nur 1 `unstable_cache` trotz CLAUDE.md "Cache Components"-Claim | `apps/web/src/app/**/page.tsx` | 4h |
| S10 | Perf | Nur 1 von 39 Pages mit `<Suspense>` — Streaming nicht genutzt | mehrere Pages | 3h |
| S11 | Perf | `SettingsLayout` ist `'use client'` für 1 usePathname-Call (15 Sections client-side) | `apps/web/src/components/SettingsLayout.tsx` | 30 min (Split wie SiteNav) |
| S12 | Perf | Pricing-Page `force-dynamic` obwohl statisch — perfekter PPR-Kandidat | `apps/web/src/app/pricing/page.tsx` | 30 min |
| S13 | A11y | Skip-Link-Target `id="main-content"` fehlt auf ~9 Pages | mehrere Pages | 30 min |
| S14 | A11y | 5+ Pages ohne `<h1>` (inkl. `[workspace]/page.tsx`) | mehrere Pages | 1h |
| S15 | A11y | Pricing/Landing/Login ohne `metadata`-Export → keine OG/Twitter | mehrere Pages | 45 min |
| S16 | A11y | `robots.ts` + `sitemap.ts` + `public/` Ordner fehlen | `apps/web/src/app/` | 30 min |
| S17 | Configs | `engines` fehlt in 11/12 Workspace-package.json | mehrere | 15 min |
| S18 | Tests | Eval-Drift: dataset.json 5 Tage hinter source | `eval/conflicts/` | 30 min |
| S19 | UI | Galaxie-Chrome 0 shadcn-Imports in 11 Components (Inspector/UniversalSearch/WorkspaceSwitcher/EmptyGalaxie/Tooltip re-implementieren von Hand) | `apps/web/src/components/galaxie/*` | 8h |
| S20 | UI | 21/23 App-Pages bypassen `PageShell`/`PageHeader` | mehrere `page.tsx` | 6h |

(Vollständige Strong-Liste in den 12 Domain-Reports — file-by-file.)

---

## Exceptional Patterns (zum Lernen + Replizieren)

- **TypeScript-Strictness**: 13 tsconfigs erben `strict + noUncheckedIndexedAccess + noImplicitOverride` aus `tsconfig.base.json`. 0 `@ts-ignore` im ganzen Repo.
- **Webhook-Layer**: Stripe + GitHub-App + Notify-Update mit Signing-Verify + Idempotenz-PK + 503-Fallback. Textbook.
- **BYOK-Crypto**: AES-256-GCM mit random IV + auth-tag + key-length-validation.
- **Stripe-Idempotenz-Pattern**: `stripe_meter_event_log` + `prepaid_credit_grant` nutzen Stripe-IDs als natural PKs.
- **PixiJS-Isolation**: `next/dynamic({ ssr: false })` für Galaxie — SSR sauber bypassed.
- **`next/font` Setup**: `display: 'swap'` + `adjustFontFallback` gepinnt.
- **Workspace-Protocol-Disziplin**: alle 23 internen `@vk/*`-Refs auf `workspace:*`.
- **SeverityBadge** als Single-Source-of-Truth (Code+Doc-Sync).
- **ADR-Supersession-Chain** via Frontmatter, lückenlos 0001-0008.
- **Audit-Folder-Konvention** (`docs/audits/YYYY-MM/`).
- **SettingsLayout active-state** mit `before:` left-bar — pixel-perfect Linear-Mimic.

---

## Architektur-Drift gegen CLAUDE.md (Trust-Repair-Items)

1. **"Aktive Phase: Nova-2"** → tatsächlich Nova-3 mit 5 weiteren shipped Phasen dazwischen (Sub-10 K14).
2. **"Cache Components"** im Tech-Stack → 0 `'use cache'`-Directives im Code (Sub-6 S9).
3. **"Cache: Redis (dev)"** → 0 Client-Calls (Sub-10 Mid).
4. **"Pricing: drift-checks"** Marketing → ADR-0003-Annex sagt kein dead-weight-Rest (Sub-10 Mid).
5. **pgvector im Stack** → 0 `CREATE EXTENSION vector`, 0 vector-columns (Sub-4 Note).

---

## Block-Resolver-Trigger im Plan §9

✅ **Audit findet `Kill`-Severity-DB-Migration** — Ja, K2 + K3 (User-cascade) brauchen Migration. → Sub-Plan auslagern?
✅ **>30 Kill+Strong-Items** — Ja, 77 Items total. → `/execute` aufteilen?
✅ **Sub-11 findet GalaxieRoot in fundamentaler Schieflage** — Ja, 4 Kill + 9 Strong + 30-Item-Phase-3-Polish-Liste. → Phase 3 in 6 Sub-Phasen splitten?
✅ **Lighthouse-Gates rot** — Kein Lighthouse-CI existiert (Sub-9 K13). → Test-Tier §8 anpassen.

---

## Recommended Cleanup-Sub-Pläne (Vorschlag)

**Bundle A — DB-Cascade-Hardening + GDPR (must-fix-before-prod)**
- K2, K3, S8 — User-FK-Cascades fixen + PII-scrub-Helper + Migration
- Effort: 3h

**Bundle B — Performance-Quick-Wins (LCP-Bottleneck-Fixes)**
- K4 (force-dynamic root), S9 (`'use cache'`), S10 (Suspense), S11 (SettingsLayout-Split), S12 (Pricing PPR)
- Effort: 4-5h

**Bundle C — A11y/SEO-Foundation (5 min Quick-Win + 1h Foundation)**
- K5 (`<html lang>`), S13-S16 (Skip-Links + h1 + metadata + robots/sitemap)
- Effort: 2.5h

**Bundle D — UI-Token-Quick-Wins (Hex-Cleanup)**
- K15-K18 — alle 4 hardcoded-Hex auf OKLCH-Tokens
- Effort: 45 min

**Bundle E — CI + Tooling (Lint + Lighthouse-CI + engines pinning)**
- K13, S17 — ESLint-flat-config + Lighthouse-CI-Job + engines + .nvmrc full version
- Effort: 3h

**Bundle F — Context-Files-Trust-Repair**
- K14 (CLAUDE.md aktive Phase), S2 (TODO.md), Mid-Items (changelog, linear-aesthetic-Verweis, pricing-marketing)
- Effort: 1h

**Bundle G — Deps-Security (single PR, single command)**
- K1 (nodemailer bump), S6 (react-email), S7 (lucide-react Supply-Chain-Verify), Mid-Items (Zod-Dupe, esbuild/postcss-Transitives)
- Effort: 2h

**Bundle H — Dead-Code-Sweep**
- S1-S5 — SaaS-Pricing-Wire-Up, claimPendingMemberships, customer-DAL-Dedupe, Health-Probes, unused-deps
- Effort: 5-6h (Wire-Up ist load-bearing)

**Bundle I — Tests-Critical-Paths (Sub-Plan, eigenes Multi-Session-Projekt)**
- K6-K12 — Stripe-Webhook, audit-action, API-Routes, DAL, session, billing, Audit-Rules
- Effort: 24h+ → eigener Plan

**Bundle J — UI-Konsistenz-Phase-3 (siehe Sub-11 Polish-Liste)**
- K15-K18 + S19-S20 + 30 priorisierte Items
- Effort: 7-8 Sessions → eigener Plan oder Phase 3 mit 6 Sub-Phasen

---

## Empfehlung für Plan-Adjustment

Status quo Plan §6 hat 5 Phasen in 1 /execute. Mit 18 Kill + 59 Strong ist das nicht realistisch.

**Vorschlag**: Aufteilung in 2 separate `/execute`-Sessions:

- **Phase Nova-3a — Cleanup + Foundation** (jetzt): Bundles A · B · C · D · E · F · G · H (must-fix-before-prod + Trust-Repair). Plus Phase 2 Landing-Polish (unverändert). Plus Phase 4 Stripe-Test-Mode-Verify + Stub. Effort: 1 lange `/execute`-Session, 10-12h.
- **Phase Nova-3b — Tests + UI-Polish-Deep** (später): Bundle I (Tests) + Bundle J (UI-Konsistenz-Phase-3 mit Sub-11-Polish-Liste). Eigener `/plan`-Cycle, 30h+.

**Phase 3 Workspace-Hub-Polish** ist gated auf Sub-11 — die Polish-Liste mit 30 Items + 6 Sub-Phasen ist zu groß für diesen Plan. Verschiebe nach Phase Nova-3b.

User entscheidet jetzt via AskUserQuestion.
