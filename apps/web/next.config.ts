import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const here = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  transpilePackages: [
    "@vk/core",
    "@vk/parser",
    "@vk/audit",
    "@vk/drift",
    "@vk/auth",
    "@vk/db",
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
};

export default config;
