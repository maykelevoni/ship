import { test, expect } from "@playwright/test";

// ─── Schedule page tests ──────────────────────────────────────────────────────
// Covers: spec AC for Schedule (section 2)
// Rules: test shell separately from data; pass on both empty and populated DB

test.describe("Schedule — page shell", () => {
  test("loads at /schedule with correct URL", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/schedule");
  });

  test("shows Schedule heading", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading schedule…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();
  });

  test("sidebar Schedule link navigates to /schedule", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Schedule" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/schedule");
  });
});

test.describe("Schedule — header actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading schedule…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("shows Add Entry button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Add Entry" }).first()
    ).toBeVisible();
  });
});

test.describe("Schedule — content (DB-agnostic)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading schedule…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("shows either schedule entries or empty state", async ({ page }) => {
    await expect
      .poll(
        async () => {
          const empty = await page.getByText("No schedule entries").count();
          // When entries exist, the table has column headers
          const timeHeader = await page.getByText("Time").count();
          return empty > 0 || timeHeader > 0;
        },
        { timeout: 15000 }
      )
      .toBe(true);
  });

  test("table shows Time column header when entries exist", async ({ page }) => {
    const hasEntries =
      (await page.getByText("No schedule entries").count()) === 0 &&
      (await page.getByText("Loading schedule…").count()) === 0;
    if (!hasEntries) {
      test.skip();
      return;
    }
    await expect(page.getByText("Time")).toBeVisible();
  });

  test("table shows Platform column header when entries exist", async ({
    page,
  }) => {
    const hasEntries =
      (await page.getByText("No schedule entries").count()) === 0 &&
      (await page.getByText("Loading schedule…").count()) === 0;
    if (!hasEntries) {
      test.skip();
      return;
    }
    await expect(page.getByText("Platform")).toBeVisible();
  });

  test("table shows Template column header when entries exist", async ({
    page,
  }) => {
    const hasEntries =
      (await page.getByText("No schedule entries").count()) === 0 &&
      (await page.getByText("Loading schedule…").count()) === 0;
    if (!hasEntries) {
      test.skip();
      return;
    }
    await expect(page.getByText("Template")).toBeVisible();
  });
});

test.describe("Schedule — Add Entry slide-in panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading schedule…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("clicking Add Entry opens panel with 'Add Schedule Entry' heading", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add Entry" }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Add Schedule Entry" })
    ).toBeVisible();
  });

  test("panel has a time input", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).first().click();
    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).toBeVisible();
  });

  test("panel has a Platform select", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).first().click();
    // There is at least one combobox (platform select)
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });

  test("panel shows Days of Week label", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).first().click();
    await expect(page.getByText("Days of Week")).toBeVisible();
  });

  test("panel shows All / Weekdays / Weekends quick-select links", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Add Entry" }).first().click();
    await expect(page.getByText("All")).toBeVisible();
    await expect(page.getByText("Weekdays")).toBeVisible();
    await expect(page.getByText("Weekends")).toBeVisible();
  });

  test("panel has Add Entry and Cancel buttons", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).first().click();
    // Footer contains an "Add Entry" save button and a "Cancel" button
    await expect(
      page.getByRole("button", { name: "Add Entry" }).nth(1)
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("Cancel button closes the panel", async ({ page }) => {
    await page.getByRole("button", { name: "Add Entry" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Add Schedule Entry" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Add Schedule Entry" })
    ).not.toBeVisible();
  });
});

test.describe("Schedule — Edit and Delete actions (when entries exist)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading schedule…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("Edit button opens panel with 'Edit Schedule Entry' heading", async ({
    page,
  }) => {
    const hasEntries = await page.getByRole("button", { name: "Edit" }).count() > 0;
    if (!hasEntries) {
      test.skip();
      return;
    }
    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Edit Schedule Entry" })
    ).toBeVisible();
  });

  test("Edit panel has Save Changes button", async ({ page }) => {
    const hasEntries = await page.getByRole("button", { name: "Edit" }).count() > 0;
    if (!hasEntries) {
      test.skip();
      return;
    }
    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: "Save Changes" })
    ).toBeVisible();
  });

  test("Delete button opens confirmation modal", async ({ page }) => {
    const hasEntries =
      await page.getByRole("button", { name: "Delete" }).count() > 0;
    if (!hasEntries) {
      test.skip();
      return;
    }
    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Delete Schedule Entry?" })
    ).toBeVisible();
  });

  test("Delete modal has Cancel button that closes it", async ({ page }) => {
    const hasEntries =
      await page.getByRole("button", { name: "Delete" }).count() > 0;
    if (!hasEntries) {
      test.skip();
      return;
    }
    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Delete Schedule Entry?" })
    ).not.toBeVisible();
  });
});
