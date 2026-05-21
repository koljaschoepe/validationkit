// SSE stream-route — workspace-membership-gated. We only verify the gate
// logic; the SSE loop is exercised via integration tests.

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@vk/db", () => ({
  isDbEnabled: vi.fn(() => true),
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn(() => Promise.resolve([])),
    })),
  })),
  schema: {
    event: {
      id: "event.id",
      type: "event.type",
      payload: "event.payload",
      createdAt: "event.createdAt",
      workspaceId: "event.workspaceId",
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getSessionUser: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/workspaces", () => ({
  ensureDefaultWorkspace: vi.fn(() =>
    Promise.resolve({ id: "ws_1", slug: "ws-1" }),
  ),
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  gt: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/events/stream", () => {
  it("503 when isDbEnabled() returns false", async () => {
    const { isDbEnabled } = await import("@vk/db");
    vi.mocked(isDbEnabled).mockReturnValueOnce(false);
    const { GET } = await import("./route");
    const res = await GET(new Request("https://app.test/api/events/stream"));
    expect(res.status).toBe(503);
  });

  it("401 when there is no signed-in user", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("https://app.test/api/events/stream"));
    expect(res.status).toBe(401);
  });

  it("200 + SSE headers when authenticated", async () => {
    const { getSessionUser } = await import("@/lib/session");
    vi.mocked(getSessionUser).mockResolvedValueOnce({
      id: "user_1",
      email: "u@test",
      name: null,
    });
    const { GET } = await import("./route");
    const ac = new AbortController();
    const res = await GET(
      new Request("https://app.test/api/events/stream", { signal: ac.signal }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.headers.get("cache-control")).toContain("no-cache");
    // Abort so the SSE loop can clean up its timers; otherwise vitest hangs.
    ac.abort();
    // Drain the stream to release the controller.
    await res.body?.cancel();
  });
});
