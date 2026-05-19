'use client';

import dynamic from 'next/dynamic';
import type { GalaxieData } from '@/lib/galaxie/types';
import type { MockWorkspace } from '@/lib/galaxie/mock-workspaces';

// Pixi touches `window` at module-eval time → bypass SSR strictly via dynamic + ssr:false.
// This wrapper MUST stay client-side; never import GalaxieScene directly from a server component.
const GalaxieScene = dynamic(() => import('./GalaxieScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="font-mono text-xs text-muted-foreground">
        Loading galaxie…
      </div>
    </div>
  ),
});

export interface GalaxieRootProps {
  /** When provided, the scene renders this real data instead of mock-data. */
  initialData?: GalaxieData;
  initialWorkspaceSlug?: string;
  /** Optional workspace list — overrides MOCK_WORKSPACES in the switcher. */
  workspaces?: MockWorkspace[];
}

export default function GalaxieRoot(props: GalaxieRootProps) {
  return <GalaxieScene {...props} />;
}
