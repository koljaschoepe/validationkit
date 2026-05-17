import type { AuditFinding, ParserResult } from "@vk/core";
import type { FixProposal } from "./types.js";
import { FixContextError } from "./types.js";
import { fileDeletePatch } from "./unified-diff.js";

export function generateUnusedAgentFix(
  finding: AuditFinding,
  scan: ParserResult,
): FixProposal {
  const target = finding.citations[0]?.path;
  if (!target) {
    throw new FixContextError(
      "unused-agent finding has no citation; cannot generate delete patch.",
    );
  }
  const file = scan.files.find((f) => f.relativePath === target);
  if (!file) {
    throw new FixContextError(
      `unused-agent finding references "${target}" but no parsed file matched.`,
    );
  }
  const patch = fileDeletePatch(file.relativePath, file.rawContent);
  return {
    findingId: finding.id,
    category: "unused-agent",
    rationale: `Delete ${file.relativePath}. No other parsed file references this agent by name or filename stem.`,
    patch,
    filesTouched: [file.relativePath],
    deterministic: true,
    confidence: "high",
  };
}
