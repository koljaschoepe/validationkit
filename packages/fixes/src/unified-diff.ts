import { createPatch } from "diff";

/**
 * Build a unified diff that deletes a whole file. `git apply` recognises this
 * form via the `+++ /dev/null` marker.
 */
export function fileDeletePatch(
  relativePath: string,
  originalContent: string,
): string {
  const path = normaliseRelativePath(relativePath);
  const lines = originalContent.split("\n");
  // jsdiff doesn't model "deleted file" so we hand-roll the canonical form.
  const header = [
    `--- a/${path}`,
    `+++ /dev/null`,
    `@@ -1,${lines.length} +0,0 @@`,
  ];
  const body = lines.map((l) => `-${l}`);
  return header.concat(body).join("\n") + "\n";
}

/**
 * Modify-an-existing-file patch via jsdiff. Returns "" when there are no
 * changes (so callers can short-circuit).
 */
export function fileModifyPatch(
  relativePath: string,
  before: string,
  after: string,
): string {
  if (before === after) return "";
  const path = normaliseRelativePath(relativePath);
  const raw = createPatch(path, before, after, undefined, undefined, {
    context: 3,
  });
  // createPatch produces `Index:` + `===` headers we don't need for `git apply`.
  const lines = raw.split("\n");
  const headerIndex = lines.findIndex((l) => l.startsWith("---"));
  if (headerIndex < 0) return "";
  return rewriteHeader(lines.slice(headerIndex).join("\n"), path);
}

function rewriteHeader(diff: string, path: string): string {
  return diff
    .replace(/^--- .*$/m, `--- a/${path}`)
    .replace(/^\+\+\+ .*$/m, `+++ b/${path}`);
}

function normaliseRelativePath(rel: string): string {
  return rel.replace(/^\.\//, "").replace(/^\/+/, "");
}

/** Concatenate hunks from multiple per-file patches into one `git apply`-able blob. */
export function concatPatches(parts: string[]): string {
  return parts
    .filter((p) => p.length > 0)
    .map((p) => (p.endsWith("\n") ? p : p + "\n"))
    .join("");
}
