# Audit Sub-9 — Configs

> Generated: 2026-05-21
> Domain: Config-Hygiene · Cross-Workspace-Konsistenz · CI
> Convention: Severity-Bänder {Kill, Strong, Mid, Weak, Exceptional}

## Summary

- **Config files scanned:** 28
  - 1× `vercel.json` (root only), 1× `next.config.ts`, 1× `turbo.json`, 1× `pnpm-workspace.yaml`
  - 12× `tsconfig.json` (1 base + 11 workspaces), 12× `package.json` (1 root + 1 app + 10 packages)
  - 2× `vitest.config.ts` (root + apps/web), 1× `drizzle.config.ts`
  - 1× `postcss.config.mjs`, 1× `components.json` (shadcn), 1× `docker-compose.yml`
  - 1× `.gitignore`, 1× `.nvmrc`, 1× `.github/workflows/ci.yml`, 1× husky `pre-commit`
- **Inconsistencies found:** 9
- **Missing critical files:** 6 (`.dockerignore`, `eslint.config.*`, `.prettierrc*`, `.lighthouserc*`, `.tool-versions`, no `tailwind.config.*` — Tailwind v4 uses CSS-first config, OK)
- **packageManager pinned:** Yes (`pnpm@10.18.1` in root `package.json:8`)
- **Engines pinned:** Partial — only root (`node >=22.0.0`); 11 workspace `package.json` files have NO `engines` field
- **CI matrix:** Single job, single Node version (22), single OS (ubuntu-latest), no Lighthouse-CI job, lint step commented out, no e2e job

---

## Findings

### [Kill] FN-01 — CI does not run lint, lint-staged, or Lighthouse; missing eval-conflict gating on PR
**File:** `.github/workflows/ci.yml:47-50,84-86`
**Issue:** Lint step explicitly commented out ("Next 16 removed `next lint`, ESLint flat-config setup is a deferred sub-plan"). No ESLint config exists anywhere in the repo (no `eslint.config.*`, no `.eslintrc*`, no eslint dependency in any workspace). The husky pre-commit hook is a `exit 0` placeholder. Apps/web `lint` script is a literal `echo` stub (`apps/web/package.json:12`). The `conflict-eval` job only runs on push-to-main (`if: github.event_name == 'push'`) and silently no-ops without `ANTHROPIC_API_KEY` — PRs get no signal at all. No Lighthouse-CI job; the only Lighthouse hook is a manual `pnpm --filter @vk/web lighthouse` invoking `lighthouse-audit.sh`.
**Why Kill:** Nova-2 ships strict UI tokens, a11y AA, and React/Next.js patterns — there is zero static-analysis gate. A typo, missing dep, or `'use client'` boundary regression can land on `main`. Combined with the commented lint step and stub husky, this is the highest-leverage CI gap in the repo.
**Suggested Fix:** Three parallel actions: (1) ship the deferred ESLint flat-config sub-plan (`@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `@typescript-eslint/*`), uncomment the lint step, wire `lint-staged` into `.husky/pre-commit`. (2) Add a `lighthouse` CI job that runs `pnpm --filter @vk/web lighthouse` against a Vercel preview URL (or boot the app locally with `start` + wait-on). (3) Remove the `event_name == 'push'` gate from `conflict-eval` so the signal hits PRs too, OR move the eval results into an artifact-comparison job.

### [Strong] FN-02 — `engines` not pinned in 11 workspace `package.json` files
**File:** `apps/web/package.json`, `packages/*/package.json`
**Issue:** Only the root `package.json:9-11` pins `"engines": { "node": ">=22.0.0" }`. No workspace pins `node` or `pnpm`. pnpm does respect root `packageManager` for the workspace, but `engines.node` per-package gives both pnpm and downstream tooling (e.g. Vercel) clearer signals. Also, **no workspace pins `engines.pnpm`** even at root — only `packageManager` does.
**Why Strong:** Drift between local Node 20/22 + CI Node 22 + Vercel default is a real production failure mode. ValidationKit uses Node 22-only API (e.g. native `fetch` flavors, structuredClone perf paths). Make this explicit at every level.
**Suggested Fix:** Add to root `package.json`:
```json
"engines": { "node": ">=22.0.0", "pnpm": ">=10.18.1" }
```
For every workspace, add (or duplicate via a script):
```json
"engines": { "node": ">=22.0.0" }
```

### [Strong] FN-03 — No `.tool-versions` file; only `.nvmrc` with `22` (major-only)
**File:** `.nvmrc:1`
**Issue:** `.nvmrc` says `22` (major only — accepts 22.0.0 or 22.99.0). No `.tool-versions` for asdf/proto/mise users. CI pins to `22` (same imprecision: `.github/workflows/ci.yml:38`). The root `packageManager: pnpm@10.18.1` is precise (good), but Node is fuzzy.
**Why Strong:** Reproducibility — Node 22.0.0 vs 22.11.0 can produce different `crypto` defaults, different ESM resolver behavior. A pinned minor protects against silent regressions.
**Suggested Fix:** Either pin `.nvmrc` to a specific minor (e.g. `22.11.0`) or add a `.tool-versions` file:
```
nodejs 22.11.0
pnpm 10.18.1
```
Update CI: `node-version-file: .nvmrc` (or `.tool-versions`) so a single source of truth wins.

### [Strong] FN-04 — `apps/web/tsconfig.json` silently overrides base `module: NodeNext` → `ESNext` + base `target: ES2023` → `ES2022`
**File:** `apps/web/tsconfig.json:4-7` vs `tsconfig.base.json:3-6`
**Issue:** The base sets `target: ES2023`, `module: NodeNext`, `moduleResolution: NodeNext`. apps/web overrides to `target: ES2022`, `module: ESNext`, `moduleResolution: Bundler`. That mix is fine for Next.js, but: (a) **base target ES2023 is wrong for any library consumed in the browser bundle** (most package builds emit JS for the apps/web runtime — ES2023 features like `Array.prototype.findLast` will leak into prod bundles even though apps/web is ES2022). (b) Workspace tsconfigs don't override target, so all dist outputs are emitted at ES2023.
**Why Strong:** This is the silent kind of drift that ships untranspiled ES2023 into the browser bundle. Browser compatibility of `findLast`, `groupBy`, etc. is wide but not universal; bundler-emitted code from `@vk/*` packages will be raw ES2023 imports without re-transpilation.
**Suggested Fix:** Lower the base to `target: ES2022` (modern enough, Node 18+/browser-safe). Then apps/web doesn't need to override target. Document the rationale.

### [Mid] FN-05 — `turbo.json` build inputs miss `proxy.ts`, `middleware.ts`, `instrumentation.ts`, route handlers outside `src/`
**File:** `turbo.json:7-16`
**Issue:** Build `inputs` are `src/**`, `public/**`, `tsconfig.json`, `package.json`, `next.config.ts`, `next.config.js`, `tailwind.config.*`, `postcss.config.*`. apps/web uses `proxy.ts` at `apps/web/src/proxy.ts` (covered by `src/**`, OK). But changes to root-level `tsconfig.base.json` ARE captured via `globalDependencies`. However, `.env.example` is a globalDependency — fine. **Missing from build inputs**: `components.json` (shadcn), `postcss.config.mjs` (covered by `postcss.config.*` glob, OK), and `vitest.config.*` is correctly only in `test` inputs.
**Why Mid:** Most likely OK in practice. Minor concern: `components.json` changes (shadcn theme overrides) don't bust the build cache, but they rarely change post-init.
**Suggested Fix:** Add `"components.json"` to build inputs. Also consider adding `"!**/__tests__/**"` and `"!src/**/*.test.{ts,tsx}"` as anti-inputs so test changes don't bust the production build cache.

### [Mid] FN-06 — `apps/web/vitest.config.ts` doesn't share aliases with root `vitest.config.ts` → resolver drift
**File:** `apps/web/vitest.config.ts:1-15` vs `vitest.config.ts:1-37`
**Issue:** Root vitest has 9 workspace aliases (`@vk/core` → `packages/core/src/index.ts`, etc.). apps/web vitest only has `@` → `./src`. Running `pnpm --filter @vk/web test` (the workspace `test` script) goes through apps/web's vitest config, which **has no `@vk/*` aliases**, so test imports of `@vk/core` resolve to `packages/core/dist/index.js` — meaning packages must be pre-built before workspace tests run.
**Why Mid:** Root `pnpm test` works (alias-resolved to src). apps/web `pnpm test` requires `pnpm build` first. This bites anyone who runs the workspace-scoped command and gets stale `dist` artifacts. Turbo's `test.dependsOn: ['^build']` masks the issue in CI but not locally.
**Suggested Fix:** Either (a) re-export aliases from root vitest config in apps/web vitest, or (b) delete `apps/web/vitest.config.ts` entirely and rely on the root config + `--project apps/web` filter. Option (b) is simpler.

### [Mid] FN-07 — Single `vercel.json` exists but has no `regions`, `functions`, or framework function-runtime overrides
**File:** `vercel.json:1-7`
**Issue:** Only sets `framework: nextjs`, `installCommand`, `buildCommand`. No `regions` (defaults to all/automatic). No `functions` block (defaults to Node + standard limits — Fluid Compute is the user's stated target per CLAUDE.md but no runtime config asserts that). No `headers`/`crons` block — but `packages/inngest` mentions Cron, which lives in Inngest Cloud (correct). `--frozen-lockfile=false` in installCommand is risky.
**Why Mid:** Defaults work for now, but production-grade Fluid Compute, EU-residency (relevant for SaaS pricing redesign / Stripe Tax), and explicit function memory limits are not asserted. `--frozen-lockfile=false` makes Vercel installs silently accept lockfile drift.
**Suggested Fix:** Change `installCommand` to `cd ../.. && pnpm install --frozen-lockfile` (no `=false`). Add:
```json
"regions": ["fra1"],
"functions": {
  "apps/web/src/app/api/**/route.ts": { "memory": 1024, "maxDuration": 30 }
}
```
Document Fluid-Compute decision explicitly (or via ADR).

### [Mid] FN-08 — `next.config.ts` missing PPR / Cache Components experimental flag despite CLAUDE.md claim
**File:** `apps/web/next.config.ts:35-42`
**Issue:** CLAUDE.md tech-stack says "Next.js 16 + App Router + Cache Components". But `next.config.ts` has NO `experimental.cacheComponents`, no `experimental.ppr`, no `experimental.dynamicIO`. Only `experimental.optimizePackageImports` is set. Either the docs are aspirational (drift) or the config is missing the flag.
**Why Mid:** Cache Components in Next.js 16 require `experimental.cacheComponents: true` (or `dynamicIO` for the predecessor API). If the codebase uses `'use cache'`, `cacheLife`, `cacheTag` directives without this flag, those become no-ops in production builds and silently degrade performance.
**Suggested Fix:** Cross-reference with `apps/web/src/**` for `'use cache'` directive usage. If used, add `experimental.cacheComponents: true`. If not used yet, update CLAUDE.md tech-stack to reflect actual state.

### [Mid] FN-09 — `tsconfig` chain has no `paths` for `@vk/*` aliases at any level (workspace resolution only)
**File:** `tsconfig.base.json`, `apps/web/tsconfig.json:13-15`
**Issue:** apps/web only declares `"@/*": ["./src/*"]`. No `@vk/*` paths — relies entirely on pnpm workspace resolution + Next.js `transpilePackages`. This works at runtime, but IDE go-to-definition jumps to `dist/index.d.ts` instead of source `src/index.ts`. Workspace tsconfigs don't define `paths` for cross-package source resolution either.
**Why Mid:** Developer-experience cost. Refactoring across packages requires the dist build to exist; otherwise types are stale. Compare to the vitest setup which DOES alias to `src/index.ts` — the two are inconsistent.
**Suggested Fix:** Add `paths` to `tsconfig.base.json` (so all workspaces inherit) pointing `@vk/*` to `packages/*/src/index.ts`, matching the vitest aliases. Next.js will still use the runtime-resolved bundle.

### [Weak] FN-10 — No `prettier` config anywhere
**File:** Repo root (missing `.prettierrc*` / `prettier.config.*`)
**Issue:** No prettier config, no prettier dependency, no `format` script. Codebase formatting is by-convention only. The husky/lint-staged stub is set up to eventually run prettier but currently does nothing.
**Why Weak:** No active formatting drift visible (Claude-authored code is stylistically consistent), but the moment a second contributor lands, drift starts.
**Suggested Fix:** Add minimal `.prettierrc.json` (e.g. `{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 100 }`) and run `prettier --check` in CI. Wire into lint-staged in the same sub-plan that ships ESLint.

### [Weak] FN-11 — `.gitignore` lists `.vercel` twice (lines 11 + 38)
**File:** `.gitignore:11,38`
**Issue:** `.vercel/` on line 11 and `.vercel` on line 38 (trailing dup, no `/` suffix). Harmless duplication. Same file: `.env.local` on line 9 — but root `.env.local` is in the repo (visible in `ls -A`), so the rule is correct but the file was added before .gitignore caught it (or via `--force`).
**Why Weak:** Cosmetic. Verify `.env.local` is actually gitignored (`git check-ignore .env.local`).
**Suggested Fix:** Remove the duplicate line 38. Verify `.env.local` is not tracked: `git ls-files | grep env`. If it is, `git rm --cached` it.

### [Weak] FN-12 — No `.dockerignore` despite `docker-compose.yml` + `scripts/docker-e2e-smoke.sh`
**File:** Repo root (missing)
**Issue:** `docker-compose.yml` only runs vendor images (postgres, dragonfly, mailpit, inngest), so no build context — `.dockerignore` is technically not required. But if `docker-e2e-smoke.sh` or future containerized builds (`apps/web` Dockerfile) appear, the absence will copy `node_modules`, `.next`, `.turbo`, etc. into build contexts.
**Why Weak:** Speculative. Nothing currently builds a Docker image from the repo root.
**Suggested Fix:** Add a minimal `.dockerignore` mirroring `.gitignore` as preventive hygiene. Low priority.

### [Weak] FN-13 — `stripe:setup-test` script exists (`package.json:24`) and matches `.env.example:66` reference — OK
**File:** `package.json:24`, `.env.example:66`
**Issue:** Verified: the script exists and is wired via `dotenv-cli`. **No drift found** — this finding is a "verified OK" entry.
**Why Weak:** Audit requirement; no action.
**Suggested Fix:** None.

### [Mid] FN-14 — `apps/web/scripts/lighthouse-audit.sh` thresholds match Nova-2 spec but no `.lighthouserc*` file (no LHCI integration)
**File:** `apps/web/scripts/lighthouse-audit.sh:19-21`
**Issue:** Thresholds are correct (Perf 85 / A11y 95 / BP 95 — matches CLAUDE.md Nova-2 phase). But the script is a manual shell wrapper — there is no `.lighthouserc.json` enabling Lighthouse-CI Actions integration (e.g. `treosh/lighthouse-ci-action`). The CI workflow has zero Lighthouse coverage.
**Why Mid:** A11y/Perf gates exist only as a manual local hook. A regression in Nova-2's a11y posture (e.g. someone removes skip-links) will not block a PR. Tied to FN-01 (the broader CI gap).
**Suggested Fix:** Convert the bash script into a `.lighthouserc.json` consumable by `lhci autorun`. Wire `lhci autorun` into a new CI job (post-build, against `next start`). Use the same Perf 85 / A11y 95 / BP 95 thresholds via `assertions`.

### [Exceptional] FN-15 — Turbo cache + Vercel install/build wiring is clean despite monorepo complexity
**File:** `turbo.json:1-55`, `vercel.json:4-5`
**Issue:** N/A — positive finding.
**Why Exceptional:** Turbo `globalDependencies` correctly includes `tsconfig.base.json`, `.env.example`, and `pnpm-lock.yaml`. Build/test/typecheck have correct `dependsOn: ["^build"]` topological ordering. Outputs are properly scoped (`.next/**` excluding `.next/cache/**` — exactly what Vercel-CI cache-handling expects). Vercel `buildCommand` does the right thing (`cd ../..` to use root, filter to `@vk/web`, then run migrations). This is the kind of setup that takes 3 iterations to get right and stays out of the way once correct.
**Suggested Fix:** None. Document this in `docs/architecture.md` as the canonical monorepo-on-Vercel pattern.

---

## Workspace-Config-Matrix

| Workspace        | extends base | tsconfig strict | `engines.node` | scripts: test | scripts: lint | scripts: typecheck | type: module |
|------------------|--------------|-----------------|----------------|---------------|---------------|--------------------|--------------|
| **root**         | —            | (base) ✓        | `>=22.0.0`     | `vitest run`  | `turbo lint`  | `turbo typecheck`  | ✓            |
| `@vk/web`        | base         | (inherits) ✓    | ❌ missing     | `vitest run`  | stub `echo`   | `tsc --noEmit`     | ✓            |
| `@vk/core`       | base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/audit`      | base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/auth`       | base + jsx   | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/billing`    | base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/db`         | base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/fixes`      | base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/github-app` | base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/inngest`    | base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/llm`        | base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/parser`     | base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |
| `@vk/pr-workflow`| base         | (inherits) ✓    | ❌ missing     | ❌ none       | ❌ none       | `tsc --noEmit`     | ✓            |

**Observations:**
- Strict TS uniformly inherited from `tsconfig.base.json` (good).
- No workspace-level `test` scripts in packages — all unit tests run via root `vitest run` against `packages/**/*.test.ts`. Turbo's `test` pipeline depends on `^build` but only invokes workspaces that have a `test` script — meaning Turbo's test orchestration is effectively a no-op for packages.
- No package-level lint scripts. ESLint is absent everywhere.
- Naming convention for scripts is consistent (`build`/`dev`/`typecheck`/`clean`). `test` is inconsistent (some have it, most don't). `start`/`lint` only in apps/web (the latter as a stub).

---

## Cross-cutting Risks (Roll-up)

1. **CI gating is dangerously thin** (FN-01 + FN-14): no lint, no a11y/perf gate, eval-conflicts only post-merge. Single highest-leverage fix on this audit.
2. **Engines/Node-version pinning is loose** (FN-02 + FN-03): packageManager is precise but Node is `>=22` and `.nvmrc` is major-only.
3. **TS chain has multiple silent overrides** (FN-04 + FN-09): base target, missing `@vk/*` paths, drift between vitest-aliases and tsconfig-paths.
4. **Cache Components flag claim vs config drift** (FN-08): docs say PPR/Cache Components, config doesn't enable them.
5. **Vercel config is bare-minimum** (FN-07): no regions, no fluid-compute assertion, `--frozen-lockfile=false` is a code-smell on production installs.

**Recommended first sub-plan:** "ESLint flat-config + Lighthouse-CI + engines pinning" — single PR closes FN-01, FN-02, FN-03, FN-10, FN-14 (5 of 15 findings, including the only Kill-band item).
