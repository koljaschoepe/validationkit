# 4 — Pricing

**Thesis:** Anchor higher than you think. Tier with intent. Never sandwich.

## Concession-then-Critique

**Concession:** Pricing is the single feature with the highest leverage and the lowest founder confidence. It's reasonable to want to "let the market tell you" and start cheap.

**Critique:** "Cheap to test" is a real lever — once. After you ship at $19, you have to do a price-raise migration, anger early customers, and re-position. Cheap-then-raise reads as a thirst signal; expensive-then-discount reads as confidence. Anchor high. The market tells you faster.

## The "anchor + 2 tiers + service" structure

The ValidationKit pricing surface itself is a worked example:

| Tier | Price | Job-to-be-done | Anchor relationship |
|---|---|---|---|
| Free OSS | $0 | Try it before you trust it. | Below the buying line. Not a tier — a funnel input. |
| Solo Indie | $19/mo | One project, one validator, real findings. | First "yes." 80% of self-serve traffic. |
| Solo Pro | $79/mo | Three projects, audit-report, drift. | The "upgrade I knew I'd need" tier. ~20% of Solo cohort. |
| Agency Pro | $299/mo | 10 customer-repos, audit + drift. | Multi-customer wedge starts here. |
| Agency Scale | $799/mo | 30 customer-repos, audit-trail export. | The anchor against incumbents. |
| Productized Sprint | $4,500 | 2-week sprint, 80% standard / 20% custom. | The cash engine. |

Critical: **no $99 tier.** PRD §6 Constraint #11 (Track-C1-driven). A $99 tier looks like a compromise. It cannibalizes both the $79 ("close enough") and the $299 ("too much risk for a 2× jump") segments. The sandwich is the most common pricing mistake. Don't make it.

## The 3 rules of anchoring

1. **Your highest tier is the price-display.** It anchors every other tier. If your highest tier is $79, the buyer reads that as "this product caps at $79." If your highest tier is $799, the buyer reads $79 as "starter — for serious work I'd go higher."
2. **Your lowest paid tier should be 4–5× your free tier in value-felt.** Not in feature count. In felt-utility. If free does "1 project," your $19 should do "3 projects + the audit-report." That's the 4–5× felt-jump.
3. **Your productized service should be 5–8× your highest hosted tier.** Productized customers buy *the outcome*, not the tool. They expect to pay for handholding. $799 × 6 = $4,500. That's not arbitrary — it's the felt-utility multiplier.

## Pricing experiments that actually tell you something

| Experiment | What it tells you | Cost |
|---|---|---|
| Run the same Calendly link with 3 different prices in the URL slug for 4 weeks. | Are people committing at all? | Tiny. |
| Send 10 prospects a quote at 1.5× your current price. | Where's the resistance threshold? | Free. |
| Offer a 50% lifetime discount to the first 5 customers. | Are people moving on price or on feature? | Real. (Don't go above 5.) |
| A/B-test the pricing-page copy, not the prices themselves. | Where does the buyer get confused? | Cheap. |

Notice: **none of these involve asking people what they'd pay.** Future-tense price questions are pure vibe (see [chapter 2](./02-momtest.md)). You can only measure what people *do* with their wallet.

## Skeptic-Mentor counter-example

A founder priced a developer-productivity tool at $29/mo because "Cursor is $20, I should be close." She spent 6 months at $29, got 80 customers, $2,320 MRR — well below her runway target.

I asked: "Who is this for?" She said "senior engineers and lead engineers." I asked: "What's the substitute today?" She said "they use 3 separate tools, total ~$120/mo." She'd anchored against the wrong product. She was substituting *three* tools.

She raised to $99/mo with a 90-day grandfather for the existing 80. 14 churned. The remaining 66 stayed (at the new price). The next 20 new customers came in at $99 immediately. MRR went from $2,320 to $8,514 in two months — same product, fixed anchor.

## Done-when

- Highest tier set 5×+ above your current "comfortable" number.
- Productized service tier exists, priced at 5–8× highest hosted tier.
- No $99 (or any "compromise") tier in the surface.
- One pricing experiment scheduled before W12.
- A specific number written down: "I will raise prices when I hit N customers / $X MRR." Pre-commit, don't post-hoc.

If you can't pre-commit the price-raise trigger, you'll find a reason to never raise.

---

*Next: [Chapter 5 — Build](./05-build.md). What to build first (and what NOT to build).*
