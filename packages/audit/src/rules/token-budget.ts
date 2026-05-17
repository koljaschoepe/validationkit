import type {
  AuditFinding,
  ParserResult,
  ParsedAgentFile,
  SeverityBand,
} from "@vk/core";

/**
 * Token-budget rule. Different bar than `context-bloat`:
 *   - context-bloat flags a single oversized file.
 *   - token-budget flags files that contribute to the *always-loaded* context
 *     (CLAUDE.md / AGENTS.md / .claude/agents/* / .claude/commands/* root)
 *     and exceed a per-tier budget. Boutique agencies care about the sum.
 *
 * Implementation: compute the always-loaded subtree token sum. Flag the
 * largest contributors when the sum exceeds the budget.
 */
const ALWAYS_LOADED_KINDS = new Set([
  "claude-md",
  "agents-md",
  "claude-agent",
  "claude-command",
]);

const DEFAULT_BUDGET = 25_000;

export function checkTokenBudget(scan: ParserResult): AuditFinding[] {
  const alwaysLoaded = scan.files.filter((f) =>
    ALWAYS_LOADED_KINDS.has(f.kind),
  );
  const total = alwaysLoaded.reduce((sum, f) => sum + f.tokenCount, 0);

  if (total <= DEFAULT_BUDGET) return [];

  const overshoot = total - DEFAULT_BUDGET;
  const severity: SeverityBand = pickSeverity(total, DEFAULT_BUDGET);

  // Find the top contributors so the finding is actionable.
  const top = [...alwaysLoaded]
    .sort((a, b) => b.tokenCount - a.tokenCount)
    .slice(0, 3);

  const findings: AuditFinding[] = [
    {
      id: `token-budget:always-loaded`,
      category: "token-budget",
      severity,
      title: `Always-loaded context is ${total.toLocaleString()} tokens (budget ${DEFAULT_BUDGET.toLocaleString()})`,
      detail:
        `Over budget by ${overshoot.toLocaleString()} tokens. ` +
        "Every prompt pays this tax. Move agent-specific guidance into the agent's own file " +
        "and link from CLAUDE.md, or split CLAUDE.md by topic with conditional includes.",
      citations: top.map((f) => ({ path: f.relativePath })),
      deterministic: true,
    },
  ];

  return findings;
}

function pickSeverity(total: number, budget: number): SeverityBand {
  const ratio = total / budget;
  if (ratio > 3) return "Kill";
  if (ratio > 2) return "Weak";
  return "Mid";
}

export function _exportedForTesting(): { budget: number } {
  return { budget: DEFAULT_BUDGET };
}
