import { eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { inngest, onFailureHandler } from "@vk/inngest";
import { postSignedWebhook } from "../webhook-sign";

/**
 * Block C — outbound webhook delivery. `publishEvent` fans an event out by
 * enqueuing one `webhook/deliver` per subscribed webhook; this worker loads the
 * webhook, signs + POSTs the payload, persists the HTTP status, and throws on a
 * non-2xx so Inngest retries (transient receiver errors recover). After the
 * retries are exhausted, onFailure marks the webhook's last status failed.
 *
 * App-local (not @vk/inngest) because the signing + SSRF helpers live in
 * apps/web; registered alongside the package functions in /api/inngest.
 */
const logFailure = onFailureHandler("webhook-deliver");

export const webhookDeliver: any = inngest.createFunction(
  {
    id: "webhook-deliver",
    triggers: [{ event: "webhook/deliver" }],
    retries: 4,
    onFailure: async (ctx: any) => {
      const webhookId: string | undefined =
        ctx?.event?.data?.event?.data?.webhookId ?? ctx?.event?.data?.webhookId;
      if (webhookId && isDbEnabled()) {
        try {
          const db = getDb();
          await db
            .update(schema.webhook)
            .set({ lastStatus: "failed", lastDeliveryAt: new Date() })
            .where(eq(schema.webhook.id, webhookId));
        } catch {
          // best-effort — the structured log below still fires.
        }
      }
      await logFailure(ctx);
    },
  },
  async ({ event }: any) => {
    const { webhookId, eventType, payload } = event.data as {
      webhookId: string;
      eventType: string;
      payload: Record<string, unknown>;
    };
    if (!isDbEnabled()) return { ok: false, skipped: true };

    const db = getDb();
    const rows = await db
      .select()
      .from(schema.webhook)
      .where(eq(schema.webhook.id, webhookId))
      .limit(1);
    const wh = rows[0];
    if (!wh || !wh.enabled) return { ok: false, skipped: true };

    const body = JSON.stringify({
      type: eventType,
      data: payload,
      timestamp: Math.floor(Date.now() / 1000),
    });
    const result = await postSignedWebhook(wh.url, wh.secret, body);

    await db
      .update(schema.webhook)
      .set({
        lastStatus: result.ok
          ? String(result.status)
          : (result.error ?? "failed"),
        lastDeliveryAt: new Date(),
      })
      .where(eq(schema.webhook.id, wh.id));

    if (!result.ok) {
      throw new Error(
        `Webhook ${webhookId} delivery failed: ${result.error ?? "unknown"}`,
      );
    }
    return { ok: true, status: result.status };
  },
);
