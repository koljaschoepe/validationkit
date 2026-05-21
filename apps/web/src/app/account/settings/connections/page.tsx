import { LinkIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ConnectionsSettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Connected accounts</h1>
        <p className="type-body text-muted-foreground">
          OAuth providers linked to this account. GitHub-OAuth (planned for V2)
          lands here.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <LinkIcon className="size-5 text-muted-foreground" aria-hidden />
            <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
              V2-Feature — GitHub-OAuth
            </p>
          </div>
          <p className="type-body-sm text-muted-foreground">
            Right now ValidationKit ships magic-link-only. GitHub-OAuth (Agent 7
            recommendation for dev-personas) is on the V2-roadmap. The Better-Auth{' '}
            <code>account</code> table is already in place — wiring is a one-route
            add when the time comes.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
