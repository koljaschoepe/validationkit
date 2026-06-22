"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MonitorIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { revokeSession, type ActiveSession } from "@/lib/session-actions";

export function SessionList({ sessions }: { sessions: ActiveSession[] }) {
  const [rows, setRows] = useState(sessions);
  const [confirmTarget, setConfirmTarget] = useState<ActiveSession | null>(
    null,
  );
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function doRevoke(s: ActiveSession) {
    startTransition(async () => {
      const r = await revokeSession(s.id);
      if (!r.ok) {
        toast.error(r.error ?? "Widerruf fehlgeschlagen.");
        return;
      }
      toast.success("Sitzung widerrufen.");
      if (s.current) {
        router.push("/");
        return;
      }
      setRows((prev) => prev.filter((x) => x.id !== s.id));
    });
  }

  if (rows.length === 0) {
    return (
      <p className="type-body-sm text-muted-foreground py-2">
        Keine aktiven Sitzungen.
      </p>
    );
  }

  return (
    <>
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
                  {s.userAgent ?? "Unbekanntes Gerät"}
                </span>
                {s.current && (
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Dieses Gerät
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                {s.ipAddress ?? "keine IP"} · angemeldet{" "}
                {new Date(s.createdAt).toLocaleString("de-DE")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              disabled={pending}
              aria-label="Sitzung widerrufen"
              onClick={() => setConfirmTarget(s)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.current
                ? "Dieses Gerät abmelden?"
                : "Sitzung widerrufen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.current
                ? "Du wirst von diesem Gerät abgemeldet und zur Startseite geleitet."
                : "Diese Sitzung verliert sofort den Zugriff. Das lässt sich nicht rückgängig machen."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = confirmTarget;
                setConfirmTarget(null);
                if (target) doRevoke(target);
              }}
            >
              Widerrufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
