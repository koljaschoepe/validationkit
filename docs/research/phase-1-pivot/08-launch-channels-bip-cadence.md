# 08 — Launch Channels + Build-in-Public Cadence (Phase 1, M3–M9)

**Author:** Research-Agent A8 · **Date:** 2026-05-17 · **Scope:** Channel-Mix + 4-Week Calendar für `/validate` (Indie) + `/operations` (Agency) parallel. Refinement zu Constraint #11 + Sprint 0.14 Outreach-Templates.

---

## TL;DR (Severity-Bänder)

- **Strong (Primary, 60% Effort):** Twitter/X (Personal-Handle @kolja_schoepe, Threads 8–12 Tweets) + Hacker News (1× Show-HN bei OSS v0.1 Release in Sprint 1.3, Dienstag 14–17 UTC) + Owned-Newsletter (Substack, 1×/Woche, ab Sprint 1.0).
- **Mid (Secondary, 30%):** IndieHackers-Posts (Milestone-driven, 1×/Sprint), LinkedIn Personal (Long-Form 2×/Woche, kein Brand-Account), Podcast-Guesting (1 Pitch/Monat an warm-intro-Reachable Pods).
- **Weak (Experimental, 10%):** YouTube-Shorts (Punkt-Beweis später, nicht in M3–M9), Dev.to / Substack-Cross-Post (Recycling, kein neuer Output), Reddit r/SaaS (toxisch für Self-Promo, nur Reply-Mode).

**Concession-then-Critique zu LinkedIn:** Engagement-Rate stieg 2025→2026 um 44% auf 3.85% [[LinkedIn Marketing Benchmarks 2026, OwlClaw](https://owlclaw.com/benchmarks/linkedin-marketing-benchmarks/)] — aber organische Views fielen 50%, und 8/8 Comp-Founder (PRD §11.3) wuchsen via Twitter+Content+SEO, nicht LinkedIn-Organic. Ja, LinkedIn ist für $799+ Agency-Tier eine Pflicht-Surface — aber als Volumen-Kanal für 5-Posts/Woche-Cadence empirisch underperformend.

---

## Channel-by-Channel (mit Benchmarks)

### 1. Twitter/X — **Strong**
- **Why:** Personal-Accounts erzielen 5–10× mehr Engagement als Brand-Handles; Threads 8–12 Tweets +47% besser als kurze, +63% Impressions vs. Single-Tweet [[Tweet Archivist 2026](https://www.tweetarchivist.com/how-to-write-viral-twitter-threads)]. Gute Engagement-Rate <10k Follower = ~1.2% [[Monolit Benchmarks 2026](https://monolit.sh/blog/what-is-a-good-engagement-rate-on-twitter-2026)].
- **Critique:** First-90-Min entscheiden, sonst stirbt der Tweet [[ShipPost 2026](https://shippost.lol/blog/x-twitter-for-developers/)]. Kein "Threadtruck", keine "10 lessons from"-Bait.
- **Handle-Decision:** **Personal `@kolja_schoepe` primär, `@validationkit` als sekundärer Drop-Box** (Release-Announcements, Customer-Logos, Changelog). Brand-Handle erst nach Re-Brand (M9–M12, Sondr).

### 2. Hacker News — **Strong, aber One-Shot**
- **When:** Genau 1× Show-HN bei OSS v0.1 + Hosted-Web-App-Public-Beta = **Sprint 1.3 (Woche 3 nach M3-Gate)**. Plausible nutzte HN als Single-Inflection-Point (50k Reader, +$400 MRR aus einem Post) [[Plausible bootstrapping](https://plausible.io/blog/bootstrapping-saas)].
- **How:** Show HN, Dienstag oder Mittwoch 14–17 UTC (= 7–10 PT, 10–13 ET) [[Show HN Timing analysis, Myriade](https://www.myriade.ai/blogs/when-is-it-the-best-time-to-post-on-show-hn)]. Titel ohne Marketing-Speak. Founder beantwortet jeden Top-50-Comment in <90 Min.
- **Critique:** 9% Death-Rate/Jahr für HN-Show-Projekte [[Anton Tarasenko, 10k Show HN analysis](https://antontarasenko.github.io/show-hn/)]. Eine zweite Show-HN nur bei substantieller Feature (Cross-Vendor-Inventory-Drop, M9).

### 3. Substack-Newsletter — **Strong (Owned)**
- **Why:** B2B-Newsletter-Open-Rate 39.5% [[Letterhead 2026, via Prems.ai](https://prems.ai/blog/indie-hacker-marketing-playbook-2026)]; Newsletter-Conversion 2–4× über Social. Substack +67% YoY in paid subs.
- **Cadence:** **1×/Woche, Donnerstag 09:00 CET**, 1200–1800 Wörter. Format: 1× Concession (Was war diese Woche schwer/gefailed), 1× Critique (Was ich in der Branche falsch finde, mit Cite), 1× Numbers (LOIs, MRR, Repo-Stars).
- **Where:** Substack, NICHT Blog-on-App. Grund: Discoverability + Recommendation-Engine + RSS für Agency-CTOs.

### 4. LinkedIn Personal — **Mid**
- **Cadence:** 2×/Woche Long-Form (1000–1500 Zeichen), kein Carousel-Spam. Dwell-Time ist Primary-Ranking-Signal 2026 [[LinkedIn Algorithm 2026](https://owlclaw.com/benchmarks/linkedin-marketing-benchmarks/)].
- **Why-Mid:** Agency-CTO-Audience ist hier real ($799-Tier-Lead-Source), aber CPL organisch $164 vs $310 paid — d.h. nicht gratis, sondern Time-CPL. NIE DM-Automation.

### 5. IndieHackers — **Mid (Milestone-driven)**
- 1× Post pro Sprint nach Milestone (z.B. "First 5 LOIs — what 30 Mom-Tests taught me"). Plausible-Pattern: 19% Conversion-Rate aus IH bei early-stage [[How Indie Hackers Grow, IH Article](https://www.indiehackers.com/article/how-indie-hackers-grow-their-newsletters-f25011b649)].

### 6. Podcast-Guesting — **Mid**
- **Targets:** Indie Hackers Podcast (warm-intro via Courtland-Adjacent), MicroConf-Connect (warm), Latent Space (NO cold-email — Policy explizit, nur warm-intro [[Latent Space About](https://www.latent.space/about)]), MLOps Community (offener).
- **Pitch-Cadence:** 1 Pitch/Monat, max 2 Open-Threads. Pitch nur nach Sprint 1.3-Show-HN, damit Numbers existieren.

### 7. Reddit / YouTube — **Weak**
- r/SaaS, r/devtools: toxisch für Self-Promo, nur als Reply-only-Mode (1× helpful comment/Woche). YouTube-Shorts: erst nach M9, kein ROI-Beleg für Solo-Founder-Onboarding-Phase.

---

## "Killer-Hook"-Patterns (Skeptic-Mentor)

Aus Stripe-, Plausible-, Linear-Early-Tweet-Analysen [[Stripe Marketing Playbook, Dru Riley](https://druriley.com/stripe-marketing-playbook-7-strategies-33-examples/)]:

1. **Concession-then-Critique:** "AGENTS.md ist ein guter Start — aber 4 von 12 Parsern haben Cross-Vendor-Bugs, hier sind die Diffs."
2. **Specific Numbers contra Vibes:** "3.2% Cold-Email-Reply ist Hunter.io-Median 2026 — wenn dein 'erfolgreicher' Test 3.5% hatte, ist das Noise."
3. **Receipt-Driven:** Screenshot eines echten Audit-Reports + 1-Satz-Insight.
4. **Permission-to-Fail:** "Most ideas fail this. That's the point."
5. **Cite-or-it-didnt-happen:** Jeder Claim mit Inline-Source.

---

## 4-Wochen-Posting-Kalender (Beispiel, Sprint 1.0–1.3)

| Woche | Mo | Di | Mi | Do | Fr |
|---|---|---|---|---|---|
| **W1 Sprint-Start** | X-Thread: "Why I'm pre-publishing 4 BiP-posts BEFORE shipping" (Concession) | LinkedIn Long-Form: AGENTS.md cross-vendor reality | X single: Receipts (1 Mom-Test-Quote, anonymized) | **Substack #1: "5 LOIs or kill — the Phase-0-Gate"** | X-Thread: 8-tweet sprint-recap |
| **W2 Customer-Discovery** | X single: Mom-Test-Quote | LinkedIn: "Why we said no to a $99-Tier" (ADR-0018) | IH-Post: "10 agency-discovery-Calls — 4 patterns" | **Substack #2: Cross-Vendor parser-bugs found in week** | X-Thread: Anthropic Issue #6235 deep-dive |
| **W3 OSS-v0.1 Build** | X single: Demo-GIF of CLI | LinkedIn: GitHub-App Day-1-Mitigations (Trust-Center) | X-Thread: 12-tweet "Why deterministic audit > LLM-Review" | **Substack #3: Stripe Live-Mode-Checklist (Sprint 03 recap)** | X single: Repo-Stars-Receipt |
| **W4 Show-HN-Launch** | X-Thread: "Tomorrow: Show HN" priming | **Show HN, 14:00 UTC** + X-Thread Live-Updates + LinkedIn-Cross-Post + IH-Post | X single: HN-Numbers Receipt | **Substack #4: HN-Launch postmortem (Numbers, what failed)** | Podcast-Pitch-Day (3 warm-intros via Substack-Reader-List) |

**5-Posts/Woche = 1 Substack + 2 LinkedIn + 2 X-Threads + Daily X-Singles (zählen nicht in 5/W-Target).**

---

## Pre-Sprint-1.0 Frage (Q7)

**Verdict:** Publish 2 BiP-Posts BEFORE Sprint 1.0, 2 DURING. Grund: Plausible-Pattern (build-from-line-one) hat empirisch funktioniert; aber Receipts-Driven-Content braucht echte Numbers in W3–W4. Hybrid > Pure-Pre.

---

## Summary (100 words)

Twitter/X (Personal-Handle, Threads 8–12 Tweets) + Substack (1×/Wo Donnerstag, owned channel mit 39.5% Open-Rate) + Show-HN-One-Shot bei OSS-v0.1 (Dienstag 14–17 UTC in Sprint 1.3) bilden den Strong-Core. LinkedIn-Personal (2×/Wo) und IndieHackers (Milestone-driven) sind Mid; Reddit/YouTube/Brand-Handle bleiben experimentell. Concession-then-Critique-Voice + Cite-or-it-didnt-happen sind die Killer-Hooks (Stripe/Plausible-Pattern). 4-Wochen-Kalender mit klarer Sprint-Anbindung. Personal-Handle primär, `@validationkit` als Drop-Box. Podcast-Pitches erst nach Sprint-1.3-Show-HN, weil ohne Numbers kein Latent-Space-Warm-Intro funktioniert. Phase-1-Volumen-Target: 5 organische Posts/Woche, kein Paid, kein DM-Auto.
