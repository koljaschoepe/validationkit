import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptApiKey,
  encryptApiKey,
  isByokConfigured,
} from "./byok-crypto.js";

const previousKey = process.env.BYOK_ENCRYPTION_KEY;

beforeEach(() => {
  process.env.BYOK_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

afterEach(() => {
  if (previousKey === undefined) {
    delete process.env.BYOK_ENCRYPTION_KEY;
  } else {
    process.env.BYOK_ENCRYPTION_KEY = previousKey;
  }
});

describe("byok-crypto", () => {
  it("roundtrips a typical Anthropic API key", () => {
    const plaintext = "sk-ant-api03-" + "x".repeat(95);
    const encrypted = encryptApiKey(plaintext);
    expect(encrypted.ciphertext).not.toContain(plaintext);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    expect(decryptApiKey(encrypted)).toBe(plaintext);
  });

  it("produces a different ciphertext for the same plaintext on each call (IV freshness)", () => {
    const plaintext = "sk-test-1234567890";
    const a = encryptApiKey(plaintext);
    const b = encryptApiKey(plaintext);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
    expect(decryptApiKey(a)).toBe(plaintext);
    expect(decryptApiKey(b)).toBe(plaintext);
  });

  it("rejects empty plaintext", () => {
    expect(() => encryptApiKey("")).toThrow(/non-empty/);
  });

  it("detects tampered ciphertext via GCM auth-tag", () => {
    const encrypted = encryptApiKey("sk-real-key");
    const tampered = {
      ...encrypted,
      ciphertext: Buffer.from("totally different bytes").toString("base64"),
    };
    expect(() => decryptApiKey(tampered)).toThrow();
  });

  it("detects tampered auth-tag", () => {
    const encrypted = encryptApiKey("sk-real-key");
    const tampered = {
      ...encrypted,
      authTag: Buffer.alloc(16, 0).toString("base64"),
    };
    expect(() => decryptApiKey(tampered)).toThrow();
  });

  it("throws on missing BYOK_ENCRYPTION_KEY", () => {
    delete process.env.BYOK_ENCRYPTION_KEY;
    expect(() => encryptApiKey("sk-test")).toThrow(/BYOK_ENCRYPTION_KEY/);
  });

  it("throws on wrong key length", () => {
    process.env.BYOK_ENCRYPTION_KEY = Buffer.from("too-short").toString(
      "base64",
    );
    expect(() => encryptApiKey("sk-test")).toThrow(/32 bytes/);
  });

  it("isByokConfigured tracks env presence", () => {
    expect(isByokConfigured()).toBe(true);
    delete process.env.BYOK_ENCRYPTION_KEY;
    expect(isByokConfigured()).toBe(false);
  });
});
