# 2 — Mom-Test

**Thesis:** Interview people about their *past*, not their *future*. Past behavior compounds; future-self predictions are vibes.

## Concession-then-Critique

**Concession:** Most founders know the term "Mom-Test" from Rob Fitzpatrick's book and assume they're doing it. They ask open questions, they take notes, they don't pitch.

**Critique:** They still ask future-tense questions. *"Would you use a tool that…?"* *"Would you pay $19/month for…?"* *"Does that sound useful?"* Every one of these is a vanity question disguised in interview clothing. Future-tense answers cost the interviewee nothing — they're predicting their own behavior, badly, and trying to be polite.

The fix isn't more interviews. The fix is a different question stem: **"Tell me about the last time you…"**

## The 5 question stems that actually work

1. **"Walk me through the last time you tried to do X."** — Forces a specific memory. Lets you see real workflow, real workarounds, real pain.
2. **"What did you do *before* X happened?"** — Triggers context-of-pain. Often more diagnostic than the pain itself.
3. **"What did you try? What worked, what didn't?"** — Reveals the substitute set. Tells you what your product has to beat.
4. **"How long did it take? Was that a lot, or a normal amount?"** — Surfaces time-cost and tolerance. "Normal amount" means it isn't urgent enough to switch.
5. **"What happened after?"** — Reveals consequence. No consequence = no demand.

That's it. Five stems. Memorize them. Print them. Run every interview through them.

## Anti-patterns to kill on sight

| Question | Why it fails | Replace with |
|---|---|---|
| "Would you use a tool that…?" | Future-tense, polite-coded. | "Walk me through the last time you needed something like that." |
| "How important is this to you?" | Self-reported importance ≠ revealed importance. | "How many times did this come up last week?" |
| "Does the pricing seem fair?" | Price-anchoring without commitment. | "What are you already paying for the substitute?" |
| "Would you recommend this to a friend?" | NPS theatre. | "Who do you know who has the same problem right now?" |
| "Do you think this could work?" | Pure vibe-fishing. | (Don't ask. Find out by selling.) |

## How long to interview

20 interviews. That's the Phase-0 number in the ValidationKit PRD (Criterion #1). Below 12, you can't tell signal from noise. Above 25, you're avoiding building.

Pace them: 3–4 per week for 6–7 weeks. Faster than that and you can't process between. Slower and you forget the threads.

## Skeptic-Mentor counter-example

A founder pitched ValidationKit a $49/mo idea for "automated weekly status reports for engineering leads." He'd done 12 interviews. 11 of 12 said "yes, that sounds useful." He was ready to build.

I asked him to run the same 11 conversations through the 5 stems above. Specifically: "Walk me through the last time you wrote a weekly status report."

8 of the 11 had **never written one**. They thought one was useful in theory — for someone else. The 3 who actually wrote them used Notion and didn't want to switch. Two interviews, three follow-ups, real conversations: he killed the idea in a week instead of after 4 months of build.

Cost of those 5 stems: ~3 hours of follow-up.
Cost of skipping them: ~4 months of build + opportunity cost.

## A worked example (illustrative, not a real interview)

> ⚠️ The transcript below is **synthetic** — composed to show the 5-stem pattern in action. Real Mom-Tests are not this clean. Use it as a tutorial, not a benchmark.

**Setup:** "Mark" is a synthetic indie founder building a developer-productivity tool. Kolja is interviewing.

---

**Kolja (Q1 — Walk-Through):** Walk me through the last time you tried to validate an idea before you committed to building it.

**Mark:** OK so… end of February I had this idea for a tool that summarizes engineering retros. I posted a screenshot of the mockup on Twitter, got like 60 likes. So I started building.

**Kolja:** *(silent count to 4)*

**Mark:** Yeah and then I built for 3 weeks, launched on Product Hunt, got 80 sign-ups, 0 paid. So that was that.

> *Mark gave a story. Good. The "60 likes → started building" is the inflection point. Note it.*

---

**Kolja (Q2 — Before-Context):** What did you do *before* the Twitter post?

**Mark:** Hmm. Probably I'd been thinking about it for a few weeks. There was a retro at my day job that went really badly — like, 90 minutes, no decisions came out of it. I was annoyed. I wrote up the idea that night.

> *Real trigger: a personal annoyance after a bad retro. Not external pain. Note it.*

---

**Kolja (Q3 — Substitute-Set):** What did you try? What worked, what didn't?

**Mark:** Try to validate? Mostly nothing. I asked 4 friends who are also founders. They all said "sounds cool." I figured that's enough signal.

**Kolja:** *(silent count to 4)*

**Mark:** And… one of them runs a 10-person team, he said his team uses Linear for retros. Doesn't write summaries — they just bullet-point in the Linear thread. I noted that but I was already excited so I kept building.

> *Substitute: Linear bullet-points. Cost: ~0. The friend who actually has a team described a substitute with zero cost. Mark heard it and ignored it. That's the data.*

---

**Kolja (Q4 — Cost-Calibration):** How long does the typical retro thing take Mark's friends? Was that 1 hour or 1 day or 1 week of pain per retro?

**Mark:** Honestly, I don't know. I never asked. I just assumed everyone hated retros as much as I did.

> *Mark just admitted to building on assumed pain without measuring it. Critical signal.*

---

**Kolja (Q5 — After-Consequence):** What happened *after* the 0-paid Product Hunt launch? Like, did your friend with the 10-person team try the tool when you offered it for free?

**Mark:** I never offered. I was too embarrassed about the 0 conversion. I just shelved it and started thinking about the next idea.

> *Consequence: shelved. The thing didn't even get a free-trial. Substitute (Linear bullets) won by default.*

---

## What Kolja's notes look like after the 15 min

```
Interview: Mark — 2026-02-XX — 15 min

Substitute used: Linear bullet-points in retro threads. ~0 cost.
Substitute cost (hours/week): "I never asked" — Mark admitted no measurement.
Consequence of skipping: shelved after launch. Did NOT offer to friend.
Trigger pattern: personal annoyance, not market demand.

Quote-1 (verbatim): "I figured that's enough signal" — about 4 friends saying
"sounds cool."

Quote-2: "I never asked" — about the time-cost of his friend's team.

Pattern flag: idea-from-frustration, validated-with-vibes, build-then-launch.
This is the modal indie failure mode. ValidationKit's Ch 1+2 directly addresses
it.

Wedge implication: Mark IS our P0 ICP. The wedge is *forcing* the 5-stem
discipline before any build. That's what we sell.
```

## The 4 mistakes Mark made

These map cleanly to the anti-patterns in this chapter:

| Mark's move | The mistake | The repair |
|---|---|---|
| 60 likes → started building | Vanity signal ≠ demand signal | Track sign-ups → demo → paid, not likes |
| 4 friends say "sounds cool" | Future-tense friend-validation | Ask them about the last time they actually wrote a retro summary |
| Heard "Linear bullets" and ignored | Selective hearing the substitute | The substitute IS your competition |
| Never asked about time-cost | No price-signal data | Q4 ("how long?") is the load-bearing stem — never skip |

## What Mark *should* have done before any code

1. **Q1 to 12 people** (not 4 friends): "Walk me through the last time you wrote a retro summary."
2. **Tag the substitute** for each: "Linear bullets" / "Notion meeting note" / "nothing — we just talk."
3. **Q4 for each:** "How long, and is that a lot or normal?" Aggregate.
4. **If cluster of 3+ with > 2h/retro pain:** *then* mockup the screenshot.
5. **If no cluster:** kill the idea, save 3 weeks.

The cost of those 12 interviews: ~6 hours.
The cost Mark actually paid: ~3 weeks of build + the emotional hit of 0 paid.

## Done-when

- 20 transcribed interviews. Voice → text is fine; OK if rough.
- Each transcript tagged: which substitute did they describe? What was the time-cost? What was the consequence?
- 3 substitute patterns identified. ("Most use Notion + manual reminders.")
- 1 sentence per interview answering: "what does this person already pay (in money, time, or political capital) to solve this?"

If the answer to that last question is "nothing" for more than half your interviewees, your wedge isn't a wedge.

For an interview-ready standalone script with the 5 stems and post-interview triage, see [`docs/handbook-extras/mom-test-script.md`](../handbook-extras/mom-test-script.md). Print it. Read it live. Don't paraphrase.

---

*Next: [Chapter 3 — Channels](./03-channels.md). Where your ICP actually hangs out.*
