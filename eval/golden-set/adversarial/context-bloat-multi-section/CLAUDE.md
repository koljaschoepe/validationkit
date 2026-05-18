# CLAUDE.md

Five sections, all of comparable load-bearing weight. The LLM trim-suggester
should return mid or low confidence on this fixture — there's no clearly
"archive" section to chop.

## Section A — testing

Vitest. Tests live next to source: `foo.ts` + `foo.test.ts`. Run pnpm test
before pushing. Tests assert behaviour, not implementation. Mock only at
module boundaries. Coverage isn't a gate. Test names read like sentences.
The CI fails on red tests. Pre-commit hooks block on lint, not on tests
(too slow). The convention is current, load-bearing, and applies to every
PR opened in 2026.

Test runner config lives in `vitest.config.ts` at repo root. Per-package
overrides land in `packages/<name>/vitest.config.ts` and merge with the
root via `vitest.config.merge`. Don't fork the root config unless you
have to.

## Section B — linting

ESLint with TypeScript-recommended plus vk-style. The ruleset is in
packages/eslint-config-vk. Prefer immutable data, forbid any outside
generated code, require return types on public exports, no default exports
except in Next.js route files. Type-check failures block merges. Run pnpm
typecheck before pushing. tsc is the source of truth. The IDE squiggles
can lie when tsconfig paths drift.

## Section C — styling

Functional patterns. No classes unless the framework demands one. Prefer
pure functions, composition over inheritance, named exports. Three similar
lines is better than a wrong abstraction. Don't add error handling for
scenarios that can't happen. Trust framework guarantees. Validate at
system boundaries only. No comments unless the WHY is non-obvious.

## Section D — naming

camelCase for variables, PascalCase for types, kebab-case for files,
SCREAMING_SNAKE_CASE for constants. Database columns snake_case via
Drizzle's column-name option; TypeScript fields camelCase. React components
match file name (PascalCase). Server actions live in lib/<feature>-actions.ts
with "use server" at top.

Hooks prefix with use: useDashboardEvents. Files live next to the consumer
or in hooks/ when shared. Module-level constants in SCREAMING_SNAKE_CASE,
exported only when used across files. Local constants in camelCase.

## Section E — imports

Absolute imports via @/ for app-internal files. Relative imports ./ for
same-package. Never deep-import into another workspace package's dist/
— use the exports map. Adding a new export needs a CHANGELOG entry.

Workspace dependencies declared with workspace:* in package.json. The
pnpm-workspace.yaml at repo root declares the packages/ + apps/ globs.
Don't add new packages without updating pnpm-workspace.yaml; the lockfile
won't pick them up otherwise.

## Section F — error handling

Validate at boundaries (user input, external APIs, deserialised JSON).
Trust internal code. Throw real Error subclasses, not strings. Never
swallow errors silently — log to console.error so they show up in Vercel
function logs. The exception is the deliberate "ignore this provider's
transient failure" path; document it inline with a "// Ignored: <reason>"
comment.

Server actions return a discriminated union { ok: true, data } | { ok: false, error }
instead of throwing. Client-side toast messages read the error string
verbatim — don't include stack traces or internal IDs.
