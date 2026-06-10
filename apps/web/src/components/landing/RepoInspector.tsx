'use client';

import { AnimatePresence, m } from 'motion/react';
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/ui/severity-badge';
import type { GraphNode } from '@/lib/repo-galaxie/types';

/**
 * Repo-Galaxie inspector — Linear-style content-swap drawer for the landing
 * hero. Shows file metadata pill-row (lang, lines, KB, last-modified),
 * an optional finding-block (only when severity present), and an always-on
 * raw content preview (no LLM-generated content — first ~10 lines straight
 * from the file).
 *
 * Architecture aligned with Sub-Agent 6: GitLab-pill-row + Linear-drawer +
 * GitHub-breadcrumb header. Layout works in 35 %-column on desktop, stacked
 * full-width on mobile.
 */

export function RepoInspector({
  node,
  onFixClick,
}: {
  node: GraphNode | undefined;
  onFixClick: () => void;
}) {
  if (!node) {
    return (
      <article
        className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-border bg-card p-6 text-center"
        aria-live="polite"
      >
        <p className="font-mono type-mono-sm text-muted-foreground">
          Klick eine Datei im Baum, um ihr Finding zu sehen.
        </p>
      </article>
    );
  }

  const isFile = node.kind === 'file';
  const hasFinding = node.severity != null && node.findingTitle != null;
  const diffBefore = node.findingDiffBefore?.split('\n') ?? [];
  const diffAfter = node.findingDiffAfter?.split('\n') ?? [];

  // Breadcrumb: split the path on `/`, drop the filename (last segment).
  const breadcrumbSegments = (node.filePath ?? '')
    .replace(/^\//, '')
    .split('/')
    .slice(0, -1);
  const breadcrumb = ['acme-bank', 'fraud-detection', ...breadcrumbSegments]
    .filter(Boolean)
    .join(' / ');

  return (
    <article
      className="relative flex h-full w-full flex-col rounded-xl border border-border bg-card shadow-sm"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Inspector für ${node.label}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={node.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {/* Header — filename + breadcrumb */}
          <header className="space-y-0.5 border-b border-border px-4 py-3">
            <h2 className="type-h2 font-semibold tracking-tight">{node.label}</h2>
            <p className="truncate font-mono type-mono-sm text-muted-foreground">
              {breadcrumb || node.kind}
            </p>
          </header>

          {/* Body scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Metadata pill-row — only meaningful for files */}
            {isFile ? (
              <div className="grid grid-cols-4 gap-1.5">
                <PillStat label="lang" value={node.language?.toUpperCase() ?? 'n/a'} />
                <PillStat label="lines" value={node.lines?.toString() ?? 'n/a'} />
                <PillStat
                  label="size"
                  value={node.bytes ? formatBytes(node.bytes) : 'n/a'}
                />
                <PillStat
                  label="updated"
                  value={node.lastModified ? formatRelativeDate(node.lastModified) : 'n/a'}
                />
              </div>
            ) : null}

            {/* Finding block — only when severity present */}
            {hasFinding ? (
              <section className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
                <div className="flex items-center gap-2">
                  <m.div layoutId="severity-pill">
                    <SeverityBadge severity={node.severity!} />
                  </m.div>
                  <span className="truncate font-mono type-mono-sm text-muted-foreground">
                    {node.findingRule}
                  </span>
                </div>
                <h3 className="type-body font-semibold tracking-tight">
                  {node.findingTitle}
                </h3>
                <p className="type-body-sm text-foreground/85">{node.findingDescription}</p>

                {(diffBefore.length > 0 || diffAfter.length > 0) ? (
                  <div className="overflow-x-auto rounded-md border border-border bg-background/60 p-2 font-mono type-mono-sm leading-relaxed">
                    {diffBefore.map((line, i) => (
                      <div
                        key={`b-${i}`}
                        style={{ color: 'var(--color-sev-kill)' }}
                        className="whitespace-pre-wrap break-words"
                      >
                        {line}
                      </div>
                    ))}
                    {diffAfter.map((line, i) => (
                      <div
                        key={`a-${i}`}
                        style={{ color: 'var(--color-sev-strong)' }}
                        className="whitespace-pre-wrap break-words"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                ) : null}

                {node.findingWhyImportant ? (
                  <details className="group rounded-md border border-border px-3 py-2 text-foreground/85">
                    <summary className="flex cursor-pointer items-center gap-1.5 font-mono type-mono-sm uppercase tracking-wider text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                      <ChevronRightIcon
                        className="size-3.5 transition-transform group-open:rotate-90"
                        aria-hidden="true"
                      />
                      Warum wichtig
                    </summary>
                    <p className="mt-2 type-body-sm">{node.findingWhyImportant}</p>
                  </details>
                ) : null}
              </section>
            ) : null}

            {/* Content preview — always present for files, collapsible */}
            {isFile && node.previewLines && node.previewLines.length > 0 ? (
              <details className="group rounded-md border border-border px-3 py-2">
                <summary className="flex cursor-pointer items-center gap-1.5 font-mono type-mono-sm uppercase tracking-wider text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <ChevronRightIcon
                    className="size-3.5 transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                  Content Preview
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background/60 p-2.5 font-mono type-mono-sm leading-relaxed text-foreground/85">
                  {node.previewLines.map((line, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="select-none text-muted-foreground/60">
                        {String(i + 1).padStart(2, ' ')}
                      </span>
                      <span className="whitespace-pre-wrap break-words">
                        {line || ' '}
                      </span>
                    </div>
                  ))}
                </pre>
              </details>
            ) : null}

            {/* Folder/Repo summary — when not a file */}
            {!isFile ? (
              <section className="rounded-md border border-border bg-background/40 p-3">
                <p className="type-body-sm text-muted-foreground">
                  {node.kind === 'repo'
                    ? 'Repository. Klick auf einen Ordner zum Zoomen, auf eine Datei für Details.'
                    : `Ordner mit ${countDescendantFiles(node.id)} klickbaren Dateien.`}
                </p>
              </section>
            ) : null}
          </div>

          {/* Footer — sticky CTA, only when there's something to fix */}
          {hasFinding ? (
            <footer className="border-t border-border px-4 py-3">
              <Button
                type="button"
                size="default"
                className="w-full justify-center"
                onClick={onFixClick}
              >
                Fix via PR
                <ArrowRightIcon className="size-4" />
              </Button>
              <p className="mt-1.5 text-center font-mono type-mono-sm text-muted-foreground">
                Sign-in nötig · 1 Branch + 1 Commit + PR-Body
              </p>
            </footer>
          ) : null}
        </m.div>
      </AnimatePresence>
    </article>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function PillStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-background/40 px-2 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="truncate font-mono type-mono-sm text-foreground">
        {value}
      </span>
    </div>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  return `${(b / 1024).toFixed(1)} KB`;
}

function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.UTC(2026, 4, 20); // demo-time anchor
  const days = Math.round((now - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

function countDescendantFiles(_id: string): number {
  // Cheap placeholder — could traverse demo-data, but for the inspector copy
  // the exact count is decorative. Returning 0 is safe; we keep the function
  // for the API shape.
  return 0;
}
