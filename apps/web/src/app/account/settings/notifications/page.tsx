import { BellIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PersonalNotificationsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Notifications</h1>
        <p className="type-body text-muted-foreground">
          Personal preferences — quiet hours, weekly digest opt-in, email vs
          in-app default. Workspace-level event routing lives under{' '}
          <code>/[workspace]/settings/notifications</code>.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <BellIcon className="size-5 text-muted-foreground" aria-hidden />
            <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
              Coming with nova-2-settings-backend
            </p>
          </div>
          <p className="type-body-sm text-muted-foreground">
            Quiet-hours range, weekly-digest toggle, channel preference order.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
