# Contributing to ValidationKit

ValidationKit is solo-maintained until further notice. Contributions land via PR; I review one batch a week. **Read [docs/vision.md](docs/vision.md) and the active sprint plan in `docs/plans/` before opening a non-trivial PR** — most "obvious improvements" are deliberately out-of-scope until a future phase.

## What lands fast

- Bug fixes with a vitest reproducer in `packages/<pkg>/src/<name>.test.ts`.
- Parser improvements for a vendor format we already classify (`@vk/parser/src/`).
- New deterministic audit-rule cases (`packages/audit/src/rules/`).
- Eval-fixture additions to `eval/golden-set/` with an explicit `expected:` block in the manifest.
- Typos in docs / inline comments.
- Translation of brand-voice copy from EN → DE or vice-versa.

## What lands slow (or doesn't)

- New top-level features. The active phase is described in `.claude/CLAUDE.md`; new features need an ADR in `docs/adrs/` and a plan in `docs/plans/`. Open an issue first.
- Refactors with no functional benefit. The codebase is young; structure changes daily. Refactor PRs get rebased into oblivion.
- New workspace packages. Each `packages/<name>/` is a discrete deploy unit and adds CI minutes. Justify the split in the PR description.
- "AI Review" / "Multi-Model Compare" marketing copy without an eval-pass on the golden-set.
- DM-automation features, LinkedIn / Instagram outreach helpers (out-of-scope — strategy/sales live in a separate framework, not this repo).

## Before opening a PR

```bash
pnpm install
pnpm typecheck     # must be green
pnpm test          # must be green (vitest, all packages)
pnpm eval          # must be green (smoke-eval, golden-set)
pnpm build         # must be green (turbo cache OK)
```

All four must pass locally. The CI pipeline re-runs them; if anything fails, the PR pauses until you push a fix-commit.

## Commit message style

```
<scope>: <subject> (<= 70 chars)

<body — wrap at 80 chars>

<optional trailer:
Co-Authored-By: ...
EOF>
```

- **`feat:`** new behaviour visible to users.
- **`fix:`** bug fix with no API change.
- **`refactor:`** internal restructure, no behaviour change.
- **`docs:`** docs only.
- **`chore:`** dependency bumps, tooling, CI.

The body should explain **why**, not what. The diff explains what.

## Sign-off (DCO-lite)

Add `Signed-off-by: Your Name <you@example.com>` to every commit (the `git commit -s` flag does this). This asserts you have the right to contribute the change under the MIT license. We do not require a CLA.

## Brand voice

Any PR touching user-facing copy (docs, app UI, marketing emails, commit-message body) follows the **Skeptic-Mentor + Concession-then-Critique** pattern:

- Lead with the concession (what's actually working / what the user is right about).
- Follow with the critique (what's load-bearing wrong / what they're missing).
- Cite specific numbers when claiming anything.
- **No** "AI-powered", "revolutionary", "10x your X".
- **No** emojis unless explicitly requested.

## Security

Don't file security bugs as public issues. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree your contribution is licensed under the MIT License (see [LICENSE](LICENSE)).
