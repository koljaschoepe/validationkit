/**
 * Webhook-subscribable event catalog (client-safe — no server-only / DB
 * imports, so the create-UI can render the checkboxes). Keep these ids in sync
 * with @vk/inngest `EventType` (the publishEvent fan-out filters on them).
 */
export const WEBHOOK_EVENTS = [
  { id: "audit.completed", label: "Audit abgeschlossen" },
  { id: "audit.failed", label: "Audit fehlgeschlagen" },
  { id: "repo.auto-tracked", label: "Repo automatisch getrackt" },
  { id: "repo.access-changed", label: "Repo-Zugriff geändert" },
] as const;

export type WebhookEventId = (typeof WEBHOOK_EVENTS)[number]["id"];

export const WEBHOOK_EVENT_IDS = new Set<string>(
  WEBHOOK_EVENTS.map((e) => e.id),
);
