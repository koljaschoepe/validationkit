# Repository Access Scope Policy

> **Status: load-bearing.** This file is the canonical source for what scopes ValidationKit requests and when. Code in `@vk/repo-access` enforces it. Trust-Center page at `/trust` cites it.

## TL;DR

**Read-only by default. Write requires explicit per-repo opt-in via Requester→Approver-Bridge.**

## Local-filesystem mode (Phase 0)

| Operation | Scope |
|---|---|
| `pnpm audit <path>` | Read-only filesystem walk |
| `pnpm drift <a> <b>` | Read-only filesystem walk on both paths |
| Web UI `/`, `/drift` | Read-only filesystem walk via server action |
| PR-Workflow `LocalGitClient` | Writes a `.patch` file into a configured output dir; never modifies the source tree directly |

No network egress. No write to the repo under audit.

## GitHub App mode (Phase 0–1 planned; rollout follows PRD §6.4 Mitigations)

| Default scope | Read-only |
|---|---|
| `contents:read` | Required to walk the agent-file tree |
| `pull_requests:read` | Required to verify drift between branches |
| `metadata:read` | Implicit |

### Write scope opt-in

| Opt-in scope | When granted |
|---|---|
| `contents:write` | Only after Customer-Admin approves an `install_request` of type `write` via `/requests`. |
| `pull_requests:write` | Same as above. Required to dispatch PR-Workflow output. |

The opt-in is **per-repo, not workspace-wide**. Approving write on `acme/customer-1` does not grant it on `acme/customer-2`.

### Revocation

Customer-Admin can revoke write at any time via the `/requests` UI or by uninstalling the GitHub App on the repo. Revocation takes effect immediately for new operations; in-flight PR-dispatches complete and surface in `/requests` with status `revoked-after-dispatch` (audit-trail).

## Why Read-Only is the Default

1. **Trust before utility.** Customers can adopt ValidationKit without giving up write access on day one. Anonymous + read-only is the cheap-to-trust entry path.
2. **GDPR Joint-Controller risk.** A write-scoped App that touches Customer code raises co-controllership questions. Read-only avoids that bucket of analysis.
3. **PRD constraint #14** declares the 4 Day-1-Mitigations Pflicht. Read-Only-Default is the operationally easiest of the four (1 PD).
4. **It blocks the Anthropic-Outlier-issue.** Issue #6235 (Cross-Vendor file inconsistency) is the wedge we sell; we can already deliver value at read-only by surfacing the inconsistency, even before writing the fix.

## Compatibility matrix

| Tier | Default scope | Write opt-in available |
|---|---|---|
| Solo Indie ($19) | Read | No (single-repo, no PR-workflow tier) |
| Solo Pro ($79) | Read | Yes, single-repo |
| Agency Pro ($299) | Read | Yes, up to 10 repos, per-repo approval |
| Agency Scale ($799) | Read | Yes, up to 30 repos, per-repo approval, audit-trail export |
| Enterprise (Phase 3) | Read | Yes, custom SSO-mediated approval workflow |

## Audit trail

Every scope-relevant event lands in the `install_request` and `audit_log` tables:

- requester user id
- target repo
- requested scope
- decision (approve / reject)
- approver user id
- timestamp
- decision note

This is intentionally a Customer-visible audit-trail. We don't keep secrets about *who* asked for write *when*.

---

*Last updated: 2026-05-16. Owner: Kolja Schöpe.*
