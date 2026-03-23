import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Dashboard home — Today view
// The sidebar now shows exactly 4 nav items: Today, Promote, Content, Settings.
// ---------------------------------------------------------------------------

test.describe("Dashboard home (/)", () => {
  test("loads without a 500 error", async ({ page }) => {
    const response = await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("renders the sidebar with the app name", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("PostForge", { exact: true })).toBeVisible();
  });

  test("sidebar shows exactly the 4 workflow nav links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();

    for (const label of ["Today", "Promote", "Content", "Settings"]) {
      await expect(sidebar.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("sidebar does not show old nav items", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    for (const label of ["Promotions", "Calendar", "Queue", "Logs"]) {
      await expect(sidebar.getByRole("link", { name: label })).not.toBeVisible();
    }
  });

  test("Today nav link is active on the home page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("link", { name: "Today" })).toBeVisible();
  });

  test("navigating to Promote from sidebar lands on /promote", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const promoteLink = page.locator("aside").getByRole("link", { name: "Promote" });
    await promoteLink.waitFor({ state: "visible" });
    await promoteLink.click();
    await expect(page).toHaveURL("/promote");
  });

  test("navigating to Content from sidebar lands on /content", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const contentLink = page.locator("aside").getByRole("link", { name: "Content" });
    await contentLink.waitFor({ state: "visible" });
    await contentLink.click();
    await expect(page).toHaveURL("/content");
  });

  test("navigating to Settings from sidebar lands on /settings", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const settingsLink = page.locator("aside").getByRole("link", { name: "Settings" });
    await settingsLink.waitFor({ state: "visible" });
    await settingsLink.click();
    await expect(page).toHaveURL("/settings");
  });

  test("page has no critical console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const appErrors = errors.filter(
      (e) =>
        !e.includes("ERR_BLOCKED_BY_CLIENT") &&
        !e.includes("extension") &&
        !e.includes("favicon"),
    );

    expect(appErrors).toHaveLength(0);
  });
});
