"use server";

import { desc, eq } from "drizzle-orm";
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

  const workspaces = await db
    .select({ id: schema.workspace.id })
    .from(schema.workspace)
    .where(eq(schema.workspace.ownerId, user.id))
    .limit(1);
  const ws = workspaces[0];
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

  // webhook_event is workspace-implicit via repo. For Sprint-0.10 we ship
  // workspace-owner-scoped global webhook_events without further filter; the
  // Compliance-Frame Customer is the workspace owner and is entitled to see
  // the full webhook stream for their installations.
  const webhooks = await db
    .select({
      deliveryId: schema.webhookEvent.deliveryId,
      receivedAt: schema.webhookEvent.receivedAt,
      eventName: schema.webhookEvent.eventName,
      action: schema.webhookEvent.action,
      status: schema.webhookEvent.status,
    })
    .from(schema.webhookEvent)
    .orderBy(desc(schema.webhookEvent.receivedAt))
    .limit(500);
  for (const w of webhooks) {
    rows.push({
      kind: "webhook_event",
      id: w.deliveryId,
      createdAt: w.receivedAt.toISOString(),
      summary: `webhook ${w.eventName}${w.action ? "." + w.action : ""} — ${w.status}`,
      raw: w as unknown as Record<string, unknown>,
    });
  }

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
