import { test, expect } from "@playwright/test";

// ─── Settings page tests ───────────────────────────────────────────────────────
// Covers: spec AC for Settings (section 3)
// Rules: test shell separately from data; never assume DB state

test.describe("Settings — page shell", () => {
  test("loads at /settings with correct URL", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/settings");
  });

  test("shows Settings heading", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    // Wait for the loading spinner to disappear
    await page
      .getByText("Loading settings…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("sidebar Settings link navigates to /settings", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Settings" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/settings");
  });
});

test.describe("Settings — sections visible", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading settings…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("shows AI Providers section", async ({ page }) => {
    await expect(page.getByText("AI Providers")).toBeVisible();
  });

  test("shows Social Posting section", async ({ page }) => {
    await expect(page.getByText("Social Posting")).toBeVisible();
  });

  test("shows Email section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Email" })).toBeVisible();
  });

  test("shows General section", async ({ page }) => {
    await expect(page.getByText("General")).toBeVisible();
  });
});

test.describe("Settings — API key fields are masked (password inputs)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading settings…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("Anthropic API Key field is a password input", async ({ page }) => {
    // Find the input near the Anthropic label — it has placeholder "sk-ant-..."
    const input = page.locator('input[placeholder="sk-ant-..."]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "password");
  });

  test("Gemini API Key field is a password input", async ({ page }) => {
    const input = page.locator('input[placeholder="AIza..."]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "password");
  });

  test("post-bridge API Key field is a password input", async ({ page }) => {
    const input = page.locator('input[placeholder="pb-..."]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "password");
  });

  test("Resend API Key field is a password input", async ({ page }) => {
    const input = page.locator('input[placeholder="re_..."]');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "password");
  });
});

test.describe("Settings — platform checkboxes visible", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading settings…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("shows Enabled Platforms label", async ({ page }) => {
    await expect(page.getByText("Enabled Platforms")).toBeVisible();
  });

  test("shows Twitter / X platform option", async ({ page }) => {
    await expect(page.getByText("Twitter / X")).toBeVisible();
  });

  test("shows LinkedIn platform option", async ({ page }) => {
    await expect(page.getByText("LinkedIn")).toBeVisible();
  });
});

test.describe("Settings — general section controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Loading settings…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
  });

  test("shows Timezone select with options", async ({ page }) => {
    const select = page.locator("select").first();
    await expect(select).toBeVisible();
    // It should have at least one timezone option
    const optionCount = await select.locator("option").count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("shows Gate Mode toggle label", async ({ page }) => {
    await expect(
      page.getByText("Require approval before content posts (Gate Mode)")
    ).toBeVisible();
  });

  test("shows AI fallback toggle label", async ({ page }) => {
    await expect(
      page.getByText("Auto-switch to Gemini when Claude is unavailable")
    ).toBeVisible();
  });

  test("shows Save buttons", async ({ page }) => {
    // Each section has a Save button — there should be at least 4
    const saveButtons = page.getByRole("button", { name: "Save" });
    const count = await saveButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});
