"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuditCompletedPayload {
  scanId?: string;
  severity?: string;
  findingsCount?: number;
  rootPath?: string;
}

interface DriftCompletedPayload {
  driftId?: string;
  rootPathA?: string;
  rootPathB?: string;
  overallSeverity?: string;
  itemsCount?: number;
}

/**
 * Subscribes to `/api/events/stream` and dispatches sonner toasts on each
 * audit/drift completion. Auto-reconnects on error (browser-native
 * EventSource backoff). Sprint 0.12.
 */
export function useDashboardEvents(): void {
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const source = new EventSource("/api/events/stream");
    eventSourceRef.current = source;

    source.addEventListener("audit.completed", (e) => {
      const data = parsePayload<AuditCompletedPayload>(e);
      const repo = trimRoot(data?.rootPath);
      const sev = data?.severity ?? "Mid";
      const findings = data?.findingsCount ?? 0;
      toast.success(`Audit completed · ${repo}`, {
        description: `${findings} finding${findings === 1 ? "" : "s"} · ${sev}`,
        action: data?.scanId
          ? { label: "Open", onClick: () => router.push(`/scans/${data.scanId}`) }
          : undefined,
      });
      router.refresh();
    });

    source.addEventListener("drift.completed", (e) => {
      const data = parsePayload<DriftCompletedPayload>(e);
      const a = trimRoot(data?.rootPathA);
      const b = trimRoot(data?.rootPathB);
      toast.warning(`Drift detected · ${a} ↔ ${b}`, {
        description: `${data?.itemsCount ?? 0} drift item${data?.itemsCount === 1 ? "" : "s"} · ${data?.overallSeverity ?? "Mid"}`,
        action: data?.driftId
          ? {
              label: "Open",
              onClick: () => router.push(`/drifts/${data.driftId}`),
            }
          : undefined,
      });
      router.refresh();
    });

    source.addEventListener("audit.failed", (e) => {
      const data = parsePayload<{ reason?: string; scanId?: string }>(e);
      toast.error("Audit failed", {
        description: data?.reason ?? "Unknown failure.",
      });
    });

    source.onerror = () => {
      // EventSource reconnects automatically — no manual retry needed.
    };

    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [router]);
}

function parsePayload<T>(e: Event): T | null {
  const me = e as MessageEvent<string>;
  try {
    return JSON.parse(me.data) as T;
  } catch {
    return null;
  }
}

function trimRoot(s: string | undefined): string {
  if (!s) return "repo";
  if (s.startsWith("github.com/")) return s.replace("github.com/", "");
  const parts = s.split("/").filter(Boolean);
  return parts.slice(-2).join("/") || s;
}
