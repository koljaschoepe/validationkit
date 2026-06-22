import "server-only";

import { eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { hashToken } from "./api-key";

export interface ApiKeyAuth {
  workspaceId: string;
  apiKeyId: string;
}

/**
 * Authenticate a programmatic request by its `Authorization: Bearer vk_…`
 * header. Returns the owning workspace on success (and best-effort bumps
 * `last_used_at`), or null on any failure — the caller responds 401. Lookup is
 * by SHA-256 hash, so the plaintext token never has to be compared in the DB.
 */
export async function authenticateApiKey(
  req: Request,
): Promise<ApiKeyAuth | null> {
  if (!isDbEnabled()) return null;
  const header = req.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(vk_[A-Za-z0-9_-]+)$/)?.[1];
  if (!token) return null;
  const tokenHash = hashToken(token);

  const db = getDb();
  const rows = await db
    .select({
      id: schema.apiKey.id,
      workspaceId: schema.apiKey.workspaceId,
    })
    .from(schema.apiKey)
    .where(eq(schema.apiKey.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  try {
    await db
      .update(schema.apiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.apiKey.id, row.id));
  } catch {
    // last-used is best-effort — never fail the request on it.
  }

  return { workspaceId: row.workspaceId, apiKeyId: row.id };
}
