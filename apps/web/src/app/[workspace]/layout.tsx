import { notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { listUserWorkspaces } from '@/lib/dal/galaxie';

// Membership-Gate. Authoritative source is the `membership` table (Sprint 1.2);
// `workspace.ownerId` is honored as legacy fallback. The DAL collapses both into
// `listUserWorkspaces(userId)` so this layout stays a thin guard.
//
// Three rejection paths:
//   1. Auth disabled (anonymous-mode dev) → notFound (no DB-backed surface).
//   2. Not signed in → redirect to /login?next=/<slug>.
//   3. Signed in, slug exists but user is not a member → notFound (404, NOT 403:
//      we don't leak the existence of foreign workspaces to slug-scanners).
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;

  if (!isAuthEnabled()) notFound();

  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/${workspace}`)}`);
  }

  const accessible = await listUserWorkspaces(user.id);
  if (!accessible.some((w) => w.slug === workspace)) notFound();

  return <>{children}</>;
}
