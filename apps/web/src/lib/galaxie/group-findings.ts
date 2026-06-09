import type { FileNode, FindingRef, Severity } from './types';
import { SEVERITY_BANDS, aggregateSeverities } from './types';

/** One finding normalized for grouping — the {@link FindingRef} plus the file
 *  coordinates it belongs to. Galaxie-Redesign Phase B (B.1). */
export interface FindingFileEntry {
  repoId: string;
  customerId: string;
  path: string;
  kind?: FileNode['kind'];
  ref: FindingRef;
}

/**
 * Galaxie-Redesign Phase B (B.1) — collapse per-finding entries into one
 * {@link FileNode} per real path. Each file's aggregate fields (severity /
 * dismiss / solution / snippet / label / category) describe the representative =
 * worst-severity finding among the active ones (or among all, when every
 * finding is muted); the full per-finding list lives in `findings`. Pure +
 * deterministic (insertion-ordered groups) so it is unit-testable without a DB.
 */
export function groupFindingRefsIntoFiles(
  entries: FindingFileEntry[],
): FileNode[] {
  interface FileGroup {
    repoId: string;
    customerId: string;
    path: string;
    kind?: FileNode['kind'];
    findings: FindingRef[];
  }
  const groups = new Map<string, FileGroup>();
  for (const e of entries) {
    const key = `${e.repoId}::${e.path}`;
    const existing = groups.get(key);
    if (existing) {
      existing.findings.push(e.ref);
    } else {
      groups.set(key, {
        repoId: e.repoId,
        customerId: e.customerId,
        path: e.path,
        ...(e.kind ? { kind: e.kind } : {}),
        findings: [e.ref],
      });
    }
  }

  // SEVERITY_BANDS is ordered worst → best, so a lower index = worse.
  const severityRank = (s: Severity) => SEVERITY_BANDS.indexOf(s);
  const files: FileNode[] = [];
  for (const g of groups.values()) {
    const active = g.findings.filter((r) => r.dismissStatus === 'active');
    const pool = active.length > 0 ? active : g.findings;
    const rep = [...pool].sort(
      (a, b) => severityRank(a.severity) - severityRank(b.severity),
    )[0]!;
    const allDismissed = g.findings.every((r) => r.dismissStatus === 'dismissed');
    const allMuted = g.findings.every((r) => r.dismissStatus !== 'active');
    const fileDismiss: FindingRef['dismissStatus'] = allDismissed
      ? 'dismissed'
      : allMuted
        ? 'snoozed'
        : 'active';
    files.push({
      id: `${g.repoId}::file::${g.path}`,
      repoId: g.repoId,
      customerId: g.customerId,
      path: g.path,
      ...(g.kind ? { kind: g.kind } : {}),
      category: rep.category,
      label: rep.label,
      severity: aggregateSeverities(pool.map((r) => r.severity)),
      findingSnippet: rep.snippet,
      ...(rep.solutionStatus ? { solutionStatus: rep.solutionStatus } : {}),
      ...(rep.solutionConfidence ? { solutionConfidence: rep.solutionConfidence } : {}),
      dismissStatus: fileDismiss,
      ...(rep.dismissReason ? { dismissReason: rep.dismissReason } : {}),
      ...(rep.snoozedUntil ? { snoozedUntil: rep.snoozedUntil } : {}),
      findings: g.findings,
    });
  }
  return files;
}
