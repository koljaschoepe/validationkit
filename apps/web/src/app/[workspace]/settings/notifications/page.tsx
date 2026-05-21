import { Card, CardContent } from '@/components/ui/card';
import { NotificationMatrix } from '@/components/settings/NotificationMatrix';

export default function NotificationsSettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Notifications</h1>
        <p className="type-body text-muted-foreground">
          Event × channel matrix plus quiet hours. Tune which audit-events
          reach which inbox.
        </p>
      </header>

      <Card>
        <CardContent className="py-6">
          <NotificationMatrix disabled />
          <p className="mt-4 font-mono type-mono-sm text-muted-foreground">
            Preview only — Save is disabled until <code>notification_preference</code>{' '}
            schema lands (see nova-2-settings-backend.md).
          </p>
        </CardContent>
      </Card>
    </>
  );
}
