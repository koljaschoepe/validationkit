import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { authenticateApiKey } from "@/lib/api-auth";

// Programmatic read API (API-keys feature). Node runtime for the SHA-256 hash
// + DB driver; never cached (per-key, per-request).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNAUTHORIZED = NextResponse.json(
  { error: "Invalid or missing API key." },
  { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
);

/** GET /api/v1/scans — the authenticated workspace's recent scans. */
export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateApiKey(req);
  if (!auth) return UNAUTHORIZED;

  const db = getDb();
  const rows = await db
    .select({
      id: schema.scan.id,
      rootPath: schema.scan.rootPath,
      status: schema.scan.status,
      overallSeverity: schema.scan.overallSeverity,
      findingsCount: schema.scan.findingsCount,
      fileCount: schema.scan.fileCount,
      intensity: schema.scan.intensity,
      createdAt: schema.scan.createdAt,
      completedAt: schema.scan.completedAt,
    })
    .from(schema.scan)
    .where(eq(schema.scan.workspaceId, auth.workspaceId))
    .orderBy(desc(schema.scan.createdAt))
    .limit(100);

  return NextResponse.json({
    scans: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    })),
  });
}
