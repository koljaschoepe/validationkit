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
export const SEVERITY_HEX: Record<Severity, string> = {
  Kill: '#c64a3a',         // oklch(0.58 0.20 25)
  Weak: '#cf8a4f',         // oklch(0.70 0.13 55)
  Mid: '#9aa3b3',          // oklch(0.68 0.02 250) — anchor, near-neutral
  Strong: '#7eb8a4',       // oklch(0.74 0.06 165)
  Exceptional: '#acacac',  // oklch(0.70 0 0) — neutral fill, see SEVERITY_OUTLINE_HEX
};

/**
 * Per-band outline color. Only `Exceptional` renders a 1 px stroke; the indigo
 * (`oklch(0.62 0.14 270)`) signals "rare / special" without competing with Kill.
 */
export const SEVERITY_OUTLINE_HEX: Partial<Record<Severity, string>> = {
  Exceptional: '#7a73d8', // oklch(0.62 0.14 270)
};

/** Dismissed finding fill + alpha (master plan §5.3.3 dismissed row). */
export const DISMISSED_FILL_HEX = '#4d4d4d'; // oklch(0.40 0 0)
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
  Kill: 6,
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
