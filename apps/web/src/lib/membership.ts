"use server";

import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { getUserRole, type Role } from "./authz";

// Role + getUserRole moved to the single-source authz module (Bundle A).
// Re-exported here so existing `@/lib/membership` importers keep resolving.
export type { Role };

export interface MemberRow {
  id: string;
  userId: string | null;
  invitedEmail: string | null;
  role: Role;
  status: string;
  invitedAt: Date;
  acceptedAt: Date | null;
  invitedById: string | null;
  email: string | null;
}

export async function listMembers(workspaceId: string): Promise<MemberRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.membership.id,
      userId: schema.membership.userId,
      invitedEmail: schema.membership.invitedEmail,
      role: schema.membership.role,
      status: schema.membership.status,
      invitedAt: schema.membership.invitedAt,
      acceptedAt: schema.membership.acceptedAt,
      invitedById: schema.membership.invitedById,
      email: schema.user.email,
    })
    .from(schema.membership)
    .leftJoin(schema.user, eq(schema.membership.userId, schema.user.id))
    .where(eq(schema.membership.workspaceId, workspaceId))
    .orderBy(schema.membership.invitedAt);
  return rows.map((r) => ({
    ...r,
    role: r.role as Role,
  }));
}

export interface InviteResult {
  ok: boolean;
  alreadyMember?: boolean;
  error?: string;
}

/**
 * Invite a Customer-Admin by email. We DON'T mint a magic-link here — the
 * invitee uses the standard sign-in flow; on their first sign-in we
 * back-fill the membership.userId via `claimPendingMemberships` (called by
 * the dashboard layout). This keeps the auth surface clean — no separate
 * invite-token table.
 */
export async function inviteAdmin(
  workspaceId: string,
  email: string,
): Promise<InviteResult> {
  const inviter = await getSessionUser();
  if (!inviter) return { ok: false, error: "Sign in first." };

  const role = await getUserRole(workspaceId, inviter.id);
  if (role !== "owner" && role !== "admin") {
    return {
      ok: false,
      error: "Only workspace owner or admin can invite.",
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes("@")) {
    return { ok: false, error: "Enter a valid email." };
  }

  const db = getDb();

  // Look up existing user by email so we can attach userId immediately.
  const existing = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, cleanEmail))
    .limit(1);
  const existingUserId = existing[0]?.id ?? null;

  if (existingUserId) {
    const already = await db
      .select({ id: schema.membership.id })
      .from(schema.membership)
      .where(
        and(
          eq(schema.membership.workspaceId, workspaceId),
          eq(schema.membership.userId, existingUserId),
        ),
      )
      .limit(1);
    if (already[0]) {
      return { ok: true, alreadyMember: true };
    }
    await db.insert(schema.membership).values({
      workspaceId,
      userId: existingUserId,
      invitedEmail: cleanEmail,
      role: "admin",
      status: "active",
      invitedById: inviter.id,
      acceptedAt: new Date(),
    });
  } else {
    // Email-based pending invite. Resolved on the invitee's first sign-in.
    const already = await db
      .select({ id: schema.membership.id })
      .from(schema.membership)
      .where(
        and(
          eq(schema.membership.workspaceId, workspaceId),
          eq(schema.membership.invitedEmail, cleanEmail),
        ),
      )
      .limit(1);
    if (already[0]) {
      return { ok: true, alreadyMember: true };
    }
    await db.insert(schema.membership).values({
      workspaceId,
      invitedEmail: cleanEmail,
      role: "admin",
      status: "pending",
      invitedById: inviter.id,
    });
  }

  // Removed 2026-05-21 (customer-route-rename Phase D.2): this revalidatePath
  // never matched a real route — `workspaceId` is not a customer-id, and the
  // route /customers/<workspaceId>/access doesn't exist. Membership-changes
  // can rely on the next navigation to refresh; if cache-eager-revalidate is
  // needed, target `workspaceTag(workspaceId)` via revalidateTag instead.
  return { ok: true };
}

/**
 * Called on every signed-in dashboard mount. Finds membership rows where
 * invited_email matches the session user's email and back-fills user_id.
 * Idempotent.
 */
export async function claimPendingMemberships(
  userId: string,
  email: string,
): Promise<number> {
  const db = getDb();
  const pending = await db
    .select({ id: schema.membership.id })
    .from(schema.membership)
    .where(
      and(
        eq(schema.membership.invitedEmail, email.toLowerCase()),
        eq(schema.membership.status, "pending"),
      ),
    );
  let claimed = 0;
  for (const row of pending) {
    await db
      .update(schema.membership)
      .set({
        userId,
        status: "active",
        acceptedAt: new Date(),
      })
      .where(eq(schema.membership.id, row.id));
    claimed += 1;
  }
  return claimed;
}

export async function revokeMember(
  workspaceId: string,
  membershipId: string,
): Promise<{ ok: boolean; error?: string }> {
  const actor = await getSessionUser();
  if (!actor) return { ok: false, error: "Sign in first." };
  const role = await getUserRole(workspaceId, actor.id);
  if (role !== "owner") {
    return { ok: false, error: "Only owner can revoke memberships." };
  }
  const db = getDb();
  // Refuse to revoke the owner via this surface.
  const target = await db
    .select({ role: schema.membership.role, userId: schema.membership.userId })
    .from(schema.membership)
    .where(eq(schema.membership.id, membershipId))
    .limit(1);
  if (!target[0]) return { ok: false, error: "Member not found." };
  if (target[0].role === "owner") {
    return { ok: false, error: "Can't revoke the workspace owner." };
  }
  await db
    .update(schema.membership)
    .set({ status: "revoked" })
    .where(eq(schema.membership.id, membershipId));
  // revalidatePath removed 2026-05-21 (customer-route-rename Phase D.2) —
  // the path /customers/<workspaceId>/access never matched a real route.
  return { ok: true };
}
