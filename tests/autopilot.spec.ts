import { test, expect } from "@playwright/test";

// ─── Autopilot page tests ───────────────────────────────────────────────────────
// Covers: Task 011 — Autopilot page shell + Full Autopilot tab
// Rules: test shell separately from data; never assume DB state

test.describe("Autopilot — page shell", () => {
  test("loads at /autopilot with correct URL", async ({ page }) => {
    await page.goto("/autopilot");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/autopilot");
  });

  test("shows Autopilot heading", async ({ page }) => {
    await page.goto("/autopilot");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading autopilot rules…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
    await expect(page.getByRole("heading", { name: "Autopilot" })).toBeVisible();
  });

  test("shows subtitle 'Schedule your content pipeline'", async ({ page }) => {
    await page.goto("/autopilot");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading autopilot rules…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
    await expect(page.getByText("Schedule your content pipeline")).toBeVisible();
  });
});

test.describe("Autopilot — tab switcher", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autopilot");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading autopilot rules…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("shows two tabs: Full Autopilot and Custom Schedule", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Full Autopilot/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Custom Schedule/ })).toBeVisible();
  });

  test("Full Autopilot tab is active by default", async ({ page }) => {
    const fullTab = page.getByRole("button", { name: /Full Autopilot/ });
    await expect(fullTab).toHaveAttribute("aria-current", "page");
  });

  test("clicking Custom Schedule switches tab", async ({ page }) => {
    await page.getByRole("button", { name: /Custom Schedule/ }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/tab=custom/);
    await expect(page.getByText("Custom schedule coming soon")).toBeVisible();
  });

  test("clicking Full Autopilot switches back", async ({ page }) => {
    await page.getByRole("button", { name: /Custom Schedule/ }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Full Autopilot/ }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/tab=full/);
  });
});

test.describe("Autopilot — Full Autopilot tab content", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autopilot?tab=full");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading autopilot rules…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("shows Full Autopilot card with title", async ({ page }) => {
    await expect(page.getByText("Full Autopilot")).toBeVisible();
    await expect(page.getByText("Runs the complete pipeline on schedule")).toBeVisible();
  });

  test("shows ON/OFF toggle", async ({ page }) => {
    // Toggle is visible (may be checked or unchecked depending on DB state)
    const toggle = page.locator('[style*="border-radius: 11px"]').first();
    await expect(toggle).toBeVisible();
  });

  test("shows day chips (Mon-Sun)", async ({ page }) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (const day of days) {
      await expect(page.getByRole("button", { name: day })).toBeVisible();
    }
  });

  test("shows time selector with hour dropdown", async ({ page }) => {
    await expect(page.getByText("At")).toBeVisible();
    const select = page.locator("select").first();
    await expect(select).toBeVisible();
  });

  test("shows research checkboxes", async ({ page }) => {
    await expect(page.getByText("Research")).toBeVisible();
    await expect(page.getByText("YouTube")).toBeVisible();
    await expect(page.getByText("Reddit")).toBeVisible();
    await expect(page.getByText("HN")).toBeVisible();
    await expect(page.getByText("News")).toBeVisible();
  });

  test("shows promotion dropdown", async ({ page }) => {
    await expect(page.getByText("Promote")).toBeVisible();
    await expect(page.getByText("Auto-pick by priority")).toBeVisible();
  });

  test("shows platform checkboxes", async ({ page }) => {
    await expect(page.getByText("Post to")).toBeVisible();
    await expect(page.getByText("Twitter")).toBeVisible();
    await expect(page.getByText("LinkedIn")).toBeVisible();
    await expect(page.getByText("Reddit")).toBeVisible();
    await expect(page.getByText("Instagram")).toBeVisible();
    await expect(page.getByText("Blog")).toBeVisible();
  });

  test("shows gate radio buttons", async ({ page }) => {
    await expect(page.getByText("Gate")).toBeVisible();
    await expect(page.getByText("Auto-post")).toBeVisible();
    await expect(page.getByText("Require approval")).toBeVisible();
  });

  test("shows Save button", async ({ page }) => {
    const saveButton = page.getByRole("button", { name: "Save" });
    await expect(saveButton).toBeVisible();
  });
});

test.describe("Autopilot — Full Autopilot interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/autopilot?tab=full");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading autopilot rules…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("day chips are clickable", async ({ page }) => {
    const monButton = page.getByRole("button", { name: "Mon" });
    await monButton.click();
    // Button should still be visible after click
    await expect(monButton).toBeVisible();
  });

  test("time selector shows hours 00-23", async ({ page }) => {
    const select = page.locator("select").first();
    const options = await select.locator("option").count();
    expect(options).toBe(24);
  });

  test("research checkboxes are clickable", async ({ page }) => {
    const youtubeButton = page.getByRole("button", { name: /YouTube/ }).first();
    await youtubeButton.click();
    await expect(youtubeButton).toBeVisible();
  });

  test("platform checkboxes are clickable", async ({ page }) => {
    const twitterButton = page.getByRole("button", { name: /Twitter/ }).first();
    await twitterButton.click();
    await expect(twitterButton).toBeVisible();
  });

  test("gate radio buttons are clickable", async ({ page }) => {
    const autoPostRadio = page.getByLabel("Auto-post");
    await autoPostRadio.check();
    await expect(autoPostRadio).toBeChecked();

    const requireApprovalRadio = page.getByLabel("Require approval");
    await requireApprovalRadio.check();
    await expect(requireApprovalRadio).toBeChecked();
  });
});
