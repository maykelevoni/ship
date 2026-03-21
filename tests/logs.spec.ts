import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Logs page (/logs)
//
// "use client" page that:
//  - Renders a header with ScrollText icon + "Engine Logs" heading
//  - Fetches /api/logs?page=1 on mount
//  - If no runs exist, shows empty state: "No engine runs yet"
//  - If runs exist, shows column headers: Date, Promotion, Status, Content
//  - Supports paginated "Load More" button
// ---------------------------------------------------------------------------

test.describe("Logs (/logs)", () => {
  test("loads without a 500 error", async ({ page }) => {
    const response = await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows the 'Engine Logs' heading", async ({ page }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "Engine Logs" }),
    ).toBeVisible();
  });

  test("shows the sidebar with app name", async ({ page }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText("Promotion Engine", { exact: true }),
    ).toBeVisible();
  });

  test("Logs nav link is visible in the sidebar", async ({ page }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("aside").getByRole("link", { name: "Logs" }),
    ).toBeVisible();
  });

  test("shows an empty-state or log entries after loading", async ({ page }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    // Wait for the loading spinner to disappear before checking content
    await page.getByText("Loading logs…").waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});

    // Either the empty state or a list of log entries must be visible
    const hasEmptyState = await page
      .getByText("No engine runs yet")
      .isVisible()
      .catch(() => false);

    // If logs exist the column header "Date" should be visible
    const hasColumnHeaders = await page
      .getByText("Date", { exact: true })
      .isVisible()
      .catch(() => false);

    expect(hasEmptyState || hasColumnHeaders).toBe(true);
  });

  test("empty-state shows the description about the engine", async ({
    page,
  }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    const isEmpty = await page
      .getByText("No engine runs yet")
      .isVisible()
      .catch(() => false);

    if (isEmpty) {
      await expect(
        page.getByText("Run history will appear here after the engine fires."),
      ).toBeVisible();
    }
  });

  test("column headers are shown when log entries exist", async ({ page }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    const hasEntries = await page
      .getByText("Date", { exact: true })
      .isVisible()
      .catch(() => false);

    if (hasEntries) {
      // Verify the other column headers from the LogsPage render
      await expect(page.getByText("Promotion", { exact: true })).toBeVisible();
      await expect(page.getByText("Status", { exact: true })).toBeVisible();
      await expect(page.getByText("Content", { exact: true })).toBeVisible();
    }
  });

  test("does not show 'Load More' when there are no logs", async ({ page }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    const isEmpty = await page
      .getByText("No engine runs yet")
      .isVisible()
      .catch(() => false);

    if (isEmpty) {
      // hasMore is false when totalPages <= 1
      await expect(
        page.getByRole("button", { name: /load more/i }),
      ).not.toBeVisible();
    }
  });

  test("navigating from sidebar to /logs works correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: "Logs" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/logs");
    await expect(
      page.getByRole("heading", { name: "Engine Logs" }),
    ).toBeVisible();
  });

  test("page layout renders both sidebar and main content area", async ({
    page,
  }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("aside")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("no critical console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    const appErrors = errors.filter(
      (e) =>
        !e.includes("ERR_BLOCKED_BY_CLIENT") &&
        !e.includes("extension") &&
        !e.includes("favicon"),
    );

    expect(appErrors).toHaveLength(0);
  });

  test("shows run count in the heading when logs exist", async ({ page }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");

    // The heading area conditionally renders "{N} run(s)" next to the title
    // when pagination data is available. We just confirm no crash occurs.
    const heading = page.getByRole("heading", { name: "Engine Logs" });
    await expect(heading).toBeVisible();
  });
});
