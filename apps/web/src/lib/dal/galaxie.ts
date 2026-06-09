import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { getDb, isDbEnabled, schema } from '@vk/db';
import type {
  Customer,
  FileNode,
  FindingRef,
  GalaxieData,
  Repo,
  Severity,
} from '@/lib/galaxie/types';
import { SEVERITY_BANDS, aggregateSeverities } from '@/lib/galaxie/types';
import {
  groupFindingRefsIntoFiles,
  type FindingFileEntry,
} from '@/lib/galaxie/group-findings';
import { galaxieWorkspaceTag } from '@/lib/cache-tags';
import { listSolutionStatusByFinding } from '@/lib/solution-dal';
import { userIsMember } from '@/lib/authz';

export interface WorkspaceMeta {
  id: string;
  slug: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
}

export interface WorkspaceCounts {
  customerCount: number;
  repoCount: number;
  scanCount: number;
  writeEnabledRepoCount: number;
  /** Phase Nova-2: count of apply_action rows — drives "Apply your first fix" activation item. */
  applyCount: number;
  /** Phase Nova-2: count of membership rows — drives "Invite a teammate" activation item. */
  memberCount: number;
}

export async function getWorkspaceCounts(
  workspaceId: string,
): Promise<WorkspaceCounts> {
  if (!isDbEnabled()) {
    return {
      customerCount: 0,
      repoCount: 0,
      scanCount: 0,
      writeEnabledRepoCount: 0,
      applyCount: 0,
      memberCount: 0,
    };
  }
  const db = getDb();
  const [customers, repos, scans, applies, members] = await Promise.all([
    db
      .select({ id: schema.customer.id })
      .from(schema.customer)
      .where(eq(schema.customer.workspaceId, workspaceId)),
    db
      .select({
        id: schema.repo.id,
        writeAccessGranted: schema.repo.writeAccessGranted,
      })
      .from(schema.repo)
      .where(eq(schema.repo.workspaceId, workspaceId)),
    db
      .select({ id: schema.scan.id })
      .from(schema.scan)
      .where(eq(schema.scan.workspaceId, workspaceId)),
    db
      .select({ id: schema.applyAction.id })
      .from(schema.applyAction)
      .where(eq(schema.applyAction.workspaceId, workspaceId)),
    db
      .select({ id: schema.membership.id })
      .from(schema.membership)
      .where(eq(schema.membership.workspaceId, workspaceId)),
  ]);
  return {
    customerCount: customers.length,
    repoCount: repos.length,
    scanCount: scans.length,
    writeEnabledRepoCount: repos.filter((r) => r.writeAccessGranted).length,
    applyCount: applies.length,
    memberCount: members.length,
  };
}

const VALID_SEVERITIES = new Set<Severity>(SEVERITY_BANDS);

export function normalizeSeverity(s: string | null | undefined): Severity {
  if (s && VALID_SEVERITIES.has(s as Severity)) return s as Severity;
  return 'Mid';
}

// Galaxie-Redesign Phase A — re-export the canonical aggregation (now in
// `lib/galaxie/types.ts`, pure + shared with the layout). Kept here so existing
// importers (customer-dal) keep resolving it from the DAL.
export { aggregateSeverities };

/**
 * Mirror of the `slugify` regex used in the Sprint G2 0008 migration backfill.
 * Keep in sync — any change here must also update the SQL:
 *   btrim(regexp_replace(lower(label), '[^a-z0-9]+', '-', 'g'), '-')
 */
export function slugifyForBackfill(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function loadWorkspaceData(workspaceId: string): Promise<GalaxieData> {
  const db = getDb();

  const [customersRows, reposRows] = await Promise.all([
    db
      .select()
      .from(schema.customer)
      .where(eq(schema.customer.workspaceId, workspaceId)),
    db
      .select()
      .from(schema.repo)
      .where(eq(schema.repo.workspaceId, workspaceId)),
  ]);

  // Latest scan per repo (also tolerating legacy scans linked by rootPath).
  const scansRows =
    reposRows.length === 0
      ? []
      : await db
          .select()
          .from(schema.scan)
          .where(eq(schema.scan.workspaceId, workspaceId))
          .orderBy(desc(schema.scan.createdAt));

  const repoByRootPath = new Map(reposRows.map((r) => [r.rootPath, r.id]));
  const latestScanPerRepo = new Map<string, (typeof scansRows)[number]>();
  for (const s of scansRows) {
    const repoId = s.repoId ?? repoByRootPath.get(s.rootPath) ?? null;
    if (!repoId) continue;
    if (!latestScanPerRepo.has(repoId)) latestScanPerRepo.set(repoId, s);
  }

  const scanIdToRepoId = new Map<string, string>();
  for (const [repoId, scan] of latestScanPerRepo) {
    scanIdToRepoId.set(scan.id, repoId);
  }

  const scanIds = [...scanIdToRepoId.keys()];
  const findingsRows =
    scanIds.length === 0
      ? []
      : await db
          .select()
          .from(schema.finding)
          .where(inArray(schema.finding.scanId, scanIds));

  // Sprint G4 — bulk-load solution status for all findings in one roundtrip.
  const solutionStatusMap = await listSolutionStatusByFinding(
    workspaceId,
    findingsRows.map((f) => f.id),
  );

  // Galaxie-Redesign Phase B (B.1) — normalize each finding into a FindingRef +
  // its file coordinates; the pure groupFindingRefsIntoFiles collapses them to
  // one FileNode per real path (unit-tested below).
  // Sprint G5 — lazy-expire snooze: if snoozed_until < now, treat as active.
  const now = new Date();
  const reposById = new Map(reposRows.map((r) => [r.id, r]));

  const entries: FindingFileEntry[] = [];
  for (const f of findingsRows) {
    const repoId = scanIdToRepoId.get(f.scanId);
    if (!repoId) continue;
    const repo = reposById.get(repoId);
    if (!repo) continue;
    const sol = solutionStatusMap.get(f.id);
    let dismissStatus = (f.dismissStatus as FindingRef['dismissStatus']) ?? 'active';
    if (dismissStatus === 'snoozed' && f.snoozedUntil && f.snoozedUntil < now) {
      dismissStatus = 'active';
    }
    // Real path is the source of truth for folder derivation + the grouping key;
    // citations[0].path is the pre-migration fallback; the prose title is only
    // used for legacy uncited rows.
    const citations = Array.isArray(f.citations)
      ? (f.citations as { path?: string }[])
      : [];
    const realPath = f.filePath ?? citations[0]?.path ?? f.title;
    const ref: FindingRef = {
      id: f.id,
      severity: normalizeSeverity(f.severity),
      category: f.category as FindingRef['category'],
      label: f.title || f.category,
      snippet: f.detail.slice(0, 240),
      solutionStatus: sol?.status ?? 'none',
      ...(sol?.confidence ? { solutionConfidence: sol.confidence } : {}),
      dismissStatus,
      ...(f.dismissReason ? { dismissReason: f.dismissReason } : {}),
      ...(f.snoozedUntil ? { snoozedUntil: f.snoozedUntil } : {}),
    };
    entries.push({
      repoId,
      customerId: repo.customerId ?? '',
      path: realPath,
      ...(f.fileKind ? { kind: f.fileKind as FileNode['kind'] } : {}),
      ref,
    });
  }

  const files = groupFindingRefsIntoFiles(entries);

  // Aggregate per repo — Sprint G5 excludes dismissed.
  const sevByRepo = new Map<string, Severity[]>();
  for (const f of files) {
    if (f.dismissStatus === 'dismissed') continue;
    const arr = sevByRepo.get(f.repoId) ?? [];
    arr.push(f.severity);
    sevByRepo.set(f.repoId, arr);
  }
  const repos: Repo[] = reposRows.map((r) => {
    // Phase B (B.5) — submodules ride along in the latest scan's persisted
    // ParserResult (scan.rawScan), so no extra migration is needed.
    const scan = latestScanPerRepo.get(r.id);
    const rawScan = scan?.rawScan as { submodules?: { path: string; url: string }[] } | null;
    const submodules = Array.isArray(rawScan?.submodules)
      ? rawScan.submodules
      : [];
    return {
      id: r.id,
      customerId: r.customerId ?? '',
      slug: r.id.slice(0, 8),
      label: r.label,
      aggregateSeverity: aggregateSeverities(sevByRepo.get(r.id) ?? []),
      ...(submodules.length > 0 ? { submodules } : {}),
    };
  });

  // Aggregate per customer (from repo-aggregates).
  const sevByCustomer = new Map<string, Severity[]>();
  for (const r of repos) {
    if (!r.customerId) continue;
    const arr = sevByCustomer.get(r.customerId) ?? [];
    arr.push(r.aggregateSeverity);
    sevByCustomer.set(r.customerId, arr);
  }
  const customers: Customer[] = customersRows.map((c) => ({
    id: c.id,
    slug: c.slug,
    label: c.label,
    aggregateSeverity: aggregateSeverities(sevByCustomer.get(c.id) ?? []),
  }));

  return { customers, repos, files };
}

/**
 * Real DAL: lookup workspace by slug, gate against membership, return shaped
 * GalaxieData. Caller is responsible for handling `null` as 404/forbidden.
 * Wrapped in unstable_cache so revalidateTag(galaxieWorkspaceTag(id)) flushes.
 */
export async function getGalaxieDataForWorkspace(
  workspaceSlug: string,
  userId: string,
): Promise<{ workspace: WorkspaceMeta; data: GalaxieData } | null> {
  if (!isDbEnabled()) return null;
  const db = getDb();

  const wsRows = await db
    .select()
    .from(schema.workspace)
    .where(eq(schema.workspace.slug, workspaceSlug))
    .limit(1);
  const ws = wsRows[0];
  if (!ws) return null;

  const member = await userIsMember(ws.id, userId);
  if (!member) return null;

  const role = await resolveRole(ws.id, userId, ws.ownerId);

  const cachedLoad = unstable_cache(
    async () => loadWorkspaceData(ws.id),
    ['galaxie-data', ws.id],
    { tags: [galaxieWorkspaceTag(ws.id)] },
  );
  const data = await cachedLoad();

  return {
    workspace: { id: ws.id, slug: ws.slug, name: ws.name, role },
    data,
  };
}

async function resolveRole(
  workspaceId: string,
  userId: string,
  ownerId: string | null,
): Promise<'owner' | 'admin' | 'member'> {
  const db = getDb();
  const rows = await db
    .select({ role: schema.membership.role })
    .from(schema.membership)
    .where(
      and(
        eq(schema.membership.workspaceId, workspaceId),
        eq(schema.membership.userId, userId),
        eq(schema.membership.status, 'active'),
      ),
    )
    .limit(1);
  const r = rows[0]?.role;
  if (r === 'owner' || r === 'admin' || r === 'member') return r;
  return ownerId === userId ? 'owner' : 'member';
}

/** List workspaces a user can access (member or legacy owner). */
export async function listUserWorkspaces(
  userId: string,
): Promise<WorkspaceMeta[]> {
  if (!isDbEnabled()) return [];
  const db = getDb();

  const memberRows = await db
    .select({
      id: schema.workspace.id,
      slug: schema.workspace.slug,
      name: schema.workspace.name,
      role: schema.membership.role,
      ownerId: schema.workspace.ownerId,
    })
    .from(schema.workspace)
    .leftJoin(
      schema.membership,
      and(
        eq(schema.membership.workspaceId, schema.workspace.id),
        eq(schema.membership.userId, userId),
        eq(schema.membership.status, 'active'),
      ),
    )
    .where(
      or(
        eq(schema.workspace.ownerId, userId),
        eq(schema.membership.userId, userId),
      ),
    );

  const seen = new Set<string>();
  const out: WorkspaceMeta[] = [];
  for (const row of memberRows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    const role =
      row.role === 'owner' || row.role === 'admin' || row.role === 'member'
        ? row.role
        : row.ownerId === userId
          ? 'owner'
          : 'member';
    out.push({ id: row.id, slug: row.slug, name: row.name, role });
  }
  return out;
}
