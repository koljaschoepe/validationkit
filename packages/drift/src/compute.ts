import {
  DRIFT_KINDS,
  type DriftItem,
  type DriftKind,
  type DriftReport,
  type ParsedAgentFile,
  type ParserResult,
  type SeverityBand,
  SEVERITY_BANDS,
  compareSeverity,
} from "@vk/core";

const TRIGRAM_SIZE = 3;
const CONTENT_DRIFT_THRESHOLD = 0.85;
const TOKEN_DRIFT_RATIO = 0.25;
const TRACKED_FRONTMATTER_FIELDS = [
  "name",
  "description",
  "globs",
  "alwaysApply",
  "type",
  "model",
] as const;

export function computeDrift(a: ParserResult, b: ParserResult): DriftReport {
  const byPathA = new Map(a.files.map((f) => [f.relativePath, f]));
  const byPathB = new Map(b.files.map((f) => [f.relativePath, f]));

  const items: DriftItem[] = [];

  for (const f of a.files) {
    if (!byPathB.has(f.relativePath)) {
      items.push(onlyInA(f));
    }
  }
  for (const f of b.files) {
    if (!byPathA.has(f.relativePath)) {
      items.push(onlyInB(f));
    }
  }

  for (const fa of a.files) {
    const fb = byPathB.get(fa.relativePath);
    if (!fb) continue;
    items.push(...comparePair(fa, fb));
  }

  return {
    pathA: a.rootPath,
    pathB: b.rootPath,
    generatedAt: new Date(),
    filesA: a.files.length,
    filesB: b.files.length,
    items,
    summary: summarize(items),
  };
}

function onlyInA(f: ParsedAgentFile): DriftItem {
  return {
    id: `only-in-a:${f.relativePath}`,
    kind: "only-in-a",
    severity: severityForMissing(f),
    relativePath: f.relativePath,
    title: `${f.relativePath} exists only in A`,
    detail: `B is missing this ${f.kind}. Either backfill the template into B or remove it from A if deprecated.`,
  };
}

function onlyInB(f: ParsedAgentFile): DriftItem {
  return {
    id: `only-in-b:${f.relativePath}`,
    kind: "only-in-b",
    severity: severityForMissing(f),
    relativePath: f.relativePath,
    title: `${f.relativePath} exists only in B`,
    detail: `A is missing this ${f.kind}. Either backfill into A or accept the divergence intentionally.`,
  };
}

function comparePair(a: ParsedAgentFile, b: ParsedAgentFile): DriftItem[] {
  const out: DriftItem[] = [];

  const fm = compareFrontmatter(a, b);
  if (fm.length > 0) {
    out.push({
      id: `frontmatter-drift:${a.relativePath}`,
      kind: "frontmatter-drift",
      severity: "Mid",
      relativePath: a.relativePath,
      title: `Frontmatter drift in ${a.relativePath}`,
      detail: `Fields differ: ${fm.join(", ")}. If this template is meant to be uniform, push the canonical version to the lagging side.`,
      fieldsChanged: fm,
    });
  }

  const similarity = trigramJaccard(a.body, b.body);
  if (similarity < CONTENT_DRIFT_THRESHOLD) {
    out.push({
      id: `content-drift:${a.relativePath}`,
      kind: "content-drift",
      severity: severityForContentDrift(similarity),
      relativePath: a.relativePath,
      title: `Content drift in ${a.relativePath} (${(similarity * 100).toFixed(0)}% similar)`,
      detail:
        "Bodies have diverged below the 85% similarity threshold. " +
        "Diff the files and pick a canonical version.",
      similarity,
    });
  }

  const tokenRatio = Math.abs(a.tokenCount - b.tokenCount) /
    Math.max(a.tokenCount, b.tokenCount, 1);
  if (tokenRatio > TOKEN_DRIFT_RATIO) {
    out.push({
      id: `token-drift:${a.relativePath}`,
      kind: "token-drift",
      severity: "Mid",
      relativePath: a.relativePath,
      title: `Token-count drift in ${a.relativePath} (${a.tokenCount} vs ${b.tokenCount})`,
      detail:
        "Token counts differ by more than 25%. One side may have grown unnoticed " +
        "(context bloat) or been trimmed (lost guidance).",
      tokensA: a.tokenCount,
      tokensB: b.tokenCount,
    });
  }

  return out;
}

function compareFrontmatter(a: ParsedAgentFile, b: ParsedAgentFile): string[] {
  const diffs: string[] = [];
  for (const field of TRACKED_FRONTMATTER_FIELDS) {
    const va = JSON.stringify(a.frontmatter[field] ?? null);
    const vb = JSON.stringify(b.frontmatter[field] ?? null);
    if (va !== vb) diffs.push(field);
  }
  return diffs;
}

function severityForMissing(f: ParsedAgentFile): SeverityBand {
  if (f.kind === "claude-md" || f.kind === "agents-md") return "Weak";
  return "Mid";
}

function severityForContentDrift(similarity: number): SeverityBand {
  if (similarity < 0.4) return "Weak";
  if (similarity < 0.7) return "Mid";
  return "Mid";
}

function summarize(items: DriftItem[]): DriftReport["summary"] {
  const byKind = Object.fromEntries(
    DRIFT_KINDS.map((k) => [k, 0]),
  ) as Record<DriftKind, number>;
  for (const item of items) byKind[item.kind] += 1;

  let worst: SeverityBand = "Exceptional";
  for (const item of items) {
    if (compareSeverity(item.severity, worst) < 0) worst = item.severity;
  }
  return { byKind, overallSeverity: worst };
}

function trigramJaccard(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na.length === 0 && nb.length === 0) return 1;
  const sa = trigrams(na);
  const sb = trigrams(nb);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
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

// Avoid unused import warnings (SEVERITY_BANDS is implicitly used through
// SeverityBand type derivation but TS still tracks it).
void SEVERITY_BANDS;
