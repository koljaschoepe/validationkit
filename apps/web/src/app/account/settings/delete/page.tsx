import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { listSoleOwnedWorkspaces } from '@/lib/account-actions';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteAccountForm } from './DeleteAccountForm';

export const dynamic = 'force-dynamic';

export default async function DeleteAccountSettingsPage() {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account/settings/delete');

  const blockers = await listSoleOwnedWorkspaces(user.id);

  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Delete account</h1>
        <p className="type-body text-muted-foreground">
          Permanent and immediate. Your user record and all sessions are
          deleted, and your IP + user-agent are scrubbed from retained
          compliance rows (GDPR Art. 17). The audit history itself is preserved
          per legal policy.
        </p>
      </header>

      {blockers.length > 0 ? (
        <Card className="border-[var(--color-sev-mid)]/30">
          <CardContent className="space-y-4 py-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-[var(--color-sev-mid)]" aria-hidden />
              <p className="font-mono type-mono-sm uppercase tracking-wider text-[var(--color-sev-mid)]">
                Resolve {blockers.length} workspace
                {blockers.length === 1 ? '' : 's'} first
              </p>
            </div>
            <p className="type-body-sm text-muted-foreground">
              You&apos;re the only owner of the workspace
              {blockers.length === 1 ? '' : 's'} below. Transfer ownership to
              another member, or delete the workspace, before deleting your
              account — so nothing is orphaned and no teammate loses data
              unexpectedly.
            </p>
            <ul className="space-y-1.5">
              {blockers.map((ws) => (
                <li key={ws.id}>
                  <Link
                    href={`/${ws.slug}/settings/danger`}
                    className="inline-flex items-center gap-2 text-sm text-foreground underline underline-offset-4"
                  >
                    <span className="font-medium">{ws.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      /{ws.slug}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive/30">
          <CardContent className="py-6">
            <DeleteAccountForm email={user.email} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
