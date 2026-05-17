"use client";

import { useState, useTransition } from "react";
import { requestInstall } from "@/lib/install-requests";

export interface RequestWriteButtonProps {
  /** Display label for the repo (e.g. owner/repo or the local rootPath). */
  repoLabel: string;
  /** Resolved local path or `github://owner/repo`. */
  rootPath: string;
  /** Default scope — usually "write" since this is the CTA when read-only blocks. */
  scope?: "read" | "write";
}

export function RequestWriteButton({
  repoLabel,
  rootPath,
  scope = "write",
}: RequestWriteButtonProps) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<
    "idle" | "submitted" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function onClick() {
    startTransition(async () => {
      const result = await requestInstall({
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
      <div className="callout">
        <strong>Request submitted.</strong> A workspace owner will see it on{" "}
        <a href="/requests">/requests</a> and decide. You&apos;ll get an email
        once it&apos;s approved.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        style={{
          background: "var(--accent)",
          color: "#06231e",
          border: "none",
          padding: "0.55rem 1rem",
          borderRadius: "6px",
          fontWeight: 600,
          cursor: pending ? "not-allowed" : "pointer",
          alignSelf: "flex-start",
        }}
      >
        {pending
          ? "Requesting…"
          : scope === "write"
            ? "Request write access"
            : "Request read access"}
      </button>
      {state === "error" && errorMsg ? (
        <div className="error">{errorMsg}</div>
      ) : null}
    </div>
  );
}
