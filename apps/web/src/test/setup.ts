// Global vitest setup — runs once per worker thread before the test files.
//
// 1. Load .env.test so DATABASE_URL, AUTH_SECRET, STRIPE_* are populated
//    BEFORE any module under test imports its env-config.
// 2. Boot the msw server with `onUnhandledRequest: "error"` — unmocked
//    HTTPS calls become loud test-failures, not silent hangs.

import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, "../../../../.env.test"), quiet: true });

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
