import type {
  FolderNode,
  GalaxieData,
  Severity,
  SolarLayout,
  SolarLayoutNode,
} from './types';

export const SOLAR_LAYOUT_CONSTANTS = {
  CUSTOMER_CLUSTER_RADIUS: 600,
  SUN_ORBIT_IN_CLUSTER: 220,
  FOLDER_ORBITS: [60, 95] as const,
  FILE_ORBIT: 130,
  SUN_RADIUS: 28,
  FOLDER_PLANET_RADIUS: 8,
  FILE_PLANET_RADIUS: 4,
} as const;

const { CUSTOMER_CLUSTER_RADIUS, SUN_ORBIT_IN_CLUSTER, FOLDER_ORBITS, FILE_ORBIT } =
  SOLAR_LAYOUT_CONSTANTS;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/** Extract the top-level folder name from a file path, or `null` for root files. */
export function extractTopFolder(path: string): string | null {
  if (!path) return null;
  const slash = path.indexOf('/');
  if (slash <= 0) return null;
  return path.slice(0, slash);
}

function aggregateSeverity(severities: readonly Severity[]): Severity {
  if (severities.some((s) => s === 'Kill')) return 'Kill';
  if (severities.some((s) => s === 'Weak')) return 'Weak';
  if (severities.length > 0 && severities.every((s) => s === 'Exceptional')) {
    return 'Exceptional';
  }
  const strongCount = severities.filter((s) => s === 'Strong').length;
  if (strongCount > severities.length / 2) return 'Strong';
  return 'Mid';
}

export interface ClusterCenter {
  customerId: string;
  x: number;
  y: number;
}

/**
 * Deterministic cluster centers: customers sorted by slug, placed on a circle of
 * radius {@link SOLAR_LAYOUT_CONSTANTS.CUSTOMER_CLUSTER_RADIUS} around the origin.
 */
export function getClusterCenters(data: GalaxieData): ClusterCenter[] {
  const sorted = [...data.customers].sort((a, b) => a.slug.localeCompare(b.slug));
  const n = Math.max(sorted.length, 1);
  return sorted.map((c, i) => {
    const angle = (i / n) * Math.PI * 2;
    return {
      customerId: c.id,
      x: Math.cos(angle) * CUSTOMER_CLUSTER_RADIUS,
      y: Math.sin(angle) * CUSTOMER_CLUSTER_RADIUS,
    };
  });
}

/**
 * Compute the multi-sun-cluster layout used by the Workspace galaxy.
 *
 * Each repo is rendered as its own sun. Suns belonging to the same customer are
 * clustered on an inner ring around that customer's cluster center. Folders and
 * root files orbit their parent sun on fixed orbits — folders on the inner
 * `FOLDER_ORBITS`, root files (paths without a folder segment) on `FILE_ORBIT`.
 *
 * Determinism: no RNG, no jitter. Identical input produces byte-identical output.
 */
export function computeSolarLayout(data: GalaxieData): SolarLayout {
  const nodes: SolarLayoutNode[] = [];
  const folders: FolderNode[] = [];

  const clusterCenters = getClusterCenters(data);
  const centerByCustomer = new Map(
    clusterCenters.map((c) => [c.customerId, c]),
  );

  // Group repos per customer for in-cluster angular spreading.
  const reposByCustomer = new Map<string, typeof data.repos>();
  for (const r of data.repos) {
    const arr = reposByCustomer.get(r.customerId) ?? [];
    arr.push(r);
    reposByCustomer.set(r.customerId, arr);
  }

  // Suns: one per repo, placed on the customer's inner cluster ring.
  const sunPositionById = new Map<string, { x: number; y: number }>();
  for (const [customerId, siblings] of reposByCustomer) {
    const center = centerByCustomer.get(customerId);
    if (!center) continue;
    const sorted = [...siblings].sort(
      (a, b) => hashString(a.slug) - hashString(b.slug),
    );
    const n = sorted.length;
    sorted.forEach((repo, i) => {
      const angle = n === 1 ? 0 : (i / n) * Math.PI * 2;
      const x = center.x + Math.cos(angle) * SUN_ORBIT_IN_CLUSTER;
      const y = center.y + Math.sin(angle) * SUN_ORBIT_IN_CLUSTER;
      sunPositionById.set(repo.id, { x, y });
      nodes.push({
        id: repo.id,
        kind: 'sun',
        repoId: repo.id,
        customerId,
        x,
        y,
      });
    });
  }

  // Group files per repo + per top-folder to derive synthetic folders and to
  // separate root files (no folder segment) from foldered files.
  type FolderGroup = {
    name: string;
    fileIds: string[];
    severities: Severity[];
  };

  const filesByRepo = new Map<string, typeof data.files>();
  for (const f of data.files) {
    const arr = filesByRepo.get(f.repoId) ?? [];
    arr.push(f);
    filesByRepo.set(f.repoId, arr);
  }

  const repoById = new Map(data.repos.map((r) => [r.id, r]));

  for (const [repoId, files] of filesByRepo) {
    const sunPos = sunPositionById.get(repoId);
    const repo = repoById.get(repoId);
    if (!sunPos || !repo) continue;

    const foldersInRepo = new Map<string, FolderGroup>();
    const rootFiles: typeof data.files = [];

    for (const file of files) {
      const top = extractTopFolder(file.path);
      if (top === null) {
        rootFiles.push(file);
        continue;
      }
      const group = foldersInRepo.get(top) ?? {
        name: top,
        fileIds: [],
        severities: [],
      };
      group.fileIds.push(file.id);
      group.severities.push(file.severity);
      foldersInRepo.set(top, group);
    }

    // Folder planets, distributed across FOLDER_ORBITS. First 6 folders go on
    // orbit[0], remainder on orbit[1]. Within an orbit, sorted by hash for
    // stable angular position.
    const folderEntries = [...foldersInRepo.values()].sort(
      (a, b) => hashString(a.name) - hashString(b.name),
    );
    const orbit0 = folderEntries.slice(0, 6);
    const orbit1 = folderEntries.slice(6);

    const placeFolderOnOrbit = (
      group: FolderGroup,
      orbitRadius: number,
      idx: number,
      total: number,
    ) => {
      const angle = total === 1 ? 0 : (idx / total) * Math.PI * 2;
      const folderId = `${repoId}::folder::${group.name}`;
      const aggregate = aggregateSeverity(group.severities);
      folders.push({
        id: folderId,
        repoId,
        customerId: repo.customerId,
        name: group.name,
        fileCount: group.fileIds.length,
        aggregateSeverity: aggregate,
      });
      nodes.push({
        id: folderId,
        kind: 'folder',
        repoId,
        customerId: repo.customerId,
        x: sunPos.x + Math.cos(angle) * orbitRadius,
        y: sunPos.y + Math.sin(angle) * orbitRadius,
        orbitRadius,
        parentSunId: repoId,
      });
    };

    orbit0.forEach((g, i) => placeFolderOnOrbit(g, FOLDER_ORBITS[0], i, orbit0.length));
    orbit1.forEach((g, i) => placeFolderOnOrbit(g, FOLDER_ORBITS[1], i, orbit1.length));

    // Root files on FILE_ORBIT, sorted by file id hash for stable position.
    const sortedRootFiles = [...rootFiles].sort(
      (a, b) => hashString(a.id) - hashString(b.id),
    );
    const m = sortedRootFiles.length;
    sortedRootFiles.forEach((file, i) => {
      const angle = m === 1 ? 0 : (i / m) * Math.PI * 2;
      nodes.push({
        id: file.id,
        kind: 'file',
        repoId,
        customerId: repo.customerId,
        x: sunPos.x + Math.cos(angle) * FILE_ORBIT,
        y: sunPos.y + Math.sin(angle) * FILE_ORBIT,
        orbitRadius: FILE_ORBIT,
        parentSunId: repoId,
      });
    });
  }

  return { nodes, folders };
}
