import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";

/**
 * Per-workspace notification events. Email is the only wired channel for now
 * (Slack/Webhook/In-app land with their delivery infra), so preferences are
 * email-on/off per event. Enforcement today covers `billing.event` (the
 * informational plan-change mail); the other events persist for when their
 * senders exist. Labels/descriptions are German (DACH UI).
 */
export const NOTIFICATION_EVENTS = [
  {
    id: "scan.complete",
    label: "Audit abgeschlossen",
    description: "Ein Audit ist für ein Repo fertig",
  },
  {
    id: "scan.failed",
    label: "Audit fehlgeschlagen",
    description: "Ein Audit ist fehlgeschlagen oder hat ein Timeout",
  },
  {
    id: "finding.kill",
    label: "Kill-Finding",
    description: "Neues Finding der Kill-Stufe entdeckt",
  },
  {
    id: "finding.applied",
    label: "Finding angewandt",
    description: "Patch via PR oder lokal gemerged",
  },
  {
    id: "member.added",
    label: "Mitglied hinzugefügt",
    description: "Neues Teammitglied im Workspace",
  },
  {
    id: "billing.event",
    label: "Billing-Ereignis",
    description: "Tarifwechsel + informative Billing-Mails (keine kritischen Zahlungswarnungen)",
  },
] as const;

export type NotificationEventId = (typeof NOTIFICATION_EVENTS)[number]["id"];

const EVENT_IDS = new Set<string>(NOTIFICATION_EVENTS.map((e) => e.id));

export function isNotificationEventId(v: string): v is NotificationEventId {
  return EVENT_IDS.has(v);
}

/**
 * Opt-out curated defaults (Q-SB-3): critical + low-noise events email by
 * default; high-noise (every scan completes / every applied finding / each new
 * member) is off. A workspace can override any of these.
 */
export const DEFAULT_EMAIL_PREFS: Record<NotificationEventId, boolean> = {
  "scan.complete": false,
  "scan.failed": true,
  "finding.kill": true,
  "finding.applied": false,
  "member.added": false,
  "billing.event": true,
};

/**
 * The workspace's email preferences, starting from {@link DEFAULT_EMAIL_PREFS}
 * and overlaying any stored rows. Used by both the settings UI and the email
 * senders (enforcement).
 */
export async function getWorkspaceEmailPrefs(
  workspaceId: string,
): Promise<Record<NotificationEventId, boolean>> {
  const result = { ...DEFAULT_EMAIL_PREFS };
  if (!isDbEnabled()) return result;
  const db = getDb();
  const rows = await db
    .select({
      eventId: schema.notificationPreference.eventId,
      enabled: schema.notificationPreference.enabled,
    })
    .from(schema.notificationPreference)
    .where(
      and(
        eq(schema.notificationPreference.workspaceId, workspaceId),
        eq(schema.notificationPreference.channel, "email"),
      ),
    );
  for (const r of rows) {
    if (isNotificationEventId(r.eventId)) result[r.eventId] = r.enabled;
  }
  return result;
}

/**
 * Whether the workspace wants an email for this event. Defaults to enabled
 * (fail-open) on any DB error so a preferences hiccup never silently swallows
 * a notification the user expects.
 */
export async function isEmailNotificationEnabled(
  workspaceId: string,
  eventId: NotificationEventId,
): Promise<boolean> {
  try {
    const prefs = await getWorkspaceEmailPrefs(workspaceId);
    return prefs[eventId];
  } catch {
    return DEFAULT_EMAIL_PREFS[eventId];
  }
}
