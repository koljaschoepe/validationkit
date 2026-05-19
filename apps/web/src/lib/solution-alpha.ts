import type { SolutionStatus } from '@/lib/galaxie/types';

/**
 * Visual alpha-mapping for solution status + confidence on FileAsteroid.
 * Kept in a non-"use server" file so it can be imported by client-components
 * (FileAsteroid) and by tests without bundling Drizzle.
 *   ready+high  → 1.00
 *   ready+mid   → 0.85
 *   ready+low   → 0.70
 *   ready (no confidence)  → 0.85 (deterministic case)
 *   pending     → 0.60
 *   unsupported → 0.50
 *   failed      → 0.40
 *   none        → 0.60
 */
export function alphaFor(
  status: SolutionStatus | undefined,
  confidence: 'low' | 'mid' | 'high' | null | undefined,
): number {
  if (status === 'ready') {
    if (confidence === 'high') return 1.0;
    if (confidence === 'mid') return 0.85;
    if (confidence === 'low') return 0.7;
    return 0.85;
  }
  if (status === 'failed') return 0.4;
  if (status === 'pending') return 0.6;
  if (status === 'unsupported') return 0.5;
  return 0.6;
}
