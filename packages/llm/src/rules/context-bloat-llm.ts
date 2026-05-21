// Sprint 1.2 — LLM-augmented context-bloat trim-suggester. Picks one of the
// `## ` sections in a file as the "least load-bearing" to remove so the
// file fits the token budget. Returns null when no LLM key is configured,
// per ADR-0020 (honest non-vapor).
//
// The suggestion is BOUNDED — the LLM picks a heading from a list we give
// it. We never let the LLM emit free-form diff content; the actual patch is
// produced deterministically downstream by @vk/fixes. This contains the
// blast radius — worst-case LLM failure = wrong section trimmed, not
// arbitrary code injection.
import { generateText, Output } from "ai";
import { z } from "zod";
import { providerModel, selectModel } from "../select.js";

export interface ContextBloatSuggestionInput {
  filePath: string;
  fileBody: string;
  tokenCount: number;
  budget: number;
  /** Section headings (one per `## ` line) we offer the LLM as choices. */
  candidateSections: string[];
}

export interface ContextBloatSuggestion {
  heading: string;
  confidence: "low" | "mid" | "high";
  reason: string;
}

const SuggestSchema = z.object({
  heading: z
    .string()
    .max(200)
    .describe("Exact heading text (including leading ## ) to remove."),
  confidence: z.enum(["low", "mid", "high"]),
  reason: z.string().max(280),
});

const MAX_BODY_TOKENS = 4_000;

function truncate(body: string, maxApproxTokens: number): string {
  const maxChars = maxApproxTokens * 4;
  if (body.length <= maxChars) return body;
  return body.slice(0, maxChars) + "\n…[truncated]…";
}

/**
 * Returns null when no LLM key is configured. Callers must handle this
 * gracefully (render the disabled-state placeholder).
 *
 * On success, returns ONE candidate heading from `candidateSections` plus
 * a confidence band. The reason is a single sentence shown above the diff
 * preview in the UI.
 */
export async function suggestContextBloatTrim(
  input: ContextBloatSuggestionInput,
): Promise<ContextBloatSuggestion | null> {
  const selection = selectModel({ intent: "fix-suggestion" });
  if (!selection) return null;
  if (input.candidateSections.length === 0) return null;

  const model = providerModel(selection);
  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: SuggestSchema }),
      prompt: buildPrompt(input),
    });
    if (!output) return null;
    // Validate the heading is one of the candidates we offered.
    if (!input.candidateSections.includes(output.heading)) {
      // Fall back to the last candidate (= bottom-most section) at low
      // confidence. Matches the deterministic trim's "trim oldest" default.
      return {
        heading:
          input.candidateSections[input.candidateSections.length - 1]!,
        confidence: "low",
        reason:
          "LLM returned a heading outside the offered set — falling back to bottom-most section.",
      };
    }
    return output;
  } catch (err) {
    void err;
    return null;
  }
}

function buildPrompt(input: ContextBloatSuggestionInput): string {
  const headingList = input.candidateSections
    .map((h, i) => `${i + 1}. ${h}`)
    .join("\n");
  return [
    "You are a code-review assistant deciding which markdown section to trim.",
    `File: ${input.filePath}`,
    `Current size: ${input.tokenCount} tokens. Budget: ${input.budget} tokens (over by ${input.tokenCount - input.budget}).`,
    "",
    "Pick ONE heading from the list below to remove. Pick the heading whose section is least load-bearing — historical/archived content beats current operational guidance.",
    "Be conservative: if every section is current operational guidance, mid or low confidence is correct.",
    "",
    "Candidate headings (return one verbatim):",
    headingList,
    "",
    "Output JSON: { heading: <verbatim heading from list>, confidence: 'low'|'mid'|'high', reason: <≤280 chars> }.",
    "",
    "File body:",
    "```",
    truncate(input.fileBody, MAX_BODY_TOKENS),
    "```",
  ].join("\n");
}
