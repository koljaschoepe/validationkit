import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export interface GithubRepoRef {
  owner: string;
  repo: string;
  ref?: string;
}

const URL_PATTERNS: Array<RegExp> = [
  /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s.]+?)(?:\.git)?\/?$/,
  /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s.]+?)(?:\.git)?\/tree\/([^/\s]+)/,
  /^git@github\.com:([^/\s]+)\/([^/\s.]+?)(?:\.git)?$/,
  /^github:([^/\s]+)\/([^/\s.]+?)(?:\.git)?$/,
];

/**
 * Parse a wide range of GitHub URL formats. Returns null when the input
 * is not recognizable as a public GitHub repo reference.
 */
export function parseGithubUrl(input: string): GithubRepoRef | null {
  const trimmed = input.trim();
  for (const re of URL_PATTERNS) {
    const m = trimmed.match(re);
    if (m && m[1] && m[2]) {
      const ref: GithubRepoRef = {
        owner: m[1],
        repo: m[2].replace(/\.git$/, ""),
      };
      if (m[3]) ref.ref = m[3];
      return ref;
    }
  }
  return null;
}

/**
 * Fetch the repo's default-branch zipball (or a named ref) into a freshly
 * created temp directory. Returns the absolute path of the *root* of the
 * extracted tree.
 *
 * No auth required for public repos — GitHub allows 60 unauthenticated
 * requests/hour per IP. For higher quotas, set `GITHUB_TOKEN` env var.
 *
 * Caller MUST call `cleanupTempDir(returnedPath)` after use.
 */
export async function fetchRepoZipball(
  refInfo: GithubRepoRef,
): Promise<string> {
  const branch = refInfo.ref ?? "HEAD";
  const url = `https://codeload.github.com/${refInfo.owner}/${refInfo.repo}/zip/refs/heads/${branch === "HEAD" ? "main" : branch}`;
  const fallbackUrl = `https://codeload.github.com/${refInfo.owner}/${refInfo.repo}/zip/refs/heads/master`;
  const apiZipUrl = `https://api.github.com/repos/${refInfo.owner}/${refInfo.repo}/zipball${refInfo.ref ? "/" + refInfo.ref : ""}`;

  const headers: Record<string, string> = {
    "user-agent": "validationkit-audit/0.0.10",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let response: Response | null = null;
  let lastError: string | undefined;

  for (const tryUrl of [url, fallbackUrl, apiZipUrl]) {
    const res = await fetch(tryUrl, { headers, redirect: "follow" });
    if (res.ok) {
      response = res;
      break;
    }
    lastError = `${res.status} ${res.statusText} (${tryUrl})`;
  }

  if (!response) {
    throw new Error(
      `Failed to fetch zipball for ${refInfo.owner}/${refInfo.repo}: ${lastError}`,
    );
  }

  const baseDir = await mkdtemp(path.join(tmpdir(), "vk-gh-"));
  const zipPath = path.join(baseDir, "repo.zip");

  if (!response.body) {
    throw new Error("Zipball response had no body");
  }
  const readable = Readable.fromWeb(
    response.body as unknown as import("node:stream/web").ReadableStream,
  );
  await pipeline(readable, createWriteStream(zipPath));

  // Extract using built-in /usr/bin/unzip; Vercel build runtime includes it.
  const extractDir = path.join(baseDir, "extracted");
  await mkdir(extractDir, { recursive: true });

  const { spawn } = await import("node:child_process");
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("unzip", ["-q", zipPath, "-d", extractDir]);
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`unzip exited with code ${code}`));
    });
  });

  // GitHub zipballs extract into a single dir like "owner-repo-shaHash".
  const entries = await readdir(extractDir);
  let rootEntry: string | undefined;
  for (const e of entries) {
    const s = await stat(path.join(extractDir, e));
    if (s.isDirectory()) {
      rootEntry = e;
      break;
    }
  }
  if (!rootEntry) {
    throw new Error("Extracted zipball had no root directory");
  }

  return path.join(extractDir, rootEntry);
}

/**
 * Tag the temp dir for cleanup. Use in a finally{} block.
 */
export async function cleanupTempDir(absRoot: string): Promise<void> {
  // Walk up to the /vk-gh-XXXXX/ root and remove the whole tree.
  // absRoot looks like /tmp/vk-gh-abc/extracted/owner-repo-sha
  const match = absRoot.match(/^(.+\/vk-gh-[^/]+)\//);
  const root = match?.[1];
  if (!root) return;
  await rm(root, { recursive: true, force: true }).catch(() => {});
}

/**
 * Quick heuristic: is this string a GitHub URL (vs a local path)?
 * Used by audit-action to branch the flow.
 */
export function looksLikeGithubUrl(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("~/") || /^[A-Za-z]:\\/.test(trimmed)) {
    return false;
  }
  return parseGithubUrl(trimmed) !== null;
}
