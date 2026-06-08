"use server";

import { and, desc, eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { getSessionUser } from "./session";

export interface AuditTrailRow {
  kind: "scan" | "install_request" | "webhook_event" | "repo";
  id: string;
  createdAt: string;
  summary: string;
  actorEmail?: string;
  raw: Record<string, unknown>;
}

export interface AuditTrailExport {
  workspaceId: string;
  exportedAt: string;
  exporterEmail: string;
  retentionWindow: string;
  rows: AuditTrailRow[];
}

const RETENTION_WINDOW = "12 months";

/**
 * Workspace-scoped audit-trail export. Surfaces every Customer-facing
 * compliance-relevant row across scan / install_request / webhook_event /
 * repo. Compliance-Frame Customers per Playbook ch 3 ask for this directly
 * (Q4: "How do we revoke + audit-trail export?").
 *
 * Returns null when DB or auth isn't configured.
 */
export async function exportAuditTrail(): Promise<AuditTrailExport | null> {
  if (!isDbEnabled()) return null;
  const user = await getSessionUser();
  if (!user) return null;

  const db = getDb();

  // K4: resolve the export workspace via active membership (member / admin /
  // owner), falling back to the legacy ownerId pointer. The previous
  // ownerId-only gate locked non-owner members out (empty export) and diverged
  // from the canonical authz model. Single-workspace today (trust-page surface).
  const membershipRows = await db
    .select({ id: schema.workspace.id })
    .from(schema.membership)
    .innerJoin(
      schema.workspace,
      eq(schema.membership.workspaceId, schema.workspace.id),
    )
    .where(
      and(
        eq(schema.membership.userId, user.id),
        eq(schema.membership.status, "active"),
      ),
    )
    .limit(1);
  let ws = membershipRows[0];
  if (!ws) {
    const ownerRows = await db
      .select({ id: schema.workspace.id })
      .from(schema.workspace)
      .where(eq(schema.workspace.ownerId, user.id))
      .limit(1);
    ws = ownerRows[0];
  }
  if (!ws) {
    return {
      workspaceId: "none",
      exportedAt: new Date().toISOString(),
      exporterEmail: user.email,
      retentionWindow: RETENTION_WINDOW,
      rows: [],
    };
  }

  const rows: AuditTrailRow[] = [];

  const scans = await db
    .select({
      id: schema.scan.id,
      createdAt: schema.scan.createdAt,
      rootPath: schema.scan.rootPath,
      status: schema.scan.status,
      severity: schema.scan.overallSeverity,
      findingsCount: schema.scan.findingsCount,
    })
    .from(schema.scan)
    .where(eq(schema.scan.workspaceId, ws.id))
    .orderBy(desc(schema.scan.createdAt));
  for (const s of scans) {
    rows.push({
      kind: "scan",
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      summary: `audit on ${s.rootPath} — ${s.status} — ${s.severity} — ${s.findingsCount} findings`,
      raw: s as unknown as Record<string, unknown>,
    });
  }

  const installs = await db
    .select({
      id: schema.installRequest.id,
      requestedAt: schema.installRequest.requestedAt,
      targetRepoLabel: schema.installRequest.targetRepoLabel,
      requestedScope: schema.installRequest.requestedScope,
      status: schema.installRequest.status,
      decidedAt: schema.installRequest.decidedAt,
    })
    .from(schema.installRequest)
    .where(eq(schema.installRequest.workspaceId, ws.id))
    .orderBy(desc(schema.installRequest.requestedAt));
  for (const ir of installs) {
    rows.push({
      kind: "install_request",
      id: ir.id,
      createdAt: ir.requestedAt.toISOString(),
      summary: `install_request ${ir.targetRepoLabel} scope=${ir.requestedScope} status=${ir.status}`,
      raw: ir as unknown as Record<string, unknown>,
    });
  }

  const repos = await db
    .select({
      id: schema.repo.id,
      createdAt: schema.repo.createdAt,
      label: schema.repo.label,
      rootPath: schema.repo.rootPath,
      writeAccessGranted: schema.repo.writeAccessGranted,
      githubFullName: schema.repo.githubFullName,
    })
    .from(schema.repo)
    .where(eq(schema.repo.workspaceId, ws.id))
    .orderBy(desc(schema.repo.createdAt));
  for (const r of repos) {
    rows.push({
      kind: "repo",
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      summary: `repo ${r.label} (${r.rootPath}) write=${r.writeAccessGranted}`,
      raw: r as unknown as Record<string, unknown>,
    });
  }

  // K3: webhook_event is a GLOBAL GitHub-delivery log — the table has no
  // workspaceId/repoId FK, so it cannot be workspace-scoped at the DB level.
  // The previous "owner sees the full stream" query leaked every tenant's
  // webhook metadata cross-workspace. Dropped from the per-workspace export
  // entirely; a properly-linked webhook surface is post-launch (Out-of-Scope).

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    workspaceId: ws.id,
    exportedAt: new Date().toISOString(),
    exporterEmail: user.email,
    retentionWindow: RETENTION_WINDOW,
    rows,
  };
}

export async function exportAuditTrailCsv(): Promise<string | null> {
  const data = await exportAuditTrail();
  if (!data) return null;
  const lines: string[] = [];
  lines.push("kind,id,created_at,summary,actor_email");
  for (const r of data.rows) {
    lines.push(
      [
        escapeCsv(r.kind),
        escapeCsv(r.id),
        escapeCsv(r.createdAt),
        escapeCsv(r.summary),
        escapeCsv(r.actorEmail ?? ""),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function escapeCsv(s: string): string {
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
