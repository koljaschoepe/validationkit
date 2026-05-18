---
slug: _template
customerName: Customer Name (e.g. "Acme Consultancy")
customerCompany: Acme GmbH
primaryContact: ceo@acme.example
signedDate: 2026-MM-DD
tier: agency_pro
status: draft  # draft | active | paused | archived
dpaVersion: v0-draft-2026-05-17
---

# Onboarding — {{customerName}}

> This is the per-customer onboarding doc. Replace placeholders, save as
> `docs/customer-onboarding/<slug>.md`, then send the customer the link
> `https://validationkit.vercel.app/onboarding/<slug>`.

## What this page is

A single landing page the customer's Admin can read **before they install
the GitHub App or grant repo-write access**. It records:

- What ValidationKit will read from their repos
- What ValidationKit will NOT do (read-only-default, no auto-apply)
- The DPA version they need to accept
- The point-of-contact at ValidationKit
- The escalation path (security / compliance / billing)

## Scope

**Repos covered by this engagement:**

- `acme/web` — read-only, audited 4×/day
- `acme/api` — read-only, audited 4×/day
- `acme/mobile` — read-only, opt-in write requested via Requester→Approver-Bridge

**What we read:**

- Twelve agent-file formats (CLAUDE.md, AGENTS.md, .cursor/rules,
  .windsurfrules, .clinerules, .aider.conf.yml, SKILL.md, .gemini, etc.)
- Markdown files referenced by outbound links from agent-files (for the
  stale-reference rule).
- Repo metadata (commit SHA, branch list) via the GitHub App `metadata:read`
  scope.

**What we do NOT read:**

- Source code outside the agent-file glob.
- `.env*`, secrets, credentials.
- Issue / PR comment bodies (just metadata).

## DPA

Sign the DPA at <https://validationkit.vercel.app/trust/dpa>. Version
**{{dpaVersion}}** is the current draft pre-M8 lawyer-review. M8 will
re-circulate a lawyer-reviewed version; your acceptance here is preserved
verbatim against the version-tag.

## Approver flow

The first Admin you invite into the workspace gets full RBAC. Subsequent
write-grants on a per-repo basis require the Approver bridge: see
`/customers/[id]/access` once the workspace is provisioned.

## Sub-processors

Public, machine-readable list at:

- <https://validationkit.vercel.app/trust/sub-processors.json>
- <https://validationkit.vercel.app/trust/sub-processors.xml> (RSS, 30-day
  prior-notice contract per DPA §5)

Today's stack: Neon (DB) · Vercel (edge) · Resend (email) · Stripe (billing,
test-mode) · Inngest Cloud (background workflows) · GitHub App (read-only by
default) · Anthropic / OpenAI (opt-in via env, LLM rules only).

## Audit-trail export

You can pull the workspace audit-trail at any time:

- JSON: `https://validationkit.vercel.app/api/audit-trail?format=json`
- CSV: `https://validationkit.vercel.app/api/audit-trail?format=csv`

Retention: 12 months. Mechanism: `docs/playbook/03-compliance-frame.md` §5.

## Escalation

| Concern | Contact | SLA |
|---|---|---|
| Security vulnerability | kol.schoepe@gmail.com (private) | 7-day ack, 14/30/90 fix by severity |
| Compliance / DPA / GDPR | kol.schoepe@gmail.com | 5 business days |
| Billing / invoice | kol.schoepe@gmail.com | 2 business days |
| Day-to-day product | GitHub issue at <https://github.com/koljaschoepe/validationkit/issues> | best-effort |

## Status

- **Signed:** {{signedDate}}
- **Tier:** {{tier}}
- **Current status:** {{status}}

---

*Pre-M8 contract: this doc is the source-of-truth for the engagement until the
hosted-app dashboard absorbs the per-customer view in Phase 2. Edit in
`docs/customer-onboarding/<slug>.md` and push to update.*
