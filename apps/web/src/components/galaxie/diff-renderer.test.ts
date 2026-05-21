import { describe, expect, it } from 'vitest';
import { lineClass } from './diff-renderer';

describe('lineClass', () => {
  it('classifies + lines as added (severity-strong token)', () => {
    expect(lineClass('+ added text')).toBe('text-[var(--color-sev-strong)]');
  });

  it('classifies - lines as removed (severity-kill token)', () => {
    expect(lineClass('- removed text')).toBe('text-[var(--color-sev-kill)]');
  });

  it('classifies @@ hunk-headers as muted', () => {
    expect(lineClass('@@ -1,3 +1,4 @@')).toBe('text-muted-foreground');
  });

  it('classifies +++ / --- file-headers as bold', () => {
    expect(lineClass('+++ b/CLAUDE.md')).toBe('text-white/90 font-semibold');
    expect(lineClass('--- a/CLAUDE.md')).toBe('text-white/90 font-semibold');
  });

  it('classifies "diff" / "index" lines as faint', () => {
    expect(lineClass('diff --git a/foo b/foo')).toBe('text-white/40');
    expect(lineClass('index 1234..5678 100644')).toBe('text-white/40');
  });

  it('classifies plain lines as default', () => {
    expect(lineClass('  context line')).toBe('text-white/70');
    expect(lineClass('')).toBe('text-white/70');
  });
});
