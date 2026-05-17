> **ARCHIVED 2026-05-16.** All file-paths in this document were pre-v5-Refactor. See `docs/PRD.md` for current. Original paths: `analysis/` → `docs/research/v2/`, `analysis-v3/` → `docs/research/v3/`, `analysis-v4/` → `docs/research/v4/`, `decisions/` → `docs/decisions/`.

# PRD ValidationKit / Sondr — v3.1

> **Status:** Source of Truth (ersetzt v3.0 vom 2026-05-14). v3.0 wird zur historischen Reference.
> **Datum:** 2026-05-16 | **Owner:** Kolja Schöpe (kol.schoepe@gmail.com)
> **Auslöser v3.1:** User-Initiierter "Voller-Replacement-Pivot" zu ContextForge (Multi-Tenant-Agency-Operations-SaaS) wurde durch 8-Agent-Recherche-Run **abgelehnt auf 3 von 5 Achsen**. ContextForge wird stattdessen als **Productized-Form von ValidationKit** integriert (ADR-0018, Pfad C / Hybrid).
> **Evidenz-Basis:** `analysis-v4/00-synthesis-verdict.md` + `analysis-v4/01-08-*.md` (≈32.000 W gesicherte Recherche, ~150 Quellen, alle inline-cited). Verdict-tragend: 00, 01, 06, 07.
> **Beziehung zu v3.0:** v3.1 *erweitert* v3.0 um die ContextForge-Productized-Form. Alle nicht explizit gelisteten Sektionen aus v3.0 bleiben gültig.

---

## 0. Changelog v3.0 → v3.1

| Bereich | v3.0 (2026-05-14) | v3.1 (2026-05-16) |
|---|---|---|
| **Wedge-Anzahl** | 1 Wedge (Pre-Build-Validation) | **2 Wedges** (Pre-Build-Validation + Post-Build-Agency-Operations) |
| **Phase 0** | OSS v0.1 + 2 Engagements + 20 Mom-Tests | + **10 Agency-Discovery-Interviews** + **5 Agency-LOIs als Gate** + **4 GitHub-App-Day-1-Mitigations** |
| **Phase 1** | 8–12 Validation-Engagements ($30k–96k) | **4–6 Validation + 4–6 Operations-Sprints** = 8–12 Engagements ($45k–108k) |
| **Phase 2** | Hosted-Web-App + Founder-Validation-Sprint $4.500 | + **Agency-Operations-Sprint $4.500** + **`/operations` Hosted-Tier** ($299/$799) |
| **Pricing** | Free / $19 / $79 / $199 / $4.500 | Free / $19 (Solo) / **$299 (Agency-Pro) / $799 (Agency-Scale)** / $4.500 (Sprint) / Custom — **kein $99-Sandwich** |
| **GTM-Motion** | LinkedIn + Build-in-Public + Content | **Content/Build-in-Public/PLG-Primary** für $19–$299, **LinkedIn nur für $799+ und Discovery** — Cold-Outreach explicit gestrichen für Sub-$5k-ACV |
| **Headline-Feature** | "AI-Reviewer" Premium | **"Audit Report"** (deterministic-first, 5/6 Kategorien regelbasiert) |
| **Parser-Scope** | Multi-Provider-SKILL.md | **12 Formate** (5 MUST + 5 SHOULD + 2 MAY, siehe §33.4) |
| **Wedge-These** | "Validation für Solopreneurs" | **"Cross-Vendor Agent-File-Trust — from idea to multi-customer operations"** |
| **AAIF-Membership** | Nicht thematisiert | **AAIF-Silver $5k/yr** als Phase-1-Budget-Item |
| **Decisions Log** | ADR-0017 + 3 Sub-Decisions (0018–0020 konzeptuell) | **+ ADR-0018 (file) ContextForge as Productized-Form** |
| **Non-Goals** | 13 Bullets (8 alt + 5 v3-neu) | **+ 7 v3.1-neue** (siehe §32.3) |
| **TAM-Claim** | Indie-Hacker-TAM (PRD v2) | + **AI-Consultancy-TAM SAM 600–1.500 buyer-qualified heute** (Track A1) |
| **Y3-ARR-Ziel** | $360k ARR by M18 ($30k MRR) | **$500k–$1M USD ARR by Y3** (kombiniert; Track D1 hat 5–10× zu optimistisch im ContextForge-v0.1-PRD korrigiert) |

---

## 1. Executive Summary (TL;DR) — v3.1

**ValidationKit / Sondr** ist ein Open-Source-MIT-Framework + Hosted-Web-App mit **zwei komplementären Wedges**, die dieselbe OSS-Core und dieselbe Hosted-App teilen:

- **`/validate`-Linie (v3-Original):** Pre-Build-Validation-Loop für Solopreneurs/Indie-Hackers — Persona "Indie-Founder Marie". Idee in <30 Min validieren mit Source-Citations + Real-Channel-Experiments + Handoff-Pack.
- **`/operations`-Linie (v3.1-NEU, ex-ContextForge):** Post-Build-Operations-Loop für AI-Consultancies/Boutique-Agencies (8–25 MA) — Persona "Agency-Lena". 5–30 Customer-Repos mit Cross-Vendor-Inventory, Drift-Detection, Audit-Report, Template-Distribution-via-PR managen.

**Differenzierungs-These:** "Cross-Vendor Agent-File-Trust — from idea to multi-customer operations." Niemand kombiniert Pre-Build-Validation + Post-Build-Multi-Customer-Operations in einer Plattform.

**Begleitend zwei Productized-Services à $4.500 Flat** als Cash-Engine und Dogfood-Quelle in Phase 0–2:
- "Founder Validation Sprint" — Pre-Build-Validation 2-Wochen-Engagement.
- "Agency Operations Sprint" — Post-Build-Audit + Inventory-Setup 2-Wochen-Engagement.

**Hybrid-Layered-Strategie (v3.1, Pfad C / ADR-0018):**
- **Phase 0 (M0–M3):** OSS v0.1 + 2 Validation-Engagements + 20 Mom-Tests **+ 10 Agency-Discovery-Interviews** + **5 Agency-LOIs als Phase-1-Gate** + 4 GitHub-App-Day-1-Mitigations.
- **Phase 1 (M3–M9):** **Dual-Sprint-Mix:** 4–6 Validation + 4–6 Operations-Sprints = 8–12 Engagements à $4.500 ($45k–108k Service-Revenue). Studio-Tier-Build ($19 Indie / $299 Agency-Pro / $799 Agency-Scale) parallel finanziert. AAIF-Silver-Membership ($5k/yr).
- **Phase 2 (M9–M18):** Hosted-Web-App mit `/validate` + `/operations`-Tiers live. Ziel kombiniert $30k MRR by M18, $500k–$1M ARR by Y3.
- **Phase 3 (M18–M24+):** *Optional* MM-Expand bei Trigger-Erfüllung (PRD v3 §11.3 weiterhin gültig).

**Warum nicht "Voller Replacement von VK durch ContextForge"?** Drei brutale Befunde aus `analysis-v4/`:
1. **GTM-Motion KILL (Track D1):** Null Solo-Founder im 8er-Comp-Set (Plausible, ConvertKit, etc.) ist via LinkedIn-Cold-Outreach gewachsen — alle via Content/SEO/Build-in-Public/PLG. Year-3-$2–3M-ARR-Ziel im CF-PRD ist 5–10× zu optimistisch für Solo.
2. **Pain Mild, nicht Burning (Track C1):** Drift-Mgmt sitzt Top-8 bis Top-10 in Claude-Code-Pain. Workaround-Economy ist reichlich & gratis (444 Stars OSS). $99-Pricing-Sandwich zwischen Indie und Agency.
3. **AI-Review-Headline RISK-INDUCING (Track D2):** SOTA-Tools catchen 24–48% Real-Bugs. 5/6 Finding-Kategorien sind deterministisch (LLM nicht nötig). FPR >15% = "blanket dismissal" in Woche 13.

**Was die Daten BESTÄTIGEN:** Wedge existiert (Track A2: 6–9 Mo clear-air vor grekt.com/MindStudio), Anthropic-Threat managebar (Track C2: Cross-Vendor permanent-defensibel), GitHub-App-Approval workable mit 4 Mitigations (Track B1), Standards konvergieren (Track B2: AAIF Linux Foundation, AGENTS.md 60k+ Repos). **Die Engineering-Substanz trägt. Die Form muss anders sein.**

---

## 2.x Updates zu bestehenden Sektionen (Delta-Beschreibung)

> Alle nicht explizit gelisteten Sektionen aus v3.0 bleiben gültig. Was unten steht, *überschreibt* die entsprechenden v3.0-Sektionen.

### §5 Target Users — Update

**§5.1 Primary ICP (v3.1):**

- **P0 — Solopreneur / Indie-Hacker.** Self-serve `/validate`, $19/mo. Unverändert vs v3.
- **P0 — Boutique-Agency / Studio (3–30 MA).** Resell Validation als Service an Klient. Studio-Tier $299/$799 (von v3 $79/$199 *hochgeschoben* — siehe §6).
- **P0 — Productized-Service-Customer (Validation).** "Founder Validation Sprint" $4.500. Unverändert vs v3.
- **P0 (NEU v3.1) — AI-Consultancy / AI-Solution-Agency (8–25 MA), Multi-Customer-Repo-Manager.** Persona "Agency-Lena". Self-serve `/operations`-Tier $299/$799. **Bottom-up SAM heute 600–1.500 buyer-qualified weltweit, DACH 120–175** (Track A1).
- **P0 (NEU v3.1) — Productized-Service-Customer (Operations).** "Agency Operations Sprint" $4.500. Cash-Engine #2 + Reference-Implementation für ContextForge-Wedge.
- **P0.5 (NEU v3.1) — Compliance-Frame-Agency** (Pharma, Finance, Marketing-with-PII). Strong-Pain-Segment laut Track C1. Custom-Pricing möglich.

**§5.2 Phase-3-Optional-ICP:** Unverändert vs v3.

**§5.3 Was wir nicht bedienen:** Unverändert vs v3 + (NEU v3.1): **Keine Konzern-Engagement-Sales-Motion vor M18.** Konzern-Use-Case (PRD ContextForge §5.3 Tim) bleibt strikter Phase-3-Trigger.

### §6 Pricing (v3.0 wird komplett ersetzt)

**Pricing-Tiers v3.1:**

| Tier | Zielgruppe | Preis | Limits |
|---|---|---|---|
| **Free OSS** | Self-Host, Solo | $0 | Lokale CLI, kein Hosted, kein Agency-Multi-Repo |
| **Solo Indie** | Indie-Hacker, 1 Projekt | **$19/mo** | `/validate`, 1 User, 50 AI-Runs/Mo |
| **Solo Pro** | Power-Indie, 3 Projekte | **$79/mo** | `/validate` + Audit-Report, 3 Projekte, 250 Runs |
| **Agency Pro** | Boutique-Agency 5–10 Klienten | **$299/mo** | `/operations` + `/validate`, 10 Customer-Repos, 5 User, 1.000 Audit-Runs |
| **Agency Scale** | Agency 10–30 Klienten | **$799/mo** | Unlimited Customer-Repos, 15 User, 5.000 Audit-Runs, SOC-2-Pfad, EU-Hosting-Option |
| **Validation Sprint** | Funded Solos, Pre-Seed-Teams | **$4.500/Engagement** | 2-Wochen-Sprint, 80% Standard / 20% Custom |
| **Operations Sprint** | AI-Consultancies, Onboarding-Bedarf | **$4.500/Engagement** | 2-Wochen-Sprint, Audit-Setup + Template-Library + PR-Workflow |
| **Enterprise** | Konzern (Phase 3 only) | Custom | SSO, Self-Host, DPA, SLA, Class-3-Trigger-only |

**Begründung Tier-Shift:**

- $79 + $199 (v3) → $299 + $799 (v3.1) für Agency-Tier. **Grund:** Track A1 zeigt Agencies zahlen schon $155–230/Seat/Mo Dev-Tooling. Track C1 zeigt $99-Layer ist Pricing-Sandwich. Agency-Pro mit Multi-Customer-Multiplier rechtfertigt $299–$799.
- **Kein $99-Layer.** Pricing-Sandwich zwischen Indie ($0–19) und Agency ($299–799). Direkt überspringen.
- **Solo Pro $79** wird beibehalten für Power-Indie mit 3 Projekten — vor Agency-Schwelle.
- **Operations Sprint $4.500** = symmetrisch zu Validation Sprint. Cash-Engine-Parität.

### §11 Strategie Phase 1/2/3 — Updates

**§11.1 Phase 1 Roadmap (v3.1):**

- **Dual-Sprint-Mix:** Anstelle 8–12 reine Validation-Engagements bauen wir Mix:
  - 4–6 Validation-Sprints à $4.500 = $18k–27k
  - 4–6 Operations-Sprints à $4.500 = $18k–27k
  - **Total Service-Revenue $36k–54k bei 8–12 Engagements** (vergleichbar v3, plus Operations-Wedge-Discovery)
- **Studio-Tier-Build:** Indie ($19 Solo + $79 Pro) + Agency ($299 + $799). Ziel: 5 Indie-Pro + 3 Agency-Pro by M9 = $237 + $897 = $1.134 MRR.
- **AAIF-Silver-Membership:** $5k/yr ab M3 für Spec-Beteiligung (B2-Empfehlung).
- **ValidationKit v0.2 → v1.0:** Subagent-Pattern aus *beiden* Engagement-Typen.

**§11.2 Phase 2 Roadmap (v3.1):**

- **Vollständige Hosted-App** mit `/validate` + `/operations`-Surfaces.
- **`/operations`-Features (NEU v3.1):**
  - 12-Format-Parser (siehe §33.4)
  - Multi-Customer-Repo-Inventory (read-only-default)
  - Drift-Detection (deterministisch, Side-by-Side-Diff)
  - **Audit Report** (statt "AI Review", siehe §33.5)
  - Template-Library mit Versionierung
  - PR-Workflow (read-write opt-in, niemals direkt-Push)
- **6 Productized-Sprints/Monat** (3 Validation + 3 Operations) = 72/Jahr × $4.500 = $324k ARR Service-Revenue.
- **MRR-Ziel kombiniert:** $30k by M18 (≈ $360k ARR-run-rate).
  - $15k MRR PLG ($19+$79+$299+$799)
  - $15k MRR Service (4-Wo-Sprint-Equivalent in Recurring-Engagement-Cohorts)
- **Year-3-ARR-Ziel (NEU v3.1):** $500k–$1M USD kombiniert (D1-korrigiert von $2–3M EUR im CF-PRD).

**§11.3 Phase 3 Optional MM-Expand:** Trigger-Conditions unverändert vs v3 + **NEU v3.1:**
- **4. Trigger:** ContextForge-Wedge-Adoption hat sich validiert (≥ 50 Agency-Customers in `/operations`-Tier by M18) UND Compliance-Frame-Segment zeigt Pull (≥ 5 Custom-Enterprise-Deals by M18).
- Wenn Trigger 1-4 erfüllt: MM-Expand startet auf bewährtem Agency-Operations-Wedge, nicht auf Konzern-Internal-IT-Wedge. Bottom-Up statt Top-Down.

### §31 Next Concrete Steps (v3.1)

Überschreibt v3 §31:

1. **20 strukturierte Mom-Test-Interviews** mit Indie-Hackers (DACH). Bis 2026-05-21 starten.
2. **10 Agency-Discovery-Interviews** mit AI-Consultancy-CEOs (DACH, Anthropic-Partner-Netzwerk). Bis M3 abgeschlossen. **5 LOIs als Phase-1-Gate** — wenn nicht erreicht, Operations-Sprint wird auf Phase 2 zurückgestellt.
3. **GitHub-Org `validationkit-ai` + npm-Namespace** reservieren (heute, kostenlos).
4. **`/dogfood`** mit eigener Side-Projekt-Idee.
5. **Validation Handbook v0** (~10k Wörter, 8–12 Kapitel).
6. **Operations Playbook v0** (~5k Wörter, 4–6 Kapitel) — NEU v3.1, parallel zu Validation Handbook.
7. **Build-in-Public-Cadence** (5 Posts/Woche, Skeptic-Mentor-Voice). NEU v3.1: 40 % Validation-Content / 40 % Operations-Content / 20 % Cross-Vendor-Thesis.
8. **Anwalts-Vorbereitung Sondr+Pondera** für M8.
9. **4 GitHub-App-Day-1-Mitigations** (9–12 PD, B1-Empfehlung):
   - DPA-Template (2 PD)
   - Trust-Center-Pseudo-MVP (1 PD)
   - Requester→Approver-Bridge (3–5 PD)
   - Read-Only-Default mit Opt-In-Write (1 PD)
10. **12-Format-Parser-Spec** für `validationkit-cli` + `contextforge-cli` (siehe §33.4).
11. **30-File-Golden-Set für Audit-Report** in Woche 1–2 *bevor* Audit-Code geschrieben wird (D2-Empfehlung).
12. **Re-Run der 8 fehlenden v3-Recherchen** (nicht load-bearing für v3.1-Verdict).

### §32 ADRs (v3.1)

| ADR | Date | Title | Status | Datei |
|---|---|---|---|---|
| 0001–0016 | 2026-05-14 | aus v2.0 vererbt | Accepted | (in `decisions/0017-hybrid-pivot-e.md` synopsis) |
| **0017** | 2026-05-14 | Pure-MM-Pivot abgelehnt, Hybrid Layered (Pivot E) gewählt + Sub-Decisions (SharePoint Non-Goal Tag 1, Solo-Constraint, ValidationKit-Sub-Brand) | Accepted | `decisions/0017-hybrid-pivot-e.md` |
| **0018 (NEU v3.1)** | **2026-05-16** | **ContextForge wird Productized-Form von ValidationKit (Pfad C / Hybrid), kein Replacement** | **Accepted** | `decisions/0018-contextforge-as-productized-form.md` |

**§32.3 Hard Non-Goals (NEU v3.1, ergänzt §2.3 v3):**

- **Kein "AI Review" als Headline-Feature.** Heißt jetzt "Audit Report". 5/6 Kategorien deterministisch.
- **Kein LinkedIn-Cold-Outreach als Primary-GTM für Sub-$5k-ACV-Tiers.** Empirisch gebrochen (D1).
- **Kein PAT-Fallback statt GitHub-App.** Architektur-toxisch (GDPR-Joint-Controller-Falle).
- **Kein Voller-Replacement-Pivot ohne ADR-0018-Re-Run.** Pfad C (Hybrid) ist load-bearing.
- **Kein $99-Pricing-Layer.** Pricing-Sandwich.
- **Keine Multi-Model-Compare-Marketing-Claims** ohne Eval-Beleg.
- **Kein "Voller ContextForge-Build" ohne Phase-0-Gate (5 Agency-LOIs in M3).** Wenn Gate gerissen, Operations-Sprint wird auf Phase 2 zurückgestellt.

---

## 33. ContextForge-Productized-Form (NEU v3.1)

### §33.1 Was ist ContextForge in v3.1?

ContextForge ist die Productized-Form von ValidationKit's Post-Build-Operations-Wedge — **nicht eine zweite Plattform, sondern eine zweite Surface auf derselben Plattform.** Konkret:

- **Brand-Architektur (M0–M9):** "ValidationKit" als Haupt-Brand, "ContextForge" als interne Sub-Brand für die Operations-Linie. Webseite zeigt `validationkit.dev` mit `/validate` + `/operations`-Tabs.
- **Brand-Architektur (M9+):** Sondr (oder Pondera) als Haupt-Brand, "Validate" + "Operations" als feature-namen. ContextForge-Name kann als Sub-Brand überleben (analog Linear/Linear-Insights).
- **Engineering-Architektur:** Eine OSS-Core (`@validationkit/core`), zwei CLIs (`validationkit-cli` für Validation, `contextforge-cli` für Operations), eine Hosted-Web-App mit zwei Surfaces.

### §33.2 Wedge-These (Operations-Linie)

**"Cross-Vendor Agent-File-Compliance for Multi-Customer-Agencies."**

Konkret: Eine AI-Consultancy mit 5–30 Customer-Repos hat heute keine systematische Sicht darauf, welche Agent-Files (CLAUDE.md, AGENTS.md, .claude/agents/, .cursor/rules/, etc.) wo existieren, was sie tun, wann sie veraltet sind, oder wo Sicherheits-relevante Patterns drift-gewordert sind. Niemand reviewt sie systematisch. Niemand verteilt Best-Practices.

**Pain-Severity (laut Track C1):**
- Solo-Indie = **Vitamin** (workaround acceptable, OSS-tools genügen)
- Boutique-Agency = **Mild Painkiller** (real, aber nicht viral)
- **Compliance-Agency = Strong Painkiller** (Credential-Leak, Cross-Client-Daten-Kontamination — monetisierbar)

**Markt (laut Track A1):** SAM heute 600–1.500 buyer-qualified AI-Consultancies weltweit. DACH: 120–175 AI-Boutiquen. Year-1-Ziel: 40–50 Agency-Customers (realistisch). Year-3-Kombiniert-ARR: $500k–$1M USD.

### §33.3 Differenzierung (laut Track A2 + C2)

**Was niemand sonst hat (Mai 2026):**
- GitHub Agent Control Plane (GA 2026-02-26): intra-Tenant-only.
- Microsoft Agent 365 (GA 2026-05-01, $15/user/mo): Enterprise-Single-Tenant, Cross-Cloud (AWS+GCP).
- Anthropic Claude Console / Managed Agents: Single-Org-Workspace-Cap 100.
- OpenAI AgentKit / Connector Registry: Single-Org.
- AgentOps/LangSmith/Langfuse: Runtime-Telemetry, nicht Authoring.
- grekt.com: OSS-CLI mit ~70% der Engine, aber kein Multi-Tenant-Dashboard, kein PR-Workflow, kein Audit-Report.
- MindStudio: 6 Blog-Posts über das Pattern, kein Produkt.

**ContextForge-Wedge (6–9 Mo clear-air):** Multi-Tenant (Cross-Customer-Org) + Cross-Vendor (AGENTS.md + CLAUDE.md + .cursor/* + .windsurf/* + GEMINI.md + SKILL.md) + Agency-Workflow-Vertical (Billing per Customer, PR-Review pro Kunde) + Compliance-Frame (DPA, Read-Only-Default, EU-Hosting-Option).

**Permanent-Defensible (laut Track C2):** Nur 2/8 Features sind langfristig defensibel — beide rund um Cross-Vendor. **Cross-Vendor allein reicht aber nicht** für 5-Jahres-Defense. Muss kombiniert mit Agency-Workflow-Vertical + Brand-Karma + Phase-1-Discovery-Lead.

### §33.4 12-Format-Parser-Spec (Phase 1 Pflicht)

**5 MUST** (Phase 1, M0–M3 deliverable):
1. `CLAUDE.md` (Anthropic, root + subdirectories)
2. `AGENTS.md` (Linux Foundation AAIF, root + subdirectories)
3. `.claude/agents/*.md`
4. `.claude/commands/*.md`
5. `.claude/skills/*/SKILL.md`

**5 SHOULD** (Phase 1, M3–M6 deliverable):
6. `GEMINI.md` (Google)
7. `.cursor/rules/*.mdc` (Cursor, 4-Mode-Activation-Logik: alwaysApply, globs, agent-requested, manual — schwierigster Parser)
8. `.cursorrules` (Cursor-Legacy, deprecated aber noch lebendig)
9. `.windsurf/rules.md`
10. `.clinerules` (Cline)

**2 MAY** (Phase 2, opportunistic):
11. `.codex/` (zu validieren mit Codex-Doku)
12. `aider.conf.yml` (Aider)

Parser-Pflicht: Markdown + Frontmatter, Token-Count pro File, last-modified, author (via git blame).

### §33.5 Audit-Report (statt "AI Review")

**Rebranding-Grund (laut Track D2):** "AI Review" als Headline-Feature ist Risk-Inducing. SOTA-Tools catchen 24–48% Real-Bugs. FPR >15% = "blanket dismissal" in Woche 13.

**Deterministic-First-Architecture:**

| Finding-Kategorie | Implementierung | LLM nötig? |
|---|---|---|
| Unused agents (referenced in no command/workflow) | Static analysis | **Nein** |
| Duplicate guidance (Use X steht in 2+ Files) | String-similarity + AST-comparison | **Nein** |
| Context bloat (file > N tokens) | Token-counting | **Nein** |
| Stale references (referenced file not found) | Filesystem-walk | **Nein** |
| Token-Budget-Optimization | Heuristic-rules | **Nein** |
| Conflicting rules (CLAUDE.md says A, commands/lint.md says B) | LLM-comparison mit Confidence-Banding | **Ja** (LLM-Cell) |

**5/6 deterministisch, nur 1/6 LLM.** Multi-Model-Compare NUR als adversarial-critique mit Confidence-Banding, niemals als Marketing-Headline.

**Eval-Pipeline-Plan (D2-Empfehlung):**
- 30-File-Golden-Set in Woche 1–2, *bevor* Audit-Code.
- Promptfoo (free, CLI) + Langfuse (OSS) + ~280 Stunden über 12–16 Wochen.
- Continuous nightly-eval gegen Golden-Set.
- "Audit Report" wird als unique gefeatured: "5 von 6 Findings sind binär verifizierbar, 1 nutzt LLM mit Confidence-Score. Wir verstecken nichts."

### §33.6 GitHub-App-Mitigations (Phase 0 Pflicht)

Vier Day-1-Mitigations (laut Track B1, 9–12 PD total):

1. **DPA-Template** (2 PD): Lawyer-reviewed Data-Processing-Agreement-Template. Customer kann mit 1 Click Co-Sign. DACH-GDPR-konform Day 1.
2. **Trust-Center-Pseudo-MVP** (1 PD): Static-Page mit Permissions-Begründung, Security-Posture, Compliance-Roadmap (SOC-2 in 12 Mo). Trust-Signal für Customer-CTO.
3. **Requester→Approver-Bridge** (3–5 PD): Webhook-Reconciliation. Lena (Agency-Member) requested Install, automatischer Status-Track bis Customer-Admin approve. Konvu-Pattern.
4. **Read-Only-Default** (1 PD): GitHub-App-Scope explicit nur `contents:read` + `pull_requests:read`. Write-Access nur opt-in pro Customer. Niemals direkt-Push.

**Risk-Re-Classification (NEU v3.1):**
- Ohne Mitigations: Probability **Hoch / Impact Hoch** (Risk-Level KILL)
- Mit Mitigations: Probability **Mittel / Impact Mittel-Hoch** (Risk-Level MID, manageable)

**PAT-Alternative ist Non-Goal.** Architektur-toxisch (GDPR-Joint-Controller-Falle, Rotations-Pflicht, höherer Blast-Radius). Sunset-Plan ab M3, niemals canonical.

### §33.7 Phase-0-Gate für Operations-Wedge

**Definition:** 5 Letters-of-Intent von AI-Consultancy-CEOs (DACH-First) bis Ende M3.

**Was zählt als LOI:**
- Schriftliche Zusage (Email genügt) für "Agency Operations Sprint" $4.500 in Phase 1.
- 3 von 5 müssen DACH-AI-Boutiquen sein (Track A1 SAM 120–175).
- 2 von 5 dürfen EU-/US-AI-Boutiquen sein (Anthropic-Partner-Netzwerk).

**Was passiert wenn Gate gerissen:**
- Operations-Sprint wird auf Phase 2 zurückgestellt.
- Phase 1 fokussiert auf Validation-Sprint only (8–12 Engagements à $4.500).
- ContextForge bleibt im PRD, aber als Phase-2-Feature, nicht als Phase-1-Cash-Engine.
- ADR-0018 wird neu evaluiert (siehe ADR-0018 Re-Open-Trigger).

### §33.8 Cross-Sells zwischen Validation-Linie und Operations-Linie

**Phase 2 Ziel:** Founder-Validation-Sprint-Customer wird in Phase-2-Y2 Agency-Operations-Customer wenn sie zur Agency-Founder werden. Cohort-Tracking ab M12.

**Phase 2 Wedge-Story:** "Validate idea → Build → Manage 5–30 Customer-Repos with same brand." Single brand journey, Validation→Operations als organic Customer-Lifecycle.

---

## 34. Open Decisions (NEU v3.1)

1. **Brand-Architektur M9:** Wird "ContextForge" als Sub-Brand behalten, oder unter Sondr/Pondera vollständig konsumiert? Anwalts-Check für ContextForge-Name in M8 mit Sondr+Pondera bundlen.
2. **`/operations`-vs-`/validate` Tab-Reihenfolge:** Im Default-Web-App-Dashboard zeigen wir `/validate` first oder `/operations` first? Hypothesis-Test in Phase 1 mit Design-Partnern.
3. **AAIF-Silver-Membership-Timing:** M3 (sofort) oder M6 (nach Phase-0-Gate-Erfüllung)? Budget $5k/yr ist non-trivial für Solo-Founder pre-Revenue.
4. **Operations-Sprint-Format:** 2 Wochen wie Validation-Sprint, oder 3 Wochen (mehr Discovery-Anteil)? Pilot in Phase 1.
5. **Cross-Customer-Aggregation-Opt-In:** Wenn 50+ Agencies in `/operations`-Tier sind, können wir anonymisiert Cross-Customer-Insights anbieten ("Top-10-Patterns across all customers")? Privacy-Frame in Phase 2 klären.

---

## Anhang — Source-Mapping v3.1-Recherche

- `analysis-v4/00-synthesis-verdict.md` — Synthese, Verdict-tragend
- `analysis-v4/01-ai-consultancy-tam.md` — TAM 600–1.500 SAM, DACH 120–175
- `analysis-v4/02-competitor-refresh-mai-2026.md` — 6–9 Mo clear-air, grekt.com Top-Threat
- `analysis-v4/03-github-app-approval-reality.md` — 4 Mitigations Pflicht
- `analysis-v4/04-agents-md-standard-reality.md` — 12 Formate, AAIF konvergiert
- `analysis-v4/05-drift-pain-wtp.md` — Mild Painkiller, Pivot-E-Recommendation
- `analysis-v4/06-anthropic-acquisition-threat.md` — Per-Feature 12–18 Mo, Full-Wedge >18 Mo
- `analysis-v4/07-solo-sales-motion-reality.md` — KILL auf Cold-Outreach + Year-3-ARR
- `analysis-v4/08-ai-review-quality-eval-reality.md` — Audit-Report deterministic-first

---

*Last updated: 2026-05-16. Maintain via `/iterate-prd`. Bei Konflikt zwischen v3.1 und v3.0 gewinnt v3.1.*
