import { describe, expect, it } from 'vitest';
import {
  SEVERITY_HEX,
  SEVERITY_PIXI,
  hexToPixiNumber,
  severityHex,
  severityPixiColor,
} from './severity-colors';
import { SEVERITY_BANDS } from './types';

describe('severity-colors', () => {
  it('covers every severity band', () => {
    for (const band of SEVERITY_BANDS) {
      expect(SEVERITY_HEX[band]).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(SEVERITY_PIXI[band]).toBeGreaterThan(0);
    }
  });

  it('hexToPixiNumber parses #dc2626 → 0xdc2626', () => {
    expect(hexToPixiNumber('#dc2626')).toBe(0xdc2626);
    expect(hexToPixiNumber('dc2626')).toBe(0xdc2626);
  });

  it('Kill is red, Exceptional is gold', () => {
    expect(severityHex('Kill')).toBe('#dc2626');
    expect(severityHex('Exceptional')).toBe('#fbbf24');
    expect(severityPixiColor('Strong')).toBe(0x3b82f6);
  });
});
