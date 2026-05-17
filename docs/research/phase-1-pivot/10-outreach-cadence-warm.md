# 10 — Outreach Cadence (Cold + Warm + Re-Engage)

> Research-Agent A10 · 2026-05-17 · Scope: how Sprint 0.14's 4 voice-templates (`docs/outreach/tester-invite-template.md`) actually get sent. No DM-automation, no bulk-tools, founder-led, 25h/wk, real-name.

## TL;DR

Run a **4-touch sequence on a 1-4-8-15 calendar**, hard cap **25 cold-sends/week** (Workspace allows 2 000/day; founder-quality breaks above ~5/day; [Mailreach 2026](https://www.mailreach.co/blog/email-frequency-best-practices)). Touch #1 carries 58 % of replies ([Instantly — Cold Email Benchmark 2026](https://instantly.ai/cold-email-benchmark-report-2026)) — optimize subject + first-line ruthlessly. Day-15 break-up generates ~33 % reply density via FOMO ([Reachinbox 2026](https://reachinbox.ai/blog/cold-email-follow-up-sequence/)). Calendly belongs in **touch #2**, not #1 — link in #1 drops reply-rate ~12 % because it reframes you from "asks a question" to "sells a slot" ([Mixmax 2026](https://www.mixmax.com/blog/cold-email-subject-lines-2026)). Re-engagement after 30-day silence: a **new thread, new subject** in Q+1, never resurrect the dead thread. CRM-lite = Linear (already in stack), not Airtable.

## Skeptic-Mentor frame

Concession: your Sprint 0.14 templates are voice-correct. Critique: voice without cadence is well-crafted single-shots — **42 % of all replies come from follow-ups #2–#4** ([Snovio — Cold Email Stats 2026](https://snov.io/blog/cold-email-statistics/)). 25 perfectly-voiced #1s with zero follow-ups leaves roughly half your reply-volume on the table. Cadence is the multiplier, not the copy.

---

## Per-tactic Severity-banding

### 1. Sequence-length = 4-touch on 1-4-8-15 — **Strong (canonical)**
3-touch hits 9.2 % cumulative reply, 4–7 is the sweet spot, spam-complaint rate triples after touch #5 ([Devcommx 2026](https://www.devcommx.com/blogs/b2b-cold-email-benchmarks)). Calendar: Day 1 cold → Day 4 nudge (no new ask) → Day 8 angle-shift ("here's the 1 specific finding I'd bring") → Day 15 break-up. Captures ~93 % of cumulative replies by Day 17 ([Reachinbox 2026](https://reachinbox.ai/blog/cold-email-follow-up-sequence/)).

### 2. Subject-line specificity > clever — **Strong**
"Quick question" replies at ~0.6 % in B2B-SaaS (3/500, 2 of those are "stop emailing me"; [Prospeo — Worst Subject Lines 2026](https://prospeo.io/s/worst-email-subject-lines)). Question-mark subjects under-perform vs declarative-specific. Canonical for our case: `Cross-vendor agent-file drift across your [N] customer repos` — a count the recipient can verify. A/B-test: Subject A for 10 sends, Subject B for next 10, kill the lower at n=20.

### 3. Calendly-link in touch #1 — **Kill**
Concession: feels efficient. Critique: empirically drops reply-rate ~12 % in founder-led discovery. Link in touch #2 only, or in Day-8 nudge. Touch #1 ends with a binary question.

### 4. 25 cold-sends/week cap — **Strong**
Reputation breaks at ~50/day from a cold mailbox ([Unify GTM 2026](https://www.unifygtm.com/explore/cold-email-2026-domain-setup-deliverability-sequences)). Realistic founder throughput (research → 1 sentence on a public artifact → draft → send) = ~5/day × 5 days. Beyond 25/wk, personalization collapses and you trip the PRD §3 spirit-of-the-rule.

### 5. Warm-intro double-opt-in (Brian-Hess pattern) — **Strong**
Same shape as [The Muse — Double Opt-In Intro](https://www.themuse.com/advice/the-double-optin-intro-an-email-template) and [Prospeo — Warm Intro Templates 2026](https://prospeo.io/s/warm-introduction-email-template). Flow: (a) ping connector with a forwardable 4-line blurb (name+role, one-sentence company, why-it-matters-to-recipient, ask), (b) connector forwards *only after recipient opts in*, (c) you reply-all with thanks + Calendly + 1 substantive line. Subject: `Kolja Schöpe (ValidationKit) <> [Name] ([Co]) | Warm Intro`. Warm intros reply 2–5× cold ([Introhive 2025](https://www.introhive.com/blog-posts/the-art-and-science-of-warm-introductions/)).

### 6. 3-number framing from Sprint 0.14 ship — **Strong**
Sprint 0.14 template promises "3 numbers from the last 2 weeks." Credible today: (a) **12 agent-file formats parsed** in `validationkit-cli`, (b) **0 LLM calls in 5 of 6** deterministic finding-categories, (c) **30-file golden-set** for the LLM 6th category eval. Each verifiable in the repo — no vibe.

### 7. Re-engagement after 30 days — **Weak (polish)**
**Never resurrect the dead thread.** New email, new subject anchored on recipient-side event ("Saw [their podcast / funding / GitHub release] — does the agent-file count question land differently now?"). 30-day silence → wait full quarter. Re-engagement reply-rate ~6 % vs ~9 % first-touch. Cap 1 re-engage per recipient per quarter, then drop forever.

### 8. Reply-handling: sub-30-word in founder's voice — **Strong**
Pattern: `Tuesday works — [Calendly link, two 30-min windows pre-confirmed]. If neither lands, name any time and I'll match it. — Kolja`. No deck, no "looking forward to it", no `Best regards`. First-reply latency ≤ 4 business hours; beyond 24h, reply→meeting conversion drops ~30 % ([Salesmotion 2026](https://salesmotion.io/blog/cold-outreach-best-practices)).

### 9. CRM-lite — Linear, not Airtable — **Strong**
Already in stack. Each lead = one Issue, labels `cold | warm-intro | build-in-public` × `t1-sent | t2-sent | t3-sent | t4-sent | replied | meeting | dead`. Notion is fine for prose but bad for state-machines; Airtable is overkill at 100-lead volume; Sheets dies past 200 rows.

---

## Capacity ceiling (load-bearing)

| Slot | Hours/wk | Output |
|---|---|---|
| Research + personalize 25 new t1 | 6 h | 25 t1 |
| Send 25 t2 (Day-4 of prior cohort) | 1.5 h | 25 t2 |
| Send 25 t3 (Day-8 angle-shift) | 2 h | 25 t3 |
| Send 25 t4 (Day-15 break-up) | 1 h | 25 t4 |
| Reply-handling + Calendly + 3 warm-intro DOI | 3 h | ~5 meetings |
| **Total** | **13.5 h** | **~5 meetings/wk** |

Remaining 11.5h of the 25h budget = product + content + the Mom-Test interviews themselves. **Do not exceed 25 t1/week.**

---

## 100-word summary

Run a 4-touch cold sequence on a 1-4-8-15 calendar, capped at 25 personalized cold-sends/week (~13.5h of the 25h founder budget). Touch #1 carries 58 % of replies; Calendly belongs in #2, never #1; Day-15 break-up generates ~33 % reply density via FOMO. Warm intros use Brian-Hess double-opt-in with a 4-line forwardable blurb — reply 2–5× cold. 3-number framing is credible from Sprint 0.14 (12 formats / 0 LLM calls in 5/6 categories / 30-file golden-set). Track in Linear, re-engage once per quarter on a new thread. Kill: "Quick question" subjects and any link in touch #1.
