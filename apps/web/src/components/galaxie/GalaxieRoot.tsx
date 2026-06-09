'use client';

import dynamic from 'next/dynamic';
import { useState, type ReactNode } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import type { MotionValue } from 'motion/react';
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
  /**
   * Landing-Redesign Phase I.3 — scroll-driven camera progress (0..1). When set,
   * the Pixi scene's camera follows this (spring-smoothed) value through a
   * waypoint tour instead of auto-touring. Only honoured on the Pixi path; the
   * reduced-motion (SVG) + mobile (list) fallbacks ignore it. Spread into
   * GalaxieScene below.
   */
  cameraProgress?: MotionValue<number>;
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
  // Landing (static-demo) keeps the bare canvas — no app chrome, no toggle.
  if (props.mode === 'static-demo') {
    return <GalaxieScene {...props} />;
  }
  // Desktop interactive: the PixiJS canvas is mouse-only (WCAG 2.1.1). Offer a
  // keyboard-reachable List-view toggle that swaps in the fully-accessible
  // SolarListView (focusable rows → same Inspector). K-A11Y1.
  return <InteractiveGalaxie {...props} />;
}

function InteractiveGalaxie(props: GalaxieRootProps) {
  const [view, setView] = useState<'galaxy' | 'list'>('galaxy');
  return (
    <div className="relative h-full w-full">
      <div
        role="group"
        aria-label="Galaxie view"
        className="absolute right-3 top-3 z-50 flex items-center gap-0.5 rounded-md border border-white/10 bg-black/70 p-0.5 backdrop-blur"
      >
        <ViewButton
          active={view === 'galaxy'}
          onClick={() => setView('galaxy')}
          icon={<LayoutGrid className="size-3.5" aria-hidden />}
          label="Galaxy view"
        />
        <ViewButton
          active={view === 'list'}
          onClick={() => setView('list')}
          icon={<List className="size-3.5" aria-hidden />}
          label="List view (keyboard accessible)"
        />
      </div>
      {view === 'list' ? (
        <SolarListView
          initialData={props.initialData}
          readOnly={props.readOnly}
          workspaceSlug={props.initialWorkspaceSlug}
        />
      ) : (
        <GalaxieScene {...props} />
      )}
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={
        'flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ' +
        (active
          ? 'bg-white/15 text-white'
          : 'text-white/60 hover:text-white hover:bg-white/5')
      }
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}
