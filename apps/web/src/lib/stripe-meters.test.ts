// Unit tests for the Stripe-Meter wrapper — the 2-layer idempotency contract
// (local-log preflight + Stripe-side identifier dedup).

import { describe, expect, it, vi, beforeEach } from "vitest";

const meterCreateMock = vi.fn(() => Promise.resolve({ id: "evt_x" }));

vi.mock("./stripe", () => ({
  getStripe: vi.fn(() => ({
    billing: { meterEvents: { create: meterCreateMock } },
  })),
  meterEventName: vi.fn((kind: string) =>
    kind === "overage"
      ? "audit_credit_overage"
      : "ai_cost_markup_microcents",
  ),
}));

const dbSelectLimit = vi.fn();
const dbInsertValues = vi.fn(() => Promise.resolve());

vi.mock("@vk/db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: dbSelectLimit,
    })),
    insert: vi.fn(() => ({
      values: dbInsertValues,
    })),
  })),
  schema: {
    stripeMeterEventLog: {
      identifier: "stripeMeterEventLog.identifier",
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  dbSelectLimit.mockResolvedValue([]); // no prior log → submit
});

describe("submitMeterEvent", () => {
  it("returns skipReason=zero_value for value <= 0", async () => {
    const { submitMeterEvent } = await import("./stripe-meters");
    const res = await submitMeterEvent({
      kind: "overage",
      workspaceId: "ws1",
      stripeCustomerId: "cus_x",
      value: 0,
      identifier: "id1",
    });
    expect(res).toEqual({ submitted: false, skipReason: "zero_value" });
    expect(meterCreateMock).not.toHaveBeenCalled();
  });

  it("returns skipReason=already_logged when prior log row exists (idempotency)", async () => {
    dbSelectLimit.mockResolvedValueOnce([{ identifier: "id-dup" }]);
    const { submitMeterEvent } = await import("./stripe-meters");
    const res = await submitMeterEvent({
      kind: "overage",
      workspaceId: "ws1",
      stripeCustomerId: "cus_x",
      value: 5,
      identifier: "id-dup",
    });
    expect(res).toEqual({ submitted: false, skipReason: "already_logged" });
    expect(meterCreateMock).not.toHaveBeenCalled();
  });

  it("submits the event + writes the log row on the happy path", async () => {
    const { submitMeterEvent } = await import("./stripe-meters");
    const res = await submitMeterEvent({
      kind: "overage",
      workspaceId: "ws1",
      stripeCustomerId: "cus_y",
      value: 3,
      identifier: "id-fresh",
    });
    expect(res).toEqual({ submitted: true });
    expect(meterCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "audit_credit_overage",
        identifier: "id-fresh",
        payload: expect.objectContaining({
          value: "3",
          stripe_customer_id: "cus_y",
        }),
      }),
    );
    expect(dbInsertValues).toHaveBeenCalled();
  });

  it("maps kind=ai_markup to ai_cost_markup_microcents event_name", async () => {
    const { submitMeterEvent } = await import("./stripe-meters");
    await submitMeterEvent({
      kind: "ai_markup",
      workspaceId: "ws1",
      stripeCustomerId: "cus_z",
      value: 12_345,
      identifier: "id-markup",
    });
    expect(meterCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_name: "ai_cost_markup_microcents",
      }),
    );
  });
});
