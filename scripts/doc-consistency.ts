/**
 * doc-consistency.ts — checkt ob CLAUDE.md + vision.md Tech-Stack-Tabellen
 * synchron mit den `package.json`-Files sind.
 *
 * Failure-Modes:
 * - **MISSING:** Ein Major-Lib aus CLAUDE.md/vision.md ist in keinem
 *   `package.json` deklariert (Doku ↔ Code Drift).
 * - **UNREFERENCED:** Ein Major-Lib aus apps/web/package.json wird in
 *   CLAUDE.md/vision.md nicht erwähnt (z.B. PixiJS-Reste in Code, aber
 *   Doku sagt nur SVG).
 *
 * Exit-Code 1 wenn Findings, sonst 0. Default-Modus ist **warning-only**
 * (Exit 0). Pass --strict für Hard-Fail.
 *
 * Lauf via `pnpm doc:check`.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");

// Major libs we want to track. Add new entries here when a tech-stack-row
// is added to CLAUDE.md or vision.md.
const TRACKED_LIBS = [
  "next",
  "react",
  "better-auth",
  "drizzle-orm",
  "@ai-sdk/anthropic",
  "@ai-sdk/openai",
  "tailwindcss",
  "stripe",
  "inngest",
  "pixi.js",
  "motion",
  "lucide-react",
  "nodemailer",
];

function readMaybe(path: string): string | null {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

function gatherPackageDeps(): Set<string> {
  const deps = new Set<string>();
  const packageJsonPaths = [
    join(repoRoot, "package.json"),
    join(repoRoot, "apps/web/package.json"),
  ];
  // Workspace packages
  for (const pkg of [
    "audit",
    "auth",
    "billing",
    "core",
    "db",
    "fixes",
    "github-app",
    "inngest",
    "llm",
    "parser",
    "pr-workflow",
  ]) {
    packageJsonPaths.push(join(repoRoot, "packages", pkg, "package.json"));
  }
  for (const path of packageJsonPaths) {
    const raw = readMaybe(path);
    if (!raw) continue;
    const json = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    for (const section of [
      json.dependencies,
      json.devDependencies,
      json.peerDependencies,
    ]) {
      if (!section) continue;
      for (const dep of Object.keys(section)) {
        deps.add(dep);
      }
    }
  }
  return deps;
}

function gatherDocMentions(): Set<string> {
  const mentions = new Set<string>();
  const docs = [
    join(repoRoot, ".claude/CLAUDE.md"),
    join(repoRoot, "docs/vision.md"),
  ];
  for (const path of docs) {
    const raw = readMaybe(path);
    if (!raw) continue;
    for (const lib of TRACKED_LIBS) {
      // Exact-string + version-prefix tolerance. lucide-react, @ai-sdk/openai, etc.
      const escaped = lib.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "i");
      if (re.test(raw)) {
        mentions.add(lib);
      }
    }
  }
  return mentions;
}

function main() {
  const strict = process.argv.includes("--strict");
  const installedDeps = gatherPackageDeps();
  const docMentions = gatherDocMentions();

  const missing: string[] = [];
  const unreferenced: string[] = [];

  for (const lib of TRACKED_LIBS) {
    const installed = installedDeps.has(lib);
    const mentioned = docMentions.has(lib);

    if (mentioned && !installed) {
      missing.push(lib);
    }
    if (installed && !mentioned) {
      unreferenced.push(lib);
    }
  }

  console.log("doc-consistency report\n");

  if (missing.length === 0 && unreferenced.length === 0) {
    console.log("✓ All tracked libs consistent between docs and package.json.");
    process.exit(0);
  }

  if (missing.length > 0) {
    console.log(
      `\n  MISSING (mentioned in docs, not installed):`,
    );
    for (const lib of missing) console.log(`    - ${lib}`);
  }
  if (unreferenced.length > 0) {
    console.log(
      `\n  UNREFERENCED (installed, not mentioned in docs):`,
    );
    for (const lib of unreferenced) console.log(`    - ${lib}`);
  }

  console.log(
    `\n  Total: ${missing.length} missing, ${unreferenced.length} unreferenced.`,
  );

  if (strict) {
    console.log("\n  --strict mode: failing.");
    process.exit(1);
  }
  console.log("\n  Warning-only mode. Pass --strict to fail CI on these.");
  process.exit(0);
}

main();
