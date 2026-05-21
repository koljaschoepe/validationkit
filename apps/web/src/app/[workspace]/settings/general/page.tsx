import { SettingsIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function GeneralSettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">General</h1>
        <p className="type-body text-muted-foreground">
          Workspace name, slug, logo, timezone. The basics every team touches first.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="size-5 text-muted-foreground" aria-hidden />
            <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
              Coming with nova-2-settings-backend
            </p>
          </div>
          <p className="type-body-sm text-muted-foreground">
            Will expose: workspace label, slug rename (with redirect protection),
            logo upload, default timezone for cron-job scheduling, primary contact email.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
