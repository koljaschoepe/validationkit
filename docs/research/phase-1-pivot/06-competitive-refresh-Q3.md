# 06 — /compete-check Q3 2026 Refresh

> **Date:** 2026-05-17. **Previous:** [`docs/research/compete-2026-Q2.md`](../compete-2026-Q2.md) (2026-05-16). **Next refresh:** 2026-08. **Agent:** A6.

> **Scope:** Quarterly recalibration per PRD §8 cadence. Per-competitor severity-band, ADR-0017 + ADR-0018 trigger-fire scan, Skeptic-Mentor voice.

---

## TL;DR

Three signals broke against us in 72 hours — and one of them, **Anthropic's Claude Partner Network ($100M, Accenture/Deloitte/PwC, launched 2026-03-12)**, is the one Kolja keeps explicitly listing as the ADR-0018 trigger. It is **not** a "Claude-for-Agencies SKU" in the strict sense — it's a free training/co-sell program, not a multi-tenant agent-file-inventory product ([Anthropic, 2026-03-12](https://www.anthropic.com/news/claude-partner-network)). So the trigger **does not fire by the letter of ADR-0018**. But the spirit changed: Anthropic now owns the "enterprise rolls out Claude through a partner" narrative, and Tribe AI / Slalom are on that partner list — exactly the agencies our `/operations` wedge was built for. **Watch monthly, not quarterly.**

Second: **three direct agent-file linters shipped in Q1–Q2** (AgentLint, AgentLinter, agents-lint). All are single-tenant, all are OSS-CLI-only, but the **wedge is no longer empty**. Our differentiation is now narrower: cross-vendor coverage breadth (12-format-parser, 5 MUST) + multi-customer-tenant + hosted-SaaS — *not* "we lint AGENTS.md."

Third: **grekt-labs/dashboard still single-tenant** (v1.0.0, 2026-03-12, BUSL-1.1). No `--tenant` flag, no Clerk-auth, no agency-fork in 9 weeks. The 4-7-month clear-air from the A10 dashboard-pivot research **holds**.

**Verdict: No ADR re-open today.** But two watch-list upgrades and one new entrant category to track.

---

## Per-competitor recalibration

### Severity bands: Kill / Mid / Weak / Watch

| Competitor | Q2 | **Q3 (now)** | Δ | Severity | Why |
|---|---|---|---|---|---|
| **Anthropic Claude Partner Network** | not on list | **on list, Mid-High ↑↑** | NEW | **Mid** | $100M, Accenture+Deloitte+PwC+Tribe AI+Slalom as Day-1 partners. Free membership. Not a tool, but owns the channel narrative for our Agency-wedge. ([Anthropic news](https://www.anthropic.com/news/claude-partner-network)) |
| **AgentLint** (agentlint.app) | not on list | **NEW, Weak-Mid** | NEW | **Weak** | OSS CLI, MIT, audits Claude+Cursor+Copilot+Codex+Gemini+Windsurf+Cline. 33 evidence-backed checks. No multi-tenant, no hosted SaaS. ([agentlint.app](https://www.agentlint.app/)) |
| **agents-lint** (github.com/giacomo) | not on list | **NEW, Weak** | NEW | **Weak** | 8 stars, MIT, v0.5.0 on 2026-03-26. Path/script/framework staleness. Single-tenant. Solo OSS dev. ([github.com/giacomo/agents-lint](https://github.com/giacomo/agents-lint)) |
| **AgentLinter** (agentlinter.com) | not on list | **NEW, Weak** | NEW | **Weak** | Free, OSS, v0.1.0 → v2.3.0 in 5 weeks (2026-02-05 → 2026-03-14). Solo founder (@simonkim_nft). Cross-vendor breadth claimed but unverified. ([agentlinter.com](https://agentlinter.com/)) |
| **grekt-labs/dashboard** | High ↑ | **High → stable** | → | **Mid-High** | v1.0.0 frozen since 2026-03-12. 57 commits on main, no multi-tenant signal. BUSL-1.1 still — Dual-license play hint. ([github.com/grekt-labs/dashboard](https://github.com/grekt-labs/dashboard)) |
| **MindStudio** | Mid → | **Mid → stable** | → | **Watch** | No agency-SKU. Multi-agent-orchestration content drift continues. |
| **GitHub Agent Control Plane** | Mid-High → | **Mid-High → stable** | → | **Mid** | Still intra-tenant only. No cross-enterprise aggregation. Our 12-vendor surface > GitHub-only. |
| **Microsoft Agent 365** | Mid → | **Mid → stable** | → | **Watch** | GA held single-tenant. Bottom-down predicted 2027 still holds. |
| **WorthBuild** | Mid → | **Mid → stable** | → | **Mid** (Indie-wedge only) | Still $5/report. No operations-side product. Zero overlap with Agency-wedge. ([worthbuild.io](https://worthbuild.io/)) |
| **Preuve.ai** | Mid → | **Mid ↑ slightly** | ↑ | **Mid** (Indie-wedge only) | Added $499 Investor-Ready Package and Radar ($9/mo monitoring). 13-section report, 40+ sources, AI-pivot-recommendations. Bootstrapped. ([preuve.ai](https://preuve.ai/)) |
| **founderscore** | Mid → | **Mid → stable** | → | **Mid** (Indie-wedge only) | 10-phase pipeline unchanged. |
| **Langfuse / Helicone / LangSmith** | Niedrig → | **Niedrig → stable** | → | **Weak** | No pre-build validation feature shipped Q2. Langfuse roadmap is runtime-eval + dataset + Experiments-CI/CD. ADR-0017 Trigger #4 still 🟢 not fired. ([Langfuse roadmap](https://langfuse.com/docs/roadmap)) |
| **Cursor 3 / Windsurf Wave 13** | adjacency | **adjacency** | → | **Watch** | Cursor 3 Agents Window = multi-agent across worktrees; Windsurf parallel Cascade sessions. Both inside one IDE, neither manages agent-files across customers. Adjacency, not threat. ([Verdent Guides 2026-Q2](https://www.verdent.ai/guides/windsurf-vs-cursor-2026)) |
| **ContextForge** (IBM/MCP) | not relevant | **NAME-COLLISION** | NEW | **Watch** | IBM-OSS MCP gateway, *not* our product space. But the name is now load-bearing for our productized-form. Naming-Lawyer prep (PRD §M8) must factor in IBM trademark. ([IBM/mcp-context-forge](https://github.com/IBM/mcp-context-forge)) |
| **Microsoft agent-forge** | not on list | **NEW, Watch** | NEW | **Weak** | OSS toolkit, generates `.github/copilot-instructions.md` from a description. Single-vendor (Copilot only), single-repo. ([github.com/microsoft/agent-forge](https://github.com/microsoft/agent-forge)) |

---

## Concession-then-Critique — the over-rated threats

**Anthropic Claude Partner Network is being mis-categorized as "Claude-for-Agencies."** It is not. It's a free training-and-leads program with a $100M co-sell pot. Accenture and Deloitte do not need our agent-file inventory — they have 50 000 consultants who'll build it in-house. **The agencies we serve** (5–30 person AI-consultancies, AAIF members) are 10× too small to land Partner Portal access in the first 12 months. The *real* threat from this announcement is not the product surface — it's that **Anthropic is signaling that "enterprise AI consulting" is a category worth $100M of activation spend.** That ratifies our Agency-wedge thesis (PRD §3, §6.2) and adds market pull. So: Concession — the channel narrative shifted. Critique — the buyer-overlap for our Phase 0–1 targets is <10%. Watch monthly, don't panic.

**AgentLint sounds scary; it isn't (yet).** The Dev.to launch post "74% of your AGENTS.md is wasting your AI agent's time" is the kind of viral-claim that drives 5 000 stars in week one. But: zero hosted-SaaS, zero multi-tenant, zero cross-customer-inventory. They lint *one repo at a time*. Our Agency-wedge sells **cross-customer cockpit, drift-detection across 5–30 customer repos, deterministic audit-report with severity-bands** — none of which AgentLint, AgentLinter, or agents-lint touch. **They strengthen the AGENTS.md standardization tailwind** (PRD §6.2). They do *not* compete on multi-customer operations.

**Preuve.ai's Radar ($9/mo monitoring) is the only Indie-wedge upgrade worth noting.** Adds a recurring-revenue surface — closer to our $19/mo PLG-tier. If they bundle Radar into Investor-Ready ($499), they erode the price-anchor for our `/validate` Hosted-tier. Mitigation: lean harder on Cross-Vendor agent-file-trust as the wedge that Preuve cannot match (they have no agent-file surface at all).

---

## ADR Re-Open Trigger Scan

### ADR-0017 (Hybrid-Pivot-E)

Triggers: {Funding | Co-Founder-Hire | Anthropic+Cursor+MS schließen alle MM-Gaps | Langfuse Validation-vor-Build}.

| Trigger | Q2 status | **Q3 status (2026-05-17)** |
|---|---|---|
| Funding-Decision | 🟢 | 🟢 no — solo through M18 holds |
| Co-Founder-Hire | 🟢 | 🟢 no |
| MM-Gaps closed (Anthropic+Cursor+MS) | 🟡 partial | 🟡 **partial, no change** — Cursor 3 + Windsurf Wave 13 added intra-IDE multi-agent, not cross-customer-tenant |
| Langfuse Validation-vor-Build | 🟢 | 🟢 no — Q2 roadmap = Experiments CI/CD + Academy, no pre-build validation surface |

**Verdict: ADR-0017 does NOT re-open. Hybrid-Layered (Pivot-E) remains load-bearing.**

### ADR-0018 (Dual-Wedge — ContextForge as Productized-Form)

Triggers: {<5 Agency-LOIs by M3 | Anthropic-"Claude-for-Agencies"-SKU | grekt/MindStudio Multi-Tenant launch | PRD-Roadmap >40% kollabiert | <50% Sprint-to-Hosted-App-Conversion by M9}.

| Trigger | Q2 status | **Q3 status (2026-05-17)** |
|---|---|---|
| <5 Agency-LOIs by M3 | 🟡 at-risk (0/5) | 🟡 **at-risk (0/5) — unchanged, recheck end-W13 (~2026-08-15)** |
| Anthropic-"Claude-for-Agencies"-SKU | 🟢 | 🟡 **adjacency-fired, trigger-letter NOT met** — Partner Network is training/co-sell, not a multi-tenant tool. Watch monthly. |
| grekt/MindStudio Multi-Tenant launch | 🟢 | 🟢 **no** — grekt v1.0.0 frozen single-tenant 9 weeks; MindStudio no agency-SKU |
| PRD-Roadmap >40% kollabiert | 🟢 | 🟢 no |
| <50% Sprint→Hosted-App-Conversion by M9 | 🟢 N/A | 🟢 N/A (Phase 2 metric) |

**Verdict: ADR-0018 does NOT re-open today.** But **Trigger #2 (Anthropic agency-SKU) is now amber-not-green** — re-classify from quarterly-watch to **monthly-watch**.

---

## Decisions for next 90 days

1. **No ADR re-open.** Both 0017 and 0018 load-bearing through Q3.
2. **Add Anthropic Claude Partner Network to monthly-watch** alongside grekt.com. If Anthropic ships a Partner-Portal product surface (not just docs/playbooks) that includes any multi-customer-inventory feature, **ADR-0018 Trigger #2 fires immediately**.
3. **Position against the AGENTS.md-linter category.** Update `/trust` and landing copy to lead with **"cross-customer cockpit"** and **"5/6 deterministic finding-categories"** — not "AGENTS.md linter." The category just got noisy.
4. **Naming-Lawyer M8 prep: factor IBM/mcp-context-forge.** ContextForge as productized-form name needs trademark-clearance for IBM-OSS collision risk. Move into M8 sprint-planning template now.
5. **5 LOIs by M3 remains the load-bearing milestone.** Sprint-0.10 Compliance-Frame Playbook is still the pre-positioning lever — and Anthropic's $100M Partner Network ratifies the market.

---

## Re-evaluation cadence (updated)

| Cadence | What to check |
|---|---|
| **Monthly** | Anthropic Partner Network product-surface, grekt.com main+release notes, MindStudio blog, Cursor/Windsurf changelog |
| Quarterly (this doc) | Threat-level recalibration + ADR trigger evaluation |
| Pre-Phase-2 | Full /compete-check with new entrants list + name-clearance audit |

---

*Last refresh: 2026-05-17. Next: 2026-08. Owner: Kolja Schöpe. Agent: A6.*
