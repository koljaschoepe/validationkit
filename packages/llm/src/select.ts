export type LLMIntent =
  | "conflicting-rules"
  | "context-bloat"
  | "fix-suggestion";

export type LLMProvider = "anthropic" | "openai";

export interface ModelSelection {
  provider: LLMProvider;
  /** Model ID passed to the provider SDK. */
  modelId: string;
  /** Resolved API key (caller wires it into provider config). */
  apiKey: string;
  /** Approximate per-1M-token input cost. Used for cost-aware fallback. */
  costPerMillionInputUsd: number;
}

/**
 * Multi-LLM abstraction (Sprint 0.14, A4 research). Provider-agnostic so we
 * can swap Anthropic ↔ OpenAI without touching callers. Wire-up is env-driven:
 *
 *   ANTHROPIC_API_KEY → claude-sonnet-4-6 (default for conflicting-rules)
 *   OPENAI_API_KEY    → gpt-5-nano (cost-floor fallback)
 *
 * Returns null whenever no provider key is configured — that's the
 * "honest non-vapor" path: callers render a disabled-state finding instead
 * of crashing.
 *
 * Tier gating is reserved (e.g. cap free-tier to OPENAI cheap-floor, push
 * paid users onto Anthropic) but not enforced in v0.0.14 — we ship the
 * shape, not the limits.
 */
export function selectModel(
  opts: { tier?: string; intent?: LLMIntent } = {},
): ModelSelection | null {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return {
      provider: "anthropic",
      modelId: "claude-sonnet-4-6",
      apiKey: anthropicKey,
      costPerMillionInputUsd: 3.0,
    };
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      provider: "openai",
      modelId: "gpt-5-nano",
      apiKey: openaiKey,
      costPerMillionInputUsd: 0.05,
    };
  }
  // Tier-gating hook: when wired, free-tier might be capped to OPENAI even
  // if both keys present. For now both paths reach the same result.
  void opts.tier;
  void opts.intent;
  return null;
}

export function isLlmEnabled(): boolean {
  return selectModel() !== null;
}

export function llmDisabledMessage(): string {
  return "Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) to enable LLM-augmented findings.";
}
