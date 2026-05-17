"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@vk/db";
import type { SeverityBand } from "@vk/core";
import { getSessionUser } from "./session";
import { ensureDefaultWorkspace } from "./workspaces";

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

export interface AddCustomerInput {
  label: string;
  rootPath: string;
  /** Optional GitHub full name (owner/repo) — set when added via App install. */
  githubFullName?: string;
}

export interface AddCustomerError {
  ok: false;
  error: string;
  /** Set when the failure is a billing-quota gate vs. a normal validation error. */
  upgradeRequired?: boolean;
  used?: number;
  quota?: number;
}

export async function addCustomer(
  input: AddCustomerInput,
): Promise<{ ok: true; id: string } | AddCustomerError> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (!input.label.trim() || !input.rootPath.trim()) {
    return { ok: false, error: "Label and rootPath are required." };
  }

  const { canAddRepo } = await import("@vk/billing");
  const quota = await canAddRepo(user.id);
  if (!quota.allowed) {
    return {
      ok: false,
      error:
        (quota.reason ?? "Repo quota exceeded.") +
        " Upgrade your plan to add another.",
      upgradeRequired: true,
      used: quota.used,
      quota: quota.quota,
    };
  }

  const db = getDb();
  const workspaceId = await ensureDefaultWorkspace(user.id);

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

  revalidatePath("/customers");
  return { ok: true, id: row.id };
}

export async function listCustomers(userId: string): Promise<CustomerSummary[]> {
  const db = getDb();
  // Subquery: latest scan per repo (by rootPath match within the workspace).
  // Sprint-0.7 simplification: many scans don't yet link to a repo row, so we
  // match by `scan.rootPath = repo.rootPath`. Sprint-0.8 backfill will set
  // scan.repoId during enqueue.
  const rows = await db
    .select({
      id: schema.repo.id,
      label: schema.repo.label,
      rootPath: schema.repo.rootPath,
      writeAccessGranted: schema.repo.writeAccessGranted,
      githubFullName: schema.repo.githubFullName,
      createdAt: schema.repo.createdAt,
      latestScanId: sql<string | null>`(
        SELECT s.id FROM scan s
        WHERE s.workspace_id = ${schema.workspace.id}
          AND s.root_path = ${schema.repo.rootPath}
        ORDER BY s.created_at DESC
        LIMIT 1
      )`,
      latestScanSeverity: sql<string | null>`(
        SELECT s.overall_severity FROM scan s
        WHERE s.workspace_id = ${schema.workspace.id}
          AND s.root_path = ${schema.repo.rootPath}
        ORDER BY s.created_at DESC
        LIMIT 1
      )`,
      latestScanAt: sql<Date | null>`(
        SELECT s.created_at FROM scan s
        WHERE s.workspace_id = ${schema.workspace.id}
          AND s.root_path = ${schema.repo.rootPath}
        ORDER BY s.created_at DESC
        LIMIT 1
      )`,
      scanCount: sql<number>`(
        SELECT COUNT(*) FROM scan s
        WHERE s.workspace_id = ${schema.workspace.id}
          AND s.root_path = ${schema.repo.rootPath}
      )::int`,
    })
    .from(schema.repo)
    .innerJoin(
      schema.workspace,
      eq(schema.repo.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, userId))
    .orderBy(desc(schema.repo.createdAt));

  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    rootPath: r.rootPath,
    writeAccessGranted: r.writeAccessGranted,
    githubFullName: r.githubFullName,
    createdAt: r.createdAt,
    latestScanId: r.latestScanId,
    latestScanSeverity: r.latestScanSeverity as SeverityBand | null,
    latestScanAt: r.latestScanAt,
    scanCount: Number(r.scanCount ?? 0),
  }));
}

export async function getCustomer(
  userId: string,
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
  drifts: Array<{
    id: string;
    rootPathA: string;
    rootPathB: string;
    overallSeverity: string;
    createdAt: Date;
  }>;
} | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.repo)
    .innerJoin(
      schema.workspace,
      eq(schema.repo.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.repo.id, repoId))
    .limit(1);
  const row = rows[0];
  if (!row || row.workspace.ownerId !== userId) return null;

  const scans = await db
    .select({
      id: schema.scan.id,
      status: schema.scan.status,
      overallSeverity: schema.scan.overallSeverity,
      findingsCount: schema.scan.findingsCount,
      createdAt: schema.scan.createdAt,
    })
    .from(schema.scan)
    .where(eq(schema.scan.rootPath, row.repo.rootPath))
    .orderBy(desc(schema.scan.createdAt))
    .limit(20);

  const drifts = await db
    .select({
      id: schema.driftRun.id,
      rootPathA: schema.driftRun.rootPathA,
      rootPathB: schema.driftRun.rootPathB,
      overallSeverity: schema.driftRun.overallSeverity,
      createdAt: schema.driftRun.createdAt,
    })
    .from(schema.driftRun)
    .where(eq(schema.driftRun.workspaceId, row.workspace.id))
    .orderBy(desc(schema.driftRun.createdAt))
    .limit(20);

  return { repo: row.repo, scans, drifts };
}
