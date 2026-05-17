import { describe, expect, it } from "vitest";
import { classifyPath } from "./classify.js";

describe("classifyPath", () => {
  it.each([
    ["CLAUDE.md", "claude-md"],
    ["packages/web/CLAUDE.md", "claude-md"],
    ["AGENTS.md", "agents-md"],
    ["GEMINI.md", "gemini-md"],
    [".claude/agents/foo.md", "claude-agent"],
    ["nested/.claude/agents/foo.md", "claude-agent"],
    [".claude/commands/cmd.md", "claude-command"],
    [".claude/skills/x/SKILL.md", "claude-skill"],
    [".cursor/rules/style.mdc", "cursor-rule-mdc"],
    [".cursorrules", "cursor-rules-legacy"],
    [".windsurf/rules/style.md", "windsurf-rule"],
    [".clinerules", "cline-rule"],
    [".codex/rules.md", "codex-rule"],
    ["aider.conf.yml", "aider-conf"],
  ])("classifies %s → %s", (input, expected) => {
    expect(classifyPath(input)).toBe(expected);
  });

  it.each([
    "README.md",
    "docs/PRD.md",
    ".claude/notes/random.md",
    "src/index.ts",
    "package.json",
  ])("returns null for non-agent path %s", (input) => {
    expect(classifyPath(input)).toBeNull();
  });
});
