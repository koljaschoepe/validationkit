/**
 * Sprint 1.4 — Anthropic Skills registry. Source of truth for what's
 * listed at /skills. Mirrors skills/<name>/SKILL.md frontmatter in TS so
 * the page can render server-side without filesystem reads on Vercel.
 */

export interface SkillEntry {
  /** Stable identifier; matches the folder name and the SKILL.md `name:` field. */
  id: string;
  /** Human-readable title for the listing. */
  title: string;
  /** One-sentence summary shown on the card. */
  summary: string;
  /** Plain-English trigger copy from the SKILL.md frontmatter. */
  trigger: string;
  /** Categories used for filtering (no UI filter yet — Sprint 1.5+). */
  tags: string[];
  /** Direct GitHub blob URL once the Skill is in the repo. */
  sourceUrl: string;
  /** Status: shipped = installable; submitted = PR open against anthropics/skills. */
  status: "shipped" | "submitted" | "draft";
  /** Date the Skill was first published. */
  publishedAt: string;
}

export const SKILLS: SkillEntry[] = [
  {
    id: "validationkit-agent-file-audit",
    title: "ValidationKit — cross-vendor agent-file audit",
    summary:
      "Deterministic audit of CLAUDE.md, AGENTS.md, .cursor/rules, .windsurfrules, .clinerules, .aider.conf.yml, SKILL.md, and 5 more vendor formats. 5 deterministic rules + 1 opt-in LLM rule. File:line citations on every finding.",
    trigger:
      "when the user asks to audit agent files, check CLAUDE.md health, find drift between AI-tool configs, lint AGENTS.md, or run a cross-vendor agent-file review",
    tags: ["audit", "agent-files", "cross-vendor", "deterministic"],
    sourceUrl:
      "https://github.com/koljaschoepe/validationkit/blob/main/skills/validationkit-agent-file-audit/SKILL.md",
    status: "shipped",
    publishedAt: "2026-05-18",
  },
];
