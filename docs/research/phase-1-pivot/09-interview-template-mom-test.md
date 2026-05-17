# A9 — Mom-Test Template Refinement (Indie × Agency, Phase 1)

> **Research-Agent A9 · 2026-05-17 · ValidationKit Phase 1 / PRD §5.1+§5.2 / ADR-0018 §10**
> Scope: Refine `docs/handbook-extras/mom-test-script.md` v1 into two first-class templates for 20 INDIE + 10 AGENCY interviews. $0 cash-out. DACH-GDPR. Skeptic-Mentor voice.

## TL;DR — Severity-Band: **MID**

v1 already encodes Fitzpatrick's 3 rules and a clean 5-stem flow ([The Mom Test, Fitzpatrick 2013/2026 reprint](https://momtestbook.com/)). What's missing for Phase-1-commercial-grade: **(a)** a fully parallel AGENCY-template (v1 has agency *examples* per stem, not a standalone script), **(b)** GDPR-compliant bilingual consent + retention policy, **(c)** a triage schema that lands the interview at `interviews/<slug>.md` with structured fields, **(d)** a tooling decision that survives 30 × 30-min sessions at $0.

**Concession:** v1's 5-stem skeleton (Walk-Through → Before → Substitute → Cost → After) is exactly right and should NOT be re-derived. The agency-template inherits it 1:1, only the trigger-verbs and listening-for cues differ.
**Critique:** v1's recording line ("Tell them you're recording. Don't ask permission post-hoc.") is **Kill-Severity** under DACH-GDPR — Art. 6(1)(a) + §201 StGB require *explicit prior* consent for recording conversations; "post-hoc" is criminally exposed in DE/AT/CH ([§201 StGB Vertraulichkeit des Wortes](https://www.gesetze-im-internet.de/stgb/__201.html), [GDPR Art. 6](https://gdpr-info.eu/art-6-gdpr/)). v1 must be patched before any DACH interview ships.

---

## 1. INDIE vs AGENCY — What Changes in the 5 Stems

| Stem | INDIE trigger-verb | AGENCY-CEO trigger-verb | What flips in *listening-for* |
|---|---|---|---|
| Q1 Walk-Through | "...tried to validate an idea before building it" | "...onboarded a new AI-consultancy customer and stood up their agent-files / repo conventions" | Indie = solo-blocker. Agency = handover-friction across 2+ humans. |
| Q2 Before | "What made you decide *that* idea was worth validating?" | "What happened in the customer-kickoff that forced the agent-file setup decision?" | Indie = personal itch. Agency = contract clause, compliance ask, customer-CTO push. |
| Q3 Substitute | "What did you try? Notion doc? cold DMs? Google Form?" | "What did you reuse from the prior customer? A starter-repo? A Notion playbook? A copy-paste CLAUDE.md?" | Indie substitute = free tool. Agency substitute = *internal IP* (the real moat-or-bottleneck). |
| Q4 Cost | "How many hours before you knew it was a no-go?" | "How many billable hours / which percentage of the engagement-fee went to setup vs delivery?" | Indie = sunk-time. Agency = **margin compression** — the only number a CEO will defend. |
| Q5 After | "What did you do with the idea? Park it? Pivot? Ship anyway?" | "Did the customer ever ask about drift / audit / who-changed-what? What did you tell them?" | Indie = personal next-step. Agency = customer-side compliance signal = wedge-confirmation. |

The **load-bearing flip** is Q4. Indies measure pain in hours of their own time; agency-CEOs measure pain in *engagement-margin %*. Asking an agency-CEO "how long did it take" surfaces nothing — asking "what % of the engagement-fee did setup eat" surfaces the wedge ([Fitzpatrick's "currencies" chapter on time-vs-money signals, The Mom Test ch 3](https://momtestbook.com/)).

## 2. Q1 Entry-Hook for Agency-CEOs

The v1 default ("the last time you onboarded a new customer and set up agent-files") **assumes the agency already does agent-files** — which 60–80% don't yet (PRD §5.2 Agency-Discovery assumption). The defensible Q1 for an agency-CEO is the *generic-onboarding* trigger, which captures both the "we do agent-files" and "we don't yet" cohorts in the same answer:

> **"Walk me through the last customer you onboarded — from kickoff to first PR merged. Specifically: how did your AI tooling get configured for their repo?"**

If they say "we don't really do that yet" → you've found a *latent* wedge-cohort (more valuable than the comfortable cohort). If they say "we have a starter-pack" → ask Q3 about the starter-pack's pain. Both branches stay inside Mom-Test discipline.

## 3. Recording Tooling — $0 Decision

30 interviews × 30 min = **900 minutes**. Free-tier audit:

- **Otter.ai free** — 300 min/mo, hard 30-min/conversation cap, 3 lifetime imports ([Otter pricing 2026](https://otter.ai/pricing), [Otter free-plan breakdown](https://www.unkoa.com/otter-ai-free-plan-limits-2026/)). 900 min fits **only if** Phase-1 interviews spread over ≥3 calendar months. The 30-min cap is fragile — agency-CEOs run long. **Verdict: Weak fallback only.**
- **Riverside.fm free** — browser-based recording + **unlimited free transcription** ([Riverside transcription page](https://riverside.com/transcription)), single-speaker assignment quirk on multi-speaker uploads. For 1-on-1 interviews the single-speaker quirk is a non-issue if you label `[INTERVIEWER]` / `[NAME]` in post-edit. **Verdict: Default choice.**
- **Descript free** — 1h/mo only ([Descript pricing 2026](https://www.descript.com/pricing)). Insufficient at any spread. **Skip.**
- **Zoom local-recording + open-source Whisper.cpp** — $0 forever, fully local (GDPR-trivially-clean, no third-party processor), whisper-large-v3 transcribes 30 min in ~3 min on M-series Mac ([whisper.cpp benchmarks](https://github.com/ggerganov/whisper.cpp#benchmarks)). **Verdict: Strong primary for DACH interviews specifically** — no DPA needed, no sub-processor disclosure on `/trust`.

**Recommended stack:** Zoom local-record (mp4) → whisper.cpp (German + English models pre-downloaded) → delete mp4 within 24h → keep `.md` transcript only. Riverside.fm as cloud-fallback if Zoom-local fails mid-interview.

## 4. DACH-GDPR Consent — Bilingual Template (load-bearing)

Read **verbatim** before pressing record. Both languages, even if the interviewee speaks only one — it's the audit-trail.

> **DE:** "Bevor wir starten — ich nehme das Gespräch auf, um es anschließend lokal zu transkribieren. Die Audiodatei lösche ich innerhalb von 24 Stunden, der Text-Transkript wird maximal 12 Monate gespeichert und ausschließlich für die Synthese aus 20–30 Interviews verwendet. Dein Name erscheint nirgendwo, außer du gibst explizit dein Opt-in. Du kannst jederzeit Löschung verlangen — eine kurze Mail an kol.schoepe@gmail.com mit dem Datum dieses Gesprächs reicht. Bist du damit einverstanden?"
>
> **EN:** "Before we start — I'm recording this for local transcription. Audio gets deleted within 24h; the text-transcript is retained max. 12 months, used only for synthesis across 20–30 interviews. Your name appears nowhere unless you explicitly opt in. You can request deletion any time — one email to kol.schoepe@gmail.com referencing today's date is enough. OK with that?"

Wait for an audible "yes" / "ja" **on the recording**. That's the §201 StGB + GDPR Art. 7(1) demonstrable-consent artifact ([GDPR Art. 7 conditions for consent](https://gdpr-info.eu/art-7-gdpr/)). If they hesitate, offer note-taking-only and proceed — no recording, no pressure.

## 5. Post-Interview Triage Schema — `interviews/<slug>.md`

`<slug>` = `YYYY-MM-DD-<initials>-<indie|agency>`. Template:

```yaml
---
date: 2026-05-22
channel: indie | agency
source: cold-email | warm-intro | community | conf
duration_min: 28
consent: yes-recorded | yes-notes-only | declined
verdict: Kill | Weak | Mid | Strong | Exceptional
substitute_used: "Notion + Google Form"
substitute_cost_per_week_hours: 6
consequence_severity: none | minor | major | churn-trigger
trigger_pattern: "customer-CTO compliance ask"
pricing_signal_eur_per_month: 0   # NEVER asked directly — inferred from substitute-cost only
intro_ask_friction: 1-5  # 1 = "happy to intro 3 peers", 5 = "won't intro"
---

## 3 Verbatim Quotes (≤20 words each, timestamped)
1. [12:03] "..."
2. [18:47] "..."
3. [24:11] "..."

## Substitute one-liner
They use [X] today; cost = [Y hr/wk]; breaks at [Z trigger].

## Consequence one-liner
If it goes wrong, they [action]. If nothing's done, they [pattern].

## Follow-up
- Opt-in to name-quote: yes/no
- Sprint-1 design-partner candidate: yes/no/maybe
- Re-contact date if maybe: YYYY-MM-DD
```

Three Mom-Test traps the schema *deliberately defends against*: (a) `pricing_signal_eur_per_month` is **inferred from substitute-cost only**, never asked — asking willingness-to-pay is the textbook trap ([Fitzpatrick ch 5, "anchored hypotheticals"](https://momtestbook.com/)); (b) `verdict` uses the ValidationKit Severity-Band, not a 0–100 score (Constraint #5); (c) `intro_ask_friction` is the *real* commitment-signal — vague "great chat" is worthless, "I'll intro you to 3 peers by Friday" is a Strong-verdict input ([Fitzpatrick ch 4, "currency of commitment"](https://momtestbook.com/)).

## 6. Calendly Setup — DACH-Friendly Defaults

- **Time-zones offered:** Europe/Berlin (primary), Europe/Zurich, Europe/Vienna, plus US/Eastern + US/Pacific for occasional non-DACH agency-CEOs. Calendly auto-detects ([Calendly time-zone docs](https://help.calendly.com/hc/en-us/articles/223193448)).
- **Slot length:** Indie = 20 min (rounds to 15-min interview + 5-min buffer). Agency = 30 min (rounds to 25-min interview + 5-min buffer).
- **Buffer:** 15 min before + 15 min after. Non-negotiable — the triage step is the value-extraction, not the call itself.
- **Daily cap:** 2 interviews/day max. 3+ collapses signal-quality (interview-fatigue is real, Skeptic-Mentor verdict).
- **No-show recovery:** Calendly auto-reschedule link in confirmation + 24h-reminder. After no-show, send a 1-line: "Missed you — totally happens. Here's the link if next week works: [link]. No reply needed if not." Never chase twice.

## 7. Anti-Patterns to Avoid (carry-over from v1, hardened)

| Anti-pattern | Why it kills | Severity |
|---|---|---|
| "Would you pay €X for this?" | Anchored-hypothetical, polite-coded yes ([Mom Test ch 5](https://momtestbook.com/)). | **Kill** |
| "Do you think AI consultancies need this?" | Asks for opinion, not behavior. | **Kill** |
| Pitching after Q3 because they sound interested | Resets the dynamic from listening to selling — kills Q4+Q5 signal. | **Kill** |
| "Just to confirm, you said you struggle with X — right?" | Confirmation-bias loop, they'll agree to be polite. | **Weak** |
| Filling silence within 4s of their answer ending | Their continuation is the gold; v1 already flags this. | **Weak** |
| Asking 6+ stems "since we have time" | Dilutes signal, exhausts goodwill, reduces intro-ask success. | **Weak** |

## 8. Skeptic-Mentor Verdict

**Concession:** v1 is structurally sound and the 5-stem skeleton survives unchanged into Phase 1 — no re-write needed, only a parallel agency-column and the GDPR patch. That's a *good* sign about v1's bones.
**Critique:** Ship the GDPR consent fix *before* any DACH interview, swap default-tooling from Otter to Zoom-local + whisper.cpp (the agency-cohort will check your `/trust` page before saying yes — Otter as sub-processor is an unforced disclosure), and treat the `interviews/<slug>.md` schema as *non-optional* — without structured fields the 20-interview synthesis is a vibe-exercise, which is exactly the anti-pattern PRD Constraint #5 forbids.

**Apply order:** (1) patch v1 GDPR-line today, (2) add this file's §1+§2 as `mom-test-script-agency.md` sibling, (3) create empty `interviews/.gitkeep` + commit the schema template, (4) book first agency-discovery interview only after (1)–(3) are merged.

---

## Sources

- [Rob Fitzpatrick — The Mom Test (book site, 2013/2026 reprint)](https://momtestbook.com/)
- [GDPR Art. 6 — Lawfulness of processing](https://gdpr-info.eu/art-6-gdpr/)
- [GDPR Art. 7 — Conditions for consent](https://gdpr-info.eu/art-7-gdpr/)
- [§201 StGB — Vertraulichkeit des Wortes (DE)](https://www.gesetze-im-internet.de/stgb/__201.html)
- [Otter.ai Pricing 2026](https://otter.ai/pricing)
- [Otter Free Plan Limits 2026 breakdown](https://www.unkoa.com/otter-ai-free-plan-limits-2026/)
- [Riverside.fm Transcription (free, unlimited)](https://riverside.com/transcription)
- [Descript Pricing 2026](https://www.descript.com/pricing)
- [whisper.cpp — local Whisper inference](https://github.com/ggerganov/whisper.cpp)
- [Calendly Time-zone behavior](https://help.calendly.com/hc/en-us/articles/223193448)

*Last updated: 2026-05-17. Pairs with `docs/handbook-extras/mom-test-script.md` v1 — patch v1's recording-consent line before any DACH interview ships.*
