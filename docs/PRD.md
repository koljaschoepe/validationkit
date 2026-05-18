# PRD — ValidationKit (Working Title) / Sondr

> **Status:** Source of Truth. Konsolidiert v3.1 (2026-05-16) + ADR-0017 + ADR-0018 + 8 v4-Research-Files + 4 v5-Operational-Files.
> **Single PRD policy:** Diese Datei ist die einzige PRD-Wahrheit. v3.1 ist nach Konsolidierung archiviert. Pflege: `/iterate-prd` oder durch Edit hier — keine `-vX.Y.md`-Duplikate mehr.
> **Datum:** 2026-05-16 | **Owner:** Kolja Schöpe (kol.schoepe@gmail.com)
> **Mode:** Hardcore-Local-Only bis Phase-0-Gate. Naming-Decision auf M8+. Keine Käufe ohne Cash-Validation.

---

## 0. Was ist dieses Projekt?

**ValidationKit / Sondr** (Working-Title — Re-Brand-Window M9–M12) ist ein Open-Source-MIT-Framework + Hosted-Web-App mit **zwei komplementären Wedges**, die dieselbe OSS-Core und dieselbe Hosted-App teilen:

1. **`/validate`-Linie:** Pre-Build-Validation-Loop für Solopreneurs/Indie-Hackers — Persona "Indie-Founder Marie". Idee in <30 Min validieren mit Source-Citations + Real-Channel-Experiments + Handoff-Pack.
2. **`/operations`-Linie (ex-ContextForge):** Post-Build-Operations-Loop für AI-Consultancies/Boutique-Agencies (8–25 MA) — Persona "Agency-Lena". 5–30 Customer-Repos mit Cross-Vendor-Inventory, Drift-Detection, Audit-Report, Template-Distribution-via-PR managen.

**Differenzierungs-These:** "Cross-Vendor Agent-File-Trust — from idea to multi-customer operations."

**Mission:** Pre-Build-Validation für Solopreneurs so selbstverständlich machen wie Stripe für Payments + Post-Build-Operations für AI-Consultancies so selbstverständlich machen wie GitHub für Code.

**50-Jahr-Vision:** Mehrheit aller Indie-Hackers, Solopreneurs und AI-Consultancies validiert + managt Agent-Kontexte mit ValidationKit/Sondr.

---

## 1. Executive Summary

ValidationKit / Sondr bietet zwei Wedges in einer Plattform:

- **Pre-Build:** Indie-Hacker validieren Ideen via OSS-CLI + Hosted-App (Tier $0 OSS / $19 Solo / $79 Pro) + "Founder Validation Sprint" $4.500 Productized-Service.
- **Post-Build:** AI-Agenturen managen Customer-Agent-Files (CLAUDE.md, AGENTS.md, .claude/*, .cursor/*, .windsurf/*) via Hosted-App (Tier $299 Agency-Pro / $799 Agency-Scale) + "Agency Operations Sprint" $4.500.

**Hybrid Layered Strategie (Pivot E, ADR-0017 + ADR-0018):**

- **Phase 0 (M0–M3):** OSS v0.1 lokal lauffähig + 2 Validation-Engagements + 20 Indie-Mom-Tests + 10 Agency-Discovery-Interviews + **5 Agency-LOIs als Phase-0-Gate** + 4 GitHub-App-Day-1-Mitigations. **Hardcore-Local-Only.**
- **Phase 1 (M3–M9):** Dual-Sprint-Mix: 4–6 Validation + 4–6 Operations-Sprints = 8–12 Engagements à $4.500 (≈ $45k–$108k Service-Revenue). Studio-Tier-Build ($25 / $79 / $299 / $799 + Agency-Scale-Plus $1499 annual-only — **kein $99-Sandwich**, 20% annual default per [ADR-0020](decisions/0020-phase-1-scope.md)). **Anthropic Claude Partner Network** ($0 entry, M3+) — *not* AAIF (corrected per ADR-0020: AAIF is Linux Foundation, $10k/yr, no Hebel for us).
- **Phase 2 (M9–M18):** Hosted-Web-App mit `/validate` + `/operations` live. Ziel kombiniert $30k MRR.
- **Phase 3 (M18+):** *Optional* MM-Expand bei Trigger-Erfüllung.

**Year-3-ARR-Ziel:** $500k–$1M USD kombiniert (Track D1-korrigiert von $2–3M EUR im ContextForge-PRD-v0.1).

**Warum nicht der ursprüngliche ContextForge-Voller-Replacement-Pivot?** Drei Befunde aus v4-Recherche:
1. **GTM-Motion KILL (Track D1):** Null Solo-Founder im 8er-Comp-Set ist via LinkedIn-Cold-Outreach gewachsen.
2. **Pain Mild, nicht Burning (Track C1):** Drift-Mgmt Top-8 bis Top-10, Workaround-Economy gratis (444 Stars OSS).
3. **AI-Review-Headline RISK-INDUCING (Track D2):** SOTA catched 24–48 % Real-Bugs. 5/6 Finding-Kategorien sind deterministisch.

Engineering-Substanz trägt (Wedge existiert 6–9 Mo clear-air), aber die Form muss anders sein: Productized-Service-First + Service-driven-OSS-Iteration + Hosted-App als Phase-2.

---

## 2. Strategic Constraints (load-bearing)

Die folgenden 14 Constraints dürfen nicht ohne explizite ADR aufgeweicht werden. Sie überleben Pivots und sind in `.claude/CLAUDE.md` mirror'd.

1. **Multi-Provider Tag 1.** Jeder Agent läuft auf Claude Code + Cursor + Codex CLI + Gemini CLI + Windsurf + Cline + Aider. Single-Provider-Lock-in = Anthropic-Acquisition-Risk.
2. **Citation-First.** Jeder Insight braucht klickbare Quellen mit Datum. "Vibe-Score" ist Anti-Differenzierung.
3. **Legitimate Channels only.** Keine DM-Automation, keine ToS-Verstöße.
4. **Real-Channel-Execution > LLM-Output.** Wenn etwas executable ist (Email-Send, Ad-API), führen wir es aus.
5. **Severity-Bänder statt Fake-Precision-Scores.** {Kill, Weak, Mid, Strong, Exceptional} — keine "87/100".
6. **Open-Source-Trust.** MIT für Core. BSL-Re-License-Option für Phase 4+ dokumentiert.
7. **Skeptic Mentor**, kein Brutal-Honest-Coach und kein Friendly-Co-Pilot. Concession-then-Critique.
8. **Hybrid Layered (Pivot E).** PLG + Productized-Service parallel, MM nur als Phase-3-Optional. ADR-0017 ist load-bearing.
9. **Solo-Constraint bleibt durch Phase 0–2.** Kein Sales-Hire vor M18, kein VC-Pre-Seed vor M18. Co-Founder-Sourcing optional ab M12.
10. **Naming: ValidationKit als Sub-Brand behalten** (`<brand>/validate`). Sondr-Re-Brand M8 (Anwalts-Check) → M9 (Wahl) → M10–M12 (Migration). **Naming-Decision in Phase 0 NICHT final.**
11. **Dual-Wedge (ADR-0018, Pfad C).** ContextForge-Wedge (Cross-Vendor Agent-File-Compliance) läuft parallel zu Validation-Wedge. Beide teilen OSS-Core, Hosted-App, Brand.
12. **Cross-Vendor-Pflicht für Agent-Files.** Phase-1-Parser liest 12 Formate (5 MUST + 5 SHOULD + 2 MAY).
13. **Audit-Report (statt "AI Review") ist deterministic-first.** 5 von 6 Finding-Kategorien (Unused agents, Duplicate guidance, Context bloat, Stale references, Token-Budget) sind regelbasiert. Nur Conflicting-Rules nutzt LLM mit Confidence-Banding. FPR ≤ 15 % Pflicht.
14. **GitHub-App-Day-1-Mitigations sind Pflicht.** DPA-Template + Trust-Center-Page + Requester→Approver-Bridge + Read-Only-Default. **14–17 PD production-acceptable / 5.5 PD Sprint-1.0-minimal-slice** (cost revised per [ADR-0020](decisions/0020-phase-1-scope.md) — PRD §6.4 original 9–12 PD estimate was the in-app-only path and excluded GitHub-webhook reconciliation).

**Re-Open-Trigger ADR-0017 (MM-Pivot-Re-Open):** {Funding-Decision | Co-Founder-Hire | Anthropic+Cursor+MS schließen alle MM-Gaps | Langfuse launcht Validation-vor-Build}.

**Re-Open-Trigger ADR-0018 (Dual-Wedge-Re-Open):** {Pfad-C-Phase-0-Gate <5 Agency-LOIs in M3 gerissen | Anthropic-"Claude-for-Agencies"-SKU | grekt.com/MindStudio shippt Multi-Tenant-Agency-Tool | PRD-Roadmap >40 % kollabiert | <50 % Sprint-to-Hosted-App-Conversion nach M9}.

---

## 3. Target Users

### 3.1 Primary ICP

- **P0 — Solopreneur / Indie-Hacker.** Self-serve `/validate`, $19/mo. Build-in-Public-Cadence. Hauptpfad zu PLG.
- **P0 — Boutique-Agency / Studio (3–30 MA).** Resell Validation als Service. Studio-Tier $299/$799 (NICHT $79/$199 — Track C1 zeigte Pricing-Sandwich).
- **P0 — Productized-Service-Customer (Validation).** "Founder Validation Sprint" $4.500. Cash-Engine + Reference-Implementation.
- **P0 — AI-Consultancy / AI-Solution-Agency (8–25 MA), Multi-Customer-Repo-Manager.** Persona "Agency-Lena". Self-serve `/operations`-Tier $299/$799. **Bottom-up SAM heute 600–1.500 buyer-qualified weltweit, DACH 120–175** (Track A1).
- **P0 — Productized-Service-Customer (Operations).** "Agency Operations Sprint" $4.500. Cash-Engine #2 + Reference-Implementation für Operations-Wedge.
- **P0.5 — Compliance-Frame-Agency** (Pharma, Finance, Marketing-with-PII). Strong-Pain-Segment laut Track C1.

### 3.2 Phase-3-Optional-ICP (Trigger-bedingt)

- **P3 — Mid-Market Engineering-Org (50–500 MA).** Multi-Vendor-Skill-Federation. Nur bei §11.3-Trigger-Erfüllung.

### 3.3 Explicit NICHT-ICP

- **Konzern-Internal-IT-Stack (Phase 1 + 2).** Kein Konzern-Sales-Cycle vor M18.
- **Vibe-Score-Seeker.** Wer einen 87/100-Score will, ist falsch hier.
- **DM-Spam-Founder.** Wer LinkedIn-Mass-DMs nutzen will, ist falsch hier.

---

## 4. Pricing

| Tier | Zielgruppe | Preis | Limits |
|---|---|---|---|
| **Free OSS** | Self-Host, Solo | $0 | Lokale CLI, kein Hosted, kein Agency-Multi-Repo |
| **Solo Indie** | Indie-Hacker, 1 Projekt | **$19/mo** | `/validate`, 1 User, 50 AI-Runs/Mo |
| **Solo Pro** | Power-Indie, 3 Projekte | **$79/mo** | `/validate` + Audit-Report, 3 Projekte, 250 Runs |
| **Agency Pro** | Boutique-Agency 5–10 Klienten | **$299/mo** | `/operations` + `/validate`, 10 Customer-Repos, 5 User, 1.000 Audit-Runs |
| **Agency Scale** | Agency 10–30 Klienten | **$799/mo** | Unlimited Customer-Repos, 15 User, 5.000 Audit-Runs, SOC-2-Pfad, EU-Hosting-Option |
| **Validation Sprint** | Funded Solos, Pre-Seed-Teams | **$4.500/Engagement** | 2-Wochen-Sprint, 80 % Standard / 20 % Custom |
| **Operations Sprint** | AI-Consultancies, Onboarding-Bedarf | **$4.500/Engagement** | 2-Wochen-Sprint, Audit-Setup + Template-Library + PR-Workflow |
| **Enterprise** | Konzern (Phase 3 only) | Custom | SSO, Self-Host, DPA, SLA, Trigger-only |

**Constraint:** Kein $99-Tier (Pricing-Sandwich). Solo→Agency direkt $79→$299.

---

## 5. Tech-Stack (Hardcore-Local-First)

### 5.1 Phase 0 Local Stack

Alle Komponenten OSS oder self-hostbar via Docker. Ein `docker-compose up`. ~1.5 GB RAM. Keine SaaS-Accounts, kein Cash-Out. (Track A v5-Audit, siehe `docs/research/v5/01-local-first-stack-audit.md`.)

| Layer | Phase 0 (lokal) | Phase 1 (Free-Tier) | Phase 2 (Paid) |
|---|---|---|---|
| Monorepo | Turborepo + pnpm | (gleich) | (gleich) |
| Web | Next.js 16 + App Router | (gleich) | (gleich) |
| Auth | **Better-Auth** (lokal, GitHub-OAuth + Email-Magic) | Better-Auth Hosted-DB | Better-Auth |
| DB | **`pgvector/pgvector:pg17` Docker** | Neon Free | Neon Pro |
| Cache | **Dragonfly Docker** | Upstash Free | Upstash Pro |
| Workflow | **Inngest Dev Server Docker** (Signing-Key env seit Feb 2026) | Inngest Cloud Free | Inngest Cloud |
| LLM | **AI SDK → Anthropic direkt** + Postgres-Cache | (gleich) | + LiteLLM Proxy |
| Billing | **Nichts** (keine Kunden in Phase 0) | Stripe Payment Links | Stripe direkt |
| Email | **Mailpit Docker** (Local-SMTP-Catch) | Resend Free | Resend / Postmark |
| Errors | Nichts | GlitchTip self-host | Sentry |
| Analytics | Nichts | Umami self-host | PostHog EU |
| Hosting | **`next dev`** lokal | Coolify-on-Hetzner ($5/mo) ODER Vercel Hobby | Vercel Pro |

### 5.2 Hard-Mistakes-zu-vermeiden (Vercel-Lock-in)

- `cacheLife` / `cacheTag` Cache-Components-Semantik divergiert vom Lokal-Verhalten
- `@vercel/blob` / `@vercel/kv` / `@vercel/postgres` (Lock-in-by-Default)
- Vercel Cron — replace mit Inngest oder native node-cron
- AI Gateway als Default-Provider
- Workflow SDK `DurableAgent`-API
- Speed Insights / Vercel Analytics

### 5.3 Wann darf was kosten?

**Phase-0-Gate (M3):** Bis dahin null Käufe. Keine SaaS-Signups, kein npm-Publish, kein Domain-Buy, kein Anwalt.

**Nach Phase-0-Gate-Pass:** Erst nach 1. Cash-Engagement ($3–5k) → Free-Tier-Accounts erstellen. Nach 5 Cash-Engagements → erste paid Services (Domain $15/yr, evtl. Vercel Hobby).

**M8 (nach Phase 1 Milestone):** Anwalts-Check Sondr+Pondera DE/EU/US Class 9+42 (~€5.000). Domain-Buy.

**M9:** Naming-Decision + Brand-Migration.

---

## 6. Funktionaler Scope

### 6.1 Phase 0 — OSS v0.1 (lokal-tagged)

**Validation-Linie (`/validate`):**
- 10–11 Core-Subagents als TypeScript-Source in `packages/agents/`
- 7 Slash Commands
- `validationkit-cli validate <repo>` — lokales CLI, kein npm-publish
- Mom-Test-Interviewer-Subagent

**Operations-Linie (`/operations`, früher ContextForge):**
- 12-Format-Parser (siehe §6.2)
- Multi-Customer-Repo-Inventory (read-only-default)
- Drift-Detection (deterministisch, Side-by-Side-Diff)
- **Audit Report** (deterministic-first, 5/6 Kategorien regelbasiert)
- Template-Library mit Versionierung
- PR-Workflow (read-write opt-in, niemals direkt-Push)

**Common Infrastructure:**
- Better-Auth Local-Setup
- pgvector Docker
- Inngest Dev Server
- Eval-Pipeline mit 30-File-Golden-Set

### 6.2 12-Format-Parser-Spec (Phase 1 Pflicht)

**5 MUST** (Phase 1 M0–M3 deliverable):
1. `CLAUDE.md` (Anthropic, root + subdirectories)
2. `AGENTS.md` (Linux Foundation AAIF, root + subdirectories)
3. `.claude/agents/*.md`
4. `.claude/commands/*.md`
5. `.claude/skills/*/SKILL.md`

**5 SHOULD** (Phase 1 M3–M6 deliverable):
6. `GEMINI.md` (Google)
7. `.cursor/rules/*.mdc` (Cursor, 4-Mode-Activation-Logik — schwierigster Parser)
8. `.cursorrules` (Cursor-Legacy)
9. `.windsurf/rules.md`
10. `.clinerules` (Cline)

**2 MAY** (Phase 2 opportunistic):
11. `.codex/`
12. `aider.conf.yml`

Parser-Pflicht: Markdown + Frontmatter, Token-Count, last-modified, author via git blame.

### 6.3 Audit-Report (Deterministic-First)

| Finding-Kategorie | Implementierung | LLM? |
|---|---|---|
| Unused agents (no command/workflow reference) | Static analysis | **Nein** |
| Duplicate guidance (Use X steht in 2+ Files) | String-similarity + AST-comparison | **Nein** |
| Context bloat (file > N tokens) | Token-counting | **Nein** |
| Stale references (referenced file not found) | Filesystem-walk | **Nein** |
| Token-Budget-Optimization | Heuristic-rules | **Nein** |
| Conflicting rules | LLM-comparison + Confidence-Banding | **Ja** |

**Eval-Pipeline-Plan:** 30-File-Golden-Set in Phase-0-W1–W2, *vor* Audit-Code. Promptfoo + Langfuse + ~280 Stunden über 12–16 Wochen. Continuous nightly-eval.

### 6.4 GitHub-App-Day-1-Mitigations (Phase 0 Pflicht — 14–17 PD revised per ADR-0020; original 9–12 PD was in-app-only path)

1. **DPA-Template** (2 PD): Lawyer-reviewed Day-1-template, Customer 1-Click-Co-Sign, DACH-GDPR-konform.
2. **Trust-Center-Pseudo-MVP** (1 PD): Static-Page mit Permissions-Begründung, Security-Posture, Compliance-Roadmap.
3. **Requester→Approver-Bridge** (3–5 PD): Webhook-Reconciliation. Lena (Agency-Member) requested Install, automatic Status-Track bis Customer-Admin approve.
4. **Read-Only-Default** (1 PD): GitHub-App-Scope explicit nur `contents:read` + `pull_requests:read`. Write nur opt-in pro Customer.

**Risk:** Ohne Mitigations Probability **Hoch / Impact Hoch** (KILL). Mit Mitigations **Mittel / Mittel-Hoch** (MID).

**PAT-Alternative ist Non-Goal.** Architektur-toxisch (GDPR-Joint-Controller-Falle).

### 6.5 Phase-0-Gate (M3)

**Pass-Criteria (alle binär):**
1. 20 Indie-Mom-Tests transkribiert (bilingual DE/EN explicit-prior-consent template — see [ADR-0020](decisions/0020-phase-1-scope.md) §Mom-Test, A9 §4. §201 StGB + GDPR Art. 6(1)(a) load-bearing.)
2. 10 Agency-Discovery-Interviews transkribiert (same consent stack)
3. **5 Agency-LOIs signed** (schriftliche Willenserklärung mit (a) Use-Case, (b) Pricing-Anchor, (c) Decision-Maker-Signatory)
4. OSS v0.1 lokal lauffähig (Audit-Report green gegen 25+/30 Golden-Set)
5. 12-Format-Parser MUST-5 done + Eval ≥ 80 %
6. 4 GitHub-App-Mitigations alle implementiert
7. 30-File-Golden-Set vollständig annotiert
8. Validation-Handbook v0 ≥ 8 Kapitel Draft
9. Operations-Playbook v0 ≥ 2 Kapitel Draft
10. 55–65 Build-in-Public-Posts (Toleranz)
11. Phase-0-Retro + Phase-1-Kickoff geschrieben

**Soft-Pass (8/11):** Phase 1 startet mit Plan-Revision.
**Hard-Fail (≤6/11 ODER #3 fail ODER #4 fail):** Phase 0 +4 Wochen.

**Gate-Fail-Branch <5 LOIs:** Phase 1 Validation-Sprint-only (4–6 Engagements à $4.500). Operations-Sprint auf Phase 2. ADR-0018 Re-Open in M6.

---

## 7. Roadmap-Index

Detaillierte Phasen-Pläne unter `docs/roadmap/`:

- **`docs/roadmap/ROADMAP.md`** — Phase-by-Phase Übersicht + Current-Status
- **`docs/roadmap/phase-0.md`** — Week-by-Week (W1–W13) für M0–M3
- **`docs/roadmap/phase-1.md`** — (geschrieben in W13 als Phase-0-Deliverable)

**Phase 0 (M0–M3, 13 Wochen):** OSS v0.1 lokal + 20 Mom-Tests + 10 Agency-Discoveries + 5 LOIs + 4 GitHub-App-Mitigations.
**Phase 1 (M3–M9):** Dual-Sprint-Mix ($45k–$108k), Studio-Tier-Build, **Anthropic Claude Partner Network** ($0 entry; ADR-0020 corrects PRD line "AAIF Silver $5k" → AAIF is Linux Foundation, $10k/yr, no Hebel — switched to CPN).
**Phase 2 (M9–M18):** Hosted-Web-App live, kombiniertes $30k MRR-Ziel.
**Phase 3 (M18+):** Optional, Trigger-bedingt.

---

## 8. Konkurrenz-Map (Stand Mai 2026)

| Konkurrent | Stand | Threat-Level |
|---|---|---|
| **grekt.com** (OSS CLI) | ~70 % der Operations-Engine schon da | **Hoch** (Pivot-Risk wenn sie Multi-Tenant-Dashboard bauen) |
| **MindStudio** | 6 Blog-Posts über das Pattern, kein Produkt | **Hoch** (Pivot-Risk wenn sie packen) |
| **GitHub Agent Control Plane** | GA 2026-02-26, intra-Tenant only | Mittel (jeder Customer fragt "warum nicht das?") |
| **Microsoft Agent 365** | GA 2026-05-01, $15/user/mo, Cross-Cloud AWS+GCP | Mittel (Enterprise-Single-Tenant heute, Bottom-Down-Move 2027) |
| **Anthropic Claude Console / Managed Agents** | Workspace-Cap 100, Skills syncen nicht across Surfaces | Niedrig-Mittel (12–18 Mo bis Multi-Tenant-native) |
| **OpenAI AgentKit / Connector Registry** | Single-Org-Fokus | Niedrig |
| **AgentOps / LangSmith / Langfuse / PromptLayer** | Runtime-Telemetry, nicht Authoring | Niedrig (komplementär) |
| **WorthBuild ($5/Report)** | Direkter Validation-Konkurrent für Indie | Mittel (Indie-Wedge) |
| **Preuve.ai** | 90 % Rejection-Rate, Citations | Mittel (Indie-Wedge) |
| **founderscore** | 10-Phase-Pipeline mit G2-Daten | Mittel (Indie-Wedge) |

**Wedge-Lebensdauer:** 6–9 Mo clear-air für Operations-Wedge, 24–36 Mo Cross-Vendor-Defense Base-Case.

**Update-Procedure:** Quartalsweise via `/compete-check`.

---

## 9. Open Decisions

1. **Brand-Architektur M9:** "ContextForge" als Sub-Brand behalten oder unter Sondr/Pondera vollständig konsumieren?
2. **`/operations` vs `/validate` Tab-Reihenfolge** im Hosted-App-Dashboard. Hypothesis-Test in Phase 1.
3. ~~AAIF-Silver-Membership-Timing~~ → resolved per [ADR-0020](decisions/0020-phase-1-scope.md): AAIF is the wrong vehicle (Linux Foundation, $10k/yr). Anthropic Claude Partner Network ($0 entry) at M3 after CCA cert. AAIF Silver re-evaluated only if restructured as Anthropic sub-tier.
4. **Operations-Sprint-Format:** 2 Wochen wie Validation-Sprint, oder 3 Wochen (mehr Discovery)?
5. **Cross-Customer-Aggregation-Opt-In:** Phase-2-Frage. Anonymisierte Cross-Customer-Insights anbieten?

---

## 10. Risk-Register (load-bearing)

| Risk | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| grekt.com / MindStudio shippt Multi-Tenant-Tool | Mittel | Hoch | Speed + Compliance-Frame + Validation-Cross-Sell |
| Anthropic launcht "Claude for Agencies" | Niedrig-Mittel | Hoch | Cross-Vendor von Tag 1 (auch Codex/Gemini/Cursor) |
| Customer-Daten-Leak via LLM-Audit-Calls | Mittel | Sehr Hoch | Zero-Retention-API, PII-Detection, Secrets-Scanning, Opt-In pro Review |
| TAM zu klein (<5 LOIs in M3) | Mittel | Hoch | Phase-0-Gate-Fail-Branch (Validation-only Phase 1) |
| AI-Audit-Quality schlecht (FPR > 15 %) | Hoch | Sehr Hoch | Deterministic-First für 5/6, Eval-Pipeline, 30-File-Golden-Set |
| GitHub-App-Approval-Hürde | Hoch | Mittel-Hoch | 4 Day-1-Mitigations Pflicht |
| Solo-Burnout in Phase 0 | Mittel | Hoch | 20–30 h/Wo Hard-Cap, Anti-Pattern-Liste in `docs/roadmap/phase-0.md` |
| Naming-Brand-Confusion | Niedrig | Mittel | M9-Single-Brand-Decision, ValidationKit als Sub-Brand bis dahin |

---

## 11. Decisions Log

| ADR | Datum | Title | Status | Datei |
|---|---|---|---|---|
| 0001–0016 | 2026-05-14 (v2) | v2-Vorgänger-Decisions | Accepted | (synopsiert in 0017) |
| **0017** | 2026-05-14 | Pure-MM-Pivot abgelehnt, Hybrid Layered (Pivot E) | Accepted | `docs/decisions/0017-hybrid-pivot-e.md` |
| **0018** | 2026-05-16 | ContextForge als Productized-Form von VK (Pfad C) | Accepted | `docs/decisions/0018-contextforge-as-productized-form.md` |

Neue ADRs gehören nach `docs/decisions/`. Template in `templates/ADR-template.md`.

---

## 12. Wie ich (Kolja) diese Datei pflege

- **Single-Source-Policy:** Diese `docs/PRD.md` ist die EINZIGE PRD-Datei. Kein `-v3.2.md` mehr. Updates via Git-Commit oder direkter Edit.
- **Bei größerem Pivot:** Erst ADR in `docs/decisions/` schreiben, dann PRD-Sektionen anpassen. Niemals umgekehrt.
- **Bei Feature-Add:** Spec in `features/active/FEAT-NNN.md` (Template `templates/feature-spec-template.md`). Falls Feature load-bearing strategy berührt → ADR.
- **Quartalsweise:** `/compete-check`-Run + Konkurrenz-Map update + Risiken-Re-Calibrate.

---

*Letztes Update: 2026-05-16 (v5-Refactor). Konsolidiert aus v3.1 + v4-Synthesis + v5-Operational-Research. Maintain inline.*
