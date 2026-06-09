import type { AgentFileKind } from "./types.js";

/**
 * Galaxie-Redesign Phase C — single source-of-truth for human-readable labels
 * of every agent-file kind, shared by Audit + Web + Inspector so they speak one
 * vocabulary (no more raw `.claude/CLAUDE.md` paths in the UI). See
 * `docs/audits/2026-06-frontend-challenge/_synthesis.md` §5.
 */
export interface KindMeta {
  /** Primary human label shown on the node (e.g. "Project Guidance"). */
  label: string;
  /** One-line purpose, shown as the hover/inspector subtitle. */
  purpose: string;
  /** Vendor / ecosystem the kind belongs to (rendered as a small pill). */
  vendor: string;
  /** MUST-5 surfaces ('primary') render full-weight; vendor surfaces are muted. */
  tier: "primary" | "vendor";
}

export const KIND_META: Record<AgentFileKind, KindMeta> = {
  "claude-md": {
    label: "Project Guidance",
    purpose: "Repo-wide instructions for Claude",
    vendor: "Claude Code",
    tier: "primary",
  },
  "agents-md": {
    label: "Agent Guidance",
    purpose: "Cross-tool instructions (AGENTS.md standard)",
    vendor: "Open standard",
    tier: "primary",
  },
  "claude-agent": {
    label: "Subagent",
    purpose: "A specialised agent definition",
    vendor: "Claude Code",
    tier: "primary",
  },
  "claude-command": {
    label: "Slash Command",
    purpose: "A reusable /command for Claude",
    vendor: "Claude Code",
    tier: "primary",
  },
  "claude-skill": {
    label: "Skill",
    purpose: "A packaged, reusable capability",
    vendor: "Claude Code",
    tier: "primary",
  },
  "gemini-md": {
    label: "Gemini Guidance",
    purpose: "Repo instructions for Gemini",
    vendor: "Gemini",
    tier: "vendor",
  },
  "cursor-rule-mdc": {
    label: "Cursor Rule",
    purpose: "A scoped editor rule (.mdc)",
    vendor: "Cursor",
    tier: "vendor",
  },
  "cursor-rules-legacy": {
    label: "Cursor Rule (legacy)",
    purpose: "Old-style — consider migrating",
    vendor: "Cursor",
    tier: "vendor",
  },
  "windsurf-rule": {
    label: "Windsurf Rule",
    purpose: "A scoped Windsurf rule",
    vendor: "Windsurf",
    tier: "vendor",
  },
  "cline-rule": {
    label: "Cline Rule",
    purpose: "Repo instructions for Cline",
    vendor: "Cline",
    tier: "vendor",
  },
  "codex-rule": {
    label: "Codex Config",
    purpose: "Codex agent settings & rules",
    vendor: "Codex",
    tier: "vendor",
  },
  "aider-conf": {
    label: "Aider Config",
    purpose: "Aider settings",
    vendor: "Aider",
    tier: "vendor",
  },
};

/**
 * Known folder roles — maps a folder's full path (within a repo) to a
 * human-readable label + purpose, so `.claude/agents` reads as "Subagents".
 * Unmapped folders fall back to their last path segment (handled by the caller).
 */
const FOLDER_ROLES: Record<string, { label: string; purpose: string }> = {
  ".claude": {
    label: "Claude Code config",
    purpose: "Context files governing Claude Code",
  },
  ".claude/agents": {
    label: "Subagents",
    purpose: "Specialised agent definitions",
  },
  ".claude/commands": {
    label: "Slash commands",
    purpose: "Reusable /commands for Claude",
  },
  ".claude/skills": {
    label: "Skills",
    purpose: "Packaged, reusable capabilities",
  },
  ".cursor": {
    label: "Cursor config",
    purpose: "Cursor editor configuration",
  },
  ".cursor/rules": {
    label: "Cursor rules",
    purpose: "Scoped Cursor editor rules",
  },
  ".windsurf": {
    label: "Windsurf config",
    purpose: "Windsurf configuration",
  },
  ".codex": {
    label: "Codex config",
    purpose: "Codex agent settings",
  },
};

/** Resolve a known folder role, or `null` for unmapped folders. */
export function folderRole(
  folderPath: string,
): { label: string; purpose: string } | null {
  return FOLDER_ROLES[folderPath] ?? null;
}
