import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { inngest, isInngestEnabled } from "@vk/inngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inFlight = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function rateLimited(repoId: string): boolean {
  const now = Date.now();
  const arr = (inFlight.get(repoId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (arr.length >= RATE_LIMIT_MAX) return true;
  arr.push(now);
  inFlight.set(repoId, arr);
  return false;
}

interface NotifyBody {
  repoId?: string;
  sha?: string;
}

export async function POST(req: Request): Promise<Response> {
  if (!isDbEnabled() || !isInngestEnabled()) {
    return NextResponse.json(
      { error: "Background tracking is not enabled on this deployment." },
      { status: 503 },
    );
  }

  const rawSignature = req.headers.get("x-signature") ?? "";
  if (!rawSignature.startsWith("sha256=")) {
    return NextResponse.json(
      { error: "Missing X-Signature header (expected `sha256=<hex>`)." },
      { status: 401 },
    );
  }
  const signatureHex = rawSignature.slice("sha256=".length);

  const rawBody = await req.text();
  let body: NotifyBody;
  try {
    body = JSON.parse(rawBody) as NotifyBody;
  } catch {
    return NextResponse.json(
      { error: "Body must be JSON." },
      { status: 400 },
    );
  }
  if (!body.repoId) {
    return NextResponse.json(
      { error: "Body requires a `repoId`." },
      { status: 400 },
    );
  }

  const db = getDb();
  const rows = await db
    .select({
      id: schema.repo.id,
      workspaceId: schema.repo.workspaceId,
      rootPath: schema.repo.rootPath,
      notifySecret: schema.repo.notifySecret,
      lastCommitSha: schema.repo.lastCommitSha,
    })
    .from(schema.repo)
    .where(eq(schema.repo.id, body.repoId))
    .limit(1);
  const repo = rows[0];
  if (!repo || !repo.notifySecret) {
    return NextResponse.json(
      { error: "Unknown repo or notify-update not enabled for this repo." },
      { status: 404 },
    );
  }

  const expected = crypto
    .createHmac("sha256", repo.notifySecret)
    .update(rawBody)
    .digest("hex");
  if (!timingSafeEqualHex(expected, signatureHex)) {
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 401 },
    );
  }

  if (rateLimited(repo.id)) {
    return NextResponse.json(
      { error: "Rate-limited: max 10 requests per minute per repo." },
      { status: 429 },
    );
  }

  if (body.sha && body.sha === repo.lastCommitSha) {
    return NextResponse.json({ ok: true, skipped: true, reason: "sha-unchanged" });
  }

  const inserted = await db
    .insert(schema.scan)
    .values({
      workspaceId: repo.workspaceId,
      repoId: repo.id,
      rootPath: repo.rootPath,
      status: "queued",
      fileCount: 0,
      overallSeverity: "Exceptional",
      findingsCount: 0,
      warningsCount: 0,
    })
    .returning({ id: schema.scan.id });
  const scan = inserted[0];
  if (!scan) {
    console.error("[notify-update] insert returned no row", { repoId: repo.id });
    return NextResponse.json(
      { error: "Failed to enqueue scan." },
      { status: 500 },
    );
  }

  if (body.sha) {
    await db
      .update(schema.repo)
      .set({ lastCommitSha: body.sha, lastPolledAt: new Date() })
      .where(eq(schema.repo.id, repo.id));
  }

  await inngest.send({
    name: "audit/requested",
    data: { scanId: scan.id, rootPath: repo.rootPath },
  });

  return NextResponse.json({ ok: true, scanId: scan.id });
}
