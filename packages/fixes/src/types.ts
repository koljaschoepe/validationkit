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
  /** Always true for deterministic fixes (Sprint 0.13 ships only those). */
  deterministic: true;
  /** Sprint 0.13 deterministic fixes are always "high". */
  confidence: "high";
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
