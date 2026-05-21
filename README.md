# ValidationKit

Multi-Tenant-Web-App für AI-Consultancies, die Context-Engineering-Files
(CLAUDE.md, AGENTS.md, .cursor/rules/, .windsurf/, .clinerules etc.) in
5–30 Customer-Repos auditieren, Drift erkennen, AI-Solutions generieren
und via Zero-Code-Workflow als PR oder Direct-Commit applizieren.

UI-Vision: **"Galaxie"** — Customer = Planet, Repo = Mond, File = Asteroid.
Severity als räumliche Hotspots, Click → Inspector → Apply. Siehe
[docs/vision.md](docs/vision.md) für die volle Vision,
[docs/roadmap/phase-galaxie.md](docs/roadmap/phase-galaxie.md) für die
aktuelle Sprint-Reihenfolge.

Solo-Projekt. Deployed auf Vercel.

## Stack

Next.js 16 · Turborepo · pnpm · Drizzle + Neon Postgres · Better-Auth ·
Stripe · Inngest · Vercel Fluid Compute · Anthropic SDK.

## Lokal starten

```bash
pnpm install
cp .env.example .env.local        # Werte ausfüllen (Docker-Defaults reichen)
pnpm stack:up                     # Postgres + Redis + Mailpit + Inngest via Docker
pnpm db:migrate
pnpm dev                          # http://localhost:3000
```

Dev-Services (laufen via `pnpm stack:up`):

- App: <http://localhost:3000>
- Mailpit UI (lokale Magic-Link-Mails): <http://localhost:8025>
- Inngest Dev-Server (Background-Jobs): <http://localhost:8288>
- Postgres: `localhost:5432`, Redis: `localhost:6379`

## Häufige Befehle

```bash
pnpm typecheck
pnpm test
pnpm eval                         # Deterministischer Golden-Set Smoke-Eval
pnpm eval:conflicts               # LLM-Conflict-Eval (no-op ohne ANTHROPIC_API_KEY)
pnpm build
pnpm lint
pnpm stack:logs                   # Container-Logs
pnpm stack:reset                  # Volumes weg + frischer Start
pnpm db:studio                    # Drizzle Studio
pnpm --filter @vk/web lighthouse  # Lighthouse-Audit lokal gegen :3000
```

## Workflow

Siehe `.claude/CLAUDE.md`. Kurzform:

1. `/plan <slug>` → schreibt `docs/plans/<slug>.md`.
2. Plan reviewen, ggf. nachbessern.
3. `/execute <slug>` → Schritte abarbeiten, Plan landet in `docs/plans/done/`.

## Doc-Architektur (3-Layer)

| Layer | Was | Pfad |
|---|---|---|
| Vision | Warum bauen wir das, Persona, Capabilities | `docs/vision.md` |
| Roadmap | Was wann (Sprint-Reihenfolge) | `docs/roadmap/phase-*.md` |
| Pläne | Wie konkret (einzelnes Feature) | `docs/plans/<slug>.md` |
| Entscheidungen | Architektur-Decision-Log | `docs/adrs/NNNN-*.md` |

## Repo-Struktur

```
apps/web/          Next.js-App (Routen + UI)
packages/          Drizzle-Schema, Audit-Rules, Parser, Billing, Inngest, …
eval/              Golden-Set + Conflict-Eval (CI-Gate)
scripts/           Dev-Helper (anonymize, docker-e2e-smoke, …)
docs/vision.md     Master-Vision (langfristig)
docs/roadmap/      Phase-Pläne (mittelfristig)
docs/adrs/         Architektur-Entscheidungen
docs/plans/        Aktive Pläne + done/
.claude/           CLAUDE.md + plan/execute Commands
```
