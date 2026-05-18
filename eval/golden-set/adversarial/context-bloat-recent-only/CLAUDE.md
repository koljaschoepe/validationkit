# CLAUDE.md

All sections are current operational guidance from the past 30 days. The
LLM trim-suggester should refuse with low confidence — every section is
load-bearing for active work.

## Test runner

Vitest. Tests live next to source. Run `pnpm test` before pushing. Pre-commit
hooks block lint failures; tests run in CI. Coverage isn't gated. Test
names read like sentences. Behaviour over implementation. Mock only at
boundaries. Refuse to mock internal packages. The exception is third-party
SDKs that fundamentally hit a network. Stripe SDK falls into this. The
Anthropic SDK does too. Anything else, lift the function out and test it
pure. Vitest is fast enough that you can run the full suite on every
commit in <5 s if you keep individual tests under 50 ms. The expensive
test-fixtures live in eval/, not in vitest's test set.

## Lint

ESLint TypeScript-recommended plus `vk-style`. Ruleset in
`packages/eslint-config-vk`. Prefer immutable data. Forbid `any` outside
generated code. Require return types on public exports. No default exports
except Next.js route files. Type-check failures block via pre-commit. `pnpm
typecheck` before pushing. tsc is the source of truth — IDE squiggles lie
when tsconfig paths drift, which they do whenever a new workspace package
lands and someone forgets to update tsconfig.base.json.

## Style

Functional patterns. No classes unless the framework demands one (React
error boundaries, Drizzle relations, Vitest mocks). Prefer pure functions.
Composition over inheritance. Named exports. Three similar lines beats a
wrong abstraction. Don't add error handling for scenarios that can't
happen. Trust framework guarantees. Validate at system boundaries only.
No comments unless the WHY is non-obvious. Don't explain WHAT — the
identifier names should do that. Don't reference current task, fix, or
callers — those belong in PR descriptions and rot in code.

## Naming

camelCase variables and functions. PascalCase types, interfaces, classes,
React components. kebab-case files. SCREAMING_SNAKE_CASE module-level
constants. Database table and column names snake_case via Drizzle's
column-name option; the TypeScript field names are camelCase. React
component file name matches default export PascalCase
(`DashboardSidebar.tsx` exports `DashboardSidebar`). Server actions live
in `lib/<feature>-actions.ts` with `"use server"` at top of file. Hooks
prefix with `use`. Hooks live next to consumer or in `hooks/` when shared.

## Imports

Absolute via `@/` for app-internal. Relative `./` for same-package. Never
deep-import into another workspace package's `dist/`. Use the package's
`exports` map. Adding a new export needs a CHANGELOG entry. Workspace
deps declared with `workspace:*`. `pnpm-workspace.yaml` at repo root
declares the `packages/` + `apps/` globs. Don't add new packages without
updating it — pnpm's lockfile won't pick them up otherwise.

## Server actions

Discriminated-union returns: `{ ok: true, data } | { ok: false, error }`.
Never throw across the action boundary; the client-side toast reads
`error` verbatim, so it must be human-grade copy. Log internal failures
to `console.error` so Vercel function logs surface them. Server actions
are `force-dynamic` by default in Next 16; rely on it.

Server actions live in `apps/web/src/lib/<feature>-actions.ts`. The
file-level `"use server"` directive applies to every export, which is
why those files contain ONLY async functions. Constants and types live
in adjacent `<feature>-constants.ts`.
