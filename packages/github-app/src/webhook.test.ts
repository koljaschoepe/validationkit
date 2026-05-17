import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseWebhookEvent, verifyWebhookSignature } from "./webhook.js";

const SECRET = "test-secret-do-not-use";

function sign(body: string): string {
  return "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  it("accepts a correctly signed payload", () => {
    const body = '{"hello":"world"}';
    const ok = verifyWebhookSignature({
      rawBody: body,
      signature256: sign(body),
      secret: SECRET,
    });
    expect(ok).toBe(true);
  });

  it("rejects when the body has been tampered with", () => {
    const body = '{"hello":"world"}';
    const sig = sign(body);
    const ok = verifyWebhookSignature({
      rawBody: body + " ",
      signature256: sig,
      secret: SECRET,
    });
    expect(ok).toBe(false);
  });

  it("rejects when the signature header is missing", () => {
    expect(
      verifyWebhookSignature({
        rawBody: "{}",
        signature256: null,
        secret: SECRET,
      }),
    ).toBe(false);
    expect(
      verifyWebhookSignature({
        rawBody: "{}",
        signature256: undefined,
        secret: SECRET,
      }),
    ).toBe(false);
  });

  it("rejects when the signature header lacks the sha256= prefix", () => {
    const body = "{}";
    const naked = createHmac("sha256", SECRET).update(body).digest("hex");
    expect(
      verifyWebhookSignature({
        rawBody: body,
        signature256: naked,
        secret: SECRET,
      }),
    ).toBe(false);
  });

  it("rejects when the secret is empty", () => {
    const body = "{}";
    expect(
      verifyWebhookSignature({
        rawBody: body,
        signature256: sign(body),
        secret: "",
      }),
    ).toBe(false);
  });
});

describe("parseWebhookEvent", () => {
  it("parses installation.created", () => {
    const payload = {
      action: "created",
      installation: { id: 42, account: { login: "acme" } },
      repositories: [{ id: 1, full_name: "acme/repo-a" }],
      sender: { login: "lena" },
    };
    const parsed = parseWebhookEvent("installation", payload);
    if (parsed.kind !== "installation") throw new Error("wrong kind");
    expect(parsed.event.action).toBe("created");
    expect(parsed.event.installationId).toBe(42);
    expect(parsed.event.repositories[0]?.fullName).toBe("acme/repo-a");
  });

  it("parses installation_repositories.added", () => {
    const payload = {
      action: "added",
      installation: { id: 7, account: { login: "acme" } },
      repositories_added: [{ id: 2, full_name: "acme/repo-b" }],
      repositories_removed: [],
    };
    const parsed = parseWebhookEvent("installation_repositories", payload);
    if (parsed.kind !== "installation_repositories") {
      throw new Error("wrong kind");
    }
    expect(parsed.event.action).toBe("added");
    expect(parsed.event.added[0]?.fullName).toBe("acme/repo-b");
  });

  it("returns 'ignored' for unrelated events", () => {
    const parsed = parseWebhookEvent("push", { ref: "refs/heads/main" });
    expect(parsed.kind).toBe("ignored");
  });
});
