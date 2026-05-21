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

  it('Kill is red, Exceptional is the brighter green', () => {
    // Frontend-Relaunch v2 (May 2026): three-tier traffic-light palette,
    // Strong+Exceptional both green; Exceptional is the brighter shade.
    expect(severityHex('Kill')).toBe('#dc2f2f');
    expect(severityHex('Exceptional')).toBe('#6fb685');
    expect(severityPixiColor('Strong')).toBe(0x4f9466);
  });
});
