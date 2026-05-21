# Projekt-Kontext

Eine Next.js-Web-App (Working-Title: ValidationKit) für AI-Consultancies, die
Multi-Customer-Repo-Operations managen wollen — Audit, Drift-Detection,
Skills-Registry, Customer-Workspaces, Billing.

Solo-Developer-Projekt, deployed auf Vercel.

## Aktive Phase (Mai 2026 →): Nova-2 · Full-Product ✅ shipped (Shell)

Phase Galaxie (G1–G6) + Phase Nova-2 (Master-Plan) sind abgeschlossen, leben in `docs/plans/done/`.

**Phase Nova-2** (✅ 2026-05-20) hat das Frontend Linear/Vercel-Niveau gehoben:
- **Foundation** — 3-Tier OKLCH-Tokens + ui-vk Komponenten-Library (PageShell, PageHeader, Card, EmptyState, StatTile, KeyboardHint, SettingsLayout)
- **Hero-Polish** — SVG-Galaxie (PixiJS deprecated für Landing), Cooperative-Pan/Pinch, Lucide-Severity-Icons, GalaxieSettingsPopover
- **App-Pages-Refactor** — Skip-Links, SiteNav active-state, Pricing/Billing/Login/Customers/Scans/Status/Trust auf neue Tokens
- **Auth + Onboarding (Shell)** — Better-Auth 1.6 expiresIn/hashed/cookieCache, React-Email MagicLinkEmail, /auth/verify, LoginForm-Polish (resend-throttle + granular errors), ActivationChecklist (Right-Rail, 5 Items)
- **Settings-Restructure (Shell)** — SettingsLayout 240px-Sidebar, /account/settings/* (5 Sections) + /[workspace]/settings/* (10 Sections in 4 Gruppen)
- **Mobile-Adaptation** — RepoTreeView (Accordion) unter 768px, Vaul Bottom-Sheet Inspector, 44px touch-targets
- **Quality** — optimizePackageImports (lucide + d3-*), font display:swap, GlobalMotionConfig reducedMotion="user", Lighthouse-CI 3 thresholds (Perf 85 / A11y 95 / BP 95)

**3 Sub-Pläne in Review** (gezielter Folge-/execute pro Bereich):
- `docs/plans/nova-2-live-audit-flow.md` — anonymes Audit auf Landing
- `docs/plans/nova-2-settings-backend.md` — DB-Schemas + APIs für die 6 NEW Settings-Sections
- `docs/plans/nova-2-a11y-deep-sweep.md` — axe-core Playwright + Demo-Recording

Style-Guide: [docs/design/linear-aesthetic.md](../docs/design/linear-aesthetic.md).
Volle Vision: [docs/vision.md](../docs/vision.md).

## Tech-Stack

| Layer       | Wahl                                       |
|-------------|--------------------------------------------|
| Monorepo    | Turborepo + pnpm                           |
| Web         | Next.js 16 + App Router + Cache Components |
| Galaxie     | SVG + motion (Landing/Hero); PixiJS v8 + @pixi/react (legacy /[workspace], Nova-3+ Migration offen). KEIN R3F. |
| Auth        | Better-Auth 1.6 + Magic-Link (Resend); Workspaces über eigene `workspace`+`membership`-Tabellen (kein Org-Plugin) |
| DB          | Neon Postgres + Drizzle + pgvector         |
| Cache       | Vercel Runtime Cache + Redis (dev)         |
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
