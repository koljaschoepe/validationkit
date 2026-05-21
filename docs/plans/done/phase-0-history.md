# Phase 0 — Foundation Sprint-History (✅ shipped 2026-05-16)

> Archiv der 11 Phase-0-Sprints. Diese Datei ist History, nicht aktiv.
> Extrahiert aus `TODO.md` am 2026-05-21 (Repo-Health-Pass).

Source-of-Truth für aktive Phasen: `.claude/CLAUDE.md` + `docs/roadmap/` + `docs/plans/`.

---

## Week 1 (2026-05-16 → 2026-05-22)
- [ ] GitHub-Org `validationkit-ai` reservieren
- [x] Monorepo-Skeleton (pnpm+turborepo, packages/{core,parser,audit,cli}, apps/web) — **Sprint 0.1 ✅ 2026-05-16**
- [x] Parser MUST-5 done (5 von 5: CLAUDE.md, AGENTS.md, .claude/agents, .claude/commands, SKILL.md)
- [x] 4 Audit-Rules deterministisch (unused, duplicate, bloat, stale) — Conflicting-Rules (LLM) deferred Sprint 0.3
- [x] Web-UI + CLI laufen lokal, End-to-End mit Playwright verifiziert
- [ ] 30-File-Golden-Set inventarisieren (Liste)
- [ ] `recruitment.md` mit 30 DACH-Indie-Hacker-Namen anlegen
- [ ] 2 Mom-Test-Outreach-Messages verschicken
- [ ] Interview-Question-Skript (Rob Fitzpatrick) finalisieren
- [ ] Build-in-Public-Post #1 schreiben + posten

> Hinweis 2026-05-21: Strategy/Recruitment/BiP-Items sind in ein separates Framework migriert. Doc-Pfade (`recruitment.md`, `docs/outreach/`, `docs/bip-posts/`, `docs/playbook/`, `docs/handbook-extras/`, `docs/setup/`, `docs/legal/`) existieren in diesem Repo NICHT mehr.

## Sprint 0.2 — Vendor Completeness + Test Net ✅ shipped 2026-05-16
- [x] tiktoken statt char/3.5 token-count
- [x] `.cursor/rules/*.mdc` Parser inkl. 4-Mode-Activation-Logik
- [x] `.cursorrules` legacy + `.windsurf/rules` + `.clinerules` (Format-SHOULD complete)
- [x] Default-Ignore für `examples/**` + `docs/archive/**` + Opt-in-Flags
- [x] `--out=audit-report.md` Flag im CLI für Markdown-Export
- [x] vitest mit 28 Tests + smoke-eval gegen sample-good / sample-bad

## Sprint 0.3 — Audit Depth + Multi-Repo ✅ shipped 2026-05-16
- [x] **LLM-Audit für `conflicting-rules`** mit Confidence-Banding (AI SDK 6 + Anthropic direct; graceful no-op ohne Env-Key)
- [x] **Token-Budget-Heuristic** als 5. deterministische Audit-Regel
- [x] Golden-Set scaffolding: manifest.json + schema + 3 seed entries + smoke-eval walker
- [x] **Drift-Detection**: @vk/drift package + CLI `drift <a> <b>` + Markdown-Export + Web-UI /drift route _(später gedropped, siehe ADR-0003)_
- [x] 38/38 vitest cases green incl. token-budget, drift, llm-no-op

## Sprint 0.4 — Local Stack + Persistence ✅ shipped 2026-05-16
- [x] **docker-compose.yml** mit Postgres pgvector + Dragonfly + Mailpit + Inngest
- [x] **.env.example** + `pnpm stack:up/down/reset/logs` scripts
- [x] **@vk/db** mit Drizzle 0.45 (8 Tables: Better-Auth 4 + workspace/repo/scan/finding) + 0000-Migration
- [x] **@vk/auth** mit Better-Auth 1.6 + Magic-Link via Mailpit-SMTP
- [x] `/login`, `/scans`, `/scans/[id]`, `/api/auth/[...all]` Routes
- [x] Audit-Action persistiert bei signed-in user (graceful degradation ohne DB)
- [x] 7/7 vitest cases neu (db + auth lazy-init + auth-disabled paths)

## Sprint 0.5 — Compliance + PR-Workflow Foundation ✅ shipped 2026-05-16
- [x] **Trust-Center page** /trust mit honest Concession+Critique
- [x] **DPA-Template** in docs/legal/ + Sub-Processors + Scope-Policy _(docs/legal/ später migriert, separates Framework)_
- [x] **Read-Only-Default**: write_access_granted column + enforceAccess gate
- [x] **Requester→Approver-Bridge** (schema+actions+UI; webhook stub bis Sprint 0.7)
- [x] **@vk/pr-workflow** mit PRClient + LocalGitClient + GitHubAppClient-Stub
- [x] **Drift-Persistence** /drifts + /drifts/[id] _(später gedropped, siehe ADR-0003)_
- [x] **Golden-Set +12 adversarial** (15/30 entries)
- [x] 48/48 vitest cases green; 10/10 packages bauen clean

## Sprint 0.6 — GitHub App + Background Workflows ✅ shipped 2026-05-16
- [x] **GitHub App manifest** (one-click registration) + docs/setup/github-app.md walkthrough _(docs/setup/ später migriert)_
- [x] **@vk/github-app package**: octokit-App-Auth + HMAC-SHA-256 webhook verification + parseWebhookEvent
- [x] **GitHubAppClient real**: createOrUpdateFileContents + pulls.create idempotent
- [x] **Webhook-Handler real**: signature-check, install.created/.deleted, installation_repositories.added/.removed
- [x] **@vk/inngest package** + audit-requested function + threshold-based background-enqueue
- [x] **scan.status** state machine (queued/running/complete/failed)
- [x] **TOMs-Register** + **Incident-Response-Playbook** in docs/legal/ _(später migriert)_
- [x] **RequestWriteButton** component (1-click "request write access")
- [x] 61/61 vitest cases green; 12/12 packages bauen clean

## Sprint 0.7 — Multi-Customer + BiP + Polish ✅ shipped 2026-05-16
- [x] **webhook_event audit-trail** mit x-github-delivery idempotency
- [x] **Multi-Customer-UI**: /customers list + /customers/[id] detail + AddCustomerForm _(später in /[workspace]/customers migriert, siehe done/workspace-route-consolidation.md)_
- [x] **Background-Scan polling**: /scans/[id] ScanStatusBanner 2s-poll → auto-refresh
- [x] **@vk/bip-generator** + /bip Web-Route (X/LinkedIn/Mastodon Drafts) _(später gedropped, ADR-0003)_
- [x] **aider.conf.yml** YAML-only Parser (12/12 vendor surface complete)
- [x] **Golden-Set +6** (3 dogfood-subpaths + 3 real-world-like) → 21/30
- [x] 71/71 vitest cases green; 13/13 packages bauen clean

## Sprint 0.8 — Handbook + Playbook + Compliance Polish ✅ shipped 2026-05-16
- [x] **Validation-Handbook v0**: 8 Kapitel-Skelette ✅
- [x] **Operations-Playbook v0**: 2 Kapitel-Skelette ✅
- [x] **Eval-Pipeline mit Promptfoo**: eval/conflicts/dataset.json + run.ts + promptfoo.yaml scaffold
- [x] **anonymized-customer Bucket**: README + .gitignore + 9 LOI-locked slots + scripts/anonymize.ts
- [x] **GitHub-App-Checklist**: docs/setup/github-app-checklist.md (30-min Walkthrough) _(später migriert)_
- [x] **Marketplace polish**: README.md rewrite + docs/assets/ + docs/demo-script.md

## Sprint 0.9 — Execution Bridge ✅ shipped 2026-05-16
- [x] **recruitment.md** mit 30 strukturierten Slots _(später in separates Framework migriert)_
- [x] **docs/outreach/** mit 6 Templates _(später migriert)_
- [x] **/dogfood-repo slash-command** für Weekly-Self-Audit-Cadence
- [x] **scripts/bip-counter.ts** + docs/bip-posts/ Frontmatter-Conventions + idempotente STATUS.md-Updates
- [x] **scripts/docker-e2e-smoke.sh** Multi-Layer-Smoke mit per-Layer-Exit-Codes
- [x] **docs/playbook/03-compliance-frame.md** _(später migriert)_

## Sprint 0.10 — Light-Code Polish ✅ shipped 2026-05-16
- [x] **Audit-Trail-Export Feature** (`/api/audit-trail?format=json|csv`)
- [x] **CHANGELOG.md** retroaktiv für v0.0.1 → v0.0.10
- [x] **Mom-Test Interview-Skript standalone** _(später migriert)_
- [x] **/compete-check Q2-2026** Refresh
- [x] **Handbook ch 2 v0.5** worked-example _(später migriert)_

## Sprint 0.11 — Customer-Side-Execution (W9–W11, Kolja's calendar)

> Diese Liste wurde nicht aus dem Repo abgearbeitet — sie ist User-Side/Strategy-Framework. Hier nur als History.

- [ ] **GitHub App registrieren** via docs/setup/github-app-checklist.md _(docs/setup/ migriert)_
- [ ] **Docker E2E** echt durchlaufen
- [ ] **5 Indie + 3 Agency Slots** mit echten Namen befüllen _(Strategy-Framework)_
- [ ] **3 erste Outreach-DMs** versenden _(Strategy-Framework)_
- [ ] **1 erstes Mom-Test-Interview** durchführen _(Strategy-Framework)_
- [ ] **First BiP Post** posten _(Strategy-Framework)_
- [ ] **Validation-Handbook v0.5** ergänzen _(Strategy-Framework)_
- [ ] **PR-Workflow E2E-Test** (real GitHub App → dispatch → PR auf test-repo)
- [ ] **toms-register.md** Phase-0+ Status-Spalte _(migriert)_
- [ ] **Light-code follow-ups** (audit-trail-import, slack-notify-on-Kill, mobile-sweep, aider-YAML-test, JSON-Schema-publish)

---

## Phase Galaxie — ✅ shipped 2026-05-19

Komplette 6-Sprint-Roadmap aus `docs/roadmap/done/phase-galaxie.md` ausgeliefert. Plan-Files in `docs/plans/done/`:

- [x] Pre-Work: `galaxie-pre-work.md`
- [x] Sprint G1: `galaxie-sprint-1-ui-skeleton.md` (PixiJS-Galaxie, 60fps@150 Asteroiden)
- [x] Sprint G2: `galaxie-sprint-2-data-binding.md` (Customer-Schema, Migration 0008)
- [x] Sprint G3: `galaxie-sprint-3-inspector.md` (Inspector + /customers refactor)
- [x] Sprint G4: `galaxie-sprint-4-ai-solutions.md` (Solution-Cache, Migration 0009)
- [x] Sprint G5: `galaxie-sprint-5-apply.md` (Apply/Dismiss/Snooze, Migration 0010)
- [x] Sprint G6: `galaxie-sprint-6-polish.md` (Next 16 proxy.ts, Settings-Subtree, Lighthouse)

Tests: 79/79 vitest apps/web · pnpm typecheck + build grün.

## Phase Nova-2 — ✅ shipped (Shell) 2026-05-20

Siehe [docs/roadmap/phase-nova-2.md](../../roadmap/phase-nova-2.md) + [docs/plans/done/nova-2-full-product.md](./nova-2-full-product.md).
