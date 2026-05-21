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
    "@vk/auth",
    "@vk/db",
    "@vk/fixes",
    "@vk/pr-workflow",
    "@vk/github-app",
    "@vk/inngest",
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
  // Phase Nova-2 P7: tree-shake-friendly imports for the libraries we use most.
  // lucide-react is the dominant offender — without this, every imported icon
  // drags the full barrel-file into the build.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "d3-hierarchy",
      "d3-zoom",
      "d3-selection",
    ],
  },
  // Bundle markdown + JSON read at runtime by route handlers.
  // Sprint 1.0: legal markdown for /trust/dpa + sub-processors.
  // Sprint 1.5: eval-results JSON for /trust/eval + per-customer onboarding md.
  outputFileTracingIncludes: {
    "/trust/dpa": ["../../docs/legal/dpa-template.md"],
    "/trust/sub-processors.json": ["../../docs/legal/sub-processors.md"],
    "/trust/sub-processors.xml": ["../../docs/legal/sub-processors.md"],
    "/trust/eval": ["../../eval/conflicts/results/*.json"],
  },
  async redirects() {
    return [
      // Phase Nova-2 P5: user-scope settings moved out of the workspace tree.
      // Hard-redirect old bookmarks at the edge so the in-app page doesn't
      // need to render at all.
      {
        source: "/:workspace/settings/user",
        destination: "/account/settings/profile",
        permanent: true,
      },
      {
        source: "/:workspace/settings/user/:path*",
        destination: "/account/settings/profile",
        permanent: true,
      },
    ];
  },
};

export default config;
