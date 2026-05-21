'use client';

import { useEffect, useState } from 'react';

/**
 * useMediaQuery — SSR-safe matchMedia hook.
 *
 * Defaults to `false` on the server / first render so hydration matches
 * mobile-first markup. The real value resolves in a layout-effect tick.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);

  return matches;
}

/** Convenience: `true` below 768 px (Tailwind `md:` breakpoint). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
