---
id: 0003
title: Drop the Repo-Compare (Drift-Detection) feature
status: accepted
date: 2026-05-19
---

# ADR-0003 — Drop the Repo-Compare (Drift-Detection) feature

> Status: Accepted (Final-Cleanup-Annex 2026-05-21)
> Date: 2026-05-19
> Context: Homepage-Relaunch Plan (`docs/plans/done/homepage-relaunch/homepage-relaunch.md`)

## Context

The original ValidationKit vision (`docs/vision.md`) listed five capability layers, with **Drift-Detection** as Sprint G2's headline feature: a user could paste two repository paths and get a side-by-side diff of their Context-Engineering files, rendered as "Gravitations-Ströme" in the Galaxie. The implementation shipped across:

- `/drift` route (form: two paths in, drift report out)
- `/drifts`, `/drifts/[id]` routes (persistence + history)
- `DriftForm.tsx`, `DriftView.tsx`
- `lib/drift-action.ts` (server action)
- `packages/drift/` (compute package: `compute.ts`)
- `packages/inngest/src/functions/drift-requested.ts` (background job)
- `drift_run` DB table + workspace-cascade FK + Galaxie-graph edges in `dashboard/page.tsx`
- `@vk/bip-generator` (consumed Drift reports for build-in-public posts)

Roughly **~1,500 LOC + one DB table + one background job + one downstream package** were dedicated to this feature.

## Decision

Drop the entire Compare/Drift surface, code, package, table, and downstream consumers. Multi-Repo management stays — users can still attach many repos per workspace and audit each one — but the explicit two-repo comparison flow is removed.

## Rationale

The user (Mai 2026) reviewed the live product and concluded:

> "Es gibt aktuell diesen Vergleich von Repos und den brauch ich einfach überhaupt nicht. Das ist sone separate Seite, wo ich einfach nur 2 Links sozusagen einfügen muss und die brauch ich einfach nicht mehr."

The Compare flow was a forced second-class citizen in the IA: it had its own top-level routes, its own DB table, its own dashboard-graph edge type, but the user never reached for it in normal workflow. The cognitive cost on the landing page (visible nav entry, footer link, dashboard graph mode) outweighed the value, and the Galaxie's primary affordance (Customer → Repo → File drill-in) covers the multi-repo orientation goal without needing an explicit pairwise compare.

Severity-Bänder + the Audit + Solution + Apply loop are still the load-bearing value. Drift detection in a portfolio sense (cross-repo aggregation) lives implicitly in the Workspace-Galaxie's Customer-level severity aggregation — that aggregation stays.

## Consequences

**Positive:**
- IA collapses from 17+ top-level routes toward 5.
- ~1,500 LOC + 1 DB table + 1 background job + 1 package removed. Less to maintain, faster onboarding for future contributors.
- The landing page can stop carrying a "Drift" nav entry that the user never used.
- The dashboard graph view's "drift edges" concept is gone; the graph now shows nodes-only (orientation, not comparison).

**Negative:**
- Lose a differentiation surface against grekt.com / similar tools that focus on cross-repo drift. Acceptable: ValidationKit's wedge is Multi-Tool Polyglot-Audit, not Multi-Repo Diff.
- `@vk/bip-generator`'s `fromDriftReport` template path becomes unused. The whole `@vk/bip-generator` package is dropped together; build-in-public marketing is out of scope for now.
- The `drift_run` table is dropped destructively (`DROP TABLE drift_run CASCADE`). User confirmed local-only data, no Prod backup required.

## Scope of cleanup (executed in Homepage-Relaunch Phase 2)

- Routes deleted: `/drift`, `/drifts`, `/drifts/[id]`, `/galaxie-dev`, `/bip` (the latter two were dev/marketing surfaces consuming Drift output).
- Components deleted: `DriftForm.tsx`, `DriftView.tsx`, `BipDrafts.tsx`.
- Server-side deleted: `lib/drift-action.ts`, `packages/inngest/src/functions/drift-requested.ts`.
- Packages dropped: `packages/drift/`, `packages/bip-generator/`.
- Schema: `driftRun` + `driftRunRelations` removed from `packages/db/src/schema.ts`, migration `0011_lame_speedball.sql` (`DROP TABLE drift_run CASCADE`).
- Cross-refs cleaned: `customers.ts` (`getCustomer` no longer returns `drifts`), `audit-trail-export.ts` (kind union no longer includes `drift_run`), `dashboard/page.tsx` (graph edges hardcoded to `[]`, `hasDrift` onboarding check removed).
- Nav: `SiteNav` link to `/drift` replaced with `/pricing`. Page-footers throughout (`/`, `/scans`, `/requests`, `/customers`, `/customers/[id]`) stripped of `/drift` references.
- Vision + Roadmap: `docs/vision.md` and `docs/roadmap/phase-galaxie.md` annotated with the pivot.

## Reversal cost

High. The DB table, the compute package, the dedicated routes, and the dashboard graph edges would all need to be reintroduced. The Drizzle migration `0011_lame_speedball.sql` is forward-only — restoring would require a fresh `CREATE TABLE drift_run` with no data. **Treat this as a one-way door.**

---

## Final-Cleanup-Annex (2026-05-21, Phase 1.14 der repo-health-and-workflow-overhaul)

Der ursprüngliche Cleanup (Homepage-Relaunch Phase 2, Mai 2026) hatte 6 dead-weight-Stellen übersehen. Das Repo-Health-Audit am 2026-05-21 (siehe `docs/plans/done/repo-health-and-workflow-overhaul.md`) hat sie aufgedeckt und entfernt:

- `packages/db/src/schema.ts:138–143` — `canonicalRepoId`-Spalte + veralteter Kommentar entfernt. Migration `0012_drop_canonical_repo_id.sql` (`ALTER TABLE "repo" DROP COLUMN IF EXISTS "canonical_repo_id"`).
- `packages/core/src/types.ts:105–139` — `DRIFT_KINDS`, `DriftKind`, `DriftItem`, `DriftReport` als dead exports gelöscht (durch Tombstone-Kommentar ersetzt).
- `apps/web/src/app/pricing/page.tsx:175` — `<FeatureRow text="Drift detection across repo pairs" />` entfernt (Bait-and-Switch-Risk: wir verkauften ein gedropptes Feature).
- `apps/web/src/app/trust/page.tsx:342` — Audit-Trail-Export-Liste: "drifts" aus der Aufzählung entfernt.
- `apps/web/src/components/settings/NotificationMatrix.tsx:20,38–41` — `drift.detected` Event + Default-Channel-Logik entfernt.
- `apps/web/src/lib/repo-galaxie/demo-data.ts:139,142` — Demo-Texte umtextiert (kein "Drift-Delta" mehr, "Drift-Detector last run" → "Audit-Re-Run last").
- `packages/inngest/src/functions/audit-requested.ts:106–108` — Tombstone-Kommentar zum canonical-Pointer entfernt (jetzt obsolet weil Spalte gedroppt).

**Status:** ✅ Final-Cleanup completed 2026-05-21. Kein bekannter dead-weight-Rest mehr.
