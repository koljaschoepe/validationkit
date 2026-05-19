import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { isAuthEnabled } from '@vk/auth';
import GalaxieRoot from '@/components/galaxie/GalaxieRoot';
import { getSessionUser } from '@/lib/session';
import {
  getGalaxieDataForWorkspace,
  listUserWorkspaces,
} from '@/lib/dal/galaxie';

export default async function WorkspaceGalaxiePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;

  if (!isAuthEnabled()) notFound();

  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/${workspace}`)}`);
  }

  const [result, workspaces] = await Promise.all([
    getGalaxieDataForWorkspace(workspace, user.id),
    listUserWorkspaces(user.id),
  ]);
  if (!result) notFound();

  return (
    <div className="h-screen w-screen">
      <Suspense fallback={null}>
        <GalaxieRoot
          initialData={result.data}
          initialWorkspaceSlug={result.workspace.slug}
          workspaces={workspaces.map((w) => ({
            slug: w.slug,
            label: w.name,
            plan: w.role === 'owner' ? 'agency' : w.role === 'admin' ? 'team' : 'solo',
          }))}
        />
      </Suspense>
    </div>
  );
}
