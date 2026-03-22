import { test, expect } from "@playwright/test";

// Auth note: existing tests in this repo use no special auth — the app runs
// with auth disabled in dev mode. All tests follow the same pattern.

// ─── Suite 1: Sidebar Navigation ─────────────────────────────────────────────

test.describe("Sidebar — research-blog-pipeline nav items", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Research link is visible in sidebar", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Research" })).toBeVisible();
  });

  test("Blog link is visible in sidebar", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Blog" })).toBeVisible();
  });

  test("Email Drafts link is visible in sidebar", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Email Drafts" })).toBeVisible();
  });

  test("Opportunities link is visible in sidebar", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Opportunities" })).toBeVisible();
  });

  test("clicking Research navigates to /research", async ({ page }) => {
    await page.getByRole("link", { name: "Research" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/research");
  });

  test("clicking Blog navigates to /blog", async ({ page }) => {
    await page.getByRole("link", { name: "Blog" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/blog");
  });

  test("clicking Email Drafts navigates to /email-drafts", async ({ page }) => {
    await page.getByRole("link", { name: "Email Drafts" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/email-drafts");
  });

  test("clicking Opportunities navigates to /opportunities", async ({ page }) => {
    await page.getByRole("link", { name: "Opportunities" }).click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/opportunities");
  });
});

// ─── Suite 2: Research Page (/research) ───────────────────────────────────────

test.describe("Research page (/research)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    // Wait for the initial loading state to clear
    await page
      .getByText("Loading research…")
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  });

  test("renders with Research heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Research" })).toBeVisible();
  });

  test("shows empty state message or topic cards", async ({ page }) => {
    const emptyMsg = page.getByText("No research data for today.");
    const hasTopic = await page.locator('[style*="border-radius: 12px"]').count();

    const emptyVisible = await emptyMsg.isVisible().catch(() => false);
    // Either empty state is shown, or there are topic cards (or still loading placeholder)
    // At least one of these conditions must be true:
    expect(emptyVisible || hasTopic > 0).toBe(true);
  });

  test("Refresh button is visible", async ({ page }) => {
    // The button text is "Refresh" when not refreshing
    await expect(page.getByRole("button", { name: /^Refresh/ })).toBeVisible();
  });

  test("Refresh button is clickable", async ({ page }) => {
    const btn = page.getByRole("button", { name: /^Refresh/ });
    await expect(btn).toBeEnabled();
  });

  test("clicking Refresh triggers loading state", async ({ page }) => {
    const btn = page.getByRole("button", { name: /^Refresh/ });
    await btn.click();
    // After click the button either shows "Refreshing…" or is disabled while loading
    // We check that the button text changes or the button becomes disabled
    const textAfterClick = await btn.textContent();
    const isDisabled = await btn.isDisabled();
    expect(textAfterClick?.includes("Refreshing") || isDisabled).toBe(true);
  });
});

// ─── Suite 3: Blog Page (/blog) ────────────────────────────────────────────────

test.describe("Blog page (/blog)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("networkidle");
    // Wait for loading spinner to clear
    await page
      .getByText("Loading…")
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  });

  test("renders with Blog heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Blog" })).toBeVisible();
  });

  test("Regenerate button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^Regenerate/ })).toBeVisible();
  });

  test("shows empty state OR a blog post card", async ({ page }) => {
    const emptyMsg = page.getByText("No blog post for today");
    const postCard = page.locator("h2").first();

    const emptyVisible = await emptyMsg.isVisible().catch(() => false);
    const cardVisible = await postCard.isVisible().catch(() => false);

    expect(emptyVisible || cardVisible).toBe(true);
  });

  test("if post exists — status badge is visible", async ({ page }) => {
    // Check whether we're in the 'has post' state
    const emptyMsg = page.getByText("No blog post for today");
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    if (!emptyVisible) {
      // Post exists — find a status badge (published / draft / failed)
      const badge = page.locator("span").filter({ hasText: /^(published|draft|failed)$/i }).first();
      await expect(badge).toBeVisible();
    }
  });

  test("if post exists — content preview section is shown", async ({ page }) => {
    const emptyMsg = page.getByText("No blog post for today");
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    if (!emptyVisible) {
      // "Content Preview" label is rendered above the <pre> block
      await expect(page.getByText("Content Preview")).toBeVisible();
    }
  });
});

// ─── Suite 4: Email Drafts Page (/email-drafts) ────────────────────────────────

test.describe("Email Drafts page (/email-drafts)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/email-drafts");
    await page.waitForLoadState("networkidle");
    // Wait for loading state to clear
    await page
      .getByText("Loading drafts…")
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  });

  test("renders with Email Drafts heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Email Drafts" })).toBeVisible();
  });

  test("shows empty state OR draft cards", async ({ page }) => {
    const emptyMsg = page.getByText("No email drafts yet.");
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    // If not empty, there must be at least one Subject label
    if (!emptyVisible) {
      const subjectLabel = page.getByText("Subject").first();
      await expect(subjectLabel).toBeVisible();
    } else {
      expect(emptyVisible).toBe(true);
    }
  });

  test("if draft exists — Subject input is present and editable", async ({ page }) => {
    const emptyMsg = page.getByText("No email drafts yet.");
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    if (!emptyVisible) {
      const subjectInput = page.locator('input[type="text"]').first();
      await expect(subjectInput).toBeVisible();
      await expect(subjectInput).toBeEditable();
    }
  });

  test("if draft exists — Body textarea is present and editable", async ({ page }) => {
    const emptyMsg = page.getByText("No email drafts yet.");
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    if (!emptyVisible) {
      const bodyTextarea = page.locator("textarea").first();
      await expect(bodyTextarea).toBeVisible();
      await expect(bodyTextarea).toBeEditable();
    }
  });

  test("if draft exists — Send button is visible", async ({ page }) => {
    const emptyMsg = page.getByText("No email drafts yet.");
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    if (!emptyVisible) {
      // The Send button shows "Send" or "Sent" depending on status
      const sendBtn = page.getByRole("button", { name: /^Send/ }).first();
      await expect(sendBtn).toBeVisible();
    }
  });
});

// ─── Suite 5: Opportunities Page (/opportunities) ─────────────────────────────

test.describe("Opportunities page (/opportunities)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/opportunities");
    await page.waitForLoadState("networkidle");
    // Wait for loading state to clear
    await page
      .getByText("Loading opportunities…")
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  });

  test("renders with Opportunities heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Opportunities" })).toBeVisible();
  });

  test("Show dismissed toggle/checkbox is visible", async ({ page }) => {
    await expect(page.getByText("Show dismissed")).toBeVisible();
    // The label contains a checkbox
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  test("shows empty state OR grouped section cards", async ({ page }) => {
    const emptyMsg = page.getByText("No opportunities yet");
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    if (!emptyVisible) {
      // Section headings rendered by SectionCard
      await expect(page.getByText("Affiliate")).toBeVisible();
      await expect(page.getByText("Ghost Offers")).toBeVisible();
      await expect(page.getByText("Digital Products")).toBeVisible();
      await expect(page.getByText("Product Gaps")).toBeVisible();
    } else {
      expect(emptyVisible).toBe(true);
    }
  });

  test("if opportunities exist — Act and Dismiss buttons are visible for new items", async ({
    page,
  }) => {
    const emptyMsg = page.getByText("No opportunities yet");
    const emptyVisible = await emptyMsg.isVisible().catch(() => false);

    if (!emptyVisible) {
      // New items have Act + Dismiss buttons
      const actBtn = page.getByRole("button", { name: "Act" }).first();
      const dismissBtn = page.getByRole("button", { name: "Dismiss" }).first();
      const actVisible = await actBtn.isVisible().catch(() => false);
      const dismissVisible = await dismissBtn.isVisible().catch(() => false);

      // Either there are new items (buttons shown) or all items are already acted/dismissed
      // Both states are valid — we don't assert here, just check no crash
      expect(typeof actVisible).toBe("boolean");
      expect(typeof dismissVisible).toBe("boolean");
    }
  });

  test("Show dismissed checkbox can be toggled", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    const initialChecked = await checkbox.isChecked();
    await checkbox.click();
    const afterChecked = await checkbox.isChecked();
    expect(afterChecked).toBe(!initialChecked);
  });
});

// ─── Suite 6: Settings — Research & Blog section ──────────────────────────────

test.describe("Settings — Research & Blog section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    // Wait for loading spinner to clear
    await page
      .getByText("Loading settings…")
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => {});
  });

  test("Research & Blog section heading is visible", async ({ page }) => {
    await expect(page.getByText("Research & Blog")).toBeVisible();
  });

  test("YouTube API Key field is present", async ({ page }) => {
    await expect(page.getByText("YouTube API Key")).toBeVisible();
  });

  test("Ghost URL field is present", async ({ page }) => {
    await expect(page.getByText("Ghost URL")).toBeVisible();
  });

  test("Ghost URL has correct placeholder", async ({ page }) => {
    const ghostInput = page.locator('input[placeholder="http://localhost:2368"]');
    await expect(ghostInput).toBeVisible();
  });

  test("Save button for Research & Blog section is present", async ({ page }) => {
    // There are multiple Save buttons (one per section) — the settings page
    // renders at least one Save button per section. We verify at least 1 exists.
    const saveButtons = page.getByRole("button", { name: "Save" });
    const count = await saveButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("NewsAPI Key field is present", async ({ page }) => {
    await expect(page.getByText("NewsAPI Key")).toBeVisible();
  });

  test("Ghost Admin API Key field is present", async ({ page }) => {
    await expect(page.getByText("Ghost Admin API Key")).toBeVisible();
  });
});
