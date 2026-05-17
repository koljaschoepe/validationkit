import type {
  AuditReport,
  DriftReport,
  FindingCategory,
  SeverityBand,
} from "@vk/core";

export type PostFormat = "x-thread" | "linkedin" | "mastodon";

export interface BipDraft {
  format: PostFormat;
  /** Header summarizing what this draft is for. */
  title: string;
  /** Plain text. For x-thread, posts are separated by `\n\n---\n\n`. */
  body: string;
  /** Approximate character count (without the separators). */
  charCount: number;
}

export interface BipDraftSet {
  drafts: BipDraft[];
  hashtags: string[];
}

const HASHTAGS_AUDIT = [
  "#agentengineering",
  "#claudecode",
  "#cursor",
  "#buildinpublic",
];
const HASHTAGS_DRIFT = [
  "#aiagency",
  "#multicustomer",
  "#templates",
  "#buildinpublic",
];

// Skeptic-Mentor voice toolbox.
//
// 1. Concession ("the easy win"): name something good first.
// 2. Critique ("the specific gap"): cite an exact number.
// 3. Counter-tagline: "Most ideas fail this. That's the point."
//
// Templates intentionally name the file path / category — citation-first
// per PRD constraint #2.

export function fromAuditReport(report: AuditReport): BipDraftSet {
  const sev = report.summary.overallSeverity;
  const top = pickTopFinding(report);
  const cats = Object.entries(report.summary.byCategory)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  const summaryLine =
    report.findings.length === 0
      ? `${report.fileCount} agent files scanned. 0 deterministic findings.`
      : `${report.fileCount} agent files scanned. ${report.findings.length} findings. Overall: ${sev}.`;

  const concession =
    sev === "Exceptional"
      ? "Concession: the repo is clean against our 5 deterministic rules. That's a real win."
      : `Concession: every finding lands with a file:line citation. No vibe scores.`;

  const critique =
    top !== null
      ? `Critique: top finding (${severityBadge(top.severity)}) — ${top.title}`
      : `Critique: clean today says nothing about the LLM-augmented conflicting-rules check. That fires only with an API key set.`;

  const catBreakdown =
    cats.length === 0
      ? "All 5 categories quiet."
      : cats.map(([c, n]) => `${labelCategory(c as FindingCategory)}: ${n}`).join(" · ");

  const xPosts = [
    `Just audited a repo for cross-vendor agent-file trust.`,
    summaryLine,
    concession,
    critique,
    `Breakdown — ${catBreakdown}`,
    `5 of 6 finding categories are deterministic. One uses an LLM with confidence banding. No "87/100" vibe-scores in sight.`,
    `Most agent-file repos fail at least one of these checks. That's the point.`,
    HASHTAGS_AUDIT.join(" "),
  ];

  const linkedinBody = [
    `**${summaryLine}**`,
    ``,
    `**${concession}**`,
    `**${critique}**`,
    ``,
    `What we look at (deterministic, no LLM):`,
    `  • unused-agent — agents nobody references`,
    `  • duplicate-guidance — same paragraph in 2+ files (trigram ≥ 85%)`,
    `  • context-bloat — single file over 8000 tokens`,
    `  • stale-reference — outbound link to a missing file`,
    `  • token-budget — sum of always-loaded context over 25k tokens`,
    ``,
    `LLM (opt-in): conflicting-rules, with low/mid/high confidence banding. Only mid+ emits a finding.`,
    ``,
    `Most agent-file repos fail at least one of these checks. That's the point.`,
    ``,
    HASHTAGS_AUDIT.join(" "),
  ].join("\n");

  const mastodonBody = [
    summaryLine,
    "",
    concession,
    critique,
    "",
    "5/6 deterministic. 1 LLM with confidence bands. Cross-vendor: CLAUDE.md, AGENTS.md, .cursor/rules, .windsurf, .clinerules, GEMINI.md, aider.conf.yml.",
    "",
    HASHTAGS_AUDIT.slice(0, 3).join(" "),
  ].join("\n");

  return {
    drafts: [
      {
        format: "x-thread",
        title: "Audit-Report → X/Twitter Thread",
        body: xPosts.map((p, i) => `${i + 1}/ ${p}`).join("\n\n---\n\n"),
        charCount: xPosts.reduce((sum, p) => sum + p.length, 0),
      },
      {
        format: "linkedin",
        title: "Audit-Report → LinkedIn Post",
        body: linkedinBody,
        charCount: linkedinBody.length,
      },
      {
        format: "mastodon",
        title: "Audit-Report → Mastodon Toot",
        body: mastodonBody,
        charCount: mastodonBody.length,
      },
    ],
    hashtags: HASHTAGS_AUDIT,
  };
}

export function fromDriftReport(drift: DriftReport): BipDraftSet {
  const sev = drift.summary.overallSeverity;
  const total = drift.items.length;
  const kinds = Object.entries(drift.summary.byKind)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${k}: ${n}`)
    .join(" · ");

  const summaryLine =
    total === 0
      ? `Two repos compared. 0 drift items.`
      : `Two repos compared. ${total} drift items. Overall: ${sev}.`;

  const concession =
    total === 0
      ? "Concession: the two repos are in sync against presence + frontmatter + body-similarity + token-count."
      : "Concession: every drift item names the exact path. No 'feels different' — only file-level facts.";

  const critique =
    total === 0
      ? "Critique: 'in sync' here is a narrow definition. Semantic drift (same words, opposite intent) needs the LLM-augmented audit, not just diff."
      : `Critique: drift across ${total} items means at least ${total} decisions to make about which side is canonical.`;

  const xPosts = [
    `Ran drift detection across two customer-repos for cross-vendor agent-file trust.`,
    summaryLine,
    concession,
    critique,
    kinds ? `Breakdown — ${kinds}` : "Breakdown — clean.",
    `Drift kinds: only-in-A, only-in-B, content-drift (similarity < 85%), frontmatter-drift, token-drift (>25%).`,
    `Agencies juggling 5–30 customer-repos need this. Otherwise the templates fork silently.`,
    HASHTAGS_DRIFT.join(" "),
  ];

  const linkedinBody = [
    `**${summaryLine}**`,
    ``,
    `**${concession}**`,
    `**${critique}**`,
    ``,
    `Drift kinds we surface (all deterministic):`,
    `  • only-in-A / only-in-B — file presence`,
    `  • content-drift — body trigram similarity < 85%`,
    `  • frontmatter-drift — name / description / globs / activationMode change`,
    `  • token-drift — counts differ by more than 25%`,
    ``,
    `Agencies juggling 5–30 customer-repos need this. Otherwise the templates fork silently.`,
    ``,
    HASHTAGS_DRIFT.join(" "),
  ].join("\n");

  const mastodonBody = [
    summaryLine,
    "",
    concession,
    critique,
    "",
    "4 deterministic drift kinds. Built for AI-consultancies who keep 5–30 customer repos aligned with a canonical template.",
    "",
    HASHTAGS_DRIFT.slice(0, 3).join(" "),
  ].join("\n");

  return {
    drafts: [
      {
        format: "x-thread",
        title: "Drift-Report → X/Twitter Thread",
        body: xPosts.map((p, i) => `${i + 1}/ ${p}`).join("\n\n---\n\n"),
        charCount: xPosts.reduce((sum, p) => sum + p.length, 0),
      },
      {
        format: "linkedin",
        title: "Drift-Report → LinkedIn Post",
        body: linkedinBody,
        charCount: linkedinBody.length,
      },
      {
        format: "mastodon",
        title: "Drift-Report → Mastodon Toot",
        body: mastodonBody,
        charCount: mastodonBody.length,
      },
    ],
    hashtags: HASHTAGS_DRIFT,
  };
}

function severityBadge(s: SeverityBand): string {
  return `[${s.toUpperCase()}]`;
}

function labelCategory(c: FindingCategory): string {
  const labels: Record<FindingCategory, string> = {
    "unused-agent": "unused",
    "duplicate-guidance": "duplicate",
    "context-bloat": "bloat",
    "stale-reference": "stale-ref",
    "token-budget": "budget",
    "conflicting-rules": "conflict",
  };
  return labels[c] ?? c;
}

function pickTopFinding(report: AuditReport) {
  if (report.findings.length === 0) return null;
  const order: SeverityBand[] = ["Kill", "Weak", "Mid", "Strong", "Exceptional"];
  for (const sev of order) {
    const hit = report.findings.find((f) => f.severity === sev);
    if (hit) return hit;
  }
  return report.findings[0] ?? null;
}
