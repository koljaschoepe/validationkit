// Sub-Plan-C — Pre-audit cost estimator. Returns the credit/EUR-equivalent
// of a planned audit so the UI can show a transparent "this will cost X" hint
// before the user clicks Run.
//
// Cost numbers are rough — actual AI spend depends on repo size and cache hit
// rate. The UI must label these as estimates, not invoices.
import {
  creditsForIntensity,
  type Intensity,
} from "@vk/billing";
import { computeCallCost, modelForIntensity } from "@vk/llm";

const QUICK_ASSUMED_TOKENS = { input: 15_000, output: 3_000 };
const DEEP_ASSUMED_TOKENS = { input: 15_000, output: 6_000 };

export interface AuditCostEstimate {
  credits: number;
  /** Approx AI compute cost in EUR cents (pass-through, not customer charge). */
  approxAiCostEurCents: number;
  modelLabel: string;
  intensity: Intensity;
}

export function estimateAuditCost(intensity: Intensity): AuditCostEstimate {
  const model = modelForIntensity(intensity);
  const tokens =
    intensity === "deep" ? DEEP_ASSUMED_TOKENS : QUICK_ASSUMED_TOKENS;
  const microcents = computeCallCost({
    model,
    inputTokens: tokens.input,
    outputTokens: tokens.output,
  });
  // microcents → eur cents: 1 USD-cent = 1000 microcents, 1 USD ≈ 0.92 EUR
  // (back-of-envelope; live FX is overkill for an estimate label).
  const usdCents = Math.round(microcents / 1000);
  const eurCents = Math.round(usdCents * 0.92);

  return {
    credits: creditsForIntensity(intensity),
    approxAiCostEurCents: eurCents,
    modelLabel: intensity === "deep" ? "Claude Sonnet 4.6" : "GPT-5-nano",
    intensity,
  };
}

export function formatEurCents(cents: number): string {
  if (cents < 1) return "<€0.01";
  if (cents < 100) return `€0.${cents.toString().padStart(2, "0")}`;
  return `€${(cents / 100).toFixed(2)}`;
}
