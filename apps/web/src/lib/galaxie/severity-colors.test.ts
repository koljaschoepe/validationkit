import { describe, expect, it } from 'vitest';
import {
  DISMISSED_ALPHA,
  DISMISSED_FILL_HEX,
  SEVERITY_GLOW_RADIUS,
  SEVERITY_HEX,
  SEVERITY_OUTLINE_HEX,
  SEVERITY_PIXI,
  SEVERITY_PULSE_RATE,
  getPulseDuration,
  hexToPixiNumber,
  severityHex,
  severityPixiColor,
} from './severity-colors';
import { SEVERITY_BANDS } from './types';

describe('severity-colors', () => {
  it('covers every severity band with a valid hex + pixi number', () => {
    for (const band of SEVERITY_BANDS) {
      expect(SEVERITY_HEX[band]).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(SEVERITY_PIXI[band]).toBeGreaterThan(0);
    }
  });

  it('hexToPixiNumber parses #c64a3a → 0xc64a3a', () => {
    expect(hexToPixiNumber('#c64a3a')).toBe(0xc64a3a);
    expect(hexToPixiNumber('c64a3a')).toBe(0xc64a3a);
  });

  it('Kill is the only loud band — Asymm-Salienz (OKLCH-Hex)', () => {
    expect(severityHex('Kill')).toBe('#c64a3a');
    expect(severityHex('Weak')).toBe('#cf8a4f');
    expect(severityHex('Mid')).toBe('#9aa3b3');
    expect(severityHex('Strong')).toBe('#7eb8a4');
    expect(severityHex('Exceptional')).toBe('#acacac');
    expect(severityPixiColor('Kill')).toBe(0xc64a3a);
  });

  it('Exceptional is the only band with an outline', () => {
    expect(SEVERITY_OUTLINE_HEX.Exceptional).toBe('#7a73d8');
    expect(SEVERITY_OUTLINE_HEX.Kill).toBeUndefined();
    expect(SEVERITY_OUTLINE_HEX.Mid).toBeUndefined();
  });

  it('Dismissed fill + alpha match master-plan §5.3.3', () => {
    expect(DISMISSED_FILL_HEX).toBe('#4d4d4d');
    expect(DISMISSED_ALPHA).toBe(0.35);
  });

  it('Only Kill pulses; all other bands are static', () => {
    expect(SEVERITY_PULSE_RATE.Kill).toBeGreaterThan(0);
    expect(SEVERITY_PULSE_RATE.Weak).toBe(0);
    expect(SEVERITY_PULSE_RATE.Mid).toBe(0);
    expect(SEVERITY_PULSE_RATE.Strong).toBe(0);
    expect(SEVERITY_PULSE_RATE.Exceptional).toBe(0);
  });

  it('Only Kill glows (6 px); all other bands have glow-radius 0', () => {
    expect(SEVERITY_GLOW_RADIUS.Kill).toBe(6);
    expect(SEVERITY_GLOW_RADIUS.Weak).toBe(0);
    expect(SEVERITY_GLOW_RADIUS.Mid).toBe(0);
    expect(SEVERITY_GLOW_RADIUS.Strong).toBe(0);
    expect(SEVERITY_GLOW_RADIUS.Exceptional).toBe(0);
  });

  it('getPulseDuration(Kill) ≈ 0.8 s; non-Kill bands return null', () => {
    const killDuration = getPulseDuration('Kill');
    expect(killDuration).not.toBeNull();
    expect(killDuration!).toBeCloseTo(0.8, 2);
    expect(getPulseDuration('Weak')).toBeNull();
    expect(getPulseDuration('Mid')).toBeNull();
    expect(getPulseDuration('Strong')).toBeNull();
    expect(getPulseDuration('Exceptional')).toBeNull();
  });
});
