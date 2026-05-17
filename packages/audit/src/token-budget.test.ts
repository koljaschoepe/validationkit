import { describe, expect, it } from "vitest";
import type { ParserResult, ParsedAgentFile } from "@vk/core";
import { checkTokenBudget } from "./rules/token-budget.js";

function file(
  kind: ParsedAgentFile["kind"],
  rel: string,
  tokens: number,
): ParsedAgentFile {
  return {
    kind,
    absolutePath: `/tmp/${rel}`,
    relativePath: rel,
    rawContent: "x".repeat(tokens * 4),
    body: "x".repeat(tokens * 4),
    frontmatter: {},
    tokenCount: tokens,
    lineCount: 1,
    byteSize: tokens * 4,
    lastModified: new Date(),
    name: null,
    description: null,
    outlinks: [],
  };
}

function scan(files: ParsedAgentFile[]): ParserResult {
  return {
    rootPath: "/tmp/test",
    scannedAt: new Date(),
    files,
    warnings: [],
  };
}

describe("checkTokenBudget", () => {
  it("does not flag when under budget", () => {
    const result = scan([
      file("claude-md", "CLAUDE.md", 5_000),
      file("agents-md", "AGENTS.md", 5_000),
    ]);
    expect(checkTokenBudget(result)).toEqual([]);
  });

  it("flags Mid severity at just-over budget", () => {
    const result = scan([
      file("claude-md", "CLAUDE.md", 26_000),
    ]);
    const findings = checkTokenBudget(result);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.severity).toBe("Mid");
  });

  it("escalates to Weak / Kill on big overshoots", () => {
    const weakResult = scan([file("claude-md", "CLAUDE.md", 55_000)]);
    expect(checkTokenBudget(weakResult)[0]?.severity).toBe("Weak");

    const killResult = scan([file("claude-md", "CLAUDE.md", 80_000)]);
    expect(checkTokenBudget(killResult)[0]?.severity).toBe("Kill");
  });

  it("ignores cursor / windsurf / cline rules (not always-loaded)", () => {
    const result = scan([
      file("cursor-rule-mdc", ".cursor/rules/style.mdc", 100_000),
      file("windsurf-rule", ".windsurf/rules/style.md", 100_000),
    ]);
    expect(checkTokenBudget(result)).toEqual([]);
  });

  it("cites the top contributors", () => {
    const result = scan([
      file("claude-md", "CLAUDE.md", 10_000),
      file("claude-agent", ".claude/agents/big.md", 20_000),
    ]);
    const findings = checkTokenBudget(result);
    expect(findings[0]?.citations.length).toBeGreaterThan(0);
    expect(findings[0]?.citations[0]?.path).toBe(".claude/agents/big.md");
  });
});
