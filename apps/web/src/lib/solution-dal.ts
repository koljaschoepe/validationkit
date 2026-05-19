"use server";

import { and, eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { getDb, isDbEnabled, schema } from "@vk/db";
import type {
  AuditFinding,
  Citation,
  FindingCategory,
  ParserResult,
} from "@vk/core";
import {
  generateFixAsync,
  isSupported,
  type FixProposal,
} from "@vk/fixes";
import { galaxieWorkspaceTag } from "./cache-tags";

export type SolutionStatus = "pending" | "ready" | "failed" | "unsupported";

export interface SolutionRow {
  id: string;
  findingId: string;
  status: SolutionStatus;
  patch: string | null;
  rationale: string | null;
  confidence: "low" | "mid" | "high" | null;
  deterministic: boolean | null;
  filesTouched: string[];
  generatorVersion: string | null;
  failureReason: string | null;
  generatedAt: Date | null;
}

const GENERATOR_VERSION = "g4-v1";

// JSONB roundtrip mangles Date → strings; rehydrate ParserResult here so
// @vk/fixes generators see proper Date instances.
function rehydrateScanContext(raw: unknown): ParserResult | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.rootPath !== "string" || !Array.isArray(r.files)) return null;
  return {
    rootPath: r.rootPath,
    scannedAt: r.scannedAt ? new Date(r.scannedAt as string) : new Date(),
    files: r.files as ParserResult["files"],
    warnings: (r.warnings ?? []) as ParserResult["warnings"],
  };
}

function findingRowToAuditFinding(row: typeof schema.finding.$inferSelect): AuditFinding {
  return {
    id: row.id,
    category: row.category as FindingCategory,
    severity: row.severity as AuditFinding["severity"],
    title: row.title,
    detail: row.detail,
    citations: (row.citations as Citation[]) ?? [],
    deterministic: row.deterministic,
    ...(row.confidence
      ? { confidence: row.confidence as "low" | "mid" | "high" }
      : {}),
  };
}

function mapRow(row: typeof schema.solution.$inferSelect): SolutionRow {
  return {
    id: row.id,
    findingId: row.findingId,
    status: row.status as SolutionStatus,
    patch: row.patch,
    rationale: row.rationale,
    confidence: row.confidence as SolutionRow["confidence"],
    deterministic: row.deterministic,
    filesTouched: (row.filesTouched as string[]) ?? [],
    generatorVersion: row.generatorVersion,
    failureReason: row.failureReason,
    generatedAt: row.generatedAt,
  };
}

async function userIsMember(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();
  const memberRows = await db
    .select({ id: schema.membership.id })
    .from(schema.membership)
    .where(
      and(
        eq(schema.membership.workspaceId, workspaceId),
        eq(schema.membership.userId, userId),
        eq(schema.membership.status, "active"),
      ),
    )
    .limit(1);
  if (memberRows.length > 0) return true;
  const ownerRows = await db
    .select({ id: schema.workspace.id })
    .from(schema.workspace)
    .where(
      and(
        eq(schema.workspace.id, workspaceId),
        eq(schema.workspace.ownerId, userId),
      ),
    )
    .limit(1);
  return ownerRows.length > 0;
}

export async function getSolution(
  findingId: string,
): Promise<SolutionRow | null> {
  if (!isDbEnabled()) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.solution)
    .where(eq(schema.solution.findingId, findingId))
    .limit(1);
  const row = rows[0];
  return row ? mapRow(row) : null;
}

/** Bulk-status for galaxie-render — keep a single roundtrip per page. */
export async function listSolutionStatusByFinding(
  findingIds: string[],
): Promise<
  Map<string, { status: SolutionStatus; confidence: SolutionRow["confidence"] }>
> {
  if (!isDbEnabled() || findingIds.length === 0) return new Map();
  const db = getDb();
  const rows = await db
    .select({
      findingId: schema.solution.findingId,
      status: schema.solution.status,
      confidence: schema.solution.confidence,
    })
    .from(schema.solution)
    .where(inArray(schema.solution.findingId, findingIds));
  return new Map(
    rows.map((r) => [
      r.findingId,
      {
        status: r.status as SolutionStatus,
        confidence: r.confidence as SolutionRow["confidence"],
      },
    ]),
  );
}

/**
 * Atomic cache-or-generate. Caller (server-action) must verify userId.
 * Returns the solution row in its final or pending state.
 */
export async function getOrGenerateSolution(
  userId: string,
  findingId: string,
): Promise<SolutionRow | null> {
  if (!isDbEnabled()) return null;
  const db = getDb();

  // 1) Cache-hit fast-path.
  const existing = await getSolution(findingId);
  if (existing && existing.status !== "failed") return existing;

  // 2) Load finding + scan + workspace for membership-gate + generator context.
  const findingRows = await db
    .select({
      finding: schema.finding,
      scan: schema.scan,
    })
    .from(schema.finding)
    .innerJoin(schema.scan, eq(schema.finding.scanId, schema.scan.id))
    .where(eq(schema.finding.id, findingId))
    .limit(1);
  const row = findingRows[0];
  if (!row) return null;

  if (!(await userIsMember(row.scan.workspaceId, userId))) return null;

  const category = row.finding.category as FindingCategory;

  // 3) Unsupported category fast-path — write the marker row so future calls
  //    skip the lookup work.
  if (!isSupported(category)) {
    await db
      .insert(schema.solution)
      .values({
        findingId,
        status: "unsupported",
        failureReason: `No generator for "${category}".`,
        generatedAt: new Date(),
        generatorVersion: GENERATOR_VERSION,
      })
      .onConflictDoUpdate({
        target: schema.solution.findingId,
        set: {
          status: "unsupported",
          failureReason: `No generator for "${category}".`,
          updatedAt: new Date(),
        },
      });
    updateTag(galaxieWorkspaceTag(row.scan.workspaceId));
    return await getSolution(findingId);
  }

  // 4) Insert (or refresh) the pending row + attempt generation in the same call.
  await db
    .insert(schema.solution)
    .values({
      findingId,
      status: "pending",
      generatorVersion: GENERATOR_VERSION,
    })
    .onConflictDoUpdate({
      target: schema.solution.findingId,
      set: {
        status: "pending",
        failureReason: null,
        updatedAt: new Date(),
      },
    });

  const scanContext = rehydrateScanContext(row.scan.rawScan);
  if (!scanContext) {
    await db
      .update(schema.solution)
      .set({
        status: "failed",
        failureReason: "scan.raw_scan missing or unreadable",
        updatedAt: new Date(),
      })
      .where(eq(schema.solution.findingId, findingId));
    updateTag(galaxieWorkspaceTag(row.scan.workspaceId));
    return await getSolution(findingId);
  }

  const audit = findingRowToAuditFinding(row.finding);
  let proposal: FixProposal | null = null;
  let failureReason: string | null = null;
  try {
    proposal = await generateFixAsync(audit, scanContext);
  } catch (err) {
    failureReason = (err as Error).message;
  }

  if (!proposal) {
    await db
      .update(schema.solution)
      .set({
        status: "failed",
        failureReason:
          failureReason ?? "Generator returned null (no LLM key configured?)",
        updatedAt: new Date(),
      })
      .where(eq(schema.solution.findingId, findingId));
    updateTag(galaxieWorkspaceTag(row.scan.workspaceId));
    return await getSolution(findingId);
  }

  await db
    .update(schema.solution)
    .set({
      status: "ready",
      patch: proposal.patch,
      rationale: proposal.rationale,
      confidence: proposal.confidence,
      deterministic: proposal.deterministic,
      filesTouched: proposal.filesTouched,
      generatedAt: new Date(),
      failureReason: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.solution.findingId, findingId));

  updateTag(galaxieWorkspaceTag(row.scan.workspaceId));
  return await getSolution(findingId);
}

// alpha-Mapping lebt in lib/solution-alpha.ts (non-"use server"), damit es
// auch client-seitig (FileAsteroid) importierbar bleibt.
