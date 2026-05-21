# Repo-Health Audits — Mai 2026

> Erstellt: 2026-05-21 im Rahmen des Repo-Health-and-Workflow-Overhaul-Plans (`docs/plans/done/repo-health-and-workflow-overhaul.md`).
> Methode: 8 spezialisierte Subagent-Audits parallel + Hauptagent-Synthese.

8 Audit-Reports, jeweils mit Severity-Bändern {Kill, Weak, Mid, Strong, Exceptional}. Jeder Report listet konkrete `file:line`-Findings und konkrete Fix-Empfehlungen.

## Index

| # | Audit | Datei | KILL | Hot-Findings |
|---|-------|-------|------|--------------|
| 1 | Kontext-Files-Konsistenz | [`context-files.md`](./context-files.md) | 7 | R3F-Stack-Doku ≠ Code; Better-Auth-Org-Plugin-Behauptung; Drift-Cleanup-Lücken |
| 2 | /plan + /execute Workflow | [`workflow.md`](./workflow.md) | 0 | "Open Questions" sammelt Vermutungen statt Discovery; Plan-File-Skelett unterspezifiziert |
| 3 | ADR ↔ Code Reality | [`adr-vs-code.md`](./adr-vs-code.md) | 1 | ADR-0003 Drift-Cleanup hat 7 leakende Code-Stellen (Mis-Selling); ADR-0002 nur partial in Kraft |
| 4 | Tech-Stack-Drift | [`tech-stack-drift.md`](./tech-stack-drift.md) | 2 | `@react-spring/web` + `@xyflow/react` 0 Imports; `shadcn` als Runtime-dep; `lucide-react@1.x` verdächtig |
| 5 | Tests + Eval + CI | [`tests-eval-ci.md`](./tests-eval-ci.md) | 0 | vitest.config schließt 14 apps/web-Tests aus (Quasi-KILL); kein Lint-Gate in CI; conflict-eval nicht gegated |
| 6 | packages/ Monorepo Health | [`packages-health.md`](./packages-health.md) | 0 | Keine Circulars, saubere DAG. `@vk/fixes` vager Name, dist/ in Git, `@vk/core` 0 JSDoc bei 43× Nutzung |
| 7 | Settings + Auth Backend-Gap | [`settings-backend.md`](./settings-backend.md) | 1 | 13 von 16 Settings-Sections sind Shells; Danger-Zone besonders kritisch (Placeholder-Workspace-Name) |
| 8 | Dead-Code apps/web | [`dead-code-apps-web.md`](./dead-code-apps-web.md) | 0 | ~400 LOC dead code: AuditForm, 5 ui-vk Komponenten, OnboardingBanner-Body, dashboard/loading, settings/user |

## Konsolidierte KILL-Liste (alle Audits)

11 KILL-Findings über alle Audits:

1. **Drift-Cleanup-Leck** (Audit 3): 7 Code-Stellen verkaufen oder erwähnen das gedroppte Drift-Feature → **gefixt in Phase 1.14** (alle 7 Stellen + Migration 0012).
2. **`@react-spring/web` + `@xyflow/react` 0 Imports** (Audit 4): zu entfernen → Phase 2.1.
3. **`shadcn` als Runtime-Dependency** (Audit 4): zu devDep → Phase 2.1.
4. **Settings-Danger-Zone Placeholder** (Audit 7): Mis-Selling-Risk → **gefixt in Phase 1.18** (EmptyState mit Disclaimer).
5. **R3F-Stack-Doku ≠ Code** (Audit 1): CLAUDE.md, vision.md, ADR-0002 sagten R3F, Code ist Pixi+SVG → **gefixt in Phase 1.1–1.7** + ADR-0004.
6. **Better-Auth-Org-Plugin Behauptung** (Audit 1): Code nutzt eigene workspace/membership-Tables → **gefixt in Phase 1.4** + ADR-0006 (Phase 2.4c).
7. **vitest.config schließt apps/web-Tests aus** (Audit 5, Quasi-KILL): 14 Tests liefen nie → **gefixt in Phase 1.16**.

→ **7 von 11 KILL-Findings sind bereits in Phase 1 adressiert.** Rest (3 Tech-Stack-Cleanups) wird in Phase 2.1 erledigt.

## Methodologie

- 8 Subagents parallel, je 30–45 min Recherche, Read-Only.
- Briefings self-contained (Subagents hatten keinen Konversations-Kontext).
- Output-Format: Severity-Bänder + `file:line`-Referenzen + konkrete Fix-Empfehlungen.
- 6 von 8 Audits mussten neu gestartet werden (Welle 1 verlor 6 an Session-Limit). Welle 2 lief sauber durch.

## Folgepläne / Sub-Plans aus Findings

- Repo-Health-and-Workflow-Overhaul-Plan (dieser hier) — adressiert die meisten KILL-Findings.
- `customer-route-rename` (Phase 3.8, noch nicht geschrieben) — Customer-Route-IA-Drift aus Audit 8.
- `nova-2-settings-backend.md` (existiert bereits) — bekommt Audit-7-Findings als Priorisierungs-Input.
