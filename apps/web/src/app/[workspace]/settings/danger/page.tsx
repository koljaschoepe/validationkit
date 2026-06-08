import { notFound, redirect } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { listUserWorkspaces } from '@/lib/dal/galaxie';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteWorkspaceForm } from './DeleteWorkspaceForm';

export const dynamic = 'force-dynamic';

export default async function DangerSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const { workspace } = await params;
  const accessible = await listUserWorkspaces(user.id);
  const ws = accessible.find((w) => w.slug === workspace);
  if (!ws) notFound();

  const isOwner = ws.role === 'owner';

  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Danger Zone</h1>
        <p className="type-body text-muted-foreground">
          Delete the workspace. This is irreversible and gated behind explicit
          typed confirmation.
        </p>
      </header>

      <Card className="border-destructive/30">
        <CardContent className="space-y-4 py-6">
          <div className="space-y-1">
            <p className="type-body font-medium text-foreground">
              Delete this workspace
            </p>
            <p className="type-body-sm text-muted-foreground">
              Permanently removes every customer, repo, scan, finding, fix and
              membership in <span className="font-mono">{ws.slug}</span>. There
              is no recovery.
            </p>
          </div>

          {isOwner ? (
            <DeleteWorkspaceForm workspaceId={ws.id} slug={ws.slug} />
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
              <AlertTriangle
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <p className="type-body-sm text-muted-foreground">
                Only the workspace owner can delete it. Your role is{' '}
                <span className="font-mono">{ws.role}</span>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
