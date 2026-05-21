import type { SeverityBand } from "./severity.js";

/**
 * All AI-agent-file kinds the parser can identify. Five of these are
 * "MUST" surfaces (see {@link MUST_KINDS}) — they are the primary signal
 * for audit rules; the rest are SHOULD/MAY surfaces from multi-vendor
 * support (Cursor, Windsurf, Cline, Codex, Aider, Gemini).
 */
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

/** MUST-5 surfaces. Audit rules treat these as load-bearing. */
export const MUST_KINDS: ReadonlySet<AgentFileKind> = new Set([
  "claude-md",
  "agents-md",
  "claude-agent",
  "claude-command",
  "claude-skill",
]);

/**
 * Cursor-rule activation modes from the `.mdc` frontmatter. Only relevant
 * for `cursor-rule-mdc` kind — controls when the rule is injected into the
 * LLM context.
 */
export type CursorActivationMode =
  | "always"
  | "auto-attached"
  | "agent-requested"
  | "manual";

/**
 * One parsed AI-agent file. Carries both the raw content and parser-derived
 * metadata (tokens, frontmatter, outlinks). Produced by `@vk/parser`,
 * consumed by `@vk/audit` rules and `apps/web` server-actions.
 */
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

/**
 * Output of `scanRepository(rootPath)`. The DTO that travels from
 * `@vk/parser` to `@vk/audit` and persists in `scan.parser_result`.
 */
export interface ParserResult {
  rootPath: string;
  scannedAt: Date;
  files: ParsedAgentFile[];
  warnings: ParserWarning[];
}

/** Non-fatal parser issues. Audit-Findings should not duplicate these. */
export interface ParserWarning {
  path: string;
  message: string;
}

/**
 * The 6 audit-rule categories. Five are deterministic
 * (`packages/audit/src/rules/`), the last (`conflicting-rules`) is LLM-
 * augmented and only emitted when a provider key is configured.
 */
export const FINDING_CATEGORIES = [
  "unused-agent",
  "duplicate-guidance",
  "context-bloat",
  "stale-reference",
  "token-budget",
  "conflicting-rules",
] as const;

export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

/** Source-pointer for an audit-finding. Optional line for code-citation precision. */
export interface Citation {
  path: string;
  line?: number;
}

/**
 * One audit finding. `id` is stable across re-scans (used for de-dup +
 * Solution-Cache key in `@vk/fixes`). `deterministic: false` marks LLM-
 * augmented findings — these carry a `confidence` band for the
 * Confidence-Banding gate (PRD §13).
 */
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

/**
 * Top-level audit output. Persisted in `scan.audit_report` and rendered
 * by the workspace Galaxie + Inspector.
 */
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

// Drift-Detection-Feature wurde 2026-05-16 gedropt (siehe ADR-0003).
// Die zugehörigen Types DRIFT_KINDS / DriftKind / DriftItem / DriftReport
// wurden 2026-05-21 als dead exports entfernt (Phase 1.14b der
// repo-health-and-workflow-overhaul).
