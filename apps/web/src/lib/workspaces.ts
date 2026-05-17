import { eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";

/**
 * Ensures the user has at least one workspace and returns its id.
 * Workspaces are created lazily on first save.
 */
export async function ensureDefaultWorkspace(userId: string): Promise<string> {
  const db = getDb();
  const existing = await db
    .select({ id: schema.workspace.id })
    .from(schema.workspace)
    .where(eq(schema.workspace.ownerId, userId))
    .limit(1);
  const found = existing[0];
  if (found) return found.id;

  const slug = `ws-${userId.slice(0, 8)}-${Date.now().toString(36)}`;
  const inserted = await db
    .insert(schema.workspace)
    .values({ ownerId: userId, name: "My workspace", slug })
    .returning({ id: schema.workspace.id });
  const row = inserted[0];
  if (!row) throw new Error("Failed to create workspace");
  return row.id;
}
