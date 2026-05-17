# Golden Set

Source-of-truth fixtures for evaluating the audit pipeline. Per **PRD §6.5 Phase-0-Gate-Criterion #7**: 30 entries, fully annotated, with **FPR ≤ 15%** target.

## Status

- **Seeded:** 3 / 30
- **Target:** 30 by end of Phase 0 (M3)
- **FPR target:** ≤ 15% (PRD constraint #13)

## How it works

`eval/golden-set/manifest.json` describes each entry with:

- `path` — relative to repo root
- `expected.{min_files,max_files,min_findings,max_findings,must_categories}` — assertions
- `vendor_mix` — which formats the entry exercises
- `kind` — `fixture | dogfood | real-world | anonymized-customer | adversarial`

The smoke-eval (`pnpm eval`) walks the manifest and asserts every entry. CI gate: every PR must pass smoke-eval.

## Growing the set

Goal: 30 entries by M3. Five buckets, six entries each:

1. **Fixtures** (1/6 seeded): synthetic repos in `examples/`.
2. **Dogfood** (1/6 seeded): this repo + its sub-paths.
3. **Real-world** (0/6): permissively-licensed public repos, vendored under `eval/golden-set/real-world/<owner>-<repo>/`.
4. **Anonymized-customer** (0/6): unlocked after first 5 Agency-LOIs in M3. Use git-blame-strip + secret-scan before vendoring.
5. **Adversarial** (0/6): intentional edge-cases — bilingual frontmatter, missing closing `---`, huge prompts, broken YAML, mixed line-endings, etc.

## Adding an entry

1. Drop content under one of the bucket directories OR reference an existing path.
2. Add a new object to `manifest.json#entries` with annotated expectations.
3. Bump `current_size` and check the diff: does the manifest still validate (`manifest.schema.json`)?
4. Run `pnpm eval` locally. Fix or document any new findings.
5. Commit. CI will re-run.

## Why this matters

The PRD makes a hard claim: 5 of 6 audit categories are deterministic, and the LLM-augmented category uses confidence-banding. Without a golden-set we can't measure FPR, and any "low FPR" claim is unfalsifiable — which would burn the consultant trust we're selling. The golden-set is the load-bearing artifact for the **deterministic-first** brand promise.
