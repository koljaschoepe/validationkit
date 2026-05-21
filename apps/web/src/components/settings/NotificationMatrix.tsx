'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * NotificationMatrix — Event × Channel toggle-grid for per-workspace
 * notification preferences. Rows are events, columns are channels. Each
 * cell is a Switch-style toggle.
 *
 * Phase Nova-2 P5: UI-only preview. Save-action wires up in the backend
 * sub-plan along with the `notification_preference` table.
 */

const EVENTS = [
  { id: 'scan.complete', label: 'Scan complete', description: 'Audit finishes for any repo' },
  { id: 'scan.failed', label: 'Scan failed', description: 'Audit errored or timed out' },
  { id: 'finding.kill', label: 'Kill-severity finding', description: 'New Kill-band finding detected' },
  { id: 'finding.applied', label: 'Finding applied', description: 'Patch merged via PR or local' },
  { id: 'member.added', label: 'Member added', description: 'New teammate joined the workspace' },
  { id: 'billing.event', label: 'Billing event', description: 'Tier change, invoice, payment fail' },
] as const;

const CHANNELS = [
  { id: 'email', label: 'Email' },
  { id: 'slack', label: 'Slack' },
  { id: 'webhook', label: 'Webhook' },
  { id: 'in-app', label: 'In-app' },
] as const;

type EventId = (typeof EVENTS)[number]['id'];
type ChannelId = (typeof CHANNELS)[number]['id'];
type Matrix = Record<EventId, Record<ChannelId, boolean>>;

const DEFAULT_MATRIX: Matrix = EVENTS.reduce((acc, ev) => {
  acc[ev.id] = CHANNELS.reduce((cAcc, ch) => {
    // Sane defaults: kill = email + slack, scan complete = in-app only
    cAcc[ch.id] =
      ev.id === 'finding.kill' && (ch.id === 'email' || ch.id === 'slack');
    return cAcc;
  }, {} as Record<ChannelId, boolean>);
  return acc;
}, {} as Matrix);

export function NotificationMatrix({
  initial = DEFAULT_MATRIX,
  disabled = false,
  onChange,
}: {
  initial?: Matrix;
  disabled?: boolean;
  onChange?: (next: Matrix) => void;
}) {
  const [matrix, setMatrix] = useState<Matrix>(initial);

  function toggle(eventId: EventId, channelId: ChannelId) {
    if (disabled) return;
    const next: Matrix = {
      ...matrix,
      [eventId]: {
        ...matrix[eventId],
        [channelId]: !matrix[eventId][channelId],
      },
    };
    setMatrix(next);
    onChange?.(next);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px]">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-3 font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
              Event
            </th>
            {CHANNELS.map((c) => (
              <th
                key={c.id}
                className="px-2 py-2 text-center font-mono type-mono-sm uppercase tracking-wider text-muted-foreground"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {EVENTS.map((ev) => (
            <tr key={ev.id} className="border-b border-border/50">
              <td className="py-3 pr-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{ev.label}</p>
                  <p className="type-mono-sm text-muted-foreground">
                    {ev.description}
                  </p>
                </div>
              </td>
              {CHANNELS.map((ch) => {
                const on = matrix[ev.id][ch.id];
                return (
                  <td key={ch.id} className="px-2 py-3 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`${ev.label} via ${ch.label}`}
                      disabled={disabled}
                      onClick={() => toggle(ev.id, ch.id)}
                      className={cn(
                        'inline-flex h-5 w-9 items-center rounded-full border border-border transition-colors',
                        on ? 'bg-foreground/85' : 'bg-card',
                        disabled && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <span
                        className={cn(
                          'block size-3.5 rounded-full bg-background transition-transform',
                          on ? 'translate-x-4' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
