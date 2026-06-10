import { redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/account/settings/profile');

  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Profile</h1>
        <p className="type-body text-muted-foreground">
          Your sign-in identity. Magic-link is keyed to this email, so if you
          change it the next login uses the new address.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-6">
          <Field label="Email" value={user.email} mono />
          <Field label="User ID" value={user.id} mono />
        </CardContent>
      </Card>

      <p className="font-mono type-mono-sm text-muted-foreground">
        Editable name / avatar / locale lands with nova-2-settings-backend.
      </p>
    </>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-3">
      <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={mono ? 'font-mono text-sm text-foreground' : 'text-sm text-foreground'}>
        {value}
      </p>
    </div>
  );
}
