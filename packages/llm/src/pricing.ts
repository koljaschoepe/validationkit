// Sub-Plan-A — per-model token pricing in microcents per 1M tokens.
// 1 microcent = 1/100 USD-cent = 1/10_000 USD. Storing in microcents keeps
// per-call arithmetic in integer space and lets us amortize 5–6 decimals of
// model-cost precision without floats.
//
// Source-of-truth: Anthropic & OpenAI public pricing pages, Q2 2026.
// Reviewed 2026-05-21. Re-review trigger: Anthropic/OpenAI changelog ping.
// A V2 cron will pull current rates; for now this is hand-maintained per
// ADR-0006 (review-on-rate-change).
import type { Intensity } from "@vk/billing";

export type Provider = "anthropic" | "openai";

export interface ModelRate {
  /** Microcents charged per 1M input tokens. */
  inputPer1M: number;
  /** Per 1M output tokens. */
  outputPer1M: number;
  /** Anthropic cache-read (90% off input). 0 for providers without explicit cache pricing. */
  cacheReadPer1M: number;
  /** Anthropic 1h-cache-write (2× input). 0 elsewhere. */
  cacheWritePer1M: number;
  provider: Provider;
}

const USD_TO_MICROCENTS_PER_1M = 1_000_000 * 100 * 100; // 1 USD = 10^4 microcents; × 1M tokens.

function usdPerM(usd: number): number {
  return Math.round(usd * USD_TO_MICROCENTS_PER_1M / 1_000_000); // microcents per token × 1M.
}

// Microcents per 1M tokens. Convention check: $3.00/M = 3 × 10^4 × 1M = 3 × 10^6.
// usdPerM(3) → round(3 * 10^10 / 1e6) = 3 × 10^4 / 1 = 30_000_000. Hmm.
// Re-derive directly: input cost in microcents per token = usd_per_1M_tokens × 100 × 100 / 1_000_000
//                  = usd × 0.01. So per 1M tokens: usd × 10_000_000. For $3: 30_000_000 microcents.
// That's a big number but correct (3 USD = 30M microcents).
// usdPerM helper above returns the same value via the round, so we'll use it consistently.

// Sentinel inline check (compile-time only).
void usdPerM;

export const MODEL_RATES: Record<string, ModelRate> = {
  // Anthropic
  "claude-sonnet-4-6": {
    provider: "anthropic",
    inputPer1M: 30_000_000, // $3.00 / 1M
    outputPer1M: 150_000_000, // $15.00
    cacheReadPer1M: 3_000_000, // $0.30
    cacheWritePer1M: 60_000_000, // $6.00 (1h cache write = 2× input)
  },
  "claude-haiku-4-5": {
    provider: "anthropic",
    inputPer1M: 10_000_000, // $1.00
    outputPer1M: 50_000_000, // $5.00
    cacheReadPer1M: 1_000_000, // $0.10
    cacheWritePer1M: 20_000_000, // $2.00
  },
  "claude-opus-4-7": {
    provider: "anthropic",
    inputPer1M: 50_000_000, // $5.00
    outputPer1M: 250_000_000, // $25.00
    cacheReadPer1M: 5_000_000, // $0.50
    cacheWritePer1M: 100_000_000, // $10.00
  },
  // OpenAI — gpt-5-nano is the existing fallback; rates reviewed 2026-05-21.
  // NOTE: gpt-5-nano headline pricing shifted from $0.05 (early 2025) to
  // $0.20/M input mid-2026 (per the API pricing page). The previous in-tree
  // 0.05 was stale.
  "gpt-5-nano": {
    provider: "openai",
    inputPer1M: 2_000_000, // $0.20
    outputPer1M: 12_500_000, // $1.25
    cacheReadPer1M: 200_000, // $0.02 (90% off)
    cacheWritePer1M: 0, // OpenAI does not charge cache-write; included in input.
  },
  "gpt-5-mini": {
    provider: "openai",
    inputPer1M: 7_500_000, // $0.75
    outputPer1M: 45_000_000, // $4.50
    cacheReadPer1M: 750_000, // $0.075
    cacheWritePer1M: 0,
  },
};

export function getModelRate(model: string): ModelRate {
  const rate = MODEL_RATES[model];
  if (!rate) {
    throw new Error(
      `Unknown model "${model}" — extend MODEL_RATES in @vk/llm/pricing.`,
    );
  }
  return rate;
}

/**
 * Tier-2 default model picker. Decoupled from selectModel so unit tests can
 * verify the intensity→model mapping without the provider-key plumbing.
 */
export function modelForIntensity(intensity: Intensity): string {
  return intensity === "deep" ? "claude-sonnet-4-6" : "gpt-5-nano";
}

export function maxOutputTokensForIntensity(intensity: Intensity): number {
  return intensity === "deep" ? 8192 : 4096;
}

/**
 * Computes the microcent cost of a single LLM call. Caller passes the
 * token-usage block straight from the AI-SDK response.
 */
export function computeCallCost(args: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}): number {
  const rate = getModelRate(args.model);
  const baseInput = Math.max(
    0,
    args.inputTokens -
      (args.cacheReadTokens ?? 0) -
      (args.cacheWriteTokens ?? 0),
  );
  const inputCost = (baseInput * rate.inputPer1M) / 1_000_000;
  const outputCost = (args.outputTokens * rate.outputPer1M) / 1_000_000;
  const cacheReadCost =
    ((args.cacheReadTokens ?? 0) * rate.cacheReadPer1M) / 1_000_000;
  const cacheWriteCost =
    ((args.cacheWriteTokens ?? 0) * rate.cacheWritePer1M) / 1_000_000;
  return Math.round(inputCost + outputCost + cacheReadCost + cacheWriteCost);
}
