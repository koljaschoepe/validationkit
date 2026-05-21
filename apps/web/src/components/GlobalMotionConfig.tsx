'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * GlobalMotionConfig — Phase Nova-2 P7.
 *
 * Wraps the entire app in `<MotionConfig reducedMotion="user">` so any
 * Motion-animation in any client tree automatically respects the OS-level
 * `prefers-reduced-motion: reduce` setting. Page-level MotionConfig (e.g.
 * HeroSection's per-popover override) still takes precedence when present.
 */
export function GlobalMotionConfig({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
