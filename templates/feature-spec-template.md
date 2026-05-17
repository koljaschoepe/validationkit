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
related_prd_section: []      # z.B. ["§6.1", "§6.2"]
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
- **Services:** <z.B. "Better-Auth, Postgres-Docker">
- **Data:** <z.B. "Postgres Table xyz">
- **Environment Variables:** <z.B. "ANTHROPIC_API_KEY (already provisioned)">

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
