import type { AgentFileKind } from '@vk/core';
import type {
  FolderNode,
  GalaxieData,
  Severity,
  SolarLayout,
  SolarLayoutNode,
} from './types';
import { aggregateSeverities } from './types';

// Galaxie-Redesign Phase B (B.4) — a folder's nucleus is the context-root config
// file that governs it. Lower number = higher priority when a folder has more
// than one candidate (CLAUDE.md wins over AGENTS.md wins over gemini.md).
const NUCLEUS_KIND_PRIORITY: Partial<Record<AgentFileKind, number>> = {
  'claude-md': 0,
  'agents-md': 1,
  'gemini-md': 2,
};

export const SOLAR_LAYOUT_CONSTANTS = {
  // Bundle I: 600→750. Clusters were close enough to crowd each other once the
  // sun orbit widened; scaled up to keep clusters cleanly separated.
  CUSTOMER_CLUSTER_RADIUS: 750,
  // Phase D — count-aware sun placement. `SUN_ORBIT_IN_CLUSTER` is the base/min
  // orbit; it grows when a customer has many repos so neighbouring suns keep a
  // tangential gap of ~`SUN_TANGENTIAL_GAP`. (Bundle I had pushed this to a flat
  // 300 to fix 5-sun overlap; D makes it scale instead of staying flat.)
  SUN_ORBIT_IN_CLUSTER: 300,
  SUN_TANGENTIAL_GAP: 380,
  // Phase D — count-aware orbit radii. Folders sit on ONE ring whose radius grows
  // with folder count so the per-planet arc stays ≥ the gap target (no more fixed
  // 2-orbit/6-cap crowding); root files sit on an outer ring kept ≥ INTER_RING_GAP
  // beyond the folder ring. Min radii give sparse repos a calm, stable layout.
  FOLDER_ORBIT_MIN: 70,
  FILE_ORBIT_MIN: 150,
  FOLDER_ARC_GAP: 48,
  FILE_ARC_GAP: 30,
  INTER_RING_GAP: 44,
  SUN_RADIUS: 28,
  // Phase E — modest radius bump for legibility + the file-vs-folder distinction.
  FOLDER_PLANET_RADIUS: 9,
  FILE_PLANET_RADIUS: 5,
} as const;

const {
  CUSTOMER_CLUSTER_RADIUS,
  SUN_ORBIT_IN_CLUSTER,
  SUN_TANGENTIAL_GAP,
  FOLDER_ORBIT_MIN,
  FILE_ORBIT_MIN,
  FOLDER_ARC_GAP,
  FILE_ARC_GAP,
  INTER_RING_GAP,
} = SOLAR_LAYOUT_CONSTANTS;

/**
 * Phase D — radius of a ring carrying `count` evenly-spaced planets, such that
 * the per-planet arc length is at least `arcGap`. Clamped to `min` so sparse
 * rings stay at a calm baseline. `R = max(min, count·arcGap / 2π)`.
 */
function ringRadius(min: number, count: number, arcGap: number): number {
  if (count <= 0) return min;
  return Math.max(min, (count * arcGap) / (2 * Math.PI));
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/**
 * The owning (immediate-parent) folder of a file path — i.e. `dirname`.
 * Returns `null` for repo-root files (no folder segment).
 *
 * Galaxie-Redesign Phase B (B.2): replaces the old top-segment-only
 * `extractTopFolder`. A file at `.claude/agents/x.md` is now owned by
 * `.claude/agents` (its real parent), not lumped under the top segment `.claude`.
 * Folders form a flat set keyed by the full parent path (unique within a repo);
 * the human display label (last segment, humanized) lands in Phase C.
 */
export function extractOwningFolder(path: string): string | null {
  if (!path) return null;
  const slash = path.lastIndexOf('/');
  if (slash <= 0) return null;
  return path.slice(0, slash);
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
    // Phase D — sun orbit grows with repo count so neighbouring suns keep a
    // tangential gap (single sun stays centred at the base orbit).
    const sunOrbit =
      n <= 1 ? 0 : ringRadius(SUN_ORBIT_IN_CLUSTER, n, SUN_TANGENTIAL_GAP);
    sorted.forEach((repo, i) => {
      const angle = n === 1 ? 0 : (i / n) * Math.PI * 2;
      const x = center.x + Math.cos(angle) * sunOrbit;
      const y = center.y + Math.sin(angle) * sunOrbit;
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
    nucleus?: { fileId: string; kind: AgentFileKind; path: string; priority: number };
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
      const owner = extractOwningFolder(file.path);
      if (owner === null) {
        rootFiles.push(file);
        continue;
      }
      const group = foldersInRepo.get(owner) ?? {
        name: owner,
        fileIds: [],
        severities: [],
      };
      group.fileIds.push(file.id);
      // Galaxie-Redesign Phase A — exclude dismissed findings from the folder
      // severity aggregate, mirroring the repo/customer rollups in the DAL. The
      // file still renders as a node; only its severity is omitted from the roll-up.
      if (file.dismissStatus !== 'dismissed') group.severities.push(file.severity);
      // Phase B (B.4) — track the folder's governing context-root config. Highest
      // priority (lowest number) wins; ties keep the first encountered (data.files
      // order is deterministic), so the result is stable.
      if (file.kind !== undefined) {
        const priority = NUCLEUS_KIND_PRIORITY[file.kind];
        if (
          priority !== undefined &&
          (group.nucleus === undefined || priority < group.nucleus.priority)
        ) {
          group.nucleus = {
            fileId: file.id,
            kind: file.kind,
            path: file.path,
            priority,
          };
        }
      }
      foldersInRepo.set(owner, group);
    }

    // Phase D — folders sit on ONE ring whose radius grows with folder count so
    // the per-planet arc stays ≥ FOLDER_ARC_GAP (no more fixed 2-orbit/6-cap
    // crowding). A per-repo angular offset keeps sibling suns' rings from
    // aligning identically. Sorted by name-hash for a stable angular position.
    const folderEntries = [...foldersInRepo.values()].sort(
      (a, b) => hashString(a.name) - hashString(b.name),
    );
    const folderRingR = ringRadius(
      FOLDER_ORBIT_MIN,
      folderEntries.length,
      FOLDER_ARC_GAP,
    );
    // Phase B (B.5) — folders whose path matches a declared submodule are
    // rendered as their own node class.
    const submoduleByPath = new Map(
      (repo.submodules ?? []).map((s) => [s.path, s.url]),
    );
    const folderAngleOffset = ((hashString(repoId) % 360) * Math.PI) / 180;
    const folderTotal = folderEntries.length;
    folderEntries.forEach((group, idx) => {
      const angle =
        folderAngleOffset +
        (folderTotal === 1 ? 0 : (idx / folderTotal) * Math.PI * 2);
      const folderId = `${repoId}::folder::${group.name}`;
      const aggregate = aggregateSeverities(group.severities);
      folders.push({
        id: folderId,
        repoId,
        customerId: repo.customerId,
        name: group.name,
        fileCount: group.fileIds.length,
        fileIds: group.fileIds,
        aggregateSeverity: aggregate,
        ...(group.nucleus
          ? {
              nucleus: {
                fileId: group.nucleus.fileId,
                kind: group.nucleus.kind,
                path: group.nucleus.path,
              },
            }
          : {}),
        ...(submoduleByPath.has(group.name)
          ? {
              isSubmodule: true,
              submoduleUrl: submoduleByPath.get(group.name)!,
            }
          : {}),
      });
      nodes.push({
        id: folderId,
        kind: 'folder',
        repoId,
        customerId: repo.customerId,
        x: sunPos.x + Math.cos(angle) * folderRingR,
        y: sunPos.y + Math.sin(angle) * folderRingR,
        orbitRadius: folderRingR,
        parentSunId: repoId,
      });
    });

    // Phase D — root files on an outer ring, kept ≥ INTER_RING_GAP beyond the
    // folder ring and itself count-aware. A distinct angular offset separates it
    // from the folder ring. Sorted by file-id hash for a stable position.
    const sortedRootFiles = [...rootFiles].sort(
      (a, b) => hashString(a.id) - hashString(b.id),
    );
    const m = sortedRootFiles.length;
    const fileRingR = Math.max(
      ringRadius(FILE_ORBIT_MIN, m, FILE_ARC_GAP),
      folderRingR + INTER_RING_GAP,
    );
    const fileAngleOffset = (((hashString(repoId) + 137) % 360) * Math.PI) / 180;
    sortedRootFiles.forEach((file, i) => {
      const angle =
        fileAngleOffset + (m === 1 ? 0 : (i / m) * Math.PI * 2);
      nodes.push({
        id: file.id,
        kind: 'file',
        repoId,
        customerId: repo.customerId,
        x: sunPos.x + Math.cos(angle) * fileRingR,
        y: sunPos.y + Math.sin(angle) * fileRingR,
        orbitRadius: fileRingR,
        parentSunId: repoId,
      });
    });
  }

  return { nodes, folders };
}
