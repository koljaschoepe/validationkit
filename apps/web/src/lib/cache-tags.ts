// Central registry for Next.js cache tags. Keep tag formats stable here so
// `revalidateTag` calls scattered across server actions stay in sync with the
// `unstable_cache` reads in lib/dal/*.

/** Tag for `galaxie:workspace:<id>` — invalidate when customer/repo/scan/finding mutates. */
export function galaxieWorkspaceTag(workspaceId: string): string {
  return `galaxie:workspace:${workspaceId}`;
}

/** Tag for the user's workspace list — invalidate when membership changes. */
export function userWorkspacesTag(userId: string): string {
  return `user:${userId}:workspaces`;
}
