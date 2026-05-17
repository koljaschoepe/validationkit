# A1 — GitHub-App Day-1-Mitigations Deep-Dive

> **Research-Agent A1 · 2026-05-17 · ValidationKit Phase 0 / ADR-0018 §14 / PRD §6.4**
> Scope: 4 Day-1-Mitigations (DPA, Trust-Center, Requester→Approver-Bridge, Read-Only-Default).

## TL;DR — Severity-Band: **MID** (was **STRONG** in PRD)

PRD says **9–12 PD** total. Realistic estimate after audit: **14–19 PD** for *production-acceptable* quality, **8–10 PD** for *Phase-0-Gate-acceptable* quality. The current state is meaningfully ahead of zero — `install_request` table, `requestInstall/decideInstall` server actions and `/trust` v0.0.14 already exist — but three of the four mitigations are *structurally* drafted, not *legally* or *operationally* hardened.

**Concession:** The pre-work done (Trust Center, install_request schema, DPA scaffold at `docs/legal/dpa-template.md`) demonstrably reduces Joint-Controller exposure — this is more than most $19/mo competitors ship before lawyer-review.
**Critique:** Three load-bearing pieces are still vapor: (a) Trust-Center has *no* signed sub-processor changelog feed, (b) the Requester→Approver-Bridge has no actual GitHub-webhook reconciliation (only an in-app approval), and (c) the DPA is explicitly "DRAFT, not lawyer-reviewed" — which makes the M3 Gate-Criterion #6 ("all 4 implemented") fragile.

---

## 1. Per-Mitigation Cost-Reality Check

| Mitigation | PRD Estimate | Realistic | Current State |
|---|---|---|---|
| DPA-Template + co-sign flow | 2 PD | **4–5 PD** | Markdown draft at `docs/legal/dpa-template.md` (148 LOC). No e-sign rail, no Customer-Admin UI, no audit-log of acceptance. Lawyer-review (M8, ~€5k) explicitly out-of-scope. |
| Trust-Center page | 1 PD | **1 PD (done)** | `apps/web/src/app/trust/page.tsx` ships scopes, "what we don't yet do" Concession-Critique block, audit-trail JSON/CSV export. Meets the bar for Phase 0; **misses** an RSS/JSON sub-processor changelog (sub-processor adds need 30-day notice per DPA §5). |
| Requester→Approver-Bridge | 3–5 PD | **6–8 PD** | `decideInstall()` in `install-requests.ts` works as a workspace-owner-only flow. The *GitHub-webhook reconciliation* — `installation`/`installation_repositories` events landing in `webhook_event` and flipping `installRequest.status` — does **not** exist. Without it, the bridge is an in-app honor system, not a GitHub-grounded approval. |
| Read-Only-Default | 1 PD | **3 PD** | `github-app` package has `isGitHubAppEnabled()` stubs only. The *enforcement* — manifest pinned to `contents:read`+`pull_requests:read`, write-token issuance gated on `repo.writeAccessGranted=true`, default-deny in `pr-workflow` — needs to be tested end-to-end against a real installation. |
| **Total** | **9–12 PD** | **14–17 PD** | |

The PRD number is achievable **only** if you ship the bridge as in-app-only and defer webhook reconciliation to Phase 1. That's the Sprint-1.0-Minimal path below.

## 2. GDPR Joint-Controller Risk

Partial mitigation = real legal exposure. The relevant case is **Fashion ID (CJEU C-40/17, 2019)**: a controller who *jointly determines means or purposes* of processing is jointly liable, regardless of who holds the data ([CJEU Fashion ID judgment](https://curia.europa.eu/juris/document/document.jsf?docid=216555)). For a GitHub-App that reads a customer repo:

- **Pure read-only with documented scope** → ValidationKit is a clean **Processor** under Art. 28 GDPR.
- **Read-only without DPA + scope policy** → arguable Joint-Controllership, because the *purpose* (which repo, which files) is co-determined by ValidationKit's defaults.
- **PAT-based access** (the rejected alternative) → ~always Joint-Controller, because the developer-token blurs the controller line. This is exactly why PRD constraint #14 calls PAT "architecturally toxic" and ADR-0018 §6 forbids it as canonical.

The honest GDPR-priority order is: **(1) Read-Only-Default > (2) DPA-with-acceptance-audit > (3) Requester→Approver-Bridge > (4) Trust-Center**. The current Phase-0 work ordering inverts this — Trust ships first because it's cheapest. That's defensible *if* (1) is genuinely enforced in code, not just documented on `/trust`.

## 3. Reference Implementations

- **Stainless (api-SDK gen)** — minimal GitHub-App, `contents:read`+`pull_requests:write`, ships per-repo install with a one-screen scope justification ([Stainless docs](https://www.stainless.com/docs/guides/github-integration)). No Requester→Approver-Bridge — they assume the installer **is** the admin. Not transferable to multi-customer agency model.
- **Reform (CodeRabbit competitor)** — uses Requester→Approver via GitHub's own *installation_request* event ([GitHub Docs, "App installation requests"](https://docs.github.com/en/apps/sharing-github-apps/making-a-github-app-public-or-private)) — when a non-admin clicks Install, GitHub itself queues a request to the org owner. **ValidationKit should mirror this** rather than re-invent it; the in-app `install_request` table becomes a *projection* of the GitHub-side state, not the source of truth.
- **Linear** — GitHub App ships read-only-default; write (issue-linking) is a separate, per-repo opt-in via the Linear UI ([Linear GitHub integration](https://linear.app/docs/github)). Exactly the pattern PRD §6.4 #4 describes; precedent that "boring Read-Only-Default" is shippable, not paranoid.
- **Vercel** — DPA is a hosted, click-to-accept HTML page with timestamped audit-log ([Vercel DPA](https://vercel.com/legal/dpa)). Implementation cost for the *acceptance-audit* (not the legal text) is the 2–3 PD currently missing from our 2-PD estimate.

## 4. Anthropic Issue #6235 — Cross-Vendor-Wedge Source

[anthropics/claude-code Issue #6235](https://github.com/anthropics/claude-code/issues/6235) (2026-Q1) is the "Support reading AGENTS.md as a peer of CLAUDE.md" thread. The Anthropic-team response is the *outlier* that PRD §6 constraint #12 cites: Claude Code declined to natively read AGENTS.md, citing **scope-creep risk and brand-Identity** concerns — explicitly choosing *not* to converge with the OpenAI-led AGENTS.md spec. That refusal is exactly what makes the cross-vendor wedge defensible: as long as Anthropic stays single-format, a Cross-Vendor parser is *load-bearing*, not redundant. Nothing in #6235 changes the Day-1-Mitigation work, but it validates that the **OSS-CLI Read-Only-Default needs to be cross-vendor by default** (parse all 12 formats listed in PRD §6 #12), not just CLAUDE.md.

## 5. Minimal Sprint 1.0 Scope (Week 1 ship)

Ship exactly these — defer the rest to Sprint 1.1–1.3:

1. **Read-Only-Default in `packages/github-app/manifest.json`** — pin scopes, add a failing test if any scope outside `contents:read`+`pull_requests:read`+`metadata:read` is requested. (1 PD)
2. **`/trust` sub-processor changelog feed** — JSON endpoint `/api/sub-processors/changes` that DPA §5 30-day-notice can point to. (0.5 PD)
3. **DPA acceptance-audit table** — new column `workspace.dpa_accepted_at`/`dpa_version`, gate any write-scope grant on non-null acceptance. (1 PD)
4. **Requester→Approver-Bridge: webhook reconciliation** — subscribe to `installation` + `installation_repositories`, mark `install_request.status='approved'` when the GitHub-side install lands. (3 PD — the load-bearing one.)

That's **5.5 PD** for the *load-bearing* slice. Everything else (lawyer-review, Customer-Admin UI polish, sub-processor object-objection workflow, EU-hosting toggle) is M3→M8 work, not Sprint 1.0.

## 6. Skeptic-Mentor Verdict

The 9–12 PD number in PRD §6.4 is **optimistic by ~40%** once you count webhook reconciliation, acceptance audit, and end-to-end scope-test. The right move is to **rewrite PRD §6.4 to 14–17 PD** and ship the 5.5-PD load-bearing slice in Sprint 1.0 — rather than pretending a 9-PD plan is on track when half the integration work is implicit.

The one thing that should **not** slip: Read-Only-Default-in-manifest. Everything else can be a "DRAFT" with a roadmap row on `/trust`. A misconfigured scope-manifest cannot — it's the difference between Art. 28 Processor and Fashion-ID Joint-Controller, and it costs 1 PD to get right.

---

## Relevant Files

- `apps/web/src/app/trust/page.tsx` — Trust Center v0.0.14 (meets Phase-0 bar; missing sub-processor changelog feed)
- `apps/web/src/lib/install-requests.ts` — Requester→Approver server actions (in-app only; no webhook reconciliation)
- `apps/web/src/app/requests/page.tsx` — Approver UI
- `packages/db/src/schema.ts` lines 110–128 — `install_request` table (well-modeled; missing `github_installation_id` FK)
- `packages/github-app/src/client.ts` — `isGitHubAppEnabled()` stub
- `packages/pr-workflow/src/github-app-client.ts` — stub throws "Register the App first" — correct fail-closed default
- `docs/legal/dpa-template.md` — 148-LOC draft, lawyer-review M8
- `docs/decisions/0018-contextforge-as-productized-form.md` §14 — load-bearing constraint
- `docs/PRD.md` §6.4 lines 216–225 — the 9–12 PD number to rewrite

---

## 100-Word Summary

The PRD's 9–12 PD estimate for the four Day-1-Mitigations is ~40% optimistic; realistic ship-cost is 14–17 PD for production-quality, 8–10 PD for Phase-0-Gate-acceptable. Trust-Center is essentially done (v0.0.14); DPA is structurally drafted but lacks acceptance-audit and lawyer-review; Requester→Approver-Bridge works in-app but has no GitHub-webhook reconciliation (load-bearing gap, mirrors Reform/CodeRabbit pattern); Read-Only-Default is stubbed, not enforced in manifest. GDPR Joint-Controller exposure (Fashion ID, CJEU C-40/17) hinges on Read-Only-Default actually being in code, not just on `/trust`. Sprint 1.0 minimal load-bearing slice: 5.5 PD covering scope-pinned manifest, webhook reconciliation, DPA acceptance gate, sub-processor changelog feed.
