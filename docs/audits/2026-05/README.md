# Repo-Health Audits — Mai 2026

> Erstellt: 2026-05-21. Methode: parallele Subagent-Audits + Hauptagent-Synthese.
> **Stand 2026-06-18:** Der kanonische Audit ist der 12-Report-Nova-3-Lauf
> (`01-*.md` … `12-*.md` + `_synthesis.md`). Die ursprünglichen 8 losen Drafts
> (`context-files.md`, `workflow.md`, `adr-vs-code.md`, `tech-stack-drift.md`,
> `tests-eval-ci.md`, `packages-health.md`, `settings-backend.md`,
> `dead-code-apps-web.md`) waren ein früherer Repo-Health-Lauf und wurden als
> superseded entfernt.

## Index (kanonisch)

Voller Health-Score + konsolidierte KILL-Liste: [`_synthesis.md`](./_synthesis.md).

| # | Domain | Datei |
|---|--------|-------|
| 01 | Dead-Code | [`01-dead-code.md`](./01-dead-code.md) |
| 02 | Dependencies | [`02-dependencies.md`](./02-dependencies.md) |
| 03 | TypeScript | [`03-typescript.md`](./03-typescript.md) |
| 04 | DB-Schema | [`04-db-schema.md`](./04-db-schema.md) |
| 05 | Security | [`05-security.md`](./05-security.md) |
| 06 | Performance | [`06-performance.md`](./06-performance.md) |
| 07 | A11y + SEO | [`07-a11y-seo.md`](./07-a11y-seo.md) |
| 08 | Tests + Eval | [`08-tests-eval.md`](./08-tests-eval.md) |
| 09 | Configs | [`09-configs.md`](./09-configs.md) |
| 10 | Kontext-Files | [`10-context-files.md`](./10-context-files.md) |
| 11 | UI-Konsistenz | [`11-ui-consistency.md`](./11-ui-consistency.md) |
| 12 | API-Routes | [`12-api-routes.md`](./12-api-routes.md) |

## Methodologie

- Subagents parallel, je 30–45 min Recherche, Read-Only.
- Briefings self-contained (Subagents hatten keinen Konversations-Kontext).
- Output-Format: Severity-Bänder {Kill, Weak, Mid, Strong, Exceptional} +
  `file:line`-Referenzen + konkrete Fix-Empfehlungen.
- Severity-Konvention: `packages/core/src/severity.ts`.
