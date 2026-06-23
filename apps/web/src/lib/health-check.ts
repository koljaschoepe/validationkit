import { sql } from "drizzle-orm";
import { getDb, isDbEnabled } from "@vk/db";
import { isInngestEnabled } from "@vk/inngest";

export type HealthStatus = "green" | "yellow" | "red" | "disabled";

export interface HealthSurface {
  name: string;
  status: HealthStatus;
  detail: string;
  latencyMs?: number;
  /** When status === "disabled", this surface is intentionally not wired
   *  yet (e.g. Stripe live-mode off). UI shows it greyed, not red. */
}

const HEAD_TIMEOUT_MS = 3_000;

async function timed<T>(
  fn: () => Promise<T>,
): Promise<{ value: T; ms: number }> {
  const t = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - t };
}

async function probeHead(url: string): Promise<HealthSurface> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEAD_TIMEOUT_MS);
    const t = Date.now();
    try {
      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-store",
      });
      const ms = Date.now() - t;
      if (res.ok || res.status === 405 || res.status === 404) {
        return {
          name: url,
          status: ms < 1000 ? "green" : "yellow",
          detail: `HTTP ${res.status} · ${ms}ms`,
          latencyMs: ms,
        };
      }
      return {
        name: url,
        status: "yellow",
        detail: `HTTP ${res.status} · ${ms}ms`,
        latencyMs: ms,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    return {
      name: url,
      status: "red",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function probeNeon(): Promise<HealthSurface> {
  if (!isDbEnabled()) {
    return {
      name: "Neon Postgres",
      status: "disabled",
      detail: "DATABASE_URL unset.",
    };
  }
  try {
    const db = getDb();
    const { ms } = await timed(async () => {
      await db.execute(sql`SELECT 1`);
    });
    return {
      name: "Neon Postgres",
      status: ms < 500 ? "green" : "yellow",
      detail: `SELECT 1 · ${ms}ms`,
      latencyMs: ms,
    };
  } catch (err) {
    return {
      name: "Neon Postgres",
      status: "red",
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function probeInngest(): Promise<HealthSurface> {
  if (!isInngestEnabled()) {
    return {
      name: "Inngest Cloud",
      status: "disabled",
      detail: "INNGEST_EVENT_KEY / INNGEST_BASE_URL unset.",
    };
  }
  const result = await probeHead("https://api.inngest.com/v1/");
  return { ...result, name: "Inngest Cloud" };
}

async function probeResend(): Promise<HealthSurface> {
  if (!process.env.RESEND_API_KEY) {
    return {
      name: "Resend Email",
      status: "disabled",
      detail: "RESEND_API_KEY unset.",
    };
  }
  const result = await probeHead("https://api.resend.com/");
  return { ...result, name: "Resend Email" };
}

async function probeStripe(): Promise<HealthSurface> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      name: "Stripe",
      status: "disabled",
      detail: "STRIPE_SECRET_KEY unset — live-mode paperwork in flight.",
    };
  }
  const result = await probeHead("https://api.stripe.com/v1/");
  return { ...result, name: "Stripe" };
}

async function probeGithub(): Promise<HealthSurface> {
  const result = await probeHead("https://api.github.com/zen");
  return { ...result, name: "GitHub API (public)" };
}

async function probeAnthropic(): Promise<HealthSurface> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      name: "Anthropic API",
      status: "disabled",
      detail:
        "ANTHROPIC_API_KEY unset — LLM rules emit the disabled placeholder.",
    };
  }
  const result = await probeHead("https://api.anthropic.com/");
  return { ...result, name: "Anthropic API" };
}

export async function probeAll(): Promise<HealthSurface[]> {
  return Promise.all([
    probeNeon(),
    probeInngest(),
    probeResend(),
    probeStripe(),
    probeAnthropic(),
    probeGithub(),
  ]);
}
