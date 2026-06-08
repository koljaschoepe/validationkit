"use server";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { requireRole } from "./authz";

/**
 * Delete a workspace (owner-only, typed-slug confirm). All 13 workspace-scoped
 * tables are ON DELETE CASCADE, so removing the workspace row tears down its
 * customers, repos, scans, findings, solutions, apply-actions, memberships,
 * install-requests, etc. in one statement.
 */
export async function deleteWorkspace(
  workspaceId: string,
  confirmSlug: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in first." };

  try {
    await requireRole(workspaceId, user.id, ["owner"]);
  } catch {
    return { ok: false, error: "Only the workspace owner can delete it." };
  }

  const db = getDb();
  const rows = await db
    .select({ slug: schema.workspace.slug })
    .from(schema.workspace)
    .where(eq(schema.workspace.id, workspaceId))
    .limit(1);
  const ws = rows[0];
  if (!ws) return { ok: false, error: "Workspace not found." };

  if (confirmSlug.trim() !== ws.slug) {
    return { ok: false, error: "Type the workspace slug exactly to confirm." };
  }

  await db.delete(schema.workspace).where(eq(schema.workspace.id, workspaceId));
  return { ok: true };
}
