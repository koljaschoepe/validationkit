import path from "node:path";
import type { AgentFileKind } from "@vk/core";

export function classifyPath(relPath: string): AgentFileKind | null {
  const normalized = "/" + relPath.split(path.sep).join("/").replace(/^\/+/, "");
  const basename = path.basename(normalized);

  if (basename === "CLAUDE.md") return "claude-md";
  if (basename === "AGENTS.md") return "agents-md";
  if (basename === "GEMINI.md") return "gemini-md";
  if (basename === ".cursorrules") return "cursor-rules-legacy";
  if (basename === ".clinerules") return "cline-rule";
  if (basename === "aider.conf.yml" || basename === "aider.conf.yaml")
    return "aider-conf";

  if (normalized.includes("/.claude/agents/") && basename.endsWith(".md"))
    return "claude-agent";
  if (normalized.includes("/.claude/commands/") && basename.endsWith(".md"))
    return "claude-command";
  if (normalized.includes("/.claude/skills/") && basename === "SKILL.md")
    return "claude-skill";

  if (normalized.includes("/.cursor/rules/") && basename.endsWith(".mdc"))
    return "cursor-rule-mdc";

  if (normalized.includes("/.windsurf/rules") && basename.endsWith(".md"))
    return "windsurf-rule";
  if (
    normalized.includes("/.codex/") &&
    (basename.endsWith(".md") || basename.endsWith(".yml"))
  )
    return "codex-rule";

  return null;
}
