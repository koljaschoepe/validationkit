---
id: ADR-0022
title: M3-Gate failed (0/3 commercial criteria) — pause feature-work, re-allocate founder time, defer M3 by 4–6 sprints (no re-pivot)
status: Accepted
date: 2026-05-18
deciders: ["Kolja Schöpe (Owner)"]
supersedes: []
superseded_by: []
affects_prd: ["§6.5", "§9", "§11"]
trigger_to_revisit: ["Sprint 1.10 audit if LOI count still 0", "Sprint 1.12 audit if LOI count still < 3", "Funding decision lands at any point", "Anthropic ships Claude-for-Agencies SKU during the deferral window"]
severity_of_change: Mid
---

# ADR-0022 — M3-Gate failed (0/3 commercial); pause feature-work, defer M3 by 4–6 sprints, no re-pivot

- **Status:** Accepted
- **Datum:** 2026-05-18 (Sprint 1.6, Phase 1 W6 stand-in for the formal M3 audit window per `phase-1.md`)
- **Autoren:** Kolja Schöpe + Claude
- **Supersedes:** N/A
- **Reicht aus, bis:** Sprint 1.10 audit re-test (LOI count ≥ 1) OR Sprint 1.12 audit re-test (LOI count ≥ 3) OR any listed `trigger_to_revisit` fires

## Kontext

`docs/status/m3-gate-audit.md` published 2026-05-18 documents the M3-Gate audit. Verdict: **NO-GO**.

| | Target | Current |
|---|---|---|
| Indie Mom-Test interviews | 20 | 0 |
| Agency Discovery interviews | 10 | 0 |
| Agency LOIs signed | 5 | 0 |
| Code/tech criteria (#4–9) | All | All ✅ (#6 ⚠️ 3+1 partial) |

**ADR-0018 §Re-Open trigger #1** (`Pfad-C-Phase-0-Gate gerissen, <5 Agency-LOIs in M3`) **fires by the letter.** ADR-0017 (Hybrid-Pivot-E) triggers do NOT fire — no funding, no co-founder, no MM-Gap-close, no Langfuse validation-before-build feature.

The phase-1.md Sprint 1.6 DoD prescribes: **"(if gate fails) ADR-0022 scope-correction lands; Phase-1 timeline shifted"**. This is that ADR.

## Diagnostic — thesis vs execution

Two independent questions need separate answers:

1. **Is the cross-vendor agent-file-trust thesis broken?** Evidence: the 7 technical criteria PASS clean. The 30+ surfaces shipped (DPA, /pricing, /skills, /onboarding/[slug], CLI, 34-file golden-set, etc.) work. The thesis-side has no observed failures.
2. **Did the commercial execution-track run?** Evidence: 0 interviews + 0 LOIs + CPN application not submitted + npm publish not run + no warm-intros logged + no conference attended. The execution-track produced no observable output in Phase 1 W1–W6.

The gate failure is **diagnostically explained by execution-track silence**, not by thesis-track refutation. A re-pivot would attempt to fix the wrong problem.

## Entscheidung

Six locking calls:

### 1. NO re-pivot today

- ADR-0017 (Hybrid-Pivot-E) is **NOT re-opened**. Triggers don't fire; nothing in the Hybrid Layered strategy is contradicted by the data we have.
- ADR-0018 (ContextForge-Productized-Form, Dual-Wedge) trigger #1 **fires by the letter**, but the diagnostic above says this is execution-not-thesis. The ADR's `trigger_to_revisit` adds Sprint 1.10 + 1.12 LOI-count re-tests as the natural retest points.
- A Voller-Replacement-Pivot (kill agency wedge, indie-only) would burn 30 production surfaces + the architectural decisions in ADR-0019 (operations-dashboard) and ADR-0020 (CPN over AAIF, pricing tweaks). Pre-revenue is the *worst* time to burn architecture; if the underlying thesis is wrong, we'd want to discover that with $0 of customer impact, which is exactly where we are now.

### 2. Pause Sprint 1.7 → 1.12 feature work

No new product surfaces ship until the gate clears. **Open exceptions** the founder can ship without re-opening this ADR:

- **Bug fixes** that affect existing platform users (security, GDPR compliance, broken builds).
- **Paperwork-track flips** that don't require new code: `npm publish` for validationkit-cli, Stripe Live-Mode KYC, CPN application submission, Anthropic Skills-Marketplace PR.
- **Doc updates** that improve LOI conversations: new `/onboarding/[slug]` instances for prospects, refinements to brand-voice copy.
- **Interview-pipeline tooling** if it materially speeds up the founder's gate-clearing cadence (e.g. shell script for Zoom-local + whisper.cpp triage). Time-bounded: any such tooling must ship in ≤ 0.5 PD.

The default for everything else is "queue until M3-clear."

### 3. Founder time re-allocation: 100% to gate-clearing

Phase 1 W7 onwards (until the M3 retest fires at Sprint 1.10):

| Activity | Hours / week target |
|---|---|
| Warm-intro outreach (Brian-Hess double-opt-in per A10) | 8 |
| Cold-email cadence (4-touch 1-4-8-15, cap 25/week per A10) | 6 |
| Interview scheduling + recording + whisper.cpp transcription + Triage-YAML | 8 |
| BiP cadence (Twitter @kolja_schoepe threads + Substack 1×/wk + LinkedIn 2×/wk per A8) | 3 |
| **Total** | **25** |

That's the full 25 h/week founder budget. No code work in the default week.

### 4. Phase-1 timeline shifts right by 4–6 sprints

Sprint 1.7 (the next sprint) becomes a paperwork-only sprint by default. The next code-track audit checkpoint is **Sprint 1.10** (Phase 1 W10) with the M3 re-test condition:

- **If LOI count ≥ 1 by Sprint 1.10** → resume feature-work at a reduced cadence (Sprint 1.10–1.12). M3 candidate-window = Sprint 1.12 audit at Phase 1 W12.
- **If LOI count is still 0 at Sprint 1.10** → ADR-0023 fires. At that point the thesis becomes suspect (the channel-mix has been tried for 4 sprints with no signal); a focused multi-agent re-research kickoff is the natural response.
- **If LOI count is ≥ 3 by Sprint 1.10** → fast-track to feature-work resume; M3 candidate-window pulls to Sprint 1.10.

### 5. M3-Gate Criterion #6 (GH-App Mitigations) re-baselined

The audit marks this 3 + 1 partial. Sprint 1.4 paperwork-track was supposed to flip the live App-ID; it didn't. **Decision:** the partial is acceptable for M3-clear *if* criteria #1–3 also clear. The live App-ID flip is paperwork-track and not gate-bottleneck.

If criteria #1–3 clear at Sprint 1.10 and the App-ID still hasn't flipped, ADR-0023 will surface that explicitly and force the flip as the last gate-blocker.

### 6. ADR-0018 monthly-watch cadence stays

Per ADR-0020 §monthly-watch upgrade: the Anthropic Claude Partner Network watch remains monthly (Sprint 1.4 close confirmed CPN is co-sell + training, not a product surface with multi-customer-inventory). If during the M3-deferral window Anthropic ships a multi-tenant agent-file-inventory product, **ADR-0018 trigger #2 fires** independent of LOI-count and this ADR re-opens.

## Begründung

### Why pause feature work instead of doing both tracks in parallel

- Founder is solo at 25 h/week. The phase-1.md dual-track design assumed both tracks run in parallel; Phase 1 W1–W6 evidence is that the dual-track DID NOT run in practice — code-track absorbed 100 % of the hours, commercial-track absorbed 0 %.
- The honest fix is to flip the allocation, not to keep pretending dual-track works. Single-track-paperwork for the next 4–6 sprints is the operating-system change that's overdue.
- The platform is over-built relative to commercial signal. Adding a 31st surface during the deferral would compound the imbalance.

### Why 4–6 sprints (Sprint 1.10) is the right re-test window

- A4 research forecast Median 5–6 LOIs at "channel-mix actually running" conditions. 4 sprints (8 weeks) is the minimum credible window to test all 5 channels (warm-intros + CPN + conferences + BiP + cold-email).
- 6 sprints (12 weeks) bumps into the original PRD §11 Phase-2 entry condition (M9) — beyond that, ADR-0017/0018 architecture re-eval becomes warranted even if execution improves. So 1.10–1.12 is the natural window.

### Why no Voller-Replacement-Pivot today

- The user's documented pivot-pattern (memory: `[[feedback_pivot_pattern]]`): "User schlägt Voller-Replacements vor, akzeptiert Hybrid-Lösungen wenn Daten ≥2 Achsen abkillen". A re-pivot would require ≥ 2 axes of evidence against the thesis. We have 1 axis (commercial gate fail) and 0 axes against the thesis itself.
- Sprint 1.10 audit is the natural moment to re-evaluate with 4 more sprints of execution data. If the channels run and still produce 0 LOIs, that's the second axis.

## Konsequenzen

### Positive

- **Founder time finally goes where it needs to.** The 25 h/week reallocation to gate-clearing is the structural change that should have shipped with Sprint 1.0; this ADR is the catch-up.
- **Architecture preserved.** The 30 surfaces remain shippable + LOI-conversion-ready when execution catches up.
- **Audit-trail honesty.** Future paying customers + compliance auditors can read the NO-GO + scope-correction as a single artifact-pair. No silent skip.
- **Optionality preserved.** Sprint 1.10 has explicit branch conditions (≥1 LOI / 0 LOI / ≥3 LOI) so the next decision is bounded.

### Negative

- **Phase-1 narrative slips publicly.** The roadmap line "Sprint 1.6 — gate passes; production-hardening" becomes "Sprint 1.6 — gate fails; pause and re-allocate". Some BiP credibility cost.
- **Sprint 1.7–1.9 publish nothing code-side**. No version bumps, no CHANGELOG entries, no Vercel deploys. Risk: the dev-side velocity narrative quiets; momentum-perception drops.
- **CPN 60-day onboarding clock doesn't start** until the founder actually submits the application. Each sprint of paperwork-track-non-execution pushes CPN approval right.
- **The "30 surfaces" might rot.** Dependency updates (Next.js patch releases, drizzle updates, Stripe API version drift) will accumulate during the deferral. Sprint 1.10 will need a dedicated dependency-refresh sub-task.

### Neutral

- The technical platform is in fine shape. Nothing in the codebase forces a re-evaluation today.
- ADR-0019 (operations-dashboard) and ADR-0020 (CPN + pricing) remain unchanged.

## Alternativen geprüft

1. **Ship Sprint 1.6 production-hardening anyway** (incident-response playbook, Neon→R2 backup, Sentry/PostHog instrumentation). **Rejected.** No paying customers means no operational stake; the work would amplify the over-built-relative-to-signal imbalance.
2. **Voller-Replacement-Pivot to indie-only** (kill agency wedge, drop /customers, /access, agency_pro+ tiers). **Rejected.** Burns architecture; lacks the second axis of evidence; premature.
3. **Renegotiate the gate** (reduce 5 LOIs to 2–3). **Rejected.** The 5-LOI gate is load-bearing per ADR-0018; reducing it would gut the gate's signal-value. Better to slip the gate than dilute it.
4. **Multi-agent re-research kickoff** like Phase 1 launch. **Rejected — premature.** Multi-agent research is the right move when *thesis* uncertainty is high; it's the wrong move when *execution* is the bottleneck. Run the channels for 4 sprints first; re-research only if the channels produce nothing.
5. **Hire someone to do the gate-clearing work for Kolja.** **Rejected.** PRD constraint #9 explicitly forbids a sales-hire before M18. No exception today.

## Re-open conditions

This ADR re-opens — and the scope-correction renegotiated — if ANY of:

- LOI count ≥ 1 at Sprint 1.10 audit → resume feature-work, Sprint 1.10–1.12 plan refined
- LOI count = 0 at Sprint 1.10 audit → ADR-0023 fires with a focused multi-agent re-research kickoff; thesis becomes suspect
- LOI count ≥ 3 by Sprint 1.10 → fast-track resume, M3 candidate-window pulls to Sprint 1.10
- Anthropic ships a Claude-for-Agencies SKU with multi-tenant agent-file inventory during the deferral → ADR-0018 trigger #2 fires; this ADR's "no re-pivot" stance gets revisited
- A funding decision or co-founder hire lands during the deferral → ADR-0017 re-opens; this ADR adapts accordingly
- IBM mcp-context-forge files a trademark complaint → naming + scope conversation accelerates regardless of LOI count

## References

- `docs/status/m3-gate-audit.md` — the input that drove this decision
- `docs/roadmap/phase-1.md` Sprint 1.6 + 1.10 + 1.12 sections
- `docs/decisions/0017-hybrid-pivot-e.md` (re-open triggers unchanged)
- `docs/decisions/0018-contextforge-as-productized-form.md` (trigger #1 fires; thesis still load-bearing per diagnostic)
- `docs/decisions/0020-phase-1-scope.md` (pricing + CPN + GH-App mitigations baselines)
- `docs/decisions/0021-mom-test-wait-state.md` (Sprint 1.5 honest-deferral precedent)
- `docs/research/phase-1-pivot/04-agency-loi-channels-dach.md` (A4 channel-mix + gate-math)
- `docs/research/phase-1-pivot/10-outreach-cadence-warm.md` (A10 cadence + 25/week cap)
- User pivot-pattern: `[[feedback_pivot_pattern]]` (Voller-Replacement requires ≥ 2 axes)

---

*ADR status: Accepted as scope-correction 2026-05-18. Re-evaluates at Sprint 1.10 audit (or sooner if any trigger fires).*
