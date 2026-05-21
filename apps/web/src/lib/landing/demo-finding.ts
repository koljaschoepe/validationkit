import type { SeverityBand } from "@vk/core";

/**
 * Static mock data for the public Landing-Hero. Drives the click-switchable
 * Inspector panel on the right side of the hero. Not connected to any backend.
 * If the real AGENTS.md schema changes, this mock may diverge — it is intended
 * purely as a self-explanatory visual demo, not as an audit example.
 */
export interface DemoFinding {
  id: string;
  file: string;
  title: string;
  severity: SeverityBand;
  diffBefore: string;
  diffAfter: string;
  explanation: string;
}

export const DEMO_REPO = {
  slug: "acme-fintech/payments-api",
  fileCount: 6,
  findingCount: 3,
} as const;

export const DEMO_FINDINGS: DemoFinding[] = [
  {
    id: "agents-claude-language",
    file: "agents/skills/code-review.md",
    title: "AGENTS.md ↔ CLAUDE.md Sprach-Konflikt",
    severity: "Mid",
    diffBefore: "- Respond in English to all code reviews",
    diffAfter: "+ Antworte auf Deutsch (Default Workspace-Sprache)",
    explanation:
      "AGENTS.md erzwingt Englisch, CLAUDE.md erzwingt Deutsch — die KI bekommt widersprüchliche Anweisungen.",
  },
  {
    id: "skill-registry-mismatch",
    file: "AGENTS.md",
    title: "Skill-Registry-Inkonsistenz",
    severity: "Weak",
    diffBefore: "- ## Skills\n-   - code-review\n-   - test-runner",
    diffAfter: "+ ## Skills\n+   - code-review\n+   - test-runner\n+   - security-review\n+   - migration-helper",
    explanation:
      "4 Skills existieren unter agents/skills/, AGENTS.md erwähnt aber nur 2. Tools sehen die anderen nicht.",
  },
  {
    id: "tool-permissions-conflict",
    file: "agents/skills/security-review.md",
    title: "Widersprüchliche Bash-Tool-Permissions",
    severity: "Kill",
    diffBefore: "- allowed_tools: [Bash, Read, Grep]",
    diffAfter: "+ allowed_tools: [Read, Grep]  # Bash via security-policy.md disallowed",
    explanation:
      "security-review erlaubt Bash, security-policy.md verbietet es. Policy-Bruch beim ersten Audit.",
  },
];

export const DEFAULT_FINDING_ID = "agents-claude-language";

export function findingById(id: string): DemoFinding {
  return DEMO_FINDINGS.find((f) => f.id === id) ?? DEMO_FINDINGS[0]!;
}
