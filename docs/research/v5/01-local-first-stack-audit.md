# 01 — Local-First Stack Audit (v5 Hardcore Local-Only Mode)

> **Track A · Research for ValidationKit/Sondr v5-Refactor · 2026-05-16**
>
> Scope: Re-map PRD v3.1 §16 stack (Vercel + Clerk + Neon + Stripe + Resend + Sentry + PostHog) to fully-local equivalents that run on a single MacBook (Darwin 24.6.0) until Phase-0-Gate (5 Agency-LOIs in M3) is cleared. No paid SaaS, no domain purchase, no npm-publish, no GitHub-paid, no lawyer-checks until M3 cash signal exists.

---

## TL;DR — One-Table Verdict

| # | Component | PRD v3.1 (cloud) | Phase 0 (local, Day 1) | Phase 1 (M3+, free-tier hosted) | Phase 2 (M9+, paid) | Verdict |
|---|---|---|---|---|---|---|
| 1 | Auth | Clerk Marketplace | **Better-Auth** (OSS, Postgres-backed) | Better-Auth on hosted Postgres | Clerk *only if* SSO/SAML needed | Replaceable Day 1 |
| 2 | DB | Neon + pgvector | **`pgvector/pgvector:pg17` Docker** | Neon free tier (0.5 GB) | Neon Scale ($19/mo) | Replaceable Day 1 |
| 3 | Cache | Vercel Runtime Cache | **Dragonfly Docker** (Redis-proto) or in-process `lru-cache` | Upstash Redis free (10k cmd/day) | Upstash Pro / self-host Dragonfly VPS | Replaceable Day 1 |
| 4 | Workflows | Vercel Workflow DevKit (DurableAgent) | **Inngest Dev Server (Docker)** + Postgres + Redis | Inngest Cloud free (50k steps/mo) or Trigger.dev v3 self-host | Inngest Pro ($20/mo) or Trigger.dev Cloud | Replaceable Day 1, but lock-in risk if you use `DurableAgent` API directly — see Hard Mistakes |
| 5 | LLM Routing | Vercel AI Gateway | **AI SDK direct → Anthropic API**, optional **LiteLLM proxy Docker** for caching | LiteLLM on Fly.io free (3 micro VMs) | LiteLLM enterprise / Vercel AI Gateway pay-as-you-go | Replaceable Day 1 |
| 6 | Billing | Stripe direkt | **No billing** in Phase 0 (no real customers yet). Stripe CLI sandbox for *future* integration tests only. | Stripe Test Mode + real Stripe account (free until first $0.30 transaction) | Stripe live ($0.30 + 2.9 %/tx) | Replaceable Day 1 (no real $) |
| 7 | Email | Resend / Postmark | **Mailpit Docker** (catch all SMTP locally) | Resend free (3k/mo, 100/day) | Resend Pro ($20/mo) or Postmark | Replaceable Day 1 |
| 8 | Error Tracking | Sentry SaaS | **Nothing** (use `console.error` + log file) or **GlitchTip Docker** if needed | GlitchTip self-host on VPS / Sentry free (5k errors/mo) | Sentry Team ($26/mo) | Replaceable Day 1 |
| 9 | Product Analytics | PostHog SaaS | **Nothing in Phase 0** (no users yet). Optional: **Umami Docker** | PostHog Cloud free (1M events/mo) or Umami self-host | PostHog paid ($0 + usage) | Replaceable Day 1 |
| 10 | Hosting | Vercel | **`next dev` locally** (Turbopack) | Vercel Hobby (free, non-commercial) — **or Coolify on $4 Hetzner VPS** | Vercel Pro $20/mo or stay on Coolify | Replaceable, but Cache Components ties you tighter in Phase 1 |
| 11 | CLI (`validationkit-cli` / `contextforge-cli`) | n/a | **Pure local: Node + Anthropic API key from env**, no cloud calls | Same — OSS users self-host | Same | Truly Vendor-Free Day 1 |

**Bottom line:** 10 of 11 components are **Replaceable Day 1** with zero cloud dependency. The single exception is the *AI provider* — you still need a live Anthropic API key (or Ollama for fully-offline LLM, but quality drop is material). For everything else, `docker-compose up` is the whole stack.

---

## Per-Component Deep Dive

### 1. Auth — `Better-Auth`

**The decision:** Better-Auth (v1.x, late 2025+) is the 2026 default for new TypeScript projects per multiple comparison sources. Auth.js v5 maintainers themselves now direct new projects toward Better-Auth ([PkgPulse 2026](https://www.pkgpulse.com/blog/better-auth-vs-lucia-vs-nextauth-2026), [BuildPilot 2026](https://trybuildpilot.com/625-better-auth-vs-lucia-vs-nextauth-2026)). Lucia is deprecated (March 2025 announcement, now educational resources only).

**Why local-first:** Better-Auth runs in-process inside Next.js, stores sessions in Postgres (same one as your app data), exposes GitHub OAuth + Email Magic Link as official plugins. No external service, no API key, no SDK round-trip.

**Phase 0 setup:** Add `better-auth` package, configure `email-otp` plugin (magic link), `github` social-provider. Sessions live in Postgres table. GitHub OAuth app: register a free dev OAuth app pointing at `http://localhost:3000/api/auth/callback/github` — no domain needed.

**Phase 1 migration:** None. Better-Auth scales horizontally with your Postgres. Move to managed Postgres when M3 gate clears.

**Phase 2 trigger:** Switch to Clerk only if you need SAML/SSO for enterprise customers (PRD §11.3 Phase-3-MM trigger). Costs ~$25/MAU at enterprise scale — defer until contract signed.

**Citation justification:** Better-Auth ships magic links + GitHub OAuth as first-class plugins, lean core, no vendor lock-in ([PkgPulse 2026](https://www.pkgpulse.com/blog/better-auth-vs-lucia-vs-nextauth-2026)).

---

### 2. DB — `pgvector/pgvector:pg17` Docker

**The decision:** Postgres + pgvector via the official Docker image. Drop-in `pgvector/pgvector:pg17` matches Neon's pgvector version exactly, so the Phase-0 → Phase-1 migration is `pg_dump | pg_restore`.

**Why not SQLite + sqlite-vec:** Three blockers for ValidationKit's case:
1. **Search algorithm gap:** sqlite-vec only does cosine similarity, while pgvector supports HNSW + IVFFlat + Euclidean ([dev.to RAG comparison](https://dev.to/jonbiz/implementing-a-rag-system-inside-an-rdbms-sqlite-and-postgres-with-sqlite-vec-pgvector-4d5h)). Validation-loop semantic search (PRD Pre-Validation step) benefits from HNSW once corpus crosses ~5k chunks.
2. **Maturity gap:** pgvector is far more battle-tested ([Sarah Glasmacher 2026](https://www.sarahglasmacher.com/how-to-pgvector-docker-local-vector-database/)).
3. **Production parity:** Neon = Postgres + pgvector. SQLite-locally / Postgres-in-prod = two divergent code paths. Solo-founder cannot afford that drift.

**Why not DuckDB:** DuckDB is an analytics workhorse, not a row-store with concurrent writes. Wrong tool for an interactive web-app auth + workflow DB.

**Phase 0 setup:** Single docker-compose service. Connection string: `postgres://postgres:postgres@localhost:5432/validationkit`. Drizzle migrations work unchanged from PRD v3.1.

**Phase 1 migration:** `pg_dump` from local Docker, `pg_restore` to Neon. Free tier = 0.5 GB storage (sufficient for first 100 users); upgrade trigger is storage, not features. Vector search performance bottleneck is LLM latency (500ms–3s) not pgvector (~10ms) ([Encore blog 2026](https://encore.dev/blog/you-probably-dont-need-a-vector-database)), so no architecture change.

**Phase 2 trigger:** Neon Scale ($19/mo) when concurrent connections > 100 or storage > 10 GB.

---

### 3. Cache — `Dragonfly` (preferred) or `lru-cache` (zero-infra)

**The decision:** Two-tier recommendation:
- **In-process `lru-cache` (npm)** for Phase 0 if you can tolerate per-process eviction (single-user dev mode).
- **Dragonfly Docker** if you want Redis-protocol parity with future Upstash/Redis-cloud migration.

**Why Dragonfly over Redis:** Same Redis wire protocol (drop-in), multi-core by default, ~25–30 % less memory for same workload, 25× throughput at extreme scale ([Dragonfly README](https://github.com/dragonflydb/dragonfly), [Markaicode 2026](https://markaicode.com/redis-vs-dragonfly-caching-strategies/)). For solo-dev: same Docker line, better headroom for free.

**Why not Redis:** Nothing wrong with it. If you already know Redis muscle-memory, use `redis:7-alpine`. The differentiator is throughput-per-RAM, irrelevant at solo scale.

**Phase 0 setup:**
```
docker run -d --name cache -p 6379:6379 \
  --ulimit memlock=-1 \
  docker.dragonflydb.io/dragonflydb/dragonfly:latest \
  --cache_mode --maxmemory 512mb
```
([OneUptime 2026 guide](https://oneuptime.com/blog/post/2026-02-08-how-to-run-dragonfly-in-docker-redis-compatible-cache/view))

**Phase 1 migration:** Upstash Redis free tier (10k commands/day) is fine for first ~50 active users. Switch via single env var.

**Phase 2 trigger:** Upstash Pro $0.20/100k requests or self-host Dragonfly on $6 Hetzner VPS when commands cross 10k/day.

**Hard mistake to avoid:** Do NOT cache LLM responses in Phase 0 with semantic-similarity (fuzzy matching). Start with exact-prompt-hash caching. Semantic caching needs another embedding round-trip per request and is over-engineering for <1k req/day.

---

### 4. Workflow / Background Jobs — `Inngest Dev Server` (locally Docker, then Cloud free)

**The decision:** Inngest Dev Server in Docker for Phase 0. Vercel Workflow DevKit is "fully portable" per its docs ([workflow-sdk.dev](https://workflow-sdk.dev/)) — but the *DurableAgent* abstraction is a Vercel-specific surface; the underlying workflow primitives are portable. So either:
- **Path A (recommended):** Skip DurableAgent entirely. Use Inngest functions for durable execution. Same step-based API, OSS, Docker-runnable, well-documented Postgres backend.
- **Path B:** Use Workflow SDK locally per its self-host claim, then pivot if local DX is rough. Risk: smaller community, less battle-testing.

**Why Inngest over Trigger.dev v3 for Phase 0:** Both can self-host. Trigger.dev v3 self-host is actually more mature ([PkgPulse 2026](https://www.pkgpulse.com/blog/hatchet-vs-trigger-dev-v3-vs-inngest-durable-workflows-2026)), but Inngest's Dev Server is *one Docker command* with no Postgres requirement in dev mode. Trigger.dev needs the full Postgres + Redis stack from minute one. For solo-founder: Inngest wins on time-to-first-job. The Phase-1 trade is symmetric (both have free clouds).

**Why not BullMQ:** BullMQ + Redis is fine for "send email"-type jobs but lacks step-based durability, retries, sleep-until, event-driven fan-out. ValidationKit's validation-loop is a multi-step DAG with LLM calls that can take 30–120s — exactly the case where step-based engines beat queue-based ([PkgPulse comparison](https://www.pkgpulse.com/blog/hatchet-vs-trigger-dev-v3-vs-inngest-durable-workflows-2026)).

**Why not Hatchet:** Purpose-built for AI DAGs (PRD Pre-Validation matches), but self-host needs Postgres + RabbitMQ. One more moving piece than Inngest. Reconsider in Phase 2 if validation-loop becomes a >10-step DAG.

**Phase 0 setup (Feb 2026+):** Note: `inngest/inngest:latest` now *requires* `INNGEST_SIGNING_KEY` + `INNGEST_EVENT_KEY` env vars or it crash-loops ([Inngest docs 2026](https://www.inngest.com/docs/self-hosting)). Set dummy values for local dev:
```
docker run -d --name inngest -p 8288:8288 -p 8289:8289 \
  -e INNGEST_SIGNING_KEY=signkey-local-dev \
  -e INNGEST_EVENT_KEY=eventkey-local-dev \
  inngest/inngest:latest dev -u http://host.docker.internal:3000/api/inngest
```

**Phase 1 migration:** Inngest Cloud free tier (50k steps/mo + 1k functions). Switch by changing INNGEST_BASE_URL env var.

**Phase 2 trigger:** Inngest Pro ($20/mo) at >50k steps. Or migrate to Trigger.dev v3 self-host on Hetzner if you want zero vendor in production.

---

### 5. LLM Routing — `AI SDK direct → Anthropic`, optional `LiteLLM` for caching

**The decision:** Phase 0 = AI SDK direct calls to Anthropic API. No proxy. No gateway. Add LiteLLM Docker proxy *only* when (a) cost > $50/day or (b) you need a second provider (Google/OpenAI) with shared metering.

**Why this is OK Day 1:** Vercel AI Gateway is "zero markup on tokens" with $5/mo free credit ([Vercel docs](https://vercel.com/docs/ai-gateway/pricing)) — but you still pay Anthropic. The Gateway's value is routing + observability + caching, not cost. For Phase 0 single-provider, the value is near zero, the lock-in is non-zero. Skip.

**Why LiteLLM in Phase 1:** Best open-source self-hosted router per multiple 2026 reviews ([openalternative.co 2026](https://openalternative.co/alternatives/vercel-ai-gateway), [PkgPulse 2026](https://www.pkgpulse.com/guides/portkey-vs-litellm-vs-openrouter-llm-gateway-2026)). Supports 100+ providers, OpenAI-compatible API, Redis-based exact-prompt caching. Limitation: no semantic caching ([PkgPulse 2026](https://www.pkgpulse.com/guides/portkey-vs-litellm-vs-openrouter-llm-gateway-2026)) — fine for Phase 0–1.

**Why not Portkey OSS:** Has semantic caching (30–50 % cost reduction reported, [PkgPulse 2026](https://www.pkgpulse.com/guides/portkey-vs-litellm-vs-openrouter-llm-gateway-2026)) but heavier setup and the killer feature (compliance certs SOC2/HIPAA/ISO27001) is only on the managed tier. Defer to Phase 2.

**Why not OpenRouter:** SaaS-only, 5 % markup on tokens, no self-host path. Solid as a *fallback* (one extra provider via LiteLLM) but not a primary.

**Phase 0 setup:** Set `ANTHROPIC_API_KEY` in `.env.local`. `import { anthropic } from '@ai-sdk/anthropic'`. Done. Implement a tiny exact-hash cache layer yourself in Postgres (`prompt_sha256` → `response`) — 30 lines of code, no infra.

**Hard mistake to avoid:** Do NOT use the Vercel AI Gateway provider in `@ai-sdk` until Phase 1. The provider import is a one-line swap, but writing it that way now nudges future-you toward Vercel-as-default.

---

### 6. Billing — `nothing` in Phase 0

**The decision:** No billing layer until first paying agency customer (M3 Phase-0-Gate). Per PRD v3.1, first revenue is Productized-Service invoiced manually via Stripe Payment Link or wire transfer. The full Stripe SDK integration ships in Phase 1 with the Studio Tier ($79/$199).

**Why this is correct:** Building Stripe in Phase 0 = building infra for revenue you don't have. Pure CCC-vs-Mom-Test inversion. The Hard Mistake here is *premature billing*.

**For ad-hoc invoicing:** Stripe Payment Links work without code. Create one per agency engagement. Free, no integration.

**Phase 0 setup:** None. If you absolutely need to dogfood Stripe webhooks during Phase 0 *for the validation-loop product itself* (not for billing your customers), use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` ([Stripe docs](https://docs.stripe.com/stripe-cli/use-cli)).

**Phase 1 migration:** Real Stripe account (free until first transaction). Stripe Test Mode for CI. ~1 day of integration work.

**Phase 2 trigger:** Stripe Tax + Subscriptions only when MRR > $5k.

---

### 7. Email — `Mailpit` Docker

**The decision:** Mailpit Docker for Phase 0 dev. MailHog has been dead since 2020 ([SendPit 2026](https://sendpit.com/en/blog/mailhog-is-dead), [SendPigeon 2026](https://sendpigeon.dev/blog/mailpit-vs-mailhog)).

**Why Mailpit wins:** 100–200 emails/sec ingest, full-text search across subject/body/headers/recipients, ~half the Docker image size, MailHog-compatible API for migration. Same default ports as MailHog (SMTP 1025, Web UI 8025).

**Why this matters for ValidationKit:** Magic-link auth in Better-Auth sends emails. Cold-email warm-up tests in the validation loop send emails. You need to *see* what was sent without paying Resend $20/mo and without polluting real inboxes. Mailpit captures it all locally.

**Phase 0 setup:**
```
docker run -d --name mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
```
App config: `SMTP_HOST=localhost`, `SMTP_PORT=1025`, no auth. View captured emails at `http://localhost:8025`.

**Phase 1 migration:** Resend free tier (3k/mo, 100/day) is sufficient through M9 if you send transactional only. Postmark $15/mo if Resend rate-limit hits.

**Phase 2 trigger:** Cold-email send volume > 3k/mo (PRD §10.2 warm-cold). Postmark or Mailgun.

---

### 8. Error Tracking — `Nothing` (or GlitchTip if it itches)

**The decision:** Phase 0 = `console.error` + `tail -f /var/log/validationkit.log` is sufficient. You are the only user. If you genuinely want a UI, GlitchTip Docker is the right pick — Sentry-SDK-compatible so your Phase-1 migration to Sentry SaaS is zero-code.

**Why GlitchTip over Sentry self-host:** Sentry's full self-host stack needs Postgres + ClickHouse + Kafka + Redis + Snuba + Symbolicator. GlitchTip stores everything in Postgres, one container ([SSOJet 2026](https://ssojet.com/blog/best-sentry-alternatives-error-tracking), [DanubeData 2026](https://danubedata.ro/blog/self-host-sentry-glitchtip-error-tracking-2026)). MIT licensed.

**Why not PostHog for errors:** PostHog's error tracking is shallower than dedicated tools, and PostHog is much heavier infra. Use for analytics if at all, not errors.

**Phase 0 setup:** Skip. If forced: `glitchtip/glitchtip:latest` Docker, point Next.js `@sentry/nextjs` SDK at `http://localhost:8000`.

**Phase 1 migration:** Sentry free (5k errors/mo) — SDK already there, swap DSN.

**Phase 2 trigger:** Sentry Team $26/mo when errors > 5k/mo.

---

### 9. Product Analytics — `Nothing` in Phase 0 (no users to analyze)

**The decision:** Phase 0 has zero users. Analytics is a Phase-1 problem. When the time comes, choose **Umami** over PostHog or Plausible for the solo-founder use case.

**Why Umami:** Lighter Docker image (~256–512 MB RAM, runs on a Raspberry Pi), MIT license, single Postgres dependency ([SelfHostWise 2026](https://selfhostwise.com/posts/self-hosted-website-analytics-in-2026-umami-vs-plausible-complete-guide/), [OpenPanel 2026](https://openpanel.dev/articles/self-hosted-web-analytics)).

**Why not Plausible:** Better UX, but needs ClickHouse + Elixir runtime + Postgres. ~4× the infrastructure footprint. Overkill until you have multiple stakeholders looking at dashboards.

**Why not PostHog self-host:** Full PostHog (analytics + replays + feature flags + experiments + errors) is the heaviest of the three. PostHog Cloud free tier (1M events/mo) is genuinely generous — use the cloud when you reach Phase 1, don't self-host.

**Phase 1 trigger:** First marketing site / waitlist landing page. Add Umami (or PostHog Cloud free) script tag.

---

### 10. Hosting in Dev — `next dev` locally, defer Vercel

**The decision:** `pnpm dev` with Turbopack on localhost. Period. No Vercel until Phase 1 *and only if* free-tier limits aren't crossed.

**When Vercel becomes necessary:**
- Public demo URL for sales calls (Phase 1, M3+). Until then, `localhost` + Loom recordings work.
- Edge functions for low-latency users globally — not a Phase 0–2 concern.
- Cron jobs — Inngest handles this OSS-side.

**Free-tier alternatives in Phase 1:**
- Vercel Hobby: free *for non-commercial* — gray zone for a future SaaS. Read the ToS before betting on it.
- Coolify on $4–6/mo Hetzner VPS ([DevMorph 2026](https://www.devmorph.dev/blogs/stop-paying-vercel-tax-self-host-nextjs-coolify-vps)). Vercel-like git-push deploys, full Docker isolation, no bandwidth charges.
- Northflank / Railway free tiers — fine for a single demo box.

**Phase 2 trigger:** When (a) bandwidth > free-tier or (b) sales velocity demands faster deploys than Coolify can give. Vercel Pro $20/user/mo is fair once revenue exists.

---

### 11. OSS CLI Tools — `validationkit-cli` and `contextforge-cli`

**The decision:** Both CLIs are pure Node.js scripts. Zero cloud calls except to the LLM provider the user configured (Anthropic by default, anything via LiteLLM proxy).

**Confirmed zero-dependency-on-cloud:**
- No telemetry to Vercel / Anthropic / anywhere.
- No npm-publish required for Phase 0 (run via `pnpm dlx github:validationkit-ai/cli`).
- No domain required.
- No GitHub-paid features required (public repo, public Actions, public releases all free).

**The one external dependency:** User must supply an `ANTHROPIC_API_KEY` (or compatible OpenAI-format proxy URL). This is documented as "BYO-LLM" — fully consistent with the OSS-MIT-Core principle in PRD v3.1.

**Phase 0 setup:** `npx validationkit init` in any directory. Reads `.env` for API key. Writes results to `./.validationkit/`. Done.

**Phase 1 evolution:** Optional `--share <url>` flag to push results to the Hosted Web App for sharing. Default stays local.

**Verdict:** Truly Vendor-Free Day 1. This is the load-bearing OSS-Trust pillar (CLAUDE.md Constraint #6).

---

## Phase-0 Bootstrap: `docker-compose.yml`

Save as `infra/docker-compose.yml` in repo root. One `docker-compose up` brings up the entire backend.

```yaml
version: "3.9"

services:
  db:
    image: pgvector/pgvector:pg17
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: validationkit
    ports:
      - "5432:5432"
    volumes:
      - vk_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  cache:
    image: docker.dragonflydb.io/dragonflydb/dragonfly:latest
    command: ["--cache_mode", "--maxmemory", "512mb"]
    ulimits:
      memlock: -1
    ports:
      - "6379:6379"

  mail:
    image: axllent/mailpit:latest
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    environment:
      MP_MAX_MESSAGES: 5000
      MP_SMTP_AUTH_ACCEPT_ANY: 1
      MP_SMTP_AUTH_ALLOW_INSECURE: 1

  inngest:
    image: inngest/inngest:latest
    command: >
      dev -u http://host.docker.internal:3000/api/inngest
    environment:
      INNGEST_SIGNING_KEY: signkey-local-dev-not-secret
      INNGEST_EVENT_KEY: eventkey-local-dev-not-secret
    ports:
      - "8288:8288"  # Dashboard
      - "8289:8289"  # SDK comms
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      db:
        condition: service_healthy

  # OPTIONAL — enable later
  # litellm:
  #   image: ghcr.io/berriai/litellm:main-latest
  #   ports:
  #     - "4000:4000"
  #   environment:
  #     ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
  #     REDIS_HOST: cache
  #   depends_on:
  #     - cache

  # OPTIONAL — only if you want a UI for errors
  # glitchtip:
  #   image: glitchtip/glitchtip:latest
  #   ports:
  #     - "8000:8080"
  #   environment:
  #     DATABASE_URL: postgres://postgres:postgres@db:5432/glitchtip
  #     SECRET_KEY: local-dev-not-secret
  #     PORT: "8080"
  #   depends_on:
  #     db:
  #       condition: service_healthy

volumes:
  vk_pg_data:
```

`.env.local` (next to `next dev`):
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/validationkit
REDIS_URL=redis://localhost:6379
SMTP_HOST=localhost
SMTP_PORT=1025
INNGEST_BASE_URL=http://localhost:8288
INNGEST_SIGNING_KEY=signkey-local-dev-not-secret
INNGEST_EVENT_KEY=eventkey-local-dev-not-secret
ANTHROPIC_API_KEY=sk-ant-...  # The only real secret
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

That's the entire Phase-0 stack. RAM footprint ~1.5 GB. Disk ~2 GB. Cold-start ~15s.

---

## Phase-1 Migration Cost Estimate (M3 → M9)

| Component | Migration step | Effort | $/mo at M9 estimate |
|---|---|---|---|
| Auth | None (same Better-Auth) | 0 h | $0 |
| DB | `pg_dump` → `psql neondb_url < dump.sql` | 1 h | $0 (Neon free) → $19 if scale |
| Cache | Swap REDIS_URL env to Upstash | 0.5 h | $0 (free tier) |
| Workflows | Swap INNGEST_BASE_URL + add INNGEST_SIGNING_KEY (real) | 1 h | $0 (Inngest free) |
| LLM | Optional: add LiteLLM container on Coolify VPS | 4 h | $5 (Hetzner) |
| Billing | Real Stripe account + webhook handler + Subscription model | 16 h | $0 + transaction fees |
| Email | Replace SMTP_HOST with Resend API call (via Resend SDK) | 3 h | $0 (free tier) |
| Errors | Add real Sentry DSN | 0.5 h | $0 (free tier) |
| Analytics | Add Umami script tag OR PostHog Cloud snippet | 1 h | $0 |
| Hosting | `vercel deploy` OR `coolify deploy` | 4 h | $0–6 |

**Total Phase-1 migration:** ~31 hours of work. **Total recurring cost at M9:** $5–25/mo. The 80/20 cost driver is Stripe transaction fees (variable) and Anthropic API spend (variable). The fixed SaaS overhead is genuinely near-zero.

---

## Hard Mistakes to Avoid (Vercel-Specific Lock-In)

These are the things that, if you adopt them in Phase 0, cost you weeks of unwinding in Phase 1 if you decide to self-host on Coolify:

1. **`cacheLife()` and `cacheTag()` semantics in Next.js 16 Cache Components.** Per [GitHub issue #89439](https://github.com/vercel/next.js/discussions/89439): on Vercel, runtime overrides framework-level cache headers; self-host has different stale-while-revalidate behavior. Code that "works" on Vercel may silently mis-behave on Coolify. **Mitigation:** stick with explicit `cacheLife("seconds: N")` values, never rely on Vercel's data-cache auto-revalidation defaults. Or skip Cache Components in Phase 0 entirely and use boring `revalidate: N` until Phase 1.
2. **`@vercel/blob` for file storage.** Easy lock-in. Use S3-compatible `minio` Docker locally, swap to Cloudflare R2 / Backblaze B2 in Phase 1. Never `@vercel/blob` for OSS users.
3. **`@vercel/kv` (Vercel KV).** Same trap. Stay on Redis-protocol (Dragonfly/Upstash).
4. **`@vercel/postgres`.** Identical Neon underneath; use Neon's connection string directly so your DATABASE_URL is portable.
5. **Vercel Cron Jobs.** Tied to vercel.json. Use Inngest scheduled functions instead — they're identical syntax everywhere.
6. **Vercel AI Gateway as the *only* AI provider import.** Add it later as an alternative; never as the default.
7. **`DurableAgent` API of the Workflow SDK (if you adopt the SDK).** The base step-based API is portable; the high-level Agent helpers are Vercel-marketed and may not be fully OSS-stable. Inngest is the safer Phase-0 bet.
8. **Multi-Instance Cache Coordination.** Per [Next.js self-host docs](https://nextjs.org/docs/app/guides/self-hosting): single-instance self-host is fully supported, multi-instance requires custom cache handler. Don't go multi-instance until Phase 2 — you don't need it.
9. **Edge runtime in route handlers.** Lock-in to Vercel/Cloudflare Workers. Stay on Node runtime; switch to edge only when latency demands it.
10. **Vercel Speed Insights / Web Analytics.** Tiny package, real lock-in. Use Umami / Plausible self-host or PostHog Cloud.

---

## Verdict per Component

| Component | Verdict |
|---|---|
| Auth (Better-Auth) | **Replaceable Day 1** |
| DB (Postgres + pgvector) | **Replaceable Day 1** |
| Cache (Dragonfly) | **Replaceable Day 1** |
| Workflows (Inngest) | **Replaceable Day 1**, *with caveat* — avoid Workflow SDK's `DurableAgent` API |
| LLM Routing (AI SDK direct → optional LiteLLM) | **Replaceable Day 1** |
| Billing (none in Phase 0; Stripe in Phase 1) | **Replaceable Day 1** (it's truly absent) |
| Email (Mailpit) | **Replaceable Day 1** |
| Error tracking (nothing or GlitchTip) | **Replaceable Day 1** |
| Analytics (none Phase 0; Umami Phase 1) | **Replaceable Day 1** |
| Hosting (`next dev` Phase 0; Coolify or Vercel Phase 1) | **Replaceable Phase 1** (Cache Components creates soft lock-in if used) |
| CLI tooling | **Truly Vendor-Free Day 1** |

**Net assessment:** PRD v3.1 §16 is a **good-as-default-Phase-2-target stack** — but every component except for the LLM provider itself has a free, OSS, Docker-runnable substitute that you can install in 30 minutes. The Hardcore Local-Only Phase-0 commitment is technically sound, and the migration path to Phase-1-free-tiers is short (~31 hours of dev work total). The strategic risk is *not* technical; it's psychological — running on Mailpit + GlitchTip + Inngest-Dev-Server is "ugly" compared to Vercel + Clerk + Sentry + Resend, and the founder will be tempted to upgrade prematurely. Discipline-cost is higher than infra-cost.

---

## Recommended next moves (out-of-scope but flagged)

1. **ADR-0018 "Phase-0-Stack-Local-First"** — capture this decision so it survives the inevitable "let's just add Clerk to ship faster" moment in M2.
2. Add a `make bootstrap` target in repo root that wraps `docker-compose up -d && pnpm install && pnpm db:push && pnpm dev`.
3. Document the "OSS-Self-Host" path in the README as identical to the Phase-0 stack — this kills two birds with one Docker-compose.
4. Re-check Inngest Dev Server's signing-key requirement quarterly — it changed in Feb 2026 and may change again.
5. Track Better-Auth release cadence; the library is young (late 2025), so quarterly updates expected.

---

## Sources

- [PkgPulse: better-auth vs Lucia vs NextAuth 2026](https://www.pkgpulse.com/blog/better-auth-vs-lucia-vs-nextauth-2026)
- [BuildPilot: Better Auth vs Lucia vs NextAuth 2026](https://trybuildpilot.com/625-better-auth-vs-lucia-vs-nextauth-2026)
- [LogRocket: best auth library Next.js 2026](https://blog.logrocket.com/best-auth-library-nextjs-2026/)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [Sarah Glasmacher: pgvector Docker 2026](https://www.sarahglasmacher.com/how-to-pgvector-docker-local-vector-database/)
- [dev.to: RAG inside RDBMS — sqlite-vec vs pgvector](https://dev.to/jonbiz/implementing-a-rag-system-inside-an-rdbms-sqlite-and-postgres-with-sqlite-vec-pgvector-4d5h)
- [Encore: you probably don't need a vector database](https://encore.dev/blog/you-probably-dont-need-a-vector-database)
- [PkgPulse: Hatchet vs Trigger.dev vs Inngest 2026](https://www.pkgpulse.com/blog/hatchet-vs-trigger-dev-v3-vs-inngest-durable-workflows-2026)
- [Inngest self-host docs 2026](https://www.inngest.com/docs/self-hosting)
- [Inngest dev server docs](https://www.inngest.com/docs/dev-server)
- [Workflow SDK (Vercel)](https://workflow-sdk.dev/)
- [Vercel Workflow GitHub](https://github.com/vercel/workflow)
- [PkgPulse: Portkey vs LiteLLM vs OpenRouter 2026](https://www.pkgpulse.com/guides/portkey-vs-litellm-vs-openrouter-llm-gateway-2026)
- [OpenAlternative: Vercel AI Gateway alternatives 2026](https://openalternative.co/alternatives/vercel-ai-gateway)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing)
- [Stripe CLI docs](https://docs.stripe.com/stripe-cli/use-cli)
- [Stripe webhooks docs](https://docs.stripe.com/webhooks)
- [SendPigeon: Mailpit vs MailHog 2026](https://sendpigeon.dev/blog/mailpit-vs-mailhog)
- [SendPit: MailHog is dead 2026](https://sendpit.com/en/blog/mailhog-is-dead)
- [Mailpit GitHub](https://github.com/axllent/mailpit)
- [SSOJet: Sentry alternatives 2026](https://ssojet.com/blog/best-sentry-alternatives-error-tracking)
- [DanubeData: self-host Sentry / GlitchTip 2026](https://danubedata.ro/blog/self-host-sentry-glitchtip-error-tracking-2026)
- [SignOz: top 8 Sentry alternatives 2026](https://signoz.io/comparisons/sentry-alternatives/)
- [OpenPanel: self-hosted analytics 2026](https://openpanel.dev/articles/self-hosted-web-analytics)
- [SelfHostWise: Umami vs Plausible 2026](https://selfhostwise.com/posts/self-hosted-website-analytics-in-2026-umami-vs-plausible-complete-guide/)
- [Next.js cacheComponents API ref](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [Next.js self-host docs](https://nextjs.org/docs/app/guides/self-hosting)
- [DevMorph: stop paying Vercel tax — Coolify](https://www.devmorph.dev/blogs/stop-paying-vercel-tax-self-host-nextjs-coolify-vps)
- [Vercel data cache blog](https://vercel.com/blog/vercel-cache-api-nextjs-cache)
- [GitHub discussion: Cache-Control headers Vercel #89439](https://github.com/vercel/next.js/discussions/89439)
- [Dragonfly GitHub](https://github.com/dragonflydb/dragonfly)
- [OneUptime: Dragonfly in Docker 2026](https://oneuptime.com/blog/post/2026-02-08-how-to-run-dragonfly-in-docker-redis-compatible-cache/view)
- [Markaicode: Redis vs Dragonfly 2026](https://markaicode.com/redis-vs-dragonfly-caching-strategies/)
- [OpenNext](https://opennext.js.org/)

*— end of 01-local-first-stack-audit.md*
