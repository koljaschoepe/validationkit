"use client";

import { useState } from "react";
import { signIn } from "@vk/auth/client";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  LockIcon,
  MailIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "idle" | "sending" | "sent" | "error";
type Variant = "blur-wall" | "background";

/**
 * CTA card shown either as an overlay above the blurred remaining findings
 * (variant: "blur-wall") or stand-alone when the audit went into the
 * background queue (variant: "background"). In both cases it triggers a
 * Better-Auth magic-link with `callbackURL: /dashboard?intent=audit&repo=…`,
 * so the magic-link drops the user back into a real authenticated audit run
 * (re-run-after-login pattern, see Sprint-2 plan §7).
 */
export function BlurOverlayCTA({
  repoUrl,
  hiddenCount,
  variant = "blur-wall",
}: {
  repoUrl: string;
  hiddenCount?: number;
  variant?: Variant;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    const callbackURL = `/dashboard?intent=audit&repo=${encodeURIComponent(repoUrl)}`;
    const { error } = await signIn.magicLink({ email, callbackURL });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message ?? "Magic-Link konnte nicht gesendet werden.");
      return;
    }
    setStatus("sent");
  }

  const headline =
    variant === "background"
      ? "Großes Repo. Wir senden den Magic-Link, sobald fertig."
      : "Den vollen Report per Magic-Link";

  const subline =
    variant === "background"
      ? "Der Audit läuft im Hintergrund. Sobald wir authentifiziert wissen, wem das gehört, runen wir ihn fertig und du bekommst den Report im Workspace."
      : hiddenCount && hiddenCount > 0
        ? `${hiddenCount} weitere Findings warten. Der Magic-Link führt das Audit für deinen Workspace neu aus und persistiert das Ergebnis.`
        : "Der Magic-Link führt das Audit für deinen Workspace neu aus und persistiert das Ergebnis, inklusive Apply-PRs.";

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-start gap-3">
        <LockIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="type-h2 font-semibold tracking-tight">{headline}</h3>
          <p className="type-body-sm text-muted-foreground">{subline}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="full-report-email">Email</Label>
          <Input
            id="full-report-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@agency.com"
            autoComplete="email"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={status === "sending" || status === "sent"}
          className="w-full justify-center"
        >
          <MailIcon className="size-4" />
          {status === "sending"
            ? "Sende Magic-Link…"
            : status === "sent"
              ? "Magic-Link versendet"
              : "Send full report"}
        </Button>
      </form>

      {status === "sent" ? (
        <Alert className="mt-3">
          <CheckCircle2Icon className="size-4" />
          <AlertTitle>Magic-Link unterwegs.</AlertTitle>
          <AlertDescription>
            Check deine Inbox{" "}
            <span className="font-mono type-mono-sm">{email}</span>. Der Link
            startet das Audit für deinen Workspace neu.
          </AlertDescription>
        </Alert>
      ) : null}

      {status === "error" && errorMsg ? (
        <Alert variant="destructive" className="mt-3">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Sign-in fehlgeschlagen</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
