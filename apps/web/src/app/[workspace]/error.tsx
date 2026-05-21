'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Workspace-Layer Error-Boundary. Catched alle uncaught Errors aus dem
 * Workspace-Subtree — z.B. fehlgeschlagene Membership-Validation,
 * DAL-Crash, Inngest-Connection-Errors, oder transientes Drizzle-Timeout.
 *
 * App-Router-Konvention: ein Client-Component mit `reset()`-Prop, der die
 * Error-Boundary zurücksetzt und das Re-Rendering triggert.
 */
export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to monitoring once we have it (Phase Future). Console.error keeps
    // it visible in browser-dev + Vercel function logs.
    console.error('[workspace error]', error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <Card className="border-destructive/30">
        <CardContent className="space-y-4 py-8 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">
              Workspace couldn&apos;t load
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Something went wrong reading workspace data. This is usually a
              transient hiccup. Hitting retry below will re-render the page.
            </p>
            {error.digest ? (
              <p className="font-mono text-xs text-muted-foreground/70">
                Error-ID: {error.digest}
              </p>
            ) : null}
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={reset}>
              Retry
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="/dashboard">Back to dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
