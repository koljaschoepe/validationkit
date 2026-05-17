import path from "node:path";
import type { AuditFinding, ParserResult } from "@vk/core";

/**
 * Flags .claude/agents/*.md whose `name:` (or filename stem) is never referenced
 * in any other parsed file (commands, CLAUDE.md, AGENTS.md).
 */
export function checkUnusedAgents(scan: ParserResult): AuditFinding[] {
  const agents = scan.files.filter((f) => f.kind === "claude-agent");
  if (agents.length === 0) return [];

  const corpus = scan.files
    .filter((f) => f.kind !== "claude-agent")
    .map((f) => f.rawContent.toLowerCase())
    .join("\n\n");

  const findings: AuditFinding[] = [];
  for (const agent of agents) {
    const stem = path.basename(agent.relativePath).replace(/\.md$/i, "");
    const name = (agent.name ?? "").trim();
    const haystack = corpus;
    const referenced =
      haystack.includes(stem.toLowerCase()) ||
      (name.length > 0 && haystack.includes(name.toLowerCase()));

    if (!referenced) {
      findings.push({
        id: `unused-agent:${agent.relativePath}`,
        category: "unused-agent",
        severity: "Weak",
        title: `Agent "${name || stem}" is never referenced`,
        detail:
          "No CLAUDE.md / command / AGENTS.md mentions this agent. " +
          "Either delete the file or wire it into a workflow.",
        citations: [{ path: agent.relativePath }],
        deterministic: true,
      });
    }
  }
  return findings;
}
