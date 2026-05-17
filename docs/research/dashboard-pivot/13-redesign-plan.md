# Frontend-Redesign-Plan (text-based mockups)

> **Status:** Concrete plan for Sprint 0.11–0.14. NO Figma — text + ASCII boxes. shadcn primitives only.
>
> **Source:** A1 + A2 + A5 + A6 + A7 + A9 research outputs.

---

## Design tokens (preserve from current globals.css)

| Token | Current | shadcn-Mapping |
|---|---|---|
| Background | `oklch(near-#0b0c0e)` | `--color-background` |
| Card | `oklch(near-#14161a)` | `--color-card` |
| Border | `oklch(near-#2a2e36)` | `--color-border` |
| Foreground | `oklch(near-#e8e9ec)` | `--color-foreground` |
| Foreground-dim | `oklch(near-#9aa0aa)` | `--color-muted-foreground` |
| Accent (primary) | `#5eead4` (mint-teal) | `--color-primary` |
| Severity-Kill | `#f87171` | `--color-priority-kill` |
| Severity-Weak | `#fb923c` | `--color-priority-weak` |
| Severity-Mid | `#facc15` | `--color-priority-mid` |
| Severity-Strong | `#4ade80` | `--color-priority-strong` |
| Severity-Exceptional | `#34d399` | `--color-priority-exceptional` |
| Font sans | Inter / system | Geist Sans (per shadcn skill) |
| Font mono | SF Mono / Menlo | Geist Mono |
| Radius | `0.5rem` global | `--radius: 0.5rem` (kein Wechsel) |

**Migration rule:** keep our colors, change the variable names + replace hex with oklch where shadcn-skill specifies.

---

## Layout #1 — Public Home (`/`)

For anonymous + signed-out users. Try-then-signup gate.

```
┌─────────────────────────────────────────────────────────────────┐
│  ValidationKit            Audit · Drift · Trust    [Sign in →] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Cross-vendor agent-file trust.                                │
│   Paste a public GitHub repo. Get a deterministic audit.        │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ https://github.com/owner/repo                          │    │
│   └───────────────────────────────────────────────────────┘    │
│   [Run audit] · Try: [anthropic-cookbook] [vercel/next.js]    │
│                                                                 │
│   What we check:                                                │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│   │ unused-      │ │ duplicate-   │ │ context-bloat│ ...    │
│   │ agent        │ │ guidance     │ │              │         │
│   │ Deterministic│ │ Deterministic│ │ Deterministic│         │
│   └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                                 │
│   5 of 6 categories are rule-based. No vibe-scores.            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components:** shadcn `Input`, `Button`, `Badge` (for sample-repos), `Card` × 6 (for finding-categories grid), `Separator`.

**Brand-voice copy:** "Cross-vendor agent-file trust." (existing). "Paste a public GitHub repo. Get a deterministic audit." (existing).

**Killer feature on home:** sample-buttons `[anthropic-cookbook] [vercel/next.js]` autofill + auto-submit. A9 verdict: anonymous-try-first.

---

## Layout #2 — `/dashboard` (signed-in primary surface)

3-zone layout per A1 (Vercel/GitHub/Sentry/Linear convergent pattern):

```
┌──────────┬──────────────────────────────────────────────────────┐
│ Sidebar  │  ┌── Filter strip ─────────────────────────────────┐ │
│          │  │ [Saved views ▼] [Status: All] [Vendor: All]    │ │
│ ▸ All    │  │ [Last activity: Any] [+ New view]              │ │
│ ▸ Acme   │  └──────────────────────────────────────────────────┘ │
│ ▸ ▸ web  │                                                       │
│ ▸ ▸ api  │  ┌── List table ───────────────────────────────────┐ │
│ ▸ Beta   │  │ Repo            Severity  Last activity  Drift │ │
│ ▸ Charlie│  │ ─────────────────────────────────────────────── │ │
│          │  │ acme/web        [Weak]    2h ago         ✓ ok  │ │
│ [+ Add]  │  │ acme/api        [Mid]     4h ago         ⚠ 7d  │ │
│          │  │ beta/main       [Strong]  1d ago         ✓ ok  │ │
│ ─────────│  │ charlie/x       [Kill]    3h ago         ⚠ 14d │ │
│ Settings │  │                                                  │ │
│ Billing  │  └──────────────────────────────────────────────────┘ │
│ Sign out │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

**Components:**
- shadcn `Sidebar` (left zone): each customer = collapsible group, each repo = sub-item
- shadcn `Tabs` or `ToggleGroup` (top zone, hidden in screenshot): switch between `Table view` ⇌ `Graph view`
- shadcn `DropdownMenu` × 4 in filter strip
- shadcn `Table` (main zone) with severity-pill cells
- shadcn `Badge` (severity-pills)
- shadcn `Button` (+ Add repository)

**Saved views** (A1 killer feature):
- Persisted in URL `?view=drift7d` (no backend for Sprint 0.11; Sprint 0.12 persists)
- Pre-built: "All", "Critical only", "Drift >7d", "Unused agents", "Recently audited"

**Right-click on repo row:** shadcn `DropdownMenu` with: "Open" / "Re-audit now" / "Drift against canonical" / "Delete"

**Empty state for /dashboard:** A9 copy:
```
┌────────────────────────────────────────────┐
│  No customer-repos yet.                    │
│                                            │
│  Cross-vendor audits live here. Your free  │
│  tier covers 1 repo — add yours below.     │
│                                            │
│  [+ Add your first customer-repo]          │
│                                            │
│  Need a quick demo? Try with               │
│  [anthropic/anthropic-cookbook]            │
└────────────────────────────────────────────┘
```

---

## Layout #3 — `/dashboard?view=graph` (Connection-Graph mode)

A2 React Flow integration. Same sidebar + filter strip, main zone replaced:

```
┌──────────┬──────────────────────────────────────────────────────┐
│ Sidebar  │  [Table ⇌ Graph]                                     │
│  …       │                                                       │
│          │  ┌─────────────────────────────────────────────────┐ │
│          │  │                                                 │ │
│          │  │       ┌─────────┐                              │ │
│          │  │       │ Canonical│                              │ │
│          │  │       │ Template │                              │ │
│          │  │       └────┬─────┘                              │ │
│          │  │            │                                     │ │
│          │  │     ┌──────┴──────┐                              │ │
│          │  │     ↓             ↓                              │ │
│          │  │ ┌──────┐ drift ┌──────┐  ⚠14d                  │ │
│          │  │ │acme/ │───────│beta/ │                          │ │
│          │  │ │web   │       │main  │                          │ │
│          │  │ │[Weak]│       │[Mid] │                          │ │
│          │  │ └──────┘       └──────┘                          │ │
│          │  │                                                  │ │
│          │  │                                                  │ │
│          │  └──────────────────────────────────────────────────┘ │
│          │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

**Nodes:** Repos. Color-coded by overall-severity. Click → opens `/customers/[id]` in side-sheet.

**Edges:** Drift pairs. Edge color = drift-severity (worst kind across drift-items). Edge label = "14d ago" (last-checked).

**Layout:** `dagre` layout (React Flow built-in) — hierarchical with canonical at top.

**Why this is "wow":** matches the founder's "Verbindungen zwischen den unterschiedlichen [Repos] merkt" verbatim — visual proof of agency-tier value.

---

## Layout #4 — `/customers/[id]` (repo detail)

```
┌─────────────────────────────────────────────────────────────────┐
│  acme/web                              [Re-audit] [Drift] [⋮]  │
│  github.com/acme/web · added 12d ago · last audited 2h ago     │
├─────────────────────────────────────────────────────────────────┤
│  ┌── Findings (3) ─────────────────────────────────────────┐  │
│  │  [Weak]   unused-agent: ghost-helper.md                  │  │
│  │           Not referenced by any command. Last touched   │  │
│  │           42 days ago.                                   │  │
│  │           [Preview fix] [Download patch] [Open PR*]      │  │
│  │           ─────────────────────────────────────────────  │  │
│  │  [Mid]    duplicate-guidance: CLAUDE.md ↔ AGENTS.md     │  │
│  │           Trigram similarity 92%. Pick a canonical home. │  │
│  │           [Preview fix] [Download patch]                 │  │
│  │           ─────────────────────────────────────────────  │  │
│  │  [Mid]    stale-reference: CLAUDE.md → docs/ops.md       │  │
│  │           Link target does not exist.                   │  │
│  │           [Preview fix] [Download patch]                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌── Inventory (14 files) ──────────────────────────────────┐  │
│  │  Type            Path                  Tokens  Modified  │  │
│  │  claude-md       CLAUDE.md             4,328   2h ago    │  │
│  │  agents-md       AGENTS.md             2,104   12d ago   │  │
│  │  …                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  * Open PR is disabled until GitHub App is installed.          │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- shadcn `Card` × 2 (findings, inventory)
- shadcn `Button` × N per finding (preview / patch / pr-disabled)
- shadcn `Tooltip` on `[Open PR*]` explaining the GH-App-install pre-req
- shadcn `AlertDialog` (NOT Dialog, per shadcn skill) on the `[⋮]` → "Delete repo" destructive action

**Conflicting-rules finding (when present):**
```
[?]  conflicting-rules: react.mdc ↔ CLAUDE.md
     (LLM — set ANTHROPIC_API_KEY to enable)
     [How does this work?] (popover with explanation)
```

Greyed out, badge `LLM`, tooltip explaining "Set ANTHROPIC_API_KEY in env to enable LLM-augmented analysis. Free for self-hosters; opt-in on hosted tier."

---

## Layout #5 — Add-Repository Modal (Plausible-Pattern hard-gate)

A6 verdict: Plausible-Pattern, hard gate on click. shadcn `Dialog`:

**Below 1 repo (free-tier with 0):**
```
┌─────────────────────────────────────────┐
│  Add your first repo                    │
├─────────────────────────────────────────┤
│  Public GitHub URL:                     │
│  ┌─────────────────────────────────────┐│
│  │ https://github.com/owner/repo       ││
│  └─────────────────────────────────────┘│
│                                         │
│  Label (optional):                      │
│  ┌─────────────────────────────────────┐│
│  │ Acme web                            ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Cancel]  [Add repo]                   │
└─────────────────────────────────────────┘
```

**At 1 repo (free-tier full):**
```
┌─────────────────────────────────────────┐
│  Upgrade to add more repos              │
├─────────────────────────────────────────┤
│  You're on the Free tier (1 repo).      │
│  Add more by upgrading to Solo Indie:   │
│                                         │
│  ┌─── Solo Indie $19/mo ──────────────┐│
│  │  ✓ 3 customer-repos                 ││
│  │  ✓ 50 audit-runs / month            ││
│  │  ✓ 90-day audit retention           ││
│  │  ✓ Drift & BiP-draft generation     ││
│  └─────────────────────────────────────┘│
│                                         │
│  [Or compare all tiers →]               │
│                                         │
│  [Cancel]  [Upgrade to Solo Indie]      │
└─────────────────────────────────────────┘
```

**Key:** Audit-result never gated. Only Add-Repo is gated.

---

## Layout #6 — `/billing` (post-Stripe-Checkout)

Stripe Customer-Portal embed-link (one-click externalize):

```
┌─────────────────────────────────────────────────────────────────┐
│  Billing                                                        │
├─────────────────────────────────────────────────────────────────┤
│  Current plan: Solo Indie ($19/mo)                              │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Active (Test Mode)                                  │       │
│  │  Renews 2026-06-17                                   │       │
│  │  3 of 3 repos used                                   │       │
│  │  12 of 50 audit-runs this month                      │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  [Open Stripe Customer Portal →]                               │
│  (Update card, change plan, view invoices)                     │
│                                                                 │
│  [Compare tiers]                                               │
└─────────────────────────────────────────────────────────────────┘
```

Test-mode banner visible until Stripe-Live-mode flipped.

---

## Mobile-responsive transitions (<768px)

Per shadcn skill:
- `Sidebar` → `Sheet` (slide-out)
- `Table` → `Card`-grid (one card per row, severity-pill prominent)
- Filter strip stays at top but wraps to 2 lines
- Graph view → "Graph view requires ≥768px" placeholder with table-fallback

---

## Brand-voice copy per empty state

Per A9 (Skeptic-Mentor, no scammy):

| Route | Empty-state copy |
|---|---|
| `/` (anonymous) | "Paste a public GitHub repo. Get a deterministic audit." |
| `/dashboard` (signed-in, 0 repos) | "No customer-repos yet. Cross-vendor audits live here. Your free tier covers 1 repo — add yours below." |
| `/dashboard?view=graph` | "Need at least 2 repos to see connections. Add another customer-repo to unlock the graph view." |
| `/customers/[id]/scans` (0 scans) | "Not audited yet. Run audit to generate the first finding-set." |
| `/drift` (no drifts run yet) | "Compare two repos to see how their agent-files have diverged. Drift-detection is deterministic — no LLM calls." |
| `/bip` (0 reports) | "Three social-post drafts per audit. Run an audit first, then come here." |
| `/billing` (free tier, never paid) | "You're on the Free tier. Try Solo Indie ($19/mo) for 3 repos + drift + BiP-drafts." |
| `/trust` (always) | Already polished from Sprint 0.5. shadcn migration only. |

---

## File-by-file migration plan (Sprint 0.11 sub-tasks)

```
apps/web/src/
├── app/
│   ├── layout.tsx               ← Geist font + force-dynamic kept
│   ├── globals.css              ← REPLACE: shadcn @theme inline literals
│   ├── page.tsx                 ← shadcn Input + Button + Card grid
│   ├── dashboard/page.tsx       ← NEW: sidebar + filter strip + table
│   ├── customers/[id]/page.tsx  ← shadcn Card + Table + Button
│   ├── login/page.tsx           ← shadcn Form + Card centered
│   ├── billing/page.tsx         ← NEW: Stripe portal-link Card
│   └── ... (other routes mig)
├── components/
│   ├── ui/                      ← NEW: shadcn primitives via init
│   ├── SiteNav.tsx              ← REWRITE: shadcn Sidebar
│   ├── AuditForm.tsx            ← Form / Input / Button
│   ├── RepoTable.tsx            ← NEW: Table primitive
│   ├── RepoGraph.tsx            ← NEW: React Flow wrapper
│   ├── SeverityBadge.tsx        ← NEW: shadcn Badge + CVA
│   ├── AddRepoDialog.tsx        ← NEW: shadcn Dialog
│   ├── UpgradeGate.tsx          ← NEW: hard-paywall Dialog
│   └── ... (rest migrated)
```

---

## Out of scope for Phase 0.5 frontend

- Custom illustrations / mascots
- Hero-section animations
- Light-mode toggle (dark-first by brand)
- i18n / EN+DE switch (DE-comments in code OK, UI English-only)
- Accessibility audit beyond shadcn's built-in (Radix primitives are pre-WCAG)
- Print-stylesheet for audit reports (low ROI)

Each can be Phase 1 candidate after first 10 testers return signal.

---

*Plan version: 1.0. Owner: Kolja. Created 2026-05-17 from A1+A2+A5+A6+A7+A9 research outputs. Source-of-truth: ADR-0019 + `phase-0.5-dashboard.md`.*
