import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";

export type Role = "owner" | "admin" | "member";

/**
 * Single source of truth for workspace authorization (Bundle A consolidation,
 * 2026-06-08). Replaces three duplicated `userIsMember` copies that lived in
 * dal/galaxie.ts, apply-dal.ts and solution-dal.ts, plus the getUserRole /
 * requireRole pair that lived in membership.ts.
 *
 * Convention: every helper takes (workspaceId, userId, ...) — matching 100% of
 * the existing call sites, so the dedup is a mechanical move with no arg-swap.
 *
 * An active membership row is the authoritative gate (Sprint 1.2 ADR). Legacy
 * `workspace.ownerId` is accepted as a fallback for older workspaces whose
 * membership row may never have been back-filled — but ONLY by the access-level
 * helpers (userIsMember / requireWorkspaceAccess / requireMembership). The
 * role-level `getUserRole` stays membership-only (byte-identical to its former
 * membership.ts behaviour) so existing role-gated callers don't shift.
 */

/** Active membership row OR legacy owner pointer. Non-throwing. */
export async function userIsMember(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();
  const memberRows = await db
    .select({ id: schema.membership.id })
    .from(schema.membership)
    .where(
      and(
        eq(schema.membership.workspaceId, workspaceId),
        eq(schema.membership.userId, userId),
        eq(schema.membership.status, "active"),
      ),
    )
    .limit(1);
  if (memberRows.length > 0) return true;
  const ownerRows = await db
    .select({ id: schema.workspace.id })
    .from(schema.workspace)
    .where(
      and(
        eq(schema.workspace.id, workspaceId),
        eq(schema.workspace.ownerId, userId),
      ),
    )
    .limit(1);
  return ownerRows.length > 0;
}

/**
 * Returns the current user's active-membership role in the workspace, or null.
 * Does NOT count a legacy owner without a membership row — use userIsMember /
 * requireWorkspaceAccess for plain access checks.
 */
export async function getUserRole(
  workspaceId: string,
  userId: string,
): Promise<Role | null> {
  const db = getDb();
  const rows = await db
    .select({ role: schema.membership.role })
    .from(schema.membership)
    .where(
      and(
        eq(schema.membership.workspaceId, workspaceId),
        eq(schema.membership.userId, userId),
        eq(schema.membership.status, "active"),
      ),
    )
    .limit(1);
  const r = rows[0]?.role;
  if (!r) return null;
  return r === "owner" || r === "admin" || r === "member" ? r : null;
}

/**
 * Throws `Forbidden` when the user has no access to the workspace. The
 * mandatory first statement of every cross-tenant read/write path (Bundle A
 * IDOR-close). Accepts active members and legacy owners.
 */
export async function requireWorkspaceAccess(
  workspaceId: string,
  userId: string,
): Promise<void> {
  if (!(await userIsMember(workspaceId, userId))) {
    throw new Error(
      `Forbidden: user ${userId} has no access to workspace ${workspaceId}`,
    );
  }
}

/**
 * Resolves the effective role (membership role, or 'owner' for a legacy owner
 * without a membership row), throwing `Forbidden` if the user has no access.
 * Pass `allow` to additionally gate on a role allow-list.
 */
export async function requireMembership(
  workspaceId: string,
  userId: string,
  allow?: Role[],
): Promise<Role> {
  let role = await getUserRole(workspaceId, userId);
  if (!role && (await userIsMember(workspaceId, userId))) {
    role = "owner"; // legacy owner without a back-filled membership row
  }
  if (!role) {
    throw new Error(
      `Forbidden: user ${userId} has no access to workspace ${workspaceId}`,
    );
  }
  if (allow && !allow.includes(role)) {
    throw new Error(`Forbidden: role=${role} not in [${allow.join(", ")}]`);
  }
  return role;
}

/** Throws when the user's membership role is not in the allow-list. */
export async function requireRole(
  workspaceId: string,
  userId: string,
  allow: Role[],
): Promise<Role> {
  const role = await getUserRole(workspaceId, userId);
  if (!role || !allow.includes(role)) {
    throw new Error(
      `Forbidden: role=${role ?? "none"} not in [${allow.join(", ")}]`,
    );
  }
  return role;
}
