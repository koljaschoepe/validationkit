export const SEVERITY_BANDS = [
  'Kill',
  'Weak',
  'Mid',
  'Strong',
  'Exceptional',
] as const;

export type Severity = (typeof SEVERITY_BANDS)[number];

export interface Customer {
  id: string;
  slug: string;
  label: string;
  aggregateSeverity: Severity;
}

export interface Repo {
  id: string;
  customerId: string;
  slug: string;
  label: string;
  aggregateSeverity: Severity;
}

export type SolutionStatus =
  | 'none'
  | 'pending'
  | 'ready'
  | 'failed'
  | 'unsupported';

export type DismissStatus = 'active' | 'dismissed' | 'snoozed';

export interface FileNode {
  id: string;
  repoId: string;
  customerId: string;
  path: string;
  severity: Severity;
  findingSnippet: string;
  /** Sprint G4 — Solution-cache-status for confidence-opacity render. */
  solutionStatus?: SolutionStatus;
  solutionConfidence?: 'low' | 'mid' | 'high';
  /** Sprint G5 — dismiss + snooze state. Auto-expires when snoozedUntil < now. */
  dismissStatus?: DismissStatus;
  dismissReason?: string;
  snoozedUntil?: Date;
}

export interface GalaxieData {
  customers: Customer[];
  repos: Repo[];
  files: FileNode[];
}

/**
 * @deprecated Use {@link SolarLayoutNode} from `solar-layout.ts`.
 * `LayoutLevel` describes the legacy 3-level Customer→Repo→File layout used by
 * `MiniMap.tsx` until the MiniMap-Migration-Phase. Do not introduce new consumers.
 */
export type LayoutLevel = 1 | 2 | 3;

/**
 * @deprecated Use {@link SolarLayoutNode} from `solar-layout.ts`. Only `MiniMap.tsx`
 * still consumes the legacy 3-level layout; will be removed once MiniMap migrates.
 */
export interface LayoutNode {
  id: string;
  level: LayoutLevel;
  x: number;
  y: number;
  parentId?: string;
}

/**
 * @deprecated See {@link LayoutNode}.
 */
export interface GalaxieLayout {
  nodes: LayoutNode[];
}

// ── Solar layout (Sub-A) ──────────────────────────────────────────────────────

export type SolarNodeKind = 'sun' | 'folder' | 'file';

/**
 * Synthetic folder aggregate. Folders are not stored in `GalaxieData`; they are
 * derived from `FileNode.path` by taking the first path segment (`path.split('/')[0]`).
 */
export interface FolderNode {
  id: string;
  repoId: string;
  customerId: string;
  name: string;
  fileCount: number;
  aggregateSeverity: Severity;
}

export interface SolarLayoutNode {
  id: string;
  kind: SolarNodeKind;
  repoId: string;
  customerId: string;
  x: number;
  y: number;
  /** Distance from the parent sun. Undefined for `kind: 'sun'`. */
  orbitRadius?: number;
  /** Equals the parent repo's id. Undefined for `kind: 'sun'`. */
  parentSunId?: string;
}

export interface SolarLayout {
  nodes: SolarLayoutNode[];
  folders: FolderNode[];
}

/**
 * Inspector target — Sub-C introduces a folder-mode side-panel in addition to
 * the existing file-mode. The union keeps both render paths in a single
 * component without an inheritance hierarchy.
 */
export type InspectorTarget =
  | { kind: 'file'; file: FileNode }
  | { kind: 'folder'; folder: FolderNode; files: FileNode[] };
