'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import type { FileNode } from '@/lib/galaxie/types';
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
  file,
  onClose,
  readOnly = false,
}: {
  file: FileNode;
  onClose: () => void;
  /** When true, hides dismiss/snooze + replaces AI-solution apply with a sign-in CTA. */
  readOnly?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    // Desktop slides in from the right, mobile from the bottom — both 300ms.
    // Sprint 2 — scope the tween to a gsap.context so it gets killed on
    // unmount instead of running against a detached DOM node.
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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

  // Portal out of the galaxy container so `overflow-hidden` on a 60vh hero
  // (Landing) does not clip the inspector. `position: fixed` makes the panel
  // viewport-relative.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Finding inspector — ${file.path}`}
      className={cn(
        'pointer-events-auto fixed z-50 flex flex-col border-white/10 bg-black/90 backdrop-blur',
        // Mobile: bottom sheet
        'inset-x-0 bottom-0 h-[70vh] rounded-t-2xl border-t',
        // Desktop: right sidebar
        'sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-[380px] sm:rounded-none sm:border-l sm:border-t-0',
      )}
    >
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
                  <button
                    type="button"
                    disabled={pending || isDismissed}
                    className="flex items-center gap-1 rounded px-1.5 py-1 type-mono-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                    title="Dismiss"
                  >
                    <EyeOffIcon className="size-3" />
                    Dismiss
                    <ChevronDownIcon className="size-2.5" />
                  </button>
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
                  <button
                    type="button"
                    disabled={pending || isSnoozed}
                    className="flex items-center gap-1 rounded px-1.5 py-1 type-mono-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                    title="Snooze"
                  >
                    <BellIcon className="size-3" />
                    Snooze
                    <ChevronDownIcon className="size-2.5" />
                  </button>
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
    </div>,
    document.body,
  );
}

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
