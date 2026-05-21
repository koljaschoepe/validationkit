import type { SeverityBand } from '@vk/core';

/**
 * Repo-Galaxie types — the data shape behind the landing-hero visualisation
 * AND the eventual full-product feature. Extensible from day one so new
 * NodeKinds (e.g. 'package', 'service') and EdgeKinds (e.g. 'imports',
 * 'uses-skill') slot in without schema breakage.
 */

export type NodeKind =
  | 'workspace'
  | 'customer'
  | 'repo'
  | 'submodule'
  | 'folder'
  | 'file';

export type EdgeKind =
  /** Hierarchical containment: parent → child. */
  | 'contains'
  /** Repo embeds another repo via `.gitmodules`. Submodule is its own repo. */
  | 'submodule-link'
  /** V2: package dependency (npm/cargo/Go-mod). Not used in MVP. */
  | 'depends-on';

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** Null for root (workspace). */
  parentId: string | null;
  /** 0 = workspace, 1 = customer, 2 = repo, 3 = submodule/folder, 4 = file. */
  depth: number;

  // Optional metadata — extensible without breaking consumers.
  githubUrl?: string;
  filePath?: string;
  /** Commit-sha that a parent repo pins this submodule to. */
  submoduleRef?: string;

  // Severity accent — attached when the node carries finding(s).
  severity?: SeverityBand;
  findingCount?: number;

  // V2 file-metadata (Circle-Pack-Refactor 2026-05-20) — drives the
  // inspector's pill-row + pack-value weighting. Optional on all non-leaf nodes.
  bytes?: number;
  lines?: number;
  language?: string;
  lastModified?: string;
  previewLines?: string[];

  // V2 finding-detail (carried on the node itself, not a separate Map) —
  // inspector pulls these when the node is active.
  findingTitle?: string;
  findingRule?: string;
  findingDescription?: string;
  findingWhyImportant?: string;
  findingDiffBefore?: string;
  findingDiffAfter?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface RepoGalaxieData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Post-layout: same node + computed coordinates and visual radius. */
export interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  /** Visual sphere radius in viewBox-units (= pixels at 1× render scale). */
  radius: number;
}

/** Severity outlines drive these visual concerns. Single source of truth. */
export const NODE_KINDS: readonly NodeKind[] = [
  'workspace',
  'customer',
  'repo',
  'submodule',
  'folder',
  'file',
] as const;

export const EDGE_KINDS: readonly EdgeKind[] = [
  'contains',
  'submodule-link',
  'depends-on',
] as const;
