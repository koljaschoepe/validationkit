import { serve } from "inngest/next";
import { inngest, functions } from "@vk/inngest";
import { solutionGenerate } from "@/lib/inngest/solution-generate";
import { webhookDeliver } from "@/lib/inngest/webhook-deliver";

// Inngest's serve handler uses Node crypto for request-signature verification;
// pin the Node runtime (every other webhook/SSE route does) so it can't drift to
// the Edge default. maxDuration covers longer step fan-outs.
export const runtime = "nodejs";
export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [...functions, solutionGenerate, webhookDeliver],
});
