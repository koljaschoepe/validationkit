import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { getDb, schema } from "@vk/db";
import { TIERS, type TierId, grantCredits } from "@vk/billing";
import { inngest } from "../client.js";
import { onFailureHandler } from "../on-failure.js";
import { publishEvent } from "../events.js";

/**
 * Sprint 1.1 — nightly Stripe reconciliation cron (A3 finding #6).
 *
 * Webhooks are at-least-once with PK idempotency at our side. Silent drops
 * (cold-start timeout > 25 s, DB outage during handler) can still leave the
 * `subscription` table behind the live Stripe state. This job paginates
 * stripe.subscriptions.list and logs the deltas it finds. Tier/status drift
 * is detected + audit-logged, NOT auto-fixed.
 *
 * Second-opinion audit additions:
 *  - S2-05: missing monthly credit grants ARE healed — for each sub's latest
 *    paid invoice we verify a `monthly_grant` ledger row exists and re-grant
 *    idempotently if not (a healed grant means a webhook was lost; warn-log
 *    it loudly). grantCredits' 0016 idempotency index makes this re-entrant.
 *  - S3-04: a deleted workspace whose Stripe sub survives used to crash the
 *    whole run via the `event` FK (poison record, every night). Orphans are
 *    now detected + skipped, and per-sub work is step-wrapped so one bad
 *    record can't kill the sweep.
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
    onFailure: onFailureHandler("stripe-reconcile"),
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
    let orphanCount = 0;
    let healedCount = 0;

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
        // Sub-Plan-A: subscriptions are workspace-scoped. Sub-Plan-B will
        // expand this cron to flush pending meter events and handle Auto-
        // Overage drifts; for now we just detect tier/status mismatches.
        const workspaceId = sub.metadata?.workspaceId;
        if (!workspaceId) continue;
        const tier = (sub.metadata?.tier as TierId | undefined) ?? "free";

        // S3-04: workspace deletion cascades the subscription row but the
        // Stripe subscription (and its metadata.workspaceId) lives on. A
        // publishEvent against the dead id violates the event→workspace FK
        // and used to fail the whole run, every night, on the same record.
        const wsRows = await db
          .select({ id: schema.workspace.id })
          .from(schema.workspace)
          .where(eq(schema.workspace.id, workspaceId))
          .limit(1);
        if (wsRows.length === 0) {
          orphanCount += 1;
          console.warn(
            `[stripe-reconcile] orphaned stripe subscription ${sub.id} → workspace ${workspaceId} no longer exists (status ${sub.status}) — skipping`,
          );
          continue;
        }

        const rows = await db
          .select({
            id: schema.subscription.id,
            tier: schema.subscription.tier,
            status: schema.subscription.status,
            workspaceId: schema.subscription.workspaceId,
            creditsQuotaPerCycle: schema.subscription.creditsQuotaPerCycle,
            updatedAt: schema.subscription.updatedAt,
          })
          .from(schema.subscription)
          .where(eq(schema.subscription.workspaceId, workspaceId))
          .limit(1);

        const dbRow = rows[0];

        // S2-05: heal lost monthly grants. If the latest PAID invoice of
        // this sub has no matching `monthly_grant` ledger row, the webhook
        // was lost — re-grant idempotently. Step-wrapped (E3) so a failure
        // on one sub never kills the rest of the sweep, and memoized across
        // Inngest retries.
        if (dbRow && (sub.status === "active" || sub.status === "past_due")) {
          const heal: { healed: boolean; invoiceId?: string } = await step.run(
            `heal-grant-${sub.id}`,
            async () => {
              const invoices = await stripe.invoices.list({
                subscription: sub.id,
                status: "paid",
                limit: 1,
              });
              const latest = invoices.data[0];
              if (!latest?.id) return { healed: false };
              const ledger = await db
                .select({ id: schema.creditLedger.id })
                .from(schema.creditLedger)
                .where(
                  and(
                    eq(schema.creditLedger.workspaceId, workspaceId),
                    eq(schema.creditLedger.reason, "monthly_grant"),
                    eq(schema.creditLedger.referenceId, latest.id),
                  ),
                )
                .limit(1);
              if (ledger.length > 0) return { healed: false };
              // grantCredits resets creditsUsedThisPeriod and writes the
              // ledger row; the 0016 partial-unique index makes a replay a
              // no-op, so racing the webhook is harmless.
              await grantCredits({
                workspaceId,
                amount: dbRow.creditsQuotaPerCycle,
                reason: "monthly_grant",
                referenceId: latest.id,
              });
              return { healed: true, invoiceId: latest.id };
            },
          );
          if (heal.healed) {
            healedCount += 1;
            // A healed grant means a paid invoice's webhook got lost — that
            // is an incident signal, not routine maintenance. Warn loudly.
            console.warn(
              `[stripe-reconcile] HEALED missing monthly grant for workspace ${workspaceId} (invoice ${heal.invoiceId}) — a paid webhook was lost upstream`,
            );
          }
        }

        // Sub-Plan-B: 5-minute settle window — webhook delivery + replay
        // takes a moment; treat anything updated in the last 5 minutes as
        // still propagating and not a real drift.
        if (
          dbRow &&
          dbRow.updatedAt &&
          Date.now() - dbRow.updatedAt.getTime() < 5 * 60 * 1000
        ) {
          continue;
        }

        const tierDrift = !dbRow || dbRow.tier !== tier;
        const statusDrift = !dbRow || dbRow.status !== sub.status;

        if (!tierDrift && !statusDrift) continue;
        driftCount += 1;

        // S3-04 (part 2): step-wrapped so a publish failure on one record
        // is retried/isolated instead of aborting the whole function run.
        await step.run(`drift-event-${sub.id}`, async () => {
          await publishEvent({
            workspaceId,
            type: "audit.failed",
            payload: {
              source: "stripe-reconcile",
              kind: "subscription.drift",
              workspaceId,
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
      orphanCount,
      healedCount,
      pages: pageCount + 1,
    };
  },
);

function tierConfigKnown(tier: string): boolean {
  return tier in TIERS;
}
