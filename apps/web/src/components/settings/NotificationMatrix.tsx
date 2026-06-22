'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { saveNotificationPrefsAction } from '@/lib/notification-actions';

/**
 * NotificationMatrix — per-workspace email notification preferences.
 *
 * Block C (settings backend): email is the only wired channel today, so this
 * is a per-event on/off list, persisted to `notification_preference`. The
 * event list + initial values come from the server page (the events config
 * lives in the server-only lib/notification-prefs). Slack/Webhook/In-app
 * columns return once their delivery infra exists.
 */

export interface NotificationEvent {
  id: string;
  label: string;
  description: string;
}

export function NotificationMatrix({
  events,
  initial,
}: {
  events: ReadonlyArray<NotificationEvent>;
  initial: Record<string, boolean>;
}) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(initial);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(eventId: string) {
    setPrefs((prev) => ({ ...prev, [eventId]: !prev[eventId] }));
    setDirty(true);
  }

  function save() {
    startTransition(async () => {
      const res = await saveNotificationPrefsAction(prefs);
      if (!res.ok) {
        toast.error(res.error ?? 'Speichern fehlgeschlagen.');
        return;
      }
      setDirty(false);
      toast.success('Benachrichtigungen gespeichert.');
    });
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border/60">
        {events.map((ev) => {
          const on = prefs[ev.id] ?? false;
          return (
            <li
              key={ev.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {ev.label}
                </p>
                <p className="type-mono-sm text-muted-foreground">
                  {ev.description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`${ev.label} per E-Mail`}
                onClick={() => toggle(ev.id)}
                className={cn(
                  'inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border transition-colors',
                  on ? 'bg-foreground/85' : 'bg-card',
                )}
              >
                <span
                  className={cn(
                    'block size-3.5 rounded-full bg-background transition-transform',
                    on ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3">
        <p className="type-mono-sm text-muted-foreground">
          Kanal: E-Mail. Slack / Webhook / In-app folgen mit ihrer Infra.
        </p>
        <Button size="sm" onClick={save} disabled={!dirty || pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Speichere…
            </>
          ) : (
            'Speichern'
          )}
        </Button>
      </div>
    </div>
  );
}
