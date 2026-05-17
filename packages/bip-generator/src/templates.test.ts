import { describe, expect, it } from "vitest";
import type {
  AuditReport,
  DriftReport,
  FindingCategory,
  SeverityBand,
} from "@vk/core";
import { fromAuditReport, fromDriftReport } from "./templates.js";

function emptyAudit(severity: SeverityBand = "Exceptional"): AuditReport {
  const byCategory: Record<FindingCategory, number> = {
    "unused-agent": 0,
    "duplicate-guidance": 0,
    "context-bloat": 0,
    "stale-reference": 0,
    "token-budget": 0,
    "conflicting-rules": 0,
  };
  const bySeverity: Record<SeverityBand, number> = {
    Kill: 0,
    Weak: 0,
    Mid: 0,
    Strong: 0,
    Exceptional: 0,
  };
  return {
    rootPath: "/tmp",
    generatedAt: new Date(),
    fileCount: 5,
    findings: [],
    summary: { byCategory, bySeverity, overallSeverity: severity },
  };
}

describe("fromAuditReport", () => {
  it("emits 3 drafts in the expected formats", () => {
    const set = fromAuditReport(emptyAudit());
    const formats = set.drafts.map((d) => d.format).sort();
    expect(formats).toEqual(["linkedin", "mastodon", "x-thread"]);
  });

  it("uses the clean-repo concession when findings are empty", () => {
    const set = fromAuditReport(emptyAudit());
    const linkedin = set.drafts.find((d) => d.format === "linkedin")!;
    expect(linkedin.body).toContain("Concession");
    expect(linkedin.body).toContain("clean");
  });

  it("calls out a specific top finding when findings exist", () => {
    const report = emptyAudit("Weak");
    report.findings = [
      {
        id: "x",
        category: "unused-agent",
        severity: "Weak",
        title: "Agent 'foo' is never referenced",
        detail: "...",
        citations: [],
        deterministic: true,
      },
    ];
    report.summary.byCategory["unused-agent"] = 1;
    report.summary.bySeverity.Weak = 1;
    const set = fromAuditReport(report);
    const x = set.drafts.find((d) => d.format === "x-thread")!;
    expect(x.body).toContain("Agent 'foo'");
    expect(x.body).toContain("[WEAK]");
  });

  it("includes Skeptic-Mentor counter-tagline in the x-thread", () => {
    const set = fromAuditReport(emptyAudit());
    const x = set.drafts.find((d) => d.format === "x-thread")!;
    expect(x.body).toContain("That's the point.");
  });
});

describe("fromDriftReport", () => {
  function emptyDrift(): DriftReport {
    return {
      pathA: "/tmp/a",
      pathB: "/tmp/b",
      generatedAt: new Date(),
      filesA: 3,
      filesB: 3,
      items: [],
      summary: {
        byKind: {
          "only-in-a": 0,
          "only-in-b": 0,
          "content-drift": 0,
          "frontmatter-drift": 0,
          "token-drift": 0,
        },
        overallSeverity: "Exceptional",
      },
    };
  }

  it("emits 3 drafts in the expected formats", () => {
    const set = fromDriftReport(emptyDrift());
    const formats = set.drafts.map((d) => d.format).sort();
    expect(formats).toEqual(["linkedin", "mastodon", "x-thread"]);
  });

  it("emits the in-sync concession when items are empty", () => {
    const set = fromDriftReport(emptyDrift());
    const x = set.drafts.find((d) => d.format === "x-thread")!;
    expect(x.body).toContain("in sync");
  });

  it("mentions Agency-Lena workflow in linkedin draft", () => {
    const set = fromDriftReport(emptyDrift());
    const li = set.drafts.find((d) => d.format === "linkedin")!;
    expect(li.body).toMatch(/5.{1,3}30 customer-repos/);
  });
});
