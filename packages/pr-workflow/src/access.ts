export interface RepoAccess {
  rootPath: string;
  writeAccessGranted: boolean;
}

export class AccessDeniedError extends Error {
  override readonly name = "AccessDeniedError";
  constructor(readonly rootPath: string) {
    super(
      `Write access not granted for ${rootPath}. ` +
        "Request write via the install_request flow (docs/legal/scope-policy.md).",
    );
  }
}

/**
 * Throws AccessDeniedError when write isn't granted for the repo. PRDispatch
 * MUST call this before any write operation. Sprint 0.5 enforcement is
 * deliberate per PRD §6.4 / docs/legal/scope-policy.md.
 */
export function enforceAccess(access: RepoAccess): void {
  if (!access.writeAccessGranted) {
    throw new AccessDeniedError(access.rootPath);
  }
}
