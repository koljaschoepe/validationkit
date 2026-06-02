import { describe, expect, it } from 'vitest';
import {
  computeSolarLayout,
  extractTopFolder,
  getClusterCenters,
  SOLAR_LAYOUT_CONSTANTS,
} from './solar-layout';
import { generateMockGalaxieData } from './mock-data';

const { CUSTOMER_CLUSTER_RADIUS, SUN_ORBIT_IN_CLUSTER, FOLDER_ORBITS, FILE_ORBIT } =
  SOLAR_LAYOUT_CONSTANTS;

describe('extractTopFolder', () => {
  it.each<[string, string | null]>([
    ['apps/web/src/lib/auth.ts', 'apps'],
    ['.claude/agents/researcher.md', '.claude'],
    ['README.md', null],
    ['', null],
    ['nested/deeply/in/many/folders.ts', 'nested'],
  ])('extracts top folder from %j → %j', (path, expected) => {
    expect(extractTopFolder(path)).toBe(expected);
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

  it('places suns of one customer within SUN_ORBIT_IN_CLUSTER of their cluster center', () => {
    const data = generateMockGalaxieData();
    const layout = computeSolarLayout(data);
    const centers = new Map(
      getClusterCenters(data).map((c) => [c.customerId, c]),
    );
    const suns = layout.nodes.filter((n) => n.kind === 'sun');
    for (const sun of suns) {
      const center = centers.get(sun.customerId);
      expect(center).toBeDefined();
      const distance = Math.hypot(sun.x - center!.x, sun.y - center!.y);
      expect(distance).toBeGreaterThan(SUN_ORBIT_IN_CLUSTER - 0.001);
      expect(distance).toBeLessThan(SUN_ORBIT_IN_CLUSTER + 0.001);
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

  it('places folder planets exactly on one of FOLDER_ORBITS radii from their sun', () => {
    const data = generateMockGalaxieData();
    const layout = computeSolarLayout(data);
    const sunPosById = new Map(
      layout.nodes
        .filter((n) => n.kind === 'sun')
        .map((s) => [s.id, { x: s.x, y: s.y }]),
    );
    const folderPlanets = layout.nodes.filter((n) => n.kind === 'folder');
    expect(folderPlanets.length).toBeGreaterThan(0);
    for (const planet of folderPlanets) {
      const sun = sunPosById.get(planet.parentSunId!);
      expect(sun).toBeDefined();
      const distance = Math.hypot(planet.x - sun!.x, planet.y - sun!.y);
      const matches = FOLDER_ORBITS.some(
        (r) => Math.abs(distance - r) < 0.001,
      );
      expect(matches, `distance ${distance} matches one of ${FOLDER_ORBITS}`).toBe(true);
    }
  });

  it('places root-file planets on FILE_ORBIT from their sun and links via parentSunId', () => {
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
    const filePlanets = layout.nodes.filter((n) => n.kind === 'file');
    for (const planet of filePlanets) {
      expect(planet.parentSunId).toBeDefined();
      expect(sunIds.has(planet.parentSunId!)).toBe(true);
      const sun = sunPosById.get(planet.parentSunId!)!;
      const distance = Math.hypot(planet.x - sun.x, planet.y - sun.y);
      expect(Math.abs(distance - FILE_ORBIT)).toBeLessThan(0.001);
    }
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
