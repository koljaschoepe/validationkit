// Pure-function redirect-resolver used by middleware.ts.
// Map legacy top-level routes to their workspace-scoped equivalents.
// Returns null when the URL doesn't need rewriting (no redirect).

// Homepage-Relaunch (May 2026) dropped /drift, /bip, /skills, /onboarding,
// /galaxie-dev. Routes-Konsolidierung (May 19, 2026) moved /scans, /customers,
// and /requests under /[workspace]/* — legacy URLs stay redirected so
// external bookmarks survive.
const LEGACY_MAP: Record<string, string> = {
  '/billing': '/{slug}/settings/billing',
  '/dashboard': '/{slug}',
  '/scans': '/{slug}/scans',
  '/customers': '/{slug}/customers',
  '/requests': '/{slug}/requests',
};

// Public + legitimate top-level routes that must NOT redirect.
export const PUBLIC_TOP_LEVEL = new Set<string>([
  '/',
  '/login',
  '/pricing',
  '/trust',
  '/trust/dpa',
  '/trust/eval',
  '/status',
]);

export function resolveLegacyRedirect(
  pathname: string,
  workspaceSlug: string | null,
): string | null {
  if (!workspaceSlug) return null;
  // Exact-match against the legacy table.
  for (const [legacy, target] of Object.entries(LEGACY_MAP)) {
    if (pathname === legacy) {
      return target.replace('{slug}', workspaceSlug);
    }
    if (pathname.startsWith(legacy + '/')) {
      const tail = pathname.slice(legacy.length);
      return target.replace('{slug}', workspaceSlug) + tail;
    }
  }
  return null;
}

/**
 * Decide whether the middleware should even attempt a redirect.
 * Skip api/ + _next/ + statically-public routes and prefixes-with-leading-segment
 * that already start with a known workspace slug (handled by app-router).
 */
export function shouldAttemptRedirect(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/_next/')) return false;
  if (pathname.startsWith('/.well-known/')) return false;
  if (PUBLIC_TOP_LEVEL.has(pathname)) return false;
  if (pathname.startsWith('/trust/')) return false;
  if (pathname.includes('.')) return false; // asset files (favicon etc)
  return true;
}
