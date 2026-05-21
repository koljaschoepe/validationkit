// Unit tests for session.ts — getSessionUser shape + auth-disabled paths.

import { describe, expect, it, vi, beforeEach } from "vitest";

const getSessionMock = vi.fn();

vi.mock("@vk/auth", () => ({
  isAuthEnabled: vi.fn(() => true),
  getAuth: vi.fn(() => ({
    api: { getSession: getSessionMock },
  })),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSessionUser", () => {
  it("returns null when auth is disabled", async () => {
    const { isAuthEnabled } = await import("@vk/auth");
    vi.mocked(isAuthEnabled).mockReturnValueOnce(false);
    const { getSessionUser } = await import("./session");
    expect(await getSessionUser()).toBeNull();
  });

  it("returns null when getSession returns null", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { getSessionUser } = await import("./session");
    expect(await getSessionUser()).toBeNull();
  });

  it("returns null when getSession returns an object without user", async () => {
    getSessionMock.mockResolvedValueOnce({ user: null });
    const { getSessionUser } = await import("./session");
    expect(await getSessionUser()).toBeNull();
  });

  it("returns null when getAuth throws (auth misconfigured)", async () => {
    const { getAuth } = await import("@vk/auth");
    vi.mocked(getAuth).mockImplementationOnce(() => {
      throw new Error("simulated auth crash");
    });
    const { getSessionUser } = await import("./session");
    expect(await getSessionUser()).toBeNull();
  });

  it("maps session.user to SessionUser shape", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "user_42",
        email: "alice@test",
        name: "Alice",
      },
    });
    const { getSessionUser } = await import("./session");
    const u = await getSessionUser();
    expect(u).toEqual({
      id: "user_42",
      email: "alice@test",
      name: "Alice",
    });
  });

  it("defaults `name` to null when missing on the auth user", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u", email: "e@x" },
    });
    const { getSessionUser } = await import("./session");
    const u = await getSessionUser();
    expect(u?.name).toBeNull();
  });
});
