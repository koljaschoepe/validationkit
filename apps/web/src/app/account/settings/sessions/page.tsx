import { redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { listActiveSessions } from '@/lib/session-actions';
import { Card, CardContent } from '@/components/ui/card';
import { SessionList } from './SessionList';

export const dynamic = 'force-dynamic';

export default async function SessionsSettingsPage() {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account/settings/sessions');

  const sessions = await listActiveSessions();

  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Sessions</h1>
        <p className="type-body text-muted-foreground">
          Active devices and recent sign-ins. Revoke any session you don&apos;t
          recognise — revoking signs that device out immediately.
        </p>
      </header>

      <Card>
        <CardContent className="py-2">
          <SessionList sessions={sessions} />
        </CardContent>
      </Card>
    </>
  );
}
