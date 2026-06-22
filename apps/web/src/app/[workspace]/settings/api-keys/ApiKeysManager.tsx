"use client";

import { useState, useTransition } from "react";
import {
  KeyRoundIcon,
  CopyIcon,
  CheckIcon,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { EmptyState } from "@/components/ui-vk";
import {
  createApiKeyAction,
  revokeApiKeyAction,
  type ApiKeyListItem,
} from "@/lib/api-key-actions";

function formatDate(iso: string | null): string {
  if (!iso) return "nie";
  return new Date(iso).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ApiKeysManager({
  initialKeys,
}: {
  initialKeys: ApiKeyListItem[];
}) {
  const [keys, setKeys] = useState(initialKeys);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyListItem | null>(null);

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createApiKeyAction(name);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setKeys((prev) => [res.item, ...prev]);
      setName("");
      setCreateOpen(false);
      setCopied(false);
      setNewToken(res.token); // open the reveal-once dialog
    });
  }

  function onRevoke(target: ApiKeyListItem) {
    startTransition(async () => {
      const res = await revokeApiKeyAction(target.id);
      if (!res.ok) {
        toast.error(res.error ?? "Widerruf fehlgeschlagen.");
        return;
      }
      setKeys((prev) => prev.filter((k) => k.id !== target.id));
      toast.success("API-Key widerrufen.");
    });
  }

  async function copyToken() {
    if (!newToken) return;
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      toast.success("Kopiert.");
    } catch {
      toast.error("Kopieren fehlgeschlagen — markiere den Token manuell.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <KeyRoundIcon className="size-4" />
              API-Key erstellen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={onCreate}>
              <DialogHeader>
                <DialogTitle>Neuen API-Key erstellen</DialogTitle>
                <DialogDescription>
                  Der Token wird nur einmal angezeigt. Bewahre ihn sicher auf —
                  wir speichern nur einen SHA-256-Hash.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 py-4">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. CI-Export"
                  maxLength={100}
                />
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Erstelle…
                    </>
                  ) : (
                    "Erstellen"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {keys.length === 0 ? (
        <EmptyState
          icon={KeyRoundIcon}
          title="Noch keine API-Keys."
          description="Erstelle einen Key für programmatischen Lesezugriff auf GET /api/v1/scans."
          size="default"
        />
      ) : (
        <ul className="divide-y divide-border rounded-md border">
          {keys.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-medium">{k.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {k.tokenPrefix}…{k.last4} · erstellt {formatDate(k.createdAt)}{" "}
                  · zuletzt genutzt {formatDate(k.lastUsedAt)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label={`API-Key „${k.name}" widerrufen`}
                disabled={pending}
                onClick={() => setRevokeTarget(k)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Reveal-once token dialog */}
      <Dialog
        open={newToken !== null}
        onOpenChange={(o) => {
          if (!o) setNewToken(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dein neuer API-Key</DialogTitle>
            <DialogDescription>
              Kopiere ihn jetzt — er wird nicht noch einmal angezeigt.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">
              {newToken}
            </code>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Token kopieren"
              onClick={copyToken}
            >
              {copied ? (
                <CheckIcon className="size-3.5" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" size="sm" onClick={() => setNewToken(null)}>
              Fertig
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>API-Key widerrufen?</AlertDialogTitle>
            <AlertDialogDescription>
              Anwendungen, die „{revokeTarget?.name}" nutzen, verlieren sofort
              den Zugriff. Das lässt sich nicht rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const t = revokeTarget;
                setRevokeTarget(null);
                if (t) onRevoke(t);
              }}
            >
              Widerrufen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
