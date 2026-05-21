"use client";

import { useEffect, useState } from "react";

/**
 * Mobile-Viewport-Detection für PixiJS-Sprite-Sizing. WCAG-Hit-Areas (44/64 px)
 * sind viewport-unabhängig — diese Logik betrifft nur das Visual.
 *
 * Threshold 640px = Tailwind `sm`-Breakpoint, der überall im Repo schon das
 * "Mobile vs Tablet"-Pivot ist.
 */
const MOBILE_QUERY = "(max-width: 639px)";

/**
 * Server-safe sync check. SSR returns false → Desktop-Sized Sprites werden
 * gerendert, dann hydratisiert der Client mit `useIsMobile()` und kann
 * korrigieren. Für GalaxieScene-Mount reicht der sync-Check, weil Pixi
 * sowieso erst client-side gemountet wird.
 */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * Reactive Hook. Sub-Effect mit `matchMedia` Listener — kein ResizeObserver
 * nötig, da nur eine boolesche Schwelle. Triggert Re-Render bei
 * Phone-Rotation oder Window-Resize.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}
