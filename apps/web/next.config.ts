import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const here = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  transpilePackages: [
    "@vk/core",
    "@vk/parser",
    "@vk/audit",
    "@vk/billing",
    "@vk/drift",
    "@vk/auth",
    "@vk/db",
    "@vk/fixes",
    "@vk/pr-workflow",
    "@vk/github-app",
    "@vk/inngest",
    "@vk/bip-generator",
  ],
  serverExternalPackages: [
    "fast-glob",
    "gray-matter",
    "postgres",
    "better-auth",
    "nodemailer",
    "inngest",
  ],
  turbopack: {
    root: path.resolve(here, "..", ".."),
  },
  typedRoutes: true,
  // Bundle markdown + JSON read at runtime by route handlers.
  // Sprint 1.0: legal markdown for /trust/dpa + sub-processors.
  // Sprint 1.5: eval-results JSON for /trust/eval + per-customer onboarding md.
  outputFileTracingIncludes: {
    "/trust/dpa": ["../../docs/legal/dpa-template.md"],
    "/trust/sub-processors.json": ["../../docs/legal/sub-processors.md"],
    "/trust/sub-processors.xml": ["../../docs/legal/sub-processors.md"],
    "/trust/eval": ["../../eval/conflicts/results/*.json"],
    "/onboarding/[slug]": ["../../docs/customer-onboarding/*.md"],
  },
};

export default config;
