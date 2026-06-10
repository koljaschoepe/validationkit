import type { GraphNode, RepoGalaxieData } from './types';

/**
 * Landing-hero demo data — fraud-detection-monorepo of "acme-bank" with 15
 * real-world AI-context files reflecting the Linux-Foundation AGENTS.md
 * standard (Aug 2025+) plus Claude Code, Copilot, Cursor, Windsurf, Aider,
 * Gemini conventions. Folder hierarchy is preserved so d3.pack nests them
 * visually as planetary systems.
 *
 * 6 findings spread over the severity bands: 2× Kill / 3× Mid / 1× Weak / 1× Strong.
 */

// helper to keep IDs collision-safe
const N = (id: string, p: Partial<GraphNode> = {}): GraphNode => ({
  id,
  kind: 'file',
  label: '',
  parentId: null,
  depth: 0,
  ...p,
});

const REPO_ID = 'repo-fraud-detection-monorepo';

// ─── Folders ────────────────────────────────────────────────────────────────

const repo: GraphNode = {
  id: REPO_ID,
  kind: 'repo',
  label: 'fraud-detection-monorepo',
  parentId: null,
  depth: 0,
  githubUrl: 'https://github.com/acme-bank/fraud-detection-monorepo',
};

const folders: GraphNode[] = [
  N('folder-apps', { kind: 'folder', label: 'apps', parentId: REPO_ID, depth: 1 }),
  N('folder-apps-api', { kind: 'folder', label: 'api', parentId: 'folder-apps', depth: 2 }),
  N('folder-apps-web', { kind: 'folder', label: 'web', parentId: 'folder-apps', depth: 2 }),
  N('folder-claude', { kind: 'folder', label: '.claude', parentId: REPO_ID, depth: 1 }),
  N('folder-claude-skills', { kind: 'folder', label: 'skills', parentId: 'folder-claude', depth: 2 }),
  N('folder-skill-db', { kind: 'folder', label: 'db-migration', parentId: 'folder-claude-skills', depth: 3 }),
  N('folder-skill-deploy', { kind: 'folder', label: 'deploy', parentId: 'folder-claude-skills', depth: 3 }),
  N('folder-skill-audit', { kind: 'folder', label: 'audit-rules', parentId: 'folder-claude-skills', depth: 3 }),
  N('folder-claude-agents', { kind: 'folder', label: 'agents', parentId: 'folder-claude', depth: 2 }),
  N('folder-github', { kind: 'folder', label: '.github', parentId: REPO_ID, depth: 1 }),
  N('folder-cursor', { kind: 'folder', label: '.cursor', parentId: REPO_ID, depth: 1 }),
  N('folder-cursor-rules', { kind: 'folder', label: 'rules', parentId: 'folder-cursor', depth: 2 }),
];

// ─── Files (15) ─────────────────────────────────────────────────────────────

const files: GraphNode[] = [
  // Root-level
  {
    id: 'file-agents-root',
    kind: 'file',
    label: 'AGENTS.md',
    parentId: REPO_ID,
    depth: 1,
    bytes: 8200,
    lines: 220,
    language: 'md',
    lastModified: '2026-05-12',
    filePath: '/AGENTS.md',
    previewLines: [
      '# fraud-detection-monorepo',
      '',
      'Linux-Foundation AGENTS.md (2025+). Root entry-point for all coding agents.',
      '',
      '## Build',
      '- pnpm install',
      '- pnpm -w build',
      '',
      '## Test',
      '- pnpm -w test  # vitest workspace',
    ],
  },
  {
    id: 'file-claude-md',
    kind: 'file',
    label: 'CLAUDE.md',
    parentId: REPO_ID,
    depth: 1,
    bytes: 16400,
    lines: 412,
    language: 'md',
    lastModified: '2026-04-30',
    filePath: '/CLAUDE.md',
    previewLines: [
      '# CLAUDE.md fraud-detection',
      '',
      '> context_budget: 8400 tokens',
      '> last_audit: 2026-04-12',
      '',
      '## Architecture',
      'Monorepo, pnpm workspaces. apps/api (Hono), apps/web (Next 16).',
      '',
      '## Conventions',
      '- TypeScript strict, no `any`',
    ],
    severity: 'Weak',
    findingCount: 1,
    findingTitle: 'CLAUDE.md überschreitet Agency-Token-Budget',
    findingRule: 'token-budget-overshoot',
    findingDescription:
      'context_budget liegt bei 8400 Tokens, also 68 % über dem Agency-Default von 5000. Eine Begründung fehlt im File.',
    findingWhyImportant:
      'Token-Overshoots fressen Cost + Latency unbemerkt. Agency-Lena will ein konsistentes Budget über alle Customer-Repos.',
    findingDiffBefore: '> context_budget: 8400 tokens\n> # (no rationale)',
    findingDiffAfter:
      '> context_budget: 5000 tokens\n> # back to agency default, fraud-detection has compact spec',
  },
  {
    id: 'file-gemini-md',
    kind: 'file',
    label: 'GEMINI.md',
    parentId: REPO_ID,
    depth: 1,
    bytes: 15800,
    lines: 398,
    language: 'md',
    lastModified: '2026-05-14',
    filePath: '/GEMINI.md',
    previewLines: [
      '# GEMINI.md fraud-detection',
      '',
      '> mirrored from CLAUDE.md via .agency/sync-claude-gemini.yml',
      '> last_sync: 2026-05-14',
      '',
      '## Architecture',
      'Monorepo, pnpm workspaces.',
    ],
    severity: 'Strong',
    findingCount: 1,
    findingTitle: 'GEMINI.md sauber synchron mit CLAUDE.md',
    findingRule: 'best-practice-multi-provider-sync',
    findingDescription:
      'GEMINI.md wird via Agency-Workflow synchron zu CLAUDE.md gehalten. Audit-Score Strong seit 90 Tagen.',
    findingWhyImportant:
      'Multi-Provider-Setups (Claude + Gemini + Copilot) brauchen Single-Source-of-Truth. Diese Agency macht es vorbildlich.',
    findingDiffBefore: '# Audit-Re-Run last 2026-05-14\n# severity: Strong',
    findingDiffAfter: '# ✓ no action required',
  },
  {
    id: 'file-windsurfrules',
    kind: 'file',
    label: '.windsurfrules',
    parentId: REPO_ID,
    depth: 1,
    bytes: 5400,
    lines: 175,
    language: 'md',
    lastModified: '2026-04-08',
    filePath: '/.windsurfrules',
    previewLines: [
      '# Windsurf rules fraud-detection',
      '',
      'Style: TypeScript strict.',
      'Tests: vitest, never jest.',
      'Imports: absolute via @/ alias.',
      '',
      '## Forbidden',
      '- any',
      '- ts-ignore',
    ],
  },
  {
    id: 'file-aider-conf',
    kind: 'file',
    label: '.aider.conf.yml',
    parentId: REPO_ID,
    depth: 1,
    bytes: 410,
    lines: 12,
    language: 'yaml',
    lastModified: '2026-02-18',
    filePath: '/.aider.conf.yml',
    previewLines: [
      'model: claude-opus-4-7',
      'read:',
      '  - CONVENTIONS.md',
      '  - AGENTS.md',
      'auto-commit: false',
      'lint-cmd: pnpm lint',
    ],
    severity: 'Kill',
    findingCount: 1,
    findingTitle: 'aider.conf.yml referenziert nicht-existente CONVENTIONS.md',
    findingRule: 'stale-file-reference',
    findingDescription:
      '`read: CONVENTIONS.md` zeigt auf eine Datei, die es im Repo nicht gibt. Aider lädt nichts statt der erwarteten Conventions.',
    findingWhyImportant:
      'Stale reads in aider.conf.yml sind silent failures. Aider startet, ignoriert aber die wichtigsten Conventions.',
    findingDiffBefore: 'read:\n  - CONVENTIONS.md  # ← does not exist',
    findingDiffAfter: 'read:\n  - AGENTS.md       # ← canonical entry-point',
  },

  // apps/api
  {
    id: 'file-apps-api-agents',
    kind: 'file',
    label: 'AGENTS.md',
    parentId: 'folder-apps-api',
    depth: 3,
    bytes: 3100,
    lines: 82,
    language: 'md',
    lastModified: '2026-05-08',
    filePath: '/apps/api/AGENTS.md',
    previewLines: [
      '# apps/api AGENTS.md',
      '',
      'Hono API server, runs on Cloudflare Workers.',
      '',
      '## Build',
      'pnpm --filter @acme/api build',
      '',
      '## Test',
      'pnpm --filter @acme/api test',
    ],
  },

  // apps/web
  {
    id: 'file-apps-web-agents',
    kind: 'file',
    label: 'AGENTS.md',
    parentId: 'folder-apps-web',
    depth: 3,
    bytes: 1200,
    lines: 35,
    language: 'md',
    lastModified: '2026-04-22',
    filePath: '/apps/web/AGENTS.md',
    previewLines: [
      '# apps/web AGENTS.md',
      '',
      'Next.js 16 frontend.',
      '',
      '## Build',
      'pnpm --filter @acme/web build',
    ],
  },

  // .claude/skills/db-migration/SKILL.md
  {
    id: 'file-skill-db-migration',
    kind: 'file',
    label: 'SKILL.md',
    parentId: 'folder-skill-db',
    depth: 4,
    bytes: 1450,
    lines: 38,
    language: 'md',
    lastModified: '2026-03-30',
    filePath: '/.claude/skills/db-migration/SKILL.md',
    previewLines: [
      '---',
      'name: db-migration',
      '# description: (MISSING)',
      '---',
      '',
      '# Database migration helper',
      '',
      'Generates Drizzle migrations from schema diffs.',
    ],
    severity: 'Mid',
    findingCount: 1,
    findingTitle: 'SKILL.md Frontmatter fehlt `description`',
    findingRule: 'skill-frontmatter-incomplete',
    findingDescription:
      'Claude Code Auto-Discovery braucht `description` im YAML-Frontmatter. Skill wird ohne description nicht von Claude aufgegriffen.',
    findingWhyImportant:
      'Skills ohne description sind für den Agent unsichtbar, der ganze Audit-Wert geht verloren.',
    findingDiffBefore: '---\nname: db-migration\n# description: (MISSING)\n---',
    findingDiffAfter:
      '---\nname: db-migration\ndescription: Generate Drizzle migrations from schema diffs\n---',
  },

  // .claude/skills/deploy/SKILL.md
  {
    id: 'file-skill-deploy',
    kind: 'file',
    label: 'SKILL.md',
    parentId: 'folder-skill-deploy',
    depth: 4,
    bytes: 2200,
    lines: 58,
    language: 'md',
    lastModified: '2026-05-01',
    filePath: '/.claude/skills/deploy/SKILL.md',
    previewLines: [
      '---',
      'name: deploy',
      'description: Deploy fraud-detection to staging or production',
      '---',
      '',
      '# Deploy skill',
      '',
      'Runs `scripts/deploy-staging.sh` or `scripts/deploy-prod.sh`.',
    ],
  },

  // .claude/skills/audit-rules/SKILL.md
  {
    id: 'file-skill-audit',
    kind: 'file',
    label: 'SKILL.md',
    parentId: 'folder-skill-audit',
    depth: 4,
    bytes: 3400,
    lines: 92,
    language: 'md',
    lastModified: '2026-05-13',
    filePath: '/.claude/skills/audit-rules/SKILL.md',
    previewLines: [
      '---',
      'name: audit-rules',
      'description: Validate compliance rules against transactions',
      '---',
      '',
      '# Audit-rules skill',
      '',
      'Loads rules/*.yaml and applies them.',
    ],
  },

  // .claude/agents/security-reviewer.md
  {
    id: 'file-agent-security',
    kind: 'file',
    label: 'security-reviewer.md',
    parentId: 'folder-claude-agents',
    depth: 3,
    bytes: 3500,
    lines: 95,
    language: 'md',
    lastModified: '2026-04-18',
    filePath: '/.claude/agents/security-reviewer.md',
    previewLines: [
      '---',
      'name: security-reviewer',
      'description: PCI-DSS + GDPR review for fraud-detection PRs',
      '---',
      '',
      'You are a security reviewer focused on payment data.',
    ],
  },

  // .claude/agents/test-runner.md
  {
    id: 'file-agent-tests',
    kind: 'file',
    label: 'test-runner.md',
    parentId: 'folder-claude-agents',
    depth: 3,
    bytes: 2800,
    lines: 76,
    language: 'md',
    lastModified: '2026-05-09',
    filePath: '/.claude/agents/test-runner.md',
    previewLines: [
      '---',
      'name: test-runner',
      'description: Runs vitest suites and reports flakes',
      '---',
      '',
      'You execute tests, parse output, and surface regressions.',
    ],
  },

  // .claude/settings.local.json
  {
    id: 'file-claude-local',
    kind: 'file',
    label: 'settings.local.json',
    parentId: 'folder-claude',
    depth: 2,
    bytes: 800,
    lines: 18,
    language: 'json',
    lastModified: '2026-05-18',
    filePath: '/.claude/settings.local.json',
    previewLines: [
      '{',
      '  "userKeys": {',
      '    "ANTHROPIC_API_KEY": "sk-ant-api03-redacted",',
      '    "GITHUB_TOKEN": "ghp_redacted"',
      '  },',
      '  "developer": "kolja@acme-bank.de"',
      '}',
    ],
    severity: 'Kill',
    findingCount: 1,
    findingTitle: 'settings.local.json versehentlich committed',
    findingRule: 'leaked-local-settings',
    findingDescription:
      '.claude/settings.local.json liegt im Repo und enthält API-Keys plus persönliche Developer-Daten. Gehört in die `.gitignore`.',
    findingWhyImportant:
      'API-Keys + GitHub-Tokens public im Repo sind ein Security-Incident. Sofortiger Rotate + git-history-rewrite empfohlen.',
    findingDiffBefore: '# .gitignore (current)\nnode_modules/\n.next/',
    findingDiffAfter:
      '# .gitignore (recommended)\nnode_modules/\n.next/\n.claude/settings.local.json',
  },

  // .github/copilot-instructions.md
  {
    id: 'file-copilot',
    kind: 'file',
    label: 'copilot-instructions.md',
    parentId: 'folder-github',
    depth: 2,
    bytes: 5100,
    lines: 132,
    language: 'md',
    lastModified: '2026-04-05',
    filePath: '/.github/copilot-instructions.md',
    previewLines: [
      '# Copilot instructions fraud-detection',
      '',
      '## Tests',
      'Use **Jest** for all unit-tests.',
      'Mock the database via `jest.mock(...)`.',
      '',
      '## Imports',
      'Relative paths only.',
    ],
    severity: 'Mid',
    findingCount: 1,
    findingTitle: 'Konflikt zwischen Copilot und CLAUDE.md, Vitest gegen Jest',
    findingRule: 'duplicate-conflicting-rules',
    findingDescription:
      'copilot-instructions.md schreibt Jest vor, CLAUDE.md und .windsurfrules schreiben Vitest vor. Das Resultat ist inkonsistenter Code je nach Agent.',
    findingWhyImportant:
      'Wenn Agents widersprüchliche Test-Frameworks erzwingen, entstehen Doppel-Suites und die PR-Reviews werden chaotisch.',
    findingDiffBefore: '## Tests\nUse **Jest** for all unit-tests.',
    findingDiffAfter:
      '## Tests\nUse **Vitest** (vitest workspace), aligned with CLAUDE.md + .windsurfrules.',
  },

  // .cursor/rules/typescript.mdc
  {
    id: 'file-cursor-rules-ts',
    kind: 'file',
    label: 'typescript.mdc',
    parentId: 'folder-cursor-rules',
    depth: 3,
    bytes: 7200,
    lines: 198,
    language: 'mdc',
    lastModified: '2026-05-15',
    filePath: '/.cursor/rules/typescript.mdc',
    previewLines: [
      '---',
      'description: TypeScript conventions for fraud-detection',
      'globs: ["**/*.ts", "**/*.tsx"]',
      'alwaysApply: true   # ← injects 7 KB per request',
      '---',
      '',
      '# TypeScript rules',
      '',
      'Strict mode mandatory.',
    ],
  },
];

// ─── Assemble ───────────────────────────────────────────────────────────────

const allNodes: GraphNode[] = [repo, ...folders, ...files];

export const DEMO_GALAXIE: RepoGalaxieData = {
  nodes: allNodes,
  // Circle-Pack does not render edges; we still keep the contains-edges in
  // the data model so consumers (other layouts, sidebar tree-view) can use them.
  edges: allNodes
    .filter((n) => n.parentId != null)
    .map((n) => ({
      from: n.parentId!,
      to: n.id,
      kind: 'contains' as const,
    })),
};

/** Subset of nodes that carry findings (used by sr-only findings-list). */
export const DEMO_FINDINGS = files
  .filter((n) => n.severity != null)
  .map((n) => ({
    id: `finding-${n.id}`,
    nodeId: n.id,
    title: n.findingTitle ?? '',
    rule: n.findingRule ?? '',
    severity: n.severity!,
  }));

export const DEFAULT_NODE_ID = 'file-claude-md';

export function findingByNodeId(nodeId: string): GraphNode | undefined {
  return files.find((f) => f.id === nodeId);
}

/** Resolve a node by id (any kind). */
export function nodeById(nodeId: string): GraphNode | undefined {
  return allNodes.find((n) => n.id === nodeId);
}
