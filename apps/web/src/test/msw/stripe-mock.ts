// Helper to construct a signed Stripe-webhook payload that matches what
// `stripe.webhooks.constructEvent` expects. Mirrors Stripe-CLI behaviour
// (`stripe trigger`) so the route handler doesn't know it's being tested.
//
// Stripe-Signature header format:
//   t=<unix-ts>,v1=<hmac-sha256 of `${ts}.${rawBody}` with whsec_>

import crypto from "node:crypto";

export interface MockStripeEvent {
  id?: string;
  type: string;
  data: { object: Record<string, unknown> };
}

const DEFAULT_SECRET = "whsec_test_secret_for_signing_payloads";

export function signStripeEvent(
  event: MockStripeEvent,
  secret: string = DEFAULT_SECRET,
  timestampSeconds = Math.floor(Date.now() / 1000),
): { body: string; signature: string } {
  const payload: Record<string, unknown> = {
    id: event.id ?? `evt_test_${crypto.randomBytes(8).toString("hex")}`,
    object: "event",
    api_version: "2026-04-22.dahlia",
    created: timestampSeconds,
    livemode: false,
    type: event.type,
    data: event.data,
  };
  const body = JSON.stringify(payload);
  const signedPayload = `${timestampSeconds}.${body}`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");
  const signature = `t=${timestampSeconds},v1=${hmac}`;
  return { body, signature };
}
