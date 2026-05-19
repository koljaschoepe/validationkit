'use client';

import { useEffect, useState } from 'react';
import { RotateCcwIcon } from 'lucide-react';
import type { Camera } from './pixi/Camera';

export function ZoomIndicator({
  camera,
  onReset,
}: {
  camera: Camera;
  onReset: () => void;
}) {
  const [scale, setScale] = useState(camera.scale);

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.abs(camera.scale - scale) > 0.005) setScale(camera.scale);
    }, 80);
    return () => clearInterval(id);
  });

  const pct = Math.round(scale * 100);
  return (
    <div className="absolute right-2 top-12 z-10 flex items-center gap-1 rounded border border-white/10 bg-black/70 px-2 py-1 font-mono text-[11px] text-white/80 backdrop-blur">
      <span>{pct}%</span>
      <button
        type="button"
        onClick={onReset}
        title="Reset zoom (⌘0)"
        className="ml-1 rounded p-0.5 text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <RotateCcwIcon className="size-3" />
      </button>
    </div>
  );
}
