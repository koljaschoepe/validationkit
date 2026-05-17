/**
 * Conflicting-rules LLM eval. Calls @vk/llm's checkConflictingRules() across
 * each pair in dataset.json and reports FPR + FNR against PRD constraint #13.
 *
 * No-op when ANTHROPIC_API_KEY is unset (Hardcore-Local-Only respect).
 *
 * Run via `pnpm tsx eval/conflicts/run.ts`.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { checkConflictingRules } from "../../packages/llm/src/index.js";
import type {
  AgentFileKind,
  ParsedAgentFile,
  ParserResult,
} from "../../packages/core/src/index.js";

const ROOT = path.resolve(import.meta.dirname);
const DATASET = path.join(ROOT, "dataset.json");

interface DatasetPair {
  id: string;
  kind: string;
  file_a: { path: string; body: string };
  file_b: { path: string; body: string };
  expected: {
    conflict: boolean;
    min_confidence?: "low" | "mid" | "high";
    max_confidence?: "low" | "mid" | "high";
    reason_must_mention?: string[];
  };
}

interface Dataset {
  pairs: DatasetPair[];
  fpr_target: number;
}

function fakeFile(p: { path: string; body: string }): ParsedAgentFile {
  return {
    kind: kindFromPath(p.path),
    absolutePath: `/tmp/eval/${p.path}`,
    relativePath: p.path,
    rawContent: p.body,
    body: p.body,
    frontmatter: {},
    tokenCount: Math.ceil(p.body.length / 3.5),
    lineCount: p.body.split(/\r?\n/).length,
    byteSize: p.body.length,
    lastModified: new Date(),
    name: null,
    description: null,
    outlinks: [],
  };
}

function kindFromPath(p: string): AgentFileKind {
  if (p === "CLAUDE.md") return "claude-md";
  if (p === "AGENTS.md") return "agents-md";
  if (p.includes(".cursor/rules/")) return "cursor-rule-mdc";
  if (p.includes(".windsurf/rules")) return "windsurf-rule";
  return "claude-md";
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stdout.write(
      "ANTHROPIC_API_KEY unset — LLM-rule no-op, eval skipped.\n" +
        "Hardcore-Local-Only: this is expected. Set the key to actually evaluate.\n",
    );
    process.exit(0);
  }

  const raw = await readFile(DATASET, "utf8");
  const data = JSON.parse(raw) as Dataset;

  let falsePositives = 0;
  let falseNegatives = 0;
  let passes = 0;
  const nonConflictTotal = data.pairs.filter(
    (p) => p.expected.conflict === false,
  ).length;

  for (const pair of data.pairs) {
    const scan: ParserResult = {
      rootPath: "/tmp/eval",
      scannedAt: new Date(),
      files: [fakeFile(pair.file_a), fakeFile(pair.file_b)],
      warnings: [],
    };
    const findings = await checkConflictingRules(scan, {
      minConfidence: "low",
    });

    const flagged = findings.length > 0;
    const ok = flagged === pair.expected.conflict;

    if (ok) {
      passes += 1;
      process.stdout.write(`[PASS] ${pair.id}\n`);
    } else if (pair.expected.conflict === false && flagged) {
      falsePositives += 1;
      process.stdout.write(
        `[FAIL-FP] ${pair.id} — flagged as conflict but expected non-conflict\n`,
      );
    } else {
      falseNegatives += 1;
      process.stdout.write(
        `[FAIL-FN] ${pair.id} — expected conflict but not flagged\n`,
      );
    }
  }

  const fpr =
    nonConflictTotal > 0 ? falsePositives / nonConflictTotal : 0;

  process.stdout.write(`\n`);
  process.stdout.write(
    `Result: ${passes}/${data.pairs.length} pass · FPR ${(fpr * 100).toFixed(0)}% (target ≤ ${(data.fpr_target * 100).toFixed(0)}%) · FN ${falseNegatives}\n`,
  );
  if (fpr > data.fpr_target) {
    process.stderr.write(`FPR exceeded target.\n`);
    process.exit(1);
  }
}

await main();
