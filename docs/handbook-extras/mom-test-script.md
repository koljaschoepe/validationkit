# Mom-Test Interview Script — Print-and-Read

> **Status:** Interview-ready. Print this. Read it live. Don't improvise.

> Referenced by [Handbook ch 2](../handbook/02-momtest.md). Self-contained — you don't need the chapter open during the interview.

## Before the call (5 min)

- [ ] Recording app open (Zoom local recording / Otter / Granola). Tell them you're recording for transcription. Don't ask permission post-hoc.
- [ ] Notepad open. Date + interviewee name + your 1-line hypothesis at top.
- [ ] This script open (single tab, large font).
- [ ] Timer set to **15 minutes** (Indie) or **25 minutes** (Agency). Honor it.

## Opening (60 seconds, scripted)

> "Hey [name], thanks for the 15 minutes. Quick frame:
>
> - I'll ask you 5 questions about specific past situations.
> - You talk, I write. Probably I'll go quiet and just nod.
> - No pitch attached. Your name won't appear anywhere unless you opt-in.
> - Stop me if a question is unclear or feels off — that's data.
>
> Ready?"

That's it. Don't elaborate. Don't apologize. Start.

---

## The 5 question stems (in order, NO REORDER)

### Q1 — Walk-Through

> **"Walk me through the last time you tried to [SPECIFIC ACTIVITY]."**

Examples per persona:

- **Indie:** "...the last time you tried to validate an idea before building it."
- **Agency:** "...the last time you onboarded a new customer and set up agent-files for them."
- **Compliance-Frame Agency:** "...the last time you had to answer a customer's compliance questionnaire about your AI tooling."

**What you're listening for:**
- A specific date / event / project. (If they generalize, ask: "When was that exactly?")
- Concrete steps in order. (If they jump, ask: "What did you do before that?")
- Names of tools / docs / people. (Specifics. Always.)

**Anti-question:** Do NOT ask "would you use…" / "do you think…" / "in general…". Those are vibes.

### Q2 — Before-Context

> **"What did you do *before* [the event in Q1] happened?"**

This is the sneaky-best question. It surfaces the *trigger*. Most pain is downstream of a trigger; if you don't know the trigger, you don't know the moment of demand.

**What you're listening for:**
- A frustration / blocker / external pressure that *forced* them to act.
- A workaround they tried first.
- A meeting, a deadline, a stakeholder ask.

### Q3 — Substitute-Set

> **"What did you try? What worked, what didn't?"**

The substitute is your *real* competition. Not the tool you compare against on Twitter. The thing they actually use today.

**What you're listening for:**
- Tool names. Excel. Notion. Slack. Custom script. "Doing it manually."
- Specific success/failure: "the script broke at the 3rd customer because of CRLF line endings."
- Time-cost of the substitute.

**Probe if vague:** "Was that 1 hour or 1 week?"

### Q4 — Cost-Calibration

> **"How long did it take? Was that a lot, or a normal amount?"**

This is the *price-signal*. Self-reported importance is unreliable; self-reported time-cost is much more reliable.

**What you're listening for:**
- A specific number (hours, days, $ spent).
- A felt-baseline ("normal" / "lot" / "we always burn at least…").
- A consequence-flag ("we had to push the release back").

If they say "normal" — pause. Ask: "Compared to what?" Often there's no baseline; they don't know if it's expensive.

### Q5 — After-Consequence

> **"What happened after?"**

No-consequence = no demand. If the answer is "nothing, really, we just moved on" — that's load-bearing data. The pain isn't real enough yet.

**What you're listening for:**
- A meeting, a Slack thread, a "we should fix this" promise that didn't get fixed.
- A retro that didn't lead to action.
- A workaround that became permanent.
- A customer-side complaint, escalation, or churn.

---

## During the interview — do NOT do these

| Anti-pattern | Why it kills | What to do instead |
|---|---|---|
| "Would you use a tool that…?" | Future-tense, polite-coded. They say yes. Worthless. | "Walk me through the last time you needed something like that." |
| "How important is this to you?" | Self-reported importance ≠ revealed importance. | "How many times did this come up last week?" |
| "Does $X sound fair as a price?" | Anchor-without-commitment. They say "sounds reasonable." Worthless. | "What are you already paying for the substitute?" |
| "Do you think this could work?" | Pure vibe-fishing. | (Don't ask. Find out by selling, later.) |
| Filling silence yourself | Their next sentence is gold. Don't interrupt. | Count to 4 in your head before saying anything. |
| Selling | Wrong moment. | If you must, save it for: "Off the record, I'm building something in this space — would you want to see it later?" — at the very end. |

## During the interview — DO these

- **Take quotes verbatim.** When they say something interesting, write the exact words. Time-stamp it.
- **Repeat the noun.** They say "the script." You say "the script — what does it do?" Forces specificity.
- **Note physical signals.** Did they sigh? Did they hesitate? That's emotional-cost data the transcript misses.
- **Wait 4 seconds after they finish.** Often they keep talking. That's the gold.

## After the interview (10 min, do immediately)

- [ ] **Save the recording** to `interviews/YYYY-MM-DD-<initials>.{wav,m4a,zip}`. Git-ignored.
- [ ] **Write 3 quotes you'll remember** at the top of a transcript file: `interviews/YYYY-MM-DD-<initials>-quotes.md`. Verbatim. Time-stamped.
- [ ] **Tag the substitute pattern.** One line: "they use [tool/process] today; cost = [time/money]; breaks at [trigger]."
- [ ] **Tag the consequence pattern.** One line: "if it goes wrong, they [action]. If nothing's done, they [pattern]."
- [ ] **Update recruitment.md row** with the date + 1 sentence about the conversation.
- [ ] **Send the thank-you.** 2 lines. No follow-up offer unless they asked.

## Post-interview thank-you template

```
Subject: Thanks — and one thing that stuck

Hey [name],

Thanks for the time. The thing that stuck for me: [exact quote, ≤ 20 words,
in quotation marks].

I'm pulling notes together from 20 of these — your name won't appear unless
you opt-in. Happy to share the synthesis if you're curious in a few weeks.

— Kolja
```

That's it. Short. Specific quote. No pitch.

## When you have 20 transcripts

Tag each across 4 axes:

1. **Substitute used:** what tool/process did they describe? Cluster on this.
2. **Substitute-cost in hours/week:** rough number. Higher = bigger demand signal.
3. **Consequence-of-skipping:** did anything break? If yes → real demand. If no → not yet.
4. **Trigger-pattern:** what event forced them to act? Cluster on this.

You're looking for a cluster where: 3+ people use the same substitute, the cost is > 4h/week, the consequence is non-trivial, and the trigger repeats.

If you find that cluster: that's your wedge.

If you don't: keep interviewing. Or your wedge isn't where you thought.

---

*Last updated: 2026-05-16. Print this. Don't paraphrase live.*
