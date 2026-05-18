import { getDb, schema } from "@vk/db";

export type EventType =
  | "audit.completed"
  | "audit.failed"
  | "drift.completed"
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
}
