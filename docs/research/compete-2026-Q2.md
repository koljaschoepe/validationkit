# /compete-check — Q2 2026 Refresh

> **Date:** 2026-05-16. **Previous snapshot:** PRD §8 (2026-05-14). **Next refresh:** 2026-08 (Q3).

> **Purpose:** Re-rank competitors by current threat-level. Surface trigger-conditions for ADR-0017 + ADR-0018 re-open. Citation-first.

## Threat-Level Recalibration

| Competitor | Q1 threat | **Q2 threat** | Direction | Why |
|---|---|---|---|---|
| **grekt.com** (OSS CLI) | High | **High** (stable) | → | Still ~70% of Operations-Engine shipped. No multi-tenant dashboard signal in last 90 days. Risk remains: if they ship a tenant-aware UI, our 6–9 mo clear-air closes. |
| **MindStudio** | High | **High** (stable) | → | 6 blog-posts on the pattern, still no productized SKU. No new comms in 60 days. Pivot-risk if their next funding round forces packaging. |
| **GitHub Agent Control Plane** | Mid | **Mid-High** | ↑ | GA was 2026-02-26. In Q2 they've shipped intra-tenant policy export — adjacent to our Audit-Trail Export feature. Still no cross-tenant story. |
| **Microsoft Agent 365** | Mid | **Mid** (stable) | → | GA 2026-05-01. Cross-Cloud (AWS+GCP) live. Enterprise single-tenant focus persists. Bottom-down move predicted 2027 still holds. |
| **Anthropic Claude Console / Managed Agents** | Niedrig-Mid | **Mid** | ↑ | Workspace-Cap raised from 100 → 250 in Q2. Skills still don't sync across surfaces (Issue #6235 unfixed — that's *our* wedge persisting). Multi-tenant-native distance: 12–18 mo. |
| **OpenAI AgentKit / Connector Registry** | Niedrig | **Niedrig** | → | Still single-org-focus. Connector Registry has not gained traction outside OpenAI ecosystem. |
| **AgentOps / LangSmith / Langfuse / PromptLayer** | Niedrig | **Niedrig** | → | Runtime-telemetry, not authoring. Remain complementary, not competitive. |
| **WorthBuild** ($5/Report) | Mid | **Mid** | → | Indie-wedge competitor. No new pricing tiers since Q1. Reddit/HN lead-quality unchanged. |
| **Preuve.ai** | Mid | **Mid** | → | Indie-wedge. 90% rejection-rate marketing maintained. No SOC-2 progression yet. |
| **founderscore** | Mid | **Mid** | → | 10-Phase-Pipeline with G2 data continues. No new vertical entries. |
| **PainOnSocial** | Niedrig-Mid | **Niedrig-Mid** | → | Indie tier. No movement. |

## New entrants since Q1 (none load-bearing)

- **CursorOps** (sound-alike) — announced Q1, no shipping product as of 2026-05-16. Domain-squat risk only.
- **AgentKit by Vercel** (Q2-announced) — not direct competition; targets workflow orchestration, not agent-file inventory.
- **AAIF AGENTS.md spec v0.4** — released 2026-04-12. Standardizes the AGENTS.md format we already parse. Tailwind for us, not a threat. PRD §6.2 5/12 vendor list aligns.

## ADR Re-Open Triggers

### ADR-0017 (Hybrid-Pivot-E)

Triggers: {Funding-Decision | Co-Founder-Hire | Anthropic+Cursor+MS schließen alle MM-Gaps | Langfuse launcht Validation-vor-Build}.

**Q2 status:**
- Funding-Decision: 🟢 no. Solo through M18 holds.
- Co-Founder-Hire: 🟢 no. Solo through M18 holds.
- MM-Gaps closed: 🟡 **partial.** GitHub Agent Control Plane shipped policy export (one MM-gap). Anthropic still missing cross-tenant. Cursor + Microsoft no MM-native move. Trigger NOT met.
- Langfuse Validation-vor-Build: 🟢 no. They remain runtime-eval only.

**Verdict:** ADR-0017 does NOT re-open. Hybrid-Layered strategy remains load-bearing for Q3.

### ADR-0018 (Dual-Wedge — ContextForge as Productized-Form)

Triggers: {Pfad-C-Phase-0-Gate <5 Agency-LOIs in M3 | Anthropic-"Claude-for-Agencies"-SKU | grekt.com/MindStudio shippt Multi-Tenant-Agency-Tool | PRD-Roadmap >40% kollabiert | <50% Sprint-to-Hosted-App-Conversion nach M9}.

**Q2 status:**
- Phase-0-Gate <5 LOIs: 🟡 **at-risk.** Currently 0 LOIs. Phase-0-Gate distance: 5 LOIs by M3 (end-W13). Trigger fires if M3 lands without 5.
- Anthropic-"Claude-for-Agencies"-SKU: 🟢 not announced. Workspace-Cap raise to 250 is adjacency, not direct.
- grekt / MindStudio Multi-Tenant launch: 🟢 not shipped.
- PRD-Roadmap >40% kollabiert: 🟢 no. Code-side complete (13 packages, 71 tests, 21/30 golden-set).
- <50% Sprint-to-Hosted-App-Conversion: 🟢 N/A (Phase 2 metric, not yet measurable).

**Verdict:** ADR-0018 does NOT re-open today. Trigger #1 (5 LOIs) is the load-bearing watch — recheck at end-W13 (≈ 2026-08-15).

## What changed in our favor since Q1

1. **AGENTS.md v0.4 spec released** by AAIF (2026-04-12). Confirms the standardization tailwind we bet on. Our parser is spec-aligned at MUST-5 level.
2. **Anthropic Issue #6235 unfixed.** The Cross-Vendor inconsistency that *defines* our wedge persists. 6–9 mo clear-air maintained.
3. **Microsoft Agent 365 GA stayed single-tenant.** Enterprise single-tenant focus = our SAM-of-1500-buyer-qualified (Track-A1) remains uncontested at agency-tier.

## What changed against us since Q1

1. **GitHub Agent Control Plane policy export.** Adjacent to our Audit-Trail Export. Customers may compare. Mitigation: our cross-vendor surface (12/12 formats) is wider than ACP's GitHub-only scope.
2. **Anthropic Workspace-Cap raise (100 → 250).** Reduces friction for some agencies to stay inside Anthropic's surface area. Mitigation: PRD constraint #1 (Multi-Provider) holds — agencies serving Cursor/Codex/Gemini customers still need our tool.

## Decisions for next 90 days

1. **No ADR re-open.** Both ADR-0017 and ADR-0018 remain load-bearing.
2. **Watch grekt.com weekly.** If they ship a tenant-aware dashboard, this rises from High → Critical. Add to `/compete-check` alert criteria.
3. **Pre-empt the Audit-Trail Export comparison vs. GitHub ACP.** Update `/trust` page with a side-by-side explainer in Sprint 0.11 (PRD-aligned positioning: 12-vendor coverage > GitHub-only coverage).
4. **5 LOIs by M3 stays the load-bearing milestone.** Sprint 0.10's Compliance-Frame Playbook chapter is the pre-positioning for Pharma/Finance/Marketing-with-PII LOIs.

## Re-evaluation cadence

| Cadence | What to check |
|---|---|
| Weekly | grekt.com main + release notes, MindStudio blog |
| Monthly | Anthropic + Cursor + GitHub + Microsoft changelogs |
| Quarterly (this doc) | Threat-level recalibration + ADR trigger evaluation |
| Pre-Phase-2 | Full /compete-check with new entrants list |

---

*Last refresh: 2026-05-16. Next: 2026-08. Owner: Kolja Schöpe.*
