import type { AuditFinding, ParserResult } from "@vk/core";

const MIN_BLOCK_TOKENS = 80;
const TRIGRAM_SIZE = 3;

interface Block {
  fileRel: string;
  text: string;
  trigrams: Set<string>;
}

export function checkDuplicateGuidance(
  scan: ParserResult,
  similarityThreshold: number,
): AuditFinding[] {
  const blocks: Block[] = [];

  for (const f of scan.files) {
    for (const para of splitParagraphs(f.body)) {
      const text = normalize(para);
      if (text.length < MIN_BLOCK_TOKENS * 3) continue;
      blocks.push({
        fileRel: f.relativePath,
        text,
        trigrams: trigrams(text),
      });
    }
  }

  const findings: AuditFinding[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const a = blocks[i]!;
      const b = blocks[j]!;
      if (a.fileRel === b.fileRel) continue;

      const sim = jaccard(a.trigrams, b.trigrams);
      if (sim < similarityThreshold) continue;

      const pairKey = [a.fileRel, b.fileRel].sort().join("|");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      findings.push({
        id: `duplicate:${pairKey}`,
        category: "duplicate-guidance",
        severity: sim > 0.95 ? "Weak" : "Mid",
        title: `Duplicate guidance between ${a.fileRel} and ${b.fileRel}`,
        detail:
          `Trigram similarity ${(sim * 100).toFixed(0)}%. ` +
          "Pick a single canonical home and link from the other.",
        citations: [{ path: a.fileRel }, { path: b.fileRel }],
        deterministic: true,
      });
    }
  }

  return findings;
}

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("```"));
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/`[^`]+`/g, " ")
    .replace(/[^a-z0-9äöüß\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(text: string): Set<string> {
  const out = new Set<string>();
  if (text.length < TRIGRAM_SIZE) return out;
  for (let i = 0; i <= text.length - TRIGRAM_SIZE; i += 1) {
    out.add(text.slice(i, i + TRIGRAM_SIZE));
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
