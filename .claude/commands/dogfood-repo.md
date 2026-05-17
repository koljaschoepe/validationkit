---
description: Weekly self-audit cadence. Runs ValidationKit's own framework (audit + drift + BiP-draft) against the validationkit repository itself. Founder-bias mitigation via the tool we sell.
argument-hint: "(optional) target subpath — defaults to repo root"
---

You're running the weekly self-dogfood loop. ValidationKit on ValidationKit.

**Why this exists:** if our own repo can't pass our own audit, we lose credibility with the first customer who runs the demo. The cadence catches drift before it embarrasses us in a Mom-Test session.

**Target:**

$ARGUMENTS

(If empty, target is the repo root.)

## Process

1. **Pre-check:** ensure `pnpm build` is clean. If anything's broken, stop here — fix the build, then re-run dogfood.

2. **Audit run:**
   ```
   node packages/cli/bin/validationkit.mjs audit <target> --out=interviews/dogfood/$(date +%Y-%m-%d)-audit.md
   ```
   Write the markdown output into `interviews/dogfood/` (git-ignored). Read it.

3. **Drift run** (only if target == repo root): compare repo root against `examples/sample-good` as a synthetic-canonical baseline.
   ```
   node packages/cli/bin/validationkit.mjs drift <target> examples/sample-good --out=interviews/dogfood/$(date +%Y-%m-%d)-drift.md
   ```

4. **Surface top-3 findings:** read both reports, identify the 3 most-important findings ordered by severity. For each:
   - The category and severity-band.
   - Why it matters (one sentence — not "context is bloated" but "context is bloated because we doubled CLAUDE.md without splitting").
   - The fix (one sentence — what file changes by what amount).

5. **Decision per finding:**
   - **Kill:** the finding is a false-positive given current architecture. Document why in `interviews/dogfood/<date>-decisions.md`. Update the manifest entry's `max_findings` if recurring.
   - **Iterate:** fix in this session. Reference the audit-line as the proximate cause.
   - **Defer:** add to TODO.md Sprint 0.10+ backlog with a one-line "from dogfood YYYY-MM-DD" trace.

6. **Generate BiP-thread draft:** if at least 1 finding was non-trivial:
   - Navigate the dev UI to `/bip?source=audit&id=<scanId>` after persisting the run (requires logged-in mode).
   - OR generate the draft via the CLI hook (Sprint 0.10 follow-up — not yet wired).
   - Save the chosen draft into `docs/bip-posts/YYYY-MM-DD-dogfood-NN.md` where NN is the post number that day.

7. **STATUS.md update:** add a one-line note to "Recent Decisions / Pivots" with what was found + what was decided.

8. **Cadence check:** target is weekly. If the last `interviews/dogfood/` entry is < 7 days old, stop and ask "are you running this off-schedule? Confirm intent before continuing." If > 14 days old, flag in STATUS as a yellow "dogfood-debt" risk.

## Severity-band response matrix

| Band | Response |
|---|---|
| `Kill` | Stop the sprint. Fix this finding before any other work. |
| `Weak` | Fix in current sprint. Don't ship Sprint-end until resolved. |
| `Mid` | Add to next sprint's must-do list. |
| `Strong` | Document why we're OK with it; usually no action. |
| `Exceptional` | Note in BiP draft as a positive specific. |

## Anti-patterns to refuse

- **"Just suppress the finding":** never. If the rule is wrong, fix the rule. If the finding is wrong, fix the data. Never silence.
- **"It's not real because we're the makers":** the audit rules don't care who wrote the file. Treat self-findings with the same severity as customer-findings.
- **"We'll fix it later":** the cadence is the thing. Move it to Defer with a date, or fix now.

## Output structure

After this command runs, the following exist:
- `interviews/dogfood/<YYYY-MM-DD>-audit.md` — full audit markdown.
- `interviews/dogfood/<YYYY-MM-DD>-drift.md` — full drift markdown (when run on root).
- `interviews/dogfood/<YYYY-MM-DD>-decisions.md` — your kill/iterate/defer notes per finding.
- `docs/bip-posts/<YYYY-MM-DD>-dogfood-NN.md` — BiP draft (if non-trivial finding existed).
- STATUS.md updated.

This loop IS the source of authority for our brand promise. If we skip it, the audit rules drift from what we'd actually defend in front of a Customer.
