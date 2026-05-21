"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  getScanStatus,
  type ScanStatusSnapshot,
} from "@/lib/scan-status";
import { Card, CardContent } from "@/components/ui/card";

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
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="flex items-start gap-2 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>Scan failed.</strong>{" "}
            {snapshot?.failureReason ?? "No reason persisted. Check the logs."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="flex items-start gap-2 py-3 text-sm">
        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
        <p>
          <strong>{status === "queued" ? "Queued." : "Running."}</strong>{" "}
          The scan is being processed in the background by Inngest. This page polls
          every {POLL_MS / 1000}s and refreshes when the result is ready.
        </p>
      </CardContent>
    </Card>
  );
}
