// Boot-time environment validation (Bundle C). Hand-rolled, no zod dependency.
//
// Why: 25+ process.env reads across the repo use `?? fallback` or `as string`
// casts, so a missing production var doesn't crash at deploy — it silently
// becomes undefined and blows up at the FIRST request that touches it (e.g.
// Better-Auth booting with an empty secret, or the Stripe webhook with no
// signing secret). This module fails fast at server startup instead, with a
// clear aggregated message of everything that's wrong.
//
// Philosophy: the app degrades gracefully in dev (no DB / no Stripe / no
// Inngest), so dev is warn-only (see instrumentation.ts). The strict throw only
// fires in production. "Feature on ⇒ its deps required" holds in both.

export interface EnvProblem {
  key: string;
  message: string;
}

function isUrl(v: string | undefined): boolean {
  if (!v) return false;
  try {
    void new URL(v);
    return true;
  } catch {
    return false;
  }
}

function isBase64Bytes(v: string, bytes: number): boolean {
  try {
    return Buffer.from(v, "base64").length === bytes;
  } catch {
    return false;
  }
}

/** Validate process.env. Returns the list of problems (empty = all good). */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const isProd =
    env.VERCEL_ENV === "production" || env.NODE_ENV === "production";

  // --- Always required (any deploy, local or prod) ---
  if (!env.DATABASE_URL) {
    problems.push({
      key: "DATABASE_URL",
      message: "required — Postgres connection string",
    });
  }
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 16) {
    problems.push({
      key: "AUTH_SECRET",
      message: "required — ≥16-char session secret (openssl rand -base64 32)",
    });
  }
  if (!isUrl(env.AUTH_BASE_URL)) {
    problems.push({
      key: "AUTH_BASE_URL",
      message: "required — must be a valid URL",
    });
  }
  if (!isUrl(env.NEXT_PUBLIC_APP_URL)) {
    problems.push({
      key: "NEXT_PUBLIC_APP_URL",
      message: "required — must be a valid URL",
    });
  }

  // --- Conditional: a feature being ON makes its deps required ---
  // Stripe: a secret key without the webhook secret means every webhook 400s
  // on signature verification (lost subscription state / money).
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_WEBHOOK_SECRET) {
    problems.push({
      key: "STRIPE_WEBHOOK_SECRET",
      message: "required when STRIPE_SECRET_KEY is set",
    });
  }
  // Inngest Cloud (event-key path, no local dev base URL) MUST have a signing
  // key — without it the serve endpoint accepts unsigned requests (open audit
  // trigger). Closes the Bundle-C inngest-route signingKey gap.
  if (
    env.INNGEST_EVENT_KEY &&
    !env.INNGEST_BASE_URL &&
    !env.INNGEST_SIGNING_KEY
  ) {
    problems.push({
      key: "INNGEST_SIGNING_KEY",
      message:
        "required for Inngest Cloud — without it the serve endpoint accepts unsigned requests",
    });
  }
  // BYOK encryption key, if present, must be a valid 32-byte (AES-256) key.
  if (env.BYOK_ENCRYPTION_KEY && !isBase64Bytes(env.BYOK_ENCRYPTION_KEY, 32)) {
    problems.push({
      key: "BYOK_ENCRYPTION_KEY",
      message: "must be 32 bytes, base64-encoded",
    });
  }

  // --- Production-only: features the live product can't run without ---
  if (isProd) {
    // Magic-link auth needs an email transport. Without one nobody can sign in.
    if (!env.RESEND_API_KEY && !env.SMTP_HOST) {
      problems.push({
        key: "RESEND_API_KEY | SMTP_HOST",
        message:
          "production needs an email transport for magic-link sign-in (set RESEND_API_KEY or SMTP_HOST)",
      });
    }
  }

  return problems;
}

/** Throw a single aggregated error if the environment is invalid. */
export function assertEnv(env: NodeJS.ProcessEnv = process.env): void {
  const problems = validateEnv(env);
  if (problems.length === 0) return;
  const lines = problems.map((p) => `  • ${p.key}: ${p.message}`).join("\n");
  throw new Error(
    `Environment validation failed (${problems.length} problem${
      problems.length === 1 ? "" : "s"
    }):\n${lines}`,
  );
}
