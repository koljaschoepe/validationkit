import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import {
  parseWebhookEvent,
  verifyWebhookSignature,
  type ParsedWebhook,
} from "@vk/github-app";
import { getDb, isDbEnabled, schema } from "@vk/db";

/**
 * GitHub App install + repository-add/-remove webhook receiver.
 *
 * Three guard layers:
 *  1. `GITHUB_APP_WEBHOOK_SECRET` unset → return 503 (Sprint 0.6+).
 *  2. Signature missing or invalid → 401.
 *  3. DATABASE_URL unset → return 503 (cannot persist install state).
 *
 * Sprint-0.7 will add idempotency keys via `x-github-delivery` and a
 * webhook_event audit-trail table.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const secret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error:
          "GitHub App webhook not yet configured. See docs/setup/github-app.md.",
      },
      { status: 503 },
    );
  }

  const eventName = req.headers.get("x-github-event") ?? "unknown";
  const signature = req.headers.get("x-hub-signature-256");
  const rawBody = await req.text();

  const valid = verifyWebhookSignature({
    rawBody,
    signature256: signature,
    secret,
  });
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 },
    );
  }

  if (!isDbEnabled()) {
    return NextResponse.json(
      { error: "DB not configured; cannot persist install state." },
      { status: 503 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const deliveryId = req.headers.get("x-github-delivery") ?? "";
  if (!deliveryId) {
    return NextResponse.json(
      { error: "Missing x-github-delivery header" },
      { status: 400 },
    );
  }

  // Idempotency: drop a row keyed by delivery_id. If the row already exists
  // we treat the event as a replay and skip business logic. Replay is the
  // common case when GitHub redelivers after a 5xx or timeout.
  const db = getDb();
  const existing = await db
    .select({ id: schema.webhookEvent.deliveryId })
    .from(schema.webhookEvent)
    .where(eq(schema.webhookEvent.deliveryId, deliveryId))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { ok: true, replay: true, deliveryId },
      { status: 200 },
    );
  }

  const action =
    typeof payload.action === "string" ? payload.action : null;

  await db.insert(schema.webhookEvent).values({
    deliveryId,
    eventName,
    action,
    payload,
    status: "processing",
  });

  const parsed = parseWebhookEvent(eventName, payload);
  try {
    await handleParsed(parsed);
    await db
      .update(schema.webhookEvent)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(schema.webhookEvent.deliveryId, deliveryId));
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await db
      .update(schema.webhookEvent)
      .set({
        status: "failed",
        failureReason: reason,
        processedAt: new Date(),
      })
      .where(eq(schema.webhookEvent.deliveryId, deliveryId));
    throw err;
  }

  return NextResponse.json(
    { ok: true, kind: parsed.kind, deliveryId },
    { status: 200 },
  );
}

async function handleParsed(parsed: ParsedWebhook): Promise<void> {
  const db = getDb();

  if (parsed.kind === "installation") {
    const { action, installationId, repositories } = parsed.event;

    if (action === "created") {
      const fullNames = repositories.map((r) => r.fullName);
      if (fullNames.length === 0) return;

      const matching = await db
        .select()
        .from(schema.installRequest)
        .where(
          and(
            eq(schema.installRequest.status, "pending"),
            inArray(schema.installRequest.targetRepoLabel, fullNames),
          ),
        );

      for (const row of matching) {
        await db
          .update(schema.installRequest)
          .set({
            status: "approved",
            decidedAt: new Date(),
            decisionNote: `auto-approved on GitHub App installation ${installationId}`,
          })
          .where(eq(schema.installRequest.id, row.id));

        await db
          .insert(schema.repo)
          .values({
            workspaceId: row.workspaceId,
            label: row.targetRepoLabel,
            rootPath: row.targetRootPath,
            writeAccessGranted: row.requestedScope === "write",
            githubInstallationId: installationId,
            githubFullName: row.targetRepoLabel,
          })
          .onConflictDoNothing();
      }
      return;
    }

    if (action === "deleted") {
      await db
        .update(schema.repo)
        .set({ writeAccessGranted: false, githubInstallationId: null })
        .where(eq(schema.repo.githubInstallationId, installationId));
      return;
    }
    return;
  }

  if (parsed.kind === "installation_repositories") {
    const { action, installationId, added, removed } = parsed.event;
    if (action === "added") {
      const workspaceId = await pickWorkspaceForInstallation(installationId);
      for (const r of added) {
        await db
          .insert(schema.repo)
          .values({
            workspaceId,
            label: r.fullName,
            rootPath: `github://${r.fullName}`,
            githubInstallationId: installationId,
            githubFullName: r.fullName,
          })
          .onConflictDoNothing();
      }
      return;
    }
    if (action === "removed") {
      for (const r of removed) {
        await db
          .update(schema.repo)
          .set({ writeAccessGranted: false, githubInstallationId: null })
          .where(eq(schema.repo.githubFullName, r.fullName));
      }
      return;
    }
    return;
  }
  // ignored events: no-op.
}

async function pickWorkspaceForInstallation(
  installationId: number,
): Promise<string> {
  const db = getDb();
  const existing = await db
    .select({ workspaceId: schema.repo.workspaceId })
    .from(schema.repo)
    .where(eq(schema.repo.githubInstallationId, installationId))
    .limit(1);
  const found = existing[0];
  if (!found) {
    throw new Error(
      `No workspace tied to installation ${installationId}. ` +
        "Install event must arrive before installation_repositories.added.",
    );
  }
  return found.workspaceId;
}

export async function GET(): Promise<Response> {
  return NextResponse.json(
    {
      ok: true,
      hint:
        "POST GitHub webhook payloads here. Set GITHUB_APP_WEBHOOK_SECRET to activate; otherwise the endpoint returns 503.",
    },
    { status: 200 },
  );
}
