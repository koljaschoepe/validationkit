// Inngest serve()-export — smoke coverage. The actual function bodies are
// tested in packages/inngest. This file just verifies the route exposes
// the three method handlers Inngest's CLI expects.

import { describe, expect, it, vi } from "vitest";

vi.mock("inngest/next", () => ({
  serve: vi.fn(() => ({
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
  })),
}));

vi.mock("@vk/inngest", () => ({
  inngest: { id: "validationkit" },
  functions: [],
}));

// App-local workers (J4 + Block C) — mocked so this smoke test doesn't pull in
// the server-only DAL / signing libs. Their bodies are covered elsewhere.
vi.mock("@/lib/inngest/solution-generate", () => ({
  solutionGenerate: { id: "solution-generate" },
}));
vi.mock("@/lib/inngest/webhook-deliver", () => ({
  webhookDeliver: { id: "webhook-deliver" },
}));

describe("/api/inngest route exports", () => {
  it("exports GET, POST, PUT handlers (Inngest CLI contract)", async () => {
    const mod = await import("./route");
    expect(typeof mod.GET).toBe("function");
    expect(typeof mod.POST).toBe("function");
    expect(typeof mod.PUT).toBe("function");
  });
});
