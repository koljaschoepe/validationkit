> **ARCHIVED 2026-05-16.** All file-paths in this document were pre-v5-Refactor. See `docs/PRD.md` for current. Original paths: `analysis/` → `docs/research/v2/`, `analysis-v3/` → `docs/research/v3/`, `analysis-v4/` → `docs/research/v4/`, `decisions/` → `docs/decisions/`.

# PRD — ValidationKit v2.0

> **Working Title:** ValidationKit (Rebrand-Fenster M9–M12 — Empfehlung **Sondr** als ambitionierter Re-Brand-Kandidat)
> **Status:** Draft v2.0 — Konsolidierung aus 19-Agent-Multi-Recherche, ersetzt v0.1
> **Erstellt:** 2026-05-14
> **Vorgänger:** [PRD-v0.1-vom-2026-05-13](./PRD%20ValidationKit.pdf)
> **Owner:** Kolja Schöpe
> **Distribution:** Open-Source-Framework (MIT) + Hosted-Web-App (Phase 1 vorgezogen)
> **Primary Stack:** TypeScript Monorepo · Next.js 16 · Vercel Workflow DevKit · Claude Agent SDK · AI Gateway (Multi-Provider)

---

## 0. Meta & Changelog gegenüber v0.1

| Bereich | v0.1 (2026-05-13) | v2.0 (2026-05-14) | Quelle |
|---|---|---|---|
| Strategisches Verdict | "Build MVP in 4–6 Wochen" | "Build mit Re-Positioning — drei Kill-Criteria adressieren bevor Launch" | `06-devils-advocate.md` |
| Headline-Differenzierung | Open-Source + Composable + Real Signals | **Actually executes the experiment** + cited sources + persona-bound build-time guardrails | `01-competitor-ai-validators.md` |
| Subagent-Anzahl | 8 | **10–11** (+ `jtbd-interviewer`, `pre-sale-orchestrator`, `pricing-tester`) | `10-validation-methodology-gap.md` |
| Persona-Pipeline | Plain LLM-Prompting | **RAG-grounded + Forced-Choice WTP + Multi-Model-Ensemble** (gegen "snake-oil"-Risiko) | `08-synthetic-persona-validity.md` |
| Output-Framing | "Validation Report" | **"Pre-Interview Hypothesis Briefing"** (mit Severity-Bändern statt Fake-Precision-Scores) | `08-synthetic-persona-validity.md` |
| Pro-Pricing | $29/mo | **$19/mo** (AI-Tool-GRR-Klippe bei $50, Cursor/v0/Lovable-Anker) | `13-monetization-saas-2-0.md` |
| Team-Tier Phase 1 | Inkludiert | **Gestrichen** — Phase 1 nur Free + Pro + PAYG | `13-monetization-saas-2-0.md` |
| Marketplace-Split | 70/30 | **80/20** (DMA-Druck, Adobe-Backlash, Shopify-Standard) | `13-monetization-saas-2-0.md` |
| Web-Layer-Phase | Phase 2 (Monate 4–6) | **Phase 1 vorgezogen** — parallel zum OSS-MVP gelauncht | User-Direktive |
| Provider-Lock-in | Claude Code only | **Multi-Provider von Tag 1** — Claude, Cursor, Codex, Gemini CLI via SKILL.md + AI Gateway | `07-platform-risk-anthropic.md` |
| Handoff-Pack | (nicht im Scope) | **Flagship-Feature Phase 1.5** — komplettes `.claude/` + `context/` + `spec/` + Re-Validation-Loop | User-Direktive + `17-handoff-pack-design.md` |
| Primärer Launch-Channel | IndieHackers + r/SaaS | **r/ClaudeAI + HN Show HN + GitHub Trending** | `15-distribution-channels-2026.md` |
| Cold-Email-MCP-Provider | Resend (alle Sends) | **Resend nur für warm-cold/opt-in; Postmark/Instantly für >50 cold/day** | `12-cold-outreach-deliverability-2026.md` |
| Target Solo-only | Implizit | **Boutique-Agenturen ab Jahr 1 für Platform-Skalierung** (Solo-cap = $15–35M ARR) | `05-market-sizing-tam.md` |

---

## 1. Executive Summary

ValidationKit ist die **erste agent-native Validation-Plattform**, die dem Founder das Experiment nicht *empfiehlt*, sondern **selbst durchführt** — Real-Channel-Outreach via offizielle APIs, deployed Fake-Door-Pages mit Analytics, paid-Ad-Tests mit Budget-Caps, alles mit klickbaren Quellen und auditierbarem State, der im git-Repo des Founders lebt.

**Vision (Nordstern):** Bis 2030 validieren **30 % aller AI-nativen Founder** (Cursor / Claude Code / Codex / v0-User) ihre Idee in ValidationKit, bevor sie eine Codezeile schreiben — und gehen mit einem fertigen `.claude/`-Handoff-Pack ins Bauen. Bis 2040 ist Pre-Validation für Solopreneurs so selbstverständlich wie Stripe für Payments.

**Konkurrenz-Realität 2026:** Die im PRD v0.1 als "AI Auto-Validators" verbuchten Tools sind heterogener als gedacht. **WorthBuild** ($5/Report mit echten Reddit/HN-Leads), **Preuve.ai** (90 % Rejection-Rate, gesourcte Citations), **founderscore** (10-Phase-Multi-Agent-Pipeline mit echten G2-/Reddit-Daten), **PainOnSocial** — sie operationalisieren bereits *heute* unsere "Real Signals statt Vibe Score"-Differenzierung. Die einzige uneingenommene Position: **Claude-Code-native + ausführend** (nicht analysierend) + **Persona-bound Build-time Guardrails** (Handoff-Pack).

**Strategisches Verdict (Build / Pivot / Kill):**

Devil's-Advocate-Agent identifizierte drei Kill-Criteria (Anthropic eats the category, No Quality Edge over Raw Claude, Channel-Saturation). Diese sind real — aber adressierbar:

| Kill-Criterion | Adressierung in PRD v2.0 |
|---|---|
| Anthropic shipt nativen Validator | Multi-Provider von Tag 1, Skill-Marketplace primär, vertikale Compliance (Mom-Test-Konformität, Citation-First) als Moat |
| Kein Edge vs. Raw Claude | Re-Positioning auf **"executes the experiment"** + persona-bound subagents im Handoff-Pack + Multi-Model-Ensemble + auditierbare Source-Citations |
| Channel-Saturation produziert False Negatives | Channel-spezifische Reply-Rate-Benchmarks im `feedback-synthesizer`, Volume-Gates, Hype-Filter, Fallback auf Show-HN/r/ClaudeAI |

→ **Verdict: BUILD MIT REPOSITIONING.** Nicht "framework that generates LLM outputs" — sondern "framework that *runs* the experiment + delivers cited evidence + ships a persona-bound build kit."

**Realistische Marktgröße:** TAM $3.5–6.0 Mrd. / Jahr bis 2030. SAM $700M–1.4 Mrd. SOM Jahr 3: **$8–35 Mio. ARR**. Solo-only-ICP cappt strukturell bei $15–35M (Lifestyle-Cap). Platform-Vision erfordert ab Jahr 1 Boutique-Agenturen als Zweit-Segment.

**12-Monats-Roadmap (überarbeitet):**
- **Phase 0 (Wochen 1–6):** OSS-Framework MVP, 10 Subagents, 7 Commands, Reference-Implementation, Handbook v0
- **Phase 1 (Wochen 7–18):** Hosted Web-App (Next.js + WDK), Real-Channel-Integration (Resend/Reddit/X MCP), **Handoff-Pack als Flagship**, Pricing live ($19 Pro / $5 PAYG)
- **Phase 2 (Monate 4–9):** Boutique-Agency-Tier ($199 Studio), Persona-Library, Marketplace 80/20
- **Phase 3 (Monate 9–18):** Non-Tech-Founder-Mode (Lovable/Bolt-Integration), Enterprise-Pilots, Re-Brand-Window (Sondr?)

---

## 2. Strategisches Verdict im Detail

### 2.1 Die drei Kill-Criteria — adressiert

**KC-1: Anthropic shipt nativen "Validate-Idea"-Skill.** Wahrscheinlichkeit Mid–High in 12 Monaten. **Mitigation:** ValidationKit positioniert sich nicht als "Anthropic-Skill", sondern als **cross-vendor framework, das auf Anthropic Skills, OpenAI Codex Skills, Cursor Subagents, Gemini CLI Skills lauffähig ist** — mit AI Gateway als Routing-Layer. ValidationKit's defensible Moat: vertikale Compliance + Cross-Agent-Audit-Trails + Citation-Standards. Anthropic kann das nicht contern, weil es vendor-neutral sein muss.

**KC-2: Kein Quality Edge vs. Raw Claude + CLAUDE.md.** Echt. Wenn alle Outputs (Personas, Cold-Emails, Landing-Copy) generic-LLM sind, repliziert ein 200-Zeilen CLAUDE.md 70 % des Wertes. **Mitigation:** ValidationKit ist nicht der Output, sondern (a) **der ausgeführte Experiment-Run** (echter Reddit-Post, echter Resend-Send, echter Ad-Spend, echte Conversion-Tracking) und (b) **das Handoff-Pack** mit persona-bound Subagents, die in der Coding-Phase weiter triggern. Raw Claude + CLAUDE.md kann das nicht.

**KC-3: Channel-Saturation = False Negatives.** Cold-Email-Reply-Rate 3.43 % Median 2026 (Hunter.io). ValidationKit-Empfehlung gegen die toten Kanäle ist Churn-Killer. **Mitigation:** `channel-strategist` nutzt 2026-aktualisierte Benchmarks pro Channel (Cold-Email Median 3.43 %, Reddit r/SaaS dead, IndieHackers Tier-3, r/ClaudeAI Tier-1), `feedback-synthesizer` setzt Channel-spezifische Volume-Gates und Politeness-Floors, sodass ein 1 % Cold-Email-Reply-Rate als "Channel-Problem, nicht Idea-Problem" geflaggt wird.

### 2.2 Sekundäre Kill-Risiken (Severity ≥ 4)

- **Synthetic-Persona-Backlash** (4/5): NN/g, ACM Interactions, MeasuringU lehnen 2026 LLM-Personas ab. → Persona-Pipeline neu designt (siehe §13.3).
- **Open-Core-Rückzug** (4/5): MongoDB → Redis → HashiCorp → MinIO alle weg von permissiven Lizenzen. → MIT als Default, mit BSL-Re-License-Option in §25 dokumentiert (kein "OSS-Pinky-Promise").
- **User installiert einmal, kommt nicht wieder** (PRD §15, Wahrscheinlichkeit Hoch): → Handoff-Pack als Retention-Hebel + `/revalidate`-Command + "Idea Garden"-UX (siehe §22).

### 2.3 Pivot-Optionen im Worst Case

Wenn nach 4 Wochen Phase 0 die Reference-Implementation-Resonanz schwach bleibt (<20 GitHub-Stars/Woche, <5 ehrliche Indie-Hacker-Testers), drei Pivot-Pfade:

1. **Pivot A — Anthropic-Skill veröffentlichen:** ValidationKit als single skill im Anthropic Skill Marketplace + claude-plugins-official. Reduzierter Scope, schnelle Distribution.
2. **Pivot B — Channel-Performance-Datenprodukt:** Statt Framework → API/Database für Cold-Email-Reply-Rates / Fake-Door-Conversion-Benchmarks nach Industry. Verkauf an existierende Validation-Tools (WorthBuild, Preuve.ai).
3. **Pivot C — Vertikalisierung:** Niche auf einen Industry-Slice (z. B. "ValidationKit für Healthcare-Apps" — GxP/HIPAA-konforme Pre-Validation). Defensible Moat = vertikale Compliance.

→ Pivot-Trigger explizit in §27 (Success Metrics) verankert.

---

## 3. Vision

### 3.1 50-Jahr-Nordstern

Pre-Validation für Solopreneurs wird so selbstverständlich wie Stripe für Payments. Bis 2076 starten 99 % aller AI-nativen Founder mit einer ValidationKit-Run, bevor sie bauen. Das ist die ambitionierte Vision des Owners.

### 3.2 12-Monats-Brücke (realistische Operationalisierung)

Bis Q2 2027:
- **3 000 GitHub-Stars** (Phase 0 + Phase 1 kombiniert)
- **300 Pro-Subscriber** ($19/mo × 12 = $68k ARR-Run-Rate)
- **20 Boutique-Agenturen** auf Studio-Tier ($79–$199/mo Pilot)
- **5 dokumentierte "saved-me-$50k+"-Case-Studies** als Marketing-Asset
- **Re-Validation-Use-Cases > 30 %** aller Pro-User wöchentlich (echter Retention-Beweis)
- **Multi-Provider-Lauffähigkeit:** Claude Code, Cursor, Codex CLI

### 3.3 Was die Vision *nicht* ist

- Kein Replacement für $10k+ Enterprise-Customer-Discovery (Wynter, Outset bleiben dort dominant)
- Kein "AI-Yes-Man-Validator" (Marktposition ValidatorAI 75/100 für Waffenideen — wir sind das Gegenteil)
- Kein "Build-Tool" (v0 / Lovable / Bolt bleiben dort — wir docken via Handoff-Pack an)

---

## 4. Problem Statement (refined)

Drei zusammenhängende Probleme + ein neues, das aus der Recherche emergiert ist:

1. **Vibe-Score-Inflation:** AI Auto-Validators 2026 (außer Preuve.ai/WorthBuild) liefern Scores ohne Quellen. ValidatorAI gibt identischen 75/100-Score für Massenvernichtungswaffen und sinnvolle Ideen (Show HN belegt).
2. **Pricing-Gap:** Echte Validation kostet $499/Test (Wynter) oder $20/Interview (User Intuition). Solopreneurs ($0–50/mo Budget) bleiben außen vor.
3. **Niemand orchestriert den vollen Stack** zwischen Synthetic Personas → Real Outreach → Real Conversion-Tests → Synthese.
4. **(NEU) Validation-to-Build-Handoff fehlt komplett:** Selbst Founders, die validiert haben, verlieren die Insights, sobald sie ins Coding-Tool wechseln. Keine Persona-Memory, keine Pain-Anchor-Reviews, keine Re-Validation. Validation-Insights drifte off → Produkt drifte weg von der Realität.

---

## 5. Zielgruppen & Personas

### 5.1 Primär P0 — Technische Solopreneurs / Indie Hackers
- Bereits in Claude Code / Cursor / Codex aktiv
- Budget $0–50/mo
- Build B2B SaaS, Dev Tools, AI-Wrapper
- Pain: "ich bau ständig Sachen, die niemand will"
- **Bias-Check:** Founder selbst ist Zielgruppe — Risk of building for self only. Mitigation: 20 strukturierte Mom-Test-Interviews vor Code (§28.1) mit unabhängigen Solopreneurs.

### 5.2 Primär (NEU für Platform-Vision) P0.5 — Boutique-Agenturen & Indie Consultants
- 80–150k Firmen global (Webdev / AI-Consulting / Fractional-CTO)
- Validieren Ideen *für Kunden*
- Budget $200–1000/mo
- Wollen White-Label-Reports + Repeatability + Persona-Bibliothek
- **TAM-Hebel:** Solo-only cappt bei $15–35M ARR. Agenturen + AI-native-Founder = $500M–1.5B möglich. Agenturen müssen ab Jahr 1 mitgedacht werden (Studio-Tier, White-Label-Modus).

### 5.3 Sekundär P1 (ab Phase 2) — Vibe-Coder / Non-Tech-Founder
- Über v0 / Lovable / Bolt aktiv
- Lehnen CLI ab
- Budget $20–50/mo
- Brauchen Web-UI + visueller Output ("Validation Map")

### 5.4 Explizit nicht Zielgruppe (P-never für MVP)
- Enterprise Innovation Teams (Wynter / Outset dominieren)
- Solopreneurs in stark regulierten Märkten (GxP/HIPAA — Phase 3+ als Vertical)
- Pre-Seed-VCs (Outcome-Pricing-Pilot Phase 3)

---

## 6. Wettbewerbslandschaft (Stand Mai 2026)

### 6.1 Aktualisierte Konkurrenz-Map

| Kategorie | Player 2026 | Echter Threat-Level | ValidationKit-Edge |
|---|---|---|---|
| **AI Auto-Validators (Cited)** | WorthBuild ($5/Report, Real Reddit/HN Leads), Preuve.ai (90 % Reject-Rate), founderscore (10-Phase-Pipeline) | **HIGH** — sie operationalisieren bereits "Real Signals" | Nicht analysieren, sondern *ausführen* (Resend-Send, Vercel-Deploy, Ad-API-Call). Handoff-Pack. Multi-Provider |
| **AI Auto-Validators (Generic)** | IdeaProof, ValidatorAI, DimeADozen, PrometAI | LOW — strukturell unterlegen | Zitierte Quellen + Reject-Confidence + Mom-Test-Konformität |
| **AI Auto-Validators (End-to-End)** | GoZigzag (Closed-Source, Scott Ford ex-Techstars) | MEDIUM | Open-Source-Trust, Persona-bound Build-Handoff, Cross-Provider |
| **AI-Moderated Interviews (Affordable)** | User Intuition $20 PAYG, UserCall $99/mo, Strella $150/mo | MEDIUM (steigend zu HIGH 12–18 Mo) | Wir sind Pre-Filter + Orchestrierung, sie sind Panel. MCP-Integration statt Kompetition |
| **AI-Moderated Interviews (Enterprise)** | Wynter, Outset ($30M Series B 12/25), Listen Labs ($500M Valuation), Maze (AI Mod Enterprise-gated) | LOW (down-market push aber im Beobachtungsfenster) | Pricing-Gap-Position |
| **Synthetic Personas (Grounded)** | Stanford 85 % retest, PyMC Labs SSR (open-source, 90 % retest) | MEDIUM | Wir integrieren PyMC's Methode (RAG + SSR + Conjoint) statt eigene neu erfinden |
| **Synthetic Personas (Generic)** | Delve AI, sampl.space, SyntheticUsers, Ask Rally | LOW — kontrovers, NN/g rejects | Wir branden als "Pre-Interview Briefing", nicht "Validation Report" |
| **Dev-Frameworks Subagent-Eco** | wshobson/agents (35.3k ⭐, MIT), VoltAgent/awesome-claude-code-subagents (19.7k ⭐), hesreallyhim/awesome-claude-code (43.6k ⭐), claudekit (708 ⭐) | NEUTRAL → POTENTIAL ALLIES | Wir kategorisieren als "Product & Validation"-Lücke in VoltAgent, listen in awesome-claude-code, submit zu claude-plugins-official |
| **Cold-Outreach-Automation** | Expandi, HeyReach, Waalaxy, ColdDMs, Smartlead, Instantly | OUT-OF-SCOPE (ToS-Verstöße) | Wir liefern Drafts, User postet manuell — Reputation bleibt sauber |

### 6.2 Direktester Konkurrent — refresh

**Nicht mehr GoZigzag**, sondern **WorthBuild + Preuve.ai + founderscore Cluster**. Sie haben bereits Real-Source-Citations, sind günstig ($5–25), und scratchen den gleichen Itch. Unser Edge muss > "wir haben das auch" sein.

### 6.3 Konkrete Differenzierung in einem Satz

> "ValidationKit ist das einzige Validation-Framework, das das Experiment **selbst ausführt** (echter Resend-Send, echter Vercel-Deploy, echter Meta-Ad-Spend mit Budget-Cap), die Evidenz mit klickbaren Quellen versieht, und am Ende ein **Persona-bound Build-Kit** liefert, das in deinem nächsten Cursor- / Claude-Code-Projekt sicherstellt, dass du nicht von der validierten Realität abdriftest."

---

## 7. Value Proposition & Differenzierung

### 7.1 Was ValidationKit anders macht (refresh)

1. **Ausführend, nicht analysierend.** Real-Channel-Integration ist Phase-1-Pflicht (Resend, Reddit-API, Vercel-Deploy, Meta-Ads-API mit Budget-Caps).
2. **Citation-First Evidence.** Jedes Insight kommt mit klickbarer URL + Datum + Quelle. Snake-Oil-Score-Engines können das nicht kontern.
3. **Persona-bound Build Handoff.** Nach Go-Empfehlung: vollständiges `.claude/`-Pack mit produktspezifischen Subagents, die auch in der Coding-Phase auf Drift checken. Einzigartig.
4. **Multi-Provider von Tag 1.** Skill.md-Spec ist Standard (Dez 2025), AI Gateway routet Claude/GPT/Gemini. Anthropic-Lock-out ist kein Game-Over.
5. **Real-Source RAG-grounded Personas.** PyMC-SSR-konform für Likert-Outputs, Forced-Choice-Conjoint für WTP. Eliminiert das "snake-oil"-Risiko.
6. **Open-Core mit ehrlicher Lizenz-Strategie.** MIT für Framework + BSL/Apache-2.0-Re-License-Option dokumentiert (kein Pinky-Promise wie HashiCorp).
7. **Legitimate Channels Only.** Keine LinkedIn-DM-Auto, keine ToS-Verstöße, Reputation des Founders bleibt sauber.
8. **Solopreneur AND Boutique-Agency.** Studio-Tier ab Phase 2, White-Label, Persona-Library — Platform-Skalierung adressiert.

### 7.2 Was es explizit *nicht* ist

- Kein Spam-Tool (siehe §11 Non-Goals)
- Kein Logo-/Pitch-Deck-Generator
- Kein Replacement für $10k+ Enterprise-Discovery
- Kein "AI-Yes-Man" — wir lehnen schwache Ideen explizit ab ("Most ideas fail this. That's the point.")
- Kein autonomer "Validate-and-Build-and-Launch"-Agent (Madhavan-Autonomy-Test: nein. ValidationKit augmentiert Entscheidungen.)

---

## 8. Naming-Entscheidung

### 8.1 Status der PRD-v0.1-Kandidaten

| Name | Status (Mai 2026) | Verdict |
|---|---|---|
| **ValidationKit** | npm `validationkit` frei, `create-validationkit` frei, `@validationkit/*` frei. GitHub-Org `validationkit` durch dormant Java/Spring belegt → nutze **`validationkit-ai`**. Q42/ValidationKit (Swift, MIT, dormant) + claudekit (708 ⭐) adjacent | OK als Working Title (12-Monats-Brücke) |
| **ProofStack** | 3 aktive Firmen, davon **proofstack-ai.vercel.app als direkter Validation-Konkurrent**. 3 TLDs belegt | **TOT** |
| **PMFKit** | pmfkit.com live mit "Diagnose your product. Decide what to build next." (exakt unsere Value-Prop) | **TOT** |
| **DemandLab** | DemandLab Inc.5000-Martech-Agency seit 2009, starke Common-Law-Marke | **TOT** |
| **SignalKit** | 6-fach belegt (ParentSquare-Subsidiary, 2 OSS-Frameworks, npm, Signal-Messenger-TM) | **TOT** |
| **Validar** | validar.com (20 Jahre Event-Tech-Firma, B2B-Marketing-Adjacent) | **TOT** |

### 8.2 Empfehlung — Two-Phase-Naming

**Phase 0 (Wochen 1–18): ValidationKit als Working Title.**
- Pro: schneller Launch, GitHub-Org `validationkit-ai`, beschreibend, SEO-okay
- Contra: "-Kit"-Suffix limitiert Plattform-Ambition, kategorie-eng

**Phase 1.5 / 2 (M9–M12): Re-Brand-Fenster.**
- Empfehlung **Sondr** (nautisch "die Tiefe ausloten" — perfekte Validation-Metapher, 5 Buchstaben, kategorie-frei wie Stripe / Linear / Notion)
- Alternative **Pondera** (lat. "abwägen", evidence-weighing, Boardroom-tauglich)
- Vor Re-Brand: $300–500 USPTO/EUIPO-Profi-Check + `.com`-Acquisition (.ai/.dev als Fallback)

### 8.3 Action-Items
- [ ] Heute: npm `validationkit`, `create-validationkit`, GitHub `validationkit-ai` reservieren
- [ ] Woche 2: Namecheap-Bulk-Check `sondr.*` und `pondera.*`
- [ ] M6: USPTO/EUIPO-Profi-Check Sondr + Pondera + 1 Wild-Card
- [ ] M9: Re-Brand-Decision-Point dokumentiert in `decisions/`

---

## 9. MVP-Scope — Phase 0 (überarbeitet)

### 9.1 Build-Ziel
In 6 Wochen ein installierbares Multi-Provider-Framework, das eine Idee durchläuft und einen **"Pre-Interview Hypothesis Briefing"** + erste konkrete Action-Items + Citation-Source-File produziert. CLI-first, Skill-Marketplace-ready.

### 9.2 Phase-0-Features (überarbeitet)

- **Installer:** `npx create-validationkit@latest` legt monorepo-kompatible `.claude/`- und `.cursor/`-Struktur an (Multi-Provider)
- **10 Core Subagents** (siehe §13)
- **7 Slash Commands** (siehe §14)
- **"Pre-Interview Hypothesis Briefing"** als strukturiertes Markdown-Output mit:
  - Severity-Bändern (statt Fake-Precision-Scores)
  - Klickbaren Quellen-Citations
  - Konfidenz-Indikator pro Insight
  - Multi-Model-Ensemble-Agreement-Score
- **Persistent State** in `.validationkit/state.json` (kompatibel mit Cursor `.cursorrules` Mirror)
- **CLI-only** (Web-UI in Phase 1 vorgezogen, aber Phase 0 ist CLI)
- **Reference Implementation:** eine echt validierte Idee als Beispiel im README (Founder dogfood-pflicht)
- **Validation Handbook v0** als `docs/handbook.md` — die "Mom-Test-für-AI-Coder"-Bibel (öffentliches Wissensasset, SEO + Authority)

### 9.3 Phase-0-Erfolgskriterien (refresh)

- User schafft "Idee → Pre-Interview Briefing + Cold-Email-Draft + Fake-Door-Spec" in **<25 Min** (5 min schneller als v0.1 wegen Streamlining)
- ≥5 echte Indie-Hackers nutzen Framework end-to-end + geben dokumentiertes Feedback (PRD v0.1: 3, erhöht für Robustheit)
- GitHub: **200+ Stars in 30 Tagen post-Launch** (v0.1: 100, erhöht weil GTM-Playbook + r/ClaudeAI-Distribution stärker)
- ≥3 Dogfood-Validations vom Founder selbst (auf eigene Side-Projekt-Ideen)

---

## 10. Phase 1 — Hosted Web-App + Real Channels + Handoff-Pack (Wochen 7–18)

Phase 1 ist **deutlich größer als v0.1** (das v0.1 als Phase 1+2+3 spreadte). User-Direktive: Web-Layer vorziehen. Konsequenz: 12 Wochen Phase 1.

### 10.1 Web-Layer (Wochen 7–14)

Vollständige Architektur in §17.

Highlights:
- Hosted Pipelines (Vercel WDK / DurableAgent)
- Auth via Clerk (Marketplace-Auto-Provisioning)
- DB: Neon Postgres + Drizzle + pgvector (Persona-Similarity)
- Storage: Vercel Blob für Reports, Runtime Cache für Hot Data
- Billing: Stripe — Free / **Pro $19** / **PAYG $5/Validation**
- Real-time Streaming: AI SDK + `useChat` für live agent progress
- Validation Map als shareable artifact mit eigener öffentlicher URL (siehe §22.2)

### 10.2 Real-Channel-Integration (Wochen 10–16)

- **Resend-MCP** für warm-cold-Email-Sends (mit Double-Opt-In-Check, Volume-Cap pro User-Account, Consent-Gate vor jedem Send)
- **Postmark / Instantly als Power-User-Fallback** (>50 cold/day, separat dokumentiert)
- **Vercel-Deploy-MCP** für Fake-Door-Pages (auto-generated mit reCAPTCHA, UTM, Plausible-Analytics)
- **Reddit-MCP read-only** für Sub-Rules-Auto-Check und Tone-Matching im `outreach-writer`
- **Twitter/X-MCP read-only** für Founder-Following-Validation
- **Meta-Ads-API + Google-Ads-API** mit harten Budget-Caps ($25–$200) und Pre-Spend-Confirmation
- **Plausible / PostHog** für Conversion-Tracking auf den Fake-Door-Pages

### 10.3 Handoff-Pack als Flagship-Feature (Wochen 14–18)

Vollständige Spec in §15.

Highlights:
- Neuer Subagent `handoff-pack-builder` (Nr. 11)
- Neuer Command `/handoff`
- Output: Komplettes Projekt-Skeleton (`.claude/` + `.cursor/` + `context/` + `spec/` + `decisions/` + `.validationkit/handoff-manifest.json`)
- **3 persona-bound Subagents** im Pack: `customer-empathy-checker`, `pain-anchored-feature-reviewer`, `pricing-tester`
- **`.cursorrules` Mirror** für Cursor-User
- **`--git-init`** Flag für automatischen Repo-Setup
- **Re-Validation-Loop** via `handoff-manifest.json` (Pointer zurück zum ValidationKit-State)

### 10.4 Phase-1-Erfolgskriterien
- 1 000 GitHub-Stars (kumulativ)
- 50 Pro-Subscriber ($19 × 50 = $950/mo)
- 30 % aller Phase-0-User generieren Handoff-Pack (Retention-Proxy)
- 5 Boutique-Agency-Pilots eingeworben (Studio-Tier Phase 2 Pipeline)
- Cross-Provider-Demo: ValidationKit läuft nachweislich in Claude Code UND Cursor UND Codex CLI

---

## 11. Phase 2–4 — Long-Horizon

### Phase 2 — Boutique-Agency-Tier (Monate 4–9)
- **Studio-Tier $79/mo (Solo-Power) + $199/mo (Agency)** — White-Label-Reports, Custom-Branded Validation-Maps, Persona-Library (zugekaufte Industry-Persona-Packs), Multi-Project, Team-Seats
- **Persona-Library** als Marketplace-Vorbereitung (Industry-Specific Persona-Packs, kuratiert)
- **Cohort-Analytics** für Re-Validation: "deine Ideen-Cohort vs. Industry-Median"
- **Public API** für Embedded-Validation in v0 / Cursor / Lovable

### Phase 3 — Marketplace + Non-Tech-Mode (Monate 9–18)
- **Persona-Pack-Marketplace** (Industry-spezifisch, kuratiert, **80/20 Split**)
- **Custom-Agent-Templates** (Bring-your-own-Subagent)
- **Non-Tech-Founder-Mode:** Web-UI optimiert für v0/Lovable-User, kein CLI nötig
- **Re-Brand-Entscheidung** dokumentiert (Sondr / Pondera / ValidationKit?)

### Phase 4 — Plattform-Vision (Monate 18–36)
- **Enterprise-Pilots** mit VCs (Outcome-Based-Pricing-Pilot: $25k–$150k/Jahr für Pre-Seed-Portfolio-Validation)
- **Vertical-Compliance-Editions** (Healthcare = GxP/HIPAA, FinTech = PCI/SOC2)
- **Multi-Modal-Validation** (Voice-Persona-Interviews, Video-Validation-Maps)
- **"Validation OS"** — Ambient-Re-Validation via wöchentliche Cron-Jobs, neue Insights als PR auf das Repo

---

## 12. Framework-Architektur

### 12.1 Verzeichnis-Struktur

```
validationkit/                                     # Repo Monorepo (Turborepo + pnpm)
├── apps/
│   ├── web/                                       # Next.js 16 Hosted-Dashboard
│   │   ├── app/                                   # App Router
│   │   ├── components/                            # Tailwind + shadcn/ui
│   │   └── ...
│   ├── cli/                                       # Node-Wrapper + npx create-validationkit
│   │   └── src/
│   └── docs/                                      # Validation Handbook (Nextra)
├── packages/
│   ├── agents/                                    # Single Source of Truth (TypeScript)
│   │   ├── idea-clarifier/
│   │   ├── market-researcher/
│   │   ├── persona-generator/
│   │   ├── persona-interviewer/
│   │   ├── jtbd-interviewer/                      # NEU §13.5
│   │   ├── channel-strategist/
│   │   ├── outreach-writer/
│   │   ├── fake-door-designer/
│   │   ├── pre-sale-orchestrator/                 # NEU §13.9
│   │   ├── pricing-tester/                        # NEU §13.10
│   │   ├── feedback-synthesizer/
│   │   └── handoff-pack-builder/                  # NEU §13.11 (Phase 1.5)
│   ├── sdk/                                       # @validationkit/sdk (v0.2+)
│   ├── runners/
│   │   ├── local-runner/                          # → kompiliert zu .claude/agents/*.md
│   │   ├── cursor-runner/                         # → .cursor/agents/*.md (Multi-Provider)
│   │   ├── codex-runner/                          # → codex skill format
│   │   └── workflow-runner/                       # → Vercel WDK DurableAgent
│   ├── skills/                                    # Cross-vendor SKILL.md spec
│   ├── handbook/                                  # Validation Handbook content (Markdown)
│   └── shared/                                    # Types, constants, prompts
├── installers/
│   └── create-validationkit/                      # npm: create-validationkit
├── examples/
│   └── reference-validation/                      # Eine echte gedogfoodete Validation
├── .claude/                                       # Projekt-eigenes Kontextkonstrukt (für die Arbeit AM Projekt)
│   ├── CLAUDE.md
│   ├── agents/
│   ├── commands/
│   └── skills/
└── README.md
```

### 12.2 Subagent-Orchestrierung (refresh)

Hauptagent orchestriert die Subagents in einer **modularen Pipeline**, jede Phase standalone lauffähig:

```
[Idee]
  → idea-clarifier
  → market-researcher (mit Citation-First)
  → persona-generator (RAG-grounded, Multi-Model-Ensemble)
  → persona-interviewer + jtbd-interviewer (parallel, Forced-Choice-WTP)
  → channel-strategist (2026-Benchmark-aware)
  → outreach-writer  +  fake-door-designer  +  pricing-tester (parallel)
  → [Mensch führt aus: Posts, Emails, Landing Page live, Pre-Sale-Page]
  → feedback-synthesizer (mit Demand-Signal-Score-Algorithmus §19)
  → pre-sale-orchestrator (LOI / Stripe-Pre-Order / Concierge-MVP)
  → [Go/No-Go-Entscheidung]
  → handoff-pack-builder (Phase 1.5+)
```

### 12.3 Multi-Provider-Strategie

Jeder Subagent existiert als TypeScript-Definition in `packages/agents/`. Runners kompilieren on-build:
- `local-runner` → `.claude/agents/*.md` für Claude Code
- `cursor-runner` → `.cursor/agents/*.md` für Cursor
- `codex-runner` → Codex-Skill-Format
- `workflow-runner` → Vercel WDK `DurableAgent` für Hosted

Eliminiert die Anthropic-Lock-in-Falle (KC-1) strukturell.

---

## 13. Core Subagents (Phase 0: 10 Stück, Phase 1.5: +1 = 11)

Jeder Subagent ist eine TypeScript-Definition in `packages/agents/`, kompiliert zu Markdown mit YAML-Frontmatter für Claude-Code-Kompatibilität.

### 13.1 `idea-clarifier`
**Trigger:** Initial-Start, vage Idee
**Tools:** Read, Write, AskUser
**Job:** 5–10 Klärungsfragen + strukturiertes Problem-Statement-File
**Output:** `context/problem-statement.md`

### 13.2 `market-researcher`
**Tools:** WebSearch, WebFetch, Read, Write
**Job:** 5–10 direkte/indirekte Konkurrenten, Pricing, USPs, Reviews — **mit klickbaren Citation-URLs zu jedem Insight**
**Output:** `context/competitive-landscape.md` + `context/citations.json` (machine-readable Source-Liste)

### 13.3 `persona-generator` (REDESIGNED — Snake-Oil-Mitigation)
**Tools:** WebSearch, WebFetch, Read, Write
**Job:**
- 3–5 detaillierte Buyer Personas (mindestens 1 Skeptiker, 1 Early Adopter, 1 Mainstream)
- **RAG-grounded** auf echte Reddit-Threads, G2-Reviews, IndieHackers-Posts, X-Threads (gefunden via market-researcher)
- **Multi-Model-Ensemble:** Generiert mit Claude Sonnet 4.6, GPT-5.4, Gemini-2.5-Pro parallel — Output inkl. Inter-Model-Agreement-Score
- **Bias-Disclosure:** Persona-File enthält Section "Documented LLM Persona Limitations" (Argyle 2023, Bisbee 2024, NN/g)
**Output:** `context/personas/persona-*.md` + `context/personas/agreement-score.json`

### 13.4 `persona-interviewer` (REDESIGNED)
**Tools:** Read, Write, Task (spawnt Sub-Sub-Agents)
**Job:** Pro Persona einen Sub-Agent für simuliertes Interview
- **Forced-Choice-WTP** statt Open-ended-"would-you-pay?" (eliminiert RLHF-Sycophancy, Acquiescence-Bias)
- **Skeptical-Interviewer-Mode:** zweiter Pass mit explizit skeptischer Anti-People-Pleasing-Persönlichkeit
- **Severity-Bänder:** Pain-Severity in {Critical, High, Mid, Low, Trivial}, nicht numerisch
- **Will-Pay-Indikator** als {Hard-Yes-with-Price, Maybe, No-Without-X, Hard-No}
**Output:** `context/interviews/persona-*-interview.md` + `context/interviews/synthesis.md`

### 13.5 `jtbd-interviewer` (NEU)
**Tools:** Read, Write, Task
**Job:** Job-to-be-Done Switch-Interview-Technik nach Christensen / Klement
- 4-Forces-Struktur (Push, Pull, Anxiety, Habit)
- First-Thought-to-Decision-Tracing
- Pro Persona ein JTBD-Interview parallel zum klassischen Interview
**Output:** `context/jtbd/persona-*-jtbd.md`

### 13.6 `channel-strategist` (UPDATED)
**Tools:** Read, Write, WebFetch (für Sub-Rule-Checks)
**Job:** Bewertet basierend auf Persona-Profilen welche **legitimen** Channels Sinn machen
- **2026-aktualisierte Benchmarks** (Cold-Email Median 3.43 %, r/SaaS dead, IndieHackers Tier-3, r/ClaudeAI Tier-1, HN Show-HN für Curiosity-Validators, Meta-Ads für High-Intent)
- Reddit-Sub-Rule-Auto-Check (Promo-Limits, Mod-Policies)
- Volume-Recommendations pro Channel
**Explizit ausgeschlossen:** LinkedIn-DM-Auto, Instagram-DM-Auto
**Output:** `context/channels.md`

### 13.7 `outreach-writer`
**Tools:** Read, Write
**Job:** Pro empfohlenem Channel einen Draft (Cold Email, Reddit Post, X Thread, HN Show-HN, etc.). User postet/schickt manuell (oder via Resend-MCP in Phase 1 mit Consent-Gate).
**Output:** `drafts/*.md`

### 13.8 `fake-door-designer` (UPDATED)
**Tools:** Read, Write
**Job:** Landing-Page-Copy + Wireframe-Spec für Fake-Door-Test mit:
- Pricing-Anker sichtbar (Quality-Multiplier im Signal-Score)
- Two-Step-Capture (Email + Qualifying-Question)
- UTM-Tracking-Pflicht
- reCAPTCHA für Bot-Filter
- Time-to-Access-Statement
- Optionaler Survey-Schritt
- HTML-Output für Vercel-Deploy (Phase 1)
**Output:** `landing/spec.md` + `landing/page.html` + `landing/copy.md`

### 13.9 `pre-sale-orchestrator` (NEU)
**Tools:** Read, Write, WebFetch
**Job:** Wenn Demand-Signal > Mid:
- LOI-Template (Letter-of-Intent für B2B)
- Stripe-Preorder-Page-Spec (für B2C)
- Concierge-MVP-Playbook (manuelle Service-Delivery-Spec für Pre-Customers)
- Pricing-Hypothesis-Test
**Output:** `pre-sale/loi-template.md` + `pre-sale/stripe-spec.md` + `pre-sale/concierge-playbook.md`

### 13.10 `pricing-tester` (NEU)
**Tools:** Read, Write
**Job:** Van-Westendorp-Pricing-Test-Spec (4 Fragen) + optional MaxDiff für Feature-Bundling
- Generiert Survey-Fragen
- Auswertung-Heuristik
- Pricing-Range-Output (RPP / OPP / Acceptable-Range)
**Output:** `pricing/test.md` + `pricing/analysis.md`

### 13.11 `feedback-synthesizer` (UPDATED)
**Tools:** Read, Write, WebFetch
**Job:** Aggregiert echte Daten (Email-Replies, Landing-Page-Conversions, Ad-CTRs, Reddit-Comments, Pre-Sale-Conversions) und produziert:
- **Demand-Signal-Score** nach Algorithmus in §19 (Volume-Gates, Quality-Multipliers, False-Positive-Penalty)
- Top-3 Insights mit klickbaren Quellen
- **Pivot / Build / Kill** als kategoriales Verdict (nicht numerisch)
- Channel-Performance-Diagnose ("1 % Cold-Email-Reply ist Deliverability-Problem, nicht Idee-Problem")
**Output:** `reports/synthesis.md` + `reports/signal-score.json`

### 13.12 `handoff-pack-builder` (NEU — Phase 1.5)
**Tools:** Read, Write, WebFetch
**Job:** Wenn `feedback-synthesizer.verdict === "Build"`:
- Generiert komplettes Build-Kit (siehe §15)
- Erstellt 3 persona-bound Subagents im Pack (`customer-empathy-checker`, `pain-anchored-feature-reviewer`, `pricing-tester`)
- Wählt regelbasiert Tech-Stack (Next.js-B2B / CLI-Dev / Next-Consumer-Mode)
- Mirror nach `.cursorrules` für Cursor-Compat
- `handoff-manifest.json` als Pointer zurück zum Validation-State
**Output:** `handoff/<idea-name>/` mit vollständiger Struktur

---

## 14. Slash Commands (Phase 0: 7 Stück)

| Command | Subagents involved | Output |
|---|---|---|
| `/validate "<idea>"` | clarifier → researcher → personas (gen+int+jtbd parallel) → channel-strategist | `reports/initial-validation.md` |
| `/persona-test` | persona-interviewer + jtbd-interviewer (re-run) | Persona-Interview-Transkripte |
| `/outreach <channel>` | channel-strategist → outreach-writer | `drafts/<channel>.md` |
| `/landing-page` | fake-door-designer | `landing/` Verzeichnis |
| `/pre-sale` | pre-sale-orchestrator | `pre-sale/` Verzeichnis |
| `/price-test` | pricing-tester | `pricing/` Verzeichnis |
| `/synthesize <data-folder>` | feedback-synthesizer | `reports/synthesis.md` + Verdict |
| `/handoff` (Phase 1.5) | handoff-pack-builder | `handoff/<idea-name>/` Pack |
| `/revalidate` (Phase 1.5) | handoff-pack-builder + feedback-synthesizer | Diff alte vs. neue Validation in `decisions/` |

---

## 15. Handoff-Pack — Vollständige Spec

### 15.1 Output-Verzeichnis-Struktur (vollständig)

```
<validated-idea-slug>/
├── .claude/
│   ├── CLAUDE.md                                    # Auto-generiert aus Validation-Insights
│   ├── agents/
│   │   ├── customer-empathy-checker.md             # Persona-bound, prüft Code/Spec gegen Pain-Anchors
│   │   ├── pain-anchored-feature-reviewer.md       # Prüft jede neue Feature-Idee gegen JTBD-Forces
│   │   ├── pricing-tester.md                       # Re-Run-fähig für Pricing-Iteration
│   │   ├── (3-5 weitere product-spezifische Subagents je nach Stack)
│   ├── commands/
│   │   ├── revalidate.md                           # Re-Run Validation gegen neue Datenpunkte
│   │   ├── pain-check.md                           # Quick-Pain-Anchor-Check für aktuelle Feature
│   │   ├── persona-quote.md                        # "Was würde Persona X dazu sagen?"
│   │   ├── pre-launch-readiness.md                 # Vor jedem Launch laufen
│   │   ├── handoff-update.md                       # Sync mit ValidationKit-Source-Projekt
│   └── skills/                                      # Cross-vendor SKILL.md mirror
├── .cursor/                                         # Mirror für Cursor-User
│   ├── .cursorrules
│   └── agents/
├── context/                                         # READ-ONLY, Source of Truth aus Validation
│   ├── personas/
│   │   ├── persona-skeptiker.md
│   │   ├── persona-early-adopter.md
│   │   ├── persona-mainstream.md
│   ├── pain-points.md                              # Top Pains mit Quote-Citations
│   ├── jtbd.md                                     # 4-Forces + Switch-Interviews
│   ├── competitive-landscape.md
│   ├── channels.md
│   ├── demand-signals.md                           # Echte Daten + Signal-Score
│   ├── citations.json                              # Machine-readable Sources
│   └── README.md                                   # "Read this FIRST in every session"
├── spec/                                            # GENERATIVE, Decisions
│   ├── product-prd.md                              # PRD für DAS PRODUKT (nicht ValidationKit)
│   ├── tech-stack-recommendation.md                # Regelbasiert (s.u. §15.3)
│   ├── mvp-scope.md
│   ├── pricing-hypothesis.md
│   └── architecture-sketch.md
├── decisions/                                       # ADR-style, append-only
│   ├── 0001-tech-stack-choice.md
│   ├── 0002-pricing-tier-decision.md
│   └── ...
├── .validationkit/
│   └── handoff-manifest.json                       # Pointer + Re-Validation-Trigger-Config
├── .gitignore
├── package.json (optional, je Tech-Stack)
└── README.md                                        # "Validated <date> via ValidationKit. See context/ for inputs, spec/ for output."
```

### 15.2 `CLAUDE.md`-Inhalt (auto-generiert)

```markdown
# <product-name>

> Validated <date> via ValidationKit. **Read `context/README.md` first.**

## Who this is for
[Synthesis aus personas/]

## What problem we solve (their words, not yours)
[Quote-block aus pain-points.md]

## JTBD (the job they hire us for)
[Aus jtbd.md]

## What we do NOT do
[Anti-Scope, abgeleitet aus interviews/synthesis.md]

## Tech Stack (and why)
[Aus spec/tech-stack-recommendation.md mit per-Layer-Begründung]

## How to add a feature
1. Run `/pain-check "<feature-idea>"` first
2. If pain-check passes, run `/persona-quote "<feature-idea>"`
3. If all three personas converge, write spec in spec/
4. Add ADR to decisions/

## How to re-validate
Run `/revalidate` when:
- 30 days have passed
- A core assumption looks wrong
- You're about to make a > $5k or > 1-week investment
```

### 15.3 Tech-Stack-Empfehlungs-Regelwerk (deterministisch)

| Trigger (aus Validation-State) | Empfohlener Stack |
|---|---|
| `persona.technical_level == "non-technical"` AND `distribution == "consumer"` | Lovable / Bolt + Supabase + Stripe |
| `persona.technical_level == "developer"` AND `target == "B2B SaaS"` | Next.js 16 + Vercel + Neon + Clerk + Stripe |
| `target == "Dev Tool"` AND `distribution == "GitHub"` | TypeScript Monorepo + Turborepo + npm + GitHub Releases |
| `pricing.tier == "free + paid"` AND `traffic == "high"` | Cache-Components (Next.js 16) + Edge-Functions |
| `target == "Mobile App"` | Expo + Supabase + RevenueCat |

Deterministisch, auditierbar — kein LLM-Freestyle.

### 15.4 Re-Validation-Loop

`handoff-manifest.json`:
```json
{
  "validationkit_run_id": "<uuid>",
  "validationkit_source": "github.com/<user>/<repo>",
  "validated_at": "2026-05-14T10:30:00Z",
  "verdict": "Build",
  "demand_signal_score": 72,
  "last_revalidation": null,
  "revalidation_due": "2026-06-13",
  "key_assumptions": [
    {"id": "a1", "claim": "Solopreneurs would pay $19/mo for...", "evidence_strength": "Mid"},
    ...
  ]
}
```

Bei `/revalidate`:
- Diff der Signale alt vs. neu
- ADR-Entry in `decisions/0XX-revalidation-<date>.md`
- CLAUDE.md-Update mit "Last revalidation: <date>, key changes: ..."

---

## 16. Web-Layer — Architektur (vollständig)

### 16.1 Monorepo-Layout

Siehe §12.1. Turborepo + pnpm-workspaces.

### 16.2 Runtime

- **Hosted Pipelines:** Vercel **Workflow DevKit** (`DurableAgent` aus `@vercel/workflow`)
- **Begründung:** native AI-SDK-Integration (`getWritable<UIMessageChunk>()` streamt direkt in `useChat`), Crash-Recovery, Hooks für Human-in-Loop, kein Drittservice
- **Inngest / Trigger.dev:** nur Fallback wenn WDK Limits trifft (z. B. > 30 min Pipeline-Time)

### 16.3 Auth

- **Clerk** via Vercel Marketplace (Auto-Provisioning, Free-Tier 10k MAU, Orgs out-of-box für Studio-Tier)
- Auth.js / WorkOS als dokumentierte Alternativen für Enterprise (Phase 4)

### 16.4 DB

- **Neon Postgres** (Marketplace) + Drizzle ORM
- **pgvector** für Persona-Similarity-Search
- Branch-DBs für Preview-Deploys (CI-Speed-Hebel)

### 16.5 Storage & Cache

- **Vercel Blob** für Reports, Personas, Generated Landing Pages
- **Vercel Runtime Cache** für Hot Data (z. B. Competitive-Landscape-Cache mit cache-tags pro Industry)

### 16.6 Billing

- **Stripe** direkt
- 4 Tiers: Free / **Pro $19** / **PAYG $5/Validation** / **Studio $79–$199 (Phase 2)**
- Token-Attribution via AI Gateway Tags pro User
- Hard Budget-Caps pro User-Account (gegen LLM-Cost-Eskalation)

### 16.7 LLM Routing

- **Vercel AI Gateway**
- Primary: Claude Sonnet 4.6
- Failover: GPT-5.4 (Reliability)
- Cost-Optimized Sub-Sub-Agents: Claude Haiku 4.5 (z. B. für jeden Persona-Sub-Sub-Agent im Interview-Spawn)
- Multi-Model-Ensemble für `persona-generator` und `persona-interviewer` (Inter-Model-Agreement-Score)

### 16.8 Real-time Streaming

- AI SDK + `useChat` Hook für live Agent-Progress
- `DurableAgent`'s `getWritable<UIMessageChunk>()` für End-to-End-Streaming durch WDK
- Server-Sent-Events für lange-laufende Pipelines

### 16.9 Architektur-Diagramm

```
                                ┌────────────────────────────┐
                                │   apps/web (Next.js 16)    │
                                │   - Validation Dashboard   │
                                │   - Validation Map (share) │
                                │   - Stripe Billing UI      │
                                │   - Clerk Auth             │
                                └─────────────┬──────────────┘
                                              │ useChat
                                              ▼
                                ┌────────────────────────────┐
                                │  Route Handler / Workflow  │
                                │  (app/api/validate/route)  │
                                └─────────────┬──────────────┘
                                              │ start workflow
                                              ▼
                                ┌────────────────────────────┐
                                │  Vercel Workflow DevKit    │
                                │  - DurableAgent steps      │
                                │  - Human-in-Loop hooks     │
                                │  - Crash recovery          │
                                └────┬─────────┬─────────┬───┘
                                     │         │         │
                          ┌──────────▼──┐ ┌────▼─────┐ ┌─▼────────┐
                          │ packages/   │ │ AI       │ │ MCP      │
                          │ agents      │ │ Gateway  │ │ Servers  │
                          │ (Single SoT)│ │ (Claude/ │ │ Resend   │
                          │             │ │ GPT/Gem) │ │ Vercel   │
                          └──────┬──────┘ └──────────┘ │ Reddit   │
                                 │                     │ Meta-Ads │
                                 │                     └──────────┘
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
      ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
      │ local-runner  │  │ cursor-runner │  │ workflow-runner│
      │ → .claude/    │  │ → .cursor/    │  │ → DurableAgent │
      │   agents/*.md │  │   agents/*.md │  │   on Vercel    │
      └───────────────┘  └───────────────┘  └───────────────┘
              │                  │                  │
              ▼                  ▼                  ▼
       Claude Code        Cursor IDE         apps/web (Hosted)
       (OSS CLI)          (Multi-Provider)

                                      ┌────────────────┐
                                      │  Neon Postgres │
                                      │  + pgvector    │
                                      │  + Drizzle     │
                                      └────────────────┘
                                      ┌────────────────┐
                                      │ Vercel Blob    │
                                      │ Runtime Cache  │
                                      └────────────────┘
```

### 16.10 Größte Architektur-Risiken (aus `16-web-layer-architecture.md`)

1. **Token-Kosten-Eskalation** — 50 Personas × 30 Min Interview ≈ 1.5M Tokens/Run. **Mitigation:** Pre-flight Estimation, harte AI-Gateway-Budget-Caps pro User-Tier, Claude Haiku für Sub-Sub-Agents (10× günstiger).
2. **Runner-Drift** zwischen LocalRunner und WorkflowRunner. **Mitigation:** Snapshot-Tests in CI, identische Prompt-Templates, Determinismus-Tests.
3. **WDK-Vendor-Lock** auf Vercel. **Mitigation:** Runner-Abstraktion strikt durchhalten, keine WDK-Primitives außerhalb `packages/runners/`. Inngest-Adapter dokumentiert als Migrationspfad.

---

## 17. Tech-Stack-Tabelle

| Layer | Wahl | Begründung |
|---|---|---|
| Monorepo | Turborepo + pnpm | Standard, schnell, gut mit Vercel |
| Agent Runtime | Claude Agent SDK (CLI) + Vercel WDK (Hosted) | Native Spec, kein Re-Implement |
| Sprache | TypeScript (Tooling) + Markdown (Agents) | Claude-Code-Standard |
| Web Framework | Next.js 16 + App Router + Cache Components | Modern, Vercel-aligned |
| UI | Tailwind + shadcn/ui | Standard 2026 |
| Auth | Clerk via Vercel Marketplace | Auto-Provisioning |
| DB | Neon Postgres + Drizzle + pgvector | Branch-DBs, Cost-Efficient |
| Storage | Vercel Blob | Native |
| Cache | Vercel Runtime Cache | Cross-Function Sharing |
| LLM Routing | Vercel AI Gateway | Multi-Provider, Cost-Tracking |
| Streaming | AI SDK + `useChat` | Native zu WDK |
| Billing | Stripe | Industry-Standard |
| MCP (Phase 0) | WebSearch, WebFetch | Built-in |
| MCP (Phase 1) | Resend, Vercel-Deploy, Reddit-Read, X-Read, Meta-Ads, Google-Ads, Plausible/PostHog | Real-Channel-Execution |
| Local State | JSON in `.validationkit/state.json` | No-Cloud-Dependency |
| Hosted State | Neon Postgres | Phase 1+ |
| Distribution | npm + GitHub + Vercel Plugin Marketplace + claude-plugins-official | Multi-Channel |
| Docs | Nextra | Standard Vercel-Site |

---

## 18. Validation-Methodology-Coverage (Gap-Closure)

Aus `10-validation-methodology-gap.md` — was wir vorher nicht hatten, jetzt haben:

| Methodologie | v0.1-Coverage | v2.0-Coverage |
|---|---|---|
| Mom-Test (Rob Fitzpatrick) | Teilweise | Voll (idea-clarifier + persona-interviewer Anti-Compliments-Filter) |
| Lean Startup (Build-Measure-Learn) | Teilweise | Voll (Loop-Komplettheit + Re-Validation) |
| Continuous Discovery (Teresa Torres) | Teilweise | Voll (Opportunity-Solution-Tree-Output in synthesis) |
| **JTBD (Christensen / Klement)** | **Lücke** | **Voll** (neuer `jtbd-interviewer`, 4-Forces) |
| Demand Curve (Justin Wilcox) | Teilweise | Voll (fake-door-designer + pre-sale-orchestrator) |
| **Pre-Sale / LOI / Concierge-MVP** | **Lücke** | **Voll** (neuer `pre-sale-orchestrator`) |
| **Quantitative Pricing-Tests** | **Lücke** | **Voll** (neuer `pricing-tester`, Van-Westendorp) |
| Re-Validation / Cohort-Tracking | Lücke | Voll Phase 1.5 (`/revalidate` + handoff-manifest) |

---

## 19. Demand-Signal-Score-Algorithmus (aus `11-fake-door-signal-validity.md`)

### 19.1 Formel

```
Score = Σ(ChannelSubscore × ChannelWeight) × QualityMultiplier × VolumeGate × FalsePositivePenalty
```

### 19.2 Channel-Subscores (Schwellen)

| Signal | Kill (<) | Weak | Mid | Strong | Hype-Verdacht (>) |
|---|---|---|---|---|---|
| Fake-Door (Visit → Email) | < 1 % | 1–3 % | 3–8 % | 8–15 % | > 15 % |
| Cold-Email Reply (gesamt) | < 1 % | 1–3 % | 3–8 % | 8–15 % | > 20 % |
| Cold-Email Positive Reply | < 0.5 % | 0.5–1 % | 1–2 % | 2–5 % | > 8 % |
| Paid-Ad CTR (Google Search) | < 1 % | 1–3 % | 3–5 % | > 5 % | n/a |
| Paid-Ad CTR (Meta) | < 0.5 % | 0.5–1.5 % | 1.5–2.5 % | > 2.5 % | n/a |
| Waitlist (TTA < 30d) | < 5 % | 5–10 % | 10–20 % | > 20 % | n/a |
| Pre-Sale Conversion | < 1 % | 1–3 % | 3–8 % | > 8 % | n/a |

### 19.3 Channel-Weights (default)

- Cold Email 0.25
- Paid Ads 0.20
- Fake Door 0.15
- Pre-Sale 0.20 (höchstes Signal — echtes Geld!)
- Waitlist 0.10
- Reddit-Sentiment 0.10

### 19.4 Quality-Multiplier

| Faktor | Multiplier |
|---|---|
| `pricing_shown == true` | 1.2 |
| `pricing_shown == false` | 0.7 |
| `source_diversity > 3` | 1.1 |
| `bot_filter == reCAPTCHA` | 1.05 |
| `cohort_engagement_7d > 30%` | 1.15 |
| `segment_breakdown_available` | 1.05 |

### 19.5 Volume-Gates

- < 100 visitors / interactions → Score × 0 (Insufficient Sample)
- < 1 000 → Score × 0.5
- ≥ 1 000 → Score × 1.0

### 19.6 False-Positive-Penalty

- Hype-Burst (> 50 % Traffic in 24h-Spike) → −15
- Bot-Share > 10 % → −20
- Founder-Network-Dominanz (> 30 % via Founder's eigenes Following) → −10

### 19.7 Final Tiers

| Score | Verdict |
|---|---|
| 0–25 | **Kill** — no demand, don't build |
| 25–50 | **Weak** — pivot or kill |
| 50–70 | **Mid** — iterate before build |
| 70–85 | **Strong** — Build (with Handoff-Pack) |
| 85–100 | **Exceptional** — Build + raise / scale plan |

---

## 20. Monetization (revidiert)

### 20.1 Phase-spezifische Pricing-Struktur

| Phase | Tier | Preis | Features |
|---|---|---|---|
| Phase 0 (M0–3) | Free OSS | $0 | Komplettes Framework, alle Subagents, CLI, MIT-Lizenz |
| Phase 1 (M3–12) | **Free Cloud** | $0 | 1 Validation/Monat, BYO-API-Key, Web-Dashboard |
| Phase 1 | **Pro** | **$19/mo** | 10 Validations/Monat, hosted Resend, Validation Maps, shareable URLs, Handoff-Pack |
| Phase 1 | **PAYG** | **$5/Validation** | Über das Pro-Cap hinaus oder ohne Subscription |
| Phase 2 (M12–24) | **Studio Solo** | **$79/mo** | Persona-Library, White-Label-Reports |
| Phase 2 | **Studio Agency** | **$199/mo** | Multi-Project, Team-Seats, Custom-Branding, Boutique-Agency-Targeting |
| Phase 2 | **Marketplace 80/20** | — | Persona-Pack-Marketplace-Split |
| Phase 3 (M24–60) | **Team** | $199 (re-introduced) | Team-Workspaces, SSO, Audit-Logs |
| Phase 3 | **Enterprise / VC-Outcome** | $25k–$150k/Jahr | Outcome-Based-Pilot: % per avoided failed build, nur für VC-Portfolio-Validation |

### 20.2 Begründung der Änderungen

- **$29 → $19 Pro:** Kyle-Poyar-Daten (Dez 2025, ChartMogul, 3 500 Firmen): AI-Tools unter $50/mo haben 23 % GRR. $19 sitzt im Cursor/v0/Lovable/Replit-Band, $29 in der GRR-Klippe.
- **Team Phase 1 → gestrichen:** Pre-PMF nicht splitten. Wird Phase 3.
- **PAYG $5/Validation:** Direkt-Match auf WorthBuild ($5/Report) bei tieferem Produkt.
- **Studio Tier:** Boutique-Agenturen sind der Platform-Hebel (TAM-Sizing).
- **Marketplace 80/20:** Adobe-90→87.4 %-Backlash, DMA-Druck, Shopify-Standard 80/20.
- **Outcome-Based Phase 3-only:** Madhavan-Autonomy/Attribution-Test scheitert für Decision-Augmentation in Phase 1–2.

### 20.3 Workflow-Lock-in als Retention-Hebel

Ohne Lock-in zerfällt $19/mo unabhängig vom Preis (AI-Tool-GRR-Klippe). Lock-in-Mechanismen:
- **Persona-Library** wächst pro User
- **Validation History** mit re-validierbaren Manifest-Files
- **Saved Resend-/Reddit-/Meta-Ads-OAuth-Connections**
- **Handoff-Packs** als versioniertes IP-Asset
- **Custom Industry-Persona-Packs** aus Marketplace

---

## 21. Platform-Risk + Multi-Provider-Strategie

### 21.1 Anthropic-Lock-in (aktuell Severity 4/5)

Aus `07-platform-risk-anthropic.md`: Anthropic hat mit Skill-Creator (244k Installs) + Skills 2.0 (Q1 2026) + Hooks (Early 2026) bereits ~60 % einer naiven "Wir validieren Claude-Skills"-Positionierung kommodifiziert. Acquisitions-Trend (Bun, Stainless ~$300M, Vercept) = Validation-Acquisition plausibel in 12–24 Monaten.

### 21.2 Multi-Provider-Architektur — Pflicht ab Tag 1

```
packages/agents/<agent-name>/
  index.ts           # Logic-Definition
  prompt.ts          # LLM-Prompts (provider-agnostic)
  schema.ts          # Input/Output-Types (Zod)
  tests/             # Snapshot-Tests (provider-Konstanz)

packages/runners/
  local-runner/      # → .claude/agents/*.md
  cursor-runner/     # → .cursor/agents/*.md
  codex-runner/      # → Codex Skill-Format
  workflow-runner/   # → Vercel WDK DurableAgent
  generic-skill-runner/  # → SKILL.md (cross-vendor open standard since Dec 2025)
```

15–25 % Architektur-Mehraufwand jetzt vs. 3–5× Retro-Fit-Kosten in 6 Monaten.

### 21.3 Defensive Moats gegen Native-Anthropic-Validator

1. **Cross-Agent Compliance-Validator** — Claude *kann nicht* gleichzeitig auch Cursor/Codex/Gemini validieren-as-default-vendor sein.
2. **Vertikale Compliance** (GxP/HIPAA/PCI/SOC2) — Anthropic ships horizontale Skills, nicht vertical-deep Pre-Validation.
3. **Citation-First / Auditable Source Trail** — kein Anthropic-Skill liefert audit-grade Validation, weil Anthropic's value-prop "Compute" ist, nicht "Evidence-Standards".
4. **Persona-bound Build-time Guardrails** — Handoff-Pack ist Cross-Session-Persistence-Pattern, das Anthropic strukturell nicht owned.

---

## 22. UX-Prinzipien (aus `18-ux-vision-category-defining.md`)

### 22.1 Die 5 Kategorie-definierenden Prinzipien

1. **First-Output-in-5-Minutes** (Stripe / v0-Pattern): Streaming-Output statt Spinner. Eine echte Reddit-Quote vor dem ersten Detail-Klick. "Wow" durch Spezifität, nicht durch 40-Seiten-PDF.
2. **Shareable-Artifact-Default** (Figma / v0-Pattern): Jeder Run produziert eine öffentliche URL ("Validation Map") mit Re-Run-CTA. Output ist das Marketing.
3. **Opinionated-by-Default** (Linear / Tailwind-Pattern): ValidationKit lehnt schwache Ideen explizit ab. **Tagline: "Most ideas fail this. That's the point."** Hard Counter-Position zu ValidatorAI's "Yes to everything".
4. **API/MCP-First** (Stripe-Pattern): Von Tag 1 in v0 / Cursor / Lovable / Bolt einbettbar. ValidationKit wird Infrastruktur, nicht Tool.
5. **Multi-Idea-Workspace + Network-Effect-Aggregation** ("Idea Garden"): Wöchentliches Re-Scan macht Validation zur Inbox-Routine. Privacy-safer Persona/Channel-Pool macht Run #10 001 informierter als Run #1.

### 22.2 Validation Map — das geteilte Artefakt

Jede Validation produziert ein shareable Markdown-Visual mit:
- One-Line-Idea-Statement
- Persona-Distillate (3 Quote-Bubbles)
- Demand-Signal-Score (Bänder, nicht Numerik)
- Top-3-Risks (Severity-Color)
- "Run my own" CTA (Founder-Bias-Hebel)
- ValidationKit-Branding (subtil, Linear-Style)

Öffentliche URL: `validationkit.dev/maps/<slug>` (oder `sondr.app/maps/...` nach Re-Brand).

### 22.3 Onboarding-First-5-Minutes Storyboard

1. **0:00** — User pasted Idee in CLI / Web-Textfield
2. **0:30** — `idea-clarifier` stellt 3 zentrale Fragen (Streaming)
3. **2:00** — `market-researcher` zeigt 1. echte Konkurrenz-URL mit Quote
4. **3:30** — `persona-generator` rendert 1. Persona mit echtem Reddit-Snippet
5. **5:00** — Erste Severity-Band-Headline: "**Mid signal — interview before build**" + Top-Action

Die Geschwindigkeit ist Marketing.

---

## 23. Brand & Voice

### 23.1 Brand Personality: **Skeptic Mentor**

Nicht "Brutal Honest Coach" (zu hart, vergrault Indie Hacker). Nicht "Friendly Co-Pilot" (zu generisch, austauschbar mit Cursor / Linear). Sondern: **älterer Founder, der nicht lügt, aber respektiert.**

- Concession-then-Critique ("Ich sehe was du siehst — aber hier sind die 3 Daten, die dagegen sprechen")
- Specificity statt Score ("3.2 % Cold-Email-Reply ist genau Median — das ist kein Signal")
- Citation-First ("[Reddit r/SaaS, 2025-11-12](url): User X sagt ...")

### 23.2 Stimm-Vorbilder

- Linear Release Notes
- DHH / 37signals
- PG-Essay-Tonalität
- Lenny Rachitsky's "honest curiosity"

### 23.3 Visual Style

- Vercel-Monochrome-Base
- Linear-Daten-Density
- Severity-Color als einziger Akzent (Red = Kill / Yellow = Weak / Cyan = Strong)
- Typography: Inter Tight + JetBrains Mono
- No-AI-Stockphotos-Policy

### 23.4 Onboarding-Headline-Kandidat

> **"Find out if anyone actually wants your idea — before you build it."**

(Direkt, kein "AI"-Buzzword, Promise auf den Schmerz zentriert, nicht auf die Technologie.)

---

## 24. Distribution-Strategie + 12-Wochen-Launch-Plan

### 24.1 Channel-Map 2026 (aus `15-distribution-channels-2026.md`)

| Channel | Tier | Activity | Audience-Match | Phase-0-Action |
|---|---|---|---|---|
| HN Show HN | Tier 1 | sehr hoch | hoch | Launch-Day (Di) |
| r/ClaudeAI (747k) | Tier 1 | sehr hoch | sehr hoch | Launch-Day (Mi) |
| GitHub Trending | Tier 1 | hoch | hoch | Pre-Launch Star-Drive |
| X Build-in-Public | Tier 1 | hoch | hoch | Daily Founder-Cadence ab Week −4 |
| Product Hunt | Tier 2 | mittel | mittel | Day 3 (Do) für Backlinks |
| Anthropic Discord | Tier 2 | hoch | hoch | Organisch, nicht Promo |
| r/SideProject | Tier 2 | mittel | mittel | Helpful-First Posts |
| IndieHackers | Tier 3 | sinkend | mittel | Long-form Posts, nicht Launch-Day-Push |
| r/SaaS | Tier 4 | tot (60-Tag-Promo-Limit) | n/a | Skip |
| LinkedIn | Tier 4 | passive | low | Skip (Phase 0) |

### 24.2 12-Wochen-Plan (aus `14-oss-dev-tool-gtm.md`)

**Pre-Launch (T−4 bis T−1 Wochen):**
- Twitter / X Handle + tägliche Build-in-Public Cadence (Screenshots, Loom)
- Validation Handbook v0 schreiben (öffentliches Wissensasset)
- Reference-Implementation: 1 echte Idee voll durchvalidieren, Report öffentlich
- 50 invited Indie-Hacker-Testers (gezielt akquiriert)

**Launch Week (T0):**
- **Di:** HN Show HN
- **Mi:** r/ClaudeAI Post
- **Do:** Product Hunt
- **Fr:** Long-form Founder-Blog "Why I built ValidationKit"

**Wochen 2–4:**
- 3 detaillierte Case-Studies (echte User-Validations)
- SEO-Comparison-Pages: `/vs/gozigzag`, `/vs/ideaproof`, `/vs/validatorai`, `/vs/worthbuild`, `/vs/preuve-ai`
- Submission zu `claude-plugins-official`, `awesome-claude-code`, `awesome-claude-code-subagents` (VoltAgent — neue "Product & Validation"-Category)

**Wochen 5–8: "Launch Week"** (Supabase-Pattern, 5 daily drops)
- Mo: Validation Map shareable
- Di: Multi-Provider-Demo (Cursor + Codex + Claude Code)
- Mi: Resend-Integration live
- Do: Handoff-Pack-Preview
- Fr: First Boutique-Agency-Pilot

**Wochen 9–12:**
- Paid-Learning-Experiments ($25–$200 Meta-Ads für ValidationKit selbst — eat our own dogfood)
- "Validate-in-Public Sundays" (Founder validiert eine zufällige Indie-Hacker-Idee live)
- Erstes Quarterly Retro öffentlich

### 24.3 Influencer-Outreach-Ziele

Höchste Priorität:
- Theo Browne (t3.gg, YouTube)
- swyx (Latent Space, dev.to)
- Console.dev (Newsletter)
- TLDR AI (Newsletter)
- ThePrimeagen (YouTube / Twitch)
- Fireship.io (YouTube)
- Lenny Rachitsky (Newsletter — wenn Studio-Tier launched)
- Peer Richelsen (Cal.com)

### 24.4 Compounding-SEO-Assets

- Validation Handbook (v0 → v1 → v2) als Substack + Repo
- 8 Comparison-Pages
- 12 Case-Studies (Year 1)
- "State of Validation Tooling 2026" Annual Report (Year 1 publishen)

---

## 25. Open-Source-Strategie

### 25.1 License-Entscheidung

- **MIT für Phase 0** (broad adoption, GitHub-Stars-Friendly)
- **Apache 2.0 als dokumentierte Alternative** wenn Patent-Worry auftaucht
- **BSL-Re-License-Option für Phase 4+ Hosted-Pipeline-Components** dokumentiert (HashiCorp-Pattern, aber transparent kommuniziert — kein Pinky-Promise)

### 25.2 Contribution-Strategie

- README mit klarer Contributor-Path
- `agents/` Verzeichnis offen für Community-Subagents (Persona-Packs, Industry-Specific)
- Marketplace-Vorbereitung Phase 2 (80/20 Revenue-Split mit Contributors)

### 25.3 Distribution-Channels

1. **npm** — `validationkit`, `create-validationkit`, `@validationkit/*`
2. **GitHub** — `github.com/validationkit-ai/validationkit`
3. **claude-plugins-official** Submission Woche 2
4. **Vercel Plugin Marketplace** (sekundär, Phase 1)
5. **awesome-claude-code, VoltAgent-Subagents-Repo** (Listings Woche 1)
6. **Direct site** `validationkit.dev` (oder Re-Brand-Domain)

---

## 26. Non-Goals (refresh)

- ❌ Automatisierte LinkedIn/Instagram-DMs (ToS-Verstoß, Account-Risiko, falsches Signal)
- ❌ Logo-/Brand-Identity-Generator (Commodity, schlechte Differenzierung)
- ❌ Pitch-Deck-Generator (abgegrast)
- ❌ Vollautomatisches "Idee → Live-Produkt" (zu komplex, fehleranfällig, falsche Autonomy-Klasse)
- ❌ Eigenes LLM-Hosting (nutze AI Gateway)
- ❌ Enterprise-Features (SSO, Audit-Logs, Multi-Tenant) in Phase 0–1
- ❌ "AI-Yes-Man-Validator" (ValidatorAI-Modus) — wir lehnen explizit ab
- ❌ Replacement für $10k+ Enterprise-Discovery
- ❌ DM-Automation jeder Art

---

## 27. Risiken + Mitigations (aktualisiert)

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| Anthropic shipt nativen Validator | Mid–High | Hoch | Multi-Provider Tag 1, Vertical-Compliance, Cross-Agent-Audit |
| Kein Edge vs. Raw Claude + CLAUDE.md | Hoch | Hoch | Real-Channel-Execution, Citation-First, Handoff-Pack |
| Channel-Saturation = False Negatives | Hoch | Hoch | 2026-Benchmarks, Volume-Gates, Politeness-Floor, Hype-Filter |
| Synthetic-Persona-Backlash | Mid | Mid–Hoch | RAG-Grounding, Multi-Model-Ensemble, "Pre-Interview Briefing"-Framing |
| WorthBuild / Preuve.ai launchen Claude-Code-native | Mid | Hoch | Speed (6 Wochen MVP), Handoff-Pack-Moat, Multi-Provider-Vorsprung |
| User installiert einmal, kommt nicht wieder | Hoch | Hoch | Handoff-Pack, `/revalidate`, Idea-Garden, weekly cron Re-Validation, $19-Lock-in via Persona-Library |
| Open-Core-Backlash | Mid | Mid | Transparente Lizenz-Strategie, BSL-Option dokumentiert |
| Cold-Email-Send via Resend → Deliverability | Mid | Mid | Opt-in pflicht, Volume-Caps, Postmark-Fallback dokumentiert, CAN-SPAM-Konsent-Gate |
| Founder Solo-Bottleneck (FMF 4/10) | Hoch | Mid | Co-Founder-Suche (Distribution-Profil), 20 Mom-Test-Interviews vor Code, Build-in-Public ab T−4 |
| Token-Kosten-Eskalation | Mid | Hoch | AI-Gateway-Budget-Caps, Haiku-für-Sub-Sub-Agents, Pre-Flight-Estimation |
| Anthropic-Acquisition durch Konkurrenten | Low | Hoch | Cross-Vendor-Architektur macht Acquisition-Wert lower |
| Marktgröße-Cap (Solo-only $15–35M ARR) | Sicher | Mid | Boutique-Agencies ab Jahr 1, Non-Tech ab Jahr 2, Vertical ab Jahr 3 |

---

## 28. Success Metrics

### 28.1 Phase-0 (6 Wochen) — Verschärft

- **GitHub Stars:** 200 in 30 Tagen post-Launch (v0.1: 100; erhöht durch r/ClaudeAI + HN + GTM-Playbook)
- **npm Installs:** 1 000 / Monat nach 3 Monaten (v0.1: 500; erhöht)
- **Aktive End-to-End-Validations:** 100 / Monat nach 3 Monaten
- **Founder-Dogfood:** ≥3 eigene Side-Projekt-Ideen voll durchvalidiert (Bias-Mitigation)
- **Discord/Community:** 400 Mitglieder

### 28.2 Phase 1 (Wochen 7–18)

- **GitHub Stars kumulativ:** 1 000
- **Pro-Subscriber:** 50 (≈ $950/mo ARR-Run-Rate)
- **PAYG-Validations:** 200 / Monat
- **Cross-Provider-Demo:** läuft nachweislich auch in Cursor + Codex CLI
- **Handoff-Pack-Trigger-Rate:** ≥30 % aller Build-Verdicts erzeugen Handoff-Pack
- **Re-Validation-Use-Rate:** ≥15 % aller Pro-Users / Monat
- **First Boutique-Agency-Pilots:** 5 LOIs

### 28.3 Wirkungs-Metrik (Nordstern)

> **"X % der ValidationKit-User entscheiden sich gegen ihre ursprüngliche Idee oder pivotieren bevor sie programmieren."**

Target Phase 0: ≥30 %.
Target Phase 1: ≥40 % (mit Handoff-Pack-Friction).
Target Phase 2: ≥45 % (Skeptic-Mentor-Voice etabliert).

### 28.4 Pivot-Trigger (explizit verankert)

Wenn nach Phase-0-Ende (Woche 6 + 30 Tage):
- < 50 GitHub-Stars **UND** < 5 Indie-Hacker-Testers mit dokumentiertem Feedback **UND** Founder hat keine Co-Founder-Conversation begonnen
→ **Pivot-Pfad evaluieren** (Pivot A: Single Anthropic-Skill / Pivot B: Channel-Performance-API / Pivot C: Vertical)

---

## 29. Roadmap

### Phase 0 — MVP (Wochen 1–6)
- OSS Framework + 10 Subagents + 7 Commands
- CLI-only Multi-Provider
- Reference Implementation publik
- Validation Handbook v0
- Launch via HN + r/ClaudeAI + ProductHunt

### Phase 1 — Web-Layer + Real-Channels + Handoff-Pack (Wochen 7–18)
- Hosted Web-App (Next.js 16 + WDK)
- Auth + Billing + Stripe
- Resend / Vercel / Reddit / Meta-Ads MCP-Integration
- Plausible / PostHog
- Handoff-Pack als Flagship
- Pricing $19 / PAYG $5

### Phase 2 — Boutique-Agency-Tier + Marketplace-Prep (Monate 4–9)
- Studio Solo $79, Studio Agency $199
- Persona-Library
- Public API für Embedded-Validation
- 80/20 Marketplace launchen
- First 50 paying Studio-Customers
- Re-Brand-Window opens (Sondr? Pondera? Keep?)

### Phase 3 — Non-Tech-Founder + Enterprise-Pilot (Monate 9–18)
- Web-UI für v0/Lovable-User
- Team-Tier $199
- VC-Outcome-Pricing-Pilot
- Vertical-Compliance-Edition (1 Industry)
- Re-Brand-Entscheidung kommitten

### Phase 4 — Plattform (Monate 18–36)
- Multi-Modal (Voice / Video)
- "Validation OS" — Ambient Re-Validation
- Annual State-of-Validation-Tooling Report
- Vertical-Editions (Healthcare, FinTech, Edu)

---

## 30. Open Questions (für nächste Iteration in Claude Code)

1. **AGPL vs. MIT für Web-Layer-Code:** AGPL würde verhindern, dass WorthBuild / Preuve.ai unsere Hosted-Pipeline-Logik forken und SaaS-deployen. Aber AGPL killt Boutique-Agency-Adoption.
2. **Resend vs. Loops vs. Postmark Default:** Resend hat den MCP. Postmark hat höhere Inbox-Rate. Loops ist günstiger. → Phase-1-Sprint-Start.
3. **Vercel Workflow DevKit Production-Readiness:** Aktueller Stand (Mai 2026) checken vor Phase-1-Commit. Inngest als Fallback dokumentiert.
4. **Persona-Library als zentrale DB vs. user-owned File:** Multi-Tenant-Privacy vs. Network-Effect-Aggregation. Phase 2.
5. **Co-Founder-Suche aktiv starten?** FMF-Analyse: 4/10 Solo, Marko-zu-Uku-Pattern empfohlen. Founder-Decision Phase 0.
6. **Real-Source-Citation: live-fetched-on-render oder static-snapshot?** Trade-off Korrektheit vs. Performance vs. Plagiarism-Risiko.
7. **Wann Re-Brand?** Sondr-Domain-Acquisition jetzt (Defensiv-Buy) oder bei Phase-2-Decision-Point?
8. **Anthropic-Conversation:** Direkter Outreach zu Anthropic's Skills-Team (Partnership? Pre-Annouce-Sync?) sinnvoll, oder erhöht das Acquisition-Risk?

---

## 31. Nächste Schritte (für die nächste Claude-Code-Session)

In der empfohlenen Reihenfolge:

1. **20 Mom-Test-Interviews mit Indie-Hackers durchführen** (Wochen 1–2). Eigene Founder-Bias mitigieren, bevor 1 Zeile Code geschrieben wird.
2. **Repo-Setup:** GitHub-Org `validationkit-ai`, npm-Namespace reservieren, Monorepo-Skelett pushen.
3. **Reference-Implementation:** Eine echte Side-Projekt-Idee von Kolja voll durchdogfooden, Report öffentlich machen (Repo + Tweet-Thread).
4. **Validation Handbook v0:** Markdown im `apps/docs`, 8–12 Kapitel, ≈10 000 Wörter. Pre-Launch publishen für SEO + Authority.
5. **Daily Build-in-Public-Cadence starten** (T−4 vor Launch).
6. **`idea-clarifier` als Reference-Subagent komplett implementieren** (TypeScript + Markdown-Compile + Snapshot-Tests).
7. **Restlichen 9 Subagents parallel** (oder einzeln mit dogfood-tests).
8. **Multi-Provider-Runner** bauen (`local-runner`, `cursor-runner`).
9. **Handbook-driven-launch:** HN + r/ClaudeAI + PH wie in §24.

---

## 32. Decisions Log

| ID | Decision | Reason | Source |
|---|---|---|---|
| D-001 | Build mit Repositioning, kein Kill | 3 Kill-Criteria adressierbar | §2.1 |
| D-002 | Multi-Provider von Tag 1 | Anthropic-Lock-out-Risk | §21.2 |
| D-003 | 10 statt 8 Subagents in MVP | JTBD + Pre-Sale + Pricing-Test sind Pflicht | §13 |
| D-004 | Phase 1 Web-Layer vorziehen | User-Direktive, Boutique-Agencies brauchen Web-UI | User |
| D-005 | Handoff-Pack als Flagship Phase 1.5 | Retention-Killer-Feature, einzigartige Positionierung | §15 |
| D-006 | $19/mo statt $29/mo | AI-Tool-GRR-Klippe bei $50 | §20.2 |
| D-007 | Studio-Tier Phase 2 für Boutique-Agencies | TAM-Hebel, Solo-only cappt | §5.2 |
| D-008 | Marketplace 80/20 statt 70/30 | DMA-Druck, Adobe-Backlash | §20.2 |
| D-009 | Working Title ValidationKit, Re-Brand-Fenster M9–M12 | 4/6 PRD-Kandidaten tot | §8 |
| D-010 | RAG-grounded Personas + Forced-Choice-WTP + Multi-Model-Ensemble | Snake-Oil-Risk mitigieren | §13.3 |
| D-011 | "Pre-Interview Hypothesis Briefing" als Output-Framing | NN/g + ACM-Consensus | §13.3 |
| D-012 | Severity-Bänder statt numerische Scores | Fake-Precision-Risk | §19 |
| D-013 | r/ClaudeAI + HN > IndieHackers für Launch | 2026 Distribution-State | §24 |
| D-014 | Validation Handbook v0 vor Launch | GTM-Playbook Top-Pattern | §24 |
| D-015 | Skeptic-Mentor-Brand-Voice | UX-Vision-Research | §23 |
| D-016 | Vercel WDK als Hosted-Runtime | Native AI-SDK-Integration | §16.2 |

---

*Ende PRD v2.0. — Iteriere frei. Alle Recherche-Files unter `analysis/01-19-*.md`. Zur Pflege dieser Spec siehe `.claude/CLAUDE.md` und `/iterate-prd`-Slash-Command.*
