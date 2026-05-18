/**
 * Sprint 1.3 — anonymous-audit rate-limiter.
 *
 * In-memory sliding-window. Keyed by client IP (Vercel + Cloudflare headers).
 * Authenticated users bypass entirely. The cap is deliberately generous
 * (30/h) — abusive traffic patterns get caught earlier by Vercel Edge
 * shield + the in-handler-defense is the second line.
 *
 * Why not Vercel KV / Upstash? Sprint 1.3 budget = $0 (per ADR-0020). An
 * in-memory map is correct-but-per-region; we'd lose data on cold-start.
 * Acceptable for v0.0.18 because the IP cap is a soft-shape, not a hard
 * paywall. Phase 2 swaps to KV when MRR justifies the line-item.
 */

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT_PER_WINDOW = 30;

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  reason?: string;
}

export function checkAnonymousRateLimit(key: string): RateLimitResult {
  if (!key) {
    return { allowed: true, remaining: LIMIT_PER_WINDOW, resetSeconds: 0 };
  }
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );
  if (hits.length >= LIMIT_PER_WINDOW) {
    const oldest = hits[0]!;
    const resetSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    buckets.set(key, hits);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      reason: `Anonymous audits are limited to ${LIMIT_PER_WINDOW} per hour. Sign in for unlimited audits on the free tier (still 1 saved repo).`,
    };
  }
  hits.push(now);
  buckets.set(key, hits);
  return {
    allowed: true,
    remaining: LIMIT_PER_WINDOW - hits.length,
    resetSeconds: 0,
  };
}

export function ipFromHeaders(
  hdrs: { get(name: string): string | null },
): string {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("cf-connecting-ip") ??
    hdrs.get("x-real-ip") ??
    "anonymous-no-ip"
  );
}
