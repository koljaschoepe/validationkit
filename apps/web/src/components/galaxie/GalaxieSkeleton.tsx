/**
 * Galaxie-Skeleton — replaces the "Loading galaxie…" plain-text fallback
 * with a structured visual hint: dark background + faint dot-grid + three
 * pulsing customer-sized circles at the default layout positions.
 *
 * Pure server-component friendly: no `'use client'`, no React hooks. Used by
 *  - `GalaxieRoot.tsx` (`dynamic({ loading })`) — Pixi chunk is loading
 *  - `[workspace]/page.tsx` (`<Suspense fallback>`) — server data loading
 */
export function GalaxieSkeleton() {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center bg-black"
      role="status"
      aria-busy="true"
      aria-label="Loading galaxie"
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Three pulsing customer-circles at a triangle, mimicking the layout. */}
      <svg
        className="absolute inset-0 m-auto"
        width="320"
        height="240"
        viewBox="0 0 320 240"
        aria-hidden="true"
      >
        <circle
          cx="80"
          cy="80"
          r="22"
          fill="rgba(255,255,255,0.08)"
          className="animate-pulse"
        />
        <circle
          cx="240"
          cy="100"
          r="22"
          fill="rgba(255,255,255,0.08)"
          className="animate-pulse [animation-delay:200ms]"
        />
        <circle
          cx="160"
          cy="180"
          r="22"
          fill="rgba(255,255,255,0.08)"
          className="animate-pulse [animation-delay:400ms]"
        />
      </svg>
      <p className="relative z-10 font-mono text-xs text-white/40">
        Rendering constellation…
      </p>
    </div>
  );
}
