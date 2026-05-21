import { GlobeIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function GalaxieSettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Galaxie</h1>
        <p className="type-body text-muted-foreground">
          Per-workspace defaults for the Galaxie-Hero: pulse, zoom-speed,
          reduced-motion, density-heatmap. Overrides the in-popover transient settings.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <GlobeIcon className="size-5 text-muted-foreground" aria-hidden />
            <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
              Coming with nova-2-settings-backend
            </p>
          </div>
          <p className="type-body-sm text-muted-foreground">
            The in-Galaxie settings-popover (top-right, Settings₂-icon) already
            ships these toggles as session-state. This page will persist them
            per-workspace via a JSONB column on the workspace table.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
