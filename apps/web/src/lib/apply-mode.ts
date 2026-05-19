// Pure helpers, NOT a "use server" file — both client (Inspector) and DAL
// import these.

export type ApplyMode = 'pr' | 'direct' | 'local';

/**
 * Resolve the effective apply-mode for a given (customer, repo) pair.
 * Priority:
 *   1. repo.applyMode if it's a valid concrete mode ('pr' | 'direct').
 *   2. customer.defaultApplyMode if it's valid.
 *   3. 'pr' as the safe default.
 *
 * The returned mode is then downgraded by the caller if GitHub-App isn't
 * configured (→ 'local' fallback). This function only resolves *intent*.
 */
export function resolveApplyMode(
  customerDefault: string | null | undefined,
  repoOverride: string | null | undefined,
): 'pr' | 'direct' {
  const r = (repoOverride ?? '').toLowerCase();
  if (r === 'pr' || r === 'direct') return r;
  const c = (customerDefault ?? '').toLowerCase();
  if (c === 'pr' || c === 'direct') return c;
  return 'pr';
}

/**
 * Server-side check whether the GitHub App is fully configured. Used to
 * decide whether to fall back to LocalGitClient.
 */
export function isGitHubAppConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(
    env.GITHUB_APP_ID &&
      env.GITHUB_APP_CLIENT_ID &&
      env.GITHUB_APP_PRIVATE_KEY,
  );
}

/** Snooze-Duration → absolute expiry. `forever` maps to year 9999. */
export function snoozeDurationToDate(
  key: '24h' | '7d' | 'forever',
  now: Date = new Date(),
): Date {
  if (key === '24h') return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (key === '7d') return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return new Date('9999-12-31T00:00:00Z');
}

export const DISMISS_REASONS = [
  'false-positive',
  'acceptable-risk',
  'wont-fix',
] as const;
export type DismissReason = (typeof DISMISS_REASONS)[number];

export function isValidDismissReason(s: string): s is DismissReason {
  return (DISMISS_REASONS as readonly string[]).includes(s);
}
