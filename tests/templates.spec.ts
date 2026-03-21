import { test, expect } from "@playwright/test";

// ─── Templates page tests ─────────────────────────────────────────────────────
// Covers: spec AC for Content Templates (section 1)
// Rules: test shell separately from data; pass on both empty and populated DB

test.describe("Templates — page shell", () => {
  test("loads at /templates with correct URL", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/templates");
  });

  test("shows Templates heading", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading templates…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
    await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();
  });

  test("sidebar Templates link navigates to /templates", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Templates" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/templates");
  });
});

test.describe("Templates — header actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading templates…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("shows New Template button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "New Template" }).first()
    ).toBeVisible();
  });
});

test.describe("Templates — content (DB-agnostic)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading templates…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("shows either template cards or empty state", async ({ page }) => {
    await expect
      .poll(
        async () => {
          const empty = await page.getByText("No templates yet").count();
          // Template cards are grouped under platform headings; check for Edit buttons or the empty text
          const cards = await page.getByRole("button", { name: "Edit" }).count();
          return empty > 0 || cards > 0;
        },
        { timeout: 15000 }
      )
      .toBe(true);
  });

  test("empty state shows New Template button when no templates", async ({
    page,
  }) => {
    const isEmpty = await page.getByText("No templates yet").isVisible();
    if (isEmpty) {
      // In empty state there should be a second New Template button inside the empty state
      const buttons = page.getByRole("button", { name: "New Template" });
      await expect(buttons.first()).toBeVisible();
    }
  });
});

test.describe("Templates — New Template slide-in panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading templates…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("clicking New Template opens panel with 'New Template' heading", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "New Template" }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "New Template" })
    ).toBeVisible();
  });

  test("panel contains Name field", async ({ page }) => {
    await page.getByRole("button", { name: "New Template" }).first().click();
    await expect(page.locator('input[placeholder="e.g. Short Tweet + Link"]')).toBeVisible();
  });

  test("panel contains Platform select", async ({ page }) => {
    await page.getByRole("button", { name: "New Template" }).first().click();
    // Look for a select element within the panel
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });

  test("panel has Create Template and Cancel buttons", async ({ page }) => {
    await page.getByRole("button", { name: "New Template" }).first().click();
    await expect(
      page.getByRole("button", { name: "Create Template" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("Cancel button closes the panel", async ({ page }) => {
    await page.getByRole("button", { name: "New Template" }).first().click();
    await expect(
      page.getByRole("heading", { name: "New Template" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "New Template" })
    ).not.toBeVisible();
  });

  test("panel shows Requires Image toggle", async ({ page }) => {
    await page.getByRole("button", { name: "New Template" }).first().click();
    await expect(page.getByText("Requires Image")).toBeVisible();
  });

  test("panel shows Requires Video toggle", async ({ page }) => {
    await page.getByRole("button", { name: "New Template" }).first().click();
    await expect(page.getByText("Requires Video")).toBeVisible();
  });

  test("panel shows Include Link checkbox", async ({ page }) => {
    await page.getByRole("button", { name: "New Template" }).first().click();
    await expect(page.getByText("Include Link")).toBeVisible();
  });

  test("panel shows AI Instructions field", async ({ page }) => {
    await page.getByRole("button", { name: "New Template" }).first().click();
    await expect(page.getByText("AI Instructions")).toBeVisible();
  });
});

test.describe("Templates — Edit and Delete actions (when templates exist)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading templates…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("Edit button opens panel with 'Edit Template' heading", async ({
    page,
  }) => {
    const hasTemplates = await page.getByRole("button", { name: "Edit" }).count() > 0;
    if (!hasTemplates) {
      test.skip();
      return;
    }
    await page.getByRole("button", { name: "Edit" }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Edit Template" })
    ).toBeVisible();
  });

  test("Edit panel has Save Changes button", async ({ page }) => {
    const hasTemplates = await page.getByRole("button", { name: "Edit" }).count() > 0;
    if (!hasTemplates) {
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
    const hasTemplates =
      await page.getByRole("button", { name: "Delete" }).count() > 0;
    if (!hasTemplates) {
      test.skip();
      return;
    }
    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Delete Template?" })
    ).toBeVisible();
  });

  test("Delete modal has Cancel button that closes it", async ({ page }) => {
    const hasTemplates =
      await page.getByRole("button", { name: "Delete" }).count() > 0;
    if (!hasTemplates) {
      test.skip();
      return;
    }
    await page.getByRole("button", { name: "Delete" }).first().click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Delete Template?" })
    ).not.toBeVisible();
  });
});
