"use server";

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { requireRole } from "./authz";
import { getStripe, isStripeEnabled } from "./stripe";

/**
 * Rename a workspace (owner/admin). Label only — the slug is immutable in the
 * MVP (changing it would break existing /<slug> URLs without a slug-alias
 * table; that lands later).
 */
export async function renameWorkspace(
  workspaceId: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Bitte zuerst anmelden." };
  try {
    await requireRole(workspaceId, user.id, ["owner", "admin"]);
  } catch {
    return {
      ok: false,
      error: "Nur Owner/Admins können den Workspace umbenennen.",
    };
  }
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name darf nicht leer sein." };
  if (trimmed.length > 200) {
    return { ok: false, error: "Name ist zu lang (max. 200 Zeichen)." };
  }
  await getDb()
    .update(schema.workspace)
    .set({ name: trimmed })
    .where(eq(schema.workspace.id, workspaceId));
  return { ok: true };
}

/**
 * Transfer workspace ownership to another active member (owner-only). Promotes
 * the target to `owner`, demotes the caller to `admin` (so they keep access),
 * and repoints `workspace.owner_id`. Unblocks account-delete for a sole owner.
 */
export async function transferOwnership(
  workspaceId: string,
  newOwnerUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Bitte zuerst anmelden." };
  try {
    await requireRole(workspaceId, user.id, ["owner"]);
  } catch {
    return {
      ok: false,
      error: "Nur der Owner kann die Inhaberschaft übergeben.",
    };
  }
  if (newOwnerUserId === user.id) {
    return { ok: false, error: "Du bist bereits Owner." };
  }
  const db = getDb();
  const target = await db
    .select({ id: schema.membership.id })
    .from(schema.membership)
    .where(
      and(
        eq(schema.membership.workspaceId, workspaceId),
        eq(schema.membership.userId, newOwnerUserId),
        eq(schema.membership.status, "active"),
      ),
    )
    .limit(1);
  if (target.length === 0) {
    return { ok: false, error: "Ziel ist kein aktives Mitglied." };
  }

  await db
    .update(schema.membership)
    .set({ role: "owner" })
    .where(
      and(
        eq(schema.membership.workspaceId, workspaceId),
        eq(schema.membership.userId, newOwnerUserId),
      ),
    );
  await db
    .update(schema.membership)
    .set({ role: "admin" })
    .where(
      and(
        eq(schema.membership.workspaceId, workspaceId),
        eq(schema.membership.userId, user.id),
      ),
    );
  await db
    .update(schema.workspace)
    .set({ ownerId: newOwnerUserId })
    .where(eq(schema.workspace.id, workspaceId));
  return { ok: true };
}

/**
 * Cancel the workspace's live Stripe subscription before its local row is torn
 * down by the cascade — otherwise Stripe keeps billing a workspace that no
 * longer exists. Best-effort: a Stripe error must never block the delete, so we
 * log (for stripe-reconcile / Sentry to pick up) and continue.
 *
 * Only workspace-delete needs this. account-delete is gated on NOT being a
 * sole owner, so every workspace the user owns survives under another owner with
 * its subscription intact — nothing to cancel there.
 */
async function cancelWorkspaceStripeSubscription(
  workspaceId: string,
): Promise<void> {
  if (!isStripeEnabled()) return;
  const rows = await getDb()
    .select({
      stripeSubscriptionId: schema.subscription.stripeSubscriptionId,
    })
    .from(schema.subscription)
    .where(eq(schema.subscription.workspaceId, workspaceId))
    .limit(1);
  const subId = rows[0]?.stripeSubscriptionId;
  if (!subId) return;
  try {
    await getStripe().subscriptions.cancel(subId);
  } catch (err) {
    console.error(
      `[workspace-delete] Stripe subscription cancel failed for ${subId}`,
      err,
    );
  }
}

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

  // Cancel the live Stripe subscription before the cascade removes our local
  // subscription row (else Stripe keeps charging a deleted workspace).
  await cancelWorkspaceStripeSubscription(workspaceId);

  await db.delete(schema.workspace).where(eq(schema.workspace.id, workspaceId));

  // J3: if the default-workspace cookie pointed at the workspace we just
  // deleted, clear it — otherwise the proxy keeps rewriting /dashboard to a now
  // 404 slug and the user can't get back to a valid surface.
  const cookieStore = await cookies();
  if (cookieStore.get("vk_default_workspace_slug")?.value === ws.slug) {
    cookieStore.delete("vk_default_workspace_slug");
  }

  return { ok: true };
}
