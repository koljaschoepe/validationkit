'use client';

import dynamic from 'next/dynamic';

// Pixi touches `window` at module-eval time → bypass SSR strictly via dynamic + ssr:false.
// This wrapper MUST stay client-side; never import GalaxieScene directly from a server component.
const GalaxieScene = dynamic(() => import('./GalaxieScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <div className="font-mono text-xs text-muted-foreground">
        Loading galaxie…
      </div>
    </div>
  ),
});

export default function GalaxieRoot() {
  return <GalaxieScene />;
}
