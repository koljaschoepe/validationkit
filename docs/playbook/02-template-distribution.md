# 2 — Template Distribution

**Thesis:** Distribute template changes through PRs the customer reviews — not by SSH-ing into customer repos. The audit-trail is the product, not a side effect.

## Concession-then-Critique

**Concession:** Most agencies "distribute templates" by sending a file in Slack with "please update your repo." The customer does it (or doesn't). The agency has no way to know.

**Critique:** Slack-distribution is fine until you have 4 customers, 4 different versions of your "canonical template," and one customer says "we don't have this section, why?" — and nobody, agency or customer, can reconstruct who decided what when. The audit-trail isn't a nice-to-have. It's the bridge between "we've delivered" and "you've adopted."

A PR-based distribution gives you: (1) Customer-Admin reviewed and merged it, on the customer's clock; (2) every change has a commit-author, a merge-message, a timestamp; (3) `validationkit drift` from Sprint N+1 immediately tells you which customer didn't merge yet.

## The 3-step PR-Workflow

```
  Step 1               Step 2                   Step 3
  ─────────────────────────────────────────────────────
  Agency proposes      Customer reviews +       Drift report
  template change      merges on their clock    confirms adoption
  via Read+Write        (in their own GitHub
  scope (opt-in)        UI, with their CI)
```

**Step 1 — Agency proposes.** Through `validationkit` CLI or web UI, generate a PR-diff against the customer-repo. Default behavior: write a patch file (`LocalGitClient`). Opt-in: open a real PR via the registered GitHub App (`GitHubAppClient`). The opt-in is per-repo, mediated by the Requester→Approver-Bridge (`docs/legal/scope-policy.md`).

**Step 2 — Customer reviews + merges.** Customer-Admin sees the PR in their own GitHub UI. Their CI runs. Their code-owners approve. They merge on their clock.

**Step 3 — Drift report confirms adoption.** Run `validationkit drift` between the canonical-template-repo and the customer-repo. Result: customer-repo is now in sync. If the customer adjusted the PR before merging (which is healthy), the drift report surfaces the deltas — and Sprint N+1 may re-canonicalize against the customer's edit.

## Why this is load-bearing

Three failure modes the PR-Workflow prevents:

1. **Customer-data-leak via ghost-write.** An agency consultant pushes directly to a customer repo, breaks their build, accidentally commits a secret. Single biggest reputational risk. With Read-Only-Default + Requester→Approver-Bridge, this can't happen.

2. **GDPR Joint-Controller ambiguity.** When the agency writes to a customer's repo, there's a co-controllership question. Who's the data controller for the resulting commit? With PR-mediated distribution, the Customer-Admin is unambiguously the controller for the merge — they approved it.

3. **Renewal friction at the audit.** When a Customer's procurement asks "show me what your agency changed last quarter," the audit-trail is the answer. With Slack-distribution, the answer is "I have to dig through chat logs." With PR-distribution, the answer is "here's the GitHub PR list, with merge-messages."

## The "first PR" template

For the first PR you dispatch to a customer, use this body template:

> **Subject:** [ValidationKit] Canonical template — initial alignment
>
> Hi [customer champion],
>
> This is the first template-distribution PR from our 14-day Operations Sprint. It aligns this repo's agent-files (CLAUDE.md, AGENTS.md, .cursor/rules) with the canonical baseline we agreed on Day 4–8 of the sprint.
>
> **What this PR does:**
> - Updates CLAUDE.md to match canonical baseline v1.0.
> - Adds 3 new .cursor/rules/*.mdc covering [topic 1, topic 2, topic 3].
> - Updates AGENTS.md cross-vendor section.
> - Does NOT touch any code, infra, or env files. Agent-files only.
>
> **What to review:**
> - The 3 new .cursor/rules cover TypeScript style, React conventions, and your test strategy. Confirm they match your team's actual practice before merging.
> - The CLAUDE.md change replaces the "Conventions" section. Diff the old vs. new for any line that matters to your team.
>
> **What happens after merge:**
> - I'll run `validationkit drift` to confirm the alignment.
> - Sprint N+1 (if we extend) will keep the customer-repo aligned with canonical updates.
>
> Read-only scope was used for this PR opening; this is the only repo where you've granted opt-in write access via the install-request flow.
>
> Questions? Reply here or DM me on Slack.
>
> — [agency consultant]

Notice: explicit about scope, explicit about boundaries, signed.

## The "drift cadence" runbook

Once template-distribution is live, you don't need to be in customer-repos every week. The drift report runs on a cadence:

| Cadence | What it checks | Who acts |
|---|---|---|
| Daily | `validationkit drift <canonical> <customer>` for each customer | Agency oncall, 5 min review |
| Weekly | Audit-report on each customer-repo | Agency consultant, 30 min review |
| Monthly | Full template re-canonicalization (PR-distributed) | Agency lead + customer champion, 90 min sync |
| Quarterly | Customer-side audit-trail export for compliance | Customer-Admin pulls from /trust |

Daily drift takes 5 minutes per customer (read 4 lines of output, decide if a PR is needed). Weekly audit-reports surface category-shifts (e.g., "context-bloat findings rose 30% — someone added a 12k-token agent file"). Monthly re-canonicalization is the "I do my consultant thing" moment. Quarterly audit-trail export is what makes the agency renewable at the customer's procurement-review.

## Skeptic-Mentor counter-example

A 5-person agency tried "central template repo + sync script" instead of PR-Workflow. The script pulled their canonical template and overwrote the customer-side files weekly. Worked for 2 customers, broke at the 3rd — the 3rd customer had local edits the script wiped. Customer-Admin discovered the wipe at code-review the next morning. Slack escalation. Apology emails. 2-day forensics to restore. The agency lost the customer at renewal.

The same situation with PR-Workflow: the canonical change would have opened a PR. The customer's CI would have run. Code-owners review would have flagged the conflict. The customer's local edits would not have been wiped — they'd have been *visible* in the PR diff. No incident.

The cost of the PR-flow is one extra step. The cost of *not* using it is one churned customer per year, minimum.

## Done-when

- All N customer-repos have the GitHub App installed in read-only mode.
- ≥ 1 customer-repo has opt-in write granted via Requester→Approver-Bridge.
- 1 real PR has been dispatched, reviewed, and merged.
- Drift report runs daily on all customer-repos with no manual intervention.
- Quarterly customer-side audit-trail export has been demonstrated.

If any of these is "TBD," your template-distribution is still Slack-based, regardless of how it feels.

---

*End of Operations-Playbook v0. The next sprint's Playbook expansion (v0.5) will cover [Compliance-Frame customers](../legal/scope-policy.md) and [LLM-augmented audit cadence](../legal/dpa-template.md).*
