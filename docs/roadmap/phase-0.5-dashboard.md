# Phase 0.5 — Operations-Dashboard Pivot (Sprint 0.11 → 0.14)

> **Status:** Active. 4 sprints, ~3-4 weeks total, zero new spend.
>
> **Trigger:** ADR-0019 (Operations-Dashboard-Pivot, 2026-05-17). All decisions cite research in `docs/research/dashboard-pivot/`.
>
> **Pre-condition:** Sprint 0.10 live at https://validationkit.vercel.app ✅. Vercel + Neon + Resend free-tier setup ✅. GitHub repo + CI/CD ✅.

---

## Cash-out budget for the whole phase

| Trigger | Cost | When |
|---|---|---|
| (default) | **$0** | All Phase 0.5 work fits in free tiers |
| Anthropic API enable | $5 minimum credit | **Only if 1 tester explicitly asks for LLM-Audit** |
| Custom domain | $12/yr | **Only if 3 testers ask "what's your real URL"** |
| Stripe Live | $1 verification | **Only after LOI #1 signed** |
| Vercel Pro | $5/mo | **Only when 300s function timeout breaks something measurable** |
| GH-App active | $0 (free) | **Only after 5 Agency-LOIs** (PRD Phase-0-Gate #3) |

**Default end-of-phase cash impact: $0.** Every cash trigger above is binary, not aspirational.

---

## Phase outcome (end of Sprint 0.14)

A tester opens https://validationkit.vercel.app, sees:
- A polished shadcn-styled dashboard
- Anonymous-audit button visible immediately (try-then-signup, A9)
- Sample-repo audit takes <60sec end-to-end
- Sign-up via Magic-Link prompts after first success
- Signed-in: lands on `/dashboard` with empty-state CTA "Add your first customer-repo"
- Adding a 2nd repo → hard paywall "Free tier = 1 repo. Upgrade to Solo Indie $19/mo (3 repos)" with Stripe-Checkout-CTA (test-mode only, no real charge)
- Adding a repo triggers automatic re-audits every N hours via Inngest scheduled polling
- Drift between repo-pairs surfaced with visual indicator + connection graph
- Findings with deterministic-fix buttons (4 of 6 categories): preview diff + download patch
- `conflicting-rules` finding shows "(LLM — set ANTHROPIC_API_KEY to enable)" — honest non-vapor
- Audit-trail export (compliance) preserved from Sprint 0.10

**What the tester explicitly CAN'T do at end of Phase 0.5:**
- Click "Open PR" against the repo (needs GH-App registered)
- Use real LLM-fix-suggestions (needs Anthropic key + golden-set eval)
- See more than 200 deltas/day in real-time (SSE-connection cliff, but no tester will hit this in 30 days)
- Buy with real money (Stripe Test-Mode only)
- Use a custom domain

These are tester-visible-honest, not hidden gaps.

---

## Sprint 0.11 — Dashboard Shell (Week 1, ~25 hours)

**Goal:** Visible-progress sprint. New dashboard URL exists. shadcn migration done. Demo-able to a 1st tester end of week.

### Committed (must-ship)

| Task | Effort | Deliverable |
|---|---|---|
| shadcn init + token migration (A5) | 2 PD | `components.json` setup, Geist fonts pinned in `@theme inline` literals (per shadcn skill gotcha), severity-bänder CVA preserved |
| `/dashboard` route + 3-zone layout (A1) | 1.5 PD | Sidebar (customers-as-filter) × top filter strip × main list-table |
| Migrate `SiteNav` → shadcn Sidebar primitive | 0.5 PD | Existing routes accessible |
| Migrate `AuditForm` → shadcn `Form` + `Input` + `Button` | 0.5 PD | Public + anonymous + signed-in modes still work |
| Migrate `/customers` page → list-table | 1 PD | Per-row severity-pill, last-audit-timestamp, drift-status |
| Saved-views scaffolding (A1 killer feature) | 1 PD | "Drift >7d AND vendor=cursor" filter chain (no backend yet, just URL-state) |
| `globals.css` cleanup 340 → ~80 LOC | 0.5 PD | Theme tokens migrated, severity-bänder preserved |

**Stretched (if time):** Cmd-K command palette (cmdk + Dialog), empty-state polish for all routes.

### Sprint-Goal definition-of-done

- Live https://validationkit.vercel.app/dashboard renders the new shell signed-in
- 0 regressions: every existing route (`/`, `/drift`, `/login`, `/scans`, `/customers`, `/trust`, `/bip`, `/requests`, `/drifts`) still returns 200
- 71/71 vitest cases green
- 21/21 golden-set eval green
- New visual: tested on safari + chrome + mobile-narrow

---

## Sprint 0.12 — Auto-Tracking + Visual Connections (Week 2, ~25 hours)

**Goal:** Repos auto-detect changes. Connection-graph view exists. The "wow" of the redesign lands here.

### Committed

| Task | Effort | Deliverable |
|---|---|---|
| Inngest scheduled function: poll watched repos every 4h (A3) | 1 PD | New Inngest function `auto-track-repos`, schedule via cron |
| Compare last-commit-SHA logic | 0.5 PD | Skip re-audit if SHA unchanged |
| Hybrid `/api/notify-update` HMAC endpoint (A3) | 1 PD | Opt-in low-latency for power-user CI |
| `@vk/dashboard-graph` package + React Flow wrapper (A2) | 1.5 PD | `dynamic({ssr:false})`, nodes = customer-repos, edges = drift-pairs |
| `/dashboard` graph view toggle (table ⇌ graph) | 1 PD | Per-user-preference saved in localStorage |
| SSE endpoint `/api/events` for dashboard-toasts (A8) | 1 PD | Re-audit-completed toast, drift-detected toast |
| Auto-drift detection on new audit | 0.5 PD | When repo N is re-audited, auto-run drift against canonical (if set) |
| Visual indicator: "last activity" badge on each repo card | 0.5 PD | "Updated 4h ago" vs "Updated 7d ago — possible drift" |

### Sprint-Goal DoD

- Add a repo → audit runs → SHA stored → 4h later re-audit runs automatically → user sees toast (signed in)
- Graph view shows 5 repos + 2 drift-edges → visually clear which pair drifted
- SSE connection stays alive ≥5 min (reconnects gracefully every 5min per Vercel Pro 300s timeout)

---

## Sprint 0.13 — Deterministic Fixes + Freemium Gate (Week 3, ~25 hours)

**Goal:** Findings become actionable. Free-vs-paid is enforced. Stripe test-mode wired but no real charges.

### Committed

| Task | Effort | Deliverable |
|---|---|---|
| `@vk/fixes` package — 4 deterministic fix-generators (A7) | 2 PD | unused-agent / duplicate-guidance / stale-reference / token-overflow-trim |
| Per-finding `[Preview diff]` + `[Download patch]` buttons (A7) | 1 PD | Modal with diff view, file download |
| Batch-fix: checkbox-select multiple findings → combined patch | 0.5 PD | "Fix 3 selected" |
| Stripe-Test-Mode account + 5 Products in Test-Dashboard (A11) | 1 PD | Free, $19 Solo Indie, $79 Solo Pro, $299 Agency Pro, $799 Agency Scale (no Live mode) |
| `@vk/billing` package: subscription schema + `isPaid()` + `canAddRepo()` (A11) | 1.5 PD | Drizzle migration + helpers |
| Hard-gate on "Add Repository"-click for free-tier (A6) | 1 PD | Plausible-pattern modal: "Free tier = 1 repo. Upgrade to Solo Indie $19/mo for 3 repos." |
| `/api/stripe-webhook` (A11) | 1 PD | Node-runtime, raw-body, idempotent via `stripe_events` table |
| Stripe Checkout flow: server-action → Checkout-Session → return-to-`/billing` | 1 PD | All 4 paid tiers checkout-able in test mode |
| Stripe Customer Portal launch action | 0.5 PD | Server action mints portal-session-URL |

### Sprint-Goal DoD

- A user can: free-tier add 1 repo → try to add 2nd → blocked + upgrade-CTA → click → Stripe-Checkout-Test → returns to `/billing` with status "active (test)" → can now add 2nd repo
- 4 of 6 audit-findings have working fix-suggestion buttons
- Patch file is correct + applyable manually via `git apply`

---

## Sprint 0.14 — Polish + Tester-Readiness (Week 4, ~25 hours)

**Goal:** Production-quality tester-experience. First 10 testers invitable.

### Committed

| Task | Effort | Deliverable |
|---|---|---|
| Onboarding flow (A9) | 1.5 PD | Try-anonymous → success → magic-link prompt → pre-populated /dashboard → linear-style checklist |
| Empty-state polish for all routes (A9) | 1 PD | Skeptic-Mentor copy per A9, no scammy illustrations |
| Multi-LLM abstraction layer in `@vk/llm` (A4) | 1.5 PD | `selectModel()` based on user-tier env-flag, no provider keys set |
| `conflicting-rules` finding: visible-but-disabled state | 0.5 PD | "(LLM — set ANTHROPIC_API_KEY to enable)" honest non-vapor |
| Mobile-responsive sweep (A5) | 1 PD | Sidebar → Sheet on <768px, list-table → card-grid fallback |
| Error states + alerts polish (shadcn `Alert`) | 0.5 PD | All `<div className="error">` migrated to shadcn `Alert` |
| `/trust` page polish for shadcn | 0.5 PD | Card-grouped sections, Compliance roadmap table-styled |
| Loading skeletons for all data-fetching pages (A5) | 1 PD | shadcn `Skeleton` used everywhere `await`-ed data is rendered |
| Tester-invite-doc + first 10 tester slots in `.local/recruitment.md` | 0.5 PD | Names to be filled by Kolja after Sprint 0.14 ship |
| Sprint 0.14 retro + Phase-0.5 close-out | 0.5 PD | STATUS update, CHANGELOG entry, screenshots in `docs/assets/`|

### Sprint-Goal DoD

- Polish gate: every route looks intentional (Skeptic-Mentor brand voice + shadcn primitives + dark-mode consistent)
- 10/10 routes mobile-responsive
- 0 console errors / warnings on production
- README.md updated with screenshots + "Try it" CTA pointing at https://validationkit.vercel.app/
- Tester-invite-email-template drafted in `docs/outreach/`

---

## Cross-sprint guardrails

### What stays unchanged across all 4 sprints

- Severity-bänder {Kill, Weak, Mid, Strong, Exceptional} — NEVER replaced with numeric scores
- Citation-first — every audit/drift finding shows file:line + line number
- Skeptic-Mentor voice — every copy + email + empty state passes the Concession-then-Critique test
- Deterministic-first audit (5/6 categories) — LLM-augmented stays opt-in
- Read-only-default for any external resource (GH App not registered yet, so N/A)

### Pre-commit checklist for every PR

- [ ] `pnpm vitest run` green
- [ ] `pnpm eval` green (21/21 golden-set)
- [ ] `pnpm typecheck` green for changed packages
- [ ] No new vendor service signed up (free-tier check)
- [ ] Brand-voice keeper: did this change introduce a vibe-score / vague-copy / future-tense-prompt?
- [ ] STATUS.md updated if sprint-criteria moved

### Sprint Retros (every Friday)

Use `templates/sprint-planning-template.md` § Concession-then-Critique. One concession (what worked), one critique (what felt rough), one next-week-adjust.

---

## What this Phase 0.5 does NOT include (defer to Phase 1)

- GitHub App registration + webhook real-wiring (PRD §6.4, 9–12 PD, gated on 5-LOIs)
- LLM-augmented fix-suggestions for `context-bloat` + `conflicting-rules` (gated on Anthropic-key spend trigger)
- Custom domain + DNS setup (gated on 3-testers-asking)
- Vercel Pro upgrade (gated on measurable function-timeout break)
- Real-money Stripe (gated on LOI #1)
- Webhook-based real-time push (Pusher/Ably) — Polling + SSE handle current scale
- Auto-merge fix-PRs (Renovate-Pattern) — too dangerous pre-trust
- 30-File-Golden-Set fill (PRD Phase-0-Gate #7 stays Phase-0, separate)

Each is documented in ADR-0019 with explicit trigger conditions.

---

## Phase-0.5 → Phase-1 transition

End of Sprint 0.14 = transition point.

**If by then:**
- 10 testers tried, **≥3 came back** for a 2nd run within 7 days → Phase 1 starts: real Mom-Tests, recruitment.md fill, first Sprint-engagement-pitch
- 10 testers tried, **0 returned** → re-open ADR-0019, evaluate whether dashboard-shape is right

Tester-cohort is the load-bearing signal between Phase 0.5 and Phase 1.

---

*Roadmap version: 1.0. Owner: Kolja Schöpe. Created: 2026-05-17. Source-of-truth: ADR-0019 + 12 research agents in `docs/research/dashboard-pivot/`.*
