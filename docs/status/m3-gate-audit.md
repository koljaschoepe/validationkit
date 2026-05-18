# M3-Gate Audit

> **Verdict: NO-GO.** Commercial criteria 0/3 met. Technical criteria 7/7 met.
> **Date:** 2026-05-18 (Sprint 1.6, Phase 1 W6 stand-in for the formal M3 audit window).
> **Auditor:** Kolja Schöpe + Claude (per `docs/roadmap/phase-1.md` Sprint 1.6 DoD).
> **Lock-doc:** [ADR-0022 — scope-correction](../decisions/0022-m3-gate-fail-scope-correction.md).

---

## Audit summary

| # | Criterion | Target | Current | Status |
|---|---|---|---|---|
| 1 | Indie Mom-Test interviews transcribed | 20 | **0** | ❌ Fail |
| 2 | Agency Discovery interviews transcribed | 10 | **0** | ❌ Fail |
| 3 | Agency LOIs signed | 5 | **0** | ❌ **Fail (load-bearing per ADR-0018 Trigger #1)** |
| 4 | OSS v0.1 runnable | 1 | 1 | ✅ Pass (Sprint 0 Real-Execution) |
| 5 | Parser MUST-5 done + Eval ≥80% | 5 | 5 | ✅ Pass |
| 5b | Parser SHOULD+MAY done | 7 | 7 | ✅ Pass (Sprint 0.7, 12/12 vendor formats) |
| 6 | GitHub-App Day-1-Mitigations | 4 | 3 (+1 partial) | ⚠️ Acceptable — DPA ✅ · Trust-Center ✅ · Approver-Bridge ✅ · Read-Only-Default = manifest pinned, live-registration enforcement pending Sprint 1.4 App-ID registration (which is paperwork-track) |
| 7 | 30-File Golden-Set | 30 | 34 | ✅ Pass |
| 8 | Validation Handbook v0 chapters | 8 | 8 | ✅ Pass |
| 9 | Operations Playbook v0 chapters | 2 | 2 | ✅ Pass |

**Verdict — formal:** **NO-GO**. ADR-0018 §Re-Open trigger #1 ("Pfad-C-Phase-0-Gate gerissen, <5 Agency-LOIs in M3") fires by the letter.

**Verdict — diagnostic:** the failure is **execution-track-not-thesis-track**. The 7 technical criteria all PASS; the 3 commercial criteria all sit at 0/N. That means the surfaces customers + testers would point at (DPA, /pricing, /trust/sub-processors.xml, /trust/eval, /skills, /onboarding/[slug], CLI v0.1) exist and work — but the founder has not yet executed the human cadence (warm intros, cold email, conference attendance, interview scheduling) that produces transcripts + LOIs. See ADR-0022 for the explicit thesis-vs-execution distinction.

---

## Per-criterion detail

### #1 — Indie Mom-Test interviews (0 / 20)

- `interviews/` directory does not exist in the repo (commit `57b9389`).
- `.local/recruitment.md` (gitignored, Kolja-only) is the live pipeline tracker; from the founder report at Sprint 1.5 close, no transcripts have been triaged through the consent-bilingual + whisper.cpp pipeline yet.
- A9 research (`docs/research/phase-1-pivot/09-interview-template-mom-test.md`) prescribes the methodology; ADR-0021 (wait-state) documents the postponement at Sprint 1.5.
- **Throughput required to clear at M3 (re-baseline):** 20 / 13 weeks = ~1.5 / week. Realistic at the Sprint 1.5+ paperwork-track cadence if started in earnest.
- **Throughput executed Phase 1 W1–W6:** 0 / 6 weeks.

### #2 — Agency Discovery interviews (0 / 10)

Same shape as #1. A4 research (`docs/research/phase-1-pivot/04-agency-loi-channels-dach.md`) prescribes the channel-mix:

1. Warm-intros via Twitter mutuals / podcast guests / ex-colleagues (Severity: Strong)
2. Anthropic Claude Partner Network (Severity: Mid — CPN application not submitted yet per Sprint 1.4 paperwork-track)
3. Conferences (MLcon Jun, AI & Data Summit Berlin 22–23 Sep — Sep is post-Phase-1-W13 anyway)
4. Build-in-Public organic (Severity: Weak, long-tail)
5. Cold-email KI-Bundesverband (Severity: Weak)

**None of those 5 channels has been actioned in the audit window.** Channel-mix analysis is sound; execution is the bottleneck.

### #3 — Agency LOIs signed (0 / 5)

**Load-bearing per ADR-0018.** This is the criterion the entire dual-wedge thesis was gated on.

- `docs/legal/lois-signed/` directory does not exist.
- No LOI conversations in Stage 3 (post-pricing-anchor) per Sprint 1.5 close.
- A4 gate-math forecast Median 5–6 LOIs achievable but "nicht überkomfortabel" — and that's with the 5 channels actually running.

### #4 — OSS v0.1 lokal lauffähig (✅ 1.0)

Sprint 0 Real-Execution closed this. `pnpm e2e:smoke` 9/9 green, magic-link round-trip verified, audit-trail export 12-month retention proven.

### #5 + #5b — Parser MUST-5 + SHOULD+MAY (✅ 12/12)

Twelve vendor formats classified + parsed: CLAUDE.md, AGENTS.md, .cursor/rules, .cursorrules-legacy, .windsurfrules, .clinerules, .aider.conf.yml, SKILL.md, .gemini.md, .claude/agents/*, .claude/commands/*, .claude/skills/*. All MUST-5 + SHOULD-5 + MAY-2 done.

### #6 — GitHub-App Day-1-Mitigations (⚠️ 3 + 1 partial)

- DPA ✅ — `/trust/dpa` UI + acceptance audit-log (Sprint 1.0)
- Trust-Center ✅ — `/trust` shadcn-polished + sub-processor RSS (Sprint 1.0)
- Requester→Approver-Bridge ✅ — RBAC via membership, `/customers/[id]/access`, install_decision audit (Sprint 1.2)
- Read-Only-Default ⚠️ — manifest pinned to `contents:read` + `pull_requests:read` (Sprint 1.0). **Live-registration enforcement (GitHub-App-ID registration with the pinned manifest live on github.com)** is paperwork-track (Sprint 1.4 deliverable) and not yet executed.

**Gate-acceptable** if we ship a strict reading: the *code* is in place, the live App-ID isn't. The PRD-original intent is code-level enforcement, which we have. Mark as ⚠️ partial pending the App-ID flip.

### #7 — 30-File Golden-Set (✅ 34 / 30)

- 21 entries baseline (Sprint 0.5)
- +9 in Sprint 1.0 (4 real-world + 3 LLM-adversarial + 2 dogfood)
- +4 in Sprint 1.2 (context-bloat-llm fixtures)
- Smoke-eval 34/34 green on every Sprint 1.0–1.5 commit.

### #8 — Validation Handbook v0 (✅ 8 / 8 chapters)

Sprint 0.8 delivered the chapter skeletons: Positioning → Mom-Test → Channels → Pricing → Build → Launch → Iterate → Anchor. Brand-voice baseline. Full prose-fill is Phase-2 work.

### #9 — Operations Playbook v0 (✅ 2 / 2 chapters)

Sprint 0.8: Customer-Onboarding + Template-Distribution chapters as $4,500-sprint-engagement collateral.

---

## What shipped that wasn't gate-listed

Surfaces that exist today but aren't a criterion — they reduce friction in *future* LOI conversations:

- `/billing` + Stripe Checkout code (gated on live-mode KYC paperwork)
- `/pricing` public page with annual toggle + EU VAT-inclusive display
- `/skills` + first Anthropic Skill packaged (`validationkit-agent-file-audit`)
- `/status` health-check page
- `/trust/eval` per-band FPR/FNR history page (empty-state today)
- `/onboarding/[slug]` per-customer landing page
- `validationkit-cli@0.1.0` on the npm side (NOT yet `npm publish`d — paperwork-track)
- LICENSE + SECURITY.md + CONTRIBUTING.md
- ADR-0017, 0018, 0019, 0020, 0021 — 5 strategic ADRs

That's ~30 production-grade surfaces in 6 weeks of code-track. The platform side is **ahead** of the original PRD §6.5 budget.

---

## Honest read

**Concession:** the code-track velocity is real. 30+ surfaces shipped at $0 cumulative cash-out, with 84/84 vitest, 34/34 eval, 0 LLM calls executed, 0 sub-processors active beyond the documented free-tier stack. That's more than most $19/mo competitors ship before lawyer-review.

**Critique:** the commercial-track velocity is zero. The 3 gate criteria that are NOT code — they're 30-minute conversations with humans — sit at 0/N. No amount of additional code surfaces moves these criteria. The platform is over-built relative to the customer-signal that's been collected.

**Diagnosis:** Sprint 1.6 fires ADR-0018 Trigger #1 by the letter. The thesis (dual-wedge cross-vendor agent-file-trust) is not what's broken; the execution-track (warm-intro outreach, conference attendance, interview transcription) is. **No re-pivot is warranted today.** A re-pivot would burn the 30 surfaces and the technical lead without fixing the actual bottleneck.

---

## Recommended path forward

Per ADR-0022 (locks the decision):

1. **Phase 1 timeline shifts right by 4–6 sprints.** New M3 candidate-window = Sprint 1.10–1.12 (Phase 1 W10–W12) assuming founder-time re-allocation lands.
2. **Sprint 1.7–1.12 feature work pauses.** No new product surfaces ship until the gate clears. Open exceptions: bug fixes, security patches, paperwork-track surfaces (Stripe live-mode flip, CPN application submit).
3. **100% of founder code-track time re-allocated to gate-clearing**: warm-intros, cold-email cadence, conference outreach, interview scheduling, BiP cadence, npm publish, CPN application.
4. **No ADR-0017 re-open** — Hybrid-Pivot-E triggers don't fire (no funding, no co-founder, no MM-Gap-close, no Langfuse validation-before-build feature).
5. **ADR-0018 Trigger #1 fires by-the-letter but does NOT re-open the dual-wedge thesis.** The trigger fires on gate-failure; the *diagnostic* says execution-track. Re-evaluate at Sprint 1.10 audit. If LOI count is still 0 at Sprint 1.10 (Phase 1 W10), the thesis itself becomes suspect and a Voller-Replacement-Pivot becomes the honest read.

ADR-0022 is the lock; this audit is the input.

---

*Audit-trail discipline: this file ships in the same commit-window as ADR-0022 and the STATUS+CHANGELOG updates. The compliance customer who exports the audit-trail at any later date reads the NO-GO honestly.*
