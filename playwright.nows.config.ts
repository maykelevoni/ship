import { defineConfig, devices } from "@playwright/test";

/**
 * Config for running tests against an already-running dev server.
 * Use this when `pnpm dev` is already running on localhost:3000.
 *
 * Usage: npx playwright test --config=playwright.nows.config.ts
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1,
  fullyParallel: true,
  reporter: "list",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Reuse existing saved session — run auth.setup.ts separately if needed
        storageState: ".auth/user.json",
      },
    },
  ],
  // No webServer block — assumes dev server is already running
});
