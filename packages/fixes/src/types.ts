import type { FindingCategory } from "@vk/core";

export interface FixProposal {
  findingId: string;
  category: FindingCategory;
  /** Plain-language explanation shown above the diff preview. */
  rationale: string;
  /** Unified-diff string. `git apply --directory=<repo>` applies it. */
  patch: string;
  /** Repo-relative paths touched by the patch. */
  filesTouched: string[];
  /**
   * true = deterministic generator (Sprint 0.13: unused-agent /
   *   duplicate-guidance / stale-reference / token-overflow-trim)
   * false = LLM-augmented generator (Sprint 1.2+: context-bloat-llm)
   */
  deterministic: boolean;
  /**
   * "high" for deterministic generators.
   * "low" | "mid" | "high" for LLM-augmented per the model's self-reported
   * confidence band (Constraint #14). The UI surfaces the band visually so
   * the user calibrates trust correctly.
   */
  confidence: "low" | "mid" | "high";
}

export class UnsupportedFixError extends Error {
  constructor(category: FindingCategory) {
    super(`No deterministic fix for category "${category}".`);
    this.name = "UnsupportedFixError";
  }
}

export class FixContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FixContextError";
  }
}
