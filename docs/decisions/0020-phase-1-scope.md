---
id: ADR-0020
title: Phase-1 scope locked — CPN (not AAIF), pricing tweaks, GH-App revised cost, monthly trigger-watch
status: Accepted
date: 2026-05-17
deciders: ["Kolja Schöpe (Owner)"]
supersedes: []
superseded_by: []
affects_prd: ["§6.4", "§6.5", "§11", "§16.6"]
trigger_to_revisit: ["AAIF restructures as Anthropic-only sub-tier", "Anthropic ships Claude-for-Agencies SKU with multi-tenant agent-file inventory", "M3-Gate fails to reach ≥5 Agency LOIs", "Stripe rejects DACH KYC twice in ≤30 days"]
severity_of_change: Mid
---

# ADR-0020 — Phase-1 Scope: CPN over AAIF, pricing tweaks, GH-App revised cost, monthly trigger-watch

- **Status:** Accepted
- **Datum:** 2026-05-17
- **Autoren:** Kolja Schöpe + Claude (10-agent parallel research, synthesis in `docs/research/phase-1-pivot/00-synthesis.md`)
- **Supersedes:** N/A (formalizes Phase-1 launch decisions; does not re-open ADR-0017 / ADR-0018)
- **Reicht aus, bis:** Phase 2 (M9+) or a listed `trigger_to_revisit` fires

## Kontext

Phase 0.5 closed 2026-05-17 with Sprint 0.14 (4 dashboard sprints, $0 cumulative cash-out). Phase-0-Gate is partially open: gate-criteria #4 (OSS v0.1) and #5 (Parser MUST-5) and #8/#9 (Handbooks) ✅; criteria #1 (20 Indie Mom-Tests), #2 (10 Agency Discovery), #3 (5 Agency LOIs) are 0/N. 10 parallel research-agents (A1–A10) audited the Phase-1 plan and surfaced three load-bearing factual corrections to the PRD plus one ADR-watch-status change:

1. **PRD §11 misnames the partner program** — AAIF is the Linux Foundation's Agentic AI Foundation (not Anthropic's), Silver costs $10k/yr (not $5k), and the real Anthropic vehicle is the **Claude Partner Network** ($0 entry, launched 2026-03-12, $100M fund) ([Anthropic 2026-03-12](https://www.anthropic.com/news/claude-partner-network); [Linux Foundation Press 2025-12-09](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation); [Superagentic 2025-12](https://shashikantjagtap.net/agentic-ai-foundation-where-open-innovations-meet-closed-governance-and-a-platinum-paywall/)).
2. **GH-App Day-1-Mitigations cost (PRD §6.4) is ~40% under-budgeted** — A1 estimate: 14–17 PD production-acceptable, 5.5 PD for a Sprint-1.0-minimal slice. PRD's 9–12 PD is the in-app-only path that defers webhook reconciliation.
3. **Mom-Test v1 recording line is criminally exposed under DACH §201 StGB** (A9) — must be patched with bilingual prior-consent template before any DACH interview ships.
4. **ADR-0018 Trigger #2 (Anthropic agency-SKU) reclassified 🟢 → 🟡 amber** — Claude Partner Network ratifies the agency-channel narrative but does NOT fire Trigger #2 by the letter (it's training + co-sell, not a multi-tenant inventory product). Watch monthly (was quarterly).

The PRD's pricing ladder is structurally defensible vs 2026 dev-tool comps (Cursor $20, Sentry $26, Snyk $25) but light on the indie entry and the agency ceiling (A5).

## Entscheidung

This ADR locks six Phase-1 decisions:

1. **NO AAIF $10k spend.** GO Claude Partner Network ($0 entry) at M3 after Kolja earns the free Claude Certified Architect credential. PRD §11 patched in Sprint 1.0.
2. **Pricing tweaks:** Solo Indie $19 → **$25**; add **Agency-Scale-Plus $1,499/mo annual-only** (annual-only, MSA-required, no self-serve); **20% annual discount default** across all paid tiers; **EU geo-IP → VAT-inclusive display**; collapse audits-quota to "fair-use" copy on public pricing page. Sprint 1.1 lands the Stripe + UI changes.
3. **GH-App Day-1-Mitigations revised cost-budget:** 14–17 PD production-acceptable / 5.5 PD Sprint-1.0-minimal-slice. Sprint 1.0 ships scope-pinned manifest + webhook reconciliation + DPA acceptance-gate + sub-processor changelog feed. Sprint 1.1–1.3 ship the production-hardening.
4. **Mom-Test recording stack:** **Zoom-local + whisper.cpp + bilingual DE/EN explicit-prior-consent template** (A9 verbatim block). $0 cost, fully local, no sub-processor on `/trust`, GDPR-trivially-clean. Sprint 1.0 paperwork-track lands the consent-script update before first interview.
5. **Sprint 1.0 dual-track:** 7 PD code (5.5 GH-App slice + 1 eval + 0.5 PRD-patch) + ~3–5 hours/week parallel paperwork (Gewerbeanmeldung, Stripe activation, CCA course, first warm-intros). Cash-out: $0.
6. **Watch-list cadence upgrade:** ADR-0018 Trigger #2 watched **monthly** (was quarterly) — Anthropic Claude Partner Network in particular. IBM mcp-context-forge naming-collision factored into M8 lawyer-prep (PRD existing line-item).

## Begründung

### Why CPN, not AAIF

- **Cost ratio:** CPN $0 vs AAIF $10k/yr + LF-Silver prerequisite ([AAIF Members directory](https://aaif.io/members/), [Linux Foundation Membership pricing](https://www.linuxfoundation.org/membership)). Saves $10k/yr of cash that doesn't exist yet at Sprint-0.14 ship.
- **Buyer-overlap:** CPN's Anchor-Partners are Accenture / Deloitte / PwC / Cognizant / Tribe AI — large-enterprise integrators. Our buyer (5–30 person AI-consultancy) does not compete in that league but the directory listing reaches our buyer's customers ([Lowcode.agency 2026-04](https://www.lowcode.agency/blog/claude-partner-network-worth-it)).
- **Hebel:** CPN unlocks Skills-Marketplace featured-listing (gated by membership), co-sell with Applied-AI-Engineers, and early product-access — none of which AAIF offers ([Anthropic Help Center](https://support.claude.com/en/articles/11174108-about-the-development-partner-program)).
- **Sequencing:** Free CCA course + live deployment proof = 60-day onboarding clock from M3. AAIF Silver is M6+ Scale-Lever if-ever, not M3.

### Why these pricing tweaks (and not a re-pricing)

- **Solo Indie $19 → $25** matches Sentry $26/dev Team + Snyk $25/dev Team parity ([Sentry pricing](https://sentry.io/pricing/), [Snyk plans](https://snyk.io/plans/)). $19 reads "still in beta"; $25 reads "professional-grade" without crossing the $29 psychological ceiling.
- **Agency-Scale-Plus $1,499/mo annual-only** absorbs M3–M9 LOI conversions without "call sales" friction. Today's $799 × 12 = $9.6k ARR ceiling sits below the documented Sprint-to-Hosted $45k–108k Cash band in PRD §11. Annual-only + MSA keeps Stripe-self-serve clean for sub-Scale-Plus tiers.
- **20% annual discount** matches Linear ([linear.app/pricing](https://linear.app/pricing)) + Cursor ([cursor.com/pricing](https://cursor.com/pricing)) — the PLG-leader playbook. Signals "we expect retention".
- **EU geo-IP VAT-inclusive** adds +12% conversion at zero engineering cost ([Profitwell 2025 conversion benchmarks](https://www.profitwell.com/blog/saas-pricing-tactics)).
- **NO $99 sandwich** (PRD #15 reaffirmed). NO price-cut. NO free-tier expansion (1 repo / 20 audits stays — generous-free correlates with conversion-collapse below 2%).

### Why 5.5 PD Sprint-1.0-minimal-slice (not 9–12 PD all-at-once)

- The PRD §6.4 budget assumes the in-app-only Approver-Bridge — i.e. ValidationKit's own UI is the source-of-truth for "Customer-Admin approved this install". A1 §3 demonstrates that the reference implementations (Reform, Linear) use GitHub's own `installation`/`installation_repositories` events as source-of-truth ([GitHub Docs — App installation requests](https://docs.github.com/en/apps/sharing-github-apps/making-a-github-app-public-or-private)). Treating our in-app `install_request` table as a projection of GitHub-side state is +3 PD over the PRD number but is the right architecture for GDPR-Joint-Controller defense (CJEU Fashion ID C-40/17).
- The Sprint-1.0-minimal slice (5.5 PD) ships the load-bearing piece (webhook reconciliation + scope-pinned manifest + DPA-acceptance-gate) and defers the production-hardening to Sprint 1.1–1.3. This unblocks LOI conversations — agencies can point at `/trust/dpa` during discovery calls — without burning the full 14–17 PD before the first paying customer.

### Why monthly watch (not quarterly) for ADR-0018 Trigger #2

- Anthropic's product velocity in 2026 is high: Skills-Marketplace (2025-12), Claude Partner Network (2026-03), Munich office + new DACH/CEE head (2026-04) all in <120 days ([Anthropic — Munich/Paris offices](https://www.anthropic.com/news/new-offices-in-paris-and-munich-expand-european-presence)). A quarterly cadence misses the fire-window by 30–60 days.
- The narrative shift (Anthropic owns "enterprise rolls out Claude through a partner") raises the probability that a future Anthropic product surface ships with multi-customer-inventory features. Trigger #2 fires immediately if/when that happens.

### Why Zoom-local + whisper.cpp (not Otter.ai)

- §201 StGB + GDPR Art. 6(1)(a) require explicit prior consent; v1's "ask post-hoc" line is criminally exposed in DE/AT/CH ([§201 StGB](https://www.gesetze-im-internet.de/stgb/__201.html), [GDPR Art. 7](https://gdpr-info.eu/art-7-gdpr/)).
- Zoom-local-record (mp4) → whisper-large-v3 (3 min for 30 min audio on M-series Mac) → 24h audio-delete + 12-month transcript cap → no third-party processor → no `/trust` sub-processor disclosure required ([whisper.cpp benchmarks](https://github.com/ggerganov/whisper.cpp#benchmarks)).
- Cost: $0. Compare Otter.ai free-tier (300 min/mo, hard 30-min cap, fragile for 30 × 30-min interviews).

## Konsequenzen

### Positive

- Phase 1 budget ceiling drops from PRD-implied $10k+ to $500 cumulative (saves $10k on AAIF, defers SaaS-spend to revenue-triggered).
- Cleaner GDPR posture from day 1 (Zoom-local + bilingual consent + read-only-default-by-manifest).
- LOI conversations have a `/trust/dpa` page + DPA-acceptance audit-log to point at by end of Sprint 1.0 (acceleration vs in-app-only path).
- Pricing ladder matches 2026 dev-tool comps without sandwich; Agency-Scale-Plus absorbs M3–M9 LOI conversions.
- CPN application + Skills-Marketplace listing path active by Sprint 1.4 — closes the marketing-distribution gap vs AAIF-equivalent visibility.

### Negative

- 14–17 PD GH-App full-mitigation cost is ~40% over PRD §6.4 estimate; Sprint 1.1–1.3 absorbs the overage at the expense of Sprint 1.7+ feature work.
- Annual-only Agency-Scale-Plus requires MSA template (legal cost ~€500–1k at M6).
- VAT-inclusive geo-IP toggle adds an edge-case: VPN-using prospects see incorrect display (mitigation: footer note "EU prices include VAT; switch to USD/excl. via account settings").
- Monthly watch-cadence requires ~1h/month of Kolja's time (cheap, but real).

### Neutral

- PRD §11 patch in Sprint 1.0 is a load-bearing edit — must be done before any LOI conversation references "AAIF" (none yet, so low-risk).

## Alternativen geprüft

1. **AAIF Silver $10k + LF-Silver prerequisite** — rejected on cost-ratio, buyer-overlap mismatch, sequencing (M6+ if ever). A7 §1–3.
2. **Both CPN + AAIF in parallel** — rejected; AAIF spend has no incremental Hebel that CPN doesn't already deliver. A7 §4.
3. **Skip Partner Programs entirely, organic-only** — rejected; A4 channel-math requires CPN as 1 of 5 paths to 5-LOI gate ($0 incremental cost makes it dominant choice). A4 §2.
4. **Re-price entirely (raise all tiers)** — rejected; A5 verdict "tweak, don't re-open"; current ladder structurally defensible.
5. **Defer GH-App mitigations to Sprint 1.4+** — rejected; LOI conversations need DPA + scope-policy by Sprint 1.0 end to anchor sales (A1 §5).
6. **Promote ADR-0018 Trigger #2 to fire today** — rejected; Anthropic CPN is not a product surface per the strict ADR-0018 language. A6 §2.
7. **Stay with Otter.ai cloud transcription** — rejected; §201 StGB + sub-processor disclosure friction outweighs convenience. A9 §3.

## Re-open conditions (load-bearing)

This ADR re-opens — and Phase-1 scope renegotiated — if ANY of:

- AAIF restructures as Anthropic-only sub-tier with <$5k entry → re-evaluate the AAIF/CPN exclusivity decision
- Anthropic ships a product surface with multi-customer agent-file inventory → ADR-0018 Trigger #2 fires; ADR-0020 scope corrects in same revision
- M3-Gate ≥ 5 LOIs not reached by Sprint 1.6 (Week 13–14) → ADR-0022 scope-correction triggered (per phase-1.md Sprint 1.6 DoD)
- Stripe rejects DACH KYC twice in ≤30 days → revisit go-to-market region (e.g., LLC-in-US fallback per "Stripe Atlas" path)
- LLM-FP-rate exceeds 15% at `mid` confidence in 2 consecutive monthly evals → pause LLM-augmented marketing claims; revisit Constraint #14 → Constraint #14-Plus stricter band
- IBM mcp-context-forge trademark blocks Sondr/Pondera rebrand at M8 lawyer-check → M9–M12 re-brand window scope expanded

## Source-Recherche

10 parallel research-agents A1–A10, synthesis in `docs/research/phase-1-pivot/00-synthesis.md`. Individual outputs:

- `01-gh-app-mitigations-deep-dive.md` — 14–17 PD cost-revision
- `02-llm-eval-30-file-golden-set.md` — 9-entry fill plan + FP-instrumentation
- `03-stripe-live-mode-checklist.md` — 3 Kill blockers all non-code (DACH KYC, Stripe Tax, PCI SAQ-A)
- `04-agency-loi-channels-dach.md` — channel-priority + 4–10 LOI gate-math
- `05-pricing-deltas-vs-comps.md` — Solo Indie 19→25, Agency-Scale-Plus 1499/yr, 20% annual
- `06-competitive-refresh-Q3.md` — ADR-0018 Trigger #2 amber; IBM naming-collision
- `07-anthropic-partner-program.md` — AAIF $10k NO; CPN $0 GO
- `08-launch-channels-bip-cadence.md` — Twitter + Substack + Show-HN one-shot
- `09-interview-template-mom-test.md` — §201 StGB consent fix; Zoom + whisper.cpp
- `10-outreach-cadence-warm.md` — 4-touch 1-4-8-15; 25/wk cap; Linear CRM

## Phase 1 sprint sequencing

Detailed sprint plan: `docs/roadmap/phase-1.md` Sprint 1.0 → 1.12.

---

*ADR status: Accepted 2026-05-17. Supersedes nothing. Locks Phase-1 scope until M9 or re-open trigger fires.*
