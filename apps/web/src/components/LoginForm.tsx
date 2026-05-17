"use client";

import { useState } from "react";
import { signIn } from "@vk/auth/client";
import { Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
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
      setErrorMsg(error.message ?? "Unknown error");
      return;
    }
    setStatus("sent");
  }

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
      <Button type="submit" disabled={status === "sending"} className="w-full">
        <Mail className="size-4" />
        {status === "sending" ? "Sending magic link…" : "Send magic link"}
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
            in local dev). The link drops you on the dashboard.
          </AlertDescription>
        </Alert>
      ) : null}
      {status === "error" && errorMsg ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
