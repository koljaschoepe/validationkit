// Unit tests for the reconcile additions from the second-opinion audit:
// S2-05 (heal lost monthly grants) + S3-04 (skip orphaned subs instead of
// poisoning the run). Stripe, DB and billing are module-mocked; the Inngest
// handler is invoked directly via a mocked createFunction.

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const selectQueue: unknown[][] = [];
  return {
    selectQueue,
    listSubscriptions: vi.fn(),
    listInvoices: vi.fn(),
    grantCredits: vi.fn(),
    publishEvent: vi.fn(),
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => selectQueue.shift() ?? [],
          }),
        }),
      }),
    },
  };
});

vi.mock("stripe", () => ({
  default: class StripeMock {
    subscriptions = { list: mocks.listSubscriptions };
    invoices = { list: mocks.listInvoices };
  },
}));

vi.mock("@vk/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@vk/db")>();
  return { ...actual, getDb: () => mocks.db };
});

vi.mock("@vk/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@vk/billing")>();
  return { ...actual, grantCredits: mocks.grantCredits };
});

vi.mock("../events.js", () => ({ publishEvent: mocks.publishEvent }));

vi.mock("../client.js", () => ({
  inngest: {
    createFunction: (_opts: unknown, handler: unknown) => ({ handler }),
  },
}));

import { stripeReconcile } from "./stripe-reconcile.js";

const step = {
  run: (_id: string, fn: () => Promise<unknown>) => fn(),
};

type ReconcileResult = {
  ok?: boolean;
  scanned: number;
  driftCount: number;
  orphanCount: number;
  healedCount: number;
};

async function runReconcile(): Promise<ReconcileResult> {
  const fn = stripeReconcile as unknown as {
    handler: (ctx: { step: typeof step }) => Promise<ReconcileResult>;
  };
  return fn.handler({ step });
}

function subFixture() {
  return {
    id: "sub_test_1",
    status: "active",
    customer: "cus_test_1",
    metadata: { workspaceId: "ws_test_1", tier: "starter" },
  };
}

// Recent updatedAt keeps the drift settle-window quiet so the heal path is
// isolated from drift-event noise.
function subRowFixture() {
  return {
    id: "row_1",
    tier: "starter",
    status: "active",
    workspaceId: "ws_test_1",
    creditsQuotaPerCycle: 50,
    updatedAt: new Date(),
  };
}

describe("stripe-reconcile (S2-05 heal + S3-04 orphan guard)", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_mock";
    mocks.selectQueue.length = 0;
    mocks.listSubscriptions.mockReset();
    mocks.listInvoices.mockReset();
    mocks.grantCredits.mockReset();
    mocks.publishEvent.mockReset();
    mocks.listSubscriptions.mockResolvedValue({
      data: [subFixture()],
      has_more: false,
    });
  });

  it("heals a missing monthly grant for the latest paid invoice", async () => {
    // select order per sub: workspace exists → subscription row → ledger row
    mocks.selectQueue.push([{ id: "ws_test_1" }], [subRowFixture()], []);
    mocks.listInvoices.mockResolvedValue({ data: [{ id: "in_lost_42" }] });

    const result = await runReconcile();

    expect(mocks.grantCredits).toHaveBeenCalledTimes(1);
    expect(mocks.grantCredits).toHaveBeenCalledWith({
      workspaceId: "ws_test_1",
      amount: 50,
      reason: "monthly_grant",
      referenceId: "in_lost_42",
    });
    expect(result.healedCount).toBe(1);
    expect(result.orphanCount).toBe(0);
  });

  it("does not re-grant when the ledger row already exists", async () => {
    mocks.selectQueue.push(
      [{ id: "ws_test_1" }],
      [subRowFixture()],
      [{ id: "ledger_row_exists" }],
    );
    mocks.listInvoices.mockResolvedValue({ data: [{ id: "in_already" }] });

    const result = await runReconcile();

    expect(mocks.grantCredits).not.toHaveBeenCalled();
    expect(result.healedCount).toBe(0);
  });

  it("does nothing when the sub has no paid invoice yet", async () => {
    mocks.selectQueue.push([{ id: "ws_test_1" }], [subRowFixture()]);
    mocks.listInvoices.mockResolvedValue({ data: [] });

    const result = await runReconcile();

    expect(mocks.grantCredits).not.toHaveBeenCalled();
    expect(result.healedCount).toBe(0);
  });

  it("skips orphaned subscriptions (deleted workspace) without crashing the run", async () => {
    // workspace lookup returns empty → orphan; no further selects expected.
    mocks.selectQueue.push([]);

    const result = await runReconcile();

    expect(result.ok).toBe(true);
    expect(result.orphanCount).toBe(1);
    expect(mocks.grantCredits).not.toHaveBeenCalled();
    expect(mocks.publishEvent).not.toHaveBeenCalled();
    expect(mocks.listInvoices).not.toHaveBeenCalled();
  });
});
