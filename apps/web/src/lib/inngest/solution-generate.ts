import { eq } from "drizzle-orm";
import { getDb, isDbEnabled, schema } from "@vk/db";
import { inngest, onFailureHandler } from "@vk/inngest";
import { runSolutionGeneration } from "../solution-dal";

/**
 * J4 — background solution generation.
 *
 * `requestSolution` enqueues `solution/requested` and returns immediately with
 * a `pending` row; this worker runs the slow LLM fix generation and writes
 * `ready` / `failed` while the UI polls `pollSolution`. It lives in apps/web
 * (not @vk/inngest) because the generation orchestration + scan-context
 * rehydration live in the app's solution DAL — it's registered alongside the
 * package functions in /api/inngest.
 */
const logFailure = onFailureHandler("solution-generate");

export const solutionGenerate: any = inngest.createFunction(
  {
    id: "solution-generate",
    triggers: [{ event: "solution/requested" }],
    // After every retry is exhausted: mark the row failed so the UI stops
    // polling, then log through the shared handler.
    onFailure: async (ctx: any) => {
      const findingId: string | undefined =
        ctx?.event?.data?.event?.data?.findingId ??
        ctx?.event?.data?.findingId;
      if (findingId && isDbEnabled()) {
        try {
          const db = getDb();
          await db
            .update(schema.solution)
            .set({
              status: "failed",
              failureReason: "Solution generation failed after retries.",
              updatedAt: new Date(),
            })
            .where(eq(schema.solution.findingId, findingId));
        } catch {
          // best-effort — the structured log below still fires.
        }
      }
      await logFailure(ctx);
    },
  },
  async ({ event }: any) => {
    const { findingId } = event.data as { findingId: string };
    await runSolutionGeneration(findingId);
    return { ok: true, findingId };
  },
);
