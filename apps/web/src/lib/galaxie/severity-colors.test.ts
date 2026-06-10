import { describe, expect, it } from 'vitest';
import { SEVERITY_COLOR, severityColorVar } from './severity-colors';
import { SEVERITY_BANDS } from './types';

describe('severity-colors', () => {
  it('maps every severity band to its --color-sev-* CSS variable', () => {
    for (const band of SEVERITY_BANDS) {
      expect(SEVERITY_COLOR[band]).toMatch(/^var\(--color-sev-[a-z]+\)$/);
    }
  });

  it('severityColorVar returns the CSS-var reference, not a hardcoded hex', () => {
    expect(severityColorVar('Kill')).toBe('var(--color-sev-kill)');
    expect(severityColorVar('Weak')).toBe('var(--color-sev-weak)');
    expect(severityColorVar('Mid')).toBe('var(--color-sev-mid)');
    expect(severityColorVar('Strong')).toBe('var(--color-sev-strong)');
    expect(severityColorVar('Exceptional')).toBe('var(--color-sev-exceptional)');
  });
});
