import { SparklesIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AuditApplySettingsPage() {
  return (
    <>
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="type-h1 font-semibold tracking-tight">Audit &amp; Apply</h1>
        <p className="type-body text-muted-foreground">
          Default apply mode, auto-apply threshold, severity-filter, LLM-rule toggle.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <SparklesIcon className="size-5 text-muted-foreground" aria-hidden />
            <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
              Coming with nova-2-settings-backend
            </p>
          </div>
          <p className="type-body-sm text-muted-foreground">
            Will expose:
            <span className="block mt-2 space-y-1 text-foreground/80">
              · Default apply mode — read-only vs PR vs auto-merge per workspace
              <br />· Auto-apply threshold — only Strong+ findings get patched
              <br />· Severity filter — hide Mid+below from dashboard
              <br />· LLM rule toggle — enable the 6th (LLM-augmented) audit rule
            </span>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
