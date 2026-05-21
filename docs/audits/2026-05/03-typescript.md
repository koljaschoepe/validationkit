# Audit Sub-3 — TypeScript

> Generated: 2026-05-21
> Domain: Strictness · any-Leaks · @ts-ignore · tsconfig-Konsistenz
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}

## Summary

- **tsconfig files:** 13 (1 base + 1 web + 11 packages)
- **strict-true:** 13/13 (alle Workspaces erben `strict: true` aus `tsconfig.base.json`)
- **noUncheckedIndexedAccess:** 13/13 (vererbt aus base)
- **noImplicitOverride:** 13/13 (vererbt aus base)
- **exactOptionalPropertyTypes:** 0/13 (nirgends aktiviert)
- **noFallthroughCasesInSwitch:** 0/13 (nirgends aktiviert)
- **any-leaks (produktiv):** 12 in 6 Files, alle in `@vk/inngest` (10) + `@vk/github-app` (1) + `@vk/inngest/functions/index.ts` (1)
- **`as unknown as` Double-Casts:** 26 (DB-Revival + Stripe optional fields + Next.js Route-Branding)
- **@ts-ignore / @ts-nocheck / @ts-expect-error:** 0 (sauber!)
- **eslint-disable @typescript-eslint/no-explicit-any:** 12 (1:1 mit any-leaks — alle suppressed mit Begründungs-JSDoc darüber)
- **ESLint-Config-Files:** 0 (kein .eslintrc, keine eslint.config.js, kein inline `eslintConfig` in package.json gefunden)
- **typecheck status:** ✅ green (23/23 Tasks successful, alle cached → FULL TURBO)

## Findings

### [Exceptional] FN-01 — Strictness via `tsconfig.base.json` ist vorbildlich vererbt
**File:** `tsconfig.base.json:9-11`
**Issue:** Alle 12 Sub-Configs `extends` die Base. Strict + `noUncheckedIndexedAccess` + `noImplicitOverride` sind in jedem Workspace aktiv — kein einzelner Override löst Strictness auf. Das ist die korrekte Monorepo-Hygiene.
**Why Exceptional:** Single-Source-of-Truth, kein Workspace ist locker. 13/13 strict-true ist Best-in-Class.
**Suggested Fix:** Keiner — `noUncheckedIndexedAccess: true` ist seltener als `strict: true` und ist hier konsequent durchgezogen.

### [Exceptional] FN-02 — Zero `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` im gesamten Codebase
**File:** Repo-wide (`apps/`, `packages/`, `scripts/`, `eval/`)
**Issue:** Kein einziger Bypass des Compilers. Selbst die "schwierigen" Inngest-Typen werden mit `: any` + ESLint-disable + JSDoc-Reason behandelt — nicht mit `@ts-expect-error`.
**Why Exceptional:** Sehr seltenes Niveau für ein Solo-Projekt mit produktivem Stripe/Inngest/Drizzle-Stack.
**Suggested Fix:** Keiner.

### [Mid] FN-03 — Inngest-Functions als `: any` exportiert (TS2742-Workaround)
**File:** `packages/inngest/src/functions/audit-requested.ts:34`, `auto-track-repos.ts:22`, `credit-aggregator.ts:104`, `prepaid-credit-expirer.ts:154`, `stripe-reconcile.ts:36`, `functions/index.ts:8`
**Issue:** Alle 5 Inngest-Functions sind als `export const X: any = inngest.createFunction(...)` getypt, sowie der Aggregator-Array `export const functions: any[]`. Handler-Param `async ({ event, step }: any)` ebenfalls. Total: 12 `: any`-Annotationen.
**Why Mid:** Auch wenn `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + JSDoc-Reason ("Inngest's generated type references internal `inngest/api/api.js` paths that aren't portable across project boundaries (TS2742)") jeden Cast dokumentiert — der `step`/`event`-Param-Cast killt Type-Inference IN den Function-Bodies. Konkret: in `audit-requested.ts:38` ist `event.data as AuditRequestedPayload` ein blinder Cast ohne Compiler-Hilfe.
**Suggested Fix:** Versuche `Inngest.Helpers.InferEventData<typeof inngest, "audit/requested">` oder `Parameters<Inngest["createFunction"]>[1]` zu importieren. Falls TS2742 wirklich blockt: führe ein `type InngestFn = ReturnType<typeof inngest.createFunction>` in `client.ts` ein und nutze das statt `any` — narrower-than-any. Mindestens den Handler-Param typen: `async ({ event, step }: { event: { data: AuditRequestedPayload }; step: Inngest.StepTools })`.

### [Mid] FN-04 — `App<any>` in GitHub-App-PR-Client
**File:** `packages/github-app/src/client.ts:63`
**Issue:** `private readonly app: App<any>` schluckt die Octokit-Auth-Generic. `App` aus `@octokit/app` ist generisch über die Auth-Strategie, hier hätte `App<AppAuthStrategy>` o.ä. stehen können.
**Why Mid:** Load-bearing: dieser Client orchestriert GitHub-App-Webhook-Dispatch (Production-Code). `: any` als Generic verliert Type-Sicherheit für jedes `this.app.<method>`-Call.
**Suggested Fix:** Konkretisieren: `import type { AppAuthStrategy } from "@octokit/auth-app"; private readonly app: App<AppAuthStrategy>` — oder zumindest `App<unknown>` falls die exakte Auth-Strategie zur Compile-Time nicht determinierbar ist (`unknown` zwingt Casts an Call-Sites, `any` lässt sie still durchgehen).

### [Mid] FN-05 — `exactOptionalPropertyTypes` nirgends aktiviert
**File:** `tsconfig.base.json` (fehlend)
**Issue:** TypeScript-Flag `exactOptionalPropertyTypes: true` ist nicht gesetzt. Konsequenz: `{ foo?: string }` akzeptiert sowohl `{}` als auch `{ foo: undefined }` — `undefined`-Werte in optionalen Slots werden nicht als Bug erkannt. Bei Drizzle-`update().set(...)`-Calls und Stripe-Webhook-Payloads kann das `null` vs `undefined`-Verwirrung verstecken.
**Why Mid:** Strictness ist sonst maximal — das ist die nächste logische Stufe und passt zum Niveau des Restes. Aber: Aktivieren wird einige Stellen brechen, ist deshalb kein Quick-Fix.
**Suggested Fix:** In separatem Plan: `exactOptionalPropertyTypes: true` in `tsconfig.base.json` einschalten, `pnpm typecheck` laufen lassen, jeden Error einzeln durchgehen. Erfahrungsgemäß 20–50 Errors in einem Codebase dieser Größe.

### [Mid] FN-06 — `noFallthroughCasesInSwitch` und `noImplicitReturns` nirgends
**File:** `tsconfig.base.json` (fehlend)
**Issue:** Keine `switch`-Fallthrough-Detection, kein impliziter-Return-Check. Beide sind in `strict` NICHT enthalten.
**Why Mid:** Switch-Statements werden im Severity-Banding (`Kill | Strong | Mid | Weak | Exceptional`) verwendet — Fallthrough-Bug wäre dort load-bearing. Implicit-Returns sind in Server-Actions ein Risiko.
**Suggested Fix:** `noFallthroughCasesInSwitch: true` + `noImplicitReturns: true` in `tsconfig.base.json` ergänzen. Niedrig-Risiko (üblicherweise <5 Findings).

### [Mid] FN-07 — Kein ESLint-Config — `eslint-plugin-typescript`-Rules nicht aktiv
**File:** Repo-wide (kein `.eslintrc*`, kein `eslint.config.js`, kein inline `eslintConfig`)
**Issue:** Es existiert KEIN ESLint-Setup. Die `eslint-disable-next-line @typescript-eslint/no-explicit-any`-Kommentare in `packages/inngest/` und `packages/github-app/` werden von NICHTS gelesen — der Compiler ignoriert sie, ein nicht-installierter Linter erst recht. Sie sind reine Dokumentations-Annotationen.
**Why Mid:** Nicht "Strong", weil tsc + Discipline den Linter ersetzt — die Codebase ist tatsächlich sauber. Aber: ohne ESLint gibt es keinen automatisierten Check, der neue `: any`-Leaks oder ungenutzte Imports CI-blockiert. Bei wachsender Codebase ein Risiko.
**Suggested Fix:** `pnpm add -Dw eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-next` in Root, `eslint.config.js` mit Flat-Config + Rules `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/no-unused-vars: error`, `@typescript-eslint/consistent-type-imports: error`. In Turbo `lint`-Task + Pre-Commit-Hook (husky existiert schon).

### [Weak] FN-08 — `as unknown as T` Double-Casts für DB-JSON-Revival (26 Vorkommen)
**File:** `apps/web/src/lib/fix-actions.ts:47-48`, `apps/web/src/lib/audit-action.ts:391-408`, `apps/web/src/lib/audit-trail-export.ts:77-146`, `apps/web/src/app/[workspace]/scans/[id]/page.tsx:83-96`, `apps/web/src/app/api/stripe/webhook/route.ts:109-463`, `apps/web/src/app/auth/verify/page.tsx:46`
**Issue:** 26 `as unknown as <Type>` Casts. Cluster:
1. **Drizzle-JSON-Revival** (~12): `row.rawScan as unknown as ParserResult` — Drizzle `jsonb`-Columns sind als `unknown` getypt, der Cast restored die Form. **Begründet**, aber Zod-Validation hätte den Cast eliminieren können.
2. **Stripe-Webhook-Payloads** (~5): `(invoice as unknown as { subscription?: unknown }).subscription` — Stripe-TS-Types lassen optional Top-Level-Fields aus. **Begründet** (Stripe-API-Reality > Stripe-TS-Types).
3. **Next.js Route-Branding** (1): `redirect(next as unknown as Parameters<typeof redirect>[0])` — typed-routes erlaubt nur Compile-Time-Literals. **Begründet** mit Inline-Comment.
4. **Drizzle-tx-cast** (1): `tx as unknown as Db` in `packages/billing/src/credits.ts:239` — Drizzle-Transaction-Type kompat-Hack.
**Why Weak:** Jeder Cast hat einen legitimen Grund, viele haben Inline-Kommentare. Aber: `as unknown as Record<string, unknown>` in `audit-action.ts:391-408` ist ein Code-Smell, der Zod-Schemas an der DB-Boundary hätte sein sollen.
**Suggested Fix (Low-Prio):** Für `audit-action.ts`-Cluster: ein `zod`-Schema für `rawScan` + `rawReport` definieren, dann `ParserResultSchema.parse(row.rawScan)` statt `as unknown as ParserResult`. Eliminiert ~10 Casts und gibt Runtime-Safety.

### [Weak] FN-09 — `packages/core/src/index.ts` nutzt `export *` (Wildcard-Re-Exports)
**File:** `packages/core/src/index.ts:1-2`
**Issue:** `export * from "./types.js"; export * from "./severity.js";` — funktional ok, aber bei Bundler-Side-Effects + Tree-Shaking ist Named-Re-Export sauberer. Alle anderen Packages (audit, billing, llm, parser, ...) nutzen `export { X, Y } from "..."` — das ist also ein Inkonsistenz-Spot.
**Why Weak:** `@vk/core` enthält nur Types + die Severity-Konstante — keine Side-Effects, kein Bundle-Impact (Types werden eliminiert).
**Suggested Fix:** Wenn Konsistenz-Pflege gewünscht: explizite Re-Exports. Sonst belassen — core ist type-only.

### [Weak] FN-10 — `lib: ["ES2023"]` in Base aber keine `DOM`-Lib für Node-Packages
**File:** `tsconfig.base.json:3`
**Issue:** Base hat `"lib": ["ES2023"]` (kein DOM). `apps/web` overridet zu `["dom", "dom.iterable", "ES2023"]`, `packages/parser` zu `["ES2023", "DOM"]` (Resend-Email-Templates). Alle anderen Packages erben nur `ES2023` — korrekt.
**Why Weak:** Aktuell sauber. Beobachtung: falls jemals `globalThis.fetch`-Polyfill-Probleme auftauchen, ist `ES2023` der korrekte Layer (fetch global ab Node 18).
**Suggested Fix:** Keiner.

## tsconfig.json Konsistenz-Matrix

| Workspace | strict | noUncheckedIndexedAccess | noImplicitOverride | exactOptionalPropertyTypes | noFallthroughCasesInSwitch | noImplicitReturns | noEmit | declaration |
|-----------|--------|--------------------------|--------------------|-----------------------------|-----------------------------|-------------------|--------|-------------|
| `tsconfig.base.json` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | — | ✓ |
| `apps/web` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✓ | ✗ (override) |
| `packages/audit` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/auth` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/billing` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/core` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/db` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/fixes` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/github-app` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/inngest` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/llm` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/parser` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |
| `packages/pr-workflow` | ✓ (inh) | ✓ (inh) | ✓ (inh) | ✗ | ✗ | ✗ | ✗ | ✓ (inh) |

**Legend:** ✓ (inh) = inherited from base via `extends`. ✗ = not set (TypeScript default = false).

## any-Leaks Verteilung

| File | Lines | Reason | Severity |
|------|-------|--------|----------|
| `packages/inngest/src/functions/audit-requested.ts` | 34, 37 | TS2742 portability + handler-param | Mid |
| `packages/inngest/src/functions/auto-track-repos.ts` | 22, 28 | TS2742 portability + handler-param | Mid |
| `packages/inngest/src/functions/credit-aggregator.ts` | 104, 110 | TS2742 portability + handler-param | Mid |
| `packages/inngest/src/functions/prepaid-credit-expirer.ts` | 154, 160 | TS2742 portability + handler-param | Mid |
| `packages/inngest/src/functions/stripe-reconcile.ts` | 36, 42 | TS2742 portability + handler-param | Mid |
| `packages/inngest/src/functions/index.ts` | 8 | Function-array aggregator | Mid |
| `packages/github-app/src/client.ts` | 63 | `App<any>` Octokit-Auth-Strategy | Mid |

**Total: 12 `: any` annotations in 7 files** — alle mit `// eslint-disable-next-line @typescript-eslint/no-explicit-any` und JSDoc-Reason in `audit-requested.ts:24-32` ("Return type is intentionally `any` because Inngest's generated type references internal `inngest/api/api.js` paths..."). Keine Streu-`any` in `apps/web/src/`, keine in `@vk/audit | @vk/llm | @vk/parser | @vk/db | @vk/auth | @vk/billing | @vk/fixes | @vk/pr-workflow | @vk/core`.

## Server-Actions Type-Coverage (apps/web/src/lib/*-actions.ts)

Stichprobe der 7 Action-Files (`customer-actions`, `billing-actions`, `workspace-ai-actions`, `dpa-actions`, `solution-actions`, `fix-actions`, `apply-actions`):

- **Return-Type explicit:** ✓ Alle `export async function`-Signaturen haben `: Promise<ActionResult>`, `: Promise<FixActionResult>`, `: Promise<void>` o.ä. annotiert.
- **Form-Data Param-Type:** ✓ `fd: FormData` ist nativ getypt, kein `: any` Schluck.
- **Input-Validation:** Stichproben in `customer-actions.ts:22, 51` — Functions extrahieren FormData manuell, KEINE Zod-Validation gesehen. Out-of-scope für TS-Audit, aber siehe Cross-Reference unten.

## Cross-Reference Empfehlungen

- **→ Audit 04 (Security):** Input-Validation der Server-Actions (`fd: FormData` ohne Zod) ist potentielles Risk — Sub-4 könnte das übernehmen.
- **→ Audit 02 (Packages-Health):** Inngest-TS2742-Problem ist ein Upstream-Library-Issue — wenn auf Inngest v4 oder offiziellen Type-Export gewartet wird, kann FN-03 grouped-fixed werden.
- **→ Audit 09 (Tooling):** ESLint-Setup (FN-07) ist Tooling-Aufgabe — Sub-9 sollte das verlinkt führen.

## Verdict

TypeScript-Strictness ist **eine der stärksten Achsen des Repos**. Die Kombination aus:
- 13/13 strict + noUncheckedIndexedAccess
- 0 ts-ignore/expect-error
- Alle 12 `: any` dokumentiert + eslint-disable-Marker
- Zero typecheck-Errors (FULL TURBO cache hit)

…ist für ein Solo-Dev-Projekt **exceptional**. Hauptverbesserungs-Hebel (in Reihenfolge):
1. **ESLint einrichten** (FN-07) — automatisiert die Discipline.
2. **`exactOptionalPropertyTypes` einschalten** (FN-05) — nächste Strictness-Stufe.
3. **Inngest-`any` ersetzen** (FN-03) — wenn Upstream-Types portierbar werden.
4. **`App<AppAuthStrategy>` statt `App<any>`** (FN-04) — Single-Line-Fix wenn Auth-Type bekannt.

Kein Kill, kein Strong-Finding. Die TS-Achse ist solide.
