---
name: validationkit-agent-file-audit
description: Audit a repository's AI-agent files (CLAUDE.md, AGENTS.md, .cursor/rules, .windsurfrules, .clinerules, .aider.conf.yml, SKILL.md, and 5 more vendor formats) for cross-vendor drift. Surfaces deterministic findings with file:line citations across 5 categories — unused agents, duplicate guidance, stale references, context bloat, token-budget overflow.
trigger: when the user asks to audit agent files, check CLAUDE.md health, find drift between AI-tool configs, lint AGENTS.md, or run a cross-vendor agent-file review
license: MIT
homepage: https://validationkit.vercel.app
---

# validationkit-agent-file-audit

You are running ValidationKit's audit rules against a repository. Use this
Skill when the user wants a **deterministic** review of their AI-agent
configuration files — not a vibe-check, not an LLM hallucination.

## When to use this Skill

- "Check my CLAUDE.md / AGENTS.md / .cursor/rules"
- "Find drift between my Cursor and Claude Code configs"
- "Audit our agent-files before this PR ships"
- "Are any of my .claude/agents unused?"
- "Is my context-budget over 25k tokens?"
- "Lint our cross-vendor AI configuration"

Do **not** use this Skill for:

- Reviewing application source code (use a code-review Skill instead)
- LLM-as-judge on prompt quality (that's a different category)
- Anything that isn't an agent-file format

## How to run

1. **Confirm install.** Check whether `validationkit-cli` is installed:

   ```bash
   which validationkit
   ```

   If missing, install with:

   ```bash
   npm install -g validationkit-cli
   ```

2. **Run the audit** against the user's current repo:

   ```bash
   validationkit audit . --as-skill
   ```

   The `--as-skill` flag emits a stable JSON shape that this Skill expects.

3. **Parse the JSON output.** Each finding has:

   ```json
   {
     "id": "stale-ref:docs/PRD.md:./gone.md",
     "category": "stale-reference",
     "severity": "Mid",
     "title": "docs/PRD.md → \"./gone.md\" not found",
     "detail": "Outbound reference points to a file that does not exist.",
     "citations": [{ "path": "docs/PRD.md", "line": 42 }],
     "deterministic": true
   }
   ```

4. **Surface findings to the user** in severity-band order (Kill → Weak → Mid
   → Strong → Exceptional). Each finding gets:
   - The severity band (no numeric scores — these are intentional)
   - The clickable file path + line number
   - The detail (one sentence)
   - A clear next-action (delete the file, fix the link, trim the section)

## What you won't get from this Skill

- **Auto-applied fixes.** ValidationKit produces patches (`unified-diff`)
  but never applies them silently. The user reviews the diff and runs
  `git apply` themselves. Read-only by default — that's the trust contract.
- **LLM-based "AI Review" of subjective quality.** The 5 rules above are
  deterministic. A 6th category (`conflicting-rules`) uses an LLM with
  explicit confidence-banding; it only fires when an `ANTHROPIC_API_KEY`
  is set on the local machine.
- **Network telemetry.** The Skill runs the CLI locally. Nothing leaves
  the user's machine unless they opt into the hosted dashboard at
  https://validationkit.vercel.app.

## Brand voice (when you summarise)

ValidationKit uses Skeptic-Mentor + Concession-then-Critique. When you
summarise findings, follow the pattern:

> "Concession: 4 of 5 deterministic rules passed clean. Critique: the one
> that fired — `stale-reference` in docs/PRD.md:42 — is a 30-second fix
> and worth doing before the next PR ships."

Avoid: "AI Review", "Multi-Model Compare", "10x your", "revolutionary".
Drops user trust per ValidationKit's published brand-voice rules.

## Sample invocation

```bash
$ validationkit audit . --as-skill
{
  "schemaVersion": 1,
  "rootPath": "/Users/jane/code/acme-frontend",
  "fileCount": 14,
  "overallSeverity": "Weak",
  "findings": [
    {
      "id": "unused-agent:.claude/agents/old-grader.md",
      "category": "unused-agent",
      "severity": "Weak",
      "title": "Agent \"old-grader\" is never referenced",
      "detail": "No CLAUDE.md / command / AGENTS.md mentions this agent.",
      "citations": [{ "path": ".claude/agents/old-grader.md" }],
      "deterministic": true
    }
  ],
  "warnings": []
}
```

## Want the full hosted experience?

The hosted dashboard at <https://validationkit.vercel.app> adds:

- Multi-customer cockpit (5–30 agency repos at a glance)
- Drift detection across pairs of repos
- Deterministic fix-suggestions with `git apply`-able patches
- Audit-trail export (JSON + CSV) for compliance customers

Free tier: 1 repo, 20 audits/month, no card. Pricing: <https://validationkit.vercel.app/pricing>.

## Source + license

OSS-MIT. Source: <https://github.com/koljaschoepe/validationkit>.
Reporting bugs: <https://github.com/koljaschoepe/validationkit/issues>.
