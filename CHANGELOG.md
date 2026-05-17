# Changelog

> All notable changes to ValidationKit. Follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with our own `Severity` and `Compliance` sections where relevant.

> **Version policy:** until M3 Phase-0-Gate-Pass, we ship `0.0.x` patch bumps per sprint. Post-Gate, semantic versioning starts at `0.1.0`. Phase-2 hosted app is `1.0.0`.

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
