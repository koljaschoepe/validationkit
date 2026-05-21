# Audit 6 — packages/ Monorepo Health

> 2026-05-21 · Subagent-Output. 11 Packages, alle `@vk/*`, alle tsc-only Build, 74/74 Tests grün (1.48s).

## Dependency-Map

```
core ← {parser, db, llm, billing, pr-workflow}
audit ← {core, llm}
fixes ← {core, llm}
github-app ← {core, pr-workflow}
inngest ← {core, db, parser, audit, billing}
auth ← {db}

apps/web ← konsumiert alle 11 packages
```

**Keine Circulars.** Saubere DAG.

## STRONG

- `@vk/core` (162 LOC, zero deps) — lean Type-Hub, textbook.
- `@vk/audit` Rule-Inventar matched CLAUDE.md "5 deterministic + 1 LLM" exakt.
- Apps/web ist Top-Konsument, nutzt 11/11 Packages.

## WEAK

1. **`@vk/llm` Provider-Drift** — adressiert in Phase 1.13a–c ✅.
2. **`@vk/fixes` Naming + Scope** — 116 LOC, gleiche deps wie `@vk/audit`, kein eigenständiger Lifecycle. → Phase 2.3b (OPTIONAL Merge in `@vk/audit/fixes`).
3. **`dist/` ist git-checked-in für alle 11 Packages.** Alle `private: true`, kein npm-publish-Zwang. → Phase 2.3a.

## MID

4. **`@vk/parser` Hidden-Dependency hinter `runAudit`** — Convenience-Wrapper `auditRepository(rootPath)` möglich.
5. **JSDoc-Coverage ungleich.** `@vk/core/types.ts` hat null JSDoc auf 8 öffentlichen Typen (43× konsumiert in apps/web). → Phase 2.3c.
6. **Subpath-Export-Inkonsistenz** — nur `@vk/auth` (`./client`) und `@vk/db` (`./schema`) deklarieren Subpaths. `auth/client` Export-Mapping zeigt auf `src/` statt `dist/` (TS-loader nötig via Next `transpilePackages`).
7. **Test-Coverage-Lücken**: `@vk/billing` (0 Tests, kritisch wegen Stripe-Tier-Logic), `@vk/core` (0 — OK weil reine Types), `@vk/llm/select.ts` (0 — OpenAI-Branch ungetestet).

## Reorg-Empfehlungen

1. **Merge `@vk/fixes` → `@vk/audit/fixes` Sub-Export** — Phase 2.3b optional.
2. **JSDoc-Sweep `@vk/core/types.ts`** — Phase 2.3c.
3. **`@vk/llm/select.ts` OpenAI-Branch echt machen** — ✅ Phase 1.13a–c.
4. **`dist/` aus Git rausnehmen** — Phase 2.3a.

## Adressiert in

- Phase 1.13a–c (LLM Multi-Provider) ✅
- Phase 2.3a (dist/ aus Git) — pending
- Phase 2.3b (fixes-Merge OPTIONAL) — pending/optional
- Phase 2.3c (JSDoc-Sweep core) — pending
