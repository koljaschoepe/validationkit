"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vercel function logs surface this. No external observability vendor yet.
    console.error("[route-error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            <CardTitle className="text-base">Something broke.</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The page errored out on the server. Retry once. If it happens
            twice, it&apos;s real, so please report it at{" "}
            <Link
              href="https://github.com/koljaschoepe/validationkit/issues"
              className="text-primary underline-offset-4 hover:underline"
            >
              GitHub issues
            </Link>
            .
          </p>
          {error.digest ? (
            <p className="text-xs font-mono text-muted-foreground">
              digest: {error.digest}
            </p>
          ) : null}
          <div className="flex gap-2 pt-1">
            <Button type="button" size="sm" onClick={reset}>
              <RotateCw className="size-3.5" />
              Retry
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
