import type { FindingCategory } from '@vk/core';
import type { Customer, FileNode, FolderNode, GalaxieData, Severity } from './types';
import { SEVERITY_BANDS } from './types';
import type { RepoTreeNode } from './tree';

/**
 * SaaS-Premium-Overhaul Bundle A (Mission Control) — pure grouping/sort/heat
 * helpers for the triage console (`SolarListView`). Extracted so the risky
 * re-pivot logic (group-by Severity/Rule/Customer/Folder, triage-sort, heat-bar)
 * is unit-testable without a DOM, auth, or a browser. The console is now the
 * DEFAULT workspace surface; the Pixi galaxie moves to an on-demand Map tab.
 *
 * Triage doctrine: "what's burning, fix it first" is a sortable ranking, not a
 * spatial search — so repos/customers/rules sort by (Kill-count, then Weak,
 * then total findings), most urgent on top. Only Kill screams (asymm-severity).
 */

export type GroupBy = 'repo' | 'severity' | 'rule' | 'customer' | 'folder';

export const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'repo', label: 'Repo' },
  { value: 'severity', label: 'Severity' },
  { value: 'rule', label: 'Rule' },
  { value: 'customer', label: 'Customer' },
  { value: 'folder', label: 'Folder' },
];

/** Human labels for the 6 audit-rule categories (the "Rule" group-by axis). */
export const CATEGORY_LABEL: Record<FindingCategory, string> = {
  'unused-agent': 'Unused agent',
  'duplicate-guidance': 'Duplicate guidance',
  'context-bloat': 'Context bloat',
  'stale-reference': 'Stale reference',
  'token-budget': 'Token budget',
  'conflicting-rules': 'Conflicting rules',
};

export const UNCATEGORIZED_KEY = '__uncategorized__';
export const UNCATEGORIZED_LABEL = 'Uncategorized';

type SeverityCounts = Record<Severity, number>;

const emptyCounts = (): SeverityCounts => ({
  Kill: 0,
  Weak: 0,
  Mid: 0,
  Strong: 0,
  Exceptional: 0,
});

const total = (c: SeverityCounts): number =>
  SEVERITY_BANDS.reduce((n, s) => n + c[s], 0);

export function severityCounts(files: readonly FileNode[]): SeverityCounts {
  const c = emptyCounts();
  for (const f of files) c[f.severity] += 1;
  return c;
}

function mergeCounts(list: readonly SeverityCounts[]): SeverityCounts {
  const c = emptyCounts();
  for (const x of list) for (const s of SEVERITY_BANDS) c[s] += x[s];
  return c;
}

export interface HeatSegment {
  severity: Severity;
  count: number;
  /** Width percentage (0–100) of this band within the row's total. */
  pct: number;
}

/**
 * Stacked severity distribution for a row's heat-bar — the "in 3 seconds"
 * glyph. Ordered worst → best (Kill leftmost), zero-count bands omitted.
 */
export function heatSegments(counts: SeverityCounts): HeatSegment[] {
  const t = total(counts);
  if (t === 0) return [];
  return SEVERITY_BANDS.filter((s) => counts[s] > 0).map((s) => ({
    severity: s,
    count: counts[s],
    pct: (counts[s] / t) * 100,
  }));
}

/**
 * Triage order: more Kills first, then more Weak, then more findings overall.
 * Returns <0 when `a` is MORE urgent (so `a` sorts before `b`). Stable callers
 * append a label tiebreak.
 */
export function triageComparator(a: SeverityCounts, b: SeverityCounts): number {
  if (a.Kill !== b.Kill) return b.Kill - a.Kill;
  if (a.Weak !== b.Weak) return b.Weak - a.Weak;
  return total(b) - total(a);
}

// SEVERITY_BANDS is ordered worst → best, so a lower index = worse.
const rank = (s: Severity) => SEVERITY_BANDS.indexOf(s);
const fileSort = (a: FileNode, b: FileNode) =>
  rank(a.severity) - rank(b.severity) || a.path.localeCompare(b.path);

// ── Repo ───────────────────────────────────────────────────────────────────

export interface RepoSection {
  repo: RepoTreeNode['repo'];
  tree: RepoTreeNode;
  /** Severity distribution over ALL the repo's files (filter-independent — the
   *  heat-bar + sort reflect true health, the filter only hides expanded rows). */
  counts: SeverityCounts;
  fileCount: number;
}

/**
 * Repo sections sorted by triage priority. `counts` is computed from `allFiles`
 * (the unfiltered repo files) so the heat-bar + ranking stay stable regardless
 * of the active severity-filter chips.
 */
export function sectionsByRepo(
  tree: readonly RepoTreeNode[],
  allFiles: readonly FileNode[],
): RepoSection[] {
  const filesByRepo = new Map<string, FileNode[]>();
  for (const f of allFiles) {
    const arr = filesByRepo.get(f.repoId) ?? [];
    arr.push(f);
    filesByRepo.set(f.repoId, arr);
  }
  return tree
    .map((t): RepoSection => {
      const rf = filesByRepo.get(t.repo.id) ?? [];
      return {
        repo: t.repo,
        tree: t,
        counts: severityCounts(rf),
        fileCount: rf.length,
      };
    })
    .sort(
      (a, b) =>
        triageComparator(a.counts, b.counts) ||
        a.repo.label.localeCompare(b.repo.label),
    );
}

// ── Customer ─────────────────────────────────────────────────────────────────

export interface CustomerSection {
  customer: Customer;
  repos: RepoSection[];
  counts: SeverityCounts;
}

export function sectionsByCustomer(
  data: GalaxieData,
  tree: readonly RepoTreeNode[],
  allFiles: readonly FileNode[],
): CustomerSection[] {
  const repoSections = sectionsByRepo(tree, allFiles);
  const byCustomer = new Map<string, RepoSection[]>();
  for (const rs of repoSections) {
    const arr = byCustomer.get(rs.repo.customerId) ?? [];
    arr.push(rs);
    byCustomer.set(rs.repo.customerId, arr);
  }
  return data.customers
    .map((customer): CustomerSection => {
      const repos = byCustomer.get(customer.id) ?? [];
      return {
        customer,
        repos,
        counts: mergeCounts(repos.map((r) => r.counts)),
      };
    })
    .filter((c) => c.repos.length > 0)
    .sort(
      (a, b) =>
        triageComparator(a.counts, b.counts) ||
        a.customer.label.localeCompare(b.customer.label),
    );
}

// ── Severity ─────────────────────────────────────────────────────────────────

export interface SeveritySection {
  severity: Severity;
  files: FileNode[];
}

/** Flat files bucketed into the 5 bands, Kill first; empty bands omitted. */
export function sectionsBySeverity(files: readonly FileNode[]): SeveritySection[] {
  return SEVERITY_BANDS.map((severity) => ({
    severity,
    files: files.filter((f) => f.severity === severity).sort(fileSort),
  })).filter((sec) => sec.files.length > 0);
}

// ── Rule (audit category) ────────────────────────────────────────────────────

export interface RuleSection {
  key: string;
  label: string;
  files: FileNode[];
  counts: SeverityCounts;
}

/**
 * Files bucketed by their representative audit category (worst active finding's
 * `category`). Files with no category fall into a single "Uncategorized" bucket.
 * Sections sort by triage priority.
 */
export function sectionsByRule(files: readonly FileNode[]): RuleSection[] {
  const byCat = new Map<string, FileNode[]>();
  for (const f of files) {
    const key = f.category ?? UNCATEGORIZED_KEY;
    const arr = byCat.get(key) ?? [];
    arr.push(f);
    byCat.set(key, arr);
  }
  return [...byCat.entries()]
    .map(([key, fs]): RuleSection => ({
      key,
      label:
        key === UNCATEGORIZED_KEY
          ? UNCATEGORIZED_LABEL
          : CATEGORY_LABEL[key as FindingCategory],
      files: fs.slice().sort(fileSort),
      counts: severityCounts(fs),
    }))
    .sort(
      (a, b) =>
        triageComparator(a.counts, b.counts) || a.label.localeCompare(b.label),
    );
}

// ── Folder ───────────────────────────────────────────────────────────────────

export interface FolderSection {
  folder: FolderNode;
  files: FileNode[];
  counts: SeverityCounts;
  repoLabel: string;
}

/**
 * All folders across the workspace, flattened and triage-sorted. `files` is the
 * already-filtered folder file list from the tree; folders that filter empty are
 * dropped by the caller's tree filter before this runs.
 */
export function sectionsByFolder(tree: readonly RepoTreeNode[]): FolderSection[] {
  const out: FolderSection[] = [];
  for (const t of tree) {
    for (const fn of t.folders) {
      out.push({
        folder: fn.folder,
        files: fn.files,
        counts: severityCounts(fn.files),
        repoLabel: t.repo.label,
      });
    }
  }
  return out.sort(
    (a, b) =>
      triageComparator(a.counts, b.counts) ||
      a.repoLabel.localeCompare(b.repoLabel) ||
      a.folder.name.localeCompare(b.folder.name),
  );
}
