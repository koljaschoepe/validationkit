'use client';

import { useEffect, useRef } from 'react';
import { severityHex } from '@/lib/galaxie/severity-colors';
import type { SeverityBand } from '@vk/core';
import type { GalaxieData, LayoutNode } from '@/lib/galaxie/types';
import type { Camera } from './pixi/Camera';

const SIZE = 160;
const HALF = SIZE / 2;
const WORLD_HALF_EXTENT = 1500; // covers customer (600) + repo (180) + file (55) + margin

// File-rect size by severity. Encodes severity via footprint, since hue is
// no longer load-bearing (post-Homepage-Relaunch, May 2026).
const FILE_RECT_SIZE: Record<SeverityBand, number> = {
  Kill: 1.6,
  Weak: 1.3,
  Mid: 1.0,
  Strong: 0.8,
  Exceptional: 1.1,
};

export function MiniMap({
  camera,
  viewportSize,
  onJump,
  data,
  layoutById,
}: {
  camera: Camera;
  viewportSize: { w: number; h: number };
  onJump: (worldX: number, worldY: number) => void;
  data: GalaxieData;
  layoutById: Map<string, LayoutNode>;
}) {
  const rectRef = useRef<SVGRectElement>(null);
  const { customers, repos, files } = data;
  const nodeById = layoutById;

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
        const size = FILE_RECT_SIZE[f.severity];
        return (
          <rect
            key={f.id}
            x={w2m(n.x) - size / 2}
            y={w2m(n.y) - size / 2}
            width={size}
            height={size}
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
