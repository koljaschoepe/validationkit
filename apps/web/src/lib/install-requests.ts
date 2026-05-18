"use server";

import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@vk/db";
import { getSessionUser } from "./session";
import { ensureDefaultWorkspace } from "./workspaces";
import { getUserRole } from "./membership";

export interface RequestInstallInput {
  targetRepoLabel: string;
  targetRootPath: string;
  requestedScope: "read" | "write";
}

export interface InstallRequestRow {
  id: string;
  status: string;
  requestedScope: string;
  targetRepoLabel: string;
  targetRootPath: string;
  requestedAt: Date;
  decidedAt: Date | null;
  decisionNote: string | null;
  requesterId: string;
  approverId: string | null;
}

export async function requestInstall(
  input: RequestInstallInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  if (input.requestedScope !== "read" && input.requestedScope !== "write") {
    return { ok: false, error: "requestedScope must be 'read' or 'write'." };
  }

  const db = getDb();
  const workspaceId = await ensureDefaultWorkspace(user.id);

  const inserted = await db
    .insert(schema.installRequest)
    .values({
      workspaceId,
      requesterId: user.id,
      targetRepoLabel: input.targetRepoLabel,
      targetRootPath: input.targetRootPath,
      requestedScope: input.requestedScope,
      status: "pending",
    })
    .returning({ id: schema.installRequest.id });

  revalidatePath("/requests");
  const row = inserted[0];
  if (!row) return { ok: false, error: "Failed to record request." };
  return { ok: true, id: row.id };
}

/**
 * Sprint 1.2: decideInstall is now RBAC-gated via membership (owner | admin)
 * and writes an append-only audit row to install_decision with IP + UA.
 *
 * Backwards-compat: workspace.ownerId is still recognised as `owner` even if
 * the membership backfill hasn't run for some reason — defensive.
 */
export async function decideInstall(
  requestId: string,
  decision: "approved" | "rejected",
  note: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const db = getDb();
  const existing = await db
    .select()
    .from(schema.installRequest)
    .innerJoin(
      schema.workspace,
      eq(schema.installRequest.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.installRequest.id, requestId))
    .limit(1);
  const row = existing[0];
  if (!row) return { ok: false, error: "Request not found." };

  const role = await getUserRole(row.workspace.id, user.id);
  const isLegacyOwner = row.workspace.ownerId === user.id;
  if (!isLegacyOwner && role !== "owner" && role !== "admin") {
    return {
      ok: false,
      error: "Only workspace owner or admin can decide install-requests.",
    };
  }
  if (row.install_request.status !== "pending") {
    return { ok: false, error: "Request already decided." };
  }

  const hdrs = await headers();
  const ipAddress =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;
  const userAgent = hdrs.get("user-agent") ?? null;

  await db
    .update(schema.installRequest)
    .set({
      status: decision,
      approverId: user.id,
      decidedAt: new Date(),
      decisionNote: note,
    })
    .where(eq(schema.installRequest.id, requestId));

  await db.insert(schema.installDecision).values({
    installRequestId: requestId,
    deciderId: user.id,
    decision: decision === "approved" ? "approve" : "reject",
    reason: note,
    ipAddress,
    userAgent,
  });

  if (
    decision === "approved" &&
    row.install_request.requestedScope === "write"
  ) {
    const repoMatch = await db
      .select({ id: schema.repo.id })
      .from(schema.repo)
      .where(
        and(
          eq(schema.repo.workspaceId, row.workspace.id),
          eq(schema.repo.rootPath, row.install_request.targetRootPath),
        ),
      )
      .limit(1);

    if (repoMatch[0]) {
      await db
        .update(schema.repo)
        .set({
          writeAccessGranted: true,
          writeApprovedBy: user.id,
          writeApprovedAt: new Date(),
        })
        .where(eq(schema.repo.id, repoMatch[0].id));
    } else {
      await db.insert(schema.repo).values({
        workspaceId: row.workspace.id,
        label: row.install_request.targetRepoLabel,
        rootPath: row.install_request.targetRootPath,
        writeAccessGranted: true,
        writeApprovedBy: user.id,
        writeApprovedAt: new Date(),
      });
    }
  }

  revalidatePath("/requests");
  revalidatePath(`/customers/${row.workspace.id}/access`);
  return { ok: true };
}

export async function listRequestsForOwner(
  userId: string,
): Promise<InstallRequestRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.installRequest.id,
      status: schema.installRequest.status,
      requestedScope: schema.installRequest.requestedScope,
      targetRepoLabel: schema.installRequest.targetRepoLabel,
      targetRootPath: schema.installRequest.targetRootPath,
      requestedAt: schema.installRequest.requestedAt,
      decidedAt: schema.installRequest.decidedAt,
      decisionNote: schema.installRequest.decisionNote,
      requesterId: schema.installRequest.requesterId,
      approverId: schema.installRequest.approverId,
    })
    .from(schema.installRequest)
    .innerJoin(
      schema.workspace,
      eq(schema.installRequest.workspaceId, schema.workspace.id),
    )
    .where(eq(schema.workspace.ownerId, userId))
    .orderBy(desc(schema.installRequest.requestedAt))
    .limit(100);
  return rows;
}

export interface PendingRequestForWorkspace extends InstallRequestRow {
  requesterEmail: string | null;
}

export async function listPendingRequestsForWorkspace(
  workspaceId: string,
): Promise<PendingRequestForWorkspace[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.installRequest.id,
      status: schema.installRequest.status,
      requestedScope: schema.installRequest.requestedScope,
      targetRepoLabel: schema.installRequest.targetRepoLabel,
      targetRootPath: schema.installRequest.targetRootPath,
      requestedAt: schema.installRequest.requestedAt,
      decidedAt: schema.installRequest.decidedAt,
      decisionNote: schema.installRequest.decisionNote,
      requesterId: schema.installRequest.requesterId,
      approverId: schema.installRequest.approverId,
      requesterEmail: schema.user.email,
    })
    .from(schema.installRequest)
    .leftJoin(
      schema.user,
      eq(schema.installRequest.requesterId, schema.user.id),
    )
    .where(eq(schema.installRequest.workspaceId, workspaceId))
    .orderBy(desc(schema.installRequest.requestedAt))
    .limit(50);
  return rows;
}

export interface InstallDecisionRow {
  id: string;
  installRequestId: string;
  decision: string;
  reason: string | null;
  decidedAt: Date;
  deciderEmail: string | null;
}

export async function listDecisionsForWorkspace(
  workspaceId: string,
): Promise<InstallDecisionRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.installDecision.id,
      installRequestId: schema.installDecision.installRequestId,
      decision: schema.installDecision.decision,
      reason: schema.installDecision.reason,
      decidedAt: schema.installDecision.decidedAt,
      deciderEmail: schema.user.email,
    })
    .from(schema.installDecision)
    .innerJoin(
      schema.installRequest,
      eq(schema.installDecision.installRequestId, schema.installRequest.id),
    )
    .leftJoin(
      schema.user,
      eq(schema.installDecision.deciderId, schema.user.id),
    )
    .where(eq(schema.installRequest.workspaceId, workspaceId))
    .orderBy(desc(schema.installDecision.decidedAt))
    .limit(50);
  return rows;
}
