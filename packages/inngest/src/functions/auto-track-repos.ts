import { eq, isNotNull } from "drizzle-orm";
import { getDb, schema } from "@vk/db";
import { inngest } from "../client.js";
import { onFailureHandler } from "../on-failure.js";

interface RepoRow {
  id: string;
  workspaceId: string;
  rootPath: string;
  githubFullName: string | null;
  lastCommitSha: string | null;
}

/**
 * Sprint 0.12 — poll watched public GitHub repos every 4h. For each repo with
 * a github_full_name set, query the unauthenticated commits API for the latest
 * SHA. If the SHA differs from `last_commit_sha`, enqueue a new audit.
 *
 * Free-tier math: 30 repos × 6 polls/day × 30 days = 5_400 step-runs/month.
 * Inngest free = 50k/month → ~10% of quota. Comfortable through Phase 0.5.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const autoTrackRepos: any = inngest.createFunction(
  {
    id: "auto-track-repos",
    triggers: [{ cron: "0 */4 * * *" }],
    onFailure: onFailureHandler("auto-track-repos"),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ step }: any) => {
    const db = getDb();

    const repos: RepoRow[] = await step.run("fetch-tracked-repos", async () => {
      return db
        .select({
          id: schema.repo.id,
          workspaceId: schema.repo.workspaceId,
          rootPath: schema.repo.rootPath,
          githubFullName: schema.repo.githubFullName,
          lastCommitSha: schema.repo.lastCommitSha,
        })
        .from(schema.repo)
        .where(isNotNull(schema.repo.githubFullName));
    });

    const results: Array<{ repoId: string; changed: boolean }> = [];
    for (const r of repos) {
      if (!r.githubFullName) continue;
      // Each iteration is its own step so retries are bounded per-repo.
      const outcome = await step.run(`poll-${r.id}`, async () => {
        const sha = await fetchLatestCommitSha(r.githubFullName!);
        if (!sha) {
          await db
            .update(schema.repo)
            .set({ lastPolledAt: new Date() })
            .where(eq(schema.repo.id, r.id));
          return { repoId: r.id, changed: false };
        }
        if (sha === r.lastCommitSha) {
          await db
            .update(schema.repo)
            .set({ lastPolledAt: new Date() })
            .where(eq(schema.repo.id, r.id));
          return { repoId: r.id, changed: false };
        }

        const inserted = await db
          .insert(schema.scan)
          .values({
            workspaceId: r.workspaceId,
            repoId: r.id,
            rootPath: r.rootPath,
            status: "queued",
            fileCount: 0,
            overallSeverity: "Exceptional",
            findingsCount: 0,
            warningsCount: 0,
          })
          .returning({ id: schema.scan.id });
        const row = inserted[0];
        if (!row) return { repoId: r.id, changed: false };

        await db
          .update(schema.repo)
          .set({ lastCommitSha: sha, lastPolledAt: new Date() })
          .where(eq(schema.repo.id, r.id));

        await inngest.send({
          // Deterministic id → Inngest dedupes a replayed poll so a single
          // queued scan can't be enqueued twice.
          id: `audit-requested-${row.id}`,
          name: "audit/requested",
          data: { scanId: row.id, rootPath: r.rootPath },
        });

        return { repoId: r.id, changed: true };
      });
      results.push(outcome);
    }

    return {
      polled: results.length,
      changed: results.filter((r) => r.changed).length,
    };
  },
);

async function fetchLatestCommitSha(
  fullName: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${fullName}/commits?per_page=1`,
      {
        headers: {
          "User-Agent": "validationkit-auto-track/0.0.12",
          Accept: "application/vnd.github+json",
        },
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as Array<{ sha?: string }>;
    return body[0]?.sha ?? null;
  } catch {
    return null;
  }
}
