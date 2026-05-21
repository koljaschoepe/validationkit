"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@vk/auth/client";
import { AlertTriangleIcon, CheckCircle2Icon, MailIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Modal dialog shown when a landing visitor clicks "Fix via PR". Reuses the
 * Better-Auth magic-link flow from LoginForm.tsx — same callback target,
 * same shape, just embedded in a dialog with a marketing intro on top.
 */
export function SignUpTeaseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    const { error } = await signIn.magicLink({
      email,
      callbackURL: "/dashboard",
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message ?? "Magic-Link konnte nicht gesendet werden.");
      return;
    }
    setStatus("sent");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bereit den Fix zu senden?</DialogTitle>
          <DialogDescription>
            Wir öffnen für dich Branch, Commit und PR mit dem konkreten Diff.
            Du reviewst, mergst, fertig. Volle Audit-Features nach Sign-in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agency.com"
              autoComplete="email"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={status === "sending" || status === "sent"}
            className="w-full justify-center"
          >
            <MailIcon className="size-4" />
            {status === "sending" ? "Sende Magic-Link…" : "Magic-Link senden"}
          </Button>
        </form>

        {status === "sent" ? (
          <Alert>
            <CheckCircle2Icon className="size-4" />
            <AlertTitle>Magic-Link unterwegs.</AlertTitle>
            <AlertDescription>
              Check deine Inbox{" "}
              <span className="font-mono type-mono-sm">{email}</span>. Der Link
              landet direkt auf dem Dashboard.
            </AlertDescription>
          </Alert>
        ) : null}

        {status === "error" && errorMsg ? (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Sign-in fehlgeschlagen</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        <div className="border-t border-border pt-3 text-center">
          <Link
            href="/login"
            className="font-mono type-mono-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Lieber zuerst die ganze Tour →
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
