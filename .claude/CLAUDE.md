# ValidationKit — Project Context for Claude Code

> **You are working ON ValidationKit itself, not building a product *with* ValidationKit.**
> This file gets loaded into every Claude Code session in this repo. Read it first.

## What is this project?

**ValidationKit** (Working Title — Re-Brand-Fenster M9–M12, Empfehlung: **Sondr**) ist ein Open-Source-MIT-Framework + Hosted-Web-App mit **zwei komplementären Wedges**:

1. **Pre-Build Validation Loop** für Solopreneurs/Indie-Hackers (`/validate`-Linie, ursprünglicher VK-Wedge)
2. **Post-Build Operations Loop** für AI-Consultancies/Boutique-Agencies (`/operations`-Linie, **ContextForge-Productized-Form**, codified in ADR-0018 ab 2026-05-16)

Cross-Vendor (Claude Code, Cursor, Codex, Gemini CLI, Windsurf, Cline, Aider) via AGENTS.md + SKILL.md + AI Gateway. Differenzierungs-These: **"Cross-Vendor Agent-File-Trust — from idea to multi-customer operations."**

**Mission:** Pre-Build-Validation für Solopreneurs so selbstverständlich machen wie Stripe für Payments + Post-Build-Operations für AI-Consultancies so selbstverständlich machen wie GitHub für Code. Indie-Hacker validieren ihre Idee in <30 Min mit echten Source-Citations; AI-Consultancies managen 5–30 Customer-Repos mit Cross-Vendor-Inventory, Drift-Detection und deterministischem Audit-Report — beides aus derselben OSS-Core und Hosted-Web-App.

**Owner:** Kolja Schöpe (kol.schoepe@gmail.com)

## Wo finde ich was?

| Datei / Folder | Zweck |
|---|---|
| **`docs/PRD.md`** | **Single Source of Truth (konsolidiert v5-Refactor, 2026-05-16).** Strategie, Constraints, Pricing, Tech-Stack, Risk-Register. Bei Konflikt gewinnt es. |
| **`docs/roadmap/ROADMAP.md`** | Phase-by-Phase Index + Live-Status. |
| **`docs/roadmap/phase-0.md`** | Week-by-Week (W1–W13) für aktuelle Phase. |
| **`STATUS.md`** (Root) | Tägliche Live-Tracking (Counters, Burnout-Flag, Engagement-Pipeline). Edit 30 sec abends. |
| **`TODO.md`** (Root) | Free-Form Ideen-Capture. Volatile. |
| `docs/decisions/0017-hybrid-pivot-e.md` | ADR — Pure-MM-Pivot abgelehnt, Hybrid Layered gewählt. |
| `docs/decisions/0018-contextforge-as-productized-form.md` | ADR — ContextForge als Productized-Form von VK (Pfad C). |
| `docs/decisions/` | ADR-Verzeichnis. Neue ADRs landen hier (Template `templates/ADR-template.md`). |
| `docs/research/v2/*.md` | 19 deep-research Outputs aus v2-Phase. |
| `docs/research/v3/*.md` | 13 surviving Outputs aus v3-Pivot-Stress-Test (09 + 12 fehlen, Rate-Limit). |
| `docs/research/v4/*.md` | 9 Outputs aus ContextForge-Pivot-Check (2026-05-16). Verdict-tragend: 00, 01, 06, 07. |
| `docs/research/v5/*.md` | 4 Outputs aus v5-Refactor (2026-05-16). Stack-Audit, Phase-0-Wochen, Templates, Migration. |
| `docs/archive/` | Vorgänger-PRDs (v0.1 PDF, v2, v3, v3.1, ContextForge PDF). Read-only Reference. |
| `templates/` | RFC / ADR / Feature-Spec / Test-Plan / Release-Notes / Sprint-Planning. + `feature-workflow.md` Decision-Tree. |
| `.claude/agents/*.md` | Subagents zum Bearbeiten *des Projekts*. |
| `.claude/commands/*.md` | Slash Commands für laufende Arbeit. |

## Aktuelle Phase

**Phase 0 Foundation — Hybrid Layered (Pivot E) + ContextForge-Productized-Form (ADR-0018).**

Stand 2026-05-16 ~spät: PRD v3.1 finalisiert nach 2. Pivot-Stress-Test mit 8 Recherche-Agenten zur ContextForge-Idee. User-vorgeschlagener Voller-Replacement-Pivot wurde abgelehnt (3 von 5 Achsen daten-inkompatibel). ContextForge wird stattdessen als **Productized-Form von ValidationKit** integriert (ADR-0018, Pfad C). Strategie: **PLG + Productized-Service parallel mit ZWEI Wedges** (Pre-Build-Validation + Post-Build-Agency-Operations), MM nur als Phase-3-Optional.

**Roadmap (high-level, dual-track):**
- **Phase 0 (M0–M3):** OSS v0.1 + 2 Engagements + 20 Mom-Tests (Indie) **+ 10 Agency-Discovery-Interviews + 5 Agency-LOIs als Gate** + 4 GitHub-App-Day-1-Mitigations (DPA, Trust-Center, Approver-Bridge, Read-Only-Default).
- **Phase 1 (M3–M9):** Mix 4–6 Validation-Sprint + 4–6 Agency-Operations-Sprint = 8–12 Engagements $45k–108k Cash + Studio-Tier-Build ($19/$79 Indie, $299/$799 Agency, kein $99-Sandwich).
- **Phase 2 (M9–M18):** Hosted-Web-App mit `/validate` (Indie) + `/operations` (Agency). Ziel kombiniert $30k MRR. AAIF-Silver-Membership ($5k/yr).
- **Phase 3 (M18–M24+):** *Optional* MM-Expand bei Trigger-Erfüllung. Cross-Vendor-Wedge bleibt load-bearing.

Nächste konkrete Schritte (aus PRD v3.1):
1. **20 strukturierte Mom-Test-Interviews** mit Indie-Hackers (DACH). Bis 2026-05-21 starten.
2. **10 Agency-Discovery-Interviews** mit AI-Consultancy-CEOs (DACH, Anthropic-Partner-Netzwerk). Bis M3 abgeschlossen, 5 LOIs als Gate.
3. **GitHub-Org `validationkit-ai` + npm-Namespace** reservieren.
4. **`/dogfood`** mit eigener Side-Projekt-Idee starten.
5. **Validation Handbook v0** (~10k Wörter) als Marketing-Asset.
6. **Build-in-Public-Cadence** (5 Posts/Woche, Skeptic-Mentor-Voice).
7. **Anwalts-Vorbereitung Sondr+Pondera** für M8.
8. **4 Day-1-GitHub-App-Mitigations** (9–12 PD): DPA-Template, Trust-Center-Page, Requester→Approver-Bridge, Read-Only-Default.
9. **12-Format-Parser-Spec** für `validationkit-cli` + `contextforge-cli` (5 MUST + 5 SHOULD + 2 MAY, siehe `docs/research/v4/04-agents-md-standard-reality.md`).
10. **AAIF-Silver-Membership-Budget** ($5k/yr) für Phase 1 vormerken.

**Operational Tracking:** Tägliche Updates in `STATUS.md` (30 sec). Wöchentlich Sprint-Planning + Friday-Retro (`templates/sprint-planning-template.md`). Phase-by-Phase Status-Index in `docs/roadmap/ROADMAP.md`.

**Hardcore-Local-Only-Mode (v5-Refactor 2026-05-16):** Bis Phase-0-Gate (5 LOIs in M3) keine SaaS-Accounts, keine npm-Publishes, kein Domain-Buy, kein Anwalts-Check. Stack lokal via Docker (Better-Auth + pgvector + Dragonfly + Inngest Dev + Mailpit). Details in `docs/research/v5/01-local-first-stack-audit.md`.

## Strategische Constraints (load-bearing — nicht ohne explizite Decision aufweichen)

1. **Multi-Provider von Tag 1.** Jeder Agent wird so gebaut, dass er auf Claude Code AND Cursor AND Codex CLI läuft. Single-Provider-Lock-in = Anthropic-Acquisition-Risk.
2. **Citation-First.** Jeder Insight braucht klickbare Quellen mit Datum. "Vibe-Score" ist Anti-Differenzierung.
3. **Legitimate Channels only.** Keine DM-Automation, keine ToS-Verstöße. Founder-Reputation bleibt sauber.
4. **Real-Channel-Execution > LLM-Output.** Wenn etwas executable ist (Email-Send, Vercel-Deploy, Ad-API), führen wir es aus statt nur zu beschreiben.
5. **Severity-Bänder statt Fake-Precision-Scores.** Keine "87/100" — sondern {Kill, Weak, Mid, Strong, Exceptional}.
6. **Open-Source-Trust.** MIT für Core. BSL-Re-License-Option für Phase 4+ dokumentiert, kein Pinky-Promise.
7. **Skeptic Mentor**, kein Brutal-Honest-Coach und kein Friendly-Co-Pilot. Concession-then-Critique. Linear-Voice + DHH-Klarheit.
8. **(NEU v3) Hybrid Layered (Pivot E).** PLG + Productized-Service parallel, MM nur als Phase-3-Optional. ADR-0017 ist load-bearing. Re-Open nur bei {Funding-Decision | Co-Founder-Hire | Anthropic+Cursor+MS schließen alle MM-Gaps | Langfuse launcht Validation-vor-Build}.
9. **(NEU v3) Solo-Constraint bleibt durch Phase 0–2.** Kein Sales-Hire vor M18, kein VC-Pre-Seed vor M18. Co-Founder-Sourcing optional ab M12.
10. **(NEU v3) Naming: ValidationKit als Sub-Brand behalten.** `<brand>/validate`. Trust-Karma nicht wegschmeißen. Sondr-Re-Brand M8 (Anwalts-Check) → M9 (Wahl) → M10-M12 (Migration).
11. **(NEU v3.1) Dual-Wedge.** ContextForge-Wedge (Cross-Vendor Agent-File-Compliance für Multi-Customer-Agencies) läuft parallel zu Validation-Wedge. Beide teilen OSS-Core, Hosted-Web-App, Brand. ADR-0018 ist load-bearing. Re-Open nur bei {Pfad-C-Phase-0-Gate gerissen (<5 Agency-LOIs in M3) | Anthropic-Claude-for-Agencies-SKU | grekt.com/MindStudio shippt Multi-Tenant-Agency-Tool | PRD v3.1 Roadmap >40% kollabiert | <50% Sprint-to-Hosted-App-Conversion nach M9}.
12. **(NEU v3.1) Cross-Vendor-Pflicht für Agent-Files.** Jeder Parser/Inventory-Output muss AGENTS.md, CLAUDE.md, GEMINI.md, SKILL.md, .claude/agents/, .claude/commands/, .cursor/rules/*.mdc, .cursorrules-legacy lesen können (5 MUST). Anthropic-Outlier (Issue #6235) ist explizite Wedge-Quelle, nicht Anti-Pattern.
13. **(NEU v3.1) Audit-Report (statt "AI Review") ist deterministic-first.** 5 von 6 Finding-Kategorien (Unused agents, Duplicate guidance, Context bloat, Stale references, Token-Budget) sind regelbasiert. Nur Conflicting-Rules nutzt LLM. Multi-Model-Compare NUR als adversarial-critique mit Confidence-Banding, niemals als Marketing-Headline.
14. **(NEU v3.1) GitHub-App-Day-1-Mitigations sind Pflicht, nicht Nice-to-Have.** DPA-Template + Trust-Center-Page + Requester→Approver-Bridge + Read-Only-Default. 9–12 PD in Phase 0 budgetiert. Ohne Mitigations: Risk-Probability Hoch / Impact Hoch.

## Brand Voice (für Docs / Marketing / Tweets / Cold-Email-Templates)

- **Tone:** älterer Founder, der nicht lügt, aber respektiert.
- **Pattern:** "Concession-then-Critique." Beispiel: "Du hast den Markt richtig identifiziert — aber hier sind 3 Daten, die gegen deine Annahme sprechen."
- **Specificity:** "3.2 % Cold-Email-Reply ist genau Median (Hunter.io 2026) — das ist kein Signal" statt "die Antwortrate ist nicht überzeugend."
- **Citations:** `[Source-Name, Datum](url)` inline.
- **Tagline-Kandidat:** "Find out if anyone actually wants your idea — before you build it."
- **Counter-Tagline:** "Most ideas fail this. That's the point."

## Tech-Stack-Entscheidungen (Phase 0 + 1)

| Layer | Wahl | Wo dokumentiert |
|---|---|---|
| Monorepo | Turborepo + pnpm | PRD §17 |
| Web | Next.js 16 + App Router + Cache Components | PRD §16 |
| Hosted Runtime | Vercel Workflow DevKit (DurableAgent) | PRD §16.2 |
| Auth | Clerk (Marketplace) | PRD §16.3 |
| DB | Neon Postgres + Drizzle + pgvector | PRD §16.4 |
| Cache | Vercel Runtime Cache | PRD §16.5 |
| Billing | Stripe direkt | PRD §16.6 |
| LLM Routing | Vercel AI Gateway | PRD §16.7 |
| Streaming | AI SDK + `useChat` | PRD §16.8 |
| Email | Resend (warm-cold), Postmark-Fallback dokumentiert | PRD §10.2 |

**Reibungsfreie Toolchain für die Web-App:** Wenn du `apps/web` bearbeitest, halte dich an die Vercel-Plugin-Skills (workflow, ai-sdk, next-cache-components, vercel-functions, etc.) und nutze sie aktiv — sie sind in dieser Session verfügbar.

## Naming-Status

- **Heute (Working Title):** ValidationKit
- **GitHub Org:** `validationkit-ai` (Java/Spring Q42-Repo blockiert plain `validationkit`)
- **npm:** `validationkit`, `create-validationkit`, `@validationkit/*` — frei zu reservieren
- **Re-Brand-Window:** M9–M12 (Pre-Phase-2)
- **Empfehlung Re-Brand:** **Sondr** (nautisch "Tiefe ausloten"), Alternative: **Pondera**
- **Tot:** ProofStack (direkter Konkurrent existiert), PMFKit (live), DemandLab (20-J-Marke), SignalKit (6-fach belegt), Validar (20-J-Marke)

## Konkurrenz-Map (Stand 2026-05-14, refresh quartalsweise)

**Direktester Threat:** WorthBuild ($5/Report, echte Reddit/HN-Leads), Preuve.ai (90 % Rejection-Rate, Citations), founderscore (10-Phase-Pipeline mit G2-Daten), PainOnSocial.

**Adjacent-but-not-yet-threat:** GoZigzag (Closed-Source SaaS, Scott Ford ex-Techstars), User Intuition ($20/Interview, kann down-market kommen), Anthropic Skills-Marketplace (4 200+ Skills).

**Update-Procedure:** Quartalsweise via `/compete-check`-Command.

## Wenn du etwas änderst...

- **Aktualisierst du das PRD:** lauf `/iterate-prd` — der Command checkt Konsistenz mit `docs/research/` und logged automatisch ein ADR in `docs/decisions/`.
- **Triffst du eine strategische Entscheidung:** lauf `/decision "<title>"` — schreibt eine ADR in `decisions/`.
- **Schreibst du Copy für Docs / Marketing / Web:** lass das Resultat durch den `brand-voice-keeper` agent laufen.
- **Spürst du eine neue Konkurrenz oder Plattform-Veränderung:** lauf `/compete-check`.
- **Vor jedem Launch-Schritt:** `/launch-check`.

## Was du NICHT machen sollst

- **Keinen Code schreiben, der ValidationKit-Subagents in Markdown-only-Form anlegt** ohne den Multi-Provider-Runner-Layer (`packages/runners/`). Single-File-Markdown ist Output, nicht Source. Source ist TypeScript in `packages/agents/`.
- **Keinen "vollautomatisierten Validate-and-Build-Pipeline"-Code** schreiben (Non-Goal §26).
- **Keine LinkedIn/Instagram-DM-Automation** in irgendeinem Subagent.
- **Keine Fake-Precision-Scores** (87/100) in Outputs einbauen — Severity-Bänder only.
- **Kein "AI-Yes-Man"-Defaultverhalten** — bei schwachen Ideen lehnen wir ab.
- **Kein PDF / kein README anlegen** ohne explizite User-Request (Standard-Anweisung im Repo).
- **(NEU v3) Kein MM-Direct-Entry ohne 3-Trigger-Erfüllung** (PRD §11.3). Phase 3 ist optional, nicht impliziter Phase-2-Schritt.
- **(NEU v3) Kein SharePoint-Native-Integration Tag 1.** 3–6 Mann-Monate-Anker. Falls Phase-3-MM-Customer SharePoint-Sync verlangt: Power Automate Custom Connector (2-Wochen-Adapter), nicht Native-Build.
- **(NEU v3) Kein 9-Adapter-Build** (3 Storage × 3 Tools). Solo nicht-historisch belegt.
- **(NEU v3) Kein Sales-Hire vor M18, kein VC-Pre-Seed vor M18.**
- **(NEU v3) Kein Pure-MM-Pivot-Re-Open** ohne ADR-0017-Re-Run mit veränderten Constraints.
- **(NEU v3.1) Kein "AI Review" als Headline-Feature.** Heißt jetzt "Audit Report". 5/6 Kategorien deterministisch. Wer LLM-FP-Rate >15% akzeptiert, killt das Vertrauen der Agency-Consultants in Woche 13.
- **(NEU v3.1) Kein LinkedIn-Cold-Outreach als Primary-GTM für Sub-$5k-ACV-Tiers.** Empirisch gebrochen (Track D1, 8/8 Comp-Founder gewachsen via Content/SEO/Build-in-Public/PLG). Cold-Outreach NUR für $799+ und Discovery-Interviews.
- **(NEU v3.1) Kein PAT-Fallback statt GitHub-App.** Architektur-toxisch (GDPR-Joint-Controller-Falle). Sunset-Plan ab M3, niemals canonical.
- **(NEU v3.1) Kein Voller-Replacement-Pivot ohne ADR-0018-Re-Run.** Pfad C (Hybrid) ist load-bearing. ContextForge IST die Productized-Form, nicht der Ersatz.
- **(NEU v3.1) Kein $99-Pricing-Layer.** Pricing-Sandwich zwischen Indie ($0–19) und Agency ($299–799). Direkt überspringen.
- **(NEU v3.1) Keine Multi-Model-Compare-Marketing-Claims** ohne Eval-Beleg auf 30-File-Golden-Set. Adversarial-Critique-Confidence-Banding ist die einzige defensible Form.

## Memory & Decisions

- Eigene Memory liegt unter `~/.claude/projects/-Users-koljaschope-Documents-rohan/memory/` (User-Profile, Project-State, Feedback-Style, Ambition, Pivot-Pattern).
- ADRs gehören nach `docs/decisions/` (in diesem Repo, versionskontrolliert via Templates).
- Diese CLAUDE.md ist das geteilte Kontext-File — wenn Konstanten sich ändern, hier updaten.
- Neue Features: Decision-Tree in `templates/feature-workflow.md` befolgen (Just-Code vs RFC vs ADR vs Feature-Spec).

## Kontakt & Workflows

- Owner-Mail: `kol.schoepe@gmail.com`
- Bei Multi-Day-Tasks: `TaskCreate` für Tracking.
- Bei Deep-Research: parallele Agent-Dispatches sind erwünscht (User-Feedback: "Rechenpower drauf hauen" ist OK).
- Bei strategischen Forks: `AskUserQuestion` mit max. 4 Optionen — nicht raten.

---

*Last updated: 2026-05-16 (v5-Refactor — Hardcore-Local-Only-Mode, docs/-Struktur, konsolidiertes `docs/PRD.md` als Single-Source, Templates-System für Feature-Workflow, STATUS.md Live-Tracking). Maintain inline.*
