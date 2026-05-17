import type { AuditFinding, ParserResult } from "@vk/core";
import type { FixProposal } from "./types.js";
import { FixContextError } from "./types.js";
import { fileModifyPatch } from "./unified-diff.js";

/**
 * Removes the duplicate block from the *second* file (alphabetically) and
 * leaves a stub comment pointing at the canonical home. Caller can flip
 * canonical via UI; for now we keep deterministic & stable.
 */
export function generateDuplicateGuidanceFix(
  finding: AuditFinding,
  scan: ParserResult,
): FixProposal {
  if (finding.citations.length < 2) {
    throw new FixContextError(
      "duplicate-guidance finding requires two citations.",
    );
  }
  const [pathA, pathB] = [...finding.citations]
    .map((c) => c.path)
    .sort() as [string, string];

  const canonical = scan.files.find((f) => f.relativePath === pathA);
  const duplicate = scan.files.find((f) => f.relativePath === pathB);
  if (!canonical || !duplicate) {
    throw new FixContextError(
      `Could not locate parsed files for ${pathA} / ${pathB}.`,
    );
  }

  const block = pickDuplicateBlock(canonical.body, duplicate.body);
  if (!block) {
    throw new FixContextError(
      "Could not isolate the duplicated paragraph; manual edit required.",
    );
  }

  const original = duplicate.rawContent;
  const replacement =
    `> See canonical guidance in [${canonical.relativePath}](${canonical.relativePath}).` +
    "\n> Removed by ValidationKit fix-generator (duplicate-guidance).\n";

  const idx = original.indexOf(block);
  if (idx < 0) {
    throw new FixContextError(
      "Duplicated block not found verbatim in raw content; manual edit required.",
    );
  }
  const after =
    original.slice(0, idx) + replacement + original.slice(idx + block.length);

  const patch = fileModifyPatch(duplicate.relativePath, original, after);
  if (!patch) {
    throw new FixContextError(
      "No-op patch — duplicate block already removed?",
    );
  }

  return {
    findingId: finding.id,
    category: "duplicate-guidance",
    rationale:
      `Remove the duplicated block from ${duplicate.relativePath} ` +
      `and link to canonical home ${canonical.relativePath}. ` +
      "Reverse direction by editing the patch manually if needed.",
    patch,
    filesTouched: [duplicate.relativePath],
    deterministic: true,
    confidence: "high",
  };
}

/**
 * Picks the longest paragraph that appears verbatim (after normalising
 * whitespace) in both files. Falls back to null when no exact-text match —
 * trigram similarity does not guarantee character-for-character overlap.
 */
function pickDuplicateBlock(bodyA: string, bodyB: string): string | null {
  const paragraphsA = bodyA.split(/\n{2,}/).map((p) => p.trim());
  const paragraphsB = new Set(bodyB.split(/\n{2,}/).map((p) => p.trim()));
  let best: string | null = null;
  for (const p of paragraphsA) {
    if (p.length < 80) continue;
    if (paragraphsB.has(p) && (!best || p.length > best.length)) {
      best = p;
    }
  }
  return best;
}
