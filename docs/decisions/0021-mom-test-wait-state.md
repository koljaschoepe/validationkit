---
id: ADR-0021
title: Mom-Test synthesis postponed — wait-state ADR (no transcripts yet)
status: Accepted
date: 2026-05-18
deciders: ["Kolja Schöpe (Owner)"]
supersedes: []
superseded_by: []
affects_prd: ["§6.5"]
trigger_to_revisit: ["≥ 10 indie Mom-Test transcripts in interviews/", "≥ 4 agency-discovery transcripts in interviews/", "Sprint 1.6 M3-Gate audit fires (Week 13–14)"]
severity_of_change: Weak
---

# ADR-0021 — Mom-Test synthesis postponed (wait-state)

- **Status:** Accepted
- **Datum:** 2026-05-18
- **Autoren:** Kolja Schöpe + Claude (Sprint 1.5 honesty-check)
- **Supersedes:** N/A
- **Reicht aus, bis:** ≥ 10 indie + ≥ 4 agency interview-transcripts land in `interviews/` (Phase-0-Gate criteria #1 + #2)

## Kontext

`docs/roadmap/phase-1.md` Sprint 1.5 commits to "Mom-Test synthesis ADR — synthesise 10–15 indie + 4–6 agency interviews into a findings ADR". As of 2026-05-18 the count is **0 indie / 0 agency**:

- `interviews/` directory does not exist in the repo (commit `e7455e3`).
- `.local/recruitment.md` (gitignored — Kolja-only tracker) holds the live pipeline state. From the founder's report at Sprint 1.4 close, no transcripts have been triaged into the `interviews/<YYYY-MM-DD-<initials>-<indie|agency>>.md` template yet.

The Sprint 1.5 commit-window opened at Phase 1 W4 (2026-05-18). The interview workstream is operating on the paperwork-track per the dual-track structure of `phase-1.md` — paperwork-track velocity is bounded by Kolja's 25 h/week solo budget and the warm-intro double-opt-in cadence (A10 research: 4-touch 1-4-8-15, hard cap 25 cold-sends/week, capacity ≈ 13.5 h).

## Entscheidung

**Do not write a Mom-Test synthesis ADR until the data exists.** Fabricating themes from imagined transcripts would:

1. Violate PRD constraint #5 (Severity-Bänder over Fake-Precision-Scores) — synthesis without underlying quotes is exactly the Vibe-Score anti-pattern we built ValidationKit to refuse.
2. Pollute the ADR-0017 / ADR-0018 re-open evaluation. Future strategic forks reference past ADRs as evidence; a fabricated 0021 corrupts that chain.
3. Burn the Skeptic-Mentor brand-voice claim publicly. The `/trust` page already says "we ship boring fundamentals before any growth lever." A fabricated synthesis ADR breaks that contract on the first audit.

**This ADR exists as the audit-trail of the postponement.** It encodes:

1. The unblock conditions (above, in `trigger_to_revisit`).
2. The methodology the real synthesis will follow (A9 research output + the Triage YAML schema).
3. The fallback if Sprint 1.6 M3-Gate fires with < 10 interviews: ADR-0022 scope-correction per `phase-1.md` Sprint 1.6 DoD.

## Begründung

### Why postponement is the right call

- **Sprint 1.5 code-track delivers what it can.** `/trust/eval` (honest empty-state) and `/onboarding/[slug]` (per-customer DPA landing) ship in the same commit window. The code-side bottleneck is not what's holding Phase 1 up.
- **The 5-LOI gate is the binding constraint.** From A4 research: cold-email median reply rate 3.43 % in 2026; warm intros 5–10× that. Sprint 1.0–1.4 shipped the surfaces (DPA acceptance UI, `/pricing`, `/skills`, `/trust/sub-processors.xml`) that LOI conversations can point at. The interview workstream is the next bottleneck, but it's a human-cadence problem.
- **Sprint 1.6 (Week 13–14) is the natural retest point.** That's the explicit M3-Gate audit checkpoint in `phase-1.md`. Re-running synthesis at Sprint 1.6 with whatever data lands is honest; running synthesis now on 0 data is not.

### Why this ADR (instead of just silence)

- **Audit-trail discipline.** ADRs are the search-substrate for future strategic decisions. A silent skip leaves no record of *why* the synthesis was deferred. A wait-state ADR encodes the reasoning + the unblock conditions in the same file the audit-trail-export endpoint will surface to compliance customers (Sprint 0.10 audit-trail).
- **External signal.** The ADR is publicly visible on GitHub. A reader who finds `phase-1.md` Sprint 1.5 line "Mom-Test synthesis ADR — 1 deliverable" expects 0021 to exist. Pointing them at 0021-wait-state explains the gap honestly without forcing them to grep commits.

## Methodology the real synthesis will follow (when data lands)

Sourced from `docs/research/phase-1-pivot/09-interview-template-mom-test.md` (A9, Sprint 1.0). Reproduced here so future-Kolja doesn't re-derive it.

1. **Input set:** transcripts at `interviews/<YYYY-MM-DD-<initials>-<indie|agency>>.md` with the Triage YAML frontmatter:

```yaml
---
date: 2026-MM-DD
duration_min: 30
persona: indie | agency
channel: warm-intro | cold-email | bip-followup | inbound-from-skill
verdict: signal | no-signal | unclear
pricing_signal: <verbatim quote referencing time-or-money cost>
quotes:
  - "<verbatim pain-point quote 1>"
  - "<verbatim pain-point quote 2>"
  - "<verbatim pain-point quote 3>"
intro_friction_score: 1-5
follow_up: <none | scheduled | declined>
---
```

2. **Per-stem aggregation** (Walk-Through → Before → Substitute → Cost → After):
   - Group quotes by stem.
   - Mark recurring substring-overlap pairs (parser-style trigram ≥ 0.5).
   - For each stem, the "load-bearing finding" = the answer that recurs in ≥ 40 % of transcripts (8 / 20 indie, 4 / 10 agency).

3. **Pricing-signal extraction** (Q4 Cost answer):
   - Indie: hours-per-week the persona spends on the problem today.
   - Agency: % engagement-margin the problem eats (per A9 §1).
   - The "willing-to-pay anchor" is the substitute they already pay for — NOT what they say they'd pay (Mom-Test trap).

4. **Severity-band per finding:**
   - **Kill** = ≥ 80 % of transcripts mention this; product without it is dead.
   - **Strong** = 50–80 %; product needs to solve it.
   - **Mid** = 30–50 %; worth solving in Phase 2.
   - **Weak** = 10–30 %; backlog.
   - **Exceptional** = < 10 %; noise unless it's a single highly-credible signal.

5. **Output:** ADR-0021-real (supersedes this wait-state ADR), with:
   - 5 per-stem findings (Severity-banded).
   - 3–5 explicit pivot decisions or no-pivot rejections, each with the quote evidence.
   - Re-open trigger conditions for ADR-0017 (Hybrid-Pivot-E) + ADR-0018 (Dual-Wedge).
   - Pricing-deck implication for Sprint 1.6+.

## Konsequenzen

### Positive

- Audit-trail honesty preserved. The compliance customer who exports the audit-trail and reads ADR-0021 sees `Mom-Test synthesis postponed; data not yet collected` instead of a fabrication.
- Sprint 1.6 M3-Gate audit has a clear input. If interviews still <10 indie / <4 agency at Week 13, ADR-0022 fires scope-correction (per `phase-1.md` Sprint 1.6 DoD).
- The methodology is documented in one place. Whoever opens ADR-0021-real in Sprint 1.6 (or Sprint 1.9 / 1.12 — whichever sprint the data lands) has the recipe, not just a blank file.

### Negative

- Phase 1 narrative slips one sprint on the Mom-Test deliverable. The roadmap line "Sprint 1.5 — Mom-Test synthesis ADR ✅" becomes "Sprint 1.5 — wait-state ADR + code surfaces ✅; real synthesis pending Sprint 1.6+".
- LOI conversations referencing "we have 20 interview signals" can't truthfully be made until the data lands. Until then, the credible 3-numbers framing (per A10 research) stays: 12 agent-file formats parsed · 0 LLM calls in 5 of 6 categories · 30+34-file golden-set.

### Neutral

- Sprint 1.5 code-track ships independently (`/trust/eval` + `/onboarding/[slug]`).
- Sprint 1.6 M3-Gate audit is the natural re-test point regardless. This ADR doesn't move that date.

## Alternativen geprüft

1. **Write a synthesis ADR from invented quotes** — rejected. Constraint #5 + Skeptic-Mentor brand-voice + audit-trail integrity all kill it. Catastrophic if discovered by a paying compliance customer.
2. **Slip the entire sprint 1.5 deliverable list** — rejected. The two code-side deliverables (`/trust/eval` + `/onboarding/[slug]`) are independently shippable + reduce friction on LOI conversations.
3. **Write a "synthesis preview" with placeholder findings** — rejected. Preview ≠ ADR. ADRs are decisions, not drafts; a "preview" pollutes the decision-search-substrate same as a fabrication.
4. **Defer ADR-0021 numbering** — rejected. Reserving the number for the future synthesis means today's gap is silent; this wait-state ADR makes the gap legible.

## Re-open conditions

Real ADR-0021 (supersedes this) lands when:

- ≥ 10 indie Mom-Test transcripts triaged in `interviews/`, OR
- ≥ 4 agency-discovery transcripts triaged in `interviews/`, OR
- Sprint 1.6 M3-Gate audit at Week 13–14 (whichever fires first).

When the real synthesis lands, this file gets `status: Superseded` + `superseded_by: ADR-0021-real` in the frontmatter. The body stays intact as the audit-trail of the deferral.

## References

- `docs/research/phase-1-pivot/09-interview-template-mom-test.md` (A9 — methodology + bilingual DE/EN consent stack)
- `docs/research/phase-1-pivot/04-agency-loi-channels-dach.md` (A4 — channel-priority + gate-math)
- `docs/research/phase-1-pivot/10-outreach-cadence-warm.md` (A10 — 4-touch cadence, 25/week cap)
- `docs/handbook-extras/mom-test-script.md` (v1 script, patched in Sprint 1.0 for §201 StGB consent)
- `docs/roadmap/phase-1.md` Sprint 1.5 + 1.6 sections

---

*ADR status: Accepted as wait-state 2026-05-18. Lock until real synthesis supersedes.*
