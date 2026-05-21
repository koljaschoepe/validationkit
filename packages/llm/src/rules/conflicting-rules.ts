// Direct-Provider only (Anthropic primary, OpenAI opt-in fallback per ADR-0005).
// KEIN Vercel AI Gateway — Vendor-Lock-in-Vermeidung gilt für Gateway, nicht für
// Direct-Provider (CLAUDE.md L.83). Provider-Selection läuft via selectModel().
import { generateText, Output } from "ai";
import { z } from "zod";
import { DEFAULT_INTENSITY, type Intensity } from "@vk/billing";
import type {
  AuditFinding,
  ParsedAgentFile,
  ParserResult,
} from "@vk/core";
import { providerModel, selectModel } from "../select.js";
import { recordUsage, type MeteringContext } from "../usage.js";

const TRIGRAM_SIZE = 3;
const LOW_OVERLAP = 0.4;
const HIGH_OVERLAP = 0.85;
const MAX_PAIRS_PER_RUN = 8;
const MAX_BODY_TOKENS = 4_000;

export interface LLMConfig {
  /** Audit intensity — drives model + maxOutputTokens via selectModel(). */
  intensity: Intensity;
  /** Hard upper bound on pairs the LLM is asked about. Keeps cost predictable. */
  maxPairs: number;
  /** Only emit a finding when confidence is at or above this band. */
  minConfidence: "low" | "mid" | "high";
  /**
   * Optional metering hook. When set, every generateText call appends a row
   * to ai_usage_event. Omit for anonymous audits (Landing-Demo).
   */
  meteringContext?: MeteringContext;
}

export const defaultLLMConfig: LLMConfig = {
  intensity: DEFAULT_INTENSITY,
  maxPairs: MAX_PAIRS_PER_RUN,
  minConfidence: "mid",
};

const ConflictSchema = z.object({
  conflict: z.boolean(),
  confidence: z.enum(["low", "mid", "high"]),
  reason: z.string().max(280),
});

/**
 * LLM-augmented rule for the 6th finding category from PRD §6.3.
 *
 * Picks pairs of agent files whose body trigram-overlap sits in [0.4, 0.85]
 * — close enough that they're talking about the same thing, but not so close
 * that the deterministic duplicate-guidance rule already caught it. Asks an
 * Anthropic Claude model: "is this guidance in conflict?". Only emits a
 * finding when the model returns conflict=true AND confidence ≥ minConfidence
 * (Confidence-Banding from constraint #13).
 *
 * Hardcore-Local-Only-Mode: silently returns an empty array if neither
 * ANTHROPIC_API_KEY nor OPENAI_API_KEY is set. No findings, no error.
 */
export async function checkConflictingRules(
  scan: ParserResult,
  cfg: Partial<LLMConfig> = {},
): Promise<AuditFinding[]> {
  const config: LLMConfig = { ...defaultLLMConfig, ...cfg };
  const selection = selectModel({
    intensity: config.intensity,
    intent: "conflicting-rules",
  });
  if (!selection) return [];

  const candidates = scan.files.filter(
    (f) => f.kind !== "aider-conf" && f.body.length > 100,
  );

  const pairs = pickCandidatePairs(candidates, config.maxPairs);
  if (pairs.length === 0) return [];

  const model = providerModel(selection);
  const findings: AuditFinding[] = [];

  for (const [a, b] of pairs) {
    try {
      const result = await generateText({
        model,
        maxOutputTokens: selection.maxOutputTokens,
        output: Output.object({ schema: ConflictSchema }),
        prompt: buildPrompt(a, b),
      });
      const { output, usage } = result;

      if (config.meteringContext) {
        await recordUsage({
          meteringContext: config.meteringContext,
          callSiteId: "conflicting-rules",
          provider: selection.provider,
          model: selection.modelId,
          usage,
        });
      }

      if (!output) continue;
      if (!output.conflict) continue;
      if (
        confidenceRank(output.confidence) <
        confidenceRank(config.minConfidence)
      ) {
        continue;
      }

      findings.push({
        id: `conflicting-rules:${a.relativePath}::${b.relativePath}`,
        category: "conflicting-rules",
        severity: output.confidence === "high" ? "Weak" : "Mid",
        title: `Possible conflict between ${a.relativePath} and ${b.relativePath}`,
        detail: output.reason,
        citations: [
          { path: a.relativePath },
          { path: b.relativePath },
        ],
        deterministic: false,
        confidence: output.confidence,
      });
    } catch {
      // Skip pairs that fail (rate-limit, transient network). Don't crash audit.
      continue;
    }
  }

  return findings;
}

function buildPrompt(a: ParsedAgentFile, b: ParsedAgentFile): string {
  return [
    "You are a code-review assistant checking two pieces of AI-agent guidance for contradictions.",
    "Be conservative — only call something a conflict if the two pieces of guidance would lead a developer to opposite actions in the same situation.",
    "Stylistic differences, different emphasis, or one being more detailed than the other are NOT conflicts.",
    "",
    "Output JSON: { conflict: boolean, confidence: 'low'|'mid'|'high', reason: string ≤ 280 chars }.",
    "",
    `## File A (${a.relativePath})`,
    "```",
    truncate(a.body, MAX_BODY_TOKENS),
    "```",
    "",
    `## File B (${b.relativePath})`,
    "```",
    truncate(b.body, MAX_BODY_TOKENS),
    "```",
  ].join("\n");
}

function truncate(body: string, maxApproxTokens: number): string {
  const maxChars = maxApproxTokens * 4;
  if (body.length <= maxChars) return body;
  return body.slice(0, maxChars) + "\n…[truncated]…";
}

function confidenceRank(c: "low" | "mid" | "high"): number {
  return { low: 0, mid: 1, high: 2 }[c];
}

function pickCandidatePairs(
  files: ParsedAgentFile[],
  cap: number,
): Array<[ParsedAgentFile, ParsedAgentFile]> {
  const trigramSets = new Map<string, Set<string>>();
  for (const f of files) trigramSets.set(f.relativePath, trigrams(f.body));

  const scored: Array<{
    pair: [ParsedAgentFile, ParsedAgentFile];
    similarity: number;
  }> = [];

  for (let i = 0; i < files.length; i += 1) {
    for (let j = i + 1; j < files.length; j += 1) {
      const a = files[i]!;
      const b = files[j]!;
      const sa = trigramSets.get(a.relativePath)!;
      const sb = trigramSets.get(b.relativePath)!;
      const sim = jaccard(sa, sb);
      if (sim < LOW_OVERLAP || sim > HIGH_OVERLAP) continue;
      scored.push({ pair: [a, b], similarity: sim });
    }
  }

  scored.sort((x, y) => y.similarity - x.similarity);
  return scored.slice(0, cap).map((s) => s.pair);
}

function trigrams(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .replace(/`[^`]+`/g, " ")
    .replace(/[^a-z0-9äöüß\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const out = new Set<string>();
  if (normalized.length < TRIGRAM_SIZE) return out;
  for (let i = 0; i <= normalized.length - TRIGRAM_SIZE; i += 1) {
    out.add(normalized.slice(i, i + TRIGRAM_SIZE));
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}
