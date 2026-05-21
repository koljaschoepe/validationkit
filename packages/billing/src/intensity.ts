// Sub-Plan-A — audit intensity. The customer-facing knob is "Quick" vs "Deep"
// (not the model name). Quick = single-pass GPT-5-nano. Deep = single-pass
// Sonnet 4.6 with prompt-caching + extended maxOutputTokens. See ADR-0006.

export type Intensity = "quick" | "deep";

export const INTENSITIES: ReadonlyArray<Intensity> = ["quick", "deep"];

/** Credits debited per intensity. Master-Plan §2 Q4.1 fixes the 1:5 ratio. */
export const CREDITS_PER_INTENSITY: Record<Intensity, number> = {
  quick: 1,
  deep: 5,
};

export function creditsForIntensity(intensity: Intensity): number {
  return CREDITS_PER_INTENSITY[intensity];
}

export function isIntensity(value: unknown): value is Intensity {
  return value === "quick" || value === "deep";
}

/** Default when the caller didn't pick — UI surfaces both equally. */
export const DEFAULT_INTENSITY: Intensity = "quick";
