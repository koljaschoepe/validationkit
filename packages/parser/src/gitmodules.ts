import type { Submodule } from "@vk/core";

/**
 * Galaxie-Redesign Phase B (B.5) — parse a `.gitmodules` file (git-config INI
 * format) into its declared submodules. Each `[submodule "name"]` section
 * carries a `path` (repo-relative) and a `url` (remote). Robust to comments
 * (`#` / `;`), blank lines, and sections missing path/url (skipped).
 *
 * Pure + dependency-free so it is unit-testable without touching the filesystem.
 */
export function parseGitmodules(content: string): Submodule[] {
  const out: Submodule[] = [];
  let cur: { path?: string; url?: string } | null = null;

  const flush = () => {
    if (cur && cur.path && cur.url) out.push({ path: cur.path, url: cur.url });
  };

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#") || line.startsWith(";")) continue;
    if (line.startsWith("[submodule")) {
      flush();
      cur = {};
      continue;
    }
    if (!cur) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().toLowerCase();
    const val = line.slice(eq + 1).trim();
    if (key === "path") cur.path = val;
    else if (key === "url") cur.url = val;
  }
  flush();
  return out;
}
