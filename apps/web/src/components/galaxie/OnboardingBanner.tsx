'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleIcon,
  XIcon,
} from 'lucide-react';

export interface OnboardingState {
  workspaceId: string;
  customerCount: number;
  repoCount: number;
  scanCount: number;
  gitHubAppConfigured: boolean;
}

const STORAGE_KEY = (workspaceId: string) =>
  `vk:onboarding-dismissed:${workspaceId}`;

export function OnboardingBanner({ state }: { state: OnboardingState }) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(
      window.localStorage.getItem(STORAGE_KEY(state.workspaceId)) === '1',
    );
  }, [state.workspaceId]);

  const items = [
    {
      done: state.customerCount > 0,
      label: 'Add your first customer',
      href: '/customers',
    },
    {
      done: state.repoCount > 0,
      label: 'Attach a repo',
      href: state.customerCount > 0 ? `/customers` : '/customers',
    },
    {
      done: state.scanCount > 0,
      label: 'Run the first audit',
      href: '/',
    },
    {
      done: state.gitHubAppConfigured,
      label: 'Configure GitHub App (optional, for PR-based apply)',
      href: '/docs/setup/github-app-checklist.md',
    },
  ];

  const complete = items.every((i) => i.done);
  if (complete || dismissed) return null;

  const doneCount = items.filter((i) => i.done).length;

  function dismissPermanently() {
    window.localStorage.setItem(STORAGE_KEY(state.workspaceId), '1');
    setDismissed(true);
  }

  return (
    <div className="pointer-events-auto absolute left-1/2 top-2 z-20 w-[min(540px,calc(100vw-1rem))] -translate-x-1/2 rounded border border-white/15 bg-black/85 px-3 py-2 font-mono text-xs text-white/85 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronDownIcon className="size-3.5 text-white/50" />
          ) : (
            <ChevronRightIcon className="size-3.5 text-white/50" />
          )}
          <span className="font-medium">Onboarding</span>
          <span className="text-white/40">
            {doneCount} / {items.length}
          </span>
        </button>
        <button
          type="button"
          onClick={dismissPermanently}
          title="Hide forever"
          className="rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white/80"
        >
          <XIcon className="size-3" />
        </button>
      </div>
      {expanded ? (
        <ul className="mt-2 space-y-1 border-t border-white/10 pt-2">
          {items.map((it) => (
            <li key={it.label} className="flex items-center gap-2">
              {it.done ? (
                <CheckCircle2Icon className="size-3.5 shrink-0 text-green-400" />
              ) : (
                <CircleIcon className="size-3.5 shrink-0 text-white/30" />
              )}
              <a
                href={it.href}
                className={
                  it.done
                    ? 'text-white/50 line-through'
                    : 'text-white/85 hover:underline'
                }
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
