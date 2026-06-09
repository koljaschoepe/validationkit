'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircleIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparklesIcon,
  XCircleIcon,
} from 'lucide-react';
import type { SolutionRow } from '@/lib/solution-dal';
import { DiffRenderer } from './diff-renderer';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15; // 30s ceiling

// Galaxie-Redesign Phase B (B.1) — keyed on a real finding.id (was a FileNode,
// whose id used to equal the finding id). One placeholder per finding row.
export function AISolutionPlaceholder({ findingId }: { findingId: string }) {
  const [solution, setSolution] = useState<SolutionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<number | null>(null);
  const startedForId = useRef<string | null>(null);

  useEffect(() => {
    if (startedForId.current === findingId) return;
    startedForId.current = findingId;
    setSolution(null);
    setError(null);
    setLoading(true);
    void start();
    return () => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [findingId]);

  async function start() {
    try {
      const { requestSolution } = await import('@/lib/solution-actions');
      const result = await requestSolution(findingId);
      setSolution(result);
      setLoading(false);
      if (result?.status === 'pending') startPolling();
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  function startPolling() {
    if (pollRef.current !== null) window.clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = window.setInterval(async () => {
      attempts += 1;
      if (attempts > POLL_MAX_ATTEMPTS) {
        if (pollRef.current !== null) window.clearInterval(pollRef.current);
        pollRef.current = null;
        setError('Generation timed out after 30s.');
        return;
      }
      const { pollSolution } = await import('@/lib/solution-actions');
      const result = await pollSolution(findingId);
      setSolution(result);
      if (result && result.status !== 'pending') {
        if (pollRef.current !== null) window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, POLL_INTERVAL_MS);
  }

  function retry() {
    startedForId.current = null;
    setError(null);
    setSolution(null);
    setLoading(true);
    void start();
  }

  if (loading) return <LoadingBlock />;
  if (error)
    return <FailureBlock title="Couldn't start generation" reason={error} onRetry={retry} />;
  if (!solution)
    return (
      <FailureBlock
        title="Solution lookup failed"
        reason="The server returned no solution row. Try again."
        onRetry={retry}
      />
    );

  if (solution.status === 'unsupported') return <UnsupportedBlock findingId={findingId} />;
  if (solution.status === 'pending') return <LoadingBlock />;
  if (solution.status === 'failed')
    return (
      <FailureBlock
        title="Generation failed"
        reason={solution.failureReason ?? 'Unknown error.'}
        onRetry={retry}
      />
    );
  return <ReadyBlock solution={solution} />;
}

function LoadingBlock() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <Loader2Icon className="size-5 animate-spin text-white/50" />
      <p className="font-mono text-xs text-white/60">Generating solution…</p>
      <p className="type-mono-sm text-white/40">
        Deterministic fix in &lt;1s, LLM-augmented in 5–30s.
      </p>
    </div>
  );
}

function UnsupportedBlock({ findingId }: { findingId: string }) {
  return (
    <div className="space-y-3">
      <div className="rounded border border-white/10 bg-white/5 px-3 py-3 text-xs">
        <div className="flex items-center gap-2 text-white/70">
          <AlertCircleIcon className="size-3.5" />
          <span className="font-medium">No solution generator yet</span>
        </div>
        <p className="mt-1 text-white/50">
          We don't have an auto-fix for this finding category. The Detail and
          Why-important tabs carry the full context — apply by hand for now.
        </p>
      </div>
      <p className="font-mono type-mono-sm text-white/30">
        finding-id: {findingId}
      </p>
    </div>
  );
}

function FailureBlock({
  title,
  reason,
  onRetry,
}: {
  title: string;
  reason: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-3 text-xs">
        <div className="flex items-center gap-2 text-destructive">
          <XCircleIcon className="size-3.5" />
          <span className="font-medium">{title}</span>
        </div>
        <p className="mt-1 text-white/60">{reason}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/10"
      >
        <RefreshCwIcon className="size-3" />
        Retry
      </button>
    </div>
  );
}

function ReadyBlock({ solution }: { solution: SolutionRow }) {
  const confidence = solution.confidence ?? 'high';
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <SparklesIcon className="size-3.5 text-white/60" />
          <span className="text-white/80">
            {solution.deterministic ? 'Deterministic fix' : 'AI-generated'}
          </span>
        </div>
        <ConfidencePill confidence={confidence} deterministic={solution.deterministic ?? false} />
      </div>

      {solution.rationale ? (
        <div className="rounded border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
          <p className="leading-relaxed whitespace-pre-wrap">{solution.rationale}</p>
        </div>
      ) : null}

      {solution.patch ? (
        <DiffRenderer patch={solution.patch} />
      ) : (
        <p className="font-mono text-xs text-white/40">No patch attached.</p>
      )}

      {solution.filesTouched.length > 0 ? (
        <div className="type-mono-sm text-white/40">
          Files: {solution.filesTouched.join(', ')}
        </div>
      ) : null}

      <ApplyButton solutionId={solution.id} />
    </div>
  );
}

function ApplyButton({ solutionId }: { solutionId: string }) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    mode?: string;
    targetUrl?: string;
    targetStatus?: string;
    error?: string;
  } | null>(null);

  async function onClick() {
    setPending(true);
    setResult(null);
    try {
      const { applySolutionAction } = await import('@/lib/apply-actions');
      const r = await applySolutionAction(solutionId);
      setResult(r);
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message });
    } finally {
      setPending(false);
    }
  }

  if (result?.ok) {
    return <ApplySuccess result={result} />;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs text-primary transition hover:bg-primary/25 disabled:opacity-50"
      >
        <SparklesIcon className="size-3" />
        {pending ? 'Applying…' : 'Apply solution'}
      </button>
      <p className="type-mono-sm text-white/40">
        Default: writes patch to <code>/tmp/vk-patches/</code> via LocalGitClient.
        Configure GitHub-App env vars to upgrade to PR dispatch.
      </p>
      {result && !result.ok ? (
        <p className="rounded border border-destructive/30 bg-destructive/5 px-2 py-1 type-mono-sm text-destructive">
          {result.error}
        </p>
      ) : null}
    </div>
  );
}

function ApplySuccess({
  result,
}: {
  result: { mode?: string; targetUrl?: string; targetStatus?: string };
}) {
  return (
    <div className="space-y-2 rounded border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
      <div className="flex items-center gap-2 text-primary">
        <SparklesIcon className="size-3.5" />
        <span className="font-medium">
          Applied via {result.mode === 'local' ? 'local patch' : result.mode}
        </span>
      </div>
      {result.targetUrl ? (
        <p className="break-all font-mono type-mono-sm text-white/70">
          {result.targetUrl}
        </p>
      ) : null}
      {result.targetStatus && result.targetStatus !== 'n/a' ? (
        <p className="type-mono-sm text-white/50">Status: {result.targetStatus}</p>
      ) : null}
      {result.mode === 'local' ? (
        <p className="type-mono-sm text-white/50">
          Apply by hand: <code>cd &lt;repo&gt; && git apply &lt;path&gt;</code>
        </p>
      ) : null}
    </div>
  );
}

function ConfidencePill({
  confidence,
  deterministic,
}: {
  confidence: 'low' | 'mid' | 'high';
  deterministic: boolean;
}) {
  // Monochrome encoding: solid primary for high, neutral solid for mid,
  // dashed muted for low. Mirrors the SeverityBadge convention.
  const styleMap = {
    high: 'border-solid border-primary/40 bg-primary/15 text-primary font-semibold',
    mid: 'border-solid border-white/25 bg-white/5 text-white/80 font-medium',
    low: 'border-dashed border-white/20 bg-transparent text-white/55 font-normal italic',
  } as const;
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono type-mono-sm uppercase tracking-wider ${styleMap[confidence]}`}
    >
      {deterministic ? 'auto' : confidence}
    </span>
  );
}
