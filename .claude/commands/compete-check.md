---
description: Run a competitor recon — full quarterly sweep or targeted check for a single competitor
argument-hint: "[optional: competitor name for targeted check, else full sweep]"
---

Run a competitor recon for ValidationKit.

**Target:** $ARGUMENTS

If $ARGUMENTS is empty → full quarterly sweep (all targets in `competitor-recon` agent spec).
If $ARGUMENTS names a single competitor → targeted single-competitor check (faster, deeper).

Process:

1. Invoke the `competitor-recon` agent.
2. After the recon report is written to `analysis/competitor-recon-<YYYY-MM-DD>.md`:
   - If any RED flag → invoke `strategy-challenger` to stress-test current positioning against the RED finding.
   - Suggest a `/iterate-prd` follow-up if PRD §6 needs an update.
3. Report back to user:
   - Recon report path
   - RED / YELLOW / GREEN summary
   - Single most consequential finding
   - Recommended next action
