# Projekt-Kontext

Eine Next.js-Web-App (Working-Title: ValidationKit) für AI-Consultancies, die
Multi-Customer-Repo-Operations managen wollen — Audit, Drift-Detection,
Skills-Registry, Customer-Workspaces, Billing.

Solo-Developer-Projekt, deployed auf Vercel.

## Aktive Phase (Mai 2026 →): Nova-3a · Repo-Polish + Production-Code-Prep

Phase Nova-3a läuft in `docs/plans/nova-3-repo-polish-and-prod-prep.md` (basiert auf 12-Subagent-Audit unter `docs/audits/2026-05/`). Foundation-Cleanup + Landing-Hero-Polish + Stripe-Test-Mode-Verify. Tests-Critical-Paths + Workspace-Hub-Polish sind nach Nova-3b verschoben (eigener /plan-Cycle).

**Recently Shipped (Mai–Juni 2026):**
- **Galaxie-Workspace-Solar** (✅ 2026-06-03) — Workspace-Audit-Galaxie komplett redesigned: Sonnensystem-pro-Repo + Asymm-Severity (nur Kill schreit) + Calm-by-Default + Datadog-Pivot + Mobile-List ≤639 px. Master + 3 Sub-Pläne in `docs/plans/done/galaxie-workspace-solar-redesign/`. Sub-A `03a53b9`, Sub-B `a1df899`, Sub-C `b8ebb04`. Landing-Hero V2 läuft mit gleicher SEVERITY_HEX-Palette mit (Cross-Impact-Re-Walk grün).
- **SaaS-Pricing V2 Polish — Email + Pack-Modal** (✅ 2026-05-21) — 3 React-Email-Templates, BuyCreditPackModal, Stripe-Webhook-Erweiterung (`f159d2a`)
- **SaaS-Pricing Sub-Plan-C — UI + Compliance** (✅ 2026-05-21) — /pricing rewritten, BYOK-Settings, Legal-Pages (`120e2ce`)
- **SaaS-Pricing Sub-Plan-B — Stripe Meters + Credits + Webhooks** (✅ 2026-05-21) — Test-Mode-Bootstrap-Script, Meter-Idempotenz (`931e025`)
- **SaaS-Pricing Sub-Plan-A — DB + Metering + Credits + BYOK** (✅ 2026-05-21) — `1f6487c`
- **SaaS-Pricing-Redesign Master** (✅ 2026-05-20) — 4-Tier-Ladder + Credit-System (`docs/plans/done/saas-pricing-redesign.md`)
- **Repo-Health + Workflow-Overhaul** (✅ 2026-05) — `docs/plans/done/repo-health-and-workflow-overhaul.md`
- **Phase Nova-2 — Full-Product (Shell)** (✅ 2026-05-20) — 3-Tier OKLCH-Tokens + ui-vk Components + Hero-Polish + Auth/Onboarding + Settings-Restructure + Mobile-Adaptation + Lighthouse-CI-Config (Lighthouse-CI selbst NICHT eingerichtet — Nova-3a Bundle E). Plan: `docs/plans/done/nova/nova-2-full-product.md`
- **Phase Galaxie G1–G6** (✅ 2026-05) — `docs/plans/done/galaxie/`

**3 Nova-2 Sub-Pläne in Review** (gezielter Folge-/execute pro Bereich, NICHT in Nova-3a-Scope):
- `docs/plans/nova-2-live-audit-flow.md` — anonymes Audit auf Landing
- `docs/plans/nova-2-settings-backend.md` — DB-Schemas + APIs für die 6 NEW Settings-Sections
- `docs/plans/nova-2-a11y-deep-sweep.md` — axe-core Playwright + Demo-Recording

Style-Guide: [docs/design/linear-aesthetic.md](../docs/design/linear-aesthetic.md).
Volle Vision: [docs/vision.md](../docs/vision.md).
Letzter Repo-Audit: [docs/audits/2026-05/_synthesis.md](../docs/audits/2026-05/_synthesis.md) — 18 Kill · 59 Strong · 60 Mid (Stand 2026-05-21).

## Tech-Stack

| Layer       | Wahl                                       |
|-------------|--------------------------------------------|
| Monorepo    | Turborepo + pnpm                           |
| Web         | Next.js 16 + App Router (Cache Components-Adoption ist Nova-3a-Goal — aktuell 0 `'use cache'`-Directives) |
| Galaxie     | SVG + motion (Landing/Hero); PixiJS v8 + @pixi/react + GSAP (Workspace-Solar-Galaxie: Sonnensystem-pro-Repo + Hover-Reveal + Datadog-Pivot + Mobile-List). R3F bewusst verworfen. |
| Auth        | Better-Auth 1.6 + Magic-Link (Resend); Workspaces über eigene `workspace`+`membership`-Tabellen (kein Org-Plugin) |
| DB          | Neon Postgres + Drizzle (pgvector im Vision-Stack, aber NOCH NICHT installiert — V2 nach Embeddings-Roadmap) |
| Cache       | Vercel Runtime Cache (Redis im docker-compose für Local-DEV, aber kein Client-Wiring im Code — Phase-0-Note bleibt) |
| Billing     | Stripe direkt + Stripe Tax                 |
| Background  | Inngest Cloud + Cron                       |
| LLM         | @ai-sdk/anthropic (primary), @ai-sdk/openai (opt-in Fallback via OPENAI_API_KEY) — siehe ADR-0005 |
| Email       | Resend (prod, via nodemailer-SMTP — kein Resend-Node-SDK), Mailpit (dev) |
| Deploy      | Vercel Fluid Compute                       |

## Wo finde ich was

| Pfad                          | Inhalt                                   |
|-------------------------------|------------------------------------------|
| `apps/web/src/app/`           | App-Router-Routen (UI + API)             |
| `apps/web/src/lib/`           | Server-Actions + Business-Logik          |
| `packages/db/`                | Drizzle-Schema + Migrationen             |
| `packages/audit/`             | Audit-Rules (5 deterministisch + 1 LLM)  |
| `packages/parser/`            | AGENTS.md / CLAUDE.md / SKILL.md Parser  |
| `packages/billing/`           | Stripe-Tier-Definitionen                 |
| `packages/inngest/`           | Background-Jobs + Cron                   |
| `eval/`                       | Golden-Set + Conflict-Eval (CI-Gate)     |
| `docs/vision.md`              | Master-Vision (warum, Persona, UI)       |
| `docs/architecture.md`        | "Wie liest man den Code?" — DAL, Cache, Parser, Audit, Render-Strategien |
| `docs/changelog.md`           | Phasen-Log: aktuelle + alle abgeschlossenen Phasen mit Plan-/ADR-Verweisen |
| `docs/roadmap/`               | Aktive Phase-Roadmap (z.B. `phase-nova-2.md`); abgeschlossene in `roadmap/done/` |
| `docs/adrs/NNNN-*.md`         | Architektur-Decision-Log                 |
| `docs/plans/`                 | Aktive Feature-Pläne                     |
| `docs/plans/done/`            | Archivierte Pläne, sortiert in Sub-Ordnern (`galaxie/`, `nova/`, `homepage-relaunch/`, `landing/`) + `phase-0-history.md` |
| `docs/audits/YYYY-MM/`        | Persistierte Health-Audit-Reports        |
| `docs/operations/`            | Deploy-Cheatsheet + Secrets-Inventar     |

## Workflow

1. Neues Feature / Bug / Refactor: User sagt was, Claude ruft `/plan <slug>`.
2. **Discovery-First-Phase** (NEU seit 2026-05-21): Claude stellt 2–4 Runden
   AskUserQuestion mit max. 4 Fragen je Runde. Pflichten:
   - Erste Option immer mit Suffix ` (Recommended)` plus begründeter Empfehlung.
   - Vierte Option ist automatisch "Other" (Freitext) — User kann immer frei
     antworten.
   - Klarheits-Schwelle: Discovery endet, wenn Claude jede Plan-Sektion ohne
     weitere Vermutung schreiben kann. Hard-Cap: 4 Runden.
   - Fragen-Taxonomie: Scope & Intent (R1), Risk-Surface DB/Auth/API/Secrets (R2),
     Execution-Shape Rollout/Test/Pattern (R3), Deep-Dive bei destructive/RBAC/
     Webhook (R4).
3. **Plan-File schreiben** mit 13-Sektionen-Skelett (Confidence + User-
   Entscheidungen-Audit-Trail + Existing-Patterns + Alternativen + Rollout +
   Out-of-Scope sind Pflicht).
4. User reviewt, sagt `/execute <slug>` → Claude führt mit Pre-Flight-Check,
   Block-Resolver (raten verboten — bei Plan-Drift AskUserQuestion), Sub-Step-
   Adjustment, Dev-Server-Auto-Start bei UI-Plänen, Acceptance-Check vor
   `git mv` nach `done/`.

**Anti-Pattern:** Open-Questions am Plan-Ende für load-bearing Entscheidungen
— die kommen in §2 vorne (Discovery). Plan mit Confidence Low NICHT schreiben
— stattdessen weitere Discovery-Runde.

Vollständige Command-Bodies siehe `.claude/commands/plan.md` + `.claude/commands/execute.md`.

## Constraints (load-bearing)

- Sprache: User schreibt + denkt auf Deutsch. Claude antwortet auf Deutsch,
  Code-Kommentare auf Englisch.
- Keine neuen Markdown-Files außerhalb `docs/plans/` ohne explizite Anfrage.
- Keine neuen Skills, Agents, Commands ohne explizite Anfrage.
- Keine Tier-/Schema-Änderungen ohne Plan-File mit DB-Migration-Sektion.
- AI-Calls: Anthropic primary, OpenAI als opt-in Fallback erlaubt (direkt via @ai-sdk/openai). Kein Vercel AI Gateway (Vendor-Lock-in-Vermeidung bleibt für Gateway, nicht für Direct-Provider). Siehe ADR-0005.
- Deploy nur auf User-Request. Nie selbst `vercel deploy` o.ä. anstoßen.
- Severity-Bänder {Kill, Weak, Mid, Strong, Exceptional} statt Fake-Scores —
  Konvention für alle Audit-Outputs.
- UI-Library-Split: **shadcn/ui** (`@/components/ui/*`) für Composer-Komponenten
  (Card, Button, Form, …); **ui-vk** (`@/components/ui-vk/*`) nur für Layout-
  Primitives spezifisch zum Repo (`PageShell`, `PageHeader`, `EmptyState`,
  `SettingsLayout`). Kein Duplikat-Pattern.
