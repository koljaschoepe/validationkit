import { describe, expect, it } from 'vitest';
import {
  PUBLIC_TOP_LEVEL,
  resolveLegacyRedirect,
  shouldAttemptRedirect,
} from './middleware-redirects';

describe('resolveLegacyRedirect', () => {
  it('maps /billing → /<slug>/settings/billing', () => {
    expect(resolveLegacyRedirect('/billing', 'acme')).toBe(
      '/acme/settings/billing',
    );
  });

  it('maps /dashboard → /<slug>', () => {
    expect(resolveLegacyRedirect('/dashboard', 'acme')).toBe('/acme');
  });

  it('preserves nested tail (/scans/123 → /<slug>/scans/123)', () => {
    expect(resolveLegacyRedirect('/scans/abc-123', 'acme')).toBe(
      '/acme/scans/abc-123',
    );
  });

  it('returns null when no workspace slug is known', () => {
    expect(resolveLegacyRedirect('/billing', null)).toBeNull();
  });

  it('returns null for unmapped paths', () => {
    expect(resolveLegacyRedirect('/customers', 'acme')).toBeNull();
    expect(resolveLegacyRedirect('/random', 'acme')).toBeNull();
  });
});

describe('shouldAttemptRedirect', () => {
  it('skips api + _next + asset paths', () => {
    expect(shouldAttemptRedirect('/api/auth/foo')).toBe(false);
    expect(shouldAttemptRedirect('/_next/static/x')).toBe(false);
    expect(shouldAttemptRedirect('/favicon.ico')).toBe(false);
  });

  it('skips public + workspace-scoped routes', () => {
    for (const p of PUBLIC_TOP_LEVEL) {
      expect(shouldAttemptRedirect(p)).toBe(false);
    }
    expect(shouldAttemptRedirect('/customers/c/abc')).toBe(false);
    expect(shouldAttemptRedirect('/trust/dpa')).toBe(false);
  });

  it('attempts redirect for legacy routes', () => {
    expect(shouldAttemptRedirect('/billing')).toBe(true);
    expect(shouldAttemptRedirect('/dashboard')).toBe(true);
    expect(shouldAttemptRedirect('/scans/abc')).toBe(true);
  });
});
