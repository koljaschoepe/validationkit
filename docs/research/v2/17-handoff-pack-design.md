# Handoff-Pack Feature Design — ValidationKit

**Designer:** Feature-Designer, ValidationKit
**Date:** 2026-05-14
**Status:** Draft v0.1 — Feature-Spec für Phase 1.5 (zwischen MVP-Launch und Web-Layer)
**Source-Request:** User am 2026-05-14: "Wenn die Idee validiert ist, soll man ein Kontext-Engineering aufbauen können, was man dann in Claude Code nutzen und downloaden kann."
**Mode:** BEIDES — Validation-Insights + Build-Kit kombiniert in einem zusammengehörigen Handoff-Pack.

---

## 1. Strategische Einordnung

ValidationKit endet heute mit dem `feedback-synthesizer` → einem `Validation-Report.md` mit Go/Pivot/Kill-Empfehlung. Im "Go"-Fall steht der Solopreneur dann vor einem leeren `mkdir my-product`-Cursor und übersetzt seinen Validation-Lernpfad manuell in Build-Kontext. Dieser Übersetzungs-Step ist verlustreich: Insights über Pain-Points, JTBDs, Persona-Sprache und Channel-Trust gehen verloren, sobald die nächste Claude-Code-Session ohne Erinnerung startet.

**Das Handoff-Pack-Feature schließt diesen Gap.** Es nimmt den vollen Validation-State (Personas, Pains, Channels, Demand-Signal, Pivot-Reasoning) und materialisiert ihn als runnable Claude-Code-Projekt mit kuratiertem `CLAUDE.md`, produkt-spezifischen Subagents, einer Product-PRD und Tech-Stack-Empfehlung — sodass der User in <60 Sekunden vom Validation-Report zum ersten `claude` -Befehl im neuen Repo kommt, mit dem vollen Kontext der Validation als persistentem Memory.

**Strategischer Hebel:** Das Handoff-Pack ist der **Retention-Loop** gegen das #1-Risiko aus dem PRD ("User installieren, nutzen einmal, kommen nicht zurück"). Es macht aus ValidationKit nicht nur ein Validation-Tool, sondern den **Eintritts-Punkt für jedes neue Solopreneur-Projekt** — und positioniert das Produkt direkt gegen `npx create-next-app`, `create-t3-app` und Lovable/v0.

---

## 2. Vollständige Output-Directory-Struktur

```
my-validated-idea/
├── .claude/
│   ├── CLAUDE.md                              # Master-Kontext für alle Sessions
│   ├── agents/                                # 4-6 produkt-spezifische Subagents
│   │   ├── customer-empathy-checker.md
│   │   ├── pain-anchored-feature-reviewer.md
│   │   ├── pricing-tester.md
│   │   ├── persona-voice-writer.md
│   │   ├── messaging-tester.md
│   │   └── activation-flow-designer.md
│   ├── commands/                              # Wiederkehrende Workflows
│   │   ├── feature-review.md
│   │   ├── pricing-check.md
│   │   ├── revalidate.md
│   │   ├── messaging-test.md
│   │   └── ship-update.md
│   ├── skills/                                # Reusable, vom Pack erbgenerierte Skills
│   │   ├── persona-language/
│   │   │   └── SKILL.md
│   │   └── pain-anchoring/
│   │       └── SKILL.md
│   └── settings.json                          # permissions, model defaults, hooks
│
├── context/                                   # READ-ONLY Validation-Artefakte
│   ├── README.md                              # Index + "How to use this folder"
│   ├── personas/
│   │   ├── 01-skeptiker-marketing-ops.md
│   │   ├── 02-early-adopter-indie-hacker.md
│   │   └── 03-mainstream-agency-owner.md
│   ├── pain-points.md                         # Ranked: severity × frequency × budget
│   ├── jtbd.md                                # Jobs-to-be-done statements
│   ├── channel-insights.md                    # Wo der Pain diskutiert wird (Reddit, HN, X, Communities)
│   ├── competitive-landscape.md               # Aus market-researcher
│   ├── demand-signals.md                      # Fake-door CTR, cold-email reply rates, ad-CTR
│   ├── persona-language.md                    # Wörtliche Phrasen, Hot-Buttons, verbotene Wörter
│   ├── workarounds.md                         # Was Personas heute hacken (Spreadsheets, Zapier, etc.)
│   └── validation-report.md                   # Der originale feedback-synthesizer-Output
│
├── spec/                                      # GENERATIVE Build-Artefakte
│   ├── product-prd.md                         # Produkt-PRD generiert aus Validation
│   ├── tech-stack-recommendation.md           # Empfohlener Stack mit Begründung pro Layer
│   ├── mvp-scope.md                           # 4-6-Wochen-Cut der PRD
│   ├── pricing-hypothesis.md                  # Initial-Pricing aus persona.budget-Daten
│   ├── activation-flow.md                     # Onboarding-Steps anchored auf Persona-JTBD
│   ├── non-goals.md                           # Explizit ausgeschlossene Features (anti-bloat)
│   └── success-metrics.md                     # Leading + lagging metrics, anchored an Demand-Signal
│
├── decisions/                                 # ADR-Style Decisions, append-only
│   └── 0001-stack-choice.md                   # Erste ADR pre-filled mit tech-stack-Begründung
│
├── .validationkit/
│   ├── handoff-manifest.json                  # Pointer zurück zum Validation-Project
│   ├── source-validation-id                   # UUID des ursprünglichen ValidationKit-Runs
│   └── revalidation-hooks.json                # Wie /revalidate neue Daten zurück-merged
│
├── .env.example                               # Stack-spezifische Env-Vars (kommentiert)
├── package.json                               # Wenn Stack = Node/Next (skipped wenn Python/Go)
├── .gitignore
├── .cursorrules                               # Mirror von CLAUDE.md für Cursor-User
└── README.md                                  # User-facing intro, "What's in this pack & how to use it"
```

**Design-Prinzipien dieser Struktur:**

1. **`context/` ist read-only, `spec/` ist generativ** — User soll spec/ frei editieren, context/ als immutable Validation-Snapshot behandeln.
2. **`.claude/` ist Standard-konform** — exakt der Convention aus `wshobson/agents`, `claudekit`, anthropics/skills (Mai 2026 spec). Keine ValidationKit-Lock-in.
3. **`decisions/` ist ADR-pattern** — Brückenschlag zu engineering-best-practices, signalisiert "this is a real project, not a demo."
4. **`.validationkit/`-Folder bleibt klein** — nur Manifest + Re-validation-Hooks. Kein State-Dump.
5. **`.cursorrules` als Bonus** — kostet nichts und gewinnt die Cursor-User-Hälfte des Marktes.

---

## 3. File-by-File-Spec

### 3.1 `.claude/CLAUDE.md` — der zentrale Kontext

Generiert vom neuen `handoff-pack-builder` Subagent aus dem aggregierten Validation-State. **Sections:**

1. **Project Header** — Idee in einem Satz, validation-date, status (Go-Empfehlung-Score).
2. **What This Product Is (And Isn't)** — generiert aus `validation-report.md` + `non-goals.md`. Explizite Anti-Goals.
3. **The Validated Pain** — Top-3-Pain-Points mit Severity-Score, anchored an Persona-Zitate. Beispiel:
   > "Marketing-Ops-Leads bei 20-200-Mitarbeiter-SaaS-Companies verbringen 4-8h/Woche damit, Attribution-Daten aus 5+ Tools manuell in Spreadsheets zusammenzufügen. Severity: 9/10. Frequency: weekly. Budget: $50-200/mo. Wörtliches Zitat: 'I literally have a Notion page just for screenshots from Mixpanel.'"
4. **Primary Persona** — full persona-card der höchst-rankenden Persona aus `personas/`.
5. **Secondary Personas** — kurze Summaries (Name, JTBD, why secondary).
6. **Persona Voice & Forbidden Words** — extracted aus persona-interviews. Welche Wörter resonieren ("workflow", "automation"), welche triggern Abwehr ("AI-powered", "revolutionize").
7. **Validated Channels** — wo gefundene Personas hängen. Wichtig für später Marketing/Distribution-Code.
8. **Demand-Signals (Hard Numbers)** — Fake-door CTR, cold-email reply rate, ad-CTR. Mit Quellen-Links zu landing-pages + reports.
9. **Competitive Position** — Top-5-Competitors mit ihrem schwächsten Pain-Coverage. Differentiator-Statement.
10. **Tech-Stack This Project Uses** — Verweist auf `spec/tech-stack-recommendation.md`. Plus inline-summary für Quick-Glance.
11. **How to Work In This Repo** — Conventions, wann welcher Subagent triggert, wann welcher Slash Command.
12. **Decision Log Pointer** — "Before making architectural changes, check `decisions/`. After making one, write a new ADR."
13. **Anti-Patterns Specific To This Product** — generiert aus `non-goals.md` + `pain-points.md`. Beispiel: "Do not add 'AI insights' as a feature - persona 1 explicitly rejected this in interview 3. Do not add a Slack integration before Linear is shipped - validated channel-ranking shows Linear comes first."
14. **Re-validation Reminder** — "If pivot-pressure emerges, run `/revalidate` to fold new evidence back into context/."

Diese Sections werden vom `handoff-pack-builder`-Subagent template-driven gefüllt — keine Halluzination, alle Inhalte kommen entweder direkt aus dem Validation-State (Pains, Personas) oder aus deterministischen Generierungs-Regeln (Anti-Patterns aus Non-Goals).

### 3.2 `context/personas/01-skeptiker-marketing-ops.md` — Persona-File-Format

```markdown
---
persona_id: skeptiker-marketing-ops
archetype: skeptiker
rank: primary
generated: 2026-05-14
source_interview_ids: [int-001, int-007, int-012]
---

# Persona 1 — Marketing-Ops Lead at 50-Person SaaS

## Demographics
- Role: Marketing Ops / RevOps
- Company size: 20-200
- Industry: B2B SaaS
- Tenure: 2-4 years in role
- Technical level: Mid (knows SQL, can read but not write Python)

## Jobs-to-be-Done
**Functional:** Stitch attribution data from 5+ tools into a unified weekly board report.
**Emotional:** Look competent in the Monday-morning leadership meeting.
**Social:** Be the person who "owns" attribution, not the person who "guesses."

## Current Workarounds
1. Notion page with weekly Mixpanel screenshots (cost: 30min/week, fragile)
2. Sheets formula linking GA4 export + HubSpot export (cost: $0, breaks weekly)
3. Sometimes pays $99 for a Hex-template scratch

## Budget Authority
- Discretionary: $50-200/mo, no approval
- $200-1000/mo: needs CFO sign-off, 2-week cycle
- >$1k/mo: scrapped 8/10 times

## Decision Triggers (Will Pay)
- Survives the Monday-meeting test
- Connects to HubSpot, Mixpanel, GA4 out-of-box
- Has a "trust" indicator (audit log, citation links)

## Decision Blockers (Will Not Pay)
- "AI-powered" framing without verifiability
- Onboarding longer than 15 min
- Per-seat pricing >$50/seat

## Verbatim Quotes
- "I literally have a Notion page just for screenshots."
- "If I can't show where the number came from, I can't ship it."
- "We tried [Competitor X]. It made up numbers. Never again."

## Language Hot-Buttons
- Resonates: "verifiable", "source-linked", "audit", "Monday-board-ready"
- Triggers abwehr: "AI insights", "revolutionize", "10x productivity"
```

Dieses Format wird vom `persona-generator` + `persona-interviewer` schon heute approximiert, aber für das Handoff-Pack erweitert um die **Language Hot-Buttons**-Section (für persona-voice-writer-Subagent) und **Decision Triggers/Blockers** (für pricing-tester + activation-flow-designer).

### 3.3 `spec/product-prd.md` — generiertes PRD-File

Sections: Vision (1 Satz, derived from JTBD), Problem (top-3 pains), Solution (one-paragraph), MVP-Scope (4-6 features anchored to pain-IDs), Out-of-Scope, Success Metrics, Open Questions. Jedes Feature in MVP-Scope ist **explizit getagged mit `[anchor: pain-{id}]`** — wenn später ein Feature ohne Anchor vorgeschlagen wird, schlägt der `pain-anchored-feature-reviewer` Alarm.

### 3.4 `spec/tech-stack-recommendation.md` — adaptive Stack-Auswahl

Der `handoff-pack-builder`-Subagent macht die Tech-Stack-Entscheidung **nicht zufällig**. Eingangsdaten:

- **Persona-Technical-Level** (aus persona-generator)
- **Distribution-Mode** (Webapp, mobile, CLI, OSS framework — abgeleitet aus channel-insights)
- **Pricing-Tier** (aus pricing-hypothesis — sub-$50/mo → Self-serve → SSR-light Stack)
- **Data-Heaviness** (aus pain-points — "real-time analytics" → Edge runtime, "static landing + auth" → Next/Vercel)

Stack-Empfehlung-Beispiele:
- B2B SaaS für technische Persona → **Next.js 16 (App Router) + Vercel + Neon Postgres + Clerk + AI Gateway**
- Internal-tool für non-tech Persona → **Next.js + Vercel + Supabase + Stack-Auth**
- Developer-tool / OSS → **TypeScript CLI + ink + npm distribution**, optional Vercel-Hosted-Docs
- Mobile-first consumer → **Expo + Convex** (out-of-scope flag — ValidationKit recommends to re-validate first)

Jeder Layer kommt mit Begründungs-Bullet, alternativen, und Verweis zurück auf das Persona/Pain-File, das die Wahl motiviert hat. **Vercel-bias ist explizit** — ValidationKit positioniert sich als Vercel-Plugin-Marketplace-friendly (siehe Wettbewerbslandschaft).

### 3.5 `spec/pricing-hypothesis.md`

Aus den `persona.budget`-Feldern aller Personas → drei Pricing-Tier-Hypothesen mit Conversion-Schätzung pro Tier. Plus konkrete First-Pricing-Page-Copy-Variante. Marked als **hypothesis** — soll später durch echte Conversion-Tests ersetzt werden.

### 3.6 `.claude/settings.json` — Sane Defaults

```json
{
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Glob", "Grep", "WebSearch"],
    "deny": ["Bash(rm -rf*)"],
    "ask": ["Bash(git push*)", "Bash(npm publish*)"]
  },
  "model": "sonnet",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "command": ".claude/hooks/check-pain-anchor.sh"
      }
    ]
  }
}
```

Der `check-pain-anchor.sh`-Hook ist optional und prüft beim Schreiben in `spec/`, dass jedes neue Feature ein `[anchor: pain-{id}]`-Tag hat.

---

## 4. Neue Subagents (im ValidationKit-Framework)

### 4.1 `handoff-pack-builder` — der Generator

**Trigger:** Wird vom `feedback-synthesizer` aufgerufen, sobald Recommendation = Go ODER explizit via `/handoff`.
**Tools:** Read, Write, Glob, WebSearch (für tech-stack research)
**Job:** Liest `.validationkit/state.json` + alle reports/, bestimmt Stack, generiert die volle directory-tree, schreibt 30+ Files in einem deterministischen Pass.
**Output:** `handoff-packs/{idea-slug}-{date}/` — komplettes Pack.

### 4.2 `customer-empathy-checker` — geht ins Pack

Lebt in jedem generierten Pack. Triggert auf Pull-Requests / Diffs / neue Spec-Files. Prüft: Würde Persona 1 dieses Feature verstehen? Wird Persona-Voice befolgt? Werden verbotene Wörter genutzt?

### 4.3 `pain-anchored-feature-reviewer` — geht ins Pack

Triggert wenn `spec/mvp-scope.md` oder Code-Files mit neuen Features modifiziert werden. Prüft: hat jedes Feature ein `[anchor: pain-{id}]`-Tag? Existiert die referenzierte Pain in `context/pain-points.md`? Macht Drift sichtbar.

### 4.4 `pricing-tester` — geht ins Pack

Triggert auf `spec/pricing-hypothesis.md`-Änderungen oder explizit via `/pricing-check`. Simuliert: würde Persona 1 zu diesem Preis kaufen? Was würde Persona 2 (Skeptiker) sagen? Greift dabei auf `context/personas/` zu.

### 4.5 `persona-voice-writer` — geht ins Pack

Triggert auf Marketing-Copy, Landing-Page-Edits, Onboarding-Strings. Re-writet zur Persona-Voice. Quellen-Files: `context/persona-language.md`.

### 4.6 `messaging-tester` — geht ins Pack

A/B-Headline-Test gegen alle Personas. Nutzt persona-interviewer-Tech.

### 4.7 `activation-flow-designer` — geht ins Pack

Designed Onboarding-Steps anchored an Persona-Decision-Triggers/Blockers.

### Neue Slash Commands (in ValidationKit)

| Command | Wo | Funktion |
|---------|----|----|
| `/handoff` | ValidationKit | Manueller Trigger des handoff-pack-builder |
| `/handoff --target=oss` | ValidationKit | OSS-Framework-Variant (CLI-Tool-PRD statt SaaS-PRD) |
| `/handoff --deploy=vercel` | ValidationKit | Deployt landing + creates GitHub repo |
| `/revalidate` | Im Pack | Triggert ValidationKit aus dem Pack heraus mit Update-Daten |
| `/feature-review` | Im Pack | Ruft pain-anchored-feature-reviewer auf |
| `/pricing-check` | Im Pack | Ruft pricing-tester auf |
| `/messaging-test "headline"` | Im Pack | Headline-A/B gegen Personas |
| `/ship-update` | Im Pack | Generiert Release-Notes in Persona-Voice |

---

## 5. Tech-Stack-Generierung — Logik

Der `handoff-pack-builder` macht **regelbasierte Stack-Empfehlung**, nicht LLM-Freestyle:

```
IF persona.technical_level == "high" AND distribution == "developer-tool":
    stack = "TypeScript CLI + ink + npm + Vercel-Docs"

ELIF persona.technical_level == "low" AND pricing.tier in ("free", "freemium"):
    stack = "Next.js 16 + Vercel + Supabase + Clerk (Marketplace)"

ELIF pain.has_signal("real-time", "high-volume", "analytics"):
    stack = "Next.js + Vercel (Fluid) + Neon + AI Gateway + Tinybird"

ELIF pain.has_signal("workflow", "approval", "long-running"):
    stack = "Next.js + Vercel Workflow DevKit + Postgres"

ELSE:
    stack = "Next.js + Vercel + Postgres + Clerk"
```

Defaults sind **bewusst Vercel-skewed** — das matched die Plugin-Marketplace-Distributions-Strategie (siehe analysis 04). User kann override-en via `/handoff --stack=custom`.

---

## 6. Slash-Command-Trigger & UX

```
User in ValidationKit-Session, after Go-recommendation:

> /handoff

[handoff-pack-builder] Reading validation state...
[handoff-pack-builder] Detected: 3 personas, 7 pain-points, signal-strength 8.4/10
[handoff-pack-builder] Stack inferred: Next.js + Vercel + Neon (B2B SaaS, mid-tech persona)
[handoff-pack-builder] Override? [y/N/custom]
> y
[handoff-pack-builder] Generating 34 files in ./handoff-packs/attribution-monday-2026-05-14/
   ✓ .claude/CLAUDE.md (2.1k tokens)
   ✓ .claude/agents/ (6 product-specific agents)
   ✓ context/personas/ (3 personas)
   ✓ spec/ (7 files)
   ✓ ...
[handoff-pack-builder] Done. Next steps:
   1. cd handoff-packs/attribution-monday-2026-05-14/
   2. claude
   3. /feature-review (run first review of MVP scope)
   Optional: zip --output=pack.zip
   Optional: vercel link && vercel deploy --pre-built
```

---

## 7. Download / Export-Mechanismus

Drei Tiers, parallel:

### 7.1 OSS-Framework-User (local)
Pack wird direkt ins File-System geschrieben unter `handoff-packs/{slug}/`. User macht selber `git init`, `gh repo create`, `vercel link`. Eine Convenience: `/handoff --git-init` macht `git init && git add -A && git commit -m "Initial handoff pack"` automatisch.

### 7.2 Web-App-User (Phase 2)
Im hosted Dashboard: "Generate Handoff-Pack"-Button → builder läuft serverside → produziert downloadable `.zip` ODER push direkt zu (a) neuem GitHub-Repo via GitHub-App-Integration, (b) neuem Vercel-Project via Vercel-API. Vercel-Integration ist hier killer: One-click from "validated idea" zu "live preview-deploy mit fake-door landing page."

### 7.3 Power-User-Path
`vercel curl` / `vercel api` calls for programmatic re-generation. CLI flag `--ci` produziert keinen interactive prompt — geeignet für agency-use-case ("validate 10 client ideas, generate 10 packs in batch").

---

## 8. Re-Validation-Loop

Das **wichtigste Differenzierungs-Feature gegen v0/Lovable**. Ein generiertes Pack ist nicht statisch — es bleibt mit dem ValidationKit-Source-Project verbunden via `.validationkit/handoff-manifest.json`:

```json
{
  "source_validation_id": "val_abc123",
  "source_project_path": "../../validationkit-projects/attribution-tool",
  "generated_at": "2026-05-14T10:00:00Z",
  "personas_snapshot_hash": "sha256:...",
  "pain_points_snapshot_hash": "sha256:..."
}
```

Im Pack: `/revalidate` triggert eine neue ValidationKit-Run mit (a) den aktuellen Personas als Pre-Filter, (b) neuen Daten aus dem Build (z.B. echte User-Signups, echte Support-Tickets). Output: **Diff** zwischen alter und neuer Validation. Wenn Personas oder Pains sich verschoben haben → `update-context`-Subagent merged das in `context/` und schreibt ein neues `decisions/000X-pivot-{date}.md`.

Das ist der **Retention-Loop**, der das #1-Risiko aus dem PRD adressiert. User kommt **bewusst** zurück zu ValidationKit, weil das laufende Projekt ihn dort hin pointed.

---

## 9. Konkurrenz-Vergleich (2026)

| Tool | Was es macht | Was es **nicht** macht |
|------|--------------|------------------------|
| **v0.dev** (Vercel) | UI-Generation aus prompt, generiert Next.js+shadcn-Komponenten | Keine validation-context, keine Personas, kein Pain-Anchoring |
| **Lovable Brain** | Spec → fullstack app, AI plant Architektur | Eine Idee, kein "ist diese Idee überhaupt validiert"-Check, kein Persona-Memory |
| **Builder.io Fusion** | Figma → Code, design-driven | Pure design-to-code, kein Product-Strategy-Layer |
| **bolt.new** | Browser-IDE mit AI, scaffold + iterate | Kein Validation-Pre-Step, kein Pivot-Detection |
| **GitHub Spark** (2026) | "App from spec" für GitHub-User | Limited persona-modelling, kein channel-data |
| **Create-T3, create-next-app** | Vanilla scaffolders | Generic, kein produkt-spezifischer Kontext |
| **claudekit, wshobson/agents** | Dev-Subagents | Kein Product-Validation-Layer |
| **GoZigzag, IdeaProof** | Validation-Reports | Endet beim Report, keine Build-Brücke |

**ValidationKit Handoff-Pack ist der einzige Tool 2026, der diese drei Layer kombiniert:**

1. **Product-Strategy-Memory** (Validation-Insights als persistent context)
2. **Code-Scaffolding** (lauffähiges Repo + Stack)
3. **Continuous Product-Health-Checks** (pain-anchored-reviewer + customer-empathy-checker als laufende Subagents)

v0 und Lovable starten beim "ich will eine App", nicht beim "ich habe eine validierte Idee mit X-Personas und Y-Pains." Die Lücke ist nicht "noch ein Scaffolder" — die Lücke ist die **Übersetzungs-Schicht zwischen Customer-Discovery und Code**.

### Warum 10x besser als manuell

Ein founder, der ohne Handoff-Pack startet, muss:

1. Mental-aggregate 5+ validation-reports → 30-90 min, lossy
2. Schreiben ein CLAUDE.md aus dem Kopf → 60-120 min, vergisst persona-language
3. Wählen einen Tech-Stack ohne explicit-Begründung → minutes to weeks (decision-paralysis)
4. Generieren eine Product-PRD → 2-4h
5. Aufsetzen erste Subagents → 60-180 min, copy-pasted ohne Anchor zu Personas

**Total: 6-12 Stunden, mit signifikantem Context-Loss.**

Handoff-Pack: **< 60 Sekunden generation, mit zero context-loss + deterministischer Stack-Justification + Persona-Bound-Agents that catch feature-drift later.**

---

## 10. Beispiel-CLAUDE.md (hypothetisches Produkt)

```markdown
# Attribution-Monday — Project Context

> **Status:** Validated 2026-05-14 (Go: 8.4/10 signal)
> **One-liner:** Verifiable, source-linked weekly attribution report
> for B2B SaaS marketing-ops leads who hate Monday meetings.

## What This Is (And Isn't)

**Is:** A weekly auto-generated, source-linked attribution dashboard
that connects HubSpot + Mixpanel + GA4 and produces a Monday-board-ready PDF
where every number has a clickable source-screenshot.

**Is NOT:**
- "AI-powered insights" (validated rejection from Persona 1, Interview 3)
- A general analytics tool (out of scope, see `spec/non-goals.md`)
- A Slack-app (channel-data shows Linear > Slack for this persona)

## The Validated Pain

Primary persona ("Maya, Marketing-Ops Lead at 50-person SaaS") spends 4-8h/week
manually stitching attribution data. Severity 9/10, frequency weekly, budget $50-200/mo.

Verbatim: "I literally have a Notion page just for Mixpanel screenshots."
See: `context/personas/01-skeptiker-marketing-ops.md`

## Persona Language (Use / Don't)

✅ Use: "verifiable", "source-linked", "audit-ready", "Monday-board-ready"
❌ Avoid: "AI-powered", "10x", "revolutionize", "insights" (without source)

## Stack

Next.js 16 (App Router, Cache Components) + Vercel (Fluid) + Neon Postgres
+ Clerk (Marketplace) + AI Gateway. Full reasoning in `spec/tech-stack-recommendation.md`.

## How to Work in This Repo

- Before adding a feature: `/feature-review` (validates pain-anchor)
- Before changing pricing: `/pricing-check`
- Before shipping marketing copy: `/messaging-test`
- Quarterly: `/revalidate` to refresh persona-data

## Anti-Patterns (validated, do not violate)

- Do NOT add Slack integration before Linear (channel-ranking)
- Do NOT add per-seat pricing above $50/seat (persona blocker)
- Do NOT use "AI insights" framing anywhere user-facing

## Decision Log

See `decisions/`. Write new ADRs for architecture choices.

## If You're an AI Reading This

You are working on a product whose Validation lives in `context/`.
Treat that folder as immutable ground truth. When uncertain about user-needs,
re-read `context/personas/` before generating. When proposing features,
they MUST tag `[anchor: pain-{id}]` referencing `context/pain-points.md`.
```

---

## 11. Integration mit ValidationKit-OSS vs Web-App

| Aspect | OSS-Framework | Hosted Web-App (Phase 2) |
|--------|---------------|--------------------------|
| Trigger | `/handoff` in Claude Code | Button im Dashboard |
| Output-Location | Lokales Filesystem | Browser-Download (zip) ODER auto-push GitHub ODER Vercel-deploy |
| Re-validate | `/revalidate` in Pack | Hosted re-run, mit history-comparison im UI |
| Persona-Updates | Manual git pull from original validation | Push-Notification "Personas drifted" |
| Tech-Stack-Override | Flag `--stack=` | Stack-Picker-UI |
| Multi-Project | `handoff-packs/` folder | Project-list im Dashboard |
| Agency-Use | `--ci` flag, batch | White-Label-Branded-Packs (Phase 3 monetization) |

Beide Pfade produzieren **das exakt gleiche Pack-Format** — Web-App ist nur ein Convenience-Layer über dem OSS-Builder.

---

## 12. MVP-Scope für Handoff-Pack (Phase 1.5)

**Cut für ersten Ship in 2-3 Wochen nach Phase-0-MVP:**

**In Scope:**
- `handoff-pack-builder` Subagent
- `/handoff` Slash Command
- Volle directory-tree-Generation (alle Files aus §2)
- 3 Product-Subagents im Pack: `customer-empathy-checker`, `pain-anchored-feature-reviewer`, `pricing-tester`
- Stack-Detection-Logik mit 3 Default-Stacks (Next.js/B2B-SaaS, CLI/Dev-Tool, Next.js/Consumer)
- `.cursorrules` mirror
- `--git-init` Flag

**Out of Scope (Phase 2+):**
- `/revalidate` round-trip
- Vercel-deploy-direct
- GitHub-repo-create
- Hosted-Web-Generator
- Multi-persona-A/B im pricing-tester
- White-Label-Branding

**Success Criteria:**
- Ein Indie-Hacker geht von "Go"-Empfehlung zu "running `claude` im neuen Repo" in <2 Minuten
- 50%+ der "Go"-validated-Users triggern `/handoff` (Tracking via Telemetrie opt-in)
- 3 Indie-Hackers reporten qualitativ: "saved me half a day"

---

## 13. Risiken & Mitigations (Handoff-Pack-spezifisch)

| Risiko | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Tech-Stack-Empfehlung passt nicht zu User-Preferences | Hoch | Mittel | `--stack=custom` Flag, klare Override-UX |
| User editiert `context/` und bricht Re-validation-Diff | Mittel | Niedrig | `.gitattributes` markiert context/ als "managed by validationkit" + warn-hook |
| Pack wird zu groß (Token-Overhead in jedem Claude-Run) | Mittel | Hoch | CLAUDE.md hat Pflicht-Summary-First-Structure; details lazy-loaded via `@context/` references |
| Lovable / v0 launchen ähnliches Feature | Hoch | Hoch | First-mover, OSS-Distribution-Speed, Vercel-Plugin-Marketplace-Listing first |
| Pack-Generator halluziniert Personas | Niedrig | Hoch | Strict template-driven, kein Freestyle, alle Inhalte sourced aus state.json |

---

## 14. Naming-Conventions

- Feature-name extern: **"Handoff-Pack"** (klar, evokativ, suchbar)
- Slash-command: **`/handoff`** (kurz, eindeutig im Context von Validation→Build)
- File-format-name: **"ValidationKit Handoff-Pack v1"** im manifest
- Alternative considered: "Build-Kit", "Launch-Pack", "Bridge". `/handoff` wins because the metaphor (Customer-Discovery → Engineering) is the killer-feature.

---

## 15. Open Questions

1. **`.cursorrules` Mirror auch für JetBrains AI, Codeium, Windsurf?** — Wahrscheinlich ja, Cost ist niedrig (template-Generierung).
2. **Soll `.claude/skills/` schon shippen oder erst Phase 2?** — MVP: ja, aber nur 2 skills (persona-language, pain-anchoring) statt 5.
3. **Wie versionieren wir Pack-Updates wenn ValidationKit-Schema sich ändert?** — Semver auf das Manifest, mit `claude-code-validationkit upgrade-pack` migration-command.
4. **Vercel-Integration native vs Add-On?** — Native im OSS (via `vercel link`-Hint im README), automatisch im Hosted.
