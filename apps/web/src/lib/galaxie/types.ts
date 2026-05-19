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

export type LayoutLevel = 1 | 2 | 3;

export interface LayoutNode {
  id: string;
  level: LayoutLevel;
  x: number;
  y: number;
  parentId?: string;
}

export interface GalaxieLayout {
  nodes: LayoutNode[];
}
