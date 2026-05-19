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

export interface FileNode {
  id: string;
  repoId: string;
  customerId: string;
  path: string;
  severity: Severity;
  findingSnippet: string;
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
