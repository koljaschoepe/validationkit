import { describe, expect, it } from "vitest";
import { generateApiKey, hashToken } from "./api-key";

describe("api-key", () => {
  it("generates a vk_-prefixed token with matching hash/prefix/last4", () => {
    const k = generateApiKey();
    expect(k.token).toMatch(/^vk_[A-Za-z0-9_-]+$/);
    expect(k.tokenHash).toBe(hashToken(k.token));
    expect(k.tokenHash).toHaveLength(64); // sha256 hex
    expect(k.tokenPrefix).toBe(k.token.slice(0, 11));
    expect(k.last4).toBe(k.token.slice(-4));
  });

  it("produces unique tokens across calls", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it("hashToken is deterministic", () => {
    expect(hashToken("vk_test")).toBe(hashToken("vk_test"));
  });
});
