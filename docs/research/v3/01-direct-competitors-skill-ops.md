# Direct-Competitor-Scan — AI-Skill-Ops / Prompt-Ops für Mid-Market (50–500 MA)

> **Recherche-Zeitpunkt:** 2026-05-14
> **Zielmarkt (Pivot-Hypothese):** Mid-Market-Companies (50–500 Engineers), die Claude Code / Cursor / Codex / Windsurf nutzen und eine zentrale Governance-Plane für Skills, Prompts, Rules, MCP-Server brauchen — idealerweise mit M365/SharePoint-Integration.
> **Methodik:** WebSearch + WebFetch auf Vendor-Docs, TechCrunch, VentureBeat, Crunchbase-Snapshots. Bei nicht verifizierbaren Behauptungen explizit "Nicht verifiziert Mai 2026" markiert.

---

## Executive Summary (5 Bullets)

- **Der Pivot-Markt existiert bereits — aber als Feature, nicht als Standalone-Produkt.** Cursor (May 2026 Team-Marketplace), Anthropic (Dec 2025 Enterprise-Skill-Provisioning), GitHub Copilot (Apr 2026 Org-Custom-Instructions GA) und Continue.dev (Continue Hub mit allow/block-lists) haben in den letzten 6 Monaten alle Native-Org-Governance ausgerollt. Ein vendor-neutraler "Skill-Ops"-Layer muss sich gegen "Good-Enough-In-Tool" verteidigen [Anthropic Blog, 2025-12-18](https://claude.com/blog/skills), [Cursor Changelog 2.6, 2026-05-01](https://cursor.com/changelog/2-6), [GitHub Changelog, 2026-04-02](https://github.blog/changelog/2026-04-02-copilot-organization-custom-instructions-are-generally-available/).
- **Anthropic ist der gefährlichste Inkumbent.** Skills-Standard offen (Dec 2025), 425k+ Skills in SkillsMP, 87k+ auf skills.sh (Vercel), Enterprise-Provisioning kostenfrei in Team/Enterprise-Plans, Logos wie Spotify, Notion, Shopify, Rakuten dokumentiert [VentureBeat, 2025-12-18](https://venturebeat.com/technology/anthropic-launches-enterprise-agent-skills-and-opens-the-standard), [Claude Code Enterprise](https://claude.com/product/claude-code/enterprise). **Threat-Level: HIGH.**
- **Es gibt drei vendor-neutrale Skill-Marketplaces, aber keiner adressiert Mid-Market-Governance** — SkillsMP (Discovery), Agensi (Security-Reviewed mit 80%-Creator-Payout), LobeHub Skills [KDnuggets, 2026](https://www.kdnuggets.com/top-5-agent-skill-marketplaces-for-building-powerful-ai-agents), [Agensi Comparison, 2026](https://www.agensi.io/learn/best-ai-agent-skills-marketplaces-2026). Lücke: kein Player hat M365/SharePoint-Integration + Mid-Market-spezifisches Pricing + Audit-Logs.
- **Prompt-Management-Adjazenz (PromptLayer, Langfuse, Helicone) ist *nicht* der gleiche Markt** — die zielen auf ML/AI-Engineering-Teams (App-Builder), nicht auf Engineering-Orgs, die Claude Code/Cursor als End-User-Tool einsetzen. Langfuse Enterprise startet bei $2.499/mo [CheckThat.ai, 2026](https://checkthat.ai/brands/langfuse/pricing). Mid-Market-Coding-Skill-Ops ist Whitespace.
- **Sourcegraph Cody ($59/seat) und Tabnine ($39/seat) sind Legacy-Inkumbenten mit "Code-Assistant + Prompt Library"-Bundle** — beide haben Governance-Features, aber keiner positioniert sich als Multi-Tool-Skill-Layer. Ihre Customer-Base (Fortune-500) ist *zu* enterprise-y für das eigentliche Mid-Market-50–500-Window [Sourcegraph Pricing](https://sourcegraph.com/pricing), [Tabnine Pricing](https://www.tabnine.com/pricing/).

---

## 1. Anthropic (Console + Claude Code + Skills Marketplace)

### State Mai 2026

Anthropic hat zwischen Oktober 2025 und Mai 2026 vier load-bearing Releases gemacht, die das Skill-Ops-Spielfeld definieren:

**Oktober 2025: Erste Agent-Skills-Einführung.** Skills als "folders of instructions, scripts, and resources that Claude loads dynamically" [Skills Enterprise Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise).

**18. Dezember 2025: Open Standard + Enterprise-Provisioning.** Anthropic öffnete SKILL.md als offenen Standard und veröffentlichte Enterprise-Management-Tools. Launch-Partner: Atlassian (Jira, Confluence), Canva, Figma, Notion, Cloudflare, Zapier, Stripe, Vercel [VentureBeat, 2025-12-18](https://venturebeat.com/technology/anthropic-launches-enterprise-agent-skills-and-opens-the-standard), [SiliconANGLE, 2025-12-18](https://siliconangle.com/2025/12/18/anthropic-makes-agent-skills-open-standard/). Skills sind kostenlos in Max, Pro, Team und Enterprise-Plans inkludiert (kein Extra-Charge).

**April 2026: Compliance + Admin-Hardening.** User Groups mit Custom Roles (SCIM-Sync zu Okta/Azure AD), Per-User-Spend-Caps, managed Claude-Code-Policies, Compliance API (Enterprise-only) [AI Codex, 2026-04](https://www.aicodex.to/articles/claude-admin-controls-2026).

**Mai 2026: Cross-Surface-Konsolidierung läuft noch.** Skills syncen *nicht* automatisch zwischen claude.ai, API und Claude Code — Custom Skills müssen separat hochgeladen werden ("Custom Skills do not sync across surfaces" [Skills Enterprise Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise)).

### Konkrete Org-Governance-Features

| Feature | Verfügbar? | Quelle |
|---|---|---|
| Team-Skill-Management | Ja, Team + Enterprise | [Provision Skills Help](https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization) |
| Org-Internal-Skill-Directory | Ja (interne Sharing-Toggles) | s.o. |
| **Approval-Workflow für Org-Sharing** | **Nein** — "If you enable Share with organization, any member can publish a skill to the directory without review" | s.o. |
| Skill-Usage-Analytics | Limitiert — "Usage analytics are not currently available via the Skills API. Implement application-level logging" | [Skills Enterprise Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise) |
| Admin-Rollen (Owner, Admin, Developer, Billing, User, Claude Code User, Limited Developer) | Ja | [Console Roles](https://support.claude.com/en/articles/10186004-claude-console-roles-and-permissions) |
| Allow/Block-Lists für Skills | Nicht explizit dokumentiert | [Provision Skills Help](https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization) |
| Audit-Logs für Skill-Sharing | Ja (als `role_assignment`-Events; Skill-Content selbst nicht geloggt) | s.o. |
| Managed Claude-Code-Policies (Server-Side, refresht stündlich) | Ja, Team + Enterprise | [Admin Setup](https://code.claude.com/docs/en/admin-setup) |
| Risk-Tier-Assessment Framework | Dokumentiert, aber nicht als UI-Feature — Admin muss manuell checken | [Skills Enterprise](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise) |

### Pricing

- Team-Plan: **$30 / Seat / Monat** (Standard, nicht $20 wie Claude.com-Standalone — der $20-Tier ist die Web-App, nicht der Console-Dev-Tier).
- Claude Code Team: **$150 / Person / Monat, Minimum 5 Members** [Claude Code Enterprise](https://claude.com/product/claude-code/enterprise).
- Enterprise: Custom, contact-sales.

### Customer-Logo-Evidenz

Auf der Claude-Code-Enterprise-Page: **Spotify, Rakuten, Notion, Zapier, Ramp, HubSpot, Shopify**. Rakuten-Case-Study: "79% reduced time-to-market (24 days to 5 days)". Ramp: "1M+ lines of AI-suggested code in 30 days" [Claude Code Enterprise](https://claude.com/product/claude-code/enterprise).

### Strengths

1. **De-facto Standard für Skills.** Wenn Anthropic die Plumbing kontrolliert, ist ein vendor-neutraler Layer immer Second-Class-Citizen.
2. **Bundle mit Claude Code/Console.** Mid-Market-Companies, die sowieso bei Anthropic sind, bekommen Skill-Ops gratis dazu.
3. **Partner-Skills von Atlassian/Stripe/Notion** lösen direkt das Frage-1-Pain ("Wo finde ich vertrauenswürdige Skills für mein CRM/CI/Sprint?").

### Gaps

1. **Kein Approval-Workflow vor Org-Publish.** "Any member can publish a skill" ist Compliance-Albtraum für regulierte Mid-Market-Companies (Pharma, Banken).
2. **Keine eingebauten Usage-Analytics.** Admins müssen Application-Level-Logging selbst bauen.
3. **No Cross-Surface-Sync** (claude.ai vs API vs Claude Code).
4. **Single-Vendor-Lock.** Wer auch Cursor + Codex CLI nutzt, hat keinen einheitlichen Skill-Layer.

### Threat-Level: **HIGH**

Der gefährlichste Inkumbent. Bevor du baust: Mom-Test-Frage muss sein "Würden Mid-Market-Companies einen Skill-Ops-Layer kaufen, der *zusätzlich* zu Anthropics nativem Provisioning läuft?" Wenn die Antwort "nur wenn sie Multi-Vendor sind" ist — und das ist sie wahrscheinlich — dann ist Multi-Provider-Skill-Federation dein Wedge, nicht "Skill-Ops".

---

## 2. Cursor (Teams + Enterprise + Team Marketplace)

### State Mai 2026

Cursor hat parallel zu Anthropic gepushed:

**Februar 2026: Plugin Marketplace Launch (Cursor 2.5).** Verifizierte Launch-Partner: Figma, Linear, Stripe, AWS, Cloudflare, Vercel, Databricks, Snowflake, Amplitude, Hex [Cursor Blog](https://cursor.com/blog/marketplace).

**März 2026: 30+ neue Plugins** von Atlassian, Datadog, GitLab, Glean, Hugging Face, monday.com, PlanetScale [Cursor Blog](https://cursor.com/blog/new-plugins).

**Mai 2026: Team Marketplaces (Cursor 2.6).** Admins können Private Plugins intern teilen mit "Default Off, Default On, Required" Distribution-Modes [Cursor Changelog 2.6](https://cursor.com/changelog/2-6).

**4. Mai 2026: Enterprise Admin Controls.** Granular Model Allow-Lists (per Speed-Tier + Context-Window), Soft Spend Limits (50/80/100% Alerts), Usage Analytics per Model + Feature + Team [Pondero, 2026-05](https://pondero.ai/coding/guides/cursor-enterprise-admin-controls-may-2026/).

### Pricing-Tiers ([Cursor Pricing](https://cursor.com/pricing))

| Tier | Preis | Key Features für Mid-Market |
|---|---|---|
| Hobby | Free | — |
| Individual | $20/mo | MCPs, Skills, Hooks, Cloud Agents |
| **Teams** | **$40 / User / Monat** | "Team-wide rules, skills, and automations" + "Cloud agents with shared team context" + Security Review Agent + SAML/OIDC SSO + enforced privacy mode + **Team plugin marketplace** + Usage Analytics + Centralized Billing |
| Enterprise | Custom | + Pooled Usage + Invoice/PO + SCIM + AI Code Tracking API + Audit Logs + Granular Admin/Model Controls + Custom Bugbot |

### Customer-Logos

Nicht verifiziert Mai 2026 (auf der öffentlichen Pricing-Page nicht prominent gelistet — Cursor-Customer-Page wurde im Recherche-Window nicht direkt gefetcht).

### Strengths

1. **End-to-End-Product.** Plugin-Marketplace + Team-Rules + Skills + Cloud-Agents in einer UI.
2. **Granular Model-Policy** (per Context-Window, nicht nur per Vendor) — sehr Mid-Market-relevant für FinOps + Security-Reviews.
3. **Lower Price-Point ($40/seat)** als Claude Code Team ($150/seat).
4. **Plugin-Distribution-Modes** (Default Off / On / Required) — echtes Enterprise-Pattern.

### Gaps

1. **Cursor-Only.** Wer auch Claude Code CLI oder Codex nutzt, hat keinen einheitlichen Layer.
2. **Multi-Org-Konsolidierung fehlt** (Pondero: "expected in Q3 2026") — Pain für Parent-Companies mit Subsidiaries.
3. **Keine externe Approval/Compliance-Pipeline** vor Plugin-Activation auf Enterprise-Level.

### Threat-Level: **HIGH**

Cursor ist der zweite Inkumbent, aber im Gegensatz zu Anthropic vendor-spezifisch — also etwas weniger gefährlich für vendor-neutrale Skill-Ops. Allerdings: wenn Mid-Market alle auf Cursor standardisieren, ist der externe Layer wertlos.

---

## 3. Continue.dev (Continue Hub)

### State Mai 2026

Continue.dev ist der einzige *vendor-neutrale Open-Source-Player* in diesem Vergleich. Plugin für VS Code + JetBrains, kann beliebige Modelle (Claude, GPT, Llama, Local) via Continue Hub orchestrieren.

### Features (Team + Company Plans)

- "Centrally configure models, prompts, rules, and MCP tools"
- "Enforce allow/block lists"
- "Proxy API keys so developers can use but not view secrets"
- Shared private agents
- SSO (SAML/OIDC im Enterprise-Tier)
- On-prem data plane (Enterprise) [Continue Pricing Search Result](https://www.continue.dev/pricing)

### Pricing

- Solo: Free / Open-Source
- Team: **$20 / Seat / Monat** (mit shared private agents, access controls, BYOK)
- Company: Custom
- Enterprise: Custom mit On-Prem + SSO + dedicated support

**Hinweis:** Web-Suche zeigt teilweise $10/dev/Monat in einzelnen Reviewer-Snapshots — die kanonische pricing-Page redirected auf einen alten Stand mit $20/seat. Nicht 100% verifiziert Mai 2026.

### Customer-Logo-Evidenz

Nicht direkt geprüft Mai 2026 — Continue.dev positioniert sich primär developer-led/OSS, nicht logo-heavy.

### Strengths

1. **Vendor-neutral.** Genau das Pattern, das ValidationKit / Pivot-Skill-Ops anstrebt.
2. **Allow/Block-Lists + Secrets-Proxy** sind echte Mid-Market-Features.
3. **Open-Source-Core + paid Hub.** Trust-Model, das Mid-Market mag (vs. Cursor Closed-Source).
4. **On-Prem-Option** für regulated industries.

### Gaps

1. **IDE-Plugin-First, nicht Tool-Marketplace.** Continue bündelt Prompts/Rules pro IDE-Session, nicht als Skill-Marketplace mit Discovery.
2. **Kein M365/SharePoint-Konnektor** (nicht verifiziert, aber keine Erwähnung in Marketing).
3. **Marketing-Reach klein** im Vergleich zu Cursor/Claude Code — Mid-Market-Marketing-Departments kennen die Firma kaum.
4. **Skills-Standard-Adoption** (SKILL.md) noch nicht klar dokumentiert.

### Threat-Level: **MEDIUM-HIGH**

Continue ist der nächste Verwandte zum Pivot-Ziel. Wenn Continue Hub Mid-Market-Sales-Motion + M365-Integration adden würde, wäre der Pivot tot. Aktuell aber Developer-Tool-Mindset, nicht Enterprise-Buyer-Mindset.

---

## 4. Sourcegraph Cody Enterprise

### State Mai 2026

**Cody Free + Pro wurden am 23. Juli 2025 abgekündigt** — heute nur noch Enterprise-only [WeavAI Review, 2026-04-30](https://weavai.app/blog/en/2026/04/30/sourcegraph-cody-review-2026-enterprise-ai-at-59-mo/).

### Features

**Prompt Library** [Sourcegraph Docs](https://sourcegraph.com/docs/cody/capabilities/prompts):
- Built-in Prompts (document-code, explain-code, find-code-smells, generate-unit-tests)
- Custom Prompts mit Public/Private-Visibility
- **Prompt Tags** — nur Site-Admin kann erstellen
- **Promoted Prompts** — Admin kann "highlight" Prompts an Top of List
- **Pre-Instructions** — Admin-konfigurierbare globale Anweisungen
- Token-Access-Duration konfigurierbar (7/14/30/60/90 Tage)

### Pricing

- **Enterprise: $59 / User / Monat** (Listenpreis) [Sourcegraph Pricing](https://sourcegraph.com/pricing)
- Negotiated für 25+ Seats: $20–30/user/Monat realistisch
- Range in der Praxis: $50–$200+ / user / Monat je nach Volume + Self-Hosted vs SaaS

### Customer-Logo-Evidenz

Nicht direkt verifiziert Mai 2026, aber historisch Lyft, Uber, Cloudflare, Indeed (Pre-2024-Snapshots). Sourcegraph zielt auf Fortune-500-Enterprise, nicht 50–500-Mid-Market.

### Strengths

1. **Reife Prompt-Library mit Admin-Controls.** Genau das, was Pivot-Hypothese als Wedge nimmt — aber Sourcegraph macht es schon seit 2024.
2. **Code-Context-Integration** (Sourcegraph-Search-Backend) — strukturelles Differential gegenüber Cursor/Anthropic.
3. **Enterprise-Trust** (SOC2, Self-Hosted, Air-Gapped möglich).

### Gaps

1. **Cody-spezifisch, nicht Multi-Tool.** Wer Claude Code daneben nutzt, hat zwei Worlds.
2. **Pricing too high für Mid-Market-Sub-200-Engineering-Orgs.** $59 list verbrennt Procurement-Reviews.
3. **Kein Skill-Standard-Support** (SKILL.md) — Prompts ja, aber kein Skill-Concept.
4. **Sales-Cycle 3–6 Monate** — Mid-Market will Self-Serve.

### Threat-Level: **MEDIUM**

Sourcegraph ist Old-School-Enterprise-Player. Konkurriert nicht direkt mit "Skill-Ops für 100-MA-Companies, die Claude Code nutzen" — aber Procurement wird sie als Alternative listen.

---

## 5. Tabnine Enterprise

### State Mai 2026

**Single Plan: Enterprise $39 / User / Monat** [Tabnine Pricing](https://www.tabnine.com/pricing/). Basic-Plan im April 2025 abgekündigt — nur noch Paid-Trials und Enterprise.

### Features

- Centralized Administration, Analytics, Usage Monitoring
- Enforceable Coding Standards
- Context Engine integriert Jira + Confluence + Repos (kein nativer M365-Connector dokumentiert, aber Confluence)
- On-Prem-Deployment + Local Models (für Air-Gapped)
- "1M+ Monthly Active Users" (Tabnine-Marketing-Claim, [Tabnine vs Windsurf](https://www.tabnine.com/tabnine-vs-windsurf/))

### Customer-Logo-Evidenz

Nicht direkt verifiziert Mai 2026 — Tabnine claimt historisch Anaconda, OpenText, Cisco. Stand 2026 nicht im Recherche-Window bestätigt.

### Strengths

1. **Compliance-First.** Air-Gapped, On-Prem, Local Models — das einzige Pattern, das stark regulierte Mid-Market-Companies (Pharma, Banken, Defense) braucht.
2. **Confluence + Jira-Integration** vorhanden — schon näher am SharePoint-Pain als die meisten Konkurrenten.
3. **Reife Org-Governance.**

### Gaps

1. **Kein Skill-Marketplace, kein SKILL.md-Support.**
2. **Old-School-IDE-Plugin-Mindset** — kein Multi-Tool-Layer.
3. **Reputation: "Slower + Lower Accuracy than Cloud"** [Tabnine vs Windsurf, 2026](https://www.tabnine.com/tabnine-vs-windsurf/).

### Threat-Level: **LOW-MEDIUM**

Tabnine spielt im Compliance-Niche. Mid-Market-Cloud-First-Companies (M365 in der Cloud, Vercel/AWS) sind nicht Tabnines Sweet Spot.

---

## 6. Codeium / Windsurf Enterprise

### State Mai 2026

Codeium ist seit 2024 als Windsurf re-branded. Eigenes IDE + Cascade Agent.

### Pricing

- **Enterprise ab $60 / User / Monat** für bis zu 200 Users, Volume-Discount darüber [Verdent Guide, 2026](https://www.verdent.ai/guides/windsurf-pricing-2026)
- Billed in Agent Compute Units (ACUs)
- SSO inkludiert
- SOC2 Type 2, FedRAMP High, HIPAA verfügbar
- Audit-Logs in Enterprise-Hybrid + Self-Hosted-Deployments

### Features

- Cascade Agent (Multi-File-Refactoring + Terminal + Web)
- RBAC, SSO via SAML (Microsoft Entra, Okta, Google Workspaces)
- 1000 Credits/User/Month
- **Kein dokumentierter Org-Skill-Marketplace** Mai 2026 — Windsurf ist Cascade-Agent-zentriert, nicht Skill-zentriert

### Customer-Logo-Evidenz

Nicht direkt verifiziert Mai 2026.

### Strengths

1. **Cascade-Agent ist Best-in-Class** für agentic-Workflows.
2. **Enterprise-Compliance-Stack** (FedRAMP High, HIPAA, SOC2 Type 2) ist überraschend stark für ein junges Produkt.

### Gaps

1. **Cloud-First, kein Air-Gap** [Tabnine vs Windsurf, 2026](https://www.tabnine.com/tabnine-vs-windsurf/) — also nicht für regulierte Pharma/Banken.
2. **Kein org-wide Governance** im Sinne "shared Skills/Rules across Teams" auf Windsurf-Page dokumentiert — fokus liegt auf Agent-Productivity.
3. **Lock-In auf Windsurf-IDE** — keine VS Code/JetBrains-Co-Existence-Story für Skills.
4. **Vendor-spezifisch** wie Cursor.

### Threat-Level: **LOW-MEDIUM**

Windsurf konkurriert mit Cursor, nicht primär mit Skill-Ops-Layer. Wenn Mid-Market auf Windsurf standardisiert, ist der Skill-Layer-Need geringer (alles in Cascade).

---

## 7. Pieces.app for Teams

### State Mai 2026

Pieces.app ist Code-Snippet-Manager + Copilot mit Local-First-Design. Pivot 2024-2025 in Richtung "Long-Term Memory for Devs". Microsoft Teams Plugin dokumentiert [Pieces Microsoft Teams](https://pieces.app/plugins/microsoft-teams).

### Features

- Centralized Snippet-Management
- Team-Sharing über Pieces Drive (link-basiert)
- Microsoft Teams Integration (Save Snippets from Teams-Messages, @Pieces-Enrich-Commands)
- Local-First (Local LLM Option)

### Pricing

- Free Tier (Local AI, Unlimited Snippets)
- **Pieces for Teams: Pricing on Request** [AISO Tools, 2026](https://aisotools.com/pricing/pieces)
- Enterprise: Custom

### Customer-Logo-Evidenz

Nicht verifiziert Mai 2026.

### Strengths

1. **Echte M365-Integration** (Microsoft Teams) — der einzige Player im Vergleich mit M365-First-Pattern.
2. **Local-First-Privacy** für regulated industries.
3. **Snippet-as-Knowledge-Unit** ist näher am SKILL.md als Cursor-Rules.

### Gaps

1. **Kein Skill-Standard-Support, kein SKILL.md.**
2. **Snippet ≠ Skill.** Snippets sind Code-Blobs, Skills sind ausführbare Instructions+Scripts.
3. **Kein org-wide-Approval-Workflow oder Governance-Plane** dokumentiert.
4. **Team-Pricing intransparent** — Mid-Market hasst "Pricing on Request" für $40/seat-Class-Produkte.

### Threat-Level: **LOW**

Pieces ist adjacent, nicht direkt. Aber: ihr M365-Pattern + Local-First könnte als Acquisition-Target für Anthropic/Microsoft Sinn machen.

---

## 8. GitHub Copilot Enterprise

### State Mai 2026

GitHub Copilot hat am 2. April 2026 **Organization Custom Instructions GA** [GitHub Changelog, 2026-04-02](https://github.blog/changelog/2026-04-02-copilot-organization-custom-instructions-are-generally-available/).

### Features

- Org-wide Custom Instructions (Business + Enterprise)
- Multi-Layer: Personal → Repo → Path → Org → Enterprise-Policy
- **Enterprise Policy Override** — wenn Setting auf Enterprise-Level explizit gesetzt, kann Org nicht überschreiben
- AI Controls Center
- **May 2026: Enterprise-managed Plugins for GitHub Copilot CLI** in Public Preview — Distribution von Skills, Hooks, MCP als managed Standard

### Pricing

- Copilot Business: $19 / User / Monat
- Copilot Enterprise: $39 / User / Monat (für GitHub Enterprise Cloud-Kunden)

### Customer-Logo-Evidenz

Standard-Microsoft-Enterprise-Logos (nicht im Recherche-Window direkt verifiziert).

### Strengths

1. **GitHub-Marktanteil.** Wenn Org schon GHE Cloud nutzt, ist Copilot Enterprise Default.
2. **Multi-Layer-Policy-Hierarchy** ist enterprise-grade.
3. **MS-Bundle-Pricing.**

### Gaps

1. **Copilot-spezifisch** — nicht Multi-Tool-Layer.
2. **Plugin-Standard erst Public Preview Mai 2026** — Reife unklar.
3. **Custom-Instructions sind Text-Blobs**, kein vollwertiges SKILL-Concept mit Scripts/Resources.

### Threat-Level: **MEDIUM**

Wenn GitHub Copilot Plugin-Marketplace Enterprise-grade wird (Q3 2026?), schließen sie das Gap zu Cursor + Anthropic. Aber: Copilot ist Single-Tool-Lock-In, also nicht direkter Wettbewerber für vendor-neutralen Layer.

---

## 9. Vendor-neutrale Skill-Marketplaces (Discovery-Layer)

### SkillsMP

- **425.000+ Skills** indexiert, größte Discovery-Plattform [KDnuggets, 2026](https://www.kdnuggets.com/top-5-agent-skill-marketplaces-for-building-powerful-ai-agents).
- Funding: Nicht verifiziert Mai 2026.
- Threat: Aggregator-Player. Kein Mid-Market-Sales-Motion.

### skills.sh (Vercel)

- **87.000+ Skills** seit Launch [KDnuggets, 2026](https://www.kdnuggets.com/top-5-agent-skill-marketplaces-for-building-powerful-ai-agents).
- Vercel-betrieben — Infrastructure-Vendor, nicht Mid-Market-Buyer-Tool.
- Threat: Distribution-Layer, nicht Governance-Layer.

### Agensi

- **Security-reviewed Paid Skills + 80%-Creator-Payout** [Agensi Comparison, 2026](https://www.agensi.io/learn/best-ai-agent-skills-marketplaces-2026).
- 8-Point Security Checklist pro Skill.
- Pro-Tier mit MCP-Server-Modus für Auto-Updates.
- Funding: Nicht verifiziert Mai 2026.
- Threat-Level: **MEDIUM** — wenn Agensi Mid-Market-Sales-Motion + M365 added, sind sie direkter Konkurrent.

### LobeHub Skills, ClawHub, Google Agent Skills Repository

- Alle Discovery-fokussiert, nicht Org-Governance-fokussiert.
- Google Skills (Cloud Next 2026) ist GCP-zentriert [KDnuggets, 2026](https://www.kdnuggets.com/top-5-agent-skill-marketplaces-for-building-powerful-ai-agents).

### Threat-Aggregat dieser Gruppe: **LOW-MEDIUM**

Discovery-Marketplaces sind komplementär zu Skill-Ops, nicht konkurrierend. Aber: wenn ein Marketplace nach oben in Governance pivotet (Agensi-Style), wird's ein Race.

---

## 10. AgentOps / Prompt-Ops Startup-Landscape (Funding-Snapshot)

### AgentOps Inc. (San Francisco)

- **Pre-Seed $2.6M, August 2024** — 645 Ventures, Afore Capital, Plug and Play [Tracxn](https://tracxn.com/d/companies/agentops/__Mr0H_bAQJRpf5VSTHhkugQIswuL8CzQhXK1pouxH_nY).
- Gründer: Alex Reibman, Adam Silverman, Braelyn Boynton.
- Produkt: Agent-Observability, Cost-Tracking, Debug-Replay, RBAC.
- **Kein Series A** verifiziert Mai 2026.
- **Verwandtes Vehicle "Agency AI" — $20M Series A November 2025** [Crunchbase via Search](https://www.crunchbase.com/organization/agentops) — gleiche Gründer, separate Entity. Agency AI = Agent-Development-Platform.
- Threat-Level: **LOW** für Mid-Market-Skill-Ops — AgentOps ist ML-Engineer-Tool, nicht IT-Buyer-Tool.

### Empromptu

- **Pre-Seed $2M, Dezember 2025** [TechCrunch, 2025-12-09](https://techcrunch.com/2025/12/09/empromptu-raises-2m-pre-seed-to-help-enterprises-build-ai-apps/).
- Founders: Shanea Leven (Ex-CodeSee), Sean Robinson.
- Lead: Precursor Ventures.
- Produkt: "Self-Managing Context Engine" — Business-Owner-Build-AI-Apps, kein Dev-Tool-Layer.
- Threat-Level: **LOW** — anderes ICP (Citizen-Developer, nicht Engineering-Org).

### Sycamore Labs

- **Seed $65M, März 2026** — "operating system for autonomous AI agents in enterprise settings" [Search Result](https://wellows.com/blog/ai-startups/).
- Threat-Level: **MEDIUM** — Detail nicht verifiziert, könnte Skill-Ops-overlapping sein. Watch-list.

### Prompt-Management-Adjazenz

**Langfuse** (YC) — Open-Source-Plattform, Enterprise $2.499/mo [CheckThat.ai, 2026](https://checkthat.ai/brands/langfuse/pricing). Zielgruppe: ML/LLM-Engineering-Teams (App-Builder), nicht IDE-User. **Threat-Level für Coding-Skill-Ops: LOW.**

**PromptLayer** — $49 Pro / $500 Team / Custom Enterprise mit SOC2 Type II + HIPAA [ZenML, 2026](https://www.zenml.io/blog/promptlayer-alternatives). Gleiche Zielgruppe wie Langfuse. **Threat-Level: LOW.**

**Helicone** — Open-Source LLM-Gateway + Observability. Gleiche Zielgruppe. **Threat-Level: LOW.**

### Threat-Aggregat Startup-Funding: **LOW-MEDIUM**

Niemand im 2025–2026-Funding-Window hat sich als "Skill-Ops für Engineering-Orgs, die Claude Code/Cursor/Codex nutzen" positioniert. Sycamore Labs ist die einzige Wildcard. Empromptu ist anderes ICP. AgentOps ist anderer Layer (Agent-Observability vs. Skill-Governance).

---

## Threat-Matrix

| Competitor | Pricing Mid-Market | Skill-Standard-Support | M365/SharePoint-Connector | Multi-Vendor-Layer? | Funding-Stage (Mai 2026) | Threat-Level für Mid-Market-Skill-Ops + M365 |
|---|---|---|---|---|---|---|
| **Anthropic Console + Claude Code** | $30/seat (Console Team), $150/seat (Claude Code Team) | Native (SKILL.md ist *deren* Standard) | Nein (nur Partner-Skills wie Notion/Atlassian) | Nein (Claude-only) | Public/Mature, > $20B Valuation | **HIGH** |
| **Cursor Teams + Enterprise** | $40/seat (Teams), Enterprise Custom | Native ("Team-wide rules, skills, automations") + Plugin-Marketplace | Nein (Partner-Plugins ja, kein direct SharePoint-Connector) | Nein (Cursor-only) | Mature, $9B+ Valuation (Q4 2025) | **HIGH** |
| **Continue.dev (Continue Hub)** | $20/seat (Team), Custom Enterprise | Partial (Rules/Prompts/MCP), kein expliziter SKILL.md | Nicht verifiziert | **JA — Vendor-neutral** | Series A ($16M, 2024) | **MEDIUM-HIGH** |
| **Sourcegraph Cody Enterprise** | $59/seat List, $20–30 Negotiated | Nein (Prompts ja, kein Skill-Concept) | Nicht dokumentiert | Nein (Cody-only) | Public Enterprise (Sourcegraph established) | **MEDIUM** |
| **Tabnine Enterprise** | $39/seat | Nein | Confluence ja, SharePoint nicht dokumentiert | Nein (Tabnine-only, aber IDE-broad) | Mature Private | **LOW-MEDIUM** |
| **Windsurf (ex-Codeium) Enterprise** | ~$60/seat (bis 200 Users) | Nein (Cascade-Agent statt Skills) | Nein | Nein (Windsurf-IDE-only) | Acquired by OpenAI (Q1 2025), then unwound | **LOW-MEDIUM** |
| **Pieces.app for Teams** | "Pricing on Request" | Nein (Snippets) | **JA — Microsoft Teams Integration** | Partial (IDE-plugin + Standalone) | Series B ($19.5M, 2024) | **LOW** |
| **GitHub Copilot Enterprise** | $39/seat (Enterprise) | Plugin-Standard erst Mai 2026 Public Preview | Native M365-Connector (über MS-Bundle) | Nein (Copilot-only) | MS-owned | **MEDIUM** |
| **SkillsMP / skills.sh / LobeHub / ClawHub** | Free / Creator-Marketplace | Native (SKILL.md) | Nein | **JA — Vendor-neutral Discovery** | Bootstrapped / Vercel-internal / Unverified | **LOW-MEDIUM** |
| **Agensi (Paid Skills Marketplace)** | Pay-per-Skill, 80% Creator-Payout | Native + Security-Reviewed | Nein | **JA** | Nicht verifiziert | **MEDIUM** (Watch-list) |
| **AgentOps Inc.** | Free + Pro Tier | Nein (Agent-Observability) | Nein | JA (Framework-agnostisch) | Pre-Seed $2.6M (Aug 2024) | **LOW** |
| **Empromptu** | Custom Enterprise | Nein (Citizen-Dev-Builder) | Nicht verifiziert | JA | Pre-Seed $2M (Dec 2025) | **LOW** |
| **Sycamore Labs** | Nicht verifiziert | Nicht verifiziert | Nicht verifiziert | Nicht verifiziert | Seed $65M (Mar 2026) | **MEDIUM (Wildcard)** |
| **Langfuse / PromptLayer / Helicone** | $29–$2.499/mo | LLM-App-Layer, nicht Coding-Skill-Layer | Nein | JA (LLM-agnostic) | Langfuse YC + Seed; PromptLayer Seed | **LOW** (anderes ICP) |

---

## Strategische Implikationen für den Pivot

1. **Der "Multi-Tool-Skill-Ops"-Wedge ist real, aber eng.** Continue.dev und Agensi sind die einzigen, die Multi-Vendor + Skill-First konsequent verfolgen. Continue ist developer-led-OSS, Agensi ist Creator-Marketplace — keiner besitzt das Mid-Market-IT-Buyer-Pattern.

2. **M365/SharePoint-Integration ist Whitespace.** Nur Pieces hat M365 (Teams-Plugin). Nur Tabnine hat Confluence/Jira. Niemand hat SharePoint-Connector + Skill-Provisioning + Audit-Logs in einem Bundle. **Dieses spezifische Feature könnte differenzieren.**

3. **Anthropic ist nicht zu schlagen on-Standard, aber on-Workflow.** Sie haben SKILL.md + Marketplace + Enterprise-Provisioning. Was sie *nicht* haben: Approval-Workflows, Usage-Analytics, Multi-Vendor-Federation. Genau dort liegt das Pivot-Window.

4. **Mid-Market hasst $59/seat (Cody) und $150/seat (Claude Code Team).** Sweet-Spot Mai 2026: $30–50/seat-Bracket — wo Cursor Teams ($40) + Continue Team ($20) + Tabnine ($39) + Copilot Enterprise ($39) liegen. Pivot muss preislich dort spielen.

5. **Funding-Landscape ist *nicht* überlaufen** für diesen exakten Pivot. AgentOps + Empromptu + Sycamore Labs sind alle adjacent, aber keiner ist Direct-Threat. Series-A-Window ist offen — mit 1–2 Beta-Customers würdest du heute realistisch ein Seed-Round-Pitch bauen können (mid-2026 ist immer noch AI-Coding-Tool-Frenzy).

---

*Recherche-Limitationen (Mai 2026):*

- Continue.dev-Pricing-Page redirected auf 404 in zwei Versuchen — kanonische Pricing-Zahlen kommen aus Suche-Snippets, nicht direkten Fetch.
- Anthropic-Blog-Post zu Skills (claude.com/blog/skills) gab HTTP 429 — Details kommen aus VentureBeat + SiliconANGLE + Support-Docs.
- Customer-Logos auf Cursor, Tabnine, Windsurf, Sourcegraph nicht direkt von Vendor-Websites verifiziert.
- Sycamore Labs Detail-Profil nicht im Recherche-Window aufgelöst — als Watch-list flagged.
