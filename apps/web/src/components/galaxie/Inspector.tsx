'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  BellIcon,
  ChevronDownIcon,
  EyeOffIcon,
  LogInIcon,
  RefreshCwIcon,
  XIcon,
} from 'lucide-react';
import gsap from 'gsap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { cn } from '@/lib/utils';
import type {
  FileNode,
  FolderNode,
  InspectorTarget,
  Severity,
} from '@/lib/galaxie/types';
import { SEVERITY_BANDS } from '@/lib/galaxie/types';
import { whyImportantFor } from './inspector-templates';
import { AISolutionPlaceholder } from './AISolutionPlaceholder';

const PANEL_WIDTH = 380;

const DISMISS_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'false-positive', label: 'False positive' },
  { key: 'acceptable-risk', label: 'Acceptable risk' },
  { key: 'wont-fix', label: "Won't fix" },
];

const SNOOZE_OPTIONS: Array<{ key: '24h' | '7d' | 'forever'; label: string }> = [
  { key: '24h', label: '24 hours' },
  { key: '7d', label: '7 days' },
  { key: 'forever', label: 'Forever' },
];

export function Inspector({
  target,
  onClose,
  onSelectFile,
  readOnly = false,
}: {
  target: InspectorTarget;
  onClose: () => void;
  /** Sub-C — clicking a finding-row inside the folder panel asks the parent to
   *  reopen the inspector in file-mode (so the parent can also re-pivot the
   *  camera). Optional: file-mode inspectors don't fire this. */
  onSelectFile?: (file: FileNode) => void;
  /** When true, hides dismiss/snooze + replaces AI-solution apply with sign-in CTA. */
  readOnly?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Slide-in tween — desktop from the right, mobile from below. Gsap context
  // is scoped to the ref so the tween dies cleanly if we unmount mid-slide.
  useEffect(() => {
    if (!panelRef.current) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const ctx = gsap.context(() => {
      if (!panelRef.current) return;
      gsap.fromTo(
        panelRef.current,
        isMobile
          ? { y: '100%', opacity: 0 }
          : { x: PANEL_WIDTH, opacity: 0 },
        { x: 0, y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' },
      );
    }, panelRef);
    return () => ctx.revert();
  }, []);

  // ESC closes the panel (any focus). Pivot is owned by the parent, which
  // also wires its own ESC for non-inspector flows (UniversalSearch).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Click-outside detection. Deferred by one frame so the click that opens
  // the panel can't immediately close it via the same event tick.
  useEffect(() => {
    let armed = false;
    const raf = requestAnimationFrame(() => {
      armed = true;
    });
    const onDoc = (e: MouseEvent) => {
      if (!armed) return;
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  const panelLabel =
    target.kind === 'file'
      ? `Finding inspector — ${target.file.path}`
      : `Folder inspector — ${target.folder.name}`;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={panelLabel}
      className={cn(
        'pointer-events-auto fixed z-50 flex flex-col border-white/10 bg-black/90 backdrop-blur',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 h-[70vh] rounded-t-2xl border-t',
        // Desktop: right sidebar
        'sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-[380px] sm:rounded-none sm:border-l sm:border-t-0',
      )}
    >
      {target.kind === 'file' ? (
        <FileInspector file={target.file} onClose={onClose} readOnly={readOnly} />
      ) : (
        <FolderInspector
          folder={target.folder}
          files={target.files}
          onClose={onClose}
          onSelectFile={onSelectFile}
        />
      )}
    </div>,
    document.body,
  );
}

// ── File inspector (existing inspector experience, lifted into a sub-component) ──

function FileInspector({
  file,
  onClose,
  readOnly,
}: {
  file: FileNode;
  onClose: () => void;
  readOnly: boolean;
}) {
  const [dismissOpen, setDismissOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const isDismissed = file.dismissStatus === 'dismissed';
  const isSnoozed = file.dismissStatus === 'snoozed';

  function callAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setActionError(result.error ?? 'Action failed.');
        return;
      }
      onClose();
    });
  }

  function dismiss(reason: string) {
    setDismissOpen(false);
    callAction(async () => {
      const { dismissFindingAction } = await import('@/lib/apply-actions');
      return dismissFindingAction(file.id, reason);
    });
  }

  function snooze(duration: '24h' | '7d' | 'forever') {
    setSnoozeOpen(false);
    callAction(async () => {
      const { snoozeFindingAction } = await import('@/lib/apply-actions');
      return snoozeFindingAction(file.id, duration);
    });
  }

  function undo() {
    callAction(async () => {
      const { undoDismissAction } = await import('@/lib/apply-actions');
      return undoDismissAction(file.id);
    });
  }

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={file.severity} />
            <span className="truncate font-mono text-xs text-white/60">
              {file.path}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              <Dropdown
                open={dismissOpen}
                onOpenChange={setDismissOpen}
                trigger={
                  <span
                    className="flex items-center gap-1 rounded px-1.5 py-1 type-mono-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                    aria-disabled={pending || isDismissed}
                  >
                    <EyeOffIcon className="size-3" />
                    Dismiss
                    <ChevronDownIcon className="size-2.5" />
                  </span>
                }
              >
                {DISMISS_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => dismiss(o.key)}
                    className="w-full rounded px-2 py-1.5 text-left text-xs text-white/85 hover:bg-white/10"
                  >
                    {o.label}
                  </button>
                ))}
              </Dropdown>
              <Dropdown
                open={snoozeOpen}
                onOpenChange={setSnoozeOpen}
                trigger={
                  <span
                    className="flex items-center gap-1 rounded px-1.5 py-1 type-mono-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                    aria-disabled={pending || isSnoozed}
                  >
                    <BellIcon className="size-3" />
                    Snooze
                    <ChevronDownIcon className="size-2.5" />
                  </span>
                }
              >
                {SNOOZE_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => snooze(o.key)}
                    className="w-full rounded px-2 py-1.5 text-left text-xs text-white/85 hover:bg-white/10"
                  >
                    {o.label}
                  </button>
                ))}
              </Dropdown>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector (Esc)"
            className="rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      </header>

      {actionError ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {actionError}
        </div>
      ) : null}

      {isDismissed ? (
        <StateBanner
          label="Dismissed"
          detail={file.dismissReason ? `Reason: ${file.dismissReason}` : null}
          onUndo={undo}
          pending={pending}
        />
      ) : null}
      {isSnoozed ? (
        <StateBanner
          label="Snoozed"
          detail={
            file.snoozedUntil
              ? `Until ${new Date(file.snoozedUntil).toISOString().slice(0, 16).replace('T', ' ')}`
              : null
          }
          onUndo={undo}
          pending={pending}
        />
      ) : null}

      <Tabs defaultValue="detail" className="flex-1 overflow-hidden">
        <TabsList
          className={`m-3 grid w-[calc(100%-1.5rem)] ${readOnly ? 'grid-cols-2' : 'grid-cols-3'} bg-white/5`}
        >
          <TabsTrigger value="detail" className="text-xs">
            Detail
          </TabsTrigger>
          <TabsTrigger value="why" className="text-xs">
            Why important
          </TabsTrigger>
          {!readOnly && (
            <TabsTrigger value="ai" className="text-xs">
              AI solution
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <TabsContent value="detail" className="space-y-3 text-sm text-white/85">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
                Finding
              </h3>
              <p className="mt-1 font-mono text-sm text-white">{file.path}</p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">
                Detail
              </h3>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {file.findingSnippet}
              </p>
            </div>
            {readOnly && (
              <Link
                href="/login"
                className="mt-4 inline-flex items-center gap-1.5 rounded border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs text-primary transition hover:bg-primary/25"
              >
                <LogInIcon className="size-3" />
                Sign in to apply AI solutions
              </Link>
            )}
          </TabsContent>

          <TabsContent value="why" className="text-sm text-white/85">
            <p className="leading-relaxed">{whyImportantFor(inferCategory(file.path))}</p>
          </TabsContent>

          {!readOnly && (
            <TabsContent value="ai">
              <AISolutionPlaceholder file={file} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </>
  );
}

// ── Folder inspector (Sub-C) ─────────────────────────────────────────────────

function FolderInspector({
  folder,
  files,
  onClose,
  onSelectFile,
}: {
  folder: FolderNode;
  files: FileNode[];
  onClose: () => void;
  onSelectFile?: (file: FileNode) => void;
}) {
  const [filterChips, setFilterChips] = useState<Set<Severity>>(
    () => new Set(SEVERITY_BANDS),
  );

  const breakdown = useMemo(() => {
    const counts: Record<Severity, number> = {
      Kill: 0, Weak: 0, Mid: 0, Strong: 0, Exceptional: 0,
    };
    for (const f of files) counts[f.severity] += 1;
    return counts;
  }, [files]);

  const sortedFiles = useMemo(() => {
    const rank: Record<Severity, number> = {
      Kill: 0, Weak: 1, Mid: 2, Strong: 3, Exceptional: 4,
    };
    return [...files]
      .filter((f) => filterChips.has(f.severity))
      .sort((a, b) => rank[a.severity] - rank[b.severity]);
  }, [files, filterChips]);

  function toggleChip(sev: Severity) {
    setFilterChips((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={folder.aggregateSeverity} />
            <span className="truncate font-mono text-xs text-white/60">
              {folder.name}/
            </span>
          </div>
          <p className="mt-1 text-xs text-white/40">
            {folder.fileCount} {folder.fileCount === 1 ? 'finding' : 'findings'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector (Esc)"
          className="rounded p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <XIcon className="size-4" />
        </button>
      </header>

      <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-4 py-3">
        {SEVERITY_BANDS.map((sev) => {
          const count = breakdown[sev];
          if (count === 0) return null;
          const active = filterChips.has(sev);
          return (
            <button
              key={sev}
              type="button"
              onClick={() => toggleChip(sev)}
              aria-pressed={active}
              className={cn(
                'rounded px-2 py-0.5 type-mono-sm transition',
                active
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/40 line-through',
              )}
            >
              {count} {sev}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedFiles.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-white/40">
            No findings match the active filters.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {sortedFiles.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onSelectFile?.(f)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5"
                >
                  <SeverityBadge severity={f.severity} />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/85">
                    {f.path}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// ── Shared helpers ──────────────────────────────────────────────────────────

function inferCategory(path: string): string {
  const lower = path.toLowerCase();
  if (lower.includes('ghost') || lower.includes('unused') || lower.includes('never referenced'))
    return 'unused-agent';
  if (lower.includes('duplicate') || lower.includes('similarity')) return 'duplicate-guidance';
  if (lower.includes('bloat')) return 'context-bloat';
  if (lower.includes('not found') || lower.includes('stale')) return 'stale-reference';
  if (lower.includes('budget')) return 'token-budget';
  if (lower.includes('conflict')) return 'conflicting-rules';
  return 'unknown';
}

function Dropdown({
  open,
  onOpenChange,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  // Click-outside to close.
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onOpenChange]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="contents"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 min-w-[140px] rounded border border-white/15 bg-black/95 p-1 shadow-xl backdrop-blur"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function StateBanner({
  label,
  detail,
  onUndo,
  pending,
}: {
  label: string;
  detail: string | null;
  onUndo: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-2 text-xs">
      <div>
        <div className="font-mono uppercase tracking-wider text-white/60">
          {label}
        </div>
        {detail ? <div className="text-white/45">{detail}</div> : null}
      </div>
      <button
        type="button"
        onClick={onUndo}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 type-mono-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
      >
        <RefreshCwIcon className="size-3" />
        Undo
      </button>
    </div>
  );
}
