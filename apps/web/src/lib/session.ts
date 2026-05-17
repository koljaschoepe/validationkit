import { headers } from "next/headers";
import { getAuth, isAuthEnabled } from "@vk/auth";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Returns the signed-in user, or `null` when:
 *   - auth isn't configured (Hardcore-Local-Only stateless mode), or
 *   - the visitor has no session.
 *
 * Never throws — the home page should keep working even with no DATABASE_URL.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isAuthEnabled()) return null;
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
    };
  } catch {
    return null;
  }
}
