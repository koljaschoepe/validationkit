// Unit tests for audit-action.ts (the core user flow — landing-hero submit
// + workspace-internal audit triggers both land here).
//
// All collaborators are vi.mocked: parser, audit, db, inngest, session,
// workspaces, github-fetch, rate-limit, billing. The action's own logic —
// input validation, gates, dispatch (github vs local, foreground vs
// background) — runs un-mocked.

import { describe, expect, it, vi, beforeEach } from "vitest";

// ---- mocks ---- ----------------------------------------------------------

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "127.0.0.1" })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

// github-fetch now lives in @vk/parser (J1), so the parser mock provides both
// the scanner and the GitHub fetch/parse helpers.
vi.mock("@vk/parser", () => ({
  scanRepository: vi.fn(),
  classifyPath: vi.fn(() => "other"),
  looksLikeGithubUrl: vi.fn((s: string) => s.includes("github.com")),
  parseGithubUrl: vi.fn(),
  fetchRepoZipball: vi.fn(),
  cleanupTempDir: vi.fn(() => Promise.resolve()),
}));

vi.mock("@vk/audit", () => ({
  runAudit: vi.fn(),
}));

const dbInsertReturning = vi.fn();
const dbSelectLimit = vi.fn();

vi.mock("@vk/db", () => ({
  isDbEnabled: vi.fn(() => false), // default: DB off (anonymous-friendly)
  getDb: vi.fn(() => ({
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      returning: dbInsertReturning,
    })),
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: dbSelectLimit,
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn(),
    })),
  })),
  schema: {
    scan: { id: "scan.id" },
    finding: { id: "finding.id" },
    aiUsageEvent: { scanId: "aiUsageEvent.scanId", costMicrocents: "aiUsageEvent.costMicrocents" },
    auditRunCost: { scanId: "auditRunCost.scanId" },
  },
}));

vi.mock("@vk/inngest", () => ({
  inngest: { send: vi.fn(() => Promise.resolve()) },
  isInngestEnabled: vi.fn(() => false),
  BACKGROUND_THRESHOLD: 200,
}));

vi.mock("./session", () => ({
  getSessionUser: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("./workspaces", () => ({
  ensureDefaultWorkspace: vi.fn(() =>
    Promise.resolve({ id: "ws_1", slug: "ws-one" }),
  ),
}));

vi.mock("./rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  ipFromHeaders: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@vk/billing", () => ({
  canConsume: vi.fn(() => Promise.resolve({ allowed: true })),
  consumeCredits: vi.fn(() => Promise.resolve({ allowed: true, debits: [] })),
  refundCredits: vi.fn(() => Promise.resolve({ balanceAfter: 0 })),
  creditsForIntensity: vi.fn(() => 1),
  DEFAULT_INTENSITY: "quick",
  ensureSubscription: vi.fn(() =>
    Promise.resolve({ tier: "free", byokEnabled: false }),
  ),
  isIntensity: vi.fn((s: string) => s === "quick" || s === "deep"),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({ kind: "eq" })),
  sum: vi.fn(() => ({ kind: "sum" })),
}));

// node:fs partial-mock for the local-path branch
vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => false),
  statSync: vi.fn(),
}));

// ---- helpers ---- --------------------------------------------------------

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- tests ---- ----------------------------------------------------------

describe("auditAction", () => {
  it("returns error when path is empty", async () => {
    const { auditAction } = await import("./audit-action");
    const res = await auditAction({ ok: false }, fd({ path: "" }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/paste a github/i);
  });

  it("returns error when rate-limit rejects", async () => {
    const { checkRateLimit } = await import("./rate-limit");
    vi.mocked(checkRateLimit).mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetSeconds: 60,
      limit: 30,
      reason: "Rate limited: 30/h.",
    });
    const { auditAction } = await import("./audit-action");
    const res = await auditAction(
      { ok: false },
      fd({ path: "github.com/user/repo" }),
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/rate limited/i);
  });

  it("returns error when signed-in user is out of credits", async () => {
    const { getSessionUser } = await import("./session");
    vi.mocked(getSessionUser).mockResolvedValueOnce({
      id: "user_1",
      email: "u@test",
      name: null,
    });
    const { canConsume } = await import("@vk/billing");
    vi.mocked(canConsume).mockResolvedValueOnce({
      allowed: false,
      reason: "Out of credits — upgrade or buy a pack.",
      balance: {
        subscriptionRemaining: 0,
        prepaidRemaining: 0,
        total: 0,
      } as never,
    });
    const { auditAction } = await import("./audit-action");
    const res = await auditAction(
      { ok: false },
      fd({ path: "github.com/user/repo" }),
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/out of credits/i);
  });

  it("rejects unparseable GitHub URL", async () => {
    const { parseGithubUrl } = await import("@vk/parser");
    vi.mocked(parseGithubUrl).mockReturnValueOnce(null);
    const { auditAction } = await import("./audit-action");
    const res = await auditAction(
      { ok: false },
      fd({ path: "github.com/not-a-repo" }),
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/couldn't parse/i);
  });

  it("returns error when local path does not exist", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    const { auditAction } = await import("./audit-action");
    const res = await auditAction(
      { ok: false },
      fd({ path: "/tmp/nope-this-does-not-exist" }),
    );
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not found/i);
  });

  it("returns error when local path is not a directory", async () => {
    const fs = await import("node:fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(true);
    vi.mocked(fs.statSync).mockReturnValueOnce({
      isDirectory: () => false,
    } as never);
    const { auditAction } = await import("./audit-action");
    const res = await auditAction({ ok: false }, fd({ path: "/etc/hosts" }));
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not a directory/i);
  });

  it("happy-path anonymous github audit: returns scan + report", async () => {
    const { parseGithubUrl, fetchRepoZipball } = await import("@vk/parser");
    vi.mocked(parseGithubUrl).mockReturnValueOnce({
      owner: "vercel",
      repo: "next.js",
      ref: null,
    } as never);
    vi.mocked(fetchRepoZipball).mockResolvedValueOnce("/tmp/extracted/repo");

    const { scanRepository } = await import("@vk/parser");
    vi.mocked(scanRepository).mockResolvedValueOnce({
      rootPath: "/tmp/extracted/repo",
      files: [],
      warnings: [],
    } as never);

    const { runAudit } = await import("@vk/audit");
    vi.mocked(runAudit).mockResolvedValueOnce({
      findings: [],
      summary: { overallSeverity: "Exceptional", warningsCount: 0 },
    } as never);

    const { auditAction } = await import("./audit-action");
    const res = await auditAction(
      { ok: false },
      fd({ path: "https://github.com/vercel/next.js" }),
    );
    expect(res.ok).toBe(true);
    expect(res.displayPath).toContain("github.com/vercel/next.js");
    expect(res.background).toBe(false);
    expect(res.report).toBeDefined();
  });

  it("github-audit cleans up extracted temp dir even on error", async () => {
    const { parseGithubUrl, fetchRepoZipball, cleanupTempDir } = await import(
      "@vk/parser"
    );
    vi.mocked(parseGithubUrl).mockReturnValueOnce({
      owner: "owner",
      repo: "repo",
      ref: null,
    } as never);
    vi.mocked(fetchRepoZipball).mockResolvedValueOnce("/tmp/extracted/err");

    const { scanRepository } = await import("@vk/parser");
    vi.mocked(scanRepository).mockRejectedValueOnce(
      new Error("simulated scan failure"),
    );

    const { auditAction } = await import("./audit-action");
    const res = await auditAction(
      { ok: false },
      fd({ path: "github.com/owner/repo" }),
    );

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/failed to audit/i);
    expect(cleanupTempDir).toHaveBeenCalledWith("/tmp/extracted/err");
  });

  it("J5: refunds reserved credits when the LLM audit fails after reservation", async () => {
    // DB-on, signed-in path: credits are reserved BEFORE runAudit. When runAudit
    // throws, the scan must be refunded (and the failed scan surfaced) so the
    // customer is never charged for an undelivered audit.
    const { getSessionUser } = await import("./session");
    vi.mocked(getSessionUser).mockResolvedValueOnce({
      id: "user_pay",
      email: "p@test",
      name: null,
    });

    const { isDbEnabled } = await import("@vk/db");
    vi.mocked(isDbEnabled).mockReturnValue(true);
    dbInsertReturning.mockResolvedValueOnce([{ id: "scan_pay" }]);

    const { consumeCredits, refundCredits } = await import("@vk/billing");
    vi.mocked(consumeCredits).mockResolvedValueOnce({
      allowed: true,
      newSubscriptionUsed: 1,
      newPrepaidRemaining: 0,
      debits: [{ prepaidGrantId: null, amount: 1 }],
    });

    const { parseGithubUrl, fetchRepoZipball } = await import("@vk/parser");
    vi.mocked(parseGithubUrl).mockReturnValueOnce({
      owner: "o",
      repo: "r",
      ref: null,
    } as never);
    vi.mocked(fetchRepoZipball).mockResolvedValueOnce("/tmp/pay");

    const { scanRepository } = await import("@vk/parser");
    vi.mocked(scanRepository).mockResolvedValueOnce({
      rootPath: "/tmp/pay",
      files: [{ relativePath: "a.ts", absolutePath: "/tmp/pay/a.ts" }],
      warnings: [],
    } as never);

    const { runAudit } = await import("@vk/audit");
    vi.mocked(runAudit).mockRejectedValueOnce(new Error("LLM provider 503"));

    const { auditAction } = await import("./audit-action");
    const res = await auditAction(
      { ok: false },
      fd({ path: "github.com/o/r" }),
    );

    expect(res.ok).toBe(false);
    expect(consumeCredits).toHaveBeenCalledTimes(1);
    expect(refundCredits).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws_1",
        referenceId: "scan_pay",
        debits: [{ prepaidGrantId: null, amount: 1 }],
      }),
    );
    // reservation happened before the (failing) LLM call
    expect(consumeCredits).toHaveBeenCalledBefore(vi.mocked(refundCredits));
    vi.mocked(isDbEnabled).mockReturnValue(false);
  });

  it("deep-intensity is downgraded to quick on free tier (signed-in)", async () => {
    const { getSessionUser } = await import("./session");
    vi.mocked(getSessionUser).mockResolvedValueOnce({
      id: "user_2",
      email: "f@test",
      name: null,
    });
    // Free tier user — actor should downgrade deep → quick. We verify by
    // observing the intensity passed to runAudit on the anonymous-DB path
    // (isDbEnabled === false so we bypass the credit consume).
    const { parseGithubUrl, fetchRepoZipball } = await import("@vk/parser");
    vi.mocked(parseGithubUrl).mockReturnValueOnce({
      owner: "o",
      repo: "r",
      ref: null,
    } as never);
    vi.mocked(fetchRepoZipball).mockResolvedValueOnce("/tmp/x");

    const { scanRepository } = await import("@vk/parser");
    vi.mocked(scanRepository).mockResolvedValueOnce({
      rootPath: "/tmp/x",
      files: [],
      warnings: [],
    } as never);

    const { runAudit } = await import("@vk/audit");
    vi.mocked(runAudit).mockResolvedValueOnce({
      findings: [],
      summary: { overallSeverity: "Exceptional", warningsCount: 0 },
    } as never);

    const { auditAction } = await import("./audit-action");
    await auditAction({ ok: false }, fd({ path: "github.com/o/r", intensity: "deep" }));

    // runAudit was called with intensity=quick (free-tier downgrade)
    expect(runAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ intensity: "quick" }),
    );
  });

  it("J1: signed-in github audit with Inngest routes to background (worker re-fetches)", async () => {
    const { getSessionUser } = await import("./session");
    vi.mocked(getSessionUser).mockResolvedValueOnce({
      id: "user_bg",
      email: "bg@test",
      name: null,
    });

    const { isDbEnabled } = await import("@vk/db");
    vi.mocked(isDbEnabled).mockReturnValue(true);

    const { isInngestEnabled, inngest } = await import("@vk/inngest");
    vi.mocked(isInngestEnabled).mockReturnValue(true);

    const { parseGithubUrl, fetchRepoZipball } = await import("@vk/parser");
    vi.mocked(parseGithubUrl).mockReturnValueOnce({
      owner: "vercel",
      repo: "next.js",
      ref: null,
    } as never);

    dbInsertReturning.mockResolvedValueOnce([{ id: "scan_bg" }]);

    const { auditAction } = await import("./audit-action");
    const res = await auditAction(
      { ok: false },
      fd({ path: "https://github.com/vercel/next.js" }),
    );

    expect(res.ok).toBe(true);
    expect(res.background).toBe(true);
    expect(res.savedScanId).toBe("scan_bg");
    // The worker re-fetches — no foreground zipball download.
    expect(fetchRepoZipball).not.toHaveBeenCalled();
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "audit/requested",
        data: expect.objectContaining({
          githubRef: expect.objectContaining({
            owner: "vercel",
            repo: "next.js",
          }),
          displayPath: expect.stringContaining("github.com/vercel/next.js"),
        }),
      }),
    );

    // Reset shared (non-Once) mocks so later tests keep their defaults.
    vi.mocked(isDbEnabled).mockReturnValue(false);
    vi.mocked(isInngestEnabled).mockReturnValue(false);
  });
});
