---
name: repo-audit
description: Audit a repository's agent-files for cross-vendor drift
trigger: when the user asks to audit agent-files or check CLAUDE.md health
---

# repo-audit

Walk the repo, parse known agent-file formats, surface findings with citations.
Use the `validationkit-cli` if installed; otherwise fall back to manual file
inspection.
