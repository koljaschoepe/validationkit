import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { inngest, isInngestEnabled } from "./client.js";

export type EventType =
  | "audit.completed"
  | "audit.failed"
  | "repo.auto-tracked"
  | "repo.access-changed";

export interface EventInsert {
  workspaceId: string;
  type: EventType;
  payload: Record<string, unknown>;
}

export async function publishEvent(input: EventInsert): Promise<void> {
  const db = getDb();
  await db.insert(schema.event).values({
    workspaceId: input.workspaceId,
    type: input.type,
    payload: input.payload,
  });

  // Block C — fan the event out to subscribed outbound webhooks (one
  // webhook/deliver job each). Best-effort: a webhook lookup/enqueue problem
  // must never break the event write above.
  if (!isInngestEnabled()) return;
  try {
    const hooks = await db
      .select({ id: schema.webhook.id, events: schema.webhook.events })
      .from(schema.webhook)
      .where(
        and(
          eq(schema.webhook.workspaceId, input.workspaceId),
          eq(schema.webhook.enabled, true),
        ),
      );
    for (const h of hooks) {
      const events = Array.isArray(h.events) ? (h.events as string[]) : [];
      if (!events.includes(input.type)) continue;
      await inngest.send({
        name: "webhook/deliver",
        data: {
          webhookId: h.id,
          eventType: input.type,
          payload: input.payload,
        },
      });
    }
  } catch {
    // best-effort fan-out
  }
}
