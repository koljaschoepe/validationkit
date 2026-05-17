export interface PRDispatchInput {
  /** Target repo identifier (`/abs/path` for local, `owner/repo` for GitHub). */
  repo: string;
  /** Branch name to create or update. */
  branch: string;
  /** PR title. */
  title: string;
  /** PR body (Markdown). */
  body: string;
  /** Patch in unified-diff format. */
  patch: string;
}

export interface PRDispatchResult {
  /** A clickable URI. For LocalGitClient this is a `file://` link to the saved patch. */
  url: string;
  /** Which client handled the dispatch. */
  via: "local-git" | "github-app";
  /** Identifier — local: patch file path, GitHub: PR number. */
  ref: string;
}

export interface PRClient {
  readonly kind: "local-git" | "github-app";
  dispatch(input: PRDispatchInput): Promise<PRDispatchResult>;
}
