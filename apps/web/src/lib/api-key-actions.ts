"use server";

import { and, desc, eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { ensureDefaultWorkspace } from "./workspaces";
import { generateApiKey } from "./api-key";

export interface ApiKeyListItem {
  id: string;
  name: string;
  tokenPrefix: string;
  last4: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export type CreateApiKeyResult =
  | { ok: true; token: string; item: ApiKeyListItem }
  | { ok: false; error: string };

// API keys are scoped to the caller's default workspace (the pervasive
// ensureDefaultWorkspace pattern, same as billing-actions). The read API
// authenticates by key → key.workspaceId, so keys are workspace-specific in
// the DB regardless.
export async function listApiKeysAction(): Promise<ApiKeyListItem[]> {
  if (!isDbEnabled()) return [];
  const user = await getSessionUser();
  if (!user) return [];
  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();
  const rows = await db
    .select({
      id: schema.apiKey.id,
      name: schema.apiKey.name,
      tokenPrefix: schema.apiKey.tokenPrefix,
      last4: schema.apiKey.last4,
      createdAt: schema.apiKey.createdAt,
      lastUsedAt: schema.apiKey.lastUsedAt,
    })
    .from(schema.apiKey)
    .where(eq(schema.apiKey.workspaceId, workspaceId))
    .orderBy(desc(schema.apiKey.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    tokenPrefix: r.tokenPrefix,
    last4: r.last4,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
  }));
}

export async function createApiKeyAction(
  name: string,
): Promise<CreateApiKeyResult> {
  if (!isDbEnabled()) {
    return { ok: false, error: "Database is not enabled on this deployment." };
  }
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Bitte zuerst anmelden." };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Gib dem Key einen Namen." };
  if (trimmed.length > 100) {
    return { ok: false, error: "Name ist zu lang (max. 100 Zeichen)." };
  }

  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();
  const gen = generateApiKey();
  const inserted = await db
    .insert(schema.apiKey)
    .values({
      workspaceId,
      name: trimmed,
      tokenHash: gen.tokenHash,
      tokenPrefix: gen.tokenPrefix,
      last4: gen.last4,
      createdByUserId: user.id,
    })
    .returning({
      id: schema.apiKey.id,
      createdAt: schema.apiKey.createdAt,
    });
  const row = inserted[0];
  if (!row) return { ok: false, error: "Key konnte nicht erstellt werden." };

  return {
    ok: true,
    token: gen.token,
    item: {
      id: row.id,
      name: trimmed,
      tokenPrefix: gen.tokenPrefix,
      last4: gen.last4,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: null,
    },
  };
}

export async function revokeApiKeyAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database not enabled." };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Bitte zuerst anmelden." };
  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();
  // IDOR guard: the workspace_id filter means a caller can only delete a key
  // that belongs to their own workspace, even with a guessed id.
  await db
    .delete(schema.apiKey)
    .where(
      and(eq(schema.apiKey.id, id), eq(schema.apiKey.workspaceId, workspaceId)),
    );
  return { ok: true };
}
