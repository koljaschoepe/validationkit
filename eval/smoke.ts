/**
 * Smoke-eval — walks eval/golden-set/manifest.json and asserts the expected
 * shape for each entry. Foundation for the 30-File-Golden-Set per PRD §6.5
 * Phase-0-Gate-Criterion #7, FPR-target ≤ 15% per constraint #13.
 *
 * Run via `pnpm eval`.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { scanRepository } from "../packages/parser/src/index.js";
import { runAudit } from "../packages/audit/src/index.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "eval/golden-set/manifest.json");

interface ManifestEntry {
  id: string;
  kind: string;
  path: string;
  vendor_mix?: string[];
  expected: {
    min_files: number;
    max_files: number;
    min_findings: number;
    max_findings: number;
    must_categories: string[];
    must_not_categories?: string[];
  };
  notes?: string;
}

interface Manifest {
  version: number;
  entries: ManifestEntry[];
  target_size: number;
  current_size?: number;
  fpr_target: number;
}

async function main() {
  const raw = await readFile(MANIFEST_PATH, "utf8");
  const manifest = JSON.parse(raw) as Manifest;

  process.stdout.write(
    `Golden-Set: ${manifest.entries.length} / ${manifest.target_size} entries (target FPR ≤ ${(manifest.fpr_target * 100).toFixed(0)}%)\n\n`,
  );

  let failures = 0;

  for (const entry of manifest.entries) {
    const target = path.resolve(ROOT, entry.path);
    const scan = await scanRepository(target, {
      // Adversarial fixtures live under eval/golden-set, which is ignored by
      // default for normal users. Smoke-eval opts in for fixture-kind entries.
      includeExamples: entry.path.startsWith("examples/"),
      includeFixtures: entry.path.startsWith("eval/golden-set/"),
    });
    const report = await runAudit(scan);
    const cats = new Set(report.findings.map((f) => f.category));

    const checks: Array<[string, boolean, string]> = [
      [
        `files in [${entry.expected.min_files}, ${entry.expected.max_files}]`,
        scan.files.length >= entry.expected.min_files &&
          scan.files.length <= entry.expected.max_files,
        `got ${scan.files.length}`,
      ],
      [
        `findings in [${entry.expected.min_findings}, ${entry.expected.max_findings}]`,
        report.findings.length >= entry.expected.min_findings &&
          report.findings.length <= entry.expected.max_findings,
        `got ${report.findings.length}`,
      ],
      ...entry.expected.must_categories.map(
        (c): [string, boolean, string] => [
          `contains "${c}"`,
          cats.has(c as never),
          cats.has(c as never) ? "ok" : "missing",
        ],
      ),
      ...(entry.expected.must_not_categories ?? []).map(
        (c): [string, boolean, string] => [
          `does NOT contain "${c}"`,
          !cats.has(c as never),
          !cats.has(c as never) ? "ok" : "unexpected hit",
        ],
      ),
    ];

    const failed = checks.filter(([, ok]) => !ok);
    const status = failed.length === 0 ? "PASS" : "FAIL";
    process.stdout.write(
      `[${status}] ${entry.id.padEnd(28)} kind=${entry.kind.padEnd(20)} files=${scan.files.length} findings=${report.findings.length}\n`,
    );
    for (const [name, ok, detail] of checks) {
      process.stdout.write(`  ${ok ? "✓" : "✗"} ${name} (${detail})\n`);
    }
    if (failed.length > 0) failures += 1;
  }

  process.stdout.write(
    `\n${manifest.entries.length - failures}/${manifest.entries.length} golden-set entries pass.\n`,
  );

  if (failures > 0) {
    process.stderr.write(`${failures} entry/entries failed.\n`);
    process.exit(1);
  }
}

await main();
