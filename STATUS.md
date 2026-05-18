# STATUS — Phase 0 Live Tracking

> **Live-File.** Update täglich abends (30 Sek) oder bei wichtigen Milestones.
> **Source-of-Truth für Phase-0-Gate.** Bei Konflikt mit ROADMAP.md gewinnt STATUS.md (operational truth).

---

## Quick-Glance

- **Today:** 2026-05-18
- **Current Week:** Phase 1 W1
- **Current Cluster:** Sprint 1.0 ✅ shipped → Sprint 1.1 next
- **Hours-this-Week:** ~7 / 25 target (Sprint 1.0 code track only)
- **Burnout-Flag:** 🟢 Green (no risk yet)
- **Last Sprint:** Sprint 1.1 — Stripe Live-Mode Prep + Pricing Update ✅ shipped 2026-05-18 (Phase 1 W1)
- **Real-Execution Thread 1:** Docker E2E + Magic-Link Round-Trip ✅ verified 2026-05-17 — Phase-0-Gate #4 = 1.0 ✅
- **Dashboard-Pivot (Phase 0.5):** ADR-0019 + Sprints 0.11–0.14 shipped 2026-05-17, $0 cumulative.
- **Phase-1 Plan:** 10-agent parallel research synthesis landed 2026-05-17 — `docs/research/phase-1-pivot/00-synthesis.md` + `docs/roadmap/phase-1.md` (Sprint 1.0→1.12, M3→M9) + ADR-0020. PRD §3 + §6.4 + §6.5 + §11.3 corrected.
- **Sprint 1.0 deliverables (2026-05-18):** dpa_acceptance table + migration 0006 · `@vk/github-app/manifest.ts` (REQUIRED_PERMISSIONS + WRITE_GATED_PERMISSIONS + permissionsFor()) · install-webhook reconciliation extended w/ suspend/unsuspend + repo.access-changed events · `/trust/dpa` acceptance UI + audit-log · `/trust/sub-processors.json` + `.xml` static feeds · 9 new golden-set entries (30/30 green) · eval/conflicts FP-instrumentation per-band + N=3 + persist. **30/30 eval · 84/84 vitest · 15 turbo green · $0 cash-out.**
- **Phase-0-Gate Criterion #6 (GH-App Mitigations):** 2 of 4 implemented (Trust-Center ✅, DPA ✅, Requester→Approver-Bridge ⚠️ partial — Customer-Admin UI Sprint 1.2, Read-Only-Default ⚠️ partial — live-registration Sprint 1.4).

---

## Phase-0-Gate (M3 = End-of-W13)

| # | Criterion | Target | Current | Notes |
|---|---|---|---|---|
| 1 | Indie-Mom-Tests transkribiert | 20 | 0 | recruitment-pipeline W1 |
| 2 | Agency-Discovery-Interviews | 10 | 0 | startet W6 |
| 3 | Agency-LOIs signed | 5 | 0 | startet W9 (LOI-Push C4) |
| 4 | OSS v0.1 lokal lauffähig | 1 | **1.0 ✅** | Real-Execution 2026-05-17: full stack up via `pnpm e2e:smoke` (9/9 layers green), magic-link round-trip → /scans → audit persisted (12 files, 4 findings, Weak) → BiP-draft generated → audit-trail export (JSON: 2 rows, 12-month retention). Phase-0-Gate #4 closed. |
| 8 | Validation-Handbook v0 Kapitel | 8 | 8 | Sprint 0.8: 8 Kapitel-Skelette mit Brand-Voice (Positioning → Mom-Test → Channels → Pricing → Build → Launch → Iterate → Anchor) |
| 9 | Operations-Playbook v0 Kapitel | 2 | 2 | Sprint 0.8: 2 Kapitel (Customer-Onboarding, Template-Distribution) als Sales-Collateral für $4500-Sprint |
| 5 | Parser MUST-5 done | 5 | 5 | MUST-5 classify+scan+parse fertig |
| 5b | Parser SHOULD+MAY done | 7 | 7 | Sprint 0.7: aider.conf.yml YAML-parser → 12/12 vendor formats complete |
| 6 | GitHub-App-Mitigations | 4 | 4 | Sprint 0.6: all 4 Day-1-Mitigations + webhook idempotency via webhook_event audit-trail |
| 7 | 30-File-Golden-Set annotiert | 30 | 21 | Sprint 0.7: +6 entries (3 dogfood-subpaths + 3 real-world-like). Anonymized-customer +9 bleibt post-LOI |
| 8 | Validation-Handbook v0 Kapitel | 8 | 0 | iterativ ab W8 |
| 9 | Operations-Playbook v0 Kapitel | 2 | 0 | iterativ ab W11 |
| 10 | Build-in-Public-Posts | 55–65 | 0 | 5/Wo daily |
| 11 | Phase-0-Retro + Phase-1-Doc | 2 | 0 | W13 |

**Gate-Status:** 🟡 W1 starting — 0/11 erreicht.

---

## Engagement-Pipeline (Cash-Engine)

| # | Customer | Stage | Stage-Since | $-Range | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | Leads kommen W6 (Kolja-Netzwerk) |

**Pipeline-Status:** 🟡 W6-Lead-Generation pending.

---

## Build-in-Public-Cadence

| Week | Mo | Di | Mi | Do | Fr | Total |
|---|---|---|---|---|---|---|
| (no published posts yet) | — | — | — | — | — | 0 |

---

## Risk-Flags (live)

- 🟢 Burnout: Hours-this-Week < 20 / 30
- 🟢 Recruitment: Pipeline-Fill-Rate (target: 30 names by W1-end)
- 🟢 Velocity: Cluster-on-Track (C1 W1)

---

## Recent Decisions / Pivots

- 2026-05-17: **Real-Execution Thread 1 verified end-to-end.** Docker Desktop launched headless via `open -a Docker`, daemon ready in ~3 min, `pnpm e2e:smoke` 9/9 layers green (Docker / Compose / Postgres pg_isready / db:migrate 0001+0002+0003 applied / Mailpit / Inngest / Dragonfly / vitest 71/71 / eval 21/21). Magic-link round-trip: `.env.local` symlinked into `apps/web/`, login form posted, Mailpit API at :8025/api/v1/messages used to extract the verify URL, Playwright clicked it, redirected to `/scans` as `kolja@validationkit.local`. Live audit run on `examples/sample-bad` → 12 files, 4 findings (Weak), persisted to DB. BiP-draft generated from saved scan. Audit-trail export verified: anonymous→404, authenticated→2 rows (1 repo + 1 scan, JSON format, 12-month retention). **Phase-0-Gate Criterion #4 = 1.0**.
- 2026-05-16: ADR-0018 accepted (ContextForge as Productized-Form, Pfad C)
- 2026-05-16: v5-Refactor completed — `docs/`-Struktur, Hardcore-Local-Only, konsolidiertes PRD
- 2026-05-16: **Sprint 0.1 — First Audit shipped.** pnpm+turborepo monorepo, @vk/core+@vk/parser+@vk/audit+@vk/cli+apps/web bauen alle clean. End-to-End-Test via Playwright: 4 Findings auf `examples/sample-bad` (unused-agent, duplicate-guidance, 2× stale-reference). Self-audit gegen Repo-Root läuft auch grün.
- 2026-05-16: **Sprint 0.2 — Vendor Completeness + Test Net shipped.** tiktoken (cl100k_base) ersetzt char/3.5-Heuristik; .cursor/rules/*.mdc Parser inkl. 4-Mode-Activation-Logik (always/auto-attached/agent-requested/manual); SHOULD-5 + MAY-2 alle gewired; Default-Ignore für examples/** + docs/archive/**; CLI --out=path.md für Markdown-Export; vitest mit 28 grünen Tests + smoke-eval mit fixture-PASS.
- 2026-05-16: **Sprint 0.3 — Audit Depth + Multi-Repo shipped.** token-budget Regel komplettiert 5/6 deterministisch; neues @vk/drift package mit 5 Drift-Kinds (only-in-a/b, content-drift, frontmatter-drift, token-drift); CLI `validationkit drift <a> <b>` + Markdown-Export; Web-UI /drift Route mit Server-Action; neues @vk/llm package mit conflicting-rules LLM-Regel (AI SDK 6 + Anthropic direct per PRD §5; graceful no-op ohne API-Key); golden-set Scaffold mit manifest.json + 3 seed entries + smoke-eval-walker; 38/38 vitest cases green; alle 7 packages bauen clean.
- 2026-05-16: **Sprint 0.4 — Local Stack + Persistence shipped.** docker-compose.yml mit 4 Services (pgvector:pg17 Postgres, Dragonfly, Mailpit, Inngest Dev); .env.example dokumentiert; @vk/db package mit Drizzle ORM 0.45 + 8 Tables (Better-Auth 4 + workspace/repo/scan/finding); 0000-Migration generiert; @vk/auth package mit Better-Auth 1.6 + Magic-Link via Mailpit-SMTP; Web-UI bekommt /login, /scans, /scans/[id], /api/auth/[...all] Routes + SiteNav; audit-action persistiert bei signed-in user (anonymous = stateless graceful degradation per PRD §5 Hardcore-Local-Only); 45/45 vitest cases green; alle 9 packages bauen clean.
- 2026-05-16: **Sprint 0.5 — Compliance + PR-Workflow Foundation shipped.** Trust-Center-Page /trust mit honest "what we don't yet do" section; DPA-Template + Sub-Processors + Scope-Policy in docs/legal/; Read-Only-Default + write_access_granted column im repo schema; @vk/pr-workflow package mit PRClient interface + LocalGitClient (patch-file output) + GitHubAppClient stub mit "register the app first" error + access-enforced dispatchPR; install_request table + Requester→Approver-Bridge mit /requests UI (approve/reject) + webhook stub at /api/install-webhook; drift_run table + /drifts list + /drifts/[id] detail; +12 adversarial golden-set fixtures — manifest jetzt 15/30; eval/golden-set/** als Default-Ignore; 48/48 vitest cases green; alle 10 packages bauen clean.
- 2026-05-16: **Sprint 0.6 — GitHub App + Background Workflows shipped.** github-app-manifest.json + docs/setup/github-app.md + @vk/github-app package (App-Auth + HMAC-Verification + real GitHubAppClient); /api/install-webhook upgraded zum real-handler; @vk/inngest package + audit-requested state-machine + /api/inngest + threshold-based background-enqueue; docs/legal/toms-register.md + incident-response.md; RequestWriteButton; 61/61 vitest cases green.
- 2026-05-16: **Sprint 0.7 — Multi-Customer + BiP + Polish shipped.** webhook_event audit-trail + idempotency; @vk/bip-generator + /bip route; /customers + /customers/[id] + AddCustomerForm; /scans/[id] ScanStatusBanner; aider.conf.yml YAML-only Parser (12/12 vendors); Golden-Set +6 (21/30); 71/71 vitest cases green.
- 2026-05-16: **Sprint 0.8 — Handbook + Playbook + Compliance Polish shipped.** docs/handbook/{01-positioning..08-anchor}.md (8 Kapitel-Skelette, ~5k Worte, Phase-0-Gate Criterion #8 ✅); docs/playbook/{01-onboarding,02-template-distribution}.md (Phase-0-Gate Criterion #9 ✅); eval/conflicts dataset + run + promptfoo.yaml; anonymized-customer Bucket-Scaffold; docs/setup/github-app-checklist.md; README.md Marketplace rewrite; docs/demo-script.md; alle 13 packages clean.
- 2026-05-16: **Sprint 0.9 — Execution Bridge shipped.** recruitment.md (30 slots), 6 outreach templates, /dogfood-repo cadence command, scripts/bip-counter.ts, scripts/docker-e2e-smoke.sh, docs/playbook/03-compliance-frame.md. 71/71 tests green.
- 2026-05-16: **Sprint 0.10 — Light-Code Polish shipped.** Audit-Trail-Export Feature (workspace-scoped, signed-in only, JSON + CSV) via /api/audit-trail; Trust-Center um Download-Links erweitert (Compliance-Frame Q4-Antwort code-path); CHANGELOG.md retroaktiv für v0.0.1 → v0.0.10 nach Keep-a-Changelog-Format; docs/handbook-extras/mom-test-script.md (interview-ready standalone — 5 Question-Stems + Anti-Pattern-Tabelle + Post-Interview-Triage); docs/research/compete-2026-Q2.md (/compete-check Q2-Refresh — kein ADR-Re-Open, grekt + GitHub ACP weiter zu beobachten, 5-LOI-Trigger bleibt load-bearing watch); Handbook ch 2 v0.5-Erweiterung mit synthetic "Mark" worked-example transcript (~1k Worte zusätzlich, 4 anti-pattern-mapped mistakes); 71/71 vitest cases green; 21/21 golden-set entries pass; alle 13 packages bauen clean.

---

*Update-Pattern: ein Eintrag pro Tag, max 3 Sätze pro Update. Nicht prosa, sondern Counters + Status-Emojis. Letztes Update: 2026-05-16.*
