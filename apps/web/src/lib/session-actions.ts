"use server";

import { headers } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { getAuth } from "@vk/auth";
import { getSessionUser } from "./session";

export interface ActiveSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  /** True for the session backing the current request. */
  current: boolean;
}

/**
 * Active sessions for the signed-in user. Reads the session table directly
 * (reads have no cookie-cache concern) and marks the current device by
 * comparing each row's token to the live session token — tokens are never
 * returned to the client.
 */
export async function listActiveSessions(): Promise<ActiveSession[]> {
  const user = await getSessionUser();
  if (!user) return [];

  let currentToken: string | null = null;
  try {
    const auth = getAuth();
    const live = await auth.api.getSession({ headers: await headers() });
    currentToken = live?.session?.token ?? null;
  } catch {
    /* no live session token — nothing marked current */
  }

  const db = getDb();
  const rows = await db
    .select({
      id: schema.session.id,
      token: schema.session.token,
      ipAddress: schema.session.ipAddress,
      userAgent: schema.session.userAgent,
      createdAt: schema.session.createdAt,
      expiresAt: schema.session.expiresAt,
    })
    .from(schema.session)
    .where(eq(schema.session.userId, user.id))
    .orderBy(desc(schema.session.createdAt));

  return rows.map((r) => ({
    id: r.id,
    ipAddress: r.ipAddress,
    userAgent: r.userAgent,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    current: currentToken !== null && r.token === currentToken,
  }));
}

/**
 * Revoke one session. IDOR-safe: the session is looked up by id AND userId, so
 * a caller can only revoke their own. Routed through Better-Auth's revoke (not
 * a raw DB delete) so the 300 s cookie-cache is invalidated too — a raw delete
 * would leave a revoked device working for up to the cache window.
 */
export async function revokeSession(
  sessionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const db = getDb();
  const rows = await db
    .select({ token: schema.session.token })
    .from(schema.session)
    .where(
      and(
        eq(schema.session.id, sessionId),
        eq(schema.session.userId, user.id),
      ),
    )
    .limit(1);
  const token = rows[0]?.token;
  if (!token) return { ok: false, error: "Session not found." };

  try {
    const auth = getAuth();
    await auth.api.revokeSession({ headers: await headers(), body: { token } });
  } catch {
    return { ok: false, error: "Revoke failed." };
  }
  return { ok: true };
}
