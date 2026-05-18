# CLAUDE.md

Project conventions for AI-agent collaboration. Read this before opening any
PR; it captures the load-bearing decisions a junior assistant won't infer
from the codebase alone.

## Test runner

Vitest. Tests live next to source: `foo.ts` + `foo.test.ts`. Run `pnpm test`
before pushing. If a single test fails, do not push — fix or roll back.
Pre-commit hooks block the push automatically on lint failure but do NOT
run the full test suite (too slow). The CI is the safety-net of last
resort, not the first-line check. A clean local run is the entry condition
for a PR. Anyone shipping a PR with red tests is being rude to the
on-call.

When writing tests, prefer behaviour over implementation: assert what the
function returns, not which internal helpers it calls. Mock only at module
boundaries (third-party SDKs, fs, network). Refuse to mock our own
packages — if you need to, the design is wrong. The exception is the
Stripe SDK, which is fundamentally a network surface even in unit tests.

Test names should read like sentences. `it("returns null when the API key
is unset")` beats `it("test 1")`. Future-you debugging a flaky run reads
the test name, not the assertion.

Coverage is not a target. We don't gate PRs on coverage %. Coverage
correlates with confidence weakly; over-fit tests against private state
correlate with test churn strongly. Write tests that survive a refactor.

## Lint

ESLint with the recommended TypeScript configs plus our `vk-style`
ruleset. The ruleset is in `packages/eslint-config-vk` — it's three
hundred lines but the rules-of-rules are short: prefer immutable data,
forbid `any` outside generated code, require explicit return types on
public exports, no default exports except in Next.js route files (where
the framework demands them).

Type-check failures block merges via pre-commit. Run `pnpm typecheck`
before pushing. tsc is the source of truth for "does this code build"; the
IDE squiggles can lie when tsconfig paths drift.

## Style

Functional patterns. No classes unless the framework demands one (React
error boundaries, Drizzle relations, Vitest mocks). Prefer pure functions
over methods. Prefer composition over inheritance. Prefer named exports
over default exports.

Avoid premature abstraction. Three similar lines is better than a wrong
abstraction that costs a refactor in six months.

## Naming

camelCase for variables and functions. PascalCase for types, interfaces,
classes, and React components. kebab-case for files. SCREAMING_SNAKE_CASE
for module-level constants. Database table and column names are
snake_case via Drizzle's column-name option; the TypeScript field names
are camelCase.

For React components, the file name matches the default export
PascalCase: `DashboardSidebar.tsx` exports `DashboardSidebar`. Server
actions live in `lib/<feature>-actions.ts` and use the `"use server"`
directive at the top of the file.

For hooks, prefix with `use`: `useDashboardEvents`. Hooks live next to
the consumer or in `hooks/` when shared.

## Imports

Absolute imports via `@/` for app-internal files. Relative imports `./`
for files in the same package. Never deep-import into another workspace
package's `dist/` — use the package's `exports` map. Adding a new export
needs a CHANGELOG entry.

## File layout

Co-locate by feature, not by type. A dashboard feature is one folder with
its page, components, server actions, and tests. Cross-cutting utilities
live in `lib/` or in dedicated workspace packages.

## Error handling

Validate at boundaries (user input, external APIs, deserialised JSON).
Trust internal code. Throw real Error subclasses, not strings. Never
swallow errors silently — log to `console.error` so they show up in
Vercel function logs. The exception is the deliberate "ignore this
provider's transient failure" path; document it inline.

## Logging

`console.error` for production failures. `console.warn` for non-fatal
oddities. No `console.log` in shipped code — debug logs land via
deliberate `console.debug` with a `VK_DEBUG` env-gate.

## Archive — pre-Sprint-0.5 conventions

These rules applied before the Phase-0.5 dashboard pivot. They are kept
here for historical context and should NOT be applied to new code. New
code follows the Sprint-0.11+ conventions above. If you see a file that
looks like it follows these older rules, it was probably written before
2026-05-13 and is in the queue for migration during the next pass.

### Old rule: prefer classes for stateful objects

We used to write classes for anything with state. That changed with the
Sprint-0.5 functional-pattern push. New code should use closures, not
classes, unless the framework explicitly requires a class shape.

### Old rule: default exports

Default exports were the norm before Sprint-0.5. Named exports are now
the rule; the exception list above is exhaustive.

### Old rule: 80-char line limit

We used to enforce an 80-character line limit via Prettier. That was
relaxed to 100 in Sprint-0.5 because the wide-screen displays we now
prefer made the 80-char rule feel cramped. The Prettier config in the
root committed enforces 100 today.

### Old rule: tabs

We used tabs for indentation until Sprint-0.5. The standard is now
2-space indentation. Prettier and ESLint both enforce this. Old files
have been re-indented; if you see tabs in a new file, fix it.

### Old rule: explicit return types everywhere

We required explicit return types on every function, public or private,
until Sprint-0.5. The rule was relaxed: explicit return types are
required only on public exports. Private functions inside a module can
let TypeScript infer.

### Old rule: lib/utils.ts

We had a single `lib/utils.ts` that grew to 800 lines. Sprint-0.5 split
it into feature-specific files (`lib/dates.ts`, `lib/strings.ts`, etc.).
The old `utils.ts` no longer exists; if you grep for it you'll find
import-rewrite migrations in the git history.
