# Phase 1 — M3 → M9 Roadmap

> **Owner:** Kolja Schöpe
> **Date:** 2026-05-17
> **Predecessor:** `docs/roadmap/phase-0.5-dashboard.md` (closed 2026-05-17, Sprint 0.14)
> **Locking ADR:** `docs/decisions/0020-phase-1-scope.md`
> **Synthesis source:** `docs/research/phase-1-pivot/00-synthesis.md`

> **Voice:** Skeptic-Mentor + Concession-then-Critique. Severity-bänder {Kill, Weak, Mid, Strong, Exceptional} only — no numeric scores.

---

## Phase-1 frame

**Window:** M3 → M9 (~24 calendar weeks ≈ 12 two-week sprints).

**Capacity:** Solo, 25 h/week sustained. Real cap = 22 h after BiP / interview slots.

**Cash-out ceiling:** $500 cumulative (Stripe Tax ~$150/mo from first charge; Anthropic eval-pass ~$15; domain $12; Vercel Pro $20/mo from Sprint 1.3 if needed). **No AAIF $10k spend.**

**Gate to enter Phase 1 commercially:** 5 Agency LOIs + 20 Indie Mom-Tests + 10 Agency Discovery interviews (PRD §6.5 — gate-status table in `00-synthesis.md`). Sprint 1.0 code-track and the gate-clearing GTM-track run **in parallel** — the code accelerates LOI conversations, the LOIs validate the code direction.

**End-state (M9):** ≥ 8 paying engagements (mix of Validation-Sprint + Agency-Operations-Sprint), $45k–108k cash, Stripe live-mode green, GitHub-App registered + Day-1-Mitigations all 4 production-acceptable, 30/30 golden-set with FPR ≤ 15% audited monthly, CPN Technology-Partner status active.

---

## Sprint structure

Each Phase-1 sprint is a 2-week cycle. Tracks per sprint:

- **Code track** — engineering deliverables, owner = Claude/Kolja, measurable in `pnpm build` + `vitest` + eval.
- **Commercial track** — interviews, LOI conversations, BiP cadence, Stripe-paperwork. Owner = Kolja only.
- **Watch-list** — explicit re-scan of ADR-0017 + ADR-0018 triggers (monthly cadence per A6).

---

## Phase outcome (end of Sprint 1.12 / M9)

Demo-able to the first paying $799 Agency-Scale customer:

- Sign-up via Magic-Link → CCA-cert-badge visible on `/trust` → DPA accept-flow with audit-log → GitHub-App install with read-only-default → first cross-customer-audit lands in <90s → drift detected against canonical → severity-banded patch generated → patch downloaded + applied via `git apply` on customer-side.
- Stripe-Live charge for $1,499 Agency-Scale-Plus annual (~$17,988 ACV) processed via Checkout → portal returns customer to `/billing` with `tier = agency_scale_plus, status = active`.
- 30-file golden-set + nightly FP-rate eval on Anthropic Sonnet-4-6 ≤ 15% — published at `/trust/eval-results.json`.
- CPN Preferred-Directory listing active. 1 Anthropic Skill (`validationkit-agent-file-audit`) submitted via Skills-Marketplace.

**What end-of-Phase-1 explicitly CANNOT do:**
- LLM-augmented fixes for `context-bloat` (deferred to Phase 2).
- Self-serve Agency-Scale-Plus checkout without sales-assist (annual-only, MSA-required).
- Multi-region failover (EU-only Vercel deployment until $30k MRR in Phase 2).
- White-label / custom-domain (Agency-Scale-Plus tier waitlist for Phase 2).

---

## Sprint-by-Sprint (M3 → M9)

### Sprint 1.0 — GitHub-App Mitigations Slice + LLM-Eval Floor (Week 1–2)

**Goal:** Ship the 5.5-PD GH-App-mitigations slice (A1 §1) + the eval-floor (A2 §2). Unblock LOI conversations with a DPA-acceptance UI to point at.

| Track | Task | Effort | Deliverable |
|---|---|---|---|
| Code | Manifest pinned to `contents:read`+`pull_requests:read`, write-token gated on `repo.writeAccessGranted=true` | 1 PD | `@vk/github-app/manifest.ts` constants + test |
| Code | GitHub-webhook reconciliation: `installation` / `installation_repositories` events flip `installRequest.status` | 2 PD | `apps/web/src/app/api/install-webhook/route.ts` extended; `webhook_event` table populated |
| Code | DPA acceptance-gate UI + audit-log | 1.5 PD | New `dpa_acceptance` table, `/trust/dpa` page, signed-acceptance flow with `accept_action.ts` server action |
| Code | Sub-processor RSS/JSON changelog feed | 1 PD | `/trust/sub-processors.json` + `/trust/sub-processors.xml` |
| Eval | 9 missing manifest entries (4 real-world + 3 LLM-adversarial + 2 dogfood) | 0.5 PD | `eval/golden-set/manifest.json` → 30 entries |
| Eval | FP-instrumentation: per-confidence-band + N=3 + persist `eval/conflicts/results/YYYY-MM-DD.json` | 1 PD | CI fails on FPR > 15% at `mid` band |
| PRD | Update PRD §11 (AAIF → CPN), append GH-App revised-cost footnote, link ADR-0020 | 0.5 PD | `docs/PRD.md` patched |
| Paperwork | Gewerbeanmeldung (if not filed) → Stripe Dashboard activation | parallel | Stripe-account state = `activated` |
| Paperwork | CCA-course enrollment + module 1–4 (free, ~6h total) | parallel | Cert-credential visible on Kolja's profile |
| Commercial | First 5 indie warm-intros sent (Brian-Hess pattern) | parallel | 5 issues in Linear with `t1-sent` label |
| Commercial | 1 Substack post draft published (3-number framing from Sprint 0.14) | parallel | Substack-post live |

**DoD (Sprint 1.0):**
- `pnpm typecheck && pnpm test && pnpm eval && pnpm build` all green
- 30/30 golden-set entries, FP-instrumentation extended (skipped only if `ANTHROPIC_API_KEY` unset — graceful)
- `/trust/dpa` page rendered, DPA acceptance audited, sub-processor feed served
- `installation` webhook lands in `webhook_event`, flips `installRequest.status` deterministically
- ADR-0020 committed, PRD §11 patched
- Stripe Dashboard: founder logged in, KYC submitted (or scheduled within ≤ 7 calendar days)
- ≥ 5 warm-intro emails sent

---

### Sprint 1.1 — Stripe Live-Mode + Pricing Update (Week 3–4)

**Goal:** Flip Stripe to live-mode. Roll out pricing-changes from A5. Activate first paid checkout (test → live).

| Track | Task | Effort | Deliverable |
|---|---|---|---|
| Code | Pricing update: Solo Indie $19 → $25; add Agency-Scale-Plus $1,499/mo annual-only | 0.5 PD | `packages/billing/src/tiers.ts` patched, migration `0006_pricing_update.sql` |
| Code | 20% annual-discount default in Checkout | 0.5 PD | `apps/web/src/lib/billing-actions.ts` adds `billing_cycle: 'annual' \| 'monthly'` param, Stripe price-lookup by suffix |
| Code | EU geo-IP → VAT-inclusive pricing display on `/billing` | 1 PD | Vercel `request.geo.country` → toggle inclusive/exclusive |
| Code | Nightly Inngest reconciliation job: paginate `stripe.subscriptions.list({status:'all'})`, log drift to `event` table | 1 PD | `packages/inngest/src/functions/stripe-reconcile.ts` cron `0 3 * * *` |
| Code | In-app `past_due` banner in dashboard header | 0.5 PD | `DashboardHeader` conditional |
| Paperwork | Stripe Tax enabled in Dashboard; `automatic_tax: true` in checkout-session-create | parallel | First test-mode checkout shows VAT line |
| Paperwork | PCI SAQ-A: download from Dashboard, sign, upload back | parallel | SAQ-A-signed = yes |
| Paperwork | OSS-registration at Bundeszentralamt für Steuern (one-shot after first EU-cross-border test sale) | parallel | OSS-Nummer received |
| Commercial | 10 more warm-intros + first 3 cold-emails (4-touch 1-4-8-15 cadence per A10) | parallel | Linear pipeline = 15 leads |
| Commercial | Substack post #2 (Phase-0.5 retro public) | parallel | Live |
| Commercial | Twitter thread #1 (Cross-Vendor-Wedge concession-critique) | parallel | Live |

**DoD (Sprint 1.1):**
- Live-mode test charge with German VAT line on a tester-card succeeds end-to-end
- Stripe Dashboard: KYC = activated, Tax = on, SAQ-A = signed
- Pricing page reflects new ladder
- Inngest reconciliation job ran once green
- ≥ 1 LOI conversation in progress (Stage 2: post-discovery-call)

---

### Sprint 1.2 — Customer-Admin Approver UI + Drift Patches (Week 5–6)

**Goal:** Complete the Requester→Approver-Bridge so a Customer-Admin can approve install-requests inside the app. Ship LLM-augmented `context-bloat` fix-suggestion (gated by `includeLLM`, defaults off).

| Track | Task | Effort | Deliverable |
|---|---|---|---|
| Code | `roles` table + `member.role ∈ {owner, admin, member}` | 1 PD | Drizzle migration, RBAC on `install_request` decide actions |
| Code | `/customers/[id]/access` UI: Admin-list + invite Admin via email | 1.5 PD | Magic-link invite reuses Better-Auth flow |
| Code | Admin-decide install-request server-action with approval-audit | 1 PD | New `install_decision` table |
| Code | LLM context-bloat fix-suggestion (Anthropic Sonnet-4-6, gated on `includeLLM: true` + key set) | 2 PD | `@vk/fixes/context-bloat-llm.ts` returns suggestion + diff; UI shows confidence band |
| Eval | Add 4 `context-bloat-llm` golden-set entries with ground-truth diffs | 0.5 PD | Manifest → 34 entries |
| Commercial | ≥ 3 Agency Discovery interviews conducted | parallel | `interviews/2026-MM-DD-XX-agency.md` × 3 |
| Commercial | LinkedIn long-form post #1 + Substack post #3 | parallel | Live |

**DoD (Sprint 1.2):**
- A Customer-Admin can approve an install-request inside `/customers/[id]/access`; the decision lands in `install_decision` with timestamp + actor.
- `pnpm eval` includes context-bloat-llm cases (skipped without key, gated with golden-set).
- ≥ 3 Agency-Discovery interviews transcribed with consent-audio + triage.md.
- 2 LOI conversations in Stage 3 (post-pricing-anchor).

---

### Sprint 1.3 — OSS v0.1 Public + Show-HN Launch (Week 7–8)

**Goal:** Publish OSS v0.1.0 to GitHub + npm. Ship public Hosted-Web-App-Public-Beta. **One-shot Show HN** on Tuesday or Wednesday 14–17 UTC (A8).

| Track | Task | Effort | Deliverable |
|---|---|---|---|
| Code | OSS-readiness sweep: LICENSE check, security.md, contributing.md, npm package `validationkit-cli` first publish | 2 PD | `@vk/cli` 0.1.0 on npm |
| Code | `apps/web/` Hosted-Beta launch: rate-limit anonymous-audit (30/h IP), error-boundary polish | 1 PD | Production-grade limits |
| Code | Public-pricing-page `/pricing` (separate from `/billing` which is signed-in) | 1 PD | shadcn-styled tier-grid + FAQ |
| Code | Status-page `/status` (Vercel + Neon + Inngest + Resend health pings) | 1 PD | Simple uptime check, no Statuspage.io sub |
| Commercial | **Show HN** posted Tuesday 14 UTC + founder-replies <90 min to top-50 comments | parallel | HN-post live; metrics captured |
| Commercial | IndieHackers milestone post ("Phase 0.5 in 4 sprints, $0 spend") | parallel | Live |
| Commercial | First podcast guesting-pitch (warm-intro) | parallel | 1 pitch sent |
| Commercial | First LOI signed (if pipeline allows) | parallel | LOI #1 in `docs/legal/lois-signed/` (gitignored) |

**DoD (Sprint 1.3):**
- `npm install -g validationkit-cli` works; `validationkit audit .` runs against current dir
- `/pricing`, `/status` live, no console errors
- Show HN ≥ 50 upvotes within 4 h (telemetry: TwitterX-Bookmark, Plausible analytics)
- ≥ 1 inbound LOI conversation from HN/Twitter/Substack
- Sprint-1.3 retro published as Substack post #5

---

### Sprint 1.4 — CPN Application + Skills-Marketplace Submission (Week 9–10)

**Goal:** Submit Claude Partner Network application as Technology-Partner. Submit first Anthropic Skill (`validationkit-pre-build-validation` or `validationkit-agent-file-audit`).

| Track | Task | Effort | Deliverable |
|---|---|---|---|
| Code | First Anthropic Skill packaged + tested | 2 PD | `validationkit-agent-file-audit` Skill + README + manifest.json |
| Code | `@vk/cli` Skill-runner mode (skill-discoverable from `~/.config/anthropic/skills/`) | 1 PD | `validationkit-cli --as-skill` |
| Code | `/skill-marketplace` page (lists shipped Skills, install-instructions) | 0.5 PD | shadcn-styled |
| Code | API rate-limit hardening for paid-tier vs anonymous (currently no auth gating on /api/audit-trail) | 1 PD | Tier-aware rate-limit middleware |
| Paperwork | Claude Certified Architect cert completed (module 1–8) | parallel | Cert ID added to CPN application |
| Paperwork | CPN Technology-Partner application submitted via Anthropic Skilljar | parallel | Application = submitted; 60-day onboarding clock starts |
| Commercial | Submit Skill to `anthropics/skills` GitHub repo via PR | parallel | PR open |
| Commercial | LOIs #2 + #3 in progress | parallel | Linear pipeline = 2 LOIs in Stage 3 |

**DoD (Sprint 1.4):**
- CPN application = submitted with proof-of-live-deployment + CCA cert ID
- `validationkit-agent-file-audit` Skill works from a fresh Claude Code install (test on Kolja's M-series Mac)
- ≥ 2 LOIs in Stage 3, ≥ 1 signed (LOI #1)

---

### Sprint 1.5 — Mom-Test Synthesis + Agency-LOI Push (Week 11–12)

**Goal:** Halfway through Phase 1: M3-Gate check-in. Synthesize 10–15 indie + 4–6 agency interviews into a Mom-Test-findings ADR. Push for LOI #2, #3, #4.

| Track | Task | Effort | Deliverable |
|---|---|---|---|
| Code | Audit-rule tuning based on Mom-Test pain-points surfaced (e.g. new finding category if 3+ interviews flagged same thing) | 1.5 PD | Possibly new rule `unknown-agent-vendor` or `cross-vendor-config-conflict` |
| Code | Customer-facing eval-results page `/trust/eval` (publishes Sprint 1.0 FP-rate over time) | 0.5 PD | Charts from `eval/conflicts/results/*.json` |
| Code | Compliance Frame customer onboarding-doc page (markdown-from-template, `/docs/customer-onboarding/[customer]`) | 1 PD | Per-customer DPA-acceptance landing page |
| Commercial | Mom-Test synthesis ADR: `docs/decisions/0021-mom-test-pivot.md` (or NO-PIVOT-ADR) | parallel | Decision documented |
| Commercial | LOI #2 + #3 + #4 push: 3 demo-calls scheduled | parallel | Linear pipeline = 3 LOIs in Stage 3, 1 signed |
| Commercial | Conference: AI & Data Summit Berlin prep (22–23 Sep) | parallel | Booth-or-attendee strategy decided |

**DoD (Sprint 1.5):**
- ADR-0021 (or equivalent) published documenting Mom-Test learnings + pivots/no-pivots
- ≥ 4 LOIs signed (gate path: 3 + 1 in Sprint 1.5 = 4 of 5)
- `/trust/eval` live with at least 4 weeks of FP-rate data

---

### Sprint 1.6 — Gate-Check + Production Hardening (Week 13–14)

**Goal:** **M3-Gate Check-In.** If 5 LOIs + 20 Indie + 10 Agency interviews → Phase-1-commercial-go. If not → ADR-0018 re-evaluation triggered, scope correction.

| Track | Task | Effort | Deliverable |
|---|---|---|---|
| Gate | M3-Gate audit: count LOIs (must be ≥5), interviews (Indie 20+, Agency 10+), publish `docs/status/m3-gate-audit.md` | 1 PD | Audit complete |
| Code | (if gate passes) Production-hardening: error-budget, on-call playbook, P0 / P1 / P2 severity definitions | 2 PD | `docs/playbook/05-incident-response.md` + Sentry/PostHog (free-tier) instrumentation |
| Code | (if gate passes) Backup automation: nightly Neon-DB dump → R2/S3 (Cloudflare R2 free-tier 10GB) | 1 PD | `packages/inngest/src/functions/db-backup.ts` |
| Code | (if gate fails) ADR-0022 scope-correction: which workstream paused, which doubled-down | 1 PD | ADR-0022 |
| Commercial | (if gate passes) LOI #5 push + Agency #1 onboarding-kickoff | parallel | First paying Agency on Agency-Pro $299 tier |

**DoD (Sprint 1.6):**
- M3-Gate-audit published — explicit GO / NO-GO
- (if GO) Sprint 1.7 — 1.12 plan refined in this doc's tail section
- (if NO-GO) ADR-0022 scope-correction lands; Phase-1 timeline shifted

---

### Sprint 1.7 → 1.12 (Week 15–24, M6–M9)

**Goal:** **Convert.** Onboard 4–6 paying Agency customers. Ship per-customer-request engineering. Refine pricing + GTM with real-customer data.

Detailed sprints to be written **after** the M3-Gate-audit (Sprint 1.6). Current planning placeholders:

| Sprint | Theme | Anchor deliverable |
|---|---|---|
| 1.7 | First Agency-Pro $299 customer onboarding | Custom-DPA, ≥1 customer-repo audited, drift-tracking active |
| 1.8 | Multi-customer cockpit polish | Aggregated finding-rate dashboard, customer-portal-style filtering |
| 1.9 | First Agency-Scale $799 conversion | 5-seat invitation flow, audit-trail-export for compliance customer |
| 1.10 | Custom Skill ship + Anthropic co-marketing post | Co-published case-study with Anthropic Marketing |
| 1.11 | First Agency-Scale-Plus $1,499 annual signed | MSA-required flow, sales-assisted checkout |
| 1.12 | Phase-1 retro + Phase-2 PRD draft | `docs/research/phase-2-pivot/` 10-agent research kickoff |

**Cumulative Phase-1 KPI targets (M9):**
- ≥ 8 paying engagements (mix of all 4 paid tiers)
- $45k–108k cash (PRD §11 band)
- ≥ 30/30 golden-set with stable FPR ≤ 15%
- CPN Technology-Partner = approved
- ≥ 1 Anthropic Skill featured in Skills-Marketplace (gated by CPN approval)
- ≥ 3 case-study customers willing to be named publicly

---

## Cross-sprint guardrails

### What stays unchanged across Phase 1

- Severity-bänder {Kill, Weak, Mid, Strong, Exceptional} — never numeric scores (PRD #5)
- Citation-first — every audit/drift finding shows file:line + line number (PRD #2)
- Skeptic-Mentor voice — every copy + email + empty state passes Concession-then-Critique (PRD #7)
- Deterministic-first audit (5/6 categories) — LLM-augmented stays opt-in + golden-set-gated (PRD #13)
- Read-only-default for any external resource (GH App: code ships, live registration gates on customer write-grant) (PRD #14, ADR-0018 §14)
- **NO LinkedIn / Instagram DM-Automation, ever** (PRD #3)
- **NO cold-outreach for sub-$799 tiers** (PRD #3.1)
- **NO real charges before Stripe Tax + SAQ-A + KYC complete** (A3)
- **NO MM-Direct-Entry without 3-Trigger-Erfüllung** (PRD #11.3)
- **NO Pure-MM-Pivot-Re-Open without ADR-0017 Re-Run** (PRD #9)
- **NO Voller-Replacement-Pivot without ADR-0018 Re-Run** (PRD constraint #11)
- **NO real-money revenue without Mom-Test consent-script update** (A9 finding #3)

### Pre-commit checklist for every PR

- [ ] `pnpm vitest run` green
- [ ] `pnpm eval` green (≥ 30/30 golden-set after Sprint 1.0)
- [ ] `pnpm typecheck` green for changed packages
- [ ] `pnpm build` green
- [ ] If touching `/billing`, `/api/stripe/*`, `@vk/billing`: webhook idempotency test passes
- [ ] If touching `@vk/llm`: FP-rate eval passes (skipped only without key; CI logs the skip)
- [ ] CHANGELOG + STATUS updated
- [ ] If new external sub-processor introduced: added to `/trust/sub-processors.json`

### Monthly watch-list re-scan (per A6)

Every 4th Friday:
- `/compete-check` command run
- ADR-0017 + ADR-0018 trigger-status checked
- Anthropic Partner Network roadmap re-read (specifically: "any product surface with multi-customer-inventory feature")
- IBM mcp-context-forge / Microsoft agent-forge / AgentLint / Preuve.ai Radar scoped for delta

---

## Phase-1 → Phase-2 handoff conditions

Phase 2 (M9–M18) opens when:
- ≥ 5 paying Agency-Pro+ customers retained ≥ 90 days
- ≥ $5k MRR sustained 30+ days
- LLM-FP-rate ≤ 15% audited monthly with persisted history
- CPN approval received
- All 4 GH-App Day-1-Mitigations production-acceptable (not gate-acceptable)

If any of those slip past M9, ADR-0023 documents the M9-status-correction and shifts Phase 2 right. Solo-constraint per PRD #9 forbids hiring before M18 regardless.

---

*Roadmap status: drafted from `00-synthesis.md`. ADR-0020 formalizes the locking decisions. Refine Sprint 1.7–1.12 after Sprint 1.6 M3-Gate-audit.*
