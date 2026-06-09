import type { FileNode, FolderNode, GalaxieData, Repo, Severity } from './types';
import { SEVERITY_BANDS } from './types';
import { computeSolarLayout, extractOwningFolder } from './solar-layout';

/**
 * Galaxie-Redesign Phase G — canonical repo→folder→file tree for the
 * reduced-motion / keyboard surface (SolarListView). Built from the SAME
 * `computeSolarLayout` folder derivation the Pixi + SVG renderers use, so the
 * three views stay in parity (identical folder count, nesting, nucleus, labels).
 * Pure + deterministic.
 */
export interface FolderTreeNode {
  folder: FolderNode;
  files: FileNode[];
}

export interface RepoTreeNode {
  repo: Repo;
  folders: FolderTreeNode[];
  /** Repo-root files (no owning folder). */
  rootFiles: FileNode[];
}

// SEVERITY_BANDS is ordered worst → best, so a lower index = worse.
const rank = (s: Severity) => SEVERITY_BANDS.indexOf(s);
const bySeverityThenId = (a: FileNode, b: FileNode) =>
  rank(a.severity) - rank(b.severity) || a.id.localeCompare(b.id);

export function buildGalaxieTree(data: GalaxieData): RepoTreeNode[] {
  const { folders } = computeSolarLayout(data);
  const fileById = new Map(data.files.map((f) => [f.id, f]));

  const foldersByRepo = new Map<string, FolderNode[]>();
  for (const folder of folders) {
    const arr = foldersByRepo.get(folder.repoId) ?? [];
    arr.push(folder);
    foldersByRepo.set(folder.repoId, arr);
  }

  const filesByRepo = new Map<string, FileNode[]>();
  for (const f of data.files) {
    const arr = filesByRepo.get(f.repoId) ?? [];
    arr.push(f);
    filesByRepo.set(f.repoId, arr);
  }

  return data.repos.map((repo) => {
    const repoFolders = (foldersByRepo.get(repo.id) ?? [])
      .slice()
      .sort(
        (a, b) =>
          rank(a.aggregateSeverity) - rank(b.aggregateSeverity) ||
          a.name.localeCompare(b.name),
      )
      .map((folder): FolderTreeNode => ({
        folder,
        files: folder.fileIds
          .map((id) => fileById.get(id))
          .filter((f): f is FileNode => f !== undefined)
          .sort(bySeverityThenId),
      }));

    const rootFiles = (filesByRepo.get(repo.id) ?? [])
      .filter((f) => extractOwningFolder(f.path) === null)
      .sort(bySeverityThenId);

    return { repo, folders: repoFolders, rootFiles };
  });
}
