'use client';

import type { GraphNode } from '@/lib/repo-galaxie/types';

/**
 * Linear-style breadcrumb for the Repo-Galaxie hero.
 *
 * Design-Spec from Sub-Agent 2 (Linear deep-dive):
 *   - Chevron `›` separator (NOT slash) — 2026 standard
 *   - Inter Regular 13 px for normal segments, Mono for file-paths
 *   - Durchquerte Segmente muted, current segment foreground+semibold
 *   - No animation on segment-change (Linear is intentionally static here)
 *   - aria-current="page" on current, role="presentation" on separator
 *
 * Click on any segment → setFocusId(segment.id). Workspace/customer not
 * included here because they live above the repo level in our hero.
 */

export function BreadcrumbBar({
  path,
  onSelect,
}: {
  /** From root down to current focus node, inclusive. */
  path: GraphNode[];
  onSelect: (nodeId: string) => void;
}) {
  if (path.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex h-8 items-center gap-1 overflow-x-auto px-1"
    >
      <ol className="flex items-center gap-0.5">
        <li className="text-[13px]">
          <span className="font-mono text-muted-foreground/70">acme-bank</span>
        </li>
        <Separator />

        {path.map((node, idx) => {
          const isCurrent = idx === path.length - 1;
          const useMono = node.kind === 'folder' || node.kind === 'file';
          return (
            <span key={node.id} className="flex items-center gap-0.5">
              <li>
                {isCurrent ? (
                  <span
                    aria-current="page"
                    className={`rounded px-1.5 py-0.5 text-[13px] font-semibold text-foreground ${
                      useMono ? 'font-mono text-[12px]' : ''
                    }`}
                  >
                    {node.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(node.id)}
                    className={`rounded px-1.5 py-0.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1 ${
                      useMono ? 'font-mono text-[12px]' : ''
                    }`}
                  >
                    {node.label}
                  </button>
                )}
              </li>
              {!isCurrent ? <Separator /> : null}
            </span>
          );
        })}
      </ol>

      <div className="ml-auto hidden items-center gap-2 text-[11px] text-muted-foreground/60 sm:flex">
        <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono">ESC</kbd>
        <span>zurück</span>
      </div>
    </nav>
  );
}

function Separator() {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className="select-none px-0.5 text-muted-foreground/40"
    >
      ›
    </li>
  );
}
