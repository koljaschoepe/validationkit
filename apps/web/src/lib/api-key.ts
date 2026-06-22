import { createHash, randomBytes } from "node:crypto";

/**
 * API-key token format (Q-SB-1): `vk_<base64url>`. The plaintext is shown to
 * the user exactly once at creation; only its SHA-256 hash is persisted. A
 * single recognizable prefix (no live/test split — keys are workspace-scoped,
 * not mode-scoped) so secret scanners can spot a leaked key.
 */
const TOKEN_PREFIX = "vk_";

export interface GeneratedApiKey {
  /** Full plaintext token — returned once, never stored. */
  token: string;
  /** SHA-256 hex of the token — what we store + look up by. */
  tokenHash: string;
  /** Display-only recognizable prefix, e.g. "vk_a1b2c3d4". */
  tokenPrefix: string;
  /** Last 4 chars of the token, display-only. */
  last4: string;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiKey(): GeneratedApiKey {
  const secret = randomBytes(24).toString("base64url");
  const token = `${TOKEN_PREFIX}${secret}`;
  return {
    token,
    tokenHash: hashToken(token),
    tokenPrefix: token.slice(0, 11), // "vk_" + first 8 chars
    last4: token.slice(-4),
  };
}
