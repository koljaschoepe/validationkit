// Next.js calls register() once per server instance at startup, before any
// request is handled — the right place to fail-fast on a broken environment.
//
// Production: throw → the deploy/boot fails loudly instead of serving a broken
// app that 500s on the first DB/auth/Stripe touch.
// Dev: warn-only → a partial local env (no Stripe, no Inngest Cloud, …) still
// boots, matching the app's graceful-degradation gates.
export async function register(): Promise<void> {
  // Env validation only makes sense in the Node.js runtime (process.env, Buffer).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateEnv } = await import("./env");
  const problems = validateEnv();
  if (problems.length === 0) return;

  const detail = problems
    .map((p) => `  • ${p.key}: ${p.message}`)
    .join("\n");
  const header = `Environment validation: ${problems.length} problem${
    problems.length === 1 ? "" : "s"
  }`;

  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";
  if (isProd) {
    throw new Error(`${header} (fatal in production):\n${detail}`);
  }
  console.warn(`[env] ${header} (non-fatal in dev):\n${detail}`);
}
