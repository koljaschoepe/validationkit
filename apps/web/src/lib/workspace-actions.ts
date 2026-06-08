"use server";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { requireRole } from "./authz";
import { getStripe, isStripeEnabled } from "./stripe";

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
  return { ok: true };
}
