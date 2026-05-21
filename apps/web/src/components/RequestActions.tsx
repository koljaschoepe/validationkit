"use client";

import { useTransition } from "react";
import { decideInstall } from "@/lib/install-requests";

export function RequestActions({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  function decide(decision: "approved" | "rejected") {
    startTransition(async () => {
      const result = await decideInstall(requestId, decision, null);
      if (!result.ok) {
        alert(result.error);
      }
    });
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        type="button"
        disabled={pending}
        onClick={() => decide("approved")}
        style={{
          background: "var(--sev-strong)",
          color: "var(--background)",
          border: "none",
          padding: "0.25rem 0.7rem",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Approve
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => decide("rejected")}
        style={{
          background: "transparent",
          color: "var(--sev-kill)",
          border: "1px solid var(--sev-kill)",
          padding: "0.25rem 0.7rem",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Reject
      </button>
    </div>
  );
}
