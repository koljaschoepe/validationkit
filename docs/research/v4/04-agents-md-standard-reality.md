# 04 — Agent-File-Standard Reality Check (Mai 2026)

> **Research-Track B2 für ContextForge PRD-Validierung.**
> Stand: 2026-05-16. Lead-Frage: *Konvergiert das Agent-File-Ökosystem (gut für ContextForge) oder fragmentiert es (schlecht)?*

---

## TL;DR — Verdict: **Converging Fast, mit einem Anthropic-Schatten**

**Headline:** Das Agent-File-Ökosystem ist **drastisch viel weiter konvergiert** als jeder rationale Beobachter vor 9 Monaten erwartet hätte. Zwei load-bearing Events Q4 2025:

1. **2025-12-09 — Linux Foundation gründet die Agentic AI Foundation (AAIF).** AGENTS.md wird unter Foundation-Governance gestellt. **Platinum-Members: Anthropic, OpenAI, Google, AWS, Microsoft, Block, Bloomberg, Cloudflare.** Stand Feb 2026 hat AAIF **146 Mitglieder** ([Linux Foundation Press Dec 2025](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation), [AAIF Member-Update](https://aaif.io/press/agentic-ai-foundation-welcomes-97-new-members-as-demand-for-open-collaborative-agent-standardization-increases/)).
2. **2025-12-18 — Anthropic publiziert SKILL.md als Open Standard.** Innerhalb von 48 Stunden adoptieren Microsoft (VS Code) und OpenAI (ChatGPT + Codex CLI). Bis März 2026 lesen **32 Tools** identische SKILL.md-Files aus identischer Verzeichnisstruktur ([Paperclipped Agent-Skills-Guide](https://www.paperclipped.de/en/blog/agent-skills-open-standard-interoperability/), [Anthropic Engineering Blog](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)).

**Aber:** Anthropic selbst lehnt AGENTS.md-Support in Claude Code seit August 2025 schweigend ab. Das ist die kritische Asymmetrie für ContextForge.

**Verdict:** **Converging Fast — aber mit einem 3-Tier-Realismus:**
- **Tier 1 (universell, stabil):** AGENTS.md, SKILL.md. Foundation-governed, Multi-Vendor, retroaktiv-kompatibel.
- **Tier 2 (vendor-spezifisch, stabil):** CLAUDE.md, GEMINI.md, .cursor/rules/*.mdc. Werden **parallel** zu AGENTS.md gehalten, nicht ersetzt.
- **Tier 3 (legacy, im Sterben):** .cursorrules (deprecated), .windsurfrules (parallel mit AGENTS.md gehalten aber nicht aktiv weiterentwickelt).

**Für ContextForge:** Solide Foundation, NICHT shifting sand. Aber der Parser-Burden ist **n+1**, nicht **1** — Vendor-Specifics bleiben parallel zum Open Standard. Wer "ein File reicht" verspricht, lügt.

---

## 1 — AGENTS.md: vom Side-Project zum Linux-Foundation-Asset in 16 Monaten

### 1.1 Adoption-Metrik (mehrfach gequellt)

| Quelle | Datum | Behauptung |
|---|---|---|
| AAIF Press (Dec 2025) | 2025-12-09 | "60.000+ Open-Source-Projekte" ([Linux Foundation](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)) |
| Morph Guide (2026) | 2026-Q1 | "60k+ Projekte" ([Morph AGENTS.md Guide](https://www.morphllm.com/agents-md-guide)) |
| Linux Foundation Update | 2026-02 | 146 AAIF-Members, AGENTS.md "broadly adopted" ([AAIF 97 New Members](https://www.linuxfoundation.org/press/agentic-ai-foundation-welcomes-97-new-members)) |
| GitHub Blog | 2026-Q1 | Eigene Analyse von 2.500+ AGENTS.md-Files in Public Repos ([GitHub Copilot Blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)) |
| GitHub Repo agentsmd/agents.md | 2026-05 | 21.4k Stars, 1.6k Forks, 154 Watcher, 35 Commits ([Repo](https://github.com/agentsmd/agents.md)) |

**Realitätscheck:** Die "600.000 Repos"-Behauptung aus einer der Sekundärquellen ist **nicht** mehrfach belegt und wahrscheinlich ein Tippfehler oder ein "GitHub-Search-Result-Count" inklusive aller Forks und Mirrors. Die 60k-Zahl ist die offiziell von der AAIF und Linux Foundation getragene Größe und ist die einzige, die ContextForge in Investor-Decks zitieren sollte.

### 1.2 Wer steht dahinter (Governance)

Stand 2026-02-15 ist AGENTS.md unter **AAIF-Direkten-Fund-Modell**:
- Platinum-Members (Anthropic, OpenAI, Google, AWS, Microsoft, Block, Bloomberg, Cloudflare) zahlen Membership-Dues
- Technical Steering Committee setzt Roadmap — keine Einzelfirma hat Veto
- Governing Board Chair: **David Nalley** (AWS Director of Developer Experience) ([AAIF Update](https://aaif.io/press/agentic-ai-foundation-welcomes-97-new-members-as-demand-for-open-collaborative-agent-standardization-increases/))

Skeptische Stimmen ([Shashi Jagtap auf Medium](https://medium.com/superagentic-ai/agentic-ai-foundation-where-open-innovations-meet-closed-governance-and-a-platinum-paywall-572361b357ea), Dec 2025) kritisieren die Platinum-Paywall — der Vorwurf ist, dass "open standard" hier mehr Marketing als Realität ist. Für ContextForge ist das **strategisch unproblematisch**: das File-Format selbst ist Markdown, der Parser ist trivial, die Adoption ist gemessen.

### 1.3 Spec-Evolution (v1.0 → v1.1 in Diskussion)

[Issue #135](https://github.com/agentsmd/agents.md/issues/135) ist der laufende v1.1-Proposal. Inhalte:
- **YAML-Frontmatter optional** mit `description` und `tags` (für Progressive Disclosure)
- Explizite Doku von **jurisdiction, accumulation, precedence, inheritance** (Monorepo-Semantik)
- Keine Breaking Changes — alles backward-compatible

**Spec-Stabilität-Signal:** v1.1 ist additive, nicht ersetzend. Die Foundation-Mitglieder haben kein Interesse, ihre frisch gepushten Tool-Integrations zu brechen. Risiko von Re-Spec auf Sicht von 24 Monaten: **gering**.

### 1.4 Cross-Vendor-Support-Matrix (Stand 2026-05-16)

| Tool | Liest AGENTS.md? | Status / Quelle |
|---|---|---|
| OpenAI Codex CLI | Ja | Native, ist der Originator ([OpenAI AAIF-Post](https://openai.com/index/agentic-ai-foundation/)) |
| Google Gemini CLI | Ja | Native (Liste auf [agents.md](https://agents.md/)) |
| Cursor | Ja | Native, **empfiehlt aktiv Migration von .cursorrules → AGENTS.md** ([thepromptshelf](https://thepromptshelf.dev/blog/cursorrules-vs-mdc-format-guide-2026/)) |
| Windsurf / Cascade | Ja | Native, läuft durch dieselbe Rules-Engine wie `.windsurf/rules/` ([Windsurf Docs](https://docs.windsurf.com/windsurf/cascade/agents-md)) |
| GitHub Copilot | Ja | Custom-Agents-Feature, baut auf AGENTS.md ([GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)) |
| Aider | "Ja-by-Convention" | Liest beliebige Markdown-Convention-Files; AGENTS.md funktioniert ohne Code-Änderung ([Aider Issue #4363](https://github.com/aider-ai/aider/issues/4363)) |
| Cline | Ja | Multi-Format-Reader, AGENTS.md ist eines der unterstützten Formate ([Cline Docs](https://docs.cline.bot/features/cline-rules/overview)) |
| JetBrains Junie | Ja | Genannt auf agents.md |
| Zed, Warp, Factory, Devin, UiPath | Ja | Genannt auf agents.md |
| **Anthropic Claude Code** | **NEIN** | **Ungelöst seit August 2025** ([Issue #6235](https://github.com/anthropics/claude-code/issues/6235), [Issue #31005](https://github.com/anthropics/claude-code/issues/31005)) |

Die Anthropic-Lücke ist der eine wirkliche Schmerz im sonst konvergenten Bild. Dazu Section 4.

---

## 2 — CLAUDE.md: stabiler als gedacht, aber Anthropic ist die größte Bottleneck

### 2.1 Status

CLAUDE.md ist die **De-Facto-Standard-Form** für Claude-Code-Projekte. Anthropic Best Practices erwähnen es explizit: *"CLAUDE.md: store project conventions and persistent context"* ([Anthropic Engineering — Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)).

**Anthropic-spezifische Features, die AGENTS.md NICHT hat:**
- `@import`-Syntax zum Mergen von Sub-Files
- Path-scoped Rules (`./apps/web/CLAUDE.md` wird beim Arbeiten in `apps/web/` zusätzlich geladen)
- Local-Override-Mechanik mit `CLAUDE.local.md` + Git-Ignore
- Hierarchical Layering: `~/.claude/CLAUDE.md` (user-global) → repo-root CLAUDE.md → subdir CLAUDE.md

Diese Features sind Tier-2-Vendor-Specifics. Sie werden NICHT verschwinden — sie sind Anthropics Differentiator gegen den OpenAI-Standard.

### 2.2 Hat Anthropic CLAUDE.md deprecated?

**Nein.** Code-with-Claude 2026 (2026-05-06 in SF, London, Tokio) hat fünf neue Features angekündigt: Dreaming, Outcomes, Multi-Agent-Orchestration, Claude Finance, Add-ins ([MindStudio](https://www.mindstudio.ai/blog/code-with-claude-2026-new-agent-features), [Simon Willison Live-Blog](https://simonwillison.net/2026/May/6/code-w-claude-2026/)). **Kein Wort zu CLAUDE.md-Deprecation.** Kein Wort zu AGENTS.md-Support.

Das ist beides ein Signal:
- (a) CLAUDE.md bleibt mindestens 18 Monate stabil — Anthropic hat es nicht angefasst.
- (b) Anthropic plant aktiv KEINE AGENTS.md-Konvergenz für Claude Code, trotz AAIF-Platinum-Membership. Strategische Lock-in-Spannung ist real.

### 2.3 Die Anthropic-Asymmetrie

[Issue #6235](https://github.com/anthropics/claude-code/issues/6235) ist filed 2025-08-21. Hat (nach Sekundärquellen) **3.020 Upvotes und 224 Comments** ([devtoolpicks-Sekundärzitat](https://github.com/anthropics/claude-code/issues/31005)). **Zero Anthropic-Responses.** Nur Bot-Aktionen. Issue #31005 (2026-03-05) ist die Frustration-Eskalation derselben Community.

Die Ironie, die Community pointiert: *"Anthropic created MCP. Anthropic created the Agent Skills standard. Anthropic refuses to make Claude Code read the standards Anthropic itself defined."*

**Lesart:** Anthropic gewinnt nichts durch AGENTS.md-Support (Cross-Tool-Migrations werden einfacher → User wechseln leichter weg). Sie verlieren auch nichts durch Verweigerung (community schreibt `ln -s AGENTS.md CLAUDE.md`-Workaround). Game-theoretisch rational, strategisch ohne Eile.

**Für ContextForge:** Solange Claude Code primärer Anthropic-Endpoint bleibt, **muss ContextForge CLAUDE.md als First-Class-Format parsen**. AGENTS.md-Only wäre ein Anthropic-Blind-Spot.

---

## 3 — GEMINI.md: real, wachsend, aber Tier-2

### 3.1 Adoption

Gemini CLI ist Open Source ([google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)). Die `GEMINI.md` ist ein dokumentiertes Pattern im offiziellen Repo. Stand Mai 2026 ist Gemini CLI noch in "Alpha-mit-Telemetrie" ([Google Cloud Blog Jan 2026](https://cloud.google.com/blog/topics/developers-practitioners/instant-insights-gemini-clis-new-pre-configured-monitoring-dashboards/)).

**Broader Gemini-Zahlen für Sizing:**
- 8M+ Gemini-Enterprise-Seats über 2.800+ Firmen
- 13M Entwickler haben mit Google Generative AI gebaut
- Gemini Cloud-Customers-Growth 35x YoY ([Second Talent Gemini Stats](https://www.secondtalent.com/resources/google-gemini-statistics/))

**Aber:** Gemini CLI selbst hat keine Public-Adoption-Zahl. Mein Sizing-Guess: **GEMINI.md ist ~10–20 % der CLAUDE.md-Volumes** in den Codebases, die ContextForge potenziell adressiert (Solopreneurs + Boutique-Agenturen).

### 3.2 Konvergenz-Signal

Google ist AAIF-Platinum-Member. Gemini CLI liest AGENTS.md nativ. **GEMINI.md ist nicht die primäre Onramp** — Google selbst pusht AGENTS.md.

**Lesart:** GEMINI.md ist vestigial-vergleichbar-zu-CLAUDE.md aus Anthropic-Sicht, aber Google ist im Gegensatz zu Anthropic strategisch all-in auf den Cross-Vendor-Standard. ContextForge sollte GEMINI.md parsen, aber priorisiert **niedriger** als CLAUDE.md.

---

## 4 — `.claude/skills/` vs `.claude/agents/` vs `.claude/commands/` — stabilisiert oder konsolidierend?

### 4.1 Status (2026-05)

Die drei Verzeichnisse haben **klar separate Semantik** und sind in Anthropic's eigener Doku konsolidiert ([Claude Code Docs](https://code.claude.com/docs/en/sub-agents), [Anatomy of .claude Folder](https://codewithmukesh.com/blog/anatomy-of-the-claude-folder/)):

| Verzeichnis | Zweck | Cross-Vendor-Pendant |
|---|---|---|
| `.claude/agents/*.md` | Sub-Agents mit YAML-Frontmatter + System-Prompt im Body. Werden durch Name-Frontmatter-Feld identifiziert (Pfad ist irrelevant). | OpenAI Codex hat ähnliches Konzept; nicht standardisiert. |
| `.claude/commands/*.md` | Slash-Commands. Filename → Command-Name (z.B. `review.md` → `/review`). | Cursor hat eigene Notation; OpenAI Codex hat eigene. Nicht standardisiert. |
| `.claude/skills/<name>/SKILL.md` | Agent Skills mit Progressive-Disclosure (Discovery → Activation → Execution). | **Cross-Vendor-Standard.** SKILL.md ist von 32 Tools gelesen ([Paperclipped Guide](https://www.paperclipped.de/en/blog/agent-skills-open-standard-interoperability/)). |

### 4.2 Konsolidiert Anthropic?

**Nein.** Skills, Agents, Commands sind funktional unterschiedlich:
- **Skill** = lazy-loaded Capability mit Scripts/Templates/References
- **Agent** = delegierbarer Sub-Worker mit eigenem Context und Tool-Set
- **Command** = User-Triggered-Slash-Workflow

Es gibt keinen Anthropic-Roadmap-Hinweis, dass eines verschwindet. Im Gegenteil: Code-with-Claude-2026 hat **Multi-Agent-Orchestration** als Headline-Feature gepusht ([Blake Crosley Recap](https://blakecrosley.com/blog/code-with-claude-sf-2026-recap)) — das doubelt-down auf `.claude/agents/` als first-class.

### 4.3 SKILL.md ist das eine, das ContextForge zwingend Cross-Vendor parsen muss

SKILL.md hat **die schnellste Adoption-Velocity in der Agent-Tooling-Geschichte:**
- 2025-12-18: Anthropic publiziert Spec
- 2025-12-20: Microsoft VS Code + OpenAI ChatGPT + Codex CLI integriert (48 Stunden)
- 2026-03: 32 Tools (Cursor, Windsurf, Gemini CLI, Junie, Kiro, Goose, RooCode, Cline, ...) lesen identische SKILL.md aus identischer Struktur

Spec-Struktur:
```
.claude/skills/<name>/    # oder ~/.claude/skills/<name>/
├── SKILL.md              # required: YAML-Frontmatter + Markdown-Body
├── scripts/              # optional
├── references/           # optional
└── assets/               # optional
```

([anthropics/skills GitHub](https://github.com/anthropics/skills), [agentskills.io](https://agentskills.io/home))

**Für ContextForge:** SKILL.md ist Pflichtparser, weil es das **einzige** Format ist, das gleichzeitig (a) Anthropic-blessed UND (b) Cross-Vendor-adoptiert ist. Es ist der einzige garantierte Brücken-Stein zwischen Anthropic-Welt und Rest-der-Welt.

---

## 5 — Cursor / Windsurf / Cline / Aider: Konvergenz oder Balkanisierung?

### 5.1 Cursor — aktive Migration von Proprietary zu Standard

Cursor hat 2026 **aktiv `.cursorrules` deprecated** zugunsten von zwei Pfaden ([thepromptshelf 2026 Guide](https://thepromptshelf.dev/blog/cursorrules-vs-mdc-format-guide-2026/)):

1. **`.cursor/rules/*.mdc`** — vendor-spezifisch, mit YAML-Frontmatter (description, alwaysApply, globs) und 4 Aktivierungs-Modi
2. **AGENTS.md** — explizit als Migrations-Empfehlung gelistet

Cursor's offizielles Generate-Rules-Command erzeugt jetzt MDC-Files, nicht `.cursorrules` ([Cursor Forum Bug Report](https://forum.cursor.com/t/generate-cursor-rules-created-a-deprecated-cursorrules-file/113200)).

**Konvergenz-Lesart:** Cursor positioniert sich als **AGENTS.md-kompatibel + eigene MDC-Power-Features**. Klassisches "Cooperate-on-Substrate, Compete-on-Features"-Spiel.

### 5.2 Windsurf — Parallel-Strategy

Windsurf Docs sind explizit: **AGENTS.md und `.windsurf/rules/` laufen durch dieselbe Engine, werden parallel gehalten** ([Windsurf AGENTS.md Doc](https://docs.windsurf.com/windsurf/cascade/agents-md)). Keine Deprecation. AGENTS.md ist "best for directory-specific conventions", Rules sind "best for cross-cutting concerns, complex activation logic".

Plus: Windsurf liest auch SKILL.md aus `.windsurf/skills/` (2026-03 Changelog-Entry).

### 5.3 Cline — Multi-Format-Reader

Cline ist die radikalste Konvergenz-Implementierung. Liest:
- `.clinerules` (proprietary)
- AGENTS.md (Standard)
- CLAUDE.md
- `.cursorrules`
- `.windsurfrules`

mit Precedence-Hierarchy: `.clinerules` > others, AGENTS.md wird IMMER auch in Subverzeichnissen gesucht ([Cline Docs](https://docs.cline.bot/features/cline-rules/overview)).

**Lesart:** Cline ist ContextForge's natürlicher Bedfellow — sie haben den Parser-Burden bereits gelöst. ContextForge sollte Clines Rules-Engine als Reference-Implementation studieren.

### 5.4 Aider — Convention-File-Approach

Aider liest beliebige Markdown-Convention-Files. Default ist `CONVENTIONS.md`, kann via `--conventions-file` umgebogen werden. AGENTS.md funktioniert **ohne Code-Änderung in Aider** ([Aider Issue #4363](https://github.com/aider-ai/aider/issues/4363)).

### 5.5 Balkanisierungs-Verdict

Die Balkanisierungs-These (jedes Tool hat eigenen proprietären Format und keinem ist es egal) ist **falsified** durch:

1. Cursor's aktive `.cursorrules`-Deprecation zugunsten AGENTS.md
2. Windsurf's parallele AGENTS.md+Rules-Strategie
3. Cline's Multi-Reader-Implementation
4. Aider's Flexibilität
5. **AGENTS.md** wird auf agents.md als primary von 20+ Tools nativ supported

**Aber** vendor-spezifische Power-Features bleiben:
- Cursor MDC mit 4 Aktivierungs-Modi (alwaysApply, globs, agent-requested, manual)
- Windsurf-Rules-Engine
- Claude Code `.claude/agents/` mit Tool-Restrictions per Sub-Agent
- Gemini CLI MCP-Tool-Bindings

**Verdict:** **Convergence on the substrate (AGENTS.md + SKILL.md), differentiation on the chrome.** Klassisches Web-Standards-Muster (HTML/CSS-Spec konvergent, Browser-Devtools divergent).

---

## 6 — Migration-Risk-Scenarios für ContextForge

### Scenario A — "Anthropic kapituliert und supportet AGENTS.md in Q3 2026"

**Probability:** Moderate (45 %). Die Community-Pressure ist enorm (3k+ Upvotes, 7+ Monate ignored). Anthropic ist AAIF-Platinum-Member; weiteres Schweigen erodiert Foundation-Credibility.

**ContextForge-Response-Kosten:** Niedrig. Eher Entlastung. AGENTS.md-Parser existiert schon, der Symlink-Workaround-Code wird obsolet.

### Scenario B — "Anthropic launcht 'CLAUDE.md v2' mit Breaking Changes"

**Probability:** Low-Moderate (20 %). Möglich bei Multi-Agent-Orchestration-Ausbau. Aber: Code-with-Claude-2026 hat NICHTS dazu angekündigt, Anthropic hat 18-Monate-Pattern of CLAUDE.md-Stabilität.

**ContextForge-Response-Kosten:** Mittel. Parser-V2 entwickeln, Detection-Heuristik um Version-Discrimination erweitern. ~1–2 Mann-Wochen, falls Spec rechtzeitig kommuniziert.

### Scenario C — "AAIF zerfällt nach Anthropic-OpenAI-Split"

**Probability:** Low (10 %). Beide sind Platinum-Members, beide haben Inkrement-Investition in MCP+SKILL.md+AGENTS.md gestellt. Plus 144 weitere Members (AWS, Google, MSFT, Block etc.) als Stabilisator.

**ContextForge-Response-Kosten:** High. Worst-Case-Szenario. AGENTS.md-Parser muss vendor-spezifische Forks tracken. **Mitigation:** ContextForge ohnehin Tier-2-Multi-Parser-Architektur planen (siehe Section 7).

### Scenario D — "Cursor wird von OpenAI oder Microsoft akquiriert, eigener Format gewinnt Cursor's User-Base"

**Probability:** Moderate (35 %). Cursor-Akquisitions-Gerüchte sind seit Q1 2026 in der Luft.

**ContextForge-Response-Kosten:** Niedrig. Akquisitionen tendieren zu Format-Konvergenz (siehe MSFT+GitHub → GitHub Copilot adoptiert AGENTS.md). Cursor MDC würde wahrscheinlich AGENTS.md-Frontmatter-Übernahme bekommen.

### Scenario E — "Ein neuer Player launcht radikal anderen Format, gewinnt 30 % Mindshare in 12 Monaten"

**Probability:** Low (15 %). Network-Effects sind jetzt enorm. 32 Tools auf SKILL.md, 20+ auf AGENTS.md. Ein neuer Format braucht entweder einen Hyperscaler-Backer ODER ein massiv überlegenes UX (z.B. Visual-Editor-Native), und beides ist nicht in Pipeline-Sicht.

**ContextForge-Response-Kosten:** Mittel. Parser-N+1 ist Plug-in-Architektur ohnehin.

---

## 7 — Parser-Burden-Matrix für ContextForge

### Phase-1 (M0–M6) — MUST-parse

| Format | Why | Aufwand |
|---|---|---|
| **CLAUDE.md** | De-facto bei allen Claude-Code-Usern, inkl. Hierarchical-Layering (`~/.claude/CLAUDE.md` + repo + subdir) | Hoch (Layering-Logik) |
| **AGENTS.md** | Cross-Vendor-Lingua-Franca, AAIF-governed, mit YAML-Frontmatter-Optional ab v1.1 | Mittel |
| **`.claude/agents/*.md`** | YAML-Frontmatter + System-Prompt-Body; recursive Discovery in `.claude/agents/` und `~/.claude/agents/` | Mittel |
| **`.claude/commands/*.md`** | Slash-Commands; flat-structure, filename → command-name | Niedrig |
| **`.claude/skills/<name>/SKILL.md`** | Standard, Cross-Vendor-Lesbar mit Progressive-Disclosure-Semantik | Mittel |

### Phase-1 (M0–M6) — SHOULD-parse

| Format | Why | Aufwand |
|---|---|---|
| **GEMINI.md** | Google AAIF-Member, GEMINI.md noch separate Onramp neben AGENTS.md | Niedrig |
| **`.cursor/rules/*.mdc`** | YAML-Frontmatter mit alwaysApply, globs, description; 4 Aktivierungs-Modi | Mittel-Hoch |
| **`.cursorrules`** (legacy) | Deprecated aber noch in vielen Repos | Trivial |
| **`.windsurf/rules/`** + **`.windsurf/skills/`** | Windsurf-Native | Niedrig |
| **`.clinerules`** | Cline-spezifisch | Trivial |

### Phase-1 (M0–M6) — MAY-parse

| Format | Why | Aufwand |
|---|---|---|
| **`CONVENTIONS.md`** (Aider-default) | Aider-Convention | Trivial |
| **`copilot-instructions.md`** | GitHub Copilot legacy convention | Trivial |
| **`.codex/`** | OpenAI Codex CLI proprietary, aber Codex liest auch AGENTS.md | Niedrig |

### Phase-3 (M18+) — Add when

- Neue AAIF-ratifizierte Standards (z.B. AGENT.md singular spec von [agentmd/agent.md](https://github.com/agentmd/agent.md) — falls Foundation-blessed)
- Vendor-spezifische Skill-Verzeichnisse falls neue Vendoren mit > 10 % Marktanteil dazukommen
- AGENT-MEMORY-Standard falls AAIF einen für Long-Running-Agents publiziert

**Total Phase-1 Formats: ~12 Formate.** Davon **5 MUST**, **5 SHOULD**, **3 MAY**. Aufwand-Schätzung: 4–6 Wochen für robusten Multi-Format-Parser mit Test-Suite gegen 100+ Real-World-Repos.

**Total Phase-3 Formats: 15–18 Formate** (Drift-Reserve eingeplant).

### 7.1 Deep-Dive: Cursor MDC-Format ist der schwierigste Parser

Vendor-Power-Features sind dort wo der Parser-Aufwand real wird. Cursor's MDC-Format ist das Best-Worst-Case-Beispiel ([Morph Cursor Rules Best Practices](https://www.morphllm.com/cursor-rules-best-practices)):

```mdc
---
description: TypeScript rules for the apps/web project
alwaysApply: false
globs:
  - "apps/web/**/*.ts"
  - "apps/web/**/*.tsx"
---

# Use strict mode everywhere
- All exports must be typed
- No `any` allowed
```

Vier Aktivierungs-Modi mit unterschiedlicher Frontmatter-Kombi:
1. **Always Applied** — `alwaysApply: true`
2. **Auto-Attached** — `globs: [...]` matched
3. **Agent-Requested** — `description` ist semantisch matched durch AI
4. **Manual** — User-invoked via @ruleName

Ein konformer ContextForge-Parser muss **alle vier Modi reproduzieren können** wenn er Cursor-Repos analysiert. Das ist nicht-trivial. AGENTS.md mit `description` + `tags` (v1.1 proposal) ist eine reduzierte Form davon — aber ohne `globs`-Pattern und ohne `alwaysApply`. ContextForge sollte Cursor-MDC-Files als **Super-Set-Format** behandeln und beim Re-Emit auf AGENTS.md eine Down-Conversion-Strategy haben.

### 7.2 Detection-Heuristik für Multi-Format-Repos

Real-World-Repos haben heute oft mehrere Formate parallel. Ein typisches Pattern (eigene Beobachtung in Sample-Repos via GitHub-Search):

```
my-monorepo/
├── README.md
├── AGENTS.md              # Cross-Vendor
├── CLAUDE.md              # Anthropic-spezifisch, evtl. Symlink zu AGENTS.md
├── .cursor/rules/
│   ├── typescript.mdc
│   └── testing.mdc
├── .claude/
│   ├── agents/
│   │   └── reviewer.md
│   ├── commands/
│   │   └── deploy.md
│   └── skills/
│       └── stripe-integration/
│           └── SKILL.md
└── apps/web/
    ├── AGENTS.md          # Sub-Project, overrides parent
    └── CLAUDE.md
```

ContextForge's Detection muss:
1. **Symlinks erkennen** (Anti-Doppel-Parsing)
2. **Precedence-Hierarchy** durchsetzen (nearest-file-wins für AGENTS.md, hierarchical-merge für CLAUDE.md)
3. **Konflikt-Reporting** (wenn CLAUDE.md X sagt, AGENTS.md Y sagt → User-Disambiguation-UI)
4. **Vendor-Origin-Detection** (welcher Vendor hat dieses File geschrieben, basierend auf File-Patterns und Content-Signatures)

---

## 8 — Half-Life von Config-File-Formaten: Was sagt die Historie?

Look at `.eslintrc.json` als Reference:
- **2013** — `.eslintrc` Original-Format
- **2015** — `.eslintrc.json` + `.eslintrc.js` Varianten
- **2017** — `.eslintrc.yml` + `eslintConfig` in package.json
- **2024** — ESLint v9: Flat-Config (`eslint.config.js`) wird Default, legacy deprecated aber weiter supported ([ESLint Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide))

**Beobachtungen:**
1. **Half-Life ~10 Jahre.** Legacy-Formate wurden mit massiver Backward-Compat-Periode entfernt.
2. **Konvergenz tendenziell additiv, nicht ersetzend.** Tools bleiben Multi-Format-fähig über Major-Versions.
3. **Migration ist Tooling-Problem, kein Parser-Problem.** Wenn `eslint.config.js` kommt, kommt Codemod-Tool.

**Übertragung auf Agent-Files:**
- AGENTS.md ist 2025-Q2 entstanden, AAIF-governed ab 2025-12. Erwartete Stabilitäts-Periode: **2025–2030 minimum**, mit additiver Spec-Evolution (v1.1 → v1.2 ohne Breaking).
- CLAUDE.md ist 2024-Q1 entstanden, ist heute ~2.5 Jahre alt. Bei einer Half-Life-Annahme von 10 Jahren ist Mid-Life-Erwartung 2029–2030.
- `.cursorrules` ist das einzige aktiv-deprecated Format. Lifecycle: 2023–2026 = 3 Jahre. Aber Adoption war nie so breit wie bei CLAUDE.md.

**Conclusion:** Agent-File-Formate verhalten sich wie klassische Config-File-Formate. Die Half-Life-Annahme von ContextForge sollte sein: **5–7 Jahre Stabilität pro Format mit additiver Spec-Evolution.** Das ist mehr als genug Runway für Phase-0 bis Phase-3.

---

## 9 — Vendor-Strategien-Mapping

| Vendor | Stance auf AGENTS.md | Eigener Vendor-Format | Strategie |
|---|---|---|---|
| **OpenAI** | Originator + AAIF-Platinum | `.codex/` (minor) | All-in auf Standard, eigener Format dient Codex-CLI-Power-Features |
| **Anthropic** | AAIF-Platinum, aber Claude Code liest AGENTS.md NICHT | CLAUDE.md (major) + `.claude/skills/` (cross-vendor) + `.claude/agents/` + `.claude/commands/` | **Standard-Push für Skills (SKILL.md gebraucht für Cross-Vendor-Claude-Diffusion); Standard-Verweigerung für AGENTS.md (würde Lock-in schwächen)** |
| **Google** | AAIF-Platinum, Gemini CLI liest AGENTS.md nativ | GEMINI.md (minor, vestigial) | Standard-First, eigener Format niedrige Priorität |
| **Cursor** | Native-Support, aktive Migration | `.cursor/rules/*.mdc` (major) | Standard-Compatible + Power-Features as Differentiator |
| **Windsurf (Cognition)** | Native-Support, parallel zu Native | `.windsurf/rules/`, `.windsurf/skills/` | Parallel-Architecture |
| **GitHub Copilot** | Native, AAIF-Member-via-Microsoft | `copilot-instructions.md` (legacy) | Standard-Migration |
| **JetBrains Junie** | Native | minimal eigener Format | Standard-First |
| **Block Goose** | AAIF-Co-Founder | Goose-Framework selbst | Standard-First |

**Eindeutiges Pattern:** **Alle außer Anthropic Claude Code** sind auf Standard-First. Anthropic ist Single-Outlier, und der Outlier-Status ist **strategisch lesbar als Customer-Lock-in-Defense**, nicht als Spec-Konfusion.

---

## 10 — Verdict für ContextForge PRD

### 10.1 Solid Foundation oder Shifting Sand?

**Solid Foundation, mit einem Anthropic-Caveat.**

Pro:
- AAIF-Governance ist real, multi-Vendor-funded, Linux-Foundation-stewardet
- AGENTS.md hat 60k+ Open-Source-Repos, 21k GitHub-Stars, Roadmap (v1.1)
- SKILL.md hat 32-Tool-Adoption in 90 Tagen — historisch schnellste Convergence in Dev-Tooling-Geschichte
- Cursor hat Legacy-Format aktiv-deprecated (Konvergenz-Signal)
- Cline+Aider implementieren Multi-Format-Reading nativ (Reference-Implementations existieren)
- Config-File-Format-History (eslintrc, prettierrc, package.json) deutet auf 5–10-Jahre-Stabilität hin

Con:
- Anthropic verweigert AGENTS.md-Support in Claude Code seit 9 Monaten
- Anthropic's CLAUDE.md hat vendor-spezifische Power-Features (Hierarchical-Layering, `@import`, Path-Scoping), die NIE in AGENTS.md kommen werden
- Vendor-spezifische Sub-Formate (`.cursor/rules/*.mdc`, `.windsurf/rules/`, `.claude/agents/*.md`) bleiben parallel und sind Anti-Konvergenz-Drift

### 10.2 Konkrete Empfehlungen

1. **ContextForge muss 12 Formate in Phase-1 parsen, nicht 1.** "AGENTS.md ist das eine File für alles" ist Marketing-Stretch, nicht Realität.
2. **Architektur: Multi-Parser mit Confidence-Scoring.** Bei Konflikt (z.B. CLAUDE.md sagt X, AGENTS.md sagt Y im selben Repo) → Show beide, let user decide.
3. **Parser-Roadmap an AAIF-Spec-Roadmap binden.** ContextForge sollte Listener auf [agentsmd/agents.md](https://github.com/agentsmd/agents.md) Issues+PRs haben, AAIF-Member werden (Silver-Membership $5k/yr ist im Budget, signalisiert Governance-Beteiligung).
4. **Symlink-Anti-Pattern erkennen.** Viele Repos haben `ln -s AGENTS.md CLAUDE.md` als Workaround. ContextForge sollte Symlinks detektieren und nicht doppelt parsen.
5. **Anthropic-Risk monitoring.** Wenn Anthropic Q3-Q4 2026 doch AGENTS.md-Support shippt, ist das ein Disambiguation-Trigger für ContextForge's Detection-Engine. Bauen wir das als Feature-Flag von Anfang an ein.
6. **SKILL.md hat First-Class-Priorität.** Es ist der einzige Format, der gleichzeitig (a) Anthropic-Native UND (b) Cross-Vendor-Standard ist. Das macht es zum kritischen Brücken-Asset für jeden Multi-Vendor-Validation-Loop.

### 10.3 Wann ContextForge re-evaluieren muss

**Hard Triggers für PRD-Re-Open:**
- Anthropic kündigt CLAUDE.md-Deprecation oder v2 mit Breaking Changes an
- AAIF kündigt Major-Bump auf AGENTS.md v2.0 mit nicht-backward-kompatiblen Änderungen an
- Hyperscaler (MSFT, Google, AWS) verlässt AAIF
- Ein neuer Format gewinnt > 15 % Mindshare innerhalb 6 Monaten
- AAIF zerfällt oder wird von einem Member kontrolliert

**Soft Triggers für Quartals-Review:**
- AGENTS.md-v1.2-Spec-Diskussion
- Neue Vendor-Skill-Formate parallel zu SKILL.md
- Cursor/Cline/Windsurf-Akquisitionen mit Format-Konsequenzen

---

## 10.4 "Was sollte ContextForge HEUTE tun?" — Actionable Sub-PRD-Items

| # | Action | Aufwand | Wann |
|---|---|---|---|
| 1 | AAIF-Silver-Membership ($5k/yr) für Foundation-Visibility | $5k + Onboarding-Zeit | Q3 2026 |
| 2 | Parser-Prototyp für MUST-5 (CLAUDE.md + AGENTS.md + .claude/agents + .claude/commands + SKILL.md) in TypeScript | 3 Wochen Solo | M0–M1 |
| 3 | Test-Suite gegen Top-100-GitHub-Repos (sortiert nach AGENTS.md-Adoption) | 1 Woche Solo | M1 |
| 4 | Watcher auf agentsmd/agents.md Issues + AAIF-Mailing-Liste | trivial | sofort |
| 5 | Listener auf Anthropic/Claude-Code-Release-Notes für AGENTS.md-Support-Announcement | trivial | sofort |
| 6 | Cline-Rules-Engine Source-Code-Review als Reference-Implementation | 2 Tage | M0 |
| 7 | Detect+Report Symlinks `CLAUDE.md → AGENTS.md` korrekt (Anti-Doppel-Count) | 1 Tag | M0 |
| 8 | Cursor-MDC-Parser inkl. 4-Activation-Mode-Logik (komplexester Vendor-Format) | 1 Woche | M1–M2 |
| 9 | Konflikt-Resolver-UX: "Was machst du wenn CLAUDE.md und AGENTS.md widersprechen?" | Design+Dev 1 Woche | M2 |
| 10 | Brand-Voice-Statement: "ContextForge parsed n+1 Formate, weil ein-Format-für-alles eine Lüge ist" | trivial, aber load-bearing für Marketing | M3 |

Item 10 ist nicht trivial wie es klingt. Die Versuchung, "we just read AGENTS.md" zu marketen, ist hoch (Simplicity-Pitch verkauft sich). Aber wer das tut, bricht in 6 Monaten an Anthropic-Repos zusammen. **Skeptic-Mentor-Voice-konform** ist: *"Das Ökosystem konvergiert auf AGENTS.md — aber Anthropic ist noch nicht mitgegangen, also parsen wir 12 Formate. Wir sind ehrlich darüber, du kannst es nachlesen."*

---

## 11 — Final Verdict (1-Satz)

**Das Agent-File-Ökosystem ist Mai 2026 in einer "Converging-Fast-with-Anthropic-Exception"-Phase — solide genug für ContextForge zur Validierung als Foundation, aber NICHT solide genug für "ein-File-reicht"-Marketing-Claims.**

Parser-Burden Phase 1: **12 Formate.** Phase 3: **15–18 Formate.** Half-Life: **5–7 Jahre.** Strategisches Risiko: **moderate, mit klar definierten Hard-Triggers.**

Die größte strategische Frage ist nicht "wird das Ökosystem fragmentieren" (Antwort: nein), sondern "wie verhält sich ContextForge in der einen kritischen Asymmetrie, wo Anthropic den De-Facto-Standard nicht supportet?". Die Antwort dort ist **Multi-Format-Parser mit AGENTS.md UND CLAUDE.md als gleichrangige First-Class-Inputs**, nicht "wir bauen auf den Open-Standard und ignorieren Anthropic".

---

## Quellen (chronologisch)

- 2025-08-21 — [Issue #6235 Feature Request: Support AGENTS.md (anthropics/claude-code)](https://github.com/anthropics/claude-code/issues/6235) — 3.020 Upvotes, 224 Comments, 0 Anthropic-Responses
- 2025-12-09 — [Linux Foundation Announces AAIF (Press Release)](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
- 2025-12-09 — [OpenAI co-founds AAIF (OpenAI Blog)](https://openai.com/index/agentic-ai-foundation/)
- 2025-12-09 — [TechCrunch: OpenAI, Anthropic, Block join Linux Foundation effort](https://techcrunch.com/2025/12/09/openai-anthropic-and-block-join-new-linux-foundation-effort-to-standardize-the-ai-agent-era/)
- 2025-12-18 — [Anthropic Engineering: Agent Skills Spec released](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- 2025-12 — [Critical view on AAIF Platinum Paywall (Shashi Jagtap, Medium)](https://medium.com/superagentic-ai/agentic-ai-foundation-where-open-innovations-meet-closed-governance-and-a-platinum-paywall-572361b357ea)
- 2026-01 — [Gemini CLI Monitoring Dashboards (Google Cloud Blog)](https://cloud.google.com/blog/topics/developers-practitioners/instant-insights-gemini-clis-new-pre-configured-monitoring-dashboards/)
- 2026-02 — [AAIF welcomes 97 new members (146 total)](https://aaif.io/press/agentic-ai-foundation-welcomes-97-new-members-as-demand-for-open-collaborative-agent-standardization-increases/)
- 2026-03 — [Agent Skills 32-tool adoption analysis (Paperclipped)](https://www.paperclipped.de/en/blog/agent-skills-open-standard-interoperability/)
- 2026-03-05 — [Issue #31005 Frustration-Eskalation (anthropics/claude-code)](https://github.com/anthropics/claude-code/issues/31005)
- 2026-Q1 — [GitHub Blog: Lessons from 2500+ AGENTS.md files](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
- 2026-Q1 — [AGENTS.md vs CLAUDE.md Real Differences (Prompt Shelf)](https://thepromptshelf.dev/blog/agents-md-vs-claude-md/)
- 2026-Q1 — [.cursorrules vs .cursor/rules MDC Guide (Prompt Shelf)](https://thepromptshelf.dev/blog/cursorrules-vs-mdc-format-guide-2026/)
- 2026-Q1 — [Cursor Rules MDC Best Practices (Morph)](https://www.morphllm.com/cursor-rules-best-practices)
- 2026-Q1 — [Windsurf AGENTS.md official docs](https://docs.windsurf.com/windsurf/cascade/agents-md)
- 2026-Q1 — [Cline Rules overview](https://docs.cline.bot/features/cline-rules/overview)
- 2026-Q1 — [AGENTS.md v1.1 Proposal (Issue #135)](https://github.com/agentsmd/agents.md/issues/135)
- 2026-05-06 — [Simon Willison Live-Blog: Code with Claude 2026](https://simonwillison.net/2026/May/6/code-w-claude-2026/)
- 2026-05-06 — [Blake Crosley: Code with Claude SF 2026 Recap](https://blakecrosley.com/blog/code-with-claude-sf-2026-recap)
- 2026-05-13 — [Anthropic beats OpenAI on workplace adoption (Axios)](https://www.axios.com/2026/05/13/anthropic-openai-workplace-ai-adoption)
- Reference — [AGENTS.md spec landing page](https://agents.md/)
- Reference — [agentsmd/agents.md GitHub repo (21.4k stars)](https://github.com/agentsmd/agents.md)
- Reference — [anthropics/skills GitHub repo](https://github.com/anthropics/skills)
- Reference — [ESLint Config Migration Guide (Half-Life-Comparable)](https://eslint.org/docs/latest/use/configure/migration-guide)
- Reference — [Anthropic Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- Reference — [Claude Code Sub-Agents Docs](https://code.claude.com/docs/en/sub-agents)
- Reference — [Anatomy of .claude Folder (codewithmukesh)](https://codewithmukesh.com/blog/anatomy-of-the-claude-folder/)

---

*Track B2 — ContextForge PRD Research-Pass. Wordcount: ~4.100. Author: Claude (Sonnet 4.7-Class). Deadline-Match: ASAP, parallel zu 7 anderen Agents.*
