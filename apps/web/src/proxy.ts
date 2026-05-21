import { NextResponse, type NextRequest } from 'next/server';
import {
  resolveLegacyRedirect,
  resolveInternalCustomerRedirect,
  shouldAttemptRedirect,
} from '@/lib/middleware-redirects';

// Sprint G6 — legacy → workspace-scoped redirects.
//
// Next.js 16 renamed `middleware.ts` to `proxy.ts` (Node.js runtime default).
// We resolve the workspace slug by reading the `vk_default_workspace_slug`
// cookie that the app sets after login. Server pages always re-check
// membership via the DAL, so the proxy stays permissive without weakening
// security.
//
// This is intentionally simple — server pages always re-check membership via
// the DAL, so the middleware can be permissive without weakening security.

export const config = {
  matcher: [
    // Exclude _next, api, static files, and anything with a dot (asset URLs).
    '/((?!_next/|api/|.well-known/|favicon\\.ico).*)',
  ],
};

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!shouldAttemptRedirect(pathname)) return NextResponse.next();

  // 1) Workspace-scoped internal redirects (customer-route-rename, May 2026).
  //    These don't need a cookie — slug is in the path itself.
  const internalTarget = resolveInternalCustomerRedirect(pathname);
  if (internalTarget) {
    const url = request.nextUrl.clone();
    url.pathname = internalTarget;
    return NextResponse.redirect(url, 308);
  }

  // 2) Legacy top-level redirects (workspace-route-consolidation, Sprint G6).
  const slug =
    request.cookies.get('vk_default_workspace_slug')?.value ?? null;
  const target = resolveLegacyRedirect(pathname, slug);
  if (!target) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url, 308);
}
