# 5 — Build

**Thesis:** Build the *thinnest demonstrable promise* first. Skip everything that isn't load-bearing for the first paying customer.

## Concession-then-Critique

**Concession:** "Build less" is generic advice and everyone nods at it. Founders agree philosophically and still ship CRUD pages, settings screens, and a marketing site before they have a paying customer.

**Critique:** "Build less" without a criterion is just vibes. The criterion is: **does this feature exist because a real customer named it in writing?** If yes, build. If no, skip. That's it.

## The thinnest demonstrable promise

Your first paying customer is buying *one* promise. Surface that one promise and nothing else.

For ValidationKit's `/operations` wedge, the thinnest promise was: "point me at a repo, tell me what's wrong with the agent-files." Nothing else. Not auth. Not multi-tenant. Not a polished UI. Not docs.

That fit in **Sprint 0.1**: parser + audit + CLI + minimal UI in a single afternoon. Sprint 0.2 onwards expanded the surface only because *paying use cases* demanded it.

The mistake is building everything you "obviously need" before you've validated whether the one promise is even demanded. Auth before users is theatre. Pricing pages before customers are theatre. Marketing landing pages before a working demo are theatre.

## The 5 questions before you write any feature

1. **What's the paying customer's exact next action that this enables?**
2. **What does the customer pay *less* if this feature doesn't exist?**
3. **What's the cheapest way to fake this that still demonstrates the promise?**
4. **What breaks if I skip this entirely?**
5. **Who specifically (by name) asked for this?**

If any of (1), (2), or (5) is "nobody" or "general usefulness," don't build it yet.

## The "build less" surface map

| Feature class | Build before first $1? | Why |
|---|---|---|
| The core promise (the one thing you sell) | YES | This is the product. |
| Auth | NO, until you have 3+ users | Default to "paste a path" / "click a link." |
| Settings | NO, until you have feature differences worth toggling | Hardcode the right answer. |
| Marketing site | NO, until you have one screenshot worth showing | A README is enough. |
| Pricing page | NO, until you have a price + 5 prospects | Calendly link + 1 sentence. |
| Mobile | NO, ever, in Phase 0 | Customers haven't asked. |
| Onboarding flow | NO, until churn is the bottleneck | A 1:1 onboarding call is faster + teaches you more. |
| Notifications | NO, until they prevent churn you've measured | Email is a feature, not a foundation. |
| Search | NO, until your data set has > 50 items per user | grep is enough. |
| Multi-tenancy | NO, until you have 2 paying tenants | One workspace, hardcoded. |

The pattern: hardcode, defer, fake until forced. Real customer feedback unlocks each row.

## The exception: load-bearing risk

You skip features. You don't skip load-bearing *risk-mitigations*.

For ValidationKit specifically, the load-bearing risks were:
- **GDPR / DPA / scope-policy** — could kill the entire Agency-Wedge if mishandled. Built early (Sprint 0.5).
- **Read-only-default + Requester→Approver-Bridge** — a single mistakenly-write-scoped customer kills trust. Built early.
- **Deterministic-first audit-rules** — false-positive-rate over 15% kills consultant trust. Built deterministic, LLM-augmented opt-in.

If skipping a thing would jeopardize the wedge itself (legal, reputational, structural), it's not a feature — it's foundation. Build it.

## Skeptic-Mentor counter-example

A founder spent 4 months building a polished SaaS for a developer-tools idea. Custom Stripe checkout, light/dark mode, two-factor auth, GitHub OAuth, a marketing site with three case-study sections (with fake quotes), 14 pricing-page variations.

When she finally opened to paying customers, she had 80 visits, 0 conversions. Why? The actual promise — the audit her tool ran — wasn't faster than a 30-minute manual review. She'd built the surface around a promise that wasn't demanded.

If she'd built the audit-promise alone in Sprint 0.1 and put it behind a paste-a-path form, she'd have learned in week one what she learned in month five. The marketing site, the auth flow, the pricing variations — all sunk cost.

## Done-when

- Your one promise is demoable end-to-end. (No "but you have to imagine…")
- You can describe what was *deferred* and why, in writing.
- At least 1 customer used the demo and gave specific feedback (not "looks nice").
- You can answer "what's the thinnest version of the next feature I'd build?" without thinking.

If you can't articulate the deferred list out loud, you're building too much.

---

*Next: [Chapter 6 — Launch](./06-launch.md). The first 30 days.*
