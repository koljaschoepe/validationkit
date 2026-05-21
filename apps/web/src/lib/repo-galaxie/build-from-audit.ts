import type {
  AuditFinding,
  AuditReport,
  ParsedAgentFile,
  ParserResult,
  SeverityBand,
} from "@vk/core";
import type { GraphNode, RepoGalaxieData } from "./types";

/**
 * Translates a real audit result (scan + report) into the same `RepoGalaxieData`
 * shape the landing-hero demo uses. The output drives the post-submit Live-
 * Galaxie + Inspector — same components, same interactions, just real-repo data.
 *
 * Mapping rules:
 *   - One root `repo` node from `scan.rootPath` (e.g. `github.com/owner/name`).
 *   - Each `ParsedAgentFile` becomes a `file` node; its `relativePath`'s
 *     directory segments are materialised as `folder` nodes on demand.
 *   - Severity bubbles up: a folder's severity = worst of its descendants.
 *   - First matching citation per finding wins; later citations on the same
 *     file overwrite, last-write keeps the most-relevant title for the leaf.
 *   - Files mentioned only via citation but absent from `scan.files` are
 *     silently skipped (defensive — the inspector won't crash on missing data).
 */
export function buildGalaxieFromAudit(
  scan: ParserResult,
  report: AuditReport,
): RepoGalaxieData {
  const nodes = new Map<string, GraphNode>();
  const rootId = "root";
  nodes.set(rootId, {
    id: rootId,
    kind: "repo",
    label: stripGithubPrefix(scan.rootPath),
    parentId: null,
    depth: 0,
    githubUrl: scan.rootPath.startsWith("github.com/")
      ? `https://${scan.rootPath}`
      : undefined,
  });

  for (const file of scan.files) {
    const segments = file.relativePath.replace(/^\/+/, "").split("/");
    const fileName = segments.pop();
    if (!fileName) continue;

    let parentId = rootId;
    let depth = 1;
    const folderPath: string[] = [];
    for (const segment of segments) {
      folderPath.push(segment);
      const folderId = `folder:${folderPath.join("/")}`;
      if (!nodes.has(folderId)) {
        nodes.set(folderId, {
          id: folderId,
          kind: "folder",
          label: segment,
          parentId,
          depth,
        });
      }
      parentId = folderId;
      depth += 1;
    }

    const fileId = `file:${file.relativePath}`;
    nodes.set(fileId, {
      id: fileId,
      kind: "file",
      label: fileName,
      parentId,
      depth,
      bytes: file.byteSize,
      lines: file.lineCount,
      language: languageFromKind(file),
      lastModified: file.lastModified?.toISOString(),
      filePath: file.relativePath,
      previewLines: firstNLines(file.body, 12),
    });
  }

  // Attach findings to matching file nodes. Citations point at relativePaths
  // — both leading-slash and bare are normalised.
  for (const finding of report.findings) {
    for (const citation of finding.citations) {
      const fileId = findFileIdForCitationPath(citation.path, nodes);
      if (!fileId) continue;
      attachFindingToNode(nodes.get(fileId)!, finding);
    }
  }

  // Bubble severity up from leaves to the root. Worst-wins.
  bubbleSeverityUp(nodes);

  const allNodes = Array.from(nodes.values());
  const edges = allNodes
    .filter((n) => n.parentId !== null)
    .map((n) => ({ from: n.parentId!, to: n.id, kind: "contains" as const }));

  return { nodes: allNodes, edges };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripGithubPrefix(rootPath: string): string {
  if (rootPath.startsWith("github.com/")) return rootPath.slice("github.com/".length);
  return rootPath;
}

function firstNLines(body: string, n: number): string[] {
  return body.split("\n").slice(0, n);
}

/**
 * Best-effort language inference for the inspector's pill-row. We map by the
 * parser kind first (covers MD/MDC/conf), and fall back to the file extension.
 */
function languageFromKind(file: ParsedAgentFile): string {
  const kind = file.kind;
  if (
    kind === "claude-md" ||
    kind === "agents-md" ||
    kind === "gemini-md" ||
    kind === "windsurf-rule" ||
    kind === "cline-rule" ||
    kind === "codex-rule"
  ) {
    return "md";
  }
  if (kind === "cursor-rule-mdc") return "mdc";
  if (kind === "cursor-rules-legacy") return "mdc";
  if (kind === "aider-conf") return "yaml";
  if (kind === "claude-agent" || kind === "claude-command" || kind === "claude-skill") {
    return "md";
  }
  const ext = file.relativePath.split(".").pop()?.toLowerCase();
  return ext ?? "txt";
}

function findFileIdForCitationPath(
  citationPath: string,
  nodes: Map<string, GraphNode>,
): string | null {
  const normalised = citationPath.startsWith("/")
    ? citationPath
    : `/${citationPath}`;
  const candidate = `file:${normalised}`;
  if (nodes.has(candidate)) return candidate;
  const altCandidate = `file:${citationPath}`;
  if (nodes.has(altCandidate)) return altCandidate;
  // Last-resort: match by suffix in case the relativePath stores it without
  // leading slash. Rare, but defends against parser drift.
  for (const id of nodes.keys()) {
    if (id.startsWith("file:") && id.endsWith(citationPath)) return id;
  }
  return null;
}

function attachFindingToNode(node: GraphNode, finding: AuditFinding): void {
  node.severity = worseSeverity(node.severity, finding.severity);
  node.findingCount = (node.findingCount ?? 0) + 1;
  // Last-write wins for the descriptive fields — keeps API simple. The
  // inspector renders a single finding at a time anyway.
  node.findingTitle = finding.title;
  node.findingDescription = finding.detail;
  node.findingRule = finding.category;
}

const SEVERITY_RANK: Record<SeverityBand, number> = {
  Exceptional: 0,
  Strong: 1,
  Mid: 2,
  Weak: 3,
  Kill: 4,
};

function worseSeverity(
  current: SeverityBand | undefined,
  candidate: SeverityBand,
): SeverityBand {
  if (!current) return candidate;
  return SEVERITY_RANK[candidate] > SEVERITY_RANK[current] ? candidate : current;
}

function bubbleSeverityUp(nodes: Map<string, GraphNode>): void {
  // Process by descending depth so children settle before their parents.
  const sorted = Array.from(nodes.values()).sort((a, b) => b.depth - a.depth);
  for (const node of sorted) {
    if (!node.severity || node.parentId == null) continue;
    const parent = nodes.get(node.parentId);
    if (!parent) continue;
    parent.severity = worseSeverity(parent.severity, node.severity);
    parent.findingCount = (parent.findingCount ?? 0) + (node.findingCount ?? 0);
  }
}
