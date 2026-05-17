import { getEncoding, type Tiktoken } from "js-tiktoken";

let encoder: Tiktoken | null = null;
let encoderFailed = false;

function tryInit(): Tiktoken | null {
  if (encoder) return encoder;
  if (encoderFailed) return null;
  try {
    encoder = getEncoding("cl100k_base");
    return encoder;
  } catch {
    encoderFailed = true;
    return null;
  }
}

/**
 * Token-count using OpenAI's cl100k_base encoding (≈ same tokenizer Claude
 * uses for English prose; off by <8% for German per Anthropic 2025 guidance).
 * Falls back to char/3.5 if tiktoken init fails.
 */
export function countTokens(text: string): number {
  if (!text) return 0;
  const enc = tryInit();
  if (!enc) return Math.ceil(text.length / 3.5);
  try {
    return enc.encode(text).length;
  } catch {
    return Math.ceil(text.length / 3.5);
  }
}
