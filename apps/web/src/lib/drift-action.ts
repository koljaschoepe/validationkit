"use server";

import path from "node:path";
import { existsSync, statSync } from "node:fs";
import { revalidatePath } from "next/cache";
import { scanRepository } from "@vk/parser";
import { computeDrift } from "@vk/drift";
import { getDb, isDbEnabled, schema } from "@vk/db";
import type { DriftReport } from "@vk/core";
import { getSessionUser } from "./session";
import { ensureDefaultWorkspace } from "./workspaces";

export interface DriftFormState {
  ok: boolean;
  error?: string;
  drift?: DriftReport;
  savedDriftId?: string;
}

export async function driftAction(
  _prev: DriftFormState,
  formData: FormData,
): Promise<DriftFormState> {
  const rawA = String(formData.get("pathA") ?? "").trim();
  const rawB = String(formData.get("pathB") ?? "").trim();
  if (!rawA || !rawB) {
    return { ok: false, error: "Provide two absolute paths." };
  }
  const absA = path.resolve(rawA);
  const absB = path.resolve(rawB);
  if (!existsSync(absA) || !statSync(absA).isDirectory()) {
    return { ok: false, error: `Not a directory: ${absA}` };
  }
  if (!existsSync(absB) || !statSync(absB).isDirectory()) {
    return { ok: false, error: `Not a directory: ${absB}` };
  }
  try {
    const [scanA, scanB] = await Promise.all([
      scanRepository(absA, { includeExamples: true }),
      scanRepository(absB, { includeExamples: true }),
    ]);
    const drift = computeDrift(scanA, scanB);
    const savedDriftId = await maybePersist(drift, absA, absB);
    if (savedDriftId) revalidatePath("/drifts");
    const state: DriftFormState = { ok: true, drift };
    if (savedDriftId) state.savedDriftId = savedDriftId;
    return state;
  } catch (err) {
    return { ok: false, error: `Drift failed: ${(err as Error).message}` };
  }
}

async function maybePersist(
  drift: DriftReport,
  pathA: string,
  pathB: string,
): Promise<string | null> {
  if (!isDbEnabled()) return null;
  const user = await getSessionUser();
  if (!user) return null;

  const db = getDb();
  const workspaceId = await ensureDefaultWorkspace(user.id);

  const inserted = await db
    .insert(schema.driftRun)
    .values({
      workspaceId,
      rootPathA: pathA,
      rootPathB: pathB,
      itemsCount: drift.items.length,
      overallSeverity: drift.summary.overallSeverity,
      rawDrift: drift as unknown as Record<string, unknown>,
    })
    .returning({ id: schema.driftRun.id });
  return inserted[0]?.id ?? null;
}
