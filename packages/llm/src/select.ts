// Multi-LLM provider abstraction. Direct-provider only — KEIN Vercel AI
// Gateway (ADR-0005). Sub-Plan-A introduced the Intensity knob: callers
// pick "quick" or "deep" instead of naming a model. quick → gpt-5-nano,
// deep → claude-sonnet-4-6. BYOK overrides the built-in provider entirely.
// See ADR-0006.
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { Intensity } from "@vk/billing";
import {
  getModelRate,
  maxOutputTokensForIntensity,
  modelForIntensity,
  type Provider,
} from "./pricing.js";

export type LLMIntent =
  | "conflicting-rules"
  | "context-bloat"
  | "fix-suggestion";

export type LLMProvider = Provider;

export interface ByokOverride {
  provider: Provider;
  apiKey: string;
}

export interface ModelSelection {
  provider: Provider;
  modelId: string;
  apiKey: string;
  maxOutputTokens: number;
  /** Per-1M-token input cost, microcents. Used by audit_run_cost preview. */
  costPerMillionInputMicrocents: number;
}

export interface SelectArgs {
  intensity: Intensity;
  intent?: LLMIntent;
  byok?: ByokOverride;
}

/**
 * Provider selection with intensity routing:
 *   quick → gpt-5-nano  (cost floor; matches existing repo default)
 *   deep  → claude-sonnet-4-6  (quality, prompt-caching, 8k output)
 *
 * Returns null when no provider key is configured (Hardcore-Local-Only).
 * Callers must render the disabled-state finding rather than crash.
 */
export function selectModel(args: SelectArgs): ModelSelection | null {
  void args.intent; // retained for future telemetry hooks.

  const targetModel = modelForIntensity(args.intensity);
  const targetRate = getModelRate(targetModel);

  // BYOK overrides everything when present; we still route to the same model.
  if (args.byok) {
    return {
      provider: args.byok.provider,
      modelId: targetModel,
      apiKey: args.byok.apiKey,
      maxOutputTokens: maxOutputTokensForIntensity(args.intensity),
      costPerMillionInputMicrocents: targetRate.inputPer1M,
    };
  }

  if (targetRate.provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      return {
        provider: "anthropic",
        modelId: targetModel,
        apiKey,
        maxOutputTokens: maxOutputTokensForIntensity(args.intensity),
        costPerMillionInputMicrocents: targetRate.inputPer1M,
      };
    }
    // Fall through to OpenAI as a last-resort, even for Deep, when only
    // OPENAI_API_KEY is configured. Quality degrades but the audit still
    // runs — better than a hard-failure UX.
    const fallbackKey = process.env.OPENAI_API_KEY;
    if (fallbackKey) {
      const fallback = getModelRate("gpt-5-nano");
      return {
        provider: "openai",
        modelId: "gpt-5-nano",
        apiKey: fallbackKey,
        maxOutputTokens: maxOutputTokensForIntensity(args.intensity),
        costPerMillionInputMicrocents: fallback.inputPer1M,
      };
    }
    return null;
  }

  // targetRate.provider === "openai"
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    return {
      provider: "openai",
      modelId: targetModel,
      apiKey,
      maxOutputTokens: maxOutputTokensForIntensity(args.intensity),
      costPerMillionInputMicrocents: targetRate.inputPer1M,
    };
  }
  // Last-resort fallback to Anthropic for Quick when only ANTHROPIC_API_KEY
  // exists. Cost goes up but service stays available.
  const fallbackKey = process.env.ANTHROPIC_API_KEY;
  if (fallbackKey) {
    const fallback = getModelRate("claude-sonnet-4-6");
    return {
      provider: "anthropic",
      modelId: "claude-sonnet-4-6",
      apiKey: fallbackKey,
      maxOutputTokens: maxOutputTokensForIntensity(args.intensity),
      costPerMillionInputMicrocents: fallback.inputPer1M,
    };
  }
  return null;
}

export function providerModel(selection: ModelSelection): LanguageModel {
  switch (selection.provider) {
    case "anthropic": {
      const client = createAnthropic({ apiKey: selection.apiKey });
      return client(selection.modelId);
    }
    case "openai": {
      const client = createOpenAI({ apiKey: selection.apiKey });
      return client(selection.modelId);
    }
  }
}

export function isLlmEnabled(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY,
  );
}

export function llmDisabledMessage(): string {
  return (
    "LLM-augmented rules are disabled: set ANTHROPIC_API_KEY (or OPENAI_API_KEY) " +
    "to enable conflicting-rules + context-bloat trim suggestions."
  );
}
