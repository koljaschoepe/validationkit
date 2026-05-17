# Changelog

> All notable changes to ValidationKit. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with our own `Severity` and `Compliance` sections where relevant.

> **Version policy:** until M3 Phase-0-Gate-Pass, we ship `0.0.x` patch bumps per sprint. Post-Gate, semantic versioning starts at `0.1.0`. Phase-2 hosted app is `1.0.0`.

---

## [0.0.14] — 2026-05-17 — Sprint 0.14 — Polish + Tester-Readiness (Phase-0.5 close-out)

### Added
- **`@vk/llm` `selectModel(opts)`** abstraction — provider-agnostic resolver. Prefers `ANTHROPIC_API_KEY` (claude-sonnet-4-6, ~$3/M tokens), falls back to `OPENAI_API_KEY` (gpt-5-nano, ~$0.05/M), returns `null` when neither configured. Tier-hook reserved (free-tier OPENAI-cap) but not enforced yet — shipping the shape, not the limits.
- **`isLlmEnabled()` + `llmDisabledMessage()` + `llmDisabledFinding()`** — visible-but-disabled state pattern. A placeholder finding under `conflicting-rules` surfaces when no LLM key is set (severity `Exceptional` so overallSeverity rank is unaffected). Per A9 honest-non-vapor.
- **`runAudit(scan, { includeLLM: true })`** option — when true, runs `checkConflictingRules` if a key is configured, otherwise emits the placeholder finding. Default `false` so the smoke-eval keeps its 21/21 golden-set bounds.
- **`OnboardingChecklist`** on `/dashboard` — Linear-style 3-step list (run first audit → add customer-repo → connect canonical). Each step checks DB state and shows the next CTA. Hides when all 3 done.
- **Loading skeletons** — `apps/web/src/app/{dashboard,scans,customers,billing}/loading.tsx`. shadcn `Skeleton` per route.
- **`docs/outreach/tester-invite-template.md`** — 4 voice-templates (cold / warm-intro / build-in-public follow-up / magic-link-onboarding-email). Skeptic-Mentor brand-voice, ≤180 words, explicit "what you can't do" set-expectations block.

### Changed
- **`/scans`, `/drifts`, `/trust`, `/login`** rewritten with shadcn primitives (`Card`, `Table`, `Badge`, `Alert`, `Button`). Skeptic-mentor empty-state copy with concession-then-critique pattern. `/trust` now table-renders both default-scopes and compliance roadmap.
- **`LoginForm`** migrated from raw `<form className="form">` + `<div className="error">` to shadcn `Input`/`Label`/`Button`/`Alert` (destructive + success variants). Magic-link callback now drops on `/dashboard` (was `/scans`).
- **`/login` page** centered card layout with anonymous-audit fallback CTA.
- **`globals.css`** — added defensible legacy-class fallback styling (`.callout`, `.error`, `.lede`, `.form`, `.inventory`) so as-yet-unmigrated routes (customers/[id], requests, drift, bip, DriftView) render with the new design tokens instead of naked.

### Notes
- **Build:** 15 turbo tasks green. Routes registered: same 22 as Sprint 0.13 + new `loading.tsx` boundaries.
- **Tests:** 77/77 vitest across 14 files. Eval: 21/21 golden-set (LLM-disabled finding gated behind `includeLLM: true`).
- **Cash-out:** $0. No new SaaS. No AI calls executed.
- **Phase-0.5 close-out:** 4 sprints (0.11 → 0.14), 4 commits, dashboard + auto-tracking + freemium-gate + polish. End-state matches `docs/roadmap/phase-0.5-dashboard.md` §Phase-outcome end-state list.
- **What testers explicitly CAN'T do (set on first email):** open PR (needs GH App), real LLM fixes (Phase 1), >200 deltas/day (SSE cliff), real-money payments (Stripe test-mode only), custom domain. Honest non-vapor.

### Phase 0.5 retro

What worked:
- Shipping `runAudit` LLM hook gated by option preserved eval bounds while wiring the disabled-state. Avoided the "rewrite the eval" tax.
- shadcn migration paid off cumulatively — every empty-state polish in Sprint 0.14 took <5min because primitives were in place.
- $0 cash-out preserved across all 4 sprints (Vercel + Neon + Resend free tiers; Stripe + Inngest Cloud + Anthropic remain toggle-on env-flips).

What stayed deferred:
- README.md screenshots (user constraint — no PDF/README without explicit request)
- Tester recruitment names (`.local/recruitment.md`, gitignored — Kolja-only data input)
- GitHub-App registration (PRD §6.4 — gated on M3 LOI count + 4 Day-1-Mitigations)
- LLM `conflicting-rules` real calls (env-flag waits for golden-set eval per Constraint #14)

---

## [0.0.13] — 2026-05-17 — Sprint 0.13 — Deterministic Fixes + Freemium Gate

### Added
- **`@vk/fixes` package** — 4 deterministic unified-diff generators (per A7 research):
  - `unused-agent` → file-delete patch (`+++ /dev/null`)
  - `duplicate-guidance` → block removal in alphabetically-second file + link to canonical
  - `stale-reference` → line removal for dead links
  - `token-budget` (overflow-trim) → trims trailing `## ` sections until ~20% size reduction
  - `generateBatchFix()` aggregates patches + reports per-finding failures
  - 6/6 unit tests cover golden inputs (vitest)
- **`@vk/billing` package** — tier config + `ensureSubscription` + `isPaid` + `canAddRepo` + `canRunAudit`. TIERS: Free (1 repo, 20 audits), Solo Indie $19 (3 repos, 50), Solo Pro $79 (10 repos, 250), Agency Pro $299 (30 repos, 1000, 5 seats), Agency Scale $799 (100 repos, 5000, 15 seats). No $99 sandwich tier (PRD constraint #15).
- **Stripe integration** (test-mode skeleton, $0 cash-out until founder flips key):
  - `lib/stripe.ts` — lazy singleton, `isStripeEnabled()`, `priceIdFor()` resolution
  - `createCheckoutSession()` server action + `startCheckoutAction` form-action — hosted Checkout with `client_reference_id = userId` + `subscription_data.metadata.tier`
  - `createBillingPortalSession()` + `openBillingPortalAction` server action
  - `/api/stripe/webhook` — Node runtime, `await req.text()` raw body, `stripe.webhooks.constructEvent` HMAC verify, idempotent upsert into `stripe_event` (PK = `event.id`). Handles `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.paid/payment_failed` → updates `subscription` row.
- **`/billing` page** — current-plan card with usage stats + 5 tier cards with Stripe-Checkout buttons + portal-launch button when paid. Skeptic-mentor copy on success/cancelled/error states.
- **Hard-gate `AddCustomerForm`** — calls `canAddRepo()` before insert; on rejection shows shadcn `Dialog` with concession-then-critique copy and "See plans" CTA → `/billing`.
- **`FindingsList` client component** — replaces inline FindingCard rendering in `ReportView`. Checkbox-select per finding + "Select all fixable" + "Clear" + "Preview diff" / "Fix N selected" toolbar. Per-finding `[Preview diff]` (shadcn Dialog) + `[Download patch]` (Blob URL, `*.patch` filename) buttons. Disabled with explanatory copy on findings without deterministic fixes.
- **`subscription` table** + UNIQUE(user_id) + tier/status/quotas/period columns.
- **`stripe_event` table** (idempotency keyed on event.id) — drizzle migration `0005_square_forge.sql` applied to Neon.

### Changed
- **`apps/web/next.config.ts` transpilePackages** + workspace deps now include `@vk/billing` + `@vk/fixes`.
- **`DashboardSidebar`** — Billing link enabled (was Sprint-0.13 placeholder).
- **`ReportView`** — accepts `scanId?: string | null`; passed through from `/scans/[id]` and `AuditForm` (when `savedScanId` exists). Unauthenticated audits still render findings but with disabled fix-buttons + "sign in to enable" copy.
- **`addCustomer`** — returns `upgradeRequired` flag when quota gate trips.

### Notes
- **Build:** 15 packages green. New routes: `/billing`, `/api/stripe/webhook`.
- **Tests:** 77/77 vitest across 14 files (was 71/13; +6 fix-generator tests). Eval: 21/21.
- **End-to-end patch round-trip verified:** stale-reference generator → `git apply` on a fresh repo → dead-link line removed cleanly.
- **Cash-out:** $0. Stripe test-mode not yet wired (`STRIPE_SECRET_KEY` + per-tier `STRIPE_PRICE_*` env vars unset in prod). Code returns 503 / "Stripe not configured" gracefully. Founder flips when ready — same toggle-pattern as Inngest Cloud in Sprint 0.12.
- **No AI calls executed.** Conflicting-rules + context-bloat fixes remain Phase 1 (post-M3 LOI-gate) per A7 research.

---

## [0.0.12] — 2026-05-17 — Sprint 0.12 — Auto-Tracking + Visual Connections

### Added
- **Inngest scheduled function `auto-track-repos`** (cron `0 */4 * * *`) — polls every watched repo with a `github_full_name`, fetches latest commit SHA via the unauthenticated GitHub API, skips re-audit if SHA matches `repo.last_commit_sha`, else enqueues `audit/requested`. Quota math: 30 repos × 6 polls/day × 30 days = 5.4k step-runs/mo (~10% of Inngest-free).
- **`/api/notify-update`** — HMAC-SHA256 opt-in endpoint per A3-research (Hybrid-Notify). Per-repo `notify_secret`, 10 req/min in-memory rate-limit, returns 401 on bad signature, 429 on rate-cap, 200 on enqueue. Power-user CI hook with no GitHub App dependency.
- **`drift/requested` Inngest function** — runs `scanRepository` × 2 + `computeDrift`, persists `drift_run`, publishes `drift.completed` event.
- **Auto-drift trigger** — when `audit-requested` completes for a repo with `canonical_repo_id` set, enqueues `drift/requested` against the canonical's `rootPath`.
- **`/api/events/stream`** SSE endpoint — `ReadableStream` polling the new `event` table every 1.5s for the workspace, 30s heartbeats, explicit `maxDuration = 300` to align with Fluid Compute cap. Client EventSource reconnects automatically.
- **`useDashboardEvents()` client hook** — wires SSE to sonner toasts: `audit.completed` (success), `drift.completed` (warning), `audit.failed` (error). Each toast includes a router-push action.
- **`RepoGraph` (React Flow v12)** — `@xyflow/react` graph view at `/dashboard?display=graph`, radial layout (canonical at center, others on circle), severity-banded `RepoNode`s, severity-colored drift edges (Kill/Weak animated). Click-through to scan + drift pages.
- **`DashboardViewToggle`** — Table ⇌ Graph segmented control in the filter-strip header, persists choice in `localStorage` (`vk.dashboard.view`).
- **Last-activity badge** — `Xh ago` / `Xd ago` with `· possible drift` suffix when stale (>7d).
- **`event` table** + `event_workspace_id_idx` (Drizzle migration `0004_superb_puff_adder.sql`).
- **`repo.last_commit_sha`, `repo.last_polled_at`, `repo.canonical_repo_id` (self-FK), `repo.notify_secret`** columns.
- **`publishEvent()`** helper exported from `@vk/inngest` (workspace-scoped insert into `event`).

### Changed
- **`audit-requested`** now publishes `audit.completed` / `audit.failed` events and auto-enqueues `drift/requested` when `canonical_repo_id` is set.
- **`@vk/inngest`** depends on `@vk/drift` (new workspace edge).
- **Dashboard `/dashboard` page** reads `?display=graph` to switch between `DashboardTable` and `RepoGraphClient`. Graph data is loaded server-side as a `RepoGraphInput` (repos + drift-edges keyed by rootPath pairs).

### Notes
- **Build:** 13 packages green. New routes: `/api/events/stream`, `/api/notify-update`.
- **Tests:** 71/71 vitest (13 files). Eval: 21/21.
- **Cash-out:** $0. No new SaaS accounts. SSE chosen over Pusher/Ably to honor PRD §14 + ContextForge-Wedge cross-vendor-trust promise (A8 research).
- **Deferred:** GitHub-App-push-webhook (Phase 1 / Agency-Tier per A3 Skeptic-Mentor-call). UI to assign canonical + rotate notify_secret lands in Sprint 0.13 alongside billing.
- **No AI calls executed.**

---

## [0.0.11] — 2026-05-17 — Sprint 0.11 — Dashboard Shell

### Added
- **`/dashboard` route** — 3-zone shell (shadcn `Sidebar` × Filter-Strip × `Table`) per A1-research-convergent-pattern (Vercel/GitHub/Sentry/Linear). Signed-in primary surface.
- **Saved-views URL-state** — `?view=&severity=&activity=` via `useSearchParams` + `useTransition`. Pre-built views: All / Critical / Drift>7d / Unused-agents / Recently-audited. Backend-persistence deferred to Sprint 0.12.
- **`SeverityBadge`** (`components/ui/severity-badge.tsx`) — `cva`-based 5-band component, oklch background-mix. Replaces `.sev-pill` class.
- **22 shadcn primitives** installed (new-york style, Radix base): button, card, input, label, dialog, alert-dialog, dropdown-menu, table, tabs, badge, avatar, separator, sheet, skeleton, sonner, command, sidebar, tooltip, popover, scroll-area, textarea, input-group.
- **`DashboardSidebar`** with collapsible-icon mode + Recent-repos section.
- **`DashboardFilterStrip`** with shadcn `DropdownMenu` × 3 (Saved views / Severity / Activity).
- **`DashboardTable`** with severity-cell + relative-time + empty-state ("No customer-repos yet. Free tier covers 1 repo.").

### Changed
- **Frontend system migrated to Tailwind v4 + shadcn/ui new-york** (PRD §16 unchanged; pure FE-layer swap). Geist + Geist_Mono via `next/font`. Dark-mode-first `:root`, severity-bands as CSS-variables in `globals.css`.
- **`/customers`** rewritten as shadcn `Card` + `Table` with `DropdownMenu` row-actions.
- **`/` (home)** rewritten with shadcn `Card` grid showing 6 finding-categories with lucide icons + Concession-then-Critique highlight-card. `AuditForm` + `ReportView` migrated to shadcn.
- **`SiteNav`** sticky top-bar with shadcn `Button` + `Separator`. Signed-in users get a Dashboard CTA.

### Notes
- **Build:** 11/11 turbo tasks green. `/dashboard` registered (force-dynamic for runtime-only env-vars).
- **Tests:** 71/71 vitest passing (13 test-files).
- **Eval:** 21/21 golden-set entries pass.
- **Cash-out:** $0 (Vercel + Neon + Resend free tiers).
- **No AI calls executed.** LLM features (`conflicting-rules`, multi-model-compare) deferred to Sprint 0.13 per user direction.

---

## [0.0.10] — 2026-05-16 — Sprint 0.10 — Light-Code Polish

### Added
- **Audit-Trail Export** (`/api/audit-trail?format=json|csv`). Workspace-scoped, signed-in only. Surfaces scans / drift_runs / install_requests / repos / webhook_events with 12-month retention window. Compliance-Frame Customers per Playbook ch 3 ask for this directly.
- `docs/handbook-extras/mom-test-script.md` — interview-ready standalone script with the 5 question stems, transcription cues, and a post-interview triage template.
- `docs/research/compete-2026-Q2.md` — quarterly /compete-check refresh.
- Handbook ch 2 extended with a worked synthetic example transcript (illustrative-marked).

### Changed
- Trust-Center page (`/trust`) now links the audit-trail export directly.

### Compliance
- Compliance-Frame Q4 ("How do we revoke + audit-trail export?") now has a code-path answer instead of a verbal one.

---

## [0.0.9] — 2026-05-16 — Sprint 0.9 — Execution Bridge

### Added
- `recruitment.md` — 30 structured slots (10 Indie + 10 Agency + 10 Compliance-Frame). No invented names.
- `docs/outreach/` — 6 outreach templates (`indie-warm-intro`, `indie-cold-but-specific`, `indie-build-in-public-reply`, `agency-warm-intro`, `agency-cold-discovery`, `agency-conference-followup`).
- `.claude/commands/dogfood-repo.md` — weekly self-audit cadence command.
- `scripts/bip-counter.ts` + `docs/bip-posts/` — ISO-week BiP-counter, idempotent.
- `scripts/docker-e2e-smoke.sh` — multi-layer E2E smoke with per-layer exit codes.
- `docs/playbook/03-compliance-frame.md` — Pharma/Finance/Marketing-with-PII chapter with premium pricing ($8.5k + $1.5k/qtr).

### Compliance
- Phase-0-Gate Criterion #10 (BiP cadence): counter infra ready, 0 posts shipped (Kolja-side action).

---

## [0.0.8] — 2026-05-16 — Sprint 0.8 — Handbook + Playbook + Compliance Polish

### Added
- `docs/handbook/` — 8 chapters (~5k words) covering Positioning → Mom-Test → Channels → Pricing → Build → Launch → Iterate → Anchor. Phase-0-Gate Criterion #8 ✅.
- `docs/playbook/` — 2 chapters (Customer-Onboarding, Template-Distribution). Phase-0-Gate Criterion #9 ✅.
- `eval/conflicts/{dataset.json,run.ts}` — LLM-rule eval harness with 6 hand-crafted conflict-pair fixtures, FPR-target ≤ 15%.
- `eval/promptfoo.yaml` — promptfoo scaffold (Sprint 0.9+ extension).
- `eval/golden-set/anonymized-customer/` — bucket scaffold with 9 LOI-locked slots and 7-step privacy process.
- `scripts/anonymize.ts` — email/GitHub-handle/URL strip + customer-name swap.
- `docs/setup/github-app-checklist.md` — 30-min one-time-setup checklist.
- `docs/demo-script.md` — 5-min walkthrough script for Mom-Test sessions.
- `docs/assets/` — 4 screenshots of the first sprints.

### Changed
- `README.md` rewritten as marketplace-quality landing page.

---

## [0.0.7] — 2026-05-16 — Sprint 0.7 — Multi-Customer + BiP + Polish

### Added
- `webhook_event` table with `x-github-delivery` as idempotency key.
- `@vk/bip-generator` package + `/bip` route. `fromAuditReport()` / `fromDriftReport()` → X-thread / LinkedIn / Mastodon drafts in Skeptic-Mentor voice.
- `/customers` (workspace-scoped repo list with latest scan summary) + `/customers/[id]` (audit + drift history + write-status + RequestWriteButton).
- `AddCustomerForm` component.
- `ScanStatusBanner` on `/scans/[id]` with 2s polling and auto-refresh on `complete`/`failed`.
- aider.conf.yml YAML-only parser (12/12 vendor surface complete).
- Golden-Set +6 (3 dogfood-subpaths + 3 real-world-like for cursor/windsurf/cline) → 21/30 manifest entries.
- SiteNav extended with Customers + BiP.

### Changed
- `audit-action.ts` threshold-based background-enqueue (BACKGROUND_THRESHOLD=30 files).

---

## [0.0.6] — 2026-05-16 — Sprint 0.6 — GitHub App + Background Workflows

### Added
- `docs/setup/github-app.{json,md}` — manifest + walkthrough.
- `@vk/github-app` package — App auth (JWT signing, installation token caching), HMAC-SHA-256 webhook signature verification, `GitHubAppClient` real PR-dispatch impl.
- `@vk/inngest` package — dev-server-friendly client, `audit.requested` background function, `queued → running → complete | failed` state machine.
- `/api/inngest` mount.
- `scan.status` + `startedAt` + `completedAt` + `failureReason` columns.
- `docs/legal/toms-register.md` — 15 Article-32(1) measures × Phase-0 / Phase-1+ status.
- `docs/legal/incident-response.md` — SEV-matrix + 6-step runbook + GDPR Art. 33 notification template.
- `RequestWriteButton` component for 1-click access requests.

### Changed
- `/api/install-webhook` upgraded from stub to real handler with signature verification.

### Security
- 4/4 GitHub-App Day-1 Mitigations (PRD §6.4) now landed: DPA-Template ✅, Trust-Center ✅, Read-Only-Default ✅, Requester→Approver-Bridge ✅.

---

## [0.0.5] — 2026-05-16 — Sprint 0.5 — Compliance + PR-Workflow Foundation

### Added
- `/trust` Trust-Center page with honest "what we don't yet do" section.
- `docs/legal/{dpa-template.md,sub-processors.md,scope-policy.md}`.
- `@vk/pr-workflow` package with `PRClient` interface, `LocalGitClient` (patch-file output), `GitHubAppClient` stub, access-enforced `dispatchPR`.
- `install_request` table + Requester→Approver-Bridge with `/requests` UI (approve/reject) + webhook stub at `/api/install-webhook`.
- `drift_run` table + `/drifts` list + `/drifts/[id]` detail.
- 12 adversarial golden-set fixtures (broken YAML, CRLF, BOM, bilingual, oversize, empty, deeply nested, case-dups, no-newline, multi-CLAUDE.md, symlinks, emoji).

### Changed
- `repo` table: `write_access_granted` column (default `false`).
- `eval/golden-set/**` is now a default-ignore in scanner.

---

## [0.0.4] — 2026-05-16 — Sprint 0.4 — Local Stack + Persistence

### Added
- `docker-compose.yml` — Postgres (pgvector:pg17), Dragonfly, Mailpit, Inngest Dev.
- `@vk/db` package with Drizzle ORM 0.45, 8 tables (Better-Auth 4 + workspace/repo/scan/finding), 0000-migration.
- `@vk/auth` package with Better-Auth 1.6 + Magic-Link via Mailpit SMTP.
- `/login`, `/scans`, `/scans/[id]`, `/api/auth/[...all]` routes.
- `SiteNav` component.
- `.env.example` documenting all stack variables.

### Changed
- `audit-action.ts` persists scans when signed in; anonymous mode remains stateless (graceful degradation per PRD §5 Hardcore-Local-Only).

---

## [0.0.3] — 2026-05-16 — Sprint 0.3 — Audit Depth + Multi-Repo

### Added
- `token-budget` audit rule (5/6 deterministic categories complete).
- `@vk/drift` package with 5 drift kinds (only-in-a/b, content-drift, frontmatter-drift, token-drift).
- CLI `validationkit drift <a> <b>` + Markdown export.
- Web `/drift` route with server action.
- `@vk/llm` package with `conflicting-rules` LLM rule (AI SDK 6 + Anthropic direct per PRD §5; graceful no-op without API key).
- Golden-set scaffold (`manifest.json` + 3 seed entries + smoke-eval walker).

---

## [0.0.2] — 2026-05-16 — Sprint 0.2 — Vendor Completeness + Test Net

### Added
- `js-tiktoken` (cl100k_base) replaces char/3.5 heuristic.
- `.cursor/rules/*.mdc` parser with 4-mode activation logic (always / auto-attached / agent-requested / manual).
- SHOULD-5 + MAY-2 vendor formats wired (cursor legacy, windsurf, cline, codex, aider — aider properly parsed in 0.0.7).
- Default-ignore for `examples/**` + `docs/archive/**`.
- CLI `--out=path.md` flag for Markdown export.
- vitest with 28 tests + smoke-eval with fixture-PASS.

---

## [0.0.1] — 2026-05-16 — Sprint 0.1 — First Audit

### Added
- pnpm + Turborepo monorepo.
- Packages: `@vk/core`, `@vk/parser` (5 MUST formats), `@vk/audit` (4 deterministic rules), `@vk/cli`.
- `apps/web` — Next.js 16 + App Router with a single audit page.
- End-to-end Playwright test: 4 findings against `examples/sample-bad` (unused-agent, duplicate-guidance, 2× stale-reference).

---

*Maintenance: append a new section per sprint. Date and version on the same day. Keep the most recent 3 sprints in the README quick-link block.*
