import { KeyIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function SessionsSettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Sessions</h1>
        <p className="type-body text-muted-foreground">
          Active devices and recent sign-ins. Revoke any session you don&apos;t
          recognise.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <KeyIcon className="size-5 text-muted-foreground" aria-hidden />
            <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
              Coming with nova-2-settings-backend
            </p>
          </div>
          <p className="type-body-sm text-muted-foreground">
            Better-Auth already tracks <code>session</code> rows with IP + UA.
            This page will list them with last-used timestamps and a one-click
            revoke per row (signs out the device immediately).
          </p>
        </CardContent>
      </Card>
    </>
  );
}
