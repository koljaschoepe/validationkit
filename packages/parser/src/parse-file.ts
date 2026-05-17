import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parse as parseYaml } from "yaml";
import type {
  CursorActivationMode,
  ParsedAgentFile,
  ParserWarning,
} from "@vk/core";
import { classifyPath } from "./classify.js";
import { countTokens } from "./tokens.js";

const MARKDOWN_LINK = /\[[^\]]+\]\(([^)\s]+)\)/g;
const MARKDOWN_REF = /(?:^|\s)@([\w./\-]+\.\w+)/g;

export interface ParseFileOptions {
  rootPath: string;
}

export async function parseFile(
  absolutePath: string,
  opts: ParseFileOptions,
): Promise<{ file: ParsedAgentFile | null; warning?: ParserWarning }> {
  const relativePath = path.relative(opts.rootPath, absolutePath);
  const kind = classifyPath(relativePath);
  if (!kind) return { file: null };

  let raw: string;
  let stat;
  try {
    raw = await fs.readFile(absolutePath, "utf8");
    stat = await fs.stat(absolutePath);
  } catch (err) {
    return {
      file: null,
      warning: {
        path: relativePath,
        message: `read failed: ${(err as Error).message}`,
      },
    };
  }

  const cleaned = raw.replace(/^﻿/, "").replace(/^\s*\n+/, "");

  // aider.conf.yml / aider.conf.yaml are pure YAML, not Markdown+Frontmatter.
  // gray-matter would treat the entire file as body. Parse the YAML directly
  // and expose it as frontmatter with an empty body.
  if (kind === "aider-conf") {
    let data: Record<string, unknown> = {};
    let warning: ParserWarning | undefined;
    try {
      const parsedYaml = parseYaml(cleaned);
      if (parsedYaml && typeof parsedYaml === "object" && !Array.isArray(parsedYaml)) {
        data = parsedYaml as Record<string, unknown>;
      }
    } catch (err) {
      warning = {
        path: relativePath,
        message: `yaml parse failed: ${(err as Error).message}`,
      };
    }
    const result: { file: ParsedAgentFile; warning?: ParserWarning } = {
      file: makeFile({
        kind,
        absolutePath,
        relativePath,
        raw,
        body: "",
        frontmatter: data,
        stat,
      }),
    };
    if (warning) result.warning = warning;
    return result;
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(cleaned);
  } catch (err) {
    parsed = {
      data: {},
      content: cleaned,
      excerpt: "",
      orig: cleaned,
      language: "",
      matter: "",
      stringify: () => cleaned,
    } as unknown as matter.GrayMatterFile<string>;
    return {
      file: makeFile({
        kind,
        absolutePath,
        relativePath,
        raw,
        body: cleaned,
        frontmatter: {},
        stat,
      }),
      warning: {
        path: relativePath,
        message: `frontmatter parse failed: ${(err as Error).message}`,
      },
    };
  }

  return {
    file: makeFile({
      kind,
      absolutePath,
      relativePath,
      raw,
      body: parsed.content,
      frontmatter: (parsed.data ?? {}) as Record<string, unknown>,
      stat,
    }),
  };
}

function makeFile(args: {
  kind: ParsedAgentFile["kind"];
  absolutePath: string;
  relativePath: string;
  raw: string;
  body: string;
  frontmatter: Record<string, unknown>;
  stat: { mtime: Date; size: number };
}): ParsedAgentFile {
  const outlinks = extractOutlinks(args.body);
  const name =
    pickString(args.frontmatter, "name") ??
    extractFirstHeading(args.body) ??
    null;
  const description =
    pickString(args.frontmatter, "description") ??
    pickString(args.frontmatter, "summary") ??
    null;
  const globs = pickStringArray(args.frontmatter, "globs");
  const activationMode =
    args.kind === "cursor-rule-mdc"
      ? deriveCursorActivation(args.frontmatter, globs)
      : undefined;

  const file: ParsedAgentFile = {
    kind: args.kind,
    absolutePath: args.absolutePath,
    relativePath: args.relativePath,
    rawContent: args.raw,
    body: args.body,
    frontmatter: args.frontmatter,
    tokenCount: countTokens(args.raw),
    lineCount: args.raw.split(/\r?\n/).length,
    byteSize: args.stat.size,
    lastModified: args.stat.mtime,
    name,
    description,
    outlinks,
  };
  if (activationMode) file.activationMode = activationMode;
  if (globs && globs.length > 0) file.globs = globs;
  return file;
}

function deriveCursorActivation(
  fm: Record<string, unknown>,
  globs: string[] | null,
): CursorActivationMode {
  if (fm.alwaysApply === true) return "always";
  if (typeof fm.type === "string" && fm.type.toLowerCase() === "always") {
    return "always";
  }
  if (globs && globs.length > 0) return "auto-attached";
  if (typeof fm.description === "string" && fm.description.trim().length > 0) {
    return "agent-requested";
  }
  return "manual";
}

function pickStringArray(
  fm: Record<string, unknown>,
  key: string,
): string[] | null {
  const v = fm[key];
  if (Array.isArray(v)) {
    const arr = v.filter((x): x is string => typeof x === "string");
    return arr.length > 0 ? arr : null;
  }
  if (typeof v === "string") {
    const parts = v
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return parts.length > 0 ? parts : null;
  }
  return null;
}

function pickString(
  fm: Record<string, unknown>,
  key: string,
): string | null {
  const v = fm[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function extractFirstHeading(body: string): string | null {
  const m = body.match(/^#\s+(.+)$/m);
  return m && m[1] ? m[1].trim() : null;
}

const PATH_LIKE = /[\/.]/;

function extractOutlinks(body: string): string[] {
  const out = new Set<string>();
  for (const m of body.matchAll(MARKDOWN_LINK)) {
    const target = m[1];
    if (!target) continue;
    if (target.startsWith("http") || target.startsWith("#")) continue;
    if (target.startsWith("mailto:") || target.startsWith("tel:")) continue;
    // Skip prose placeholders like `(url)`, `(path)`, `(file)` — must look like a path.
    if (!PATH_LIKE.test(target)) continue;
    out.add(target.split("#")[0] ?? target);
  }
  for (const m of body.matchAll(MARKDOWN_REF)) {
    if (m[1]) out.add(m[1]);
  }
  return [...out];
}
