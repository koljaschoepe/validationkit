import type { AuditFinding, ParserResult } from "@vk/core";
import type { FixProposal } from "./types.js";
import { UnsupportedFixError } from "./types.js";
import { generateUnusedAgentFix } from "./unused-agent.js";
import { generateDuplicateGuidanceFix } from "./duplicate-guidance.js";
import { generateStaleReferenceFix } from "./stale-reference.js";
import { generateTokenOverflowTrimFix } from "./token-overflow-trim.js";
import { generateContextBloatLlmFix } from "./context-bloat-llm.js";
import { concatPatches } from "./unified-diff.js";

export {
  isSupported,
  isDeterministicCategory,
  isLlmAugmentedCategory,
} from "./client.js";

/**
 * Sync generator. Throws `UnsupportedFixError` on LLM-augmented categories
 * (callers should switch to `generateFixAsync` for those). Useful when the
 * caller wants strictly-no-LLM-call semantics.
 */
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

/**
 * Async generator covering the same categories plus LLM-augmented ones.
 * Returns null when the category needs an LLM key that isn't configured.
 */
export async function generateFixAsync(
  finding: AuditFinding,
  scan: ParserResult,
): Promise<FixProposal | null> {
  if (finding.category === "context-bloat") {
    return generateContextBloatLlmFix(finding, scan);
  }
  return generateFix(finding, scan);
}

export interface BatchFixResult {
  successes: FixProposal[];
  failures: Array<{ findingId: string; reason: string }>;
  /** Findings whose category requires an LLM key that wasn't configured. */
  skippedLlmDisabled: Array<{ findingId: string; category: string }>;
  combinedPatch: string;
}

export async function generateBatchFix(
  findings: AuditFinding[],
  scan: ParserResult,
): Promise<BatchFixResult> {
  const successes: FixProposal[] = [];
  const failures: Array<{ findingId: string; reason: string }> = [];
  const skippedLlmDisabled: Array<{ findingId: string; category: string }> = [];
  for (const f of findings) {
    try {
      const result = await generateFixAsync(f, scan);
      if (result === null) {
        skippedLlmDisabled.push({ findingId: f.id, category: f.category });
        continue;
      }
      successes.push(result);
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
    skippedLlmDisabled,
    combinedPatch: concatPatches(successes.map((s) => s.patch)),
  };
}
