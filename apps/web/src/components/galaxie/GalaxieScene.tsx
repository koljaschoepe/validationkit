'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Text, type FederatedPointerEvent } from 'pixi.js';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useGesture } from '@use-gesture/react';
import gsap from 'gsap';
import { generateMockGalaxieData } from '@/lib/galaxie/mock-data';
import { computeLayout } from '@/lib/galaxie/layout';
import type { LayoutNode } from '@/lib/galaxie/types';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/galaxie/mock-workspaces';
import { Camera } from './pixi/Camera';
import { CustomerStar } from './pixi/CustomerStar';
import { RepoMoon } from './pixi/RepoMoon';
import { FileAsteroid } from './pixi/FileAsteroid';
import { GalaxieTooltip, type TooltipState } from './Tooltip';
import { ZoomIndicator } from './ZoomIndicator';
import { MiniMap } from './MiniMap';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { UniversalSearch, type SearchResult } from './UniversalSearch';

extend({ Container, Graphics, Text });

interface ZoomLevel {
  x: number;
  y: number;
  scale: number;
}

function computeZoomLevels(): ZoomLevel[] {
  const data = generateMockGalaxieData();
  const layout = computeLayout(data);
  const customers = layout.nodes.filter((n) => n.level === 1);
  const focus = (
    c: { x: number; y: number } | undefined,
    scale: number,
  ): ZoomLevel =>
    c ? { x: -c.x * scale, y: -c.y * scale, scale } : { x: 0, y: 0, scale };
  return [
    { x: 0, y: 0, scale: 0.45 }, // 0 — overview
    { x: 0, y: 0, scale: 1.0 }, // 1 — default
    focus(customers[0], 1.7),
    focus(customers[1], 1.7),
    focus(customers[2], 1.7),
  ];
}

const ZOOM_LEVELS = computeZoomLevels();

export default function GalaxieScene() {
  const searchParams = useSearchParams();
  const isDebug = searchParams?.get('debug') === '1';
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [workspace, setWorkspace] = useState(DEFAULT_WORKSPACE_SLUG);

  const cameraRef = useRef<Camera>(new Camera());
  const worldRef = useRef<Container | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  // Cache mock-layout for search jumps + minimap (so we don't regen per pick).
  const layoutCacheRef = useRef<Map<string, LayoutNode> | null>(null);
  if (!layoutCacheRef.current) {
    const data = generateMockGalaxieData();
    const layout = computeLayout(data);
    layoutCacheRef.current = new Map(layout.nodes.map((n) => [n.id, n]));
  }

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
      tweenTo(ZOOM_LEVELS[idx]!);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tweenTo]);

  const handleSearchPick = useCallback(
    (res: SearchResult) => {
      const cache = layoutCacheRef.current;
      if (!cache) return;
      const targetNode =
        res.kind === 'file' && res.file ? cache.get(res.file.id) : cache.get(res.customer.id);
      if (!targetNode) return;
      const scale = res.kind === 'file' ? 3.5 : 1.7;
      tweenTo({ x: -targetNode.x * scale, y: -targetNode.y * scale, scale });
    },
    [tweenTo],
  );

  const handleMiniMapJump = useCallback(
    (worldX: number, worldY: number) => {
      const scale = cameraRef.current.scale;
      tweenTo({ x: -worldX * scale, y: -worldY * scale, scale });
    },
    [tweenTo],
  );

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
            />
          </Application>

          <WorkspaceSwitcher current={workspace} onChange={setWorkspace} />
          <ZoomIndicator
            camera={cameraRef.current}
            onReset={() => tweenTo(ZOOM_LEVELS[1]!)}
          />
          <MiniMap
            camera={cameraRef.current}
            viewportSize={size}
            onJump={handleMiniMapJump}
          />
          <UniversalSearch onPick={handleSearchPick} />

          {tooltip && <GalaxieTooltip state={tooltip} />}
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
}: {
  worldRef: MutableRefObject<Container | null>;
  centerX: number;
  centerY: number;
  camera: Camera;
  onHover: (state: TooltipState | null) => void;
}) {
  const localRef = useRef<Container | null>(null);

  useEffect(() => {
    const world = localRef.current;
    if (!world) return;
    worldRef.current = world;

    const data = generateMockGalaxieData();
    const layout = computeLayout(data);
    const byId = new Map<string, LayoutNode>(
      layout.nodes.map((n) => [n.id, n]),
    );

    const children: Container[] = [];
    for (const c of data.customers) {
      const ln = byId.get(c.id);
      if (ln) children.push(new CustomerStar(c, ln));
    }
    for (const r of data.repos) {
      const ln = byId.get(r.id);
      if (ln) children.push(new RepoMoon(r, ln));
    }
    for (const f of data.files) {
      const ln = byId.get(f.id);
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

    world.on('pointerover', onOver);
    world.on('pointerout', onOut);

    return () => {
      world.off('pointerover', onOver);
      world.off('pointerout', onOut);
      for (const c of children) {
        world.removeChild(c);
        c.destroy({ children: true });
      }
      worldRef.current = null;
    };
  }, [worldRef, onHover]);

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
