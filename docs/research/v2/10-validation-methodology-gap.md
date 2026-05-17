# Validation Methodology Gap Analysis — ValidationKit's 8 Subagents

**Datum:** 2026-05-14
**Autor:** Validation-Methodologist (Subagent-Analyse)
**Scope:** Mapping etablierter Validation-Methodologien gegen ValidationKit's 8 Subagents + 5 Slash Commands

---

## 1. Executive Summary

ValidationKit deckt mit seinen 8 Subagents den **mittleren Trichter** der Pre-Launch-Validation solide ab (Problem-Framing → Persona → Outreach → Fake Door → Synthese). Gemessen an etablierten Methodologien (Mom Test, Lean Startup, Continuous Discovery, JTBD, Demand Curve, Forte Foundry) bestehen jedoch **signifikante Lücken in vier Bereichen**: (a) JTBD-spezifische Interview-Tiefe, (b) Pre-Sale / LOI / Concierge-MVP-Mechanik, (c) quantitative Pricing- & Preference-Tests (Van Westendorp, MaxDiff, Conjoint), und (d) zeitliche Re-Validation / Cohort-Tracking. Gleichzeitig zeigen sich **leichte Übersättigungen** zwischen `persona-generator` und `persona-interviewer` sowie zwischen `outreach-writer` und `channel-strategist`. Empfehlung: 8 Subagents auf **10–11** erweitern, nicht mehr.

---

## 2. Methodologie-Mapping-Tabelle

Legende: ✓ vollständig adressiert · ⚠ teilweise · ✗ Lücke · — nicht anwendbar

| Methodologie / Prinzip | idea-clarifier | market-researcher | persona-generator | persona-interviewer | channel-strategist | outreach-writer | fake-door-designer | feedback-synthesizer |
|---|---|---|---|---|---|---|---|---|
| **Mom Test R1**: Talk about their life, not your idea | ✗ | — | ⚠ | ⚠ | — | ⚠ | — | ⚠ |
| **Mom Test R2**: Ask about specifics in past, not generic future | — | — | ⚠ | ⚠ | — | ⚠ | — | ⚠ |
| **Mom Test R3**: Talk less, listen more | — | — | — | ⚠ | — | — | — | ✓ |
| **Lean Startup — Build** | — | — | — | — | — | ⚠ | ✓ | — |
| **Lean Startup — Measure** | — | — | — | — | ⚠ | — | ⚠ | ✓ |
| **Lean Startup — Learn (Pivot/Persevere)** | — | — | — | — | — | — | — | ✓ |
| **Continuous Discovery — Opportunity Mapping** | ⚠ | ⚠ | — | ⚠ | — | — | — | ⚠ |
| **Continuous Discovery — Solution Trees** | — | — | — | — | — | — | — | ✗ |
| **Continuous Discovery — Weekly Touchpoints** | — | — | — | ✗ | — | — | — | ✗ |
| **JTBD — Forces of Progress** | — | — | ⚠ | ✗ | — | — | — | ✗ |
| **JTBD — Switch Interview (4 Forces)** | — | — | — | ✗ | — | — | — | — |
| **JTBD — Job Statement Formulierung** | ⚠ | — | ⚠ | — | — | — | — | — |
| **Demand Curve — Pre-Demand Validation** | — | — | — | — | ⚠ | ⚠ | ✓ | ⚠ |
| **Forte Foundry — 5-Fragen Pre-Sell** | — | — | — | ⚠ | — | ⚠ | ⚠ | ⚠ |
| **Justin Wilcox — Customer Development Cadence** | — | — | — | ⚠ | — | — | — | ⚠ |
| **Pre-Sale / Stripe-Preorder** | — | — | — | — | — | — | ⚠ | — |
| **LOI (Letter of Intent)** | — | — | — | — | — | ✗ | — | — |
| **Concierge-MVP / Wizard-of-Oz** | — | — | — | — | — | — | ✗ | — |
| **Re-Validation über Zeit / Cohorts** | — | — | — | — | — | — | — | ✗ |
| **A/B-Test (Headlines, CTAs)** | — | — | — | — | — | ⚠ | ✗ | — |
| **Van Westendorp Price Sensitivity** | — | ⚠ | — | ✗ | — | — | — | — |
| **MaxDiff Feature Prioritization** | — | — | — | ✗ | — | — | — | — |
| **Conjoint Analysis** | — | — | — | ✗ | — | — | — | — |
| **Smoke-Test Conversion Benchmarking** | — | ⚠ | — | — | — | — | ⚠ | ⚠ |

**Beobachtung:** Die rechte Hälfte der Tabelle (`outreach-writer` → `feedback-synthesizer`) ist überdurchschnittlich gut belegt, die linke Hälfte (`market-researcher`, `persona-generator`) sowie alles Quantitative ist dünn.

---

## 3. Identifizierte Lücken (sortiert nach Severity)

### Lücke 1: JTBD-Interview-Technik fehlt (Severity: HOCH)
**Argument:** `persona-interviewer` simuliert Personas, aber die JTBD-Methodik (Christensen, Klement, Moesta) verlangt eine sehr spezifische Interview-Struktur — die "Switch Interview" mit den 4 Forces (Push of current situation, Pull of new solution, Anxiety, Habit). Ohne diese Struktur generiert das Modell generische Bedürfnis-Statements statt narrativer Trigger-Momente ("first thought" → "passive looking" → "active looking" → "decision" → "consumption").
**Im PRD adressiert?** Nein. `persona-interviewer` hat keine Switch-Interview-Logik.
**Vorschlag:** Neuer Subagent **`jtbd-interviewer`** oder Erweiterung von `persona-interviewer` um einen JTBD-Modus. Letzteres ist sparsamer.
**Severity:** HOCH — JTBD ist State-of-the-Art für B2C-Validierung und bei den Standard-Methodiken die einzige, die echte Switch-Momente kodifiziert.

### Lücke 2: Pre-Sale / LOI / Concierge-MVP (Severity: HOCH)
**Argument:** Mom Test R3 sowie Demand Curve betonen: "The only real validation is money or a verbale Commitment." ValidationKit endet bei Fake-Door + Email-Signup. Das ist **schwaches Signal** verglichen mit (a) Stripe-Preorder mit Card-on-File, (b) Letter of Intent (B2B), (c) Concierge-MVP (Service vor Software). Forte Foundry und Wilcox argumentieren explizit gegen Smoke-Tests ohne Geld-Commitment.
**Im PRD adressiert?** Nein — `fake-door-designer` produziert Landing-Page-Copy, keinen Pre-Sale-Funnel oder LOI-Template.
**Vorschlag:** Neuer Subagent **`pre-sale-orchestrator`** mit drei Modi: (1) Stripe-Preorder-Setup-Anleitung + Copy, (2) LOI-Template für B2B-Use-Cases, (3) Concierge-MVP-Playbook (Service-Skript, manueller Workflow).
**Severity:** HOCH — ohne diesen Schritt liefert ValidationKit ein "Demand-Signal-Score" der von der Methodologie-Lehre als unzureichend gilt.

### Lücke 3: Quantitative Pricing- & Preference-Tests (Severity: MITTEL-HOCH)
**Argument:** Van Westendorp (4-Preis-Fragen), MaxDiff (Trade-off zwischen Features), Conjoint (Feature-Bundles vs. Preis) sind etablierte quantitative Verfahren. ValidationKit hat **keine Pricing-Validierung außer "Konkurrenten-Pricing"** in `market-researcher`. Das ist eine Lücke, weil Pricing in 60–70% der Validation-Cases der eigentliche Engpass ist.
**Im PRD adressiert?** Nein.
**Vorschlag:** Neuer Subagent **`pricing-tester`**: generiert Van-Westendorp-Survey-Fragen, MaxDiff-Feature-Karten, simuliert Antworten in `persona-interviewer`-Manier und gibt Price-Acceptable-Range-Output.
**Severity:** MITTEL-HOCH — kein Solo-Founder muss Conjoint laufen lassen, aber Van Westendorp ist ein 4-Fragen-Quickwin.

### Lücke 4: Re-Validation / Cohort-Tracking über Zeit (Severity: MITTEL)
**Argument:** Continuous Discovery (Torres) und Lean Startup beide betonen iterative Loops. ValidationKit's `/synthesize` ist **single-shot**: einmal laufen, Score raus, fertig. Es gibt keinen Mechanismus für (a) zweite Welle nach Pivot, (b) Tracking, ob Signal-Score sich über Zeit verbessert, (c) Cohort-Vergleich (Persona A im Feb vs. Persona A im Mai).
**Im PRD adressiert?** Nein.
**Vorschlag:** Neuer Subagent **`revalidation-tracker`** oder neuer Slash Command `/revalidate` der vorherige `/validate`-Runs lädt, Deltas berechnet und Cohort-Vergleiche zeigt. Erfordert State-Persistenz (z.B. `.validation/history.json`).
**Severity:** MITTEL — relevant für ernsthafte Founder mit mehrwöchigem Validierungsprozess, weniger für Hobbyisten.

### Lücke 5: Opportunity-Solution-Tree (Continuous Discovery) (Severity: MITTEL)
**Argument:** Torres' OST verlangt: ein Outcome → mehrere Opportunities → mehrere Solutions → mehrere Experimente. ValidationKit springt direkt von Idee zu Persona zu Outreach. Die **Verzweigungslogik** fehlt: Was ist, wenn drei Pain-Points sich zeigen, aber nur einer real ist? ValidationKit konvergiert zu schnell.
**Im PRD adressiert?** Teilweise in `feedback-synthesizer` (Pivot/Build-Empfehlung), aber nicht als Tree-Struktur.
**Vorschlag:** Erweiterung von `feedback-synthesizer` um einen "Opportunity-Tree-View"-Output (Markdown-Tree), der alle entdeckten Opportunities zeigt, statt nur Top-3-Insights.
**Severity:** MITTEL — strukturelle Verbesserung, nicht neuer Agent.

### Lücke 6: Mom Test "Talk about life, not idea" (Severity: MITTEL)
**Argument:** Mom Test Regel 1 fordert, **niemals die Idee zu pitchen** im Interview. `persona-interviewer` ist hier ambivalent: Wenn die Persona auf die Idee reagiert, ist das Bias. Ein guter Mom-Test-Interview-Modus stellt Fragen wie "Walk me through the last time you encountered X" — ohne dass die Lösung erwähnt wird.
**Im PRD adressiert?** Teilweise — hängt von der Prompt-Engineering-Qualität in `persona-interviewer` ab.
**Vorschlag:** Erweiterung — `persona-interviewer` sollte einen expliziten Mom-Test-Mode haben mit harten Constraints (kein Solution-Pitch, nur Past-Behavior-Fragen).
**Severity:** MITTEL — relativ leicht via Prompt-Tuning lösbar.

### Lücke 7: A/B-Test-Variation der Landing Pages (Severity: NIEDRIG-MITTEL)
**Argument:** Demand Curve und Lean Startup beide: Smoke-Tests **ohne Variation** sind unterausgenutzt. Wenn man ohnehin eine Fake-Door baut, sollte man 2–3 Headline-Varianten testen.
**Im PRD adressiert?** Nein — `fake-door-designer` liefert genau eine Page.
**Vorschlag:** Erweiterung von `fake-door-designer` um Multi-Variant-Output (3 Headlines, 3 CTAs) plus eine kleine A/B-Test-Anleitung (z.B. Vercel Edge Config oder simples Random-Routing).
**Severity:** NIEDRIG-MITTEL — schneller Win, kein neuer Subagent nötig.

### Lücke 8: Smoke-Test Conversion Benchmarking (Severity: NIEDRIG)
**Argument:** Ohne Benchmarks ("eine gute Landing-Page-Conversion bei Cold-Email-Traffic liegt bei 3–8%") ist der Demand-Signal-Score in `feedback-synthesizer` arbiträr. Demand Curve veröffentlicht solche Benchmarks.
**Im PRD adressiert?** Teilweise — der Score ist beschrieben, aber Benchmarks pro Channel/Industrie nicht.
**Vorschlag:** Erweiterung von `feedback-synthesizer` mit eingebetteter Benchmark-Library (Cold Email: 1–3% Reply, Reddit-Posts: 2–10% Click, Fake-Door: 5–15% Signup, etc.).
**Severity:** NIEDRIG — Quality-of-Life-Verbesserung.

---

## 4. Identifizierte Übersättigungen (Redundanzen)

### Übersättigung 1: `persona-generator` ↔ `persona-interviewer`
Beide arbeiten auf Persona-Ebene und werden sequenziell aufgerufen. Es gibt einen logischen Sinn (erst generieren, dann interviewen), aber in der Praxis könnte das zusammengelegt werden: Ein Subagent generiert + simuliert. Spart einen Roundtrip und stellt sicher, dass die Personas internally consistent sind.
**Empfehlung:** Beibehalten, aber sicherstellen, dass `persona-interviewer` **immer** den vollen Persona-Kontext lädt (keine Halluzinationen).

### Übersättigung 2: `channel-strategist` ↔ `outreach-writer`
`channel-strategist` empfiehlt Channels, `outreach-writer` schreibt für die empfohlenen Channels. In der Praxis braucht der Strategist sehr wenig Modell-Token (Channel-Auswahl ist regelbasiert), während der Writer hochwertige Generation macht. Hier ist eine **leichte Übersättigung**, weil ein erfahrener Founder Channels eh kennt.
**Empfehlung:** `channel-strategist` zu einem **Single-Pass-Quick-Tool** machen (deterministische Logik, weniger LLM-Aufruf), oder beide zu `channel-outreach` zusammenlegen.

### Übersättigung 3: `idea-clarifier` ↔ Frontend des `/validate`-Commands
Wenn `/validate` ohnehin strukturierte Input-Felder hat, ist `idea-clarifier` partiell redundant. Behalten nur, wenn der User unstrukturierte Inputs gibt ("ich hab da diese Idee mit…").
**Empfehlung:** Beibehalten, aber Skip-Logic: Wenn Input strukturiert ist, überspringen.

---

## 5. Empfohlene Subagent-Erweiterung

Aktuell 8 Subagents. Vorschlag: **+3 neue, –0 entfernen → 11 Subagents.**

### Neu: `jtbd-interviewer`
- Switch-Interview-Struktur (4 Forces)
- Job-Statement-Formulierung
- Outputs: Push/Pull/Anxiety/Habit-Karte pro Persona
- Alternativ: als Mode in `persona-interviewer` einbauen

### Neu: `pre-sale-orchestrator`
- Stripe-Preorder-Page-Copy + Setup-Anleitung
- LOI-Template (B2B)
- Concierge-MVP-Playbook (Service-Skript, manueller Workflow)
- Outputs: Pre-Sale-Funnel-Spec mit konkreten Conversion-Schwellen

### Neu: `pricing-tester`
- Van Westendorp 4-Fragen-Survey
- MaxDiff Feature-Cards
- Output: Acceptable Price Range, Price-Sensitivity-Heatmap
- Optional Conjoint für Power-User

### Optional: `revalidation-tracker`
- Lädt vorherige `/validate`-Runs aus `.validation/history.json`
- Deltas zwischen Cohorts/Wellen
- Pivot-vs-Persevere-Empfehlung über Zeit
- **Severity-Mittel** — kann später als V2 nachgeschoben werden

---

## 6. Empfohlene neue Slash Commands

Aktuell 5 (`/validate`, `/persona-test`, `/landing-page`, `/outreach`, `/synthesize`). Vorschlag:

### Neu: `/jtbd` oder `/switch-interview`
Triggert nur den JTBD-Interviewer-Modus. Sinnvoll für Founders, die schon Personas haben und nur tiefer in einen Switch-Moment graben wollen.

### Neu: `/pre-sale`
Triggert `pre-sale-orchestrator`. Output: Stripe-Setup, LOI, Concierge-Plan.

### Neu: `/price-test`
Triggert `pricing-tester`. Sinnvoller eigener Command, weil Pricing oft separater Workstream.

### Neu: `/revalidate`
Lädt History, vergleicht Cohorts. Voraussetzung: persistenter State.

### Optional: `/abtest`
Generiert Landing-Page-Varianten + A/B-Test-Setup-Anleitung. Könnte aber auch Flag von `/landing-page` sein.

---

## 7. Mapping der Methodologien — Detail-Notizen

### 7.1 Mom Test (Rob Fitzpatrick)
**3 Regeln:**
1. Talk about their life, not your idea.
2. Ask about specifics in the past, not generics or opinions about the future.
3. Talk less and listen more.

**ValidationKit-Status:** `persona-interviewer` adressiert dies **prompt-abhängig**. Es gibt keinen expliziten Mom-Test-Mode mit Constraints. **Lücke:** Mittel. Lösung via Prompt-Engineering, kein neuer Subagent.

### 7.2 Lean Startup (Eric Ries)
**Build-Measure-Learn-Loop.** ValidationKit's Loop ist:
- Build = `fake-door-designer` + `outreach-writer`
- Measure = (extern, kein Tooling im PRD)
- Learn = `feedback-synthesizer`

**Lücke:** Measure-Phase fehlt komplett — keine Analytics-Integration, kein Dashboard, kein Cohort-Tracking. Auch keine Closed-Loop-Iteration.

### 7.3 Continuous Discovery (Teresa Torres)
**Opportunity-Solution-Tree:** Outcome → Opportunities → Solutions → Experiments.
**Weekly Touchpoints:** mind. 1 Kundeninterview/Woche.

**ValidationKit nutzt nicht:** Tree-Struktur in der Output-Synthese, regelmäßige Cadence-Reminder, Persistenz über Wochen.

### 7.4 JTBD (Christensen, Klement, Moesta)
**Switch Interview:** "When did you first realize you needed something different?" Trace zurück: First Thought → Passive Looking → Active Looking → Decision → Consumption.
**4 Forces:** Push, Pull, Anxiety, Habit.

**ValidationKit-Status:** Nicht abgebildet. **Klare Lücke.**

### 7.5 Demand Curve / Forte Foundry / Justin Wilcox
**Pre-Demand Validation:** Smoke-Test mit Geld-Commitment vor Build.
**Forte Foundry 5-Fragen Pre-Sell:** Strukturiertes Verkaufsgespräch ohne Produkt.
**Wilcox Customer Development Cadence:** 5 Calls/Woche, strukturierte Notizen.

**ValidationKit-Status:** Fake Door ja, Pre-Sell mit Card-on-File nein, strukturierte Cadence nein.

### 7.6 Pre-Sale / LOI / Concierge-MVP
**Pre-Sale:** Stripe-Preorder vor Build.
**LOI:** Schriftliche Kaufabsichtserklärung (B2B).
**Concierge:** Lösung manuell anbieten (Wizard of Oz), bevor Software gebaut wird.

**ValidationKit-Status:** Komplett abwesend. **Klare Lücke, HOCH.**

### 7.7 Re-Validation / Cohort-Tracking
ValidationKit ist single-shot. Keine Persistenz, keine zweite Welle. **Lücke MITTEL.**

### 7.8 Quantitative Tests
Van Westendorp, MaxDiff, Conjoint, A/B. **Komplett abwesend** im PRD. **Lücke MITTEL-HOCH.**

---

## 8. Zusammenfassende Empfehlung

**Optimale Subagent-Anzahl:** 10–11 (nicht 8, nicht 15).

**Priorisierte Roadmap:**
1. **V1.1 (Quick Win):** `persona-interviewer` um Mom-Test- und JTBD-Switch-Mode erweitern. Kein neuer Subagent, nur Prompt-Refinement.
2. **V1.2 (Hoher Hebel):** Neuer `pre-sale-orchestrator` + `/pre-sale` Command. Schließt die größte methodologische Lücke.
3. **V1.3 (Quantitative Tiefe):** Neuer `pricing-tester` + `/price-test` Command. Van Westendorp ist 4 Fragen — niedrige Implementierungskosten, hoher Wert.
4. **V2 (Continuous Discovery):** `revalidation-tracker` mit State-Persistenz. Erst, wenn V1-Loop bewiesen ist.

**Was NICHT bauen:**
- Conjoint-Analysis-Subagent (Overkill für Solo-Founder)
- Eigener A/B-Test-Subagent (als Mode von `fake-door-designer` ausreichend)
- Vollständiger Continuous-Discovery-Suite (zu schwer für Solo-Use-Case)

**Übersättigungs-Cleanup:**
- `channel-strategist` zu deterministischem Quick-Tool degradieren oder mit `outreach-writer` mergen.
- `idea-clarifier` mit Skip-Logic versehen, wenn Input bereits strukturiert.

---

**Wortzahl: ~2100**
