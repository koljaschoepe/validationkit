import { redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { listApiKeysAction } from '@/lib/api-key-actions';
import { ApiKeysManager } from './ApiKeysManager';

export const dynamic = 'force-dynamic';

export default async function ApiKeysSettingsPage() {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const keys = await listApiKeysAction();

  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">API-Keys</h1>
        <p className="type-body text-muted-foreground">
          Programmatischer Lesezugriff auf deine Audits —{' '}
          <code className="font-mono text-xs">GET /api/v1/scans</code> mit{' '}
          <code className="font-mono text-xs">Authorization: Bearer vk_…</code>.
          Reveal-once-Tokens, nur als SHA-256-Hash gespeichert.
        </p>
      </header>

      <ApiKeysManager initialKeys={keys} />
    </>
  );
}
