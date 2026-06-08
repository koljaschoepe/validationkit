// K14 (Launch-Verify): server-only module, NOT a "use server" action surface.
// getRepo/listRepos/addRepo were previously exported as client-reachable RPC
// endpoints taking a client-supplied workspaceId — a cross-tenant IDOR of the
// same class Bundle A closed elsewhere (the compound `row.workspaceId !==
// workspaceId` check only proves repo-membership of the workspace, not that the
// CALLER belongs to it). server-only removes the RPC surface entirely; the sole
// caller (repos/[repoId]/page.tsx) resolves the workspace via membership
// (resolveWorkspaceFromSlug) before calling in.
import "server-only";

import { desc, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { getDb, schema } from "@vk/db";
import type { SeverityBand } from "@vk/core";
import { galaxieWorkspaceTag } from "./cache-tags";

export interface CustomerSummary {
  id: string;
  label: string;
  rootPath: string;
  writeAccessGranted: boolean;
  githubFullName: string | null;
  createdAt: Date;
  latestScanId: string | null;
  latestScanSeverity: SeverityBand | null;
  latestScanAt: Date | null;
  scanCount: number;
}

export interface AddRepoInput {
  label: string;
  rootPath: string;
  /** Optional GitHub full name (owner/repo) — set when added via App install. */
  githubFullName?: string;
}

export interface AddRepoError {
  ok: false;
  error: string;
  /** Set when the failure is a billing-quota gate vs. a normal validation error. */
  upgradeRequired?: boolean;
  used?: number;
  quota?: number;
}

/**
 * Add a workspace-level repo (not bound to a specific customer-record).
 * Caller MUST have validated workspace-membership via resolveWorkspaceFromSlug.
 */
export async function addRepo(
  workspaceId: string,
  workspaceSlug: string,
  userId: string,
  input: AddRepoInput,
): Promise<{ ok: true; id: string } | AddRepoError> {
  if (!input.label.trim() || !input.rootPath.trim()) {
    return { ok: false, error: "Label and rootPath are required." };
  }

  // Sub-Plan-A: customer-workspaces-included caps customer rows; repos
  // under each customer are unconstrained. userId retained for future
  // owner-level limits but currently unused.
  const { canAddCustomer } = await import("@vk/billing");
  const quota = await canAddCustomer(workspaceId);
  if (!quota.allowed) {
    return {
      ok: false,
      error:
        (quota.reason ?? "Customer-workspace quota exceeded.") +
        " Upgrade your plan to add another.",
      upgradeRequired: true,
      used: quota.used,
      quota: quota.quota,
    };
  }
  void userId;

  const db = getDb();

  const inserted = await db
    .insert(schema.repo)
    .values({
      workspaceId,
      label: input.label.trim(),
      rootPath: input.rootPath.trim(),
      ...(input.githubFullName
        ? { githubFullName: input.githubFullName }
        : {}),
    })
    .returning({ id: schema.repo.id });
  const row = inserted[0];
  if (!row) return { ok: false, error: "Failed to add customer." };

  revalidatePath(`/${workspaceSlug}/customers`);
  updateTag(galaxieWorkspaceTag(workspaceId));
  return { ok: true, id: row.id };
}

/**
 * List the repos in a workspace (Repo-Layer view — "Customers" in legacy
 * terminology before Sprint G3 split it from the Customer-Layer).
 * Caller MUST have validated workspace-membership.
 */
export async function listRepos(
  workspaceId: string,
): Promise<CustomerSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.repo.id,
      label: schema.repo.label,
      rootPath: schema.repo.rootPath,
      writeAccessGranted: schema.repo.writeAccessGranted,
      githubFullName: schema.repo.githubFullName,
      createdAt: schema.repo.createdAt,
    })
    .from(schema.repo)
    .where(eq(schema.repo.workspaceId, workspaceId))
    .orderBy(desc(schema.repo.createdAt));

  if (rows.length === 0) return [];

  // Sprint-0.7 simplification: many scans don't yet link to a repo row, so
  // we still match by rootPath. Sprint-0.8 backfill will set scan.repoId.
  const scans = await db
    .select({
      id: schema.scan.id,
      rootPath: schema.scan.rootPath,
      overallSeverity: schema.scan.overallSeverity,
      createdAt: schema.scan.createdAt,
    })
    .from(schema.scan)
    .where(eq(schema.scan.workspaceId, workspaceId))
    .orderBy(desc(schema.scan.createdAt));

  const latestByRoot = new Map<string, (typeof scans)[number]>();
  const countByRoot = new Map<string, number>();
  for (const s of scans) {
    if (!latestByRoot.has(s.rootPath)) latestByRoot.set(s.rootPath, s);
    countByRoot.set(s.rootPath, (countByRoot.get(s.rootPath) ?? 0) + 1);
  }

  return rows.map((r) => {
    const latest = latestByRoot.get(r.rootPath);
    return {
      id: r.id,
      label: r.label,
      rootPath: r.rootPath,
      writeAccessGranted: r.writeAccessGranted,
      githubFullName: r.githubFullName,
      createdAt: r.createdAt,
      latestScanId: latest?.id ?? null,
      latestScanSeverity: (latest?.overallSeverity as SeverityBand | undefined) ?? null,
      latestScanAt: latest?.createdAt ?? null,
      scanCount: countByRoot.get(r.rootPath) ?? 0,
    };
  });
}

/**
 * Fetch a single repo with its scan history. Workspace-gating via the
 * compound match — caller MUST have validated workspace-membership.
 */
export async function getRepo(
  workspaceId: string,
  repoId: string,
): Promise<{
  repo: typeof schema.repo.$inferSelect;
  scans: Array<{
    id: string;
    status: string;
    overallSeverity: string;
    findingsCount: number;
    createdAt: Date;
  }>;
} | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.repo)
    .where(eq(schema.repo.id, repoId))
    .limit(1);
  const row = rows[0];
  if (!row || row.workspaceId !== workspaceId) return null;

  // K2: scope scans by the repo's FK, not by rootPath. Two repos in different
  // workspaces can share a rootPath, so the legacy rootPath match leaked
  // cross-tenant scan history. scan.repoId is the authoritative link.
  const scans = await db
    .select({
      id: schema.scan.id,
      status: schema.scan.status,
      overallSeverity: schema.scan.overallSeverity,
      findingsCount: schema.scan.findingsCount,
      createdAt: schema.scan.createdAt,
    })
    .from(schema.scan)
    .where(eq(schema.scan.repoId, repoId))
    .orderBy(desc(schema.scan.createdAt))
    .limit(20);

  return { repo: row, scans };
}
