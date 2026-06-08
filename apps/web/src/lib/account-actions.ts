"use server";

import { headers } from "next/headers";
import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { getAuth } from "@vk/auth";
import { getSessionUser } from "./session";
import { scrubUserPii } from "./pii-scrub";

export interface SoleOwnerWorkspace {
  id: string;
  name: string;
  slug: string;
}

/**
 * Workspaces the user is the SOLE active owner of (owner-role membership with
 * no other active owner-role membership). Account-delete is blocked while any
 * exist — the user must transfer ownership or delete the workspace first, so we
 * never orphan a workspace or destroy other members' data without their say.
 */
export async function listSoleOwnedWorkspaces(
  userId: string,
): Promise<SoleOwnerWorkspace[]> {
  const db = getDb();
  const owned = await db
    .select({
      id: schema.workspace.id,
      name: schema.workspace.name,
      slug: schema.workspace.slug,
    })
    .from(schema.membership)
    .innerJoin(
      schema.workspace,
      eq(schema.membership.workspaceId, schema.workspace.id),
    )
    .where(
      and(
        eq(schema.membership.userId, userId),
        eq(schema.membership.role, "owner"),
        eq(schema.membership.status, "active"),
      ),
    );

  const blockers: SoleOwnerWorkspace[] = [];
  for (const ws of owned) {
    const otherOwners = await db
      .select({ id: schema.membership.id })
      .from(schema.membership)
      .where(
        and(
          eq(schema.membership.workspaceId, ws.id),
          eq(schema.membership.role, "owner"),
          eq(schema.membership.status, "active"),
          ne(schema.membership.userId, userId),
        ),
      )
      .limit(1);
    if (otherOwners.length === 0) blockers.push(ws);
  }
  return blockers;
}

/**
 * GDPR Art. 17 hard-delete. Blocks if the user solely owns any workspace.
 * Otherwise: scrub retained-PII (before the FK SET NULL erases the key),
 * delete the user row (cascades session/account/membership; SET NULL the
 * rest), then clear the session cookie.
 *
 * Confirmation email is owned by Bundle G (email infra) — wired there.
 */
export async function deleteAccount(
  confirmEmail: string,
): Promise<{ ok: boolean; error?: string; blockedBy?: SoleOwnerWorkspace[] }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in first." };

  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: "Type your email exactly to confirm." };
  }

  const blockers = await listSoleOwnedWorkspaces(user.id);
  if (blockers.length > 0) {
    return {
      ok: false,
      error: "Transfer or delete the workspaces you solely own first.",
      blockedBy: blockers,
    };
  }

  // 1) Scrub retained-PII while the user FK still points at their rows.
  await scrubUserPii(user.id);

  // 2) Delete the user — cascades session/account/membership, SET NULL the rest.
  const db = getDb();
  await db.delete(schema.user).where(eq(schema.user.id, user.id));

  // 3) Best-effort cookie clear (the user row is already gone).
  try {
    const auth = getAuth();
    await auth.api.signOut({ headers: await headers() });
  } catch {
    /* user already deleted — the redirect handles sign-out */
  }

  return { ok: true };
}
