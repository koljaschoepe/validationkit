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
import { Camera } from './pixi/Camera';
import { CustomerStar } from './pixi/CustomerStar';
import { RepoMoon } from './pixi/RepoMoon';
import { FileAsteroid } from './pixi/FileAsteroid';
import { GalaxieTooltip, type TooltipState } from './Tooltip';

extend({ Container, Graphics, Text });

interface ZoomLevel {
  x: number;
  y: number;
  scale: number;
}

// Sprint G3 (Inspector + Drill-In) replaces this with click-driven drill-targets.
// For now we derive snap-targets from the deterministic mock layout so the higher
// levels actually frame a customer-system instead of zooming into empty space.
function computeZoomLevels(): ZoomLevel[] {
  const data = generateMockGalaxieData();
  const layout = computeLayout(data);
  const customers = layout.nodes.filter((n) => n.level === 1);
  const focus = (
    c: { x: number; y: number } | undefined,
    scale: number,
  ): ZoomLevel =>
    c
      ? { x: -c.x * scale, y: -c.y * scale, scale }
      : { x: 0, y: 0, scale };
  return [
    { x: 0, y: 0, scale: 0.45 }, // 0 — overview
    { x: 0, y: 0, scale: 1.0 }, // 1 — galaxie default
    focus(customers[0], 1.7), // 2 — focus Customer 1 cluster
    focus(customers[1], 1.7), // 3 — focus Customer 2 cluster
    focus(customers[2], 1.7), // 4 — focus Customer 3 cluster
  ];
}

const ZOOM_LEVELS = computeZoomLevels();

export default function GalaxieScene() {
  const searchParams = useSearchParams();
  const isDebug = searchParams?.get('debug') === '1';
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const cameraRef = useRef<Camera>(new Camera());
  const worldRef = useRef<Container | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const update = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const applyCamera = useCallback(() => {
    if (!size || !worldRef.current) return;
    cameraRef.current.applyTo(worldRef.current, size.w / 2, size.h / 2);
  }, [size]);

  useGesture(
    {
      onDrag: ({ delta: [dx, dy] }) => {
        cameraRef.current.panBy(dx, dy);
        applyCamera();
      },
      onWheel: ({ delta: [, dy], event }) => {
        if (!hostRef.current || !size) return;
        event.preventDefault?.();
        const rect = hostRef.current.getBoundingClientRect();
        const clientX =
          'clientX' in event ? (event as MouseEvent).clientX : rect.left + rect.width / 2;
        const clientY =
          'clientY' in event ? (event as MouseEvent).clientY : rect.top + rect.height / 2;
        const ax = clientX - rect.left - size.w / 2;
        const ay = clientY - rect.top - size.h / 2;
        const factor = Math.pow(1.0015, -dy);
        cameraRef.current.zoomAt(factor, ax, ay);
        applyCamera();
      },
    },
    {
      target: hostRef,
      drag: { filterTaps: true },
      wheel: { eventOptions: { passive: false } },
    },
  );

  // Cmd+0/1/2/3/4 keyboard tween via GSAP
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const idx = ['0', '1', '2', '3', '4'].indexOf(e.key);
      if (idx === -1) return;
      e.preventDefault();
      const target = ZOOM_LEVELS[idx]!;
      gsap.killTweensOf(cameraRef.current);
      gsap.to(cameraRef.current, {
        x: target.x,
        y: target.y,
        scale: target.scale,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: applyCamera,
      });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [applyCamera]);

  if (!size) return null;

  return (
    <div
      ref={hostRef}
      className="relative h-screen w-screen touch-none overflow-hidden bg-black"
    >
      <Application
        width={size.w}
        height={size.h}
        backgroundColor={0x0a0a0a}
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
      {tooltip && <GalaxieTooltip state={tooltip} />}
      {isDebug && <FPSCounter />}
      {isDebug && <KeyHintOverlay />}
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

  // Populate world once
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

  // Re-apply camera on initial mount + viewport resize
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
    <div className="absolute left-2 top-2 z-10 rounded bg-black/70 px-2 py-1 font-mono text-xs text-green-400">
      {fps} FPS
    </div>
  );
}

function KeyHintOverlay() {
  return (
    <div className="absolute right-2 top-2 z-10 rounded bg-black/70 px-2 py-1 font-mono text-[10px] leading-tight text-white/60">
      <div>drag · pan</div>
      <div>wheel · zoom</div>
      <div>⌘0–4 · snap</div>
    </div>
  );
}
