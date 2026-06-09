import type { Severity } from './types';

/**
 * Asymmetric-salience severity palette (Galaxie-Workspace-Solar Sub-B, Jun 2026).
 *
 * Only Kill screams. Weak is muted orange, Mid is the neutral anchor (no badge),
 * Strong is a calm teal tint, Exceptional is a neutral grey with a thin indigo
 * outline (no fill tint). The narrow lightness band (0.58–0.74) keeps brightness
 * roughly equal across non-Kill bands; Kill stands out via maxed chroma (0.20)
 * and a six-pixel glow. Teal (165°) and indigo (270°) are off the red-green axis
 * to stay deuteranopia-safe.
 *
 * Hex values approximate the OKLCH tokens documented inline. Pixi only renders
 * RGB so the hex map is the practical single source for both PIXI canvas + SVG
 * fallback + landing-hero.
 */
// Bundle I (Galaxie-Legibility-Rework, Jun 2026): the old palette inverted
// salience — Kill #c64a3a had the WEAKEST background-contrast of all bands
// (CR 4.19 vs #0a0a0a) while the "calm" bands sat at 7–8, so the most critical
// finding was the dimmest dot on the canvas. Kill is now a brighter, more
// saturated coral-red (CR ≈ 7) so it reads as the loudest band; Mid and
// Exceptional get a little chroma so the two most common bands stop vanishing
// into grey. All bands stay light enough that a single DARK badge-icon clears
// WCAG 1.4.11 on every disc (see BADGE_ICON_COLOR).
export const SEVERITY_HEX: Record<Severity, string> = {
  Kill: '#f4604e',         // oklch(~0.66 0.18 25) — loudest, CR ≈ 7 vs #0a0a0a
  Weak: '#cf8a4f',         // oklch(0.70 0.13 55)
  Mid: '#b88a52',          // oklch(0.66 0.10 65) — muted amber, out of the grey
  Strong: '#7eb8a4',       // oklch(0.74 0.06 165)
  Exceptional: '#8a82e0',  // oklch(0.62 0.14 270) — indigo tint = "rare/special"
};

/**
 * Per-band outline color. Only `Exceptional` renders a 1 px stroke; the indigo
 * (`oklch(0.62 0.14 270)`) signals "rare / special" without competing with Kill.
 */
export const SEVERITY_OUTLINE_HEX: Partial<Record<Severity, string>> = {
  Exceptional: '#7a73d8', // oklch(0.62 0.14 270)
};

/** Dismissed finding fill + alpha (master plan §5.3.3 dismissed row). */
// Bundle I: #4d4d4d (CR 2.34) was effectively invisible on the dark canvas so
// dismissed findings couldn't be found again — lifted to #6b6b6b (CR ≈ 3.9).
export const DISMISSED_FILL_HEX = '#6b6b6b'; // oklch(0.52 0 0)
export const DISMISSED_ALPHA = 0.35;

export function hexToPixiNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export const SEVERITY_PIXI: Record<Severity, number> = Object.fromEntries(
  Object.entries(SEVERITY_HEX).map(([k, v]) => [k, hexToPixiNumber(v)]),
) as Record<Severity, number>;

export function severityPixiColor(s: Severity): number {
  return SEVERITY_PIXI[s];
}

export function severityHex(s: Severity): string {
  return SEVERITY_HEX[s];
}

/**
 * GlowFilter radius per band. Only Kill glows (6 px bloom in Kill-hex). Every
 * other band stays calm — glow is a salience signal, not a category one.
 */
export const SEVERITY_GLOW_RADIUS: Record<Severity, number> = {
  Kill: 8, // Bundle I: 6→8 for a broader bloom so Kill reads loud area-wide.
  Weak: 0,
  Mid: 0,
  Strong: 0,
  Exceptional: 0,
};

/**
 * Pulse rate in Hz for GSAP-driven scale tweens. Only Kill pulses; the rate
 * 0.625 Hz corresponds to a 1.6 s yoyo cycle (half-period ≈ 0.8 s) — the
 * master-plan §5.3.3 spec. `0` means no pulse.
 */
export const SEVERITY_PULSE_RATE: Record<Severity, number> = {
  Kill: 0.625,
  Weak: 0,
  Mid: 0,
  Strong: 0,
  Exceptional: 0,
};

/**
 * Convert a severity's pulse-rate (Hz) into half-period seconds for a yoyo
 * tween (`gsap.to(..., { yoyo: true, repeat: -1, duration })`). Returns `null`
 * if the severity does not pulse — callers must skip the tween in that case.
 *
 * Math: 0.625 Hz = 1 cycle per 1.6 s = up/down legs of 0.8 s each.
 */
export function getPulseDuration(severity: Severity): number | null {
  const rate = SEVERITY_PULSE_RATE[severity];
  if (rate <= 0) return null;
  return 1 / (rate * 2);
}
