import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";

export interface ResolvedWorkspace {
  id: string;
  slug: string;
  name: string;
  ownerId: string;
}

/**
 * Resolve a workspace slug to its row, gated by user membership.
 * Throws notFound() on missing workspace, missing membership, or disabled DB.
 * `cache()` memoizes per-request so multiple DAL calls share one DB roundtrip.
 *
 * Mirrors the membership-gate in lib/dal/galaxie.ts userIsMember: active
 * membership-row OR legacy workspace.ownerId match are both accepted.
 */
export const resolveWorkspaceFromSlug = cache(
  async (slug: string, userId: string): Promise<ResolvedWorkspace> => {
    if (!isDbEnabled()) notFound();
    const db = getDb();

    const rows = await db
      .select()
      .from(schema.workspace)
      .where(eq(schema.workspace.slug, slug))
      .limit(1);
    const ws = rows[0];
    if (!ws) notFound();

    const memberRows = await db
      .select({ role: schema.membership.role })
      .from(schema.membership)
      .where(
        and(
          eq(schema.membership.workspaceId, ws.id),
          eq(schema.membership.userId, userId),
          eq(schema.membership.status, "active"),
        ),
      )
      .limit(1);

    const isLegacyOwner = ws.ownerId === userId;
    if (memberRows.length === 0 && !isLegacyOwner) notFound();

    return { id: ws.id, slug: ws.slug, name: ws.name, ownerId: ws.ownerId };
  },
);
