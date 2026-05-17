import type { AuditFinding, ParserResult } from "@vk/core";
import type { FixProposal } from "./types.js";
import { FixContextError } from "./types.js";
import { fileModifyPatch } from "./unified-diff.js";

const APPROX_CHARS_PER_TOKEN = 4;

/**
 * Trim the oldest h2-section (`## ...`) from the cited file. Token-budget
 * findings flag a file or set of files that push the always-loaded context
 * over the 25 k budget; chopping the oldest section is the most reviewable
 * shrink that keeps the most-current guidance intact.
 *
 * "Oldest section" heuristic: the bottom-most `## ` heading (markdown
 * convention puts changelog-like sections at the end). Caller can flip via UI.
 */
export function generateTokenOverflowTrimFix(
  finding: AuditFinding,
  scan: ParserResult,
): FixProposal {
  const target = finding.citations[0]?.path;
  if (!target) {
    throw new FixContextError(
      "token-budget finding has no citation; cannot trim a file.",
    );
  }
  const file = scan.files.find((f) => f.relativePath === target);
  if (!file) {
    throw new FixContextError(
      `token-budget target "${target}" not in parsed scan.`,
    );
  }
  const original = file.rawContent;
  const sections = locateSections(original);
  if (sections.length === 0) {
    throw new FixContextError(
      `token-budget fix needs at least one '## ' section in ${target}; manual edit required.`,
    );
  }
  // Trim from the bottom until we approximate a 20% reduction.
  const targetReductionChars = Math.max(
    APPROX_CHARS_PER_TOKEN * 200,
    Math.floor(original.length * 0.2),
  );
  let after = original;
  const dropped: string[] = [];
  for (let i = sections.length - 1; i >= 0 && original.length - after.length < targetReductionChars; i -= 1) {
    const sec = sections[i]!;
    after = after.slice(0, sec.startIdx) + after.slice(sec.endIdx);
    dropped.push(sec.heading);
  }
  if (dropped.length === 0) {
    throw new FixContextError(
      "Failed to trim any sections; manual edit required.",
    );
  }

  const patch = fileModifyPatch(file.relativePath, original, after);
  if (!patch) {
    throw new FixContextError("No-op token-overflow-trim patch.");
  }

  return {
    findingId: finding.id,
    category: "token-budget",
    rationale:
      `Trim trailing section${dropped.length === 1 ? "" : "s"} from ${file.relativePath}: ` +
      dropped.map((d) => `"${d.trim()}"`).join(", ") +
      ". Approximates a 20% size reduction.",
    patch,
    filesTouched: [file.relativePath],
    deterministic: true,
    confidence: "high",
  };
}

interface SectionRange {
  heading: string;
  startIdx: number;
  endIdx: number;
}

function locateSections(content: string): SectionRange[] {
  const sections: SectionRange[] = [];
  const re = /^##\s+.+$/gm;
  const matches: Array<{ idx: number; heading: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    matches.push({ idx: m.index, heading: m[0] });
  }
  for (let i = 0; i < matches.length; i += 1) {
    const cur = matches[i]!;
    const next = matches[i + 1];
    sections.push({
      heading: cur.heading,
      startIdx: cur.idx,
      endIdx: next ? next.idx : content.length,
    });
  }
  return sections;
}
