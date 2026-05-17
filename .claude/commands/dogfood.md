---
description: Run ValidationKit's own validation framework on a side-project idea — manual end-to-end, before the framework even exists. Founder-bias mitigation.
argument-hint: "<idea description in 1–3 sentences>"
---

Du dogfooded jetzt ValidationKit auf eine echte Idee — manuell, end-to-end, ohne dass das Framework existiert. Das ist Phase-0 Reference-Implementation-Quelle und Founder-Bias-Mitigation in einem.

**Idee:**

$ARGUMENTS

Process (folge der PRD-Pipeline aus §12.2):

1. **idea-clarifier (manuell):** Stelle dem User 5–10 Klärungsfragen via AskUserQuestion (in Tranchen von max 4). Outputs nach `dogfood/<idea-slug>/context/problem-statement.md`.

2. **market-researcher:** Echte WebSearch + WebFetch nach 5–10 Konkurrenten. Pricing, USPs, Reviews. Jede Behauptung mit klickbarer Quelle. Output: `dogfood/<idea-slug>/context/competitive-landscape.md` + `citations.json`.

3. **persona-generator:** 3–5 Personas, RAG-grounded auf echte Reddit/G2/IndieHackers-Snippets. Multi-Model wenn möglich (Claude + GPT, optional Gemini). Inter-Model-Agreement notieren. Output: `dogfood/<idea-slug>/context/personas/`.

4. **persona-interviewer + jtbd-interviewer (parallel):** Pro Persona ein Forced-Choice-WTP-Interview + ein JTBD-4-Forces-Interview. Severity-Bänder, keine numerischen Scores. Skeptic-Mode-Pass für Anti-People-Pleasing. Output: `dogfood/<idea-slug>/context/interviews/` + `jtbd/`.

5. **channel-strategist:** 2026-Benchmark-aware Channel-Auswahl. Output: `dogfood/<idea-slug>/context/channels.md`.

6. **outreach-writer + fake-door-designer + pricing-tester (parallel):** Pro empfohlenem Channel Drafts + Landing-Page-Copy/Wireframe (mit Pricing-Anker, UTM, reCAPTCHA-Spec) + Van-Westendorp-Pricing-Spec. Output: `dogfood/<idea-slug>/drafts/`, `landing/`, `pricing/`.

7. **STOP — Handoff zu Kolja.** Hier kommt der manuelle Schritt: Kolja muss die Outreach posten, Landing-Page deployen, eine Woche Daten sammeln.

8. **feedback-synthesizer (später):** Wenn Daten da sind, lauf manuell den Demand-Signal-Score-Algorithmus aus PRD §19. Output: `dogfood/<idea-slug>/reports/synthesis.md` mit Verdict (Kill / Weak / Mid / Strong / Exceptional).

9. **pre-sale-orchestrator (wenn Verdict ≥ Mid):** LOI / Stripe-Pre-Order / Concierge-MVP-Playbook. Output: `dogfood/<idea-slug>/pre-sale/`.

10. **Reflection log:** Schreibe `dogfood/<idea-slug>/REFLECTION.md` — was hat manuell gut funktioniert, was war painful, was muss `packages/agents/` automatisieren?

Dieser Dogfood-Run IST die Reference-Implementation für den Phase-0-MVP. Was hier umständlich war, wird zum Automatisierungs-Target. Was hier schnell war, ist bereits gut genug.
