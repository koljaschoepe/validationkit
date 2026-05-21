"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { requestInstall } from "@/lib/install-requests";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface RequestWriteButtonProps {
  /** Workspace slug — drives the URL the action targets + revalidates. */
  workspaceSlug: string;
  /** Display label for the repo (e.g. owner/repo or the local rootPath). */
  repoLabel: string;
  /** Resolved local path or `github://owner/repo`. */
  rootPath: string;
  /** Default scope — usually "write" since this is the CTA when read-only blocks. */
  scope?: "read" | "write";
}

export function RequestWriteButton({
  workspaceSlug,
  repoLabel,
  rootPath,
  scope = "write",
}: RequestWriteButtonProps) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "submitted" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function onClick() {
    startTransition(async () => {
      const result = await requestInstall(workspaceSlug, {
        targetRepoLabel: repoLabel,
        targetRootPath: rootPath,
        requestedScope: scope,
      });
      if (result.ok) {
        setState("submitted");
      } else {
        setState("error");
        setErrorMsg(result.error);
      }
    });
  }

  if (state === "submitted") {
    return (
      <Card className="border-border">
        <CardContent className="flex items-start gap-2 py-3 text-sm">
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-foreground"
            aria-hidden="true"
          />
          <p>
            <strong>Request submitted.</strong> A workspace owner will see it on{" "}
            <Link
              href={`/${workspaceSlug}/requests`}
              className="underline-offset-4 hover:underline"
            >
              /requests
            </Link>{" "}
            and decide. You&apos;ll get an email once it&apos;s approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={onClick} disabled={pending} size="sm">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Requesting…
          </>
        ) : scope === "write" ? (
          "Request write access"
        ) : (
          "Request read access"
        )}
      </Button>
      {state === "error" && errorMsg ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : null}
    </div>
  );
}
