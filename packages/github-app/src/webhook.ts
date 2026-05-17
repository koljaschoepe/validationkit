import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  InstallationEvent,
  InstallationRepositoriesEvent,
  ParsedWebhook,
} from "./types.js";

/**
 * Verify the GitHub webhook signature against the configured secret.
 *
 * GitHub sends two headers:
 *   - `x-hub-signature` (legacy SHA-1) — DO NOT USE for verification.
 *   - `x-hub-signature-256` — SHA-256, the canonical header. We only verify this one.
 *
 * Pass the *raw* request body (not parsed JSON) — even a whitespace difference
 * invalidates the signature.
 */
export function verifyWebhookSignature(args: {
  rawBody: string | Buffer;
  signature256: string | null | undefined;
  secret: string;
}): boolean {
  if (!args.signature256 || !args.secret) return false;
  if (!args.signature256.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", args.secret)
    .update(args.rawBody)
    .digest("hex");
  const provided = args.signature256.slice("sha256=".length);

  if (expected.length !== provided.length) return false;

  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(provided, "hex"),
  );
}

/**
 * Parse the JSON payload into a typed event we care about, or mark it ignored.
 * Caller should verify the signature with `verifyWebhookSignature` first.
 */
export function parseWebhookEvent(
  eventName: string,
  payload: Record<string, unknown>,
): ParsedWebhook {
  if (eventName === "installation") {
    return { kind: "installation", event: toInstallationEvent(payload) };
  }
  if (eventName === "installation_repositories") {
    return {
      kind: "installation_repositories",
      event: toInstallationRepositoriesEvent(payload),
    };
  }
  return {
    kind: "ignored",
    eventName,
    action:
      typeof payload.action === "string" ? payload.action : undefined,
  };
}

function toInstallationEvent(p: Record<string, unknown>): InstallationEvent {
  const installation = (p.installation as Record<string, unknown>) ?? {};
  const account = (installation.account as Record<string, unknown>) ?? {};
  const sender = (p.sender as Record<string, unknown>) ?? {};
  return {
    action: (p.action as InstallationEvent["action"]) ?? "created",
    installationId: Number(installation.id ?? 0),
    accountLogin: String(account.login ?? ""),
    repositories: extractRepoList(p.repositories),
    sender: { login: String(sender.login ?? "") },
  };
}

function toInstallationRepositoriesEvent(
  p: Record<string, unknown>,
): InstallationRepositoriesEvent {
  const installation = (p.installation as Record<string, unknown>) ?? {};
  const account = (installation.account as Record<string, unknown>) ?? {};
  return {
    action:
      (p.action as InstallationRepositoriesEvent["action"]) ?? "added",
    installationId: Number(installation.id ?? 0),
    accountLogin: String(account.login ?? ""),
    added: extractRepoList(p.repositories_added),
    removed: extractRepoList(p.repositories_removed),
  };
}

function extractRepoList(
  raw: unknown,
): Array<{ id: number; fullName: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => ({
      id: Number(r.id ?? 0),
      fullName: String(r.full_name ?? ""),
    }));
}
