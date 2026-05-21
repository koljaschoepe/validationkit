import { eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";

export interface DefaultWorkspace {
  id: string;
  slug: string;
}

/**
 * Ensures the user has at least one workspace and returns its id + slug.
 * Workspaces are created lazily on first save. The slug is the URL-segment
 * for the workspace-scoped routes under `/[workspace]/*`.
 */
export async function ensureDefaultWorkspace(
  userId: string,
): Promise<DefaultWorkspace> {
  const db = getDb();
  const existing = await db
    .select({ id: schema.workspace.id, slug: schema.workspace.slug })
    .from(schema.workspace)
    .where(eq(schema.workspace.ownerId, userId))
    .limit(1);
  const found = existing[0];
  if (found) return { id: found.id, slug: found.slug };

  const slug = `ws-${userId.slice(0, 8)}-${Date.now().toString(36)}`;
  const inserted = await db
    .insert(schema.workspace)
    .values({ ownerId: userId, name: "My workspace", slug })
    .returning({ id: schema.workspace.id, slug: schema.workspace.slug });
  const row = inserted[0];
  if (!row) throw new Error("Failed to create workspace");
  return { id: row.id, slug: row.slug };
}
