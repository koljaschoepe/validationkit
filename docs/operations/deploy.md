# Operations — Deploy

> Solo-Dev-Deploy-Cheatsheet für ValidationKit auf Vercel. 1 Seite.

## Stack

- **Plattform:** Vercel Fluid Compute
- **Build:** `pnpm build` (turbo orchestriert)
- **Build-Command in Vercel:** `pnpm install && pnpm --filter @vk/db exec tsx src/migrate.ts && pnpm build`
- **Output:** Next.js Standalone aus `apps/web/.next`
- **Node:** 22 (gepinnt in root `package.json` engines)
- **pnpm:** 10.18.1 (`packageManager`-Feld)

## Prerequisites (User-Side, einmal)

1. **Vercel-Account + Team.** Free-Tier reicht für initial.
2. **Repo connecten:** `vercel link` aus dem Repo-Root, oder über Vercel-Dashboard "Import Git Repository".
3. **Domain claimen.** Custom-Domain in Vercel-Project-Settings → Domains.
4. **External Services provisionen:**
   - **Neon Postgres** — Prod-Branch, Connection-String als `DATABASE_URL` in Vercel-ENV.
   - **Resend** — API-Key + verifizierte Sender-Domain. Setze `RESEND_API_KEY` + `RESEND_FROM` in Vercel-ENV. SMTP_*-Variablen lokal lassen (werden in Prod nicht verwendet, wenn `RESEND_API_KEY` gesetzt).
   - **Stripe** — Prod-API-Keys. Setze `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Vercel-ENV. Webhook-URL in Stripe-Dashboard: `<domain>/api/stripe/webhook`.
   - **Inngest Cloud** — Project + `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` in Vercel-ENV. Production-URL als Inngest-Webhook-Target: `<domain>/api/inngest`.
   - **GitHub App** — `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY` in Vercel-ENV. Webhook-URL: `<domain>/api/install-webhook`.
   - **Anthropic / OpenAI (optional)** — `ANTHROPIC_API_KEY` für LLM-Audit-Rules (siehe [ADR-0005](../adrs/0005-llm-multi-provider.md)). Ohne Key: LLM-Findings silent no-op.

5. **Magic-Link-Secrets:**
   - `AUTH_SECRET` — generieren mit `openssl rand -base64 32`. **Nicht** den lokalen Wert kopieren.
   - `AUTH_BASE_URL` = `https://<domain>` (Prod-URL, kein localhost)
   - `NEXT_PUBLIC_APP_URL` = `https://<domain>`

Komplette ENV-Variablen-Liste: siehe `.env.example`. Detail-Map pro Variable: `docs/operations/secrets-rotation.md`.

## Deploy-Workflow

```bash
# Standard: jeder Push auf main → automatischer Production-Deploy via Vercel-GitHub-Integration.
git push origin main

# Preview-Deploy: jeder Branch → preview URL (vercel.app/...) via GitHub PR.
git push origin <feature-branch>

# Manueller Deploy (nur wenn explizit angefragt — NICHT von Claude automatisch):
vercel --prod                # Production
vercel                       # Preview
```

**Anti-Pattern:** `vercel --prod` aus Claude-Code-Session triggern. CLAUDE.md sagt: "Deploy nur auf User-Request."

## Rollback

```bash
# Vercel-Dashboard: Deployments → vorherigen Deploy markieren → "Promote to Production".
# CLI:
vercel rollback <deployment-id>
```

DB-Migration-Rollbacks gehen über Drizzle nicht automatisch. Forward-only Migrations.

## Post-Deploy-Verifikation

1. `<domain>/` lädt (Landing-Hero rendert)
2. `<domain>/login` → Magic-Link an eine Test-Mail funktioniert
3. `<domain>/[workspace]/` (nach Sign-Up) → Galaxie rendert mit echten Daten
4. `<domain>/api/audit-trail?format=json` → JSON-Export funktioniert (Auth-gated)
5. Stripe-Test-Webhook → `/api/stripe/webhook` (Stripe-CLI: `stripe trigger checkout.session.completed`)
6. GitHub-App-Install auf einem Test-Repo → `/api/install-webhook` empfängt + verarbeitet
7. **Lighthouse-Run** auf Prod-URL via `apps/web/scripts/lighthouse-audit.sh` — Goals: Perf ≥85, A11y ≥95, BP ≥95

## Smoke-Tests

```bash
# Lokal mit Prod-ähnlichem Setup (echter Build, kein dev-mode)
pnpm build
pnpm --filter @vk/web exec next start
pnpm --filter @vk/web lighthouse
```

Docker-E2E-Smoke: `pnpm e2e:smoke` (siehe `scripts/docker-e2e-smoke.sh`).

## Common Pitfalls

- **`vercel env pull` überschreibt `.env.local` komplett.** Custom-Vars vorher sichern.
- **Pixi-Komponenten unter `/[workspace]/galaxie`** lazy-loaden via `dynamic(ssr: false)`. Wenn fehlt → SSR-Crash mit `window is not defined`.
- **`@ai-sdk/openai` ist optional.** Falls nicht installiert + `OPENAI_API_KEY` gesetzt → `selectModel()` returnt OpenAI-Selection, `providerModel()` würde crashen. Workaround: nur Provider setzen, deren SDK installiert ist.

## Production-Monitoring

(noch nicht eingerichtet — Phase Future)

- Vercel Analytics für Frontend-Perf
- Inngest-Dashboard für Background-Job-Errors
- Stripe-Dashboard für Webhook-Failures
- Lighthouse-CI als wöchentlicher Cron-Job
