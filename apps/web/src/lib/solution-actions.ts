"use server";

import { getSessionUser } from "./session";
import {
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
  // Poll variant — no auth required because it's a read-only lookup and
  // the inspector already proved access via requestSolution.
  return getSolution(findingId);
}
