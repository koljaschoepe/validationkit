import { redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { NOTIFICATION_EVENTS } from '@/lib/notification-prefs';
import { getNotificationPrefsAction } from '@/lib/notification-actions';
import { NotificationMatrix } from '@/components/settings/NotificationMatrix';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function NotificationsSettingsPage() {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const prefs =
    (await getNotificationPrefsAction()) ??
    Object.fromEntries(NOTIFICATION_EVENTS.map((e) => [e.id, false]));

  const events = NOTIFICATION_EVENTS.map((e) => ({
    id: e.id,
    label: e.label,
    description: e.description,
  }));

  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">
          Benachrichtigungen
        </h1>
        <p className="type-body text-muted-foreground">
          Wähle, welche Workspace-Ereignisse dich per E-Mail erreichen.
          Kritische Zahlungswarnungen werden immer zugestellt.
        </p>
      </header>

      <Card>
        <CardContent className="py-6">
          <NotificationMatrix events={events} initial={prefs} />
        </CardContent>
      </Card>
    </>
  );
}
