# Plan — Bundle C · Production-Infra-Bootstrap

> Erstellt: 2026-06-08
> Status: 🔵 Skelett — /execute parallel zu D, F, G
> Master: `docs/plans/production-launch-readiness.md`
> Slug: `production-infra-bootstrap`
> Confidence: **High** — wave1-04 (870 LOC) + wave2-02/03/04 file:line-zitiert

## 1. Ziel

Production-Operational-Surface live: Inngest-Signing-Key-Enforcement, Sentry Error-Tracking, Domain registrieren + DKIM/SPF/DMARC live, Resend-Webhook + Suppression-Table, vercel.json Fluid-Compute-Profile, Env-Schema-Validator (zod) zur Build-Zeit, DB-Hot-Query-Indices, Lighthouse-CI-Thresholds nuanciert.

## 2. User-Entscheidungen

Master §2. Bundle-spezifisch:
- **Domain-Registrar**: Vorschlag Cloudflare (DNS-Control + Cost) — siehe §13
- **Error-Tracking-Vendor**: Sentry default
- **Domain-Name**: validationkit.app vs validationkit.de — siehe §13

## 3. Existing-Patterns

- `vercel.json` minimal (6 LOC)
- `apps/web/src/lib/env.ts` ohne zod-Validator
- `.lighthouserc.json` mit `"error"`-Thresholds + `numberOfRuns: 1`
- `apps/web/src/app/api/inngest/route.ts` ruft `serve()` ohne `signingKey`
- 14 Stripe-Price-Env-Vars + 4 DB + 3 Auth + 2 Resend + 2 LLM + 3 Inngest = 28 prod-relevant env-vars

## 4. Alternativen

- **Alt-A: Axiom statt Sentry** → Sentry hat besseren Source-Map-Support + Vercel-Integration
- **Alt-B: DKIM via Vercel-Email statt eigene Domain** → Vercel-Email existiert nicht; Resend mit eigener Domain
- **Alt-C: Migration in buildCommand belassen** → Race auf Vercel-Rollout, eigener Migration-Job besser
- **Alt-D: Domain bei GoDaddy/Strato** → DNS-UX viel schlechter als Cloudflare/INWX

## 5. Endzustand

- `apps/web/src/app/api/inngest/route.ts` mit `signingKey: env.INNGEST_SIGNING_KEY` + `runtime: "nodejs"` + 503-fallback wenn env missing
- `@sentry/nextjs` installed, `sentry.client.config.ts` + `sentry.server.config.ts` + `next.config.ts` Sentry-wrapped
- Domain registriert (siehe §13), DNS-Records gesetzt:
  - A/AAAA für apex
  - CNAME www → apex
  - MX für Resend (oder direkt Resend Inbound)
  - DKIM-TXT (Resend)
  - SPF-TXT
  - DMARC-TXT (p=none initial)
  - Stripe-Domain-Verify-TXT
- Vercel-Domain hinzugefügt, Cert ausgestellt
- Resend-Account live, Domain verified, Webhook-Endpoint `/api/resend/webhook` registriert
- `email_suppression` Tabelle Migration
- `vercel.json` Fluid-Compute-Profile:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "buildCommand": "pnpm turbo build",
    "installCommand": "pnpm install --frozen-lockfile",
    "regions": ["fra1"],
    "functions": {
      "apps/web/src/app/api/**/*.ts": { "memory": 1024, "maxDuration": 30 }
    }
  }
  ```
- DB-Migration ausgeschlossen aus buildCommand, eigener `pnpm db:migrate:prod` als Vercel-Cron-Once
- `apps/web/src/lib/env.ts` mit `import { z } ... export const env = envSchema.parse(process.env)` (`@t3-oss/env-nextjs`)
- `.lighthouserc.json` nuanciert:
  - A11y: error (95)
  - Perf: warn (Marketing 85, App 60)
  - BP: warn (90)
  - `numberOfRuns: 3`
- Migration mit 6 hot-query-indices (S30 Wave-2)
- Deps-Bump: tmp, hono moderate (S41)

## 6. Schritte

### Phase 1 — Env-Validator + Inngest-Key (~3h)
- [ ] `@t3-oss/env-nextjs` install
- [ ] `apps/web/src/lib/env.ts` mit zod-Schema (server + client)
- [ ] K17 inngest/route.ts mit signingKey + runtime + 503

### Phase 2 — Sentry (~4h)
- [ ] `npx @sentry/wizard@latest -i nextjs` (Wizard-driven)
- [ ] Sentry-Skill konsultieren via `Skill(vercel-agent)` falls Probleme
- [ ] Source-Maps-Upload via `sentry.properties` + `SENTRY_AUTH_TOKEN`
- [ ] Error-Boundary-Coverage verifizieren (`error.tsx` + `global-error.tsx`)
- [ ] Test-throw in dev → Sentry-Event sichtbar

### Phase 3 — Domain + DNS + Vercel-Add (~3h dev + 24h Wait)
- [ ] Domain registrieren (Cloudflare-Recommendation)
- [ ] Vercel: Project → Settings → Domains → Add
- [ ] DNS-Records setzen (7 records, siehe §5)
- [ ] Wait 24-48h for DKIM/SPF/DMARC propagation
- [ ] Verify mit mxtoolbox + mail-tester.com

### Phase 4 — Resend-Account + Webhook + Suppression (~3h)
- [ ] Resend.com Account, Domain verifizieren
- [ ] API-Key in Vercel-Env
- [ ] Webhook-Endpoint registrieren auf `https://<domain>/api/resend/webhook`
- [ ] Migration: `email_suppression` table mit (email, reason, created_at, bounce_type)
- [ ] `apps/web/src/app/api/resend/webhook/route.ts` mit Svix-Signature-Verify
- [ ] `sendTransactionalEmail` wrapper checked Suppression-Table BEFORE send

### Phase 5 — vercel.json + DB-Migrate-Out-of-Build (~2h)
- [ ] vercel.json mit regions + functions + frozen-lockfile
- [ ] `pnpm db:migrate:prod` script
- [ ] Vercel-Cron oder GitHub-Action für one-shot migrate-on-deploy

### Phase 6 — DB Hot-Indices + LHCI + Deps (~3h)
- [ ] Migration 0018 mit 6 hot-query indices (wave2-03 S30)
- [ ] `.lighthouserc.json` nuancierte Thresholds + numberOfRuns: 3
- [ ] `pnpm up tmp hono` (moderate CVEs)

### Phase 7 — Acceptance
- [ ] Build green + lighthouse-ci passing
- [ ] Sentry: trigger test-error → event in dashboard
- [ ] Resend: bounce-test → suppression-row created
- [ ] mail-tester.com Score ≥ 9/10
- [ ] `git mv` → done

## 7. Files-to-Change

**New:**
- `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- `apps/web/src/app/api/resend/webhook/route.ts`
- `docs/operations/dns-records.md`
- Migration 0018 (hot-query-indices) + 0019 (email_suppression)
- `scripts/db-migrate-prod.ts`

**Modified:**
- `apps/web/src/app/api/inngest/route.ts:1-4`
- `apps/web/src/lib/env.ts`
- `apps/web/next.config.ts` (Sentry-wrap)
- `vercel.json`
- `.lighthouserc.json`
- `packages/auth/src/emails/sender.ts` (suppression-check)
- `package.json` (deps-bump)

## 8. DB-Migration

Migration 0018 (hot-query-indices):
```sql
CREATE INDEX IF NOT EXISTS idx_scan_workspace_created ON scan (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finding_scan_severity ON finding (scan_id, severity);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_workspace ON credit_ledger (workspace_id);
CREATE INDEX IF NOT EXISTS idx_membership_user_workspace ON membership (user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_apply_action_repo_solution ON apply_action (repo_id, solution_id);
CREATE INDEX IF NOT EXISTS idx_webhook_event_workspace_received ON webhook_event (workspace_id, received_at DESC);
```

Migration 0019 (email_suppression):
```sql
CREATE TABLE email_suppression (
  email text PRIMARY KEY,
  reason text NOT NULL,
  bounce_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## 9. Test-Plan

- Integration: `email_suppression`-table CRUD
- Manual: Sentry test-throw, Resend test-bounce
- Manual: mxtoolbox / mail-tester.com pre-launch

## 10. Risiken

| Risiko | Mitigation |
|---|---|
| DKIM-Propagation > 48h | Beta-Launch verschieben |
| Sentry-Source-Maps schwierig auf Vercel | Sentry-Wizard + `@sentry/nextjs` v10+ Vercel-Integration |
| zod-Env-Validator bricht Build (fehlende env-vars) | Schrittweise einführen, optionals first |
| Migration-out-of-build → Schema-drift bei Rollback | Forward-only-Migrations konsequent halten |

## 11. Aufwand

**6-7 dev-days code + 24h DKIM-Propagation**.

## 12. Out-of-Scope

- Backup-Drill (V2)
- Cross-Region DR (V2)
- Custom-Vercel-Edge-Config (V2)
- Datadog/PostHog (Sentry-first)
- Cookie-Consent-Banner (DACH-B2B nicht Pflicht)

## 13. Open Items

- **Domain-Name**: validationkit.app oder .de oder .io? S37 Wave-2 sagte: aktuell Domain-Inkonsistenz im Repo (.app/.dev/-ai). Pick one + global-replace (= Bundle F).
- **Domain-Registrar**: Cloudflare (Recommendation) vs INWX (DE-näher) vs Vercel-Domains (bequemer)?
- **Sentry vs Axiom vs PostHog**: User-Entscheidung. Default-Vorschlag: Sentry.
- **Region**: `fra1` (Frankfurt) default für DACH. Confirm.
