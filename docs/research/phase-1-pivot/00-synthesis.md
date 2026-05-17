# 00 — Phase-1 Synthesis (A1–A10)

> **Date:** 2026-05-17
> **Inputs:** 10 parallel research agents (`01` through `10` in this folder)
> **Owners:** Kolja Schöpe · Skeptic-Mentor voice · Concession-then-Critique
> **Cascading artifacts:** `docs/roadmap/phase-1.md` + `docs/decisions/0020-phase-1-scope.md`
> **Cumulative cash-out for Phase-0.5:** $0. Phase-1 budget ceiling proposal below.

---

## Executive verdict — Severity: **MID**

Phase 1 is **shippable but not as the PRD currently describes it**. Three factual corrections to the PRD landed in the research; one ADR-watch-status changed; two cost-estimates were under by ~40%. None of that re-opens ADR-0017 or ADR-0018, but all of it goes into ADR-0020 with explicit corrections so we don't carry stale numbers into M3.

**Concession:** The Phase-0.5 code base (Sprints 0.11–0.14, 4 commits, $0 cash-out) is structurally ahead of the typical pre-seed dev-tool. shadcn migration + auto-tracking + freemium + onboarding + tester templates all shipped. The /trust v0.0.14 page genuinely outclasses $19/mo competitors' Day-1 posture (A1, A6).

**Critique:** The next quarter is **paperwork-bound, not code-bound**. The wall-clock gating factor between us and live revenue is a German Gewerbeanmeldung (A3) + a 5-LOI agency gate (A4), not features. Anyone reading the existing PRD §11 and budgeting $5k for "AAIF" is about to spend the wrong $10k on the wrong foundation (A7 — load-bearing finding #1).

---

## 5 load-bearing findings

### Finding #1 — PRD §11 names the wrong partner program — **Kill**

PRD §11 line-item *"AAIF (Anthropic AI Inference Forum) Silver-Membership $5k/yr targeted for Phase 1"* is factually wrong on three axes:

- **AAIF = Agentic AI Foundation** (Linux Foundation, founded 2025-12-09 with Anthropic + OpenAI + Google as joint Platinum members) — **not Anthropic-owned**.
- **Silver costs $10k/yr, not $5k**, and requires Linux-Foundation-Silver as a prerequisite ([Linux Foundation Press 2025-12-09](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation); [Superagentic Blog 2025-12](https://shashikantjagtap.net/agentic-ai-foundation-where-open-innovations-meet-closed-governance-and-a-platinum-paywall/)).
- **The real Anthropic vehicle is the Claude Partner Network**, launched 2026-03-12, $100M fund, **$0 entry cost** ([Anthropic 2026-03-12](https://www.anthropic.com/news/claude-partner-network)).

**Decision (A7):** NO on AAIF $5k. GO on CPN at M3 after Kolja earns the free Claude Certified Architect credential. Saves $10k vs the planning artifact. Goes into ADR-0020.

### Finding #2 — GitHub-App Day-1-Mitigations cost is ~40% over PRD — **Mid**

PRD §6.4 quotes 9–12 PD. Realistic A1 estimate: **14–17 PD** for production-acceptable, **8–10 PD** for Phase-0-Gate-acceptable. Breakdown:

| Mitigation | PRD | Realistic | Current state |
|---|---|---|---|
| DPA-Template + signed-acceptance flow | 2 PD | 4–5 PD | Markdown draft only, no e-sign rail or audit-log |
| Trust-Center page | 1 PD | 1 PD ✅ | Shipped v0.0.14, missing sub-processor RSS feed |
| Requester→Approver-Bridge | 3–5 PD | 6–8 PD | In-app honor system only; GitHub webhook reconciliation missing |
| Read-Only-Default | 1 PD | 3 PD | Manifest pinning + enforcement-test not done |
| **Total** | **9–12** | **14–17** | |

**Minimal Sprint 1.0 slice (A1):** 5.5 PD — scope-pinned manifest + webhook reconciliation + DPA acceptance gate + sub-processor changelog feed. Everything else moves to Sprint 1.1–1.3.

### Finding #3 — GDPR §201 StGB consent gap in Mom-Test v1 — **Kill**

v1's *"Tell them you're recording. Don't ask permission post-hoc"* is **criminally exposed** under DACH §201 StGB and GDPR Art. 6(1)(a) ([§201 StGB](https://www.gesetze-im-internet.de/stgb/__201.html)). Must fix before any DACH interview ships (A9). Mitigation:

- Bilingual DE/EN explicit-prior-consent template (A9 §4 — verbatim block).
- Recording stack: **Zoom-local + whisper.cpp (M-series Mac)** — $0, fully local, no sub-processor on `/trust`, 30 min transcribes in ~3 min.
- 24h audio deletion + 12-month transcript cap policy.

### Finding #4 — ADR-0018 Trigger #2 reclassified 🟢 → 🟡 amber — **Mid**

A6 confirms: Anthropic's Claude Partner Network (2026-03-12) **does NOT fire ADR-0018 Trigger #2** by the letter (it's a free training/co-sell program, not a multi-tenant agent-file-inventory product). **But:** Anthropic now owns the "enterprise rolls out Claude through a partner" narrative. Watch **monthly**, not quarterly. Trigger fires immediately if Anthropic ships a product surface with any multi-customer-inventory feature.

Bonus signal: **IBM `mcp-context-forge` exists** ([github.com/IBM/mcp-context-forge](https://github.com/IBM/mcp-context-forge)) — naming-collision risk for our productized-form. M8 lawyer-check (PRD §11) must factor in IBM trademark.

3 new direct competitors (AgentLint, AgentLinter, agents-lint) are all single-tenant OSS-CLI. Our multi-tenant + hosted-SaaS + cross-vendor differentiation holds. grekt-labs/dashboard frozen 9 weeks (clear-air holds).

### Finding #5 — Stripe go-live is paperwork-bound, not code-bound — **Mid**

A3 verdict: code is 95% ready (`route.ts:64–71` is correct, test↔live signing identical). Three Kill-band blockers, **all non-code**:

1. **DACH KYC activation** — Steuer-ID + USt-IdNr. + Gewerbeanmeldung. 1–3 business days clean. Founder hasn't logged into Stripe Dashboard once.
2. **Stripe Tax** — only sane EU-VAT/OSS/§13b reverse-charge path at our volume (~0.5% fee).
3. **PCI SAQ-A self-attestation** — 22 questions auto-generated by Dashboard once activation completes.

Mid-band do-once: nightly Inngest reconciliation job + in-app `past_due` banner. Weak-band: Radar default is sufficient sub-1k customers; IP-allowlist not needed (signature + PK is best-practice).

---

## Pricing tweaks (A5) — **Mid**

Current 5-tier ladder is structurally defensible vs 2026 comps (Cursor $20, Sentry $26/dev, Snyk $25/dev, Vercel $20). Three explicit deltas — no $99 sandwich, no price-cut:

1. **Solo Indie $19 → $25** — matches Sentry/Snyk parity, signals "professional-grade", still under psychological $29 ceiling.
2. **Add Agency-Scale-Plus $1,499–1,999/mo annual-only** — absorbs M3–M9 LOI-conversions without "call sales" friction. Today's $799 × 12 = $9.6k ARR ceiling sits below the documented Sprint-to-Hosted $45k–108k Cash band in PRD §11.
3. **20% annual discount default** — matches Linear/Cursor PLG-leader playbook ([Linear pricing](https://linear.app/pricing), [Cursor pricing](https://cursor.com/pricing)).
4. **EU geo-IP → VAT-inclusive pricing display** — +12% conversion ([Price Intelligently 2025](https://www.profitwell.com/blog/saas-pricing-tactics)).
5. **Collapse audits-quota to "fair-use" copy** on public pricing page — kill the 3-dimensional sales conversation; keep repos+seats as headline gates.

KEEP Free / Solo Pro $79 / Agency Pro $299 / Agency Scale $799 unchanged.

---

## LLM Eval (A2) — **Strong path, Mid effort**

**Sprint 1.0 ship-line:** 30 manifest entries + 12 conflict-pairs + CI-gate failing on FPR > 15% **or** missing manifest entry.

- **9 entries to add:** 4 real-world (`real-aider-conf-mix`, `real-multi-vendor-monorepo`, `real-windsurf-cline-coexist`, `real-anthropic-skills-import`) + 3 LLM-adversarial (`adv-conflict-bait-true / -paraphrase / -style-only`) + 2 dogfood (`packages/llm`, `docs/research/`).
- **FP-instrumentation:** per-confidence-band (low / mid / high) + N=3 variance + persist to `eval/conflicts/results/YYYY-MM-DD.json`.
- **Anthropic Batch API:** worth it only for nightly full-set re-eval (50% discount, 24h SLA). Skip for inner-loop iteration.
- **promptfoo demoted:** keep `eval/conflicts/run.ts` canonical; `promptfoo.yaml` becomes a Sprint-1.1 prompt-A/B harness.

Cost to flip: ~$5–15 for an initial real eval pass on Anthropic Sonnet-4-6 (Constraint #14: never claim Multi-Model-Compare without the eval).

---

## GTM cadence (A4 + A8 + A10) — **Mid, Solo-Capacity Bound**

**Channel priority for the 5-LOI gate (A4):**
1. **Warm-intros** (Twitter mutuals / podcast guests / ex-colleagues) — 30 personalized asks → ~2–3 LOIs. Strong.
2. **Anthropic Claude Partner Network** — $0 entry, $100M fund, Munich office — ~1–2 LOIs. Mid.
3. **Conferences DACH** — MLcon Munich 22–26 Jun, AI & Data Summit Berlin 22–23 Sep — ~1–2 LOIs. Mid.
4. **Build-in-Public organic** — ~0–2 inbound. Weak (long-tail).
5. **Cold-email KI-Bundesverband** — ~0–1 LOI. Weak.

**Realistic gate-math:** 4–10 LOIs, Median 5–6. **Erreichbar, nicht überkomfortabel.**

**Outreach cadence (A10):** 4-touch on 1-4-8-15 calendar, **hard cap 25 cold-sends/week** (~13.5 h founder budget). Calendly in touch #2 only (link in #1 drops reply ~12%). Linear CRM-lite (already in stack). Brian-Hess double-opt-in for warm.

**BiP cadence (A8):** Twitter `@kolja_schoepe` threads + Substack 1×/wk Thursday + Show-HN one-shot Sprint 1.3. LinkedIn 2×/wk Mid (Agency-CTO surface, not volume). 4-week posting calendar in A8 file.

**Mom-Test interview templates (A9):** v1's 5-stem skeleton (Walk-Through → Before → Substitute → Cost → After) retained; trigger-verbs flip per persona. Load-bearing flip is Q4 (Indies measure hours, Agencies measure **engagement-margin %**). Triage YAML schema in `interviews/<slug>.md`.

---

## Sprint-1.0 recommendation — **Code half: GH-App Mitigations slice**

Default Sprint 1.0 = **5.5 PD code + parallel paperwork-track**:

| Track | Owner | Effort | Deliverable |
|---|---|---|---|
| **Code** (A1 minimal slice) | Claude | 5.5 PD | (a) `@vk/github-app` manifest pinned to `contents:read`+`pull_requests:read`, write-token gated on `repo.writeAccessGranted=true`. (b) GitHub-webhook reconciliation: `installation` / `installation_repositories` events flip `installRequest.status`. (c) DPA acceptance-gate UI + audit-log in new `dpa_acceptance` table. (d) Sub-processor RSS/JSON changelog feed served at `/trust/sub-processors.json`. |
| **Eval** (A2 slice) | Claude | 1 PD | 9-entry manifest patch lands; FP-instrumentation extends `eval/conflicts/run.ts` (per-confidence-band + N=3); CI gate fails on FPR > 15%. |
| **Paperwork** (A3 + A4 + A7) | Kolja | parallel | (i) Gewerbeanmeldung (if not done) → Stripe activation via Dashboard. (ii) Claude Certified Architect course (free, ~6 h) → CPN application. (iii) Mom-Test consent-script update (A9 verbatim) → first 5 indie warm-intros. |
| **PRD-correction** | Claude | 0.5 PD | Update PRD §11 (AAIF → CPN), append "GH-App-mitigations realistic-cost-revised" footnote, link ADR-0020. |
| **Total** | | **7 PD code** | + ~3–5 paperwork-hours/week parallel |

**Cash-out:** $0 (CPN $0, Mom-Test stack $0, code $0). Anthropic eval-pass deferred until founder flips `ANTHROPIC_API_KEY` after CCA cert (estimated $5–15 for first 30-entry pass).

---

## What Phase 1 explicitly does NOT do (the honest part)

- **No AAIF $10k spend** (PRD §11 corrected via ADR-0020).
- **No full GH-App live registration in Sprint 1.0** — manifest + reconciliation ships; live App-ID registration follows after the DPA acceptance-rail + Customer-Admin UI lands (Sprint 1.1–1.3).
- **No LinkedIn / Instagram DM-Automation** (PRD #3 reaffirmed).
- **No Cold-Outreach for sub-$799 tiers** (PRD #3.1 reaffirmed).
- **No re-open of ADR-0017 or ADR-0018** today. ADR-0018 Trigger #2 moves to monthly watch.
- **No real-money Stripe charges** until DACH KYC + Stripe Tax + SAQ-A complete (parallel paperwork, not blocking Sprint 1.0 code).
- **No README screenshots / no marketing copy** without explicit User-Request (PRD do-not list).

---

## Risk register (re-scan)

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| 5-LOI gate slips past M3 | Mid | High | Warm-intro-first channel-mix (A4). Conferences (MLcon Jun) as acceleration. |
| Anthropic ships Claude-for-Agencies SKU | Low–Mid | High | Monthly watch (A6). ADR-0018 Trigger #2 amber. |
| IBM mcp-context-forge naming collision blocks "Sondr+Pondera" rebrand | Low | Mid | M8 lawyer-check budget (PRD existing) factors in IBM trademark search. |
| Stripe activation rejected (KYC mismatch) | Low | Mid | A3 §1: Gewerbeanmeldung clean = 1–3 days; 7 days if address-proof mismatch. |
| Founder burnout from cold-email cap | Mid | Mid | 25/week hard cap (A10); 13.5 h budget; conference-FtF substitutes 2 weeks of cold. |
| LLM eval FPR > 15% on Anthropic Sonnet-4-6 | Low | High | N=3 variance + per-band reporting (A2). Confidence-Banding `mid+` default. |

---

## Status of Phase-0-Gate criteria (entry condition for Phase 1)

| # | Criterion | Status | Phase-1-blocker? |
|---|---|---|---|
| 1 | 20 Indie Mom-Test interviews | 0 / 20 | YES |
| 2 | 10 Agency Discovery interviews | 0 / 10 | YES |
| 3 | 5 Agency LOIs signed | 0 / 5 | **YES (load-bearing)** |
| 4 | OSS v0.1 runnable | ✅ 1.0 | no |
| 5 | Parser MUST-5 | ✅ | no |
| 6 | GH-App Day-1-Mitigations | 1 / 4 | Sprint 1.0 code-track |
| 7 | 30-File-Golden-Set | 21 / 30 | Sprint 1.0 eval-track |
| 8 | Validation Handbook v0 chapters | ✅ 8 / 8 (skeleton) | no |
| 9 | Operations Playbook v0 chapters | ✅ 2 / 2 | no |

**The commercial Phase 1 starts when 1+2+3 land.** Sprint 1.0 code can ship in parallel — it accelerates 3 (LOI conversations land cleaner with a DPA acceptance UI to point at).

---

## Decision matrix → ADR-0020

ADR-0020 will lock:

1. **NO AAIF $5k/$10k spend.** GO CPN $0 at M3 after CCA cert.
2. **Pricing tweaks:** Solo Indie $19 → $25; Agency-Scale-Plus $1,499/mo annual-only; 20% annual default; EU VAT-inclusive display.
3. **GH-App mitigations revised cost-budget:** 14–17 PD (production), 5.5 PD (Sprint-1.0-minimal slice).
4. **Mom-Test recording stack:** Zoom-local + whisper.cpp + bilingual DE/EN consent (no sub-processor; GDPR-trivially-clean).
5. **Sprint 1.0 dual-track:** code (7 PD) + paperwork-parallel (~3–5 h/wk).
6. **Watch-list upgrades:** ADR-0018 Trigger #2 monthly (was quarterly). IBM trademark factored into M8 lawyer-prep.

---

*Synthesis status: complete. Phase-1 roadmap follows in `docs/roadmap/phase-1.md`. ADR-0020 formalizes the locking decisions.*
