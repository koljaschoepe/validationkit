import {
  type AuditFinding,
  type AuditReport,
  type FindingCategory,
  FINDING_CATEGORIES,
  type ParserResult,
  type SeverityBand,
  SEVERITY_BANDS,
  compareSeverity,
} from "@vk/core";

import { checkUnusedAgents } from "./rules/unused-agents.js";
import { checkDuplicateGuidance } from "./rules/duplicate-guidance.js";
import { checkContextBloat } from "./rules/context-bloat.js";
import { checkStaleReferences } from "./rules/stale-references.js";
import { checkTokenBudget } from "./rules/token-budget.js";
import {
  isLlmEnabled,
  llmDisabledFinding,
  checkConflictingRules,
} from "@vk/llm";

export interface AuditConfig {
  /** Tokens above which a single agent file is flagged as bloated. */
  bloatThresholdTokens: number;
  /** Lower bound (0–1) for trigram-similarity to flag duplicate guidance. */
  duplicateSimilarityThreshold: number;
}

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  bloatThresholdTokens: 8000,
  duplicateSimilarityThreshold: 0.85,
};

export interface RunAuditOptions {
  config?: Partial<AuditConfig>;
  /**
   * When true, surfaces the LLM-augmented `conflicting-rules` findings — or,
   * if no provider key is configured, a single placeholder finding stating
   * the disabled state (per Sprint 0.14 "visible-but-disabled" requirement).
   *
   * Default false so the deterministic-only smoke-eval keeps its golden-set
   * bounds intact (PRD §6.5).
   */
  includeLLM?: boolean;
}

export async function runAudit(
  scan: ParserResult,
  opts: RunAuditOptions = {},
): Promise<AuditReport> {
  const config: AuditConfig = { ...DEFAULT_AUDIT_CONFIG, ...opts.config };

  const findings: AuditFinding[] = [
    ...checkUnusedAgents(scan),
    ...checkDuplicateGuidance(scan, config.duplicateSimilarityThreshold),
    ...checkContextBloat(scan, config.bloatThresholdTokens),
    ...checkStaleReferences(scan),
    ...checkTokenBudget(scan),
  ];

  if (opts.includeLLM) {
    if (isLlmEnabled()) {
      findings.push(...(await checkConflictingRules(scan)));
    } else {
      findings.push(llmDisabledFinding());
    }
  }

  return {
    rootPath: scan.rootPath,
    generatedAt: new Date(),
    fileCount: scan.files.length,
    findings,
    summary: summarize(findings),
  };
}

function summarize(findings: AuditFinding[]): AuditReport["summary"] {
  const byCategory = Object.fromEntries(
    FINDING_CATEGORIES.map((c) => [c, 0]),
  ) as Record<FindingCategory, number>;
  const bySeverity = Object.fromEntries(
    SEVERITY_BANDS.map((s) => [s, 0]),
  ) as Record<SeverityBand, number>;

  for (const f of findings) {
    byCategory[f.category] += 1;
    bySeverity[f.severity] += 1;
  }

  const overallSeverity = pickOverall(findings);

  return { byCategory, bySeverity, overallSeverity };
}

function pickOverall(findings: AuditFinding[]): SeverityBand {
  if (findings.length === 0) return "Exceptional";
  let worst: SeverityBand = "Exceptional";
  for (const f of findings) {
    if (compareSeverity(f.severity, worst) < 0) worst = f.severity;
  }
  return worst;
}
