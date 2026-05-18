# ValidationKit

Interner Monorepo für die ValidationKit-Web-App: Audit, Drift-Detection,
Skills-Registry, Customer-Workspaces, Billing.

Solo-Projekt. Deployed auf Vercel.

## Stack

Next.js 16 · Turborepo · pnpm · Drizzle + Neon Postgres · Better-Auth ·
Stripe · Inngest · Vercel Fluid Compute · Anthropic SDK.

## Lokal starten

```bash
pnpm install
cp .env.example .env.local        # Werte ausfüllen (Docker-Defaults reichen)
pnpm stack:up                     # Postgres + Redis + Mailpit via Docker
pnpm db:migrate
pnpm dev                          # http://localhost:3000
```

## Häufige Befehle

```bash
pnpm typecheck
pnpm test
pnpm eval                         # Golden-Set + Conflict-Eval
pnpm build
pnpm stack:logs                   # Container-Logs
pnpm stack:reset                  # Volumes weg + frischer Start
pnpm db:studio                    # Drizzle Studio
```

## Workflow

Siehe `.claude/CLAUDE.md`. Kurzform:

1. `/plan <slug>` → schreibt `docs/plans/<slug>.md`.
2. Plan reviewen, ggf. nachbessern.
3. `/execute <slug>` → Schritte abarbeiten, Plan landet in `docs/plans/done/`.

## Repo-Struktur

```
apps/web/          Next.js-App (Routen + UI)
packages/          Drizzle-Schema, Audit-Rules, Parser, Billing, Inngest, …
eval/              Golden-Set + Conflict-Eval (CI-Gate)
scripts/           Dev-Helper (anonymize, docker-e2e-smoke, …)
docs/plans/        Aktive Pläne + done/
.claude/           CLAUDE.md + plan/execute Commands
```
