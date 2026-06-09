import { describe, expect, it } from 'vitest';
import {
  computeSolarLayout,
  extractOwningFolder,
  getClusterCenters,
  SOLAR_LAYOUT_CONSTANTS,
} from './solar-layout';
import { generateMockGalaxieData } from './mock-data';
import type { FileNode, GalaxieData } from './types';

const {
  CUSTOMER_CLUSTER_RADIUS,
  SUN_ORBIT_IN_CLUSTER,
  FOLDER_ORBIT_MIN,
  FILE_ORBIT_MIN,
  FOLDER_ARC_GAP,
  INTER_RING_GAP,
} = SOLAR_LAYOUT_CONSTANTS;

describe('extractOwningFolder', () => {
  it.each<[string, string | null]>([
    // Phase B (B.2): owning folder = dirname (immediate parent), not top segment.
    ['apps/web/src/lib/auth.ts', 'apps/web/src/lib'],
    ['.claude/agents/researcher.md', '.claude/agents'],
    ['.claude/CLAUDE.md', '.claude'],
    ['README.md', null],
    ['', null],
    ['nested/deeply/in/many/folders.ts', 'nested/deeply/in/many'],
  ])('extracts owning folder from %j → %j', (path, expected) => {
    expect(extractOwningFolder(path)).toBe(expected);
  });
});

describe('computeSolarLayout', () => {
  it('is deterministic across runs for identical input', () => {
    const data = generateMockGalaxieData();
    const a = computeSolarLayout(data);
    const b = computeSolarLayout(data);
    expect(a).toEqual(b);
  });

  it('emits exactly one sun node per repo', () => {
    const data = generateMockGalaxieData();
    const layout = computeSolarLayout(data);
    const suns = layout.nodes.filter((n) => n.kind === 'sun');
    expect(suns).toHaveLength(data.repos.length);
    const sunIds = new Set(suns.map((s) => s.id));
    for (const repo of data.repos) {
      expect(sunIds.has(repo.id)).toBe(true);
    }
  });

  it('places multi-repo customer suns on a ring ≥ SUN_ORBIT_IN_CLUSTER (Phase D count-aware)', () => {
    const data = generateMockGalaxieData();
    const layout = computeSolarLayout(data);
    const centers = new Map(
      getClusterCenters(data).map((c) => [c.customerId, c]),
    );
    const suns = layout.nodes.filter((n) => n.kind === 'sun');
    // All mock customers have multiple repos, so suns sit on a (count-aware)
    // ring whose radius is at least the base orbit; siblings share one radius.
    const radiusByCustomer = new Map<string, number>();
    for (const sun of suns) {
      const center = centers.get(sun.customerId)!;
      const distance = Math.hypot(sun.x - center.x, sun.y - center.y);
      expect(distance).toBeGreaterThan(SUN_ORBIT_IN_CLUSTER - 0.001);
      const prev = radiusByCustomer.get(sun.customerId);
      if (prev !== undefined) expect(Math.abs(distance - prev)).toBeLessThan(0.001);
      radiusByCustomer.set(sun.customerId, distance);
    }
  });

  it('places cluster centers on the CUSTOMER_CLUSTER_RADIUS circle around origin', () => {
    const data = generateMockGalaxieData();
    const centers = getClusterCenters(data);
    expect(centers).toHaveLength(data.customers.length);
    for (const c of centers) {
      const distance = Math.hypot(c.x, c.y);
      expect(distance).toBeGreaterThan(CUSTOMER_CLUSTER_RADIUS - 0.001);
      expect(distance).toBeLessThan(CUSTOMER_CLUSTER_RADIUS + 0.001);
    }
  });

  it('places all folder planets of a sun on one count-aware ring ≥ FOLDER_ORBIT_MIN', () => {
    const data = generateMockGalaxieData();
    const layout = computeSolarLayout(data);
    const sunPosById = new Map(
      layout.nodes
        .filter((n) => n.kind === 'sun')
        .map((s) => [s.id, { x: s.x, y: s.y }]),
    );
    const folderPlanets = layout.nodes.filter((n) => n.kind === 'folder');
    expect(folderPlanets.length).toBeGreaterThan(0);
    // Per sun, all folders share ONE ring radius ≥ the minimum.
    const ringBySun = new Map<string, number>();
    for (const planet of folderPlanets) {
      const sun = sunPosById.get(planet.parentSunId!)!;
      const distance = Math.hypot(planet.x - sun.x, planet.y - sun.y);
      expect(distance).toBeGreaterThan(FOLDER_ORBIT_MIN - 0.001);
      expect(planet.orbitRadius).toBeDefined();
      expect(Math.abs(distance - planet.orbitRadius!)).toBeLessThan(0.001);
      const prev = ringBySun.get(planet.parentSunId!);
      if (prev !== undefined) expect(Math.abs(distance - prev)).toBeLessThan(0.001);
      ringBySun.set(planet.parentSunId!, distance);
    }
  });

  it('places root files on a ring ≥ folder-ring + INTER_RING_GAP and ≥ FILE_ORBIT_MIN', () => {
    const data = generateMockGalaxieData();
    const layout = computeSolarLayout(data);
    const sunIds = new Set(
      layout.nodes.filter((n) => n.kind === 'sun').map((s) => s.id),
    );
    const sunPosById = new Map(
      layout.nodes
        .filter((n) => n.kind === 'sun')
        .map((s) => [s.id, { x: s.x, y: s.y }]),
    );
    const folderRingBySun = new Map<string, number>();
    for (const f of layout.nodes.filter((n) => n.kind === 'folder')) {
      folderRingBySun.set(f.parentSunId!, f.orbitRadius!);
    }
    const filePlanets = layout.nodes.filter((n) => n.kind === 'file');
    for (const planet of filePlanets) {
      expect(planet.parentSunId).toBeDefined();
      expect(sunIds.has(planet.parentSunId!)).toBe(true);
      const sun = sunPosById.get(planet.parentSunId!)!;
      const distance = Math.hypot(planet.x - sun.x, planet.y - sun.y);
      expect(distance).toBeGreaterThan(FILE_ORBIT_MIN - 0.001);
      const folderRing = folderRingBySun.get(planet.parentSunId!);
      if (folderRing !== undefined) {
        expect(distance).toBeGreaterThan(folderRing + INTER_RING_GAP - 0.001);
      }
    }
  });

  it('grows the folder ring so dense repos keep ≥ FOLDER_ARC_GAP arc spacing (Phase D)', () => {
    // 20 folders in one repo — far past the old 6-per-orbit cap.
    const files: FileNode[] = Array.from({ length: 20 }, (_, i) => ({
      id: `f${i}`,
      repoId: 'r1',
      customerId: 'c1',
      path: `dir${i}/file.md`,
      severity: 'Mid' as const,
      findingSnippet: '',
      findings: [],
    }));
    const layout = computeSolarLayout({
      customers: [{ id: 'c1', slug: 'c', label: 'C', aggregateSeverity: 'Mid' }],
      repos: [{ id: 'r1', customerId: 'c1', slug: 'r', label: 'R', aggregateSeverity: 'Mid' }],
      files,
    });
    const folders = layout.nodes.filter((n) => n.kind === 'folder');
    expect(folders).toHaveLength(20);
    const ring = folders[0]!.orbitRadius!;
    // All on one ring; arc length per planet ≥ the gap target.
    for (const f of folders) expect(Math.abs(f.orbitRadius! - ring)).toBeLessThan(0.001);
    const arcPerPlanet = (2 * Math.PI * ring) / folders.length;
    expect(arcPerPlanet).toBeGreaterThan(FOLDER_ARC_GAP - 0.001);
  });

  it('synthesizes folder aggregates with stable id = `${repoId}::folder::${name}`', () => {
    const data = generateMockGalaxieData();
    const layout = computeSolarLayout(data);
    for (const folder of layout.folders) {
      expect(folder.id).toBe(`${folder.repoId}::folder::${folder.name}`);
      expect(folder.fileCount).toBeGreaterThan(0);
    }
    const folderNodeIds = new Set(
      layout.nodes.filter((n) => n.kind === 'folder').map((n) => n.id),
    );
    for (const folder of layout.folders) {
      expect(folderNodeIds.has(folder.id)).toBe(true);
    }
  });
});

// Galaxie-Redesign Phase A + B — these assert the Kill-Gate + dirname
// containment: once FileNode.path carries a REAL path (Phase A), the layout
// derives folders by their owning folder = dirname (Phase B.2), persists their
// fileIds (B.3a), and the folder severity aggregate excludes dismissed findings
// (mirroring the DAL repo/customer rollups).
describe('computeSolarLayout — real-path containment (Phase A + B)', () => {
  const file = (over: Partial<FileNode> & Pick<FileNode, 'id' | 'path' | 'severity'>): FileNode => ({
    repoId: 'r1',
    customerId: 'c1',
    findingSnippet: '',
    findings: [],
    ...over,
  });

  const dataWith = (files: FileNode[]): GalaxieData => ({
    customers: [{ id: 'c1', slug: 'acme', label: 'Acme', aggregateSeverity: 'Mid' }],
    repos: [{ id: 'r1', customerId: 'c1', slug: 'r1', label: 'Repo', aggregateSeverity: 'Mid' }],
    files,
  });

  it('derives one folder per owning dirname (Kill-Gate: folder-count > 0)', () => {
    const layout = computeSolarLayout(
      dataWith([
        file({ id: 'f1', path: '.claude/CLAUDE.md', severity: 'Kill' }),
        file({ id: 'f2', path: '.claude/agents/researcher.md', severity: 'Mid' }),
        file({ id: 'f3', path: 'README.md', severity: 'Strong' }),
      ]),
    );
    // dirname containment: `.claude/CLAUDE.md` → `.claude`,
    // `.claude/agents/researcher.md` → `.claude/agents` (two distinct folders).
    expect(layout.folders).toHaveLength(2);
    const byName = new Map(layout.folders.map((f) => [f.name, f]));
    expect(byName.get('.claude')?.fileIds).toEqual(['f1']);
    expect(byName.get('.claude')?.aggregateSeverity).toBe('Kill');
    expect(byName.get('.claude/agents')?.fileIds).toEqual(['f2']);
    expect(byName.get('.claude/agents')?.aggregateSeverity).toBe('Mid');
    // README.md is a repo-root file (dirname === null), not foldered.
    const fileNodes = layout.nodes.filter((n) => n.kind === 'file');
    expect(fileNodes).toHaveLength(1);
    expect(fileNodes[0]!.id).toBe('f3');
  });

  it('collects multiple files of one folder into its fileIds', () => {
    const layout = computeSolarLayout(
      dataWith([
        file({ id: 'f1', path: 'docs/a.md', severity: 'Mid' }),
        file({ id: 'f2', path: 'docs/b.md', severity: 'Strong' }),
      ]),
    );
    expect(layout.folders).toHaveLength(1);
    const folder = layout.folders[0]!;
    expect(folder.name).toBe('docs');
    expect(folder.fileCount).toBe(2);
    expect(new Set(folder.fileIds)).toEqual(new Set(['f1', 'f2']));
  });

  it('excludes dismissed findings from the folder severity aggregate', () => {
    const layout = computeSolarLayout(
      dataWith([
        file({ id: 'f1', path: 'docs/a.md', severity: 'Mid' }),
        file({ id: 'f2', path: 'docs/b.md', severity: 'Kill', dismissStatus: 'dismissed' }),
      ]),
    );
    expect(layout.folders).toHaveLength(1);
    const folder = layout.folders[0]!;
    expect(folder.name).toBe('docs');
    // Both files counted + in fileIds, but the dismissed Kill is omitted from
    // the roll-up → aggregate is Mid, not Kill.
    expect(folder.fileCount).toBe(2);
    expect(folder.fileIds).toHaveLength(2);
    expect(folder.aggregateSeverity).toBe('Mid');
  });

  // Phase B (B.4) — a folder governed by a context-root config gets a nucleus.
  it('assigns a nucleus to a folder that holds a context-root config', () => {
    const layout = computeSolarLayout(
      dataWith([
        file({ id: 'f1', path: '.claude/CLAUDE.md', severity: 'Mid', kind: 'claude-md' }),
        file({ id: 'f2', path: '.claude/notes.md', severity: 'Strong' }),
      ]),
    );
    const folder = layout.folders.find((f) => f.name === '.claude')!;
    expect(folder.nucleus).toBeDefined();
    expect(folder.nucleus!.fileId).toBe('f1');
    expect(folder.nucleus!.kind).toBe('claude-md');
    expect(folder.nucleus!.path).toBe('.claude/CLAUDE.md');
  });

  it('leaves a folder of only agent files without a nucleus', () => {
    const layout = computeSolarLayout(
      dataWith([
        file({ id: 'f1', path: '.claude/agents/researcher.md', severity: 'Mid', kind: 'claude-agent' }),
        file({ id: 'f2', path: '.claude/agents/planner.md', severity: 'Kill', kind: 'claude-agent' }),
      ]),
    );
    const folder = layout.folders.find((f) => f.name === '.claude/agents')!;
    expect(folder.nucleus).toBeUndefined();
  });

  it('marks a folder as a submodule when its path matches a declared submodule', () => {
    const layout = computeSolarLayout({
      customers: [{ id: 'c1', slug: 'acme', label: 'Acme', aggregateSeverity: 'Mid' }],
      repos: [
        {
          id: 'r1',
          customerId: 'c1',
          slug: 'r1',
          label: 'Repo',
          aggregateSeverity: 'Mid',
          submodules: [{ path: '.claude', url: 'git@github.com:org/ctx.git' }],
        },
      ],
      files: [
        file({ id: 'f1', path: '.claude/CLAUDE.md', severity: 'Mid', kind: 'claude-md' }),
        file({ id: 'f2', path: 'docs/x.md', severity: 'Mid' }),
      ],
    });
    const claude = layout.folders.find((f) => f.name === '.claude')!;
    expect(claude.isSubmodule).toBe(true);
    expect(claude.submoduleUrl).toBe('git@github.com:org/ctx.git');
    const docs = layout.folders.find((f) => f.name === 'docs')!;
    expect(docs.isSubmodule).toBeUndefined();
  });

  it('prefers claude-md over agents-md over gemini-md as the nucleus', () => {
    const layout = computeSolarLayout(
      dataWith([
        file({ id: 'f1', path: 'cfg/GEMINI.md', severity: 'Mid', kind: 'gemini-md' }),
        file({ id: 'f2', path: 'cfg/AGENTS.md', severity: 'Mid', kind: 'agents-md' }),
        file({ id: 'f3', path: 'cfg/CLAUDE.md', severity: 'Mid', kind: 'claude-md' }),
      ]),
    );
    const folder = layout.folders.find((f) => f.name === 'cfg')!;
    expect(folder.nucleus!.kind).toBe('claude-md');
    expect(folder.nucleus!.fileId).toBe('f3');
  });
});
