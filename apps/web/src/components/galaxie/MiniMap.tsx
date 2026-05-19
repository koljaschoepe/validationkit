'use client';

import { useEffect, useMemo, useRef } from 'react';
import { generateMockGalaxieData } from '@/lib/galaxie/mock-data';
import { computeLayout } from '@/lib/galaxie/layout';
import { severityHex } from '@/lib/galaxie/severity-colors';
import type { Camera } from './pixi/Camera';

const SIZE = 160;
const HALF = SIZE / 2;
const WORLD_HALF_EXTENT = 1500; // covers customer (600) + repo (180) + file (55) + margin

export function MiniMap({
  camera,
  viewportSize,
  onJump,
}: {
  camera: Camera;
  viewportSize: { w: number; h: number };
  onJump: (worldX: number, worldY: number) => void;
}) {
  const rectRef = useRef<SVGRectElement>(null);

  const { layout, files, repos, customers, nodeById } = useMemo(() => {
    const data = generateMockGalaxieData();
    const layout = computeLayout(data);
    const nodeById = new Map(layout.nodes.map((n) => [n.id, n]));
    return { ...data, layout, nodeById };
  }, []);

  // Animate viewport-rect via RAF
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (rectRef.current) {
        const halfWvWorld = viewportSize.w / 2 / camera.scale;
        const halfHvWorld = viewportSize.h / 2 / camera.scale;
        const centerWorldX = -camera.x / camera.scale;
        const centerWorldY = -camera.y / camera.scale;
        const left = w2m(centerWorldX - halfWvWorld);
        const top = w2m(centerWorldY - halfHvWorld);
        const right = w2m(centerWorldX + halfWvWorld);
        const bottom = w2m(centerWorldY + halfHvWorld);
        rectRef.current.setAttribute('x', String(left));
        rectRef.current.setAttribute('y', String(top));
        rectRef.current.setAttribute(
          'width',
          String(Math.max(2, right - left)),
        );
        rectRef.current.setAttribute(
          'height',
          String(Math.max(2, bottom - top)),
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [camera, viewportSize.w, viewportSize.h]);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const worldX = ((mx - HALF) / HALF) * WORLD_HALF_EXTENT;
    const worldY = ((my - HALF) / HALF) * WORLD_HALF_EXTENT;
    onJump(worldX, worldY);
  };

  return (
    <svg
      width={SIZE}
      height={SIZE}
      onClick={handleClick}
      className="pointer-events-auto absolute bottom-2 right-2 z-10 cursor-pointer rounded border border-white/15 bg-black/85 backdrop-blur"
    >
      {files.map((f) => {
        const n = nodeById.get(f.id);
        if (!n) return null;
        return (
          <rect
            key={f.id}
            x={w2m(n.x) - 0.5}
            y={w2m(n.y) - 0.5}
            width={1}
            height={1}
            fill={severityHex(f.severity)}
            opacity={0.7}
          />
        );
      })}
      {repos.map((r) => {
        const n = nodeById.get(r.id);
        if (!n) return null;
        return (
          <circle
            key={r.id}
            cx={w2m(n.x)}
            cy={w2m(n.y)}
            r={1.5}
            fill={severityHex(r.aggregateSeverity)}
            opacity={0.95}
          />
        );
      })}
      {customers.map((c) => {
        const n = nodeById.get(c.id);
        if (!n) return null;
        return (
          <circle
            key={c.id}
            cx={w2m(n.x)}
            cy={w2m(n.y)}
            r={3}
            fill={severityHex(c.aggregateSeverity)}
          />
        );
      })}
      <rect
        ref={rectRef}
        x={0}
        y={0}
        width={2}
        height={2}
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={1}
        pointerEvents="none"
      />
    </svg>
  );
}

function w2m(world: number): number {
  return HALF + (world / WORLD_HALF_EXTENT) * HALF;
}
