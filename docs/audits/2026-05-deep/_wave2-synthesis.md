# Wave-2 Synthese + Konsolidiertes Audit-Ergebnis

> Generated: 2026-06-08
> Method: 6 Wave-2 Sub-Agents + 1 Wave-1-Re-Spawn (Tests+Build) — alle 7 Reports geschrieben
> Baseline: Wave-1-Synthese (`_wave1-synthesis.md`) + 5 Wave-1-Reports
> Convention: Severity-Bänder `{Kill, Strong, Mid, Weak, Exceptional}`

---

## TL;DR — Konsolidiertes Verdict (Wave 1 + Wave 2)

**🔴 LAUNCH-HORIZONT REVIDIERT auf 6-8 Wochen** (vorher: 4-6).

**Gesamt-Findings (Wave-1 + Wave-2):**

| Domain | Kill | Strong | Mid | Weak | Quelle |
|---|---:|---:|---:|---:|---|
| Audit-Diff vs 2026-05 | 0 | 5 | 1 | 1 | wave1-01 |
| Payment + Stripe-Live | 2 | 6 | 8 | 4 | wave1-02 |
| Auth + Security | 10 | 3 | 9 | 11 | wave1-03 |
| Production-Infra + Vercel | 3 | 5 | 8 | – | wave1-04 |
| Frontend UI/UX | 3 | 5 | 9 | 2 | wave1-05 |
| Tests + Build (Re-Spawn) | 2 | 9 | 12 | 7 | wave1-06 |
| DAL + Authorization (NEW) | 3 | – | 1 | 2 | wave2-01 |
| Inngest + Cron-Health (NEW) | 1 | 9 | 4 | – | wave2-02 |
| DB-Schema + Migration (NEW) | 2 | 5 | – | – | wave2-03 |
| Cache + Perf + CWV | 0¹ | 4 | 7 | – | wave2-04 |
| Legal + DSGVO (NEW) | 6 | 8 | 9 | 5 | wave2-05 |
| Email + Resend (NEW) | 4 | – | – | – | wave2-06 |
| **Σ NEUE Findings** | **36** | **59** | **68** | **32** | |

¹ Wave2-04 fand 1 Kill, ist aber Re-Affirm von Wave-1 K17 (loading.tsx CLS) — nicht doppelt gezählt.

**Total: 36 neue Kill-Items, die alle Launch-Blocker sind.** Das ist 2× mehr als der gesamte 2026-05-Audit.

---

## Alle 36 NEUEN Kill-Items (Master-Liste)

### Auth + Security (10 Wave-1 + 3 Wave-2 = 13)

| # | Source | Finding | File:Line |
|---|---|---|---|
| K1 | wave1-03 | `pollSolution` IDOR — Cross-Tenant Code-Leak | `solution-actions.ts:18-24` |
| K2 | wave1-03 | `getRepo` joined by `rootPath` → Cross-Tenant Scan-Leak | `customers.ts:178-189` |
| K3 | wave1-03 | `audit-trail-export.ts:129-148` no workspaceId filter | `audit-trail-export.ts:129-148` |
| K4 | wave1-03 | `exportAuditTrail` owner-only + single-workspace bug | `audit-trail-export.ts:41-46` |
| K5 | wave1-03 | `revokeMember` cross-workspace | `membership.ts:211-223` |
| K6 | wave1-03 | `getScanStatus` + `generateFixesForScan` owner-only | `scan-status.ts:41-46`, `fix-actions.ts:37-41` |
| K7 | wave1-03 | Better-Auth zero hardening (rateLimit/cookies/trustedOrigins) | `packages/auth/src/server.ts:61-120` |
| K8 | wave1-03 | Zero security-headers (CSP/HSTS/X-Frame/Referrer) | `apps/web/next.config.ts:1-72` |
| K9 | wave1-03 | Magic-link server-side rate-limit fehlt | `packages/auth/src/server.ts` |
| K10 | wave1-03 | In-memory rate-limiter per-region (Fluid Compute) | `lib/rate-limit.ts:39` |
| K11 | **wave2-01** | **`listApplyActionsForFinding` IDOR** (`"use server"`, no auth) | `apply-dal.ts:355-376` |
| K12 | **wave2-01** | **`getSolution` direct RPC IDOR** (Wave-1 fand nur den Wrapper) | `solution-dal.ts:112-124` |
| K13 | **wave2-01** | **`listSolutionStatusByFinding` bulk-enumeration oracle** | `solution-dal.ts:127-151` |

### Payment + Stripe (2 Wave-1 + 1 Wave-2 = 3)

| # | Source | Finding | File:Line |
|---|---|---|---|
| K14 | wave1-02 | Auto-Overage end-to-end dead code | `audit-action.ts:122,352`; `audit-requested.ts:70` |
| K15 | wave1-02 | `current_period_end` deprecated in API 2026-04-22.dahlia | `webhook/route.ts:461-465` |
| K16 | **wave2-02** | **`audit-requested` Inngest reads local-disk-path of different Fluid-Compute instance** → local-path scans complete with 0 findings | `audit-action.ts:152-176` |

### Production-Infra (3 Wave-1)

| # | Source | Finding | File:Line |
|---|---|---|---|
| K17 | wave1-04 | `INNGEST_SIGNING_KEY` documented but never read in code | `app/api/inngest/route.ts:1-4` |
| K18 | wave1-04 | Zero error-tracking vendor (no Sentry/Axiom/PostHog) | global |
| K19 | wave1-04 | Domain not registered → no DKIM/SPF/DMARC → magic-link in spam | DNS + `packages/auth/src/server.ts:111` |

### DB-Schema (2 Wave-2)

| # | Source | Finding | File:Line |
|---|---|---|---|
| K20 | **wave2-03** | **Cross-tenant scan-leak via `scan.rootPath` joins** (verifies K2 root-pattern in 3 callers) | `customers.ts:117-132`, `:178-189`; `dal/galaxie.ts:168-174` |
| K21 | **wave2-03** | **Migration 0015 SET NULL but `ip_address` + `user_agent` PII survives user-delete in `install_decision`/`apply_action`/`dpa_acceptance`** → GDPR Art. 17 violation | `schema.ts:74` + Migration 0015 |

### Frontend (3 Wave-1)

| # | Source | Finding | File:Line |
|---|---|---|---|
| K22 | wave1-05 | `/[workspace]/scans/[id]/page.tsx` bare HTML, no design | `page.tsx:53-78` |
| K23 | wave1-05 | `loading.tsx` shows list-skeleton over black Galaxie → CLS catastrophe | `[workspace]/loading.tsx` |
| K24 | wave1-05 | `BuyCreditPackModal` + `CreditMeter` + `GalaxieSettingsPopover` orphaned (CLAUDE.md lügt) | 3 files |

### Legal + DSGVO (6 Wave-2)

| # | Source | Finding |
|---|---|---|
| K25 | **wave2-05** | **Impressum NICHT IMPLEMENTIERT** → §5 TMG → sofort-abmahnfähig in DE |
| K26 | **wave2-05** | **Datenschutzerklärung NICHT IMPLEMENTIERT** → §13 DDG-Pflicht |
| K27 | **wave2-05** | **GDPR Art. 17 stub** (mailto-only) — Account-Delete/Workspace-Delete/Session-Revoke (re-affirm Wave-1 S15) |
| K28 | **wave2-05** | **Transactional emails carry no Impressum-footer** → §5 TMG-Pflicht für commercial email |
| K29 | **wave2-05** | TIA-Doc (Trans-Atlantic-Impact-Assessment) broken link in DPA |
| K30 | **wave2-05** | DPA-contact email = personal Gmail address (compliance-credibility-kill) |

### Email + Resend (4 Wave-2)

| # | Source | Finding |
|---|---|---|
| K31 | **wave2-06** | **No Resend webhook-endpoint for bounces/complaints** → bounced emails never suppressed → reputation tanks |
| K32 | **wave2-06** | **No suppression-table** → hard-bounced emails re-sent on every retry |
| K33 | **wave2-06** | **Member-invite email NOT IMPLEMENTED** — invite-flow operationally broken (invitee learns only on independent sign-up) |
| K34 | **wave2-06** | **Invoice-paid notification + Credit-low warning NOT IMPLEMENTED** (Wave-1-Payment hatte das nur Strong, Wave-2 traces es als Kill durch) |

### Tests + Build (2 Wave-1 Re-Spawn)

| # | Source | Finding |
|---|---|---|
| K35 | **wave1-06** | `vitest <4.1.0` **CRITICAL CVE-2025** in dev-dep tree (low actual risk — UI server never started in CI, but Compliance-Flag) |
| K36 | **wave1-06** | `apply-dal.ts` + `customers.ts` + `install-requests.ts` + `billing-actions.ts` zero test coverage (Wave-1-Diff says partial; Wave-1-06 confirms Kill for high-risk modules) |

---

## Strong-Highlights (Top-30 von 59)

### Re-Affirms + New Strong-Items

| ID | Domain | Finding | File:Line |
|---|---|---|---|
| S1-S20 | Wave-1 | (siehe `_wave1-synthesis.md` Strong-Liste) | — |
| S21 | **wave2-01** | `addRepo` (`customers.ts:42-89`) `"use server"` no auth + no action-wrapper (Weak in Wave-2 aber pre-launch fix) | `customers.ts:42-89` |
| S22 | **wave2-01** | `listMembers` (`membership.ts:43-65`) `"use server"` returns email+role+invitedBy for any workspaceId | `membership.ts:43-65` |
| S23 | **wave2-01** | `userIsMember()` triple-duplication (drift surface) — Single-helper-refactor needed | DAL global |
| S24 | **wave2-02** | `audit-requested` no atomic transaction → at-least-once retries can double-debit credits | `audit-requested.ts` |
| S25 | **wave2-02** | No `onFailure` handler anywhere → scans stuck `running` forever | All Inngest functions |
| S26 | **wave2-02** | `auto-track-repos` 3 statements outside transaction → orphaned `queued` scans | `auto-track-repos.ts` |
| S27 | **wave2-02** | No `inngest.send({id})` → natural-dedupe bypass (3 send-sites) | 3 files |
| S28 | **wave2-02** | `prepaid-credit-expirer` sends email BEFORE event-row insert → double-send on retry | `prepaid-credit-expirer.ts` |
| S29 | **wave2-02** | `stripe-reconcile` silent `pageCount<50` ceiling (5000 subs) | `stripe-reconcile.ts` |
| S30 | **wave2-03** | 6 missing hot-query indices (worst: `scan (workspace_id, created_at DESC)` — 6 callers) | DB schema |
| S31 | **wave2-03** | Pool-math undercount (60-80 conns realistic vs 32 in Wave-1) | Drizzle config |
| S32 | **wave2-03** | drizzle-kit snapshot drift since 0011 (handwritten 0013/0015) | migrations |
| S33 | **wave2-03** | Stripe-webhook multi-statement updates outside `db.transaction()` | `webhook/route.ts` |
| S34 | **wave2-04** | **Every route renders as `ƒ Dynamic`** — SiteNav cookie chain forces dynamic for every page (`/` `/pricing` `/login` `/legal/*` etc.) | `SiteNav` + `app/layout.tsx:27-31` |
| S35 | **wave2-04** | Lighthouse-CI `"error"` thresholds + `numberOfRuns: 1` → flake-blocker | `.lighthouserc.json` |
| S36 | **wave2-04** | `/status` HEAD-pinging 5+ services on every render (self-DOS-vector) | `app/status/page.tsx` |
| S37 | **wave2-05** | Domain inconsistency (.app / .dev / -ai) across all docs/legal/code | global |
| S38 | **wave2-05** | DPA-Acceptance-Audit-Log undocumented in DSE | DSE-page |
| S39 | **wave2-05** | AVV-Download als PDF fehlt | `/legal/dpa` |
| S40 | **wave2-05** | OSS-Notice/Third-Party-Notices fehlen | global |
| S41 | **wave1-06** | `tmp@0.x` + `hono@4.x` moderate CVEs | `pnpm audit` |
| S42 | **wave1-06** | Integration-tests only run on main-Push (not PRs) | CI workflow |

---

## Bundle-Empfehlung — REVIDIERT (7 Bundles statt 5)

| Bundle | Title | Findings | Effort | Sequenz |
|---|---|---|---|---|
| **A** | Auth-Security + Authz-Helper-Refactor | K1-K13 (13 Kills) + S15 Account-Delete + K21 GDPR-PII-scrub + Authz-Single-Module-Refactor (S23) + K35 vitest-bump + S16 | **7-8 dev-days** | **#1 — first** |
| **B** | Payment-Fix-Block + Inngest-Idempotency | K14 + K15 + K16 (Inngest cross-instance) + K34 (invoice-paid mail + credit-low) + S1-S5 + S24/S28 (Inngest atomicity) + Migration für Idempotency-Index | **5-6 dev-days** | #2 |
| **C** | Production-Infra-Bootstrap | K17 (INNGEST_SIGNING_KEY) + K18 (Sentry) + K19 (Domain+DKIM) + K31/K32 (Resend-Webhook+Suppression-Table) + S6 (vercel.json) + S7 (env-validator) + S30 (DB-hot-indices) + S35 (LHCI thresholds) + S41 (Deps bump) | **6-7 dev-days code + 24h DKIM** | #3 (parallel D, F) |
| **D** | Frontend-Pre-GA-Polish | K22-K24 + S10-S14 + S20 + S34 (SiteNav-Static-Fix) + S36 (status-cache) | **3-4 dev-days** | #3 (parallel C, F) |
| **E** | Stripe-Live-Mode-Bootstrap | KYC + Tax-DE + Live-Bootstrap (sk_live_-fix) + 14 env-swap + Smoke | **2 dev-days code + 1-2 wks KYC** | #4 (after B) |
| **F** | **Legal + DSGVO + Compliance-Pre-GA** | K25-K30 (6 Legal-Kills) + S37 Domain-Konsistenz + S38-S40 + AGB-de-Translation | **2-3 dev-days code + 3-5 days legal-content (Anwalt/Generator)** | #3 (parallel C, D) |
| **G** | **Email-Templates + Deliverability** | K33 (member-invite) + K34 (invoice-paid + credit-low) + List-Unsubscribe + Impressum-Footer + de-DE Locale + Subject-Localization | **2-3 dev-days** | #3 (parallel C, D, F) |

**Critical Path:** A → B → (C ∥ D ∥ F ∥ G parallel) → E → Launch

**Total Engineering:** **24-29 dev-days** = **5-6 Wochen wall-clock**

Plus:
- Stripe-KYC: 1-2 Wochen out-of-band (parallel)
- DKIM-Propagation: 24h
- Legal-Anwalt-Review: 3-5 Tage (parallel zu Engineering)

**Realistischer Launch-Horizont: 6-8 Wochen.**

---

## Report-Pointer

- `wave1-01-audit-diff.md` — Diff vs 2026-05 (15/18 Kills resolved, 0 regressed)
- `wave1-02-payment-stripe-live.md` — Stripe-Audit + 15-Step-Live-Switch-Plan
- `wave1-03-auth-security.md` — OWASP-Map + 10 Auth-Kills + Pre-GA-Checklist
- `wave1-04-prod-infra-vercel.md` — 870 LOC Infra-Audit + 14-day Launch-Sequence
- `wave1-05-frontend-ux.md` — Route-Walkthrough + WCAG-Audit
- `wave1-06-tests-build.md` — Build-Health + Test-Coverage-Matrix + Type-Strictness
- `wave2-01-dal-authorization-matrix.md` — 3 NEW IDORs + Authz-Single-Module-Refactor
- `wave2-02-inngest-cron.md` — 1 NEW Kill (cross-instance) + Idempotency-Audit
- `wave2-03-db-schema-migration.md` — 2 NEW Kills (rootPath + PII-survives-delete) + Pool-Math
- `wave2-04-cache-perf-cwv.md` — SiteNav-Static-Block + LHCI-Threshold-Fix + Top-5-Perf-Wins
- `wave2-05-legal-dsgvo.md` — 6 NEW Kills + AGB/Datenschutz/Impressum-Gaps + AVV-PDF
- `wave2-06-email-resend.md` — 4 NEW Kills + Template-Inventar + Deliverability-Checklist

---

End of Wave-2 Synthesis.
