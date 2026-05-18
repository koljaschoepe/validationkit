import { describe, expect, it } from "vitest";
import type { AuditFinding, ParserResult, ParsedAgentFile } from "@vk/core";
import { generateFix, generateBatchFix, isSupported } from "./generate.js";

function mkFile(partial: Partial<ParsedAgentFile> & { relativePath: string; rawContent: string }): ParsedAgentFile {
  return {
    kind: partial.kind ?? "claude-agent",
    absolutePath: `/tmp/${partial.relativePath}`,
    relativePath: partial.relativePath,
    rawContent: partial.rawContent,
    body: partial.body ?? partial.rawContent,
    frontmatter: {},
    tokenCount: Math.ceil(partial.rawContent.length / 4),
    lineCount: partial.rawContent.split("\n").length,
    byteSize: Buffer.byteLength(partial.rawContent, "utf8"),
    lastModified: null,
    name: partial.name ?? null,
    description: null,
    outlinks: [],
  };
}

function mkScan(files: ParsedAgentFile[]): ParserResult {
  return {
    rootPath: "/tmp/test",
    scannedAt: new Date("2026-05-17T00:00:00Z"),
    files,
    warnings: [],
  };
}

describe("isSupported", () => {
  it("covers 4 deterministic + 1 LLM-augmented category", () => {
    expect(isSupported("unused-agent")).toBe(true);
    expect(isSupported("duplicate-guidance")).toBe(true);
    expect(isSupported("stale-reference")).toBe(true);
    expect(isSupported("token-budget")).toBe(true);
    expect(isSupported("context-bloat")).toBe(true);
    expect(isSupported("conflicting-rules")).toBe(false);
  });
});

describe("unused-agent fix", () => {
  it("produces a file-delete patch with /dev/null marker", () => {
    const file = mkFile({
      relativePath: ".claude/agents/old.md",
      rawContent: "---\nname: old\n---\nHello\n",
    });
    const finding: AuditFinding = {
      id: "unused-agent:.claude/agents/old.md",
      category: "unused-agent",
      severity: "Weak",
      title: 'Agent "old" is never referenced',
      detail: "...",
      citations: [{ path: ".claude/agents/old.md" }],
      deterministic: true,
    };
    const fix = generateFix(finding, mkScan([file]));
    expect(fix.category).toBe("unused-agent");
    expect(fix.filesTouched).toEqual([".claude/agents/old.md"]);
    expect(fix.patch).toContain("--- a/.claude/agents/old.md");
    expect(fix.patch).toContain("+++ /dev/null");
    expect(fix.patch).toContain("-Hello");
  });
});

describe("duplicate-guidance fix", () => {
  it("removes the duplicated paragraph from the second file", () => {
    const shared =
      "Use trigram similarity at threshold 0.85 to identify duplicate guidance.\n" +
      "Pick a single canonical home and link from the other.\n" +
      "This is a load-bearing project constraint that must be preserved verbatim.";
    const canonical = mkFile({
      relativePath: "AGENTS.md",
      rawContent: `# Agents\n\n${shared}\n\nMore unique content.\n`,
      body: `# Agents\n\n${shared}\n\nMore unique content.\n`,
    });
    const duplicate = mkFile({
      relativePath: "CLAUDE.md",
      rawContent: `# Claude\n\n${shared}\n\nDifferent unique content.\n`,
      body: `# Claude\n\n${shared}\n\nDifferent unique content.\n`,
    });
    const finding: AuditFinding = {
      id: "duplicate:AGENTS.md|CLAUDE.md",
      category: "duplicate-guidance",
      severity: "Weak",
      title: "Duplicate guidance between AGENTS.md and CLAUDE.md",
      detail: "Trigram similarity 90%.",
      citations: [{ path: "AGENTS.md" }, { path: "CLAUDE.md" }],
      deterministic: true,
    };
    const fix = generateFix(finding, mkScan([canonical, duplicate]));
    expect(fix.filesTouched).toEqual(["CLAUDE.md"]);
    expect(fix.patch).toContain("--- a/CLAUDE.md");
    expect(fix.patch).toContain("+> See canonical guidance");
  });
});

describe("stale-reference fix", () => {
  it("strips the line containing the dead link", () => {
    const file = mkFile({
      relativePath: "docs/PRD.md",
      rawContent:
        "# PRD\n\nSee [missing](./gone.md) for details.\n\nOther content.\n",
    });
    const finding: AuditFinding = {
      id: "stale-ref:docs/PRD.md:./gone.md",
      category: "stale-reference",
      severity: "Mid",
      title: 'docs/PRD.md → "./gone.md" not found',
      detail: "Outbound reference points to a file that does not exist.",
      citations: [{ path: "docs/PRD.md" }],
      deterministic: true,
    };
    const fix = generateFix(finding, mkScan([file]));
    expect(fix.filesTouched).toEqual(["docs/PRD.md"]);
    expect(fix.patch).toContain("-See [missing](./gone.md) for details.");
    expect(fix.patch).not.toMatch(/^\+See \[missing\]/m);
  });
});

describe("token-overflow-trim fix", () => {
  it("removes the bottom-most ## section", () => {
    const long =
      "# Doc\n\nIntro paragraph.\n\n" +
      "## Section A\n\n" +
      "Body A line 1.\nBody A line 2.\n\n" +
      "## Section B\n\n" +
      "Body B line 1.\nBody B line 2.\n\n" +
      "## Section C — Trim Me\n\n" +
      "Last section " +
      "filler ".repeat(80) +
      "\n";
    const file = mkFile({
      relativePath: "CLAUDE.md",
      rawContent: long,
    });
    const finding: AuditFinding = {
      id: "token-budget:CLAUDE.md",
      category: "token-budget",
      severity: "Weak",
      title: "Token budget exceeded",
      detail: "Always-loaded context exceeds 25k.",
      citations: [{ path: "CLAUDE.md" }],
      deterministic: true,
    };
    const fix = generateFix(finding, mkScan([file]));
    expect(fix.filesTouched).toEqual(["CLAUDE.md"]);
    expect(fix.patch).toContain("-## Section C");
    expect(fix.rationale).toContain("Section C");
  });
});

describe("generateBatchFix", () => {
  it("aggregates multiple fixes + reports failures", async () => {
    const target = mkFile({
      relativePath: ".claude/agents/old.md",
      rawContent: "stub\n",
    });
    const findings: AuditFinding[] = [
      {
        id: "unused-agent:.claude/agents/old.md",
        category: "unused-agent",
        severity: "Weak",
        title: 'Agent "old" is never referenced',
        detail: "",
        citations: [{ path: ".claude/agents/old.md" }],
        deterministic: true,
      },
      {
        id: "context-bloat:CLAUDE.md",
        category: "context-bloat",
        severity: "Mid",
        title: "Bloat",
        detail: "",
        citations: [{ path: "CLAUDE.md" }],
        deterministic: false,
      },
    ];
    const result = await generateBatchFix(findings, mkScan([target]));
    expect(result.successes).toHaveLength(1);
    // context-bloat is now LLM-augmented; without ANTHROPIC_API_KEY it lands
    // in `skippedLlmDisabled`, not `failures`.
    expect(result.failures).toHaveLength(0);
    expect(result.skippedLlmDisabled).toHaveLength(1);
    expect(result.skippedLlmDisabled[0]!.category).toBe("context-bloat");
    expect(result.combinedPatch).toContain("--- a/.claude/agents/old.md");
  });
});
