import { Inngest } from "inngest";

/**
 * Files-above-this-threshold scans get pushed to Inngest. Smaller scans stay
 * synchronous because the network round-trip costs more than the work itself.
 */
export const BACKGROUND_THRESHOLD = 30;

export function isInngestEnabled(): boolean {
  // Inngest Dev Server doesn't require keys; production needs INNGEST_EVENT_KEY.
  // Treat as "enabled" whenever a base URL is present, since `pnpm stack:up`
  // wires the dev server at 127.0.0.1:8288.
  return Boolean(
    process.env.INNGEST_BASE_URL ?? process.env.INNGEST_EVENT_KEY,
  );
}

export const inngest = new Inngest({
  id: "validationkit",
  // The dev server picks this up automatically when INNGEST_BASE_URL is set.
});
