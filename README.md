# ValidationKit / Sondr

> **Cross-Vendor Agent-File Trust** — from idea to multi-customer operations.

Find out if anyone actually wants your idea — before you build it. Keep your customer-repos' AI-agent guidance aligned without dropping into each one weekly. One framework, two wedges, one cash engine.

**Status:** Phase 0 (M0–M3) · Hardcore-Local-Only · Working title "ValidationKit" / Sondr (final M9). MIT-licensed core.

---

## The 30-second pitch

ValidationKit reads the agent-files in any repository — `CLAUDE.md`, `AGENTS.md`, `.claude/agents/*`, `.cursor/rules/*.mdc`, `GEMINI.md`, plus 7 more — and tells you, deterministically, what's broken or drifting. **5 of 6 finding categories are deterministic.** The 6th (conflicting-rules) uses an LLM with confidence-banding. No vibe-scores. Every finding includes a `file:line` citation.

Two wedges:

- **`/validate`** — Pre-Build-Validation for Solopreneurs. Audit your prototype. Mom-Test your wedge. Pick a price that doesn't sandwich. Ship.
- **`/operations`** — Post-Build-Operations for AI-Consultancies. Audit 5–30 customer-repos. Drift-detect across them. Distribute template changes via PR-Workflow with Customer-Admin approval (Read-Only-Default).

Both wedges share an OSS core and a hosted web app.

---

## Try it (local)

```bash
# Clone
git clone https://github.com/validationkit-ai/validationkit
cd validationkit
pnpm install
pnpm build

# Run a one-shot audit against any repo (no auth required)
node packages/cli/bin/validationkit.mjs audit /path/to/your/repo

# Drift between two repos
node packages/cli/bin/validationkit.mjs drift /path/to/a /path/to/b

# Boot the web UI (anonymous mode, no DB needed)
pnpm --filter @vk/web dev
# → http://localhost:3000
```

For the full stack (auth + persistence + background jobs + GitHub App):

```bash
pnpm stack:up         # Postgres + Dragonfly + Mailpit + Inngest dev server
cp .env.example .env.local
# generate AUTH_SECRET: openssl rand -base64 32
pnpm db:migrate
pnpm --filter @vk/web dev
```

For GitHub App registration (Customer-PR-Workflow): see [`docs/setup/github-app-checklist.md`](./docs/setup/github-app-checklist.md).

---

## What it actually does

### Audit (5/6 deterministic + 1 LLM)

| Category | Detection | LLM? |
|---|---|---|
| `unused-agent` | No command/workflow references the agent. | No |
| `duplicate-guidance` | Trigram similarity ≥ 85% across 2+ files. | No |
| `context-bloat` | Single file over 8000 tokens (tiktoken cl100k_base). | No |
| `stale-reference` | Markdown link points to a non-existent file. | No |
| `token-budget` | Always-loaded context sum > 25k tokens. | No |
| `conflicting-rules` | Two related files disagree (low/mid/high confidence). | Yes (opt-in via `ANTHROPIC_API_KEY`) |

### Drift (5 deterministic kinds)

`only-in-A` · `only-in-B` · `content-drift` (similarity < 85%) · `frontmatter-drift` (name/description/globs/activationMode change) · `token-drift` (>25% delta).

### Cross-vendor coverage (12/12)

5 MUST (CLAUDE.md, AGENTS.md, `.claude/agents/*`, `.claude/commands/*`, `SKILL.md`)
+ 5 SHOULD (GEMINI.md, `.cursor/rules/*.mdc` with 4-mode activation logic, `.cursorrules`, `.windsurf/rules/*.md`, `.clinerules`)
+ 2 MAY (`.codex/*`, `aider.conf.yml` — pure YAML parser).

### Build-in-Public output

`@vk/bip-generator` — turns any audit or drift report into three social-media drafts (X-thread, LinkedIn, Mastodon) in Skeptic-Mentor voice. Concession-then-Critique. Specific numbers, not vibes. Copy-to-clipboard ready.

---

## Brand voice

- **Skeptic Mentor.** Older founder who doesn't lie, but respects the person.
- **Concession-then-Critique.** Acknowledge what's right, then push back with specific data.
- **Severity bands, not scores.** `{Kill, Weak, Mid, Strong, Exceptional}`. No "87/100".
- **Citation-first.** Every claim ships with a `file:line` and a date.
- **Counter-tagline:** "Most ideas fail this. That's the point."

---

## What's in this repo

| Path | Contents |
|---|---|
| `packages/` | 12 packages: core, parser, audit, drift, llm, cli, db, auth, pr-workflow, github-app, inngest, bip-generator. |
| `apps/web/` | Next.js 16 web app. 14 routes including `/customers`, `/drift`, `/scans`, `/bip`, `/trust`, `/requests`. |
| `docs/` | PRD, Roadmap, Decisions (ADRs), Research (v2–v5), Handbook v0 (8 chapters), Playbook v0 (2 chapters), Legal (DPA + TOMs + Incident-Response + Scope-Policy), Setup (GitHub App). |
| `eval/` | Golden-set (21/30 entries), conflicts dataset, smoke + promptfoo eval scaffold. |
| `examples/` | Sample-good + sample-bad fixtures used by the README demo + tests. |
| `templates/` | Workflow templates (RFC, ADR, feature-spec, test-plan, release-note, sprint-planning). |
| `.claude/` | Project context for Claude Code: CLAUDE.md, agents, commands. |
| `scripts/` | One-off tooling (anonymize.ts, …). |
| `docker-compose.yml` | Local stack: Postgres + Dragonfly + Mailpit + Inngest. |

---

## Quick links

- **Strategy:** [`docs/PRD.md`](./docs/PRD.md) — Single Source of Truth.
- **Roadmap:** [`docs/roadmap/ROADMAP.md`](./docs/roadmap/ROADMAP.md) + [`STATUS.md`](./STATUS.md).
- **Handbook (for indie founders):** [`docs/handbook/`](./docs/handbook/).
- **Playbook (for AI-agencies):** [`docs/playbook/`](./docs/playbook/).
- **Trust Center:** [`http://localhost:3000/trust`](http://localhost:3000/trust) once running.
- **Legal:** [`docs/legal/`](./docs/legal/) — DPA, scope-policy, sub-processors, TOMs, incident-response.
- **GitHub App setup:** [`docs/setup/github-app-checklist.md`](./docs/setup/github-app-checklist.md).
- **Demo walkthrough:** [`docs/demo-script.md`](./docs/demo-script.md) — 5-minute screen-share script for Mom-Tests.

---

## Pricing (as of Sprint 0.8)

| Tier | For | $/mo |
|---|---|---|
| Free OSS | Self-host, solo | $0 |
| Solo Indie | One project, validator + audit | $19 |
| Solo Pro | Three projects, audit + drift | $79 |
| Agency Pro | 10 customer-repos | $299 |
| Agency Scale | 30 customer-repos, audit-trail export | $799 |
| Validation Sprint | Founders, productized 2-week sprint | $4,500 |
| Operations Sprint | Agencies, productized 2-week sprint | $4,500 |

Explicit non-tier: there is **no $99 sandwich**. PRD §6 Constraint #11.

---

## Status

- ✅ 13 packages build clean
- ✅ 71 vitest cases green
- ✅ 21/30 golden-set entries pass (synthetic + dogfood + real-world-like)
- ✅ 4/4 GitHub-App Day-1 Mitigations (Read-Only-Default · DPA-Template · Trust-Center · Requester→Approver-Bridge)
- ✅ 12/12 cross-vendor formats parsed
- ✅ 5/6 deterministic audit categories + 1 LLM opt-in
- ⏳ Validation-Handbook v0 (8 chapters skeleton — this Sprint)
- ⏳ Operations-Playbook v0 (2 chapters skeleton — this Sprint)
- ⏳ Anonymized-customer fixtures (0/9 — unlocks per LOI)

Per-sprint detail in [`STATUS.md`](./STATUS.md).

---

## License

MIT. Phase-4+ BSL re-license is documented in PRD §2 Constraint #6 as a future option, not a current intent.

---

*Owner: Kolja Schöpe ([kol.schoepe@gmail.com](mailto:kol.schoepe@gmail.com)). Built solo in Phase 0–2 per PRD §2 Constraint #9. No VC, no co-founder, no sales-hire before M18.*
