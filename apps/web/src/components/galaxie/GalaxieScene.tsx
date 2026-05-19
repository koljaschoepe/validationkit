'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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
        {/* W2 will fill this with Customer/Repo/File pixi-children */}
      </Application>
      {isDebug && <FPSCounter />}
    </div>
  );
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
