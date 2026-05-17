"use client";

import { useState } from "react";
import { signIn } from "@vk/auth/client";

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
      callbackURL: "/scans",
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message ?? "Unknown error");
      return;
    }
    setStatus("sent");
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending magic link…" : "Send magic link"}
      </button>
      {status === "sent" ? (
        <div className="callout">
          Magic link sent. Open{" "}
          <a href="http://localhost:8025" target="_blank" rel="noreferrer">
            Mailpit at localhost:8025
          </a>{" "}
          to read it (or your real inbox in non-local mode).
        </div>
      ) : null}
      {status === "error" && errorMsg ? (
        <div className="error">{errorMsg}</div>
      ) : null}
    </form>
  );
}
