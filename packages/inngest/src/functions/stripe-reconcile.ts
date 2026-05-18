import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { getDb, schema } from "@vk/db";
import { TIERS, type TierId } from "@vk/billing";
import { inngest } from "../client.js";
import { publishEvent } from "../events.js";

/**
 * Sprint 1.1 — nightly Stripe reconciliation cron (A3 finding #6).
 *
 * Webhooks are at-least-once with PK idempotency at our side. Silent drops
 * (cold-start timeout > 25 s, DB outage during handler) can still leave the
 * `subscription` table behind the live Stripe state. This job paginates
 * stripe.subscriptions.list and logs the deltas it finds. It does NOT
 * auto-fix — the goal is detection + audit-log, not silent state-mutation.
 *
 * Skips gracefully without STRIPE_SECRET_KEY. Runs at 03:00 UTC daily.
 */

interface StripeSubscriptionLike {
  id: string;
  status: string;
  customer: string | { id: string } | null;
  metadata?: Record<string, string | undefined>;
}

function customerIdOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    return String((value as { id: unknown }).id);
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripeReconcile: any = inngest.createFunction(
  {
    id: "stripe-reconcile",
    triggers: [{ cron: "0 3 * * *" }],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: any) => {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { skipped: true, reason: "STRIPE_SECRET_KEY unset" };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
      appInfo: { name: "ValidationKit", version: "0.0.16" },
    });

    const db = getDb();
    let cursor: string | undefined;
    let pageCount = 0;
    let driftCount = 0;
    let scanned = 0;

    while (pageCount < 50) {
      const page: { data: StripeSubscriptionLike[]; has_more: boolean } =
        await step.run(`page-${pageCount}`, async () => {
          const result = await stripe.subscriptions.list({
            status: "all",
            limit: 100,
            ...(cursor ? { starting_after: cursor } : {}),
          });
          return {
            data: result.data as unknown as StripeSubscriptionLike[],
            has_more: result.has_more,
          };
        });

      for (const sub of page.data) {
        scanned += 1;
        const userId = sub.metadata?.userId;
        if (!userId) continue;
        const tier = (sub.metadata?.tier as TierId | undefined) ?? "free";

        const rows = await db
          .select({
            id: schema.subscription.id,
            tier: schema.subscription.tier,
            status: schema.subscription.status,
            workspaceId: schema.subscription.id, // placeholder; workspaceId picked below
          })
          .from(schema.subscription)
          .where(eq(schema.subscription.userId, userId))
          .limit(1);

        const dbRow = rows[0];
        const tierDrift = !dbRow || dbRow.tier !== tier;
        const statusDrift = !dbRow || dbRow.status !== sub.status;

        if (!tierDrift && !statusDrift) continue;
        driftCount += 1;

        const workspaceRows = await db
          .select({ id: schema.workspace.id })
          .from(schema.workspace)
          .where(eq(schema.workspace.ownerId, userId))
          .limit(1);
        const workspaceId = workspaceRows[0]?.id;
        if (!workspaceId) continue;

        await publishEvent({
          workspaceId,
          type: "audit.failed",
          payload: {
            source: "stripe-reconcile",
            kind: "subscription.drift",
            userId,
            stripeSubscriptionId: sub.id,
            stripeStatus: sub.status,
            stripeTier: tier,
            dbTier: dbRow?.tier ?? null,
            dbStatus: dbRow?.status ?? null,
            stripeCustomerId: customerIdOf(sub.customer),
            recommendedAction: tierConfigKnown(tier)
              ? "auto-fix via webhook replay or manual sync"
              : "stripe tier metadata unknown — investigate",
          },
        });
      }

      if (!page.has_more || page.data.length === 0) break;
      cursor = page.data[page.data.length - 1]?.id;
      pageCount += 1;
    }

    return {
      ok: true,
      scanned,
      driftCount,
      pages: pageCount + 1,
    };
  },
);

function tierConfigKnown(tier: string): boolean {
  return tier in TIERS;
}
