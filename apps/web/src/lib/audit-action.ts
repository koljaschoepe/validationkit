"use server";

import path from "node:path";
import { existsSync, statSync } from "node:fs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
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
import { ensureSubscription, type TierId } from "@vk/billing";

export interface AuditFormState {
  ok: boolean;
  error?: string;
  scan?: ParserResult;
  report?: AuditReport;
  resolvedPath?: string;
  displayPath?: string;
  savedScanId?: string;
  background?: boolean;
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

  // Tier-aware rate-limit (Sprint 1.4). Anonymous = IP-keyed @30/h.
  // Signed-in users get the bucket tied to their subscription tier —
  // free=60/h, solo_indie=200/h, solo_pro=500/h, agency_pro=1000/h,
  // agency_scale=2000/h, agency_scale_plus=5000/h. In-memory per region;
  // soft cap, not a paywall (lib/rate-limit.ts).
  const sessionUser = await getSessionUser();
  let limitKey: LimitKey;
  let bucketKey: string;
  if (sessionUser) {
    const snap = await ensureSubscription(sessionUser.id);
    limitKey = snap.tier as TierId;
    bucketKey = `user:${sessionUser.id}`;
  } else {
    const hdrs = await headers();
    limitKey = "anonymous";
    bucketKey = `ip:${ipFromHeaders(hdrs)}`;
  }
  const limit = checkRateLimit({ key: bucketKey, tier: limitKey });
  if (!limit.allowed) {
    return {
      ok: false,
      error: limit.reason ?? "Rate limited.",
    };
  }

  // Path 1: GitHub URL → fetch zipball + extract → audit → cleanup
  if (looksLikeGithubUrl(raw)) {
    return await auditGithubUrl(raw);
  }

  // Path 2: local absolute path (only useful in local dev)
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
    // Probe first: count files cheaply, decide sync-vs-background.
    const probe = await scanRepository(abs);
    const user = await getSessionUser();

    if (
      user &&
      isDbEnabled() &&
      isInngestEnabled() &&
      probe.files.length > BACKGROUND_THRESHOLD
    ) {
      const scanId = await enqueueBackgroundAudit(user.id, abs);
      revalidatePath("/scans");
      return {
        ok: true,
        resolvedPath: abs,
        savedScanId: scanId,
        background: true,
      };
    }

    const report = await runAudit(probe, { includeLLM: true });
    const savedScanId = await maybePersist(probe, report, abs);
    if (savedScanId) revalidatePath("/scans");

    const state: AuditFormState = {
      ok: true,
      scan: probe,
      report,
      resolvedPath: abs,
      displayPath: abs,
      background: false,
    };
    if (savedScanId) state.savedScanId = savedScanId;
    return state;
  } catch (err) {
    return {
      ok: false,
      error: `Scan failed: ${(err as Error).message}`,
      resolvedPath: abs,
    };
  }
}

async function auditGithubUrl(rawUrl: string): Promise<AuditFormState> {
  const refInfo = parseGithubUrl(rawUrl);
  if (!refInfo) {
    return {
      ok: false,
      error: `Couldn't parse GitHub URL: ${rawUrl}`,
    };
  }
  const displayPath = `github.com/${refInfo.owner}/${refInfo.repo}${refInfo.ref ? "@" + refInfo.ref : ""}`;

  let extractedRoot: string | null = null;
  try {
    extractedRoot = await fetchRepoZipball(refInfo);
    const probe = await scanRepository(extractedRoot);
    const report = await runAudit(probe, { includeLLM: true });

    // Re-rewrite paths in the persisted scan so we don't store the temp /tmp/vk-gh-xxx prefix.
    const rewrittenScan: ParserResult = {
      ...probe,
      rootPath: displayPath,
      files: probe.files.map((f) => ({
        ...f,
        absolutePath: displayPath + "/" + f.relativePath,
      })),
    };
    const rewrittenReport: AuditReport = {
      ...report,
      rootPath: displayPath,
    };

    const savedScanId = await maybePersist(
      rewrittenScan,
      rewrittenReport,
      displayPath,
    );
    if (savedScanId) revalidatePath("/scans");

    const state: AuditFormState = {
      ok: true,
      scan: rewrittenScan,
      report: rewrittenReport,
      resolvedPath: displayPath,
      displayPath,
      background: false,
    };
    if (savedScanId) state.savedScanId = savedScanId;
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
  userId: string,
  rootPath: string,
): Promise<string> {
  const db = getDb();
  const workspaceId = await ensureDefaultWorkspace(userId);

  const inserted = await db
    .insert(schema.scan)
    .values({
      workspaceId,
      rootPath,
      status: "queued",
      fileCount: 0,
      overallSeverity: "Exceptional",
      findingsCount: 0,
      warningsCount: 0,
    })
    .returning({ id: schema.scan.id });
  const row = inserted[0];
  if (!row) throw new Error("Failed to enqueue scan.");

  await inngest.send({
    name: "audit/requested",
    data: { scanId: row.id, rootPath },
  });

  return row.id;
}

async function maybePersist(
  scan: ParserResult,
  report: AuditReport,
  rootPath: string,
): Promise<string | null> {
  if (!isDbEnabled()) return null;
  const user = await getSessionUser();
  if (!user) return null;

  const db = getDb();
  const workspaceId = await ensureDefaultWorkspace(user.id);

  const insertedScan = await db
    .insert(schema.scan)
    .values({
      workspaceId,
      rootPath,
      status: "complete",
      completedAt: new Date(),
      fileCount: report.fileCount,
      overallSeverity: report.summary.overallSeverity,
      findingsCount: report.findings.length,
      warningsCount: scan.warnings.length,
      rawScan: scan as unknown as Record<string, unknown>,
      rawReport: report as unknown as Record<string, unknown>,
    })
    .returning({ id: schema.scan.id });
  const row = insertedScan[0];
  if (!row) return null;

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

  return row.id;
}
