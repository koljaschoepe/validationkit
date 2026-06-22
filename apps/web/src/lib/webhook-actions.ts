"use server";

import { and, desc, eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { ensureDefaultWorkspace } from "./workspaces";
import {
  generateWebhookSecret,
  isAllowedWebhookUrl,
  postSignedWebhook,
} from "./webhook-sign";
import { WEBHOOK_EVENT_IDS } from "./webhook-events";

export interface WebhookListItem {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  secret: string;
  lastStatus: string | null;
  lastDeliveryAt: string | null;
  createdAt: string;
}

function sanitizeEvents(events: unknown): string[] {
  if (!Array.isArray(events)) return [];
  return [
    ...new Set(
      events.filter(
        (e): e is string => typeof e === "string" && WEBHOOK_EVENT_IDS.has(e),
      ),
    ),
  ];
}

export async function listWebhooksAction(): Promise<WebhookListItem[]> {
  if (!isDbEnabled()) return [];
  const user = await getSessionUser();
  if (!user) return [];
  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.webhook)
    .where(eq(schema.webhook.workspaceId, workspaceId))
    .orderBy(desc(schema.webhook.createdAt));
  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    events: Array.isArray(r.events) ? (r.events as string[]) : [],
    enabled: r.enabled,
    secret: r.secret,
    lastStatus: r.lastStatus,
    lastDeliveryAt: r.lastDeliveryAt ? r.lastDeliveryAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export type CreateWebhookResult =
  | { ok: true; item: WebhookListItem }
  | { ok: false; error: string };

export async function createWebhookAction(
  url: string,
  events: string[],
): Promise<CreateWebhookResult> {
  if (!isDbEnabled()) return { ok: false, error: "Database not enabled." };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Bitte zuerst anmelden." };
  const trimmed = url.trim();
  if (!isAllowedWebhookUrl(trimmed)) {
    return {
      ok: false,
      error:
        "URL muss eine öffentliche https://-Adresse sein (keine localhost/internen Hosts).",
    };
  }
  const ev = sanitizeEvents(events);
  if (ev.length === 0) {
    return { ok: false, error: "Wähle mindestens einen Event-Typ." };
  }

  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();
  const secret = generateWebhookSecret();
  const inserted = await db
    .insert(schema.webhook)
    .values({ workspaceId, url: trimmed, secret, events: ev, enabled: true })
    .returning({
      id: schema.webhook.id,
      createdAt: schema.webhook.createdAt,
    });
  const row = inserted[0];
  if (!row) return { ok: false, error: "Webhook konnte nicht erstellt werden." };

  return {
    ok: true,
    item: {
      id: row.id,
      url: trimmed,
      events: ev,
      enabled: true,
      secret,
      lastStatus: null,
      lastDeliveryAt: null,
      createdAt: row.createdAt.toISOString(),
    },
  };
}

export async function deleteWebhookAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database not enabled." };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Bitte zuerst anmelden." };
  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();
  await db
    .delete(schema.webhook)
    .where(
      and(eq(schema.webhook.id, id), eq(schema.webhook.workspaceId, workspaceId)),
    );
  return { ok: true };
}

export async function toggleWebhookAction(
  id: string,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database not enabled." };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Bitte zuerst anmelden." };
  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();
  await db
    .update(schema.webhook)
    .set({ enabled })
    .where(
      and(eq(schema.webhook.id, id), eq(schema.webhook.workspaceId, workspaceId)),
    );
  return { ok: true };
}

export interface TestWebhookResult {
  ok: boolean;
  status?: number;
  error?: string;
}

/** Synchronous test-ping (Q-SB-2): POST a webhook.test event + return the
 *  HTTP outcome inline, and persist it as the webhook's last status. */
export async function testWebhookAction(
  id: string,
): Promise<TestWebhookResult> {
  if (!isDbEnabled()) return { ok: false, error: "Database not enabled." };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Bitte zuerst anmelden." };
  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.webhook)
    .where(
      and(eq(schema.webhook.id, id), eq(schema.webhook.workspaceId, workspaceId)),
    )
    .limit(1);
  const wh = rows[0];
  if (!wh) return { ok: false, error: "Webhook nicht gefunden." };
  if (!isAllowedWebhookUrl(wh.url)) {
    return { ok: false, error: "URL ist nicht (mehr) erlaubt." };
  }

  const body = JSON.stringify({
    type: "webhook.test",
    data: { message: "Test-Event von ValidationKit." },
    timestamp: Math.floor(Date.now() / 1000),
  });
  const result = await postSignedWebhook(wh.url, wh.secret, body);

  await db
    .update(schema.webhook)
    .set({
      lastStatus: result.ok ? String(result.status) : (result.error ?? "failed"),
      lastDeliveryAt: new Date(),
    })
    .where(eq(schema.webhook.id, wh.id));

  return result.ok
    ? { ok: true, status: result.status ?? undefined }
    : { ok: false, status: result.status ?? undefined, error: result.error };
}
