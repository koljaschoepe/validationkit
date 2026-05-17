import type { AuditFinding, ParserResult, SeverityBand } from "@vk/core";

export function checkContextBloat(
  scan: ParserResult,
  thresholdTokens: number,
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const f of scan.files) {
    if (f.tokenCount <= thresholdTokens) continue;

    const severity: SeverityBand =
      f.tokenCount > thresholdTokens * 3
        ? "Kill"
        : f.tokenCount > thresholdTokens * 1.5
          ? "Weak"
          : "Mid";

    findings.push({
      id: `context-bloat:${f.relativePath}`,
      category: "context-bloat",
      severity,
      title: `${f.relativePath} is ${f.tokenCount.toLocaleString()} tokens (limit ${thresholdTokens.toLocaleString()})`,
      detail:
        "Large context files erode every prompt. Split by topic or move " +
        "long sections into linked docs.",
      citations: [{ path: f.relativePath }],
      deterministic: true,
    });
  }
  return findings;
}
