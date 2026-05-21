# Audit 3 — ADR ↔ Code Reality

> 2026-05-21 · Subagent-Output. Verifikation ob 3 ADRs (0001, 0002, 0003) wirklich im Code umgesetzt sind, plus Plan-Karteileichen-Liste.

## KILL — ADR-0003 Drift-Cleanup-Leck (7 Stellen)

ADR-0003 sagt "one-way door", aber 6 Cleanup-Lecks widersprechen das:

| # | Pfad | Was | Severity |
|---|------|-----|----------|
| 1 | `packages/db/src/schema.ts:138–143` | `canonicalRepoId` dead-weight Spalte + falscher Kommentar | KILL |
| 2 | `packages/core/src/types.ts:105–145` | `DRIFT_KINDS`/`DriftKind`/`DriftItem`/`DriftReport` dead exports | KILL |
| 3 | `apps/web/src/app/pricing/page.tsx:175` | Verkauft "Drift detection across repo pairs" als Paid-Feature (Bait-and-Switch!) | KILL |
| 4 | `apps/web/src/app/trust/page.tsx:342` | Audit-Trail-Export listet "drifts" zwischen scans + install_requests | KILL |
| 5 | `apps/web/src/components/settings/NotificationMatrix.tsx:20,38–41` | `drift.detected` Event + Default-Channel-Logik | KILL |
| 6 | `apps/web/src/lib/repo-galaxie/demo-data.ts:139,142` | Demo wirbt mit "Drift-Delta unter 5%" + "Drift-Detector last run" | KILL |
| 7 | `packages/inngest/src/functions/audit-requested.ts:106–108` | Tombstone-Kommentar "follow-up sprint" — Cleanup-Sprint nie passiert | KILL |

→ **Alle 7 Stellen sind in Phase 1.14a–h gefixt + Migration 0012 + ADR-0003 Final-Cleanup-Annex.**

## WEAK — ADR-0002 partial in Kraft, nirgends dokumentiert

PixiJS in Workspace + SVG in Landing ist eine legitime technische Wahl, aber ADR-0002 sagt das nicht. Ein Reader erwartet Pixi überall.

→ **Phase 1.5 (ADR-0004) + Phase 1.6 (ADR-0002 Annex)** ✅

## STRONG

- **ADR-0001 Customer-Schema-Match ist exemplarisch.** `packages/db/src/schema.ts:85–110` matcht ADR 1:1.
- **Migration `0011_lame_speedball.sql` ist sauber atomic** (eine Zeile).
- **`audit-requested.ts:106–108` ist ein vorbildliches Tombstone-Kommentar** — markiert dead canonical-Pointer mit ADR-0003-Verweis.

## Plan-Karteileichen — alle adressiert in Phase 1.11/1.12

- 3 Master-Pläne (master-vision-galaxie, homepage-relaunch, frontend-relaunch-v2) → `done/` ✅
- 3 R3F-Plans (nova-1-r3f-engine, nova-2-landing-hero, phase-nova-r3f-uplevel) → gelöscht (Q9) ✅
- 3 aktive Sub-Pläne (nova-2-live-audit-flow, nova-2-settings-backend, nova-2-a11y-deep-sweep) → keep, sind echt aktiv

## Adressiert in

- Phase 1.14a–h (Drift-Cleanup) ✅
- Phase 1.5/1.6 (ADR-0004 + ADR-0002 Annex) ✅
- Phase 1.11/1.12 (Plan-Reorganisation) ✅
