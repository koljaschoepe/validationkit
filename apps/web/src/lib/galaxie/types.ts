import type { AgentFileKind, FindingCategory } from '@vk/core';

export const SEVERITY_BANDS = [
  'Kill',
  'Weak',
  'Mid',
  'Strong',
  'Exceptional',
] as const;

export type Severity = (typeof SEVERITY_BANDS)[number];

/**
 * Galaxie-Redesign Phase A — single canonical severity aggregation, shared by
 * the DAL (repo/customer rollups) and the layout (folder rollups). Previously
 * duplicated in `dal/galaxie.ts` and `solar-layout.ts` with a divergent
 * empty-case (Exceptional vs Mid). Empty = no active concerns = Exceptional.
 * Pure (no server deps) so client-side layout code can import it.
 */
export function aggregateSeverities(items: readonly Severity[]): Severity {
  if (items.length === 0) return 'Exceptional';
  if (items.some((s) => s === 'Kill')) return 'Kill';
  if (items.some((s) => s === 'Weak')) return 'Weak';
  if (items.every((s) => s === 'Exceptional')) return 'Exceptional';
  const strongCount = items.filter((s) => s === 'Strong').length;
  if (strongCount > items.length / 2) return 'Strong';
  return 'Mid';
}

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
  /** Phase B (B.5) — git submodules from `.gitmodules` (repo-relative path + url). */
  submodules?: { path: string; url: string }[];
}

export type SolutionStatus =
  | 'none'
  | 'pending'
  | 'ready'
  | 'failed'
  | 'unsupported';

export type DismissStatus = 'active' | 'dismissed' | 'snoozed';

/**
 * Galaxie-Redesign Phase B (B.1) — one audit finding within a file. A {@link
 * FileNode} groups all findings that share a real path; each {@link FindingRef}
 * keeps its own `id` (the real `finding.id`, the key for dismiss/snooze/apply +
 * AI-solution) and per-finding state. Snooze-expiry is already applied to
 * `dismissStatus` by the DAL.
 */
export interface FindingRef {
  id: string;
  severity: Severity;
  category?: FindingCategory;
  /** Prose title from `finding.title`. */
  label?: string;
  /** Truncated `finding.detail`. */
  snippet: string;
  solutionStatus?: SolutionStatus;
  solutionConfidence?: 'low' | 'mid' | 'high';
  dismissStatus?: DismissStatus;
  dismissReason?: string;
  snoozedUntil?: Date;
}

/**
 * A file in the galaxy. Galaxie-Redesign Phase B (B.1): one FileNode per real
 * path (was one per finding). `id` is path-based (`${repoId}::file::${path}`).
 * The aggregate fields (`severity`, `dismissStatus`, `solutionStatus`,
 * `findingSnippet`, `label`, `category`) describe the file for the planet /
 * tooltip / list / SVG renderers and reflect the representative = worst active
 * finding (or worst overall when every finding is muted). The full per-finding
 * breakdown lives in {@link FileNode.findings}, consumed by the inspector.
 */
export interface FileNode {
  id: string;
  repoId: string;
  customerId: string;
  /**
   * Galaxie-Redesign Phase A — the REAL file path (e.g. `.claude/CLAUDE.md`),
   * sourced from `finding.file_path` / first citation. Consumed by the layout
   * for folder derivation. Falls back to the prose title only for legacy
   * findings that have neither a path nor a citation.
   */
  path: string;
  /** Parser-classified agent-file kind (Phase A). Null for legacy/uncited rows. */
  kind?: AgentFileKind;
  /** Representative audit category (worst active finding) — display + why-blurb. */
  category?: FindingCategory;
  /** Representative prose label (worst active finding's title) for display. */
  label?: string;
  /** Aggregate severity across the file's active findings. */
  severity: Severity;
  /** Representative finding's snippet — tooltip + collapsed preview. */
  findingSnippet: string;
  /** Sprint G4 — representative Solution-cache-status for confidence-opacity render. */
  solutionStatus?: SolutionStatus;
  solutionConfidence?: 'low' | 'mid' | 'high';
  /** Aggregate dismiss state: 'dismissed' iff every finding is dismissed. */
  dismissStatus?: DismissStatus;
  dismissReason?: string;
  snoozedUntil?: Date;
  /** Phase B (B.1) — every finding on this file, for the inspector list. */
  findings: FindingRef[];
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
 * Galaxie-Redesign Phase B (B.4) — a folder's "nucleus": the context-root config
 * file (kind ∈ {claude-md, agents-md, gemini-md}) that governs the directory.
 * When present, the folder planet renders a distinct inner core and the
 * inspector highlights it as the governing context. Absent for plain folders
 * (e.g. `.claude/agents/` which holds only agent files, no governing config).
 */
export interface FolderNucleus {
  /** The grouped FileNode id of the governing context file. */
  fileId: string;
  kind: AgentFileKind;
  /** Real path of the context file (e.g. `.claude/CLAUDE.md`). */
  path: string;
}

/**
 * Synthetic folder aggregate. Folders are not stored in `GalaxieData`; they are
 * derived from `FileNode.path` by its owning folder (`dirname`, see
 * `extractOwningFolder`). `name` is the full parent path (unique within a repo).
 * Galaxie-Redesign Phase B (B.3a): `fileIds` lists the foldered files; (B.4)
 * `nucleus` marks the governing context-root config when one is present.
 */
export interface FolderNode {
  id: string;
  repoId: string;
  customerId: string;
  name: string;
  fileCount: number;
  fileIds: string[];
  aggregateSeverity: Severity;
  nucleus?: FolderNucleus;
  /**
   * Phase B (B.5) — set when this folder is a git submodule (e.g. a shared
   * team-context repo mounted at `.claude`). Rendered as its own node class.
   */
  isSubmodule?: boolean;
  submoduleUrl?: string;
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
