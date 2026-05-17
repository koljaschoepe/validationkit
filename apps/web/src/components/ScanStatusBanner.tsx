"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getScanStatus,
  type ScanStatusSnapshot,
} from "@/lib/scan-status";

const POLL_MS = 2000;

export function ScanStatusBanner({
  scanId,
  initialStatus,
}: {
  scanId: string;
  initialStatus: "queued" | "running" | "complete" | "failed";
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<ScanStatusSnapshot | null>(null);
  const status = snapshot?.status ?? initialStatus;

  useEffect(() => {
    if (initialStatus === "complete" || initialStatus === "failed") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick(): Promise<void> {
      try {
        const next = await getScanStatus(scanId);
        if (cancelled) return;
        setSnapshot(next);
        if (next && (next.status === "complete" || next.status === "failed")) {
          router.refresh();
          return;
        }
      } catch {
        // Network blip; let the next tick try again.
      }
      if (!cancelled) timer = setTimeout(tick, POLL_MS);
    }

    timer = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [scanId, initialStatus, router]);

  if (status === "complete") return null;

  if (status === "failed") {
    return (
      <div className="error">
        <strong>Scan failed.</strong>{" "}
        {snapshot?.failureReason ?? "No reason persisted. Check the logs."}
      </div>
    );
  }

  return (
    <div className="callout">
      <strong>
        {status === "queued" ? "Queued." : "Running."}
      </strong>{" "}
      The scan is being processed in the background by Inngest. This page polls
      every {POLL_MS / 1000}s and refreshes when the result is ready. Watch the
      raw queue at{" "}
      <a href="http://localhost:8288" target="_blank" rel="noreferrer">
        localhost:8288
      </a>
      .
    </div>
  );
}
