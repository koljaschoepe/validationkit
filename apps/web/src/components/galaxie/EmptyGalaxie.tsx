'use client';

import Link from 'next/link';
import { PlusIcon, SparklesIcon } from 'lucide-react';

export function EmptyGalaxie({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="relative mb-6">
        <SparklesIcon className="size-12 text-white/70" />
        <span className="absolute -inset-3 -z-10 rounded-full bg-primary/10 blur-xl" />
      </div>
      <h1 className="font-mono text-lg font-medium">Your console is empty.</h1>
      <p className="mt-2 max-w-md text-sm text-white/60">
        Add a customer to start. Each customer groups its repos, and every
        finding shows up here ranked by severity.
      </p>
      <Link
        href={`/${workspaceSlug}/customers`}
        className="mt-6 inline-flex items-center gap-1.5 rounded border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary transition hover:bg-primary/20"
      >
        <PlusIcon className="size-3.5" />
        Add customer
      </Link>
    </div>
  );
}
