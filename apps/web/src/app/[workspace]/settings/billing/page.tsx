import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function SettingsBillingPage() {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Subscription + plan management. Stripe-portal handles invoices,
          payment method, and downgrade/cancel flow.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            The full billing experience (current plan, usage, upgrade) still
            lives at <Link className="text-primary hover:underline" href={"/billing" as never}>/billing</Link>
            {' '}— Sprint G7 polish moves the page in here. For now we expose
            the link explicitly so beta-users can self-serve.
          </p>
          <Button asChild size="sm">
            <Link href={"/billing" as never}>Open billing</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href={"/pricing" as never}>See plans</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
