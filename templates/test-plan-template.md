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
| API → LLM | <Prompt, model, tokens> | <Anthropic-SDK log> |
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
