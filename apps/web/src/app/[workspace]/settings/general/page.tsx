import { redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { resolveWorkspaceFromSlug } from '@/lib/workspace-context';
import { getUserRole } from '@/lib/authz';
import { listMembers } from '@/lib/membership';
import { GeneralSettingsForms } from './GeneralSettingsForms';

export const dynamic = 'force-dynamic';

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { workspace: slug } = await params;
  const ws = await resolveWorkspaceFromSlug(slug, user.id);
  const role = await getUserRole(ws.id, user.id);
  const isOwner = role === 'owner';

  const members = isOwner
    ? (await listMembers(ws.id))
        .filter(
          (m) => m.status === 'active' && m.userId && m.userId !== user.id,
        )
        .map((m) => ({
          userId: m.userId as string,
          label: m.email ?? m.invitedEmail ?? (m.userId as string),
        }))
    : [];

  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">General</h1>
        <p className="type-body text-muted-foreground">
          Workspace-Name und Inhaberschaft. Slug-Rename, Logo und Zeitzone
          folgen später (brauchen Schema).
        </p>
      </header>

      <GeneralSettingsForms
        workspaceId={ws.id}
        workspaceSlug={ws.slug}
        currentName={ws.name}
        canRename={role === 'owner' || role === 'admin'}
        isOwner={isOwner}
        members={members}
      />
    </>
  );
}
