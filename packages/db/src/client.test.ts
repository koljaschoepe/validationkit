import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb, isDbEnabled, closeDb } from "./client.js";

describe("db client", () => {
  let saved: string | undefined;

  beforeEach(() => {
    saved = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
  });

  afterEach(async () => {
    if (saved) process.env.DATABASE_URL = saved;
    await closeDb();
  });

  it("isDbEnabled returns false when DATABASE_URL is unset", () => {
    expect(isDbEnabled()).toBe(false);
  });

  it("getDb throws a helpful error when DATABASE_URL is unset", () => {
    expect(() => getDb()).toThrow(/DATABASE_URL is not set/);
  });

  it("isDbEnabled returns true when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "postgres://user:pw@localhost:5432/db";
    expect(isDbEnabled()).toBe(true);
  });
});
