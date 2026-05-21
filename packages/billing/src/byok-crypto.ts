// Sub-Plan-A — column-level AES-256-GCM for BYOK provider API keys.
// See ADR-0007 for key-rotation strategy. Env-var `BYOK_ENCRYPTION_KEY` must
// be a 32-byte (256-bit) key, base64-encoded. Encrypt-on-write, decrypt only
// when assembling provider clients. The plaintext never leaves the server.
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // GCM-recommended 96-bit IV
const KEY_BYTES = 32;

export interface EncryptedKey {
  ciphertext: string;
  iv: string;
  authTag: string;
}

function loadKey(): Buffer {
  const raw = process.env.BYOK_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "BYOK_ENCRYPTION_KEY is not set. Generate one with " +
        '`node -e "console.log(crypto.randomBytes(32).toString(\'base64\'))"`',
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `BYOK_ENCRYPTION_KEY must decode to exactly ${KEY_BYTES} bytes (got ${key.length}).`,
    );
  }
  return key;
}

export function encryptApiKey(plaintext: string): EncryptedKey {
  if (!plaintext) {
    throw new Error("encryptApiKey: plaintext must be non-empty.");
  }
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptApiKey(parts: EncryptedKey): string {
  const key = loadKey();
  const iv = Buffer.from(parts.iv, "base64");
  const authTag = Buffer.from(parts.authTag, "base64");
  const ciphertext = Buffer.from(parts.ciphertext, "base64");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function isByokConfigured(): boolean {
  return Boolean(process.env.BYOK_ENCRYPTION_KEY);
}
