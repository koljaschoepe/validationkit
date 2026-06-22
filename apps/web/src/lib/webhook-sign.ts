import { createHmac, randomBytes } from "node:crypto";

const SECRET_PREFIX = "whsec_";

export function generateWebhookSecret(): string {
  return `${SECRET_PREFIX}${randomBytes(24).toString("base64url")}`;
}

/**
 * Stripe-style signature (Q-SB-2): the `X-VK-Signature` header value
 * `t=<unix>,v1=<hex>`, where v1 = HMAC-SHA256(secret, "<t>.<body>"). The
 * timestamp is part of the signed input, so a captured payload can't be
 * replayed past the receiver's tolerance window. `timestampSec` is a parameter
 * (not read from the clock here) so the signature is deterministic + testable.
 */
export function signWebhook(
  secret: string,
  body: string,
  timestampSec: number,
): string {
  const v1 = createHmac("sha256", secret)
    .update(`${timestampSec}.${body}`)
    .digest("hex");
  return `t=${timestampSec},v1=${v1}`;
}

/**
 * Basic SSRF guard for user-supplied webhook URLs: https-only and no loopback /
 * private / link-local / cloud-metadata hosts. This is a baseline (it can't
 * stop DNS rebinding or a public host that resolves to a private IP); combined
 * with `redirect: "manual"` + a short timeout in {@link postSignedWebhook} it
 * keeps the obvious holes closed for the MVP.
 */
export function isAllowedWebhookUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (host === "::1") return false;
  if (host === "169.254.169.254") return false; // cloud metadata endpoint
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  return true;
}

export interface WebhookPostResult {
  ok: boolean;
  status: number | null;
  error?: string;
}

/**
 * Sign + POST a body to a webhook endpoint. Used by both the synchronous
 * test-ping and the background deliver worker. Never follows redirects (SSRF)
 * and aborts after `timeoutMs`. Returns the outcome; the caller persists the
 * status + decides whether to retry.
 */
export async function postSignedWebhook(
  url: string,
  secret: string,
  body: string,
  timeoutMs = 8000,
): Promise<WebhookPostResult> {
  const ts = Math.floor(Date.now() / 1000);
  const signature = signWebhook(secret, body, ts);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-vk-signature": signature,
        "user-agent": "validationkit-webhook/1.0",
      },
      body,
      redirect: "manual",
      signal: controller.signal,
    });
    return {
      ok: res.ok,
      status: res.status,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    const e = err as Error;
    const msg =
      e?.name === "AbortError"
        ? `Timeout (${timeoutMs} ms)`
        : (e?.message ?? "fetch failed");
    return { ok: false, status: null, error: msg };
  } finally {
    clearTimeout(timer);
  }
}
