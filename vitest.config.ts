import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@vk/core": path.resolve(here, "packages/core/src/index.ts"),
      "@vk/parser": path.resolve(here, "packages/parser/src/index.ts"),
      "@vk/audit": path.resolve(here, "packages/audit/src/index.ts"),
      "@vk/drift": path.resolve(here, "packages/drift/src/index.ts"),
      "@vk/llm": path.resolve(here, "packages/llm/src/index.ts"),
      "@vk/db": path.resolve(here, "packages/db/src/index.ts"),
      "@vk/auth": path.resolve(here, "packages/auth/src/index.ts"),
      "@vk/pr-workflow": path.resolve(
        here,
        "packages/pr-workflow/src/index.ts",
      ),
      "@vk/github-app": path.resolve(
        here,
        "packages/github-app/src/index.ts",
      ),
      "@vk/inngest": path.resolve(here, "packages/inngest/src/index.ts"),
      "@vk/bip-generator": path.resolve(
        here,
        "packages/bip-generator/src/index.ts",
      ),
    },
  },
  test: {
    include: ["packages/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    environment: "node",
    pool: "threads",
    reporters: process.env.CI ? "default" : "verbose",
  },
});
