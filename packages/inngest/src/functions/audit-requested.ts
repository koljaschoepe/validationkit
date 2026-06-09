import { eq, sum } from "drizzle-orm";
import { scanRepository, classifyPath } from "@vk/parser";
import { runAudit } from "@vk/audit";
import {
  consumeCredits,
  creditsForIntensity,
  DEFAULT_INTENSITY,
  type Intensity,
} from "@vk/billing";
import { getDb, schema } from "@vk/db";
import type { AuditFinding } from "@vk/core";
import type { MeteringContext } from "@vk/llm";
import { inngest } from "../client.js";
import { publishEvent } from "../events.js";

export interface AuditRequestedPayload {
  scanId: string;
  rootPath: string;
  intensity?: Intensity;
  workspaceId?: string;
  byokFlag?: boolean;
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
    const payload = event.data as AuditRequestedPayload;
    const { scanId, rootPath } = payload;
    const intensity: Intensity = payload.intensity ?? DEFAULT_INTENSITY;
    const workspaceIdFromPayload = payload.workspaceId;
    const byokFlag = payload.byokFlag ?? false;
    const db = getDb();

    await step.run("mark-running", async () => {
      await db
        .update(schema.scan)
        .set({ status: "running", startedAt: new Date(), intensity })
        .where(eq(schema.scan.id, scanId));
    });

    try {
      const scan = await step.run("scan", () => scanRepository(rootPath));
      const meteringContext: MeteringContext | undefined =
        workspaceIdFromPayload
          ? {
              workspaceId: workspaceIdFromPayload,
              scanId,
              byokFlag,
            }
          : undefined;
      const report = await step.run("audit", () =>
        runAudit(scan, { includeLLM: true, intensity, meteringContext }),
      );

      const credits = creditsForIntensity(intensity);
      let totalCostMicrocents = 0;
      if (workspaceIdFromPayload) {
        await step.run("consume-credits", async () => {
          // K-PAY2: honor the workspace's auto-overage setting so a drained
          // pool goes to metered overage instead of failing the background
          // audit. Read it fresh here (payload may be stale by run time).
          const overageRow = await db
            .select({
              autoOverageEnabled: schema.subscription.autoOverageEnabled,
            })
            .from(schema.subscription)
            .where(eq(schema.subscription.workspaceId, workspaceIdFromPayload))
            .limit(1);
          const result = await consumeCredits({
            workspaceId: workspaceIdFromPayload,
            amount: credits,
            reason: "audit_consume",
            referenceId: scanId,
            allowOverage: overageRow[0]?.autoOverageEnabled ?? false,
          });
          if (!result.allowed) {
            throw new Error(result.reason ?? "Out of credits.");
          }
        });
        const costRows = await db
          .select({ total: sum(schema.aiUsageEvent.costMicrocents) })
          .from(schema.aiUsageEvent)
          .where(eq(schema.aiUsageEvent.scanId, scanId));
        totalCostMicrocents = Number(costRows[0]?.total ?? 0);
        await db.insert(schema.auditRunCost).values({
          scanId,
          workspaceId: workspaceIdFromPayload,
          intensity,
          creditsConsumed: credits,
          totalCostMicrocents,
          markupMicrocents: 0,
        });
      }

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
            creditsConsumed: workspaceIdFromPayload ? credits : 0,
            totalCostMicrocents,
          })
          .where(eq(schema.scan.id, scanId));

        if (report.findings.length > 0) {
          await db.insert(schema.finding).values(
            report.findings.map((f: AuditFinding) => {
              // Galaxie-Redesign Phase A — persist real file identity. First
              // citation is the finding's primary file; classifyPath derives the
              // AgentFileKind.
              const filePath = f.citations[0]?.path ?? null;
              const base = {
                scanId,
                category: f.category,
                severity: f.severity,
                title: f.title,
                detail: f.detail,
                deterministic: f.deterministic,
                citations: f.citations as unknown as Record<string, unknown>[],
                filePath,
                fileKind: filePath ? classifyPath(filePath) : null,
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
