import type { Severity } from './types';

export const SEVERITY_HEX: Record<Severity, string> = {
  Kill: '#dc2626',
  Weak: '#ea580c',
  Mid: '#eab308',
  Strong: '#3b82f6',
  Exceptional: '#fbbf24',
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
