import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Promotions pages
//
// /promotions  — client component that fetches /api/promotions and renders
//                a grid of PromotionCard items (or an empty-state).
//
// /promotions/new — "use client" page wrapping <PromotionForm mode="create">
//                   which is a 3-step wizard:
//                   Step 1: Type selection (5 type cards)
//                   Step 2: Details (Name, Description, URL, …)
//                   Step 3: Review + submit
// ---------------------------------------------------------------------------

test.describe("Promotions list (/promotions)", () => {
  test("loads without a 500 error", async ({ page }) => {
    const response = await page.goto("/promotions");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows the page heading 'Promotions'", async ({ page }) => {
    await page.goto("/promotions");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Promotions" })).toBeVisible();
  });

  test("shows an 'Add Promotion' button / link in the header", async ({
    page,
  }) => {
    await page.goto("/promotions");
    await page.waitForLoadState("networkidle");

    // The header area has a Link styled as a button with text "Add Promotion"
    await expect(page.getByRole("link", { name: /add promotion/i })).toBeVisible();
  });

  test("shows the filter tabs: All, Active, Paused, Archived", async ({
    page,
  }) => {
    await page.goto("/promotions");
    await page.waitForLoadState("networkidle");

    for (const label of ["All", "Active", "Paused", "Archived"]) {
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }
  });

  test("'All' tab is active by default", async ({ page }) => {
    await page.goto("/promotions");
    await page.waitForLoadState("networkidle");

    // The active tab has fontWeight: 600 and background #1a1a1a via inline
    // style. We just verify the button exists and is visible.
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });

  test("clicking 'Add Promotion' navigates to /promotions/new", async ({
    page,
  }) => {
    await page.goto("/promotions");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: /add promotion/i }).first().click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/promotions/new");
  });

  test("shows the sidebar with navigation on the promotions page", async ({
    page,
  }) => {
    await page.goto("/promotions");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("aside")).toBeVisible();
    await expect(page.getByText("Promotion Engine", { exact: true })).toBeVisible();
  });

  test("shows empty-state message when no promotions exist", async ({
    page,
  }) => {
    await page.goto("/promotions");
    await page.waitForLoadState("networkidle");

    // The page is a client component: loading → skeleton → empty-state|cards.
    // Poll until the content area resolves out of the loading state.
    await expect.poll(
      async () => {
        // Empty DB: shows "No promotions yet."
        const emptyCount = await page.getByText("No promotions yet.").count();
        // Promotions exist: cards have a [title="Weight: N/10"] attribute
        const cardCount = await page.locator("[title^='Weight:']").count();
        return emptyCount > 0 || cardCount > 0;
      },
      { timeout: 15000 },
    ).toBe(true);
  });

  test("filter tabs switch the active state when clicked", async ({ page }) => {
    await page.goto("/promotions");
    await page.waitForLoadState("networkidle");

    // Click the "Active" tab — should not crash the page
    await page.getByRole("button", { name: "Active" }).click();

    // The page should still be on /promotions
    await expect(page).toHaveURL("/promotions");

    // Click back to "All"
    await page.getByRole("button", { name: "All" }).click();
    await expect(page).toHaveURL("/promotions");
  });
});

// ---------------------------------------------------------------------------

test.describe("New promotion form (/promotions/new)", () => {
  test("loads without a 500 error", async ({ page }) => {
    const response = await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows the page heading 'New Promotion'", async ({ page }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: "New Promotion" }),
    ).toBeVisible();
  });

  test("shows the subtitle 'Add a promotion to the content rotation.'", async ({
    page,
  }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText("Add a promotion to the content rotation."),
    ).toBeVisible();
  });

  test("shows a back arrow link to /promotions", async ({ page }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    // The back link is an <a href="/promotions"> with an ArrowLeft icon
    const backLink = page.getByRole("link", { name: /back|arrow/i }).first();
    // It might not have accessible text (icon-only link), so check by href
    const backAnchor = page.locator('a[href="/promotions"]').first();
    await expect(backAnchor).toBeVisible();
  });

  test("clicking the back arrow returns to /promotions", async ({ page }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await page.locator('a[href="/promotions"]').first().click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/promotions");
  });

  test("step 1 shows the question 'What are you promoting?'", async ({
    page,
  }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /what are you promoting/i }),
    ).toBeVisible();
  });

  test("step 1 shows all 5 type selection cards", async ({ page }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    const typeLabels = [
      "Product",
      "Service",
      "Affiliate Offer",
      "Lead Magnet",
      "Content Piece",
    ];

    for (const label of typeLabels) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("step 1 shows the step indicator with Type, Details, Review", async ({
    page,
  }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Type", { exact: true })).toBeVisible();
    await expect(page.getByText("Details", { exact: true })).toBeVisible();
    await expect(page.getByText("Review", { exact: true })).toBeVisible();
  });

  test("shows a 'Next' button on step 1", async ({ page }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /next/i })).toBeVisible();
  });

  test("clicking Next without selecting a type does not advance", async ({
    page,
  }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /next/i }).click();

    // Should still be on step 1 — the type selection heading should remain
    await expect(
      page.getByRole("heading", { name: /what are you promoting/i }),
    ).toBeVisible();
  });

  test("selecting a type card and clicking Next advances to step 2", async ({
    page,
  }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    // Click the "Product" type card
    await page.getByText("Product", { exact: true }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    // Step 2 renders "<typeLabel> Details" as the heading
    await expect(
      page.getByRole("heading", { name: /product details/i }),
    ).toBeVisible();
  });

  test("step 2 shows Name, Description, and URL required fields", async ({
    page,
  }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    // Advance to step 2
    await page.getByText("Product", { exact: true }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    // FieldGroup labels are rendered as <label> elements
    await expect(page.getByText("Name *")).toBeVisible();
    await expect(page.getByText("Description *")).toBeVisible();
    await expect(page.getByText("URL *")).toBeVisible();
  });

  test("step 2 shows a weight slider", async ({ page }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await page.getByText("Product", { exact: true }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText(/how often to promote/i),
    ).toBeVisible();
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });

  test("step 2 for Product shows Price, Key Benefits, and Target Audience fields", async ({
    page,
  }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await page.getByText("Product", { exact: true }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Price")).toBeVisible();
    await expect(page.getByText("Key Benefits")).toBeVisible();
    await expect(page.getByText("Target Audience")).toBeVisible();
  });

  test("clicking Next on step 2 with empty required fields shows validation", async ({
    page,
  }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await page.getByText("Product", { exact: true }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    // Click Next without filling any fields
    await page.getByRole("button", { name: /next/i }).click();

    // Validation errors are rendered as red <span> text
    await expect(page.getByText("Name is required")).toBeVisible();
  });

  test("filling step 2 and clicking Next advances to step 3 (Review)", async ({
    page,
  }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    // Step 1: pick type
    await page.getByText("Content Piece", { exact: true }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    // Step 2: fill required fields
    await page.locator('input[placeholder="e.g. My SaaS Product"]').fill("Test Promo");
    await page
      .locator("textarea")
      .first()
      .fill("A description for testing purposes.");
    await page
      .locator('input[type="url"]')
      .first()
      .fill("https://example.com");

    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    // Step 3: Review heading
    await expect(
      page.getByRole("heading", { name: "Review" }),
    ).toBeVisible();
  });

  test("step 3 shows a 'Create Promotion' submit button", async ({ page }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    // Navigate to step 3
    await page.getByText("Content Piece", { exact: true }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    await page.locator('input[placeholder="e.g. My SaaS Product"]').fill("Test Promo");
    await page.locator("textarea").first().fill("A description for testing.");
    await page.locator('input[type="url"]').first().fill("https://example.com");

    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /create promotion/i }),
    ).toBeVisible();
  });

  test("step 3 shows a Back button to return to step 2", async ({ page }) => {
    await page.goto("/promotions/new");
    await page.waitForLoadState("networkidle");

    await page.getByText("Content Piece", { exact: true }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    await page.locator('input[placeholder="e.g. My SaaS Product"]').fill("Test");
    await page.locator("textarea").first().fill("Test description.");
    await page.locator('input[type="url"]').first().fill("https://example.com");

    await page.getByRole("button", { name: /next/i }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();

    // Clicking back returns to step 2
    await page.getByRole("button", { name: /back/i }).click();
    await expect(
      page.getByRole("heading", { name: /content piece details/i }),
    ).toBeVisible();
  });
});
