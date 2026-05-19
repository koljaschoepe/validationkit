# Projekt-Kontext

Eine Next.js-Web-App (Working-Title: ValidationKit) für AI-Consultancies, die
Multi-Customer-Repo-Operations managen wollen — Audit, Drift-Detection,
Skills-Registry, Customer-Workspaces, Billing.

Solo-Developer-Projekt, deployed auf Vercel.

## Aktive Vision (Mai 2026 →): Galaxie-Refactor

UI wird zu spielerischer **"Galaxie"-Navigation** umgebaut:
**Workspace → Customer (Planet) → Repo (Mond) → File (Asteroid)**, mit
Severity-Hotspots, Zero-Code-Apply via PR. Render-Stack: PixiJS v8 + GSAP.
Multi-Tenant via URL-Slug `/[workspace]/...`.

Master-Plan: [docs/plans/master-vision-galaxie.md](../docs/plans/master-vision-galaxie.md).
Volle Vision: [docs/vision.md](../docs/vision.md).
Sprint-Reihenfolge: [docs/roadmap/phase-galaxie.md](../docs/roadmap/phase-galaxie.md).

## Tech-Stack

| Layer       | Wahl                                       |
|-------------|--------------------------------------------|
| Monorepo    | Turborepo + pnpm                           |
| Web         | Next.js 16 + App Router + Cache Components |
| Auth        | Better-Auth 1.6 + Magic-Link (Resend)      |
| DB          | Neon Postgres + Drizzle + pgvector         |
| Cache       | Vercel Runtime Cache + Redis (dev)         |
| Billing     | Stripe direkt + Stripe Tax                 |
| Background  | Inngest Cloud + Cron                       |
| LLM         | @ai-sdk/anthropic (direct), OpenAI Fallback|
| Email       | Resend (prod), Mailpit (dev)               |
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
| `docs/roadmap/phase-*.md`     | Sprint-Reihenfolge pro Phase             |
| `docs/adrs/NNNN-*.md`         | Architektur-Decision-Log                 |
| `docs/plans/`                 | Aktive Feature-Pläne                     |
| `docs/plans/done/`            | Archivierte erledigte Pläne              |

## Workflow

1. Neues Feature / Bug / Refactor: User sagt was, Claude ruft `/plan <slug>`
   und schreibt einen detaillierten Plan nach `docs/plans/<slug>.md`.
2. User reviewt das Plan-File, bessert ggf. nach.
3. User sagt `/execute <slug>` → Claude führt Schritt-für-Schritt aus,
   hakt Boxen im Plan ab, verschiebt das File am Ende nach `done/`.

**Bei Unklarheiten in beiden Phasen: AskUserQuestion mit max. 4 Optionen.
Nicht raten.**

## Constraints (load-bearing)

- Sprache: User schreibt + denkt auf Deutsch. Claude antwortet auf Deutsch,
  Code-Kommentare auf Englisch.
- Keine neuen Markdown-Files außerhalb `docs/plans/` ohne explizite Anfrage.
- Keine neuen Skills, Agents, Commands ohne explizite Anfrage.
- Keine Tier-/Schema-Änderungen ohne Plan-File mit DB-Migration-Sektion.
- AI-Calls: nur Anthropic direkt, kein Vercel AI Gateway (Vendor-Lock-in-Vermeidung).
- Deploy nur auf User-Request. Nie selbst `vercel deploy` o.ä. anstoßen.
- Severity-Bänder {Kill, Weak, Mid, Strong, Exceptional} statt Fake-Scores —
  Konvention für alle Audit-Outputs.
