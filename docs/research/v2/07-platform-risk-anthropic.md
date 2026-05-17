# 07 — Platform Risk: Anthropic / Claude Code Dependency

**Analysiert:** 2026-05-14
**Scope:** ValidationKit ist ein Claude-Code-Subagent-Framework. Diese Analyse bewertet das Risiko, dass Anthropic native Validation-Features launcht und ValidationKit obsolet macht, sowie die Portierbarkeit auf andere Coding-Agents.

---

## TL;DR — Severity Matrix

| Dimension | Bewertung |
|---|---|
| **Platform-Lock-in Severity (1–5)** | **4 / 5** (hoch) |
| **Native-Validator-Launch Wahrscheinlichkeit** | **Mid–High** (teilweise schon gelauncht) |
| **Time-to-Obsolescence wenn nichts passiert** | 6–12 Monate |
| **Multi-Provider-Empfehlung** | **JA — von Tag 1** |
| **Strategische Position** | "Domain-Validator", nicht "Skill-Validator" |

> **RED ALERT:** Anthropic hat im Q4 2025 / Q1 2026 mit **Skill-Creator 2.0** und **Skills 2.0** bereits eine offizielle Validierungs-Infrastruktur für Skills gelauncht: Eval-Modus, A/B-Testing, Benchmarking, Trigger-Optimierung. Wenn ValidationKit als "Wir validieren deine Claude-Code-Skills" positioniert ist, ist es **bereits 60% redundant**. Strategisches Repositioning ist Pflicht.

---

## 1. Anthropic Claude Code Roadmap-Synthese 2025–2026

### Was wir mit hoher Sicherheit wissen

**Wachstum (Hard Numbers):**
- Claude Code: $1B ARR im Nov 2025, $2.5B+ ARR im Feb 2026, Anthropic gesamt: $30B+ run rate.
- Enterprise = >50% des Claude-Code-Umsatzes; >300k Business-Kunden, Großkunden ~7× YoY.
- Series G: $30B bei $380B post-money Valuation. Compute: 5GW Amazon + 5GW Google/Broadcom.
- **Interpretation:** Claude Code ist Anthropics strategisches Flagship-Produkt, nicht ein Side-Bet. Investitionstempo in Features wird hoch bleiben.

**Plattform-Komponenten, die in 2025–2026 gelauncht wurden:**
1. **Subagents** (`.claude/agents/*.md`) — stabil
2. **Skills** (Oktober 2025) — `SKILL.md` Format
3. **Skills 2.0** (Q1 2026) — Evaluations, A/B Testing, Benchmarks
4. **Plugins / Plugin-Marketplace** — offiziell unter `anthropics/claude-plugins-official`
5. **Hooks** (Early 2026, async Jan 2026) — PreToolUse, PostToolUse, Stop, etc.
6. **Claude Agent SDK** (Python + TypeScript) — proprietäre Lizenz
7. **Subagent-Skill-Discovery** (May 2026 Fixes) — Subagents können jetzt Project/User/Plugin-Skills entdecken

**Strategische M&A (2025–2026):**
- **Bun** (Dez 2025, erste Acquisition) — JS-Runtime → Claude-Code-Tooling-Stack vertikalisieren
- **Stainless** (laufende Talks, ~$300M, Mai 2026) — SDK-Generation
- **Vercept** — computer use
- **Coefficient Bio** — Biotech (nicht-relevant)
- **Signal:** Anthropic kauft Dev-Infrastruktur-Schichten aggressiv hoch. Ein Validation/Eval-Tool wäre ein logischer nächster Move.

### Spekulation (was wir nicht wissen)

- Wird Skill-Creator zu einem horizontalen "Claude Validate" generalisiert (über reine Skill-Validation hinaus, also auch Code-Validation, Output-Validation, Pipeline-Validation)?
- Bleibt der Plugin-Marketplace permissions-frei und kuratiert-light, oder schwenkt Anthropic auf einen App-Store-Lockdown?
- Wird Claude Code Open-Source-Komponenten extern öffnen (z.B. der Skill-Loader)? Aktuell: **proprietär**.

---

## 2. Skill Marketplace Stand 2026

### Offizielle Anthropic-Infrastruktur

- **`anthropics/skills`** — 16 offizielle Skills (frontend-design, PDF, DOCX, XLSX, MCP-builder, skill-creator etc.), meist Apache 2.0.
- **`anthropics/claude-plugins-official`** — kuratierter, Anthropic-managed Plugin-Marketplace.
- **In-CLI Discovery:** `/plugin` → Discover Tab → install. Friction = sehr niedrig.
- **claude.com/plugins** — Web-UI mit "Anthropic Verified" Badge.

### Marktreife

- Skill-Creator hat **244.732 Installs** (Anthropic Verified).
- Superpowers (Community, Jesse Vincent / obra) hat **652.113 Installs** — community plugins können größer sein als official.
- Third-party-Marketplaces existieren bereits: SkillsMP, ClaudeSkills.info, ClaudePluginHub, ClaudeMarketplaces, BuildWithClaude.
- **Monetarisierung:** Aktuell keine native Plugin-Monetarisierung in Claude Code. Plugins sind kostenlos / Open-Source. Anthropic monetarisiert via Claude-Code-Subscription, nicht Marketplace-Revenue-Share.

### Implikation für ValidationKit

Distribution über den offiziellen Marketplace ist möglich und **friction-arm**, aber:
1. Direkter Wettbewerb mit kostenlosen, offiziellen Skills.
2. Keine Monetarisierungs-Schiene innerhalb des Marketplaces → ValidationKit muss Pricing **außerhalb** der Plattform anchoren (Enterprise-Lizenz, Hosted-Service, Compliance-SaaS).
3. Plugin-Install-Counts sind eine **Vanity-Metric** — Wert-Capture passiert nicht beim Install.

---

## 3. Native-Validation-Threat-Assessment

### 3.1 Was Anthropic schon hat (RED ALERT)

**Skill-Creator (Official, Anthropic Verified, 244k Installs):**
- 4 Operating-Modi: **Create, Eval, Improve, Benchmark**
- Executor-Agent: führt Skills gegen Eval-Prompts aus
- Grader-Agent: bewertet Outputs gegen Expectations
- Comparator-Agent: blinde A/B-Tests zwischen Skill-Versionen
- Analyzer-Agent: empfiehlt targeted improvements mit Varianz-Analyse
- Trigger-Optimization: rewrites & testet Skill-Descriptions

**Skills 2.0 (Q1 2026):**
- Structured Evaluations mit weighted rubrics
- A/B-Testing-Loop
- Version-Tracking + per-version Scoring
- Batch-Eval auf Test-Datasets
- Production-Monitoring (Live-Traffic-Sampling)

**Hooks (Early 2026):**
- PreToolUse: blocking-fähig, Security-Gates, mandatory review
- PostToolUse: deterministische Post-Checks
- Stop: kann Claude zwingen, weiterzuarbeiten bis Tests grün sind
- 3 Handler-Typen: command / prompt / agent → mapped 1:1 auf "Quality Gates"

**Native Verification Loop (laut Anthropic Engineering Blog):**
> *"Stop hooks prevent teams from completing a task until tests pass. Subagents can run dedicated validation passes that inspect work without modifying it. The verification loop is something the team assembles, but the building blocks are explicit and well-supported."*

### 3.2 Threat-Klassifizierung

| Threat-Vektor | Wahrscheinlichkeit | Impact auf ValidationKit | Timeline |
|---|---|---|---|
| **(A) Anthropic launcht "Claude Validate" als horizontales Produkt** | **Mid (40–55%)** | **High** — frisst 60–80% Use-Cases | 6–18 Monate |
| **(B) Skill-Creator wird zu generischem Validator generalisiert** | **High (65%)** | **High** — frisst 50% Use-Cases | 0–6 Monate (bereits 60% da) |
| **(C) Community-Plugin (z.B. Superpowers Nachfolger) wird de-facto Standard** | **High (70%)** | **Mid** — frisst Mindshare | bereits eingetreten |
| **(D) Hooks + native Sub-Agents reichen Power-Usern aus** | **Very High (85%)** | **Mid** — DIY frisst SMB-Segment | bereits eingetreten |
| **(E) Anthropic acquired einen Validation-Player** | **Low–Mid (20–30%)** | **Existential** | 12–24 Monate |
| **(F) Claude Code wird abgekündigt/replatformed** | **Very Low (<5%)** | **Existential** | n/a |

### 3.3 Worst-Case: Was ValidationKit Anthropic *nicht* einfach baut

Hier liegt der **defensible Moat**:
1. **Domain-spezifische Validatoren** (Pharma-GxP, FinTech-PCI, HIPAA, ISO-27001-Mappings). Anthropic baut horizontale Tools, nicht vertikale Compliance.
2. **Cross-Tool-Eval-Harness** (Skill läuft auf Claude *und* Cursor *und* Codex *und* Gemini, Ergebnis-Aggregation). Anthropic hat 0% Anreiz, das zu bauen.
3. **Audit-Trails + Reporting** für regulierte Industrien. Eval-Logs als Compliance-Artefakt.
4. **Org-Level-Governance** (Multi-Repo, Multi-Team Policy-as-Code). Anthropic-Tools sind dev-zentriert, nicht governance-zentriert.
5. **Determinismus-Layer** (snapshots, golden outputs, replay) für nicht-LLM-validation. Anthropic-Eval ist LLM-judge-basiert.

---

## 4. Portierbarkeit auf andere Coding-Agents

### Der Agent-Skills-Open-Standard

`SKILL.md` ist mittlerweile ein offener Standard, adoptiert von:
- **Claude Code** (Origin)
- **OpenAI Codex CLI** — `openai.yaml` Metadata-Ergänzung
- **Cursor** — über Rules + manuelle Invocation (keine native Discovery)
- **Gemini CLI** — offizielle Skills-Doku
- **GitHub Copilot** (Agent Mode), **Cline**, **Roo Code**, **Goose**, **OpenCode**

**Was portabel ist:**
- YAML-Frontmatter (name, description)
- Markdown-Instruktionen
- Supporting-Files (scripts, references, assets)
- Progressive Disclosure

**Was NICHT portabel ist (Lock-in Surface):**
- **Subagent-Spawning** (`.claude/agents/*.md`, context-fork) → Claude-Code-spezifisch. Codex hat eigenes Format (`/root/agent_a` Path-Addressing), Cursor hat TypeScript-SDK-Subagents (Cursor 3, April 2026).
- **Hooks-System** (PreToolUse, Stop) → Claude-Code-spezifisch. Cursor hat eigene Hooks im SDK.
- **Slash Commands** → Claude-Code-Konvention.
- **Plugin-Marketplace-Format** (`.claude-plugin/marketplace.json`) → Anthropic-only.

### Konkurrenz-Landschaft (Mai 2026)

| Tool | Subagents | Hooks | Skills | SDK | Marktposition |
|---|---|---|---|---|---|
| **Claude Code** | ✅ native | ✅ native | ✅ native + 2.0 | Agent SDK (proprietary) | Marktführer, $2.5B ARR |
| **Codex CLI (OpenAI)** | ✅ v2, path-addressed | partial | ✅ SKILL.md | TS-SDK | #2, schnell wachsend |
| **Cursor 3** | ✅ Agents Window, TS-SDK | ✅ SDK-Hooks | partial | ✅ TS-SDK (Apr 2026) | #2 in IDE-Segment |
| **Gemini CLI** | partial | partial | ✅ SKILL.md | ja | wachsend |
| **Aider / Continue / Cline** | nein/partial | nein/partial | partial | nein | Long Tail |

### Lock-in-Schätzung für ValidationKit

| Komponente | Lock-in | Portierungsaufwand |
|---|---|---|
| `SKILL.md`-Definitionen | **Low** | ~5% Anpassung pro Target |
| Subagent-Definitionen (`.claude/agents/`) | **High** | ~40–60% Re-Implementation pro Target |
| Hooks-Logik (PreToolUse, Stop) | **High** | je nach Target 30–70% |
| Slash-Commands | **Medium** | mapping pro Target |
| Validation-Core (Domain-Regeln, Test-Cases, Reports) | **None** | 0% — bleibt agent-agnostic |

**Gesamtschätzung:** Ein "naiver" Port auf Cursor oder Codex kostet **3–6 Engineer-Wochen** pro Target. Eine *abstraction-layer-first* Architektur kann das auf **1–2 Wochen pro Target** drücken.

---

## 5. Vercel + Anthropic Distribution

- Vercel AI Gateway hat einen **Anthropic-kompatiblen API-Endpoint** für Claude Code & Claude Agent SDK. Routing, Observability, Failover sind möglich.
- **Claude Sonnet 4.5** ist via Gateway verfügbar.
- Vercel hat **eigene Plugin/Skill-Distribution**: `npx plugins add vercel/vercel-plugin` (Claude Code, Cursor) und `npx skills add vercel-labs/agent-skills` (cross-agent).
- **Implikation:** Vercel könnte ein **alternativer Distribution-Channel** für ValidationKit sein, der nicht von Anthropic-Plugin-Marketplace-Policy abhängt. Hosting/Pricing kann auch über Vercel-Marketplace-Integration laufen (Auto-provisioned Env-Vars, Unified Billing).

---

## 6. Strategische Implikationen für ValidationKit

### 6.1 Soll ValidationKit multi-provider von Tag 1 sein?

**JA.** Begründung:

1. **Marktstruktur:** Coding-Agent-Markt hat sich in 2026 verbreitert. Cursor 3 (April), Codex v2 (parallel), Gemini CLI — Claude Code ist Marktführer, aber nicht Monopolist. Multi-provider erhöht TAM um 60–100%.
2. **Risiko-Hedge:** Anthropic-native Validator ist *nicht* hypothetisch — Skill-Creator existiert. Mid-Probability für horizontale Generalisierung.
3. **Differenzierung:** "Wir sind der einzige Validator, der über alle Coding-Agents funktioniert" ist ein klar artikuliertes Wert-Versprechen, das Anthropic *nicht* contern kann (kein Anreiz).
4. **Architektur-Kosten:** Wenn die Validation-Core von Anfang an Agent-agnostic gebaut wird (Pydantic/Zod-basierte Rule-Engine + Adapter-Pattern für jeden Agent), ist der Extra-Aufwand initial **~15–25%**. Retro-fit nach 6 Monaten Claude-Lock-in: **3–5×** so teuer.

**Konkrete Architektur-Empfehlung:**
```
┌─────────────────────────────────────────────┐
│  ValidationKit Core (agent-agnostic)        │
│  - Rules, Policies, Test-Cases, Reports     │
│  - Domain-Packs (GxP, PCI, HIPAA, SOC2)     │
│  - Eval-Harness (LLM-judge + deterministic) │
└──────────┬──────────────────────────────────┘
           │
    ┌──────┴──────┬──────────┬────────┬─────────┐
    ▼             ▼          ▼        ▼         ▼
 Claude Code   Cursor 3   Codex   Gemini    HTTP/CI
 Adapter       Adapter    Adapter Adapter   Adapter
 (subagent +   (TS-SDK)   (path-  (skills)  (standalone)
  hooks +                  addr)
  skill)
```

### 6.2 Näher an oder weiter weg von Anthropic positionieren?

**Empfehlung: "Anthropic-first, aber öffentlich agent-agnostic"**

- **Tag-1-Launch:** Best-in-class Claude-Code-Experience. Marketing: "Made for Claude Code, runs everywhere."
- **GTM-Reihenfolge:** Claude Code (heute) → Cursor 3 (Q3) → Codex (Q4) → Gemini (2027).
- **Distribution:**
  - Plugin im offiziellen Claude Plugin Marketplace (`anthropics/claude-plugins-official`) — friction-arm Discovery.
  - Vercel Skill als sekundärer Channel.
  - **Nie als "Anthropic Verified" beworben außer wenn explizit verifiziert** — Vermeidung von Co-Branding-Lock-in.
- **Vertical-First Marketing:** Nicht "We validate Claude skills", sondern **"We validate AI-generated code for regulated industries"**. Damit weicht ValidationKit dem Skill-Creator-Overlap aktiv aus.

### 6.3 Was NICHT zu bauen (Konflikt mit Anthropic vermeiden)

- ❌ Generischer Skill-Eval-Runner mit A/B-Testing → ist Skill-Creator, ihr verliert.
- ❌ Trigger-Description-Optimizer → ist Skill-Creator.
- ❌ Generic LLM-Judge ohne Domain-Layer → kein Moat.
- ❌ Plugin-Marketplace-Konkurrent → Anthropic, Vercel, Agensi sind schon da.

### 6.4 Was zu bauen (Defensible Moat)

- ✅ **Compliance-Packs** als first-class Output (FDA 21 CFR Part 11, GDPR-Art-22, SOC2-CC8, etc.)
- ✅ **Cross-Agent-Eval-Aggregation** (gleicher Test, n Agents, Vergleichsmatrix)
- ✅ **Deterministic Replay Harness** für Audit (jeder Validation-Run reproduzierbar)
- ✅ **Org-Governance-Layer** (Policy-as-Code, Multi-Repo, Multi-Team)
- ✅ **Vertical Integrations** mit Vercel AI Gateway (Observability-Source, Cost-Attribution)

---

## 7. Monitoring-Signale (was wir aktiv beobachten müssen)

| Signal | Quelle | Polling-Frequenz | Threat-Level wenn eintritt |
|---|---|---|---|
| Skill-Creator wird zu "Claude Validate" rebranded/generalisiert | claude.com/plugins, Anthropic Newsroom | weekly | **Critical** |
| Anthropic acquired Eval-/Validation-Startup (Braintrust, Patronus, Promptfoo, etc.) | The Information, TechCrunch | weekly | **Critical** |
| Native Validation in `code.claude.com/docs` als top-level Feature | Docs-Diff | weekly | **High** |
| Vercel launcht eigenes Validation-Plugin | vercel.com/changelog | weekly | **Mid** |
| Cursor 3 launcht natives Eval-Modul | cursor.sh changelog | weekly | **Mid** |
| Hooks-System gets pre-built validation-templates | code.claude.com docs | weekly | **High** |

---

## Schlussfolgerung

ValidationKit hat ein **reales, mid-probability, high-impact** Platform-Risiko gegenüber Anthropic. Der gefährlichste Punkt ist *nicht* ein zukünftiger Launch, sondern ein **bereits existierender Bestandteil**: Skill-Creator mit Eval/A-B/Benchmark macht ca. 60% dessen, was eine naive "Wir validieren Claude-Skills"-Positionierung verkauft.

Drei Pflicht-Moves:

1. **Repositioning auf "AI-Code-Validation für regulierte Industrien"** — weg von Skill-Validierung, hin zu Domain-Validierung. Anthropic baut keine vertikale Compliance.
2. **Multi-provider-Architektur von Tag 1.** 15–25% Extra-Aufwand jetzt vs. 3–5× später. TAM verdoppelt sich, Risiko halbiert sich.
3. **Distribution-Hedge:** Anthropic-Plugin-Marketplace als Primary, Vercel-Skills als Secondary, eigener Web-Direct-Channel als Tertiary.

Die "Anthropic obsoleted uns morgen"-Frage ist falsch gestellt. Die richtige Frage lautet: *"Was bauen wir, das Anthropic strukturell nicht bauen wird, und welche Kanäle nutzen wir, die Anthropic nicht kontrolliert?"* — Antwort: vertikale Compliance + cross-agent Portabilität + nicht-Anthropic-Distribution-Kanäle.

---

**Sources:**
- [Anthropic Skills Repository](https://github.com/anthropics/skills)
- [Anthropic Claude Plugins Official](https://github.com/anthropics/claude-plugins-official)
- [Claude Plugin: Skill-Creator (Anthropic Verified)](https://claude.com/plugins/skill-creator)
- [Claude Plugin: Superpowers (Community)](https://claude.com/plugins/superpowers)
- [Claude Code Skills 2.0 — MindStudio Analysis](https://www.mindstudio.ai/blog/claude-code-skills-2-evaluation-ab-testing)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Anthropic Engineering — Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Anthropic Series G $30B / $380B valuation](https://www.anthropic.com/news/anthropic-raises-30-billion-series-g-funding-380-billion-post-money-valuation)
- [Claude Code GTM Strategy — $2.5B ARR 2026](https://stormy.ai/blog/claude-code-gtm-strategy-anthropic-revenue-2026)
- [Anthropic in talks to acquire Stainless ~$300M](https://www.theinformation.com/articles/anthropic-talks-buy-developer-tools-startup-used-openai-google)
- [Anthropic acquires Bun (Dec 2025) — first acquisition](https://techstartups.com/2025/12/02/anthropic-in-talks-to-acquire-bun-as-claude-codes-agentic-push-accelerates-in-its-first-ever-acquisition/)
- [Agent Skills Open Standard Explainer](https://www.agensi.io/learn/agent-skills-open-standard)
- [Codex Subagents (OpenAI)](https://developers.openai.com/codex/subagents)
- [Cursor 3 TypeScript SDK with Subagents & Hooks](https://www.marktechpost.com/2026/04/29/cursor-introduces-a-typescript-sdk-for-building-programmatic-coding-agents-with-sandboxed-cloud-vms-subagents-hooks-and-token-based-pricing/)
- [Gemini CLI Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Vercel AI Gateway — Claude Code Support](https://vercel.com/docs/ai-gateway/claude-code)
- [Vercel Collab with Anthropic on Sonnet 4.5](https://vercel.com/blog/collaborating-with-anthropic-on-claude-sonnet-4-5)
- [Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
