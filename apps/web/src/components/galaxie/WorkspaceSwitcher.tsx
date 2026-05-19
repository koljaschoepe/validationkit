'use client';

import { useState } from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MOCK_WORKSPACES,
  type MockWorkspace,
} from '@/lib/galaxie/mock-workspaces';

export function WorkspaceSwitcher({
  current,
  onChange,
}: {
  current: string;
  onChange: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active =
    MOCK_WORKSPACES.find((w) => w.slug === current) ?? MOCK_WORKSPACES[0]!;

  return (
    <div className="pointer-events-auto absolute left-2 top-2 z-20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded border border-white/10 bg-black/70 px-2.5 py-1.5 font-mono text-xs text-white/90 backdrop-blur transition hover:border-white/20 hover:bg-black/80"
      >
        <span
          className="inline-block size-2 rounded-full"
          style={{ background: planColor(active.plan) }}
        />
        {active.label}
        <ChevronDownIcon className="size-3 text-white/50" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="mt-1 min-w-[180px] rounded border border-white/10 bg-black/85 p-1 font-mono text-xs text-white/85 shadow-xl backdrop-blur"
          >
            {MOCK_WORKSPACES.map((w) => (
              <button
                key={w.slug}
                type="button"
                onClick={() => {
                  onChange(w.slug);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition hover:bg-white/10"
              >
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ background: planColor(w.plan) }}
                />
                <span className="flex-1">{w.label}</span>
                {w.slug === current && (
                  <CheckIcon className="size-3 text-white/60" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function planColor(plan: MockWorkspace['plan']): string {
  switch (plan) {
    case 'solo':
      return '#3b82f6';
    case 'team':
      return '#eab308';
    case 'agency':
      return '#fbbf24';
  }
}
