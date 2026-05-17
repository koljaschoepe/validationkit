# 7 — Iterate

**Thesis:** Measure decisively, decide on a pre-committed cadence, and kill things faster than your feelings allow.

## Concession-then-Critique

**Concession:** Iteration is *uncomfortable*. Killing a feature you built is a personal loss. Founders compensate by iterating "softly" — keeping features around "in case," running 17 simultaneous experiments, "letting it bake."

**Critique:** Soft iteration is no iteration. The cost of an undead feature is paid in cognitive load, surface complexity, support burden, and slowed learning. You can't iterate if you can't kill. Pre-commit the kill-criterion before you ship the experiment, so the decision is already made when the data arrives.

## The 3-week iteration cycle

```
  Week N        Week N+1        Week N+2
  ─────────────────────────────────────
  Ship          Measure         Decide
  - 1 experiment - 5 specific  - Kill, double-down,
  - kill-criteria  metrics       or iterate
    pre-committed  daily         - Write the decision down
```

**Week 1: Ship.** One experiment, not three. Pre-commit the kill-criterion in writing: *"If conversion is below X by Day 14, I will kill this."*

**Week 2: Measure.** Same five metrics every morning, same dashboard. No new metrics mid-stream. No looking at correlations until the experiment is over.

**Week 3: Decide.** Read the data against the pre-committed criterion. Kill, iterate, or scale. Write the decision down. *Then* and only then start the next cycle.

## The 5 metrics worth measuring (everything else is noise)

For a Phase-0 product like ValidationKit:

| Metric | Why it matters | Cadence |
|---|---|---|
| **Paid customers (count)** | The only number that matters for survival. | Daily |
| **Engagement-to-paid rate** | Tells you if the funnel is broken or the demand is broken. | Weekly |
| **One specific user-story success-rate** | Are people actually getting the promise? | Weekly |
| **Time-to-first-value** | < 5 min = good. > 30 min = friction. | Per-cohort |
| **Churn-reason (qualitative)** | Why people leave is more diagnostic than how many. | Per-churn-event |

Everything else — pageviews, MAU, MRR forecasts, NPS — is downstream of these 5. Track them in a Notion or a Google Sheet. No fancy dashboard.

## The 4 decisions every cycle

After each 3-week cycle, force yourself to answer:

1. **Kill** — what feature, channel, or assumption do I have to retire?
2. **Double-down** — what's working that I should commit to harder?
3. **Iterate** — what's working *partially* and needs one more cycle?
4. **Defer** — what idea do I refuse to look at this cycle, no matter how exciting?

Write all four. Especially the **Defer**. The Defer list is what stops you from chasing the shiny.

## The "5 specific churn questions"

When a paid customer churns, send them this exact email within 48 hours:

> Subject: One question  
>  
> Hey [name],  
>  
> Thanks for trying [product]. Before you go: I'd love 60 seconds of your time. What would have to have been *different* for you to still be using it today? Just the most honest answer is gold for me.  
>  
> No follow-up, no upsell. Just genuinely curious.  
>  
> — [your name]

You'll get 3 categories of answer:
- **Wrong wedge:** "It didn't solve my actual problem." → Adjust positioning. Don't fix features.
- **Wrong promise:** "It worked but I wasn't getting value." → Adjust the demo / onboarding.
- **Wrong moment:** "Right product, wrong time." → Defer. Re-out reach in 6 months.

Three categories, three different responses. Mixing them is how you build feature soup chasing churned customers' last-mentioned wish.

## Skeptic-Mentor counter-example

A founder shipped a "premium tier" with 5 new features over 6 weeks. None converted. He kept iterating — adjusted the price, added a 6th feature, redesigned the page. Three months in, zero conversions.

The kill-criterion he should've pre-committed: *"If by Week 4 I don't see 1 paid Premium, I will kill the tier."* Instead, he soft-iterated. Sunk-cost compounded until the wider product suffered.

When he finally killed it (against his feelings), MRR went *up* the next month — because his attention returned to the Solo tier where customers were actually converting. The kill bought him 4 hours/day of attention back.

## Done-when

- Pre-committed kill-criterion is written before every experiment.
- The 5-metrics-dashboard is updated daily.
- One **Defer-list item per cycle** is documented. (If you can't name one, you're not making real decisions.)
- One churned customer per cycle has answered the "what would've been different?" question.

If you can't kill, you can't iterate. If you can't iterate, you're a museum.

---

*Next: [Chapter 8 — Anchor](./08-anchor.md). The cash engine before scale.*
