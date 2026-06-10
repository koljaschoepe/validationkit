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

type SeverityMix = 'kill-heavy' | 'mixed' | 'strong-heavy' | 'calm' | 'on-fire';

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
  // Landing-Redesign Phase K — `calm` / `on-fire` exist so the public showcase
  // honours the asymmetric-severity promise ("only fire screams, the rest stays
  // calm"). A repo aggregates to Kill if ANY of its 10 files is Kill, so to keep
  // most of the 30-repo portfolio quiet the per-file Kill rate must be tiny
  // (~1% → ~10% repo-Kill). `on-fire` customers carry the visible blazes.
  if (mix === 'calm') {
    if (r < 0.01) return 'Kill';
    if (r < 0.05) return 'Weak';
    if (r < 0.3) return 'Mid';
    if (r < 0.83) return 'Strong';
    return 'Exceptional';
  }
  if (mix === 'on-fire') {
    if (r < 0.07) return 'Kill';
    if (r < 0.27) return 'Weak';
    if (r < 0.6) return 'Mid';
    if (r < 0.9) return 'Strong';
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

interface CustomerProfile {
  slug: string;
  label: string;
  mix: SeverityMix;
}

const CUSTOMER_PROFILES: CustomerProfile[] = [
  { slug: 'acme', label: 'Acme Robotics', mix: 'mixed' },
  { slug: 'globex', label: 'Globex Corp', mix: 'kill-heavy' },
  { slug: 'initech', label: 'Initech Labs', mix: 'strong-heavy' },
];

/**
 * Landing-Redesign Phase K — a richer agency portfolio for the public
 * Pixi-Solar showcase (6 customers, 2 "on fire" = kill-heavy). Distinct from
 * the 3-customer workspace fallback above so the marketing demo reads as a
 * real multi-tenant agency at a glance. Passed explicitly via
 * `generateMockGalaxieData(seed, LANDING_DEMO_PROFILES)` — the default stays
 * 3 customers so the workspace mock + its test are untouched.
 */
export const LANDING_DEMO_PROFILES: CustomerProfile[] = [
  { slug: 'northwind', label: 'Northwind Trading', mix: 'calm' },
  { slug: 'globex', label: 'Globex Corp', mix: 'on-fire' },
  { slug: 'acme', label: 'Acme Robotics', mix: 'calm' },
  { slug: 'umbrella', label: 'Umbrella Health', mix: 'calm' },
  { slug: 'soylent', label: 'Soylent Systems', mix: 'on-fire' },
  { slug: 'initech', label: 'Initech Labs', mix: 'calm' },
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

// ── Landing Portfolio-Map — a deliberately SMALL, hand-authored fixture ───────
// The 30-repo generated portfolio read as an unreadable point-cloud. The public
// "Portfolio-Map" instead shows 6 customers with one repo each, 4 files apiece,
// and exactly two repos on fire — few, big, labelled, calm. Hand-authored (not
// RNG) so the severity story is deterministic: only the two blazes scream.
const MAP_FILE_PATHS = [
  '.claude/CLAUDE.md',
  '.cursor/rules/typescript.mdc',
  'AGENTS.md',
  'aider.conf.yml',
] as const;

interface MapRepoSpec {
  customerLabel: string;
  customerSlug: string;
  repoSlug: string;
  repoLabel: string;
  fileSeverities: [Severity, Severity, Severity, Severity];
}

const LANDING_MAP_SPEC: MapRepoSpec[] = [
  { customerLabel: 'Northwind Trading', customerSlug: 'northwind', repoSlug: 'billing-core', repoLabel: 'billing-core', fileSeverities: ['Strong', 'Strong', 'Mid', 'Strong'] },
  { customerLabel: 'Globex Corp', customerSlug: 'globex', repoSlug: 'agent-runtime', repoLabel: 'agent-runtime', fileSeverities: ['Kill', 'Mid', 'Strong', 'Weak'] },
  { customerLabel: 'Acme Robotics', customerSlug: 'acme', repoSlug: 'motion-api', repoLabel: 'motion-api', fileSeverities: ['Strong', 'Strong', 'Strong', 'Mid'] },
  { customerLabel: 'Umbrella Health', customerSlug: 'umbrella', repoSlug: 'patient-web', repoLabel: 'patient-web', fileSeverities: ['Mid', 'Strong', 'Strong', 'Mid'] },
  { customerLabel: 'Soylent Systems', customerSlug: 'soylent', repoSlug: 'data-mesh', repoLabel: 'data-mesh', fileSeverities: ['Kill', 'Weak', 'Mid', 'Strong'] },
  { customerLabel: 'Initech Labs', customerSlug: 'initech', repoSlug: 'docs-portal', repoLabel: 'docs-portal', fileSeverities: ['Strong', 'Exceptional', 'Mid', 'Strong'] },
];

export function buildLandingMap(): GalaxieData {
  const customers: Customer[] = [];
  const repos: Repo[] = [];
  const files: FileNode[] = [];

  for (const spec of LANDING_MAP_SPEC) {
    const customerId = `cust-${spec.customerSlug}`;
    const repoId = `${customerId}/${spec.repoSlug}`;

    spec.fileSeverities.forEach((sev, i) => {
      const path = MAP_FILE_PATHS[i]!;
      const snippet = FINDING_SNIPPETS[sev][0]!;
      files.push({
        id: `${repoId}::${path}`,
        repoId,
        customerId,
        path,
        severity: sev,
        findingSnippet: snippet,
        ...(FILE_KIND_BY_PATH[path] ? { kind: FILE_KIND_BY_PATH[path] } : {}),
        findings: [{ id: `${repoId}::${path}::finding`, severity: sev, snippet }],
      });
    });

    repos.push({
      id: repoId,
      customerId,
      slug: spec.repoSlug,
      label: spec.repoLabel,
      aggregateSeverity: aggregate(spec.fileSeverities),
    });

    customers.push({
      id: customerId,
      slug: spec.customerSlug,
      label: spec.customerLabel,
      aggregateSeverity: aggregate(spec.fileSeverities),
    });
  }

  return { customers, repos, files };
}

export const DEFAULT_MOCK_SEED = 'galaxie-mock-v1';

export function generateMockGalaxieData(
  seedString: string = DEFAULT_MOCK_SEED,
  profiles: CustomerProfile[] = CUSTOMER_PROFILES,
): GalaxieData {
  const rng = mulberry32(hashString(seedString));

  const customers: Customer[] = [];
  const repos: Repo[] = [];
  const files: FileNode[] = [];

  for (const profile of profiles) {
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
