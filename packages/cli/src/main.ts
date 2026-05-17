import path from "node:path";
import pc from "picocolors";
import { scanRepository } from "@vk/parser";
import { runAudit } from "@vk/audit";
import { computeDrift } from "@vk/drift";
import { renderReport, renderDriftTable } from "./render.js";

const HELP = `
${pc.bold("validationkit")} — cross-vendor agent-file audit

USAGE
  validationkit audit <path>             scan a repo and print the audit report
  validationkit drift <pathA> <pathB>    compare two repos for template drift
  validationkit inventory <path>         list all detected agent files
  validationkit --help                   show this message

OPTIONS
  --json                emit machine-readable JSON instead of a table
  --out=<path>          write a Markdown report to <path>
  --include-archive     walk into docs/archive/ (skipped by default)
  --include-examples    walk into examples/ (skipped by default)

EXIT CODES
  0   no findings / no drift
  1   findings present / drift present
  2   tool error
`;

export async function main(argv: string[]): Promise<void> {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    process.stdout.write(HELP.trimStart() + "\n");
    return;
  }

  const cmd = argv[0];
  const rest = argv.slice(1);
  const json = rest.includes("--json");
  const includeArchive = rest.includes("--include-archive");
  const includeExamples = rest.includes("--include-examples");
  const outFlag = rest.find((a) => a.startsWith("--out="));
  const outPath = outFlag ? outFlag.slice("--out=".length) : null;
  const positional = rest.filter((a) => !a.startsWith("--"));
  const target = positional[0] ?? process.cwd();
  const absTarget = path.resolve(target);

  switch (cmd) {
    case "inventory":
      await runInventory(absTarget, { json, includeArchive, includeExamples });
      return;
    case "audit":
      await runAuditCmd(absTarget, {
        json,
        includeArchive,
        includeExamples,
        outPath,
      });
      return;
    case "drift": {
      const second = positional[1];
      if (!second) {
        process.stderr.write("drift requires two paths.\n" + HELP);
        process.exit(2);
      }
      await runDriftCmd(absTarget, path.resolve(second), {
        json,
        includeArchive,
        includeExamples,
        outPath,
      });
      return;
    }
    default:
      process.stderr.write(`Unknown command: ${cmd}\n${HELP}`);
      process.exit(2);
  }
}

async function runInventory(
  target: string,
  opts: { json: boolean; includeArchive: boolean; includeExamples: boolean },
): Promise<void> {
  const scan = await scanRepository(target, {
    includeArchive: opts.includeArchive,
    includeExamples: opts.includeExamples,
  });

  if (opts.json) {
    process.stdout.write(JSON.stringify(scan, null, 2) + "\n");
    return;
  }

  process.stdout.write(
    pc.bold(`\nInventory — ${scan.rootPath}\n`) +
      pc.dim(`${scan.files.length} agent file(s), scanned ${scan.scannedAt.toISOString()}\n\n`),
  );
  for (const f of scan.files) {
    process.stdout.write(
      `  ${pc.cyan(f.kind.padEnd(20))}  ${f.relativePath}  ${pc.dim(`(${f.tokenCount} tok)`)}\n`,
    );
  }
  if (scan.warnings.length > 0) {
    process.stdout.write("\n" + pc.yellow("Warnings:") + "\n");
    for (const w of scan.warnings) {
      process.stdout.write(`  ${w.path}: ${w.message}\n`);
    }
  }
}

async function runDriftCmd(
  pathA: string,
  pathB: string,
  opts: {
    json: boolean;
    includeArchive: boolean;
    includeExamples: boolean;
    outPath: string | null;
  },
): Promise<void> {
  const [scanA, scanB] = await Promise.all([
    scanRepository(pathA, {
      includeArchive: opts.includeArchive,
      includeExamples: opts.includeExamples,
    }),
    scanRepository(pathB, {
      includeArchive: opts.includeArchive,
      includeExamples: opts.includeExamples,
    }),
  ]);
  const drift = computeDrift(scanA, scanB);

  if (opts.outPath) {
    const { renderMarkdownDrift } = await import("./markdown.js");
    const fs = await import("node:fs/promises");
    await fs.writeFile(opts.outPath, renderMarkdownDrift(drift), "utf8");
    process.stderr.write(`Wrote ${opts.outPath}\n`);
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify(drift, null, 2) + "\n");
    process.exit(drift.items.length > 0 ? 1 : 0);
  }

  process.stdout.write(renderDriftTable(drift));
  process.exit(drift.items.length > 0 ? 1 : 0);
}

async function runAuditCmd(
  target: string,
  opts: {
    json: boolean;
    includeArchive: boolean;
    includeExamples: boolean;
    outPath: string | null;
  },
): Promise<void> {
  const scan = await scanRepository(target, {
    includeArchive: opts.includeArchive,
    includeExamples: opts.includeExamples,
  });
  const report = await runAudit(scan);

  if (opts.outPath) {
    const { renderMarkdownReport } = await import("./markdown.js");
    const fs = await import("node:fs/promises");
    await fs.writeFile(opts.outPath, renderMarkdownReport(report, scan), "utf8");
    process.stderr.write(`Wrote ${opts.outPath}\n`);
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    process.exit(report.findings.length > 0 ? 1 : 0);
  }

  process.stdout.write(renderReport(report, scan));
  process.exit(report.findings.length > 0 ? 1 : 0);
}
