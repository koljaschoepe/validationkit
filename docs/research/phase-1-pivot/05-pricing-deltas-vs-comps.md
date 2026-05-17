# 05 — Pricing Deltas vs. 2026 Dev-Tool Comparables

**Research-Agent:** A5
**Date:** 2026-05-17
**Scope:** Validate / challenge `@vk/billing` Sprint 0.13 pricing against Q2-2026 dev-tool freemium comparables. Respect PRD Constraint #15 (no $99-sandwich).
**Voice:** Skeptic-Mentor, Concession-then-Critique.

---

## TL;DR — Severity: **MID (tweak, don't re-open)**

The five-tier ladder is **defensible in structure** but **light on the indie entry** and **arguably light on the agency ceiling**. Three deltas vs. 2026 comps that matter:

1. **$19 indie entry is below 2026 median.** Cursor Pro = $20, Sentry Team = $26/mo annual, Snyk Team = $25/dev, Vercel Pro = $20. Even Plausible-ish privacy-tools start at $9 but those are pure-volume plays. ValidationKit at $19/mo with 50 audits + 3 repos + 1 seat is a sub-Cursor anchor. Move to **$25** (still under "psychological $29 ceiling," matches Snyk/Sentry, signals professional-grade).
2. **Free-tier 20 audits/mo + 1 repo is reasonable; don't expand to 3.** Median freemium-to-paid conversion is 2.6% organic / 2.8% paid; top decile reaches 5–10%. Generous-free correlates with conversion-collapse below 2%. Keep 1 repo / 20 audits — anchors "I felt the value, now I need scale" upgrade trigger.
3. **Agency-Scale $799 is below market for the LOI-conversion use-case.** Stainless entry = $250–500/SDK/mo, with $99/SDK promo. Snyk Ignite = ~$105/dev/mo (10–50 devs = $12.6k–63k/yr). The $299/$799 band is fine for self-serve PLG, but missing an **annual-only Agency-Scale-Plus $1,499–1,999/mo** leaves the M6 LOI-conversion ceiling at $799 × 12 = $9.6k ARR, well below the documented Sprint-to-Hosted $45k–108k Cash band in PRD §11.

No $99-sandwich. No price-cut. Two additions, one repositioning.

---

## Comp-Table (Q2 2026)

| Tool | Free Tier | Entry Paid | Mid Paid | Top Self-Serve | Annual Discount |
|---|---|---|---|---|---|
| **ValidationKit (current)** | $0 / 1 repo / 20 audits | **$19** Solo Indie | **$79** Solo Pro | **$799** Agency Scale | — (not yet set) |
| Cursor | Hobby free / 2k completions | $20 Pro | $40 Ultra-ish band | $40+/seat Business | ~20% |
| GitHub Copilot | Free (limited) | $10 Pro | $19 Business | $39 Enterprise | usage-credits-based (June 2026 shift) |
| Vercel | Hobby $0 | $20/dev Pro | $20+overages | Enterprise custom | usage-based |
| Sentry | Dev free | $26/dev Team (annual) | $80/mo Business | Enterprise $15–20/dev at volume | ~10% (≈1 month free) |
| Snyk | 200 tests/mo free | $25/dev Team (capped 10) | ~$105/dev Ignite | Enterprise custom | "1 month free" (~8%) |
| Linear | Free | $8/seat Standard | $14/seat Plus | Enterprise custom | 20% |
| Stainless | 5 SDKs / 25 endpoints free | $99–250/SDK/mo | $500/SDK/mo | Enterprise custom | not published |
| Preuve.ai | Free reality-check | $29 one-time Founder Report | — | $299 Investor Package | n/a (one-time) |
| Plausible | 30-day trial | $9/mo Growth | $69/mo Business | Enterprise | ~16.7% (2 months free) |

Sources at bottom.

---

## Concession-then-Critique on the 8 Key Questions

1. **Q3-2026 comparables:** Sentry $26/dev Team, Snyk $25/dev Team capped @10, Vercel $20/dev, Cursor $20, Copilot $10–39, Linear $8/$14 ([Sentry pricing](https://sentry.io/pricing/), [Snyk plans](https://snyk.io/plans/), [Vercel pricing](https://vercel.com/pricing), [Copilot](https://github.com/features/copilot/plans), [Linear](https://linear.app/pricing)). **Concession:** Our $19 is on-trend with PLG indie norms. **Critique:** Sentry and Snyk landed at $25–26 with paid-feature parity; $19 reads "still in beta."
2. **Per-repo vs per-seat vs per-audit:** Dev-tool B2B 2026 = **per-seat dominant** (Sentry, Snyk, Linear, Cursor, Copilot, Vercel). Per-run only survives in pure-output tools (Preuve.ai $29/report, Stainless $250/SDK). **Critique:** Our hybrid (repos + audits + seats) is internally consistent but creates a 3-dimensional sales conversation — kill at least one dimension on the public pricing page (recommend collapsing audits into "fair-use" copy, keep repos+seats as headline gates).
3. **Annual discount default:** Linear = 20%, Plausible = ~16.7%, Sentry = ~10%, Cursor = ~20%. **Median = 17%.** Recommend **20% annual** to match Linear/Cursor PLG-leader playbook; signals "we expect retention."
4. **Free-tier limits + conversion:** Industry median freemium-to-paid = 2.6–5%; top decile 5–10% ([First Page Sage](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)). 1-repo gate is *correct* — gating happens AFTER first audit shows value. 3-repo free would push us toward "Notion-style 20–40% satisfied-on-free" trap with weak upgrade triggers. **Keep 1 repo / 20 audits.**
5. **EU VAT-inclusive display:** Price Intelligently / Monetizely report **+12% conversion in EU consumer markets** with tax-inclusive display ([Monetizely FAQ](https://www.getmonetizely.com/faqs/in-places-like-the-eu-customers-are-used-to-seeing-vat-included-in-the-price-should-we-display-tax-inclusive-pricing-for-certain-regions-to-meet-expectations-and-how-do-we-handle-taxes-in-the-pricing-for-different-locales)). For B2B SaaS it's a wash (buyers expect net), but our indie audience IS effectively consumer-purchase. **Show VAT-inclusive for `.de`/EU geo-IP.**
6. **Is $19 still right?** No. Cursor Pro $20, Snyk $25, Sentry $26, Copilot Business $19 are the 2026 anchors. **Move Solo Indie to $25/mo** (or $24 if odd-pricing is preferred). Solo Pro $79 holds — sits between Sentry Business $80 and Snyk Ignite ~$105.
7. **Agency band $299/$799 defensibility:** Stainless starts $250/SDK and goes to $500; Snyk Ignite caps ~$105/dev × 5 seats = $525/mo equivalent. **$299 is correctly positioned** as "first agency commitment." **$799 is the soft ceiling** — fine for PLG self-checkout but doesn't capture the LOI-driven post-discovery buyer.
8. **Annual-only Agency-Scale-Plus $1,499–1,999?** **Yes — recommend $1,499/mo annual-only ($17,988/yr)** with 100+ repos, 10k audits/mo, 25 seats, named-CSM-light, deterministic-audit-export. This absorbs the 5 LOIs from the M3 gate (PRD §11.3) without forcing a "call sales" friction. Above $1,999 → Enterprise call.

---

## Recommended PRICING CHANGES

| # | Change | Rationale | Risk |
|---|---|---|---|
| 1 | **Solo Indie: $19 → $25/mo** | Match 2026 dev-tool median (Cursor/Sentry/Snyk anchor); signals professional-grade; +31% ARPU on Indie tier | Low — Indie buyers compare to Cursor $20, not Plausible $9 |
| 2 | **Add Agency-Scale-Plus: $1,499/mo annual-only** ($17,988 ACV) — 100+ repos, 10k audits, 25 seats, audit-export, named-CSM-light | Absorbs M3-M9 LOI-conversions without "call sales" friction; respects $799 PLG ceiling | Low — annual-only kills churn, no sandwich vs $799 (≥87% jump) |
| 3 | **Default 20% annual discount on all paid tiers** | Linear/Cursor playbook; +retention signal; net-positive vs. Sentry's 10% | Low — standard PLG hygiene |
| 4 | **EU geo-IP → VAT-inclusive display** | +12% EU conversion (Price Intelligently); DACH = Phase-0 ICP | Low — Stripe Tax handles backend |

**KEEP:** Free $0 (1 repo / 20 audits / 1 seat), Solo Pro $79, Agency Pro $299, Agency Scale $799. No $99 tier. No price cut.

---

## Sources

- [Snyk Plans and Pricing](https://snyk.io/plans/) — Snyk, 2026-Q2
- [Snyk Pricing 2026 (CheckThat)](https://checkthat.ai/brands/snyk/pricing) — 2026
- [Cursor Pricing — Vantage](https://www.vantage.sh/blog/cursor-pricing-explained) — 2026
- [GitHub Copilot Plans](https://github.com/features/copilot/plans) — GitHub, 2026
- [GitHub Copilot Usage-Based Billing Shift](https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/) — GitHub Blog, 2026
- [Vercel Pricing](https://vercel.com/pricing) — Vercel, 2026
- [Sentry Pricing](https://sentry.io/pricing/) — Sentry, 2026
- [Linear Pricing](https://linear.app/pricing) — Linear, 2026
- [Stainless Pricing](https://www.stainless.com/pricing) — Stainless, 2026
- [Stainless Pricing & Alternatives — Fern](https://buildwithfern.com/post/stainless-pricing-alternatives) — 2026-01
- [Preuve.ai](https://preuve.ai/) — 2026
- [Plausible Subscription Plans](https://plausible.io/docs/subscription-plans) — Plausible, 2026
- [SaaS Freemium Conversion Rates 2026 — First Page Sage](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/) — 2026
- [EU VAT-Inclusive Pricing — Monetizely](https://www.getmonetizely.com/faqs/in-places-like-the-eu-customers-are-used-to-seeing-vat-included-in-the-price-should-we-display-tax-inclusive-pricing-for-certain-regions-to-meet-expectations-and-how-do-we-handle-taxes-in-the-pricing-for-different-locales) — 2026

---

**Word count:** ~780.
