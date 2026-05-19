import { redirect } from 'next/navigation';
import { isAuthEnabled } from '@vk/auth';
import { getSessionUser } from '@/lib/session';
import { isGitHubAppConfigured } from '@/lib/apply-mode';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function SettingsIntegrationsPage() {
  if (!isAuthEnabled()) redirect('/login');
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const githubReady = isGitHubAppConfigured();
  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          External services wired to this workspace.
        </p>
      </header>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-medium">GitHub App</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Required for Apply-as-PR + Apply-Direct workflows in the
                Inspector. Without it the app falls back to LocalGitClient
                (patches written to /tmp/vk-patches/).
              </p>
            </div>
            <Badge variant={githubReady ? 'default' : 'secondary'}>
              {githubReady ? 'Connected' : 'Not configured'}
            </Badge>
          </div>
          {!githubReady ? (
            <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
              Set <code>GITHUB_APP_ID</code>, <code>GITHUB_APP_CLIENT_ID</code>,
              and <code>GITHUB_APP_PRIVATE_KEY</code> in <code>.env.local</code>.
              Walkthrough: <code>docs/setup/github-app-checklist.md</code>.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
