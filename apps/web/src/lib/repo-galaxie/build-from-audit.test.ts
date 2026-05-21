import { describe, expect, it } from "vitest";
import type {
  AuditFinding,
  AuditReport,
  ParsedAgentFile,
  ParserResult,
} from "@vk/core";
import { buildGalaxieFromAudit } from "./build-from-audit";

function file(overrides: Partial<ParsedAgentFile> = {}): ParsedAgentFile {
  return {
    kind: "claude-md",
    absolutePath: "/tmp/repo/CLAUDE.md",
    relativePath: "/CLAUDE.md",
    rawContent: "",
    body: "# CLAUDE\n\nfirst line\n\nsecond line\n",
    frontmatter: {},
    tokenCount: 12,
    lineCount: 4,
    byteSize: 64,
    lastModified: new Date("2026-04-01T00:00:00Z"),
    name: null,
    description: null,
    outlinks: [],
    ...overrides,
  };
}

function finding(overrides: Partial<AuditFinding> = {}): AuditFinding {
  return {
    id: "f-1",
    category: "token-budget",
    severity: "Weak",
    title: "CLAUDE.md überschreitet Token-Budget",
    detail: "context_budget: 8400 — 68 % über Default 5000.",
    citations: [{ path: "/CLAUDE.md" }],
    deterministic: true,
    ...overrides,
  };
}

function emptyReport(): AuditReport {
  return {
    rootPath: "github.com/acme/repo",
    generatedAt: new Date(),
    fileCount: 0,
    findings: [],
    summary: {
      byCategory: {
        "unused-agent": 0,
        "duplicate-guidance": 0,
        "context-bloat": 0,
        "stale-reference": 0,
        "token-budget": 0,
        "conflicting-rules": 0,
      },
      bySeverity: { Kill: 0, Weak: 0, Mid: 0, Strong: 0, Exceptional: 0 },
      overallSeverity: "Exceptional",
    },
  };
}

function scan(files: ParsedAgentFile[]): ParserResult {
  return {
    rootPath: "github.com/acme/repo",
    scannedAt: new Date(),
    files,
    warnings: [],
  };
}

describe("buildGalaxieFromAudit", () => {
  it("produces a root-only galaxy when scan has no files", () => {
    const data = buildGalaxieFromAudit(scan([]), emptyReport());
    expect(data.nodes).toHaveLength(1);
    expect(data.nodes[0]).toMatchObject({
      id: "root",
      kind: "repo",
      parentId: null,
      label: "acme/repo",
    });
    expect(data.edges).toHaveLength(0);
  });

  it("materialises folders on demand for nested file paths", () => {
    const files = [
      file({ relativePath: "/AGENTS.md" }),
      file({ relativePath: "/apps/web/CLAUDE.md" }),
      file({ relativePath: "/apps/api/AGENTS.md", kind: "agents-md" }),
    ];
    const data = buildGalaxieFromAudit(scan(files), emptyReport());
    const ids = new Set(data.nodes.map((n) => n.id));
    expect(ids).toContain("root");
    expect(ids).toContain("folder:apps");
    expect(ids).toContain("folder:apps/web");
    expect(ids).toContain("folder:apps/api");
    expect(ids).toContain("file:/AGENTS.md");
    expect(ids).toContain("file:/apps/web/CLAUDE.md");
    expect(ids).toContain("file:/apps/api/AGENTS.md");
  });

  it("bubbles file severity up through parent folders (worst wins)", () => {
    const files = [
      file({ relativePath: "/apps/web/CLAUDE.md" }),
      file({ relativePath: "/apps/api/AGENTS.md", kind: "agents-md" }),
    ];
    const report: AuditReport = {
      ...emptyReport(),
      findings: [
        finding({ severity: "Mid", citations: [{ path: "/apps/web/CLAUDE.md" }] }),
        finding({ severity: "Kill", citations: [{ path: "/apps/api/AGENTS.md" }] }),
      ],
    };
    const data = buildGalaxieFromAudit(scan(files), report);
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    expect(byId.get("file:/apps/web/CLAUDE.md")?.severity).toBe("Mid");
    expect(byId.get("file:/apps/api/AGENTS.md")?.severity).toBe("Kill");
    expect(byId.get("folder:apps/web")?.severity).toBe("Mid");
    expect(byId.get("folder:apps/api")?.severity).toBe("Kill");
    // Worst-wins reaches the root.
    expect(byId.get("folder:apps")?.severity).toBe("Kill");
    expect(byId.get("root")?.severity).toBe("Kill");
  });

  it("attaches finding-meta to the cited file", () => {
    const files = [file({ relativePath: "/CLAUDE.md" })];
    const report: AuditReport = {
      ...emptyReport(),
      findings: [finding()],
    };
    const data = buildGalaxieFromAudit(scan(files), report);
    const node = data.nodes.find((n) => n.id === "file:/CLAUDE.md");
    expect(node?.findingTitle).toBe("CLAUDE.md überschreitet Token-Budget");
    expect(node?.findingRule).toBe("token-budget");
    expect(node?.findingCount).toBe(1);
  });

  it("silently skips citations whose file is missing from the scan", () => {
    const data = buildGalaxieFromAudit(
      scan([file({ relativePath: "/CLAUDE.md" })]),
      {
        ...emptyReport(),
        findings: [
          finding({ citations: [{ path: "/does/not/exist.md" }] }),
        ],
      },
    );
    const node = data.nodes.find((n) => n.id === "file:/CLAUDE.md");
    expect(node?.severity).toBeUndefined();
    expect(node?.findingTitle).toBeUndefined();
  });

  it("emits contains-edges for every parent/child pair", () => {
    const files = [file({ relativePath: "/apps/web/CLAUDE.md" })];
    const data = buildGalaxieFromAudit(scan(files), emptyReport());
    const edgePairs = new Set(data.edges.map((e) => `${e.from}->${e.to}`));
    expect(edgePairs).toContain("root->folder:apps");
    expect(edgePairs).toContain("folder:apps->folder:apps/web");
    expect(edgePairs).toContain("folder:apps/web->file:/apps/web/CLAUDE.md");
    for (const edge of data.edges) expect(edge.kind).toBe("contains");
  });

  it("infers language from the parser kind for common agent files", () => {
    const data = buildGalaxieFromAudit(
      scan([
        file({ relativePath: "/CLAUDE.md", kind: "claude-md" }),
        file({ relativePath: "/.cursor/rules/x.mdc", kind: "cursor-rule-mdc" }),
        file({ relativePath: "/.aider.conf.yml", kind: "aider-conf" }),
      ]),
      emptyReport(),
    );
    const byId = new Map(data.nodes.map((n) => [n.id, n]));
    expect(byId.get("file:/CLAUDE.md")?.language).toBe("md");
    expect(byId.get("file:/.cursor/rules/x.mdc")?.language).toBe("mdc");
    expect(byId.get("file:/.aider.conf.yml")?.language).toBe("yaml");
  });
});
