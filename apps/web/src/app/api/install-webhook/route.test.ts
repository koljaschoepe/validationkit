// Unit tests for the GitHub-App install webhook.

import { describe, expect, it, vi, beforeEach } from "vitest";

const verifyMock = vi.fn(() => true);

vi.mock("@vk/github-app", () => ({
  parseWebhookEvent: vi.fn(),
  verifyWebhookSignature: verifyMock,
}));

const dbSelectLimit = vi.fn();
const dbInsertReturning = vi.fn();
const dbUpdateWhere = vi.fn();

vi.mock("@vk/db", () => ({
  isDbEnabled: vi.fn(() => true),
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: dbSelectLimit,
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockReturnThis(),
      returning: dbInsertReturning,
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: dbUpdateWhere,
    })),
  })),
  schema: {
    webhookEvent: { deliveryId: "webhookEvent.deliveryId" },
    repo: { id: "repo.id", workspaceId: "repo.workspaceId" },
  },
}));

vi.mock("@vk/inngest", () => ({
  publishEvent: vi.fn(() => Promise.resolve()),
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
}));

function makeReq(headers: Record<string, string>, body: string): Request {
  return new Request("https://app.test/api/install-webhook", {
    method: "POST",
    headers,
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  verifyMock.mockReturnValue(true);
  dbSelectLimit.mockResolvedValue([]);
  dbInsertReturning.mockResolvedValue([{ id: "we_1" }]);
});

describe("POST /api/install-webhook", () => {
  it("503 when GITHUB_APP_WEBHOOK_SECRET is missing", async () => {
    const prev = process.env.GITHUB_APP_WEBHOOK_SECRET;
    delete process.env.GITHUB_APP_WEBHOOK_SECRET;
    try {
      const { POST } = await import("./route");
      const res = await POST(
        makeReq({}, JSON.stringify({})) as never,
      );
      expect(res.status).toBe(503);
    } finally {
      if (prev !== undefined) process.env.GITHUB_APP_WEBHOOK_SECRET = prev;
    }
  });

  it("401 when verifyWebhookSignature returns false", async () => {
    process.env.GITHUB_APP_WEBHOOK_SECRET = "test-secret";
    verifyMock.mockReturnValueOnce(false);
    const { POST } = await import("./route");
    const res = await POST(
      makeReq(
        { "x-github-event": "push", "x-hub-signature-256": "sha256=bad" },
        JSON.stringify({}),
      ) as never,
    );
    expect(res.status).toBe(401);
  });

  it("503 when isDbEnabled returns false", async () => {
    process.env.GITHUB_APP_WEBHOOK_SECRET = "test-secret";
    const { isDbEnabled } = await import("@vk/db");
    vi.mocked(isDbEnabled).mockReturnValueOnce(false);
    const { POST } = await import("./route");
    const res = await POST(
      makeReq(
        { "x-github-event": "push", "x-hub-signature-256": "sha256=ok" },
        JSON.stringify({}),
      ) as never,
    );
    expect(res.status).toBe(503);
  });

  it("400 when body is not valid JSON", async () => {
    process.env.GITHUB_APP_WEBHOOK_SECRET = "test-secret";
    const { POST } = await import("./route");
    const res = await POST(
      makeReq(
        {
          "x-github-event": "installation",
          "x-hub-signature-256": "sha256=ok",
          "x-github-delivery": "del_1",
        },
        "{not-json",
      ) as never,
    );
    expect(res.status).toBe(400);
  });

  it("400 when x-github-delivery header is missing", async () => {
    process.env.GITHUB_APP_WEBHOOK_SECRET = "test-secret";
    const { POST } = await import("./route");
    const res = await POST(
      makeReq(
        {
          "x-github-event": "installation",
          "x-hub-signature-256": "sha256=ok",
        },
        JSON.stringify({ action: "created" }),
      ) as never,
    );
    expect(res.status).toBe(400);
  });
});
