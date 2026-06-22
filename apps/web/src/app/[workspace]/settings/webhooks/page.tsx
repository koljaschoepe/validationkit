import { redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { listWebhooksAction } from '@/lib/webhook-actions';
import { WebhooksManager } from './WebhooksManager';

export const dynamic = 'force-dynamic';

export default async function WebhooksSettingsPage() {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const webhooks = await listWebhooksAction();

  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Webhooks</h1>
        <p className="type-body text-muted-foreground">
          Ausgehende Events an deine Endpoints. Stripe-style signiert (
          <code className="font-mono text-xs">X-VK-Signature</code>), mit
          automatischem Retry bei Fehlern. Verifiziere die Signatur über{' '}
          <code className="font-mono text-xs">
            HMAC-SHA256(secret, &quot;&lt;t&gt;.&lt;body&gt;&quot;)
          </code>
          .
        </p>
      </header>

      <WebhooksManager initial={webhooks} />
    </>
  );
}
