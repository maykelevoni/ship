import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 10_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  testMatch: /media-studio-geo-audit/,
});
