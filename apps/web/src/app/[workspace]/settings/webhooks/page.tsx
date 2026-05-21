import { WebhookIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui-vk';

export default function WebhooksSettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Webhooks</h1>
        <p className="type-body text-muted-foreground">
          Outbound events. Subscribe to <code>scan.complete</code>,{' '}
          <code>finding.applied</code>, <code>workspace.member.added</code>{' '}
          (and 4 more) from your CI or internal dashboards.
        </p>
      </header>

      <Card>
        <CardContent className="py-2">
          <EmptyState
            icon={WebhookIcon}
            title="No webhooks configured."
            description="Add an HTTPS endpoint and select the events to subscribe. Backend wiring lands in nova-2-settings-backend."
            action={
              <Button size="sm" disabled>
                Add webhook (coming soon)
              </Button>
            }
            size="default"
          />
        </CardContent>
      </Card>
    </>
  );
}
