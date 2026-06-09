import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { isAuthEnabled } from '@vk/auth';
import GalaxieRoot from '@/components/galaxie/GalaxieRoot';
import { GalaxieSkeleton } from '@/components/galaxie/GalaxieSkeleton';
import { getSessionUser } from '@/lib/session';
import {
  getGalaxieDataForWorkspace,
  getWorkspaceCounts,
  listUserWorkspaces,
} from '@/lib/dal/galaxie';
import { isGitHubAppConfigured } from '@/lib/apply-mode';

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

  const counts = await getWorkspaceCounts(result.workspace.id);

  // Sprint G6 — set the default-workspace cookie so the proxy can redirect
  // legacy URLs without an extra DB roundtrip per request.
  const cookieStore = await cookies();
  cookieStore.set('vk_default_workspace_slug', result.workspace.slug, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });

  return (
    <main id="main-content" tabIndex={-1} className="h-screen w-screen">
      <Suspense fallback={<GalaxieSkeleton />}>
        <GalaxieRoot
          initialData={result.data}
          initialWorkspaceSlug={result.workspace.slug}
          workspaces={workspaces.map((w) => ({
            slug: w.slug,
            label: w.name,
            plan: w.role === 'owner' ? 'agency' : w.role === 'admin' ? 'team' : 'solo',
          }))}
          onboarding={{
            workspaceId: result.workspace.id,
            customerCount: counts.customerCount,
            repoCount: counts.repoCount,
            scanCount: counts.scanCount,
            applyCount: counts.applyCount,
            memberCount: counts.memberCount,
            gitHubAppConfigured: isGitHubAppConfigured(),
          }}
        />
      </Suspense>
    </main>
  );
}
