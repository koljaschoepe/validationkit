import { NextResponse } from "next/server";
import { SUB_PROCESSORS } from "@/lib/sub-processors";

export const runtime = "nodejs";
export const dynamic = "force-static";

export function GET(): Response {
  return NextResponse.json(
    {
      version: 1,
      issuer: "ValidationKit",
      generatedAt: new Date().toISOString(),
      noticePolicy: "30-day prior notice for additions/replacements (DPA §5).",
      subProcessors: SUB_PROCESSORS,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    },
  );
}
