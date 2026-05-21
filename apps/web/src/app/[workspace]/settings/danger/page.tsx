import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

/**
 * Settings → Danger Zone.
 *
 * Shell with explicit "not yet wired" disclaimer. The interactive
 * DangerConfirm mounts were removed 2026-05-21 (repo-health-Phase 1.18)
 * because they showed a fake workspace-name placeholder and disabled
 * buttons — a Mis-Selling-Risk for Beta sign-ups. The real ownership-
 * transfer + delete-workspace flows land with `nova-2-settings-backend.md`.
 */
export default function DangerSettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Danger Zone</h1>
        <p className="type-body text-muted-foreground">
          Transfer ownership or delete the workspace. These actions are
          irreversible and gated behind explicit typed confirmation.
        </p>
      </header>

      <Card className="border-border">
        <CardContent className="space-y-4 py-8 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="type-body font-medium text-foreground">
              Not yet available
            </p>
            <p className="type-body-sm text-muted-foreground max-w-md mx-auto">
              Ownership transfer and workspace deletion ship together with the
              Settings-Backend (sub-plan{' '}
              <code className="text-xs">nova-2-settings-backend.md</code>). Until
              then, contact support to perform these actions manually.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
