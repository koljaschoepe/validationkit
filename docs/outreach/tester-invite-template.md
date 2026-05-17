---
name: tester-invite-template
audience: 10 first beta-testers
voice: Skeptic-Mentor (Concession-then-Critique)
constraints: Legitimate-channels only, no DM-automation, no LinkedIn cold-outreach (PRD §14 + Sprint 0.11 do-not list)
created: 2026-05-17
sprint: 0.14
---

# Tester-invite template

> Editing rules:
> 1. Keep it under 180 words. Founders who skim ≤30 sec respond at 4–6× the rate of those who scan ≥1 min.
> 2. Lead with concession before ask (Skeptic-Mentor pattern).
> 3. Mention exactly one explicit limit per tier (free = 1 repo, agency = 30+) — testers calibrate themselves.
> 4. End with one clear ask, not a menu.
> 5. Never use phrases like "revolutionary", "AI-powered", or "10x your" — drops reply-rate by 35% (Klenty 2026 benchmark).

---

## 0. Cold email (CEOs of small AI consultancies, DACH — Anthropic-Partner-Netzwerk)

**Subject options (pick the lowest-friction):**
- Cross-vendor agent-file drift for your 5–10 customer repos
- 30-sec question about how you manage `CLAUDE.md` across customers

**Body:**

> Hey [first name],
>
> Saw [specific public artifact — newsletter / GitHub repo / podcast]. Quick concession: most "AI-agent-tooling" pitches you get are noise. I'm building something narrower — cross-vendor audit of `AGENTS.md` / `CLAUDE.md` / `.cursor/rules` / 9 other formats — for agencies running 5–30 customer repos who can't afford one of them drifting away from the template.
>
> Critique part: I don't know yet if this is a real workflow problem for you or just an interesting graph. Would you spend 20 minutes telling me which it is? No demo, no slides — just questions about how you currently manage agent-files across customers.
>
> I'll bring 3 numbers from the last 2 weeks of building this. If they don't move you, I'll send you a free audit on one of your customer repos and never email again.
>
> — Kolja

---

## 1. Warm intro reply (introductions via shared connections)

> Thanks [intro-person] — appreciated.
>
> [Their name], briefly: building cross-vendor agent-file audit + drift for AI consultancies. Pre-revenue, OSS core, hosted dashboard. The honest part: I'm at the discovery stage, not the demo stage.
>
> Concession: most things at my stage are too half-baked to evaluate.
> Critique: but a 20-minute structured interview costs you less than reading one bad pitch. Would you spend that on me?
>
> Calendly: [link]. Or pick any 4-hour window and I'll show up.
>
> — Kolja

---

## 2. Build-in-public follow-up (people who reacted to a Twitter/LinkedIn post)

> Hi [name] — saw you reacted to the cross-vendor-trust thread.
>
> Concession: a like is not a buy-signal. Critique: but it's enough to ask 1 question — are you currently managing AI-agent guidance (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules`) across more than one repo?
>
> If yes, I'd love to put your hand on the dashboard for 5 minutes — it's at [https://validationkit.vercel.app/](https://validationkit.vercel.app/), free tier covers 1 repo, no card. If no, no follow-up.
>
> — Kolja

---

## 3. Magic-link onboarding email (auto-sent on sign-up — different voice; not cold)

> Welcome.
>
> Your link: [magic-link]
>
> The free tier covers 1 repo and 20 audits per month. The dashboard's onboarding checklist (`/dashboard`) walks you through audit → add-repo → drift detection.
>
> One thing the dashboard won't tell you: every finding has a clickable file:line citation. No vibe-scores, no LLM hallucinations in the deterministic 5/6 rules. That's the load-bearing trust contract — break it on me if I'm wrong.
>
> Reply to this email if anything breaks.
>
> — Kolja
> Sole maintainer of ValidationKit · [https://validationkit.vercel.app/](https://validationkit.vercel.app/)

---

## Tester slot tracking

Tester names + status live in `.local/recruitment.md` (gitignored). Each slot has:

- name + role + how-met
- channel (cold / warm-intro / build-in-public)
- response date
- interview date
- 3 verbatim quotes from the Mom-Test interview

Phase-0-Gate criterion #1: 20 Mom-Test interviews transcribed in `interviews/`. Sprint 0.14 ships the template + opens the channel; slots get filled by Kolja in week 5–13.

## What testers explicitly can't do (set expectations in the first email)

Per Phase 0.5 outcome doc (`docs/roadmap/phase-0.5-dashboard.md` §Phase-outcome):

- Open PR against the repo (needs registered GitHub App — Phase 1)
- Use real LLM-fix-suggestions (needs Anthropic key + golden-set eval — Phase 1)
- See >200 deltas/day in real-time (SSE limit, but no tester will hit this in 30 days)
- Buy with real money (Stripe Test-Mode only)
- Use a custom domain

These belong in the first email or the onboarding checklist, not hidden.
