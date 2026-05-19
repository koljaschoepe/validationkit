import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { listWorkspaces } from '@/lib/dal/galaxie';

// Sprint G1 skeleton: only validates that the slug exists in MOCK_WORKSPACES.
// Sprint G2 will add Better-Auth Organization membership check + slug-hijacking
// guard, and replace listWorkspaces() with a real DAL.

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const all = await listWorkspaces();
  if (!all.some((w) => w.slug === workspace)) notFound();
  return <>{children}</>;
}
