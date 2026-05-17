---
description: Record an ADR-style strategic / architectural / pricing / naming / scope decision in decisions/
argument-hint: "<decision title or short description>"
---

Capture this decision as an ADR:

**$ARGUMENTS**

Process:

1. Ask up to 3 clarifying questions if any of these is unclear:
   - What was the alternative considered?
   - What is the trigger condition to revisit this?
   - Which PRD section does this affect?
2. Invoke the `decision-logger` agent with all gathered context.
3. After ADR is written, check if PRD-ValidationKit-v2.md §32 Decisions Log should be updated (typically yes). If so, invoke `prd-iterator` with a minimal-scope update to add the ADR-link.
4. Report back: ADR path + PRD update applied (yes/no).
