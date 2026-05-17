import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAuthEnabled, getAuth } from "./server.js";

describe("auth server", () => {
  let savedDb: string | undefined;
  let savedSecret: string | undefined;

  beforeEach(() => {
    savedDb = process.env.DATABASE_URL;
    savedSecret = process.env.AUTH_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.AUTH_SECRET;
  });

  afterEach(() => {
    if (savedDb) process.env.DATABASE_URL = savedDb;
    if (savedSecret) process.env.AUTH_SECRET = savedSecret;
  });

  it("returns false when DATABASE_URL is unset", () => {
    expect(isAuthEnabled()).toBe(false);
  });

  it("returns false when AUTH_SECRET is unset", () => {
    process.env.DATABASE_URL = "postgres://placeholder";
    expect(isAuthEnabled()).toBe(false);
  });

  it("returns true when both are set", () => {
    process.env.DATABASE_URL = "postgres://placeholder";
    process.env.AUTH_SECRET = "test-secret";
    expect(isAuthEnabled()).toBe(true);
  });

  it("getAuth throws a helpful error when not configured", () => {
    expect(() => getAuth()).toThrow(/Auth not configured/);
  });
});
