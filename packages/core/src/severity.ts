export const SEVERITY_BANDS = [
  "Kill",
  "Weak",
  "Mid",
  "Strong",
  "Exceptional",
] as const;

export type SeverityBand = (typeof SEVERITY_BANDS)[number];

export const SEVERITY_ORDER: Record<SeverityBand, number> = {
  Kill: 0,
  Weak: 1,
  Mid: 2,
  Strong: 3,
  Exceptional: 4,
};

export function compareSeverity(a: SeverityBand, b: SeverityBand): number {
  return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}
