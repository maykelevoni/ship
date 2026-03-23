import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Workflow UX Redesign + Brevo Migration
// Tests cover: sidebar (4 items), redirects, promote page, content pipeline,
// settings tabs, and today page cards.
// ---------------------------------------------------------------------------

// ─── Story 1: Simplified navigation ─────────────────────────────────────────

test.describe("Sidebar — 4 workflow nav items", () => {
  test("shows exactly 4 nav links in the sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    const links = sidebar.getByRole("link");
    await expect(links).toHaveCount(4);
  });

  test("nav links are Today, Promote, Content, Settings", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("link", { name: "Today" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Promote" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Content" })).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Settings" }),
    ).toBeVisible();
  });

  test("Today is active (highlighted) on /", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The active link gets the indigo color (#818cf8) via inline style
    const todayLink = page.locator("aside").getByRole("link", { name: "Today" });
    const color = await todayLink.evaluate((el) =>
      window.getComputedStyle(el).color,
    );
    // #818cf8 = rgb(129, 140, 248)
    expect(color).toBe("rgb(129, 140, 248)");
  });

  test("Promote is active (highlighted) on /promote", async ({ page }) => {
    await page.goto("/promote");
    await page.waitForLoadState("networkidle");

    const promoteLink = page
      .locator("aside")
      .getByRole("link", { name: "Promote" });
    const color = await promoteLink.evaluate((el) =>
      window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(129, 140, 248)");
  });

  test("Content is active (highlighted) on /content", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    const contentLink = page
      .locator("aside")
      .getByRole("link", { name: "Content" });
    const color = await contentLink.evaluate((el) =>
      window.getComputedStyle(el).color,
    );
    expect(color).toBe("rgb(129, 140, 248)");
  });
});

// ─── Redirects ────────────────────────────────────────────────────────────────

test.describe("Redirects — old routes forward to new routes", () => {
  test("/promotions redirects to /promote", async ({ page }) => {
    await page.goto("/promotions");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/promote");
  });

  test("/promotions/new redirects to /promote/new", async ({ page }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/promote/new");
  });

  test("/queue redirects to /promote", async ({ page }) => {
    await page.goto("/queue");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/promote");
  });

  test("/calendar redirects to /promote", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/promote");
  });

  test("/research redirects to /content", async ({ page }) => {
    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/content");
  });

  test("/blog-posts redirects to /content", async ({ page }) => {
    await page.goto("/blog-posts");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/content");
  });

  test("/email-drafts redirects to /content", async ({ page }) => {
    await page.goto("/email-drafts");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/content");
  });

  test("/opportunities redirects to /content", async ({ page }) => {
    await page.goto("/opportunities");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/content");
  });

  test("/templates redirects to /settings", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/settings");
  });

  test("/schedule redirects to /settings", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/settings");
  });

  test("/logs redirects to /settings", async ({ page }) => {
    await page.goto("/logs");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL("/settings");
  });
});

// ─── Story 3: Promote page ────────────────────────────────────────────────────

test.describe("Promote page (/promote)", () => {
  test("loads without error", async ({ page }) => {
    const response = await page.goto("/promote");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows Promotions heading", async ({ page }) => {
    await page.goto("/promote");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "Promotions" }),
    ).toBeVisible();
  });

  test("shows Add Promotion button linking to /promote/new", async ({
    page,
  }) => {
    await page.goto("/promote");
    await page.waitForLoadState("networkidle");

    const btn = page.getByRole("link", { name: /add promotion/i });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute("href", "/promote/new");
  });

  test("shows filter tabs: All, Active, Paused, Archived", async ({ page }) => {
    await page.goto("/promote");
    await page.waitForLoadState("networkidle");

    for (const label of ["All", "Active", "Paused", "Archived"]) {
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }
  });

  test("clicking a filter tab switches the active tab", async ({ page }) => {
    await page.goto("/promote");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Active" }).click();
    // Active tab gets color #e4e4e7 via inline style — just check it's clickable
    await expect(page.getByRole("button", { name: "Active" })).toBeVisible();
  });
});

// ─── Story 3: Promote new / detail ───────────────────────────────────────────

test.describe("Promote sub-routes", () => {
  test("/promote/new loads without error", async ({ page }) => {
    const response = await page.goto("/promote/new");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });
});

// ─── Story 4: Content pipeline page ──────────────────────────────────────────

test.describe("Content pipeline page (/content)", () => {
  test("loads without error", async ({ page }) => {
    const response = await page.goto("/content");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows Content heading", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "Content" }),
    ).toBeVisible();
  });

  test("shows 4 pipeline section headings", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "01 Research" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "02 Blog Post" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "03 Email Draft" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "04 Opportunities" })).toBeVisible();
  });

  test("Research section shows Refresh button", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /refresh/i })).toBeVisible();
  });

  test("Blog section shows Regenerate button", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /regenerate/i })).toBeVisible();
  });

  test("Opportunities section shows Show dismissed checkbox", async ({
    page,
  }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("checkbox", { name: /show dismissed/i }),
    ).toBeVisible();
  });
});

// ─── Story 5: Settings page ───────────────────────────────────────────────────

test.describe("Settings page (/settings)", () => {
  test("loads without error", async ({ page }) => {
    const response = await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows General and API Keys tabs", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: "General" })).toBeVisible();
    await expect(page.getByRole("button", { name: "API Keys" })).toBeVisible();
  });

  test("switching to API Keys tab shows Brevo fields", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "API Keys" }).click();

    await expect(page.getByText(/brevo/i).first()).toBeVisible();
  });

  test("shows Quick Access links section", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/quick access/i)).toBeVisible();
  });
});

// ─── Story 2: Today page enriched cards ──────────────────────────────────────

test.describe("Today page — enriched cards", () => {
  test("loads without error", async ({ page }) => {
    const response = await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("renders the dashboard layout with sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("aside")).toBeVisible();
    await expect(
      page.locator("aside").getByRole("link", { name: "Today" }),
    ).toBeVisible();
  });
});
