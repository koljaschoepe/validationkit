# Skill-Quality-Heuristics — Auto-Reviewer fur Claude-Code Skills / Commands / Agents

> **Recherche-Zeitpunkt:** 2026-05-14
> **Kontext:** ValidationKit-Pivot zu Mid-Market-Skill-Ops (vgl. analysis-v3/01-direct-competitors-skill-ops.md). Diese Heuristiken sind das Herzstuck eines automatischen AI-Reviewers, der Skills/Commands/Agents in einem Org-Repo wie ein Linter pruft — bevor sie in den geteilten Pool committed werden. Das ist der Layer, den weder Anthropic native noch Cursor Team-Marketplace heute anbieten: ein vendor-neutraler, automatisierter Quality-Gate.
> **Methodik:** Zusammenfuhrung aus (a) Anthropic-Doku Mai 2026 (best-practices, sub-agents, slash-commands/skills), (b) anthropics/skills repo & skill-creator SKILL.md, (c) Open-Source-Eval-Frameworks (promptfoo, LangSmith, OpenAI Evals), (d) LLM-Observability-Vendoren (Helicone, Galileo), (e) akademische Literatur 2024-2026 zu LLM-as-Judge Bias und Prompt-Quality-Metriken, (f) Community-Repos (awesome-claude-skills, obra/superpowers).
> **Citation-Style:** `[Source-Name, Datum](url)` inline, wie in den vorherigen analysis-Files.

---

## TL;DR — die Ein-Minuten-Version

15 Heuristiken in 6 Kategorien. Davon sind **9 nicht-trivial** und drei davon sind **echter Wettbewerbsvorteil vs Anthropics built-in Skill-Creator-Tool**, weil Anthropic sie entweder gar nicht oder nur als generische Empfehlung adressiert:

1. **Trigger-Ambiguity-Score** (H4) — quantifiziert "wann triggert dieser Skill?" via LLM-as-Judge gegen ein Eval-Set aus Positives + Hard-Negatives. Anthropic empfiehlt "Eval-driven development" [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) aber bietet **keine Tools dafur**: "There is not currently a built-in way to run these evaluations. Users can create their own evaluation system."
2. **Cross-Skill-Konflikt-Detection** (H13) — Embedding-Cluster + LLM-as-Judge auf alle Description-Paare im Repo. Anthropic warnt vor "potentially 100+ available Skills" ohne dass deren Konflikt-Risiko irgendwo gemessen wird.
3. **Outdated-Reference-Detection** (H14) — Skills, die auf deprecated APIs/SDKs/Model-IDs verweisen (z.B. `gpt-3.5-turbo`, `anthropic.completions.create`, `unstable_cache`, `claude-3-opus-20240229`). Anthropic erwahnt explizit, dass Skills "time-sensitive information" vermeiden sollen [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), aber misst es nicht.

Die restlichen 6 sind Hygiene (YAML korrekt, kebab-case, third-person etc.) — Foundation-Layer, aber alleine kein Defensibility-Moat.

---

## Methodik des Auto-Reviewers (kurz)

Pro Skill/Command/Agent-File parsen wir:
1. **YAML-Frontmatter** → Schema-Validation gegen das offizielle SKILL.md / sub-agent Schema [Anthropic Skill Engineering, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).
2. **Markdown-Body** → Token-Count, Line-Count, Regex-Pass fur Anti-Patterns.
3. **Embedding** (description + body) → Vektor in pgvector (PRD §16.4) fur Konflikt-Detection.
4. **LLM-as-Judge** (Haiku 4.5 oder Sonnet 4.6 via AI Gateway) → quality-rubric-grading pro Heuristik.

Jede Heuristik liefert `{severity: critical|warning|info, score: 0-1, evidence: string, fix_suggestion: string}`. Aggregat-Score ist ein **Severity-Band** ({Kill, Weak, Mid, Strong, Exceptional}) — keine Fake-Precision wie "87/100", konsistent mit unserem Constraint #5 im CLAUDE.md.

LLM-as-Judge wird gegen die bekannten Bias-Modi gehardened: **position bias, self-preference bias, length bias** sind dokumentiert [Judging the Judges, 2024](https://arxiv.org/abs/2406.07791), [Self-Preference Bias in LLM-as-a-Judge, 2024](https://arxiv.org/abs/2410.21819). Mitigationen: (a) Paired-Comparison nur mit randomisierter Reihenfolge, (b) Cross-Family-Judges (Sonnet als Judge fur Gemini-generated, Gemini als Judge fur Sonnet-generated), (c) Length-Normalisierung im Rubric-Prompt.

---

## Kategorien-Map

| # | Kategorie | Heuristiken | Mess-Methode dominant |
|---|---|---|---|
| A | Format-Validity | H1, H2 | Schema-Validation + Regex |
| B | Description-Quality | H3, H4 | LLM-as-Judge + Embedding-Distance |
| C | Length & Structure | H5, H6, H7 | Token-Count + Regex |
| D | Triggering-Conventions | H8, H9 | LLM-Eval + Frontmatter-Inspection |
| E | Tool-Restrictions & Security | H10, H11, H12 | Static-Analysis + Regex + Secret-Scanner |
| F | Cross-Skill & Hygiene | H13, H14, H15 | Embedding-Cluster + Versioned-Knowledge-Base |

---

# Die 15 Heuristiken

## A. Format-Validity

### H1 — YAML-Frontmatter Schema-Konformitat

**Definition.** Das YAML-Frontmatter muss die offiziellen Required-Fields enthalten und die Constraints einhalten:
- Fur Skills: `name` (max 64 Zeichen, lowercase + hyphens + numbers only, keine reserved words `anthropic`/`claude`, keine XML-Tags), `description` (max 1024 Zeichen, non-empty, keine XML-Tags) [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).
- Fur Claude-Code-Sub-Agents: `name` (lowercase + hyphens, unique), `description` (required) [Claude Code Sub-Agents, 2026-05](https://code.claude.com/docs/en/sub-agents). Optional: `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`, `initialPrompt`.
- Fur Claude-Code-Skills (merged commands): `description` recommended, `name`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell` [Claude Code Skills, 2026-05](https://code.claude.com/docs/en/skills).

**Mess-Methode.** Schema-Validation via JSON-Schema / Zod gegen die drei Schemas (Skill API, Sub-Agent, Claude-Code-Skill). Regex fur reserved-word-Detection und XML-Tag-Detection.

**Severity.** **Critical** — der Skill wurde von Claude beim Startup gar nicht geladen oder das Tooling failed. Cursor und GitHub Copilot machen das auch nicht (sie validieren ihre eigenen Format-Varianten), also ist das kein USP — aber wir mussen die Foundation haben.

**Bad.**
```yaml
---
name: My Awesome Skill   # Spaces + uppercase = invalid
description: I can help you with PDFs   # First-person = discovery-problem (H3)
---
```

**Good.**
```yaml
---
name: pdf-extraction
description: Extracts text and tables from PDF files, fills forms, merges documents. Use when working with PDFs, forms, or document extraction.
---
```

---

### H2 — Frontmatter-Field-Type-Korrektheit

**Definition.** Wenn optionale Felder gesetzt sind, mussen sie typkorrekt sein:
- `tools` / `allowed-tools` ist ein Array oder Space-separated String aus bekannten Tool-Namen (`Read`, `Edit`, `Bash`, `Grep`, etc.) oder MCP-Tool-Namen im Format `ServerName:tool_name` [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).
- `model` ∈ {sonnet, opus, haiku, inherit, full model ID like `claude-opus-4-7`} [Claude Code Sub-Agents, 2026-05](https://code.claude.com/docs/en/sub-agents).
- `permissionMode` ∈ {default, acceptEdits, auto, dontAsk, bypassPermissions, plan}.
- `effort` ∈ {low, medium, high, xhigh, max}.
- `color` ∈ {red, blue, green, yellow, purple, orange, pink, cyan}.
- `paths` muss valides Glob sein.

**Mess-Methode.** JSON-Schema mit `enum`-Constraints + Glob-Parser fur `paths`.

**Severity.** **Critical** — Tool-Restrictions die nicht greifen sind ein Security-Hole.

**Bad.**
```yaml
tools: [Read, Edit, BashAll]   # "BashAll" exists not — typo
model: claude-3.5-sonnet       # Deprecated alias since 2026-02
permissionMode: yolo            # Not a valid mode
```

**Good.**
```yaml
tools: [Read, Grep, Glob, Bash(git diff *)]
model: sonnet
permissionMode: plan
```

---

## B. Description-Quality

### H3 — Description-Specificity-Score

**Definition.** Die `description` ist das **einzige Signal**, das Claude beim Skill-Selection-Time hat: "At startup, only the metadata (name and description) from all Skills is pre-loaded" [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). Vague Descriptions fuhren zu Mis-Routing. Die Heuristik testet:

1. **Third-person voice** (kein "I", "you", "we"). Anthropic explicit: "Always write in third person. The description is injected into the system prompt, and inconsistent point-of-view can cause discovery problems" [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).
2. **Capability + Trigger-Context** beide enthalten ("what + when").
3. **Specificity:** keine Reserved-Vague-Words ohne Qualifier (`helps`, `does stuff`, `processes data`, `utilities`, `helper`).
4. **Pushy genug:** Die offizielle skill-creator-SKILL.md von Anthropic empfiehlt explizit: "make the skill descriptions a little bit 'pushy'... 'How to build a simple fast dashboard to display internal Anthropic data. Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a "dashboard."'" [anthropics/skills skill-creator SKILL.md, 2026](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md).

**Mess-Methode.** Hybrid:
- Regex fur First-Person-Pronouns und Vague-Word-Detection (`/\b(I|you|we|helps|does stuff|utilities|helper|tools)\b/i`).
- LLM-as-Judge mit Rubric: "Score 1-5 fur Specificity, basierend auf: (a) third-person? (b) sagt es WAS UND WANN? (c) enthalt spezifische Trigger-Keywords? (d) wurde Claude bei 'I want to extract data from a spreadsheet' dieses Skill triggern?"

**Severity.** **Warning** (Critical wenn Score < 2/5).

**Bad.**
```yaml
description: I can help you with documents
```
```yaml
description: A utility for various tasks
```

**Good.**
```yaml
description: Extracts text and tables from PDF files, fills forms, merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

---

### H4 — Trigger-Ambiguity-Score [USP vs Anthropic]

**Definition.** Das vielleicht wichtigste Signal uberhaupt: aktiviert der Skill bei den **richtigen** Prompts und **nicht** bei den falschen? Anthropic empfiehlt "Build evaluations first" und gibt ein JSON-Format vor — aber explizit ohne Built-in-Runner: "There is not currently a built-in way to run these evaluations. Users can create their own evaluation system" [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). Genau hier setzen wir an.

Die offizielle skill-creator SKILL.md gibt sogar Anti-Pattern-Beispiele:
> "The key thing to avoid: don't make should-not-trigger queries obviously irrelevant... The negative cases should be genuinely tricky." [anthropics/skills, 2026](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)

Beispiele fur tricky positive Test-Queries: "ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage..." [anthropics/skills, 2026]. **Konkret und narrativ, nicht abstrakt.**

**Mess-Methode.**
1. Auto-Generation eines Eval-Sets: Sonnet generiert pro Skill 10 positive Queries + 10 hard-negative Queries (semantisch nahe Themen, aber wo das Skill nicht triggern soll).
2. Pro Query: alle Skill-Descriptions des Repos werden Claude ubergeben (system-prompt-style), und gemessen wird ob das Target-Skill gewahlt wird.
3. Score = `(TP_rate + TN_rate) / 2`. Threshold-Score < 0.7 = Warning, < 0.5 = Critical.

Das ist deutlich rigoroser als LangSmith's "LLM-as-judge correctness" [LangSmith Evaluation Docs, 2025](https://docs.langchain.com/langsmith/evaluation) oder promptfoo's `llm-rubric` [promptfoo Assertions, 2025](https://www.promptfoo.dev/docs/configuration/expected-outputs/), weil es **multi-skill-routing** evaluiert, nicht single-prompt-quality.

**Severity.** **Warning → Critical** (je nach Threshold).

**Bad.** Skill `data-helper` mit description "Helps with data" → bei Query "Analyze the customer churn in this CSV" wird `data-helper` neben `customer-churn-analyzer` und `csv-processor` getriggert. Ambiguity-Score ~0.3.

**Good.** Skill `csv-churn-analysis` mit description "Analyzes customer churn metrics from CSV exports. Use when the user has a CSV file containing customer subscription or retention data and wants churn rate, cohort retention, or lifetime value calculated." → Score ~0.92.

**USP-Argument.** Anthropic kann das aus Konflikt-Grunden nicht losen: sie konnten zwar einen Eval-Runner bauen, aber sie wollen nicht in die Position kommen, dass sie selbst Skills "ranking" — das wurde 4 200+ Skills auf SkillsMP politisch unangenehm machen. Vendor-Neutral ist die einzig defensible Position.

---

## C. Length & Structure

### H5 — Body-Length-Bounds

**Definition.** Anthropic sagt explizit: "Keep SKILL.md body under 500 lines for optimal performance. Split content into separate files when approaching this limit" [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). Token-Konsumption ist die operative Constraint: "Once Claude loads it, every token competes with conversation history and other context."

Unsere Grenzwerte:
- **<50 Lines:** Info (zu wenig — Skill konnte hardgecodet als CLAUDE.md sein).
- **50-500 Lines:** OK.
- **500-1000 Lines:** Warning — refactor in progressive-disclosure-pattern.
- **>1000 Lines:** Critical — kosten-bewusst hier.

**Mess-Methode.** Line-Count + Token-Count (tiktoken / claude-tokenizer).

**Severity.** Warning bzw Critical.

**Bad.** Ein 1 800-Line SKILL.md mit allen API-Docs inline. Frisst pro Skill-Invocation 25k+ Tokens.

**Good.** SKILL.md (180 lines) + `reference/api.md` (loaded as needed) + `examples/typical-flows.md`.

---

### H6 — Progressive-Disclosure-Compliance

**Definition.** Aus Anthropics Doku: "Keep references one level deep from SKILL.md. All reference files should link directly from SKILL.md to ensure Claude reads complete files when needed" [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). Deeply-nested references brechen Progressive Disclosure: "Claude may partially read files when they're referenced from other referenced files... using commands like `head -100` to preview content rather than reading entire files, resulting in incomplete information."

**Mess-Methode.** Markdown-Link-Parser baut den Reference-DAG aus SKILL.md heraus. Pro Reference: ist sie 1-hop oder n-hop? Wenn n > 1 = Violation.

Zusatzlich: fur Files >100 Lines, prufen ob Table-of-Contents im File ist ("For reference files longer than 100 lines, include a table of contents at the top" [Anthropic Best Practices, 2026-05]).

**Severity.** **Warning.**

**Bad.**
```
SKILL.md → advanced.md → details.md → actual_info.md
```

**Good.**
```
SKILL.md → advanced.md
SKILL.md → reference.md
SKILL.md → examples.md
```

---

### H7 — Description-Length-Budget

**Definition.** Claude Code truncated combined `description` + `when_to_use` text bei 1 536 Zeichen im Skill-Listing [Claude Code Skills Frontmatter, 2026-05](https://code.claude.com/docs/en/skills). Skill API caps `description` bei 1 024. Wer >900 Zeichen schreibt ist nicht zwingend schlecht, aber gefahrdet Truncation.

Anthropics eigene Troubleshooting-Doku: "All skill names are always included, but if you have many skills, descriptions are shortened to fit the character budget, which can strip the keywords Claude needs to match your request" [Claude Code Skills, 2026-05](https://code.claude.com/docs/en/skills). Das heisst: lange Descriptions konkurrieren bei vielen Skills und werden gedroppt.

**Mess-Methode.** `description.length + when_to_use.length`. Bands:
- <50 chars: Info — zu kurz, wahrscheinlich unspezifisch.
- 50-400 chars: OK (Sweet-Spot).
- 400-1024 chars: Warning — pruf ob key-use-case zuerst steht.
- >1024 chars: Critical (Skill-API rejects).

**Severity.** **Warning** (Critical bei >1024).

**Bad.** Description mit 850 Zeichen, wo der Haupt-Use-Case erst am Ende erwahnt wird → bei vielen-Skills-Repos wird er gedroppt.

**Good.** Description mit 180 Zeichen, key-use-case in den ersten 100 Zeichen.

---

## D. Triggering-Conventions

### H8 — Naming-Convention-Compliance

**Definition.** Anthropic empfiehlt gerund form ("verb + -ing"):
- Good: `processing-pdfs`, `analyzing-spreadsheets`, `managing-databases`
- Acceptable: `pdf-processing`, `process-pdfs`
- Avoid: `helper`, `utils`, `tools`, `documents`, `data` (zu generisch), reserved words `anthropic-*`, `claude-*` [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

Format: lowercase + hyphens + numbers, max 64 chars.

**Mess-Methode.** Regex `^[a-z0-9-]{3,64}$` + Blacklist gegen vague-words und reserved-words. LLM-Eval optional fur "ist der Name semantisch der Tatigkeit entsprechend?"

**Severity.** **Warning** (Critical wenn reserved word).

**Bad.** `helper`, `myThing`, `Anthropic-Helper`, `UTIL_FUNCTIONS`.

**Good.** `extracting-pdfs`, `validating-yaml`, `commit-message-generator`.

---

### H9 — When-NOT-To-Use Exclusion-Clause-Presence

**Definition.** Aus dem Generative-Programmer-Review der Anthropic-Best-Practices: "Explicit exclusions are critical. One practitioner noted this represents 'the single most important line in the description, above the positive trigger.' Example: 'Do NOT use for blog articles, newsletters, emails, tweets, or long-form content'" [Skill Authoring Patterns from Anthropic's Best Practices, 2026](https://generativeprogrammer.com/p/skill-authoring-patterns-from-anthropics).

Die Heuristik schaut, ob Description ODER Body eine Exclusion-Clause hat ("Do NOT use for…", "Not for…", "Avoid using when…").

**Mess-Methode.** Regex + LLM-Judge fur semantische Exclusion-Variants. **Nur Info, nicht Critical** — viele kleine Skills brauchen das nicht. Aber bei Skills mit overlap-prone Domain (mehrere `*-writing-*`, mehrere `*-analysis-*`) wird es zu Warning.

**Severity.** **Info → Warning** (kontextabhangig: wird Warning wenn andere Skills im Repo semantisch nah sind, gemessen via Embedding-Distance < 0.15).

**Bad.** Skill `writing-blog-posts` mit description "Writes blog posts" — kollidiert mit `writing-newsletters`, `writing-tweets`.

**Good.** "Writes long-form blog articles (1000+ words) with SEO structure. Do NOT use for newsletters, tweets, emails, or short-form content (<500 words)."

---

## E. Tool-Restrictions & Security

### H10 — Tool-Restriction-Hygiene (Least-Privilege)

**Definition.** Sub-Agents inherit alle Tools wenn `tools` nicht gesetzt ist [Claude Code Sub-Agents, 2026-05](https://code.claude.com/docs/en/sub-agents): "By default, subagents inherit all tools from the main conversation, including MCP tools." Anthropics eigene Best-Practice: "Limit tool access: grant only necessary permissions for security and focus."

Read-only Skills/Sub-Agents (Reviewer, Researcher, Explorer) sollten **niemals** `Edit`, `Write`, `Bash` (ohne narrow allow-list) haben.

**Mess-Methode.**
1. Heuristik auf das `description` Field: enthalt es "review", "explore", "analyze", "research", "audit"? Dann Read-only-Class-Erwartung.
2. Wenn Class=Read-only und `tools` enthalt `Edit | Write | Bash` (ohne narrow Bash-Pattern wie `Bash(git diff *)`) → Violation.
3. Wenn `tools` ist absent (= inherit alle) und `description` legt Sicherheits-Sensitivity nahe → Violation.

**Severity.** **Critical** (Security-Klasse).

**Bad.**
```yaml
---
name: code-reviewer
description: Reviews code for quality and security
# tools nicht gesetzt → inherit alle, inkl. Edit + Write
---
```

**Good.**
```yaml
---
name: code-reviewer
description: Reviews code for quality and security
tools: [Read, Grep, Glob, Bash(git diff *), Bash(git status *)]
---
```

---

### H11 — Hardcoded-Secret-Detection

**Definition.** Skills/Commands die Tokens, API-Keys, Passwords inline enthalten sind ein Compliance-Risk. GitHub's eigene Secret-Scanning-Program detektierte >1B exposed secrets im Jahr 2023 [Hardcoded Secrets and API Keys in Code, 2025](https://aquilax.ai/blog/hardcoded-secrets-api-keys-risk). Und: "Most popular LLMs recommend hardcoding API keys and passwords, and this behavior extends to tools like VS Code, ChatGPT, and other widely-used AI coding assistants" [LLMs are Teaching Developers to Hardcode API Keys, 2025](https://trufflesecurity.com/blog/llms-are-teaching-developers-to-hardcode-api-keys). LLM-generated Skills sind damit ein **vergrosserter** Risiko-Vektor — genau unser Markt.

**Mess-Methode.** Regex-Patterns (Trufflehog-style):
- `sk-[A-Za-z0-9]{20,}` (OpenAI)
- `sk-ant-[A-Za-z0-9-_]{50,}` (Anthropic)
- `ghp_[A-Za-z0-9]{36}` (GitHub PAT)
- `xox[bp]-[A-Za-z0-9-]+` (Slack)
- AWS Access Keys: `AKIA[0-9A-Z]{16}`
- Generic high-entropy strings >32 chars.
- URLs mit eingebetteten credentials: `https://[^:]+:[^@]+@`.

Plus: file-system-paths die persistent secrets implizieren (`~/.aws/credentials`, `~/.ssh/id_rsa`).

**Severity.** **Critical, Immediate-Block.** Skills durfen nicht ins shared-repo committed werden wenn sie diesen Check failen.

**Bad.**
```markdown
Use the API with: curl -H "Authorization: Bearer sk-ant-api03-XYZ..."
```

**Good.**
```markdown
Use the API with: curl -H "Authorization: Bearer $ANTHROPIC_API_KEY"
```

---

### H12 — Hardcoded-Path & Windows-Path Detection

**Definition.** Two-in-one Anti-Patterns:
1. Windows-Style-Paths (`scripts\helper.py`) brechen Cross-Platform. Anthropic explizit: "Always use forward slashes in file paths, even on Windows" [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).
2. Hard-coded absolute Paths (`/Users/john/projects/...`, `/home/alice/...`, `C:\Users\bob\...`) sind nicht portabel. Sollte `${CLAUDE_SKILL_DIR}` oder relative Paths sein [Claude Code Skills, 2026-05](https://code.claude.com/docs/en/skills).

**Mess-Methode.** Regex `[A-Za-z]:\\` (Windows drive letter), `\\\\` (UNC paths), `\b\\\b` in non-code contexts, `/Users/[^/$]+/` (Mac absolute), `/home/[^/$]+/` (Linux absolute).

**Severity.** **Warning.**

**Bad.**
```bash
python C:\Users\kolja\projects\validation\scripts\run.py
```

**Good.**
```bash
python ${CLAUDE_SKILL_DIR}/scripts/run.py
```

---

## F. Cross-Skill & Hygiene

### H13 — Cross-Skill-Conflict-Detection [USP vs Anthropic]

**Definition.** In einem Repo mit 30, 50, 200 Skills kollidieren Descriptions semantisch unweigerlich. Anthropic warnt vor "100+ available Skills" Routing-Risiken, misst aber nicht. Wir messen.

**Mess-Methode.**
1. **Embedding-Cluster:** Description (+ when_to_use) jedes Skills → Embedding (OpenAI text-embedding-3-large, oder Cohere). Paarweise cosine similarity. Pairs mit >0.85 = High-Risk-Overlap.
2. **LLM-Judge auf High-Risk-Pairs:** "Given these two Skill descriptions, identify (a) overlap, (b) clear differentiation, (c) which one would Claude pick for query X. Suggest exclusion-clause."
3. **Cluster-View:** in der Web-App kann Org-Admin sehen "diese 4 Skills sind im selben Cluster, sollten wir mergen oder klarer abgrenzen?"

**Severity.** **Warning → Critical** (Critical wenn 3+ Skills im selben High-Risk-Cluster).

**Bad.** `data-analyzer`, `csv-processor`, `spreadsheet-helper`, `excel-tools` — alle vier ohne Exclusion-Clauses, Embedding-Distanz < 0.1.

**Good.** `csv-churn-analysis`, `csv-cohort-analysis`, `excel-pivot-generation` — klar abgegrenzt durch spezifische use-case-keywords.

**USP-Argument.** Skill-Op-Konkurrenten (Cursor Team-Marketplace, Continue Hub) machen das nicht — sie haben keine semantische Conflict-Detection. Anthropic kanns nicht machen, weil das ihren eigenen 4 200+ Skill-Marketplace ankratzen wurde. Whitespace.

---

### H14 — Outdated-Reference-Detection [USP vs Anthropic]

**Definition.** Skills die auf deprecated APIs/SDKs/Models verweisen sind schlimmer als gar keine Skills — sie fuhren Claude zu falscher Information. Anthropic empfiehlt explizit "Don't include information that will become outdated" und gibt ein "old patterns"-Section-Pattern vor [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), aber misst es nicht.

Wir pflegen eine **versionierte Knowledge-Base** mit:
- Deprecated Model-IDs: `claude-3-opus-20240229`, `claude-3.5-sonnet`, `gpt-3.5-turbo`, `gpt-4-0314`, `text-davinci-*` etc.
- Deprecated SDK-Calls: `anthropic.completions.create` (use messages), `openai.Completion.create` (use chat), `unstable_cache` (use cacheLife/cacheTag), React `componentWillMount`, Next.js `getInitialProps` etc.
- Deprecated CLI-flags, env-vars, npm-packages (Lodash for ES6 features that exist natively, request-package etc.).
- Date-based phrases: "before August 2025…", "as of Q1 2024…", "currently in beta…".

Knowledge-Base updated wochentlich via deprecation-feeds (OpenAI deprecations page, Anthropic changelog, Next.js docs, etc.).

**Mess-Methode.** Regex + Substring-Match gegen Knowledge-Base. Plus LLM-Judge "Identifiziert dieses Skill Code-Pattern als best-practice die seit >6 Monate deprecated sind?" (das ist Backup-Layer).

**Severity.** **Warning** (Critical wenn deprecated Model-ID hardgecodet ist).

**Bad.**
```markdown
For complex reasoning, use the model claude-3-opus-20240229 with temperature 0.7.
```
```python
response = anthropic.completions.create(prompt="...", model="claude-2")
```

**Good.**
```markdown
For complex reasoning, use model alias `opus` (resolves to latest Opus). Inherit if possible.
```

**USP-Argument.** Anthropic kann das nicht losen: sie konnten ihre eigenen deprecations tracken, aber nicht OpenAI / Google / npm / Next.js / etc. Vendor-neutrales Repo macht Sinn — das ist der gleiche Hebel wie Renovate / Dependabot fur deps, nur fur Skills.

---

### H15 — Time-Sensitive-Phrasing Detection

**Definition.** "Don't include information that will become outdated" [Anthropic Best Practices, 2026-05](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). Diese Heuristik fangt es:
- Datum-Phrases: "as of 2025", "before August 2026", "currently", "soon", "the latest version"
- Version-Pinning ohne Range: "use lodash 4.17.21" (statt "^4.17")
- "Recently announced", "new feature", "upcoming"

**Mess-Methode.** Regex-Bibliothek von ~30 Time-Patterns + LLM-Judge auf flagged Sentences.

**Severity.** **Info** (Warning wenn 3+ Instances).

**Bad.** "Use the new Claude Opus model that was released last month — it's much better for reasoning."

**Good.** "For complex reasoning tasks, use the `opus` model alias." (no date, no qualifier).

---

# Aggregat-Tabelle

| # | Heuristik | Kategorie | Mess-Methode | Severity | USP vs Anthropic? |
|---|---|---|---|---|---|
| H1 | YAML-Schema-Konformitat | Format | JSON-Schema + Regex | Critical | Nein (Foundation) |
| H2 | Frontmatter-Field-Types | Format | Enum-Validation + Glob-Parser | Critical | Nein (Foundation) |
| H3 | Description-Specificity | Description-Q | Regex + LLM-Judge | Warning/Critical | Teilweise — wir gehen tiefer mit Pushy-Detection |
| **H4** | **Trigger-Ambiguity-Score** | Description-Q | **LLM-Eval auf Multi-Skill-Routing** | Warning/Critical | **JA — Anthropic empfiehlt Evals, liefert keinen Runner** |
| H5 | Body-Length-Bounds | Length | Token-Count + Line-Count | Warning | Nein (Foundation) |
| H6 | Progressive-Disclosure | Length | Markdown-DAG-Parser | Warning | Nein |
| H7 | Description-Length-Budget | Length | char-count | Warning | Nein |
| H8 | Naming-Convention | Triggering | Regex + Blacklist | Warning | Nein |
| H9 | When-NOT-To-Use Clause | Triggering | Regex + LLM | Info/Warning | Teilweise — Anthropic empfiehlt, misst nicht |
| H10 | Tool-Restriction-Hygiene | Security | Class-Inference + Tool-Match | Critical | Teilweise — wir korrelieren Class+Tools, Anthropic nicht |
| H11 | Hardcoded-Secret-Detection | Security | Regex (Trufflehog-style) | Critical | Nein (Standard-Security-Linter), aber Org-Compliance-Value |
| H12 | Hardcoded-Path & Windows | Security | Regex | Warning | Nein |
| **H13** | **Cross-Skill-Conflict-Detection** | Cross-Skill | **Embedding-Cluster + LLM** | Warning/Critical | **JA — Anthropic kanns/willns nicht** |
| **H14** | **Outdated-Reference-Detection** | Cross-Skill | **Versionierte KB + Regex** | Warning/Critical | **JA — Anthropic hat dafur kein Tool, vendor-neutrales Repo ist Voraussetzung** |
| H15 | Time-Sensitive-Phrasing | Hygiene | Regex + LLM | Info | Teilweise — Anthropic empfiehlt, misst nicht |

---

# Wettbewerbsvorteils-Analyse

**Foundation-Layer (H1, H2, H5-H8, H11, H12, H15):** Diese 9 Heuristiken muss man haben. Sie sind Standard-Linter-Hygiene, und 30-40 % der real existierenden Skills in awesome-claude-skills/awesome-claude-code-repos verletzen mindestens 2-3 davon (anecdotal aus Issue-Threads — siehe [awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills), nicht peer-reviewed, aber Signal-Quelle). Anthropic Skill-Creator wird einige davon eines Tages eingebaut haben, andere (wie Schema-Validation) sind schon implizit drin. Diese Schicht ist **Tisch-Einsatz, nicht Moat**.

**Differentiation-Layer (H3 partial, H4, H9 partial, H10 partial, H13, H14):** Hier ist der eigentliche Wert.

- **H4 (Trigger-Ambiguity-Score)** — Anthropic propagiert "Eval-driven development" aber gibt explizit zu, dass es **keinen Runner** dafur gibt. Open-source Eval-Frameworks (promptfoo [Promptfoo Assertions, 2025](https://www.promptfoo.dev/docs/configuration/expected-outputs/), LangSmith [LangSmith Evaluation, 2025](https://docs.langchain.com/langsmith/evaluation), Galileo [Galileo Agentic Evaluations, 2025](https://galileo.ai/)) bieten LLM-as-Judge generisch, aber keiner versteht das spezifische Skill-Routing-Problem. Galileo geht am nahesten dran mit "LLM Planner (to assess tool selection quality)" [Galileo Agentic Evaluations Launch, 2025](https://www.prnewswire.com/news-releases/galileo-launches-agentic-evaluations-to-empower-developers-to-build-reliable-ai-agents-302358451.html), aber ist Enterprise-priced und nicht Claude-Code-spezifisch.

- **H13 (Cross-Skill-Conflict-Detection)** — Das ist ein klassisches "Anthropic-cant-do-it"-Feature. Wenn Anthropic in ihrem eigenen Marketplace Cross-Conflict-Scoring macht, mussten sie ihre eigenen 4 200+ Skills ranking-en — politisch nicht machbar. Cursor und GitHub Copilot haben das selbe Problem.

- **H14 (Outdated-Reference-Detection)** — Vendor-neutral ist hier Pflicht: wir mussen OpenAI-deprecations, Anthropic-deprecations, npm-deprecations, Next.js-deprecations zusammenfuhren. Anthropic kann das nicht (Konflikt of interest mit OpenAI/Google). Cursor/GitHub Copilot konnten es theoretisch, machen es nicht (kein Fokus).

**Bias-Hardening als zweiter Differentiator:** Die akademische Literatur ist eindeutig — naive LLM-as-Judge leidet an position bias [Judging the Judges, 2024](https://arxiv.org/abs/2406.07791), self-preference bias [Self-Preference Bias, 2024](https://arxiv.org/abs/2410.21819), und length bias [Justice or Prejudice? Quantifying Biases in LLM-as-a-Judge](https://llm-judge-bias.github.io/). Promptfoo, LangSmith, Helicone documentieren das, aber liefern keine Out-of-the-box-Mitigation. Unser Reviewer kann das default-on einbauen (Cross-Family-Judges, Randomized-Pair-Order, Length-Normalisierung) — das ist akademisch state-of-the-art und im Mid-Market noch nicht commodity.

---

# Implementations-Reihenfolge (fur PRD-Hookin)

1. **MVP (Phase 1):** H1, H2, H5, H7, H8, H11, H12 — alles Regex+Schema, billig zu bauen, sofort wertvoll. Ein Github-Action / pre-commit-Hook der das in <2s pruft. Erstes Touchpoint mit Mid-Market-Engineering-Org.
2. **Differentiation (Phase 1.5):** H3, H10, H15 — kombinierter Regex+LLM-Layer. Pro Skill kostet das ~$0.001 mit Haiku 4.5 — bei 200 Skills pro Org ~$0.20/Run, das ist trivial.
3. **Moat (Phase 2):** H4, H13, H14 — die kosten mehr Compute (multi-call LLM-routing-eval, Embeddings, Knowledge-Base-pflege), aber sie sind exact die Heuristiken, die niemand anderes hat. Sind die "Lock-in"-Features fur Org-Customers.
4. **Hardening (Phase 2.5):** Bias-Mitigation (Cross-Family, Randomized-Order, Length-Norm) per default eingebaut. Sells als "Akademisch-grounded, nicht Vibe-Score" — passt zum Citation-First-Brand-Voice.

---

# Quellen-Bibliothek (chronologisch + thematisch)

**Anthropic Primary-Docs (Mai 2026):**
- [Anthropic — Agent Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — Master-Doku, Mai 2026 Snapshot, Quelle fur H1, H3, H5-H9, H10, H12, H14, H15.
- [Claude Code — Sub-Agents](https://code.claude.com/docs/en/sub-agents) — Frontmatter-Schema fur Sub-Agents, Quelle fur H1, H2, H10.
- [Claude Code — Skills (merged commands)](https://code.claude.com/docs/en/skills) — Schema fur Claude-Code-Skills, Quelle fur H1, H2, H7.
- [anthropics/skills — skill-creator SKILL.md](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) — Pushy-Descriptions, Test-Case-Quality, Quelle fur H3, H4.

**Open-Source Eval-Frameworks:**
- [Promptfoo — Expected Outputs / Assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/) — llm-rubric, similar, classifier, g-eval.
- [LangSmith Evaluation Docs](https://docs.langchain.com/langsmith/evaluation) — Heuristic / LLM-Judge / Pairwise / Human.
- [LangChain — Reusable Evaluator Templates](https://www.langchain.com/blog/reusable-langsmith-evaluator-templates) — 30+ Templates, 2025.
- [OpenAI Evals — GitHub](https://github.com/openai/evals) — Eval-Format.

**LLM-Observability-Vendoren:**
- [Helicone — Prompt Evaluation Frameworks 2025](https://www.helicone.ai/blog/prompt-evaluation-frameworks) — Scoring & LLM-as-Judge Doc.
- [Galileo — Agentic Evaluations Launch, Jan 2025](https://www.prnewswire.com/news-releases/galileo-launches-agentic-evaluations-to-empower-developers-to-build-reliable-ai-agents-302358451.html) — LLM Planner / Tool Calls / Session Success Metrics.
- [Galileo — How LLM-as-Judge is Calculated](https://docs.galileo.ai/concepts/metrics/how-llm-as-judge-metrics-are-calculated) — Metric-Calculation-Methodology.

**Akademische Papers (2024-2025):**
- [Judging the Judges: A Systematic Study of Position Bias in LLM-as-a-Judge, arXiv 2024](https://arxiv.org/abs/2406.07791) — position bias quantifiziert.
- [Self-Preference Bias in LLM-as-a-Judge, arXiv 2024](https://arxiv.org/abs/2410.21819) — GPT-4 bevorzugt eigene Outputs, perplexity-correlation.
- [Justice or Prejudice? Quantifying Biases in LLM-as-a-Judge, llm-judge-bias.github.io 2024](https://llm-judge-bias.github.io/) — CALM-Framework fur 12 Bias-Typen.
- [Evaluation of Large Language Models: Review of Metrics, Applications, and Methodologies, Preprints.org 2025](https://www.preprints.org/manuscript/202504.0369/v1) — Review-Paper.

**Security & Hardcoded Secrets:**
- [LLMs are Teaching Developers to Hardcode API Keys, Truffle Security 2025](https://trufflesecurity.com/blog/llms-are-teaching-developers-to-hardcode-api-keys) — LLM-Anti-Pattern-Reproduktion.
- [Hardcoded Secrets and API Keys in Code, AquilaX 2025](https://aquilax.ai/blog/hardcoded-secrets-api-keys-risk) — 1B+ exposed secrets, GitHub Scanning.

**Community / Practitioner:**
- [Skill Authoring Patterns from Anthropic's Best Practices, Generative Programmer 2026](https://generativeprogrammer.com/p/skill-authoring-patterns-from-anthropics) — Practitioner-Review der best-practices, "exclusion clause is the most important line".
- [obra/superpowers — anthropic-best-practices.md](https://github.com/obra/superpowers/blob/main/skills/writing-skills/anthropic-best-practices.md) — Community-Erweiterung der Best-Practices.
- [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) — Skill-Repo zum messen wie real-existierende Skills die Heuristiken failen.

---

*Last updated: 2026-05-14. Maintain via `/iterate-prd` wenn die Heuristiken in PRD eingehen. Wenn neue Anthropic-Docs erscheinen (z.B. Skill-Eval-Runner als Built-in) → H4 muss neu evaluiert werden ob USP noch halt.*
