# A2 — LLM-Eval & 30-File Golden-Set: From 21 → 30 + FP-Instrumentation

**Document ID:** `docs/research/phase-1-pivot/02-llm-eval-30-file-golden-set.md`
**Stand:** 2026-05-17 · **Track:** Phase-1-Pivot Research A2 · **Anchor:** PRD §6.5, Constraint #14
**Scope:** Plan the missing 9 Golden-Set entries, define FP-rate instrumentation, harness verdict, Batch-API economics, Sprint 1.0 ship-line.

---

## TL;DR (Severity-Bands)

- **Golden-Set 21→30:** **Mid** — gap is fillable in one focused sprint; mix below is **3 adversarial × 4 real-world × 2 dogfood**.
- **FP-instrumentation:** **Strong** — extend `eval/conflicts/run.ts` with a labeled `non_conflict_count` denominator + per-confidence-band breakdown. The scaffold already discriminates FP vs FN.
- **Batch-API for evals:** **Mid** — worth it once dataset ≥ 30 conflict pairs; ~50% discount, 24h SLA fine for nightly CI. Skip for the sub-10-pair smoke loop ([Anthropic Message Batches, 2026](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing)).
- **promptfoo vs custom:** **Weak** for promptfoo as primary. Our LLM-rule is *pair-wise wrapped in deterministic pre-selection* — promptfoo's per-prompt model doesn't fit cleanly. Keep `run.ts` as canonical, keep `promptfoo.yaml` as a Sprint-1.1 prompt-A/B harness only.
- **Sprint-1.0 "ship the eval" minimum:** **Strong** definition possible — 30 manifest entries + 12 conflict-pairs + CI-gate failing on FPR > 15% **or** missing manifest entry. Anything beyond is gold-plating.

> Concession: the 21-entry set already covers the messy-encoding tail (BOM, CRLF, bilingual, emoji, symlink) better than most OSS eval harnesses I see in 2026. **Critique:** it's structurally lopsided — 12 adversarial, 3 real-world, 3 dogfood, 3 fixture. For a 6-category audit pipeline where 5 categories never fire in our adversarials, we under-sample the *positive* paths. The 9-file fill must skew real-world.

---

## 1. The Missing 9 — Annotated Manifest Patch

| ID | Kind | Why | `expected` (min_files / max_files / min_findings / max_findings / must_categories) |
|---|---|---|---|
| `real-aider-conf-mix` | real-world | Tests `aider-conf` parser tail + AGENTS.md + CLAUDE.md cohabitation; surfaces stale-references when `.aider.conf.yml` references deleted files. | 3 / 6 / 0 / 5 / `["stale-reference"]` |
| `real-multi-vendor-monorepo` | real-world | Turborepo with `apps/web/.cursor/rules/` + root `CLAUDE.md` + `packages/*/AGENTS.md`. Exercises **nested-path classification** + duplicate-guidance across packages. | 6 / 12 / 1 / 8 / `["duplicate-guidance"]` |
| `real-windsurf-cline-coexist` | real-world | Both `.windsurfrules` and `.clinerules` present (common in agencies running 2 tools); deterministic dup-detection should fire, conflicting-rules should *not* (orthogonal scopes). | 4 / 8 / 1 / 6 / `["duplicate-guidance"]` |
| `real-anthropic-skills-import` | real-world | Repo using `SKILL.md` files (Anthropic Skills-Marketplace pattern, 4 200+ skills indexed mid-2026 [Anthropic Skills, 2026](https://docs.claude.com/en/docs/claude-code/skills)). Parser must classify, audit must not false-positive as "unused" when activated by frontmatter trigger. | 5 / 10 / 0 / 4 / `[]` |
| `adv-conflict-bait-true` | adversarial (LLM) | Two files with **genuine** tabs-vs-spaces conflict, identical token-budget and similar trigram-overlap. Ground-truth for FNR. | 2 / 2 / 1 / 4 / `["conflicting-rules"]` (only when `includeLLM=true`) |
| `adv-conflict-bait-paraphrase` | adversarial (LLM) | Two files saying the same thing in DE vs EN. **Must not** flag `conflicting-rules`. Multilingual FP-trap. | 2 / 2 / 0 / 2 / `[]` and `must_not_categories: ["conflicting-rules"]` |
| `adv-conflict-bait-style-only` | adversarial (LLM) | Same rule, terse vs verbose. **Must not** flag. Tests confidence-banding (Constraint #14). | 2 / 2 / 0 / 2 / `[]` and `must_not_categories: ["conflicting-rules"]` |
| `dogfood-packages-llm` | dogfood | Self-audit `packages/llm/` — verifies our own LLM-rule code-folder doesn't accidentally drop a CLAUDE.md that the audit would flag. | 0 / 1 / 0 / 1 / `[]` |
| `dogfood-docs-research` | dogfood | Scan `docs/research/` — high token-density, must trip `context-bloat` predictably (calibration anchor for the threshold). | 20 / 60 / 1 / 10 / `["context-bloat", "token-budget"]` |

**Net mix after fill:** 4 fixture, 5 dogfood, 7 real-world, 15 adversarial (3 of them LLM-targeted). The 3 new `adv-conflict-bait-*` entries are the **bridge between `manifest.json` and `eval/conflicts/dataset.json`** — same pairs, two harnesses. That's deliberate: the deterministic smoke-eval should assert "LLM-disabled = no findings", the conflict-eval should assert "LLM-enabled = correct flag".

---

## 2. FP-Rate Instrumentation (Constraint #14 enforcement)

Current `eval/conflicts/run.ts:114-124` already computes `fpr = falsePositives / nonConflictTotal` and exits 1 on breach. Three upgrades for Sprint 1.0:

1. **Per-confidence-band FPR**, not aggregate. Today we run with `minConfidence: "low"` — generous. Real product ships at `mid`. Log all three bands so we can pick the policy with data, not vibes. Pattern matches Anthropic's own confidence-banded eval reporting ([Anthropic Eval Cookbook, 2026](https://github.com/anthropics/anthropic-cookbook/blob/main/misc/building_evals.ipynb)).
2. **Run each pair N=3 times**, report variance. LLM determinism ≠ guaranteed; if one of three runs flips, the rule isn't stable enough for "deterministic-first" marketing. Cost: 3× the API spend on a 12-pair dataset = trivial (<$0.20 at Sonnet-4-6 rates).
3. **Persist results to `eval/conflicts/results/YYYY-MM-DD.json`** so we have an FPR-over-time chart for the Trust-Center-Page (Constraint #14 mitigation).

> Critique of the current setup: `flagged = findings.length > 0` collapses confidence. A `mid`-confidence FP and a `high`-confidence FP are very different signals for our consultants — only the latter would survive into customer reports.

---

## 3. Anthropic Batch API — Worth It?

- **Mechanics:** asynchronous, ≤ 24h SLA, **50% input + 50% output discount** vs sync ([Anthropic Message Batches, 2026](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing)).
- **Verdict:** Use it for **nightly full-dataset re-eval** (all 30 manifest entries × 3 runs once the LLM-rule applies to dogfood-docs-research and real-world entries). Skip for the dev-inner-loop smoke (the 12-pair conflict-eval needs sub-minute feedback to be usable during prompt iteration).
- **Structure:** one batch-job per eval-run, request-ID = `{entry_id}::{run_idx}::{conf_band}`. Parse `.jsonl` output, fold into the same `results/YYYY-MM-DD.json` shape.

---

## 4. promptfoo vs Custom Harness — 2026 Verdict

- **promptfoo strength:** prompt-A/B at scale, provider-comparison matrices, web-UI for triage ([promptfoo docs, 2026](https://www.promptfoo.dev/docs/intro/)).
- **Our shape:** the LLM-rule receives `ParserResult` and is wrapped in `pickCandidatePairs()` (trigram pre-filter, Jaccard ∈ [0.4, 0.85]). promptfoo's "one prompt × many cases" doesn't represent the pre-filter; you'd end up either bypassing it (eval-the-wrong-thing) or re-implementing it in JS asserts (duplicate code).
- **Recommendation:** keep `run.ts` as canonical (already wired, already enforces FPR-budget). Keep `promptfoo.yaml` *only* for Sprint-1.1 prompt-variant A/B — testing 3–4 candidate `buildPrompt()` strings against the same dataset to pick the best wording. That's promptfoo's sweet-spot, not full eval.

---

## 5. Sprint-1.0 Ship-Line (minimum credible)

A single CI workflow that fails if **any** of:

1. `manifest.json#entries.length !== 30`.
2. `pnpm eval` (deterministic smoke) reports < 30/30 pass.
3. `pnpm tsx eval/conflicts/run.ts` reports `fpr > 0.15` at `minConfidence: mid`, **when** `ANTHROPIC_API_KEY` is present in CI (Hardcore-Local-Only respected via skip-on-unset, per `eval/conflicts/run.ts:66-71`).
4. `eval/conflicts/dataset.json#pairs.length < 12`.

Anything else — multi-model compare, promptfoo, Batch-API wiring, results-history viz — is Sprint 1.1+ and **must not** block the gate.

---

## 6. Files referenced

`packages/llm/src/rules/conflicting-rules.ts` · `packages/llm/src/select.ts` · `eval/smoke.ts` · `eval/golden-set/manifest.json` · `eval/conflicts/run.ts` · `eval/conflicts/dataset.json` · `packages/audit/src/run.ts`.

---

## 100-Word Summary

The 21-entry Golden-Set is encoding-robust but path-imbalanced; fill the 9-gap with **4 real-world × 3 LLM-targeted adversarial × 2 dogfood** to exercise positive paths and create a bridge to `eval/conflicts/dataset.json`. FP-instrumentation needs per-confidence-band breakdown, N=3 variance runs, and dated results-persistence — current `flagged = findings.length > 0` collapses the signal Constraint #14 depends on. Anthropic Batch API saves 50% on nightly full re-evals; skip for inner-loop. Keep `eval/conflicts/run.ts` as canonical harness, demote promptfoo to a Sprint-1.1 prompt-A/B tool. Sprint-1.0 ships when CI fails on 30-entry count, smoke-pass, FPR > 15% at `mid`, or < 12 conflict-pairs.
