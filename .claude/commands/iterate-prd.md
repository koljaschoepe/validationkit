---
description: Integrate new findings into PRD-ValidationKit-v2.md with consistency checks and ADR logging
argument-hint: "<short description of what changed and why>"
---

You are updating the ValidationKit PRD. The user is telling you what changed:

**$ARGUMENTS**

Process:

1. Invoke the `prd-iterator` agent with the user's message + relevant context.
2. The agent will:
   - Read the current PRD
   - Identify affected sections
   - Apply the change in PRD voice
   - Run cross-section consistency check
   - Log an ADR via `decision-logger`
   - Update Open-Questions list
3. If the change is strategic-fork-class (pricing pivot, naming change, scope kill), ALSO invoke `strategy-challenger` first for a stress-test BEFORE applying.
4. Confirm to the user:
   - Sections updated
   - ADR path
   - Open-Questions delta

Don't apply changes that violate the load-bearing constraints from `.claude/CLAUDE.md` (Multi-Provider, Citation-First, Severity-Bänder, Legitimate-Channels-Only) without an explicit user override and a `Superseded by`-class ADR.
