"use client";

import { useEffect, useState } from "react";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reactive `prefers-reduced-motion`-Hook. SSR initial-Value `false`, weil wir
 * Server-Side die User-Preference nicht kennen — der Client korrigiert nach
 * Hydration. Listener auf `change`, damit ein OS-Setting-Wechsel direkt einen
 * Re-Render auslöst (z.B. GalaxieRoot → PixiJS ↔ StaticGalaxieSVG).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOTION_QUERY);
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
