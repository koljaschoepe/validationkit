// MSW request handlers for outbound network calls during tests.
//
// Add handlers per upstream service. Each test-file can override these via
// `server.use(...)` for case-specific responses; the default handler is
// what unmocked tests get.
//
// Stripe webhook signature verification happens inside the route handler
// against a known STRIPE_WEBHOOK_SECRET (from .env.test), not msw. So
// outbound Stripe calls (subscriptions.update, invoiceItems.create, …)
// route through here.

import { http, HttpResponse } from "msw";

export const handlers = [
  // ----- Stripe ----- ------------------------------------------------------
  http.get("https://api.stripe.com/v1/customers/:id", () =>
    HttpResponse.json({
      id: "cus_test_default",
      email: "test@validationkit.local",
      object: "customer",
    }),
  ),

  http.post("https://api.stripe.com/v1/checkout/sessions", () =>
    HttpResponse.json({
      id: "cs_test_default",
      object: "checkout.session",
      url: "https://checkout.stripe.com/c/pay/cs_test_default",
    }),
  ),

  http.post("https://api.stripe.com/v1/billing/meter_events", () =>
    HttpResponse.json({
      identifier: "evt_meter_default",
      event_name: "audit_credit_overage",
      object: "billing.meter_event",
    }),
  ),

  // ----- Anthropic ----- ---------------------------------------------------
  http.post("https://api.anthropic.com/v1/messages", () =>
    HttpResponse.json({
      id: "msg_test_default",
      type: "message",
      role: "assistant",
      content: [{ type: "text", text: "msw-mock-response" }],
      model: "claude-sonnet-4-6",
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
    }),
  ),

  // ----- GitHub App ----- --------------------------------------------------
  http.get(
    "https://api.github.com/app/installations/:id/access_tokens",
    () =>
      HttpResponse.json({
        token: "ghs_test_installation_token",
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      }),
  ),

  // Catch-all for unknown github.com routes — returns 404 so tests fail
  // loudly instead of hanging on a real network call.
  http.get("https://api.github.com/*", ({ request }) =>
    HttpResponse.json(
      { message: `unmocked github GET: ${request.url}` },
      { status: 404 },
    ),
  ),
];
