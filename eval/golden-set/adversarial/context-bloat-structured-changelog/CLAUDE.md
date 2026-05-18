# CLAUDE.md

The current operational guidance is at the top. The Changelog section at
the bottom is the obvious LLM trim-target (high confidence) — old changelog
entries are by definition historical and don't shape new-code decisions.

## Test runner

Vitest. Tests next to source. `pnpm test` before pushing. Pre-commit blocks
lint. Tests in CI. Names read like sentences. Behaviour over implementation.
Mock at boundaries only. Vitest fast enough to run full suite on every
commit if individual tests stay under 50 ms.

## Lint

ESLint with TypeScript-recommended plus `vk-style`. Ruleset in
`packages/eslint-config-vk`. Prefer immutable. Forbid `any`. Require return
types on public exports. No default exports except Next.js route files.
Type-check blocks merges via pre-commit.

## Style

Functional. No classes unless framework demands. Pure functions over
methods. Composition over inheritance. Named exports. Three similar
lines beats a wrong abstraction. Validate at boundaries. No comments
unless WHY non-obvious.

## Naming

camelCase / PascalCase / kebab-case / SCREAMING_SNAKE_CASE. Database
columns snake_case via Drizzle. React components match file name. Hooks
prefix with `use`. Server actions in `lib/<feature>-actions.ts`.

## Imports

Absolute via `@/`. Relative `./` for same-package. Use `exports` map, no
deep imports into `dist/`. New exports need CHANGELOG entry.

## Changelog

### v0.0.16 — 2026-05-18 — Sprint 1.1 — Stripe Live-Mode Prep

Solo Indie $19 → $25 (Sentry/Snyk parity). Added agency_scale_plus tier
($1499/mo annual-only, MSA-required). 20% annual discount default. EU
geo-IP VAT-inclusive display via x-vercel-ip-country. Stripe Checkout
hardening: automatic_tax, tax_id_collection, allow_promotion_codes.
stripeReconcile cron 0 3 * * *. SubscriptionBanner on /dashboard for
past_due / canceled / incomplete states.

### v0.0.15 — 2026-05-18 — Sprint 1.0 — GitHub-App Mitigations Slice

dpa_acceptance table + /trust/dpa acceptance UI. /trust/sub-processors.json
and .xml static feeds. @vk/github-app/manifest.ts scope-pinned permission
set with permissionsFor() that throws rather than silently downgrades.
install-webhook reconciliation extended with suspend/unsuspend handlers.
9 new golden-set entries (21 → 30). eval/conflicts per-band FPR + N=3 +
persist.

### v0.0.14 — 2026-05-17 — Sprint 0.14 — Polish + Tester-Readiness

@vk/llm selectModel abstraction. llmDisabledFinding placeholder. runAudit
includeLLM option. OnboardingChecklist on /dashboard. Loading skeletons on
/dashboard, /scans, /customers, /billing. Empty-state polish on /scans,
/drifts, /trust, /login. LoginForm migrated to shadcn Alert. Tester-invite
template in docs/outreach/.

### v0.0.13 — 2026-05-17 — Sprint 0.13 — Deterministic Fixes + Freemium Gate

@vk/fixes 4 deterministic generators (unused-agent, duplicate-guidance,
stale-reference, token-overflow-trim). @vk/billing 5-tier config.
Stripe Test-Mode skeleton: /api/stripe/webhook, createCheckoutSession,
createBillingPortalSession. /billing page. Hard-gate on AddCustomerForm.
FindingsList client component with per-finding and batch Preview-diff +
Download-patch.

### v0.0.12 — 2026-05-17 — Sprint 0.12 — Auto-Tracking + Visual Connections

Inngest auto-track-repos cron. /api/notify-update HMAC endpoint.
@vk/dashboard-graph package + React Flow wrapper. /dashboard graph-view
toggle. SSE /api/events/stream + useDashboardEvents hook. Auto-drift
detection on new audit. Last-activity badge on each repo card.

### v0.0.11 — 2026-05-17 — Sprint 0.11 — Dashboard Shell

shadcn init + theme tokens. /dashboard route + 3-zone layout. Severity
bänder CVA. /customers page → list-table with shadcn Table. Saved-views
URL-state scaffolding. AuditForm + ReportView migration to shadcn.

### v0.0.10 — 2026-05-16 — Sprint 0.10 — Light-Code Polish

Final Phase-0.5-pre polish work. /trust audit-trail export. Mom-Test
script in docs/handbook-extras/. /compete-check refresh in
docs/research/compete-2026-Q2.md.
