// Pure-function redirect-resolver used by middleware.ts.
// Map legacy top-level routes to their workspace-scoped equivalents.
// Returns null when the URL doesn't need rewriting (no redirect).

const LEGACY_MAP: Record<string, string> = {
  '/billing': '/{slug}/settings/billing',
  '/dashboard': '/{slug}',
  '/onboarding': '/{slug}',
  '/scans': '/{slug}/scans',
  '/drift': '/{slug}/drift',
  '/skills': '/{slug}/skills',
  '/status': '/{slug}/status',
};

// Public + legitimate top-level routes that must NOT redirect.
export const PUBLIC_TOP_LEVEL = new Set<string>([
  '/',
  '/login',
  '/pricing',
  '/galaxie-dev',
  '/trust',
  '/trust/dpa',
  '/trust/eval',
  '/customers',
  '/requests',
  '/bip',
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
  if (pathname.startsWith('/customers/')) return false;
  if (pathname.startsWith('/trust/')) return false;
  if (pathname.includes('.')) return false; // asset files (favicon etc)
  return true;
}
