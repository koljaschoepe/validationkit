"use server";

import path from "node:path";
import { existsSync, statSync } from "node:fs";
import { headers } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { galaxieWorkspaceTag } from "./cache-tags";
import { scanRepository } from "@vk/parser";
import { runAudit } from "@vk/audit";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { inngest, isInngestEnabled, BACKGROUND_THRESHOLD } from "@vk/inngest";
import type { AuditReport, ParserResult } from "@vk/core";
import { getSessionUser } from "./session";
import { ensureDefaultWorkspace } from "./workspaces";
import {
  parseGithubUrl,
  fetchRepoZipball,
  cleanupTempDir,
  looksLikeGithubUrl,
} from "./github-fetch";
import { checkRateLimit, ipFromHeaders, type LimitKey } from "./rate-limit";
import {
  canConsume,
  consumeCredits,
  creditsForIntensity,
  DEFAULT_INTENSITY,
  ensureSubscription,
  type Intensity,
  isIntensity,
  type TierId,
} from "@vk/billing";
import type { MeteringContext } from "@vk/llm";
import { eq, sum } from "drizzle-orm";

export interface AuditFormState {
  ok: boolean;
  error?: string;
  scan?: ParserResult;
  report?: AuditReport;
  resolvedPath?: string;
  displayPath?: string;
  savedScanId?: string;
  workspaceSlug?: string;
  background?: boolean;
}

interface ResolvedActor {
  intensity: Intensity;
  /** null for anonymous (no metering, no credit consume). */
  workspaceId: string | null;
  workspaceSlug: string | null;
  byokFlag: boolean;
  /** K-PAY2: when true, a drained pool goes to metered overage, not a hard fail. */
  autoOverageEnabled: boolean;
}

async function resolveActor(
  sessionUserId: string | null,
  rawIntensity: Intensity,
): Promise<ResolvedActor & { rateLimitTier: LimitKey }> {
  if (!sessionUserId) {
    return {
      intensity: "quick", // Anonymous demos always run Quick; Deep needs an account.
      workspaceId: null,
      workspaceSlug: null,
      byokFlag: false,
      autoOverageEnabled: false,
      rateLimitTier: "anonymous",
    };
  }
  const { id: workspaceId, slug: workspaceSlug } =
    await ensureDefaultWorkspace(sessionUserId);
  const snap = await ensureSubscription(workspaceId);
  const intensity: Intensity =
    rawIntensity === "deep" && snap.tier === "free" ? "quick" : rawIntensity;
  return {
    intensity,
    workspaceId,
    workspaceSlug,
    byokFlag: snap.byokEnabled,
    autoOverageEnabled: snap.autoOverageEnabled,
    rateLimitTier: snap.tier as TierId,
  };
}

export async function auditAction(
  _prev: AuditFormState,
  formData: FormData,
): Promise<AuditFormState> {
  const raw = String(formData.get("path") ?? "").trim();
  if (!raw) {
    return {
      ok: false,
      error: "Paste a GitHub repository URL (or a local absolute path).",
    };
  }

  const rawIntensity = String(formData.get("intensity") ?? "");
  const requestedIntensity: Intensity = isIntensity(rawIntensity)
    ? rawIntensity
    : DEFAULT_INTENSITY;

  // Tier-aware rate-limit (Sprint 1.4) — anonymous gets IP-keyed 30/h.
  // Signed-in users get the bucket tied to their workspace tier
  // (free/starter/pro/agency).
  const sessionUser = await getSessionUser();
  const actor = await resolveActor(
    sessionUser?.id ?? null,
    requestedIntensity,
  );

  const bucketKey = sessionUser
    ? `user:${sessionUser.id}`
    : `ip:${ipFromHeaders(await headers())}`;
  const limit = checkRateLimit({
    key: bucketKey,
    tier: actor.rateLimitTier,
  });
  if (!limit.allowed) {
    return { ok: false, error: limit.reason ?? "Rate limited." };
  }

  // Pre-audit credit check for signed-in users. Anonymous demos bypass.
  if (actor.workspaceId) {
    const need = creditsForIntensity(actor.intensity);
    // K-PAY2: honor auto-overage in the pre-check too, else a drained pool is
    // rejected here before consumeCredits ever gets the chance to meter it.
    const gate = await canConsume(actor.workspaceId, need, {
      allowOverage: actor.autoOverageEnabled,
    });
    if (!gate.allowed) {
      return { ok: false, error: gate.reason ?? "Out of credits." };
    }
  }

  if (looksLikeGithubUrl(raw)) {
    return await auditGithubUrl(raw, actor);
  }

  const abs = path.resolve(raw);
  if (!existsSync(abs)) {
    return { ok: false, error: `Path not found: ${abs}` };
  }
  let stat;
  try {
    stat = statSync(abs);
  } catch (err) {
    return {
      ok: false,
      error: `Cannot stat ${abs}: ${(err as Error).message}`,
    };
  }
  if (!stat.isDirectory()) {
    return { ok: false, error: `${abs} is not a directory.` };
  }

  try {
    const probe = await scanRepository(abs);

    if (
      sessionUser &&
      actor.workspaceId &&
      actor.workspaceSlug &&
      isDbEnabled() &&
      isInngestEnabled() &&
      probe.files.length > BACKGROUND_THRESHOLD
    ) {
      const { scanId, workspaceSlug } = await enqueueBackgroundAudit(
        {
          ...actor,
          workspaceId: actor.workspaceId,
          workspaceSlug: actor.workspaceSlug,
        },
        abs,
      );
      revalidatePath(`/${workspaceSlug}/scans`);
      return {
        ok: true,
        resolvedPath: abs,
        savedScanId: scanId,
        workspaceSlug,
        background: true,
      };
    }

    const persisted = await runForegroundAudit(probe, abs, actor);

    const state: AuditFormState = {
      ok: true,
      scan: probe,
      report: persisted.report,
      resolvedPath: abs,
      displayPath: abs,
      background: false,
    };
    if (persisted.scanId) {
      state.savedScanId = persisted.scanId;
      state.workspaceSlug = persisted.workspaceSlug ?? undefined;
    }
    return state;
  } catch (err) {
    return {
      ok: false,
      error: `Scan failed: ${(err as Error).message}`,
      resolvedPath: abs,
    };
  }
}

async function auditGithubUrl(
  rawUrl: string,
  actor: ResolvedActor,
): Promise<AuditFormState> {
  const refInfo = parseGithubUrl(rawUrl);
  if (!refInfo) {
    return { ok: false, error: `Couldn't parse GitHub URL: ${rawUrl}` };
  }
  const displayPath = `github.com/${refInfo.owner}/${refInfo.repo}${refInfo.ref ? "@" + refInfo.ref : ""}`;

  let extractedRoot: string | null = null;
  try {
    extractedRoot = await fetchRepoZipball(refInfo);
    const probe = await scanRepository(extractedRoot);

    const rewrittenScan: ParserResult = {
      ...probe,
      rootPath: displayPath,
      files: probe.files.map((f) => ({
        ...f,
        absolutePath: displayPath + "/" + f.relativePath,
      })),
    };

    const persisted = await runForegroundAudit(
      rewrittenScan,
      displayPath,
      actor,
    );

    const state: AuditFormState = {
      ok: true,
      scan: rewrittenScan,
      report: persisted.report,
      resolvedPath: displayPath,
      displayPath,
      background: false,
    };
    if (persisted.scanId) {
      state.savedScanId = persisted.scanId;
      state.workspaceSlug = persisted.workspaceSlug ?? undefined;
    }
    return state;
  } catch (err) {
    return {
      ok: false,
      error: `Failed to audit ${displayPath}: ${(err as Error).message}`,
      resolvedPath: displayPath,
    };
  } finally {
    if (extractedRoot) {
      await cleanupTempDir(extractedRoot).catch(() => {});
    }
  }
}

async function enqueueBackgroundAudit(
  actor: ResolvedActor & { workspaceId: string; workspaceSlug: string },
  rootPath: string,
): Promise<{ scanId: string; workspaceSlug: string }> {
  const db = getDb();
  const inserted = await db
    .insert(schema.scan)
    .values({
      workspaceId: actor.workspaceId,
      rootPath,
      status: "queued",
      fileCount: 0,
      overallSeverity: "Exceptional",
      findingsCount: 0,
      warningsCount: 0,
      intensity: actor.intensity,
    })
    .returning({ id: schema.scan.id });
  const row = inserted[0];
  if (!row) throw new Error("Failed to enqueue scan.");

  await inngest.send({
    name: "audit/requested",
    data: {
      scanId: row.id,
      rootPath,
      intensity: actor.intensity,
      workspaceId: actor.workspaceId,
      byokFlag: actor.byokFlag,
    },
  });

  return { scanId: row.id, workspaceSlug: actor.workspaceSlug };
}

async function runForegroundAudit(
  probe: ParserResult,
  rootPath: string,
  actor: ResolvedActor,
): Promise<{
  report: AuditReport;
  scanId: string | null;
  workspaceSlug: string | null;
}> {
  // Anonymous run — no metering, no credit consume.
  if (!actor.workspaceId) {
    const report = await runAudit(probe, {
      includeLLM: true,
      intensity: actor.intensity,
    });
    return { report, scanId: null, workspaceSlug: null };
  }

  if (!isDbEnabled()) {
    const report = await runAudit(probe, {
      includeLLM: true,
      intensity: actor.intensity,
    });
    return { report, scanId: null, workspaceSlug: actor.workspaceSlug };
  }

  const db = getDb();
  const insertedScan = await db
    .insert(schema.scan)
    .values({
      workspaceId: actor.workspaceId,
      rootPath,
      status: "running",
      startedAt: new Date(),
      fileCount: probe.files.length,
      overallSeverity: "Exceptional",
      findingsCount: 0,
      warningsCount: probe.warnings.length,
      intensity: actor.intensity,
    })
    .returning({ id: schema.scan.id });
  const row = insertedScan[0];
  if (!row) throw new Error("Failed to insert scan row.");

  const meteringContext: MeteringContext = {
    workspaceId: actor.workspaceId,
    scanId: row.id,
    byokFlag: actor.byokFlag,
  };

  const report = await runAudit(probe, {
    includeLLM: true,
    intensity: actor.intensity,
    meteringContext,
  });

  const credits = creditsForIntensity(actor.intensity);

  // Consume credits. Anonymous and DB-disabled paths skip this branch entirely.
  const consume = await consumeCredits({
    workspaceId: actor.workspaceId,
    amount: credits,
    reason: "audit_consume",
    referenceId: row.id,
    allowOverage: actor.autoOverageEnabled,
  });
  if (!consume.allowed) {
    // Race: another concurrent audit drained the pool between canConsume and
    // consumeCredits. Mark the scan failed and surface the reason.
    await db
      .update(schema.scan)
      .set({ status: "failed", failureReason: consume.reason ?? null })
      .where(eq(schema.scan.id, row.id));
    throw new Error(consume.reason ?? "Out of credits.");
  }

  // Aggregate per-call costs from ai_usage_event for this scan.
  const costRows = await db
    .select({ total: sum(schema.aiUsageEvent.costMicrocents) })
    .from(schema.aiUsageEvent)
    .where(eq(schema.aiUsageEvent.scanId, row.id));
  const totalCostMicrocents = Number(costRows[0]?.total ?? 0);

  await db.insert(schema.auditRunCost).values({
    scanId: row.id,
    workspaceId: actor.workspaceId,
    intensity: actor.intensity,
    creditsConsumed: credits,
    totalCostMicrocents,
    markupMicrocents: 0, // Sub-Plan-B fills this on Stripe meter flush.
  });

  await db
    .update(schema.scan)
    .set({
      status: "complete",
      completedAt: new Date(),
      findingsCount: report.findings.length,
      overallSeverity: report.summary.overallSeverity,
      rawScan: probe as unknown as Record<string, unknown>,
      rawReport: report as unknown as Record<string, unknown>,
      creditsConsumed: credits,
      totalCostMicrocents,
    })
    .where(eq(schema.scan.id, row.id));

  if (report.findings.length > 0) {
    await db.insert(schema.finding).values(
      report.findings.map((f) => {
        const base = {
          scanId: row.id,
          category: f.category,
          severity: f.severity,
          title: f.title,
          detail: f.detail,
          deterministic: f.deterministic,
          citations: f.citations as unknown as Record<string, unknown>[],
        };
        return f.confidence ? { ...base, confidence: f.confidence } : base;
      }),
    );
  }

  updateTag(galaxieWorkspaceTag(actor.workspaceId));

  return { report, scanId: row.id, workspaceSlug: actor.workspaceSlug };
}
