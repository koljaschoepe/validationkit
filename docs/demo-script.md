# Demo Script — 5-Minute Walkthrough

> For Mom-Test sessions, Agency-Lena LOI-conversations, recorded screen-shares. Pre-tested cadence; deviations weaken the pitch.

> **Time:** 5 minutes screen-share. Customer talks first (1 min), you demo (3 min), close (1 min).

## Pre-flight (5 min before the call)

- [ ] Dev server running on `http://localhost:3000`.
- [ ] `examples/sample-bad` fixture warm (audit once to populate cache).
- [ ] Two browser tabs prepped: tab 1 on `/`, tab 2 on `/drift`.
- [ ] Screen-share at 1080p, dark mode on.
- [ ] Calendar 1:1 link ready in your pasteboard for the close.

---

## Minute 0–1 — Customer talks first

**You say:** "Before I show you anything, I'd love to know how *you* handle agent-file consistency across your customer-repos today. Walk me through the last time it bit you."

**Listen for:**
- A specific incident, not a vibe.
- The substitute they use today (Slack-distribution, sync-script, manual review).
- The cost of the substitute in hours/week.

**If they give a vibe answer:** "Got it. Can you tell me about the last time it actually broke something — even small?" If they can't name a specific incident, you've learned more than they have. Politely shorten the demo.

---

## Minute 1–2 — One-shot audit

**Switch to tab 1.** Path field shows `/Users/.../rohan/examples/sample-bad`. Click **Run audit**.

**You say:** "This is the broken-on-purpose sample fixture. Three agent files. The audit takes about two seconds."

**Result lands.** Highlight three things, in order:

1. **The severity pill at top.** "Overall: Weak. Not catastrophic, but not clean. We never use 'overall' alone — every finding has its own band."

2. **One specific finding.** Click the first `[WEAK]` finding. "This is `unused-agent`. The agent file `ghost-agent.md` exists but nothing references it. The audit isn't guessing — it `grep`-walked the corpus and found zero callers. Citation: the file path is right here."

3. **The deterministic-vs-LLM marker.** Scroll to the conflicting-rules section if one fired. "5 of 6 categories are deterministic. This 6th one is the LLM-augmented check, and it only emits at mid-or-high confidence. No vibe-scores."

**If they ask:** "How do I trust the LLM finding?" → "We ship a confidence band. We never act on `low` automatically. And we benchmark FPR against a 30-entry golden-set."

---

## Minute 2–3 — Drift across two repos

**Switch to tab 2.** Path A: `examples/sample-good`. Path B: `examples/sample-bad`. Click **Compare repos**.

**You say:** "This is the Operations-Sprint demo. Two customer-repos. One is your canonical baseline, the other is where the customer's local edits have drifted. We surface five categories."

**Result lands. Highlight:**

1. **`only-in-B` items.** "These exist in customer B's repo but not in your canonical. Means either you missed a feature, or they added something without telling you."
2. **`content-drift` percentage.** "85% trigram-similarity threshold. Below that we flag. The number is *the same number every time* — no model variance."
3. **`token-drift` row.** "Customer B's CLAUDE.md grew by 35% in 4 weeks. That's exactly the kind of context bloat that hides until a customer asks why their Claude responses got worse."

**The Agency-Lena moment:** "If you have 5 customer-repos, you run this five times. If you have 30, you run it once and skim the matrix. Either way, the question 'who's drifted off the canonical?' goes from a 90-min audit to a 90-second check."

---

## Minute 3–4 — Build-in-Public Generator (if Solopreneur) OR Customer-list (if Agency)

### Solopreneur path: Build-in-Public

**Switch to tab 3 (`/bip`)** if signed in (or describe verbally).

**You say:** "Every audit and drift report can generate three social drafts — X-thread, LinkedIn, Mastodon. Skeptic-Mentor voice. The drafts include specific numbers from your audit. Copy-paste ready."

**Click any draft. Show the body.** "Notice — this isn't AI-generated marketing slop. It's templated. Same words for the same finding. The numbers change; the voice doesn't."

### Agency path: Customer detail

**Switch to `/customers/<id>`** of a real customer.

**You say:** "This is the customer view. Audit history, drift history, write-access status. The write-access default is *off*. To open a PR against this customer's repo, the Customer-Admin has to approve via Requester→Approver-Bridge. No agency-side write-by-default."

**Highlight:** "GDPR Joint-Controller risk goes away when write requires Customer-Admin sign-off. Your customers' procurement team will ask about this."

---

## Minute 4–5 — Close

**You say:** "Two questions:

1. **What would have to be true** for ValidationKit to replace whatever you use for this today?
2. **How would you measure** whether the replacement was working — at the 30-day mark?"

**Listen.** Don't pitch. Don't quote a price. Don't book a follow-up.

**If they answer both with specifics:** "Great. I'm running validation sprints at $4,500 for indie founders and operations sprints at $4,500 for agencies. Two weeks, fixed scope, written outcomes. Want me to send the one-pager?"

**If they don't have specifics:** "Got it. Let's not book anything yet. I'll send you the docs, you re-read at your own pace. If after a week you have specific answers to those two questions, ping me and we'll talk price."

---

## Anti-patterns (do not do these)

| Anti-pattern | Why it kills | Replace with |
|---|---|---|
| Showing the architecture diagram | They didn't ask. | Show the demo first. |
| Quoting MRR forecasts | They didn't ask. | Quote a delivery timeline if asked. |
| Saying "we're better than X" | Triggers comparison-shopping. | "Here's what we do." |
| Asking "what would you pay?" | Future-tense vibe-fishing. | "What are you paying for the substitute?" |
| Sending a pricing PDF after the call | Cold artifact. | Reply within 4 hours with a one-paragraph email + Calendly. |

---

## After the call (within 4 hours)

- [ ] Note specifically what they said (their substitute, their cost, their measurable).
- [ ] Send a reply: 3 lines, summarizes what you heard, ends with a single ask.
- [ ] Add them to `recruitment.md` (pending) or to engagement-pipeline (in STATUS.md).

If you can't summarize what they said in 3 lines, you didn't listen hard enough.

---

*Last updated: 2026-05-16. Owner: Kolja Schöpe.*
