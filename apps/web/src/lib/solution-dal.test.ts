import { describe, expect, it } from 'vitest';
import { alphaFor } from './solution-alpha';

describe('alphaFor', () => {
  it('returns 1.0 for ready + high', () => {
    expect(alphaFor('ready', 'high')).toBe(1.0);
  });

  it('returns 0.85 for ready + mid', () => {
    expect(alphaFor('ready', 'mid')).toBe(0.85);
  });

  it('returns 0.7 for ready + low', () => {
    expect(alphaFor('ready', 'low')).toBe(0.7);
  });

  it('returns 0.85 for ready without explicit confidence (deterministic)', () => {
    expect(alphaFor('ready', null)).toBe(0.85);
    expect(alphaFor('ready', undefined)).toBe(0.85);
  });

  it('returns 0.4 for failed', () => {
    expect(alphaFor('failed', null)).toBe(0.4);
  });

  it('returns 0.6 for pending and none', () => {
    expect(alphaFor('pending', null)).toBe(0.6);
    expect(alphaFor('none', null)).toBe(0.6);
  });

  it('returns 0.5 for unsupported', () => {
    expect(alphaFor('unsupported', null)).toBe(0.5);
  });

  // Sprint G5 — dismissStatus dominates solutionStatus.
  it('dismissed dominates over solution-status (alpha 0.2)', () => {
    expect(alphaFor('ready', 'high', 'dismissed')).toBe(0.2);
    expect(alphaFor('none', null, 'dismissed')).toBe(0.2);
  });

  it('snoozed dominates over solution-status (alpha 0.3)', () => {
    expect(alphaFor('ready', 'high', 'snoozed')).toBe(0.3);
    expect(alphaFor('none', null, 'snoozed')).toBe(0.3);
  });

  it('active passes through to solution-status mapping', () => {
    expect(alphaFor('ready', 'high', 'active')).toBe(1.0);
    expect(alphaFor('none', null, 'active')).toBe(0.6);
  });
});
