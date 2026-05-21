import { KeyRoundIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui-vk';

export default function ApiKeysSettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">API Keys</h1>
        <p className="type-body text-muted-foreground">
          Programmatic access to ValidationKit. Reveal-once tokens, last-used
          timestamps, scope-badge per key (Resend-style).
        </p>
      </header>

      <Card>
        <CardContent className="py-2">
          <EmptyState
            icon={KeyRoundIcon}
            title="No API keys yet."
            description="Generate a key to call /api/audit-trail, /api/anonymous-audit, and the eval webhook from CI. Backend wiring lands in nova-2-settings-backend."
            action={
              <Button size="sm" disabled>
                Create API key (coming soon)
              </Button>
            }
            size="default"
          />
        </CardContent>
      </Card>
    </>
  );
}
