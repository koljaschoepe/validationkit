import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepository } from "@vk/parser";
import { computeDrift } from "./compute.js";

const ROOT = path.resolve(import.meta.dirname, "../../..");

describe("computeDrift", () => {
  it("reports drift between sample-good and sample-bad", async () => {
    const [a, b] = await Promise.all([
      scanRepository(path.join(ROOT, "examples/sample-good"), {
        includeExamples: true,
      }),
      scanRepository(path.join(ROOT, "examples/sample-bad"), {
        includeExamples: true,
      }),
    ]);
    const drift = computeDrift(a, b);
    expect(drift.items.length).toBeGreaterThan(0);
    expect(drift.summary.byKind["only-in-b"]).toBeGreaterThan(0);
  });

  it("reports zero drift when both repos are identical", async () => {
    const scan = await scanRepository(
      path.join(ROOT, "examples/sample-good"),
      { includeExamples: true },
    );
    const drift = computeDrift(scan, scan);
    expect(drift.items).toEqual([]);
    expect(drift.summary.overallSeverity).toBe("Exceptional");
  });

  it("detects frontmatter drift on fields that changed", async () => {
    // Build two synthetic ParserResults differing only in one frontmatter field.
    const base = await scanRepository(
      path.join(ROOT, "examples/sample-good"),
      { includeExamples: true },
    );
    const mutated = {
      ...base,
      files: base.files.map((f) =>
        f.kind === "claude-agent"
          ? { ...f, frontmatter: { ...f.frontmatter, description: "changed!" } }
          : f,
      ),
    };
    const drift = computeDrift(base, mutated);
    const fmDrift = drift.items.filter((i) => i.kind === "frontmatter-drift");
    expect(fmDrift.length).toBeGreaterThan(0);
    expect(fmDrift[0]?.fieldsChanged).toContain("description");
  });
});
