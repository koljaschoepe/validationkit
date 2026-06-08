# Wave-1 Synthese — Production-Launch-Readiness-Audit

> Generated: 2026-06-05
> Method: 6 parallele Sub-Agents (general-purpose, Opus 4.7) — 4 erfolgreich, 2 gegen Session-Limit (Re-Spawn pending: Audit-Diff hat trotzdem geschrieben, Tests+Build noch nicht)
> Method-Convention: Severity-Bänder `{Kill, Strong, Mid, Weak, Exceptional}` per `packages/core/src/severity.ts`
> Baseline: 2026-05-Audit (18 Kill · 59 Strong · 60 Mid) — siehe `../2026-05/_synthesis.md`
> Active-Phase: alle Nova-3a-Bundles + Nova-3b Sub-A/B/C + Galaxie-Workspace-Solar shipped seit Baseline

---

## TL;DR — Production-Readiness-Verdict

**🔴 NICHT launch-ready in 2-4 Wochen. Realistisch: 4-6 Wochen (~22-30 dev-days) Engineering + zusätzliche Out-of-Code-Zeit für Stripe-KYC + DKIM-Propagation.**

| Kategorie               | Status | Findings        | Pre-Launch-Effort |
|-------------------------|--------|-----------------|-------------------|
| Audit-Diff vs 2026-05   | 🟢     | 15/18 Kills resolved, 0 regressed, 4 neue Mid/Weak | ~4h P0-Polish |
| Payment + Stripe-Live   | 🔴     | 2 Kill + 6 Strong + 8 Mid | 3-4 dev-days code + 1-2 wk KYC |
| Auth + Security         | 🔴     | **10 Kill** (5 Cross-Tenant-IDOR + 5 Hardening) + 11 Weak + 9 Mid | 5 dev-days |
| Production-Infra        | 🔴     | 3 Kill + 5 Strong, 6/8 Bereiche Red-or-Yellow | 5 dev-days code + DKIM-24h |
| Frontend UI/UX          | 🟡     | 3 Kill + 5 Strong + 9 Mid | 1-2 dev-days |
| Tests + Build           | ⏳     | Re-Spawn pending (Session-Limit) | TBD |
| **SUMMA (bestätigt)**   | **🔴** | **18 NEUE Kills** (= mehr als 2026-05-Baseline!) | **~22-30 dev-days** |

**Konflikt-Note:** Der Audit-Diff-Agent (#1) sagt "GO for paying customers in 2-4 weeks". Das gilt **nur isoliert** für die alten 18 Kills aus 2026-05 — er hat keine neuen Audits durchgeführt. Die anderen 3 Agents (Payment, Auth, Infra, Frontend) haben **18 NEUE Kills entdeckt**, die alle Launch-Blocker sind.

---

## Severity-Übersicht (alle 4 Reports konsolidiert)

| Domain        | Kill | Strong | Mid | Weak | Source                              |
|---------------|-----:|-------:|----:|-----:|-------------------------------------|
| Audit-Diff    |    0 |      5 |   1 |    1 | `wave1-01-audit-diff.md`            |
| Payment       |    2 |      6 |   8 |    4 | `wave1-02-payment-stripe-live.md`   |
| Auth+Security |   10 |      3 |   9 |   11 | `wave1-03-auth-security.md`         |
| Prod-Infra    |    3 |      5 |   8 |    – | `wave1-04-prod-infra-vercel.md`     |
| Frontend      |    3 |      5 |   9 |    2 | `wave1-05-frontend-ux.md`           |
| Tests+Build   |    ? |      ? |   ? |    ? | Re-Spawn pending                    |
| **Σ**         | **18** | **24** | **35** | **18** |                                  |

---

## Alle 18 NEUEN Kill-Items (Launch-Blocker)

### Auth + Security (10 Kills)

| # | Finding | File:Line | Effort |
|---|---------|-----------|--------|
| K1 | `pollSolution` IDOR — Cross-Tenant LLM-Code-Leak (any user with findingId sees other workspaces' patches) | `apps/web/src/lib/solution-actions.ts:18-24` | 5 LOC |
| K2 | `getRepo` joins scans by `rootPath` — Scan-IDs/counts leak between workspaces auditing same public GitHub URL | `apps/web/src/lib/customers.ts:178-189` | 2 LOC |
| K3 | `audit-trail-export` queries `webhook_event` **without `workspaceId` filter** — any authed user gets last 500 GitHub-webhooks of ALL tenants | `apps/web/src/lib/audit-trail-export.ts:129-148` | 10 LOC |
| K4 | `exportAuditTrail` owner-only + single-workspace — admins/members see empty, multi-workspace owners see only one | `apps/web/src/lib/audit-trail-export.ts:41-46` | 15 LOC |
| K5 | `revokeMember` cross-workspace — Owner of Workspace-A can revoke Member-Row of Workspace-B (missing `eq(membership.workspaceId, workspaceId)` AND-clause) | `apps/web/src/lib/membership.ts:211-223` | 4 LOC |
| K6 | `getScanStatus` + `generateFixesForScan` owner-only — denies admin/member roles inconsistent with rest of RBAC | `scan-status.ts:41-46`, `fix-actions.ts:37-41` | 10 LOC |
| K7 | Better-Auth zero hardening — `rateLimit` off, no `__Host-` cookie prefix, no `trustedOrigins`, no explicit cookie attrs | `packages/auth/src/server.ts:61-120` | 8 LOC |
| K8 | Zero security-headers — no CSP/HSTS/X-Frame/Referrer/Permissions in `next.config.ts` | `apps/web/next.config.ts:1-72` | 30 LOC |
| K9 | Magic-link server-side rate-limit fehlt — Resend-burn + inbox-flood-vector (only client-side 30s countdown in LoginForm) | `packages/auth/src/server.ts` | Better-Auth `magicLink.rateLimit` config |
| K10 | In-memory rate-limiter per-region — Map gets reset on cold-start, multiplied across Vercel-Fluid-Compute regions | `apps/web/src/lib/rate-limit.ts:39` | Swap to `@upstash/ratelimit` or Vercel KV, +1 env-var |

### Payment + Stripe (2 Kills)

| # | Finding | File:Line | Effort |
|---|---------|-----------|--------|
| K11 | **Auto-Overage end-to-end dead code** — UI-toggle (settings/ai), DB-column (`autoOverageEnabled`), cron (`credit-aggregator`), Stripe-meter all wired, but `audit-action.ts:122,352` + `audit-requested.ts:70` never pass `allowOverage: true`. No `credit_ledger` row with `reason='overage'` ever created. Pricing-page promises €0.30/Credit, code can't deliver. | `apps/web/src/lib/audit-action.ts:122,352`; `packages/inngest/src/functions/audit-requested.ts:70` | ~20 LOC + Tests |
| K12 | **Deprecated Stripe-API field** — `sub.current_period_end` was removed from root in API `2026-04-22.dahlia` (moved to `sub.items.data[0].current_period_end`). `route.ts:461-465` returns `null` after first cycle → "Next renewal" + "Resets on" UI broken in Live-Mode. | `apps/web/src/app/api/stripe/webhook/route.ts:461-465` | 5 LOC |

### Production-Infra (3 Kills)

| # | Finding | File:Line | Effort |
|---|---------|-----------|--------|
| K13 | `INNGEST_SIGNING_KEY` documented in 3 places but **never read in code** — `serve()` called without `signingKey`, without `runtime="nodejs"`, without 503-guard. In Live: Inngest-functions (credit-aggregator, prepaid-expirer, stripe-reconcile) silently broken. | `apps/web/src/app/api/inngest/route.ts:1-4` | 8 LOC |
| K14 | **Zero error-tracking vendor** — no Sentry/Axiom/PostHog/Datadog. Only `console.error` → Vercel-Function-Logs (1h retention on Hobby). Bugs in production = silent. | global | Sentry SDK install + DSN env-var |
| K15 | **Domain not registered** → no DKIM/SPF/DMARC → magic-link + transactional emails land in spam. Fallback `from` is `onboarding@resend.dev` (Resend default, sketchy). | DNS + `packages/auth/src/server.ts:111` | Domain-reg + 5 DNS records + 24h propagation |

### Frontend UI/UX (3 Kills)

| # | Finding | File:Line | Effort |
|---|---------|-----------|--------|
| K16 | `/[workspace]/scans/[id]/page.tsx` is **bare HTML** — no PageShell, no Card, no header chrome. The post-audit result screen (the single most important conversion page!) has no design. | `apps/web/src/app/[workspace]/scans/[id]/page.tsx:53-78` | ~2h |
| K17 | `loading.tsx` shows list-skeleton over fullscreen black Galaxie → **massive CLS on every workspace-entry**. Fix is 5-LOC swap to existing `<GalaxieSkeleton />`. | `apps/web/src/app/[workspace]/loading.tsx` | 5 LOC |
| K18 | `BuyCreditPackModal` + `CreditMeter` + `GalaxieSettingsPopover` **orphaned** — imported nowhere. CLAUDE.md claim "V2-Polish wired up Pack-Modal" is FALSE on disk. Dead components in production bundle. | 3 files | ~1h to wire OR delete |

---

## Strong-Items (Highlights — 24 total)

Selected items that need addressing for credible B2B-SaaS:

| ID  | Domain  | Finding | File:Line |
|-----|---------|---------|-----------|
| S1  | Payment | `handleInvoicePaid` not idempotent on `invoice.id` — Dashboard-replay double-grants credits (Strong but acts like Kill if it happens) | `route.ts:315-352`; `packages/billing/src/credits.ts:240-246` |
| S2  | Payment | No `customer.deleted` handler — if admin deletes Stripe-Customer, portal-call fails forever | `route.ts:119-153` |
| S3  | Payment | No `tax_code` on any Stripe Price — should be `txcd_10103001` for SaaS B2B | DB Price-IDs |
| S4  | Payment | `customer_update` missing `name: "auto"` — VAT/legal-name fields don't write back | `billing-actions.ts:83,203` |
| S5  | Payment | AI-markup meter wired but never flushed (`audit_run_cost.markupMicrocents` hardcoded 0) | audit-cost path |
| S6  | Infra   | `vercel.json` zu dünn — no `regions:["fra1"]`, no `functions{}`, `--frozen-lockfile=false`, migration in `buildCommand` (rollout race) | `vercel.json:1-6` |
| S7  | Infra   | No runtime env-schema validator — typos in 14 Stripe-Price vars silently `null`, surface only on user-click | `apps/web/src/lib/env.ts` |
| S8  | Infra   | Resend account + Inngest-Cloud account nicht eingerichtet | docs/operations |
| S9  | Infra   | Lighthouse-CI `"error"` thresholds — will block merges on flake | `.lighthouserc.json:20-26` |
| S10 | Frontend | **10 of 17 settings pages are "Coming with nova-2-settings-backend" placeholder stubs** — new users will think app is half-built | `apps/web/src/app/[workspace]/settings/*` |
| S11 | Frontend | shadcn Button `h-8` + Input `h-8` = 32px → **fails WCAG 2.5.5 (44×44 px touch-target)**, used 53 times | shadcn ui |
| S12 | Frontend | `SettingsLayout` `lg:flex-row` — mobile sidebar (20-row) stacks ABOVE content → form ~15 nav-rows below fold on 375px | `SettingsLayout.tsx` |
| S13 | Frontend | `global-error.tsx` `lang="en"` while root is `lang="de"` → SR-language mismatch on top-level crashes | `global-error.tsx` |
| S14 | Frontend | Most forms have **silent success** — no toast, no banner, no inline confirmation (AddCustomer, AddRepo, BYOK, spend-cap, intensity, overage) | settings forms |
| S15 | Auth    | **Account-Delete / Workspace-Delete / Session-Revoke NOT IMPLEMENTED** — only `mailto:support@`. GDPR Art. 17 risk for DACH-B2B paying customers. | settings/account/* |
| S16 | Auth    | `vitest <4.1.0` CRITICAL CVE-2025 in dev-dep tree | `package.json` |
| S17 | Diff    | `BuyCreditPackModal` 0 callers (confirms K18 from Frontend-side) | duplicate-finding |
| S18 | Diff    | 0 `'use cache'` directives — CLAUDE.md claims Cache-Components but adoption is 0 | global |
| S19 | Diff    | Eval-dataset drift — `run.ts` 2 days newer than `dataset.json`, results-folder empty | `eval/conflicts/` |
| S20 | Diff    | Inspector `aria-modal=true` without focus-trap (WCAG 2.4.3 fail) | `Inspector.tsx:117-119` |

---

## Empfohlene Sub-Plan-Bundles (für Master-Plan)

| Bundle | Title | Findings | Effort | Sequenz |
|--------|-------|----------|--------|---------|
| **A** | Auth-Security-Hardening (Critical-Path) | K1-K10 (alle 10 Auth-Kills) + S15 (Account-Delete) + S16 (vitest) | 5-6 dev-days | **#1 — first, gates everything** |
| **B** | Payment-Fix-Block | K11, K12 + S1-S5 (Stripe-Idempotency + customer.deleted + tax_code + customer_update.name + AI-markup-meter) | 3-4 dev-days | #2 — after auth |
| **C** | Production-Infra-Bootstrap | K13 (INNGEST_SIGNING_KEY) + K14 (Sentry) + K15 (Domain+DKIM) + S6 (vercel.json) + S7 (env-schema-validator) + S8 (Resend+Inngest accounts) + S9 (Lighthouse-CI fix) | 5 dev-days code + 24h DKIM | #3 — parallel to D |
| **D** | Frontend-Pre-GA-Polish | K16 (scan-detail-page design) + K17 (loading.tsx fix) + K18 (wire-up modals) + S10 (hide stubs OR ship) + S11 (button-heights) + S12 (settings mobile) + S13 (global-error lang) + S14 (toasts) + S20 (Inspector focus-trap) | 2-3 dev-days | #3 — parallel to C |
| **E** | Stripe-Live-Mode-Bootstrap | Stripe-KYC + Tax-DE-Registrierung + Live-Bootstrap-Script (sk_live_-Acceptance) + 14 env-var swap + Smoke-Test-Checkliste | 2 dev-days code + 1-2 wks KYC out-of-band | #4 — after B, before launch |
| **F** | Eval + Tests-Erweiterung | S19 (Eval-Re-Run) + Nova-3c residual tests (apply-dal, billing-actions, install-requests, stale-references) | 2-3 dev-days | Post-launch OK |
| **G** | (Pending) Wave-2 + Wave-1-Tests-Re-Spawn | Test-Coverage-Audit re-spawn + Wave-2 (DAL-Authorization-Matrix, Inngest, DB-Schema, Cache/Perf, Legal/DSGVO, Email-Templates, Customer-Journey-E2E) | TBD | Add-on after Wave-2 |

**Critical Path:** A → B → (C parallel D) → E → launch

**Realistic Timeline:**
- Engineering work: ~22-30 dev-days for Bundles A–E
- Stripe-KYC: 1-2 weeks out-of-band (parallel to engineering)
- DKIM-propagation: 24h
- **Total wall-clock: 4-6 weeks** for paying customers ready

---

## Section-Pointer

Vollständige Findings + file:line + fix-Code-Snippets in:

- `wave1-01-audit-diff.md` — 215 lines, Diff-Verdict + 4 Mid/Weak Regressions
- `wave1-02-payment-stripe-live.md` — 521 lines, Stripe-Audit + 15-Step-Live-Switch-Plan
- `wave1-03-auth-security.md` — 530 lines, OWASP-Map + Pre-GA-Checklist (17 items)
- `wave1-04-prod-infra-vercel.md` — 836 lines, Production-Readiness-Matrix + 14-day Launch-Sequence
- `wave1-05-frontend-ux.md` — 433 lines, Route-Walkthrough + WCAG-Audit
- (pending) `wave1-06-tests-build.md` — Re-Spawn nach Session-Reset

---

## Wave-2 Plan (nach Wave-1-Tests-Re-Spawn)

Sub-Agents für Domain-Deep-Dives die Wave-1 NICHT abgedeckt hat:
1. DAL + Authorization-Matrix (jede DAL-Funktion: wer darf zugreifen?)
2. Inngest-Jobs + Cron-Health (Idempotenz, Retry, Dead-Letter)
3. DB-Schema + Migration-Safety + Connection-Pool
4. Cache-Components + Performance + Streaming (Core-Web-Vitals)
5. Legal + DSGVO + DACH-B2B-Compliance (DPA-Template, AGB B2B-Variant, AVV)
6. Email-Templates + Resend + Bounce-Handling
7. (Optional) Customer-Journey-E2E inkl. Edge-Cases

Plus Wave-3 (Cross-Cutting): Customer-Journey-E2E, Production-Cutover-Strategie, Observability-Setup-Detail.

---

End of Wave 1 Synthesis.
