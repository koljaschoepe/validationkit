"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@vk/auth/client";
import { AlertTriangle, CheckCircle2, Mail, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * LoginForm — Phase Nova-2 polish.
 *
 *   - Reads `next` from search params → passes as callbackURL via /auth/verify
 *   - Inline-error states with 3 variants (expired / already-used / generic)
 *   - 30 s resend-throttle with live countdown after a successful send
 *
 * Auto-detect-logged-in (plan §4 P4) lives at the page level (server-side
 * redirect), not here — that avoids a client-side flicker.
 */

const RESEND_THROTTLE_S = 30;

type ErrorKind = "expired" | "already-used" | "invalid-email" | "generic";

function classifyError(message: string | undefined): ErrorKind {
  const msg = (message ?? "").toLowerCase();
  if (msg.includes("expired")) return "expired";
  if (msg.includes("already used") || msg.includes("invalid_token"))
    return "already-used";
  if (msg.includes("invalid email")) return "invalid-email";
  return "generic";
}

const ERROR_COPY: Record<ErrorKind, { title: string; body: string }> = {
  expired: {
    title: "Link expired",
    body: "Magic links expire after 10 minutes. Request a fresh one below.",
  },
  "already-used": {
    title: "Link already used",
    body:
      "Each magic link works exactly once. If you didn't sign in successfully, request a new one.",
  },
  "invalid-email": {
    title: "Check the email address",
    body: "That doesn't look like a valid email. Double-check and try again.",
  },
  generic: {
    title: "Sign-in failed",
    body: "Something went wrong sending the magic link. Try again in a moment.",
  },
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const callbackURL = `/auth/verify?next=${encodeURIComponent(nextParam)}`;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorKind, setErrorKind] = useState<ErrorKind>("generic");
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Throttle countdown after a successful send.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [secondsLeft]);

  async function sendLink() {
    setStatus("sending");
    const { error } = await signIn.magicLink({ email, callbackURL });
    if (error) {
      setStatus("error");
      setErrorKind(classifyError(error.message));
      return;
    }
    setStatus("sent");
    setSecondsLeft(RESEND_THROTTLE_S);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (secondsLeft > 0) return;
    void sendLink();
  }

  const isSending = status === "sending";
  const isThrottled = secondsLeft > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
        />
      </div>

      <Button
        type="submit"
        disabled={isSending || isThrottled}
        className="w-full"
      >
        {status === "sent" && isThrottled ? (
          <>
            <RotateCcw className="size-4" />
            Resend in {secondsLeft}s
          </>
        ) : status === "sent" ? (
          <>
            <RotateCcw className="size-4" />
            Resend magic link
          </>
        ) : (
          <>
            <Mail className="size-4" />
            {isSending ? "Sending magic link…" : "Send magic link"}
          </>
        )}
      </Button>

      {status === "sent" ? (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Magic link sent.</AlertTitle>
          <AlertDescription>
            Check your inbox (or Mailpit at{" "}
            <a
              href="http://localhost:8025"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              localhost:8025
            </a>{" "}
            in local dev). The link expires in 10 minutes and works once.
          </AlertDescription>
        </Alert>
      ) : null}

      {status === "error" ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>{ERROR_COPY[errorKind].title}</AlertTitle>
          <AlertDescription>{ERROR_COPY[errorKind].body}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
