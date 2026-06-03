'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Text, type FederatedPointerEvent } from 'pixi.js';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGesture } from '@use-gesture/react';
import gsap from 'gsap';
import { generateMockGalaxieData } from '@/lib/galaxie/mock-data';
import { computeLayout } from '@/lib/galaxie/layout';
import {
  computeSolarLayout,
  getClusterCenters,
} from '@/lib/galaxie/solar-layout';
import type {
  FileNode,
  FolderNode,
  GalaxieData,
  InspectorTarget,
  LayoutNode,
  Severity,
  SolarLayoutNode,
} from '@/lib/galaxie/types';
import { extractTopFolder } from '@/lib/galaxie/solar-layout';
import { getPulseDuration } from '@/lib/galaxie/severity-colors';
import { isMobileViewport } from '@/lib/galaxie/device';
import {
  DEFAULT_WORKSPACE_SLUG,
  MOCK_WORKSPACES,
  type MockWorkspace,
} from '@/lib/galaxie/mock-workspaces';
import { Camera } from './pixi/Camera';
import { RepoSun } from './pixi/RepoSun';
import { FolderPlanet } from './pixi/FolderPlanet';
import { FilePlanet } from './pixi/FilePlanet';
import { ensureBadgeTexturesReady } from './pixi/edge-badge-texture';
import { EdgeContainer, SelectedEdgeContainer } from './pixi/edges';
import { OrbitContainer } from './pixi/orbits';
import { GalaxieTooltip, type TooltipState } from './Tooltip';
import { ZoomIndicator } from './ZoomIndicator';
import { MiniMap } from './MiniMap';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { UniversalSearch, type SearchResult } from './UniversalSearch';
import { Inspector } from './Inspector';
import { type OnboardingState } from './OnboardingBanner';
import { ActivationChecklist } from './ActivationChecklist';
import { EmptyGalaxie } from './EmptyGalaxie';

extend({ Container, Graphics, Text });

interface ZoomLevel {
  x: number;
  y: number;
  scale: number;
}

interface InitialZoomLevel {
  x: number;
  y: number;
  scale: number;
}

interface GalaxieSceneProps {
  initialData?: GalaxieData;
  initialWorkspaceSlug?: string;
  workspaces?: MockWorkspace[];
  onboarding?: OnboardingState;
  /** See GalaxieRootProps.mode. */
  mode?: 'interactive' | 'static-demo';
  /** When true, the inspector renders apply/dismiss as sign-in CTAs. */
  readOnly?: boolean;
  /** Initial camera position. Falls back to zoomLevels[1] (scale 1.0). */
  initialZoomLevel?: InitialZoomLevel;
  /** Landing auto-tour — see GalaxieRootProps.enableAutoTour. */
  enableAutoTour?: boolean;
}

export default function GalaxieScene({
  initialData,
  initialWorkspaceSlug,
  workspaces,
  onboarding,
  mode = 'interactive',
  readOnly = false,
  initialZoomLevel,
  enableAutoTour = false,
}: GalaxieSceneProps = {}) {
  const isStatic = mode === 'static-demo';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDebug = searchParams?.get('debug') === '1';
  const fileParam = searchParams?.get('file') ?? null;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  // Sub-B — edge-badge textures rasterize asynchronously. Until ready, planet
  // sprites mount without badges; we re-render when the promise resolves.
  const [badgesReady, setBadgesReady] = useState(false);
  // Sub-C — Datadog pivot state. `inspectorTarget` drives both the side-panel
  // and the dim-others tween (via `selectedNodeId` derived below).
  const [inspectorTarget, setInspectorTarget] = useState<InspectorTarget | null>(
    null,
  );
  const switcherWorkspaces = workspaces ?? MOCK_WORKSPACES;
  const [workspace, setWorkspace] = useState(
    initialWorkspaceSlug ?? switcherWorkspaces[0]?.slug ?? DEFAULT_WORKSPACE_SLUG,
  );

  const cameraRef = useRef<Camera>(new Camera());
  const worldRef = useRef<Container | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  // Data + layout are stable for the lifetime of the component.
  // Switching workspaces is a hard nav (server re-render), so useMemo is fine here.
  const galaxieData = useMemo(
    () => initialData ?? generateMockGalaxieData(),
    [initialData],
  );

  // Sprint G6 — empty-state when the real workspace has 0 customers.
  // Mock-data always has customers, so the public demo skips this branch.
  const isEmptyRealWorkspace =
    initialData !== undefined && initialData.customers.length === 0;

  const selectedNodeId =
    inspectorTarget?.kind === 'file'
      ? inspectorTarget.file.id
      : inspectorTarget?.kind === 'folder'
        ? inspectorTarget.folder.id
        : null;

  // Sub-A — Solar-Layout (Sonnensystem-pro-Repo, Multi-Sonnen-Cluster pro Customer).
  // Drives GalaxieWorld rendering. See `docs/plans/galaxie-workspace-solar-A-layout.md`.
  const solarLayout = useMemo(() => computeSolarLayout(galaxieData), [galaxieData]);
  const solarLayoutById = useMemo(
    () =>
      new Map<string, SolarLayoutNode>(
        solarLayout.nodes.map((n) => [n.id, n]),
      ),
    [solarLayout],
  );

  // Legacy bridge for MiniMap — MiniMap still consumes the old 3-level layout
  // and will migrate in a follow-up phase. Both layouts read the same
  // `galaxieData`, so they stay in sync.
  const legacyLayout = useMemo(() => computeLayout(galaxieData), [galaxieData]);
  const legacyLayoutById = useMemo(
    () => new Map<string, LayoutNode>(legacyLayout.nodes.map((n) => [n.id, n])),
    [legacyLayout],
  );

  const zoomLevels = useMemo<ZoomLevel[]>(() => {
    const centers = getClusterCenters(galaxieData);
    const focus = (
      c: { x: number; y: number } | undefined,
      scale: number,
    ): ZoomLevel =>
      c ? { x: -c.x * scale, y: -c.y * scale, scale } : { x: 0, y: 0, scale };
    return [
      { x: 0, y: 0, scale: 0.45 },
      { x: 0, y: 0, scale: 1.0 },
      focus(centers[0], 1.7),
      focus(centers[1], 1.7),
      focus(centers[2], 1.7),
    ];
  }, [galaxieData]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const update = () =>
      setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Kick off the badge-texture rasterizer once. The promise is idempotent, so
  // safe to call from multiple GalaxieScene instances (e.g. workspace + demo).
  useEffect(() => {
    let cancelled = false;
    ensureBadgeTexturesReady().then(() => {
      if (!cancelled) setBadgesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyCamera = useCallback(() => {
    if (!size || !worldRef.current) return;
    cameraRef.current.applyTo(worldRef.current, size.w / 2, size.h / 2);
  }, [size]);

  // Apply initial camera position once `size` becomes available. Landing uses
  // scale ~0.45 (full galaxy fits in 60vh hero); workspace default is 1.0.
  const initialCameraAppliedRef = useRef(false);
  useEffect(() => {
    if (initialCameraAppliedRef.current) return;
    if (!size || !worldRef.current) return;
    if (zoomLevels.length < 2) return;
    const target = initialZoomLevel ?? zoomLevels[1]!;
    cameraRef.current.x = target.x;
    cameraRef.current.y = target.y;
    cameraRef.current.scale = target.scale;
    applyCamera();
    initialCameraAppliedRef.current = true;
  }, [size, zoomLevels, initialZoomLevel, applyCamera]);

  const tweenTo = useCallback(
    (target: ZoomLevel) => {
      gsap.killTweensOf(cameraRef.current);
      gsap.to(cameraRef.current, {
        x: target.x,
        y: target.y,
        scale: target.scale,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: applyCamera,
      });
    },
    [applyCamera],
  );

  useGesture(
    {
      onDrag: ({ delta: [dx, dy], pinching, cancel }) => {
        if (isStatic) return;
        if (pinching) return cancel();
        cameraRef.current.panBy(dx, dy);
        applyCamera();
      },
      onWheel: ({ delta: [, dy], event }) => {
        if (isStatic) return;
        if (!hostRef.current || !size) return;
        event.preventDefault?.();
        const rect = hostRef.current.getBoundingClientRect();
        const clientX =
          'clientX' in event
            ? (event as MouseEvent).clientX
            : rect.left + rect.width / 2;
        const clientY =
          'clientY' in event
            ? (event as MouseEvent).clientY
            : rect.top + rect.height / 2;
        const ax = clientX - rect.left - size.w / 2;
        const ay = clientY - rect.top - size.h / 2;
        const factor = Math.pow(1.0015, -dy);
        cameraRef.current.zoomAt(factor, ax, ay);
        applyCamera();
      },
      onPinch: ({ offset: [s], origin: [ox, oy], memo, first }) => {
        if (isStatic) return memo;
        if (!hostRef.current || !size) return memo;
        const rect = hostRef.current.getBoundingClientRect();
        const ax = ox - rect.left - size.w / 2;
        const ay = oy - rect.top - size.h / 2;
        const startScale = first ? cameraRef.current.scale : (memo ?? cameraRef.current.scale);
        const target = Math.max(0.3, Math.min(8, startScale * s));
        const factor = target / cameraRef.current.scale;
        cameraRef.current.zoomAt(factor, ax, ay);
        applyCamera();
        return startScale;
      },
    },
    {
      target: hostRef,
      drag: { filterTaps: true, enabled: !isStatic },
      wheel: { eventOptions: { passive: false }, enabled: !isStatic },
      pinch: { scaleBounds: { min: 0.3, max: 8 }, rubberband: false, enabled: !isStatic },
    },
  );

  // Cmd+0/1/2/3/4 keyboard tween — disabled in static-demo mode.
  useEffect(() => {
    if (isStatic) return;
    const handleKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const idx = ['0', '1', '2', '3', '4'].indexOf(e.key);
      if (idx === -1) return;
      e.preventDefault();
      tweenTo(zoomLevels[idx]!);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tweenTo, isStatic, zoomLevels]);

  // Sprint G3 — single helper to derive a tween target from a node id.
  // Sub-A: looks up against the solar layout (suns + folders + root files).
  const tweenToNode = useCallback(
    (nodeId: string, scale: number) => {
      const node = solarLayoutById.get(nodeId);
      if (!node) return;
      tweenTo({ x: -node.x * scale, y: -node.y * scale, scale });
    },
    [tweenTo, solarLayoutById],
  );

  // Customer search results have no own sprite in the solar layout — tween to
  // the cluster center instead.
  const tweenToCustomerCluster = useCallback(
    (customerId: string, scale: number) => {
      const center = getClusterCenters(galaxieData).find(
        (c) => c.customerId === customerId,
      );
      if (!center) return;
      tweenTo({ x: -center.x * scale, y: -center.y * scale, scale });
    },
    [tweenTo, galaxieData],
  );

  const handleSearchPick = useCallback(
    (res: SearchResult) => {
      if (res.kind === 'file' && res.file) {
        tweenToNode(res.file.id, 3.5);
      } else {
        tweenToCustomerCluster(res.customer.id, 1.7);
      }
    },
    [tweenToNode, tweenToCustomerCluster],
  );

  const handleMiniMapJump = useCallback(
    (worldX: number, worldY: number) => {
      const scale = cameraRef.current.scale;
      tweenTo({ x: -worldX * scale, y: -worldY * scale, scale });
    },
    [tweenTo],
  );

  // Sub-C — file-mode open: persist via ?file= URL param so reloads restore it.
  const openFileInspector = useCallback(
    (file: FileNode) => {
      setInspectorTarget({ kind: 'file', file });
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('file', file.id);
      // Cast: Next 16 typed-routes can't express dynamic query strings here.
      router.replace(
        `${pathname}?${params.toString()}` as never,
        { scroll: false },
      );
    },
    [router, pathname, searchParams],
  );

  // Sub-C — folder-mode open: ephemeral state, no URL sync (folder ids are
  // synthetic `${repoId}::folder::${name}` which would clutter the URL).
  const openFolderInspector = useCallback(
    (folder: FolderNode) => {
      const files = galaxieData.files.filter(
        (f) =>
          f.repoId === folder.repoId &&
          extractTopFolder(f.path) === folder.name,
      );
      setInspectorTarget({ kind: 'folder', folder, files });
    },
    [galaxieData.files],
  );

  const closeInspector = useCallback(() => {
    setInspectorTarget(null);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('file');
    const qs = params.toString();
    router.replace((qs ? `${pathname}?${qs}` : pathname) as never, {
      scroll: false,
    });
  }, [router, pathname, searchParams]);

  // Sub-C — Sun-Click is camera-only (no pivot, no dim, no panel). Folder/File
  // open the Datadog pivot via setInspectorTarget; GalaxieWorld observes the
  // resulting `selectedNodeId` and runs the dim-others tween + sticky edge.
  const handleSunClick = useCallback(
    (repoId: string) => {
      if (isStatic) return;
      tweenToNode(repoId, 1.7);
    },
    [tweenToNode, isStatic],
  );

  const handleFolderClick = useCallback(
    (folderId: string) => {
      if (isStatic) return;
      const folder = solarLayout.folders.find((f) => f.id === folderId);
      if (!folder) return;
      openFolderInspector(folder);
      tweenToNode(folderId, 4);
    },
    [tweenToNode, isStatic, solarLayout.folders, openFolderInspector],
  );

  const handleFileClick = useCallback(
    (fileId: string) => {
      const file = galaxieData.files.find((f) => f.id === fileId);
      if (!file) return;
      openFileInspector(file);
      if (!isStatic) tweenToNode(fileId, 5);
    },
    [galaxieData.files, openFileInspector, tweenToNode, isStatic],
  );

  // Folder-Inspector row-click drills into a single file. We also re-pivot so
  // the camera follows the selection — keeps the spatial mental model.
  const handleSelectFileFromFolder = useCallback(
    (file: FileNode) => {
      openFileInspector(file);
      if (!isStatic) tweenToNode(file.id, 5);
    },
    [openFileInspector, tweenToNode, isStatic],
  );

  // Auto-tour for the landing static-demo. After warm-up, cycle through
  // critical findings (camera-zoom → open inspector → 2.2s pause → close →
  // zoom back → next). First user interaction stops the loop permanently;
  // a "Replay tour" link reappears. `prefers-reduced-motion` skips the tour.
  const tourPausedRef = useRef(false);
  const [tourPaused, setTourPaused] = useState(false);
  const tourActiveRef = useRef(false);

  useEffect(() => {
    if (!enableAutoTour) return;
    if (!size) return;
    if (zoomLevels.length === 0) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    if (tourActiveRef.current) return;
    tourActiveRef.current = true;

    let cancelled = false;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const targets = galaxieData.files
      .filter((f) => f.severity === 'Kill' || f.severity === 'Weak')
      .slice(0, 3);
    if (targets.length === 0) {
      tourActiveRef.current = false;
      return;
    }

    async function runTour() {
      // Warm-up — let the user see the overview first.
      await sleep(1500);
      let idx = 0;
      while (!cancelled && !tourPausedRef.current) {
        const file = targets[idx % targets.length]!;
        idx += 1;

        // Zoom to file (kein URL-Update — tour bypassed openInspector router.replace).
        tweenToNode(file.id, 4);
        await sleep(900);
        if (cancelled || tourPausedRef.current) return;

        setInspectorTarget({ kind: 'file', file });
        await sleep(2200);
        if (cancelled || tourPausedRef.current) return;

        setInspectorTarget(null);
        const overview = zoomLevels[0];
        if (overview) tweenTo(overview);
        await sleep(1500);
      }
    }

    runTour();

    return () => {
      cancelled = true;
      tourActiveRef.current = false;
    };
  }, [
    enableAutoTour,
    size,
    galaxieData.files,
    tweenToNode,
    tweenTo,
    zoomLevels,
  ]);

  // Pause-listener: any user interaction stops the tour permanently
  // (until the user clicks "Replay tour").
  useEffect(() => {
    if (!enableAutoTour) return;
    if (tourPaused) return;
    const onUserAction = () => {
      tourPausedRef.current = true;
      setTourPaused(true);
    };
    window.addEventListener('pointerdown', onUserAction);
    window.addEventListener('wheel', onUserAction);
    window.addEventListener('keydown', onUserAction);
    window.addEventListener('touchstart', onUserAction);
    return () => {
      window.removeEventListener('pointerdown', onUserAction);
      window.removeEventListener('wheel', onUserAction);
      window.removeEventListener('keydown', onUserAction);
      window.removeEventListener('touchstart', onUserAction);
    };
  }, [enableAutoTour, tourPaused]);

  const replayTour = useCallback(() => {
    tourPausedRef.current = false;
    tourActiveRef.current = false;
    setInspectorTarget(null);
    setTourPaused(false);
  }, []);

  // Deep-link: on first mount, if ?file=… is set, open + zoom to that file.
  const deepLinkAppliedRef = useRef(false);
  useEffect(() => {
    if (deepLinkAppliedRef.current) return;
    if (!fileParam) return;
    if (!size) return;
    const file = galaxieData.files.find((f) => f.id === fileParam);
    if (!file || !solarLayoutById.has(fileParam)) {
      // Unknown id — silently strip from URL.
      closeInspector();
      deepLinkAppliedRef.current = true;
      return;
    }
    setInspectorTarget({ kind: 'file', file });
    tweenToNode(fileParam, 5);
    deepLinkAppliedRef.current = true;
  }, [
    fileParam,
    size,
    galaxieData.files,
    solarLayoutById,
    tweenToNode,
    closeInspector,
  ]);

  if (isEmptyRealWorkspace) {
    return <EmptyGalaxie workspaceSlug={workspace} />;
  }

  return (
    <div
      ref={hostRef}
      className="relative h-full w-full touch-none overflow-hidden bg-black"
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {onboarding ? (
        <ActivationChecklist
          state={{
            workspaceId: onboarding.workspaceId,
            customerCount: onboarding.customerCount,
            repoCount: onboarding.repoCount,
            scanCount: onboarding.scanCount,
            applyCount: onboarding.applyCount ?? 0,
            memberCount: onboarding.memberCount ?? 0,
            gitHubAppConfigured: onboarding.gitHubAppConfigured,
          }}
          workspaceSlug={workspace}
        />
      ) : null}
      {size && (
        <>
          <Application
            width={size.w}
            height={size.h}
            backgroundColor={0x0a0a0a}
            backgroundAlpha={0}
            antialias
            autoDensity
            resolution={
              typeof window !== 'undefined' ? window.devicePixelRatio : 1
            }
          >
            <GalaxieWorld
              worldRef={worldRef}
              centerX={size.w / 2}
              centerY={size.h / 2}
              camera={cameraRef.current}
              onHover={setTooltip}
              onSunClick={handleSunClick}
              onFolderClick={handleFolderClick}
              onFileClick={handleFileClick}
              data={galaxieData}
              folders={solarLayout.folders}
              layoutById={solarLayoutById}
              badgesReady={badgesReady}
              selectedNodeId={selectedNodeId}
            />
          </Application>

          {!isStatic && (
            <>
              <WorkspaceSwitcher
                current={workspace}
                onChange={setWorkspace}
                workspaces={switcherWorkspaces}
              />
              <ZoomIndicator
                camera={cameraRef.current}
                onReset={() => tweenTo(zoomLevels[1]!)}
              />
              <MiniMap
                camera={cameraRef.current}
                viewportSize={size}
                onJump={handleMiniMapJump}
                data={galaxieData}
                layoutById={legacyLayoutById}
              />
              <UniversalSearch onPick={handleSearchPick} data={galaxieData} />
            </>
          )}

          {inspectorTarget && (
            <Inspector
              target={inspectorTarget}
              onClose={closeInspector}
              onSelectFile={handleSelectFileFromFolder}
              readOnly={readOnly}
            />
          )}
          {tooltip && !inspectorTarget && <GalaxieTooltip state={tooltip} />}
          {enableAutoTour && tourPaused && (
            <button
              type="button"
              onClick={replayTour}
              className="absolute bottom-3 left-3 z-10 rounded-md border border-white/15 bg-black/70 px-2.5 py-1 font-mono type-mono-sm uppercase tracking-wider text-white/70 backdrop-blur transition hover:bg-white/10 hover:text-white"
            >
              Replay tour →
            </button>
          )}
          {isDebug && <FPSCounter />}
          {isDebug && <KeyHintOverlay />}
        </>
      )}
    </div>
  );
}

type SolarSprite = RepoSun | FolderPlanet | FilePlanet;

function severityOf(target: SolarSprite): Severity {
  if (target instanceof FilePlanet) return target.file.severity;
  if (target instanceof FolderPlanet) return target.folder.aggregateSeverity;
  return target.repo.aggregateSeverity;
}

function GalaxieWorld({
  worldRef,
  centerX,
  centerY,
  camera,
  onHover,
  onSunClick,
  onFolderClick,
  onFileClick,
  data,
  folders,
  layoutById,
  badgesReady,
  selectedNodeId,
}: {
  worldRef: MutableRefObject<Container | null>;
  centerX: number;
  centerY: number;
  camera: Camera;
  onHover: (state: TooltipState | null) => void;
  onSunClick: (repoId: string) => void;
  onFolderClick: (folderId: string) => void;
  onFileClick: (fileId: string) => void;
  data: GalaxieData;
  folders: FolderNode[];
  layoutById: Map<string, SolarLayoutNode>;
  badgesReady: boolean;
  selectedNodeId: string | null;
}) {
  const localRef = useRef<Container | null>(null);
  // Stable sprite map for diff-updates (avoids destroy + rebuild on every
  // `data` change). Lifecycle owned by the mount-effect below.
  const spritesRef = useRef<Map<string, Container>>(new Map());
  // GSAP context for hover + pulse tweens. Sub-B reintroduces the Kill pulse
  // (removed in Sub-A while everything was neutral-grey).
  const ctxRef = useRef<gsap.Context | null>(null);
  // Sub-C — hover/select reveal layers. Each owns a single Graphics object so
  // a single GSAP tween on its Container.alpha fades the whole layer at once
  // (master plan §5.1, QC4). All four live as direct children of `worldRef`
  // below the sprite layer so planets render above their edges + orbits.
  const orbitContainerRef = useRef<OrbitContainer | null>(null);
  const edgeContainerRef = useRef<EdgeContainer | null>(null);
  const hoverEdgeRef = useRef<SelectedEdgeContainer | null>(null);
  const selectedEdgeRef = useRef<SelectedEdgeContainer | null>(null);

  // Mount-effect (runs once per Container): ctx setup, event handlers, teardown.
  useEffect(() => {
    const world = localRef.current;
    if (!world) return;
    worldRef.current = world;

    const ctx = gsap.context(() => {}, world);
    ctxRef.current = ctx;

    world.eventMode = 'passive';

    // Reveal layers — z-order back-to-front: orbits → edges → hover-edge →
    // selected-edge. Sprites are addChild'd onto `world` later by the diff
    // effect, so they render above all reveal layers.
    const orbits = new OrbitContainer();
    const edges = new EdgeContainer();
    const hoverEdge = new SelectedEdgeContainer();
    const selectedEdge = new SelectedEdgeContainer();
    world.addChild(orbits);
    world.addChild(edges);
    world.addChild(hoverEdge);
    world.addChild(selectedEdge);
    orbitContainerRef.current = orbits;
    edgeContainerRef.current = edges;
    hoverEdgeRef.current = hoverEdge;
    selectedEdgeRef.current = selectedEdge;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Start the Kill-only pulse on a sprite. Hover-out tween re-arms this so
    // the canvas keeps breathing after the cursor leaves a Kill planet.
    const startPulse = (sprite: Container, severity: Severity) => {
      if (reducedMotion) return;
      const duration = getPulseDuration(severity);
      if (duration === null) return;
      ctx.add(() => {
        gsap.to(sprite.scale, {
          x: 1.12,
          y: 1.12,
          duration,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
      });
    };

    const onOver = (e: FederatedPointerEvent) => {
      const target = e.target;
      const orbits = orbitContainerRef.current;
      const edges = edgeContainerRef.current;
      const hoverEdge = hoverEdgeRef.current;

      if (target instanceof RepoSun) {
        target.setHoverGlow(true);
        if (orbits) {
          gsap.killTweensOf(orbits);
          ctx.add(() => {
            gsap.to(orbits, { alpha: 0.18, duration: 0.2, ease: 'power2.out' });
          });
        }
        if (edges) {
          gsap.killTweensOf(edges);
          ctx.add(() => {
            gsap.to(edges, { alpha: 0.15, duration: 0.2, ease: 'power2.out' });
          });
        }
        return;
      }

      if (target instanceof FilePlanet || target instanceof FolderPlanet) {
        target.setHoverGlow(true);
        gsap.killTweensOf(target.scale);
        ctx.add(() => {
          gsap.to(target.scale, {
            x: 1.08,
            y: 1.08,
            duration: 0.2,
            ease: 'power2.out',
          });
        });

        // Single hover edge from the planet to its sun (Master §5.4 alpha 0.25).
        const parentSunId =
          target instanceof FilePlanet
            ? target.file.repoId
            : target.folder.repoId;
        const sunSprite = spritesRef.current.get(parentSunId);
        if (hoverEdge && sunSprite) {
          hoverEdge.drawSegment(
            { x: sunSprite.x, y: sunSprite.y },
            { x: target.x, y: target.y },
          );
          gsap.killTweensOf(hoverEdge);
          ctx.add(() => {
            gsap.to(hoverEdge, { alpha: 0.25, duration: 0.2, ease: 'power2.out' });
          });
        }

        const global = target.getGlobalPosition();
        const tooltipTarget =
          target instanceof FilePlanet
            ? ({ kind: 'file' as const, file: target.file })
            : ({ kind: 'folder' as const, folder: target.folder });
        onHover({ x: global.x, y: global.y, target: tooltipTarget });
      }
    };

    const onOut = (e: FederatedPointerEvent) => {
      const target = e.target;
      const orbits = orbitContainerRef.current;
      const edges = edgeContainerRef.current;
      const hoverEdge = hoverEdgeRef.current;

      if (target instanceof RepoSun) {
        target.setHoverGlow(false);
        if (orbits) {
          gsap.killTweensOf(orbits);
          ctx.add(() => {
            gsap.to(orbits, { alpha: 0, duration: 0.2, ease: 'power2.out' });
          });
        }
        if (edges) {
          gsap.killTweensOf(edges);
          ctx.add(() => {
            gsap.to(edges, { alpha: 0, duration: 0.2, ease: 'power2.out' });
          });
        }
        return;
      }

      if (target instanceof FilePlanet || target instanceof FolderPlanet) {
        target.setHoverGlow(false);
        gsap.killTweensOf(target.scale);
        const sev = severityOf(target);
        ctx.add(() => {
          gsap.to(target.scale, {
            x: 1,
            y: 1,
            duration: 0.2,
            ease: 'power2.out',
            onComplete: () => startPulse(target, sev),
          });
        });

        if (hoverEdge) {
          gsap.killTweensOf(hoverEdge);
          ctx.add(() => {
            gsap.to(hoverEdge, {
              alpha: 0,
              duration: 0.2,
              ease: 'power2.out',
              onComplete: () => hoverEdge.clearSegment(),
            });
          });
        }
        onHover(null);
      }
    };

    const onTap = (e: FederatedPointerEvent) => {
      const target = e.target;
      if (target instanceof FilePlanet) {
        onFileClick(target.file.id);
      } else if (target instanceof FolderPlanet) {
        onFolderClick(target.folder.id);
      } else if (target instanceof RepoSun) {
        onSunClick(target.repo.id);
      }
    };

    world.on('pointerover', onOver);
    world.on('pointerout', onOut);
    world.on('pointertap', onTap);

    // Expose startPulse on the world so the diff-effect can rearm pulses after
    // a severity change without re-creating the GSAP context. We stash it on a
    // symbol-keyed field rather than module-scope to keep one Galaxie instance
    // per pulse-pool (multiple scenes can coexist in dev React StrictMode).
    (world as unknown as { __startPulse?: typeof startPulse }).__startPulse = startPulse;

    return () => {
      ctx.revert();
      ctxRef.current = null;
      world.off('pointerover', onOver);
      world.off('pointerout', onOut);
      world.off('pointertap', onTap);
      for (const sprite of spritesRef.current.values()) {
        world.removeChild(sprite);
        sprite.destroy({ children: true });
      }
      spritesRef.current.clear();
      for (const layer of [orbits, edges, hoverEdge, selectedEdge]) {
        world.removeChild(layer);
        layer.destroy({ children: true });
      }
      orbitContainerRef.current = null;
      edgeContainerRef.current = null;
      hoverEdgeRef.current = null;
      selectedEdgeRef.current = null;
      worldRef.current = null;
    };
  }, [worldRef, onHover, onSunClick, onFolderClick, onFileClick]);

  // Diff-effect: add new entities, reposition existing, destroy orphans, and
  // re-render severity / dismiss / solution-status on changed entities.
  useEffect(() => {
    const world = localRef.current;
    if (!world) return;
    const startPulse =
      (world as unknown as { __startPulse?: (s: Container, sev: Severity) => void })
        .__startPulse;

    const sprites = spritesRef.current;
    const nextIds = new Set<string>();

    const isMobile = isMobileViewport();
    const sunScale = isMobile ? 1.4 : 1;
    const folderScale = isMobile ? 1.6 : 1;
    const fileScale = isMobile ? 1.8 : 1;

    const fileById = new Map(data.files.map((f) => [f.id, f]));

    // Layer 1 — Suns
    for (const repo of data.repos) {
      nextIds.add(repo.id);
      const existing = sprites.get(repo.id);
      const node = layoutById.get(repo.id);
      if (!node) continue;
      if (existing instanceof RepoSun) {
        existing.x = node.x;
        existing.y = node.y;
        existing.updateRepo(repo);
      } else {
        const sprite = new RepoSun(repo, node, sunScale);
        world.addChild(sprite);
        sprites.set(repo.id, sprite);
      }
    }

    // Layer 2 — Folder planets
    for (const folder of folders) {
      nextIds.add(folder.id);
      const existing = sprites.get(folder.id);
      const node = layoutById.get(folder.id);
      if (!node) continue;
      if (existing instanceof FolderPlanet) {
        existing.x = node.x;
        existing.y = node.y;
        existing.updateFolder(folder);
      } else {
        const sprite = new FolderPlanet(folder, node, folderScale);
        world.addChild(sprite);
        sprites.set(folder.id, sprite);
      }
    }

    // Layer 3 — File planets (root files only — foldered files render through
    // the folder pivot in Sub-C; in Sub-A they are not rendered).
    for (const node of layoutById.values()) {
      if (node.kind !== 'file') continue;
      nextIds.add(node.id);
      const existing = sprites.get(node.id);
      const file = fileById.get(node.id);
      if (!file) continue;
      if (existing instanceof FilePlanet) {
        existing.x = node.x;
        existing.y = node.y;
        const wasPulsing = existing.file.severity === 'Kill';
        existing.updateFile(file);
        // Pulse restart when Kill state toggles.
        if (file.severity === 'Kill' && !wasPulsing) {
          gsap.killTweensOf(existing.scale);
          existing.scale.set(1);
          startPulse?.(existing, 'Kill');
        } else if (wasPulsing && file.severity !== 'Kill') {
          gsap.killTweensOf(existing.scale);
          existing.scale.set(1);
        }
      } else {
        const sprite = new FilePlanet(file, node, fileScale);
        world.addChild(sprite);
        sprites.set(node.id, sprite);
        if (file.severity === 'Kill') startPulse?.(sprite, 'Kill');
      }
    }

    // Remove sprites whose underlying entity disappeared.
    for (const [id, sprite] of sprites) {
      if (!nextIds.has(id)) {
        gsap.killTweensOf(sprite.scale);
        world.removeChild(sprite);
        sprite.destroy({ children: true });
        sprites.delete(id);
      }
    }

    // Redraw the reveal layers from the same layout snapshot.
    const sunNodes = [...layoutById.values()].filter((n) => n.kind === 'sun');
    const childNodes = [...layoutById.values()].filter((n) => n.kind !== 'sun');
    const sunPositions = new Map<string, { x: number; y: number }>(
      sunNodes.map((s) => [s.id, { x: s.x, y: s.y }]),
    );
    orbitContainerRef.current?.redraw(sunNodes);
    edgeContainerRef.current?.redraw(sunPositions, childNodes);
  }, [data, folders, layoutById]);

  // Badge-cache becomes ready after async rasterization. Refresh every mounted
  // sprite so the badges that were skipped at mount-time now appear.
  useEffect(() => {
    if (!badgesReady) return;
    for (const sprite of spritesRef.current.values()) {
      if (sprite instanceof RepoSun) sprite.refreshBadgeFromTextureCache();
      else if (sprite instanceof FolderPlanet) sprite.refreshBadgeFromTextureCache();
      else if (sprite instanceof FilePlanet) sprite.refreshBadgeFromTextureCache();
    }
  }, [badgesReady]);

  // Sub-C — Datadog pivot dim tween. When `selectedNodeId` changes, fade every
  // non-selected sprite toward 0.15 of its current alpha (preserving Sub-B's
  // solution-status / dismiss alpha as the baseline). On close, restore. The
  // sticky edge from selected → its sun is drawn into `selectedEdgeRef` and
  // tweened to alpha 0.30 so it survives the dim cascade.
  const baseAlphasRef = useRef<Map<string, number>>(new Map());
  const dimProxyRef = useRef({ value: 1 });
  useEffect(() => {
    const ctx = ctxRef.current;
    const selectedEdge = selectedEdgeRef.current;
    if (!ctx) return;

    const applyDim = () => {
      const v = dimProxyRef.current.value;
      for (const [id, sprite] of spritesRef.current) {
        const base = baseAlphasRef.current.get(id) ?? 1;
        sprite.alpha = id === selectedNodeId ? base : base * (0.15 + (1 - 0.15) * v);
      }
    };

    if (selectedNodeId) {
      // Cache current alphas as the dim baseline (before any tween changes).
      baseAlphasRef.current.clear();
      for (const [id, sprite] of spritesRef.current) {
        baseAlphasRef.current.set(id, sprite.alpha);
      }
      gsap.killTweensOf(dimProxyRef.current);
      dimProxyRef.current.value = 1;
      ctx.add(() => {
        gsap.to(dimProxyRef.current, {
          value: 0,
          duration: 0.2,
          ease: 'power2.out',
          onUpdate: applyDim,
        });
      });

      // Sticky selected-edge from the selected sprite to its parent sun.
      const selectedSprite = spritesRef.current.get(selectedNodeId);
      const selectedNode = layoutById.get(selectedNodeId);
      const parentSunId =
        selectedNode?.kind === 'sun' ? null : selectedNode?.parentSunId;
      const sunSprite = parentSunId
        ? spritesRef.current.get(parentSunId)
        : null;
      if (selectedEdge && selectedSprite && sunSprite) {
        selectedEdge.drawSegment(
          { x: sunSprite.x, y: sunSprite.y },
          { x: selectedSprite.x, y: selectedSprite.y },
        );
        gsap.killTweensOf(selectedEdge);
        ctx.add(() => {
          gsap.to(selectedEdge, {
            alpha: 0.3,
            duration: 0.2,
            ease: 'power2.out',
          });
        });
      }
    } else {
      // Pivot close — restore + clear edge.
      gsap.killTweensOf(dimProxyRef.current);
      ctx.add(() => {
        gsap.to(dimProxyRef.current, {
          value: 1,
          duration: 0.2,
          ease: 'power2.out',
          onUpdate: applyDim,
          onComplete: () => {
            // Lock alphas to base; clear cache for the next pivot.
            for (const [id, sprite] of spritesRef.current) {
              const base = baseAlphasRef.current.get(id) ?? sprite.alpha;
              sprite.alpha = base;
            }
            baseAlphasRef.current.clear();
          },
        });
      });
      if (selectedEdge) {
        gsap.killTweensOf(selectedEdge);
        ctx.add(() => {
          gsap.to(selectedEdge, {
            alpha: 0,
            duration: 0.2,
            ease: 'power2.out',
            onComplete: () => selectedEdge.clearSegment(),
          });
        });
      }
    }
  }, [selectedNodeId, layoutById]);

  useEffect(() => {
    if (localRef.current) camera.applyTo(localRef.current, centerX, centerY);
  }, [centerX, centerY, camera]);

  return <pixiContainer ref={localRef} />;
}

function FPSCounter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      frames += 1;
      if (t - last >= 1000) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded bg-black/70 px-2 py-1 font-mono text-xs text-green-400">
      {fps} FPS
    </div>
  );
}

function KeyHintOverlay() {
  return (
    <div className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-black/70 px-2 py-1 font-mono type-mono-sm leading-tight text-white/60">
      <div>drag · pan</div>
      <div>wheel · zoom</div>
      <div>⌘0–4 · snap</div>
      <div>⌘K · search</div>
    </div>
  );
}
