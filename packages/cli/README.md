# validationkit-cli

Cross-vendor agent-file audit + drift detection. Reads twelve agent-file
formats (CLAUDE.md, AGENTS.md, .cursor/rules, .windsurfrules, .clinerules,
.aider.conf.yml, SKILL.md, etc.) and applies five deterministic audit rules
+ one opt-in LLM rule with a confidence band.

**No vibe-scores. Every finding cites file:line.**

## Install

```bash
npm install -g validationkit-cli
# or one-shot:
npx validationkit-cli audit .
```

## Usage

```bash
validationkit audit <path>             # scan a repo, print the audit report
validationkit drift <pathA> <pathB>    # compare two repos for template drift
validationkit inventory <path>         # list all detected agent files
validationkit --help                   # full options
```

Useful flags:

- `--json` — machine-readable JSON output.
- `--out=<path>` — write a Markdown report to `<path>`.
- `--include-archive` — walk into `docs/archive/` (skipped by default).

## What the audit looks for

Five deterministic rules (every finding has a file:line citation):

1. **`unused-agent`** — agents under `.claude/agents/` that no other file references.
2. **`duplicate-guidance`** — trigram-similarity ≥ 0.85 across two agent files. Pick one canonical home.
3. **`context-bloat`** — single file over 8 000 tokens (tiktoken cl100k_base).
4. **`stale-reference`** — markdown links pointing to files that don't exist.
5. **`token-budget`** — always-loaded context summing over 25 k tokens.

One opt-in LLM rule:

6. **`conflicting-rules`** — pairs of files giving contradictory advice. Requires `ANTHROPIC_API_KEY`; emits a placeholder finding when no key is configured (honest non-vapor).

## Output

By default the CLI prints a colorised table with severity-bands (Kill / Weak / Mid / Strong / Exceptional) — no numeric scores. Pipe through `--json` to feed downstream tooling.

```text
$ validationkit audit ~/code/acme-frontend
Files scanned: 14
Findings: 3
Overall: Weak
Warnings: 0

unused-agent     Weak    Agent "old-grader" is never referenced
                          .claude/agents/old-grader.md
duplicate-guidance Mid   AGENTS.md and CLAUDE.md share 89% trigrams
                          AGENTS.md · CLAUDE.md
stale-reference  Mid     docs/PRD.md → "STYLE.md" not found
                          docs/PRD.md
```

## Why this exists

Agencies that run 5–30 customer repos with mixed AI-tool stacks (Claude
Code + Cursor + Windsurf + Cline) drift fast. ValidationKit catches drift
deterministically so customer-CTOs don't open a PR against `CLAUDE.md` that
silently contradicts `.cursor/rules/`.

The hosted dashboard at <https://validationkit.vercel.app> adds
multi-customer-cockpit, drift-detection across pairs, deterministic
fix-suggestions, and audit-trail export for compliance customers. The CLI
is the OSS-MIT half that runs locally with zero data leaving your machine.

## Hosted dashboard

- Free tier: 1 repo, 20 audits/month, no card.
- Solo Indie $25/mo: 3 repos.
- Agency Pro $299/mo: 30 customer repos, 5 seats, drift detection.

Pricing + signup at <https://validationkit.vercel.app/pricing>.

## License

MIT. See [LICENSE](../../LICENSE).

## Reporting bugs + security

- Bugs: <https://github.com/koljaschoepe/validationkit/issues>
- Security: see [SECURITY.md](../../SECURITY.md). Email <kol.schoepe@gmail.com> privately.
