// Unit tests for checkContextBloat — severity-band selection + threshold gating.

import { describe, expect, it } from "vitest";
import type { ParserResult } from "@vk/core";
import { checkContextBloat } from "./context-bloat.js";

function makeScan(files: Array<{ relativePath: string; tokenCount: number }>): ParserResult {
  return {
    rootPath: "/test",
    files: files.map((f) => ({
      relativePath: f.relativePath,
      absolutePath: `/test/${f.relativePath}`,
      kind: "claude" as never,
      role: "instructions" as never,
      body: "",
      tokenCount: f.tokenCount,
      outlinks: [],
      frontMatter: null,
    })) as never,
    warnings: [],
  };
}

describe("checkContextBloat", () => {
  it("returns no findings when all files are under threshold", () => {
    const scan = makeScan([
      { relativePath: "a.md", tokenCount: 500 },
      { relativePath: "b.md", tokenCount: 999 },
    ]);
    const findings = checkContextBloat(scan, 1000);
    expect(findings).toEqual([]);
  });

  it("returns Mid severity when over threshold but under 1.5x", () => {
    const scan = makeScan([{ relativePath: "med.md", tokenCount: 1200 }]);
    const findings = checkContextBloat(scan, 1000);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("Mid");
    expect(findings[0]?.category).toBe("context-bloat");
    expect(findings[0]?.id).toBe("context-bloat:med.md");
  });

  it("returns Weak severity when between 1.5x and 3x", () => {
    const scan = makeScan([{ relativePath: "big.md", tokenCount: 2500 }]);
    const findings = checkContextBloat(scan, 1000);
    expect(findings[0]?.severity).toBe("Weak");
  });

  it("returns Kill severity when > 3x threshold", () => {
    const scan = makeScan([{ relativePath: "huge.md", tokenCount: 4000 }]);
    const findings = checkContextBloat(scan, 1000);
    expect(findings[0]?.severity).toBe("Kill");
  });

  it("flags every over-threshold file separately", () => {
    const scan = makeScan([
      { relativePath: "ok.md", tokenCount: 500 },
      { relativePath: "mid.md", tokenCount: 1200 },
      { relativePath: "huge.md", tokenCount: 5000 },
    ]);
    const findings = checkContextBloat(scan, 1000);
    expect(findings).toHaveLength(2);
    expect(findings.map((f) => f.id).sort()).toEqual([
      "context-bloat:huge.md",
      "context-bloat:mid.md",
    ]);
  });

  it("respects per-call threshold (different threshold → different result)", () => {
    const scan = makeScan([{ relativePath: "x.md", tokenCount: 800 }]);
    expect(checkContextBloat(scan, 1000)).toEqual([]);
    expect(checkContextBloat(scan, 500)).toHaveLength(1);
  });

  it("includes the file path as a citation", () => {
    const scan = makeScan([{ relativePath: "z.md", tokenCount: 2000 }]);
    const findings = checkContextBloat(scan, 1000);
    expect(findings[0]?.citations).toEqual([{ path: "z.md" }]);
    expect(findings[0]?.deterministic).toBe(true);
  });
});
