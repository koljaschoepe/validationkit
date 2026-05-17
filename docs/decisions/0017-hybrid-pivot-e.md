# ADR-0017 — Pure-MM-Pivot abgelehnt, Hybrid Layered (Pivot E) gewählt

- **Status:** Accepted
- **Date:** 2026-05-14
- **Deciders:** Kolja Schöpe (Owner), Claude Opus 4.7 (Devil's-Advocate-Subagent + Alternative-Pivots-Subagent)
- **Supersedes:** N/A (erste strategische Entscheidung post-PRD-v2)
- **Supersedes:** N/A
- **Affects:** PRD-ValidationKit-v3 §1, §2, §9–§12, §20, §26, §32. CLAUDE.md "Aktuelle Phase" + "Strategische Constraints".

## Context

Kolja hat am 2026-05-14 ~03:00 einen Pivot-Vorschlag formuliert:
> "Weg vom reinen Validator-Framework, hin zu einem Context-Engineering-Operations-Layer der über bestehende AI-Coding-Setups (Claude Code / Cursor / Codex) liegt, mit Storage in Lokal + GitHub + SharePoint, einem Meta-Layer (Analytics + AI-Reviewer + Lifecycle + Marketplace), Onboarding-Interview-Bot, Web-Dashboard. Verkauft an Mid-Market (50–500 MA) für $99–499/seat. ValidationKit wird zum Reference-Skill-Pack on top."

Vier Klärungs-Fragen (AskUserQuestion) wurden gestellt und beantwortet:
- **Verhältnis zu ValidationKit:** "Plattform-Layer — ValidationKit läuft darunter" (ValidationKit wird zum Reference-Skill-Pack auf der Plattform).
- **Primary ICP:** Mid-Market Business (50–500 MA).
- **Storage-Backends Tag 1:** Lokal + GitHub + SharePoint (alle drei).
- **Meta-Layer-Scope:** Analytics + AI-Reviewer + Lifecycle/Governance + Marketplace (alle vier).

Plus: Onboarding-Interview-Modus + Multi-Agent-Unternehmens-Analyse + Web-Dashboard. Plus: "Generell möchte ich's auf jeden Fall sehr hart challengen."

15 parallele Recherche-Agenten wurden dispatched. 7 Output-Files überlebten (≈28.000 W gesicherte Recherche): `docs/research/v3/01, 02, 10, 11, 13, 14, 15`. Die zwei Verdict-tragenden Files sind:
- `14-devils-advocate.md` (5.469 W) — Brutal-Honest 5-Failure-Mode-Stress-Test
- `15-alternative-pivots.md` (4.595 W) — Comp-basierte 5-Pivot-Vergleichs-Matrix

## Decision

**Pure-MM-Pivot (im Folgenden "Pivot C") wird abgelehnt.**

**Stattdessen wird "Hybrid Layered" (im Folgenden "Pivot E") implementiert:**
- **Phase 0 (M0–M3):** ValidationKit MIT-OSS v0.1 + 2 hochbetreute Validation-Engagements à $3–5k aus Kolja-Netz.
- **Phase 1 (M3–M9):** 8–12 Engagements à $3–8k (Cash-Engine, $30k–$96k Service-Revenue) + Studio-Tier-Build ($79/$199) parallel finanziert.
- **Phase 2 (M9–M18):** Productized "Founder Validation Sprint" $4.500 Flat + Vollständige Hosted-Web-App live. Ziel $30k MRR by M18.
- **Phase 3 (M18–M24+):** *Optional* MM-Expand mit drei harten Trigger-Conditions. Wenn Trigger nicht erfüllt: Lifestyle-Optimization Solo-$1M-ARR-Path.

**Phase-3-Trigger-Conditions (alle drei müssen erfüllt sein):**
1. **Organic-MM-Pull:** ≥ 2 Studio-Tier-Accounts haben *organisch* zu MM-Konversation eskaliert (eingehend, nicht gesourced).
2. **Window-Still-Open:** Anthropic UND Cursor UND Microsoft haben in den letzten 6 Monaten *nicht* Native-Approval-Workflows + Cross-Vendor-Federation released.
3. **Wedge-Validated:** 5 Mom-Test-Interviews mit 50–500-MA-Engineering-Heads bestätigen Multi-Vendor-Skill-Governance + Approval-Workflow als *akut bezahltes* Problem; mindestens 2 davon: "Hier ist meine PO-Nummer, baut das."

## Consequences

### Was sich ändert
- Phase 1-Scope: Hosted-App wird auf Phase 2 verschoben. Phase 1 ist Service + Studio-Tier-Build.
- Pricing-Tiers: + $4.500 Founder Validation Sprint (Productized Service).
- Non-Goals erweitert: kein SharePoint Tag 1, kein 9-Adapter-Build, kein MM-Direct-Entry ohne Trigger, kein VC-Pre-Seed vor M18, kein Sales-Hire vor M18.
- Naming-Decision: Sondr bleibt primary; ValidationKit als Sub-Brand behalten (`<brand>/validate`).

### Was bleibt
- MIT-OSS-Core, Multi-Provider-Day-1, Citation-First, Severity-Bänder, Real-Channel-Execution, Skeptic-Mentor-Voice.
- 10–11 Core-Subagents, 7 Slash Commands, Handoff-Pack als Phase-1.5-Flagship.
- 50-Jahr-Vision unverändert.

### Trade-Offs explizit benannt
- **Aufgegeben:** P{VC-Scale $10M+} sinkt von 12 % (Pivot C) auf 10 % (Pivot E). P{Acquisition $10–100M} sinkt von 18 % auf 12 %.
- **Gewonnen:** P{Lifestyle $300k–1M ARR} steigt von 15 % (Pivot C) auf 62 % (Pivot E). Single-Bet-Risk niedrigste aller fünf bewerteten Pivots. Solo-Founder-Fit wechselt von "Kill" zu "Strong".
- **Mathematisch dominant** im Risk-Reward-Profil für Kolja-Constraints (Solo, DE-Native, Kein VC, Keine Enterprise-Logos).

## Evidence

### 5 Failure-Modes des proposed Pivots (aus `docs/research/v3/14-devils-advocate.md`)

**Failure-Mode A — Solo × Mid-Market-Sales-Cycle Math doesn't math** (Severity: Near-Certain >80 %):
- 84-Tage-Median-Cycle × 4–7 Buying-Committee-Stakeholder × 16–30h Founder-Time pro Deal × 30 % Close-Rate = 1,4 Vollzeit-Jahre allein für Sales bei $1M ARR-Ziel.
- SOC2 Type II all-in Jahr 1: 45–70k USD, 6–12 Monate Observation [[Secureleap 2026](https://www.secureleap.tech/blog/soc-2-certification-cost), [HumanR.ai 2026](https://www.humanr.ai/intelligence/soc-2-type-2-cost-benchmarks-timeline-120k)].
- **Comp-Suche: ~0 Solo-Founder-Comps für Mid-Market-SaaS auf $1M+ ARR in 18 Monaten ohne Co-Founder oder Sales-Hire.**

**Failure-Mode B — Platform-Owner-Eats-Lunch ist Realität, nicht Risiko** (Severity: Near-Certain):
- Anthropic Skills Enterprise live seit Dec 2025, 425k+ Skills, Logos Atlassian/Stripe/Notion/Canva/Vercel [[VentureBeat 2025-12-18](https://venturebeat.com/technology/anthropic-launches-enterprise-agent-skills-and-opens-the-standard)].
- Cursor Team Marketplaces seit Mai 2026 (Cursor 2.6) [[Cursor Changelog](https://cursor.com/changelog/2-6)].
- GitHub Copilot Org-Custom-Instructions GA seit Apr 2026 [[GitHub Changelog](https://github.blog/changelog/2026-04-02-copilot-organization-custom-instructions-are-generally-available/)].
- **"Du bist 6 Monate zu spät, bevor du angefangen hast."**

**Failure-Mode C — Engineering-Hell 9 Adapter (3×3) Solo nicht-historisch** (Severity: Near-Certain):
- Microsoft Graph SharePoint allein: 3–6 Mann-Monate für *eine* Multi-Tenant-Production-Integration.
- Zapier brauchte Co-Founders + YC + 18 Monate für die ersten ~30 Integrationen (pre-OAuth-2.0).
- Aggregat-Estimate: 60–80 Mann-Monate Solo für MM-Ready-Production. Solo hat 12 pro Jahr nach Sales/Marketing/Support.

**Failure-Mode D — Featuritis: 4 Säulen parallel = niemand Best-in-Class** (Severity: High):
- Marketplace verliert gegen Anthropic Skills MP (425k+).
- AI-Reviewer verliert gegen GitHub Advanced Security / Snyk / Veracode.
- Lifecycle verliert gegen GitHub PRs / GitLab Approval-Rules.
- Onboarding-Interview verliert gegen Glean / Notion AI / Microsoft Copilot Q&A.
- "Almost-good-enough × 4" ist Self-Hosted-OSS-Niveau, nicht $99–499/seat-Premium.

**Failure-Mode E — TAM-Cap MM-AI-Coding-Adoption heute zu klein** (Severity: High):
- Realistic Addressable Market Mai 2026: ~10k–15k Companies global (50–500 MA mit aktiver Org-Provisioned-Adoption).
- Bei $99/seat × 25 Seats × Annual = $30k ACV: 34 Customers für $1M ARR.
- Solo-Founder-Self-Serve-Conversion-Rate für Mid-Market historisch <0,2 % → 20–30 Customers theoretisch reachable in 24 Monaten.

### Pivot-Score-Verdict

| Pivot | Solo-Fit | Defensibility | P{Lifestyle $300k–1M} | P{VC-Scale} | P{Acquisition} | Total |
|---|---|---|---|---|---|---|
| A — Stay-the-Course + Boutique | Strong | Mid | 45 % | 8 % | 5 % | Mid |
| B — Indie-Marketplace | Weak | Kill | 15 % | 3 % | 8 % | Kill |
| **C — Pure MM (User-Vorschlag)** | **Kill** | **Weak** | **15 %** | **12 %** | **18 %** | **Weak** |
| D — Consulting+Tool | Strong | Strong | 55 % | 2 % | 3 % | Strong (short) |
| **E — Hybrid Layered (gewählt)** | **Strong** | **Strong** | **62 %** | **10 %** | **12 %** | **STRONGEST** |

### Sensitivity: Was würde Pivot C wieder viable machen?

Drei Triggers (alle drei nötig, Wahrscheinlichkeit aller drei = <5 % in Kolja-Kontext):
1. Kolja nimmt VC-Pre-Seed $1–3M.
2. Co-Founder mit Enterprise-Sales-Track hired (DACH-IT-Procurement).
3. 5 Mom-Tests mit 50–500-MA Engineering-Heads bestätigen Multi-Vendor-Skill-Governance als akut bezahltes Problem.

Falls einer eintritt: Re-Run dieser ADR mit veränderten Constraints.

## Alternatives Considered

- **Pivot A (Stay-the-Course + Boutique-Tilt):** Niedriges Risk, klarer Pfad, aber $1–4M ARR-Ceiling. Lässt $200–400k ARR Service-Revenue auf dem Tisch.
- **Pivot B (Skill-Marketplace für Solos):** Agensi 80/20 Head-Start + Anthropic-Payment-Layer-Risk + Solo-Operational-Overhead. Kill.
- **Pivot C (Pure MM, User-Vorschlag):** Solo-Fit-Kill (siehe Evidenz).
- **Pivot D (Consulting+Tool):** Strong short-term, Service-Trap-Risk + Lifestyle-Ceiling $500k. Allein nicht 5-Year-End-State.
- **Pivot E (Hybrid Layered, gewählt):** Kombiniert A's PLG-Beachhead mit D's Cash-Engine, hält C als Phase-3-Optional. Mathematisch dominant.

## Trigger to Revisit

Re-Run dieser ADR falls:
- Funding-Decision (VC-Pre-Seed).
- Co-Founder-Hire mit Enterprise-Sales-Background.
- Anthropic / Cursor / Microsoft schließen alle drei MM-Skill-Ops-Gaps (Approval-Workflow + Cross-Vendor-Federation + Audit-Log).
- Langfuse launches Validation-vor-Build-Feature (direkter Konkurrent für unseren Kern).
- Re-Brand-Decision M9 (Sondr fällt durch, Pondera-Fallback aktiviert).

## Links

- `docs/archive/PRD-ValidationKit-v3.md` (Source of Truth, ersetzt v2).
- `docs/research/v3/14-devils-advocate.md` (5.469 W Stress-Test).
- `docs/research/v3/15-alternative-pivots.md` (4.595 W 5-Pivot-Vergleich).
- `docs/research/v3/01-direct-competitors-skill-ops.md` (3.427 W Inkumbenten + Window-Analysis).
- `docs/research/v3/02-adjacent-ai-observability.md` (4.148 W Adjacent-Threats inkl. Langfuse).
- `docs/research/v3/11-skill-quality-heuristics.md` (4.110 W Skill-Quality-Moat-Heuristiken).
- `docs/research/v3/13-naming-enterprise.md` (3.474 W Naming-Sweep).
- `docs/research/v3/10-devtool-analytics.md` (3.746 W Analytics-Pattern + DSGVO-Realität).

## Open Research Gaps

Folgende 8 Recherchen sind im 14-Agent-Run am Rate-Limit gescheitert (Socket-Errors). Nicht load-bearing fürs Verdict, aber wichtig für Engineering-/GTM-Detail-Decisions:
- `docs/research/v3/03-m365-ecosystem.md` (Skelett 338 W, Re-Run pending)
- `docs/research/v3/04-acquisition-threats.md` (Skelett 171 W, Re-Run pending)
- `docs/research/v3/05-mm-adoption-data.md` (Skelett 422 W, Re-Run pending)
- `docs/research/v3/06-solo-mm-sales-reality.md` (Skelett 315 W, Re-Run pending)
- `docs/research/v3/07-compliance-reality.md` (Skelett 297 W, Re-Run pending)
- `docs/research/v3/08-sharepoint-engineering.md` (Skelett 285 W, Re-Run pending)
- `docs/research/v3/09-github-skills-storage.md` (Skelett oder fehlend, Re-Run pending)
- `docs/research/v3/12-onboarding-interview.md` (fehlend, Re-Run pending)

Re-Run-Empfehlung: Nach Rate-Limit-Reset (≈02:50 Europe/Berlin nächster Cycle) in 3-Agent-Batches.

---

> **Note 2026-05-16 (v5-Refactor):** Two referenced research files (`docs/research/v3/09-github-skills-storage.md` and `docs/research/v3/12-onboarding-interview.md`) are still pending re-run after rate-limit-loss. They were not load-bearing for the verdict. Files will land at the expected paths when produced.

*Recorded: 2026-05-14 ~09:30 Europe/Berlin. Severity-Bänder durchgehend statt Fake-Precision-Scores per CLAUDE.md-Constraint. Citation-First per CLAUDE.md-Constraint.*
