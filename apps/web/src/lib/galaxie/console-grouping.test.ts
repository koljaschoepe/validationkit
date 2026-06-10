import { describe, it, expect } from 'vitest';
import type { Customer, FileNode, GalaxieData, Repo, Severity } from './types';
import type { RepoTreeNode } from './tree';
import {
  CATEGORY_LABEL,
  UNCATEGORIZED_LABEL,
  sectionsByCustomer,
  sectionsByRepo,
  sectionsByRule,
  severityCounts,
  triageComparator,
  worstSeverity,
} from './console-grouping';
import type { FindingCategory } from '@vk/core';

// ── Fixtures ─────────────────────────────────────────────────────────────────

let seq = 0;
function file(
  repoId: string,
  customerId: string,
  severity: Severity,
  opts: { path?: string; category?: FindingCategory } = {},
): FileNode {
  seq += 1;
  const path = opts.path ?? `src/file-${seq}.ts`;
  return {
    id: `${repoId}::file::${path}`,
    repoId,
    customerId,
    path,
    severity,
    findingSnippet: 'snippet',
    findings: [{ id: `${repoId}-${seq}`, severity, snippet: 'snippet' }],
    ...(opts.category ? { category: opts.category } : {}),
  };
}

function repo(id: string, customerId: string, label: string): Repo {
  return { id, customerId, slug: id, label, aggregateSeverity: 'Mid' };
}

function repoTree(r: Repo, files: FileNode[]): RepoTreeNode {
  return { repo: r, folders: [], rootFiles: files };
}

const counts = (o: Partial<Record<Severity, number>>): Record<Severity, number> => ({
  Kill: 0,
  Weak: 0,
  Mid: 0,
  Strong: 0,
  Exceptional: 0,
  ...o,
});

// ── severityCounts ───────────────────────────────────────────────────────────

describe('severityCounts', () => {
  it('tallies files per band', () => {
    const files = [
      file('r1', 'c1', 'Kill'),
      file('r1', 'c1', 'Kill'),
      file('r1', 'c1', 'Strong'),
    ];
    expect(severityCounts(files)).toEqual(counts({ Kill: 2, Strong: 1 }));
  });

  it('returns all-zero for no files', () => {
    expect(severityCounts([])).toEqual(counts({}));
  });
});

// ── worstSeverity ────────────────────────────────────────────────────────────

describe('worstSeverity', () => {
  it('returns the worst band present (worst → best order)', () => {
    expect(worstSeverity(counts({ Kill: 1, Strong: 3 }))).toBe('Kill');
    expect(worstSeverity(counts({ Mid: 2, Strong: 5 }))).toBe('Mid');
    expect(worstSeverity(counts({ Exceptional: 4 }))).toBe('Exceptional');
  });

  it('returns null for an all-zero distribution', () => {
    expect(worstSeverity(counts({}))).toBeNull();
  });
});

// ── triageComparator ─────────────────────────────────────────────────────────

describe('triageComparator', () => {
  it('ranks more Kills first', () => {
    expect(triageComparator(counts({ Kill: 2 }), counts({ Kill: 1 }))).toBeLessThan(0);
  });

  it('breaks Kill-ties by Weak count', () => {
    expect(
      triageComparator(counts({ Kill: 1, Weak: 3 }), counts({ Kill: 1, Weak: 1 })),
    ).toBeLessThan(0);
  });

  it('breaks Kill+Weak ties by total findings', () => {
    expect(
      triageComparator(counts({ Mid: 5 }), counts({ Mid: 2 })),
    ).toBeLessThan(0);
  });

  it('a calm repo never outranks a burning one', () => {
    // 1 Kill must beat any number of non-Kill findings.
    expect(
      triageComparator(counts({ Kill: 1 }), counts({ Weak: 99, Mid: 99 })),
    ).toBeLessThan(0);
  });
});

// ── sectionsByRepo ───────────────────────────────────────────────────────────

describe('sectionsByRepo', () => {
  it('sorts burning repos above calm ones', () => {
    const calm = repo('r1', 'c1', 'Calm');
    const fire = repo('r2', 'c1', 'Fire');
    const files = [
      file('r1', 'c1', 'Strong'),
      file('r1', 'c1', 'Strong'),
      file('r2', 'c1', 'Kill'),
    ];
    const tree = [repoTree(calm, []), repoTree(fire, [])];
    const sections = sectionsByRepo(tree, files);
    expect(sections.map((s) => s.repo.label)).toEqual(['Fire', 'Calm']);
    expect(sections[0]!.counts.Kill).toBe(1);
    expect(sections[0]!.fileCount).toBe(1);
  });

  it('counts are filter-independent (computed from all repo files)', () => {
    const r = repo('r1', 'c1', 'R');
    const files = [file('r1', 'c1', 'Kill'), file('r1', 'c1', 'Mid')];
    const sections = sectionsByRepo([repoTree(r, [])], files);
    expect(sections[0]!.counts).toEqual(counts({ Kill: 1, Mid: 1 }));
  });
});

// ── sectionsByRule ───────────────────────────────────────────────────────────

describe('sectionsByRule', () => {
  it('labels known categories and triage-sorts buckets', () => {
    const files = [
      file('r1', 'c1', 'Strong', { category: 'context-bloat' }),
      file('r1', 'c1', 'Kill', { category: 'duplicate-guidance' }),
    ];
    const sections = sectionsByRule(files);
    expect(sections[0]!.label).toBe(CATEGORY_LABEL['duplicate-guidance']);
    expect(sections[0]!.counts.Kill).toBe(1);
  });

  it('collects category-less files under Uncategorized', () => {
    const sections = sectionsByRule([file('r1', 'c1', 'Mid')]);
    expect(sections[0]!.label).toBe(UNCATEGORIZED_LABEL);
  });
});

// ── sectionsByCustomer ───────────────────────────────────────────────────────

describe('sectionsByCustomer', () => {
  const customer = (id: string, label: string): Customer => ({
    id,
    slug: id,
    label,
    aggregateSeverity: 'Mid',
  });

  it('groups repos under customers and sorts by aggregate triage', () => {
    const data: GalaxieData = {
      customers: [customer('c1', 'Calm Co'), customer('c2', 'Fire Co')],
      repos: [repo('r1', 'c1', 'R1'), repo('r2', 'c2', 'R2')],
      files: [],
    };
    const files = [file('r1', 'c1', 'Mid'), file('r2', 'c2', 'Kill')];
    const tree = [repoTree(data.repos[0]!, []), repoTree(data.repos[1]!, [])];
    const sections = sectionsByCustomer(data, tree, files);
    expect(sections.map((s) => s.customer.label)).toEqual(['Fire Co', 'Calm Co']);
    expect(sections[0]!.repos).toHaveLength(1);
    expect(sections[0]!.counts.Kill).toBe(1);
  });

  it('drops customers with no repos in the tree', () => {
    const data: GalaxieData = {
      customers: [customer('c1', 'Has'), customer('c2', 'Empty')],
      repos: [repo('r1', 'c1', 'R1')],
      files: [],
    };
    const sections = sectionsByCustomer(data, [repoTree(data.repos[0]!, [])], [
      file('r1', 'c1', 'Mid'),
    ]);
    expect(sections.map((s) => s.customer.label)).toEqual(['Has']);
  });
});
