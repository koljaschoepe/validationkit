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
import type { GalaxieData, LayoutNode } from '@/lib/galaxie/types';
import {
  DEFAULT_WORKSPACE_SLUG,
  MOCK_WORKSPACES,
  type MockWorkspace,
} from '@/lib/galaxie/mock-workspaces';
import { Camera } from './pixi/Camera';
import { CustomerStar } from './pixi/CustomerStar';
import { RepoMoon } from './pixi/RepoMoon';
import { FileAsteroid } from './pixi/FileAsteroid';
import { GalaxieTooltip, type TooltipState } from './Tooltip';
import { ZoomIndicator } from './ZoomIndicator';
import { MiniMap } from './MiniMap';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { UniversalSearch, type SearchResult } from './UniversalSearch';
import { Inspector } from './Inspector';

extend({ Container, Graphics, Text });

interface ZoomLevel {
  x: number;
  y: number;
  scale: number;
}

interface GalaxieSceneProps {
  initialData?: GalaxieData;
  initialWorkspaceSlug?: string;
  workspaces?: MockWorkspace[];
}

export default function GalaxieScene({
  initialData,
  initialWorkspaceSlug,
  workspaces,
}: GalaxieSceneProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDebug = searchParams?.get('debug') === '1';
  const fileParam = searchParams?.get('file') ?? null;
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [inspectorFileId, setInspectorFileId] = useState<string | null>(
    fileParam,
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
  const galaxieLayout = useMemo(() => computeLayout(galaxieData), [galaxieData]);
  const layoutById = useMemo(
    () => new Map<string, LayoutNode>(galaxieLayout.nodes.map((n) => [n.id, n])),
    [galaxieLayout],
  );

  const zoomLevels = useMemo<ZoomLevel[]>(() => {
    const customers = galaxieLayout.nodes.filter((n) => n.level === 1);
    const focus = (
      c: { x: number; y: number } | undefined,
      scale: number,
    ): ZoomLevel =>
      c ? { x: -c.x * scale, y: -c.y * scale, scale } : { x: 0, y: 0, scale };
    return [
      { x: 0, y: 0, scale: 0.45 },
      { x: 0, y: 0, scale: 1.0 },
      focus(customers[0], 1.7),
      focus(customers[1], 1.7),
      focus(customers[2], 1.7),
    ];
  }, [galaxieLayout]);

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

  const applyCamera = useCallback(() => {
    if (!size || !worldRef.current) return;
    cameraRef.current.applyTo(worldRef.current, size.w / 2, size.h / 2);
  }, [size]);

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
        if (pinching) return cancel();
        cameraRef.current.panBy(dx, dy);
        applyCamera();
      },
      onWheel: ({ delta: [, dy], event }) => {
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
      drag: { filterTaps: true },
      wheel: { eventOptions: { passive: false } },
      pinch: { scaleBounds: { min: 0.3, max: 8 }, rubberband: false },
    },
  );

  // Cmd+0/1/2/3/4 keyboard tween
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const idx = ['0', '1', '2', '3', '4'].indexOf(e.key);
      if (idx === -1) return;
      e.preventDefault();
      tweenTo(zoomLevels[idx]!);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tweenTo]);

  // Sprint G3 — single helper to derive a tween target from a node id.
  const tweenToNode = useCallback(
    (nodeId: string, scale: number) => {
      const node = layoutById.get(nodeId);
      if (!node) return;
      tweenTo({ x: -node.x * scale, y: -node.y * scale, scale });
    },
    [tweenTo, layoutById],
  );

  const handleSearchPick = useCallback(
    (res: SearchResult) => {
      if (res.kind === 'file' && res.file) {
        tweenToNode(res.file.id, 3.5);
      } else {
        tweenToNode(res.customer.id, 1.7);
      }
    },
    [tweenToNode],
  );

  const handleMiniMapJump = useCallback(
    (worldX: number, worldY: number) => {
      const scale = cameraRef.current.scale;
      tweenTo({ x: -worldX * scale, y: -worldY * scale, scale });
    },
    [tweenTo],
  );

  // Sprint G3 — click-handlers wired into GalaxieWorld via props.
  const openInspector = useCallback(
    (fileId: string) => {
      setInspectorFileId(fileId);
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('file', fileId);
      // Cast: Next 16 typed-routes can't express dynamic query strings here.
      router.replace(
        `${pathname}?${params.toString()}` as never,
        { scroll: false },
      );
    },
    [router, pathname, searchParams],
  );

  const closeInspector = useCallback(() => {
    setInspectorFileId(null);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('file');
    const qs = params.toString();
    router.replace((qs ? `${pathname}?${qs}` : pathname) as never, {
      scroll: false,
    });
  }, [router, pathname, searchParams]);

  const handleCustomerClick = useCallback(
    (customerId: string) => tweenToNode(customerId, 1.7),
    [tweenToNode],
  );

  const handleRepoClick = useCallback(
    (repoId: string) => tweenToNode(repoId, 3.5),
    [tweenToNode],
  );

  const handleFileClick = useCallback(
    (fileId: string) => {
      openInspector(fileId);
      tweenToNode(fileId, 5);
    },
    [openInspector, tweenToNode],
  );

  // Deep-link: on first mount, if ?file=… is set, zoom to that file.
  const deepLinkAppliedRef = useRef(false);
  useEffect(() => {
    if (deepLinkAppliedRef.current) return;
    if (!fileParam) return;
    if (!size) return;
    if (!layoutById.has(fileParam)) {
      // Unknown id — silently strip from URL.
      closeInspector();
      deepLinkAppliedRef.current = true;
      return;
    }
    tweenToNode(fileParam, 5);
    deepLinkAppliedRef.current = true;
  }, [fileParam, size, layoutById, tweenToNode, closeInspector]);

  // The actual FileNode for the open inspector, looked up from data.
  const inspectorFile = useMemo(() => {
    if (!inspectorFileId) return null;
    return galaxieData.files.find((f) => f.id === inspectorFileId) ?? null;
  }, [inspectorFileId, galaxieData.files]);

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
              onCustomerClick={handleCustomerClick}
              onRepoClick={handleRepoClick}
              onFileClick={handleFileClick}
              data={galaxieData}
              layoutById={layoutById}
            />
          </Application>

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
            layoutById={layoutById}
          />
          <UniversalSearch onPick={handleSearchPick} data={galaxieData} />

          {inspectorFile && (
            <Inspector file={inspectorFile} onClose={closeInspector} />
          )}
          {tooltip && !inspectorFile && <GalaxieTooltip state={tooltip} />}
          {isDebug && <FPSCounter />}
          {isDebug && <KeyHintOverlay />}
        </>
      )}
    </div>
  );
}

function GalaxieWorld({
  worldRef,
  centerX,
  centerY,
  camera,
  onHover,
  onCustomerClick,
  onRepoClick,
  onFileClick,
  data,
  layoutById,
}: {
  worldRef: MutableRefObject<Container | null>;
  centerX: number;
  centerY: number;
  camera: Camera;
  onHover: (state: TooltipState | null) => void;
  onCustomerClick: (id: string) => void;
  onRepoClick: (id: string) => void;
  onFileClick: (id: string) => void;
  data: GalaxieData;
  layoutById: Map<string, LayoutNode>;
}) {
  const localRef = useRef<Container | null>(null);

  useEffect(() => {
    const world = localRef.current;
    if (!world) return;
    worldRef.current = world;

    const children: Container[] = [];
    for (const c of data.customers) {
      const ln = layoutById.get(c.id);
      if (ln) children.push(new CustomerStar(c, ln));
    }
    for (const r of data.repos) {
      const ln = layoutById.get(r.id);
      if (ln) children.push(new RepoMoon(r, ln));
    }
    for (const f of data.files) {
      const ln = layoutById.get(f.id);
      if (ln) children.push(new FileAsteroid(f, ln));
    }
    for (const c of children) world.addChild(c);

    world.eventMode = 'passive';

    const onOver = (e: FederatedPointerEvent) => {
      const target = e.target;
      if (target instanceof FileAsteroid) {
        const global = target.getGlobalPosition();
        onHover({ x: global.x, y: global.y, file: target.file });
      }
    };
    const onOut = (e: FederatedPointerEvent) => {
      if (e.target instanceof FileAsteroid) onHover(null);
    };

    // Sprint G3 — click-drill-in via pointertap (useGesture drag has
    // filterTaps:true so clean clicks bubble here without being eaten).
    const onTap = (e: FederatedPointerEvent) => {
      const target = e.target;
      if (target instanceof FileAsteroid) {
        onFileClick(target.file.id);
      } else if (target instanceof RepoMoon) {
        onRepoClick(target.repo.id);
      } else if (target instanceof CustomerStar) {
        onCustomerClick(target.customer.id);
      }
    };

    world.on('pointerover', onOver);
    world.on('pointerout', onOut);
    world.on('pointertap', onTap);

    return () => {
      world.off('pointerover', onOver);
      world.off('pointerout', onOut);
      world.off('pointertap', onTap);
      for (const c of children) {
        world.removeChild(c);
        c.destroy({ children: true });
      }
      worldRef.current = null;
    };
  }, [worldRef, onHover, onCustomerClick, onRepoClick, onFileClick, data, layoutById]);

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
    <div className="pointer-events-none absolute right-2 top-2 z-10 rounded bg-black/70 px-2 py-1 font-mono text-[10px] leading-tight text-white/60">
      <div>drag · pan</div>
      <div>wheel · zoom</div>
      <div>⌘0–4 · snap</div>
      <div>⌘K · search</div>
    </div>
  );
}
