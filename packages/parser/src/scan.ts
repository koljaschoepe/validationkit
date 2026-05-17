import path from "node:path";
import fg from "fast-glob";
import type {
  ParsedAgentFile,
  ParserResult,
  ParserWarning,
} from "@vk/core";
import { parseFile } from "./parse-file.js";

const GLOBS = [
  "CLAUDE.md",
  "**/CLAUDE.md",
  "AGENTS.md",
  "**/AGENTS.md",
  "GEMINI.md",
  "**/GEMINI.md",
  ".claude/agents/**/*.md",
  "**/.claude/agents/**/*.md",
  ".claude/commands/**/*.md",
  "**/.claude/commands/**/*.md",
  ".claude/skills/**/SKILL.md",
  "**/.claude/skills/**/SKILL.md",
  ".cursor/rules/**/*.mdc",
  "**/.cursor/rules/**/*.mdc",
  ".cursorrules",
  "**/.cursorrules",
  ".windsurf/rules/**/*.md",
  "**/.windsurf/rules/**/*.md",
  ".clinerules",
  "**/.clinerules",
  ".codex/**/*.{md,yml}",
  "**/.codex/**/*.{md,yml}",
  "aider.conf.yml",
  "**/aider.conf.yml",
];

const BASE_IGNORE = [
  "**/node_modules/**",
  "**/.next/**",
  "**/dist/**",
  "**/.turbo/**",
  "**/.git/**",
  "**/coverage/**",
];

const ARCHIVE_IGNORE = "**/docs/archive/**";
const EXAMPLES_IGNORE = "**/examples/**";
const FIXTURES_IGNORE = "**/eval/golden-set/**";

export interface ScanOptions {
  /** Additional ignore globs to merge with the default list. */
  ignore?: string[];
  /** When true, includes the docs/archive subtree (skipped by default). */
  includeArchive?: boolean;
  /** When true, includes any examples/ subtree (skipped by default). */
  includeExamples?: boolean;
  /** When true, includes eval/golden-set fixtures (skipped by default). */
  includeFixtures?: boolean;
}

export async function scanRepository(
  rootPath: string,
  opts: ScanOptions = {},
): Promise<ParserResult> {
  const absRoot = path.resolve(rootPath);
  const ignore = [...BASE_IGNORE, ...(opts.ignore ?? [])];
  if (!opts.includeArchive) ignore.push(ARCHIVE_IGNORE);
  if (!opts.includeExamples) ignore.push(EXAMPLES_IGNORE);
  if (!opts.includeFixtures) ignore.push(FIXTURES_IGNORE);

  const entries = await fg(GLOBS, {
    cwd: absRoot,
    ignore,
    dot: true,
    onlyFiles: true,
    unique: true,
    absolute: true,
    followSymbolicLinks: false,
    suppressErrors: true,
  });

  const files: ParsedAgentFile[] = [];
  const warnings: ParserWarning[] = [];

  for (const abs of entries) {
    const { file, warning } = await parseFile(abs, { rootPath: absRoot });
    if (file) files.push(file);
    if (warning) warnings.push(warning);
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return {
    rootPath: absRoot,
    scannedAt: new Date(),
    files,
    warnings,
  };
}
