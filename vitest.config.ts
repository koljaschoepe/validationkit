// Vitest config root — Nova-3b Sub-A introduces a pool-split via
// `test.projects`. The legacy `pnpm test` command runs the unit project
// only; `pnpm test:integration` runs both.
//
// Why projects (not the deprecated vitest.workspace.ts):
//   - workspace.ts merged extends-config in surprising ways (include from
//     the parent leaked into every project).
//   - test.projects keeps each project's include/exclude/setupFiles fully
//     scoped and is the current officially-supported pattern.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

const aliases = {
  "@/": path.resolve(here, "apps/web/src") + "/",
  "@vk/core": path.resolve(here, "packages/core/src/index.ts"),
  "@vk/parser": path.resolve(here, "packages/parser/src/index.ts"),
  "@vk/audit": path.resolve(here, "packages/audit/src/index.ts"),
  "@vk/llm": path.resolve(here, "packages/llm/src/index.ts"),
  "@vk/db": path.resolve(here, "packages/db/src/index.ts"),
  "@vk/auth": path.resolve(here, "packages/auth/src/index.ts"),
  "@vk/pr-workflow": path.resolve(here, "packages/pr-workflow/src/index.ts"),
  "@vk/github-app": path.resolve(here, "packages/github-app/src/index.ts"),
  "@vk/inngest": path.resolve(here, "packages/inngest/src/index.ts"),
};

export default defineConfig({
  resolve: { alias: aliases },
  test: {
    reporters: process.env.CI ? "default" : "verbose",
    projects: [
      {
        resolve: { alias: aliases },
        test: {
          name: "unit",
          include: [
            "packages/**/*.test.ts",
            "apps/web/src/**/*.test.{ts,tsx}",
          ],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/*.integration.test.ts",
          ],
          environment: "node",
          pool: "threads",
          setupFiles: ["./apps/web/src/test/setup.ts"],
        },
      },
      {
        resolve: { alias: aliases },
        test: {
          name: "integration",
          include: [
            "packages/**/*.integration.test.ts",
            "apps/web/src/**/*.integration.test.ts",
          ],
          exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
          environment: "node",
          pool: "forks",
          setupFiles: ["./apps/web/src/test/setup-integration.ts"],
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
