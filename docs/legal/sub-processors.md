# Sub-Processors

> **Status: DRAFT.** Reflects the planned Phase-1/Phase-2 architecture. Phase-0 is Hardcore-Local-Only — there are *no* Sub-Processors active today because no Customer data leaves the Controller's machine.

> Updates: any addition or replacement triggers ≥ 30 days' notice to Customers (per DPA §5).

## Current Sub-Processors

*Phase 0 (today):* **None.** All processing happens on the Controller's local stack via `docker-compose up`.

## Planned Sub-Processors (Phase 1+)

| Sub-Processor | Purpose | Region(s) | Phase | Notes |
|---|---|---|---|---|
| **Neon** | Postgres (production) | EU-Frankfurt (default) / US-East (opt-in) | Phase 1+ | Replaces local pgvector Docker once first cash engagement closes. |
| **Upstash** | Cache (Redis-compatible) | EU-Frankfurt | Phase 1+ | Replaces local Dragonfly. |
| **Inngest Cloud** | Background workflows | Multi-region (EU-pinned config) | Phase 1+ | Replaces local Inngest Dev Server. |
| **Resend** | Transactional email (warm-cold) | EU-pinned | Phase 1+ | Replaces local Mailpit. Postmark documented as fallback. |
| **Vercel** | Edge hosting (Phase 2 only) | EU-Frankfurt | Phase 2+ | Replaces `next dev` / Coolify-on-Hetzner. EU-only region config. |
| **Anthropic** | LLM provider (conflicting-rules audit) | US-East default; EU regions if available | Phase 0+ (opt-in) | Direct provider per PRD §5. Customer's own API key in self-host; Processor key in hosted-mode with Zero-Retention API setting. |
| **Stripe** | Billing | Multi-region | Phase 1+ | No personal data beyond billing email. |
| **GitHub** | GitHub App for PR-Workflow | Multi-region | Phase 0–1 (planned) | Read-only default scope; per-repo opt-in write. |

## Notes per Sub-Processor

### Neon
- Postgres-as-a-Service. EU-Frankfurt region is the default for new projects.
- DPA: <https://neon.tech/dpa>
- TOMs: SOC-2 Type-II, ISO-27001.

### Anthropic
- Direct provider integration (no Vercel AI Gateway — strategic choice per PRD §5.2 to avoid Vercel lock-in).
- Zero-Retention API option will be enabled for all Processor-managed Customer calls.
- Customer-owned API keys in self-host mean Customer is the data controller for that LLM call (Joint-Controller analysis pending lawyer review).

### GitHub
- App scopes default to `contents:read` + `pull_requests:read`.
- Write scope (`contents:write` + `pull_requests:write`) requires per-repo Customer-Admin approval via the Requester→Approver-Bridge.
- PRD §6.4 — 4 Day-1-Mitigations are *gating* before GitHub App goes live.

---

*Last updated: 2026-05-16 (initial DRAFT). Owner: Kolja Schöpe.*
