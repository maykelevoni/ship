import { test, expect } from "@playwright/test";

// ─── Calendar Day Panel tests ─────────────────────────────────────────────────
// Covers: spec AC for Calendar Day Panel (section 5)
//
// Implementation details:
// - Day cells are <div onClick=...> elements (not buttons) in CalendarGrid
// - Clicking a day opens two panels: the DetailPanel (full-page overlay inside
//   CalendarGrid) AND the DayPanel (slides in from right on the page level)
// - DayPanel unique text: "Scheduled Posts" / "No posts scheduled for this day."
// - DayPanel always rendered in DOM but off-screen (translateX(100%)) until date set

test.describe("Calendar Day Panel — page shell", () => {
  test("calendar page loads at /calendar", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/calendar");
  });

  test("calendar page shows Calendar heading", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
    // Wait for calendar loading overlay to disappear
    await page
      .getByText("Loading…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
    await expect(page.getByRole("heading", { name: "Calendar" })).toBeVisible();
  });
});

// Helper: click the first visible day cell (a <div> with a day number span)
async function clickFirstDayCell(page: import("@playwright/test").Page) {
  // Day cells contain a <span> with a 1-2 digit day number, inside a cursor:pointer div
  // We find spans whose exact text is a 1-2 digit number and click the parent div
  const daySpan = page.locator("span").filter({ hasText: /^\d{1,2}$/ }).first();
  // Click the span — the click propagates to the parent div's onClick handler
  await daySpan.click();
}

test.describe("Calendar Day Panel — open and close via day click", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
    // Wait for calendar loading overlay to disappear
    await page
      .getByText("Loading…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("clicking a calendar day makes DayPanel content visible", async ({
    page,
  }) => {
    await clickFirstDayCell(page);
    await page.waitForLoadState("networkidle");

    // DayPanel fetches schedule entries and shows one of two states.
    // Wait for DayPanel-specific content (NOT the DetailPanel content).
    await expect
      .poll(
        async () => {
          const scheduled = await page.getByText("Scheduled Posts").count();
          const noPosts = await page
            .getByText("No posts scheduled for this day.")
            .count();
          // Also accept the DayPanel loading state
          const loading = await page
            .locator("p")
            .filter({ hasText: "Loading…" })
            .count();
          return scheduled > 0 || noPosts > 0 || loading > 0;
        },
        { timeout: 20000 }
      )
      .toBe(true);
  });

  test("DayPanel has a close (X) button when open", async ({ page }) => {
    await clickFirstDayCell(page);
    await page.waitForLoadState("networkidle");

    // Wait until DayPanel content appears
    await expect
      .poll(
        async () => {
          const scheduled = await page.getByText("Scheduled Posts").count();
          const noPosts = await page
            .getByText("No posts scheduled for this day.")
            .count();
          const loading = await page
            .locator("p")
            .filter({ hasText: "Loading…" })
            .count();
          return scheduled > 0 || noPosts > 0 || loading > 0;
        },
        { timeout: 20000 }
      )
      .toBe(true);

    // Close the DetailPanel first so we can access the DayPanel behind it
    // The DetailPanel backdrop is a full-screen div; press Escape to close it or
    // find its close button. DetailPanel has an X button in its header.
    // We can close DetailPanel by pressing Escape — it has an onClick backdrop.
    // Alternatively, find the close button that is NOT inside the DayPanel.
    // DetailPanel close button is inside "position: fixed; inset: 0; z-index: 50"
    // We press Escape (no keyboard handler) or click the backdrop.
    // Simplest: click the DetailPanel's backdrop (the translucent overlay div).
    // The DetailPanel backdrop is the first child div of the DetailPanel container.
    await page.keyboard.press("Escape");
    // After pressing Escape, the DetailPanel stays (no keyboard handler).
    // Click on the backdrop area (top-left corner outside the panel).
    const detailBackdrop = page.locator('div[style*="position: absolute"][style*="inset: 0"]').first();
    await detailBackdrop.click({ force: true }).catch(() => {});
    await page.waitForLoadState("networkidle");

    // The DayPanel's X button should now be accessible
    // DayPanel has a fixed panel at right:0 with a button containing X icon
    // Find it by the panel structure: fixed div, right 0, with a heading (date label)
    // and a button with border "1px solid #2a2a2a"
    const dayPanelContainer = page.locator('div').filter({
      has: page.locator('p').filter({ hasText: "No posts scheduled for this day." })
    }).or(
      page.locator('div').filter({
        has: page.locator('p').filter({ hasText: "Scheduled Posts" })
      })
    ).first();

    const closeBtn = dayPanelContainer.locator('button').first();
    await expect(closeBtn).toBeVisible();
  });
});

test.describe("Calendar Day Panel — content verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("DayPanel shows 'Scheduled Posts' or 'No posts scheduled' after clicking a day", async ({
    page,
  }) => {
    await clickFirstDayCell(page);

    await expect
      .poll(
        async () => {
          const scheduled = await page.getByText("Scheduled Posts").count();
          const noPosts = await page
            .getByText("No posts scheduled for this day.")
            .count();
          return scheduled > 0 || noPosts > 0;
        },
        { timeout: 20000 }
      )
      .toBe(true);
  });

  test("DayPanel schedule entries show HH:MM times when entries present", async ({
    page,
  }) => {
    await clickFirstDayCell(page);

    // Wait for final state
    await expect
      .poll(
        async () => {
          const scheduled = await page.getByText("Scheduled Posts").count();
          const noPosts = await page
            .getByText("No posts scheduled for this day.")
            .count();
          return scheduled > 0 || noPosts > 0;
        },
        { timeout: 20000 }
      )
      .toBe(true);

    const hasEntries = (await page.getByText("Scheduled Posts").count()) > 0;
    if (!hasEntries) {
      test.skip();
      return;
    }

    // Each schedule entry has a time shown as "HH:MM" in a span coloured #6366f1
    // We match any span with HH:MM pattern
    const timeSpans = page.locator("span").filter({ hasText: /^\d{2}:\d{2}$/ });
    await expect(timeSpans.first()).toBeVisible();
  });

  test("DayPanel schedule entries show status badges when entries present", async ({
    page,
  }) => {
    await clickFirstDayCell(page);

    await expect
      .poll(
        async () => {
          const scheduled = await page.getByText("Scheduled Posts").count();
          const noPosts = await page
            .getByText("No posts scheduled for this day.")
            .count();
          return scheduled > 0 || noPosts > 0;
        },
        { timeout: 20000 }
      )
      .toBe(true);

    const hasEntries = (await page.getByText("Scheduled Posts").count()) > 0;
    if (!hasEntries) {
      test.skip();
      return;
    }

    // Status badges: Posted, Failed, Queued, Generated, Approved, or Pending
    const statusBadge = page
      .locator("span")
      .filter({ hasText: /^(Posted|Failed|Queued|Generated|Approved|Pending)$/ })
      .first();
    await expect(statusBadge).toBeVisible();
  });
});
