import { NextResponse, type NextRequest } from "next/server";
import {
  exportAuditTrail,
  exportAuditTrailCsv,
} from "@/lib/audit-trail-export";

/**
 * Compliance-Frame audit-trail export. Workspace-scoped, signed-in only.
 *
 * Query params:
 *   format=json  → application/json (default)
 *   format=csv   → text/csv (compliance-friendly)
 *
 * Returns 404 when auth/DB is unavailable so anonymous mode doesn't expose
 * empty payloads as a side-channel.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";

  if (format === "csv") {
    const csv = await exportAuditTrailCsv();
    if (csv === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="validationkit-audit-trail-${todayIso()}.csv"`,
        "cache-control": "no-store",
      },
    });
  }

  const data = await exportAuditTrail();
  if (data === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data, {
    status: 200,
    headers: {
      "content-disposition": `attachment; filename="validationkit-audit-trail-${todayIso()}.json"`,
      "cache-control": "no-store",
    },
  });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
