import { and, eq, gt } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { getSessionUser } from "@/lib/session";
import { ensureDefaultWorkspace } from "@/lib/workspaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// SSE stream is intentionally short-lived: hit the Fluid Compute cap, let the
// client EventSource auto-reconnect with the `last-event-id` header. The poll
// loop is the right primitive here — Vercel Workflow targets durable
// orchestration, not request-scoped server-sent-events. A8 research.
export const maxDuration = 300;

const POLL_INTERVAL_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 30_000;

interface EventRow {
  id: number;
  type: string;
  payload: unknown;
  createdAt: Date;
}

function formatSse(event: { id: number; type: string; data: unknown }): string {
  return [
    `id: ${event.id}`,
    `event: ${event.type}`,
    `data: ${JSON.stringify(event.data)}`,
    "",
    "",
  ].join("\n");
}

export async function GET(req: Request): Promise<Response> {
  if (!isDbEnabled()) {
    return new Response("Event stream requires the database.", { status: 503 });
  }
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized.", { status: 401 });
  }

  const { id: workspaceId } = await ensureDefaultWorkspace(user.id);
  const db = getDb();

  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  let lastId = sinceParam ? Number(sinceParam) : 0;
  if (!Number.isFinite(lastId) || lastId < 0) lastId = 0;

  const encoder = new TextEncoder();
  let stopped = false;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(": ok\n\n"));

      const tick = async () => {
        if (stopped) return;
        try {
          const rows = await db
            .select({
              id: schema.event.id,
              type: schema.event.type,
              payload: schema.event.payload,
              createdAt: schema.event.createdAt,
            })
            .from(schema.event)
            .where(
              and(
                eq(schema.event.workspaceId, workspaceId),
                gt(schema.event.id, lastId),
              ),
            )
            .orderBy(schema.event.id)
            .limit(50);
          for (const row of rows as EventRow[]) {
            lastId = row.id;
            controller.enqueue(
              encoder.encode(
                formatSse({
                  id: row.id,
                  type: row.type,
                  data: { ...(row.payload as Record<string, unknown>), createdAt: row.createdAt },
                }),
              ),
            );
          }
        } catch (err) {
          console.error("[sse] poll failed", err);
        }
        if (!stopped) {
          pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      };

      heartbeatTimer = setInterval(() => {
        if (stopped) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          stopped = true;
        }
      }, HEARTBEAT_INTERVAL_MS);

      void tick();
    },
    cancel() {
      stopped = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  req.signal.addEventListener("abort", () => {
    stopped = true;
    if (pollTimer) clearTimeout(pollTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
