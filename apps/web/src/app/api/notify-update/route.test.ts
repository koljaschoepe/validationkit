// Unit tests for the notify-update webhook route.
// Pattern matches webhook/route.test.ts: mock the DB + Inngest layer, run
// the handler with a signed body, assert on status + side-effect mocks.

import { describe, expect, it, vi, beforeEach } from "vitest";
import crypto from "node:crypto";

const dbSelectLimit = vi.fn();
const dbInsertReturning = vi.fn();
const dbUpdateWhere = vi.fn();

vi.mock("@vk/db", () => ({
  isDbEnabled: vi.fn(() => true),
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: dbSelectLimit,
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      returning: dbInsertReturning,
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: dbUpdateWhere,
    })),
  })),
  schema: {
    repo: {
      id: "repo.id",
      workspaceId: "repo.workspaceId",
      rootPath: "repo.rootPath",
      notifySecret: "repo.notifySecret",
      lastCommitSha: "repo.lastCommitSha",
      lastPolledAt: "repo.lastPolledAt",
    },
    scan: { id: "scan.id" },
  },
}));

vi.mock("@vk/inngest", () => ({
  inngest: { send: vi.fn(() => Promise.resolve()) },
  isInngestEnabled: vi.fn(() => true),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(() => ({ kind: "eq" })),
}));

const NOTIFY_SECRET = "test-repo-secret-32-bytes-long-abc";

function signedRequest(body: Record<string, unknown>, secret = NOTIFY_SECRET): Request {
  const rawBody = JSON.stringify(body);
  const sig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return new Request("https://app.test/api/notify-update", {
    method: "POST",
    headers: { "x-signature": `sha256=${sig}`, "content-type": "application/json" },
    body: rawBody,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  dbInsertReturning.mockResolvedValue([{ id: "scan_1" }]);
});

describe("POST /api/notify-update", () => {
  it("503 when DB or Inngest disabled", async () => {
    const { isDbEnabled } = await import("@vk/db");
    vi.mocked(isDbEnabled).mockReturnValueOnce(false);
    const { POST } = await import("./route");
    const res = await POST(signedRequest({ repoId: "r1" }));
    expect(res.status).toBe(503);
  });

  it("401 when X-Signature header is missing", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://app.test/api/notify-update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repoId: "r1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("401 when X-Signature does not start with sha256=", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://app.test/api/notify-update", {
      method: "POST",
      headers: { "x-signature": "garbage", "content-type": "application/json" },
      body: JSON.stringify({ repoId: "r1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("400 when body is not valid JSON", async () => {
    const sig = crypto.createHmac("sha256", "x").update("not-json").digest("hex");
    const { POST } = await import("./route");
    const req = new Request("https://app.test/api/notify-update", {
      method: "POST",
      headers: { "x-signature": `sha256=${sig}` },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 when body is missing repoId", async () => {
    const { POST } = await import("./route");
    const res = await POST(signedRequest({ sha: "abc" }));
    expect(res.status).toBe(400);
  });

  it("404 when repo is unknown OR has no notifySecret", async () => {
    dbSelectLimit.mockResolvedValueOnce([]);
    const { POST } = await import("./route");
    const res = await POST(signedRequest({ repoId: "r_unknown" }));
    expect(res.status).toBe(404);
  });

  it("401 when HMAC signature does not match repo.notifySecret", async () => {
    dbSelectLimit.mockResolvedValueOnce([
      {
        id: "r1",
        workspaceId: "ws1",
        rootPath: "/repo",
        notifySecret: "different-secret",
        lastCommitSha: null,
      },
    ]);
    const { POST } = await import("./route");
    const res = await POST(signedRequest({ repoId: "r1" })); // signed with NOTIFY_SECRET, not "different-secret"
    expect(res.status).toBe(401);
  });

  it("200 skipped:true when SHA matches lastCommitSha", async () => {
    dbSelectLimit.mockResolvedValueOnce([
      {
        id: "r1",
        workspaceId: "ws1",
        rootPath: "/repo",
        notifySecret: NOTIFY_SECRET,
        lastCommitSha: "abc123",
      },
    ]);
    const { POST } = await import("./route");
    const res = await POST(signedRequest({ repoId: "r1", sha: "abc123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, skipped: true, reason: "sha-unchanged" });
  });

  it("200 + scanId + inngest.send when new commit triggers a scan", async () => {
    dbSelectLimit.mockResolvedValueOnce([
      {
        id: "r1",
        workspaceId: "ws1",
        rootPath: "/repo",
        notifySecret: NOTIFY_SECRET,
        lastCommitSha: "old_sha",
      },
    ]);
    dbInsertReturning.mockResolvedValueOnce([{ id: "scan_new" }]);
    const { POST } = await import("./route");
    const { inngest } = await import("@vk/inngest");
    const res = await POST(signedRequest({ repoId: "r1", sha: "new_sha" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, scanId: "scan_new" });
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({ name: "audit/requested" }),
    );
  });
});
