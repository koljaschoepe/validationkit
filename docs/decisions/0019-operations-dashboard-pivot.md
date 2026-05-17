---
id: ADR-0019
date: 2026-05-17
status: Accepted
supersedes: []
affects_prd: ["§3 Target Users", "§4 Pricing", "§6 Functional Scope", "§7 Roadmap"]
trigger_to_revisit:
  - Anthropic-direct-LLM-cost exceeds $50/mo before LOI #5
  - shadcn migration takes >12 PD (50% over baseline) → consider rollback
  - grekt-labs/dashboard ships --tenant flag OR hosted SaaS before our Phase 1 closes
  - 0 of 10 first testers find a "live dashboard" useful enough to come back for a 2nd run within 7 days
---

# ADR-0019 — Operations-Dashboard as the Phase-1 Interface

## Kontext

After Phase 0 shipped a working public-URL audit tool (https://validationkit.vercel.app, Sprint 0.10), the founder asked (2026-05-17) for a vision-pivot: from "1-shot audit by URL" to a **multi-repo operations dashboard** with:

- Account-based persistent overview
- Visual connections between added repos
- Auto-detection of changes (re-audit triggered on push or schedule)
- Specific, applicable fixes (not just AI explanations)
- Multi-LLM support with cheaper-default
- Freemium per-repo pricing (1 free, others paid)
- Production-quality frontend

12 parallel research agents (A1–A12) returned. Verdicts synthesized in `docs/research/dashboard-pivot/00-synthesis.md`.

## Entscheidung

**ADR-0019 codifies the dashboard-pivot as a delivery-mode-change, NOT a strategy-change.** ADR-0017 (Hybrid-Pivot-E) and ADR-0018 (ContextForge-Productized-Form) remain load-bearing.

We commit to four concrete things:

1. **Interface shift:** the primary surface becomes a **dashboard with a list-table + sidebar-as-filter + saved-views pattern** (empirical 2026 convergence across Vercel + GitHub Dashboard + Sentry + Linear; A1). The single-shot home-page audit form remains for anonymous-try (A9), but signed-in users land on `/dashboard` (new), not `/scans`.

2. **Stack additions:**
   - **shadcn/ui new-york** as the design system (A5). 8 PD migration baseline.
   - **React Flow v12** for the repo-connection visual (A2). Only on `/dashboard` and `/customers/[id]`, not anywhere else.
   - **Inngest-scheduled-polling + `/api/notify-update` opt-in** for auto-tracking (A3). NOT GitHub-App-webhooks yet.
   - **Polling + Vercel-native SSE** for real-time updates (A8). NOT Pusher/Ably/PartyKit.
   - **Stripe Test-Mode-code-path now, Live-Mode-flip post-LOI** (A11).
   - **Multi-LLM abstraction layer (AI-SDK)** scaffolded but no provider keys set (A4).

3. **Freemium pricing locked in (A6 confirms PRD §4):**
   - Free: 1 repo, full audit, 30-day retention, 20 runs/month soft-cap
   - Solo Indie $19/mo: 3 repos, 50 runs/mo, 90-day retention
   - Solo Pro $79/mo: 10 repos, 250 runs/mo, 1-year retention + audit-report
   - Agency Pro $299/mo: 10 customer-repos, 5 users, 1000 runs/mo
   - Agency Scale $799/mo: 30 customer-repos, 15 users, 5000 runs/mo
   - No $99 tier (PRD Constraint #11 still load-bearing)
   - Hard gate on "Add Repository"-click (Plausible-Pattern). NEVER paywall audit-result.

4. **Phase-0.5 roadmap (zero-cash-out) is the path to first 10 testers.** 4 sprints × 1 week each (0.11–0.14). Details in `docs/roadmap/phase-0.5-dashboard.md`.

## Begründung

### Why pivot now, not later

- **A10 finding:** grekt-labs/dashboard shipped a (single-tenant) multi-repo dashboard 2026-03-12. Our Q2 read of "no signal" was wrong-light by 9 weeks. Cross-customer-tenant clear-air dropped from 6–9mo to **4–7mo**. Acting now is the difference between leading and following.
- The current `/customers` + `/scans` + `/drift` surface area is operationally correct but visually 2003-era. Mom-Test demos in Sprint 0.11+ will land much harder with a real dashboard than with raw tables.

### Why this is a delivery-pivot, not a strategy-pivot

- The wedge (Cross-Vendor-12-format + cross-customer-tenant) doesn't change. We still parse 12 vendor formats. We still detect drift deterministically. We still serve the dual-wedge Indie + Agency split.
- The dashboard is a wrapper around the existing audit/drift/fix engines, not a replacement.

### Why these specific stack choices

- **shadcn/ui:** A5 ran the matrix. shadcn is the only candidate that is RSC-native AND covers all 6 required component slots (sidebar, command-palette, data-table, form+validation, dialog, toast) AND preserves the existing severity-bänder via CVA. Copy-paste model = zero supply-chain risk = matches Trust-Center brand argument (PRD §6.4 Mitigation #2).
- **React Flow:** Only library that's RSC-friendly with `dynamic({ssr:false})` + MIT + has the visual polish we need + bundle size acceptable (~50kB) — A2 ran the comparison.
- **Inngest polling, no GH App yet:** GH-App requires 9–12 PD of Day-1 Mitigations (PRD §6.4) which is premature pre-5-LOIs. Polling is good-enough for our latency envelope (1–6h is acceptable for Pre-Build Indie use-case).
- **Polling + SSE no Pusher:** A8 verdict — Pusher's free tier hits a cliff at ~200 connections + 200k messages/day, exactly where agencies × tabs land in M9. SSE is Vercel-native ($0).
- **Stripe Test-Mode-first:** A11 plan — full code-path can be built in Test-Mode for $0. Flip to Live-Mode is 1 env var + 5min Stripe-business-verification. Removes payment as a blocker without spending.

### Why we don't enable LLM features yet

- A4 verdict: cost-spread is 57× between cheapest (GPT-5 Nano $0.023/100) and Sonnet 4.6 ($1.32/100). Until we have a 30-file golden-set FPR-evaluation (PRD §6.5 Phase-0-Gate-Criterion #7), we cannot defend a quality claim. Premature LLM-feature-launch with poor FPR is a Trust-Killer (PRD §13 + Track-D2).
- Cash-out trigger explicit: $5 Anthropic credits enabled **only after 1 tester explicitly asks**. Default Phase-0.5 surface shows `conflicting-rules` as "(LLM, opt-in — set ANTHROPIC_API_KEY)".

### Counter-arguments considered

1. **"Skip shadcn migration, build a custom design system":** rejected. 8 PD shadcn vs ~25 PD custom-DS. shadcn migration is 5 day-effort with proven outcome.
2. **"Just register the GitHub App now":** rejected. Day-1-Mitigations are 9–12 PD; without them the App's GDPR Joint-Controller risk (PRD §6.4) is not addressed. Premature.
3. **"Use Anthropic API as default":** rejected. Cost-Spread says we cannot afford it as default for free-tier without burning runway. Multi-LLM abstraction is the right gate.
4. **"Build webhook-based real-time:** rejected. Vercel-native SSE handles current scale + acceptable latency; Pusher/Ably hits a free-tier cliff at exactly the wrong moment.

### Compatibility with load-bearing constraints

- **§2 #1 Multi-Provider Tag 1**: multi-LLM abstraction layer in `@vk/llm` already supports it. ✅
- **§2 #2 Citation-First**: every finding still has file:line. Dashboard adds visual; doesn't replace citations. ✅
- **§2 #3 Legitimate channels only**: pivot doesn't touch outreach. ✅
- **§2 #5 Severity-bänder**: shadcn migration preserves all 5 bands via CVA (verified in A5). ✅
- **§2 #6 Open-Source Trust (MIT)**: shadcn = copy-paste source, no vendor lock-in. ✅
- **§2 #7 Skeptic Mentor voice**: every empty-state and onboarding copy explicitly Skeptic-Mentor (A9). ✅
- **§2 #8 Hybrid Layered**: PLG via free-tier + Productized-Service via $4500 Sprint stays unchanged. ✅
- **§2 #9 Solo through M18**: 4-sprint roadmap is solo-realistic (A12). ✅
- **§2 #10 Naming**: working-title `validationkit.vercel.app` continues; M9 re-brand window unchanged. ✅
- **§2 #11 Dual-Wedge**: dashboard serves both `/validate` (anonymous-public-audit) and `/operations` (signed-in-multi-customer). ✅
- **§2 #12 Cross-Vendor Pflicht**: 12 vendor formats unchanged. ✅
- **§2 #13 Audit deterministic-first**: 5/6 deterministic categories preserved; 4/6 deterministic fix-suggestions added in Phase 0.5 (A7). ✅
- **§2 #14 GitHub-App-Mitigations Pflicht**: deferred-with-trigger (5 LOIs), not skipped. ✅

## Re-Open-Trigger

This ADR re-opens if any of the following:

1. **Cost overrun:** Anthropic-direct-LLM-cost (when enabled) exceeds $50/mo before LOI #5 — review whether GPT-5 Nano default needs to drop further or stay opt-in-only.
2. **Migration overrun:** shadcn migration exceeds 12 PD (50% over baseline) — consider rollback to custom CSS or evaluate alternative (HeroUI).
3. **Competitive pressure:** grekt-labs/dashboard ships `--tenant` flag OR hosted SaaS OR Cloud repo `grekt-labs/` before our Phase 1 closes — re-evaluate whether to accelerate write-side features.
4. **No-stickiness signal:** 0 of 10 first testers return for a 2nd run within 7 days — dashboard UX is failing.

## Consequences

- Frontend stack changes: custom CSS → shadcn/ui. Existing components (`SiteNav`, `AuditForm`, `ReportView`, `DriftView`, `ScanStatusBanner`, `BipDrafts`, etc.) need re-wiring against shadcn primitives. Severity-bänder + dark-mode preserved via CSS-vars-mapping.
- Two new packages: `@vk/billing` (Stripe abstraction, A11) and optionally `@vk/dashboard-graph` (React Flow wrapper, A2). Both scaffolded in Phase 0.5.
- ADR-0017 + ADR-0018 unchanged. No re-open triggered.
- PRD §3 Target Users + §4 Pricing + §6 Functional Scope updated as part of Phase 0.5 sprint deliverables.
- `STATUS.md` Phase-0-Gate-Criteria stay 11/11; this ADR is Phase 0.5 (new tracking column), not Phase 0 re-shape.

---

*Decided: Kolja Schöpe + Claude. 2026-05-17. Synthesis input: 12 research agents A1–A12 in `docs/research/dashboard-pivot/`.*
