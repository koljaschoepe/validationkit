'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import Link from 'next/link';
import {
  BellIcon,
  ChevronDownIcon,
  EyeOffIcon,
  FileTextIcon,
  LogInIcon,
  RefreshCwIcon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import { SeverityBadge } from '@/components/ui/severity-badge';
import { cn } from '@/lib/utils';
import type {
  FileNode,
  FindingRef,
  FolderNode,
  InspectorTarget,
  Severity,
} from '@/lib/galaxie/types';
import { SEVERITY_BANDS } from '@/lib/galaxie/types';
import {
  fileDisplayName,
  fileSubtitle,
  fileVendor,
  folderDisplayName,
  folderSubtitle,
} from '@/lib/galaxie/humanize';
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
  contained = false,
}: {
  target: InspectorTarget;
  onClose: () => void;
  /** Sub-C — clicking a finding-row inside the folder panel asks the parent to
   *  reopen the inspector in file-mode (so the parent can also re-pivot the
   *  camera). Optional: file-mode inspectors don't fire this. */
  onSelectFile?: (file: FileNode) => void;
  /** When true, hides dismiss/snooze + replaces AI-solution apply with sign-in CTA. */
  readOnly?: boolean;
  /**
   * Landing-Redesign Phase I — when embedded in a bounded card (static-demo
   * showcase) the panel must stay INSIDE the card, not escape to the viewport.
   * Contained mode skips the body-portal and renders `absolute`, so it anchors
   * to + is clipped by GalaxieScene's `relative overflow-hidden` root. The
   * full-bleed workspace keeps the default `fixed` body-portal drawer.
   */
  contained?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Contained (landing showcase) keeps the hand-rolled in-tree panel with its
  // own slide / ESC / click-outside. The default workspace drawer further down
  // is a Radix Dialog (native focus-trap + ESC + scroll-lock + outside-click —
  // S20), so these manual effects only run for the contained path.
  useEffect(() => {
    if (!contained) return;
    const el = panelRef.current;
    if (!el) return;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const anim = el.animate(
      [
        isMobile
          ? { transform: 'translateY(100%)', opacity: 0 }
          : { transform: `translateX(${PANEL_WIDTH}px)`, opacity: 0 },
        { transform: 'translate(0, 0)', opacity: 1 },
      ],
      { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' },
    );
    return () => anim.cancel();
  }, [contained]);

  useEffect(() => {
    if (!contained) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [contained, onClose]);

  // Click-outside detection. Deferred by one frame so the click that opens
  // the panel can't immediately close it via the same event tick.
  useEffect(() => {
    if (!contained) return;
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
  }, [contained, onClose]);

  if (typeof document === 'undefined') return null;

  const panelLabel =
    target.kind === 'file'
      ? `Finding inspector — ${target.file.path}`
      : `Folder inspector — ${target.folder.name}`;

  const body =
    target.kind === 'file' ? (
      <FileInspector file={target.file} onClose={onClose} readOnly={readOnly} />
    ) : (
      <FolderInspector
        folder={target.folder}
        files={target.files}
        onClose={onClose}
        onSelectFile={onSelectFile}
      />
    );

  // Contained mode: anchored in-tree panel, clipped by the showcase card root.
  if (contained) {
    return (
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={panelLabel}
        className={cn(
          'pointer-events-auto absolute inset-x-0 bottom-0 z-50 flex h-[82%] flex-col rounded-t-2xl border-t border-white/10 bg-black/90 backdrop-blur',
          'sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-[340px] sm:rounded-none sm:border-l sm:border-t-0',
        )}
      >
        {body}
      </div>
    );
  }

  // Default workspace drawer (S20): Radix Dialog modal — native focus-trap,
  // ESC, scroll-lock and outside-click, replacing the hand-rolled handlers
  // above. Built on the Dialog primitive (not the SheetContent wrapper) so the
  // responsive shape survives: bottom-sheet on mobile, right-drawer on desktop.
  // The inner header owns the visible close button, so the Dialog title is
  // screen-reader-only and the description requirement is opted out.
  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          aria-label={panelLabel}
          aria-describedby={undefined}
          className={cn(
            'pointer-events-auto fixed z-50 flex flex-col border-white/10 bg-black/90 outline-none backdrop-blur',
            'inset-x-0 bottom-0 h-[70vh] rounded-t-2xl border-t',
            'sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-[380px] sm:rounded-none sm:border-l sm:border-t-0',
            'duration-300 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 data-closed:animate-out data-closed:fade-out-0 sm:data-open:slide-in-from-right-10 sm:data-open:slide-in-from-bottom-0',
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {panelLabel}
          </DialogPrimitive.Title>
          {body}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
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
  // Galaxie-Redesign Phase B (B.1) — a file groups N findings. The header
  // identifies the file (path + aggregate severity); each finding renders as a
  // card with its own dismiss/snooze/apply, keyed on the real finding.id.
  const findings = file.findings;
  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={file.severity} />
            <span className="truncate text-sm font-medium text-white">
              {fileDisplayName(file)}
            </span>
          </div>
          {fileSubtitle(file) ? (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/45">
              <span className="truncate">{fileSubtitle(file)}</span>
              {fileVendor(file) ? (
                <span className="shrink-0 rounded bg-white/10 px-1 py-0.5 text-[10px] uppercase tracking-wide text-white/55">
                  {fileVendor(file)}
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="mt-0.5 truncate font-mono text-[11px] text-white/35">
            {file.path}
          </p>
          {findings.length > 1 ? (
            <p className="mt-1 type-mono-sm uppercase tracking-wider text-white/58">
              {findings.length} findings
            </p>
          ) : null}
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

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {findings.map((finding) => (
          <FindingCard
            key={finding.id}
            finding={finding}
            readOnly={readOnly}
            onActioned={onClose}
          />
        ))}
      </div>
    </>
  );
}

// One finding within a file. Owns its own dismiss/snooze/apply transition,
// keyed on the real finding.id. Phase B (B.1).
function FindingCard({
  finding,
  readOnly,
  onActioned,
}: {
  finding: FindingRef;
  readOnly: boolean;
  onActioned: () => void;
}) {
  const [dismissOpen, setDismissOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const isDismissed = finding.dismissStatus === 'dismissed';
  const isSnoozed = finding.dismissStatus === 'snoozed';

  function callAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setActionError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setActionError(result.error ?? 'Action failed.');
        return;
      }
      onActioned();
    });
  }

  function dismiss(reason: string) {
    setDismissOpen(false);
    callAction(async () => {
      const { dismissFindingAction } = await import('@/lib/apply-actions');
      return dismissFindingAction(finding.id, reason);
    });
  }

  function snooze(duration: '24h' | '7d' | 'forever') {
    setSnoozeOpen(false);
    callAction(async () => {
      const { snoozeFindingAction } = await import('@/lib/apply-actions');
      return snoozeFindingAction(finding.id, duration);
    });
  }

  function undo() {
    callAction(async () => {
      const { undoDismissAction } = await import('@/lib/apply-actions');
      return undoDismissAction(finding.id);
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
      <div className="flex items-start justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <span className="truncate type-mono-sm uppercase tracking-wider text-white/50">
            {finding.category ?? 'finding'}
          </span>
        </div>
        {!readOnly ? (
          <div className="flex shrink-0 items-center gap-1">
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
          </div>
        ) : null}
      </div>

      {actionError ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </div>
      ) : null}
      {isDismissed ? (
        <StateBanner
          label="Dismissed"
          detail={finding.dismissReason ? `Reason: ${finding.dismissReason}` : null}
          onUndo={undo}
          pending={pending}
        />
      ) : null}
      {isSnoozed ? (
        <StateBanner
          label="Snoozed"
          detail={
            finding.snoozedUntil
              ? `Until ${new Date(finding.snoozedUntil).toISOString().slice(0, 16).replace('T', ' ')}`
              : null
          }
          onUndo={undo}
          pending={pending}
        />
      ) : null}

      <div className="space-y-3 px-3 py-3 text-sm text-white/85">
        {finding.label ? (
          <p className="font-medium text-white">{finding.label}</p>
        ) : null}
        <p className="whitespace-pre-wrap leading-relaxed">{finding.snippet}</p>
        <div className="border-t border-white/10 pt-3">
          <h4 className="font-mono text-xs uppercase tracking-wider text-white/58">
            Why important
          </h4>
          <p className="mt-1 leading-relaxed text-white/70">
            {whyImportantFor(finding.category ?? '')}
          </p>
        </div>
        {readOnly ? (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs text-primary transition hover:bg-primary/25"
          >
            <LogInIcon className="size-3" />
            Sign in to apply AI solutions
          </Link>
        ) : showSolution ? (
          <div className="border-t border-white/10 pt-3">
            <AISolutionPlaceholder findingId={finding.id} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSolution(true)}
            className="inline-flex items-center gap-1.5 rounded border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs text-primary transition hover:bg-primary/25"
          >
            <SparklesIcon className="size-3" />
            Generate AI solution
          </button>
        )}
      </div>
    </div>
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
            <span className="truncate text-sm font-medium text-white">
              {folderDisplayName(folder)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-white/45">
            {folderSubtitle(folder)}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-white/35">
            {folder.name}/
          </p>
          <p className="mt-1 text-xs text-white/58">
            {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
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

      {/* Phase B (B.5) — shared team-context submodule. */}
      {folder.isSubmodule ? (
        <div className="border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
          <p className="type-mono-sm uppercase tracking-wider text-white/70">
            Shared Team Context · Submodule
          </p>
          {folder.submoduleUrl ? (
            <p className="mt-0.5 truncate font-mono text-[11px] text-white/55">
              {folder.submoduleUrl}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Phase B (B.4) — governing context-root config, if this folder has one.
          Clicking it opens the file inspector for that context file. */}
      {folder.nucleus ? (
        <button
          type="button"
          onClick={() => {
            const f = files.find((x) => x.id === folder.nucleus!.fileId);
            if (f) onSelectFile?.(f);
          }}
          className="flex w-full items-center gap-2.5 border-b border-white/10 bg-primary/[0.06] px-4 py-2.5 text-left transition hover:bg-primary/[0.1]"
        >
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/85 ring-1 ring-white/20">
            <FileTextIcon className="size-3 text-black/70" />
          </span>
          <div className="min-w-0">
            <p className="type-mono-sm uppercase tracking-wider text-white/58">
              Governing context
            </p>
            <p className="truncate font-mono text-xs text-white/85">
              {folder.nucleus.path.split('/').pop()}
            </p>
          </div>
        </button>
      ) : null}

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
                  : 'bg-white/5 text-white/58 line-through',
              )}
            >
              {count} {sev}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedFiles.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-white/58">
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
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-white/85">
                      {fileDisplayName(f)}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-white/35">
                      {f.path}
                    </span>
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
