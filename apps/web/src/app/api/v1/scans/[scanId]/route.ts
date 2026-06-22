import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { authenticateApiKey } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNAUTHORIZED = NextResponse.json(
  { error: "Invalid or missing API key." },
  { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
);

/** GET /api/v1/scans/:scanId — one scan + its findings (workspace-scoped). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ scanId: string }> },
): Promise<Response> {
  const auth = await authenticateApiKey(req);
  if (!auth) return UNAUTHORIZED;

  const { scanId } = await params;
  const db = getDb();

  // IDOR guard: the scan must belong to the key's workspace.
  const scanRows = await db
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
    .where(
      and(
        eq(schema.scan.id, scanId),
        eq(schema.scan.workspaceId, auth.workspaceId),
      ),
    )
    .limit(1);
  const scan = scanRows[0];
  if (!scan) {
    return NextResponse.json({ error: "Scan not found." }, { status: 404 });
  }

  const findings = await db
    .select({
      id: schema.finding.id,
      category: schema.finding.category,
      severity: schema.finding.severity,
      title: schema.finding.title,
      detail: schema.finding.detail,
      deterministic: schema.finding.deterministic,
      confidence: schema.finding.confidence,
      filePath: schema.finding.filePath,
      citations: schema.finding.citations,
    })
    .from(schema.finding)
    .where(eq(schema.finding.scanId, scanId));

  return NextResponse.json({
    scan: {
      ...scan,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.completedAt ? scan.completedAt.toISOString() : null,
    },
    findings,
  });
}
