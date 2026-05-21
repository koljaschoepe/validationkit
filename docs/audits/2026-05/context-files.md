# Audit 1 — Kontext-Files-Konsistenz

> 2026-05-21 · Subagent-Output. Geprüft: CLAUDE.md, vision.md, roadmap/*, adrs/*, linear-aesthetic.md, TODO.md, README.md, CONTRIBUTING.md, SECURITY.md.

## KILL — Direkte Widersprüche / Falsche Information

1. **CLAUDE.md sagt R3F, Code ist PixiJS+SVG.** `.claude/CLAUDE.md:36` behauptete `Galaxie: React-Three-Fiber + drei.js`. Code: `apps/web/package.json:14–55` enthält `pixi.js@8.18.1`, `@pixi/react@8.0.5`, `pixi-filters`. R3F ist nicht installiert. → **Phase 1.1**.
2. **docs/vision.md sagt PixiJS überall, ADR-0002 wurde durch SVG-Pivot 2026-05-20 partial supersedet, aber kein ADR-0004 existierte.** → **Phase 1.5 + 1.6**.
3. **vision.md sagt "Better-Auth Organization-Plugin" (Z. 105, 119). Code (`packages/auth/src/server.ts:81–93`) nutzt nur magicLink-Plugin; Workspaces sind eigene Drizzle-Tabellen.** → **Phase 1.4**.
4. ~~**README.md verspricht `pnpm db:migrate` aber Befehl existiert nicht.**~~ FALSE POSITIVE — `package.json:30` hat den Script. Audit-Finding war falsch.
5. **TODO.md verweist auf 6+ Doc-Pfade die nicht (mehr) existieren** (`docs/legal/`, `docs/setup/github-app-checklist.md`, `docs/outreach/`, `docs/bip-posts/`, `docs/playbook/`, `docs/handbook-extras/`, `recruitment.md`). → **Phase 1.10**.
6. **TODO.md Sprint 0.1 erwähnt `packages/cli` — existiert nicht.** Migriert oder gelöscht. → **Phase 1.10**.
7. **ADR-0003 "one-way door" — 6 Cleanup-Lecks im Code.** Siehe Audit 3. → **Phase 1.14**.

## STRONG (kurz)

- CLAUDE.md ist knapp (86 Zeilen), Constraints sind load-bearing und konkret.
- Severity-Konvention {Kill,Weak,Mid,Strong,Exceptional} wird durchgängig genutzt.
- Plan-/Execute-Workflow ist konsequent (Plan → done/, mit ✅-Headern).
- ADRs haben alle 4 Sektionen + Re-Open-Trigger.
- README.md + CONTRIBUTING.md + SECURITY.md + LICENSE alle vorhanden.

## EXCEPTIONAL Suggestions

- **Auto-generated Doc-Reality-Diff** (Phase 4.1): `scripts/doc-consistency.ts` parst CLAUDE.md Tech-Stack-Tabelle, grept package.json, fail wenn Dep nicht existiert.
- **`/docs` Public-Site** für `docs/*.md`.
- **ADR-Supersession-Chain** als YAML-Frontmatter (`Supersedes:` / `Superseded-by:`).
- **TODO.md → docs/plans/backlog.md** Pattern für Solo-Dev-Parking-Lot.

## Adressiert in

- Phase 1.1–1.7 (Doku-Sync) ✅
- Phase 1.10 (TODO.md slim) ✅
- Phase 1.14 (Drift-Cleanup) ✅
- Phase 4.1 (Doc-Consistency-Script) — pending
