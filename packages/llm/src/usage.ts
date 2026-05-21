// Sub-Plan-A — append-only AI usage record. Every generateText call inside
// the audit pipeline persists one row here so the audit_run_cost rollup
// (Sub-Plan-B) and the Stripe meter-event flush can read from a single
// source. Anonymous audits (Landing-Demo) pass no meteringContext and skip
// persistence — cost is implicit zero from the customer's POV.
import { getDb, schema } from "@vk/db";
import { computeCallCost, type Provider } from "./pricing.js";

export type CallSiteId =
  | "conflicting-rules"
  | "context-bloat-llm"
  | "fix-suggestion";

export interface MeteringContext {
  workspaceId: string;
  scanId: string | null;
  /** Set when the user supplied their own provider key via BYOK. */
  byokFlag: boolean;
}

export interface RawUsage {
  /** AI-SDK exposes these on `result.usage` (mapped names below). */
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number; // alias used by OpenAI responses
  cacheReadInputTokens?: number; // Anthropic alias
  cacheWriteInputTokens?: number; // Anthropic alias (5min) — we sum with 1h since pricing folds.
}

export interface RecordUsageArgs {
  meteringContext: MeteringContext;
  callSiteId: CallSiteId;
  provider: Provider;
  model: string;
  usage: RawUsage;
}

/**
 * Persists one ai_usage_event row. Computes cost server-side based on the
 * canonical pricing table — never trust client-supplied cost.
 *
 * Returns the computed cost in microcents so the audit_run_cost rollup
 * (Phase A.4 in audit-requested.ts) can sum without re-fetching the rows.
 */
export async function recordUsage(args: RecordUsageArgs): Promise<{
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costMicrocents: number;
}> {
  const inputTokens = args.usage.inputTokens ?? 0;
  const outputTokens = args.usage.outputTokens ?? 0;
  const cacheReadTokens =
    args.usage.cacheReadInputTokens ?? args.usage.cachedInputTokens ?? 0;
  const cacheWriteTokens = args.usage.cacheWriteInputTokens ?? 0;

  const costMicrocents = computeCallCost({
    model: args.model,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
  });

  // Anonymous audits skip persistence — they don't bill anyone.
  if (args.meteringContext.workspaceId) {
    const db = getDb();
    await db.insert(schema.aiUsageEvent).values({
      workspaceId: args.meteringContext.workspaceId,
      scanId: args.meteringContext.scanId,
      callSiteId: args.callSiteId,
      provider: args.provider,
      model: args.model,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      costMicrocents,
      byokFlag: args.meteringContext.byokFlag,
    });
  }

  return {
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    costMicrocents,
  };
}
