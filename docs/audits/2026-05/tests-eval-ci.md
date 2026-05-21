# Audit 5 — Tests + Eval + CI

> 2026-05-21 · Subagent-Output.

## Test-Coverage

| Package | Test-Files | LOC | Status |
|---------|-----------|-----|--------|
| @vk/audit | 2 | 121 | ✓ |
| @vk/auth | 1 | 38 | ✓ dünn |
| @vk/billing | 0 | 0 | **✗ keine Tests** (Stripe-Tiers!) |
| @vk/core | 0 | 0 | nur Types, OK |
| @vk/db | 1 | 29 | ✓ Smoke |
| @vk/fixes | 1 | 189 | ✓ |
| @vk/github-app | 2 | 168 | ✓ |
| @vk/inngest | 1 | 41 | ✓ Smoke |
| @vk/llm | 1 | 32 | ✓ dünn |
| @vk/parser | 3 | 160 | ✓ |
| @vk/pr-workflow | 1 | 72 | ✓ |
| **@vk/web** | **14** | — | **✗ liefen NICHT in CI** (vitest.config Bug!) |

→ **Vitest-Config-Bug ist in Phase 1.16 gefixt + `@/` Alias hinzugefügt. Jetzt 169/169 Tests grün (vorher 157).**

## WEAK (alle in Phase 2.5 adressiert)

1. **Conflict-Eval ungegated** — `pnpm eval:conflicts` läuft nie automatisch, kein ANTHROPIC_API_KEY Secret in CI. PRD-Constraint #13 (FPR ≤ 15%) papier-deep. → Phase 2.5d.
2. **Kein Lint-Gate in CI** — `pnpm lint` ist in Root-Scripts, aber nicht im Workflow. → Phase 2.5b.
3. **Lighthouse manuell** — Threshold-Setup ist solide, aber niemand zwingt es. → Phase 2.5e/f.
4. **Lighthouse-Output unter `apps/web/`** nicht in `.gitignore` — HTML-Reports könnten committed werden. → Phase 2.5e.

## MID

5. **`@vk/billing` + `@vk/llm` haben dünne Tests** (Stripe-Tier-Logic, OpenAI-Branch ungetestet).
6. **Eval-Coverage**: Golden-Set 34 Entries (Ziel 30+, erfüllt). Conflict-Eval 6 Pairs (Ziel 12 für v0.5).
7. **README-Lücken** — Inngest-UI, Mailpit-UI, `pnpm eval:conflicts`, `pnpm bip:count`, `pnpm e2e:smoke` nicht dokumentiert. → Phase 2.5g.

## STRONG

- **Smoke-Eval ist exzellent** — `eval/smoke.ts` deterministisch, schnell, im CI-Gate, 34 Fixtures + must/must-not.
- **Docker-Stack** — Postgres/Dragonfly/Mailpit/Inngest, Healthchecks, klare Ports.
- **CI ist minimalistisch + funktioniert** — 5 Steps, Versionen korrekt, Concurrency-Cancel.

## EXCEPTIONAL

- **Conflict-Eval Design** — N=3 Variance-Runs + per-Confidence-Band FPR + Persistenz + No-op-Fallback ist gut durchdachtes LLM-Eval-Pattern. Schade dass es nicht im CI-Gate steht.

## Adressiert in

- Phase 1.16 (vitest.config Fix) ✅
- Phase 2.5b–g (CI-Härten) — in Arbeit
- Phase 2.7 (Husky pre-commit) — pending
