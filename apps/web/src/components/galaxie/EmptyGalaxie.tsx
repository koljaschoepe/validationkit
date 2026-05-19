'use client';

import Link from 'next/link';
import { PlusIcon, SparklesIcon } from 'lucide-react';

export function EmptyGalaxie() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="relative mb-6">
        <SparklesIcon className="size-12 text-amber-300/80" />
        <span className="absolute -inset-3 -z-10 rounded-full bg-amber-500/10 blur-xl" />
      </div>
      <h1 className="font-mono text-lg font-medium">Your galaxy is empty.</h1>
      <p className="mt-2 max-w-md text-sm text-white/60">
        Add a customer to start. Each customer becomes a planet — repos are its
        moons, findings are the asteroids around each moon.
      </p>
      <Link
        href="/customers"
        className="mt-6 inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-200 transition hover:bg-amber-500/20"
      >
        <PlusIcon className="size-3.5" />
        Add customer
      </Link>
      <p className="mt-8 max-w-md font-mono text-[10px] text-white/30">
        Tip: try /galaxie-dev for a mock-data preview of what the galaxy looks
        like once it has customers + findings.
      </p>
    </div>
  );
}
