import { scanRepository } from "@vk/parser";
import { computeDrift } from "@vk/drift";
import { getDb, schema } from "@vk/db";
import { inngest } from "../client.js";
import { publishEvent } from "../events.js";

export interface DriftRequestedPayload {
  workspaceId: string;
  rootPathA: string;
  rootPathB: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const driftRequested: any = inngest.createFunction(
  { id: "drift-requested", triggers: [{ event: "drift/requested" }] },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ event, step }: any) => {
    const { workspaceId, rootPathA, rootPathB } =
      event.data as DriftRequestedPayload;
    const db = getDb();

    const scanA = await step.run("scan-a", () => scanRepository(rootPathA));
    const scanB = await step.run("scan-b", () => scanRepository(rootPathB));
    const drift = await step.run("compute", () => computeDrift(scanA, scanB));

    const inserted = await step.run("persist", async () => {
      const rows = await db
        .insert(schema.driftRun)
        .values({
          workspaceId,
          rootPathA,
          rootPathB,
          itemsCount: drift.items.length,
          overallSeverity: drift.overallSeverity,
          rawDrift: drift as unknown as Record<string, unknown>,
        })
        .returning({ id: schema.driftRun.id });
      return rows[0]?.id ?? null;
    });

    if (inserted) {
      await step.run("publish-event", async () =>
        publishEvent({
          workspaceId,
          type: "drift.completed",
          payload: {
            driftId: inserted,
            rootPathA,
            rootPathB,
            overallSeverity: drift.overallSeverity,
            itemsCount: drift.items.length,
          },
        }),
      );
    }

    return { ok: true, driftId: inserted };
  },
);
