"use server";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { userIsMember } from "./authz";

export interface ScanStatusSnapshot {
  id: string;
  status: "queued" | "running" | "complete" | "failed";
  failureReason: string | null;
  findingsCount: number;
  overallSeverity: string;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Workspace-scoped status fetch. Client polls this every 2s while the scan is
 * still in flight. Returns null when the caller has no business seeing the
 * scan (no session, wrong workspace, or it doesn't exist).
 */
export async function getScanStatus(
  scanId: string,
): Promise<ScanStatusSnapshot | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const db = getDb();
  // K6: gate via workspace-membership, not the legacy ownerId. The owner-only
  // filter locked non-owner members out of their own scans; userIsMember
  // accepts active members/admins and the legacy owner.
  const rows = await db
    .select({
      id: schema.scan.id,
      status: schema.scan.status,
      failureReason: schema.scan.failureReason,
      findingsCount: schema.scan.findingsCount,
      overallSeverity: schema.scan.overallSeverity,
      startedAt: schema.scan.startedAt,
      completedAt: schema.scan.completedAt,
      workspaceId: schema.scan.workspaceId,
    })
    .from(schema.scan)
    .where(eq(schema.scan.id, scanId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (!(await userIsMember(row.workspaceId, user.id))) return null;

  return {
    id: row.id,
    status: row.status as ScanStatusSnapshot["status"],
    failureReason: row.failureReason,
    findingsCount: row.findingsCount,
    overallSeverity: row.overallSeverity,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}
