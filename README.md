# ValidationKit

> **Cross-vendor agent-file trust** — deterministic audit + drift detection across CLAUDE.md, AGENTS.md, .cursor/rules, .windsurfrules, .clinerules, .aider.conf.yml, SKILL.md and 5 more vendor formats.

[![Hosted dashboard](https://img.shields.io/badge/dashboard-validationkit.vercel.app-7c3aed)](https://validationkit.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Phase%201%20deferral-orange)](docs/status/m3-gate-audit.md)

**5 of 6 finding categories are deterministic.** Every finding includes a `file:line` citation. No vibe-scores. The 6th category (`conflicting-rules`) is LLM-augmented with explicit confidence-banding — and only fires when you've set `ANTHROPIC_API_KEY` yourself.

---

## Two ways to use this

### 1. CLI (OSS-MIT, runs locally)

```bash
npm install -g validationkit-cli

validationkit audit .                  # Scan the current repo
validationkit drift ./repo-a ./repo-b  # Compare two repos
validationkit inventory .              # List detected agent-files
validationkit audit . --as-skill       # JSON contract for Claude Skills
```

See [`packages/cli/README.md`](packages/cli/README.md) for full usage.

### 2. Hosted dashboard

<https://validationkit.vercel.app>

- **Free tier:** 1 repo, 20 audits/month, no card.
- **Solo Indie $25/mo · Solo Pro $79/mo · Agency Pro $299/mo · Agency Scale $799/mo · Agency Scale Plus $1,499/mo (annual-only)** — pricing at [`/pricing`](https://validationkit.vercel.app/pricing).
- Trust + DPA + sub-processor RSS feed at [`/trust`](https://validationkit.vercel.app/trust).
- Status + per-surface health at [`/status`](https://validationkit.vercel.app/status).
- LLM-eval FPR history at [`/trust/eval`](https://validationkit.vercel.app/trust/eval) — Constraint #14 audit surface.

> **Stripe live-mode is not flipped yet** as of 2026-05-18. Code is shipped; the founder is mid-KYC. See [`/pricing`](https://validationkit.vercel.app/pricing) for honest current state.

---

## What's in this repo

```
apps/web/                  Next.js 16 app (hosted dashboard)
packages/
  core/                    Shared types (Severity bands, FindingCategory, etc.)
  parser/                  12-format agent-file parser
  audit/                   5 deterministic audit rules
  llm/                     1 LLM-augmented rule + provider abstraction
  drift/                   Cross-repo drift detection
  fixes/                   4 deterministic + 1 LLM-augmented patch generator
  billing/                 Tier config + canAddRepo + isPaid helpers
  cli/                     validationkit-cli (publishable npm package)
  db/                      Drizzle schema + Neon adapter
  auth/                    Better-Auth + magic-link
  inngest/                 Background workflows (audit cron, stripe-reconcile)
  github-app/              Manifest + webhook handlers (App-ID not live yet)
  pr-workflow/             Patch-download fallback (LocalGitClient)
  bip-generator/           Build-in-Public draft generator
skills/
  validationkit-agent-file-audit/    First Anthropic Skill
eval/
  golden-set/              34 fixtures (real-world + dogfood + adversarial)
  conflicts/               LLM-eval harness w/ per-band FPR + N=3 variance
docs/
  PRD.md                   Single source of truth
  roadmap/                 Phase-by-phase plans (phase-0.5-dashboard.md, phase-1.md)
  decisions/               22 ADRs locking strategic + scope decisions
  research/                30+ research outputs (Phase-0.5 + Phase-1 pivots)
  legal/                   DPA template + sub-processor list + scope policy
  outreach/                Tester-invite voice templates
  status/                  Live audit docs (m3-gate-audit.md)
```

---

## Quick local-dev start

```bash
git clone https://github.com/koljaschoepe/validationkit
cd validationkit
pnpm install

# Local stack via Docker (Postgres + Mailpit + Dragonfly + Inngest dev)
pnpm stack:up

# Migrate Neon-compatible schema
pnpm --filter @vk/db migrate

# Boot the web app
pnpm --filter @vk/web dev   # → http://localhost:3000

# Run the CLI locally without npm install
node packages/cli/bin/validationkit.mjs audit .
```

See [`.env.example`](.env.example) for required env-vars.

---

## Run the test gates

```bash
pnpm typecheck      # All 28 workspace packages
pnpm test           # 84/84 vitest (15 files)
pnpm eval           # 34/34 golden-set (smoke)
pnpm build          # 15 turbo tasks
```

The pre-commit checklist for any PR is in [`CONTRIBUTING.md`](CONTRIBUTING.md). CI runs the same gates on every push + PR to `main` via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Current state (2026-05-18)

| | |
|---|---|
| Phase | 1 (post-Phase-0.5 close) |
| Active sprint | Sprint 1.6 NO-GO audit closed — **feature-work paused until Sprint 1.10 audit re-test** per [ADR-0022](docs/decisions/0022-m3-gate-fail-scope-correction.md) |
| M3-Gate technical criteria | 7 / 7 PASS (#6 ⚠️ partial: manifest pinned, live App-ID pending paperwork) |
| M3-Gate commercial criteria | 0 / 3 (Indie Mom-Tests 0/20 · Agency Discovery 0/10 · Agency LOIs 0/5) |
| Surfaces shipped | ~30 production routes + 1 Anthropic Skill |
| Test coverage | 84 vitest + 34 golden-set eval + 1 LLM-eval harness (gated on key) |
| Cumulative cash-out | $0 (Vercel + Neon + Resend free tiers; Stripe + Inngest Cloud + Anthropic remain toggle-on) |

The honest read on why we're in deferral: [docs/status/m3-gate-audit.md](docs/status/m3-gate-audit.md). The lock-in for what happens next: [ADR-0022](docs/decisions/0022-m3-gate-fail-scope-correction.md).

---

## Strategic constraints (load-bearing)

The PRD calls these out as "do-not-soften-without-an-ADR" — listed here so contributors don't accidentally violate them in a PR:

1. **Multi-Provider from Day 1.** Every agent works on Claude Code + Cursor + Codex CLI. Single-Provider lock-in = Anthropic-Acquisition-Risk.
2. **Citation-First.** Every finding has a `file:line` citation. No vibe-scores.
3. **Legitimate channels only.** No DM-automation, no LinkedIn/Instagram outreach automation, no ToS-Verstöße.
4. **Severity bands** ({Kill, Weak, Mid, Strong, Exceptional}) **never numeric scores.**
5. **MIT for core.** BSL re-license is documented option for Phase 4+; no pinky-promise.
6. **Skeptic-Mentor voice.** Concession-then-Critique. No "AI-powered" or "10x your X" copy.
7. **Hybrid Layered (Pivot E).** PLG + Productized-Service in parallel. MM only as Phase-3-Optional. See [ADR-0017](docs/decisions/0017-hybrid-pivot-e.md).
8. **Dual-Wedge** (Pre-Build Validation + Post-Build Agency Operations). See [ADR-0018](docs/decisions/0018-contextforge-as-productized-form.md).

---

## License

MIT. See [LICENSE](LICENSE).

## Security

Don't file public issues for security vulnerabilities. Email <kol.schoepe@gmail.com>. SLA + scope in [SECURITY.md](SECURITY.md).

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) — what lands fast, what lands slow, commit conventions, brand-voice rules.

---

**Maintainer:** Kolja Schöpe · [kol.schoepe@gmail.com](mailto:kol.schoepe@gmail.com)
