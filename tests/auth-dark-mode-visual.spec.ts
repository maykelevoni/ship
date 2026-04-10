import { test, expect } from "@playwright/test";

// Visual test to show the auth pages with dark mode
test.describe("Auth Pages Dark Mode Visual", () => {
  test("Login page with dark mode", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Wait a bit for any animations
    await page.waitForTimeout(2000);

    // Keep the page open for visual inspection
    expect(await page.screenshot()).toMatchSnapshot("login-dark.png");
  });

  test("Register page with dark mode", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    // Wait a bit for any animations
    await page.waitForTimeout(2000);

    // Keep the page open for visual inspection
    expect(await page.screenshot()).toMatchSnapshot("register-dark.png");
  });
});
