import { defineConfig, devices } from '@playwright/test';

/**
 * a11y harness (Block E) — axe-core over critical public routes.
 *
 * Run with `pnpm a11y` (once: `pnpm exec playwright install chromium`). It is
 * deliberately kept out of the vitest unit suite + the tsc project — the spec
 * lives under `tests/` (outside `src/`), so it never blocks the normal gate.
 * Wire it as its own CI job. Point at a deployed preview with A11Y_BASE_URL to
 * skip the local dev server.
 */
export default defineConfig({
  testDir: './tests/a11y',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: process.env.A11Y_BASE_URL ?? 'http://localhost:3000',
  },
  webServer: process.env.A11Y_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
