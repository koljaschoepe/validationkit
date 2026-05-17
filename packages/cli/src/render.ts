import pc from "picocolors";
import {
  type AuditReport,
  type DriftReport,
  type ParserResult,
  type SeverityBand,
} from "@vk/core";

export function renderReport(report: AuditReport, scan: ParserResult): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(pc.bold(`Audit — ${report.rootPath}`));
  lines.push(
    pc.dim(
      `${report.fileCount} files scanned · ${report.findings.length} findings · overall: ${colorSev(report.summary.overallSeverity)}`,
    ),
  );
  lines.push("");

  if (report.findings.length === 0) {
    lines.push(
      pc.green("✓") +
        "  No findings. Either you're clean or the audit rules are too lenient.",
    );
    lines.push("");
    return lines.join("\n");
  }

  const sorted = [...report.findings].sort(
    (a, b) => sevOrder(a.severity) - sevOrder(b.severity),
  );

  for (const f of sorted) {
    lines.push(`${colorSev(f.severity)}  ${pc.bold(f.title)}`);
    lines.push(pc.dim(`   ${f.category}${f.deterministic ? "" : " (LLM)"}`));
    lines.push(`   ${f.detail}`);
    for (const c of f.citations) {
      lines.push(pc.dim(`   → ${c.path}${c.line ? ":" + c.line : ""}`));
    }
    lines.push("");
  }

  lines.push(pc.bold("Summary"));
  for (const [cat, n] of Object.entries(report.summary.byCategory)) {
    if (n === 0) continue;
    lines.push(`  ${pc.cyan(cat.padEnd(22))} ${n}`);
  }
  lines.push("");
  if (scan.warnings.length > 0) {
    lines.push(pc.yellow("Warnings:"));
    for (const w of scan.warnings) {
      lines.push(`  ${w.path}: ${w.message}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function renderDriftTable(drift: DriftReport): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(pc.bold(`Drift — A vs B`));
  lines.push(pc.dim(`  A: ${drift.pathA}  (${drift.filesA} files)`));
  lines.push(pc.dim(`  B: ${drift.pathB}  (${drift.filesB} files)`));
  lines.push(
    pc.dim(
      `${drift.items.length} drift item(s) · overall: ${colorSev(drift.summary.overallSeverity)}`,
    ),
  );
  lines.push("");

  if (drift.items.length === 0) {
    lines.push(pc.green("✓") + "  No drift. The two repos are in sync.");
    lines.push("");
    return lines.join("\n");
  }

  const sorted = [...drift.items].sort(
    (a, b) => sevOrder(a.severity) - sevOrder(b.severity),
  );

  for (const item of sorted) {
    lines.push(`${colorSev(item.severity)}  ${pc.bold(item.title)}`);
    lines.push(pc.dim(`   ${item.kind}`));
    lines.push(`   ${item.detail}`);
    lines.push("");
  }

  lines.push(pc.bold("Summary"));
  for (const [kind, n] of Object.entries(drift.summary.byKind)) {
    if (n === 0) continue;
    lines.push(`  ${pc.cyan(kind.padEnd(22))} ${n}`);
  }
  lines.push("");
  return lines.join("\n");
}

function sevOrder(s: SeverityBand): number {
  return { Kill: 0, Weak: 1, Mid: 2, Strong: 3, Exceptional: 4 }[s];
}

function colorSev(s: SeverityBand): string {
  switch (s) {
    case "Kill":
      return pc.red(pc.bold("[KILL] "));
    case "Weak":
      return pc.red("[WEAK] ");
    case "Mid":
      return pc.yellow("[MID]  ");
    case "Strong":
      return pc.green("[STRG] ");
    case "Exceptional":
      return pc.green(pc.bold("[EXC]  "));
  }
}
