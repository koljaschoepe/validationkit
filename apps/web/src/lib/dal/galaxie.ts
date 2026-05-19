// Sprint G1 stub. Sprint G2 replaces this with a real DAL that:
//   - checks workspace membership (Better-Auth org-active-set)
//   - reads scan/finding/customer/repo from Drizzle (Neon Postgres)
//   - returns `forbidden()` for non-members
//
// For G1 we serve the same deterministic mock-data as the public `/` route,
// so the `/[workspace]` route already proves the data-passing pattern works.

import { generateMockGalaxieData } from '@/lib/galaxie/mock-data';
import type { GalaxieData } from '@/lib/galaxie/types';
import {
  MOCK_WORKSPACES,
  type MockWorkspace,
} from '@/lib/galaxie/mock-workspaces';

export async function getGalaxieDataForWorkspace(
  workspaceSlug: string,
): Promise<{ workspace: MockWorkspace; data: GalaxieData } | null> {
  const workspace = MOCK_WORKSPACES.find((w) => w.slug === workspaceSlug);
  if (!workspace) return null;
  // Workspace-Slug-Variation via seed → jeder Workspace sieht andere mock-data.
  const data = generateMockGalaxieData(`workspace::${workspaceSlug}`);
  return { workspace, data };
}

export async function listWorkspaces(): Promise<MockWorkspace[]> {
  return MOCK_WORKSPACES;
}
