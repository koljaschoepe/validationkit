/**
 * Conflicting-rules LLM eval (Sprint 1.0 — per A2).
 *
 * Extensions over Sprint 0.5:
 *   - Per-confidence-band FPR (low / mid / high), not aggregate.
 *   - N=3 variance runs per pair. LLM determinism ≠ guaranteed; if one of
 *     three flips, the rule isn't stable enough for "deterministic-first".
 *   - Persist results to eval/conflicts/results/YYYY-MM-DD.json for the
 *     Trust-Center page (Constraint #14 mitigation).
 *
 * CI gate: fails when FPR at the `mid` confidence band exceeds the target
 * (default 15%). The lower / higher bands are reported for visibility but
 * do not gate.
 *
 * No-op when ANTHROPIC_API_KEY is unset.
 *
 * Run via `pnpm tsx eval/conflicts/run.ts`.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkConflictingRules } from "../../packages/llm/src/index.js";
import type {
  AgentFileKind,
  ParsedAgentFile,
  ParserResult,
} from "../../packages/core/src/index.js";

const ROOT = path.resolve(import.meta.dirname);
const DATASET = path.join(ROOT, "dataset.json");
const RESULTS_DIR = path.join(ROOT, "results");
const RUNS_PER_PAIR = Number(process.env.VK_EVAL_N ?? 3);
const BANDS = ["low", "mid", "high"] as const;
type Band = (typeof BANDS)[number];

interface DatasetPair {
  id: string;
  kind: string;
  file_a: { path: string; body: string };
  file_b: { path: string; body: string };
  expected: {
    conflict: boolean;
    min_confidence?: Band;
    max_confidence?: Band;
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

interface PerBandStats {
  passes: number;
  falsePositives: number;
  falseNegatives: number;
  nonConflictDenom: number;
  conflictDenom: number;
}

function emptyStats(): PerBandStats {
  return {
    passes: 0,
    falsePositives: 0,
    falseNegatives: 0,
    nonConflictDenom: 0,
    conflictDenom: 0,
  };
}

async function evaluatePair(
  pair: DatasetPair,
  band: Band,
): Promise<{ flagged: boolean; flips: number; runs: boolean[] }> {
  const scan: ParserResult = {
    rootPath: "/tmp/eval",
    scannedAt: new Date(),
    files: [fakeFile(pair.file_a), fakeFile(pair.file_b)],
    warnings: [],
  };

  const runs: boolean[] = [];
  for (let i = 0; i < RUNS_PER_PAIR; i += 1) {
    const findings = await checkConflictingRules(scan, {
      minConfidence: band,
    });
    runs.push(findings.length > 0);
  }
  // Majority vote across runs.
  const trues = runs.filter(Boolean).length;
  const flagged = trues > runs.length / 2;
  // Flips = max(trues, falses) of the minority; 0 = stable, >0 = unstable.
  const flips = Math.min(trues, runs.length - trues);
  return { flagged, flips, runs };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stdout.write(
      "ANTHROPIC_API_KEY unset — LLM-rule no-op, eval skipped.\n" +
        "Set the key to actually evaluate. Constraint #14 enforcement happens here.\n",
    );
    process.exit(0);
  }

  const raw = await readFile(DATASET, "utf8");
  const data = JSON.parse(raw) as Dataset;

  const conflictTotal = data.pairs.filter((p) => p.expected.conflict).length;
  const nonConflictTotal = data.pairs.length - conflictTotal;

  const byBand: Record<Band, PerBandStats> = {
    low: emptyStats(),
    mid: emptyStats(),
    high: emptyStats(),
  };
  for (const b of BANDS) {
    byBand[b].nonConflictDenom = nonConflictTotal;
    byBand[b].conflictDenom = conflictTotal;
  }

  // Per-pair instability — sum of flips across all bands. >0 = LLM is not
  // stable on this pair; warn but don't gate.
  const unstablePairs: Array<{ id: string; flips: number }> = [];

  for (const pair of data.pairs) {
    for (const band of BANDS) {
      const { flagged, flips } = await evaluatePair(pair, band);
      const stats = byBand[band];
      const ok = flagged === pair.expected.conflict;
      if (ok) {
        stats.passes += 1;
      } else if (!pair.expected.conflict && flagged) {
        stats.falsePositives += 1;
      } else {
        stats.falseNegatives += 1;
      }
      if (band === "mid") {
        if (flips > 0) unstablePairs.push({ id: pair.id, flips });
        process.stdout.write(
          `${ok ? "[PASS]" : flagged ? "[FAIL-FP]" : "[FAIL-FN]"} ${pair.id} (band=mid, flips=${flips}/${RUNS_PER_PAIR})\n`,
        );
      }
    }
  }

  const fprAt = (band: Band): number => {
    const s = byBand[band];
    return s.nonConflictDenom > 0 ? s.falsePositives / s.nonConflictDenom : 0;
  };
  const fnrAt = (band: Band): number => {
    const s = byBand[band];
    return s.conflictDenom > 0 ? s.falseNegatives / s.conflictDenom : 0;
  };

  process.stdout.write(`\n`);
  for (const band of BANDS) {
    process.stdout.write(
      `band=${band}: ${byBand[band].passes}/${data.pairs.length} pass · ` +
        `FPR ${(fprAt(band) * 100).toFixed(0)}% · ` +
        `FNR ${(fnrAt(band) * 100).toFixed(0)}%\n`,
    );
  }
  if (unstablePairs.length > 0) {
    process.stdout.write(
      `\nUnstable pairs (N=${RUNS_PER_PAIR}, band=mid): ${unstablePairs
        .map((p) => `${p.id}(${p.flips})`)
        .join(", ")}\n`,
    );
  }

  // Persist results for /trust/eval page (Constraint #14 trust-mitigation).
  await mkdir(RESULTS_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const resultsFile = path.join(RESULTS_DIR, `${today}.json`);
  const summary = {
    runAt: new Date().toISOString(),
    runsPerPair: RUNS_PER_PAIR,
    fprTarget: data.fpr_target,
    bands: Object.fromEntries(
      BANDS.map((b) => [
        b,
        {
          passes: byBand[b].passes,
          falsePositives: byBand[b].falsePositives,
          falseNegatives: byBand[b].falseNegatives,
          fpr: fprAt(b),
          fnr: fnrAt(b),
        },
      ]),
    ),
    unstable: unstablePairs,
    pairCount: data.pairs.length,
  };
  await writeFile(resultsFile, JSON.stringify(summary, null, 2), "utf8");
  process.stdout.write(`\nResults written to ${resultsFile}\n`);

  // CI gate: only the `mid` band fails the build.
  const midFpr = fprAt("mid");
  if (midFpr > data.fpr_target) {
    process.stderr.write(
      `FPR at mid band ${(midFpr * 100).toFixed(0)}% exceeds target ${(data.fpr_target * 100).toFixed(0)}%.\n`,
    );
    process.exit(1);
  }
}

await main();
