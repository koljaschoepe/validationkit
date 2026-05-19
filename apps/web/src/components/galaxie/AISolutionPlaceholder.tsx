'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircleIcon,
  LockIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparklesIcon,
  XCircleIcon,
} from 'lucide-react';
import type { FileNode } from '@/lib/galaxie/types';
import type { SolutionRow } from '@/lib/solution-dal';
import { DiffRenderer } from './diff-renderer';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 15; // 30s ceiling

export function AISolutionPlaceholder({ file }: { file: FileNode }) {
  const [solution, setSolution] = useState<SolutionRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<number | null>(null);
  const startedForId = useRef<string | null>(null);

  useEffect(() => {
    if (startedForId.current === file.id) return;
    startedForId.current = file.id;
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
  }, [file.id]);

  async function start() {
    try {
      const { requestSolution } = await import('@/lib/solution-actions');
      const result = await requestSolution(file.id);
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
      const result = await pollSolution(file.id);
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

  if (solution.status === 'unsupported') return <UnsupportedBlock file={file} />;
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
      <p className="text-[10px] text-white/40">
        Deterministic fix in &lt;1s, LLM-augmented in 5–30s.
      </p>
    </div>
  );
}

function UnsupportedBlock({ file }: { file: FileNode }) {
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
      <p className="font-mono text-[10px] text-white/30">
        finding-id: {file.id}
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
      <div className="rounded border border-red-500/30 bg-red-500/5 px-3 py-3 text-xs">
        <div className="flex items-center gap-2 text-red-300">
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
        <div className="text-[10px] text-white/40">
          Files: {solution.filesTouched.join(', ')}
        </div>
      ) : null}

      <button
        type="button"
        disabled
        title="Apply lands in Sprint G5 — GitHub-App-PR-Workflow"
        className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40"
      >
        <LockIcon className="size-3" />
        Apply (Sprint G5)
      </button>
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
  const colorMap = {
    high: 'bg-green-500/20 text-green-300 border-green-500/30',
    mid: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    low: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  } as const;
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${colorMap[confidence]}`}
    >
      {deterministic ? 'auto' : confidence}
    </span>
  );
}
