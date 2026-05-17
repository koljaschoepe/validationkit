# 10 — Competitor Deep-Dive (Dashboard-Pivot)

> Research-Agent A10 · 2026-05-17 · Scope: did any of the 5 direct competitors ship the multi-customer-repo operations dashboard we're now planning? Severity-banded per-competitor, re-recommends ADR-0018 trigger status.

## TL;DR

**Clear-air narrows from 6–9 mo to 4–7 mo, but does NOT close.** Two adjacent dashboards shipped since the Q2-refresh (`grekt-labs/dashboard` v1.0.0 on 2026-03-12, Hermes Web Dashboard on 2026-05-08) — both single-instance, single-operator, localhost-only. GitHub ACP GA added enterprise-wide agent-session views, but still single-tenant within one enterprise. **No competitor ships cross-customer-tenant for agencies.** ADR-0018 does NOT re-open today, but `grekt-labs/dashboard` moves from "no signal" (Q2) to **High-stable-with-watch** — the rails are now laid; a multi-tenant fork is now a 4-week build, not a 6-month build.

---

## 1) grekt-labs · **High** ↑ (was: High stable)

**What shipped:** v6.46.0 (2026-02-xx) `grekt dashboard sync` + reporter, v6.47.0 (~2026-03-xx) "standalone dashboard setup command + onboarding wizard," v6.48.0 plugin-based security scanner with `aguara` integration, latest cli release **v6.48.1 on 2026-03-22**. The dedicated [`grekt-labs/dashboard`](https://github.com/grekt-labs/dashboard) repo hit **v1.0.0 on 2026-03-12** — Vue 3 + Tailwind + PocketBase + Bun + Docker Compose, **self-hosted only**, explicit "Nothing leaves your machine or network."
**Multi-repo UX:** Yes — installed-artifacts inventory across projects, eval-score regression tracking, per-category trust badges, registry mgmt. Table-primary list view (Vue 3 confirmed).
**Multi-tenant:** No. One instance per operator. No customer-isolation, no per-customer roles, no SaaS-tier.
**Pricing:** Free OSS. No hosted SaaS.
**Drift / auto-tracking:** Yes — `grekt check` for drift detection, but **CLI-triggered**, no scheduled-poll story, no webhook. Drift-result-sync to dashboard is the load-bearing new feature.
**Customer voice:** None findable.
**Threat verdict:** **High** (sticky). The dashboard rails are now laid. If they add `--tenant <slug>` and Clerk-style auth, the 6-mo clear-air collapses to ~4 weeks. Watch every release. ([grekt.com](https://grekt.com/), [grekt-labs/dashboard](https://github.com/grekt-labs/dashboard))

## 2) MindStudio · **Mid** → (was: High stable)

**What shipped:** Pricing-page snapshot 2026-05-17 — Free / Individual $20 / Business custom. Business adds team workspace, SSO, audit logs, **flexible self-hosting**. Recent blog posts (last 3 weeks) on multi-agent-orchestration and multi-agent-business-workflows. **Still no multi-tenant productized SKU.** The 6 prior "pattern blog-posts" did not become a customer-deployable agency-tier.
**Multi-repo UX:** No — agent-builder, not agent-file-inventory. Different category.
**Pricing:** Per-workspace, per-agent. Not per-repo.
**Drift / auto-tracking:** Not mentioned.
**Customer voice:** "150 000 deployed agents" claim; no named agency-consultant testimonial.
**Threat verdict:** **Mid** (down from High). Q2 hypothesis was "next funding round forces packaging." It hasn't. MindStudio's center-of-gravity drifted toward multi-agent-orchestration content, not multi-tenant-agency operations. Threat **down-grade**, watch for partner-program announcements. ([MindStudio Pricing](https://www.mindstudio.ai/pricing), [Build & Monetize blog](https://www.mindstudio.ai/blog/build-monetize-ai-agents-business))

## 3) GitHub Agent Control Plane · **Mid-High** → (was: Mid-High)

**What shipped:** GA 2026-02-26 — `actor_is_agent` audit-flag, `agent_session.task` event, **enterprise-wide agent-session view (last 24h) filterable by agent + task-state**, `.github/agents/*.md` push-rule policy enforcement via API, fine-grained admin role.
**Multi-repo UX:** Yes within enterprise — enterprise-scope session-list with filter on agent-type + state + navigate-to-repo. But: **one enterprise = one tenant**. Agencies operating across separate customer GitHub orgs/enterprises see **N separate ACPs**, not one cross-customer view.
**Pricing:** GitHub Enterprise tier (per-seat, customer's own contract). Not buyable as an agency-aggregator.
**Drift / auto-tracking:** Push-rules on `.github/agents/*.md` is the canonical primitive. **Within-tenant only.**
**Customer voice:** None from this fetch.
**Threat verdict:** **Mid-High** (sticky). Closes the *intra-tenant* governance gap. Agency-cross-tenant inventory across Claude+Cursor+Codex+Gemini customers is **not on their roadmap** — that's our wedge. PRD constraint #1 (Multi-Provider) and PRD §6.2 (12-format parser, 5 MUST incl. `.cursor/rules/*.mdc`) hold. ([GitHub Changelog, 2026-02-26](https://github.blog/changelog/2026-02-26-enterprise-ai-controls-agent-control-plane-now-generally-available/))

## 4) WorthBuild · **Mid** → (was: Mid)

**What shipped:** Pay-per-report still $5 / $20-for-5. Free tier: 1 validation/month. **No operations-side product.** "Customer-discovery-engine" (Reddit/HN/X scraping) is their wedge.
**Multi-repo / dashboard:** None. Single-report-per-idea.
**Drift / auto-tracking:** N/A — they don't operate post-build.
**Customer voice:** Named: Aya Abdallah (UX/UI Researcher) "100x faster"; Batool Nawasrah; Abdallah Abbasi.
**Threat verdict:** **Mid** stable, **only** as competitor on the Indie-Wedge. Zero overlap with the Dashboard-Pivot (Agency-Wedge). ([WorthBuild](https://worthbuild.io/))

## 5) founderscore · **Mid** → (was: Mid)

**What shipped:** 10-phase pipeline still core. Build-Documents kit (Technical Spec, Blueprint, Data Model, API Design, User Stories, Roadmap, Project Kickoff) — execution-prompts post-validation, **not multi-repo operations**. Site returned 403 on fetch (Cloudflare-block on bot UA) — search-snippets used.
**Multi-repo / dashboard:** None. Per-idea pitch-paper output.
**Drift / auto-tracking:** N/A.
**Customer voice:** None retrievable.
**Threat verdict:** **Mid** stable, Indie-Wedge only. No operations-side movement. ([founderscore.app](https://founderscore.app/))

---

## Bonus signal — new adjacent entrant (post-Q2-refresh)

**Hermes Web Dashboard** (Context Studios) shipped **2026-05-08** (updated 2026-05-13). `hermes dashboard` → browser opens at `127.0.0.1:9119`. Session-browser + cron + API-key gov + log-viewer. **Single-operator, localhost, single-session-token auth** — explicit "no multi-user authentication." Multi-repo not addressed. ([Context Studios blog](https://www.contextstudios.ai/blog/hermes-web-dashboard-the-agent-control-plane-has-arrived))

Signal: two OSS dashboards shipped in 9 weeks (grekt 2026-03-12, Hermes 2026-05-08). Pattern is forming. Multi-tenant SaaS-fork of either is the realistic 6-month threat.

---

## Was the Q2 map right?

| Q2 claim | Status 2026-05-17 | Diff |
|---|---|---|
| grekt: "no multi-tenant dashboard signal in 90 days" | **Wrong-light.** They shipped a *single-tenant* dashboard 2026-03-12. Not yet multi-tenant. | Tighten watch. |
| MindStudio: "no productized SKU, watch funding" | **Right.** Still no Agency-SKU. | No change. |
| GitHub ACP: "shipped intra-tenant policy export, no cross-tenant" | **Right.** GA confirms enterprise-scope only. | No change. |
| WorthBuild + founderscore: Indie-Wedge competitors only | **Right.** Zero operations-side movement. | No change. |

**Clear-air recalibration:** Was 6–9 mo. **Now 4–7 mo** for the cross-customer-tenant dashboard wedge specifically. Cross-Vendor-12-format-parser wedge: still 9–12 mo (no one parses Cursor + Codex + Gemini + Claude all in one inventory).

## ADR-0018 trigger re-evaluation

| Trigger | Q2 status | **Now (2026-05-17)** |
|---|---|---|
| <5 Agency-LOIs by M3 | 🟡 at-risk (0/5) | 🟡 **at-risk (0/5)** — unchanged, recheck end-W13 |
| Anthropic "Claude-for-Agencies" SKU | 🟢 no | 🟢 no |
| **grekt/MindStudio Multi-Tenant** launch | 🟢 not shipped | 🟡 **partial — grekt shipped single-tenant dashboard 2026-03-12; multi-tenant fork is now a 4-week build, not a 6-mo build** |
| PRD-Roadmap >40% kollabiert | 🟢 no | 🟢 no |
| <50% Sprint→Hosted-App conversion | 🟢 N/A | 🟢 N/A |

**Verdict:** ADR-0018 does **NOT** re-open today. Trigger #3 moved 🟢→🟡 (partial). Re-open IF `grekt-labs/dashboard` ships `--tenant` flag OR a hosted-SaaS-tier announcement.

## Recommended actions (90 days)

1. **Watch `grekt-labs/dashboard` weekly** (already in cadence) — alert on commits touching `auth`, `tenant`, `workspace`, `org`, or any new `hosted` / `cloud` repo at the org level.
2. **Pre-empt the comparison.** Add a 1-pager to `/trust` positioning VK against `grekt dashboard` (cross-vendor-12-format + cross-customer-tenant > single-tenant-local-only). Drop into Sprint 0.11 alongside the GitHub-ACP side-by-side.
3. **Tighten Phase-0.5 dashboard-pivot scope** — the table-primary list-view we landed on (A1 research) matches grekt-dashboard's Vue table. Differentiation = cross-tenant + cross-vendor surface, **not** UI novelty.
4. **Watch Hermes** monthly for a multi-tenant pivot — Context Studios is a paid consulting agency, their incentive to productize is real.

---

*Files referenced:* `/Users/koljaschope/Documents/rohan/docs/research/compete-2026-Q2.md`, `/Users/koljaschope/Documents/rohan/docs/research/dashboard-pivot/01-multi-repo-dashboard-ux.md`, `/Users/koljaschope/Documents/rohan/docs/research/dashboard-pivot/03-auto-tracking-strategy.md`, `/Users/koljaschope/Documents/rohan/docs/decisions/0018-contextforge-as-productized-form.md`.

*Word count: ~690.*
