import type { AuditFinding, ParserResult } from "@vk/core";
import type { FixProposal } from "./types.js";
import { UnsupportedFixError } from "./types.js";
import { generateUnusedAgentFix } from "./unused-agent.js";
import { generateDuplicateGuidanceFix } from "./duplicate-guidance.js";
import { generateStaleReferenceFix } from "./stale-reference.js";
import { generateTokenOverflowTrimFix } from "./token-overflow-trim.js";
import { concatPatches } from "./unified-diff.js";

const SUPPORTED = new Set([
  "unused-agent",
  "duplicate-guidance",
  "stale-reference",
  "token-budget",
] as const);

export function isSupported(category: string): boolean {
  return SUPPORTED.has(category as never);
}

export function generateFix(
  finding: AuditFinding,
  scan: ParserResult,
): FixProposal {
  switch (finding.category) {
    case "unused-agent":
      return generateUnusedAgentFix(finding, scan);
    case "duplicate-guidance":
      return generateDuplicateGuidanceFix(finding, scan);
    case "stale-reference":
      return generateStaleReferenceFix(finding, scan);
    case "token-budget":
      return generateTokenOverflowTrimFix(finding, scan);
    default:
      throw new UnsupportedFixError(finding.category);
  }
}

export interface BatchFixResult {
  successes: FixProposal[];
  failures: Array<{ findingId: string; reason: string }>;
  combinedPatch: string;
}

export function generateBatchFix(
  findings: AuditFinding[],
  scan: ParserResult,
): BatchFixResult {
  const successes: FixProposal[] = [];
  const failures: Array<{ findingId: string; reason: string }> = [];
  for (const f of findings) {
    try {
      successes.push(generateFix(f, scan));
    } catch (err) {
      failures.push({
        findingId: f.id,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return {
    successes,
    failures,
    combinedPatch: concatPatches(successes.map((s) => s.patch)),
  };
}
