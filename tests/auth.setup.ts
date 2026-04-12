import { test as setup, expect } from "@playwright/test";
import path from "path";

export const AUTH_FILE = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL ?? "test@example.com";
  const password = process.env.TEST_USER_PASSWORD ?? "password123";

  await page.goto("/login");
  // Use "load" — SSE connections keep the network active indefinitely
  await page.waitForLoadState("load");

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait until we leave the login page (redirect to dashboard)
  await page
    .waitForURL((url) => !url.toString().includes("/login"), { timeout: 15000 })
    .catch(() => {});

  // Verify we're actually authenticated
  const stillOnLogin = page.url().includes("/login");
  if (stillOnLogin) {
    throw new Error(
      "Auth setup failed — still on /login after sign-in. Check TEST_USER_EMAIL/TEST_USER_PASSWORD.",
    );
  }

  await page.context().storageState({ path: AUTH_FILE });
});
