# validationkit-agent-file-audit (Anthropic Skill)

Drop this folder into `~/.claude/skills/` (or your project's `.claude/skills/`) to give Claude Code the ability to run a deterministic cross-vendor agent-file audit on demand.

## Install

### Per-project

```bash
mkdir -p .claude/skills
cp -r /path/to/this/folder .claude/skills/
```

### Globally (user-level)

```bash
mkdir -p ~/.claude/skills
cp -r /path/to/this/folder ~/.claude/skills/
```

Make sure `validationkit-cli` is installed:

```bash
npm install -g validationkit-cli
```

## Usage

Once the Skill is dropped, Claude Code auto-discovers it on the next session. Trigger it by asking, in plain English:

- "Audit my agent files."
- "Check my CLAUDE.md."
- "Find drift between Cursor and Claude Code configs."
- "Run a ValidationKit audit."

Claude reads `SKILL.md`, decides this Skill matches, runs `validationkit audit . --as-skill`, parses the JSON, and surfaces findings in the conversation.

## What this Skill is

A thin wrapper around `validationkit-cli`. The audit logic itself is in the OSS-MIT package; this Skill is the **trigger + instructions** layer so Claude knows when to call it and how to render the result.

## What this Skill is not

- Not an LLM-based review. The 5 deterministic rules + 1 opt-in LLM rule are run client-side by the CLI. No prompts go out unless the user has set `ANTHROPIC_API_KEY` locally.
- Not a CI integration. For CI, run `validationkit audit . --json` directly in your workflow file.
- Not the hosted dashboard. For multi-customer cockpit / drift detection / fix-suggestions / audit-trail export, see <https://validationkit.vercel.app>.

## Verifying the Skill loaded

```bash
# Should list validationkit-agent-file-audit
ls ~/.claude/skills/

# Spot-check the trigger frontmatter
head -8 ~/.claude/skills/validationkit-agent-file-audit/SKILL.md
```

## Updating

```bash
npm install -g validationkit-cli@latest
# Re-copy the SKILL.md if a newer one ships
```

## License

MIT. See [LICENSE](../../LICENSE).
