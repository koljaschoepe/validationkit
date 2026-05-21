import { describe, expect, it } from "vitest";
import {
  computeCallCost,
  getModelRate,
  maxOutputTokensForIntensity,
  MODEL_RATES,
  modelForIntensity,
} from "./pricing.js";

describe("MODEL_RATES catalog", () => {
  it("covers both providers' active models", () => {
    expect(MODEL_RATES["claude-sonnet-4-6"].provider).toBe("anthropic");
    expect(MODEL_RATES["claude-haiku-4-5"].provider).toBe("anthropic");
    expect(MODEL_RATES["claude-opus-4-7"].provider).toBe("anthropic");
    expect(MODEL_RATES["gpt-5-nano"].provider).toBe("openai");
    expect(MODEL_RATES["gpt-5-mini"].provider).toBe("openai");
  });

  it("Anthropic cache-read is 10% of input (90% off)", () => {
    const sonnet = MODEL_RATES["claude-sonnet-4-6"];
    expect(sonnet.cacheReadPer1M).toBe(sonnet.inputPer1M / 10);
    const haiku = MODEL_RATES["claude-haiku-4-5"];
    expect(haiku.cacheReadPer1M).toBe(haiku.inputPer1M / 10);
  });

  it("Anthropic 1h-cache-write is 2× input", () => {
    const sonnet = MODEL_RATES["claude-sonnet-4-6"];
    expect(sonnet.cacheWritePer1M).toBe(sonnet.inputPer1M * 2);
  });

  it("Sonnet 4.6 = $3 input / $15 output per 1M tokens", () => {
    const sonnet = MODEL_RATES["claude-sonnet-4-6"];
    expect(sonnet.inputPer1M).toBe(30_000_000);
    expect(sonnet.outputPer1M).toBe(150_000_000);
  });
});

describe("modelForIntensity", () => {
  it("quick → gpt-5-nano (cost floor)", () => {
    expect(modelForIntensity("quick")).toBe("gpt-5-nano");
  });

  it("deep → claude-sonnet-4-6 (quality, prompt-caching)", () => {
    expect(modelForIntensity("deep")).toBe("claude-sonnet-4-6");
  });
});

describe("maxOutputTokensForIntensity", () => {
  it("quick gets 4k, deep gets 8k", () => {
    expect(maxOutputTokensForIntensity("quick")).toBe(4096);
    expect(maxOutputTokensForIntensity("deep")).toBe(8192);
  });
});

describe("getModelRate", () => {
  it("throws for unknown models so we never silently mis-bill", () => {
    expect(() => getModelRate("claude-sonnet-99")).toThrow(/Unknown model/);
  });
});

describe("computeCallCost", () => {
  it("sums input + output at the model rate (no cache)", () => {
    // Sonnet 4.6: $3 input + $15 output per 1M.
    // 1000 in + 500 out  →  3 * 1000/1M USD + 15 * 500/1M USD
    //   = 0.003 + 0.0075 = 0.0105 USD = 1.05 cents = 10_500 microcents (approx).
    const cost = computeCallCost({
      model: "claude-sonnet-4-6",
      inputTokens: 1000,
      outputTokens: 500,
    });
    // Compute expected from raw rates to avoid magic-number drift.
    const expected =
      Math.round(
        (1000 * 30_000_000 + 500 * 150_000_000) / 1_000_000,
      );
    expect(cost).toBe(expected);
  });

  it("subtracts cache_read tokens from the full-rate input pool", () => {
    // 10k tokens, of which 8k are cache reads — only 2k pay full price.
    const cached = computeCallCost({
      model: "claude-sonnet-4-6",
      inputTokens: 10_000,
      outputTokens: 0,
      cacheReadTokens: 8_000,
    });
    const baseline = computeCallCost({
      model: "claude-sonnet-4-6",
      inputTokens: 10_000,
      outputTokens: 0,
    });
    expect(cached).toBeLessThan(baseline);
  });

  it("cache-read at 10% means 80% cache hit ≈ 28% of full cost", () => {
    // For Anthropic Sonnet 4.6:
    //   full:  10k * 30M / 1M = 300_000 microcents
    //   cached: 2k * 30M / 1M (uncached) + 8k * 3M / 1M (cached)
    //         = 60_000 + 24_000 = 84_000 microcents
    //   ratio: 84_000 / 300_000 = 0.28 → ~28%
    const cached = computeCallCost({
      model: "claude-sonnet-4-6",
      inputTokens: 10_000,
      outputTokens: 0,
      cacheReadTokens: 8_000,
    });
    const baseline = computeCallCost({
      model: "claude-sonnet-4-6",
      inputTokens: 10_000,
      outputTokens: 0,
    });
    expect(cached / baseline).toBeCloseTo(0.28, 2);
  });

  it("gpt-5-nano single-call cost is microcent-cheap (Free-Tier safe)", () => {
    // 15k in + 3k out (typical audit-rule call):
    const cost = computeCallCost({
      model: "gpt-5-nano",
      inputTokens: 15_000,
      outputTokens: 3_000,
    });
    // gpt-5-nano: $0.20/M input, $1.25/M output.
    //   15k * 2M / 1M + 3k * 12.5M / 1M = 30_000 + 37_500 = 67_500 microcents
    //   = 0.675 USD-cent. Free-Tier 3 audits = ~2 cents total. OK.
    expect(cost).toBe(67_500);
  });

  it("Sonnet 4.6 same call (no cache) = $0.09 ≈ 9 USD-cents", () => {
    const cost = computeCallCost({
      model: "claude-sonnet-4-6",
      inputTokens: 15_000,
      outputTokens: 3_000,
    });
    // 15k * 30M / 1M + 3k * 150M / 1M = 450_000 + 450_000 = 900_000 microcents.
    expect(cost).toBe(900_000);
  });
});
