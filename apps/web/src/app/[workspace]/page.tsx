import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import GalaxieRoot from '@/components/galaxie/GalaxieRoot';
import { getGalaxieDataForWorkspace } from '@/lib/dal/galaxie';

export default async function WorkspaceGalaxiePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  const result = await getGalaxieDataForWorkspace(workspace);
  if (!result) notFound();
  // Sprint G2 will pass `result.data` down to the client component instead of
  // letting it regenerate from the seed. For G1 the slug-as-seed is enough to
  // give every workspace a visibly distinct galaxie.
  return (
    <div className="h-screen w-screen">
      <Suspense fallback={null}>
        <GalaxieRoot />
      </Suspense>
    </div>
  );
}
