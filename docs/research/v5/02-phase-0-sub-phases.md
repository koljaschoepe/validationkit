# Phase 0 Sub-Phases — Week-by-Week Plan (M0–M3, 13 Weeks)

**Document ID:** `docs/research/v5/02-phase-0-sub-phases.md`
**Stand:** 2026-05-16
**Track:** v5-Refactor, Research-Track B (operational planning)
**Anchor:** PRD-ValidationKit-v3.1 §31 (12 macro-deliverables) + ADR-0017 + ADR-0018
**Mode:** Hardcore-Local-Only. Solo. 20–30 h/Woche. Keine Käufe, keine SaaS-Signups, kein Domain-Buy, kein npm-Publish bis Phase-0-Gate.

---

## 0. Top-Level-Synthese (Read first, 2 min)

Phase 0 hat ein **einziges harte Ziel**: das **Phase-0-Gate** (5 Agency-LOIs + 20 Mom-Tests + OSS v0.1 lauffähig auf dem Laptop) zum Ende von Woche 13 erreichen. Alles andere ist subordinated.

Drei load-bearing Sequencing-Entscheidungen (aus Research begründet, siehe §10):

1. **Mom-Tests starten Woche 1, NICHT nach Parser-Build.** Pieter-Levels-Pattern ("daily customer contact from Day 1", [softwareseni](https://www.softwareseni.com/building-in-public-the-10-year-distribution-strategy-behind-solo-founder-revenue/)) + Lonely-Entrepreneur-90-Day-Framework ([blog.lonelyentrepreneur.com](https://blog.lonelyentrepreneur.com/your-first-90-days-as-a-solo-founder-stay-sane)) sagen einstimmig: Customer-Contact ist ein täglicher Reflex, kein Feature. Wenn du erst Code baust und dann Interviews machst, hast du einen geriskten Build mit 5 Mom-Tests im letzten Drittel.
2. **30-File-Golden-Set VOR Audit-Report-Code.** Direkt aus PRD §33.5 D2-Empfehlung. Eval-First-Pattern.
3. **Validation-Handbook + Operations-Playbook iterativ aus Engagement-Learnings, nicht upfront.** Solo-Pattern aus Pieter-Levels-Retrospectives + Indie-Hackers-Threads: Upfront-Doc-Writing ist Procrastination ("solo-founder procrastination trap", [Lenny](https://www.lennysnewsletter.com/p/community-wisdom-beating-the-solo)). Du schreibst aus echten Interview-Quotes, nicht aus dem Kopf.

Die Phase ist in **5 Sub-Phasen** geclustert (jeweils 2–3 Wochen), nicht 13 isolierte Wochen — das matched Cognitive-Load-Limits und gibt natürliche Retro-Punkte.

---

## 1. Sub-Phase-Cluster (5 Cluster × 2–3 Wochen)

| Cluster | Wochen | Theme | Gate at End |
|---|---|---|---|
| **C1: Foundation & First Contact** | W1–W2 | Ground-Set-up, Golden-Set, erste 2 Mom-Tests | 2 Interviews abgeschlossen, Golden-Set 30 Files inventarisiert, GitHub-Org reserviert |
| **C2: Parser & Mom-Test-Velocity** | W3–W5 | 12-Format-Parser-MUST-5 + 4 Mom-Tests/Wo-Average + Dogfood-Lite | Parser MUST-5 funktioniert, 8 Mom-Tests total, eigene-Idee durch Parser gelaufen |
| **C3: Agency-Discovery-Wave + OSS v0.1** | W6–W8 | 10 Agency-Discovery-Interviews konzentriert + GitHub-App-Mitigations-Spec + Audit-Report-Code | 6 Agency-Interviews, 2 GitHub-App-Mitigations PD, OSS v0.1-CLI installierbar |
| **C4: Engagement-Sales + LOI-Push** | W9–W11 | 2 Validation-Engagements abgeschlossen + 5 LOI-Conversion-Push + Handbook v0 + Playbook v0 | 2 Engagements done (Cash), 3–4 LOIs signed, Handbook 60% draft |
| **C5: Gate-Close + Phase-1-Setup** | W12–W13 | Letzte LOIs, Phase-0-Retro, Naming-Prep, Phase-1-Plan | 5 LOIs erreicht ODER Gate-Fail-Branch aktiviert, Phase-1-Kickoff-Doc geschrieben |

---

## 2. Week-by-Week Table

Jede Woche: **Hard Deliverables** (binär abhakbar), **Soft Goals** (nicht-binär aber tracked), **Hours-Budget** (20–30 h, davon ~3 h Build-in-Public-fixed), **Build-in-Public-Topic-Hint** (was diese Woche natürlich postable ist).

### **Week 1 — Foundation (Cluster C1)**

- **Hours:** 25 h (10 h Setup, 8 h Golden-Set-Inventar, 4 h Interview-Pipeline, 3 h Build-in-Public)
- **Hard Deliverables:**
  1. GitHub-Org `validationkit-ai` reserviert (kostenlos, sofort).
  2. Local-Monorepo Skeleton `pnpm + turborepo` mit `packages/agents/`, `packages/runners/`, `packages/cli/`, `apps/web/` (placeholder), `eval/` Ordner steht.
  3. **30-File-Golden-Set inventarisiert** (Liste, noch nicht annotiert): 10 Files aus eigenen Repos + 10 von public-OSS-Repos (Anthropic-Cookbook, Claude-Code-Examples, Cursor-Docs) + 10 von Mom-Test-Recruiting-Targets (sofern öffentlich).
  4. **Mom-Test-Recruiting-Pipeline:** 30 DACH-Indie-Hacker-Namen + Kontakt-Kanal-Mapping (Twitter/X-DM, IndieHackers-DM, Discord-Server-Memberships) in einem lokalen `recruitment.md`.
  5. Erste **2 Outreach-Messages** verschickt (Mom-Test-konform: kein Pitch, just "10 min about your last side-project failure").
- **Soft Goals:** Interview-Question-Skript (8–12 Fragen) finalisiert; CLAUDE.md im Repo aktuell.
- **Build-in-Public-Topic:** "Day 1 of building in public. Here's the constraint: solo, 20h/week, 13 weeks. Here's what's NOT in scope." (Public-commitment-effect, [softwareseni](https://www.softwareseni.com/building-in-public-the-10-year-distribution-strategy-behind-solo-founder-revenue/))
- **Anti-Pattern-Warning:** Nicht versuchen, am Parser zu coden bevor Recruitment-Pipeline läuft. Recruitment hat 5–10-Tage-Lead-Time, Code-Velocity ist linear.

### **Week 2 — First Interviews + Golden-Set-Annotate**

- **Hours:** 28 h (6 h Interviews + Notes, 12 h Golden-Set-Annotate, 4 h Outreach-Round-2, 3 h BiP, 3 h Catch-up)
- **Hard Deliverables:**
  1. **2 Mom-Test-Interviews abgeschlossen** und im standardisierten Markdown-Template transkribiert (`interviews/2026-05-XX-name.md`).
  2. **30-File-Golden-Set vollständig annotiert** — pro File: Format-Type, Token-Count, expected Parser-Output (manual Reference). Das wird die Eval-Suite.
  3. 6 weitere Mom-Test-Outreach-Messages raus (Pipeline-Build).
  4. **Phase-0-Tracking-Dashboard** als simple Markdown-File (`STATUS.md`) am Repo-Root: Mom-Tests-Count, Agency-Tests-Count, LOI-Count, Engagement-$ — manuell gepflegt.
  5. Validation-Handbook-Skeleton: 8 Kapitel-Titel + 1-Satz-Description, *keine Inhalte* (Anti-Procrastination).
- **Soft Goals:** Erste BiP-Reactions tracken; ggf. 1–2 Reply-Threads engagen.
- **Build-in-Public-Topic:** "Conducted my first 2 Mom-Test interviews. Quote that hit hardest: '[…]'. Here's what's different about how I run these."
- **Anti-Pattern-Warning:** Nicht alle Interviews diese Woche packen wollen. 1–2 pro Woche ist nachhaltige Cadence (Indie-Hackers-Konsens, [indiehackers.com/post/how-to-scale-customer-interviews](https://www.indiehackers.com/post/how-to-scale-customer-interviews-f5606e2255)).

### **Week 3 — Parser-Sprint Begin (Cluster C2)**

- **Hours:** 30 h (15 h Parser-Code, 6 h Interviews, 3 h BiP, 6 h Buffer)
- **Hard Deliverables:**
  1. **Parser MUST-5 — Format 1 + 2 implementiert:** `CLAUDE.md + .claude/` und `.cursor/rules/*.mdc`-MVP (siehe PRD §33.4). Inkl. Frontmatter + Token-Count.
  2. **2 weitere Mom-Tests** abgeschlossen (Running Total: 4).
  3. Parser läuft gegen Golden-Set Files 1–10, Output gegen manuelle Reference verglichen — **erstes Eval-Run-Log** in `eval/run-2026-05-XX.md`.
  4. Erste Mom-Test-Quote-Mining-Session: 3 verbatim Quotes pro abgeschlossenem Interview in `quotes.md` extrahiert — Material für Handbook.
- **Soft Goals:** Parser-Architecture-Decision dokumentiert in `decisions/` (welcher TS-AST-Parser, welche Cache-Strategie).
- **Build-in-Public-Topic:** "Built the first 2 parsers. Hot take: CLAUDE.md is the easy one. .cursor/rules/*.mdc has 4 activation modes and it's a nightmare. Here's the diff."
- **Anti-Pattern-Warning:** Nicht in dieser Woche alle 5 MUST-Parsers angehen wollen — solo + 30h = 2 parsers/Woche realistisch.

### **Week 4 — Parser Continue + Dogfood-Lite**

- **Hours:** 28 h
- **Hard Deliverables:**
  1. **Parser MUST-5 — Format 3 + 4 implementiert** (AGENTS.md, GEMINI.md oder gewählte Reihenfolge).
  2. **Dogfood-Lite:** Eigene aktuelle Side-Projekt-Idee (Sondr-Re-Brand-Research o.ä.) durch den Parser-Stand-jetzt gelaufen, Output kommentiert ("was fehlt? was nervt?") — `dogfood/2026-05-XX-self-run.md`.
  3. **2 weitere Mom-Tests** abgeschlossen (Running Total: 6).
  4. **Parser-Eval-Coverage:** Golden-Set Files 1–15 evaluated.
- **Soft Goals:** First-Pass-Identification von Phase-1-Risiken aus Mom-Tests (Pattern-Erkennung).
- **Build-in-Public-Topic:** "Ran my own product against my own idea. Found 3 things that are wrong. Here's #1." (Authentic-Dogfooding, [Indie Hackers-Thread](https://www.indiehackers.com/post/do-you-dogfood-your-product-5b32a281f1) — "earliest possible is correct timing".)
- **Anti-Pattern-Warning:** Dogfood ist Diagnose, nicht "Validation". Wenn dein Parser dein eigenes Repo nicht parst → nicht beschönigen, fix or skip-and-doc.

### **Week 5 — Parser MUST-5 Close + Mom-Test Mid-Check**

- **Hours:** 30 h
- **Hard Deliverables:**
  1. **Parser MUST-5 Format 5 implementiert** — alle 5 MUST-Parsers green gegen Golden-Set 1–25.
  2. **2 weitere Mom-Tests** (Running Total: 8 — auf Track zum 20er-Ziel).
  3. **Mid-Phase-0-Retro** geschrieben (`retros/2026-XX-XX-mid-phase-0.md`): Was lief schneller als geplant? Was langsamer? Welcher Pattern aus Mom-Tests kristallisiert sich? Re-Calibrate Hours-Budget für C3.
  4. **GitHub-App-Mitigation #1 spec'd** (NICHT implementiert — nur Spec): JWT-rotated-keys (1.5 PD) als ADR (PRD §33.6).
- **Soft Goals:** Erste Hypothese welche Mom-Test-Pattern in Validation-Handbook-Kapitel landen.
- **Build-in-Public-Topic:** "5 Parsers done, 8 Mom-Tests done. Here's the Q1-mid retro — what surprised me, what I'd cut, what I'd add."
- **Anti-Pattern-Warning:** Mid-Retro nicht skippen wegen "kein Bock". Wenn Retro skippt, eskaliert Drift in C3.

### **Week 6 — Agency-Discovery-Wave Start (Cluster C3)**

- **Hours:** 28 h (8 h Agency-Outreach + 2 Interviews, 12 h Audit-Report-Code, 3 h BiP, 5 h Indie-Mom-Tests)
- **Hard Deliverables:**
  1. **15 Agency-CEO-Targets** mit Anthropic-Partner-Public-Listings + DACH-AI-Consultancy-Directory-Scrape (manual) in `agency-recruitment.md`.
  2. **5 Agency-Outreach-Messages** verschickt (Mom-Test-konform plus konkrete "wir haben kein Tool, wir wollen Insights, 30 min").
  3. **Erste 2 Agency-Discovery-Interviews** abgeschlossen.
  4. **Audit-Report-Code v0.1** begonnen — operiert AUF dem fertigen Parser-Output, schreibt erste Severity-Bänder-Logik. Eval gegen Golden-Set 1–10.
  5. **1 Indie-Mom-Test** (Running Total: 9).
- **Soft Goals:** Differential-Voice-Test: Agency-Founder antworten anders als Indie-Founder — Notes in `voice-diff.md`.
- **Build-in-Public-Topic:** "Started agency-side discovery. First interview: AI consultancy ($500k/yr, 4 ppl). They had 0 tooling for X. Here's what they do today instead."
- **Anti-Pattern-Warning:** Nicht in dieser Woche schon LOIs pushen. Discovery first, LOIs in C4 (W9–W11). LOI-Push-Too-Early = nicht-qualifiziertes Nein.

### **Week 7 — Agency-Wave Continue + GitHub-App-Mitigations Start**

- **Hours:** 30 h
- **Hard Deliverables:**
  1. **2 weitere Agency-Discovery-Interviews** (Running Total Agency: 4).
  2. **2 Indie-Mom-Tests** (Running Total Indie: 11).
  3. **GitHub-App-Mitigation #1 implementiert** (JWT-rotation): 1.5 PD spread über die Woche, in `packages/integrations/github-app/`.
  4. **GitHub-App-Mitigation #2 spec'd** (Webhook-Signature-Validation + Replay-Protection, 2.5 PD).
  5. **Audit-Report-Code v0.1** — Severity-Bänder funktional, Output-Format steht.
- **Soft Goals:** 1 Engagement-Lead aus dem Kolja-Netzwerk warm-touch'd (Validation-Engagement-Sales beginnen).
- **Build-in-Public-Topic:** "Why we're spending 9–12 PD on GitHub-App-Mitigations BEFORE writing the Audit-Logic. Threat model 101 for indie founders."
- **Anti-Pattern-Warning:** Nicht in derselben Woche Audit-Code + Mitigation-Code AND 4 Interviews. Days-of-week-blocking: Mo+Di = Interview, Mi+Do = Code, Fr = BiP + Retro.

### **Week 8 — Agency-Wave Close + OSS v0.1 Tag**

- **Hours:** 30 h
- **Hard Deliverables:**
  1. **3 weitere Agency-Discovery-Interviews** (Running Total Agency: 7 — auf Track zu 10).
  2. **OSS v0.1-CLI installierbar** (`pnpm build && pnpm cli validate <repo>`) — installiert lokal, kein npm-publish. README-MVP. Tag `v0.1.0-local` im Repo.
  3. **GitHub-App-Mitigation #2 implementiert** (Webhook-Sig + Replay).
  4. **GitHub-App-Mitigation #3 spec'd** (Rate-Limit-Aware-Polling, 3 PD).
  5. **1 Indie-Mom-Test** (Running Total Indie: 12).
  6. **Validation-Handbook v0 — 2 Kapitel-Drafts** geschrieben (aus 12 Mom-Test-Quotes) — *iterativ, nicht upfront*.
- **Soft Goals:** Erste Validation-Engagement-Lead konkretisiert (Pitch-Doc geschrieben, Termin angefragt).
- **Build-in-Public-Topic:** "OSS v0.1 tagged. Tested local-only, never going to npm until I know it's not embarrassing. Here's the install path."
- **Anti-Pattern-Warning:** v0.1-CLI nicht-npm-publishen. Premature-launch zerstört Trust-Karma. Lokal-tagged ist genug für Phase 0.

### **Week 9 — Engagement-Sales + LOI-Push Begin (Cluster C4)**

- **Hours:** 30 h
- **Hard Deliverables:**
  1. **Engagement #1 verkauft** ($3–5k) ODER konkrete Termine für die Sales-Conversation gebucht. Kolja-Netzwerk-Warm-Outreach.
  2. **3 weitere Agency-Discovery-Interviews** (Running Total Agency: 10 — Zielgröße erreicht).
  3. **LOI-Template** finalisiert (rechtssicher-genug, kein Anwalts-Review nötig in Phase 0 — Standard-Template aus PRD §33.7-Definition).
  4. **GitHub-App-Mitigation #3 implementiert** (Rate-Limit-Polling).
  5. **Mom-Tests:** Push auf Running Total Indie: 14.
  6. **Validation-Handbook — 2 weitere Kapitel** (Running Total: 4/8–12).
- **Soft Goals:** Erste 2 LOI-Asks raus an die "warm-genug" Agency-Discoveries.
- **Build-in-Public-Topic:** "Started selling my first engagement. Here's the actual cold-warm-email I sent. Reply rate so far: X/Y."
- **Anti-Pattern-Warning:** Nicht Discount für LOI geben. LOI muss freiwillig sein — sonst Bentinck-Fallacy ([medium](https://medium.com/entrepreneurs-first/the-letter-of-intent-fallacy-9929c5fc3e2a)).

### **Week 10 — Engagement Execute + LOI Conversion**

- **Hours:** 35 h (Engagement-Week ist immer Spike — eingeplant)
- **Hard Deliverables:**
  1. **Engagement #1 in-flight** — Mid-Sprint-Update an Customer geliefert.
  2. **1–2 LOIs signed** (Running Total: 2).
  3. **3 weitere LOI-Asks** an verbleibende Agency-Discoveries.
  4. **2 Mom-Tests** (Running Total Indie: 16).
  5. **Validation-Handbook — 2 Kapitel** (Running Total: 6/8–12), aus Engagement-Learnings live geschrieben.
  6. **GitHub-App-Mitigation #4 spec'd + halb-implementiert** (Read-Only-Default, 1 PD — easy).
- **Soft Goals:** Engagement-Sales-Pipeline für Engagement #2 vorbereitet.
- **Build-in-Public-Topic:** "Mid-engagement, 1 customer paid. Lesson #1 from real work: [unexpected pattern]. Here's the screenshot." (Revenue-transparency, [softwareseni](https://www.softwareseni.com/building-in-public-the-10-year-distribution-strategy-behind-solo-founder-revenue/))
- **Anti-Pattern-Warning:** Engagement-Week → keine 2 Mom-Tests pressen. Reduzieren ist OK.

### **Week 11 — Engagement #1 Close + Operations-Playbook Begin**

- **Hours:** 32 h
- **Hard Deliverables:**
  1. **Engagement #1 abgeschlossen** + Final-Deliverable raus + Cash gerechnet + Lessons in `engagements/2026-XX-engagement-1.md`.
  2. **Engagement #2 verkauft ODER scheduled** für W12–W13.
  3. **2 weitere LOIs signed** (Running Total: 3–4).
  4. **2 Mom-Tests** (Running Total Indie: 18).
  5. **GitHub-App-Mitigation #4 fertig** — alle 4 Mitigations done (9–12 PD spread realisiert).
  6. **Operations-Playbook v0** begonnen (Skeleton + 1 Kapitel-Draft aus Agency-Discovery-Quotes) — NEU v3.1 deliverable.
- **Soft Goals:** Validation-Handbook bei 6/8 Kapiteln.
- **Build-in-Public-Topic:** "Engagement #1 closed. Total: $X. Hours: Y. Effective hourly: Z. Here's what I'd price differently next time."
- **Anti-Pattern-Warning:** Nicht versuchen Handbook UND Playbook diese Woche zu schreiben. Playbook nur Skeleton.

### **Week 12 — Gate-Push (Cluster C5)**

- **Hours:** 30 h
- **Hard Deliverables:**
  1. **Engagement #2 in-flight** ODER abgeschlossen.
  2. **1 LOI signed** (Running Total: 4–5 — Gate-Approach).
  3. **2 Mom-Tests** (Running Total Indie: 20 — Gate erreicht).
  4. **Parser SHOULD-5 — Format 6 + 7 begonnen** (optional aber wertvoll für Phase 1).
  5. **Validation-Handbook — Restkapitel** (Running Total: 8/8 oder 9/10).
- **Soft Goals:** Naming-Prep-Doc für Sondr/Pondera Anwalts-Briefing schreiben (für M8 Anwalts-Termin — nicht jetzt buchen).
- **Build-in-Public-Topic:** "Approaching Phase-0-Gate. Tally: X LOIs, Y Mom-Tests, Z $$ revenue. What's left this week to close."
- **Anti-Pattern-Warning:** Nicht "alles fertig kriegen wollen". Gate-Definition ist binär. Was nicht-Gate ist, parkt in `parking-lot.md` für Phase 1.

### **Week 13 — Gate-Close + Phase-1-Setup**

- **Hours:** 25 h
- **Hard Deliverables:**
  1. **Engagement #2 abgeschlossen** + Cash gerechnet.
  2. **Final LOI** signed → **5 LOIs erreicht** (Gate-Pass) ODER **Gate-Fail-Branch aktiviert** (siehe §6).
  3. **Phase-0-Retro** vollständig geschrieben (`retros/2026-XX-phase-0-final.md`): Was war Hypothese vs. Realität? Welche PRD-Annahmen broken? Welche Decisions für Phase 1?
  4. **Phase-1-Kickoff-Doc** geschrieben (`docs/phase-1-plan.md`): 8–12 Engagements, Dual-Sprint-Mix-Setup, Studio-Tier-Build-Plan.
  5. **Validation-Handbook v0 — 8/8 Kapitel** done (Quality "Draft", nicht "Final" — that's OK).
  6. **Operations-Playbook v0 — 2/4 Kapitel** done.
  7. **`STATUS.md` Final-Snapshot** vor Phase-1-Start.
- **Soft Goals:** 1 Tag Off. Pieter-Levels-Pattern: nach Gate-Reach 24–48 h Off oder Phase-1-Burnout in W14.
- **Build-in-Public-Topic:** "Phase-0 closed. 13-week retro thread (1/12)." — der erfolgreichste Tweet/Post der gesamten Phase. Pieter-Pattern: monthly retro >> daily noise.
- **Anti-Pattern-Warning:** Nicht direkt in Phase 1 starten in W14. 2–3 Tage Off oder Wallpaper-Phase einbauen — sonst Burnout in M4.

---

## 3. Phase-0 Critical-Path Graph

```
Recruitment-Pipeline-W1
        │
        ▼
2 Mom-Tests W2 ──────────────────────────────────────┐
        │                                            │
        ▼                                            ▼
Golden-Set-30 W2  ── blockt ──► Audit-Code W6+      Quote-Mining (continuous)
        │                                            │
        ▼                                            ▼
Parser MUST-5 W3–W5 ── blockt ──► OSS v0.1-CLI W8   Validation-Handbook W8–W13
        │                                            ▲
        ▼                                            │
Dogfood-Lite W4 ── informs ──► Parser-Refine        │
        │                                            │
        ▼                                            │
Agency-Wave W6–W8 ───── blockt ──► LOI-Push W9–W11──┘
        │                                            │
        ▼                                            ▼
Engagement-Lead-Warm W7 ──► Engagement #1 W9–W11 ──► Cash + Handbook-Content
        │                                            │
        ▼                                            ▼
Engagement #2 W12–W13 ──► Phase-0-Gate W13 ──► Phase-1-Kickoff
```

**Hot-Path:** Golden-Set → Parser → Audit-Code → OSS v0.1. Wenn das slippt, alles slippt.
**Cold-Path (parallelisierbar):** Mom-Tests, Agency-Discoveries, Build-in-Public, GitHub-App-Mitigations.
**Joker:** Engagement-Sales — können in W6 oder W9 starten, nicht später als W10.

---

## 4. "What if Week-N is missed" — Graceful-Degradation-Branches

| Miss-Item | Worst-Impact | Graceful Branch |
|---|---|---|
| **Recruitment-Pipeline W1 slippt** | Mom-Tests starten W3 statt W2 → 18 statt 20 (Gate-Risk) | Aggressive Twitter/X-DM-Round in W3, Mom-Test-Ziel auf 18 reduziert, Gate-Definition NICHT modifiziert |
| **Parser-MUST-5 slippt von W5 → W7** | Audit-Code-Start in W8 → OSS v0.1 in W10 statt W8 | MUST-5 auf MUST-3 reduzieren (CLAUDE.md + .cursor + AGENTS.md), SHOULD-5 nach Phase 1 |
| **Agency-Discovery-Cadence < 1/Wo in C3** | <10 Discoveries by W8 → LOI-Push-Pipeline schmal | LOI-Push in W11+W12+W13 hoch ziehen, Mom-Test-Indie-Cadence reduzieren auf 1/Wo |
| **GitHub-App-Mitigation slippt > W11** | 4/4 erst in Phase 1 | OK — Mitigations sind Day-1-OPS, nicht Day-1-OSS-Pflicht. Block Phase 1 nur, wenn Mitigation #1 (JWT) fehlt |
| **Engagement #1 verkauft sich nicht in W9** | $3–5k Cash fehlt | OK — Cash ist nicht Phase-0-Gate-Criterion. Engagement-Sales in Phase 1 nachholen. Aber: Discovery-Engagement (kostenlos) für Learnings durchführen |
| **5 LOIs nicht erreicht W13** | Gate-Fail → Phase-1 modifiziert (siehe §6) | Phase-1 Operations-Sprint-Track parken, Validation-Sprint-only durchziehen. ADR-0018 re-open in M6 |
| **Handbook/Playbook slippt** | v0 unfertig in W13 | OK — Quality ist "Draft", nicht "Final". Phase-1 schreibt aus 8–12 Engagements weiter |
| **Mom-Test-Quality schwach** (oberflächliche Antworten) | Pattern-Erkennung schwierig | Re-Read Mom-Test-Book Kapitel 1–3, 1 Coaching-Session mit Rob-Fitzpatrick-Online-Resource, Interview-Frage-Skript überarbeiten |
| **Burnout-Risiko** (z.B. < 80% Hours-Budget 2 Wochen in Folge) | Phase-0-Velocity bricht | W-N+1 = Recovery-Woche, kein Code, nur 1 Interview + BiP — siehe Pieter-Levels-"sustainability over sprint" ([startupik](https://startupik.com/pieter-levels/)) |

---

## 5. Phase-0-Gate Definition (M3 = End-of-W13)

**Gate-Pass-Criteria** (all binary, all required):

1. ✅ **20 Indie-Mom-Tests** transkribiert in `interviews/`-Ordner. (Buffer: 18+2 documented-skipped mit Reason ist OK).
2. ✅ **10 Agency-Discovery-Interviews** transkribiert. (Buffer: 8+2 documented-skipped ist OK).
3. ✅ **5 Agency-LOIs** signed (PRD §33.7-Definition: schriftliche Willenserklärung mit (a) Use-Case-Beschreibung, (b) Pricing-Anchor — z.B. "willing to pay $XXX/mo wenn Feature Y vorhanden", (c) Decision-Maker als Signatory).
4. ✅ **OSS v0.1 lokal lauffähig** (`pnpm cli validate <repo>` produziert Audit-Report mit Severity-Bändern, läuft gegen Golden-Set 25+/30 green).
5. ✅ **12-Format-Parser MUST-5 done** + Eval-Suite green ≥ 80% gegen Golden-Set.
6. ✅ **4 GitHub-App-Mitigations** alle 4 implementiert (9–12 PD spread realisiert).
7. ✅ **30-File-Golden-Set** vollständig annotiert + Eval-Run-Logs in `eval/`.
8. ✅ **Validation-Handbook v0** ≥ 8 Kapitel Draft-Quality.
9. ✅ **Operations-Playbook v0** ≥ 2 Kapitel Draft-Quality.
10. ✅ **65+ Build-in-Public-Posts** raus über 13 Wochen (Toleranz: 55+ = pass, 40–54 = soft-fail-flag).
11. ✅ **Phase-0-Retro** + **Phase-1-Kickoff-Doc** geschrieben.

**Gate-Soft-Pass** (8/11): Phase 1 startet, aber Phase-1-Plan revidiert.
**Gate-Hard-Fail** (≤ 6/11 ODER #3 fail ODER #4 fail): Phase-0 verlängert um 4 Wochen (M4), Phase-1-Start auf M5. Bei <3 LOIs: Operations-Sprint-Track parken, ADR-0018 re-open.

**Gate-Fail-Branch — wenn 5 LOIs nicht erreicht:**

- Phase 1 läuft **Validation-Sprint-only** (4–6 Engagements à $4.500).
- ContextForge-Wedge (Operations-Sprint) auf Phase 2 zurückgestellt.
- 5 weitere Agency-Outreach-Wellen in M4–M6 — wenn 5 LOIs bis M6 noch nicht erreicht, Operations-Track permanent gestrichen.
- ADR-0018 Re-Open in M6 mit aktuellen Constraints.

---

## 6. Anti-Patterns (Don't try to do X and Y in the same week)

1. **Parser-Code + Audit-Code in derselben Woche.** Audit braucht Parser-Output als Input. Parser muss "frozen-genug" sein bevor Audit-Code beginnt. Geht der Parser noch durch Refactor während Audit-Code geschrieben wird → Doppel-Debug. Sequence: Parser W3–W5, Audit W6–W8.
2. **2 Engagements gleichzeitig in-flight.** Engagement-Week ist Spike (32–35 h). Zwei parallel = 50+ h = unrealistisch. Sequenz: Engagement #1 W9–W11, Engagement #2 W11–W13 (max 1 Tag Overlap).
3. **Handbook AND Playbook upfront-schreiben.** Pre-Mom-Test ist Speculation. Solo-Founder-Procrastination-Trap ([Lenny](https://www.lennysnewsletter.com/p/community-wisdom-beating-the-solo)). Iterativ aus Interview-Quotes + Engagement-Learnings. Skeleton-Only-Upfront, Inhalte continuous.
4. **GitHub-App-Mitigation-Sprint in einer Woche packen.** 9–12 PD in 1 Wo = unrealistisch (überschreitet 30h-Budget). Spread W5 (1 spec), W7 (1 impl + 1 spec), W8 (1 impl + 1 spec), W10–W11 (Rest impl).
5. **Build-in-Public-Batching ("ich schreibe Freitag alle 5 Posts").** Pieter-Levels-Pattern ist *daily transparency*, nicht *Friday-batch* ([softwareseni](https://www.softwareseni.com/building-in-public-the-10-year-distribution-strategy-behind-solo-founder-revenue/)). Batching liest sich als content-marketing, nicht als build. 30 min/Tag, Topic aus Day's Work.
6. **Mom-Tests UND Agency-Discoveries in derselben Woche > 4 total.** Interview-Cognitive-Load ist hoch (Active-Listening + Note-Taking + Follow-Up-Synthesis). Max 4 Interviews/Wo, davon ≤ 2 Indie + ≤ 2 Agency. In W6–W8 mehr Agency (3 + 1 Indie), in W2–W5 mehr Indie (2 + 0 Agency).
7. **Naming-Decision in Phase 0 final treffen.** Re-Brand-Window ist M9–M12 (PRD-Constraint). In Phase 0 nur **Anwalts-Briefing-Doc vorbereiten**, nicht buchen, nicht entscheiden. Decision in M8.

---

## 7. Build-in-Public Topic-Grid (5 Posts/Woche × 13 Wochen = 65 Posts)

Auto-generating-Pattern aus Day's-Work, kein Writers-Block. 5 fixed Categories rotating Mo–Fr:

| Day | Category | Source-of-Truth |
|---|---|---|
| **Mo** | **Mom-Test/Interview-Quote-of-the-Week** | Verbatim-Quote aus letzter Woche, anonymisiert, mit "what this tells me" |
| **Di** | **Build-Diff** | Screenshot of one git diff + 1-paragraph "why I did this" |
| **Mi** | **Failure-or-Wrong-Assumption** | 1 thing I was wrong about + the Mom-Test-evidence that corrected me |
| **Do** | **Engagement/Sales-Transparency** | Cash, hours, reply-rates, LOI-status — radical transparency (Pieter-Pattern) |
| **Fr** | **Friday-Retro-Thread** | 5–7 tweets/posts: what shipped, what slipped, what next week |

Bonus-Wochen-Specials:
- **W5 Mid-Retro:** Long-form-Thread (10+ posts) als Mid-Phase-Reflection.
- **W13 Phase-0-Retro:** Long-form-Thread (12+ posts) als Phase-Close. Erfahrungsgemäß der erfolgreichste Post der gesamten Phase ([softwareseni](https://www.softwareseni.com/building-in-public-the-10-year-distribution-strategy-behind-solo-founder-revenue/)).

**Voice-Adherence:** Skeptic-Mentor, Concession-then-Critique, Citations inline. Counter-Tagline-Posts ("Most ideas fail this") in Mi-Slots, nicht in Mo-Slots (Mo = listening-mode).

**Time-Budget:** 30 min/Tag × 5 = 2.5 h/Wo. In den Wochen-Budgets als "3h BiP" eingeplant (mit 30 min Buffer für Engagement-Replies).

---

## 8. Engagement-Sales — Wann genau im Timeline?

| Phase | Timing | Action |
|---|---|---|
| **Lead-Identification** | W6–W7 | Kolja-Netzwerk durchgehen (LinkedIn-Connections, Twitter-DMs, Discord-Memberships), 5–8 warme Leads identifizieren |
| **Warm-Touch** | W7 | Erste DMs/Mails "Hey, ich baue X, bist du zufällig im Markt für…?" — kein Pitch |
| **Pitch-Doc-Ready** | W8 | Pitch-Deck-Doc (1-pager, kein PowerPoint): Problem, Process, Deliverables, Pricing ($3–5k Range) |
| **Sales-Conversations** | W8–W9 | 2–3 Sales-Termine. Founder-led, kein Sales-Hire. |
| **Engagement #1 Verkauft** | W9 | Vertrag signed, Kickoff scheduled |
| **Engagement #1 Execute** | W10–W11 | 2-Wochen-Sprint, daily-Updates an Customer |
| **Engagement #2 Verkauft** | W11–W12 | Lead-Generation parallel zu Engagement-#1-Execute |
| **Engagement #2 Execute** | W12–W13 | 2-Wochen-Sprint |

**Kritisch:** Engagement-Sales sind **Cash-Engine + Dogfood-Quelle gleichzeitig**. Aus PRD §6: jedes Engagement liefert (a) Cash $3–5k, (b) Mom-Test-Pattern-Validierung, (c) Validation-Handbook-Content. Daher: Engagement-Insights direkt nach Sprint in `engagements/`-Notes + Handbook-Kapitel-Drafts.

---

## 9. Day-1-Quick-Start (first 90 minutes after this plan is approved)

Sofort-Setup ohne Strategieentscheidungen:

**Minute 0–15 — Local Repo Bootstrap**
1. `cd ~/Documents/rohan && git status` (Status-Check).
2. `mkdir -p packages/{agents,runners,cli,integrations} apps/web eval interviews engagements decisions retros docs/research/v5 quotes`.
3. `touch STATUS.md recruitment.md agency-recruitment.md quotes.md voice-diff.md`.
4. `STATUS.md` initial-content: Header + 11 Gate-Criteria-Checkboxes (Copy aus §5).

**Minute 15–30 — GitHub-Org Reservierung**
5. github.com auf `validationkit-ai`-Org-Create-Page, Org erstellen (kostenlos, sofort).
6. README.md im Org-Root (1 Satz: "ValidationKit — find out if anyone actually wants your idea before you build it. Phase 0 in progress.").

**Minute 30–60 — Mom-Test-Recruitment-Start**
7. `recruitment.md` öffnen, Tabelle anlegen: Name | Channel | Source | Outreach-Status | Interview-Date.
8. 10 DACH-Indie-Hacker-Namen aus Twitter/X-Following + IndieHackers-DACH-Group + Discord-Memberships eintragen.
9. **2 Outreach-Messages JETZT verschicken.** Mom-Test-konform-Template:
   > "Hey [Name], ich baue gerade ein Open-Source-Tool, das Solo-Foundern hilft, Ideen vor dem Bau zu validieren. Bevor ich weiter code, will ich verstehen, wie du das aktuell machst. Hast du 10 min nächste Woche für ein Gespräch? Es ist Discovery, kein Pitch — ich verkaufe nichts."

**Minute 60–90 — Build-in-Public-Post #1**
10. Twitter/X-Draft schreiben: "Day 1 of building ValidationKit in public. Constraint: solo, 20h/week, 13 weeks. Here's what's IN scope. Here's what's NOT. Here's the Phase-0-Gate." 5–7 Tweets/Posts.
11. **Posten.**
12. Browser-Tab zu mache: Phase-0-Tracking-Board → für jede Woche `STATUS.md` 30-Sek-Update.

**Stop.** Nach 90 Minuten: 4 Hard-Deliverables-Items aus W1 sind angesetzt. Rest der Woche: nach Plan.

---

## 10. Research-Anchors (kurze Quellen-Notiz)

- **First-90-Days-Frameworks:** Lonely-Entrepreneur "Stay Sane in 90 Days" (Customer-Contact daily-reflex) und Lenny-Newsletter Kyle-Poyar (90-Day-Impact-Framework). Konsens: weekly review > daily heroics, 3 outcomes/Woche pinpoint.
- **Pieter-Levels-Pattern:** 10-year build-in-public, daily-tweet + weekly-thread + monthly-retro. Solo-Sustainability über Sprint. Revenue-Transparency hebt Conversion 3–10× vs ohne Audience.
- **Mom-Test-Cadence:** IndieHackers-Konsens 1–2 Interviews/Wo nachhaltig — bei höherer Cadence kippt Quality (Active-Listening-Fatigue).
- **LOI-Fallacy:** Bentinck-Medium "More often than not, customers renege on LOI." → daher 5 LOIs als Gate, nicht 1 — Buffer für Renege.
- **Dogfooding-Timing:** IndieHackers-Thread + Wikipedia: earliest-possible. Aber: Dogfood ≠ Validation. Founder ist Power-User, nicht typischer Customer.
- **GTD-für-Solo-Founder:** Weekly-Review ist Foundation-of-Resilience (SprintDojo). Mindwtr/Super-Productivity sind local-first GTD-Tools — passt zu Hardcore-Local-Only-Constraint.
- **Solo-Procrastination-Trap:** Lenny-Community-Wisdom: das größte Risiko in Phase 0 ist nicht falscher Plan, sondern Doc-Writing-statt-Customer-Contact.

---

**End of Document.**

*Maintain via `/iterate-prd` if Phase-0-Velocity rezerit die Cluster-Boundaries. Diese Datei ist live während Phase 0 — Updates per Edit, kein Re-Write.*

Sources:
- [Your First 90 Days as a Solo Founder: Stay Sane](https://blog.lonelyentrepreneur.com/your-first-90-days-as-a-solo-founder-stay-sane)
- [Building in Public: 10-Year Distribution Strategy — SoftwareSeni](https://www.softwareseni.com/building-in-public-the-10-year-distribution-strategy-behind-solo-founder-revenue/)
- [Pieter Levels — Solo Maker Redefining Startup Success — Startupik](https://startupik.com/pieter-levels/)
- [Indie Hackers — How to scale customer interviews](https://www.indiehackers.com/post/how-to-scale-customer-interviews-f5606e2255)
- [Indie Hackers — Do you dogfood your product?](https://www.indiehackers.com/post/do-you-dogfood-your-product-5b32a281f1)
- [The Letter of Intent Fallacy — Bentinck on Medium](https://medium.com/entrepreneurs-first/the-letter-of-intent-fallacy-9929c5fc3e2a)
- [Community Wisdom: Beating the solo-founder procrastination trap — Lenny's Newsletter](https://www.lennysnewsletter.com/p/community-wisdom-beating-the-solo)
- [How to make an impact in your first 90 days — Lenny's Newsletter / Kyle Poyar](https://www.lennysnewsletter.com/p/how-to-make-an-impact-in-your-first)
- [SprintDojo — The Weekly Team Truth: GTD Weekly Review](https://sprintdojo.com/articles/system-for-success/gtd-weekly-review)
- [Mindwtr — Open-Source local-first GTD App](https://dongdongbh.tech/blog/mindwtr/)
