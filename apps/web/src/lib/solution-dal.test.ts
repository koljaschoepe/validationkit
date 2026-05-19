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
});
