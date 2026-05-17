> **ARCHIVED 2026-05-16.** All file-paths in this document were pre-v5-Refactor. See `docs/PRD.md` for current. Original paths: `analysis/` → `docs/research/v2/`, `analysis-v3/` → `docs/research/v3/`, `analysis-v4/` → `docs/research/v4/`, `decisions/` → `docs/decisions/`.

# PRD ValidationKit / Sondr — v3.0

> **Status:** Source of Truth (ersetzt v2.0 vom 2026-05-14 ~02:30).
> **Datum:** 2026-05-14 (~09:30) | **Owner:** Kolja Schöpe (kol.schoepe@gmail.com)
> **Auslöser v3:** User-Initiierter Pivot-Vorschlag zu "AI-Skill-Operations-Platform für Mid-Market" wurde durch 14-Agent-Devil's-Advocate-Recherche **abgelehnt**. v3 codiert die neue Strategie: **Hybrid Layered (Pivot E)** — PLG + Service parallel, MM als optionale Phase-3-Expansion mit drei harten Triggern.
> **Evidenz-Basis:** `analysis-v3/01, 02, 10, 11, 13, 14, 15` (≈28.000 W gesicherte Recherche). Lücken: `analysis-v3/03-09, 12` (Rate-Limit-Verlust; nicht load-bearing fürs Verdict).
> **Kollision mit v2:** v2 hatte den Pivot noch nicht aufgeworfen. v3 baut auf v2 auf und schärft Phase 0–3.

---

## 0. Changelog v2 → v3

| Bereich | v2 (2026-05-14 02:30) | v3 (2026-05-14 09:30) |
|---|---|---|
| **Strategic Verdict** | "Build with Boutique-Tilt" | **"Hybrid Layered (Pivot E) — PLG + Service parallel, MM als Phase-3-Optional"** |
| **Phase 1 Scope** | Hosted-App + Real-Channels + Handoff | **Service-Engagements + Studio-Tier-Build, Hosted-App auf Phase 2 verschoben** |
| **Primary ICP** | Solos + Boutique-Agencies (P0.5) | Solos + Boutique-Agencies (P0) + **Productized-Service-Customers (P0)** |
| **MM-Entry** | Nicht thematisiert | Phase 3 *optional* mit drei Trigger-Conditions, sonst Lifestyle-Optimization |
| **Pricing-Tiers** | Free / $19 / $79 / $199 | Free / $19 / $79 / $199 + **$4.500 Founder Validation Sprint (Productized Service)** |
| **Naming** | Sondr (M9-M12 Re-Brand) | Sondr (Mid-Conf, M8 Anwalts-Check, M9-M12 Re-Brand) + **ValidationKit als Sub-Brand behalten** (Trust-Karma) |
| **Decisions Log** | 16 Entries | 16 + 4 neue (ADR-0017 bis ADR-0020) |
| **Non-Goals** | 8 Bullets | 8 + 5 neue (kein MM-Direct-Entry ohne 3 Trigger, kein SharePoint Tag 1, kein 9-Adapter-Build, kein VC-Pre-Seed-Run, kein Sales-Hire vor M18) |

---

## 1. Executive Summary (TL;DR)

**ValidationKit / Sondr** ist ein Open-Source-MIT-Framework + Hosted-Web-App, das den vollen Validation-Loop für Solopreneurs und Boutique-Agenturen orchestriert. **Plus** ein begleitender Productized-Service ("Founder Validation Sprint", $4.500 Flat) als Cash-Engine und Dogfood-Quelle in Phase 0–2.

**Mission:** Pre-Validation für Solopreneurs so selbstverständlich machen wie Stripe für Payments. Konkret: Indie-Hacker validieren ihre Idee in <30 Min mit echten Source-Citations, executed Real-Channel-Experiments, und gehen mit einem Persona-bound Build-Kit ins Coding.

**Hybrid-Layered-Strategie (Pivot E):**
- **Phase 0 (M0–M3):** OSS-Release v0.1 + 2 hochbetreute Validation-Engagements à $3–5k aus Kolja-Netz. **Founder-Validation-Loop ist die Reference-Implementation.**
- **Phase 1 (M3–M9):** 8–12 Engagements à $3–8k (Cash-Engine, $30k–96k Service-Revenue). Studio-Tier-Build ($79 / $199) parallel finanziert. ValidationKit v0.2 → v1.0 emergiert aus den Engagement-Patterns.
- **Phase 2 (M9–M18):** Productized "Founder Validation Sprint" $4.500 als Tier zwischen Solo-$19 und Custom-$10k. Hosted-Web-App live. Ziel $30k MRR by M18 (≈ $360k ARR).
- **Phase 3 (M18–M24+):** *Optional* MM-Expand — nur wenn drei Trigger-Conditions erfüllt sind (siehe §11.3). Sonst: Lifestyle-Optimization Solo-$1M-ARR-Path.

**Warum nicht der User-vorgeschlagene Pure-MM-Pivot (C)?** Vier brutale Befunde aus `analysis-v3/14-devils-advocate.md` + `analysis-v3/15-alternative-pivots.md`:

1. **Solo × Mid-Market-Procurement-Sales-Cycle ist mathematisch nicht lösbar in 18 Monaten** (Severity: Near-Certain >80 %). 84-Tage-Median-Cycle × 4–7 Buying-Committee-Stakeholder × 16–30h Founder-Time pro Deal × 30 % Close-Rate = 1,4 Vollzeit-Jahre allein für Sales bei $1M ARR-Ziel. Plus SOC2 Type II 45–70k USD/Jahr 1, 6–12 Monate Observation-Window [[Secureleap 2026](https://www.secureleap.tech/blog/soc-2-certification-cost)].
2. **Platform-Owner-Eats-Lunch ist bereits Realität, nicht Risiko.** Anthropic Skills Enterprise-Provisioning live seit Dec 2025 (425k+ Skills, Spotify/Notion/Shopify/Rakuten als Logos). Cursor Team Marketplace seit Mai 2026 GA. GitHub Copilot Org-Custom-Instructions GA seit Apr 2026. **Du bist 6 Monate zu spät, bevor du anfängst.**
3. **9 Production-Adapter (3 Storage × 3 Tools) als Solo in 18 Monaten ist nicht-historisch-belegt.** Zapier brauchte Co-Founders + YC + 18 Monate für die ersten ~30 Integrationen — und das im pre-OAuth-2.0-Era. Microsoft Graph allein = 3–6 Mann-Monate für *eine* Multi-Tenant-Production-Integration.
4. **Featuritis: 4 Meta-Layer parallel = niemand ist Best-in-Class.** Marketplace verliert gegen Anthropic, AI-Reviewer verliert gegen Snyk/GHAS, Lifecycle verliert gegen GitHub PRs, Onboarding-Interview verliert gegen Glean. "Almost-good-enough × 4" ist Self-Hosted-OSS-Niveau, nicht $99–499/seat-Premium.

**Pivot-Score-Verdict:** **3/10 in proposed shape**, **6.5/10 if narrowed** to "Multi-Vendor Skill-Federation Approval-Workflow für Cursor+Claude-Code Teams 10–50 MA, ohne SharePoint Tag 1, $40–60/seat Self-Serve, SOC2 Type I in 90 Tagen". Aber: Hybrid Layered (E) **dominiert** Narrow-Pivot mathematisch (P{Lifestyle $300k–1M} = 62 % vs <30 % bei Narrow-MM).

---

## 2. Strategic Verdict (load-bearing)

### 2.1 Was bleibt

ValidationKit-Kern wie in v2: Multi-Provider-Subagent-Framework, MIT-OSS, Citation-First, Real-Channel-Execution, Severity-Bänder, Skeptic Mentor Voice, Open-Core mit BSL-Re-License-Option, 10–11 Core-Subagents, 7 Slash Commands, Handoff-Pack.

### 2.2 Was sich ändert

- **Phase 1 ist nicht mehr "Hosted-App + Real-Channels"**, sondern **"Service-Engagements + Studio-Tier-Build"**. Hosted-App ist Phase 2.
- **Productized-Service ($4.500 Founder Validation Sprint)** wird zu einem expliziten Tier — nicht nebenher, sondern als Strategic-Pillar (Cash-Engine + Reference-Implementation + Brand-Building).
- **MM-Entry ist Optional Phase 3**, nicht impliziter Phase-2-Schritt. Drei Triggers (siehe §11.3) müssen *alle* erfüllt sein.
- **Naming-Decision-Window verschiebt sich auf M8** (Anwalts-Check Sondr+Pondera in DE/EU/US, Class 9+42). M9-M12 bleibt Re-Brand-Migration. **ValidationKit als Sub-Brand behalten** (`<brand>/validate`) für Trust-Karma.

### 2.3 Hard Non-Goals (neu)

- **Kein MM-Direct-Entry ohne 3-Trigger-Erfüllung.** (Trigger siehe §11.3.)
- **Kein SharePoint-Integration Tag 1.** (3-6 Mann-Monate-Anker, Solo nicht buildable; siehe ADR-0017.)
- **Kein 9-Adapter-Build** (3 Storage × 3 Tools = nicht-historisch belegt für Solo).
- **Kein VC-Pre-Seed-Run vor M18.** (Würde Solo-MIT-OSS-DNA brechen; siehe ADR-0019.)
- **Kein Sales-Hire vor M18.** (Constraints: Solo bleibt Solo, Productized-Service ist Sales-Substitute.)

---

## 3. Vision (unverändert vs v2)

In 50 Jahren validiert die Mehrheit aller Indie-Hacker, Solopreneurs und Boutique-Founders ihre Geschäftsidee mit ValidationKit / Sondr — bevor sie eine Zeile Code schreiben. Wie Stripe für Payments. Pre-Validation ist die Default-Erwartung, nicht die Ausnahme.

**Realitäts-Check 2026-05-14:** Die Vision setzt eine 5-15-jährige Build-Phase voraus. Pivot-zu-MM-jetzt würde diese Vision *beschleunigen* (höheres Capital), aber auch *gefährden* (Solo-Founder-Capacity-Wand + Compliance-Tax + Platform-Owner-Risk). Hybrid Layered ist die Risiko-adjustierte Wette.

---

## 4. Problem-Statement (unverändert vs v2)

Indie-Hacker bauen typischerweise 6–18 Monate an einer Idee, bevor sie merken, dass niemand sie kaufen will. ValidationKit kompresst die Pre-Build-Validation auf <30 Min mit echten Quellen, Real-Channel-Experiments und einem Build-fertigen Persona-bound Handoff-Pack.

---

## 5. Target Users

### 5.1 Primary ICP

**P0 — Solopreneur / Indie-Hacker.** Self-serve, $19/mo Pro. Build-in-Public-Cadence. Hauptpfad zu PLG-Skala.

**P0 — Boutique-Agency / Studio (3–30 MA).** Resell Validation als Service an Klient. Studio-Tier $79 / $199. Identifiziert in `analysis-v3/15-alternative-pivots.md` als $79–199-Sweet-Spot [[PromptsToProduct 2025](https://www.promptstoproduct.com/solo-founder-pricing-playbook)].

**P0 — Productized-Service-Customer.** "Founder Validation Sprint" $4.500 Flat-Engagement. Funded-Solos, Pre-Seed-Teams, First-Time-Founders mit Geld aber ohne Methode. **Cash-Engine + Reference-Implementation.**

### 5.2 Phase-3-Optional-ICP (Trigger-bedingt)

**P3 — Mid-Market Engineering-Org (50–500 MA).** Multi-Vendor-Skill-Federation + Compliance-Approval-Workflow. Only entered if §11.3-Triggers erfüllt.

### 5.3 Was wir explizit NICHT bedienen

- Enterprise (500+ MA) Compliance-Heavy mit SOC2/ISO/HIPAA-Pflicht.
- Non-Tech-Founders ohne Repository / GitHub-Account.
- Marketplace-Buyer (Skill-Konsument ohne Validation-Use-Case).

---

## 6. Competitive Landscape (Refresh aus v3-Recherche)

### 6.1 Direkter Validation-Competitor-Set (aus v2)

WorthBuild ($5/Report, Reddit/HN-Leads), Preuve.ai (90 % Rejection-Rate, Citations), founderscore (10-Phase-Pipeline mit G2-Daten), PainOnSocial. Unverändert.

### 6.2 AI-Skill-Ops-Adjacent (neu aus `analysis-v3/01-direct-competitors-skill-ops.md`)

Mid-Market AI-Coding-Skill-Governance ist **2025-12 bis 2026-05 von Platform-Vendors selbst besetzt worden:**

- **Anthropic Skills Enterprise** (Dec 2025): 425k+ Skills, Open-Standard, gratis in Team/Enterprise, Launch-Partner Atlassian/Stripe/Notion/Canva/Vercel. [[VentureBeat 2025-12-18](https://venturebeat.com/technology/anthropic-launches-enterprise-agent-skills-and-opens-the-standard)]
- **Cursor Team Marketplaces** (Mai 2026 in Cursor 2.6): Default-Off/On/Required-Distribution-Modes, Enterprise Admin Controls, Granular Model Allow-Lists. [[Cursor Changelog 2.6](https://cursor.com/changelog/2-6)]
- **GitHub Copilot Org-Custom-Instructions** (Apr 2026 GA): Multi-Layer-Hierarchy Personal→Repo→Path→Org→Enterprise. [[GitHub Changelog 2026-04-02](https://github.blog/changelog/2026-04-02-copilot-organization-custom-instructions-are-generally-available/)]
- **Microsoft Copilot Studio + Purview** (E5-bundled, kontinuierliche Updates): Custom-Agent-Builder + DLP + Audit-Trail.

**Verdict:** Pure-MM-Skill-Ops-Window ist **faktisch geschlossen** für Solo-Direct-Entry. Bleibender Whitespace: Multi-Vendor-Federation + Approval-Workflow + Compliance-Audit-Logs — aber das schließt sich 2027 Q1–Q2 wahrscheinlich auch.

### 6.3 AI-Observability-Threat (neu aus `analysis-v3/02-adjacent-ai-observability.md`)

**Langfuse (DE-OSS, EU-Hosting, MIT-Lizenz, Native Claude-Code-Hooks)** ist der gefährlichste Adjacent-Threat — 60–70 % Wahrscheinlichkeit für Skill-Governance-Pivot in <18 Monaten. Plus Backstage-Plugin-Layer (Stage-5-Migration läuft). M&A-Welle 2025–26: Cisco/Galileo (Apr 2026), CoreWeave/W&B ($1.7B), Coralogix/Aporia ($50M). Standalone-Observability konsolidiert sich.

**Whitespace für Sondr:** Stage-5-Skill-Governance + Validation-vor-Build (alle Observability ist post-build) + Mid-Market-EU-Solopreneur-Pricing (€15–30/Monat, GDPR, Cross-Vendor). Geschätztes Zeitfenster: 6–12 Monate.

### 6.4 Update-Procedure

Quartalsweise `/compete-check`-Command. **Trigger für sofortigen Re-Run:** (a) Anthropic announciert Approval-Workflows für Skills, (b) Cursor announciert Multi-Org-Konsolidierung, (c) Microsoft Copilot Studio Agent-Marketplace mit Org-Approval bundled in E5, (d) Langfuse launches "Agent Skill Governance Suite".

---

## 7. Value Proposition

**Tagline (Brand-Voice-Keeper-konform):** "Find out if anyone actually wants your idea — before you build it."

**Counter-Tagline:** "Most ideas fail this. That's the point."

**Differenzierung (3-fach):**
1. **Citation-First** — jeder Insight mit klickbarer Quelle + Datum. (vs WorthBuild "5-Min-Vibe-Report")
2. **Real-Channel-Execution** — Email-Send, Vercel-Deploy, Ad-API werden ausgeführt, nicht beschrieben. (vs Preuve.ai Pure-LLM-Synthesis)
3. **Persona-bound Build-Kit als Handoff-Pack** — Validation-Insights *plus* Build-Time-Guardrails in einem File-Tree, der direkt in Claude Code / Cursor / Codex importiert wird. (vs founderscore Pure-Report)

---

## 8. Naming-Decision

**Working-Title:** ValidationKit (Phase 0 OSS-Release behält den Namen).

**Re-Brand-Empfehlung:** **Sondr** (Mid-Confidence, primary). **Pondera** (Mid, Backup). **Praxis** (Weak, nur als Compound).

**Aus `analysis-v3/13-naming-enterprise.md`:** 15 von 20 Kandidaten wegen Strong/Mid-TM-Konflikten gekippt. "-Ops"-, "Skill-"- und "Context-"-Wortraum ist 2024-2026 vollständig kolonisiert (SkillOps.ai Gwalior, Skill Studio AI Dublin, Kindling AI, Praxis AI Middleware). Big-Tech-Sweeps: Atlassian/Loom $975M, KKR/Helix $10B, Cloudflare/Mesh, Mistral/Forge, OpenAI/Promptfoo $86M (März 2026).

**Counter-Intuitive Sub-Decision:** ValidationKit als **Sub-Brand behalten** (`sondr.io/validate`). Trust-Karma nicht wegschmeißen.

**Timing:**
- **M8:** Anwaltliche Vorprüfung Sondr + Pondera in DE/EU/US (Class 9+42). Budget ~5.000 EUR.
- **M9:** Wahl + Domain-Acquisition.
- **M10–M12:** Migration (Old-Brand-Redirect + Search-Migration).

**Sofort-Aktion (vor jeder Brand-Decision):**
- (a) Markenanwalt für Sondr+Pondera in DE/EU/US Class 9+42.
- (b) 20 Mom-Test-Voice-Interviews mit Concept-Cards (PRD §31, Aussprache-Test).
- (c) `sondr.ai`-Domain-WHOIS für Preis-Check.

---

## 9. MVP — Phase 0 (M0–M3) "Foundation"

### 9.1 Deliverables

1. **ValidationKit v0.1 MIT-OSS-Release** auf GitHub mit:
   - 10–11 Core-Subagents (siehe v2 §13) als TypeScript-Source in `packages/agents/`.
   - Local-Runner (`packages/runners/local`) → generiert `.claude/agents/*.md`-Files für Claude Code.
   - 7 Slash Commands (siehe v2 §14).
   - Working `npx create-validationkit@latest <project>` mit Sample-Output.
   - LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, README mit Skeptic-Mentor-Voice.
2. **2 hochbetreute Validation-Engagements à $3.000–$5.000** mit DE-Indie-Hackern aus Kolja-Netz. Manuell, end-to-end, dogfood-driven. Resultat: Reference-Cases + Reference-Implementation für Phase 1.
3. **Build-in-Public-Cadence:** 5 Posts/Woche (LinkedIn-DE, X, Indie Hackers DE). Tone: Skeptic Mentor. Inhalt: Engagement-Learnings + Subagent-Snippets.
4. **20 Mom-Test-Interviews** (PRD §31 Schritt 1) mit unabhängigen Indie-Hackern aus DACH-Solopreneur-Netz. **Founder-Bias-Mitigation.**
5. **GitHub-Org `validationkit-ai` + npm-Namespace** reservieren. Domain `sondr.ai`-WHOIS-Check.

### 9.2 Success-Metric Phase 0

- **2 Engagements closed** (≥ $6k Total).
- **20 Mom-Tests durchgeführt**, Top-3-Pains synthesized.
- **OSS v0.1 mit ≥ 50 GitHub-Stars + 5 issues + 2 PRs**.
- **Dogfood-Reflection-Log:** Was hat manuell gut funktioniert / was muss `packages/agents/` automatisieren?

### 9.3 Anti-Goals Phase 0

- Kein Hosted-Backend.
- Keine Marketing-Site (nur GitHub README).
- Keine bezahlte Werbung.
- Keine Tweets über Pivot-Themen (Brand fokussiert auf Validation, nicht auf Skill-Ops).

---

## 10. Phase 1 (M3–M9) "Cash + Loop"

### 10.1 Deliverables

1. **8–12 Engagements à $3.000–$8.000** = $30k–$96k Service-Revenue.
   - Source: Engagement-Funnel aus Build-in-Public-Cadence + DACH-Indie-Hacker-Netz + erste Referrals.
   - Format: 2-Wochen-Sprint mit Mom-Test-Interviews + Channel-Experiments + Handoff-Pack.
   - **Dogfood:** Jedes Engagement ist Reference-Implementation für Subagent-Pattern.
2. **Studio-Tier-Build:** Hosted-Mini-App (Clerk-Auth + Stripe-Billing + Read-Only-Dashboard für Engagement-Customers). **NICHT Vollständige Hosted-App** — das ist Phase 2.
3. **ValidationKit v0.2 → v1.0** emergiert aus Engagement-Patterns. Wichtigste Add-Ons:
   - JTBD-Interviewer-Subagent (4-Forces-Framework).
   - Pre-Sale-Orchestrator (LOI / Stripe Pre-Order / Concierge-MVP).
   - Pricing-Tester (Van Westendorp).
4. **Studio-Tier-Customer-Acquisition:** Erste 5–10 Boutique-Agency-Customer aus Engagement-Pipeline ($79/$199 MRR).
5. **Naming-Decision M8:** Anwalts-Check Sondr + Pondera.

### 10.2 Success-Metric Phase 1

- **Service-Revenue $30k–$96k** kumulativ.
- **5–10 Studio-Tier-Customer** (≥ $5k MRR).
- **OSS v1.0 mit ≥ 500 GitHub-Stars**.
- **40 % Repeat-Engagement-Rate** oder **40 % Referral-Rate** (eines von beiden, sonst Service-Trap-Signal).

### 10.3 Risks Phase 1

- **Service-Trap-Risk:** Wenn Engagement-Pipeline >80 % Founder-Time frisst, kein Build-Capacity für v1.0. **Mitigation:** Engagements auf 2 Wochen / max 6 parallel begrenzen.
- **Studio-Tier-Conversion-Risk:** Wenn <5 % der OSS-User zu Studio-Tier konvertieren, ist Pricing-Bracket falsch. **Mitigation:** A/B-Test $49 / $79 / $149 in M5.
- **Brand-Confusion-Risk:** ValidationKit (OSS) vs Sondr (Hosted) vs Founder-Validation-Sprint (Service) — drei Channels gleichzeitig kann CIO confusen. **Mitigation:** "ValidationKit by Sondr" als einheitliche Brand-Architektur.

---

## 11. Phase 2 (M9–M18) "PLG-Scale"

### 11.1 Deliverables

1. **Productized "Founder Validation Sprint" $4.500 Flat** als Tier zwischen Solo-$19 und Custom-$10k.
   - Format: 4-Wochen-Sprint, 80 % Standard / 20 % Custom (ManyRequests-Pattern [[ManyRequests 2025](https://www.manyrequests.com/blog/productized-consulting-how-it-works-why-its-worth-it)]).
   - Target-Volume: 60/Jahr = $270k ARR.
2. **Vollständige Hosted-Web-App** live (Next.js 16 + App Router + Cache Components, Workflow DevKit DurableAgent, Clerk, Neon Postgres + pgvector, Vercel AI Gateway, Resend, Stripe). Siehe v2 §16 für Detail-Stack.
3. **Vier Tiers live:** Free / $19 / $79 / $199 / $4.500-Sprint.
4. **Skill-Quality-AI-Reviewer als Premium-Feature** (aus `analysis-v3/11-skill-quality-heuristics.md`). 15 Heuristiken, 3 davon als echter Moat vs Anthropic-Built-In: Trigger-Ambiguity-Score, Cross-Skill-Conflict-Detection, Outdated-Reference-Detection. Anthropic gibt zu: "There is not currently a built-in way to run these evaluations." → Hebel.

### 11.2 Success-Metric Phase 2

- **$30k MRR by M18** ($360k ARR run-rate).
- **50/50 Split:** $15k MRR PLG ($19+$79+$199), $15k MRR Productized-Service ($4.500-Sprints).
- **NPS ≥ 50** in Engagement-Customers (Cohort-Tracking).
- **OSS v1.5 mit ≥ 2.000 GitHub-Stars + 200 weekly active CLI-Users**.

### 11.3 Phase-3-Trigger-Conditions (alle drei müssen erfüllt sein)

Vor jedem MM-Entry-Schritt:

**Trigger 1 — Organic-MM-Pull:**
> "≥ 2 Studio-Tier-Accounts haben *organisch* zu MM-Konversation eskaliert (50+ MA-Companies, eingehende Anfrage nach Multi-Seat / SSO / Audit-Log / Compliance-Features). Eingehende, nicht von uns gesourced."

**Trigger 2 — Window-Still-Open:**
> "Anthropic UND Cursor UND Microsoft haben in den letzten 6 Monaten *nicht* Native-Approval-Workflows + Cross-Vendor-Federation released."

**Trigger 3 — Wedge-Validated:**
> "5 Mom-Test-Interviews mit 50–500-MA-Engineering-Heads bestätigen, dass Multi-Vendor-Skill-Governance + Approval-Workflow ein *akut bezahltes* Problem ist (nicht 'nice-to-have'). Mindestens 2 davon: 'Hier ist meine PO-Nummer, baut das.'"

**Falls einer der drei NICHT erfüllt ist:** Bleibe bei A+D-Mix (Lifestyle-Optimization, $1M-ARR-Solo-Path).

---

## 12. Phase 3 (M18–M24+) "Optional MM-Expand"

### 12.1 Wenn Trigger erfüllt (Sub-Plan)

1. **Hire 1 Sales-Engineer** mit DACH-IT-Procurement-Background. Cost: ~€80k/Jahr inkl. Variable.
2. **SOC2 Type I in 90 Tagen** via Vanta / Drata (~15k EUR all-in Jahr 1). Type II nach Observation-Window.
3. **Enterprise-Tier Build:** Multi-Tenant-Auth (Clerk SCIM), Audit-Log + 90d-Retention, SSO (SAML), Approval-Workflows für Skills.
4. **Narrow Wedge** (nicht alle 4 Säulen!): Pick **EINE** Säule pro Devil's-Advocate-Empfehlung. Recommended: **Approval-Workflow + Audit-Log** (Compliance-getrieben = Pay-Day-Wedge).
5. **Pricing:** $40–60/seat × 25–50 Seats = $12–36k ACV. **Nicht $99–499/seat** (devils-advocate-Critique).

### 12.2 Wenn Trigger NICHT erfüllt

- Bleibe bei Pivot-A+D-Mix.
- $1M-ARR-Solo-Lifestyle-Optimization.
- Re-Brand auf Sondr abgeschlossen.
- BSL-Re-License-Option offen halten (Sentry-Pattern).
- Optionalität auf SureSwift / Tiny.com-Style Exit ($5–10M Acquisition).

---

## 13. Architecture (re-aligned)

### 13.1 Monorepo-Layout (unverändert vs v2)

```
sondr/
├── apps/
│   ├── web/                    # Next.js 16 (Phase 2)
│   └── cli/                    # npx create-validationkit
├── packages/
│   ├── agents/                 # TypeScript Source-of-Truth für Subagents
│   ├── runners/
│   │   ├── local/              # → .claude/agents/*.md (Phase 0)
│   │   ├── cursor/             # → .cursor/rules/*.mdc
│   │   ├── codex/              # → AGENTS.md (Phase 1)
│   │   ├── workflow/           # Vercel WDK DurableAgent (Phase 2)
│   │   └── gemini/             # GEMINI.md (Phase 3+)
│   ├── runtime/                # Multi-Provider AI-Gateway-Wrapper
│   ├── skills/                 # Heuristics-Eval-Runner (Phase 2)
│   └── handoff/                # Persona-bound Build-Kit-Generator
├── decisions/                  # ADRs
└── docs/
```

### 13.2 Storage-Backend-Strategie (versimplifiziert vs Pivot-C)

- **Phase 0–1:** Lokal-only (`.claude/`-Folder im User-Repo).
- **Phase 2:** + Hosted-Backend (Neon Postgres) für Hosted-App.
- **Phase 3 (optional):** + GitHub-Repo-Sync für Team-Accounts (Backstage-Pattern, `packages/runners/github-sync`).
- **Niemals Tag 1:** SharePoint (3-6 Mann-Monate Anker). Falls Phase-3-MM-Customer SharePoint-Sync verlangt, dann via Power Automate / Custom Connector (2-Wochen-Adapter), nicht Native-Build.

### 13.3 Analytics-Strategie (aus `analysis-v3/10-devtool-analytics.md`)

**Top-Pick: Claude Code Hooks + HTTP-Beacon** (~3 Tage Solo-Effort, 25+ Lifecycle-Events nativ verfügbar).

**Backup: Vercel AI Gateway als Proxy** für Token+Cost+Modell-Mix-Tracking quasi gratis im Hosted-Plan.

**Legal-Constraint:** **Opt-In-Default ist Pflicht** für DE-Solo-Betrieb. [activeMind.legal](https://www.activemind.legal/guides/telemetry-data/): "Legitimate Interest" trägt als Legal-Basis NICHT — Consent vor erster Erhebung. US-übliches Opt-Out-Modell (Next.js/Vercel/GitHub CLI) ist für DE-Operation riskant. Backend: PostHog EU Cloud (free tier).

**Anti-Empfehlungen:** Git-Log-Parsing (PII-Bombe), GitHub-API-Driven (Coverage <10 %), Cursor-eigene Telemetry (nicht für 3rd-Party verfügbar).

---

## 14. Subagents (unverändert vs v2 §13)

10–11 Core: `idea-clarifier`, `market-researcher`, `persona-generator`, `persona-interviewer`, `jtbd-interviewer`, `channel-strategist`, `outreach-writer`, `fake-door-designer`, `pricing-tester`, `pre-sale-orchestrator`, `feedback-synthesizer`, plus Phase-1.5 `handoff-pack-builder`.

---

## 15. Slash Commands (unverändert vs v2 §14)

`/validate`, `/handoff`, `/revalidate`, `/compete-check`, `/iterate-prd`, `/decision`, `/dogfood`, `/launch-check`. Plus für v3: `/sprint` (Productized-Service-Engagement-Workflow).

---

## 16. Handoff-Pack Spec (unverändert vs v2 §15)

Validation-Insights *plus* Persona-bound Build-Kit als File-Tree. Importierbar in Claude Code / Cursor / Codex CLI. Persona-Library-Lock-in als Retention-Hebel.

---

## 17. Tech-Stack (unverändert vs v2 §16)

Turborepo + pnpm, Next.js 16 + App Router + Cache Components, Vercel Workflow DevKit (DurableAgent), Clerk (Marketplace), Neon Postgres + Drizzle + pgvector, Vercel Runtime Cache, Stripe, Vercel AI Gateway, AI SDK (`useChat`), Resend (warm-cold) + Postmark-Fallback (>50/day).

---

## 18. Methodology Coverage (unverändert vs v2 §18)

Mom Test, JTBD 4-Forces (Christensen/Klement), Continuous Discovery (Teresa Torres), Lean Startup (Ries), Van Westendorp Pricing, PyMC Labs SSR für Synthetic Personas (RAG-grounded + Forced-Choice WTP + Multi-Model Ensemble).

---

## 19. Demand-Signal-Score (unverändert vs v2 §19)

Volume-Gates / Quality-Multipliers / False-Positive-Penalty. Verdict in {Kill, Weak, Mid, Strong, Exceptional} — keine numerischen 87/100-Scores.

---

## 20. Monetization

### 20.1 Phase 0–1 Tiers

- **Free** — OSS, lokal, kein Hosted.
- **$19/mo Pro** (Solo) — Hosted-Mini-App, Persona-Library, Citation-Tracker.
- **$79/mo Studio-Starter** (3–10 MA Boutique) — Multi-Seat, Shared Persona-Library.
- **$199/mo Studio-Pro** (10–30 MA Boutique) — White-Label, Klient-Retention-Tools.
- **$3.000–$8.000 Custom Engagement** (Phase 0–1) — manuell, Kolja-betreut.

### 20.2 Phase 2 Tiers

- alle obigen +
- **$4.500 Founder Validation Sprint** — Productized, 4-Wochen, 80 % Standard.

### 20.3 Phase 3 (Optional) Tiers

- **Enterprise-Tier $40–60/seat × 25–50 Seats = $12–36k ACV.** Approval-Workflow + Audit-Log + SSO + SCIM. NUR wenn §11.3-Triggers erfüllt.

### 20.4 Revenue-Mix-Target M18

- 50 % PLG ($15k MRR aus $19/$79/$199).
- 50 % Productized-Service ($15k MRR aus $4.500-Sprints).

**Realistic-TAM 24M:** €350k–€800k ARR (`analysis-v3/15-alternative-pivots.md`, Pivot E §5.3).

---

## 21. Platform-Risk

### 21.1 Anthropic-Acquisition-Risk

Reduziert durch Multi-Provider-Architektur (siehe v2 §22).

### 21.2 Anthropic-Eats-Lunch-Risk

**Hoch** für Pure-MM-Skill-Ops (siehe `analysis-v3/14-devils-advocate.md` §2). **Niedrig** für Pre-Validation-Loop (Anthropic baut keine Idea-Validators — das ist outside ihrer Core-Mission).

### 21.3 Microsoft-Copilot-Studio-Eats-M365-Wedge-Risk

**Sehr hoch.** Daher: Kein SharePoint-Build Tag 1. M365-Integration kommt Phase 3 *nur* über Power Automate Custom Connectors (2-Wochen-Adapter), nicht Native.

### 21.4 BSL-Re-License-Escape-Hatch

Sentry-Pattern (2024 von OSS zu Functional Source License [[Sentry Blog](https://blog.sentry.io/sentry-is-now-fair-source/)]) als dokumentierte Option für Phase 4+. Nicht Pinky-Promise, sondern in `LICENSE-NOTICE.md` explizit verankert ab v0.1.

---

## 22. UX Principles (unverändert vs v2 §24)

Citation-First, Severity-Bänder, Real-Channel-Execution, Persona-bound Outputs, Skeptic-Mentor-Voice.

---

## 23. Brand & Voice (unverändert vs v2 §25)

- **Tone:** Älterer Founder, der nicht lügt, aber respektiert. Linear-Voice + DHH-Klarheit.
- **Pattern:** "Concession-then-Critique." Beispiel: "Du hast den Markt richtig identifiziert — aber hier sind 3 Daten, die gegen deine Annahme sprechen."
- **Specificity:** "3.2 % Cold-Email-Reply ist genau Median (Hunter.io 2026) — das ist kein Signal" statt "die Antwortrate ist nicht überzeugend."
- **Citations:** `[Source-Name, Datum](url)` inline.
- **Tagline:** "Find out if anyone actually wants your idea — before you build it."
- **Counter-Tagline:** "Most ideas fail this. That's the point."

---

## 24. Distribution + 12-Week Launch Plan

### 24.1 T-12 → T-0 (Pre-Launch)

- **T-12 → T-8:** Build-in-Public-Cadence aufdrehen (5 Posts/Woche). Theme: "Why most pre-validation tools lie to you." Skeptic-Mentor-Voice.
- **T-8 → T-4:** 2 hochbetreute Validation-Engagements als Open-Threads dokumentieren. Live-Tweeting.
- **T-4 → T-0:** Pre-Launch-Outreach: Theo Browne, swyx, Console.dev, TLDR AI, Fireship, IndieHackers-Newsletter, Lenny Rachitsky (für Studio-Tier).

### 24.2 T-0 Launch

- **Hauptbühnen:** HN Show-HN, r/ClaudeAI, ProductHunt, `awesome-claude-code` PR, VoltAgent-PR, `claude-plugins-official`-Sub.
- **Sekundär:** LinkedIn-DE-Post mit Engagement-Cases, Twitter-Thread, MicroConf-Mailing-List, Indie Hackers Show-IH.
- **8 SEO-Comparison-Pages live:** `/vs/worthbuild`, `/vs/preuve`, `/vs/founderscore`, `/vs/painonsocial`, `/vs/userintuition`, `/vs/gozigzag`, `/vs/iudeaproof`, `/vs/validation-by-handpicks`.

### 24.3 T+4 → T+12 (Post-Launch)

- 1 Engagement/Woche shipping (Cash + Reference).
- Wöchentliche Retro-Threads.
- Erste 5 Studio-Tier-Customer organisch aus Engagement-Pipeline.

---

## 25. OSS Strategy (unverändert vs v2 §27)

MIT für Core (`packages/agents`, `packages/runners`). Open-Source-Trust-Story ist Marketing-Wedge (vs WorthBuild Closed-Source). BSL-Re-License-Option ab Phase 4+ dokumentiert in `LICENSE-NOTICE.md`.

---

## 26. Non-Goals (erweitert vs v2 §26)

- Vollautomatisierter Validate-and-Build-Pipeline.
- LinkedIn / Instagram DM-Automation (ToS-Verstöße, Founder-Reputation-Risk).
- Fake-Precision-Scores (87/100) — nur Severity-Bänder.
- "AI-Yes-Man"-Defaultverhalten.
- Code-Generation für UI/Frontend (das macht Cursor/Claude Code besser).
- **(NEU v3) MM-Direct-Entry ohne 3-Trigger-Erfüllung (§11.3).**
- **(NEU v3) SharePoint-Native-Integration Tag 1.**
- **(NEU v3) 9-Adapter-Build (3 Storage × 3 Tools).**
- **(NEU v3) VC-Pre-Seed-Run vor M18.**
- **(NEU v3) Sales-Hire vor M18.**

---

## 27. Risks

### 27.1 Founder-Capacity-Risk (Severity: High)

Solo + Engagement-Pipeline + OSS-Build + Marketing = >100 % Founder-Time. **Mitigation:** Engagements auf 2-Wochen / max 6 parallel. Build-Cadence ≥ 2 Tage/Woche reserved.

### 27.2 Service-Trap-Risk (Severity: Mid)

Service-Revenue komfortabel, kein Druck auf PLG-Skala → 5-Jahr-Lifestyle-Trap. **Mitigation:** Service-Revenue-Cap 60 % ab M12 (jeder $ über 60 % geht in PLG-Marketing).

### 27.3 Naming-Conflict-Risk (Severity: Mid)

Sondr Mid-Confidence, könnte beim Anwalts-Check fallen. **Mitigation:** Pondera als Backup, sweep-able Liste in `analysis-v3/13-naming-enterprise.md`.

### 27.4 Langfuse-Pivot-Risk (Severity: Mid)

Langfuse (DE-OSS, EU-Hosting, MIT) bewegt sich Richtung Skill-Governance. Wenn sie 2026 Q4 Validation-Loop bauen, sind wir Konkurrent. **Mitigation:** Quartalsweise `/compete-check` mit Langfuse-Sub-Check.

### 27.5 Anthropic-Built-In-Validator-Risk (Severity: Low)

Anthropic baut Idea-Validators nicht (outside Core-Mission). Aber Skills-Marketplace könnte Validator-Skills bündeln → "free + native > $19/mo". **Mitigation:** Multi-Provider-Architektur + Real-Channel-Execution als Differenzierung.

---

## 28. Success Metrics

### 28.1 M3 (Phase 0 End)

- 2 Engagements closed (≥ $6k Service-Revenue).
- 20 Mom-Tests durchgeführt.
- OSS v0.1 mit ≥ 50 GitHub-Stars.
- 5 issues + 2 PRs.

### 28.2 M9 (Phase 1 End)

- $30k–$96k kumulativ Service-Revenue.
- 5–10 Studio-Tier-Customer ($5k+ MRR).
- OSS v1.0 mit ≥ 500 Stars.
- 40 % Repeat-Engagement-Rate ODER 40 % Referral-Rate.

### 28.3 M18 (Phase 2 End)

- $30k MRR ($360k ARR run-rate).
- 50/50 Split PLG/Productized-Service.
- NPS ≥ 50.
- OSS v1.5 mit ≥ 2.000 Stars, 200 weekly active CLI-Users.

### 28.4 M24

- Falls Phase-3-Trigger erfüllt: 2–3 MM-Pilot-Customer ($30k+ ACV each).
- Falls nicht: $500k+ ARR Solo-Lifestyle, BSL-Re-License-Option offen.

### 28.5 Pivot-Trigger (Re-Run §11.3)

Re-Run dieses PRDs falls:
- Anthropic / Cursor schließen alle drei MM-Skill-Ops-Gaps.
- Langfuse launches Validation-vor-Build-Feature.
- Funding-Decision (gegen aktuelle Solo-MIT-OSS-Constraint).
- Co-Founder-Hire mit Enterprise-Sales-Background.

---

## 29. Roadmap

```
M0  ─── M3 ─── M9 ─── M18 ─── M24 ─── M36+
[Phase 0]  [Phase 1]  [Phase 2]  [Phase 3 optional]

M0:  OSS v0.1 + 2 Engagements + 20 Mom-Tests
M3:  Phase 0 done, Studio-Tier-Build started
M6:  v0.2 + 5 Engagements + Naming-Decision (M8)
M9:  Phase 1 done, $30k+ Service-Revenue, 5+ Studio-Customer
M12: Productized "Sprint" $4.500 live
M15: Hosted-App MVP (Phase 2 start)
M18: Phase 2 done, $30k MRR, 50/50 Split, Trigger-Check
M21: Phase 3 GO/NO-GO decision
M24: Phase 3 mid-evaluation (falls GO)
M36+: Cat-Definition oder Lifestyle-Optimization
```

---

## 30. Open Questions

### 30.1 Phase 0

- **Co-Founder-Sourcing aktiv starten?** FMF-Analyse: 4/10 solo (aus v2). Solo-OSS-Dev-Tool-Erfolge sind statistisch fast immer Duos. **v3-Erweiterung:** Phase 3 erfordert Co-Founder mit Sales-DNA, falls Trigger erfüllt. Sourcing-Start M12?
- **Re-Brand-Timing-Final?** M8 Anwalts-Check, M9 Wahl, M10–M12 Migration — committed?
- **AGPL vs MIT für Web-Layer-Code?** AGPL würde Forks blockieren, aber Boutique-Agency-Adoption killen.

### 30.2 Phase 1

- **Engagement-Pricing-Bracket-Final?** $3–8k Custom oder $4.500 Flat?
- **Studio-Tier-Pricing-Final?** $79/$199 oder $49/$99/$149 mit A/B-Test M5?

### 30.3 Phase 3

- **Wedge-Pick falls Trigger erfüllt?** Approval-Workflow ODER Audit-Log ODER Cross-Vendor-Federation — eines, nicht alle.
- **VC oder Bootstrap auch in Phase 3?** Solo-Constraint vs Sales-Hire-Need.

---

## 31. Next Steps (konkret, ab heute)

1. **20 Mom-Test-Interviews** mit unabhängigen Indie-Hackers (DACH-Solopreneur-Netz). Founder-Bias-Mitigation. **Wenn 2026-05-21 nicht angefangen, ist Phase 0 nicht real.**
2. **GitHub-Org `validationkit-ai` + npm-Namespace** reservieren (heute, kostenlos).
3. **`/dogfood "<deine eigene Side-Projekt-Idee>"`** in Claude Code starten — manuell, end-to-end. Reference-Implementation für Phase-0-MVP.
4. **Validation Handbook v0** schreiben (~10k Wörter, 8–12 Kapitel) — Marketing-Asset + Brand-Building.
5. **Build-in-Public-Cadence starten** (5 Posts/Woche, Skeptic-Mentor-Voice).
6. **Anwalts-Vorbereitung Sondr+Pondera** für M8.
7. **Domain-WHOIS `sondr.ai`** check (zur Preis-Indikation).
8. **Re-Run der 8 fehlenden Recherchen** (M365-Ecosystem, Acquisition-Threats, MM-Adoption-Data, Solo-MM-Sales, Compliance-Reality, SharePoint-Engineering, GitHub-Storage, Onboarding-UX) — nicht load-bearing fürs Verdict, aber wichtig für ADR-0017-Engineering-Decision.

---

## 32. Decisions Log

| ADR | Date | Title | Status |
|---|---|---|---|
| ADR-0001 bis ADR-0016 | 2026-05-14 (v2) | aus v2.0 vererbt | Accepted |
| **ADR-0017** | **2026-05-14 (v3)** | **Pure-MM-Pivot abgelehnt, Hybrid Layered (Pivot E) gewählt** | **Accepted** |
| **ADR-0018** | **2026-05-14 (v3)** | **SharePoint-Native-Integration als Non-Goal Tag 1** | **Accepted** |
| **ADR-0019** | **2026-05-14 (v3)** | **Solo-Constraint bleibt durch Phase 0–2, Co-Founder-Sourcing erst M12+** | **Accepted** |
| **ADR-0020** | **2026-05-14 (v3)** | **ValidationKit als Sub-Brand behalten, Sondr Re-Brand M8-M12** | **Accepted** |

Details in `decisions/0017-hybrid-pivot-e.md`. Open ADRs sind in `decisions/` versionskontrolliert.

---

*Last updated: 2026-05-14 ~09:30. Pivot-Verdict aus 14-Agent-Devil's-Advocate-Recherche. Maintain via `/iterate-prd`. Bei Konflikt mit `analysis-v3/`-Files gewinnt PRD v3, weil später synthesized — aber zitiere die Evidenz aus dem File-System.*
