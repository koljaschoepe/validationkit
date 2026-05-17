import type { PRClient, PRDispatchInput, PRDispatchResult } from "./types.js";

/**
 * GitHub-App-backed dispatcher. Stub until the App is registered (Sprint 0.7+).
 *
 * Until then, callers should fall back to LocalGitClient when this throws, so
 * users in Hardcore-Local-Only mode still get a workable artifact.
 */
export class GitHubAppClient implements PRClient {
  readonly kind = "github-app" as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async dispatch(_input: PRDispatchInput): Promise<PRDispatchResult> {
    throw new Error(
      "GitHubAppClient is not yet wired. Register the ValidationKit GitHub App " +
        "(Sprint 0.7) before using this client. Until then, use LocalGitClient.",
    );
  }
}
