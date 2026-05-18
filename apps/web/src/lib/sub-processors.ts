/**
 * Sprint 1.0 — sub-processor manifest.
 *
 * Source of truth for `/trust/sub-processors.json` + `/trust/sub-processors.xml`.
 * Mirrors docs/legal/sub-processors.md but typed + machine-readable.
 *
 * Adding or replacing a sub-processor triggers a 30-day notice obligation
 * per DPA §5. Bump `introducedAt` to today on add; for replacements, set
 * `status: "deprecated"` on the old entry and add the new one with a fresh
 * `introducedAt`. Never delete rows — Customers need the historical record.
 */

export type SubProcessorStatus = "planned" | "active" | "deprecated";

export interface SubProcessor {
  id: string;
  name: string;
  purpose: string;
  regions: string[];
  phase: "0" | "1+" | "2+";
  status: SubProcessorStatus;
  /** First date this sub-processor was committed in the manifest. */
  introducedAt: string; // YYYY-MM-DD
  dpaUrl?: string;
  notes?: string;
}

/**
 * Phase-0 truth: NONE are active because Hardcore-Local-Only mode means
 * processing happens on the Controller's machine. The list below is the
 * planned Phase-1 stack — what Customers see if they audit our manifest
 * before the first live engagement.
 */
export const SUB_PROCESSORS: SubProcessor[] = [
  {
    id: "neon",
    name: "Neon",
    purpose: "Postgres (production)",
    regions: ["EU-Frankfurt", "US-East (opt-in)"],
    phase: "1+",
    status: "active",
    introducedAt: "2026-05-15",
    dpaUrl: "https://neon.tech/dpa",
    notes: "SOC-2 Type-II, ISO-27001.",
  },
  {
    id: "vercel",
    name: "Vercel",
    purpose: "Edge hosting",
    regions: ["EU-Frankfurt (default in Phase 2)", "Multi-region until then"],
    phase: "1+",
    status: "active",
    introducedAt: "2026-05-15",
    notes:
      "Sprint 0.11 deploy live at https://validationkit.vercel.app/. EU-only region config locks Phase 2.",
  },
  {
    id: "resend",
    name: "Resend",
    purpose: "Transactional email (magic-link, billing notices)",
    regions: ["EU-pinned"],
    phase: "1+",
    status: "active",
    introducedAt: "2026-05-15",
    notes: "Postmark documented as fallback in PRD §10.2.",
  },
  {
    id: "stripe",
    name: "Stripe",
    purpose: "Billing (test-mode in v0.0.15; live-mode Sprint 1.1+)",
    regions: ["Multi-region"],
    phase: "1+",
    status: "planned",
    introducedAt: "2026-05-17",
    notes: "No personal data beyond billing email.",
  },
  {
    id: "inngest",
    name: "Inngest Cloud",
    purpose: "Background workflows (auto-track-repos cron, audit queue)",
    regions: ["Multi-region (EU-pinned config)"],
    phase: "1+",
    status: "planned",
    introducedAt: "2026-05-17",
    notes: "Replaces local Inngest Dev Server.",
  },
  {
    id: "github-app",
    name: "GitHub App",
    purpose: "PR-Workflow + customer-repo install",
    regions: ["Multi-region"],
    phase: "1+",
    status: "planned",
    introducedAt: "2026-05-17",
    notes:
      "Read-only default; per-repo write requires Customer-Admin approval via Requester→Approver-Bridge.",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    purpose:
      "LLM provider (conflicting-rules audit, opt-in via ANTHROPIC_API_KEY)",
    regions: ["US-East default", "EU regions if available"],
    phase: "0",
    status: "planned",
    introducedAt: "2026-05-17",
    notes:
      "Direct provider, no Gateway middleman (PRD §5.2). Zero-Retention API setting required in hosted-mode.",
  },
  {
    id: "openai",
    name: "OpenAI",
    purpose: "LLM provider fallback (opt-in via OPENAI_API_KEY)",
    regions: ["US-East"],
    phase: "0",
    status: "planned",
    introducedAt: "2026-05-17",
    notes:
      "Used only when ANTHROPIC_API_KEY is unset. Zero-Retention via API ZDR opt-in.",
  },
];
