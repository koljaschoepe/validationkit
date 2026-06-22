import { describe, expect, it } from "vitest";
import {
  generateWebhookSecret,
  signWebhook,
  isAllowedWebhookUrl,
} from "./webhook-sign";

describe("webhook-sign", () => {
  it("signs Stripe-style t=,v1= and is deterministic on (secret, body, ts)", () => {
    const sig = signWebhook("whsec_test", '{"a":1}', 1700000000);
    expect(sig).toMatch(/^t=1700000000,v1=[a-f0-9]{64}$/);
    expect(signWebhook("whsec_test", '{"a":1}', 1700000000)).toBe(sig);
    // every input affects the signature
    expect(signWebhook("whsec_other", '{"a":1}', 1700000000)).not.toBe(sig);
    expect(signWebhook("whsec_test", '{"a":2}', 1700000000)).not.toBe(sig);
    expect(signWebhook("whsec_test", '{"a":1}', 1700000001)).not.toBe(sig);
  });

  it("generates whsec_-prefixed secrets", () => {
    expect(generateWebhookSecret()).toMatch(/^whsec_[A-Za-z0-9_-]+$/);
  });

  it("allows public https, blocks loopback/private/metadata/non-https", () => {
    expect(isAllowedWebhookUrl("https://example.com/h")).toBe(true);
    expect(isAllowedWebhookUrl("http://example.com/h")).toBe(false);
    expect(isAllowedWebhookUrl("https://localhost/h")).toBe(false);
    expect(isAllowedWebhookUrl("https://127.0.0.1/h")).toBe(false);
    expect(isAllowedWebhookUrl("https://10.0.0.5/h")).toBe(false);
    expect(isAllowedWebhookUrl("https://192.168.1.1/h")).toBe(false);
    expect(isAllowedWebhookUrl("https://172.16.0.1/")).toBe(false);
    expect(isAllowedWebhookUrl("https://169.254.169.254/")).toBe(false);
    expect(isAllowedWebhookUrl("not-a-url")).toBe(false);
  });
});
