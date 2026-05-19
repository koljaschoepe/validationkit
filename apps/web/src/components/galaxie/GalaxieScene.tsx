'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateMockGalaxieData } from '@/lib/galaxie/mock-data';
import { computeLayout } from '@/lib/galaxie/layout';
import type { LayoutNode } from '@/lib/galaxie/types';
import { CustomerStar } from './pixi/CustomerStar';
import { RepoMoon } from './pixi/RepoMoon';
import { FileAsteroid } from './pixi/FileAsteroid';

extend({ Container, Graphics, Text });

export default function GalaxieScene() {
  const searchParams = useSearchParams();
  const isDebug = searchParams?.get('debug') === '1';
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const update = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (!size) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
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
        <GalaxieWorld centerX={size.w / 2} centerY={size.h / 2} />
      </Application>
      {isDebug && <FPSCounter />}
    </div>
  );
}

function GalaxieWorld({
  centerX,
  centerY,
}: {
  centerX: number;
  centerY: number;
}) {
  const worldRef = useRef<Container | null>(null);

  useEffect(() => {
    const world = worldRef.current;
    if (!world) return;

    const data = generateMockGalaxieData();
    const layout = computeLayout(data);
    const byId = new Map<string, LayoutNode>(
      layout.nodes.map((n) => [n.id, n]),
    );

    const children: Container[] = [];

    for (const c of data.customers) {
      const ln = byId.get(c.id);
      if (!ln) continue;
      children.push(new CustomerStar(c, ln));
    }
    for (const r of data.repos) {
      const ln = byId.get(r.id);
      if (!ln) continue;
      children.push(new RepoMoon(r, ln));
    }
    for (const f of data.files) {
      const ln = byId.get(f.id);
      if (!ln) continue;
      children.push(new FileAsteroid(f, ln));
    }

    for (const c of children) world.addChild(c);

    return () => {
      for (const c of children) {
        world.removeChild(c);
        c.destroy({ children: true });
      }
    };
  }, []);

  return <pixiContainer ref={worldRef} x={centerX} y={centerY} />;
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
