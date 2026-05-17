import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import type {
  PRClient,
  PRDispatchInput,
  PRDispatchResult,
} from "@vk/pr-workflow";
import type { GitHubAppConfig } from "./types.js";

export function isGitHubAppEnabled(): boolean {
  return Boolean(
    process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY,
  );
}

function configFromEnv(): GitHubAppConfig {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) {
    throw new Error(
      "GitHub App env vars not set. See docs/setup/github-app.md.",
    );
  }
  const cfg: GitHubAppConfig = { appId, privateKey };
  if (process.env.GITHUB_APP_WEBHOOK_SECRET) {
    cfg.webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;
  }
  if (process.env.GITHUB_APP_CLIENT_ID) {
    cfg.clientId = process.env.GITHUB_APP_CLIENT_ID;
  }
  return cfg;
}

/**
 * Returns a PRClient backed by the registered GitHub App. Throws if the App
 * isn't registered or the installation isn't authorized for the target repo.
 *
 * `installationId` comes from the install-webhook payload, persisted on the
 * repo row at install-approval time. Caller is responsible for resolving it.
 */
export function createGitHubAppClient(installationId: number): PRClient {
  if (!isGitHubAppEnabled()) {
    throw new Error(
      "GitHub App not configured. Run docs/setup/github-app.md or fall back to LocalGitClient.",
    );
  }
  const cfg = configFromEnv();
  // Pass the rest-endpoint-enabled Octokit class so installation tokens get
  // `.rest.*` methods without us doing per-call plumbing.
  const app = new App({
    appId: cfg.appId,
    privateKey: cfg.privateKey,
    Octokit,
  });
  return new GitHubAppPRClient(app, installationId);
}

class GitHubAppPRClient implements PRClient {
  readonly kind = "github-app" as const;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly app: App<any>,
    private readonly installationId: number,
  ) {}

  async dispatch(input: PRDispatchInput): Promise<PRDispatchResult> {
    const [owner, repo] = input.repo.split("/");
    if (!owner || !repo) {
      throw new Error(
        `GitHubAppClient.dispatch expects "owner/repo", got "${input.repo}".`,
      );
    }
    const octokit = await this.app.getInstallationOctokit(this.installationId);

    // Resolve default branch.
    const repoData = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.data.default_branch;

    // Resolve base SHA from default branch.
    const baseRef = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const baseSha = baseRef.data.object.sha;

    // Create feature branch (idempotent: ignore "already exists").
    try {
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${input.branch}`,
        sha: baseSha,
      });
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status !== 422) throw err;
    }

    // Apply the patch as a single commit on the branch. The patch is a unified
    // diff; for Sprint 0.6 we keep the workflow simple by writing the patch as
    // a single tracked file in /.validationkit/pending/ and opening a PR that
    // surfaces it. Real file-by-file apply lands in Sprint 0.7 with `tree`
    // construction.
    const patchPath = `.validationkit/pending/${slug(input.branch)}.patch`;
    const contentBase64 = Buffer.from(input.patch, "utf8").toString("base64");
    let existingSha: string | undefined;
    try {
      const existing = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: patchPath,
        ref: input.branch,
      });
      if (!Array.isArray(existing.data) && "sha" in existing.data) {
        existingSha = existing.data.sha;
      }
    } catch {
      // 404 = file doesn't exist yet; this is the normal path.
    }
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: patchPath,
      message: input.title,
      content: contentBase64,
      branch: input.branch,
      ...(existingSha ? { sha: existingSha } : {}),
    });

    // Open the PR (idempotent: surface existing if one's already open).
    let prNumber: number;
    let prUrl: string;
    try {
      const pr = await octokit.rest.pulls.create({
        owner,
        repo,
        title: input.title,
        body: input.body,
        head: input.branch,
        base: defaultBranch,
      });
      prNumber = pr.data.number;
      prUrl = pr.data.html_url;
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status !== 422) throw err;
      const open = await octokit.rest.pulls.list({
        owner,
        repo,
        state: "open",
        head: `${owner}:${input.branch}`,
      });
      const first = open.data[0];
      if (!first) throw err;
      prNumber = first.number;
      prUrl = first.html_url;
    }

    return {
      url: prUrl,
      via: "github-app",
      ref: String(prNumber),
    };
  }
}

function slug(s: string): string {
  return s.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
