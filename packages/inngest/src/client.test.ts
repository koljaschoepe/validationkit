import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BACKGROUND_THRESHOLD, isInngestEnabled, inngest } from "./client.js";

describe("inngest client", () => {
  let savedBase: string | undefined;
  let savedKey: string | undefined;

  beforeEach(() => {
    savedBase = process.env.INNGEST_BASE_URL;
    savedKey = process.env.INNGEST_EVENT_KEY;
    delete process.env.INNGEST_BASE_URL;
    delete process.env.INNGEST_EVENT_KEY;
  });

  afterEach(() => {
    if (savedBase) process.env.INNGEST_BASE_URL = savedBase;
    if (savedKey) process.env.INNGEST_EVENT_KEY = savedKey;
  });

  it("isInngestEnabled is false without env config", () => {
    expect(isInngestEnabled()).toBe(false);
  });

  it("becomes enabled when INNGEST_BASE_URL is set (dev server case)", () => {
    process.env.INNGEST_BASE_URL = "http://127.0.0.1:8288";
    expect(isInngestEnabled()).toBe(true);
  });

  it("becomes enabled when INNGEST_EVENT_KEY is set (cloud case)", () => {
    process.env.INNGEST_EVENT_KEY = "signkey-fake";
    expect(isInngestEnabled()).toBe(true);
  });

  it("client is constructable and has the right id", () => {
    expect(inngest.id).toBe("validationkit");
  });

  it("BACKGROUND_THRESHOLD is the documented file count", () => {
    expect(BACKGROUND_THRESHOLD).toBe(30);
  });
});
