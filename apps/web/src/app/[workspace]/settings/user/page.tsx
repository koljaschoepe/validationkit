import { redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { Card, CardContent } from '@/components/ui/card';

export default async function SettingsUserPage() {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          Your sign-in identity and session details.
        </p>
      </header>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Row label="Email" value={user.email} />
          <Row label="User id" value={user.id} mono />
          <Row label="Auth method" value="Magic link" />
        </CardContent>
      </Card>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={mono ? 'font-mono text-xs' : 'text-sm'}>{value}</span>
    </div>
  );
}
