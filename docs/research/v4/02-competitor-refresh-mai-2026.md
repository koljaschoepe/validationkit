# Competitor Refresh — ContextForge (May 2026)

> **Research-track A2 — ContextForge PRD validation.** Refresh competitive landscape as of Mai 2026 — what's shipped, what's announced on roadmaps, who is closest to ContextForge's exact wedge ("Read-only GitHub-App, inventory, drift-detection, AI-review, template-distribution via PRs for 5–30 customer repos managed by AI-consultancies").
>
> Author: subagent (analysis-v4, run 2026-05-16). Accessed all URLs 2026-05-16 unless noted.

---

## TL;DR — Severity-Banded Verdict Per Competitor

| # | Competitor | What it does today | Threat-Level to ContextForge | Reason in one line |
|---|---|---|---|---|
| 1 | **GitHub Agent HQ + Agent Control Plane (GA 2026-02-26)** | Custom-agents pushed enterprise-wide from `.github-private/agents/*.md`; AI Controls Tab; org-level policies | **Direct Threat (within Enterprise)** | Has the distribution mechanism — but only *within one Enterprise account*. Cross-customer = manual. |
| 2 | **Microsoft Agent 365 (GA 2026-05-01)** | Centralized agent registry, AWS Bedrock + GCP sync, approval flow, lifecycle mgmt; $15/user/mo | **Adjacent Threat** | Single-tenant control plane. No "manage 5–30 client tenants from one console" story. |
| 3 | **Anthropic Claude Managed Agents + Code Review (Mar–May 2026)** | Per-PR multi-agent review, REVIEW.md+CLAUDE.md customization, enterprise managed policy settings, Compliance API | **Adjacent Threat** | Per-org admin only. "Skill inventory" not productized. |
| 4 | **OpenAI AgentKit + Connector Registry (beta May 2026)** | Cross-workspace data-source governance via Global Admin Console | **Adjacent Threat (data-side, not code-side)** | Focused on data connectors, not on coding-agent setups. |
| 5 | **grekt.com (Product Hunt 2026)** | OSS CLI: inventory, SHA-locked artifacts, drift-detection, sync across Claude/Cursor/OpenCode | **Direct Threat (functional overlap)** | Local-first OSS does ~70 % of ContextForge's mechanical work. But: no GitHub-App, no agency dashboard, no client billing. |
| 6 | **Cursor Teams "Team Rules" + Enterprise Admin (May 2026)** | Cloud-pushed rules, recommend/require, model+spend controls | **Adjacent Threat** | Cursor-only. No multi-customer parent-account consolidation (open feature request). |
| 7 | **AITMPL (aitmpl.com) + claude-code-templates** | 1000+ free components, install-CLI, plugin marketplace | **Complementary** | Distribution layer for *content*. Not a management plane. |
| 8 | **AGENTS.md / Agentic AI Foundation** | LF-stewarded open standard, 60k repos, 170+ AAIF members | **Complementary (standard, not product)** | Standardization helps ContextForge (Cross-Vendor wedge), not threatens it. |
| 9 | **Anthropic Skills Marketplace (4 200+ skills, May 2026)** | Open standard, org-wide enable/disable in admin panel | **Adjacent Threat** | Skills *catalog*, not skill-fleet-mgmt across customers. |
| 10 | **HiveTrail Mesh** | JIT context engine, local files, reusable stacks | **Complementary (different layer)** | Mesh is per-developer context-loader, not multi-customer governance. |
| 11 | **AgentOps / LangSmith / Langfuse / PromptLayer / Arize** | LLM observability + tracing | **Adjacent (different surface)** | Watches runtime behavior, doesn't manage SETUP artifacts. |
| 12 | **MindStudio "Context Inheritance" pattern** | Blog/methodology (parent-folder CLAUDE.md across clients) | **Pivoting Toward Us (manifesto, not product)** | They've *documented* the problem ContextForge solves. No product yet. |
| 13 | **Multica / protect-mcp / Stacklok / TrueFoundry / MintMCP** | MCP governance, tool-call signing, policy enforcement | **Adjacent (different layer)** | Runtime governance, not setup-fleet governance. |
| 14 | **ClaudeFast Code Kit / claude-flow (legacy v3 names)** | Per-project templates | **Dead / Subsumed** | No 2026 traction; subsumed by AITMPL + Anthropic Skills. |

**Headline verdicts.**
1. **"Niemand hat ein dediziertes Multi-Tenant-Tool für AI-Consultancies"** → **Still true in Mai 2026, but the window is closing fast.** GitHub Agent Control Plane (Feb 2026 GA) and Microsoft Agent 365 (May 2026 GA) both ship intra-tenant agent-fleet mgmt. The gap is *inter-tenant* / *cross-customer* — exactly ContextForge's wedge. But:
2. **grekt.com is the closest functional analog** and is already shipping (OSS CLI, local-first, no GitHub-App). It does not target agencies, it targets individual developers — but its primitives (inventory, drift-check, sync) are 70 % of the ContextForge engine. Time-to-pivot-into-agency-mgmt: weeks, not months.
3. **Time-to-Anthropic-native-multi-tenant: 9–15 months** with low-to-medium confidence. Anthropic's May 2026 admin push (groups, SCIM, Compliance API, enterprise managed policy settings) is the precursor; a "manage Claude Code across N client orgs" feature is the logical extension but not on a public roadmap as of 2026-05-16.

---

## 1. GitHub Agent HQ + Agent Control Plane — **Direct Threat (within Enterprise)**

### What shipped

- **Agent HQ launched at GitHub Universe, 2025-10-28** ([GitHub Blog, 2025-10-28](https://github.blog/news-insights/company-news/welcome-home-agents/)). Pitch: "any agent, any way you work" — agents from Anthropic, OpenAI, Google, Cognition, xAI inside paid Copilot subscriptions, no surcharge.
- **Enterprise AI Controls + Agent Control Plane**: public preview 2025-10-28 ([GitHub Changelog](https://github.blog/changelog/2025-10-28-enterprise-ai-controls-the-agent-control-plane-are-in-public-preview/)), **GA 2026-02-26** ([GitHub Changelog](https://github.blog/changelog/2026-02-26-enterprise-ai-controls-agent-control-plane-now-generally-available/)).
- **Custom-agents distribution**: "API support to programmatically apply enterprise-wide custom agent definitions … set the source organization and list custom agents defined in the canonical `.github-private/agents/*.md` repository path. Use 1-click push rule to protect the static file path for custom agents (i.e., `.github/agents/*.md`) across their enterprise from edits" ([GitHub Changelog, 2026-02-26](https://github.blog/changelog/2026-02-26-enterprise-ai-controls-agent-control-plane-now-generally-available/)).
- **New admin role**: decentralized agent admin without full org-admin access; assignable permissions for audit log view, agent session mgmt, AI Controls config (ibid.).

### Pricing

- Copilot Business: $19/user/mo. Copilot Enterprise: $39/user/mo (GHEC only) ([GitHub pricing calc, accessed 2026-05-16](https://github.com/pricing/calculator)).
- Agent HQ partner agents bundled in existing Copilot subscriptions; no surcharge ([Digital Applied, 2025](https://www.digitalapplied.com/blog/github-agent-hq-multi-agent-platform)).
- Usage-based billing for Copilot from 2026-06-01 ([NxCode, 2026](https://www.nxcode.io/resources/news/github-copilot-complete-guide-2026-features-pricing-agents)).

### Gap analysis vs ContextForge wedge

GitHub's Agent Control Plane is **the** intra-Enterprise distribution channel for `.github/agents/*.md` custom-agent files. It has:
- Source-org → enterprise-wide push (✓)
- File-path-protection-rule (✓)
- API for programmatic apply (✓)
- AI Controls Tab as single home (✓)

**What's still missing for a solo consultancy with 5–30 customer repos:**
1. **Each customer is its own GHEC tenant.** The agent control plane scopes inside *one* Enterprise account. A consultancy serving Acme + Bravo + Charlie can't push the same `agents/security-review.md` to all three from one console.
2. **No cross-tenant drift reporting** ("Acme has v1.2 of security-review, Bravo still on v0.9").
3. **No support for non-GitHub artifact paths** (`CLAUDE.md`, `.claude/agents/`, `.cursorrules`, `.codex/`, `.gemini/`). GitHub Agent HQ standardizes on `.github/agents/*.md` only.

**Verdict.** Direct threat **inside** any single Enterprise customer of a consultancy. For the consultancy itself — i.e. the operator running 5–30 different enterprise relationships — Agent Control Plane is *not* a substitute. ContextForge's wedge holds, but the customer-side now has a competing in-house solution → consultancies will be asked "why don't we just use Agent HQ?" by their largest clients within 6 months. Need defensive answer ready (Cross-Vendor, non-GitHub artifacts, agency-billing-model).

### Roadmap signals

- VS Code 1.110 quietly shipped early Agent HQ UI hooks (Futurum, [2026](https://futurumgroup.com/insights/did-github-agent-hq-quietly-show-up-in-microsoft-vs-code-1-110/)).
- Microsoft Build 2026 (May 2026) likely deepens GitHub ↔ Microsoft Agent 365 cross-pollination. No public confirmation of "multi-org Agent HQ" yet — feature requests in community threads, no roadmap commitment.

---

## 2. Microsoft Agent 365 — **Adjacent Threat**

### What shipped

- **GA 2026-05-01** at $15/user/mo ([Microsoft Security Blog, 2026-05-01](https://www.microsoft.com/en-us/security/blog/2026/05/01/microsoft-agent-365-now-generally-available-expands-capabilities-and-integrations/), [VentureBeat, 2026](https://venturebeat.com/technology/microsoft-takes-agent-365-out-of-preview-as-shadow-ai-becomes-an-enterprise-threat)).
- Microsoft 365 E7 "Frontier Suite" bundles E5 + Copilot + Agent 365.
- **Cross-cloud registry sync**: AWS Bedrock + Google Cloud Vertex AI public preview ([Microsoft Community, 2026-05](https://techcommunity.microsoft.com/blog/agent-365-blog/what%E2%80%99s-new-in-agent-365-may-2026/4516340)).
- **Agent approval & publication flow**: admins review agents pre-rollout in registry (ibid.).
- **Lifecycle ops**: install/publish/block/unblock/delete/assign-owner directly in registry.

### Gap analysis vs ContextForge wedge

Agent 365 = **single Entra tenant's** control plane for agent governance. Cross-tenant model is "notification + indirect enforcement" via Entra conditional access ([Valoremreply, 2026](https://www.valoremreply.com/resources/insights/blog/azure/what-is-microsoft-agent-365-the-control-plane-for-enterprise-ai-agents-explained/)). This is for the customer's own multi-cloud — **not for a consultancy managing N customer tenants**.

Even MSPs (Managed Service Providers) running Microsoft Lighthouse delegations don't get a unified "Agent 365 across all my customers" view yet. No public roadmap signal for multi-customer / GDAP-style Agent 365 as of 2026-05-16.

### Threat assessment

Adjacent threat. Microsoft is moving toward "agent-as-asset-class" inside the enterprise. If they ship multi-customer admin via Lighthouse/Partner Center in M9–M12, the threat upgrades to Direct. Watch quarterly.

---

## 3. Anthropic Claude Managed Agents + Code Review — **Adjacent Threat**

### What shipped

- **Managed Agents public beta 2026-04-08** ([Verdent guide, 2026](https://www.verdent.ai/guides/what-is-claude-managed-agents); [TestingCatalog, 2026](https://www.testingcatalog.com/anthropic-launches-claude-managed-agents-for-businesses/)).
- **Code Review GA 2026-03-09**: multi-agent PR review, customizable via `REVIEW.md` + `CLAUDE.md`, per-repository enable + spend limit, GitHub-App integration ([TechCrunch, 2026-03-09](https://techcrunch.com/2026/03/09/anthropic-launches-code-review-tool-to-check-flood-of-ai-generated-code/); [Anthropic Code Review README](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/README.md)).
- **Enterprise admin controls (May 2026 wave)**: groups + SCIM-synced custom roles, org-level spend limits, **Compliance API** for real-time programmatic access to Claude usage & content, **enterprise managed policy settings** that override user/project settings for Claude Code + permitted MCP tools ([Anthropic Claude Code admin controls, 2026](https://www.anthropic.com/news/claude-code-on-team-and-enterprise); [AICodex, 2026](https://www.aicodex.to/articles/claude-admin-controls-2026)).
- **Skills Marketplace** (open standard, Oct 2025): 4 200+ skills, organization-wide enable/disable in admin panel; users still opt-in individually ([VentureBeat, 2026](https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard); [The New Stack, 2026](https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/)).
- **May 2026 Dev Day**: Dreaming (offline memory curation), Outcomes (grading agent for re-runs), multi-agent orchestration with auditable Claude Console ([The New Stack, 2026](https://thenewstack.io/anthropic-managed-agents-dreaming-outcomes/); [MindStudio, 2026](https://www.mindstudio.ai/blog/anthropic-dev-day-managed-agent-features-dreaming-outcomes); [9to5Mac, 2026-05-07](https://9to5mac.com/2026/05/07/anthropic-updates-claude-managed-agents-with-three-new-features/)).

### Gap analysis vs ContextForge wedge

**Anthropic's admin plane = single Anthropic org.** "Enterprise managed policy settings that take precedence over user and project settings" is a real piece of multi-developer fleet governance — but again, scoped to one org. A consultancy with 5 client Anthropic orgs needs 5 admin consoles.

**Skills Marketplace** is a *catalog* (publish + discover + enable). It is not a *management plane* across consultancy customers. The Marketplace itself is governed by "long-term stewardship undefined" ([AI Business, 2026](https://aibusiness.com/foundation-models/anthropic-launches-skills-open-standard-claude)) — possibly migrating under AAIF, possibly its own.

### Time-to-Anthropic-native-multi-tenant

**Best estimate: 9–15 months** (M9–M15 from now in ContextForge's roadmap-language, i.e. early-to-mid 2027). Evidence:
- **Direction**: Admin controls (groups, SCIM, Compliance API, managed policy settings) are precursors. Logical next step is "MSP/Partner mode" — but no public roadmap commits.
- **Anthropic strategic posture (Apr–May 2026)**: focus is "Claude Managed Agents = infrastructure for *one* enterprise to run agents at scale" ([Anthropic engineering blog](https://www.anthropic.com/engineering/managed-agents)). Consultancy / agency segment is not mentioned in any 2026 keynote.
- **Anthropic Partner Network**: exists ([DEV.to, 2026](https://dev.to/xadenai/im-building-a-claude-ai-consulting-firm-heres-what-i-learned-getting-accepted-into-anthropics-50hi)) but is a referral program, not a multi-tenant admin tool.
- **Historical precedent**: OpenAI took ~18 months from "ChatGPT Enterprise" (Aug 2023) to "Connector Registry beta with Global Admin Console" (May 2026). Anthropic admin controls are ~12 months newer than OpenAI's at equivalent stage.

If Anthropic ships a "Partner Console" or "Consultancy Mode", it dispatches ContextForge's wedge inside the Anthropic stack only. Cross-Vendor wedge (Cursor, Codex, Gemini CLI, Continue) survives. This is why **multi-provider from day one** is a load-bearing strategic constraint (PRD §17, CLAUDE.md constraint #1).

### Threat assessment

Adjacent threat now, becomes Direct **inside Anthropic surface** at ~M12. Defense: ensure ContextForge covers ≥4 vendors with deep parity, not Claude-leaning + others-as-afterthought.

---

## 4. OpenAI AgentKit + Connector Registry — **Adjacent Threat (data-side)**

### What shipped

- **AgentKit launched DevDay 2025** ([OpenAI introducing AgentKit](https://openai.com/index/introducing-agentkit/); [VentureBeat](https://venturebeat.com/ai/openai-unveils-agentkit-that-lets-developers-drag-and-drop-to-build-ai)).
- **Connector Registry**: "consolidates data sources into a single admin panel across ChatGPT and the API. Pre-built connectors (Dropbox, Google Drive, SharePoint, Teams) plus 3rd-party MCPs." Beta rollout to API + ChatGPT Enterprise + Edu, gated behind Global Admin Console ([OpenAI Connector Registry docs](https://platform.openai.com/docs/guides/agents/connector-registry); [Kanerika, 2026](https://kanerika.com/blogs/openai-agentkit/)).
- **Workspace Agents** ([VentureBeat](https://venturebeat.com/orchestration/openai-unveils-workspace-agents-a-successor-to-custom-gpts-for-enterprises-that-can-plug-directly-into-slack-salesforce-and-more)) — Slack/Salesforce-deep; not coding-agent-fleet management.

### Gap analysis vs ContextForge wedge

Connector Registry = **multi-workspace data governance**, not multi-customer setup management. Global Admin Console can manage "multiple API orgs" — for an enterprise's own subsidiaries. Not a "manage 30 unrelated client tenants" use case (no GDAP equivalent, no partner-mode).

OpenAI's pivot through 2026 is consumer-/workspace-deep, not consultancy-deep. Pricing remains usage-based + Enterprise tier; no specific consultancy SKU.

### Threat assessment

Adjacent, low velocity toward ContextForge's wedge. Watch yearly.

---

## 5. grekt.com — **Direct Threat (Functional Overlap, Different Distribution)**

### What shipped

**The closest functional analog to ContextForge** as of 2026-05-16.

From [grekt.com](https://grekt.com/) and [docs.grekt.com](https://docs.grekt.com/):
- **Inventory** of every AI tool artifact (MCPs, agents, skills, hooks, commands) across Claude Code, Cursor, OpenCode, Codex.
- **Audit** for version locks, integrity, drift.
- **SHA-verified lockfiles** for reproducible installs.
- **CLI commands**: `grekt check` (drift detect), `grekt scan` (prompt-injection audit), `grekt sync` (distribute config).
- **Local-first, no cloud dependency**, source-available CLI, free.
- Product Hunt launch in 2026 ([Hunted.space launch overview](https://hunted.space/product/grekt/launches/grekt)).

### Gap vs ContextForge

- ❌ **No GitHub-App** — grekt is CLI, runs on developer machine, not on a hosted backend that observes 30 client repos.
- ❌ **No multi-customer dashboard** — a consultancy can run grekt per-repo but doesn't get a "across all my clients" view.
- ❌ **No template-distribution-via-PR workflow** — sync is from artifact to local AI tool, not from agency-template to N customer repos.
- ❌ **No billing / SaaS** — local-first OSS, single-developer ergonomics.

### Threat assessment

**This is the most under-counted threat in the PRD.** grekt has the *primitives* (artifact-as-versioned-thing, drift-check, sync) and is ~70 % of ContextForge's engine. Pivoting grekt into "grekt Cloud for AI agencies" is plausibly a 2-quarter project for the grekt-labs team.

**Defense**:
1. Ship hosted GitHub-App early (this is the moat — grekt explicitly chose local-first).
2. Distribution-via-PR with human-review-gate is grekt's blind spot — productize fast.
3. Agency-billing-model + dashboard is what AI consultancies actually pay for; grekt would have to rebuild from CLI mental model.

**Action**: monitor grekt-labs GitHub commits monthly. If they ship a `grekt teams` or `grekt cloud` command, escalate to Direct/Imminent and consider acquisition-overture or partnership.

---

## 6. Cursor Teams "Team Rules" + Enterprise Admin — **Adjacent Threat**

### What shipped

- **2026-05-04 release**: granular model/provider allow-lists by speed-tier + context-window, soft spend limits, richer usage analytics ([Cursor Changelog, 2026-05-04](https://cursor.com/changelog/05-04-26); [Pondero, 2026-05](https://pondero.ai/coding/guides/cursor-enterprise-admin-controls-may-2026/)).
- **Team Rules**: cloud-pushed rules, admins can *recommend* or *require* ([Cursor Docs](https://cursor.com/docs/account/teams/dashboard)).
- Teams plan $40/user/mo with SSO, shared rules, admin dashboard, centralized billing ([NxCode, 2026](https://www.nxcode.io/resources/news/cursor-ai-pricing-plans-guide-2026)).
- **Known gap (community-confirmed)**: "multi-org consolidation for parent companies with multiple workspaces" — not yet addressed ([Pondero, 2026-05](https://pondero.ai/coding/guides/cursor-enterprise-admin-controls-may-2026/)).

### Threat assessment

Adjacent. Cursor's Team Rules is a credible single-customer fleet-mgmt of `.cursorrules`-equivalent. Cursor-only — does not touch Claude Code, Codex, Gemini. ContextForge's Cross-Vendor wedge survives.

Watch: if Cursor announces "parent-account aggregation" in M9–M12, threat upgrades to Direct **inside Cursor surface**.

---

## 7–8. AITMPL + Claude-Code-Templates + claude-flow + ClaudeFast — **Complementary / Mostly Dead**

- **AITMPL (aitmpl.com)** + `davila7/claude-code-templates` ([GitHub](https://github.com/davila7/claude-code-templates)): 1000+ free components (agents, commands, skills, hooks, MCPs), 30+ company stacks, install-CLI, beta dashboard, JSNation 2026 launch. **Complementary** — distribution layer for *content*, not a multi-customer management plane. ContextForge can *consume* AITMPL templates as upstream sources.
- **claude-flow** + **ClaudeFast Code Kit**: legacy names from v3 analysis. No 2026 traction in search results; subsumed by AITMPL + Anthropic Skills Marketplace. **Dead** as standalone threats.

---

## 9. AGENTS.md / Agentic AI Foundation — **Complementary**

- **AGENTS.md adoption**: 60 000+ open-source projects + agent frameworks (Amp, Codex, Cursor, Devin, Factory, Gemini CLI, GitHub Copilot, Jules, VS Code) ([OpenAI AAIF announce](https://openai.com/index/agentic-ai-foundation/); [TechCrunch 2025-12-09](https://techcrunch.com/2025/12/09/openai-anthropic-and-block-join-new-linux-foundation-effort-to-standardize-the-ai-agent-era/)).
- **Studies**: developer-written AGENTS.md files improve task success ~4 %, reduce agent-generated bugs 35–55 % in projects with detailed files ([Linux Foundation Press](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)).
- **AAIF membership**: 170+ orgs by April 2026 — "more than double the membership CNCF had at the same stage" ([IntuitionLabs, 2026](https://intuitionlabs.ai/articles/agentic-ai-foundation-open-standards)).
- **Spec direction**: technical steering committees, no single-member control. MCP, AGENTS.md, goose are anchor projects.

**Note on the PRD's "~20k repos" claim**: stale. As of December 2025, OpenAI already cited "60 000+". By Mai 2026 the number is materially higher. Update PRD accordingly.

**Fragmentation vs convergence verdict**: convergence is winning. Anthropic, OpenAI, Block all in AAIF; even Microsoft is "supporting." Risk of `CLAUDE.md` vs `AGENTS.md` vs `.cursorrules` fragmentation persists at the *tool-specific extensions* layer, but the root format is converging. **This is friendly to ContextForge** — fewer formats to parse, more standardization to enforce.

---

## 10. Anthropic Skills Marketplace (4 200+) — **Adjacent Threat**

- Open standard, 4 200+ skills, enterprise org-wide enable/disable + opt-in per user ([VentureBeat, 2026](https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard)).
- Stewardship undefined — possibly migrating to AAIF.
- Anthropic's GitHub `anthropics/skills` is the canonical public set ([GitHub](https://github.com/anthropics/skills)).

**Threat to ContextForge**: marketplace is a *catalog*, not a fleet-mgmt console. But it normalizes "skill" as a distributable artifact, which makes ContextForge's distribution-via-PR play a less novel pitch. Counter: ContextForge's pitch isn't "publish a skill" — it's "ensure all 30 of my clients' repos have the latest version of *my* skill, with audit trail." Different category.

---

## 11. HiveTrail Mesh — **Complementary**

From [hivetrail.com/mesh](https://hivetrail.com/mesh):
- JIT context engine. Globs local files just-in-time, sends right-sized chunks to model.
- Privacy scanner (mask sensitive data pre-export).
- Reusable Mesh stacks.
- Token-aware export.

**Layer mismatch**. HiveTrail = per-developer context-loader. ContextForge = multi-customer setup governance. Could integrate (ContextForge distributes Mesh stacks to client repos), not compete.

---

## 12. AgentOps / LangSmith / Langfuse / PromptLayer / Arize — **Adjacent (different surface)**

Six anchor platforms in 2026 ([Latitude, 2026-04](https://laminar.sh/article/2026-04-23-top-6-agent-observability-platforms); [Latitude blog](https://latitude.so/blog/best-ai-observability-tools-2026-comparison); [Digital Applied, 2026](https://www.digitalapplied.com/blog/agent-observability-platforms-langsmith-langfuse-arize-2026)):
- LangSmith (LangChain-native, deepest framework integration, near-zero overhead)
- Langfuse (OSS leader, acquired by Clickhouse Jan 2026, ~15 % overhead)
- Arize Phoenix (ML-grade rigor)
- Helicone (drop-in proxy)
- Datadog LLM Observability (enterprise default for Datadog shops)
- Honeycomb LLM Observability (event-based)

**Different surface**: these watch runtime traces (tool calls, decision points, failures). ContextForge watches **setup artifacts** (CLAUDE.md, .claude/agents/, skills, MCP configs). Adjacent but non-overlapping. AgentOps + LangSmith are complementary — a consultancy may want ContextForge for setup, LangSmith for runtime. **Not a competitive threat.**

---

## 13. MindStudio "Context Inheritance" — **Pivoting Toward Us (methodology, not product)**

A *series* of MindStudio blog posts directly describes ContextForge's wedge as a *DIY pattern*:
- [Context Inheritance for Multi-Client Projects](https://www.mindstudio.ai/blog/context-inheritance-claude-code-multi-client-projects)
- [Claude Code Memory Levels Explained](https://www.mindstudio.ai/blog/claude-code-memory-levels-explained-6-layers-claude-md-cross-tool-shared-memory)
- [AI Command Center for Managing Multiple Claude Code Agents](https://www.mindstudio.ai/blog/ai-command-center-managing-multiple-claude-code-agents)
- [Parallel Sessions](https://www.mindstudio.ai/blog/claude-code-parallel-sessions)
- [Session Start Hooks](https://www.mindstudio.ai/blog/session-start-hooks-claude-code-force-context)
- Owen Zanzal, "[Virtual Monorepo Pattern: How I Gave Claude Code Full-System Context Across 35 Repos](https://medium.com/devops-ai/the-virtual-monorepo-pattern-how-i-gave-claude-code-full-system-context-across-35-repos-43b310c97db8)" (Mar 2026)
- Rajiv Pant, "[Managing AI agent skills at scale: a three-repo architecture](https://rajiv.com/blog/2026/03/23/managing-ai-agent-skills-at-scale-three-repo-architecture/)" (Mar 2026)
- Titus Soporan, "[The Spine Pattern](https://tsoporan.com/blog/spine-pattern-multi-repo-ai-development/)"

**The pattern is being documented, hard. The product is missing.** This is the strongest signal that the ContextForge wedge is real — multiple practitioners independently arriving at parent-folder-CLAUDE.md as the missing piece. MindStudio is well-positioned to productize this and is the highest-watch list entry.

**Defense**: ship visible reference implementation before MindStudio packages this into a product. Dogfood on the founder's own consultancy = the kind of artifact that gives ContextForge credibility before MindStudio can.

---

## 14. Multica / protect-mcp / Stacklok / TrueFoundry / MintMCP — **Adjacent (Runtime Governance Layer)**

- **Multica** ([multica-ai](https://github.com/multica-ai/multica)): spawns Claude agents; MCP-config issues across non-Claude-Code providers. Open-source analog to Claude Managed Agents.
- **protect-mcp / ScopeBlind** ([GitHub](https://github.com/scopeblind/scopeblind-gateway)): signed receipts (Ed25519), Cedar policies, swarm-aware audit, IETF Internet-Draft. Integrated into Microsoft Agent Governance Toolkit.
- **Kong AI Gateway**, **TrueFoundry**, **MintMCP**, **Stacklok**, **obot.ai**: enterprise MCP-tool-call-governance, scoping, audit.

**Adjacent layer**: these govern *runtime tool calls*. ContextForge governs *setup artifacts*. Same enterprise customer might run both: ContextForge for "what's in `.claude/`", protect-mcp for "what those agents can call." Complementary.

---

## "Closest-to-Us-Wedge" Ranking

1. **grekt.com** — same primitives (artifact inventory, SHA-locked, drift, sync), different distribution (CLI vs hosted GitHub-App), different ICP (developer vs agency). **Highest functional similarity.** Watch monthly.
2. **GitHub Agent Control Plane** — same intra-enterprise distribution mechanic; missing inter-tenant. **Closest customer-relevance.**
3. **MindStudio Context-Inheritance posts** — same problem statement, no product. **Highest pivot-risk** if they decide to package it.
4. **Anthropic Skills + Enterprise Managed Policy Settings** — partial overlap on distribution, but per-org only. **Most likely Big-3-native replacement at M9–M15.**
5. **Microsoft Agent 365** — adjacent. Multi-cloud, single-tenant. Watch for Lighthouse/GDAP integration.
6. **Cursor Team Rules** — adjacent, single-vendor only.

---

## Time-to-Anthropic-Native Multi-Tenant Estimate

**9–15 months** (~Q1–Q3 2027) with low-to-medium confidence.

**Evidence pointing to "sooner":**
- Anthropic shipping admin controls at pace (Compliance API, SCIM, enterprise managed policy settings — all 2026).
- Code Review GA in March; Managed Agents beta in April; admin controls + Skills marketplace governance in May — 1 release-cycle / month cadence.
- $13B+ revenue trajectory (Anthropic Q1 2026 reporting referenced across press) → enterprise focus is sharp.

**Evidence pointing to "later":**
- Zero public mention of "Partner Mode" / "Consultancy Mode" / multi-tenant admin in Anthropic Dev Day May 2026 announcements.
- Anthropic's *strategic* messaging is "we help one enterprise scale agents," not "we help a consultancy scale to N enterprises."
- Microsoft GDAP took ~24 months from concept to feature-parity. OpenAI Connector Registry Global Admin Console took ~18 months. Anthropic precedent suggests similar.
- AAIF/AGENTS.md standardization is the "open standard" side; Anthropic's commercial product side hasn't signaled multi-tenant.

**Most likely sequence**:
1. M6–M9 (now–Q3 2026): Anthropic ships deeper org-level controls, possibly "Partner Network" tooling (referral-deep, not admin-deep).
2. M9–M15: Anthropic ships "Reseller / Partner Console" with limited cross-org visibility for designated partners — *if* enough Partner Network friction signals.
3. M15+: Full multi-tenant admin akin to GitHub Agent Control Plane.

**Implication for ContextForge**: 9–15 month window to get to defensible position. The wedge holds today; it does not hold forever.

---

## Verdict on "Niemand hat ein dediziertes Multi-Tenant-Tool für AI-Consultancies"

**Still true in Mai 2026 — with caveats.**

True because:
- No product on the market today offers "manage CLAUDE.md / .claude/agents/ / AGENTS.md / .cursorrules / .codex/ / .gemini/ across 5–30 *separate customer GitHub orgs* with read-only GitHub-App, drift-detection, AI-review, template-distribution via PRs, agency-billing."
- GitHub Agent Control Plane is intra-enterprise only.
- Microsoft Agent 365 is single-Entra-tenant.
- Anthropic admin controls are single-Anthropic-org.
- grekt.com is local CLI, not hosted, not agency-billed.
- Cursor Team Rules is single-Cursor-org.

Caveats:
1. **MindStudio has documented the pattern extensively** — they have implicit positioning to ship the product. If they raise or pivot, this changes within 1–2 quarters.
2. **grekt.com has ~70 % of the engine.** A `grekt cloud` SKU is plausible by Q4 2026.
3. **GitHub Agent Control Plane will absorb the "we already have it" objection from large customers within 6 months.** Consultancies serving enterprises with Agent HQ will be asked to justify ContextForge over the built-in.
4. **Anthropic's velocity is high.** A "Partner Console" or "Anthropic for Consultancies" is the natural extension of admin-controls + Compliance API + SCIM. 9–15 months is the realistic window.

**Strategic recommendation**: window of clear-air-differentiation is **6–9 months**. After that, ContextForge needs to be (a) deeply Cross-Vendor (Claude *and* Cursor *and* Codex *and* Gemini, not Claude+others), (b) agency-billing-model-native (per-client, not per-user), (c) PR-distribution-with-human-review-gate as the moat. Each of these is a wedge GitHub/Microsoft/Anthropic are *least* likely to copy because it conflicts with their per-enterprise per-vendor business model.

---

## Newest Entrants Since v3 Analysis (April–May 2026)

Worth flagging — these are NEW in the last 6 weeks:

| Date | Entrant | What | Threat |
|---|---|---|---|
| 2026-04-08 | Anthropic Claude Managed Agents (public beta) | Managed infrastructure for agents at scale | Adjacent (per-org) |
| 2026-05-01 | Microsoft Agent 365 GA | Single-tenant agent governance plane | Adjacent (single-tenant) |
| 2026-05-04 | Cursor Enterprise Admin Updates | Model allow-lists, soft spend, Team Rules | Adjacent (single-vendor) |
| 2026-05-07 | Anthropic Dev Day: Dreaming, Outcomes, Multi-agent orchestration | Memory curation + grading + parallel sub-agents | Adjacent (per-org) |
| 2026-05 | Anthropic Skills Marketplace enterprise governance | Org-wide enable/disable | Adjacent (per-org catalog) |
| 2026-Q1/Q2 | grekt.com Product Hunt launch | OSS CLI: inventory + drift + sync | **Direct (functional)** |
| 2026-04 | Anthropic Code Review GA | Multi-agent PR review w/ REVIEW.md | Adjacent (review, not setup-mgmt) |

**No 2-week-old direct multi-tenant agency-mgmt SaaS detected as of 2026-05-16.** The closest "new entrant" with strong product-velocity remains grekt.com, but its positioning is developer-tooling not agency-mgmt.

---

## Recommended PRD Updates

1. **Update PRD §4 (Competitive Landscape)**: replace "AGENTS.md ~20k repos" with "60 000+ repos as of Dec 2025, AAIF 170+ members by April 2026" — cite [Linux Foundation press](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation).
2. **Add grekt.com as Direct Threat** in competitive landscape — currently not in PRD v3. Set up monitoring cadence (monthly GitHub commit check on grekt-labs).
3. **Add MindStudio to "imminent pivot risk" watch list** based on volume of context-inheritance posts.
4. **Update Anthropic threat assessment**: Compliance API + enterprise managed policy settings + Code Review w/ REVIEW.md is *most* of what an enterprise wants from a per-org code-governance plane. ContextForge's wedge is now narrower: it is *cross-customer* / *cross-vendor* specifically, not "Claude governance broadly."
5. **Sharpen wedge messaging**: "Multi-Tenant for AI-Consultancies" → "The only platform that gives an AI consultancy one dashboard across 5–30 separate customer GitHub orgs, Cross-Vendor (Claude + Cursor + Codex + Gemini), with PR-based distribution and human-review-gate." Each clause is load-bearing because each is a gap that GitHub/Microsoft/Anthropic *structurally* won't close in 12 months.
6. **Defensive checklist for sales calls** (when a prospect's customer has Agent HQ Control Plane or Microsoft Agent 365):
   - "Agent HQ governs `.github/agents/*.md` — we govern `CLAUDE.md`, `.claude/agents/`, `.cursorrules`, `.codex/`, `.gemini/`, and AGENTS.md as one fleet."
   - "Agent HQ pushes inside one Enterprise — you operate across 12. We aggregate the view."
   - "Microsoft Agent 365 watches runtime — we audit the setup that decides what runtime can do."
   - "Anthropic's Compliance API gives you usage — ContextForge gives you 'what changed in the agent's setup yesterday and was it reviewed.'"

---

## Sources (all accessed 2026-05-16 unless noted)

GitHub Agent HQ / Control Plane:
- [GitHub Blog: Welcome home, agents](https://github.blog/news-insights/company-news/welcome-home-agents/) (2025-10-28)
- [GitHub Changelog: Enterprise AI controls GA](https://github.blog/changelog/2026-02-26-enterprise-ai-controls-agent-control-plane-now-generally-available/) (2026-02-26)
- [GitHub Changelog: Public preview](https://github.blog/changelog/2025-10-28-enterprise-ai-controls-the-agent-control-plane-are-in-public-preview/) (2025-10-28)
- [VentureBeat: Agent HQ aims to solve enterprises' biggest AI coding problem](https://venturebeat.com/ai/githubs-agent-hq-aims-to-solve-enterprises-biggest-ai-coding-problem-too)
- [Digital Applied: Agent HQ Multi-Agent Platform Guide](https://www.digitalapplied.com/blog/github-agent-hq-multi-agent-platform)
- [Futurum: Did Agent HQ Quietly Show Up in VS Code 1.110?](https://futurumgroup.com/insights/did-github-agent-hq-quietly-show-up-in-microsoft-vs-code-1-110/)
- [GitHub Pricing Calculator](https://github.com/pricing/calculator)
- [NxCode: GitHub Copilot 2026 Guide](https://www.nxcode.io/resources/news/github-copilot-complete-guide-2026-features-pricing-agents)

Microsoft Agent 365:
- [Microsoft Security Blog: Agent 365 GA](https://www.microsoft.com/en-us/security/blog/2026/05/01/microsoft-agent-365-now-generally-available-expands-capabilities-and-integrations/) (2026-05-01)
- [Microsoft Community: What's New in Agent 365 May 2026](https://techcommunity.microsoft.com/blog/agent-365-blog/what%E2%80%99s-new-in-agent-365-may-2026/4516340)
- [VentureBeat: Microsoft takes Agent 365 out of preview](https://venturebeat.com/technology/microsoft-takes-agent-365-out-of-preview-as-shadow-ai-becomes-an-enterprise-threat)
- [Valoremreply: What is Microsoft Agent 365](https://www.valoremreply.com/resources/insights/blog/azure/what-is-microsoft-agent-365-the-control-plane-for-enterprise-ai-agents-explained/)
- [Microsoft Learn: Deploy Agent 365 agent in GCP](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/deploy-agent-gcp)

Anthropic Claude Managed Agents / Code Review / Skills:
- [Claude Managed Agents Overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Anthropic: Claude Managed Agents](https://claude.com/blog/claude-managed-agents)
- [Anthropic Engineering: Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- [TestingCatalog: Claude Managed Agents for Businesses](https://www.testingcatalog.com/anthropic-launches-claude-managed-agents-for-businesses/)
- [9to5Mac: Three New Features](https://9to5mac.com/2026/05/07/anthropic-updates-claude-managed-agents-with-three-new-features/) (2026-05-07)
- [The New Stack: Anthropic Managed Agents Dreaming](https://thenewstack.io/anthropic-managed-agents-dreaming-outcomes/)
- [MindStudio: Anthropic Dev Day Managed Agent Features](https://www.mindstudio.ai/blog/anthropic-dev-day-managed-agent-features-dreaming-outcomes)
- [TechCrunch: Anthropic launches Code Review tool](https://techcrunch.com/2026/03/09/anthropic-launches-code-review-tool-to-check-flood-of-ai-generated-code/) (2026-03-09)
- [Anthropic Code Review plugin README](https://github.com/anthropics/claude-code/blob/main/plugins/code-review/README.md)
- [InfoQ: Agent-Based Code Review for Claude Code](https://www.infoq.com/news/2026/04/claude-code-review/)
- [Anthropic: Claude Code on Team and Enterprise](https://www.anthropic.com/news/claude-code-on-team-and-enterprise)
- [AICodex: Claude admin controls 2026](https://www.aicodex.to/articles/claude-admin-controls-2026)
- [VentureBeat: Anthropic Agent Skills open standard](https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard)
- [AI Business: Skills Open Standard](https://aibusiness.com/foundation-models/anthropic-launches-skills-open-standard-claude)
- [The New Stack: Agent Skills Standards](https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/)
- [GitHub: anthropics/skills](https://github.com/anthropics/skills)

OpenAI AgentKit:
- [OpenAI Introducing AgentKit](https://openai.com/index/introducing-agentkit/)
- [OpenAI Connector Registry Docs](https://platform.openai.com/docs/guides/agents/connector-registry)
- [Kanerika: OpenAI AgentKit Guide](https://kanerika.com/blogs/openai-agentkit/)
- [VentureBeat: AgentKit drag-and-drop](https://venturebeat.com/ai/openai-unveils-agentkit-that-lets-developers-drag-and-drop-to-build-ai)
- [VentureBeat: Workspace Agents](https://venturebeat.com/orchestration/openai-unveils-workspace-agents-a-successor-to-custom-gpts-for-enterprises-that-can-plug-directly-into-slack-salesforce-and-more)

Cursor:
- [Cursor Changelog 2026-05-04](https://cursor.com/changelog/05-04-26)
- [Pondero: Cursor Enterprise Admin Controls May 2026](https://pondero.ai/coding/guides/cursor-enterprise-admin-controls-may-2026/)
- [Cursor Docs: Dashboard](https://cursor.com/docs/account/teams/dashboard)
- [Cursor for Enterprise](https://cursor.com/blog/enterprise)
- [NxCode: Cursor Pricing 2026](https://www.nxcode.io/resources/news/cursor-ai-pricing-plans-guide-2026)

grekt.com:
- [grekt.com](https://grekt.com/)
- [docs.grekt.com](https://docs.grekt.com/)
- [Hunted.space: grekt launch overview](https://hunted.space/product/grekt/launches/grekt)
- [grekt-labs on GitHub](https://github.com/grekt-labs)

AITMPL / Templates:
- [aitmpl.com](https://www.aitmpl.com/)
- [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates)
- [aitmpl Plugins Marketplace](https://www.aitmpl.com/plugins/)

AGENTS.md / Agentic AI Foundation:
- [OpenAI co-founds AAIF](https://openai.com/index/agentic-ai-foundation/)
- [Linux Foundation: AAIF Press Release](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- [TechCrunch: OpenAI Anthropic Block join LF](https://techcrunch.com/2025/12/09/openai-anthropic-and-block-join-new-linux-foundation-effort-to-standardize-the-ai-agent-era/) (2025-12-09)
- [IntuitionLabs: AAIF Open Standards](https://intuitionlabs.ai/articles/agentic-ai-foundation-open-standards)
- [Anthropic on MCP/AAIF](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)

HiveTrail Mesh:
- [HiveTrail Mesh](https://hivetrail.com/mesh)

Observability platforms:
- [Digital Applied: Agent Observability Platforms 2026](https://www.digitalapplied.com/blog/agent-observability-platforms-langsmith-langfuse-arize-2026)
- [Latitude: Best AI Agent Observability Tools 2026](https://latitude.so/blog/best-ai-observability-tools-2026-comparison)
- [Laminar: Top 6 Agent Observability Platforms 2026](https://laminar.sh/article/2026-04-23-top-6-agent-observability-platforms)

MindStudio multi-client posts:
- [Context Inheritance Multi-Client](https://www.mindstudio.ai/blog/context-inheritance-claude-code-multi-client-projects)
- [Claude Code Memory Levels](https://www.mindstudio.ai/blog/claude-code-memory-levels-explained-6-layers-claude-md-cross-tool-shared-memory)
- [AI Command Center for Multiple Agents](https://www.mindstudio.ai/blog/ai-command-center-managing-multiple-claude-code-agents)
- [Owen Zanzal: Virtual Monorepo Pattern](https://medium.com/devops-ai/the-virtual-monorepo-pattern-how-i-gave-claude-code-full-system-context-across-35-repos-43b310c97db8)
- [Rajiv Pant: Managing agent skills at scale](https://rajiv.com/blog/2026/03/23/managing-ai-agent-skills-at-scale-three-repo-architecture/)
- [Titus Soporan: The Spine Pattern](https://tsoporan.com/blog/spine-pattern-multi-repo-ai-development/)

MCP Governance / Multica / protect-mcp:
- [ScopeBlind: scopeblind-gateway / protect-mcp](https://github.com/scopeblind/scopeblind-gateway)
- [multica-ai/multica](https://github.com/multica-ai/multica)
- [Kong: Governing Claude Code with AI Gateway](https://konghq.com/blog/engineering/claude-code-governance-with-an-ai-gateway)
- [TrueFoundry: Claude Code Enterprise MCP Gateway](https://www.truefoundry.com/blog/claude-code-enterprise-mcp-gateway)
- [MintMCP: Claude Code Security](https://www.mintmcp.com/blog/claude-code-security)
- [Stacklok: Enterprise IT Security for Claude + MCP](https://stacklok.com/blog/the-enterprise-it-security-guide-to-claude-and-mcp/)
- [DX Heroes: MCP governance landscape early 2026](https://dxheroes.io/insights/mcp-governance-landscape-early-2026)
- [agentic-community: mcp-gateway-registry](https://github.com/agentic-community/mcp-gateway-registry)

Skills Marketplaces:
- [SkillsMP](https://skillsmp.com/)
- [Smartscope: SkillsMP Review 2026](https://smartscope.blog/en/blog/skillsmp-marketplace-guide/)
- [Agensi: AI Agent Skills Marketplace Comparison 2026](https://www.agensi.io/learn/ai-agent-skills-marketplace-comparison-2026)
- [VoltAgent: awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)

Other:
- [Anthropic: Code with Claude 2026 (MindStudio)](https://www.mindstudio.ai/blog/code-with-claude-2026-new-agent-features)
- [Block: AAIF Launch](https://block.xyz/inside/block-anthropic-and-openai-launch-the-agentic-ai-foundation)
- [GitHub: Defend-AI-Tech-Inc agent-discover-scanner](https://github.com/Defend-AI-Tech-Inc/agent-discover-scanner)
- [Anthropic Agents for Financial Services](https://www.anthropic.com/news/finance-agents)
- [Securonix Agentic Mesh](https://www.securonix.com/press_release/securonix-introduces-agentic-mesh-and-the-first-productivity-based-ai-model-for-the-soc/)
- [GitHub: VILA-Lab Dive-into-Claude-Code](https://github.com/VILA-Lab/Dive-into-Claude-Code)
- [Microsoft 365 Copilot Wave 3 Announcement](https://www.windowscentral.com/artificial-intelligence/microsoft-copilot/microsoft-365-copilot-wave-3-announcement)
- [Anthropic AAIF post](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)

---

*End of competitor refresh — analysis-v4/02. Compiled 2026-05-16. ~4 800 words. Author: research-track A2 (subagent).*
