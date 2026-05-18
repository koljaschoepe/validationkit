import type { TierId } from "@vk/billing";

/**
 * Sprint 1.3 → 1.4 — in-memory rate-limiter. Sprint 1.4 extends with
 * tier-aware buckets so paid customers actually feel the upgrade.
 *
 * Bucket choice (per Phase-1 ADR-0020 + A5 pricing) — every limit is per
 * hour, sliding window:
 *
 *   anonymous     30/h        # IP-keyed, no signed-in user
 *   free          60/h        # signed-in, Solo Free
 *   solo_indie   200/h        # $25/mo
 *   solo_pro     500/h        # $79/mo
 *   agency_pro  1000/h        # $299/mo
 *   agency_scale       2000/h # $799/mo
 *   agency_scale_plus  5000/h # $1499/mo annual
 *
 * In-memory + per-region (Vercel Fluid Compute). Soft shape, not a hard
 * paywall — Phase 2 swaps to KV (Vercel KV / Upstash) when MRR justifies
 * the line-item. Until then a request can win/lose the bucket race
 * between regions on cold-start; acceptable for v0.0.19.
 */

export type LimitKey = "anonymous" | TierId;

const WINDOW_MS = 60 * 60 * 1000;

const LIMITS: Record<LimitKey, number> = {
  anonymous: 30,
  free: 60,
  solo_indie: 200,
  solo_pro: 500,
  agency_pro: 1000,
  agency_scale: 2000,
  agency_scale_plus: 5000,
};

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  limit: number;
  reason?: string;
}

function limitFor(key: LimitKey): number {
  return LIMITS[key] ?? LIMITS.anonymous;
}

/** Resolves a session/IP-keyed identifier + the tier bucket to charge. */
export interface RateLimitContext {
  /** Stable identifier used as the bucket key. Use `user:<id>` for signed-in,
   *  `ip:<addr>` for anonymous. */
  key: string;
  tier: LimitKey;
}

export function checkRateLimit(ctx: RateLimitContext): RateLimitResult {
  const limit = limitFor(ctx.tier);
  if (!ctx.key) {
    return { allowed: true, remaining: limit, resetSeconds: 0, limit };
  }
  const now = Date.now();
  const hits = (buckets.get(ctx.key) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  );
  if (hits.length >= limit) {
    const oldest = hits[0]!;
    const resetSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    buckets.set(ctx.key, hits);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
      limit,
      reason:
        ctx.tier === "anonymous"
          ? `Anonymous audits are limited to ${limit}/h. Sign in for ${LIMITS.free}/h on the free tier.`
          : `${ctx.tier} tier is capped at ${limit} audits/h. Resets in ~${Math.ceil(resetSeconds / 60)}m.`,
    };
  }
  hits.push(now);
  buckets.set(ctx.key, hits);
  return {
    allowed: true,
    remaining: limit - hits.length,
    resetSeconds: 0,
    limit,
  };
}

/**
 * Backwards-compat wrapper for Sprint 1.3 callers. Anonymous-only path.
 * New callers should use `checkRateLimit` with a tier-aware context.
 */
export function checkAnonymousRateLimit(ip: string): RateLimitResult {
  return checkRateLimit({ key: `ip:${ip}`, tier: "anonymous" });
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
