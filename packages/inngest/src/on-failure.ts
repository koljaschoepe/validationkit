/**
 * Shared Inngest `onFailure` handler factory.
 *
 * Inngest calls `onFailure` exactly once, after every retry of a function run
 * has been exhausted — the last-chance hook for a durable, structured record
 * of a hard failure. Today it logs to stderr (so the failure surfaces in the
 * Inngest dashboard + Vercel function logs instead of vanishing); it is also
 * the single place to wire `Sentry.captureException` once the DSN is
 * provisioned (see production-go-live Block 1/2).
 *
 * The handler must never throw — a throwing failure-handler would itself fail
 * and obscure the original error. All field access is defensive because the
 * functions are typed `any` and the failure payload shape varies by trigger.
 */
export function onFailureHandler(functionId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ error, event, runId }: any): Promise<void> => {
    try {
      const eventName =
        event?.name ?? event?.data?.event?.name ?? "unknown";
      const message =
        error instanceof Error ? error.message : String(error ?? "unknown");
      console.error(
        `[inngest:onFailure] ${functionId} exhausted all retries`,
        {
          functionId,
          event: eventName,
          runId: runId ?? null,
          error: message,
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
    } catch {
      // Never let the failure handler itself throw.
      console.error(`[inngest:onFailure] ${functionId} failed (unloggable)`);
    }
  };
}
