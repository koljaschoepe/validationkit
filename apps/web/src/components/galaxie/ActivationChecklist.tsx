'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleIcon,
  XIcon,
} from 'lucide-react';

/**
 * ActivationChecklist — Phase Nova-2 inline-sidebar variant.
 *
 * Replaces the top-banner OnboardingBanner with a right-rail overlay inside
 * the Galaxie viewport. Five items, hard-derived from DB state so users
 * cannot "skip" by clicking through — each task auto-completes when the
 * underlying counter changes.
 *
 * Persists dismissal in localStorage. Collapsible header keeps the chrome
 * minimal once half-complete. Disappears entirely once all five are done.
 */

export interface ActivationState {
  workspaceId: string;
  customerCount: number;
  repoCount: number;
  scanCount: number;
  applyCount: number;
  memberCount: number;
  gitHubAppConfigured: boolean;
}

const STORAGE_KEY = (workspaceId: string) =>
  `vk:activation-dismissed:${workspaceId}`;

export function ActivationChecklist({
  state,
  workspaceSlug,
}: {
  state: ActivationState;
  workspaceSlug: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(
      window.localStorage.getItem(STORAGE_KEY(state.workspaceId)) === '1',
    );
  }, [state.workspaceId]);

  const customersHref = `/${workspaceSlug}/customers`;
  const items: Array<{ done: boolean; label: string; href: string }> = [
    {
      done: state.scanCount > 0,
      label: 'Run your first audit',
      href: '/',
    },
    {
      done: state.gitHubAppConfigured,
      label: 'Connect GitHub',
      href: '/docs/setup/github-app-checklist.md',
    },
    {
      done: state.applyCount > 0,
      label: 'Apply your first fix',
      href: customersHref,
    },
    {
      done: state.customerCount > 1,
      label: 'Add a second customer',
      href: customersHref,
    },
    {
      done: state.memberCount > 1,
      label: 'Invite a teammate',
      href: `/${workspaceSlug}/settings`,
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
    <aside
      aria-labelledby="activation-heading"
      className="pointer-events-auto absolute right-4 top-20 z-20 w-72 rounded-md border border-white/15 bg-black/85 px-3 py-2.5 font-mono text-xs text-white/85 backdrop-blur"
      style={{ borderRadius: 'var(--vk-radius-card)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
          aria-controls="activation-list"
        >
          {expanded ? (
            <ChevronDownIcon className="size-3.5 text-white/50" />
          ) : (
            <ChevronUpIcon className="size-3.5 text-white/50" />
          )}
          <span id="activation-heading" className="font-medium uppercase tracking-wider">
            Activation
          </span>
          <span className="ml-auto text-white/50">
            {doneCount} / {items.length}
          </span>
        </button>
        <button
          type="button"
          onClick={dismissPermanently}
          aria-label="Dismiss activation checklist permanently"
          className="rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white/80"
        >
          <XIcon className="size-3" />
        </button>
      </div>

      {expanded ? (
        <ul
          id="activation-list"
          className="mt-2.5 space-y-1.5 border-t border-white/10 pt-2.5"
        >
          {items.map((it, idx) => (
            <li key={it.label} className="flex items-center gap-2">
              {it.done ? (
                <CheckCircle2Icon
                  className="size-3.5 shrink-0 text-[var(--color-sev-exceptional)]"
                  aria-hidden
                />
              ) : (
                <CircleIcon className="size-3.5 shrink-0 text-white/30" aria-hidden />
              )}
              <span
                className="mr-1.5 font-mono text-[10px] tabular-nums text-white/30"
                aria-hidden
              >
                {idx + 1}
              </span>
              <a
                href={it.href}
                className={
                  it.done
                    ? 'text-white/45 line-through'
                    : 'text-white/85 hover:underline'
                }
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
