/**
 * Sprint 1.0 — GitHub-App permission manifest. Locks the scope-pinned
 * default-read-only posture per ADR-0018 §14 and ADR-0020.
 *
 * Reference impls (A1): Stainless contents:read + pull_requests:write,
 * Linear contents:read + per-repo opt-in write, Reform uses GitHub's own
 * installation_request event. We follow the Linear pattern: read-only
 * default, write capability per-repo gated on `repo.writeAccessGranted=true`
 * via Requester→Approver-Bridge.
 *
 * The "pinned" set is what we ASK for at App registration. The "gated" set
 * is added at write-token mint time, after admin approval, and is NEVER in
 * the default install consent screen.
 */

/** Permissions requested at install time. Never expanded post-install. */
export const REQUIRED_PERMISSIONS = {
  contents: "read",
  pull_requests: "read",
  metadata: "read",
} as const;

/** Permissions only ever requested when `repo.writeAccessGranted=true`. */
export const WRITE_GATED_PERMISSIONS = {
  contents: "write",
  pull_requests: "write",
} as const;

/** Events the App subscribes to. Per A1, `installation_repositories` is the
 *  load-bearing event for Requester→Approver-Bridge reconciliation. */
export const REQUIRED_EVENTS = [
  "installation",
  "installation_repositories",
  "push",
  "pull_request",
] as const;

export type RequiredPermission = keyof typeof REQUIRED_PERMISSIONS;
export type WriteGatedPermission = keyof typeof WRITE_GATED_PERMISSIONS;
export type RequiredEvent = (typeof REQUIRED_EVENTS)[number];

/**
 * Returns the permission level the App should request when minting a token
 * for an installation on a given repo.
 *
 * Default = read-only. If a write-permission is requested but the repo's
 * `writeAccessGranted` flag is false, the caller MUST throw rather than
 * silently downgrade — silent downgrade hides bugs that look like "App
 * isn't working" instead of "you skipped the approval flow".
 */
export function permissionsFor(
  repo: { writeAccessGranted: boolean },
  wantWrite: boolean,
): Record<string, string> {
  if (wantWrite) {
    if (!repo.writeAccessGranted) {
      throw new Error(
        "Write permission requested but repo.writeAccessGranted=false. " +
          "Customer-Admin must approve via Requester→Approver-Bridge first.",
      );
    }
    return { ...REQUIRED_PERMISSIONS, ...WRITE_GATED_PERMISSIONS };
  }
  return { ...REQUIRED_PERMISSIONS };
}
