import {
  type AuditFinding,
  type AuditReport,
  type DriftItem,
  type DriftReport,
  type ParserResult,
  type SeverityBand,
} from "@vk/core";

const SEV_RANK: Record<SeverityBand, number> = {
  Kill: 0,
  Weak: 1,
  Mid: 2,
  Strong: 3,
  Exceptional: 4,
};

export function renderMarkdownReport(
  report: AuditReport,
  scan: ParserResult,
): string {
  const lines: string[] = [];
  const date = report.generatedAt.toISOString().slice(0, 10);

  lines.push(`# Audit Report — ${path(report.rootPath)}`);
  lines.push("");
  lines.push(`> Generated ${date} by ValidationKit v0.0.10 · deterministic-first`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Files scanned | ${report.fileCount} |`);
  lines.push(`| Findings | ${report.findings.length} |`);
  lines.push(`| Overall severity | **${report.summary.overallSeverity}** |`);
  lines.push(`| Parser warnings | ${scan.warnings.length} |`);
  lines.push("");

  if (Object.values(report.summary.byCategory).some((n) => n > 0)) {
    lines.push("### By Category");
    lines.push("");
    lines.push(`| Category | Findings |`);
    lines.push(`|---|---|`);
    for (const [cat, n] of Object.entries(report.summary.byCategory)) {
      if (n === 0) continue;
      lines.push(`| \`${cat}\` | ${n} |`);
    }
    lines.push("");
  }

  lines.push("## Findings");
  lines.push("");
  if (report.findings.length === 0) {
    lines.push(
      "_Concession_: audit ran cleanly against this rule set. " +
        "_Critique_: 4-rule deterministic-first set is intentionally narrow — " +
        "a green report is the absence of red flags, not proof of quality.",
    );
    lines.push("");
  } else {
    const sorted = [...report.findings].sort(
      (a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity],
    );
    for (const f of sorted) {
      lines.push(...renderFinding(f));
    }
  }

  lines.push("## Inventory");
  lines.push("");
  lines.push(`| Kind | Path | Tokens | Lines | Modified |`);
  lines.push(`|---|---|---:|---:|---|`);
  for (const f of scan.files) {
    const mod = f.lastModified ? f.lastModified.toISOString().slice(0, 10) : "—";
    lines.push(
      `| \`${f.kind}\` | \`${f.relativePath}\` | ${f.tokenCount.toLocaleString()} | ${f.lineCount} | ${mod} |`,
    );
  }
  lines.push("");

  if (scan.warnings.length > 0) {
    lines.push("## Parser Warnings");
    lines.push("");
    for (const w of scan.warnings) {
      lines.push(`- \`${w.path}\` — ${w.message}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(
    "_ValidationKit · cross-vendor agent-file trust. 5 of 6 finding categories are deterministic. " +
      "Conflicting-rules is the only LLM-augmented check and uses confidence banding._",
  );
  lines.push("");

  return lines.join("\n");
}

function renderFinding(f: AuditFinding): string[] {
  const out: string[] = [];
  out.push(`### [${f.severity}] ${f.title}`);
  out.push("");
  out.push(`- **Category:** \`${f.category}\`${f.deterministic ? "" : " (LLM)"}`);
  if (f.confidence) {
    out.push(`- **Confidence:** ${f.confidence}`);
  }
  out.push(`- **Detail:** ${f.detail}`);
  if (f.citations.length > 0) {
    const cites = f.citations
      .map((c) => `\`${c.path}${c.line ? ":" + c.line : ""}\``)
      .join(", ");
    out.push(`- **Citations:** ${cites}`);
  }
  out.push("");
  return out;
}

function path(p: string): string {
  return p.replace(process.env.HOME ?? "", "~");
}

export function renderMarkdownDrift(drift: DriftReport): string {
  const lines: string[] = [];
  const date = drift.generatedAt.toISOString().slice(0, 10);

  lines.push("# Drift Report");
  lines.push("");
  lines.push(`> Generated ${date} by ValidationKit v0.0.10`);
  lines.push("");
  lines.push(`- **A:** \`${path(drift.pathA)}\` — ${drift.filesA} files`);
  lines.push(`- **B:** \`${path(drift.pathB)}\` — ${drift.filesB} files`);
  lines.push(`- **Overall severity:** **${drift.summary.overallSeverity}**`);
  lines.push(`- **Total drift items:** ${drift.items.length}`);
  lines.push("");

  if (drift.items.length === 0) {
    lines.push("_The two repos are in sync. No drift detected._");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Drift Items");
  lines.push("");
  const sorted = [...drift.items].sort((a, b) => {
    const sevDiff = sevRank(a.severity) - sevRank(b.severity);
    if (sevDiff !== 0) return sevDiff;
    return a.relativePath.localeCompare(b.relativePath);
  });

  for (const item of sorted) {
    lines.push(...renderDriftItemMarkdown(item));
  }

  lines.push("---");
  lines.push("");
  lines.push(
    "_ValidationKit · deterministic drift: file presence, frontmatter, body similarity, token-count._",
  );
  lines.push("");
  return lines.join("\n");
}

function renderDriftItemMarkdown(item: DriftItem): string[] {
  const out: string[] = [];
  out.push(`### [${item.severity}] ${item.title}`);
  out.push("");
  out.push(`- **Kind:** \`${item.kind}\``);
  out.push(`- **Path:** \`${item.relativePath}\``);
  if (item.fieldsChanged && item.fieldsChanged.length > 0) {
    out.push(`- **Fields changed:** ${item.fieldsChanged.join(", ")}`);
  }
  if (typeof item.similarity === "number") {
    out.push(`- **Body similarity:** ${(item.similarity * 100).toFixed(0)}%`);
  }
  if (
    typeof item.tokensA === "number" &&
    typeof item.tokensB === "number"
  ) {
    out.push(`- **Tokens:** A=${item.tokensA} · B=${item.tokensB}`);
  }
  out.push(`- **Detail:** ${item.detail}`);
  out.push("");
  return out;
}

function sevRank(s: SeverityBand): number {
  return SEV_RANK[s];
}
