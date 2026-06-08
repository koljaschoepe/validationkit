"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MonitorIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { revokeSession, type ActiveSession } from "@/lib/session-actions";

export function SessionList({ sessions }: { sessions: ActiveSession[] }) {
  const [rows, setRows] = useState(sessions);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <p className="type-body-sm text-muted-foreground py-2">
        No active sessions.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-4 py-4"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <MonitorIcon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="truncate text-sm text-foreground">
                {s.userAgent ?? "Unknown device"}
              </span>
              {s.current && (
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  This device
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {s.ipAddress ?? "no-ip"} · signed in{" "}
              {new Date(s.createdAt).toLocaleString()}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            disabled={pending}
            aria-label="Revoke session"
            onClick={() => {
              if (
                !confirm(
                  s.current
                    ? "Revoke THIS device? You'll be signed out."
                    : "Revoke this session?",
                )
              )
                return;
              startTransition(async () => {
                const r = await revokeSession(s.id);
                if (!r.ok) {
                  toast.error(r.error ?? "Revoke failed");
                  return;
                }
                toast.success("Session revoked");
                if (s.current) {
                  router.push("/");
                  return;
                }
                setRows((prev) => prev.filter((x) => x.id !== s.id));
              });
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
