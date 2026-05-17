import type { SeverityBand } from "./severity.js";

export const AGENT_FILE_KINDS = [
  "claude-md",
  "agents-md",
  "claude-agent",
  "claude-command",
  "claude-skill",
  "gemini-md",
  "cursor-rule-mdc",
  "cursor-rules-legacy",
  "windsurf-rule",
  "cline-rule",
  "codex-rule",
  "aider-conf",
] as const;

export type AgentFileKind = (typeof AGENT_FILE_KINDS)[number];

export const MUST_KINDS: ReadonlySet<AgentFileKind> = new Set([
  "claude-md",
  "agents-md",
  "claude-agent",
  "claude-command",
  "claude-skill",
]);

export type CursorActivationMode =
  | "always"
  | "auto-attached"
  | "agent-requested"
  | "manual";

export interface ParsedAgentFile {
  kind: AgentFileKind;
  absolutePath: string;
  relativePath: string;
  rawContent: string;
  body: string;
  frontmatter: Record<string, unknown>;
  tokenCount: number;
  lineCount: number;
  byteSize: number;
  lastModified: Date | null;
  name: string | null;
  description: string | null;
  outlinks: string[];
  /** Only populated for kind === "cursor-rule-mdc". */
  activationMode?: CursorActivationMode;
  /** Only populated when frontmatter declares `globs`. */
  globs?: string[];
}

export interface ParserResult {
  rootPath: string;
  scannedAt: Date;
  files: ParsedAgentFile[];
  warnings: ParserWarning[];
}

export interface ParserWarning {
  path: string;
  message: string;
}

export const FINDING_CATEGORIES = [
  "unused-agent",
  "duplicate-guidance",
  "context-bloat",
  "stale-reference",
  "token-budget",
  "conflicting-rules",
] as const;

export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export interface Citation {
  path: string;
  line?: number;
}

export interface AuditFinding {
  id: string;
  category: FindingCategory;
  severity: SeverityBand;
  title: string;
  detail: string;
  citations: Citation[];
  deterministic: boolean;
  confidence?: "low" | "mid" | "high";
}

export interface AuditReport {
  rootPath: string;
  generatedAt: Date;
  fileCount: number;
  findings: AuditFinding[];
  summary: {
    byCategory: Record<FindingCategory, number>;
    bySeverity: Record<SeverityBand, number>;
    overallSeverity: SeverityBand;
  };
}

export const DRIFT_KINDS = [
  "only-in-a",
  "only-in-b",
  "content-drift",
  "frontmatter-drift",
  "token-drift",
] as const;

export type DriftKind = (typeof DRIFT_KINDS)[number];

export interface DriftItem {
  id: string;
  kind: DriftKind;
  severity: SeverityBand;
  relativePath: string;
  title: string;
  detail: string;
  fieldsChanged?: string[];
  similarity?: number;
  tokensA?: number;
  tokensB?: number;
}

export interface DriftReport {
  pathA: string;
  pathB: string;
  generatedAt: Date;
  filesA: number;
  filesB: number;
  items: DriftItem[];
  summary: {
    byKind: Record<DriftKind, number>;
    overallSeverity: SeverityBand;
  };
}
