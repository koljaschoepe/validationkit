'use client';

import { useState, useTransition } from 'react';
import {
  WebhookIcon,
  Trash2,
  Loader2,
  CopyIcon,
  CheckIcon,
  SendIcon,
  EyeIcon,
  EyeOffIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui-vk';
import { cn } from '@/lib/utils';
import { WEBHOOK_EVENTS } from '@/lib/webhook-events';
import {
  createWebhookAction,
  deleteWebhookAction,
  toggleWebhookAction,
  testWebhookAction,
  type WebhookListItem,
} from '@/lib/webhook-actions';

const ALL_EVENT_IDS = WEBHOOK_EVENTS.map((e) => e.id);

function maskSecret(s: string): string {
  return `${s.slice(0, 10)}••••••${s.slice(-4)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'nie';
  return new Date(iso).toLocaleString('de-DE');
}

export function WebhooksManager({ initial }: { initial: WebhookListItem[] }) {
  const [hooks, setHooks] = useState(initial);
  const [createOpen, setCreateOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(ALL_EVENT_IDS);
  const [pending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<
    Record<string, { ok: boolean; label: string }>
  >({});
  const [deleteTarget, setDeleteTarget] = useState<WebhookListItem | null>(null);

  function toggleEvent(id: string) {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  function toggleReveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copySecret(h: WebhookListItem) {
    try {
      await navigator.clipboard.writeText(h.secret);
      setCopied(h.id);
      toast.success('Secret kopiert.');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('Kopieren fehlgeschlagen.');
    }
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createWebhookAction(url, selectedEvents);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setHooks((prev) => [res.item, ...prev]);
      setUrl('');
      setSelectedEvents(ALL_EVENT_IDS);
      setCreateOpen(false);
      setRevealed((prev) => new Set(prev).add(res.item.id));
      toast.success('Webhook erstellt — Signing-Secret jetzt sichtbar.');
    });
  }

  function onTest(h: WebhookListItem) {
    startTransition(async () => {
      const res = await testWebhookAction(h.id);
      const label = res.ok
        ? `OK (HTTP ${res.status})`
        : `Fehler: ${res.error ?? res.status ?? 'unbekannt'}`;
      setTestResult((prev) => ({ ...prev, [h.id]: { ok: res.ok, label } }));
      setHooks((prev) =>
        prev.map((x) =>
          x.id === h.id
            ? {
                ...x,
                lastStatus: res.ok
                  ? String(res.status)
                  : (res.error ?? 'failed'),
                lastDeliveryAt: new Date().toISOString(),
              }
            : x,
        ),
      );
      if (res.ok) toast.success('Test-Event gesendet.');
      else toast.error('Test fehlgeschlagen.');
    });
  }

  function onToggle(h: WebhookListItem) {
    const next = !h.enabled;
    startTransition(async () => {
      const res = await toggleWebhookAction(h.id, next);
      if (!res.ok) {
        toast.error(res.error ?? 'Fehler.');
        return;
      }
      setHooks((prev) =>
        prev.map((x) => (x.id === h.id ? { ...x, enabled: next } : x)),
      );
    });
  }

  function onDelete(h: WebhookListItem) {
    startTransition(async () => {
      const res = await deleteWebhookAction(h.id);
      if (!res.ok) {
        toast.error(res.error ?? 'Fehler.');
        return;
      }
      setHooks((prev) => prev.filter((x) => x.id !== h.id));
      toast.success('Webhook gelöscht.');
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <WebhookIcon className="size-4" />
              Webhook hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={onCreate}>
              <DialogHeader>
                <DialogTitle>Neuen Webhook hinzufügen</DialogTitle>
                <DialogDescription>
                  Eine öffentliche https://-Adresse erhält signierte POSTs
                  (Header <code className="font-mono text-xs">X-VK-Signature</code>).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wh-url">Endpoint-URL</Label>
                  <Input
                    id="wh-url"
                    required
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/hooks/vk"
                    spellCheck={false}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Events</Label>
                  <div className="grid gap-2">
                    {WEBHOOK_EVENTS.map((ev) => (
                      <label
                        key={ev.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={selectedEvents.includes(ev.id)}
                          onChange={() => toggleEvent(ev.id)}
                        />
                        <span>{ev.label}</span>
                        <code className="ml-auto font-mono text-[11px] text-muted-foreground">
                          {ev.id}
                        </code>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Erstelle…
                    </>
                  ) : (
                    'Erstellen'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {hooks.length === 0 ? (
        <EmptyState
          icon={WebhookIcon}
          title="Noch keine Webhooks."
          description="Füge einen https-Endpoint hinzu und wähle die Events. Zustellungen sind Stripe-style signiert + werden bei Fehlern automatisch wiederholt."
          size="default"
        />
      ) : (
        <ul className="space-y-3">
          {hooks.map((h) => {
            const result = testResult[h.id];
            return (
              <li key={h.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-mono text-xs">{h.url}</p>
                    <div className="flex flex-wrap gap-1">
                      {h.events.map((e) => (
                        <span
                          key={e}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Test senden"
                      disabled={pending}
                      onClick={() => onTest(h)}
                    >
                      <SendIcon className="size-3.5" />
                    </Button>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={h.enabled}
                      aria-label="Webhook aktiv"
                      disabled={pending}
                      onClick={() => onToggle(h)}
                      className={cn(
                        'inline-flex h-5 w-9 items-center rounded-full border border-border transition-colors',
                        h.enabled ? 'bg-foreground/85' : 'bg-card',
                      )}
                    >
                      <span
                        className={cn(
                          'block size-3.5 rounded-full bg-background transition-transform',
                          h.enabled ? 'translate-x-4' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Webhook löschen"
                      disabled={pending}
                      onClick={() => setDeleteTarget(h)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5">
                  <code className="min-w-0 flex-1 truncate font-mono text-[11px]">
                    {revealed.has(h.id) ? h.secret : maskSecret(h.secret)}
                  </code>
                  <button
                    type="button"
                    aria-label={revealed.has(h.id) ? 'Verbergen' : 'Anzeigen'}
                    onClick={() => toggleReveal(h.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {revealed.has(h.id) ? (
                      <EyeOffIcon className="size-3.5" />
                    ) : (
                      <EyeIcon className="size-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Secret kopieren"
                    onClick={() => copySecret(h)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {copied === h.id ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <CopyIcon className="size-3.5" />
                    )}
                  </button>
                </div>

                <p className="mt-2 type-mono-sm text-muted-foreground">
                  Letzte Zustellung: {h.lastStatus ?? '—'} ·{' '}
                  {formatDate(h.lastDeliveryAt)}
                  {result ? (
                    <span
                      className={cn(
                        'ml-2',
                        result.ok ? 'text-[var(--color-sev-strong)]' : 'text-destructive',
                      )}
                    >
                      · Test: {result.label}
                    </span>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Webhook löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Endpoint erhält keine Events mehr. Das lässt sich nicht
              rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const t = deleteTarget;
                setDeleteTarget(null);
                if (t) onDelete(t);
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
