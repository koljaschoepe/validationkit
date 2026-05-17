# 1 — Customer Onboarding

**Thesis:** The first 14 days of a customer engagement either compound or decay. Engineer them as a sprint, not as a series of meetings.

## Concession-then-Critique

**Concession:** Most agencies onboard customers competently. Kickoff call, intro deck, a Slack channel, regular check-ins. Nothing collapses.

**Critique:** "Nothing collapses" is the floor. The ceiling — what onboarding *could* deliver — is the customer self-deriving the next 10 weeks of work. Most onboardings deliver a kickoff. The Operations Sprint delivers an *operating system*: a canonical agent-file template, a working audit-trail, a PR-workflow live, and a customer-side champion who runs it without you.

The difference shows up at Week 8, when the agency-side bandwidth disappears for two days and the customer keeps moving. That only happens if Week 1 set up the operating system, not just the relationship.

## The 14-day sprint shape

```
  Day 1     Days 2–3     Days 4–8       Days 9–11      Days 12–13    Day 14
  ─────────────────────────────────────────────────────────────────────────
  Kickoff   Audit         Template +     PR-Workflow    Customer     Retro +
  + repo    + drift on    canonical      rollout to 1   training     handoff
  inventory 3 customer    baseline       repo (read +                + sell next
            repos         (custom)       opt-in write)               sprint
```

**Day 1 — Kickoff (60 min).** Agree on:
- Who the customer-side champion is (one named person).
- Which 3 customer-repos go in the initial audit set.
- What "done" looks like in 14 days: written outcome, not vibe.

**Days 2–3 — Audit + drift across 3 customer-repos.** Use `validationkit audit` + `validationkit drift`. Deliverable: 3 audit-reports + 2 drift-reports (pairwise). Send before Day 4 kickoff #2.

**Days 4–8 — Template + canonical baseline.** This is the custom 20%. You define the agency's canonical template across CLAUDE.md / AGENTS.md / .cursor/rules / .windsurf — informed by the audit findings.

**Days 9–11 — PR-Workflow rollout.** Read-only by default. Install the GitHub App on the customer's repo set with `contents:read + pull_requests:read`. Opt-in write granted per-repo via the Requester→Approver-Bridge (see [Chapter 2](./02-template-distribution.md)).

**Days 12–13 — Customer training.** 90-minute screen-share. The customer-side champion runs the next audit + drift themselves. You watch. They drive.

**Day 14 — Retro + handoff + sell next sprint.** Written retro (what worked, what didn't, what's the 30-day plan), handoff doc, and a clear offer for the next sprint (typically the second customer-repo set, or a "30-day check-in").

## The Day-1 checklist (20 items, do them all)

**Pre-sprint (1 week before Day 1)**
- [ ] DPA signed (use `docs/legal/dpa-template.md`).
- [ ] Read-only-by-default scope confirmed in writing (`docs/legal/scope-policy.md`).
- [ ] Customer-side champion identified by name + email.
- [ ] 3 repos pre-selected, with read access verified.
- [ ] Sprint plan one-pager sent to customer (this chapter, customer-adapted).

**Kickoff call (Day 1)**
- [ ] 60 min max. (More is theatre.)
- [ ] One-sentence "definition of done" written into shared doc by minute 30.
- [ ] First audit run live on Zoom against 1 of the 3 repos. Show, don't tell.
- [ ] Calendar invites sent for Day-4 kickoff #2, Day-12 training, Day-14 retro.
- [ ] Decision-maker present (not just the champion).

**Day-1 hygiene**
- [ ] Shared workspace in ValidationKit created for the customer.
- [ ] Champion onboarded with read-only access.
- [ ] First scan persisted in `/scans` (so customer can pull it up async).
- [ ] First-week deliverables list written + visible to the customer.
- [ ] Slack/Teams channel created with response-time SLA: < 4 business hours.

**Boundaries (the unsexy part)**
- [ ] You're not on Zoom after 5pm local. Pre-state this Day 1.
- [ ] Two sync calls in the 14 days, max. (Day 4, Day 12.) Everything else is async.
- [ ] Scope-creep response is pre-drafted: "We'll add that to the next sprint scope. Want me to send the next-sprint proposal Day 14?"
- [ ] If the customer asks "is this in scope?" the default answer is "let's check the Day-1 doc together."

## The "definition of done" written Day 1

This is the load-bearing artifact. Without it, scope creeps. With it, every conflict has an objective referent.

Template:

> **By Day 14, [customer] will:**
> 1. Have a canonical AI-agent template defined across CLAUDE.md / AGENTS.md / .cursor/rules.
> 2. Have a baseline audit-report for [3 named repos] and a drift-report across them.
> 3. Have the ValidationKit GitHub App installed on [N repos] in read-only mode.
> 4. Have [N specific repos] with write-scope approved for PR-workflow.
> 5. Have one customer-side champion ([named person]) trained on running audits + drifts themselves.
> 6. Have a 30-day post-sprint plan with 2 scheduled audit-cadence runs.
>
> **Out of scope (will become Sprint 2):**
> - LLM-augmented conflicting-rules across the full customer set.
> - Migration of legacy `.cursorrules` to `.cursor/rules/*.mdc`.
> - Cross-customer aggregation reporting.

Notice: 6 outcomes + an explicit out-of-scope list. Pre-named. Pre-negotiated.

## Skeptic-Mentor counter-example

A 12-person agency ran a "discovery sprint" with a Fortune-1000 customer. No fixed scope. No definition-of-done. Day 30: the customer asked "are we done yet?" and the agency couldn't say yes — because there was no objective marker. The agency had done excellent work, written 4 audit-reports, advised on 6 repos, trained 3 internal people. But the customer's CFO measured "value delivered" by the original deck, which had bullet-points like "comprehensive review." Comprehensive of what? Compared to what?

Result: the customer dragged out negotiation for the next sprint, ended up paying 60% of the agency's invoice "for the discovery period" and never re-engaged.

The same agency, post-Operations-Sprint framework: 6 named outcomes, explicit out-of-scope, Day-14 retro signed by the customer. Renewal rate jumped from 1-in-5 to 4-in-5.

## Done-when

- 6 named outcomes signed by the customer Day 1.
- 5 of 6 delivered by Day 14 (1-out-of-6 deferred is acceptable if pre-flagged Day 7).
- Next-sprint proposal sent Day 14.
- Customer-side champion can run one audit-loop start-to-finish without your help.

If the customer-side champion still needs you to run the tool, you've delivered consulting, not an operating system.

---

*Next: [Chapter 2 — Template Distribution](./02-template-distribution.md). The PR-Workflow.*
