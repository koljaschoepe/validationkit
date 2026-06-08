"use server";

import { eq } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import type { AuditFinding, AuditReport, ParserResult } from "@vk/core";
import { generateBatchFix, isSupported } from "@vk/fixes";
import { getSessionUser } from "./session";
import { userIsMember } from "./authz";

export interface FixActionResult {
  ok: boolean;
  patch?: string;
  filesTouched?: string[];
  rationale?: string[];
  failures?: Array<{ findingId: string; reason: string }>;
  skippedLlmDisabled?: Array<{ findingId: string; category: string }>;
  error?: string;
}

export async function generateFixesForScan(
  scanId: string,
  findingIds: string[],
): Promise<FixActionResult> {
  if (findingIds.length === 0) {
    return { ok: false, error: "No findings selected." };
  }
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const db = getDb();
  const rows = await db
    .select({
      rawScan: schema.scan.rawScan,
      rawReport: schema.scan.rawReport,
      workspaceId: schema.scan.workspaceId,
    })
    .from(schema.scan)
    .where(eq(schema.scan.id, scanId))
    .limit(1);
  const row = rows[0];
  // K6: membership-gate instead of the legacy ownerId filter. Same generic
  // error for a missing row or a non-member so scan existence doesn't leak
  // cross-tenant.
  if (!row || !(await userIsMember(row.workspaceId, user.id))) {
    return { ok: false, error: "Scan not found or not yet complete." };
  }
  if (!row.rawScan || !row.rawReport) {
    return { ok: false, error: "Scan not found or not yet complete." };
  }

  const parserResult = reviveScan(row.rawScan as unknown as ParserResult);
  const report = row.rawReport as unknown as AuditReport;
  const requested = new Set(findingIds);
  const findings = report.findings.filter(
    (f: AuditFinding) => requested.has(f.id) && isSupported(f.category),
  );
  if (findings.length === 0) {
    return {
      ok: false,
      error: "None of the selected findings have a deterministic fix in v0.0.13.",
    };
  }

  const result = await generateBatchFix(findings, parserResult);
  if (result.successes.length === 0) {
    return {
      ok: false,
      error:
        result.skippedLlmDisabled.length > 0
          ? `All selected fixes require an LLM key (set ANTHROPIC_API_KEY to enable). ${result.failures.length} other failure${result.failures.length === 1 ? "" : "s"}.`
          : "All selected fixes failed.",
      failures: result.failures,
    };
  }
  return {
    ok: true,
    patch: result.combinedPatch,
    filesTouched: Array.from(
      new Set(result.successes.flatMap((s) => s.filesTouched)),
    ),
    rationale: result.successes.map((s) => s.rationale),
    failures: result.failures.length > 0 ? result.failures : undefined,
    skippedLlmDisabled:
      result.skippedLlmDisabled.length > 0
        ? result.skippedLlmDisabled
        : undefined,
  };
}

function reviveScan(raw: ParserResult): ParserResult {
  return {
    ...raw,
    scannedAt: new Date(raw.scannedAt as unknown as string),
    files: raw.files.map((f) => ({
      ...f,
      lastModified: f.lastModified
        ? new Date(f.lastModified as unknown as string)
        : null,
    })),
  };
}
