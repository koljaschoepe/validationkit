// Audit-trail export endpoint — workspace-scoped, signed-in only.

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/audit-trail-export", () => ({
  exportAuditTrail: vi.fn(),
  exportAuditTrailCsv: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/audit-trail", () => {
  it("returns 200 + JSON payload when export returns data", async () => {
    const { exportAuditTrail } = await import("@/lib/audit-trail-export");
    vi.mocked(exportAuditTrail).mockResolvedValueOnce({
      workspaceId: "ws1",
      exportedAt: new Date().toISOString(),
      events: [],
    } as never);
    const { GET } = await import("./route");
    const req = new Request("https://app.test/api/audit-trail");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 404 when export returns null (anonymous / no DB)", async () => {
    const { exportAuditTrail } = await import("@/lib/audit-trail-export");
    vi.mocked(exportAuditTrail).mockResolvedValueOnce(null);
    const { GET } = await import("./route");
    const req = new Request("https://app.test/api/audit-trail");
    const res = await GET(req as never);
    expect(res.status).toBe(404);
  });

  it("returns 200 + text/csv when format=csv", async () => {
    const { exportAuditTrailCsv } = await import("@/lib/audit-trail-export");
    vi.mocked(exportAuditTrailCsv).mockResolvedValueOnce("col1,col2\nval1,val2\n");
    const { GET } = await import("./route");
    const req = new Request("https://app.test/api/audit-trail?format=csv");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
  });

  it("returns 404 for csv format when null", async () => {
    const { exportAuditTrailCsv } = await import("@/lib/audit-trail-export");
    vi.mocked(exportAuditTrailCsv).mockResolvedValueOnce(null);
    const { GET } = await import("./route");
    const req = new Request("https://app.test/api/audit-trail?format=csv");
    const res = await GET(req as never);
    expect(res.status).toBe(404);
  });
});
