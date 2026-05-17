# Multi-Repo Dashboard UX — Class-Leading Patterns 2026

> Agent A1, 2026-05-17. Scope: 5–30 multi-repo operations. Source-cited, severity-banded.

## TL;DR

For 5–30 repos the winning shape is **list-table primary + sidebar-as-filter + on-row status pills + global filter strip**. Card-grids collapse past ~12 items. Vercel, Sentry, GitHub-Repo-Dashboard, Linear-Insights independently converged on this shape between 2026-02 and 2026-04 — empirically-stable.

---

## 5 Patterns Worth Stealing

### 1. Sidebar-as-Filter, not Sidebar-as-Tree — **Strong**

**What:** Vercel's 2026-02-26 redesign: projects act as *filters across the same tabs*, not drill-in trees. One click switches "Deployments" between team-scope and project-scope; tab persists. ([Vercel Changelog, 2026-02-26](https://vercel.com/changelog/dashboard-navigation-redesign-rollout))

**Why:** Eliminates the "I lost my place" tax that kills agency-consultant triage across 10+ customer repos. Mental model = *one workspace projected through a project lens*, not *N apps*.

**VK fit:** **Strong.** Audit-Report, Inventory, Drift, Approver-Bridge stay as fixed tabs; switching customer repo = filter swap. Solves the load-bearing "Cross-Vendor Inventory across 30 customers" case.

### 2. Repository-as-Row with Saved Views + Cmd-K Jump — **Strong**

**What:** GitHub's Repository Dashboard (GA 2026-02-24) replaced the legacy starred-cards grid with a filterable list-table: visibility, language, org, Admin-access — plus bookmarkable custom queries and `Cmd-K` deep-jump. ([GitHub Changelog, 2026-02-24](https://github.blog/changelog/2026-02-24-repository-dashboard-is-now-generally-available/))

**Why:** Lists scale linearly with N; card-grids scale quadratically with attention. Saved views ("Repos with stale CLAUDE.md") turn the dashboard into a *queryable surface*.

**VK fit:** **Strong.** Saved views like *"Customers with conflicting cursor rules"* or *"Repos drifted >30d"* map 1:1 to the 5/6 deterministic Audit-Report categories (PRD §13).

### 3. Cross-Project Global Filter Strip — **Strong**

**What:** Sentry's Dashboards expose four global filters (Project × Env × Range × Release) at the top of every multi-project view; *all* widgets re-render against the same scope. ([Sentry Dashboards](https://docs.sentry.io/product/dashboards/), [Cross-Project Issues](https://sentry.io/features/cross-project-issues/))

**Why:** A consultant managing 12 customers wants *"drift across all customers, last 7d, prod-only"* in one keystroke. Per-widget filters force re-entering N times — that's the killer of Stripe's multi-account UX, which still lacks unified revenue view in 2026. ([Stripe Multi-Entity](https://docs.stripe.com/billing/multi-entity-business))

**VK fit:** **Strong.** Analog: `Customer × Vendor × FileType × Range`. Topmost element, not side-panel.

### 4. Modular Widget Drill-Down — **Mid**

**What:** Linear Insights: click any chart data-point → see underlying issues, segmented by status/assignee/cycle/project. ([Linear Insights](https://linear.app/insights))

**Why:** Removes "metric → query-builder → list" friction. Every aggregate is a one-click portal to its rows.

**VK fit:** **Mid.** Useful for Audit-Report severity drill-down, not load-bearing for M3 LOI-gate. Defer to Phase 2.

### 5. Status-Pills In-Row, Not Color-Coded Cards — **Strong**

**What:** Vercel, GitHub, Sentry all show per-row status (Production / Preview / Errored / Stale) as inline pills with explicit text labels — *not* red/yellow/green card-borders. ([Vercel Projects](https://vercel.com/docs/projects/project-dashboard))

**Why:** Accessibility (color-blind), scannability (text > hue past 30 rows), severity-band-compatibility — VK already mandates {Kill, Weak, Mid, Strong, Exceptional} per CLAUDE.md Constraint #5. Color-cards force a 5-color rainbow nobody reads past row 15.

**VK fit:** **Strong.** Already aligned with no-fake-precision-scores. Cheap to ship.

---

## Recommendation for ValidationKit

**Three-zone layout:** `[Sidebar: Customers-as-filter] [Top: Global filter strip] [Main: List-table of repos with status pills + saved views]`.

- Card-grid: rejected (collapses past 12; agency target 5–30).
- Sidebar-tree: rejected (forces N navigations for cross-cutting drift).
- Sentry-widget-dashboard as *secondary* tab ("Audit Overview"), not primary.

**Killer element to clone first (M3 LOI-demo):** Saved views with one-click filter chains — e.g. *"Drift >7d AND vendor=cursor AND fileType=cursorrules-legacy"*. That alone differentiates from grekt.com / MindStudio, both shipping card-grids today.

## Caveats

- Stripe = 2026 anti-pattern (no consolidated multi-account view without Sigma + Organizations). ([Stripe Sessions 2026](https://stripe.com/blog/everything-we-announced-at-sessions-2026))
- Linear's Workspace→Team→Issue maps to VK (Org→Customer→Repo→AgentFile) — copy model, not issue-flow chrome. ([Linear Concepts](https://linear.app/docs/conceptual-model))
