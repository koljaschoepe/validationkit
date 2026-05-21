// Better-Auth catch-all route — light smoke coverage. The actual auth flow
// lives in @vk/auth (server.test.ts in that package already covers it).

import { describe, expect, it, vi } from "vitest";

vi.mock("@vk/auth", () => ({
  isAuthEnabled: vi.fn(() => false),
  getAuth: vi.fn(),
}));

describe("Better-Auth catch-all route", () => {
  it("503 when isAuthEnabled() returns false", async () => {
    const { GET } = await import("./route");
    const req = new Request("https://app.test/api/auth/session");
    const res = await GET(req as never);
    expect(res.status).toBe(503);
  });

  it("delegates to auth.handler when enabled", async () => {
    const { isAuthEnabled, getAuth } = await import("@vk/auth");
    vi.mocked(isAuthEnabled).mockReturnValueOnce(true);
    const handler = vi.fn(() =>
      Promise.resolve(new Response("ok", { status: 200 })),
    );
    vi.mocked(getAuth).mockReturnValueOnce({
      handler,
    } as never);
    const { POST } = await import("./route");
    const req = new Request("https://app.test/api/auth/sign-in/magic-link", {
      method: "POST",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });
});
