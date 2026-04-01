import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/pipeline-*.spec.ts"],
  timeout: 120_000,
  retries: 0,
  fullyParallel: false,
  reporter: "list",

  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    channel: "chrome",
    trace: "on",
    video: "on",
    screenshot: "on",
  },

  projects: [
    {
      name: "chrome-headed",
      use: { ...devices["Desktop Chrome"], headless: false, channel: "chrome" },
    },
  ],

  webServer: {
    command: "pnpm next dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
