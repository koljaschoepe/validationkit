/**
 * Sixty static star-particles filling the Repo-Galaxie viewport.
 * Deterministic seed (FNV-style) so SSR + CSR render identical positions —
 * no hydration mismatch, no twinkle, no animation. Calm, premium, minimal.
 */

const VIEWBOX_WIDTH = 1120;
const VIEWBOX_HEIGHT = 840;
const STAR_COUNT = 100;

interface Star {
  x: number;
  y: number;
  r: number;
}

const STARS: readonly Star[] = (() => {
  const result: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const a = ((i * 9301 + 49297) % 233280) / 233280;
    const b = ((i * 27361 + 11329) % 233280) / 233280;
    const c = ((i * 53971 + 90017) % 233280) / 233280;
    result.push({
      x: (a - 0.5) * VIEWBOX_WIDTH,
      y: (b - 0.5) * VIEWBOX_HEIGHT,
      r: 0.3 + c * 0.4, // 0.3 — 0.7 px, subtle size variance
    });
  }
  return result;
})();

export function BackgroundStars() {
  return (
    <g aria-hidden="true">
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="white"
          opacity={0.12}
        />
      ))}
    </g>
  );
}
