import type { AuditFinding, ParserResult } from "@vk/core";
import type { FixProposal } from "./types.js";
import { FixContextError } from "./types.js";
import { fileModifyPatch } from "./unified-diff.js";

const TITLE_LINK_RE = /(.+?)\s+→\s+"([^"]+)"\s+not found/;

/**
 * Removes the dead link from the cited file. We strip the entire line that
 * contains the dead link rather than rewriting in-place — the patch is more
 * predictable and reviewable.
 */
export function generateStaleReferenceFix(
  finding: AuditFinding,
  scan: ParserResult,
): FixProposal {
  const m = TITLE_LINK_RE.exec(finding.title);
  if (!m) {
    throw new FixContextError(
      `stale-reference title format not understood: "${finding.title}".`,
    );
  }
  const [, , deadLink] = m;
  if (!deadLink) {
    throw new FixContextError(
      "stale-reference finding had no parseable link target.",
    );
  }
  const target = finding.citations[0]?.path;
  if (!target) {
    throw new FixContextError(
      "stale-reference finding has no citation; cannot locate host file.",
    );
  }
  const file = scan.files.find((f) => f.relativePath === target);
  if (!file) {
    throw new FixContextError(
      `stale-reference target "${target}" not in parsed scan.`,
    );
  }

  const original = file.rawContent;
  const lines = original.split("\n");
  const kept = lines.filter((line) => !line.includes(deadLink));
  if (kept.length === lines.length) {
    throw new FixContextError(
      `Dead link "${deadLink}" not found verbatim in ${target}; manual edit required.`,
    );
  }
  const after = kept.join("\n");
  const patch = fileModifyPatch(file.relativePath, original, after);
  if (!patch) {
    throw new FixContextError("No-op stale-reference patch.");
  }

  return {
    findingId: finding.id,
    category: "stale-reference",
    rationale: `Remove the line(s) containing the dead link "${deadLink}" from ${file.relativePath}.`,
    patch,
    filesTouched: [file.relativePath],
    deterministic: true,
    confidence: "high",
  };
}
