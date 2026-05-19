import { describe, expect, it } from 'vitest';
import {
  DISMISS_REASONS,
  isGitHubAppConfigured,
  isValidDismissReason,
  resolveApplyMode,
  snoozeDurationToDate,
} from './apply-mode';

describe('resolveApplyMode', () => {
  it('repo-override wins over customer-default', () => {
    expect(resolveApplyMode('direct', 'pr')).toBe('pr');
    expect(resolveApplyMode('pr', 'direct')).toBe('direct');
  });

  it('falls back to customer-default when repo-override is missing', () => {
    expect(resolveApplyMode('direct', null)).toBe('direct');
    expect(resolveApplyMode('pr', undefined)).toBe('pr');
  });

  it('falls back to "pr" when both are null/garbage', () => {
    expect(resolveApplyMode(null, null)).toBe('pr');
    expect(resolveApplyMode('', '')).toBe('pr');
    expect(resolveApplyMode('xyz', 'unknown')).toBe('pr');
  });

  it('case-insensitive', () => {
    expect(resolveApplyMode('PR', 'DIRECT')).toBe('direct');
  });
});

describe('isGitHubAppConfigured', () => {
  it('returns false when env is empty', () => {
    expect(isGitHubAppConfigured({})).toBe(false);
  });

  it('returns false when only some vars are set', () => {
    expect(isGitHubAppConfigured({ GITHUB_APP_ID: '123' })).toBe(false);
    expect(
      isGitHubAppConfigured({
        GITHUB_APP_ID: '123',
        GITHUB_APP_CLIENT_ID: 'Iv1',
      }),
    ).toBe(false);
  });

  it('returns true when all three are set', () => {
    expect(
      isGitHubAppConfigured({
        GITHUB_APP_ID: '123',
        GITHUB_APP_CLIENT_ID: 'Iv1',
        GITHUB_APP_PRIVATE_KEY: '-----BEGIN-----',
      }),
    ).toBe(true);
  });
});

describe('snoozeDurationToDate', () => {
  const REF = new Date('2026-05-19T12:00:00Z');

  it('24h adds 86400000ms', () => {
    expect(snoozeDurationToDate('24h', REF).toISOString()).toBe(
      '2026-05-20T12:00:00.000Z',
    );
  });

  it('7d adds 7 * 86400000ms', () => {
    expect(snoozeDurationToDate('7d', REF).toISOString()).toBe(
      '2026-05-26T12:00:00.000Z',
    );
  });

  it('forever maps to year 9999', () => {
    const d = snoozeDurationToDate('forever', REF);
    expect(d.getUTCFullYear()).toBe(9999);
  });
});

describe('isValidDismissReason', () => {
  it('accepts the canonical 3 reasons', () => {
    for (const r of DISMISS_REASONS) {
      expect(isValidDismissReason(r)).toBe(true);
    }
  });
  it('rejects unknown reasons', () => {
    expect(isValidDismissReason('lazy')).toBe(false);
    expect(isValidDismissReason('')).toBe(false);
  });
});
