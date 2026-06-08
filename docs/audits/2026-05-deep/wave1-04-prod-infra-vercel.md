# Wave-1 Audit 04 — Production-Infra · Vercel-Deploy · Env-Audit

> Generated: 2026-05-22
> Scope: Production-readiness for "paying-DACH-B2B-customers in 2–4 Wochen"
> Domain: vercel.json · Build · ENV-Inventar · DB · Inngest · Email · Observability · Domain/DNS · CI/CD
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}
> Method: read-only, file:line citations, scored Red/Yellow/Green per area

---

## TL;DR — Production-Readiness-Matrix

| Area                    | Status | Headline                                                                                                |
|-------------------------|--------|---------------------------------------------------------------------------------------------------------|
| A. Vercel + build       | 🟡     | `vercel.json` minimal; build runs migration synchronously on every deploy (race + cold-start risk).     |
| B. ENV-Inventar         | 🔴     | `INNGEST_SIGNING_KEY` documented but never read; no `EMAIL_FROM` / `RESEND_FROM`; secrets in `.env.local` committed locally only.        |
| C. Database (Neon)      | 🟡     | `postgres-js` (NOT `neon-http`/`neon-serverless`) on Fluid-Compute — fine, but connection-pool math thin. |
| D. Inngest              | 🟡     | 5 functions registered, 4 crons. `serve()` lacks explicit `signingKey` + `runtime`. Inngest account not yet linked. |
| E. Email                | 🔴     | Domain DKIM/SPF/DMARC not yet set up; magic-link `From` falls back to `onboarding@resend.dev` in prod; no bounce-handler. |
| F. Observability        | 🔴     | Zero error-tracking vendor (no Sentry/Axiom). Only `console.error` → Vercel function logs.              |
| G. Domain + DNS         | 🔴     | Domain not registered. No DNS plan documented. Stripe-domain-verify TXT not in any checklist.            |
| H. CI/CD                | 🟡     | Single CI job (typecheck+test+eval+build). Lighthouse-CI **only on PR** and is `error`-level (will block merges). No production-deploy gate. |

**Blockers for "paying customer next month":** 6 of 8 areas have Strong-or-Kill findings. Realistic launch-readiness time: **8–14 working days** after this audit (not 2 weeks if started today, more like 3 weeks).

**Production-deploy-readiness score:** 🟡→🔴 — code path is solid, but the operational surface (Domain, DKIM, Sentry, Inngest-Cloud-link) hasn't been touched.

---

## Part A — Vercel Project + Deployment Config

### A.1 — `vercel.json` is too thin for Fluid-Compute production [Strong]

**File:** `vercel.json:1-6`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile=false",
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@vk/web && pnpm --filter @vk/db exec tsx src/migrate.ts"
}
```

**What's missing for prod:**
- **No `regions`** — defaults to `iad1` (us-east-1, Washington DC). For DACH-B2B + GDPR optics, `fra1` (Frankfurt) is the right home region for both functions AND Neon. Misaligned function-region + DB-region adds 80–120 ms cold-start latency.
- **No `functions` block** — no `maxDuration`, no `memory`, no per-route runtime. Default `maxDuration` on the Pro plan is now **300 s** (knowledge-update §2026-02), so this is less critical than older docs imply, but explicit configuration prevents surprises on `/api/events/stream` (which already declares `export const maxDuration = 300` — make this the source of truth).
- **No `crons` block in `vercel.json`** — correct, because cron lives in **Inngest Cloud**. But there's also no comment saying "cron is intentionally external" — anyone reading the file might assume Vercel-Cron should handle it.
- **No `headers` block** — no global `Strict-Transport-Security`, no `X-Content-Type-Options`, no `Permissions-Policy`. Next.js can do these via `next.config.ts` `headers()`, but neither place sets them.

**Suggested vercel.ts** (vercel.ts is the new recommended config, knowledge-update §2026-02-27):

```ts
// vercel.ts at repo root
import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'cd ../.. && pnpm turbo run build --filter=@vk/web',
  // Migrations run via a separate one-shot job (see B.3 / D.2). Don't inline.
  installCommand: 'cd ../.. && pnpm install --frozen-lockfile',
  regions: ['fra1'],
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Content-Type-Options',    value: 'nosniff' },
        { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy',        value: 'geolocation=(), microphone=(), camera=()' },
      ],
    },
  ],
};
```

### A.2 — `installCommand` uses `--frozen-lockfile=false` [Strong]

**File:** `vercel.json:4`

`pnpm install --frozen-lockfile=false` silently accepts lockfile drift between repo and what Vercel installs. This is the opposite of what you want in production. CI passes with a locked install (`.github/workflows/ci.yml:42` does it right with `--frozen-lockfile`). Same was flagged in `docs/audits/2026-05/09-configs.md:FN-07`.

**Fix:** drop `=false`. If you hit a lockfile mismatch on deploy, regenerate the lockfile locally and commit; don't paper over it.

### A.3 — Migration baked into `buildCommand` [Strong]

**File:** `vercel.json:5`

```
pnpm turbo run build --filter=@vk/web && pnpm --filter @vk/db exec tsx src/migrate.ts
```

Migration runs **at build-time**. Two ways this hurts you:

1. **Build-pod has DB write-access.** Every preview-deploy on every PR runs `tsx src/migrate.ts` against whatever `DATABASE_URL` is in the preview env. If preview-env points at prod-DB (anti-pattern but common solo-dev mistake), every PR could mutate prod-schema during build.
2. **Race window on rollout.** Old code is still serving traffic while new build runs the migration. A migration that drops a column → 30–90 s window where the old code reads from a dropped column → 5xx for live users.

**Industry pattern:** migrations run **once, sequentially, before traffic switches**, via either:
- A pre-deploy GitHub Action that calls `db:migrate` against the prod DSN.
- A Vercel "Pre-Deploy" hook (currently in preview at Vercel, not GA).
- Or kept as `npm run db:migrate` triggered manually from CI on `main` push.

For solo-dev launch the **right answer right now is "manual `pnpm db:migrate` before every prod deploy"** + remove the migration step from `vercel.json:5`. Document it in `docs/operations/deploy.md`.

### A.4 — `next.config.ts` shape [Mid]

**File:** `apps/web/next.config.ts:1-71`

What's good:
- `transpilePackages: [10× @vk/*]` (lines 8-19) — workspace packages transpiled correctly.
- `serverExternalPackages: ["fast-glob", "gray-matter", "postgres", "better-auth", "nodemailer", "inngest"]` (lines 20-27) — keeps these out of the client bundle.
- `optimizePackageImports: ["lucide-react", "d3-*"]` (lines 36-41) — tree-shake-friendly.
- `outputFileTracingIncludes` for `/trust/dpa`, `/trust/sub-processors.json`, `/trust/eval` (lines 46-51) — explicit asset-tracing for routes that read root-level markdown / JSON. Important for Vercel-Fluid-Compute which trims unreferenced files.
- 308 permanent redirects for legacy `/[workspace]/settings/user` → `/account/settings/profile` (lines 52-67).

What's missing or worth verifying:
- **No `output: 'standalone'`** — Next.js on Vercel ignores this anyway; Vercel uses its own packaging. Not a finding.
- **No `images.remotePatterns`** — currently no user-supplied images flow through `next/image`, so OK for now. If avatars from Better-Auth Google-OAuth get added (account-settings page hints at it), this needs `{ protocol: 'https', hostname: 'lh3.googleusercontent.com' }` etc.
- **No `experimental.cacheComponents: true`** — confirms the audit-2026-05 FN-08 finding: 0 `'use cache'` directives in code (`apps/web/src/lib/dal/galaxie.ts:284` uses the **legacy** `unstable_cache` API). Cache-Components adoption is **explicitly Nova-3a-Goal-deferred per CLAUDE.md**. Recommendation: **don't enable Cache Components for launch.** Adoption is a 1–2 day plan on its own and adds risk for zero customer-visible benefit at launch.

### A.5 — Build-time env requirements [Mid]

**File:** Multiple

What's read **only at runtime** (safe):
- Every Stripe/Inngest/Anthropic/OpenAI env — all checked via `isXxxEnabled()` boolean guards that gracefully no-op when unset. This is **exceptional** and is the reason a Vercel-preview-build without secrets still passes.

What's read **at build-time** (because the layout/metadata uses them):
- `process.env.NEXT_PUBLIC_APP_URL` — used in `metadataBase` (`apps/web/src/app/layout.tsx:35`), `sitemap.ts:3`, `robots.ts:3`, `trust/sub-processors.xml/route.ts:7`. All have `?? "http://localhost:3000"` fallback, so build won't fail — but the resulting `sitemap.xml` + OpenGraph URLs will point at `localhost`. **Must be set in Vercel Preview + Production environments**.

What's missing:
- No `env.ts` / `@t3-oss/env-nextjs`-style runtime-validated schema. A typo in `STRIPE_PRICE_PRO_MONTHLY` silently returns `null` from `priceIdFor()` (`apps/web/src/lib/stripe.ts:60`) and surfaces as "Stripe price ID for tier ... is not configured" only when a user clicks Upgrade. **Add a startup-time env-schema-validator before launch** so misconfig fails loud, not silent.

### A.6 — Route render strategies [Mid]

**Findings (from `grep`):**

| Route                              | Strategy                          | OK? |
|------------------------------------|-----------------------------------|-----|
| `/` (`page.tsx`)                   | Default (auto-dynamic via SiteNav) | ✅  |
| `/pricing`                         | Auto-dynamic (`headers()` VAT-by-IP) | ✅  |
| `/legal/agb`, `/legal/dpa`, `/legal/subprocessors` | Default static (no dyn-API) | ✅ but should add `export const revalidate = 86400` for cache hint |
| `/trust`                           | Default — reads `process.env.CCA_STATUS`, no other dyn-API → static | ✅ |
| `/trust/dpa`                       | `force-dynamic` (line 19)         | 🤔 reads markdown — could be `revalidate = 3600` instead |
| `/trust/sub-processors.{json,xml}` | `force-static`                     | ✅ correct |
| `/status`                          | Auto-dynamic (probes live)        | ✅  |
| `/api/stripe/webhook`              | `runtime = nodejs` + `force-dynamic` | ✅ exceptional |
| `/api/events/stream`               | `runtime = nodejs` + `force-dynamic` + `maxDuration = 300` | ✅ |
| `/api/notify-update`               | `runtime = nodejs` + `force-dynamic` | ✅ |
| `/api/inngest`                     | **No `runtime`, no `dynamic`**     | 🔴 see D.1 |
| `/[workspace]/settings/**`         | `force-dynamic`                   | ✅ |
| `/auth/verify`, `/billing`         | `force-dynamic`                   | ✅ |

**Verified:** the Nova-3a-Bundle-B fix (per `apps/web/src/app/layout.tsx:27-31` comment) removed the root-layout `force-dynamic`, so marketing routes (`/legal/*`) **CAN** now statically prerender. Audit-2026-05 K4 finding is **resolved**.

**Not-yet-done:** `'use cache'` adoption (Cache-Components). 0 directives anywhere. CLAUDE.md says this is Nova-3a-Goal. Recommend **deferring to post-launch** — not blocking.

---

## Part B — Environment Variables — Production Audit

### B.1 — Full inventory (44 env vars across the code)

| Var                                    | Required-At | Where-Used                                       | Test-Mode | Live-Mode | Status |
|----------------------------------------|-------------|--------------------------------------------------|-----------|-----------|--------|
| **DB**                                 |             |                                                  |           |           |        |
| `DATABASE_URL`                         | runtime     | `packages/db/src/client.ts:16,21`                | postgres-local | Neon-fra1 sslmode=require | 🔴 must set |
| **Auth**                               |             |                                                  |           |           |        |
| `AUTH_SECRET`                          | runtime     | `packages/auth/src/server.ts:23,62`              | dev-32B   | new openssl rand -base64 32 | 🔴 must set |
| `AUTH_BASE_URL`                        | runtime     | `packages/auth/src/server.ts:63`, `client.ts:10`, webhook 18, prepaid-expirer 34 | localhost | https://<domain> | 🔴 must set |
| `NEXT_PUBLIC_APP_URL`                  | build+runtime | `layout.tsx:35`, `sitemap.ts:3`, `robots.ts:3`, `stripe.ts:112`, sub-processors.xml:7, webhook 17, prepaid-expirer 33 | localhost | https://<domain> | 🔴 must set |
| **Stripe**                             |             |                                                  |           |           |        |
| `STRIPE_SECRET_KEY`                    | runtime     | `lib/stripe.ts:7,12`, `health-check.ts:117`, webhook (via `getStripe()`), `inngest/credit-aggregator.ts:19`, `inngest/stripe-reconcile.ts:43,47` | sk_test_… | sk_live_… post-KYC | 🟡 deferred to KYC |
| `STRIPE_WEBHOOK_SECRET`                | runtime     | `webhook/route.ts:72`                            | whsec_… (CLI) | whsec_… (Stripe-Dashboard live) | 🟡 |
| `STRIPE_PRICE_STARTER_MONTHLY`         | runtime     | `lib/stripe.ts:60` (via `envKeyFor`)             | price_… (test) | price_… (live) | 🟡 |
| `STRIPE_PRICE_STARTER_ANNUAL`          | runtime     | dito                                             | price_…   | price_…   | 🟡 |
| `STRIPE_PRICE_PRO_MONTHLY`             | runtime     | dito                                             | price_…   | price_…   | 🟡 |
| `STRIPE_PRICE_PRO_ANNUAL`              | runtime     | dito                                             | price_…   | price_…   | 🟡 |
| `STRIPE_PRICE_AGENCY_MONTHLY`          | runtime     | dito                                             | price_…   | price_…   | 🟡 |
| `STRIPE_PRICE_AGENCY_ANNUAL`           | runtime     | dito                                             | price_…   | price_…   | 🟡 |
| `STRIPE_PRICE_PACK_100`                | runtime     | `lib/stripe.ts:73`                               | price_…   | price_…   | 🟡 |
| `STRIPE_PRICE_PACK_500`                | runtime     | `lib/stripe.ts:73`                               | price_…   | price_…   | 🟡 |
| `STRIPE_METER_AUDIT_CREDIT_OVERAGE`    | runtime     | `lib/stripe.ts:89,99`                            | mtr_…     | mtr_…     | 🟡 |
| `STRIPE_METER_AI_COST_MARKUP_MICROCENTS` | runtime   | `lib/stripe.ts:90,99`                            | mtr_…     | mtr_… (Sub-C disclosure first) | 🟡 |
| `STRIPE_PRICE_OVERAGE_CREDIT_EUR`      | runtime     | `lib/stripe.ts:94,103`                           | price_…   | price_…   | 🟡 |
| `STRIPE_PRICE_AI_MARKUP_MICROCENT_EUR` | runtime     | `lib/stripe.ts:95,103`                           | price_…   | price_…   | 🟡 |
| **Email**                              |             |                                                  |           |           |        |
| `RESEND_API_KEY`                       | runtime     | `packages/auth/src/server.ts:44,52`, `emails/sender.ts:16,24`, `health-check.ts:105` | unset (Mailpit) | re_… | 🔴 must set |
| `SMTP_HOST`                            | runtime     | `auth/server.ts:47,56`, `emails/sender.ts:19,28` | 127.0.0.1 (Mailpit) | DON'T SET in prod | ✅ |
| `SMTP_PORT`                            | runtime     | same                                             | 1025      | DON'T SET | ✅ |
| `SMTP_FROM`                            | runtime     | `auth/server.ts:110`                             | auth@validationkit.local | **MUST set** (see E.2) | 🔴 |
| `RESEND_FROM` / `EMAIL_FROM`           | —           | **NEVER READ** — referenced only in docs (`docs/operations/deploy.md:21`, `.env.example:37`) | — | — | 🔴 docs lie |
| **LLM**                                |             |                                                  |           |           |        |
| `ANTHROPIC_API_KEY`                    | runtime     | `packages/llm/src/select.ts:70,83,110,139`, `health-check.ts:134` | unset (no LLM rules) | sk-ant-… | 🟡 optional |
| `OPENAI_API_KEY`                       | runtime     | `select.ts:83,98,110,139`                        | unset     | optional fallback | 🟡 optional |
| **Inngest**                            |             |                                                  |           |           |        |
| `INNGEST_BASE_URL`                     | runtime     | `packages/inngest/src/client.ts:14`              | http://127.0.0.1:8288 | DON'T SET | ✅ |
| `INNGEST_EVENT_KEY`                    | runtime     | `client.ts:14`                                   | unset     | event_… (Inngest-Cloud) | 🔴 must set |
| `INNGEST_SIGNING_KEY`                  | runtime     | **NEVER READ in code** — only documented (`docs/operations/deploy.md:23`, `.env.example:54`, `docs/audits/2026-05/12-api-routes.md:FN-04`) | — | signkey-prod-… | 🔴 see D.1 |
| **GitHub-App**                         |             |                                                  |           |           |        |
| `GITHUB_APP_ID`                        | runtime     | `packages/github-app/src/client.ts:12,17`        | unset (no App) | numeric ID | 🟡 deferred |
| `GITHUB_APP_PRIVATE_KEY`               | runtime     | `client.ts:12,18`                                | unset     | PEM       | 🟡 |
| `GITHUB_APP_WEBHOOK_SECRET`            | runtime     | `client.ts:25-26`, `api/install-webhook/route.ts:23` | hex32 (dev) | hex32 | 🟡 |
| `GITHUB_APP_CLIENT_ID`                 | runtime     | `client.ts:28-29`                                | unset     | Iv23…     | 🟡 |
| `GITHUB_TOKEN`                         | runtime     | `lib/github-fetch.ts:60-61`                      | unset (60 req/h) | PAT (5000 req/h) | 🟡 |
| **Crypto**                             |             |                                                  |           |           |        |
| `BYOK_ENCRYPTION_KEY`                  | runtime     | `packages/billing/src/byok-crypto.ts:22,72`      | unset (BYOK disabled) | 32B base64 | 🔴 must set if BYOK ships |
| **Misc**                               |             |                                                  |           |           |        |
| `CCA_STATUS`                           | runtime     | `apps/web/src/app/trust/page.tsx:109`            | unset (pending) | pending/in-progress/certified | ✅ optional |
| `REDIS_URL`                            | —           | **NEVER READ** — only in `.env.example:43` + docker-compose. Phase-0 cache placeholder. | — | — | ✅ inert |
| `VK_LOCAL_PATCH_DIR`                   | runtime     | `apps/web/src/lib/apply-dal.ts:59`               | /tmp/vk-patches | DON'T SET (GitHub-App path wins) | ✅ |
| `VERCEL_PROJECT_PRODUCTION_URL`        | runtime     | `apps/web/src/lib/stripe.ts:113-114`             | auto-injected by Vercel | auto-injected | ✅ |
| `NODE_ENV`                             | runtime     | `packages/auth/src/emails/sender.ts:16`          | test      | production (auto) | ✅ |

### B.2 — Production-deploy ENV checklist (paste-ready)

Vercel-Production-Environment (must-set before flipping DNS):

```
# Required — app won't function without these
DATABASE_URL                = postgres://…@…neon.tech/…?sslmode=require
AUTH_SECRET                 = <openssl rand -base64 32>           # NEW value, not local
AUTH_BASE_URL               = https://<domain>
NEXT_PUBLIC_APP_URL         = https://<domain>
SMTP_FROM                   = "ValidationKit <auth@<domain>>"     # used as magic-link From
RESEND_API_KEY              = re_…                                # production restricted key, send-only

# Inngest Cloud
INNGEST_EVENT_KEY           = event_…
INNGEST_SIGNING_KEY         = signkey-prod-…  # but: see D.1 — code currently ignores this

# Stripe (after KYC + Live-Mode)
STRIPE_SECRET_KEY           = sk_live_…
STRIPE_WEBHOOK_SECRET       = whsec_… (production endpoint, NOT CLI)
STRIPE_PRICE_STARTER_MONTHLY = price_live_…   (× 8 tier+cycle combos)
STRIPE_PRICE_PACK_100       = price_live_…    (× 2 packs)
STRIPE_METER_AUDIT_CREDIT_OVERAGE = mtr_live_…
STRIPE_METER_AI_COST_MARKUP_MICROCENTS = mtr_live_…
STRIPE_PRICE_OVERAGE_CREDIT_EUR = price_live_…
STRIPE_PRICE_AI_MARKUP_MICROCENT_EUR = price_live_…

# LLM (optional, but BYOK plus internal-default = strongly recommended)
ANTHROPIC_API_KEY           = sk-ant-…
# OPENAI_API_KEY            = sk-…  (only set if cost-floor fallback desired)

# BYOK column-level crypto (required if customers can paste keys at all)
BYOK_ENCRYPTION_KEY         = <openssl rand -base64 32>

# Optional polish
CCA_STATUS                  = pending | in-progress | certified
GITHUB_TOKEN                = ghp_…   (raises public-repo poll quota 60→5000/h)
```

Vercel-Preview-Environment (per-PR sandbox):

```
DATABASE_URL                = <Neon preview branch — auto-created per Vercel-Neon integration if linked>
AUTH_SECRET                 = <separate, NOT same as prod>
AUTH_BASE_URL               = $VERCEL_URL (Vercel auto-substitutes)
NEXT_PUBLIC_APP_URL         = $VERCEL_URL
RESEND_API_KEY              = re_test_…  (or unset → falls back to mailpit-equivalent which doesn't exist on Vercel; better: a sandbox Resend key)
STRIPE_SECRET_KEY           = sk_test_…
STRIPE_WEBHOOK_SECRET       = whsec_test_… (but: preview-webhooks need a separate Stripe-CLI tunnel or sandbox endpoint)
INNGEST_EVENT_KEY           = event_…_branch
INNGEST_SIGNING_KEY         = signkey-branch-…
```

### B.3 — Critical ENV findings

#### [Kill] B-K1 — `INNGEST_SIGNING_KEY` is documented but never read

**Files:** `.env.example:54`, `docs/operations/deploy.md:23`, `docs/operations/secrets-rotation.md:47-48`

**Code reality:** `packages/inngest/src/client.ts:14` checks only `INNGEST_EVENT_KEY`. The serve handler at `apps/web/src/app/api/inngest/route.ts:1-4` does:

```ts
import { serve } from "inngest/next";
import { inngest, functions } from "@vk/inngest";
export const { GET, POST, PUT } = serve({ client: inngest, functions });
```

Inngest-SDK *will* auto-pick `INNGEST_SIGNING_KEY` from `process.env`, **BUT** without an explicit `runtime = "nodejs"` declaration and without a 503-guard (which every OTHER webhook route has), this endpoint silently breaks in two ways in prod:

1. If Vercel happens to route this through Edge runtime (it shouldn't, but the lack of `export const runtime = "nodejs"` means no defense-in-depth), Inngest body-signing breaks identically to how `Edge` breaks Stripe.
2. If `INNGEST_SIGNING_KEY` is forgotten in Vercel-ENV, Inngest-Cloud Webhook calls will fail signature-verification and **all background jobs silently stop** — no scan completes, no monthly credit grant, no expirer cron.

Same finding lives in `docs/audits/2026-05/12-api-routes.md:FN-04` — flagged Strong there, escalating to **Kill** for production because background jobs are load-bearing for billing (credit-aggregator + prepaid-expirer + stripe-reconcile).

**Fix:**

```ts
// apps/web/src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest, functions } from "@vk/inngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // match Fluid-Compute default

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
```

#### [Strong] B-S1 — `RESEND_FROM` / `EMAIL_FROM` mentioned in docs but never used

**Files:** `docs/operations/deploy.md:21` says "Setze `RESEND_API_KEY` + `RESEND_FROM`". `.env.example:37` says `RESEND_FROM="auth@validationkit.app"`.

**Code reality:** Only `SMTP_FROM` is read (`packages/auth/src/server.ts:110`). The two transactional-email helpers use a different fallback:
- Magic-link emails fall back to `"onboarding@resend.dev"` if `SMTP_FROM` is unset (`packages/auth/src/server.ts:111`). **In prod this would mean magic-link emails come from `onboarding@resend.dev`**, which is the Resend default sender — sketchy + likely to land in spam folders.
- Transactional notifications (PlanChange / PrepaidExpire / SubscriptionPastDue) hardcode `"notifications@validationkit.app"` (`packages/auth/src/emails/sender.ts:73`). This is **DNS-verifiable but DKIM-broken** unless the user owns the domain — which they don't yet (G.1).

**Fix:**
- Rename `SMTP_FROM` → `EMAIL_FROM` for clarity (it's used for both SMTP-relay-to-Resend AND magic-link-from-address).
- Or accept the current naming and update docs.
- Either way: **the user MUST set `SMTP_FROM` in Vercel-prod**, otherwise magic-link emails come from `onboarding@resend.dev`.

#### [Strong] B-S2 — No runtime-validated env schema

**Issue:** Misconfig in any of the 14 Stripe-Price env vars surfaces as a `null` return from `priceIdFor()` (`apps/web/src/lib/stripe.ts:60`) and is only caught when a user clicks Upgrade. No CI gate, no boot-time check.

**Fix:** Add `apps/web/src/lib/env.ts` with a Zod schema validated at module-load. ~30 lines. Catches typos at deploy-time. Same pattern as `@t3-oss/env-nextjs`.

#### [Mid] B-M1 — Local `.env.local` contains a `GITHUB_APP_WEBHOOK_SECRET` real value

**File:** `.env.local:16` — value `"0504b2230b36922143182d36f221cb67bd1dd1356546971768727e9852fb0055"` is committed to a file that is `.gitignore`d but lives on disk. Risk: if `git ls-files .env.local` (`.gitignore` confirms it's excluded — verified) is correct, this is local-only.

**Verified safe:** `git ls-files` confirms `.env.local` is NOT tracked. `.env.example` and `.env.test` are tracked (intentional, no real secrets in either).

**Recommendation:** rotate that webhook secret before the GitHub-App goes live (it's logged in 1+ Cloudflare-tunnel session — assume mildly compromised).

#### [Mid] B-M2 — `NEXT_PUBLIC_APP_URL` is the one build-time-required var

It's read by `metadataBase`, `sitemap.ts`, `robots.ts`, `trust/sub-processors.xml/route.ts`. All have localhost fallback so the build won't fail, but the generated XML, sitemap, robots, and OG-tags will be wrong if the var is unset on Vercel.

**Fix:** make this a required-throw in the env schema (B-S2). And ensure the Vercel-deploy-checklist (`docs/operations/deploy.md`) calls this out as a **build-time-required**, not runtime.

---

## Part C — Database — Production-Readiness

### C.1 — Drizzle client uses `postgres-js`, NOT `neon-http`/`neon-serverless` [Mid]

**File:** `packages/db/src/client.ts:1-3`

```ts
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
```

This is the standard Node `postgres` driver, not the Neon-specific driver. On Vercel Fluid-Compute this is **fine** (Fluid-Compute is full Node.js — see knowledge-update §2026-02), but understand the tradeoff:

| Driver                     | Connection-pool | Cold-start | Notes |
|----------------------------|-----------------|------------|-------|
| `drizzle-orm/postgres-js`  | TCP, 10 conns   | warm reuse | What you have — correct for Fluid-Compute |
| `drizzle-orm/neon-http`    | HTTP, stateless | none       | For Edge / serverless-without-Fluid only |
| `drizzle-orm/neon-serverless` | WS, pooled  | medium     | Vercel-old-runtime; obsolete on Fluid-Compute |

**Verdict:** keep `postgres-js`. Confirm Neon is configured for **PgBouncer-pooled** connection (Neon offers a `-pooler` suffix DSN). Use the pooled DSN as `DATABASE_URL` in prod.

### C.2 — Connection pool config [Mid]

**File:** `packages/db/src/client.ts:28-33`

```ts
_sql = postgres(url, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
  prepare: false,
});
```

**Math for Fluid-Compute (DACH solo-dev launch):**
- Fluid-Compute reuses function instances. Each warm instance keeps `max:10` open connections.
- Neon free-tier: 100 connections total (`shared_buffers` limited). Pro: ~1000.
- Worst-case concurrent warm instances at launch: ~5 functions × 10 conns = 50 connections. Fits in free Neon, fits very comfortably in Neon Pro.

**Recommendation:** drop `max:10` → `max:5`. Cold-start cost is identical; concurrent-instance ceiling raises. With Fluid-Compute's instance-reuse, 5 connections per warm instance is plenty.

Also: **enable Neon's pgbouncer-pooled connection string** (the `…-pooler.us-east-2.aws.neon.tech` variant) and the pool-math becomes essentially infinite from the app side — Neon's pooler absorbs the burst.

### C.3 — Migration strategy [Strong] — see A.3

Currently runs as part of `vercel.json:5` buildCommand. **Move to a separate one-shot job** before traffic switches. Two options:

1. **Pre-deploy script in CI:** Before `vercel --prod`, GitHub-Action runs `pnpm db:migrate` against `DATABASE_URL` (read from GH-secret).
2. **Manual:** `pnpm db:migrate` from a local terminal, then `git push origin main`. Solo-dev-acceptable, but error-prone.

Document the choice in `docs/operations/deploy.md`.

### C.4 — Schema-drift / migration health [Exceptional]

**File:** `packages/db/drizzle/0000–0015_*.sql` — 16 migrations, monotonic, no `migration_lock` issues visible. `meta/_journal.json` exists (line `packages/db/drizzle/meta`). Migrations are append-only (forward-only is the documented policy per `docs/operations/deploy.md:58`).

Cannot run `pnpm drizzle-kit check` without DB, but visual inspection of migration file naming + journal-meta shows no obvious drift.

### C.5 — Backup strategy [Strong]

**Currently undocumented.** Neon offers **Point-in-Time Recovery** (PITR) on paid plans, free-tier has a 24h history window. For DACH-B2B / GDPR-defensibility:

- **Required:** Neon Pro plan ($19/mo) — 7-day PITR.
- **Document** in `docs/operations/deploy.md` how to restore: Neon Console → Branches → "Restore" with a point-in-time selector.
- **Test once** before launch: create a Neon branch from a PITR-checkpoint, verify schema + a sampled row.

### C.6 — Row-Level Security [Mid — by-design-not-implemented]

**Finding:** No RLS in any migration (`grep` returns zero across `packages/db/drizzle/*.sql`).

**App-level isolation:** every DAL function checks workspace-membership before returning data (`apps/web/src/lib/dal/galaxie.ts:279-280` is the pattern: `userIsMember(ws.id, userId)` before any select). The risk is **one missed check** could leak across workspaces.

**For solo-dev launch:** app-level is acceptable. RLS would be belt-and-suspenders. Defer to V2 unless a paying customer requires it contractually.

### C.7 — Neon connection-limit + serverless math [Mid]

Worst-case at launch:
- 5 concurrent Fluid-Compute warm instances × `max:5` (after fix) = 25 app-side connections.
- Plus Inngest-Cloud worker pool (~3 concurrent at small volume) × per-step connection = ~6.
- Plus migrations during deploy ≈ 1.

**Total:** ~32 connections worst-case. Neon-free supports 100; comfortable.

Use **`-pooler` DSN** to make this irrelevant.

---

## Part D — Inngest Cloud — Production-Readiness

### D.1 — `serve()` route lacks `signingKey` + `runtime` [Kill] — see B-K1 above

### D.2 — Functions registered (5 total)

| Function                  | Trigger              | File                                                        | Idempotency                          |
|---------------------------|----------------------|-------------------------------------------------------------|--------------------------------------|
| `audit-requested`         | event `audit/requested` | `packages/inngest/src/functions/audit-requested.ts:34` | scan-row PK + status state-machine   |
| `auto-track-repos`        | cron `0 */4 * * *`   | `auto-track-repos.ts:22`                                    | per-repo `lastCommitSha` comparison  |
| `credit-aggregator`       | cron `*/5 * * * *`   | `credit-aggregator.ts:104`                                  | `stripe_meter_event_log.identifier` UNIQUE |
| `prepaid-credit-expirer`  | cron `0 2 * * *`     | `prepaid-credit-expirer.ts:153`                             | per-grant `creditsRemaining → 0` + warning-event-row check |
| `stripe-reconcile`        | cron `0 3 * * *`     | `stripe-reconcile.ts:36`                                    | read-only drift-detection only       |

**Idempotency is exceptional** — every function has either a UNIQUE constraint OR a state-machine that's safe under at-least-once delivery.

**Concurrency limits:** None declared via `concurrency:` on any function. Inngest defaults are fine for solo-dev launch volume. Revisit when `audit-requested` queue depth > 100.

**Retry-strategy:** Inngest default (4 retries with exponential backoff). No custom retry-shape declared anywhere — fine.

**Dead-letter:** Inngest-Cloud has a built-in failed-runs view. The `stripe-reconcile` and `audit-requested` functions both publish `audit.failed` events on terminal failure, which surface in the in-app event-stream. That's the dead-letter equivalent — workspace-owners see it.

### D.3 — Cron-job inventory

| Cron                   | Function                  | What it does                                                                 | Failure-impact |
|------------------------|---------------------------|------------------------------------------------------------------------------|----------------|
| `*/5 * * * *`          | credit-aggregator         | Flush pending credit-overage events to Stripe meters                         | Customers don't get billed for overage → revenue leak |
| `0 */4 * * *`          | auto-track-repos          | Poll watched public GitHub repos for new commits → enqueue audit            | Customers don't see fresh audits; non-load-bearing pre-launch |
| `0 2 * * *`            | prepaid-credit-expirer    | Retire expired pre-paid credit grants + send 1-day-out warning               | Customers see stale credit balance + miss expire-warning |
| `0 3 * * *`            | stripe-reconcile          | Detect tier/status drift between Stripe + local subscription table          | Detection-only, never auto-fixes; safe to fail silently |

**Smoke-test plan:** before launch, force each cron to run once via Inngest-Dashboard's "Run" button + verify the function dashboard shows ✅.

### D.4 — Inngest-Cloud account [Strong — not yet set up]

**Verified:** no Inngest-account-link documented in `docs/operations/deploy.md`. The user has not yet:
1. Created an Inngest-Cloud account.
2. Pulled `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` into Vercel-ENV.
3. Registered the production-deployment URL `https://<domain>/api/inngest` as the Inngest serve endpoint.

**Estimated time to do this:** 30 minutes once `<domain>` exists. Should be done at the same time as the Vercel-Domain step (G).

### D.5 — Function timeouts vs Vercel timeout [Mid]

`audit-requested` calls `step.run("scan", () => scanRepository(rootPath))` (`audit-requested.ts:53`). For a 5000-file repo this can take 60–180 s. Vercel-Fluid-Compute default `maxDuration = 300 s` (knowledge-update §2026-02). Inngest steps run async via its serve endpoint, so each step is its own request — within the 300 s budget.

**At 30k-file repos** (Agency-tier customers), risk: a single audit-step exceeds 300 s. Mitigation: split `runAudit` into per-category steps (5 rules → 5 steps). Not blocking for launch.

---

## Part E — Email — Production-Readiness

### E.1 — Resend account + API key [Strong — not yet set up]

**Status:** unconfigured. `RESEND_API_KEY` is unset in `.env.local`, no documented Resend-account-link exists. User must:

1. Sign up at https://resend.com
2. Verify the sending domain (G.2: DKIM TXT + SPF TXT + DMARC TXT records)
3. Create a **restricted** API key (`send-emails-only` permission, NOT full account access)
4. Paste into Vercel-prod-ENV as `RESEND_API_KEY`

### E.2 — Domain verification for sending email [Kill]

**This is gating** every transactional email. Once `<domain>` exists (G), add **5 DNS records**:

```
# SPF — declare Resend as allowed sender
TXT  @                  "v=spf1 include:_spf.resend.com -all"

# DKIM — Resend gives you the selector + value in their dashboard
TXT  resend._domainkey  "v=DKIM1; k=rsa; p=<long base64 from Resend dashboard>"

# DMARC — quarantine failing mail. Start at p=none to monitor first 7 days
TXT  _dmarc             "v=DMARC1; p=none; rua=mailto:dmarc-reports@<domain>; aspf=r; adkim=r"

# MX (optional, if you want to receive mail on the domain)
MX   @                  10 feedback-smtp.eu-west-1.amazonses.com   # only if Resend EU region
```

**After 7 days monitoring, tighten:** change `p=none` → `p=quarantine` → eventually `p=reject`.

**Without these records,** every magic-link + transactional email will land in spam folders, customers won't be able to sign in, and the launch fails on its first user.

### E.3 — Magic-link email [Exceptional but with one Strong defect]

**File:** `packages/auth/src/server.ts:91-117`

Implementation is great:
- 10-minute expiry (line 86)
- SHA-256 hashed token storage (`storeToken: "hashed"`, line 90)
- Branded subject "Sign in to ValidationKit" (line 113)
- Custom rendered HTML + text body via `renderMagicLinkEmail()`
- Includes IP + UA in the body for transparency (line 95-99)

**Defect:** the `from` field at line 109-111 falls back to `"onboarding@resend.dev"` if `SMTP_FROM` is unset. That domain is owned by Resend, not by ValidationKit — magic-links from this domain WILL be flagged as phishing/spam by most enterprise mail filters.

**Fix:** make `SMTP_FROM` (or rename to `EMAIL_FROM`) a required env var. Boot-time throw if unset.

### E.4 — Transactional emails — bounce-handling [Strong]

**No bounce-handler exists.** Resend offers webhooks for `email.bounced`, `email.delivered`, `email.complained` — none are wired up. If a customer's primary email bounces, the app doesn't know.

**For launch:** acceptable. The damage is "user doesn't get plan-change-confirmation email" — annoying, not catastrophic.

**Sprint 1.0 follow-up:** add a webhook receiver at `/api/resend/webhook` that:
- On `bounced` → mark `user.email_verified = false` and surface a banner.
- On `complained` (spam-report) → log + alert founder.

### E.5 — Email templates [Exceptional]

**Files:** `packages/auth/src/emails/MagicLinkEmail.tsx`, `PlanChangeConfirmation.tsx`, `PrepaidPackExpireWarning.tsx`, `SubscriptionPastDue.tsx` — 4 React-Email components rendered via `@react-email/render`. Both HTML and plain-text variants emitted (`emails/sender.ts:65-68`).

**Not verified:** rendering across Gmail / Outlook / Apple-Mail. **Recommend:** litmus-test or use Resend's preview tool before launch. ~1h to verify all 4 templates.

---

## Part F — Observability + Error-Tracking

### F.1 — Zero error-tracking vendor [Kill]

**Verified by grep:** zero hits for `sentry`, `@sentry`, `axiom`, `@axiom`, `posthog`, `datadog`, `bugsnag`, `honeybadger` anywhere in source or any `package.json`.

**Current state:** all errors go to `console.error` (10 occurrences across the codebase) → Vercel-Function-Logs (retention: 1h on Hobby plan, 24h on Pro).

**Production impact:** when a paying customer hits a 5xx, the founder finds out either (a) when the customer emails support or (b) by manually opening Vercel-dashboard within the log-retention window.

**Minimum-viable fix for launch:** add **Sentry** with a free-tier project. ~20 minutes:

```bash
pnpm --filter @vk/web add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
# adds sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts
```

Then `SENTRY_DSN` in Vercel-ENV. Free tier: 5k events/month — comfortable for launch.

**Alternative:** Axiom + the `@axiomhq/nextjs` package. Better for structured logging than Sentry; worse for stack-trace-grouping. Pick one. Sentry is simpler for solo-dev.

### F.2 — Error-boundary coverage [Strong]

| Boundary               | File                                          |
|------------------------|-----------------------------------------------|
| Global                 | `apps/web/src/app/global-error.tsx`           |
| Default route          | `apps/web/src/app/error.tsx`                  |
| 404                    | `apps/web/src/app/not-found.tsx`              |
| Workspace-scoped       | `apps/web/src/app/[workspace]/error.tsx`      |

**Verdict:** good coverage at the root + workspace level. **Missing:** no per-route error boundaries on:
- `/billing` — Stripe failure here loses revenue
- `/api/stripe/webhook` — already returns 5xx explicitly with `console.error`; OK
- `/[workspace]/scans/[id]` — audit-detail failure leaves user stuck

**For launch:** existing coverage is acceptable. Add scan-detail boundary in Sprint 1.

### F.3 — Structured logging [Mid]

**Current:** `console.error("[scope] message", err)` pattern in 10 places (e.g. `apps/web/src/app/api/stripe/webhook/route.ts:95,156,311`). No JSON, no structured fields, no correlation-ID.

**For launch:** acceptable on Vercel-Function-Logs (they parse the `[scope]` prefix decently). Sentry would add the missing structure for free.

### F.4 — DB-monitoring / slow-query log [Strong]

**Current:** none. Neon offers a Query-Insights dashboard on Pro plan ($19/mo) that surfaces N+1s and slow queries automatically.

**For launch:** Neon-Pro covers this. Document in deploy.md that Neon-Pro is a launch-prerequisite.

### F.5 — Stripe-webhook-failure alerting [Strong]

**Current:** the `console.error("[stripe-webhook] handler failed for ${event.type}", err)` (line 156) → Vercel logs only. No email, no Slack, no Stripe-Dashboard-alert configuration.

**Stripe-Dashboard side:** by default Stripe will email the account-owner-email if webhook-endpoint failure-rate >5% over 1 hour. Verify this is **enabled** in Stripe-Dashboard → Developers → Webhooks → [endpoint] → Notifications.

---

## Part G — Domain + DNS — From Scratch

### G.1 — Domain registration

**Status:** not yet registered. Code falls back to `https://validationkit.vercel.app` (`apps/web/src/app/trust/sub-processors.xml/route.ts:7`) and `auth@validationkit.local` (`packages/auth/src/server.ts:111`). Neither is launchable.

**Recommended registrar (in order of suitability for solo-DACH-B2B):**

| Registrar         | Cost (DE TLD)      | DNS Editor                  | Speed-to-Set-Up | Notes |
|-------------------|--------------------|-----------------------------| ----------------|-------|
| **Cloudflare**    | $9.15/yr `.com`, can't register `.de` | Full free DNS-editor, fast propagation, DDoS-DNS | 5 min | **Recommended** — but for `.de` see below |
| INWX              | €5–7/yr `.de`      | Decent DNS-editor, slower propagation | 15 min | Best `.de`-pricing for DACH-customers |
| Hetzner           | €4.80/yr `.de`     | Basic DNS-editor            | 15 min | German registrar, German invoice (helpful for B2B trust) |
| Vercel-Domains    | $20/yr `.com`      | Vercel-native               | 0 min (auto-link) | Convenient but locked-in |

**Recommendation for ValidationKit specifically:**
- **`validationkit.app`** (`.app`-TLD, Cloudflare, $13/yr) — `.app` is a HTTPS-by-default TLD (HSTS-preloaded), perfect for a DevTools brand.
- **OR `validationkit.de`** at INWX or Hetzner — better DACH-customer trust, but `.de`-only is region-locked feeling.

Code already references `validationkit.app` in `packages/auth/src/emails/sender.ts:73` (default `from`) — the team's leaning toward `.app`. Go with it.

### G.2 — DNS records to add after registration

```
# A/AAAA — Vercel auto-provisions when domain is added to project
# Vercel uses 76.76.21.21 as the static IP for apex
A     @          76.76.21.21
AAAA  @          2606:4700:90:0:f22e:fbec:5bed:a9cc   # Vercel-provided

# CNAME for www (Vercel handles the redirect to apex)
CNAME www        cname.vercel-dns.com.

# Or: ALIAS / ANAME if registrar supports it (Cloudflare does, INWX does not)
# Then point apex via CNAME-flattening; ignore A/AAAA above.

# Email — Resend EU region
TXT   @          "v=spf1 include:_spf.resend.com -all"
TXT   resend._domainkey   "v=DKIM1; k=rsa; p=<from Resend dashboard>"
TXT   _dmarc     "v=DMARC1; p=none; rua=mailto:dmarc-reports@validationkit.app; aspf=r; adkim=r"

# Stripe — domain-verification for Apple-Pay / Google-Pay if you enable wallets
TXT   @          "stripe-domain-verification=<hex32 from Stripe dashboard>"

# Optional — Google Search Console site verification
TXT   @          "google-site-verification=<hex from GSC>"

# Optional — BIMI (brand logo in email) — Sprint 2 polish, not for launch
```

### G.3 — Vercel-domain-add flow

```bash
# 1. Link the project (already done — .vercel/project.json exists)
vercel link --project validationkit

# 2. Add domain (CLI or Dashboard — Dashboard simpler)
# Vercel Dashboard → Project → Settings → Domains → Add → validationkit.app
# Vercel auto-generates challenge TXT record, gives you the value to add at registrar

# 3. Wait for DNS-propagation (5–60 min). Vercel auto-issues Let's-Encrypt cert.
```

### G.4 — Certificate issuance [Auto via Let's-Encrypt]

Vercel handles this automatically. Apex + `www` get certs within ~5 min of DNS propagation. No manual action needed.

**Expected behavior:**
- Apex `https://validationkit.app` → 200 OK with Let's-Encrypt cert.
- `https://www.validationkit.app` → 308 to apex (Vercel default).
- HTTP `http://validationkit.app` → 308 to HTTPS (Vercel default).

### G.5 — Edge-Network propagation

Vercel-Fluid-Compute edges propagate globally within 60 s of deploy. For DACH, the relevant edge is **fra1**. Verify:
```bash
curl -I https://validationkit.app
# Look for `x-vercel-id: fra1::...` in headers
```

---

## Part H — CI / CD Pipeline

### H.1 — `.github/workflows/ci.yml` inventory

**File:** `.github/workflows/ci.yml:1-159` — 4 jobs:

1. **`gates`** (lines 19-60) — typecheck + lint + test + eval + doc:check + build. Blocks merge. ✅
2. **`integration`** (lines 62-103) — Postgres-services integration tests. **Only runs on push-to-main**, not on PRs (line 69). Tier-split per Nova-3b Sub-A.
3. **`lighthouse`** (lines 105-128) — Lighthouse-CI with Perf 85 / A11y 95 / BP 95 thresholds. **Only runs on PRs**, blocking via `error` assertions in `.lighthouserc.json`.
4. **`conflict-eval`** (lines 130-158) — LLM conflict-eval, no-ops without `ANTHROPIC_API_KEY`. Runs on PR + push-to-main. Non-blocking.

### H.2 — Critical gaps [Strong]

#### H-S1 — Lighthouse-CI blocking thresholds may break flaky deploys

**File:** `.lighthouserc.json:20-26`

```json
"assertions": {
  "categories:performance": ["error", { "minScore": 0.85 }],
  "categories:accessibility": ["error", { "minScore": 0.95 }],
  "categories:best-practices": ["error", { "minScore": 0.95 }]
}
```

`"error"` means **PR will fail merge if performance drops to 0.84**. Lighthouse-scores are notoriously flaky (±5 between runs). At launch, a single flaky run blocks shipping. **Recommend:**
- Change `"error"` to `"warn"` for the first month of paying-customers.
- Or run `numberOfRuns: 3` (currently 1, line 13) and use median.

#### H-S2 — No production-deploy GitHub-Action

**Verified:** no workflow triggers `vercel --prod` or anything similar. Production deploys happen via Vercel-GitHub-Integration auto-deploying every push-to-main.

**For solo-dev launch:** this is fine. But there's **no approval gate** — a hot-fix push to main goes to prod within 60 s with no human-confirm step.

**Mitigation:**
- Use feature branches for everything during the customer-facing weeks. Merge-to-main = production-deploy.
- Or add a "Production-Deploy" workflow that requires manual approval via `workflow_dispatch` + Environments-protection.

#### H-S3 — Preview-deploys per PR [enabled, used]

Verified — every PR gets a Vercel-Preview-URL via the Vercel-GitHub-Integration. The Lighthouse-CI job at lines 105-128 boots a local Next-server (not the preview URL) for its run, but that's fine.

**Gap:** preview-URLs are publicly accessible by default. For pre-launch this is OK; once paying customers exist, **enable Vercel "Deployment Protection"** (Vercel-Authentication or Password-Protection) on preview-deployments to prevent accidental discovery.

### H.3 — Rollback procedure [Mid]

**File:** `docs/operations/deploy.md:51-58`

Documents the Vercel-dashboard rollback flow:
```
Vercel-Dashboard: Deployments → vorherigen Deploy markieren → "Promote to Production"
CLI: vercel rollback <deployment-id>
```

**Caveat documented:** "DB-Migration-Rollbacks gehen über Drizzle nicht automatisch. Forward-only Migrations." 

**Implication:** if a deploy ships a destructive migration (drop-column), rollback restores OLD code but the new schema persists → old code tries to read the dropped column → 5xx.

**Pre-launch fix:** the migration-on-buildCommand pattern (A.3) makes this worse. Decouple migration from deploy, run migrations manually, and you can rollback the app deploy without schema mismatch.

---

## Production-Readiness — Score per Area

| Area                    | Code-Ready | Infra-Ready | Operational-Ready | Composite |
|-------------------------|------------|-------------|-------------------|-----------|
| A. Vercel + build       | 🟢         | 🟡          | 🟡                | 🟡 |
| B. ENV-Inventar         | 🟢         | 🔴 (most unset) | 🔴 (no schema-validator) | 🔴 |
| C. Database (Neon)      | 🟢         | 🟡 (Neon-Pro not signed up) | 🔴 (no backup-test) | 🟡 |
| D. Inngest              | 🟢         | 🔴 (no account) | 🔴 (signing-key issue) | 🔴 |
| E. Email                | 🟢         | 🔴 (no domain → no DKIM) | 🔴 (no bounce-handler, no template-test) | 🔴 |
| F. Observability        | 🟡 (boundaries OK) | 🔴 (no Sentry) | 🔴 (zero alerting) | 🔴 |
| G. Domain + DNS         | 🟢 (URLs configurable) | 🔴 (not registered) | 🔴 (no DNS plan executed) | 🔴 |
| H. CI/CD                | 🟢         | 🟡 (Lighthouse-CI too strict) | 🟡 (no prod-deploy gate) | 🟡 |

**Overall composite:** 🔴 Red — 5 of 8 areas Red. Code is exceptional, **infrastructure has not been touched**.

---

## Launch Sequence — Recommended Order (8–14 working days)

Day 1–2 (Code-side prep, can run in parallel with rest):
1. Fix B-K1 (`inngest/route.ts` add `runtime` + `signingKey`).
2. Fix A.2 (remove `--frozen-lockfile=false`).
3. Fix A.3 (decouple migration from `buildCommand`).
4. Add runtime env-schema (`apps/web/src/lib/env.ts`).
5. Add Sentry (F.1).
6. Verify `SMTP_FROM` is set in env-schema-required (E.3).

Day 3 (Registrations):
1. Register domain (`validationkit.app` via Cloudflare).
2. Sign up Resend, Inngest-Cloud, Neon-Pro upgrade.
3. Sign up Sentry (free-tier).

Day 4 (DNS + email):
1. Set up 5 DNS records (G.2 — SPF, DKIM, DMARC, A, CNAME).
2. Wait 24h for DKIM propagation.

Day 5 (Vercel-link):
1. Add domain to Vercel project.
2. Verify cert issuance.
3. Set ALL prod ENV vars in Vercel-Dashboard (B.2 checklist).
4. Run `pnpm db:migrate` against prod-Neon DSN manually.
5. Trigger first prod deploy.

Day 6 (Smoke + email):
1. End-to-end: visit `https://validationkit.app/`, click `/login`, magic-link, verify it arrives in real inbox AND passes DKIM (Gmail "show original" → green).
2. Smoke each transactional email via Resend-preview or by triggering Stripe-CLI events.

Day 7–8 (Stripe go-live):
1. Stripe KYC must be complete (out-of-band).
2. Re-run `pnpm stripe:setup-test` against live-mode keys.
3. Register production webhook endpoint in Stripe Dashboard.
4. Smoke a test-payment with the founder's own card.

Day 9–10 (Inngest-Cloud):
1. Link Inngest-Cloud to `https://validationkit.app/api/inngest`.
2. Force-run each cron once via Inngest-Dashboard.
3. Verify the credit-aggregator hits a test workspace.

Day 11–14 (Polish + first customer):
1. Litmus-test all 4 email templates (E.5).
2. Tighten DMARC from `p=none` to `p=quarantine`.
3. Enable Vercel deployment-protection on previews.
4. Tighten Lighthouse-CI from `error` to `warn` (H.2).
5. Onboard first paying customer.

---

## File-Pointer Index — Where everything load-bearing lives

- `vercel.json:1-6` — needs A.1/A.2/A.3 fixes
- `apps/web/next.config.ts:1-71` — well-shaped; review A.4 for image-host additions if Google-OAuth lands
- `apps/web/src/app/api/inngest/route.ts:1-4` — **Kill: fix B-K1 before launch**
- `apps/web/src/app/api/stripe/webhook/route.ts:65-159` — exceptional, no changes
- `packages/db/src/client.ts:28-33` — drop `max:10` to `max:5`; use `-pooler` DSN
- `packages/auth/src/server.ts:108-117` — `from`-fallback to `onboarding@resend.dev` — **fix via required `SMTP_FROM`**
- `apps/web/src/lib/health-check.ts:64-155` — exceptional, surfaces unset secrets as `"disabled"`, not red
- `docs/operations/deploy.md` — needs update for A.3, B.3, F.1
- `docs/operations/secrets-rotation.md` — needs update to remove `INNGEST_SIGNING_KEY` confusion (per B-K1)
- `.github/workflows/ci.yml:105-128` — Lighthouse-CI assertions need tweak before first paying customer
- `.lighthouserc.json:20-26` — `error` → `warn` recommended pre-launch

---

## Open Questions for User (not Discovery-blocking, just operational)

1. **Domain choice:** `validationkit.app` (code's default) vs `validationkit.de` (DACH-trust)? Either works; `.app` was implicitly chosen by codebase.
2. **Sentry vs Axiom for observability?** Sentry simpler, Axiom more flexible.
3. **Neon-Pro upgrade timing:** required for PITR + Query-Insights. ~$19/mo. Sign up Day-3 or wait for first paying customer?
4. **Inngest-Cloud free vs paid:** Inngest-free is 50k step-runs/month — comfortable for first ~10 customers. Upgrade-trigger should be "Inngest dashboard hits 80% quota."
5. **GitHub-App registration:** the `Day-1-Mitigations` work in `docs/audits/2026-05/_synthesis.md` says GitHub-App is gated on 4 mitigations. Is the GitHub-App in-scope for first-paying-customer? If yes, add 2–3 days. If no, the `/api/install-webhook` route should be 503-gated explicitly in vercel-env (which it already is — it returns 503 when `GITHUB_APP_WEBHOOK_SECRET` is unset).
