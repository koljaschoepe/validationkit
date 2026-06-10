import type { Severity } from './types';

/**
 * Severity → CSS-variable mapper (visual-overhaul, Jun 2026).
 *
 * The single source of truth for severity color is `globals.css` (`--sev-*`,
 * exposed to Tailwind as `--color-sev-*`). This module only maps a Severity band
 * to its CSS-var reference, so inline styles and `color-mix()` stay in lockstep
 * with the token layer — no hex duplication, no drift.
 *
 * Strict three-color traffic-light: red = negative (Kill loud + filled in the
 * badge, Weak dimmer red), orange = neutral (Mid), green = positive (Strong,
 * Exceptional brighter). Disambiguation within red/green comes from the badge
 * text label + fill-vs-outline, never hue alone — color is redundant, so
 * screen-reader and color-blind users stay covered.
 *
 * (The old Pixi-era exports — SEVERITY_PIXI, glow/pulse rates, outline hex,
 * dismissed fill — were removed with the Galaxie/Pixi retirement; nothing in the
 * Konsole/Landing render path consumed them anymore.)
 */
export const SEVERITY_COLOR: Record<Severity, string> = {
  Kill: 'var(--color-sev-kill)',
  Weak: 'var(--color-sev-weak)',
  Mid: 'var(--color-sev-mid)',
  Strong: 'var(--color-sev-strong)',
  Exceptional: 'var(--color-sev-exceptional)',
};

/** CSS color string (a `var(--color-sev-*)` reference) for a severity band. */
export function severityColorVar(s: Severity): string {
  return SEVERITY_COLOR[s];
}
