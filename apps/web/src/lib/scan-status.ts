"use server";

import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { getSessionUser } from "./session";

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
  const rows = await db
    .select({
      id: schema.scan.id,
      status: schema.scan.status,
      failureReason: schema.scan.failureReason,
      findingsCount: schema.scan.findingsCount,
      overallSeverity: schema.scan.overallSeverity,
      startedAt: schema.scan.startedAt,
      completedAt: schema.scan.completedAt,
      ownerId: schema.workspace.ownerId,
    })
    .from(schema.scan)
    .innerJoin(
      schema.workspace,
      eq(schema.scan.workspaceId, schema.workspace.id),
    )
    .where(and(eq(schema.scan.id, scanId), eq(schema.workspace.ownerId, user.id)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

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
