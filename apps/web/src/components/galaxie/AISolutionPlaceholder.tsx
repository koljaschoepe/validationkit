'use client';

import { SparklesIcon, LockIcon } from 'lucide-react';
import type { FileNode } from '@/lib/galaxie/types';

const MOCK_DIFF_BY_CATEGORY: Record<string, string> = {
  'unused-agent':
    '- # Agent: ghost-agent\n- # Triggers on: never\n- # ... (28 lines removed)',
  'duplicate-guidance':
    '- (CLAUDE.md, lines 14-22 — moved to AGENTS.md)\n  Style rules now live in AGENTS.md only. Reference from CLAUDE.md.',
  'context-bloat':
    '+ Split into:\n+   .claude/CLAUDE.md          (~3.2k tokens, always-on)\n+   .claude/agents/audit.md    (~2.4k tokens, on-demand)\n+   .claude/agents/refactor.md (~2.1k tokens, on-demand)',
  'stale-reference':
    '- See ./does-not-exist.md\n+ See ./docs/security.md',
  'token-budget':
    '- @import .claude/agents/legacy-*.md\n  (legacy-*.md moves to on-demand, saves ~9k tokens)',
  'conflicting-rules':
    '  AGENTS.md says: "always run pnpm typecheck before commit"\n  .cursor/rules/git.mdc says: "skip typecheck for hotfix branches"\n+ Reconcile: keep AGENTS.md rule, delete cursor override.',
};

const FALLBACK_DIFF =
  '+ AI-suggested fix lands here in Sprint G4.\n+ Diff will be reviewable + applicable as PR or Direct-Commit.';

export function AISolutionPlaceholder({ file }: { file: FileNode }) {
  // We derive the category from the finding's "category" hint baked into id/path.
  // For Sprint G3 we don't have direct access to finding.category through FileNode
  // (only severity), so we infer from path keywords as a best-effort mock.
  const category = inferCategoryFromPath(file.path);
  const diff = MOCK_DIFF_BY_CATEGORY[category] ?? FALLBACK_DIFF;

  return (
    <div className="space-y-3">
      <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-amber-300">
          <SparklesIcon className="size-3.5" />
          <span className="font-medium">Coming in Sprint G4</span>
        </div>
        <p className="mt-1 text-white/70">
          AI-generated solution as PR or Direct-Commit, per Customer policy.
          Today: read-only finding view + curated reasoning.
        </p>
      </div>

      <pre className="overflow-x-auto rounded border border-white/10 bg-black/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-white/80">
        {diff}
      </pre>

      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40"
        title="Available after Sprint G4"
      >
        <LockIcon className="size-3" />
        Apply (disabled)
      </button>
    </div>
  );
}

function inferCategoryFromPath(path: string): string {
  // Hint from category we expect in the finding-title (file.path here = finding.title).
  // Crude but stable: title contains the category keyword.
  const lower = path.toLowerCase();
  if (lower.includes('ghost') || lower.includes('unused') || lower.includes('never referenced'))
    return 'unused-agent';
  if (lower.includes('duplicate') || lower.includes('similarity')) return 'duplicate-guidance';
  if (lower.includes('bloat') || lower.includes('token')) return 'context-bloat';
  if (lower.includes('not found') || lower.includes('stale')) return 'stale-reference';
  if (lower.includes('budget')) return 'token-budget';
  if (lower.includes('conflict')) return 'conflicting-rules';
  return 'unknown';
}
