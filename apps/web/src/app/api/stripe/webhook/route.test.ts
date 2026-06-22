// Unit tests for the Stripe webhook route handler.
//
// All external collaborators (DB, Stripe-SDK, Inngest, Auth-email helpers,
// Billing-credits) are mocked via vi.mock. The actual handler logic — env
// gating, signature verification, idempotent insert, switch-on-event-type —
// runs unmocked.
//
// Integration coverage (real Postgres, real handler side-effects) lives in
// route.integration.test.ts.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { signStripeEvent } from "@/test/msw/stripe-mock";

// ---- vi.mock setup ---- --------------------------------------------------
// The DB-layer is module-mocked so we control the idempotency-insert return
// value per test. `getDb` returns a chainable stub.

const insertReturning = vi.fn();
const selectLimit = vi.fn();
const updateReturning = vi.fn();
// `await db.update().set().where()` (state-mark) and `…where().returning()`
// (atomic re-claim, S3-01) both occur — return a promise that ALSO exposes
// .returning so either chain works.
const updateWhere = vi.fn(() => {
  const result = Promise.resolve(undefined) as Promise<undefined> & {
    returning: typeof updateReturning;
  };
  result.returning = updateReturning;
  return result;
});

function chainableInsert() {
  return {
    values: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    returning: insertReturning,
  };
}

function chainableSelect() {
  return {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: selectLimit,
  };
}

function chainableUpdate() {
  return {
    set: vi.fn().mockReturnThis(),
    where: updateWhere,
  };
}

vi.mock("@vk/db", () => ({
  isDbEnabled: vi.fn(() => true),
  schema: {
    stripeEvent: {
      id: "stripeEvent.id",
      status: "stripeEvent.status",
      processedAt: "stripeEvent.processedAt",
    },
    subscription: {
      workspaceId: "subscription.workspaceId",
      tier: "subscription.tier",
      creditsQuotaPerCycle: "subscription.creditsQuotaPerCycle",
      stripeCustomerId: "subscription.stripeCustomerId",
    },
    user: { id: "user.id", email: "user.email" },
    workspace: { id: "workspace.id", name: "workspace.name", slug: "workspace.slug", ownerId: "workspace.ownerId" },
    prepaidCreditGrant: { stripeInvoiceId: "prepaidCreditGrant.stripeInvoiceId", id: "prepaidCreditGrant.id" },
  },
  getDb: vi.fn(() => ({
    insert: vi.fn(() => chainableInsert()),
    select: vi.fn(() => chainableSelect()),
    update: vi.fn(() => chainableUpdate()),
  })),
}));

vi.mock("@vk/billing", () => ({
  TIERS: {
    free: { label: "Free", creditsPerCycle: 5 },
    starter: { label: "Starter", creditsPerCycle: 50 },
    pro: { label: "Pro", creditsPerCycle: 200 },
    agency: { label: "Agency", creditsPerCycle: 1000 },
  },
  grantCredits: vi.fn(() => Promise.resolve()),
}));

vi.mock("@vk/inngest", () => ({
  flushPendingForCustomer: vi.fn(() => Promise.resolve()),
}));

vi.mock("@vk/auth", () => ({
  PlanChangeConfirmation: () => null,
  SubscriptionPastDue: () => null,
  sendTransactionalEmail: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/stripe", () => ({
  isStripeEnabled: vi.fn(() => true),
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn((rawBody: string, _sig: string, _secret: string) => {
        // The unit tests pass pre-signed bodies; we trust the signer helper
        // and parse the body straight back.
        return JSON.parse(rawBody);
      }),
    },
  })),
}));

// notification-prefs is server-only; mock it so the route imports cleanly under
// the app's vitest config and billing.event-gated mails default to "send".
vi.mock("@/lib/notification-prefs", () => ({
  isEmailNotificationEnabled: vi.fn(() => Promise.resolve(true)),
}));

// drizzle-orm operators are referentially-transparent here — we don't
// inspect the filters, just count the calls.
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  or: vi.fn((...args: unknown[]) => ({ or: args })),
  lt: vi.fn((col, val) => ({ lt: [col, val] })),
}));

// ---- helpers ---- --------------------------------------------------------

async function callRoute(body: string, signature: string): Promise<Response> {
  const { POST } = await import("./route");
  const req = new Request("https://app.test/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body,
  });
  return POST(req);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: insertion succeeds (NOT a replay).
  insertReturning.mockResolvedValue([{ id: "evt_test_id" }]);
  selectLimit.mockResolvedValue([]);
  // Default: a duplicate delivery wins no re-claim (row not failed/stale).
  updateReturning.mockResolvedValue([]);
});

// ---- tests ---- ----------------------------------------------------------

describe("POST /api/stripe/webhook", () => {
  it("503 when isDbEnabled() is false", async () => {
    const { isDbEnabled } = await import("@vk/db");
    vi.mocked(isDbEnabled).mockReturnValueOnce(false);
    const { body, signature } = signStripeEvent({
      type: "invoice.paid",
      data: { object: {} },
    });
    const res = await callRoute(body, signature);
    expect(res.status).toBe(503);
  });

  it("503 when isStripeEnabled() is false", async () => {
    const { isStripeEnabled } = await import("@/lib/stripe");
    vi.mocked(isStripeEnabled).mockReturnValueOnce(false);
    const { body, signature } = signStripeEvent({
      type: "invoice.paid",
      data: { object: {} },
    });
    const res = await callRoute(body, signature);
    expect(res.status).toBe(503);
  });

  it("503 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    const prev = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const { body, signature } = signStripeEvent({
        type: "invoice.paid",
        data: { object: {} },
      });
      const res = await callRoute(body, signature);
      expect(res.status).toBe(503);
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = prev;
    }
  });

  it("400 when Stripe-Signature header is empty", async () => {
    const { body } = signStripeEvent({
      type: "invoice.paid",
      data: { object: {} },
    });
    const res = await callRoute(body, "");
    expect(res.status).toBe(400);
  });

  it("400 when constructEvent throws (bad signature)", async () => {
    const { getStripe } = await import("@/lib/stripe");
    vi.mocked(getStripe).mockReturnValueOnce({
      // @ts-expect-error narrow mock — only constructEvent is called.
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error("Invalid signature");
        }),
      },
    });
    const { body, signature } = signStripeEvent({
      type: "invoice.paid",
      data: { object: {} },
    });
    const res = await callRoute(body, signature);
    expect(res.status).toBe(400);
  });

  it("200 + duplicate:true when the event is already 'processed' (replay)", async () => {
    insertReturning.mockResolvedValueOnce([]); // row exists = replay
    updateReturning.mockResolvedValueOnce([]); // no re-claim (not failed/stale)
    selectLimit.mockResolvedValueOnce([{ status: "processed" }]);
    const { body, signature } = signStripeEvent({
      id: "evt_replay_1",
      type: "invoice.paid",
      data: { object: {} },
    });
    const res = await callRoute(body, signature);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, duplicate: true });
  });

  it("500 when a duplicate arrives while the first delivery is in flight (S3-01)", async () => {
    insertReturning.mockResolvedValueOnce([]);
    updateReturning.mockResolvedValueOnce([]); // fresh 'processing' — no claim
    selectLimit.mockResolvedValueOnce([{ status: "processing" }]);
    const { body, signature } = signStripeEvent({
      id: "evt_inflight_1",
      type: "invoice.paid",
      data: { object: {} },
    });
    const res = await callRoute(body, signature);
    expect(res.status).toBe(500);
  });

  it("re-processes a 'failed' event instead of duplicate-dropping (S3-01)", async () => {
    insertReturning.mockResolvedValueOnce([]);
    updateReturning.mockResolvedValueOnce([{ id: "evt_failed_1" }]); // re-claimed
    const { body, signature } = signStripeEvent({
      id: "evt_failed_1",
      type: "invoice.paid",
      data: { object: {} }, // empty → handler no-ops, but it RUNS
    });
    const res = await callRoute(body, signature);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true }); // NOT duplicate
  });

  it("200 for an unhandled event type (default branch)", async () => {
    const { body, signature } = signStripeEvent({
      type: "customer.created", // not in switch
      data: { object: { id: "cus_ignored" } },
    });
    const res = await callRoute(body, signature);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });

  it("200 for invoice.created (synchronous meter-flush path)", async () => {
    const { flushPendingForCustomer } = await import("@vk/inngest");
    const { body, signature } = signStripeEvent({
      type: "invoice.created",
      data: { object: { customer: "cus_invoice_created_1" } },
    });
    const res = await callRoute(body, signature);
    expect(res.status).toBe(200);
    expect(flushPendingForCustomer).toHaveBeenCalledWith({
      stripeCustomerId: "cus_invoice_created_1",
    });
  });

  it("500 when handler throws", async () => {
    // invoice.paid happy-path: lookupWorkspaceByCustomer succeeds, the sub
    // row exists with subscription set → handler calls grantCredits, which
    // we force to reject. Route catch-block translates that to 500.
    const { grantCredits } = await import("@vk/billing");
    vi.mocked(grantCredits).mockRejectedValueOnce(new Error("simulated"));
    selectLimit
      .mockResolvedValueOnce([{ workspaceId: "ws_1" }]) // lookupWorkspaceByCustomer
      .mockResolvedValueOnce([{ tier: "pro", creditsQuotaPerCycle: 200 }]); // sub-row
    const { body, signature } = signStripeEvent({
      type: "invoice.paid",
      data: {
        object: {
          customer: "cus_x",
          // dahlia shape: subscription lives under parent.subscription_details
          // (top-level invoice.subscription was removed) → skips the bail-out
          parent: { subscription_details: { subscription: "sub_y" } },
          id: "in_test",
        },
      },
    });
    const res = await callRoute(body, signature);
    expect(res.status).toBe(500);
  });
});
