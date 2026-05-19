# TODO — Free-Form Ideen-Capture

> Volatile. Source-of-Truth ist `docs/vision.md` + `docs/roadmap/phase-galaxie.md` + `docs/plans/`.
> Ideen, die >1h Work oder strategisch sind → in `docs/plans/<slug>.md` promoten.

---

## Phase 0 — Foundation (shipped 2026-05-16)

(historische Sprint-History, Vollständigkeits halber unten erhalten)

### Week 1 (2026-05-16 → 2026-05-22)
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

### Sprint 0.2 — Vendor Completeness + Test Net ✅ shipped 2026-05-16
- [x] tiktoken statt char/3.5 token-count
- [x] `.cursor/rules/*.mdc` Parser inkl. 4-Mode-Activation-Logik
- [x] `.cursorrules` legacy + `.windsurf/rules` + `.clinerules` (Format-SHOULD complete)
- [x] Default-Ignore für `examples/**` + `docs/archive/**` + Opt-in-Flags
- [x] `--out=audit-report.md` Flag im CLI für Markdown-Export
- [x] vitest mit 28 Tests + smoke-eval gegen sample-good / sample-bad

### Sprint 0.3 — Audit Depth + Multi-Repo ✅ shipped 2026-05-16
- [x] **LLM-Audit für `conflicting-rules`** mit Confidence-Banding (AI SDK 6 + Anthropic direct; graceful no-op ohne Env-Key)
- [x] **Token-Budget-Heuristic** als 5. deterministische Audit-Regel
- [x] Golden-Set scaffolding: manifest.json + schema + 3 seed entries + smoke-eval walker
- [x] **Drift-Detection**: @vk/drift package + CLI `drift <a> <b>` + Markdown-Export + Web-UI /drift route
- [x] 38/38 vitest cases green incl. token-budget, drift, llm-no-op

### Sprint 0.4 — Local Stack + Persistence ✅ shipped 2026-05-16
- [x] **docker-compose.yml** mit Postgres pgvector + Dragonfly + Mailpit + Inngest
- [x] **.env.example** + `pnpm stack:up/down/reset/logs` scripts
- [x] **@vk/db** mit Drizzle 0.45 (8 Tables: Better-Auth 4 + workspace/repo/scan/finding) + 0000-Migration
- [x] **@vk/auth** mit Better-Auth 1.6 + Magic-Link via Mailpit-SMTP
- [x] `/login`, `/scans`, `/scans/[id]`, `/api/auth/[...all]` Routes
- [x] Audit-Action persistiert bei signed-in user (graceful degradation ohne DB)
- [x] 7/7 vitest cases neu (db + auth lazy-init + auth-disabled paths)

### Sprint 0.5 — Compliance + PR-Workflow Foundation ✅ shipped 2026-05-16
- [x] **Trust-Center page** /trust mit honest Concession+Critique
- [x] **DPA-Template** in docs/legal/ + Sub-Processors + Scope-Policy
- [x] **Read-Only-Default**: write_access_granted column + enforceAccess gate
- [x] **Requester→Approver-Bridge** (schema+actions+UI; webhook stub bis Sprint 0.7)
- [x] **@vk/pr-workflow** mit PRClient + LocalGitClient + GitHubAppClient-Stub
- [x] **Drift-Persistence** /drifts + /drifts/[id]
- [x] **Golden-Set +12 adversarial** (15/30 entries)
- [x] 48/48 vitest cases green; 10/10 packages bauen clean

### Sprint 0.6 — GitHub App + Background Workflows ✅ shipped 2026-05-16
- [x] **GitHub App manifest** (one-click registration) + docs/setup/github-app.md walkthrough
- [x] **@vk/github-app package**: octokit-App-Auth + HMAC-SHA-256 webhook verification + parseWebhookEvent
- [x] **GitHubAppClient real**: createOrUpdateFileContents + pulls.create idempotent
- [x] **Webhook-Handler real**: signature-check, install.created/.deleted, installation_repositories.added/.removed
- [x] **@vk/inngest package** + audit-requested function + threshold-based background-enqueue
- [x] **scan.status** state machine (queued/running/complete/failed)
- [x] **TOMs-Register** + **Incident-Response-Playbook** in docs/legal/
- [x] **RequestWriteButton** component (1-click "request write access")
- [x] 61/61 vitest cases green; 12/12 packages bauen clean

### Sprint 0.7 — Multi-Customer + BiP + Polish ✅ shipped 2026-05-16
- [x] **webhook_event audit-trail** mit x-github-delivery idempotency
- [x] **Multi-Customer-UI**: /customers list + /customers/[id] detail + AddCustomerForm
- [x] **Background-Scan polling**: /scans/[id] ScanStatusBanner 2s-poll → auto-refresh
- [x] **@vk/bip-generator** + /bip Web-Route (X/LinkedIn/Mastodon Drafts)
- [x] **aider.conf.yml** YAML-only Parser (12/12 vendor surface complete)
- [x] **Golden-Set +6** (3 dogfood-subpaths + 3 real-world-like) → 21/30
- [x] 71/71 vitest cases green; 13/13 packages bauen clean

### Sprint 0.8 — Handbook + Playbook + Compliance Polish ✅ shipped 2026-05-16
- [x] **Validation-Handbook v0**: 8 Kapitel-Skelette (M3-Gate Criterion #8) ✅
- [x] **Operations-Playbook v0**: 2 Kapitel-Skelette (M3-Gate Criterion #9) ✅
- [x] **Eval-Pipeline mit Promptfoo**: eval/conflicts/dataset.json + run.ts + promptfoo.yaml scaffold
- [x] **anonymized-customer Bucket**: README + .gitignore + 9 LOI-locked slots + scripts/anonymize.ts
- [x] **GitHub-App-Checklist**: docs/setup/github-app-checklist.md (30-min Walkthrough)
- [x] **Marketplace polish**: README.md rewrite + docs/assets/ + docs/demo-script.md

### Sprint 0.9 — Execution Bridge ✅ shipped 2026-05-16
- [x] **recruitment.md** mit 30 strukturierten Slots (10 Indie + 10 Agency + 10 Compliance-Frame), keine erfundenen Namen
- [x] **docs/outreach/** mit 6 Templates (3 Indie + 3 Agency: warm-intro / cold-but-specific / build-in-public-reply / conference-followup) inkl. Reply-Rate-Erwartungen
- [x] **/dogfood-repo slash-command** für Weekly-Self-Audit-Cadence
- [x] **scripts/bip-counter.ts** + docs/bip-posts/ Frontmatter-Conventions + idempotente STATUS.md-Updates
- [x] **scripts/docker-e2e-smoke.sh** Multi-Layer-Smoke mit per-Layer-Exit-Codes
- [x] **docs/playbook/03-compliance-frame.md** (Track-C1 Strong-Pain-Segment, $8500 + $1500/qtr)

### Sprint 0.10 — Light-Code Polish ✅ shipped 2026-05-16
- [x] **Audit-Trail-Export Feature** (`/api/audit-trail?format=json|csv`, Compliance-Frame Q4-Antwort)
- [x] **CHANGELOG.md** retroaktiv für v0.0.1 → v0.0.10
- [x] **Mom-Test Interview-Skript standalone** (docs/handbook-extras/mom-test-script.md)
- [x] **/compete-check Q2-2026** Refresh (kein ADR-Re-Open, 5-LOI bleibt load-bearing)
- [x] **Handbook ch 2 v0.5** worked-example (Mark transcript, ~1k Wörter)

### Sprint 0.11 — Customer-Side-Execution (W9–W11, Kolja's calendar required)
- [ ] **GitHub App registrieren** (per docs/setup/github-app-checklist.md, ~30 min)
- [ ] **Docker E2E** echt durchlaufen (`pnpm e2e:smoke` + Magic-Link-Round-Trip manuell)
- [ ] **5 Indie + 3 Agency Slots** in recruitment.md mit echten Namen befüllen
- [ ] **3 erste Outreach-DMs** versenden (1 warm-intro indie + 1 cold-but-specific indie + 1 agency-conference-followup)
- [ ] **1 erstes Mom-Test-Interview** durchführen + transkribieren (interviews/ git-ignored)
- [ ] **First BiP Post** schreiben + posten + pnpm bip:count
- [ ] **Validation-Handbook v0.5 ch 2** mit Beispiel aus erstem real-interview ersetzen (synthetic "Mark" → echte Transkript-Quote, mit Customer-Consent)
- [ ] **PR-Workflow E2E-Test** (real GitHub App → dispatch → PR auf test-repo)
- [ ] **toms-register.md** Phase-0+ Status-Spalte aktualisieren nach echtem E2E-Setup
- [ ] **Light-code follow-ups (if Kolja prefers code-sprint):**
  - audit-trail-export round-trip-import script (compliance customer can restore)
  - slack-notification on audit `Kill` finding
  - web-UI mobile-responsive sweep
  - aider.conf.yml special-case YAML parser test (currently only the parser exists, no dedicated test)
  - audit-trail JSON Schema published in docs/setup/ (lets customers validate the export)

---

## Phase Galaxie — ✅ shipped 2026-05-19

Komplette 6-Sprint-Roadmap aus `docs/roadmap/phase-galaxie.md` ausgeliefert.
Alle Plan-Files in `docs/plans/done/`:

- [x] Pre-Work: `galaxie-pre-work.md` (Doc-Konsolidierung + ADRs)
- [x] Sprint G1: `galaxie-sprint-1-ui-skeleton.md` (PixiJS-Galaxie W1-4, 60fps@150 Asteroiden, Pan/Zoom/GSAP-Snap, MiniMap, Cmd+K)
- [x] Sprint G2: `galaxie-sprint-2-data-binding.md` (Customer-Schema + DAL + Membership-Gate, Migration 0008)
- [x] Sprint G3: `galaxie-sprint-3-inspector.md` (Inspector-Panel, Click-Drill-In, /customers refactor)
- [x] Sprint G4: `galaxie-sprint-4-ai-solutions.md` (lazy @vk/fixes integration, Solution-Cache, Confidence-Opacity, Migration 0009)
- [x] Sprint G5: `galaxie-sprint-5-apply.md` (Apply/Dismiss/Snooze via @vk/pr-workflow LocalGitClient, apply_action audit-trail, Migration 0010)
- [x] Sprint G6: `galaxie-sprint-6-polish.md` (Next 16 proxy.ts, /settings-Subtree, OnboardingBanner, EmptyGalaxie, Quadtree-Lib, Mobile-Inspector, Lighthouse-Script)

Tests: 79/79 vitest apps/web · pnpm typecheck + build grün.

## Beta-Launch Pre-Reqs (User-Side, kein Claude-Code)

- [ ] **GitHub-App registrieren** via `docs/setup/github-app-checklist.md` (~30 min). Setzt `GITHUB_APP_ID/CLIENT_ID/PRIVATE_KEY` in `.env.local` (prod: Vercel-Env).
- [ ] **Vercel-Account + Deploy**: Repo connecten, Env-Vars setzen, Domain claimen.
- [ ] **Stripe-Webhook**: URL in Stripe-Dashboard auf `<domain>/api/stripe/webhook` setzen.
- [ ] **Erste 5 Customer-Outreach**: läuft im separaten Strategy-Framework, nicht hier.
- [ ] **Manueller Lighthouse-Audit-Run**: `apps/web/scripts/lighthouse-audit.sh` gegen Prod-URL. Goal ≥85 Desktop.
- [ ] **Branch-Merges**: alle 6 Sprint-Branches in `main` (kann Solo direkt, kein PR-Review nötig).

## Re-Open-Triggers (würden eine neue Phase auslösen)

Aus `docs/roadmap/phase-galaxie.md`:
- W6 Galaxie Mobile <30fps → Reduced-Motion-Toggle als G7-Pflicht.
- W12 LLM-Solution accept-rate <70% → Multi-Pass-Upgrade in eigenem Sprint.
- W16 GitHub-App-Registration verzögert → G5-Apply-Fallback auf Copy-to-Clipboard-Mode.
- Konkurrent shippt vergleichbare Galaxie → Differentiator-Audit + Strategie-Update.

## Post-Galaxie / Phase-Future

`docs/roadmap/phase-future.md` wird **erst nach Beta-Launch-Feedback** skizziert. Themen-Backlog:
- Skill-Distribution-Workflow (`@vk/skills` Package)
- Multi-Workspace-Aggregation (für Mega-Agencies mit Sub-Tenancies)
- Self-Hosted-OSS-Variante
- AAIF-Membership
- Multi-Pass AI-Solutions
- Compliance-Tier (SOC-2 light)

## Parking-Lot

(Ideen, die noch keiner aktiven Phase zugeordnet sind.)

- npm-Namespace `validationkit` reservieren (nach Gate-Pass)
- Domain-WHOIS-Check `sondr.ai`
- Anwalts-Briefing-Doc Sondr+Pondera vorbereiten (für M8)
- AAIF-Silver-Membership-Antrag ($5k/yr)
- Validation-Handbook v0.5 → v1.0 (nach 10+ Engagements)
- Stripe Test-Mode Setup
- Vercel Hobby-Account erstellen (nach 1. Cash-Engagement)
- `/customers/[id]/access` customer-scoped Refactor (G6.H deferred)

---

## Backlog Ideen (Free-Form)

(noch nicht reif für RFC oder Feature-Spec)

- ...

---

*Update-Pattern: Idee einfangen, später ins richtige Doc promoten. Keine Sorgfalt erforderlich.*
