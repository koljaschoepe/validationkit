# Dashboard-Pivot Synthesis (2026-05-17)

> **Status:** Synthesis of 12 parallel research dispatches. Verdict-tragend für ADR-0019 + `phase-0.5-dashboard.md` Roadmap.

> **Owner:** Kolja. **Trigger:** founder request 2026-05-17 ("Repo-Operations-Dashboard, multi-LLM, freemium per-Repo, visuell cool, zero-spend bis ready").

---

## 1. The 3 load-bearing findings

### Finding 1 — Competitive clock just sped up (A10)

`grekt-labs/dashboard` v1.0.0 shipped **2026-03-12** (Vue 3 + Tailwind + PocketBase, self-hosted, single-tenant). Q2 `/compete-check` (`docs/research/compete-2026-Q2.md`) read "no signal" — **that was wrong-light by 9 weeks**. Hermes Web Dashboard (Context Studios) shipped 2026-05-08, also single-tenant + localhost-only.

**Implication:**
- Multi-tenant fork from grekt = **~4 weeks build, not 6 months** like the old map assumed.
- Cross-customer-tenant clear-air dropped from **6–9 mo → 4–7 mo**.
- Cross-Vendor-12-format-parser wedge still has 9–12 mo clear-air (no competitor parses all 12).
- ADR-0018 Trigger #3 (`grekt/MindStudio multi-tenant launch`) → 🟢 → **🟡 partial**. **Does NOT re-open today.** 5-LOIs-by-M3 remains the load-bearing gate.

**Recommended response:** Sprint 0.11 includes a positioning 1-pager that explicitly contrasts VK's cross-vendor-12-format + cross-customer-tenant against grekt's single-tenant-12-vendor + Hermes's single-session-token-localhost. Weekly grekt-watch on keywords `tenant | workspace | hosted | cloud`.

### Finding 2 — UX pattern empirically converged (A1)

Four independent class-leaders shipped variants of the same shape in Q1 2026:

- Vercel Dashboard Redesign (2026-02-26): list-table + sidebar-as-filter + global filter strip
- GitHub Repository Dashboard GA (2026-02-24): same shape
- Sentry Cross-Project Issues: status-pills + saved views + Cmd-K
- Linear Insights: workspace-as-filter + saved views

The card-grid pattern is empirically **dead above ~12 items** — which is exactly the agency-target zone (5–30 repos). VK's killer differentiation = **"saved views with Cmd-K filter-chains"** (e.g. "Drift >7d AND vendor=cursor AND fileType=cursorrules-legacy").

Linear's data model **Workspace → Team → Issue** maps 1:1 to **Org → Customer → Repo → AgentFile**.

### Finding 3 — Zero-spend is real and concrete (A12)

We can ship the dashboard-pivot in **4 sprints (0.11–0.14, ~3-4 weeks)** without spending a cent more than the $0 we already pay (Vercel Hobby + Neon Free + Resend Free + Cloudflared Quick-Tunnel).

| Sprint | ROI focus | Cash impact |
|---|---|---|
| 0.11 (Week 1) | Dashboard shell + shadcn migration | $0 |
| 0.12 (Week 2) | Auto-tracking via Inngest polling + saved views | $0 |
| 0.13 (Week 3) | Deterministic 4/6 fix-suggestions + patch-download | $0 |
| 0.14 (Week 4) | Polish + Stripe test-mode + tester-readiness | $0 |

**Cash-out triggers** (binary, not "when ready"):
- $5 Anthropic API → only after **1 tester explicitly asks** for LLM-Audit
- $12 custom domain → only after **3 testers ask "what's your real URL"**
- $1 Stripe Live → only after **LOI #1 signed**
- $5/mo Vercel Pro → only when **300s function timeout breaks something measurable**
- $5/yr Hetzner / GH-App enable → only after **5 Agency-LOIs (PRD Phase-0-Gate #3)**

---

## 2. The 6 derivative decisions

These follow from the load-bearing 3:

1. **Design-system: shadcn/ui new-york** (A5) — 8 PD migration (~1.5 Solo-Wochen). Copy-paste = zero-lock-in matches Trust-Center-Brand-Argument. RSC-native, all 6 coverage-slots filled, severity-bänder via CVA preserved.

2. **Graph-Viz: React Flow v12** (A2) — MIT, ~50kB, RSC via `dynamic({ssr:false})` wrapper. Cytoscape Canvas breaks React-DevTools; D3 boilerplate not justified <100 nodes; vis-network anachronistic; ELK.js worker-only.

3. **Auto-Tracking: Inngest-Polling + opt-in `/api/notify-update`** (A3) — 1–6h latency, acceptable for Pre-Build-Wedge. GH-App webhooks defer to post-5-LOIs (Phase 1).

4. **Real-time: Polling for scan-status + SSE for dashboard-toasts** (A8) — Vercel Fluid Compute native, kein Pusher/Ably/Supabase. 300s function timeout = client reconnects every 5min.

5. **Onboarding: Try-then-signup, no gate** (A9) — anonymous-Audit is load-bearing for Indie-Wedge differentiation against WorthBuild/Preuve.ai (4 of 5 competitors gate; none has our anonymous-wedge to lose). Sticky-OAuth-Banner after first audit. Next-CTA "Add another customer-repo" (Agency-Wedge-Aha) > "Run drift" > "Generate BiP".

6. **Pricing: Plausible-Pattern hard-gate on "Add Repository"-Click** (A6) — Free=1 repo / Solo Indie $19=3 repos / Solo Pro $79=10 repos. Stripe-Setup via Test-Mode-Code-Path (A11) — flip 1 env var when LOI #1 signs. Never paywall the audit result (Trust-Killer). PostHog-style billing-cap-toggle for Phase 1.

---

## 3. The Multi-LLM decision (A4) — explicit defer

**Recommendation:** Build the abstraction layer in Phase 0.5 (multi-provider via AI-SDK env-flag), but **do not enable any LLM features** until a tester explicitly asks. Cash-out trigger = $5 Anthropic credits.

- Free-tier default when enabled: **GPT-5 Nano** ($0.023/100 audits, FPR-Eval still pending 30-File-Golden-Set)
- Paid-tier upgrade: **Sonnet 4.6** + prompt-caching (Strong-band reasoning)
- Anti-recommendation: **Vercel AI Gateway** (PRD §5.2 vendor-lock concern stays valid), **Llama models** (II 14, below FPR-15% bar)

Visible UI surface for Phase 0.5: **conflicting-rules finding shows "(LLM, opt-in — set ANTHROPIC_API_KEY)"** instead of suppressed. Honest about the gap.

---

## 4. Fix-Suggestion staging (A7)

| Category | Fix mechanism | Phase |
|---|---|---|
| unused-agent | delete file (deterministic) | 0.5 |
| duplicate-guidance | dedupe block / unify content (deterministic) | 0.5 |
| stale-reference | repath / drop link (deterministic) | 0.5 |
| token-overflow-trim | split-into-linked-doc (deterministic) | 0.5 |
| context-bloat | rewrite body (LLM) | 1.0 |
| conflicting-rules | reconcile (LLM with confidence-banding) | 1.0 |

**UX:** 1-screen list with checkboxes + "Preview diff" + "Download patch". LLM-findings never checked-by-default. Anti-pattern: "AI fixed 87 issues"-marketing-banner.

---

## 5. What we're NOT doing yet (and why)

| Defer | Reason |
|---|---|
| GitHub App registration | Day-1-Mitigations are 9–12 PD; pre-5-LOIs is premature optimization with compliance debt |
| Anthropic API key | Not 1 tester asked yet; $5 cash-out without demand-signal |
| Custom domain | Re-brand window M9–M12 (PRD §10 + ADR-0017); buying now risks early commit |
| Vercel Pro upgrade | 300s default timeout sufficient; upgrade trigger = measurable break |
| Stripe Live mode | Test-mode does everything; flip = 1 env var post-LOI |
| Multi-Provider LLM actually enabled | Abstraction layer code is free; turning on costs |
| Webhook-based real-time push | Polling + SSE handle current scale; no Pusher cliff hit |

This list is the load-bearing **"what we DON'T do"** that keeps the brand-promise of Skeptic-Mentor (PRD §7) credible: every deferred thing has a binary trigger, not a vibe.

---

## 6. Strategic check: is this still ValidationKit?

Yes. The vision-pivot doesn't change ADR-0017 (Hybrid-Pivot-E) or ADR-0018 (ContextForge-Productized-Form). It changes the **interface** through which both wedges are accessed:

- `/validate` wedge: Indie-Hacker pastes idea-prototype-repo URL → audit → fix-suggestions → BiP-draft. Same Mom-Test customer journey, now web-native.
- `/operations` wedge: Agency-Lena adds 5–30 customer-repos → dashboard shows drift / status / activity → fix-PRs dispatch. Same operational promise, now visual.

ADR-0017 + ADR-0018 stay load-bearing. ADR-0019 (new) codifies **the dashboard-pivot as a delivery-mode-change, not a strategy-change**.

---

## 7. Recommended next document set

1. **`docs/decisions/0019-operations-dashboard-pivot.md`** — ADR formalizing the pivot
2. **`docs/roadmap/phase-0.5-dashboard.md`** — Sprint 0.11–0.14 week-by-week plan
3. **`docs/research/dashboard-pivot/13-redesign-plan.md`** — concrete frontend mockup spec (text-based, no Figma)

All three written next.

---

*Synthesis 12-of-12 done. ~1.1k words. Citation-first. Brand-voice: Skeptic-Mentor + Concession-then-Critique. Load-bearing for ADR-0019.*
