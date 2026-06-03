'use client';

import dynamic from 'next/dynamic';
import type { GalaxieData } from '@/lib/galaxie/types';
import type { MockWorkspace } from '@/lib/galaxie/mock-workspaces';
import type { OnboardingState } from './OnboardingBanner';
import { GalaxieSkeleton } from './GalaxieSkeleton';
import { StaticGalaxieSVG } from './StaticGalaxieSVG';
import { SolarListView } from './SolarListView';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { useIsMobile } from '@/lib/galaxie/device';

// Pixi touches `window` at module-eval time → bypass SSR strictly via dynamic + ssr:false.
// This wrapper MUST stay client-side; never import GalaxieScene directly from a server component.
const GalaxieScene = dynamic(() => import('./GalaxieScene'), {
  ssr: false,
  loading: () => <GalaxieSkeleton />,
});

export type GalaxieMode = 'interactive' | 'static-demo';

export interface InitialZoomLevel {
  x: number;
  y: number;
  scale: number;
}

export interface GalaxieRootProps {
  /** When provided, the scene renders this real data instead of mock-data. */
  initialData?: GalaxieData;
  initialWorkspaceSlug?: string;
  /** Optional workspace list — overrides MOCK_WORKSPACES in the switcher. */
  workspaces?: MockWorkspace[];
  /** Sprint G6 — onboarding-checklist state for the inline banner. */
  onboarding?: OnboardingState;
  /**
   * Render mode. `interactive` (default) wires pan/drag/wheel/pinch +
   * keyboard shortcuts + workspace-switcher + universal-search. `static-demo`
   * is the landing-page mode: sprites stay clickable (file → inspector
   * popup) but the canvas does NOT pan/zoom on scroll or drag, and the
   * heavy chrome (switcher, search, mini-map, zoom-indicator) is hidden.
   */
  mode?: GalaxieMode;
  /** When mode='static-demo', renders the inspector in read-only form. */
  readOnly?: boolean;
  /**
   * Initial camera position. Defaults to the second zoom level (scale 1.0).
   * Landing uses 0.45 (full overview) so all sprites fit the 60vh hero.
   */
  initialZoomLevel?: InitialZoomLevel;
  /**
   * Landing auto-tour. When true, after a 1.5s warm-up the scene cycles
   * through critical findings: zoom to file → open inspector for 2.2s →
   * close → zoom back to overview → next file. Stops permanently on first
   * user interaction (click/wheel/key/touch). Respects
   * `prefers-reduced-motion` (tour is skipped entirely).
   */
  enableAutoTour?: boolean;
}

export default function GalaxieRoot(props: GalaxieRootProps) {
  // Sub-C — mobile (≤639 px, Tailwind `sm`) gets the SolarListView instead of
  // PixiJS. The static-demo mode (landing) stays on PixiJS so the marketing
  // page keeps its galaxy hero on phones. Both checks run before reduced-motion
  // so a mobile reduced-motion user still gets the list (rather than an SVG
  // galaxy on a phone screen).
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();

  if (props.mode !== 'static-demo' && isMobile) {
    return (
      <SolarListView
        initialData={props.initialData}
        readOnly={props.readOnly}
        workspaceSlug={props.initialWorkspaceSlug}
      />
    );
  }
  if (reducedMotion) {
    return (
      <StaticGalaxieSVG
        initialData={props.initialData}
        readOnly={props.readOnly}
        onboarding={props.onboarding}
        workspaceSlug={props.initialWorkspaceSlug}
      />
    );
  }
  return <GalaxieScene {...props} />;
}
