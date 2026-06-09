import type {
  Customer,
  Repo,
  FileNode,
  Severity,
  GalaxieData,
} from './types';

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

type SeverityMix = 'kill-heavy' | 'mixed' | 'strong-heavy';

function pickSeverity(rng: () => number, mix: SeverityMix): Severity {
  const r = rng();
  if (mix === 'kill-heavy') {
    if (r < 0.4) return 'Kill';
    if (r < 0.65) return 'Weak';
    if (r < 0.85) return 'Mid';
    if (r < 0.97) return 'Strong';
    return 'Exceptional';
  }
  if (mix === 'strong-heavy') {
    if (r < 0.05) return 'Kill';
    if (r < 0.15) return 'Weak';
    if (r < 0.35) return 'Mid';
    if (r < 0.75) return 'Strong';
    return 'Exceptional';
  }
  if (r < 0.15) return 'Kill';
  if (r < 0.35) return 'Weak';
  if (r < 0.65) return 'Mid';
  if (r < 0.9) return 'Strong';
  return 'Exceptional';
}

function aggregate(severities: Severity[]): Severity {
  if (severities.some((s) => s === 'Kill')) return 'Kill';
  if (severities.some((s) => s === 'Weak')) return 'Weak';
  if (severities.length > 0 && severities.every((s) => s === 'Exceptional'))
    return 'Exceptional';
  const strongCount = severities.filter((s) => s === 'Strong').length;
  if (strongCount > severities.length / 2) return 'Strong';
  return 'Mid';
}

const CUSTOMER_PROFILES: Array<{
  slug: string;
  label: string;
  mix: SeverityMix;
}> = [
  { slug: 'acme', label: 'Acme Robotics', mix: 'mixed' },
  { slug: 'globex', label: 'Globex Corp', mix: 'kill-heavy' },
  { slug: 'initech', label: 'Initech Labs', mix: 'strong-heavy' },
];

const REPO_NAMES = ['core', 'agents', 'docs-portal', 'pipeline', 'platform'];

const FILE_PATHS = [
  '.claude/CLAUDE.md',
  '.claude/agents/researcher.md',
  '.claude/agents/reviewer.md',
  '.claude/commands/audit.md',
  '.cursor/rules/typescript.mdc',
  '.cursor/rules/style.mdc',
  '.windsurf/rules.md',
  '.clinerules',
  'AGENTS.md',
  'aider.conf.yml',
];

// Phase B (B.4) — hard-coded kinds for the demo (classifyPath lives in @vk/parser
// which pulls node:fs, so we don't import it into this client-side mock). Drives
// the folder nucleus: `.claude/CLAUDE.md` → claude-md makes `.claude` a context
// folder with a visible inner core.
const FILE_KIND_BY_PATH: Record<string, NonNullable<FileNode['kind']>> = {
  '.claude/CLAUDE.md': 'claude-md',
  '.claude/agents/researcher.md': 'claude-agent',
  '.claude/agents/reviewer.md': 'claude-agent',
  '.claude/commands/audit.md': 'claude-command',
  '.cursor/rules/typescript.mdc': 'cursor-rule-mdc',
  '.cursor/rules/style.mdc': 'cursor-rule-mdc',
  '.windsurf/rules.md': 'windsurf-rule',
  '.clinerules': 'cline-rule',
  'AGENTS.md': 'agents-md',
  'aider.conf.yml': 'aider-conf',
};

const FINDING_SNIPPETS: Record<Severity, string[]> = {
  Kill: [
    'Conflicting directives: "always use X" vs "never use X" in same scope.',
    'Token-budget exceeded: 38k always-loaded (limit 25k).',
    'Stale reference: links to deleted .agent/legacy.md.',
  ],
  Weak: [
    'Duplicate guidance: 91% trigram-similarity to .cursor/rules/style.mdc.',
    'Unused agent: defined in .claude/agents/, never invoked.',
  ],
  Mid: [
    'Context-bloat: 9.2k tokens single file (threshold 8k).',
    'Slightly outdated tool reference (rg vs ripgrep).',
  ],
  Strong: [
    'Healthy file, minor stylistic noise.',
    'Well-scoped agent with single responsibility.',
  ],
  Exceptional: [
    'Exemplary: tight scope, clear triggers, citation-style links.',
    'Reference-quality: minimal token-cost, maximum signal.',
  ],
};

export const DEFAULT_MOCK_SEED = 'galaxie-mock-v1';

export function generateMockGalaxieData(
  seedString: string = DEFAULT_MOCK_SEED,
): GalaxieData {
  const rng = mulberry32(hashString(seedString));

  const customers: Customer[] = [];
  const repos: Repo[] = [];
  const files: FileNode[] = [];

  for (const profile of CUSTOMER_PROFILES) {
    const customerId = `cust-${profile.slug}`;
    const customerSeverities: Severity[] = [];

    for (const repoSlug of REPO_NAMES) {
      const repoId = `${customerId}/${repoSlug}`;
      const repoSeverities: Severity[] = [];

      for (const path of FILE_PATHS) {
        const sev = pickSeverity(rng, profile.mix);
        const pool = FINDING_SNIPPETS[sev];
        const snippet = pool[Math.floor(rng() * pool.length)]!;
        files.push({
          id: `${repoId}::${path}`,
          repoId,
          customerId,
          path,
          severity: sev,
          findingSnippet: snippet,
          ...(FILE_KIND_BY_PATH[path] ? { kind: FILE_KIND_BY_PATH[path] } : {}),
          // Phase B (B.1) — mock files carry a single synthetic finding so the
          // demo inspector renders the same finding-list shape as real data.
          findings: [{ id: `${repoId}::${path}::finding`, severity: sev, snippet }],
        });
        repoSeverities.push(sev);
      }

      const repoAgg = aggregate(repoSeverities);
      repos.push({
        id: repoId,
        customerId,
        slug: repoSlug,
        label: repoSlug,
        aggregateSeverity: repoAgg,
        // Phase B (B.5) — demo the shared-team-context submodule pattern
        // (`.claude` mounted from a separate repo, like code-apps-template).
        submodules: [
          { path: '.claude', url: 'git@github.com:unit-ix/code-apps-context.git' },
        ],
      });
      customerSeverities.push(repoAgg);
    }

    customers.push({
      id: customerId,
      slug: profile.slug,
      label: profile.label,
      aggregateSeverity: aggregate(customerSeverities),
    });
  }

  return { customers, repos, files };
}
