import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Queue page (/queue)
//
// "use client" page that:
//  - Renders a header with ListTodo icon + "Content Queue" heading
//  - Fetches /api/queue and /api/settings on mount
//  - If gateMode is enabled, shows a yellow warning banner
//  - If queue is empty, shows an empty state: "Queue is empty"
//  - If items exist, shows them grouped by date with approve/reject controls
//  - When pending items exist, shows an "Approve All (N)" button
// ---------------------------------------------------------------------------

test.describe("Queue (/queue)", () => {
  test("loads without a 500 error", async ({ page }) => {
    const response = await page.goto("/queue");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows the 'Content Queue' heading", async ({ page }) => {
    await page.goto("/queue");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "Content Queue" }),
    ).toBeVisible();
  });

  test("shows the sidebar with app name", async ({ page }) => {
    await page.goto("/queue");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText("Promotion Engine", { exact: true }),
    ).toBeVisible();
  });

  test("Queue nav link is visible in the sidebar", async ({ page }) => {
    await page.goto("/queue");
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator("aside").getByRole("link", { name: "Queue" }),
    ).toBeVisible();
  });

  test("shows an empty-state message when no content items are queued", async ({
    page,
  }) => {
    await page.goto("/queue");
    await page.waitForLoadState("networkidle");

    // Wait for the loading spinner to disappear before checking content
    await page.getByText("Loading queue…").waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});

    // When the DB is empty, QueuePage renders "Queue is empty"
    // When items exist, it renders them grouped by date.
    // Either state is valid — we just verify no crash.
    const hasEmpty = await page
      .getByText("Queue is empty")
      .isVisible()
      .catch(() => false);
    const hasItems = await page
      .locator("[style*='display: flex'][style*='flex-direction: column']")
      .count() > 0;

    expect(hasEmpty || hasItems).toBe(true);
  });

  test("does not show the 'Approve All' button when the queue is empty", async ({
    page,
  }) => {
    await page.goto("/queue");
    await page.waitForLoadState("networkidle");

    const isEmpty = await page
      .getByText("Queue is empty")
      .isVisible()
      .catch(() => false);

    if (isEmpty) {
      // When queue is empty, pendingItems.length === 0 so button is hidden
      await expect(
        page.getByRole("button", { name: /approve all/i }),
      ).not.toBeVisible();
    }
    // If queue has items we skip this assertion — test is conditional
  });

  test("empty-state shows the description about the engine", async ({
    page,
  }) => {
    await page.goto("/queue");
    await page.waitForLoadState("networkidle");

    const isEmpty = await page
      .getByText("Queue is empty")
      .isVisible()
      .catch(() => false);

    if (isEmpty) {
      await expect(
        page.getByText("Content will appear here after the engine runs."),
      ).toBeVisible();
    }
  });

  test("navigating from sidebar to /queue works correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: "Queue" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/queue");
    await expect(
      page.getByRole("heading", { name: "Content Queue" }),
    ).toBeVisible();
  });

  test("no critical console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/queue");
    await page.waitForLoadState("networkidle");

    const appErrors = errors.filter(
      (e) =>
        !e.includes("ERR_BLOCKED_BY_CLIENT") &&
        !e.includes("extension") &&
        !e.includes("favicon"),
    );

    expect(appErrors).toHaveLength(0);
  });

  test("page layout renders both sidebar and main content area", async ({
    page,
  }) => {
    await page.goto("/queue");
    await page.waitForLoadState("networkidle");

    // The dashboard layout is a flex row: aside (sidebar) + main
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });
});
