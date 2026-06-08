"use server";

import { getSessionUser } from "./session";
import { userIsMember } from "./authz";
import {
  getFindingWorkspaceId,
  getOrGenerateSolution,
  getSolution,
  type SolutionRow,
} from "./solution-dal";

export async function requestSolution(
  findingId: string,
): Promise<SolutionRow | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return getOrGenerateSolution(user.id, findingId);
}

export async function pollSolution(
  findingId: string,
): Promise<SolutionRow | null> {
  // K1: the poll variant is a public Server-Action, so it must gate access
  // itself — an attacker can call it directly with any findingId. Resolve the
  // owning workspace (finding → scan) and verify session-membership before the
  // read. Null on denial matches the "no solution yet" contract the client
  // already handles.
  const user = await getSessionUser();
  if (!user) return null;
  const workspaceId = await getFindingWorkspaceId(findingId);
  if (!workspaceId || !(await userIsMember(workspaceId, user.id))) return null;
  return getSolution(findingId);
}
