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

- `docs/research/vX/NN-*.md`
- `docs/decisions/NNNN-*.md`
- `docs/PRD.md` §X

---

*Skeptic-Mentor-Konzession+Critique-Pattern. Datums-Stempel YYYY-MM-DD. Verdict basiert auf <X-Source-Quellenzahl>.*
