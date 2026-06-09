import type { AgentFileKind } from '@vk/core';
import { KIND_META, folderRole } from '@vk/core';
import type { FileNode, FolderNode } from './types';

/**
 * Galaxie-Redesign Phase C — the single humanization source. Turns raw paths
 * (`.claude/CLAUDE.md`, `.claude/agents/researcher.md`) and folder segments
 * (`.claude`) into human-readable labels for every UI surface, so nothing prints
 * a raw path as its primary label. The raw path stays available as a secondary
 * mono subline (kept by the callers). See synthesis §5.
 */

/** Kinds whose files have an individual identity — show their own name, not the
 *  generic kind label (a folder of 3 subagents shouldn't read "Subagent" ×3). */
const NAMED_KINDS: ReadonlySet<AgentFileKind> = new Set([
  'claude-agent',
  'claude-command',
  'claude-skill',
  'cursor-rule-mdc',
  'cursor-rules-legacy',
  'windsurf-rule',
  'cline-rule',
]);

function prettyBasename(path: string): string {
  const base = path.split('/').filter(Boolean).pop() ?? path;
  // Strip a single trailing extension (researcher.md → researcher), but keep
  // dotfiles intact (.clinerules stays .clinerules).
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(0, dot) : base;
}

/** Primary human label for a file node. */
export function fileDisplayName(file: FileNode): string {
  if (file.kind) {
    return NAMED_KINDS.has(file.kind)
      ? prettyBasename(file.path)
      : KIND_META[file.kind].label;
  }
  // Unknown kind — prefer the prose finding title, else a clean basename.
  return file.label ?? prettyBasename(file.path);
}

/** Subtitle (purpose) for a file node, or `null` for unclassified files. */
export function fileSubtitle(file: FileNode): string | null {
  return file.kind ? KIND_META[file.kind].purpose : null;
}

/** Vendor pill text for a file node, or `null` for unclassified files. */
export function fileVendor(file: FileNode): string | null {
  return file.kind ? KIND_META[file.kind].vendor : null;
}

/** Tier — 'primary' (MUST-5, full-weight) vs 'vendor' (muted). */
export function fileTier(file: FileNode): 'primary' | 'vendor' | null {
  return file.kind ? KIND_META[file.kind].tier : null;
}

function lastSegment(folderPath: string): string {
  return folderPath.split('/').filter(Boolean).pop() ?? folderPath;
}

/** Primary human label for a folder node (`.claude` → "Claude Code config"). */
export function folderDisplayName(folder: FolderNode): string {
  return folderRole(folder.name)?.label ?? lastSegment(folder.name);
}

/** Subtitle (purpose) for a folder node. */
export function folderSubtitle(folder: FolderNode): string {
  return (
    folderRole(folder.name)?.purpose ??
    `Context files governing ${folder.name}/`
  );
}
