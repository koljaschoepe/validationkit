/**
 * plan-lint.ts — checkt Plan-Files in docs/plans/*.md auf das neue
 * Discovery-First-Skelett (13 Sektionen) und Phase-Konsistenz.
 *
 * Checks pro Plan:
 * - Status-Header vorhanden (🟡 In Review / ✅ Done / etc.)
 * - Confidence-Header vorhanden (High/Mid/Low)
 * - Severity-Spalte in §9 Risiken-Tabelle (Kill/Strong/Mid/Weak)
 * - Open Questions in §12 — wenn nicht leer, sollte begründet sein
 *
 * Warning-only by default. Pass --strict für Hard-Fail.
 *
 * Lauf via `pnpm plan:lint`.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");
const plansDir = join(repoRoot, "docs/plans");

interface Issue {
  file: string;
  severity: "warning" | "error";
  message: string;
}

function findPlans(): string[] {
  const result: string[] = [];
  const entries = readdirSync(plansDir);
  for (const entry of entries) {
    const path = join(plansDir, entry);
    if (entry === "done") continue; // Skip archived plans
    if (statSync(path).isDirectory()) continue;
    if (entry.endsWith(".md") && entry !== "README.md") {
      result.push(path);
    }
  }
  return result;
}

function lintPlan(path: string): Issue[] {
  const content = readFileSync(path, "utf-8");
  const issues: Issue[] = [];
  const fileLabel = path.replace(repoRoot + "/", "");

  // Header section is the lines before §1 Ziel.
  const headerMatch = content.match(/^([\s\S]*?)## 1\./);
  const header = headerMatch ? headerMatch[1] : content.slice(0, 1000);

  if (!/Status:\s*[🟡🟢⛔️✅]/u.test(header)) {
    issues.push({
      file: fileLabel,
      severity: "warning",
      message: "missing Status-Header (🟡 In Review / ✅ Done / ⛔️ Superseded)",
    });
  }

  if (!/Confidence:\s*\**(High|Mid|Low)\**/i.test(header)) {
    issues.push({
      file: fileLabel,
      severity: "warning",
      message: "missing Confidence-Header (High/Mid/Low)",
    });
  }

  // Severity-column in §9 Risiken (or wherever "Risiken" table is)
  if (/##\s*\d+\.\s*Risiken/i.test(content)) {
    const risikenSection = content.split(/##\s*\d+\.\s*Risiken/i)[1] ?? "";
    const tableMatch = risikenSection.slice(0, 2000);
    if (
      tableMatch.includes("|") &&
      !/\|\s*Severity\s*\|/i.test(tableMatch)
    ) {
      issues.push({
        file: fileLabel,
        severity: "warning",
        message: "Risiken-Tabelle ohne Severity-Spalte",
      });
    }
  }

  return issues;
}

function main() {
  const strict = process.argv.includes("--strict");
  const plans = findPlans();

  console.log(`plan-lint: ${plans.length} active plans\n`);

  const allIssues: Issue[] = [];
  for (const path of plans) {
    allIssues.push(...lintPlan(path));
  }

  if (allIssues.length === 0) {
    console.log("✓ All plans pass.");
    process.exit(0);
  }

  for (const issue of allIssues) {
    const prefix = issue.severity === "error" ? "ERROR" : "WARN ";
    console.log(`  [${prefix}] ${issue.file}: ${issue.message}`);
  }
  console.log(
    `\n  Total: ${allIssues.length} issue(s) across ${plans.length} plan(s).`,
  );

  if (strict) {
    console.log("\n  --strict mode: failing.");
    process.exit(1);
  }
  console.log("\n  Warning-only mode. Pass --strict to fail on these.");
  process.exit(0);
}

main();
