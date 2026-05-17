# A7 — Fix-Suggestion + Apply UX Patterns

**Agent:** A7 · **Date:** 2026-05-17 · **Scope:** "Finding→Fix→Applied"-Patterns übertragen auf VK-Audit-Findings.

---

## 1. Pattern-Compare (2026)

| Tool | Fix-Gen | Apply | Determinismus |
|---|---|---|---|
| **Sentry Autofix/Seer** | LLM (Claude) 3-Step: Root-Cause→Solution→Code | "Open PR" + Handoff zu Claude-Code/Cursor-Cloud-Agent | LLM-only [^1][^2] |
| **Snyk Fix PR** | DB-Lookup welche Min-Version fixed | 1-Click "Open a Fix PR"; Batch "Fix these vulnerabilities" | Deterministisch (CVE-DB) [^3][^4] |
| **Renovate** | Semver-Bump im Manifest | Auto-PR; `automerge=true` + `minimumReleaseAge: 14d` | 100 % deterministisch [^5][^6] |
| **Copilot Chat inline** | LLM | Ghost-Text + Tab-Accept; lint-aware auto-apply seit Nov 2025 | LLM [^7][^8] |
| **Cursor Apply** | LLM | One-Click "Apply" → stage → commit → PR | LLM-Vorschlag, deterministisches Patchen [^9] |

**Read:** Snyk+Renovate beweisen, dass deterministic-fix-PR vollständiges Produkt-Pattern ist — kein LLM, Trust höher (Fix-Universe enumerierbar). Sentry braucht 3-Stage-Reasoning *plus* Repo-Policy-Gate für Trust — teuer.

---

## 2. Fit-Matrix · 6 VK-Audit-Kategorien

| Finding | Fix-Universe | Flow | Phase |
|---|---|---|---|
| **Unused agent** | Endlich: `git rm` | Deterministisch | **0.5** |
| **Duplicate guidance** (≥0.85 cosine) | Endlich: 1 Block bleibt | Deterministisch + User-Dropdown "canonical" | **0.5** |
| **Stale reference** (dead link/SHA) | Endlich: remove or repoint | Deterministisch + 2-Button | **0.5** |
| **Token-overflow** | Mehrdeutig | Deterministic-fallback "trim oldest section" + LLM-augmented | **0.5/1** |
| **Context bloat** | Mehrdeutig | LLM-proposal, Diff-Preview, kein Auto-Apply | **1** |
| **Conflicting rules** | LLM-only | LLM-proposal, niemals auto-apply | **1** |

**4/6 deterministisch fixbar.** Matched ADR-0017 Constraint #13 ("Audit ist deterministic-first") + Snyk-Pattern.

---

## 3. UX · 1-Screen-Flow (Phase 0.5)

```
┌─ Audit Report · 47 files · 12 findings ────────────────────┐
│ [✓] Unused: .claude/agents/old-grader.md         [Apply]   │
│ [✓] Stale ref: docs/PRD.md L42 → MISSING         [Repoint▾]│
│ [✓] Duplicate: AGENTS.md L10-22 ≈ CLAUDE.md L34  [Pick▾]   │
│ [ ] Context bloat: CLAUDE.md 8.2k>6k             [LLM →]   │
│ …                                                          │
│ 3 of 12 selected · deterministic                           │
│ [Preview diff]  [Download patch]  [Open PR (M3+)]          │
└────────────────────────────────────────────────────────────┘
```

- **One-finding-one-fix Default, Batch via Multi-Select** (Renovate: gruppieren *können*, nicht müssen).
- **Preview-before-Apply Pflicht** (Cursor); Diff inline, expandable.
- **"Open PR" erst NACH GitHub-App-Mitigations** (M3+, Constraint #14). Vorher Patch-Download — matched Read-Only-Default.
- **LLM-Findings** mit "AI-proposal"-Badge, nie checked-by-default; Snyk-Analog `confidence: high|medium`.

---

## 4. Cool vs scammy

- **Scammy:** "AI fixed 87 issues" Banner. Snyk zählt stattdessen "X upgradable" + User-Select.
- **Cool:** Sentry's Root-Cause-Card *vor* Solution-Card [^2] — Reasoning sichtbar bevor Accept. VK-Analog: deterministischen Detection-Pfad zeigen ("3/4 Sub-Checks failed: link-resolver, sha-check, mtime") *vor* LLM-Vorschlag.
- **Trust-Killer:** Auto-Apply ohne Diff. Renovate nur mit 14-Tage-Safety-Net [^6] — VK soll Auto-Apply in Phase 0–1 komplett vermeiden.

---

## 5. Recommendation · Phasing

**Phase 0.5 (zero-cash, kein LLM):**
- 4/6 deterministische Fix-Kategorien (unused/duplicate/stale/token-overflow-trim).
- Patch-File-Download einziger Apply-Mode (kein GitHub-App nötig).
- Preview-Diff inline, Batch-Apply via Checkbox.
- Confidence 95 %+ (regelbasiert).

**Phase 1 (Anthropic-Budget + GitHub-App-Mitigations live ab M3):**
- LLM-augmented Fixes für context-bloat + conflicting-rules.
- "Open PR" zusätzlich zu Patch-Download.
- LLM-proposals mit Confidence-Banding {Low/Mid/High}, nie auto-checked.
- 30-File-Golden-Set-Eval vor jedem Multi-Model-Claim (Constraint #14).

**Phase 2+:** Auto-merge optional via Config (Renovate-Pattern), aber nur für unused-agent mit ≥30-Day-Staleness. Niemals Default.

---

[^1]: [Sentry — Autofix Docs](https://docs.sentry.io/product/ai-in-sentry/seer/autofix/) (2026-05-17)
[^2]: [Sentry+Claude Launch Analysis](https://blockchain.news/ainews/sentry-launches-claude-powered-fix-agent-from-root-cause-to-auto-pr-in-weeks-integration-analysis) 2026-04-08
[^3]: [Snyk — Fix Your Vulnerabilities](https://docs.snyk.io/scan-with-snyk/snyk-open-source/manage-vulnerabilities/fix-your-vulnerabilities) (2026-05-17)
[^4]: [Snyk Blog — Automatic Remediation](https://snyk.io/blog/snyk-fix-automatic-vulnerability-remediation-snyk-cli/) (2026-05-17)
[^5]: [Renovate — Automerge](https://docs.renovatebot.com/key-concepts/automerge/) (2026-05-17)
[^6]: [Renovate — Configuration Options](https://docs.renovatebot.com/configuration-options/) (2026-05-17)
[^7]: [VS Code — Copilot inline suggestions](https://code.visualstudio.com/docs/copilot/ai-powered-suggestions) (2026-05-17)
[^8]: [GitHub Community — Nov-2025 Copilot Roundup](https://github.com/orgs/community/discussions/180828) 2025-11
[^9]: [Builder.io — Cursor Alternatives 2026](https://www.builder.io/blog/cursor-alternatives-2026) (2026-05-17)
