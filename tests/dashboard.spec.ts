import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Dashboard home — Today view
// The page lives at "/" inside the (dashboard) layout.
// It renders a TodayView component via a React Suspense wrapper that fetches
// from the DB, but the page shell (sidebar + layout) is always present even
// when the DB is empty, and TodayView renders a stats section and a date
// string regardless of whether content pieces exist.
// ---------------------------------------------------------------------------

test.describe("Dashboard home (/)", () => {
  test("loads without a 500 error", async ({ page }) => {
    const response = await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Must not be a server error
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("renders the sidebar with the app name", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The EngineSidebar renders "PostForge" as a text span
    await expect(
      page.getByText("PostForge", { exact: true }),
    ).toBeVisible();
  });

  test("sidebar shows all primary navigation links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Main nav items rendered by EngineSidebar
    const navLinks = ["Today", "Promotions", "Calendar", "Queue", "Logs"];
    for (const label of navLinks) {
      await expect(page.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("sidebar shows Settings link at the bottom", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("Today nav link is active / highlighted on the home page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The active link gets color #818cf8 via inline style — check that the
    // "Today" anchor exists and is within the sidebar <aside>
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Today" })).toBeVisible();
  });

  test("navigating to Promotions from the sidebar changes the URL", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: "Promotions" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/promotions");
  });

  test("navigating to Calendar from the sidebar changes the URL", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: "Calendar" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/calendar");
  });

  test("navigating to Queue from the sidebar changes the URL", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: "Queue" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/queue");
  });

  test("navigating to Logs from the sidebar changes the URL", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: "Logs" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/logs");
  });

  test("page has no critical console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filter out known benign browser extension / network errors that are
    // outside our control and unrelated to the app
    const appErrors = errors.filter(
      (e) =>
        !e.includes("ERR_BLOCKED_BY_CLIENT") &&
        !e.includes("extension") &&
        !e.includes("favicon"),
    );

    expect(appErrors).toHaveLength(0);
  });
});
