"use server";

import { getSessionUser } from "./session";
import {
  applySolution,
  dismissFinding,
  snoozeFinding,
  undoDismiss,
  pollPRStatus,
  type ApplyResult,
} from "./apply-dal";

export async function applySolutionAction(
  solutionId: string,
): Promise<ApplyResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return applySolution(user.id, solutionId);
}

export async function dismissFindingAction(
  findingId: string,
  reason: string,
): Promise<ApplyResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return dismissFinding(user.id, findingId, reason);
}

export async function undoDismissAction(
  findingId: string,
): Promise<ApplyResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return undoDismiss(user.id, findingId);
}

export async function snoozeFindingAction(
  findingId: string,
  duration: "24h" | "7d" | "forever",
): Promise<ApplyResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return snoozeFinding(user.id, findingId, duration);
}

export async function pollPRStatusAction(
  applyActionId: string,
): Promise<{ state: string } | null> {
  return pollPRStatus(applyActionId);
}
