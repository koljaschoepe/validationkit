import { NextResponse, type NextRequest } from "next/server";
import { getAuth, isAuthEnabled } from "@vk/auth";

async function handle(req: NextRequest): Promise<Response> {
  if (!isAuthEnabled()) {
    return NextResponse.json(
      { error: "Auth is disabled — set DATABASE_URL + AUTH_SECRET" },
      { status: 503 },
    );
  }
  const auth = getAuth();
  return auth.handler(req);
}

export const GET = handle;
export const POST = handle;
