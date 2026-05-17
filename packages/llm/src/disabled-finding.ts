import type { AuditFinding } from "@vk/core";
import { llmDisabledMessage } from "./select.js";

/**
 * One placeholder finding for the `conflicting-rules` category, shown when
 * no LLM key is configured. Sprint 0.14 — "visible-but-disabled state"
 * (roadmap line 142, A9 honest-non-vapor).
 *
 * Severity is intentionally "Exceptional" so it never affects the
 * overallSeverity rank, and `confidence: undefined` keeps it visually
 * distinguishable from real LLM emissions.
 */
export function llmDisabledFinding(): AuditFinding {
  return {
    id: "conflicting-rules:llm-disabled",
    category: "conflicting-rules",
    severity: "Exceptional",
    title: "Conflicting-rules check is disabled",
    detail: llmDisabledMessage(),
    citations: [],
    deterministic: false,
  };
}
