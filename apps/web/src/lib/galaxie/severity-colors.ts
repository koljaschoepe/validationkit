import type { Severity } from './types';

/**
 * Three-tier traffic-light severity palette (Frontend-Relaunch v2, May 2026).
 * Kill+Weak = red (Weak slightly dimmer), Mid = orange, Strong+Exceptional
 * = green (Exceptional slightly brighter). Hex values approximate the OKLCH
 * tokens in globals.css; Pixi only renders RGB so we provide hex here.
 *
 * Within red/green tiers, severity is further encoded via icon + border
 * style + font weight in SeverityBadge — color is a redundant signal, not
 * the only one, so color-blind users and high-glare situations still parse it.
 */
export const SEVERITY_HEX: Record<Severity, string> = {
  Kill: '#dc2f2f',         // oklch(0.62 0.24 25)
  Weak: '#b65d52',         // oklch(0.58 0.18 30)
  Mid: '#d49545',          // oklch(0.66 0.18 60)
  Strong: '#4f9466',       // oklch(0.60 0.18 145)
  Exceptional: '#6fb685',  // oklch(0.72 0.18 145)
};

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
 * Pixi GlowFilter radius per band. Encodes severity via halo size,
 * since hue is no longer load-bearing.
 */
export const SEVERITY_GLOW_RADIUS: Record<Severity, number> = {
  Kill: 24,
  Weak: 16,
  Mid: 8,
  Strong: 0,
  Exceptional: 12,
};

/**
 * Pulse rate in Hz for GSAP-driven scale tweens. 0 = static.
 * Only Kill and Weak pulse, to keep the canvas calm.
 */
export const SEVERITY_PULSE_RATE: Record<Severity, number> = {
  Kill: 1.8,
  Weak: 1.0,
  Mid: 0,
  Strong: 0,
  Exceptional: 0,
};

/**
 * Convert a severity's pulse-rate (Hz) into half-period seconds for a
 * yoyo-tween (`gsap.to(..., { yoyo: true, repeat: -1, duration })`). Returns
 * `null` if the severity does not pulse — callers should skip the tween in
 * that case, not pass `null` to GSAP.
 *
 * Math: 1.8Hz = 1 cycle per ~0.556s = up+down legs of ~0.278s each.
 */
export function getPulseDuration(severity: Severity): number | null {
  const rate = SEVERITY_PULSE_RATE[severity];
  if (rate <= 0) return null;
  return 1 / (rate * 2);
}
