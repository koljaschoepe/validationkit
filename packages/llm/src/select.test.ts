import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isLlmEnabled, selectModel } from "./select.js";

const prevAnthropic = process.env.ANTHROPIC_API_KEY;
const prevOpenAi = process.env.OPENAI_API_KEY;

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

afterEach(() => {
  if (prevAnthropic === undefined) {
    delete process.env.ANTHROPIC_API_KEY;
  } else {
    process.env.ANTHROPIC_API_KEY = prevAnthropic;
  }
  if (prevOpenAi === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = prevOpenAi;
  }
});

describe("selectModel — happy path", () => {
  it("quick + OPENAI_API_KEY → gpt-5-nano on OpenAI", () => {
    process.env.OPENAI_API_KEY = "sk-test-openai";
    const sel = selectModel({ intensity: "quick" });
    expect(sel?.provider).toBe("openai");
    expect(sel?.modelId).toBe("gpt-5-nano");
    expect(sel?.maxOutputTokens).toBe(4096);
  });

  it("deep + ANTHROPIC_API_KEY → claude-sonnet-4-6 on Anthropic", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const sel = selectModel({ intensity: "deep" });
    expect(sel?.provider).toBe("anthropic");
    expect(sel?.modelId).toBe("claude-sonnet-4-6");
    expect(sel?.maxOutputTokens).toBe(8192);
  });
});

describe("selectModel — fallbacks", () => {
  it("deep + only OPENAI_API_KEY → gpt-5-nano fallback (degraded quality but functional)", () => {
    process.env.OPENAI_API_KEY = "sk-openai";
    const sel = selectModel({ intensity: "deep" });
    expect(sel?.provider).toBe("openai");
    expect(sel?.modelId).toBe("gpt-5-nano");
    // Intensity-driven maxOutputTokens stays at deep, even on fallback model.
    expect(sel?.maxOutputTokens).toBe(8192);
  });

  it("quick + only ANTHROPIC_API_KEY → Sonnet fallback", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant";
    const sel = selectModel({ intensity: "quick" });
    expect(sel?.provider).toBe("anthropic");
    expect(sel?.modelId).toBe("claude-sonnet-4-6");
  });
});

describe("selectModel — disabled", () => {
  it("returns null when both keys are absent (Hardcore-Local-Only)", () => {
    expect(selectModel({ intensity: "quick" })).toBeNull();
    expect(selectModel({ intensity: "deep" })).toBeNull();
    expect(isLlmEnabled()).toBe(false);
  });
});

describe("selectModel — BYOK", () => {
  it("BYOK Anthropic key overrides built-in selection", () => {
    process.env.OPENAI_API_KEY = "sk-built-in";
    const sel = selectModel({
      intensity: "deep",
      byok: { provider: "anthropic", apiKey: "sk-ant-byok" },
    });
    expect(sel?.provider).toBe("anthropic");
    expect(sel?.apiKey).toBe("sk-ant-byok");
    expect(sel?.modelId).toBe("claude-sonnet-4-6");
  });

  it("BYOK OpenAI key on Quick → gpt-5-nano with the user's key", () => {
    process.env.ANTHROPIC_API_KEY = "sk-built-in-anth";
    const sel = selectModel({
      intensity: "quick",
      byok: { provider: "openai", apiKey: "sk-openai-byok" },
    });
    expect(sel?.provider).toBe("openai");
    expect(sel?.apiKey).toBe("sk-openai-byok");
    expect(sel?.modelId).toBe("gpt-5-nano");
  });
});
