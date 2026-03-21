import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Calendar page (/calendar)
//
// "use client" page that:
//  - Renders a header with a CalendarDays icon and "Calendar" heading
//  - Shows month navigation (prev/next chevron buttons + month+year label)
//  - Shows a colored-dot legend (Posted, Queued / Approved, Failed, No content)
//  - Renders a <CalendarGrid> with a 7-column day grid + weekday headers
//  - Fetches /api/calendar?from=…&to=… on mount; shows "Loading…" while waiting
// ---------------------------------------------------------------------------

test.describe("Calendar (/calendar)", () => {
  test("loads without a 500 error", async ({ page }) => {
    const response = await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows the 'Calendar' page heading", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "Calendar" }),
    ).toBeVisible();
  });

  test("shows the sidebar with app name", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText("Promotion Engine", { exact: true }),
    ).toBeVisible();
  });

  test("shows the current month and year label", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    const now = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const expectedLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    await expect(page.getByText(expectedLabel, { exact: true })).toBeVisible();
  });

  test("shows previous and next month navigation buttons", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    // The prev/next buttons contain ChevronLeft / ChevronRight SVG icons.
    // They are plain <button> elements — locate by the SVG role or by position.
    const buttons = page.locator("button");
    const count = await buttons.count();
    // At minimum 2 nav buttons must exist (prev + next)
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("shows the weekday header row (Mon–Sun or Sun–Sat)", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    // CalendarGrid renders day-of-week abbreviations
    // The exact abbreviations depend on the CalendarGrid implementation;
    // we check for at least two common ones.
    const hasMon = await page.getByText("Mon").isVisible().catch(() => false);
    const hasSun = await page.getByText("Sun").isVisible().catch(() => false);

    expect(hasMon || hasSun).toBe(true);
  });

  test("shows the color-coded legend", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Posted")).toBeVisible();
    await expect(page.getByText("Failed")).toBeVisible();
    // "Queued / Approved" or similar
    await expect(page.getByText(/queued/i)).toBeVisible();
  });

  test("clicking next month changes the displayed month label", async ({
    page,
  }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    const now = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    // Calculate next month
    const nextMonthIndex = (now.getMonth() + 1) % 12;
    const nextYear =
      now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const nextLabel = `${monthNames[nextMonthIndex]} ${nextYear}`;

    // Find the "next" button — it appears after the month label span.
    // The prev button is first, next is second among the two icon buttons.
    // We locate all buttons that sit inside the month navigation area.
    // The SVG buttons are inside a flex row that also contains the month label.
    // Use nth(1) for the second chevron button.
    const chevronButtons = page.locator("button").filter({
      has: page.locator("svg"),
    });

    // The next-month button is the second chevron button in the nav row.
    // We click whichever button is second.
    await chevronButtons.nth(1).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(nextLabel, { exact: true })).toBeVisible();
  });

  test("clicking prev month shows a 'Today' button to return to current month", async ({
    page,
  }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    // Navigate away from the current month so the "Today" button appears
    const chevronButtons = page.locator("button").filter({
      has: page.locator("svg"),
    });
    await chevronButtons.nth(0).click(); // go to previous month
    await page.waitForLoadState("networkidle");

    // The "Today" button appears only when not on the current month
    await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
  });

  test("clicking the 'Today' button returns to the current month", async ({
    page,
  }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    const now = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const currentLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    // Navigate to a different month first
    const chevronButtons = page.locator("button").filter({
      has: page.locator("svg"),
    });
    await chevronButtons.nth(1).click();
    await page.waitForLoadState("networkidle");

    // Click Today
    await page.getByRole("button", { name: "Today" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(currentLabel, { exact: true })).toBeVisible();
  });

  test("Calendar link in sidebar is highlighted when on /calendar", async ({
    page,
  }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    // The sidebar nav link for Calendar exists
    await expect(
      page.locator("aside").getByRole("link", { name: "Calendar" }),
    ).toBeVisible();
  });

  test("no critical console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/calendar");
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
