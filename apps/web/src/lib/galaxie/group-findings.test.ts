import { describe, expect, it } from 'vitest';
import {
  groupFindingRefsIntoFiles,
  type FindingFileEntry,
} from './group-findings';
import type { FindingRef, Severity } from './types';

const ref = (
  over: Partial<FindingRef> & Pick<FindingRef, 'id' | 'severity'>,
): FindingRef => ({ snippet: '', ...over });

const entry = (
  path: string,
  r: FindingRef,
  repoId = 'r1',
): FindingFileEntry => ({ repoId, customerId: 'c1', path, ref: r });

describe('groupFindingRefsIntoFiles', () => {
  it('collapses N findings on one path into a single path-keyed FileNode', () => {
    const files = groupFindingRefsIntoFiles([
      entry('.claude/CLAUDE.md', ref({ id: 'a', severity: 'Mid' })),
      entry('.claude/CLAUDE.md', ref({ id: 'b', severity: 'Kill' })),
      entry('.claude/CLAUDE.md', ref({ id: 'c', severity: 'Strong' })),
    ]);
    expect(files).toHaveLength(1);
    const f = files[0]!;
    expect(f.id).toBe('r1::file::.claude/CLAUDE.md');
    expect(f.path).toBe('.claude/CLAUDE.md');
    expect(f.findings.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    // Aggregate severity across active findings → Kill (worst present).
    expect(f.severity).toBe('Kill');
  });

  it('keeps findings on different paths as separate files', () => {
    const files = groupFindingRefsIntoFiles([
      entry('a.md', ref({ id: 'a', severity: 'Mid' })),
      entry('b.md', ref({ id: 'b', severity: 'Kill' })),
    ]);
    expect(files).toHaveLength(2);
    expect(new Set(files.map((f) => f.path))).toEqual(new Set(['a.md', 'b.md']));
  });

  it('same path under different repos stays separate (repo-scoped key)', () => {
    const files = groupFindingRefsIntoFiles([
      entry('CLAUDE.md', ref({ id: 'a', severity: 'Mid' }), 'r1'),
      entry('CLAUDE.md', ref({ id: 'b', severity: 'Kill' }), 'r2'),
    ]);
    expect(files).toHaveLength(2);
  });

  it('representative (worst active) drives the headline fields', () => {
    const files = groupFindingRefsIntoFiles([
      entry(
        'x.md',
        ref({ id: 'a', severity: 'Strong', label: 'minor', snippet: 'low' }),
      ),
      entry(
        'x.md',
        ref({
          id: 'b',
          severity: 'Kill',
          label: 'critical',
          snippet: 'urgent',
          category: 'context-bloat',
        }),
      ),
    ]);
    const f = files[0]!;
    expect(f.label).toBe('critical');
    expect(f.findingSnippet).toBe('urgent');
    expect(f.category).toBe('context-bloat');
  });

  it('aggregate severity ignores dismissed findings; file stays active', () => {
    const files = groupFindingRefsIntoFiles([
      entry('x.md', ref({ id: 'a', severity: 'Mid', dismissStatus: 'active' })),
      entry(
        'x.md',
        ref({ id: 'b', severity: 'Kill', dismissStatus: 'dismissed' }),
      ),
    ]);
    const f = files[0]!;
    // Kill is dismissed → active pool is just the Mid.
    expect(f.severity).toBe('Mid');
    expect(f.dismissStatus).toBe('active');
    // Both findings are still listed for the inspector.
    expect(f.findings).toHaveLength(2);
  });

  it('marks the file dismissed only when every finding is dismissed', () => {
    const files = groupFindingRefsIntoFiles([
      entry('x.md', ref({ id: 'a', severity: 'Mid', dismissStatus: 'dismissed' })),
      entry('x.md', ref({ id: 'b', severity: 'Kill', dismissStatus: 'dismissed' })),
    ]);
    const f = files[0]!;
    expect(f.dismissStatus).toBe('dismissed');
    // All muted → severity falls back to worst overall (Kill) for the dimmed planet.
    expect(f.severity).toBe('Kill');
  });

  it('marks the file snoozed when every finding is muted but not all dismissed', () => {
    const files = groupFindingRefsIntoFiles([
      entry('x.md', ref({ id: 'a', severity: 'Mid', dismissStatus: 'snoozed' })),
      entry('x.md', ref({ id: 'b', severity: 'Kill', dismissStatus: 'dismissed' })),
    ]);
    expect(files[0]!.dismissStatus).toBe('snoozed');
  });

  it('returns [] for no entries', () => {
    expect(groupFindingRefsIntoFiles([])).toEqual([]);
  });

  it('threads kind from the first entry of a group', () => {
    const files = groupFindingRefsIntoFiles([
      entry('.claude/CLAUDE.md', ref({ id: 'a', severity: 'Mid' })),
    ].map((e) => ({ ...e, kind: 'claude-md' as const })));
    expect(files[0]!.kind).toBe('claude-md');
  });
});

// Type-guard: SEVERITY_BANDS order assumption the rank relies on.
describe('severity-rank assumption', () => {
  it('Kill is the worst band', () => {
    const bands: Severity[] = ['Kill', 'Weak', 'Mid', 'Strong', 'Exceptional'];
    const files = groupFindingRefsIntoFiles(
      bands.map((s, i) => entry('x.md', ref({ id: `f${i}`, severity: s }))),
    );
    expect(files[0]!.severity).toBe('Kill');
  });
});
