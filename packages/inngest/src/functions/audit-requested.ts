import { eq } from "drizzle-orm";
import { scanRepository } from "@vk/parser";
import { runAudit } from "@vk/audit";
import { getDb, schema } from "@vk/db";
import type { AuditFinding } from "@vk/core";
import { inngest } from "../client.js";
import { publishEvent } from "../events.js";

export interface AuditRequestedPayload {
  scanId: string;
  rootPath: string;
}

/**
 * Background audit: run a scan + audit and persist the result onto an existing
 * `scan` row. The row is created up-front in `queued` status by the server
 * action; Inngest moves it through `running` → `complete | failed`.
 *
 * Return type is intentionally `any` because Inngest's generated type
 * references internal `inngest/api/api.js` paths that aren't portable across
 * project boundaries (TS2742). The runtime contract is what matters.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auditRequested: any = inngest.createFunction(
  { id: "audit-requested", triggers: [{ event: "audit/requested" }] },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { scanId, rootPath } = event.data as AuditRequestedPayload;
    const db = getDb();

    await step.run("mark-running", async () => {
      await db
        .update(schema.scan)
        .set({ status: "running", startedAt: new Date() })
        .where(eq(schema.scan.id, scanId));
    });

    try {
      const scan = await step.run("scan", () => scanRepository(rootPath));
      const report = await step.run("audit", () => runAudit(scan));

      await step.run("persist", async () => {
        await db
          .update(schema.scan)
          .set({
            status: "complete",
            completedAt: new Date(),
            fileCount: report.fileCount,
            findingsCount: report.findings.length,
            warningsCount: scan.warnings.length,
            overallSeverity: report.summary.overallSeverity,
            rawScan: scan as unknown as Record<string, unknown>,
            rawReport: report as unknown as Record<string, unknown>,
          })
          .where(eq(schema.scan.id, scanId));

        if (report.findings.length > 0) {
          await db.insert(schema.finding).values(
            report.findings.map((f: AuditFinding) => {
              const base = {
                scanId,
                category: f.category,
                severity: f.severity,
                title: f.title,
                detail: f.detail,
                deterministic: f.deterministic,
                citations: f.citations as unknown as Record<string, unknown>[],
              };
              return f.confidence
                ? { ...base, confidence: f.confidence }
                : base;
            }),
          );
        }
      });

      await step.run("publish-event", async () => {
        const rows = await db
          .select({
            workspaceId: schema.scan.workspaceId,
            repoId: schema.scan.repoId,
            severity: schema.scan.overallSeverity,
            findingsCount: schema.scan.findingsCount,
            rootPath: schema.scan.rootPath,
          })
          .from(schema.scan)
          .where(eq(schema.scan.id, scanId))
          .limit(1);
        const row = rows[0];
        if (!row) return;
        await publishEvent({
          workspaceId: row.workspaceId,
          type: "audit.completed",
          payload: {
            scanId,
            repoId: row.repoId,
            severity: row.severity,
            findingsCount: row.findingsCount,
            rootPath: row.rootPath,
          },
        });
      });

      // Auto-drift: if the scanned repo declares a canonical, enqueue a drift run.
      await step.run("auto-drift", async () => {
        const rows = await db
          .select({
            repoId: schema.scan.repoId,
            workspaceId: schema.scan.workspaceId,
            rootPathA: schema.scan.rootPath,
          })
          .from(schema.scan)
          .where(eq(schema.scan.id, scanId))
          .limit(1);
        const row = rows[0];
        if (!row || !row.repoId) return;

        const repoRows = await db
          .select({
            canonicalRepoId: schema.repo.canonicalRepoId,
          })
          .from(schema.repo)
          .where(eq(schema.repo.id, row.repoId))
          .limit(1);
        const canonical = repoRows[0]?.canonicalRepoId;
        if (!canonical) return;

        const canonicalRows = await db
          .select({ rootPath: schema.repo.rootPath })
          .from(schema.repo)
          .where(eq(schema.repo.id, canonical))
          .limit(1);
        const canonicalPath = canonicalRows[0]?.rootPath;
        if (!canonicalPath) return;

        await inngest.send({
          name: "drift/requested",
          data: {
            workspaceId: row.workspaceId,
            rootPathA: row.rootPathA,
            rootPathB: canonicalPath,
          },
        });
      });

      return { ok: true, findings: report.findings.length };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      await step.run("mark-failed", async () => {
        await db
          .update(schema.scan)
          .set({
            status: "failed",
            failureReason: reason,
            completedAt: new Date(),
          })
          .where(eq(schema.scan.id, scanId));
        const rows = await db
          .select({ workspaceId: schema.scan.workspaceId })
          .from(schema.scan)
          .where(eq(schema.scan.id, scanId))
          .limit(1);
        const workspaceId = rows[0]?.workspaceId;
        if (workspaceId) {
          await publishEvent({
            workspaceId,
            type: "audit.failed",
            payload: { scanId, reason },
          });
        }
      });
      throw err;
    }
  },
);
