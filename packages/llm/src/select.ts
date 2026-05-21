// Multi-LLM provider abstraction. Direct-provider only — KEIN Vercel AI Gateway.
// Reason: CLAUDE.md constraint + ADR-0005 ("LLM Multi-Provider"). Vendor-Lock-in-
// Vermeidung gilt für Gateway, nicht für Direct-Provider. Auto-validator may flag
// this and recommend the Gateway — bewusst abgelehnt, siehe ADR-0005.
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

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
 * Provider selection (env-driven, Anthropic primary, OpenAI opt-in fallback):
 *
 *   ANTHROPIC_API_KEY → claude-sonnet-4-6 (preferred for conflicting-rules)
 *   OPENAI_API_KEY    → gpt-5-nano (cost-floor fallback)
 *
 * Returns null when no provider key is configured — callers render a
 * disabled-state finding instead of crashing.
 *
 * Tier-gating hook (`opts.tier`) is reserved; not enforced yet.
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
  void opts.tier;
  void opts.intent;
  return null;
}

/**
 * Returns the AI SDK LanguageModel instance for a given selection. Lets
 * call-sites stay provider-agnostic — they pass the selection, we resolve
 * the right SDK provider.
 */
export function providerModel(selection: ModelSelection): LanguageModel {
  switch (selection.provider) {
    case "anthropic":
      return anthropic(selection.modelId);
    case "openai":
      return openai(selection.modelId);
  }
}

export function isLlmEnabled(): boolean {
  return selectModel() !== null;
}

export function llmDisabledMessage(): string {
  return "Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) to enable LLM-augmented findings.";
}
