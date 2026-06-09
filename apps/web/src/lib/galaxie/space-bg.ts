import type { CSSProperties } from 'react';

/**
 * Galaxie-Redesign Phase F — deep-space background shared by the Pixi canvas
 * host and the static SVG fallback (behind the transparent canvas): edge
 * vignette + soft nebula tints + scattered starfields (prime-ish tile sizes so
 * the stars don't read as a grid). CSS-only — no WebGL cost.
 */
export const SPACE_BG: CSSProperties = {
  backgroundColor: '#06080c',
  backgroundImage: [
    'radial-gradient(ellipse 120% 120% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)',
    'radial-gradient(40% 50% at 72% 68%, rgba(86,52,120,0.16) 0%, rgba(0,0,0,0) 70%)',
    'radial-gradient(45% 40% at 25% 30%, rgba(40,70,120,0.14) 0%, rgba(0,0,0,0) 70%)',
    'radial-gradient(1px 1px at 40px 60px, rgba(255,255,255,0.75) 50%, transparent 52%)',
    'radial-gradient(1px 1px at 130px 90px, rgba(255,255,255,0.5) 50%, transparent 52%)',
    'radial-gradient(1.5px 1.5px at 80px 160px, rgba(255,255,255,0.6) 50%, transparent 52%)',
  ].join(', '),
  backgroundSize:
    '100% 100%, 100% 100%, 100% 100%, 137px 137px, 211px 211px, 89px 89px',
  backgroundRepeat: 'no-repeat, no-repeat, no-repeat, repeat, repeat, repeat',
};
