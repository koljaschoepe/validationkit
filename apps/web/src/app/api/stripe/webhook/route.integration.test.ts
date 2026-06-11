// Integration tests — real Postgres, real handler side-effects, no DB mocks.
//
// Lifecycle:
//   - Each test seeds its own workspace + user + subscription row, runs the
//     webhook handler, then asserts on the resulting DB state.
//   - Idempotency is verified end-to-end by replaying the same event.
//   - External HTTP (Stripe customer-update, Inngest meter-flush) is left
//     unmocked here — handlers that touch the network are exercised in unit
//     tests; this suite focuses on the DB state transitions.
//
// Run with:    pnpm test:integration
// CI:          .github/workflows/ci.yml `integration` job (main-Push only).

import { describe, expect, it, beforeAll, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { signStripeEvent } from "@/test/msw/stripe-mock";

// We hit the real route handler — same import as production.
import { POST } from "./route";

const STRIPE_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

async function callWebhook(eventType: string, object: Record<string, unknown>, eventId?: string): Promise<Response> {
  const { body, signature } = signStripeEvent({
    id: eventId,
    type: eventType,
    data: { object },
  }, STRIPE_SECRET);
  return POST(new Request("https://app.test/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body,
  }));
}

async function createWorkspaceWithUser(): Promise<{ workspaceId: string; userId: string; slug: string }> {
  const db = getDb();
  const userId = `user_${randomUUID()}`;
  await db.insert(schema.user).values({
    id: userId,
    email: `${userId}@test.local`,
    name: "Test User",
    emailVerified: true,
  });
  const slug = `ws-${randomUUID().slice(0, 8)}`;
  const wsRows = await db
    .insert(schema.workspace)
    .values({ name: "Test Workspace", slug, ownerId: userId })
    .returning({ id: schema.workspace.id });
  const workspaceId = wsRows[0]!.id;
  return { workspaceId, userId, slug };
}

describe.skipIf(!isDbEnabled())("POST /api/stripe/webhook (integration)", () => {
  beforeAll(() => {
    if (!STRIPE_SECRET) {
      throw new Error(
        "STRIPE_WEBHOOK_SECRET must be set in .env.test for integration tests.",
      );
    }
  });

  // Wipe the stripe_event ledger between tests so replay-checks have a
  // clean slate. We do NOT truncate workspace/user — each test seeds its
  // own with unique ids to keep them parallel-safe.
  beforeEach(async () => {
    const db = getDb();
    await db.delete(schema.stripeEvent);
  });

  it("checkout.session.completed (subscription) upgrades the workspace tier", async () => {
    const { workspaceId } = await createWorkspaceWithUser();
    const db = getDb();

    const res = await callWebhook("checkout.session.completed", {
      id: `cs_test_${randomUUID().slice(0, 8)}`,
      metadata: { workspaceId, tier: "pro" },
      customer: `cus_test_${randomUUID().slice(0, 8)}`,
      subscription: `sub_test_${randomUUID().slice(0, 8)}`,
      mode: "subscription",
    });

    expect(res.status).toBe(200);
    const subRows = await db
      .select({ tier: schema.subscription.tier, status: schema.subscription.status })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, workspaceId));
    expect(subRows[0]).toMatchObject({ tier: "pro", status: "active" });
  });

  it("replay of the same event.id returns duplicate:true and does NOT re-apply", async () => {
    const { workspaceId } = await createWorkspaceWithUser();
    const eventId = `evt_replay_${randomUUID().slice(0, 8)}`;

    const first = await callWebhook(
      "checkout.session.completed",
      {
        id: `cs_${randomUUID().slice(0, 8)}`,
        metadata: { workspaceId, tier: "starter" },
        customer: `cus_${randomUUID().slice(0, 8)}`,
        subscription: `sub_${randomUUID().slice(0, 8)}`,
        mode: "subscription",
      },
      eventId,
    );
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true });

    // Replay
    const second = await callWebhook(
      "checkout.session.completed",
      {
        id: `cs_${randomUUID().slice(0, 8)}`,
        // Same eventId — should be dropped before reaching handler
        metadata: { workspaceId, tier: "agency" }, // would otherwise upgrade
        customer: `cus_${randomUUID().slice(0, 8)}`,
        subscription: `sub_${randomUUID().slice(0, 8)}`,
        mode: "subscription",
      },
      eventId,
    );
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ ok: true, duplicate: true });

    const db = getDb();
    const subRows = await db
      .select({ tier: schema.subscription.tier })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, workspaceId));
    // Still starter — replay did not re-apply the agency upgrade
    expect(subRows[0]?.tier).toBe("starter");
  });

  it("customer.subscription.deleted downgrades the workspace to free + canceled", async () => {
    const { workspaceId } = await createWorkspaceWithUser();
    const customerId = `cus_${randomUUID().slice(0, 8)}`;
    const subscriptionId = `sub_${randomUUID().slice(0, 8)}`;

    // Seed an active pro subscription via the create-path
    await callWebhook("checkout.session.completed", {
      id: `cs_${randomUUID().slice(0, 8)}`,
      metadata: { workspaceId, tier: "pro" },
      customer: customerId,
      subscription: subscriptionId,
      mode: "subscription",
    });

    const res = await callWebhook("customer.subscription.deleted", {
      id: subscriptionId,
      customer: customerId,
      status: "canceled",
      metadata: { workspaceId },
    });
    expect(res.status).toBe(200);

    const db = getDb();
    const subRows = await db
      .select({ tier: schema.subscription.tier, status: schema.subscription.status })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, workspaceId));
    expect(subRows[0]).toMatchObject({ tier: "free", status: "canceled" });
  });

  it("invoice.payment_failed flips subscription.status to past_due", async () => {
    const { workspaceId } = await createWorkspaceWithUser();
    const customerId = `cus_${randomUUID().slice(0, 8)}`;
    const subscriptionId = `sub_${randomUUID().slice(0, 8)}`;

    await callWebhook("checkout.session.completed", {
      id: `cs_${randomUUID().slice(0, 8)}`,
      metadata: { workspaceId, tier: "starter" },
      customer: customerId,
      subscription: subscriptionId,
      mode: "subscription",
    });

    const res = await callWebhook("invoice.payment_failed", {
      id: `in_${randomUUID().slice(0, 8)}`,
      customer: customerId,
      amount_due: 1900,
      attempt_count: 2,
    });
    expect(res.status).toBe(200);

    const db = getDb();
    const subRows = await db
      .select({ status: schema.subscription.status })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, workspaceId));
    expect(subRows[0]?.status).toBe("past_due");
  });

  // ── invoice.paid grant path (second-opinion audit: previously untested) ──

  it("invoice.paid grants the monthly quota + resets the cycle counter", async () => {
    const { workspaceId } = await createWorkspaceWithUser();
    const customerId = `cus_${randomUUID().slice(0, 8)}`;
    const subscriptionId = `sub_${randomUUID().slice(0, 8)}`;
    const db = getDb();

    await callWebhook("checkout.session.completed", {
      id: `cs_${randomUUID().slice(0, 8)}`,
      metadata: { workspaceId, tier: "starter", cycle: "monthly" },
      customer: customerId,
      subscription: subscriptionId,
      mode: "subscription",
    });
    // Burn some credits so the cycle reset is observable.
    await db
      .update(schema.subscription)
      .set({ creditsUsedThisPeriod: 7 })
      .where(eq(schema.subscription.workspaceId, workspaceId));

    const invoiceId = `in_${randomUUID().slice(0, 8)}`;
    const res = await callWebhook("invoice.paid", {
      id: invoiceId,
      customer: customerId,
      // dahlia shape: subscription ref lives under parent.subscription_details
      parent: { subscription_details: { subscription: subscriptionId } },
    });
    expect(res.status).toBe(200);

    const subRows = await db
      .select({
        used: schema.subscription.creditsUsedThisPeriod,
        quota: schema.subscription.creditsQuotaPerCycle,
        cycle: schema.subscription.billingCycle,
      })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, workspaceId));
    expect(subRows[0]).toMatchObject({ used: 0, quota: 50, cycle: "monthly" });

    const ledger = await db
      .select({
        delta: schema.creditLedger.delta,
        reason: schema.creditLedger.reason,
        referenceId: schema.creditLedger.referenceId,
      })
      .from(schema.creditLedger)
      .where(eq(schema.creditLedger.workspaceId, workspaceId));
    expect(ledger).toHaveLength(1);
    expect(ledger[0]).toMatchObject({
      delta: 50,
      reason: "monthly_grant",
      referenceId: invoiceId,
    });
  });

  it("annual checkout stores billing_cycle and grants the full year up-front (S2-01)", async () => {
    const { workspaceId } = await createWorkspaceWithUser();
    const customerId = `cus_${randomUUID().slice(0, 8)}`;
    const subscriptionId = `sub_${randomUUID().slice(0, 8)}`;
    const db = getDb();

    await callWebhook("checkout.session.completed", {
      id: `cs_${randomUUID().slice(0, 8)}`,
      metadata: { workspaceId, tier: "starter", cycle: "annual" },
      customer: customerId,
      subscription: subscriptionId,
      mode: "subscription",
    });

    const subRows = await db
      .select({
        quota: schema.subscription.creditsQuotaPerCycle,
        cycle: schema.subscription.billingCycle,
      })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, workspaceId));
    // Starter = 50/month → 600 for the annual cycle (invoice.paid fires 1×/yr)
    expect(subRows[0]).toMatchObject({ quota: 600, cycle: "annual" });

    const invoiceId = `in_${randomUUID().slice(0, 8)}`;
    await callWebhook("invoice.paid", {
      id: invoiceId,
      customer: customerId,
      parent: { subscription_details: { subscription: subscriptionId } },
    });
    const ledger = await db
      .select({ delta: schema.creditLedger.delta })
      .from(schema.creditLedger)
      .where(eq(schema.creditLedger.workspaceId, workspaceId));
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.delta).toBe(600);
  });

  // ── stripe_event state machine (S3-01) ──

  it("a 'failed' event is re-processed on retry instead of duplicate-dropping (S3-01)", async () => {
    const { workspaceId } = await createWorkspaceWithUser();
    const eventId = `evt_fail_${randomUUID().slice(0, 8)}`;
    const db = getDb();
    // Simulate a first delivery whose handler crashed after the row insert.
    await db.insert(schema.stripeEvent).values({
      id: eventId,
      type: "checkout.session.completed",
      status: "failed",
    });

    const res = await callWebhook(
      "checkout.session.completed",
      {
        id: `cs_${randomUUID().slice(0, 8)}`,
        metadata: { workspaceId, tier: "pro" },
        customer: `cus_${randomUUID().slice(0, 8)}`,
        subscription: `sub_${randomUUID().slice(0, 8)}`,
        mode: "subscription",
      },
      eventId,
    );
    expect(res.status).toBe(200);
    // Re-processed — NOT swallowed as duplicate.
    expect(await res.json()).toEqual({ ok: true });

    const subRows = await db
      .select({ tier: schema.subscription.tier })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, workspaceId));
    expect(subRows[0]?.tier).toBe("pro");
    const evtRows = await db
      .select({ status: schema.stripeEvent.status })
      .from(schema.stripeEvent)
      .where(eq(schema.stripeEvent.id, eventId));
    expect(evtRows[0]?.status).toBe("processed");
  });

  it("an in-flight 'processing' duplicate gets a 500; a stale one is re-claimed", async () => {
    const { workspaceId } = await createWorkspaceWithUser();
    const eventId = `evt_proc_${randomUUID().slice(0, 8)}`;
    const db = getDb();
    const payload = {
      id: `cs_${randomUUID().slice(0, 8)}`,
      metadata: { workspaceId, tier: "starter" },
      customer: `cus_${randomUUID().slice(0, 8)}`,
      subscription: `sub_${randomUUID().slice(0, 8)}`,
      mode: "subscription",
    };

    // Fresh 'processing' row → first delivery still in flight → 500 so
    // Stripe retries later instead of getting a duplicate-OK.
    await db.insert(schema.stripeEvent).values({
      id: eventId,
      type: "checkout.session.completed",
      status: "processing",
    });
    const inflight = await callWebhook(
      "checkout.session.completed",
      payload,
      eventId,
    );
    expect(inflight.status).toBe(500);

    // Stale 'processing' (crashed mid-handler) → re-claimed + processed.
    await db
      .update(schema.stripeEvent)
      .set({ processedAt: new Date(Date.now() - 6 * 60_000) })
      .where(eq(schema.stripeEvent.id, eventId));
    const retried = await callWebhook(
      "checkout.session.completed",
      payload,
      eventId,
    );
    expect(retried.status).toBe(200);
    expect(await retried.json()).toEqual({ ok: true });
    const subRows = await db
      .select({ tier: schema.subscription.tier })
      .from(schema.subscription)
      .where(eq(schema.subscription.workspaceId, workspaceId));
    expect(subRows[0]?.tier).toBe("starter");
  });

  it("replaying a failed invoice.paid grants the credits exactly once (idempotency net)", async () => {
    const { workspaceId } = await createWorkspaceWithUser();
    const customerId = `cus_${randomUUID().slice(0, 8)}`;
    const subscriptionId = `sub_${randomUUID().slice(0, 8)}`;
    const db = getDb();

    await callWebhook("checkout.session.completed", {
      id: `cs_${randomUUID().slice(0, 8)}`,
      metadata: { workspaceId, tier: "starter", cycle: "monthly" },
      customer: customerId,
      subscription: subscriptionId,
      mode: "subscription",
    });

    const invoiceId = `in_${randomUUID().slice(0, 8)}`;
    const eventId = `evt_inv_${randomUUID().slice(0, 8)}`;
    const invoice = {
      id: invoiceId,
      customer: customerId,
      parent: { subscription_details: { subscription: subscriptionId } },
    };
    const first = await callWebhook("invoice.paid", invoice, eventId);
    expect(first.status).toBe(200);

    // Simulate a crash AFTER the grant landed but before the event row was
    // marked processed — the retry must re-run the handler and the 0016
    // idempotency index must keep the ledger at exactly one grant row.
    await db
      .update(schema.stripeEvent)
      .set({ status: "failed" })
      .where(eq(schema.stripeEvent.id, eventId));
    const replay = await callWebhook("invoice.paid", invoice, eventId);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual({ ok: true });

    const ledger = await db
      .select({ id: schema.creditLedger.id })
      .from(schema.creditLedger)
      .where(eq(schema.creditLedger.workspaceId, workspaceId));
    expect(ledger).toHaveLength(1);
  });
});
