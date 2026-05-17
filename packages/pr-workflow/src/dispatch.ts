import {
  AccessDeniedError,
  enforceAccess,
  type RepoAccess,
} from "./access.js";
import type { PRClient, PRDispatchInput, PRDispatchResult } from "./types.js";

export interface DispatchOptions {
  client: PRClient;
  access: RepoAccess;
  input: PRDispatchInput;
}

/**
 * The only sanctioned way to send a PR. Wraps access enforcement (read-only
 * default per docs/legal/scope-policy.md) around the client call.
 *
 * Throws AccessDeniedError when write isn't granted — callers should surface
 * the error and prompt the user to request write via the
 * Requester→Approver-Bridge.
 */
export async function dispatchPR(
  opts: DispatchOptions,
): Promise<PRDispatchResult> {
  enforceAccess(opts.access);
  return opts.client.dispatch(opts.input);
}

export { AccessDeniedError };
