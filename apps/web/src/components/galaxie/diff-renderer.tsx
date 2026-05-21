'use client';

/**
 * Minimal unified-diff renderer. No syntax-highlighting yet; classifies each
 * line by its first char only. Sprint G6 Polish may swap for `diff2html` or
 * a Shiki-based renderer.
 */
export function DiffRenderer({ patch }: { patch: string }) {
  const lines = patch.split('\n');
  return (
    <pre className="overflow-x-auto rounded border border-white/10 bg-black/60 px-3 py-2 font-mono type-mono-sm leading-relaxed">
      {lines.map((line, i) => (
        <div key={i} className={lineClass(line)}>
          {line || ' '}
        </div>
      ))}
    </pre>
  );
}

export function lineClass(line: string): string {
  if (line.startsWith('+++') || line.startsWith('---'))
    return 'text-white/90 font-semibold';
  // + → green (Strong-severity), - → red (Kill-severity). Semantic match.
  if (line.startsWith('+')) return 'text-[var(--color-sev-strong)]';
  if (line.startsWith('-')) return 'text-[var(--color-sev-kill)]';
  if (line.startsWith('@@')) return 'text-muted-foreground';
  if (line.startsWith('diff ') || line.startsWith('index '))
    return 'text-white/40';
  return 'text-white/70';
}
