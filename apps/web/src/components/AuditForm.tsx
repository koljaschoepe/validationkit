"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { auditAction, type AuditFormState } from "@/lib/audit-action";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ReportView } from "./ReportView";

const INITIAL: AuditFormState = { ok: false };

const SAMPLE_REPOS = [
  { label: "anthropic-cookbook", url: "https://github.com/anthropics/anthropic-cookbook" },
  { label: "anthropics/courses", url: "https://github.com/anthropics/courses" },
];

export function AuditForm({ defaultPath: _defaultPath }: { defaultPath: string }) {
  const [state, action] = useActionState(auditAction, INITIAL);
  const [pathValue, setPathValue] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <form action={action} className="space-y-3">
            <Label htmlFor="path" className="text-sm">
              Public GitHub repo URL
            </Label>
            <Input
              id="path"
              name="path"
              value={pathValue}
              onChange={(e) => setPathValue(e.target.value)}
              placeholder="https://github.com/anthropics/anthropic-cookbook"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <SubmitButton />
              <span className="text-xs text-muted-foreground">or try:</span>
              {SAMPLE_REPOS.map((s) => (
                <button
                  key={s.url}
                  type="button"
                  onClick={() => setPathValue(s.url)}
                  className="text-xs font-mono text-primary underline-offset-4 hover:underline"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {state.error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            {state.error}
          </CardContent>
        </Card>
      ) : null}

      {state.ok && state.background && state.savedScanId ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 text-sm">
            <strong>Queued.</strong> Large repo — audit runs in the background.{" "}
            <Link
              href={`/scans/${state.savedScanId}`}
              className="text-primary inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              Track progress
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {state.ok && state.scan && state.report ? (
        <>
          {state.displayPath ? (
            <p className="text-xs text-muted-foreground font-mono">
              Audited: {state.displayPath}
            </p>
          ) : null}
          <ReportView
            scan={state.scan}
            report={state.report}
            scanId={state.savedScanId ?? null}
          />
        </>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Fetching + scanning…
        </>
      ) : (
        "Run audit"
      )}
    </Button>
  );
}
