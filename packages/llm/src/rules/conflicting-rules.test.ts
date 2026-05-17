import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ParserResult } from "@vk/core";
import { checkConflictingRules } from "./conflicting-rules.js";

const minimalScan: ParserResult = {
  rootPath: "/tmp/test",
  scannedAt: new Date(),
  files: [],
  warnings: [],
};

describe("checkConflictingRules", () => {
  let saved: string | undefined;

  beforeEach(() => {
    saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (saved) process.env.ANTHROPIC_API_KEY = saved;
  });

  it("returns empty array when ANTHROPIC_API_KEY is unset (Hardcore-Local-Only)", async () => {
    const findings = await checkConflictingRules(minimalScan);
    expect(findings).toEqual([]);
  });

  it("does not throw on empty scan", async () => {
    await expect(checkConflictingRules(minimalScan)).resolves.toEqual([]);
  });
});
