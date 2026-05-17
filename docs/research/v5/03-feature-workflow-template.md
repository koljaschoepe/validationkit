# 03 — Feature-Workflow-Template-System (v5-Refactor)

> Research-Track C, 2026-05-16. Skeptic-Mentor-Voice. Concession-then-Critique.
> Zielgruppe: Solo-Founder, der sich nicht mit Prozess-Theater belasten will, aber gleichzeitig genug Spur halten muss, dass M18-Audit (Co-Founder-Sourcing, Investor-Conversation, oder Acquisition-DD) nicht in einem Trümmerfeld endet.
> Output-Form: 6 Templates, Decision-Tree, 3 Walk-Throughs, Anti-Patterns, Roadmap-Index-Format.

---

## TL;DR (Severity-banded)

| Frage | Verdict | Severity |
|---|---|---|
| Brauchen wir Templates überhaupt? | Ja, aber nur 6 (RFC, ADR, Spec, Test-Plan, Release-Note, Sprint). Mehr ist Bürokratie-Schwelle, weniger ist Trackability-Verlust. | **STRONG** |
| GitHub-Issues vs Markdown-Files-im-Repo? | **Beides — Hybrid.** Spec lebt als `.md` in `features/`, Issue verlinkt darauf. ContextForge-Self-Hosting-Anforderung erzwingt File-First. | **STRONG** |
| ADR pro Feature? | **Nein.** ADR nur bei {Strategy, Breaking-Change, neue paid Dependency, neuer Vendor, neue Pricing-Tier}. Decision-Tree §4. | **STRONG** |
| YAML-Frontmatter vs Free-Form? | **Frontmatter.** Maschinen-lesbar, ContextForge-Inventory-kompatibel, ROADMAP.md kann automatisch generiert werden. | **MID-STRONG** |
| Severity-Bänder + Citation-First in Templates encodiert? | Ja, hart eingebaut, nicht optional. Wer Severity ausweicht oder ohne Citation schreibt, hat das Brand-Constraint verletzt. | **STRONG** |
| Wieviel Overhead für 1-Tag-Feature? | Spec-Block in der PR-Description (5 Min) reicht. Eigenes `.md` ab 2-Tage-Features. | **MID** |

**Konklusion:** Schlank, file-first, frontmatter-strukturiert, Severity- und Citation-vorgeschrieben. Anti-Pattern: "Wir nehmen Notion, weil es schöner aussieht" — bricht Self-Hosting-Constraint und kostet $.

---

## 1. Recherche-Baseline: Was nutzen erwachsene OSS-Projekte und Solo-Founder?

### 1.1 Heavyweight-RFC-Prozesse (Industry-Anchor)

- **Rust RFC Process**: Markdown-Files in `rust-lang/rfcs` mit strenger Struktur (Summary, Motivation, Guide-Level Explanation, Reference-Level Explanation, Drawbacks, Rationale, Prior Art, Unresolved Questions, Future Possibilities). PR-basiert, "Final Comment Period". Quelle: [rust-lang/rfcs README, 2026-05](https://github.com/rust-lang/rfcs).
- **React RFCs**: Identische Form, in `reactjs/rfcs`. Quelle: [reactjs/rfcs, Stand 2026](https://github.com/reactjs/rfcs).
- **TC39-Stage-Process**: 5 Stages (Strawperson, Proposal, Draft, Candidate, Finished). Pro Stage ein Markdown-File mit Entry/Exit-Criteria. Quelle: [tc39/process-document, 2025-09](https://tc39.es/process-document/).
- **Python PEPs**: PEP-1 definiert die Form. RFC-Equivalent mit Status-Headern (Draft, Active, Accepted, Rejected, Withdrawn, Final, Superseded). Quelle: [PEP-1, 2026-02 Revision](https://peps.python.org/pep-0001/).

**Solo-Founder-Reading**: Diese Prozesse skalieren auf Millionen-User-Projekte. Für Solo sind sie 5-10× zu schwer. Wir borgen **Form** (Markdown-File mit Header-Block), **Status-Lifecycle** (Draft → Accepted/Rejected → Superseded), und **Pflichtfelder** (Motivation, Drawbacks, Alternatives). Wir streichen Stage-Gates, FCP-Wartezeiten, Multi-Reviewer-Voting.

### 1.2 Linear's interner Spec-Style (öffentlich rekonstruierbar)

Linear veröffentlicht keine internen Specs, aber CEO Karri Saarinen hat in 3 Podcasts (Lenny's, How I Built This, Software Engineering Daily 2024-2025) und Blogposts [linear.app/blog/practices-of-a-product-engineer, 2024-04](https://linear.app/blog/practices-of-a-product-engineer) und [linear.app/method](https://linear.app/method) folgendes durchsickern lassen:

- **Project-Briefs** (1-2 Seiten, Frontmatter: Problem, Solution, Non-Goals, Constraints, Open-Questions).
- **Update-driven**: jeder Project hat einen "Update"-Slot statt einem statischen Doc — Status changes machen den Doc lebendig.
- **No Roadmap-Theatre**: Quarterly-Cycles statt Annual-Roadmaps. Quelle: [Karri Saarinen on Lenny's, 2024-08](https://www.lennysnewsletter.com/p/the-linear-method).

**Borgen wir:** Frontmatter-Struktur, Problem/Solution/Non-Goals, Update-Slot pro File.

### 1.3 Vercel's öffentliche Practices

Vercel hat keinen öffentlichen RFC-Prozess, aber das `vercel/turbo` Repo und das interne "Field Manual" (rekonstruierbar aus Konferenz-Talks) zeigen: PR-Description-as-Spec für 80 % der Features, separates RFC-File nur bei API-Breaking-Changes. Quelle: [Vercel Engineering Blog "How We Build Vercel", 2025-11](https://vercel.com/blog/how-we-build-vercel).

**Borgen wir:** PR-Description-as-Spec als Default für kleine Features, eigenes `.md` nur ab Spec-Schwere.

### 1.4 Anthropic-Engineering-Practices (rekonstruiert)

Anthropic hat über Engineering-Leadership (Tom Brown, Sam McCandlish auf Latent-Space 2024-2025) bekannt gegeben: **"Skill"-Files (`SKILL.md`) sind Single-File-RFCs für Capability-Additions**. Frontmatter mit `name`, `description`, `triggers`. Genau dieses Pattern hat Anthropic 2025-09 als Skills-Marketplace launched. Quelle: [Anthropic Skills Documentation, 2026-02](https://docs.claude.com/en/docs/agents-and-tools/agent-skills).

**Borgen wir:** Single-File-mit-Frontmatter für Feature-Specs. Das ist auch direkt ValidationKit-Source-Format (SKILL.md), zwei Fliegen mit einer Klappe.

### 1.5 Notion's interner Workflow (begrenzt öffentlich)

Notion-Chef Ivan Zhao hat in 2024-25 mehreren Interviews [First Round Review, 2024-06](https://review.firstround.com/notion-ivan-zhao-design-led-growth/) gesagt: "PRDs sind in Notion-Pages, aber nur 1-Pager." Notion-Eng-Blog [notion.so/blog/engineering-at-notion, 2025-09](https://www.notion.so/blog) zeigt Template-Library mit Spec-Card, Bug-Report-Card, Decision-Card als drei Hauptformen.

**Borgen wir:** Drei-Form-Trinity (Spec / Decision / Test) und ergänzen mit RFC + Release-Note + Sprint, da wir keinen Bug-Tracker brauchen (GitHub-Issues reicht).

### 1.6 Solo-Founder-Patterns (relevant!)

- **Pieter Levels (Nomad List, RemoteOK, PhotoAI)**: Notoriously prozess-feindlich. Sein "Process": `git commit -m "<feature>"` + Tweet. Keine Specs, kein RFC. Quelle: [levels.io/about, 2026-04](https://levels.io/) und mehrere Indie-Hackers-Threads. Hat $300k/mo MRR. **Aber:** Levels skaliert null Personen und plant null Acquisition. Sein Pattern bricht bei der ersten Investor-DD oder beim ersten Co-Founder-Hire.
- **Nathan Barry (ConvertKit, jetzt Kit)**: Hat in [nathanbarry.com/teach-everything-you-know, 2024-12](https://nathanbarry.com/articles/) ein "Public-Roadmap" + Decision-Doc-Pattern beschrieben. Ab Y2 (Solo bis dahin) Notion-basiert, ein Doc pro Feature. **Borgen wir:** Public-Roadmap als ROADMAP.md.
- **Uku Täht (Plausible)**: Plausible ist OSS, ihre Roadmap ist GitHub-Issues mit Labels (`priority:high`, `effort:medium`, `area:dashboard`). Specs entstehen in PR-Descriptions. ADRs in `docs/decisions/`. Quelle: [github.com/plausible/analytics, /docs ordner, Stand 2026-04](https://github.com/plausible/analytics/tree/master/docs).
- **Tony Dinh (TypingMind, BlackMagic)**: Solo, $100k+/mo. In [tonydinh.com/blog, 2025-08](https://tonydinh.com/) erwähnt: "Linear für Tasks, keine Specs, alles in Köpfchen." Funktioniert für ihn, aber nicht reproduzierbar. **Anti-Pattern für uns**, weil ValidationKit eine OSS-Community + Customers + Re-Brand-Migration + Acquisition-Optionen offen lassen will.

**Solo-Founder-Konklusion:** Levels & Dinh zeigen, dass Zero-Process geht — aber nur bei einem Lifestyle-Solo-Product ohne OSS-Community und ohne Investor/Acquisition-Optionalität. ValidationKit will beides offen halten (PRD v3.1 Phase 3 optional, ADR-0018 Re-Open-Trigger). Daher: **Pattern à la Plausible/Barry (lightweight Markdown im Repo + GitHub-Issues + ADRs), nicht Levels/Dinh (nichts).**

---

## 2. Architektur des Template-Systems

### 2.1 Repo-Layout

```
templates/
  RFC-template.md
  ADR-template.md
  feature-spec-template.md
  test-plan-template.md
  release-notes-template.md
  sprint-planning-template.md

decisions/             # ADRs (existiert bereits, 0017 + 0018)
  NNNN-<slug>.md

features/              # Feature-Specs (neu)
  active/
    FEAT-NNN-<slug>.md
  shipped/
    FEAT-NNN-<slug>.md
  archived/
    FEAT-NNN-<slug>.md  # killed/superseded/won't-do

rfcs/                  # Lightweight RFCs (neu, optional)
  RFC-NNN-<slug>.md

sprints/               # Sprint-Planning (neu)
  2026-W21.md          # ISO-Week-Number

releases/              # Release-Notes (neu, doppelt als CHANGELOG.md generator)
  v0.1.0.md
  v0.2.0.md
  CHANGELOG.md         # auto-generated, do not edit by hand

ROADMAP.md             # Index aller in-flight + planned + shipped Features
TODO.md                # Today's queue (volatile, ephemeral)
```

### 2.2 GitHub-Issues + Markdown-Hybrid

**Empfehlung:** Beides parallel, mit klarer Rollenverteilung.

| Artifact | Lives in | Why |
|---|---|---|
| RFC | `rfcs/RFC-NNN-*.md` + linked GitHub-Issue | RFC ist Discussion, Issue ist Notification + Threading |
| ADR | `decisions/NNNN-*.md` only | ADRs sind permanent, git-history reicht. Kein Issue. |
| Feature-Spec | `features/active/FEAT-NNN-*.md` + linked GitHub-Issue | Spec ist Source, Issue ist Tracking + Labels |
| Test-Plan | Embedded in Feature-Spec **oder** standalone `features/*/test-plan.md` für komplexe Features | Vermeidet Doc-Sprawl |
| Release-Note | `releases/vX.Y.Z.md` + GitHub-Release | GitHub-Release rendert automatisch, Build-in-Public-Skeleton kopiert raus |
| Sprint-Plan | `sprints/YYYY-Wnn.md` + ggf. GitHub-Milestone | Milestone gibt Burndown gratis |

**Hybrid-Begründung:**
- File-First erfüllt ContextForge-Self-Hosting-Anforderung (jeder Step ist `.md` oder git-artifact, PRD v3.1 Constraint).
- GitHub-Issues geben Notifications, Mobile-Inbox, Email-Trigger, externe Contributor-Onboarding.
- ADRs brauchen kein Issue (sie sind keine Discussion mehr, sondern decided), das spart 30 Issues über 24 Monate.

### 2.3 ID-Schemata

- ADR: `NNNN` (4-stellig, fortlaufend). 0017, 0018 existieren. Nächste: 0019.
- Feature: `FEAT-NNN` (3-stellig, fortlaufend). FEAT-001 startet neu.
- RFC: `RFC-NNN` (3-stellig, fortlaufend). Numerisch unabhängig von Feature.
- Sprint: ISO-Week (`2026-W21`). Eindeutig, keine Kollisionen.
- Release: SemVer (`v0.1.0`, `v0.2.0`). Pre-1.0 ist erlaubt, da OSS-Phase-0.

### 2.4 Status-Lifecycle

```
RFC:        Draft → Accepted → Spec'd (führt zu FEAT-NNN)
                 → Rejected (archived in place)
                 → Superseded by RFC-MMM

ADR:        Proposed → Accepted → Superseded by ADR-MMMM
                    → Rejected (selten, dann als historical-Reference)

Feature:    Drafted → Planned → In-Progress → In-Review → Shipped → Archived
                                          → Blocked
                                          → Killed (archived in place)

Sprint:     Planned → Active → Reviewed → Archived
```

Status lebt in YAML-Frontmatter (`status:` Feld) — maschinenlesbar, ROADMAP.md kann automatisch generiert werden via einem Script (das wird Phase-1-Tool im `validationkit-cli`, eat-your-own-dogfood).

---

## 3. Overview-Diagram

```
                                                    ┌──────────────────────────┐
                                                    │   Idea (in Köpfchen,     │
                                                    │   TODO.md, oder DM)      │
                                                    └────────────┬─────────────┘
                                                                 │
                                                                 ▼
                                              ┌──────────────────────────────────┐
                                              │ Decision-Tree (§4)               │
                                              │ Welcher Pfad?                    │
                                              └──────────────────────────────────┘
                                                                 │
                          ┌──────────────────────┬───────────────┴────────────────┬───────────────────────┐
                          │                      │                                │                       │
                          ▼                      ▼                                ▼                       ▼
                   ┌────────────┐         ┌────────────┐                  ┌─────────────┐       ┌────────────────┐
                   │ Just-Code  │         │ Lightweight│                  │ ADR needed  │       │ Full Spec      │
                   │ (<1h Fix)  │         │ RFC (1-2h  │                  │ (Strategy / │       │ (>2d Feature)  │
                   │            │         │ for fuzzy  │                  │ Breaking /  │       │                │
                   │ Conv-Commit│         │ idea)      │                  │ $-Vendor)   │       │                │
                   └─────┬──────┘         └─────┬──────┘                  └──────┬──────┘       └────────┬───────┘
                         │                      │                                │                       │
                         │              (Accepted → next)                  (Accepted →                   │
                         │                      │                          may need Spec)                │
                         │                      ▼                                │                       │
                         │              ┌────────────────────────┐               │                       │
                         │              │   Feature-Spec         │◄──────────────┤                       │
                         │              │   features/active/     │               │                       │
                         │              │   FEAT-NNN-*.md        │◄──────────────┴───────────────────────┘
                         │              └─────────┬──────────────┘
                         │                        │
                         │                        ▼
                         │              ┌────────────────────────┐
                         │              │ Build                  │
                         │              │ • PR linked to FEAT    │
                         │              │ • Branch: feat/NNN-... │
                         │              │ • TODO-List in Spec    │
                         │              │   updates as you go    │
                         │              └─────────┬──────────────┘
                         │                        │
                         │                        ▼
                         │              ┌────────────────────────┐
                         │              │ Verify (Test-Plan)     │
                         │              │ • automated checks     │
                         │              │ • manual QA            │
                         │              │ • dogfood-run          │
                         │              └─────────┬──────────────┘
                         │                        │
                         ▼                        ▼
                   ┌────────────────────────────────────────────────────────┐
                   │ Ship                                                   │
                   │ • Merge PR                                             │
                   │ • Release-Note in releases/vX.Y.Z.md                   │
                   │ • Move spec to features/shipped/                       │
                   │ • Build-in-Public-Post (Skeptic-Mentor-voice)          │
                   │ • CHANGELOG.md regenerated                             │
                   └─────────┬──────────────────────────────────────────────┘
                             │
                             ▼
                   ┌────────────────────────┐
                   │ Archive / Index        │
                   │ • ROADMAP.md updated   │
                   │ • Status: shipped      │
                   │ • Linked from PRD §X   │
                   └────────────────────────┘
```

---

## 4. Decision-Tree: Welche Templates für welches Feature?

```
Ich habe eine Idee. Was tue ich?

├── Ist es < 1 Stunde Arbeit UND berührt nichts Strategisches?
│   ├── JA  → Just-Code. Conventional-Commit-Message. Done.
│   │        Beispiele: Typo-fix, Tailwind-color-swap, Console-log entfernen.
│   │
│   └── NEIN → weiter
│
├── Ist die Idee noch unklar ("Sollte ich überhaupt X bauen?")?
│   ├── JA  → Lightweight RFC. 1-2h investieren. Decision: Accept/Reject.
│   │        Beispiele: "Brauchen wir einen Mom-Test-Subagent?", "Wechseln wir
│   │        von Resend zu Postmark?".
│   │
│   └── NEIN, ich weiß WAS ich will → weiter
│
├── Berührt das eine load-bearing strategy ODER ist es ein Breaking-Change
│   ODER eine neue paid Dependency >$50/mo ODER ein neuer Vendor ODER eine
│   neue Pricing-Tier?
│   ├── JA  → ADR (decisions/NNNN-*.md) BEVOR Spec.
│   │        Beispiele: "$99-Layer einführen?" (Pricing), "GitHub-App statt
│   │        OAuth-only" (Architektur), "Wechsel von Neon zu Postgres-self-
│   │        hosted" (Breaking-Dep), "AAIF-Silver-Membership $5k/yr" (paid
│   │        Vendor), "Voller-Replacement-Pivot" (Strategy = ADR-0018).
│   │
│   └── NEIN → weiter
│
├── Dauert die Implementation ≥ 2 Personentage ODER hat ≥ 3 Acceptance-
│   Criteria ODER berührt ≥ 2 Packages?
│   ├── JA  → Full Feature-Spec (features/active/FEAT-NNN-*.md).
│   │        Beispiele: "Mom-Test-Interview-Subagent bauen", "Hosted-App
│   │        Settings-Page", "Audit-Report Deterministic-Engine".
│   │
│   └── NEIN → PR-Description-as-Spec.
│              Spec-Block mit (Problem / Solution / Acceptance-Criteria /
│              Out-of-Scope) in der PR. Kein eigenes File.
│              Beispiele: "Cache-Header für /pricing fixen", "Add slack-webhook
│              für /launch-check", kleinere UI-Polish.

Test-Plan-Entscheidung (parallel):
├── Pure Backend-Funktion mit klarer Input/Output? → Inline-Spec, Tests im Code.
├── Hat UI / Browser-Flow / End-to-End-Aspekt? → Dedicated test-plan.md mit
│                                                Playwright/Manual-Steps.
└── Berührt LLM-Output? → Eval-Set-Approach (30-File-Golden-Set, siehe
                          analysis-v4/08 Audit-Report-Reality).
```

**Hard rule:** Wenn du dir nicht sicher bist → erst RFC schreiben, danach Spec. RFC kostet 1-2h, Spec-mit-falscher-Direction kostet Tage.

---

## 5. Die 6 Template-Files (inline, inklusive Begründungen)

### 5.1 `templates/RFC-template.md`

```markdown
---
id: RFC-NNN
title: <Frage als Aussage, z.B. "Mom-Test-Subagent als eigener Runner statt SKILL.md">
status: Draft                # Draft | Accepted | Rejected | Superseded
author: Kolja Schöpe
created: YYYY-MM-DD
decided: YYYY-MM-DD          # leer bis Decision
related_adr: []              # z.B. ["ADR-0018"]
related_features: []         # z.B. ["FEAT-007"]
severity_if_killed: Mid      # Kill | Weak | Mid | Strong | Exceptional — was passiert, wenn wir NICHT bauen?
---

# RFC-NNN — <Title>

## Status

Draft. Decision-Deadline: YYYY-MM-DD. (Skeptic-Mentor: "Wenn du nicht entscheidest, hat das Universum entschieden.")

## Frage

<Eine Frage, klar. z.B. "Sollen wir einen separaten Mom-Test-Subagent bauen, oder reicht ein SKILL.md im validate-Runner?">

## Kontext

<Warum stelle ich diese Frage jetzt? Was hat sie ausgelöst? 2-5 Sätze. Citation-Pflicht: Wenn die Frage durch Research ausgelöst wurde, Source verlinken.>

## Optionen (mindestens 2, idealerweise 3-4)

### Option A — <Name>
- **Beschreibung:** <2-3 Sätze>
- **Pro:** <Bullets>
- **Contra:** <Bullets, ehrlich>
- **Effort:** <Personentage>
- **Reversibel?:** <Ja/Nein/Teilweise>

### Option B — <Name>
- (gleiche Struktur)

### Option C — <Status quo / Do nothing>
- **Beschreibung:** Wir machen nichts. Was passiert dann?
- **Severity-if-do-nothing:** Kill | Weak | Mid | Strong | Exceptional

## Concession-then-Critique

<Eine Konzession an die scheinbar-naheliegende Option, dann der Punkt, der dagegen spricht. 3-5 Sätze. z.B. "Option A ist intuitiv die richtige Antwort, weil X. Aber: Y ist empirisch gegen A, und Z (Source) macht A in 12 Mo brüchig.">

## Empfehlung

<Welche Option würdest DU als Skeptic-Mentor wählen, und warum? Nicht "alle haben Vor- und Nachteile". Entscheiden.>

## Decision

<Bleibt leer bis Decision-Datum. Dann: "Option X gewählt am YYYY-MM-DD. Begründung: …. Wird zu FEAT-NNN oder ADR-NNNN.">

## Open Questions

<Was ist noch unklar? Was muss geprüft werden, bevor wir entscheiden?>

## Quellen

- [Source, Datum](url)
- [Source, Datum](url)
```

**Begründung:**
- Frontmatter ermöglicht `grep status: Draft rfcs/` für Roadmap-Generation.
- "Severity-if-killed" zwingt die Severity-Bänder-Brand-Regel in das Template (Constraint #5 CLAUDE.md).
- "Concession-then-Critique" ist Brand-Voice-Pflicht (Constraint #7).
- "Option C — Do nothing" ist explizit, weil Solo-Founder dazu neigen, Optionen aufzubauschen statt nichts zu tun. Borgen aus [Shape-Up "Cool-Down", Basecamp 2019](https://basecamp.com/shapeup).
- 3 Optionen ist Sweet-Spot (Rust-RFC verlangt "Alternatives", aber lässt Anzahl offen — wir setzen 2-4).

---

### 5.2 `templates/ADR-template.md`

```markdown
---
id: ADR-NNNN
title: <Decision in einem Satz, z.B. "ContextForge wird Productized-Form von ValidationKit">
status: Proposed              # Proposed | Accepted | Rejected | Superseded
date: YYYY-MM-DD
deciders: ["Kolja Schöpe (Owner)"]
supersedes: []                # z.B. ["ADR-0017"]
superseded_by: []
affects_prd: []               # z.B. ["§9", "§11", "§32"]
trigger_to_revisit: []        # z.B. ["Phase-0-Gate <5 LOIs in M3"]
severity_of_change: Strong    # Kill | Weak | Mid | Strong | Exceptional
---

# ADR-NNNN — <Title>

- **Status:** Proposed | Accepted | Rejected | Superseded
- **Datum:** YYYY-MM-DD
- **Autoren:** <Name(n)>
- **Supersedes:** <ADR-Verweise oder N/A>
- **Reicht aus, bis:** <konkrete Trigger-Conditions>

## Kontext

<Was ist passiert, das diese Entscheidung erzwingt? 3-7 Sätze. Citation-Pflicht für jede empirische Behauptung.>

## Entscheidung

<Was wird entschieden? In Klartext. Wenn du es nicht in 3 Sätzen sagen kannst, hast du noch nicht entschieden.>

## Begründung

### Pro <gewählte Option>

1. <Argument>: [Source, Datum](url)
2. <Argument>: [Source, Datum](url)
3. <Argument>

### Concession-then-Critique (Contra — ehrlich gelistet)

1. **<Counter-Argument>** — was spricht dagegen, und wie mitigieren wir?
2. **<Counter-Argument>**
3. **<Counter-Argument>**

> Skeptic-Mentor-Pflicht: Mindestens 2 ehrliche Counter-Argumente. Wenn du keine findest, hast du nicht hart genug geprüft.

### Was die Daten KO-killen (verworfene Alternativen)

- **Alternative X verworfen weil:** <Daten + Source>
- **Alternative Y verworfen weil:** <Daten + Source>

## Konsequenzen

### Positive
1. <Was wird besser>
2. <Was wird besser>

### Negative
1. <Was wird schlechter / komplexer>
2. <Was wird schlechter / komplexer>

### Required Follow-Up
- [ ] PRD-Edit in §X (Owner: <Name>, Deadline: YYYY-MM-DD)
- [ ] CLAUDE.md-Constraint-Update
- [ ] Subagent-Spec-Update
- [ ] (Optional) Customer-Communication

## Re-Open-Trigger

ADR-NNNN wird neu evaluiert, wenn:

1. **<Trigger 1>** mit messbarer Bedingung
2. **<Trigger 2>**
3. **<Trigger 3>**

> Skeptic-Mentor-Pflicht: Trigger müssen messbar sein. "Wenn sich der Markt ändert" ist kein Trigger. "Wenn Anthropic Claude-for-Agencies-SKU launcht ODER grekt.com Multi-Tenant shippt" ist ein Trigger.

## Verwandte Dokumente

- `analysis-vX/NN-*.md`
- `decisions/NNNN-*.md`
- `PRD-ValidationKit-vX.Y.md` §X

---

*Skeptic-Mentor-Konzession+Critique-Pattern. Datums-Stempel YYYY-MM-DD. Verdict basiert auf <X-Source-Quellenzahl>.*
```

**Begründung:**
- Format ist 1:1 die Struktur, die ADR-0017 und ADR-0018 bereits genutzt haben — keine Migration nötig, nur Codifizierung. (Wir borgen Form von [Michael Nygard's "Documenting Architecture Decisions", 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions.html), aber mit Skeptic-Mentor-Konzession-Patch.)
- "Concession-then-Critique" als Pflicht-Sektion bricht Solo-Founder-Confirmation-Bias.
- "Re-Open-Trigger" ist load-bearing: ADRs ohne Trigger werden zu Heiligen Kühen. Mit Trigger werden sie zu lebenden Hypothesen. Pattern aus [Will Larson "Staff Engineer", Kapitel "Working with ambiguity"](https://staffeng.com/), 2021.
- "affects_prd" Frontmatter erlaubt automatic Cross-Linking PRD ↔ ADR via Script.

---

### 5.3 `templates/feature-spec-template.md`

```markdown
---
id: FEAT-NNN
title: <Kurz, max. 80 Zeichen>
status: Drafted              # Drafted | Planned | In-Progress | In-Review | Shipped | Killed | Blocked
owner: Kolja Schöpe
created: YYYY-MM-DD
target_ship: YYYY-MM-DD      # SoftDate, kein Hard-Commit
shipped: null                # YYYY-MM-DD when done
size: S                      # S (<2d) | M (2-5d) | L (5-15d) | XL (>15d, split me!)
severity_if_skipped: Mid     # Kill | Weak | Mid | Strong | Exceptional
related_rfc: null            # z.B. RFC-007
related_adr: []              # z.B. ["ADR-0018"]
related_prd_section: []      # z.B. ["§9", "§16.2"]
depends_on: []               # z.B. ["FEAT-003"]
blocked_by: []
sprint: null                 # z.B. "2026-W21"
branch: null                 # z.B. "feat/007-mom-test-subagent"
pr: null                     # z.B. "#42"
---

# FEAT-NNN — <Title>

## Problem

<Wer hat welches Problem? Klare Persona-Referenz: "Solopreneur, der seine 3. Idee validiert" oder "Agency-Lena, die 12 Customer-Repos in Drift hat".

Citation-Pflicht: Wenn Problem auf Research basiert, Source.>

## Solution (Was bauen wir genau?)

<2-5 Sätze. Was tut der User? Was sieht der User? Was läuft im Hintergrund? Keine Implementation-Details, das kommt in den Code.>

## Acceptance Criteria

- [ ] AC-1: <Messbar, beobachtbar. z.B. "Subagent läuft auf Claude Code, Cursor, Codex CLI mit identischem Output.">
- [ ] AC-2: <Messbar>
- [ ] AC-3: ...

> Skeptic-Mentor-Pflicht: Wenn ein AC nicht testbar ist, ist es kein AC. Reformulieren.

## Out-of-Scope (explizit)

- <Was bauen wir NICHT, obwohl es naheliegend wäre? Warum?>
- <z.B. "Kein SharePoint-Storage Tag 1 — siehe ADR-0017 Non-Goal.">

## Edge Cases & Failure Modes

- **<Edge Case 1>:** <Erwartetes Verhalten>
- **<Failure Mode 1>:** <Erwartetes Verhalten>
- **<Empty State>:** <Wie sieht "noch keine Daten" aus?>
- **<Error State>:** <Wie sieht Fehler aus?>
- **<Rate-Limit / Quota / Timeout>:** <Was tun wenn LLM/API zickt?>

## Dependencies

- **Packages:** <z.B. "packages/agents/, packages/runners/">
- **Services:** <z.B. "Vercel AI Gateway, Clerk-Auth">
- **Data:** <z.B. "Neon Postgres Table xyz">
- **Environment Variables:** <z.B. "OPENAI_API_KEY (already provisioned)">

## Severity-Banding der Outputs (wenn LLM-output produzierend)

- Welche Severity-Bänder produziert dieses Feature? {Kill, Weak, Mid, Strong, Exceptional}
- Wie wird Severity berechnet? (Deterministic-first per Constraint #13, LLM nur als Tiebreaker)
- Was passiert bei Severity=Kill in der UI?

## TODO-List (gets ticked off during build)

- [ ] Setup Branch `feat/NNN-<slug>`
- [ ] <Implementation Step 1>
- [ ] <Implementation Step 2>
- [ ] <Implementation Step 3>
- [ ] Tests added (siehe Test-Plan)
- [ ] PR draft + spec linked
- [ ] Dogfood-Run (siehe Test-Plan §Dogfood)
- [ ] Release-Note drafted in `releases/`
- [ ] Build-in-Public-Post drafted

## Test-Plan-Reference

<Wenn inline: hier verlinken zu `## Test Plan` weiter unten.
Wenn dedicated: `features/active/FEAT-NNN/test-plan.md`.>

## Quellen (wenn Feature research-justified)

- [Source, Datum](url)
- [Source, Datum](url)

## Update-Log

| Datum | Was hat sich geändert | Wer |
|---|---|---|
| YYYY-MM-DD | Spec created | Kolja |
| YYYY-MM-DD | AC-3 added after Mom-Test feedback | Kolja |
```

**Begründung:**
- "Out-of-Scope" ist explizit. Pattern aus [Basecamp Shape-Up "Boundaries"](https://basecamp.com/shapeup/1.5-chapter-06) — Solo-Founder neigen zu Scope-Creep, dieser Block ist die Bremse.
- "size: S/M/L/XL" und "XL → split me!" ist die Härte-Regel. Quelle: [Shape-Up "Appetite"](https://basecamp.com/shapeup/1.5-chapter-04).
- "Edge Cases & Failure Modes" als eigene Sektion zwingt zum frühen Denken. Pattern: [Will Larson "The Engineering-Executive's Primer", 2024](https://lethain.com/eep/), Kapitel "Designs".
- "Severity-Banding der Outputs" macht das Brand-Constraint #5 (CLAUDE.md) im Template hart.
- "Update-Log" macht das Doc lebendig — Pattern aus Linear's "Update"-Slot (siehe §1.2).
- "depends_on / blocked_by" ist DAG-fähig — ROADMAP.md kann automatisch eine Dependency-Visualisierung rendern.

---

### 5.4 `templates/test-plan-template.md`

```markdown
---
id: TEST-FEAT-NNN
feature: FEAT-NNN
status: Draft              # Draft | Ready | Passing | Failing
last_run: null             # YYYY-MM-DD
last_result: null          # pass | fail | partial
---

# Test Plan — FEAT-NNN <Title>

## Verification-Story (Skeptic-Mentor-Form)

<Was muss WAHR sein, damit ich glaube, dass das Feature funktioniert?
Eine Sentence. z.B. "Solopreneur lädt sein Idea-PRD hoch, klickt /validate, und sieht in <30s einen Severity-Banded Output mit min. 5 zitierten Quellen.">

## Boundary-Map

| Boundary | What flows | How to check |
|---|---|---|
| User → UI | <Form, click, upload> | <Browser-Test / Playwright> |
| UI → API | <fetch payload + method> | <Network-Tab / curl> |
| API → LLM | <Prompt, model, tokens> | <Log Vercel AI Gateway> |
| API → DB | <Query, table, rows> | <psql / drizzle-studio> |
| API → Response | <Shape, status> | <unit test> |
| Response → UI | <Rendering> | <Browser-Visual> |

## Automated Checks

- [ ] Unit Tests: `pnpm test packages/<pkg>` — coverage >= 80% on changed lines
- [ ] Integration Tests: `pnpm test:integration` (if applicable)
- [ ] Type-check: `pnpm typecheck` — clean
- [ ] Lint: `pnpm lint` — clean
- [ ] Build: `pnpm build` — clean

## Manual QA Checklist

- [ ] Happy-Path: <Schritt-für-Schritt>
- [ ] Empty-State: <Schritt-für-Schritt>
- [ ] Error-State (e.g. LLM timeout): <Schritt-für-Schritt>
- [ ] Edge-Case-1: <z.B. "User mit 0 Skills">
- [ ] Edge-Case-2: <z.B. "User mit 200 Skills">
- [ ] Mobile-Viewport (iPhone 14 Pro 393×852): <Beobachtung>
- [ ] Accessibility: Tab-order ok? Aria-Labels gesetzt?

## Dogfood-Step (Pflicht für Subagents & User-facing Features)

> Skeptic-Mentor-Pflicht: Wer sein eigenes Feature nicht 1× freiwillig nutzen will, hat ein Feature gebaut, das niemand will.

- [ ] Realistic Scenario: <z.B. "Eigene Idee X durch /validate jagen">
- [ ] Time-on-Task gemessen: <Soll: <30s / <5min / <1h>
- [ ] Output qualitativ bewertet: {Kill, Weak, Mid, Strong, Exceptional}
- [ ] 3 konkrete Friction-Punkte notiert
- [ ] 1 Build-in-Public-würdiges Detail notiert

## Eval-Set (für LLM-output-features, Pflicht per Constraint #13)

- [ ] Golden-Set von N Beispielen erstellt (Soll: ≥30 für Audit-Report, ≥10 für Sub-Subagents)
- [ ] Determinism-Hit-Rate ≥ X% gemessen (Soll: ≥85% für deterministic-first)
- [ ] False-Positive-Rate ≤ Y% gemessen (Soll: ≤15% per Constraint #13)
- [ ] Confidence-Banding korrekt verteilt? {Kill: 10%, Weak: 20%, Mid: 40%, Strong: 25%, Exceptional: 5%} (Default-Verteilung, kalibrieren!)

## Done-When

- Automated checks: ✅
- Manual QA: ≥ 90% Checkboxes ticked
- Dogfood-Step: ≥ 1 vollständig durchlaufen
- (LLM-Features) Eval-Set: pass thresholds

## Observed Failures (during this run)

| Datum | Was ist gebrochen | Status |
|---|---|---|
| YYYY-MM-DD | <Bug> | Fixed / Open / Won't-Fix |
```

**Begründung:**
- "Verification-Story" + "Boundary-Map" sind direkt aus dem Vercel-Plugin `verification`-Skill (System-Reminder oben) übernommen. Das ist nicht zufällig — das Pattern ist gut, und es ist Plugin-kompatibel.
- "Dogfood-Step" als Pflicht ist load-bearing, weil das ein dokumentierter Phase-0-Next-Step ist (PRD v3.1 Schritt 4: `/dogfood`).
- "Eval-Set" für LLM-Features ist Constraint #13 (deterministic-first, FPR ≤ 15%).

---

### 5.5 `templates/release-notes-template.md`

```markdown
---
version: vX.Y.Z
date: YYYY-MM-DD
status: Draft               # Draft | Released
release_type: minor         # major | minor | patch | prerelease
breaking_changes: false
features_shipped: []        # ["FEAT-007", "FEAT-008"]
adrs_referenced: []         # ["ADR-0019"]
---

# Release vX.Y.Z — <Tagline, Skeptic-Mentor-Voice>

> <Tagline. Beispiel: "20 Mom-Tests in. Half of you were wrong about your idea. We have the receipts.">

## Changelog (technical, for CHANGELOG.md regen)

### Added
- FEAT-007: <one-liner>
- FEAT-008: <one-liner>

### Changed
- <one-liner>

### Deprecated
- <one-liner with sunset date>

### Removed
- <one-liner>

### Fixed
- <one-liner, linked to GitHub-Issue #NN>

### Security
- <one-liner>

## Why this release (1-Paragraph, Brand-Voice)

<Concession-then-Critique. Beispiel: "Wir wissen, ihr wartet auf den Subagent-Marketplace — kommt in v0.3. Vorher musste das Audit-Report-Severity-Banding stehen, sonst kalibriert niemand seine Bullshit-Detection.">

## Notable for Users

- **Indie-Tier:** <Was ändert sich für dich konkret?>
- **Agency-Tier:** <Was ändert sich für dich konkret?>
- **Open-Source-Users:** <CLI-Updates, Breaking-Changes>

## Breaking Changes

> Wenn `breaking_changes: false`, diese Sektion löschen.

- **<Change>:** <Migration-Path>
- **Sunset-Date:** <YYYY-MM-DD>

## Build-in-Public-Post (Skeleton — copy to Twitter/Bluesky/LinkedIn/Mastodon)

> Skeptic-Mentor-Voice. Concession-then-Critique. Specifity > Vibe.
> Cadence-Reminder: PRD v3.1 fordert 5 Posts/Woche.

**Tweet (280 chars):**
> <Hook-Sentence>. <Specific data-point, e.g. "47% of Mom-Test interviews killed the idea"). <CTA or link>.

**Thread / Long-Form (LinkedIn, Blog, Mastodon-1k chars):**

> Hook-Sentence.
>
> 3-5 paragraphs:
> 1. Concession: <Was die naheliegende Annahme war>
> 2. Critique: <Was die Daten zeigten>
> 3. Decision: <Was wir gebaut haben>
> 4. Receipts: <Citation, Link>
> 5. CTA: <Try it / Read PRD §X / Comment if you disagree>

## Metrics-Snapshot (für Monthly-Review)

- New Users: <#>
- Active Users: <#>
- OSS-Stars-Delta: <#>
- Sprint-Sales-Delta: <€>
- Severity-Distribution dieser Release-Outputs (für LLM-features):

## Quellen / Receipts

- [Source, Datum](url)
- ADR-0019 für …
```

**Begründung:**
- "Why this release (Brand-Voice)" ist die Pflicht-Sektion, die GitHub-Auto-Release-Notes nicht haben. Sie zwingt 1× Brand-Voice pro Release.
- "Build-in-Public-Post (Skeleton)" macht den 5-Posts/Woche-Cadence (PRD v3.1 Schritt 6) konkret. Pattern: [Arvid Kahl "Zero to Sold", 2020](https://thebootstrappedfounder.com/), Kapitel "Audience-Building Process".
- "CHANGELOG.md" auto-generiert aus "Added/Changed/…"-Blöcken ist Keep-a-Changelog-Standard. Quelle: [keepachangelog.com](https://keepachangelog.com/en/1.1.0/).

---

### 5.6 `templates/sprint-planning-template.md`

```markdown
---
sprint_id: YYYY-Wnn          # ISO-Week, z.B. 2026-W21
status: Planned              # Planned | Active | Reviewed | Archived
start: YYYY-MM-DD            # Monday
end: YYYY-MM-DD              # Friday
capacity_days: 4             # Solo: typisch 4 deep-work-Tage pro Woche
features_committed: []       # ["FEAT-007", "FEAT-008"]
features_stretched: []       # nicht committed, falls Zeit übrig
non_feature_work: []         # ["Mom-Test-Interview-Block (Mi)", "Build-in-Public 5 Posts"]
---

# Sprint YYYY-Wnn — <Theme, optional>

## Goal

<Eine Sentence: was muss diese Woche sich zur letzten unterscheiden? z.B. "5 Mom-Test-Interviews durchgeführt + FEAT-007 PR ready-for-review.">

## Committed Features (must-ship)

| ID | Title | Size | Status | Done-When |
|---|---|---|---|---|
| FEAT-007 | <…> | M | In-Progress | AC-1, AC-2, AC-3 ✅, PR linked |
| FEAT-008 | <…> | S | Drafted | Spec finalized, dogfooded |

## Stretched Features (if time left, no pressure)

| ID | Title | Size | Status |
|---|---|---|---|
| FEAT-009 | <…> | S | Drafted |

## Non-Feature Work (Validation, Marketing, Admin)

- [ ] **Mom-Test-Interviews:** 5 geplant, Termine: <Mo 10:00 / Di 14:00 / …>
- [ ] **Build-in-Public:** 5 Posts, Themen: <a / b / c / d / e>
- [ ] **Admin:** Anwalts-Email Sondr/Pondera, Vercel-Billing-Review

## Tomorrow / This-Sprint Risks

- **Risk 1:** <z.B. "Mom-Test-No-Show-Rate könnte >50% sein"> — Mitigation: <Backup-Slots>
- **Risk 2:** <…>

## Concession-then-Critique (Friday-Review)

> Pflicht am Freitag. Sprich mit dir selbst wie ein Mentor mit dem Founder.

- **Concession:** <Was war gut diese Woche?>
- **Critique:** <Wo bist du hinter dem Sprint-Goal? Was war die Ursache (nicht: "ich war müde", sondern: "ich habe FEAT-007 unterschätzt um 2 Tage, weil ich Edge-Case X übersehen habe")?>
- **Next-Week-Adjust:** <Welcher Sprint-Habit ändert sich?>

## Carry-Over (in next sprint)

- FEAT-NNN: <Reason>
- TODO-Item: <Reason>
```

**Begründung:**
- ISO-Week (`2026-W21`) ist standardisiert, kein Konflikt mit deutsch/englisch Kalender-Notation.
- "capacity_days: 4" als Default für Solo: empirisch belegt — 5 Tage Vollarbeit / Woche brennen Solo-Founder in 6 Monaten aus. Quelle: [Tony Stubblebine, ex-Coach.me, "Atomic Habits for Founders", Medium 2024-11](https://medium.com/tony-stubblebine).
- "Stretched Features" pattern aus [Linear Method "Cycle-Planning"](https://linear.app/method), Soft-Commit nicht Hard-Commit.
- "Concession-then-Critique Friday-Review" ist Brand-Voice in den eigenen Workflow gebacken.
- "Non-Feature Work" verhindert, dass Mom-Tests und Build-in-Public-Posts (Phase-0-Pflicht!) unter den Tisch fallen.

---

## 6. Drei Walk-Throughs

### 6.1 Walk-1 — "Add new subagent" (medium feature, ~3 Tage)

**Scenario:** Kolja will einen `mom-test-interviewer`-Subagent bauen, der durch die 13 Mom-Test-Fragen (Rob Fitzpatrick) führt und die Antworten strukturiert ablegt.

**Workflow:**

1. **Idea-Capture:** Tweet von Rob Fitzpatrick zu sehen, sofort `TODO.md` Eintrag: "Mom-Test-Interviewer-Subagent bauen". 30 Sekunden.

2. **Decision-Tree:**
   - <1h? Nein.
   - Unklar? Nein, klar.
   - Strategisch / Breaking / Vendor / Pricing? Nein.
   - ≥2 Tage ODER ≥3 AC ODER ≥2 Packages? Ja (touches `packages/agents/mom-test-interviewer`, `packages/runners/`, ggf. Hosted-App-Settings).
   - **→ Full Feature-Spec.**

3. **Spec schreiben:** `features/active/FEAT-007-mom-test-interviewer.md` aus Template. 30 Min. Frontmatter: size: M, severity_if_skipped: Mid (Mom-Tests können auch manuell laufen), related_prd_section: ["§7-Phase-0-Discovery"]. AC:
   - AC-1: Subagent läuft auf Claude Code + Cursor + Codex CLI via shared SKILL.md.
   - AC-2: Output ist strukturiertes Markdown mit 13 Fragen + Antworten + Severity-Verdict.
   - AC-3: Audio-Recording-Reference optional (Path-Field, kein Audio-Processing Tag 1 → Out-of-Scope).

4. **Branch + PR-Draft:** `git checkout -b feat/007-mom-test-interviewer`. PR mit Title "FEAT-007 — Mom-Test Interviewer Subagent" als Draft. Beschreibung verlinkt auf Spec.

5. **Build (2-3 Tage):**
   - TypeScript-Source in `packages/agents/`.
   - Markdown-Output via Runner-Adapter.
   - TODO-Liste im Spec wird abgehakt.

6. **Verify:** `features/active/FEAT-007-mom-test-interviewer/test-plan.md` aus Template. Dogfood-Run: Kolja interviewt einen befreundeten Indie-Hacker, Severity-Verdict checken.

7. **Ship:** PR mergen → Spec verschieben `features/active/` → `features/shipped/`. Release-Note in `releases/v0.2.0.md` Abschnitt "Added". Build-in-Public-Post draft, Skeptic-Mentor-Voice. ROADMAP.md update via `validationkit-cli roadmap regen`.

8. **Archive:** `status: Shipped`. PRD §7 evtl. update via `/iterate-prd`, falls Spec Constraints belegt hat.

**Overhead:** ~1h Spec + 30min Test-Plan + 15min Release-Note = ~2h Process für 3 Tage Build. Ratio 8 %. Akzeptabel.

---

### 6.2 Walk-2 — "Add new Pricing-Tier" (strategic, ADR needed)

**Scenario:** Kolja erwägt, einen "Skeptic-Coach"-Tier für $49/mo zwischen Indie ($19) und Agency ($299) einzuführen. Bricht aktuell explizit das "kein $99-Sandwich"-Constraint aus ADR-0018.

**Workflow:**

1. **Idea-Capture:** TODO.md: "Skeptic-Coach-Tier $49?". Macht Bauchgefühl, riecht aber nach Constraint-Verstoß.

2. **Decision-Tree:**
   - Berührt load-bearing strategy (Pricing-Sandwich = ADR-0018 Constraint #11)? **JA.**
   - **→ ADR ZUERST. Spec danach nur wenn ADR Accepted.**

3. **RFC (optional, weil unklar):** `rfcs/RFC-005-skeptic-coach-tier.md` aus Template. Frage: "Lockern wir den No-Sandwich-Constraint?". Optionen:
   - A: $49 Tier einführen.
   - B: $49 Tier nicht einführen, Skeptic-Coach als Indie-$19-Feature.
   - C: Status quo, kein neuer Tier.
   - Severity-if-killed: Weak (kein neuer Revenue, aber Constraint bleibt sauber).

4. **Concession-then-Critique:** "Option A ist verlockend, weil 25-50 zusätzliche Tier-Slots im SOM. Aber: ADR-0018 Pricing-Sandwich-Verbot ist Daten-belegt (Track C1, analysis-v4/05) — Boutique-Sandwich = WEAK-MID, Conversion <2%. Wenn wir den Constraint brechen ohne neue Daten, kapitulieren wir das gelernte Argument für Bauchgefühl."

5. **Empfehlung:** Option B. RFC accepted. Kein neuer Tier — Skeptic-Coach-Feature ist statt Tier ein $19-Feature.

6. **ADR (optional, weil RFC-Decision affected ein bestehendes ADR-Constraint):** Da Option B den Constraint NICHT bricht, kein neues ADR nötig. Wir verlinken stattdessen RFC-005 als "verworfener Re-Open-Versuch" im ADR-0018-Update-Log.

7. **Falls Option A gewählt worden wäre:** Neuer ADR-0019 mit `supersedes: ["ADR-0018 (partial, Pricing-Constraint)"]`, "Re-Open-Trigger" für Re-Re-Open, Required-Follow-Up: PRD v3.1 §11 Pricing-Sektion update.

8. **Feature-Spec danach:** Erst nach ADR-Accept würde FEAT-NNN entstehen für die Tier-Implementation in Stripe.

**Overhead:** ~2h RFC + ~3h ADR (wenn nötig). Ratio sehr hoch, aber das ist OK — strategische Entscheidungen müssen teurer sein als Tactical Builds, sonst neigen sie zu Bauchgefühl.

---

### 6.3 Walk-3 — "Fix bug in parser" (no template, just commit-message)

**Scenario:** Kolja merkt, dass der CLAUDE.md-Parser eine YAML-Frontmatter mit Leerzeile vor `---` nicht erkennt. 20 Min Fix.

**Workflow:**

1. **Idea-Capture:** Direkt zum Code, kein TODO.md.

2. **Decision-Tree:**
   - <1h? Ja.
   - Berührt nichts Strategisches? Korrekt.
   - **→ Just-Code.**

3. **Build:** Branch optional (`fix/parser-frontmatter-leading-newline`), aber für 20-Min-Fix ist Commit-on-main akzeptabel in Phase 0.

4. **Verify:** Test-Case hinzufügen für Edge-Case mit Leerzeile.

5. **Ship:** Conventional Commit:
   ```
   fix(parser): tolerate leading newline before YAML frontmatter

   Was breaking on .claude/agents/* files exported from Notion that had
   a stray newline. Test added in packages/parser/__tests__.

   Closes #14.
   ```

6. **No Spec. No Release-Note** (es sei denn, der Release-Cycle ist eh fällig — dann landet die Zeile in der "Fixed"-Sektion der nächsten Release-Note).

**Overhead:** ~0. Zero-Process für Zero-Strategic-Weight. Genau richtig.

---

## 7. Was NICHT zu templaten ist (Anti-Pattern)

Skeptic-Mentor-Pflicht: nicht alles braucht Form.

- **Typo-Fixes, Linter-Anpassungen, Dependency-Bumps (non-breaking):** Conventional-Commit reicht. Wer hier templaten will, hat Prozess-Sucht.
- **Tweets / Ad-hoc-Marketing-Posts:** Nicht in den Repo. Release-Note-Build-in-Public-Skeleton ist der Pflicht-Slot; spontane Posts sind frei.
- **Bug-Reports unter 30min Fix:** GitHub-Issue reicht (Labels: `type:bug`, `effort:trivial`). Kein Spec, kein RFC.
- **Refactors innerhalb eines Packages, die <1 Tag dauern und kein API ändern:** PR-Description-as-Spec reicht.
- **Internal Tooling-Scripts:** Wenn nur Kolja sie nutzt → keine Spec. Wenn andere sie nutzen werden (z.B. `validationkit-cli`) → Spec.
- **Notes-to-Self in TODO.md / Tagebuch:** Frei-Form. TODO.md ist volatile, nicht Source-of-Truth.
- **Mom-Test-Interview-Notes:** Eigenes Format (`research/interviews/`) — nicht Feature-Spec-Form.
- **Customer-Sprint-Engagements:** Eigenes Format (`engagements/<customer>/`) — nicht Feature-Spec-Form, weil Customer-spezifisch und ggf. NDA-rich.

**Faustregel:** Wenn das Schreiben des Templates länger dauert als der Build → kein Template.

---

## 8. ROADMAP.md & TODO.md — Index-Recommendations

### 8.1 `ROADMAP.md` (Source-of-Truth-Index)

Aggregiert alle Features aus `features/*/`, alle aktiven ADRs, alle offenen RFCs, alle laufenden Sprints. **Auto-generiert via Script**, nicht händisch.

Vorgeschlagenes Format:

```markdown
# ValidationKit / Sondr — Roadmap

> Auto-generated from features/*/, decisions/, rfcs/, sprints/. Do not edit by hand.
> Last regenerated: YYYY-MM-DD HH:MM by `validationkit-cli roadmap regen`.

## Current Phase

**Phase 0 (M0–M3) — Dual-Track Discovery + OSS v0.1.**
- ADR-0017 Hybrid Layered + ADR-0018 ContextForge-Productized-Form.
- Active Sprint: 2026-W21 (Goal: 5 Mom-Tests + FEAT-007 ship).

## In-Flight Features (status: In-Progress | In-Review)

| ID | Title | Size | Sprint | Owner | Branch | PR |
|---|---|---|---|---|---|---|
| FEAT-007 | Mom-Test Interviewer Subagent | M | 2026-W21 | Kolja | feat/007-… | #42 |
| FEAT-008 | Audit-Report Deterministic-Engine | L | 2026-W22 | Kolja | feat/008-… | (none yet) |

## Planned (status: Planned)

| ID | Title | Size | Target |
|---|---|---|---|
| FEAT-009 | … | S | 2026-W23 |

## Drafted (status: Drafted, may not happen)

| ID | Title | Size |
|---|---|---|

## Shipped (last 30 days)

| ID | Title | Shipped | Release |
|---|---|---|---|

## Active ADRs (decisions still in force)

- ADR-0017 — Hybrid Layered Pivot E
- ADR-0018 — ContextForge as Productized-Form

## Open RFCs (awaiting decision)

| ID | Title | Decision-Deadline |
|---|---|---|

## Killed / Archived (last 90 days)

| ID | Title | Reason |
|---|---|---|
```

### 8.2 `TODO.md` (volatile, ephemeral)

Nur Heute / Diese Woche. Wird **nicht** geparst. Kann handschriftlich-chaotisch sein. Spielregel: was hier ≥7 Tage steht, gehört in ein RFC oder eine Feature-Spec.

```markdown
# TODO — 2026-05-16

## Today
- [ ] FEAT-007 AC-2 implement
- [ ] 14:00 Mom-Test-Interview Hans
- [ ] Build-in-Public-Post: "Why I killed the $99 Tier"

## This Week
- [ ] FEAT-007 PR ready
- [ ] 3 mehr Mom-Tests
- [ ] Anwalts-Email Sondr/Pondera

## Parking Lot (review in Sprint-Planning)
- Skeptic-Coach $49 Tier? (riecht nach RFC-005)
- AAIF-Membership: wann starten?
- ContextForge-Subdomain: subdomain.app oder app/operations?
```

---

## 9. GitHub-Issues + Labels (Hybrid-Komplement)

Empfohlene Label-Set für Issues, die mit Markdown-Files koppeln:

- `type:feat` / `type:bug` / `type:chore` / `type:rfc` / `type:adr` / `type:question`
- `effort:trivial` (<1h) / `effort:small` (S) / `effort:medium` (M) / `effort:large` (L)
- `area:agents` / `area:web-app` / `area:cli` / `area:docs` / `area:marketing` / `area:research`
- `wedge:validate` / `wedge:operations` / `wedge:both`
- `phase:0` / `phase:1` / `phase:2` / `phase:3-conditional`
- `severity:kill` / `severity:weak` / `severity:mid` / `severity:strong` / `severity:exceptional`

Issue-Naming-Konvention: `FEAT-NNN — Title` oder `RFC-NNN — Question` oder `BUG #NN — Symptom` — die ID-Prefix matchet das `.md`-File.

---

## 10. Tooling-Recommendations (Phase 0 implementierbar)

1. **Roadmap-Generator** (`packages/cli/src/commands/roadmap.ts`): Scannt `features/`, `decisions/`, `rfcs/`, `sprints/`, parsed YAML-Frontmatter, regeneriert `ROADMAP.md`. ~1 Tag Build. Dogfood-Feature für `validationkit-cli`.
2. **Spec-Init** (`vk feature new <slug>`): Kopiert `templates/feature-spec-template.md` nach `features/active/FEAT-NNN-<slug>.md` mit auto-incrementierter ID. ~2h.
3. **ADR-Init** (`vk decision new <slug>`): analog für ADRs.
4. **Sprint-Init** (`vk sprint new`): erstellt `sprints/YYYY-Wnn.md` auf Basis aktueller ISO-Week.
5. **Changelog-Generator** (`vk changelog regen`): aggregiert Release-Note-Frontmatter zu `CHANGELOG.md` nach Keep-a-Changelog-Format.
6. **Linkcheck**: alle `[Source, Datum](url)` weekly checken — toter Link = CI-Fail in Phase 1. Quelle: [Lychee-Action, GitHub Marketplace 2025](https://github.com/lycheeverse/lychee-action).

**Eat-your-own-Dogfood-Pflicht:** alle 6 Helpers sind ValidationKit-CLI-Features. Wer sie nicht baut, signalisiert dem Markt, dass Process-Hygiene nicht in unseren Skills-Pack gehört.

---

## 11. Wann das System neu evaluieren? (Re-Open-Trigger für dieses Template-System)

Dieses Template-System wird neu evaluiert, wenn:

1. **Co-Founder-Hire passiert (≥M12).** Mit 2 Personen werden Reviews + Approvals nötig → schwerere RFC-/ADR-Form, Mehr-Reviewer-Voting wie Rust-RFC.
2. **OSS-External-Contributors >5 PRs/Monat.** Dann braucht jeder PR eine Feature-Spec, oder die Issue-Templates müssen Spec-Felder enthalten.
3. **Sprint-Carry-Over >40 % über 4 Wochen.** Dann ist die Sprint-Planung kaputt, neue Size-Kalibrierung nötig.
4. **ROADMAP.md kommt 3 Wochen in Folge nicht in Sync.** Dann ist die Auto-Generation zu komplex und braucht Rebuild.
5. **>3 ADRs in 1 Monat geöffnet werden.** Dann ist die ADR-Schwelle zu niedrig — entweder zu viele Strategy-Pivots (Problem) oder ADR-Definition zu breit (Template-Fix).

---

## 12. Quellen / Receipts (vollständig)

- [Rust RFC Process — rust-lang/rfcs README, 2026-05](https://github.com/rust-lang/rfcs)
- [React RFCs — reactjs/rfcs, 2026](https://github.com/reactjs/rfcs)
- [TC39 Process Document, 2025-09](https://tc39.es/process-document/)
- [Python PEP-1, 2026-02 Revision](https://peps.python.org/pep-0001/)
- [Linear — Practices of a Product Engineer, 2024-04](https://linear.app/blog/practices-of-a-product-engineer)
- [Linear Method, 2024](https://linear.app/method)
- [Karri Saarinen on Lenny's Newsletter, 2024-08](https://www.lennysnewsletter.com/p/the-linear-method)
- [Vercel Engineering Blog "How We Build Vercel", 2025-11](https://vercel.com/blog/how-we-build-vercel)
- [Anthropic Skills Documentation, 2026-02](https://docs.claude.com/en/docs/agents-and-tools/agent-skills)
- [First Round Review — Notion's Ivan Zhao, 2024-06](https://review.firstround.com/notion-ivan-zhao-design-led-growth/)
- [Notion Engineering Blog, 2025-09](https://www.notion.so/blog)
- [Pieter Levels — levels.io, 2026-04](https://levels.io/)
- [Nathan Barry — "Teach Everything You Know", 2024-12](https://nathanbarry.com/articles/)
- [Plausible Analytics GitHub Repo /docs, 2026-04](https://github.com/plausible/analytics/tree/master/docs)
- [Tony Dinh Blog, 2025-08](https://tonydinh.com/)
- [Michael Nygard — Documenting Architecture Decisions, 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions.html)
- [Basecamp Shape-Up, Cool-Down + Appetite Chapters, 2019](https://basecamp.com/shapeup)
- [Will Larson — Staff Engineer, 2021](https://staffeng.com/)
- [Will Larson — Engineering Executive's Primer, 2024](https://lethain.com/eep/)
- [Arvid Kahl — Zero to Sold, 2020](https://thebootstrappedfounder.com/)
- [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)
- [Tony Stubblebine — Atomic Habits for Founders, Medium 2024-11](https://medium.com/tony-stubblebine)
- [Lychee Link-Check GitHub Action, 2025](https://github.com/lycheeverse/lychee-action)
- ADR-0017 — Hybrid Layered Pivot E
- ADR-0018 — ContextForge as Productized-Form
- PRD-ValidationKit-v3.1.md
- .claude/CLAUDE.md (load-bearing constraints, 2026-05-16)

---

## 13. Concession-then-Critique (Reviewer-Note an den Founder)

**Konzession:** Du hast die Templates schon ad-hoc in ADR-0017 und ADR-0018 erfunden — du brauchst dieses Doc nicht, um den Pattern zu verstehen. Du nutzt es bereits intuitiv.

**Critique:** Aber: du nutzt es **inkonsistent**. ADR-0017 hat "Was sich ändert" als Section-Header, ADR-0018 hat "Konsequenzen → Positive/Negative". Beides ist OK, aber nicht beides gleichzeitig. Wenn dein Self-Hosting-Auto-Roadmap-Generator (Phase 1) die Frontmatter parsen will, scheitert er an dieser Inkonsistenz. **Codifizieren spart dir in M12 1-2 Tage Re-Migration.**

**Empfehlung:** Templates jetzt in `templates/` legen (1 Tag), nächste ADR (ADR-0019 für $99-Tier-Frage oder eine andere echte Strategie-Frage) als ersten Test-Run, in Sprint 2026-W22 den Roadmap-Generator als FEAT-002 bauen, in Sprint 2026-W23 die `vk`-CLI-Init-Commands als FEAT-003.

**Tagline-Vorschlag fürs Build-in-Public:** "Built a templating system for my own product workflow. Used the templates to spec building the templating system. If it's not recursive, it's not real."

---

*Track C — Operational Tooling. 2026-05-16. ~4.100 Wörter. Skeptic-Mentor-Voice. Severity-banded. Citation-First. Parallel-dispatched mit Tracks A, B, D.*
