import { existsSync } from "node:fs";
import path from "node:path";
import type { AuditFinding, ParserResult } from "@vk/core";

const SKIP_PREFIXES = ["http://", "https://", "mailto:", "tel:"];
const SKIP_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".svg"]);

export function checkStaleReferences(scan: ParserResult): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const f of scan.files) {
    if (f.outlinks.length === 0) continue;
    const fileDir = path.dirname(f.absolutePath);

    for (const link of f.outlinks) {
      if (SKIP_PREFIXES.some((p) => link.startsWith(p))) continue;
      if (SKIP_EXTENSIONS.has(path.extname(link).toLowerCase())) continue;
      const cleaned = link.split("?")[0]?.split("#")[0] ?? link;
      if (!cleaned) continue;

      const candidates = [
        path.resolve(fileDir, cleaned),
        path.resolve(scan.rootPath, cleaned),
      ];

      const exists = candidates.some((c) => existsSync(c));
      if (!exists) {
        findings.push({
          id: `stale-ref:${f.relativePath}:${cleaned}`,
          category: "stale-reference",
          severity: "Mid",
          title: `${f.relativePath} → "${cleaned}" not found`,
          detail:
            "Outbound reference points to a file that does not exist. " +
            "Fix the path or remove the stale link.",
          citations: [{ path: f.relativePath }],
          deterministic: true,
        });
      }
    }
  }
  return findings;
}
