import { describe, expect, it } from 'vitest';
import {
  PUBLIC_TOP_LEVEL,
  resolveInternalCustomerRedirect,
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

  it('maps /customers → /<slug>/customers (Routes-Konsolidierung May 19, 2026)', () => {
    expect(resolveLegacyRedirect('/customers', 'acme')).toBe('/acme/customers');
  });

  it('returns null for unmapped paths', () => {
    expect(resolveLegacyRedirect('/random', 'acme')).toBeNull();
  });
});

describe('resolveInternalCustomerRedirect (customer-route-rename May 21, 2026)', () => {
  it('drops /c/ subpath: /<slug>/customers/c/<id> → /<slug>/customers/<id>', () => {
    expect(resolveInternalCustomerRedirect('/acme/customers/c/abc-123')).toBe(
      '/acme/customers/abc-123',
    );
  });

  it('handles nested sub-paths beyond /c/<id>', () => {
    expect(
      resolveInternalCustomerRedirect('/acme/customers/c/abc/something-else'),
    ).toBe('/acme/customers/abc/something-else');
  });

  it('returns null for already-flat customer-routes', () => {
    expect(
      resolveInternalCustomerRedirect('/acme/customers/abc-123'),
    ).toBeNull();
  });

  it('returns null for repo-routes (already correctly named)', () => {
    expect(resolveInternalCustomerRedirect('/acme/repos/abc-123')).toBeNull();
  });

  it('returns null for the workspace-customers list (no detail-id)', () => {
    expect(resolveInternalCustomerRedirect('/acme/customers')).toBeNull();
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
    expect(shouldAttemptRedirect('/trust/dpa')).toBe(false);
  });

  it('still attempts redirect for legacy /customers/c/<id> direct-links', () => {
    // Routes-Konsolidierung (May 19, 2026): /customers/c/<id> bookmarks still
    // need to be rewritten to /<slug>/customers/c/<id>.
    expect(shouldAttemptRedirect('/customers/c/abc')).toBe(true);
  });

  it('attempts redirect for legacy routes', () => {
    expect(shouldAttemptRedirect('/billing')).toBe(true);
    expect(shouldAttemptRedirect('/dashboard')).toBe(true);
    expect(shouldAttemptRedirect('/scans/abc')).toBe(true);
  });
});
