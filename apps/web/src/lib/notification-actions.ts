"use server";

import { getDb, isDbEnabled, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { ensureDefaultWorkspace } from "./workspaces";
import {
  getWorkspaceEmailPrefs,
  isNotificationEventId,
  type NotificationEventId,
} from "./notification-prefs";

export async function getNotificationPrefsAction(): Promise<Record<
  NotificationEventId,
  boolean
> | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  return getWorkspaceEmailPrefs(workspaceId);
}

export async function saveNotificationPrefsAction(
  prefs: Record<string, boolean>,
): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database not enabled." };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Bitte zuerst anmelden." };
  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();

  const entries = Object.entries(prefs).filter(([k]) =>
    isNotificationEventId(k),
  );
  for (const [eventId, enabled] of entries) {
    await db
      .insert(schema.notificationPreference)
      .values({ workspaceId, eventId, channel: "email", enabled })
      .onConflictDoUpdate({
        target: [
          schema.notificationPreference.workspaceId,
          schema.notificationPreference.eventId,
          schema.notificationPreference.channel,
        ],
        set: { enabled, updatedAt: new Date() },
      });
  }
  return { ok: true };
}
