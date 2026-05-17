import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepository } from "@vk/parser";
import { runAudit } from "./run.js";

const ROOT = path.resolve(import.meta.dirname, "../../..");

describe("runAudit integration", () => {
  it("flags sample-bad with the expected categories", async () => {
    const scan = await scanRepository(
      path.join(ROOT, "examples/sample-bad"),
      { includeExamples: true },
    );
    const report = await runAudit(scan);
    const cats = new Set(report.findings.map((f) => f.category));
    expect(cats.has("unused-agent")).toBe(true);
    expect(cats.has("duplicate-guidance")).toBe(true);
    expect(cats.has("stale-reference")).toBe(true);
    expect(report.findings.length).toBeGreaterThanOrEqual(3);
  });

  it("returns 0 findings against sample-good", async () => {
    const scan = await scanRepository(
      path.join(ROOT, "examples/sample-good"),
      { includeExamples: true },
    );
    const report = await runAudit(scan);
    expect(report.findings).toEqual([]);
    expect(report.summary.overallSeverity).toBe("Exceptional");
  });

  it("does NOT flag agents that ARE referenced", async () => {
    const scan = await scanRepository(
      path.join(ROOT, "examples/sample-bad"),
      { includeExamples: true },
    );
    const report = await runAudit(scan);
    const unused = report.findings.filter((f) => f.category === "unused-agent");
    expect(unused.some((f) => f.title.includes("ghost-agent"))).toBe(true);
    expect(unused.some((f) => f.title.includes("used-agent"))).toBe(false);
  });
});
