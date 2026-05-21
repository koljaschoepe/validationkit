import type { Intensity } from "@vk/billing";
import type { AuditFinding, ParserResult } from "@vk/core";
import { suggestContextBloatTrim, isLlmEnabled } from "@vk/llm";
import type { MeteringContext } from "@vk/llm";
import type { FixProposal } from "./types.js";
import { FixContextError, UnsupportedFixError } from "./types.js";
import { fileModifyPatch } from "./unified-diff.js";

const APPROX_BUDGET_TOKENS = 8_000;

export interface ContextBloatFixOptions {
  intensity?: Intensity;
  meteringContext?: MeteringContext;
}

/**
 * Sprint 1.2 — LLM-augmented context-bloat fix-suggestion.
 *
 * The LLM picks ONE `## ` heading to remove from a bounded candidate list.
 * The actual patch is produced deterministically: we locate that heading in
 * the file, build a unified-diff that deletes everything up to the next
 * `## ` (or EOF), and wrap it as a non-deterministic FixProposal with the
 * model's confidence-band.
 *
 * Returns null when no LLM provider is configured — callers handle the
 * disabled state visibly (per A9 honest-non-vapor).
 */
export async function generateContextBloatLlmFix(
  finding: AuditFinding,
  scan: ParserResult,
  opts: ContextBloatFixOptions = {},
): Promise<FixProposal | null> {
  if (finding.category !== "context-bloat") {
    throw new UnsupportedFixError(finding.category);
  }
  if (!isLlmEnabled()) return null;

  const target = finding.citations[0]?.path;
  if (!target) {
    throw new FixContextError(
      "context-bloat finding has no citation; cannot pick a file.",
    );
  }
  const file = scan.files.find((f) => f.relativePath === target);
  if (!file) {
    throw new FixContextError(
      `context-bloat target "${target}" not in parsed scan.`,
    );
  }

  const sections = locateSections(file.rawContent);
  if (sections.length === 0) {
    throw new FixContextError(
      `context-bloat fix needs at least one '## ' section in ${target}; manual edit required.`,
    );
  }

  const suggestion = await suggestContextBloatTrim({
    filePath: file.relativePath,
    fileBody: file.body,
    tokenCount: file.tokenCount,
    budget: APPROX_BUDGET_TOKENS,
    candidateSections: sections.map((s) => s.heading),
    intensity: opts.intensity,
    meteringContext: opts.meteringContext,
  });
  if (!suggestion) return null;

  const target_section = sections.find(
    (s) => s.heading === suggestion.heading,
  );
  if (!target_section) {
    throw new FixContextError(
      `LLM picked heading not in candidate set: "${suggestion.heading}".`,
    );
  }

  const before = file.rawContent;
  const after =
    before.slice(0, target_section.startIdx) +
    before.slice(target_section.endIdx);

  const patch = fileModifyPatch(file.relativePath, before, after);
  if (!patch) {
    throw new FixContextError("No-op context-bloat LLM patch.");
  }

  return {
    findingId: finding.id,
    category: "context-bloat",
    rationale: `LLM (${suggestion.confidence}-confidence): remove "${suggestion.heading.trim()}". ${suggestion.reason}`,
    patch,
    filesTouched: [file.relativePath],
    // LLM-driven, even though the diff itself is mechanical.
    deterministic: false,
    confidence: suggestion.confidence,
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
