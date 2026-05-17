# Conflicting-Rules LLM Eval

> **Status:** v0. 6 hand-crafted conflict-pair fixtures. Phase-0-Gate adjacency to Criterion #7 + constraint #13 (FPR ≤ 15%).

> **Goal:** Measure the FPR (false-positive rate) of the LLM-augmented `conflicting-rules` rule from `@vk/llm`, separately from the deterministic 5/6 categories.

## The 6 categories

| Category | Expected | What it tests |
|---|---|---|
| `true-conflict` | `conflict: true` at mid+ confidence | Genuine contradictions (tabs-vs-spaces, ternary-vs-`&&`) |
| `partial-overlap` | `conflict: false` | Same topic, different emphasis |
| `similar-but-not-conflict` | `conflict: false` | Different scope, similar vocabulary |
| `pure-style-diff` | `conflict: false` | Same idea, different prose style |
| `identical-paraphrase` | `conflict: false` | Restated same rule |

If the LLM-rule flags any of the bottom 4 as conflict, that's a false positive. If it misses any of the first category, that's a false negative. The PRD-target is **FPR ≤ 15%** — i.e., across the 4 non-conflict categories, < 1 in 7 may be wrongly flagged.

## How to run

```bash
# Local stack must be up and ANTHROPIC_API_KEY must be set.
export ANTHROPIC_API_KEY=sk-ant-...
pnpm tsx eval/conflicts/run.ts
```

Without `ANTHROPIC_API_KEY` set, the LLM-rule is a no-op (per `@vk/llm` graceful-degradation). The eval script logs that and exits 0 — Hardcore-Local-Only friendly.

## Why not promptfoo directly?

promptfoo is great for general LLM eval. For our specific case (conflict-detection between *pairs* of file bodies, where the LLM-rule is wrapped in our deterministic pair-selection logic), the simpler path is to call `checkConflictingRules` directly against each fixture pair and assert the output shape.

The `promptfoo.yaml` is included as scaffolding for when we extend the eval to test prompt variations (Sprint 0.9+).

## How the dataset grows

- v0.5 (Sprint 0.9+): +6 fixtures from real audit logs (manually annotated post-hoc).
- v1.0 (Phase 1 M3+): +18 fixtures from anonymized customer-pilot runs.
- Phase 2: 50+ fixtures, kept under 1k tokens each for cost.

---

*Last updated: 2026-05-16. Owner: Kolja Schöpe.*
