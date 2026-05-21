import { Trash2Icon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DeleteAccountSettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Delete account</h1>
        <p className="type-body text-muted-foreground">
          Permanent. All workspaces you own get a 7-day retention window before
          the cascading delete fires. Audit-trail is preserved per legal policy.
        </p>
      </header>

      <Card className="border-destructive/30">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <Trash2Icon className="size-5 text-destructive" aria-hidden />
            <p className="font-mono type-mono-sm uppercase tracking-wider text-destructive">
              Coming with nova-2-settings-backend
            </p>
          </div>
          <p className="type-body-sm text-muted-foreground">
            Typed-confirm flow ships when the delete-user route is in place.
            Until then, contact{' '}
            <a href="mailto:support@validationkit.dev" className="underline">
              support@validationkit.dev
            </a>{' '}
            for an account-wipe request.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
