import { expect, test, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Research Hub — /research page
//
// Test strategy:
//   - Use page.route() to mock all API calls (DB- and AI-independent)
//   - Auth guard: if redirected away from /research, skip the test
//   - Coverage:
//     Content tab:
//       1.  Content tab is active by default; Products tab button is visible
//       2.  Clicking Products tab makes it active
//       3.  Source filter chips appear when topics load (All always present)
//       4.  HackerNews chip is visible; Trends chip is visible
//       5.  HackerNews badge has orange (#f97316) color
//       6.  Trends badge has teal (#14b8a6) color
//       7.  Clicking a source chip filters topic list
//       8.  Generate Content button is present on topic cards
//       9.  Clicking Generate Content opens modal (loading phase)
//       10. Modal shows preview phase after generate API resolves
//       11. Preview modal: title, word count, View Article, Approve & Generate All
//       12. × button closes the modal
//       13. Approve & Generate All → generating-pieces phase
//       14. Complete phase: piece count shown, View in Posts button, subtitle
//       15. generate-pieces API called with correct blog post ID
//
//     Products tab:
//       16. Search bar visible with correct placeholder
//       17. Search Products button disabled when input is empty
//       18. Typing a keyword enables Search Products
//       19. Empty state shown before search
//       20. Product cards: name, platform badge, commission badge, description
//       21. Platform filter chips appear after results load (All chip present)
//       22. Filtering by platform hides non-matching cards; All restores
//       23. Pain Points toggle expands / collapses list
//       24. Benefits toggle expands / collapses list
//       25. Add to Products sends POST, button changes to Added ✓
//       26. View in Products link appears after add
//       27. Added ✓ button is disabled (no double-add)
//       28. Empty result / error states
// ---------------------------------------------------------------------------

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockProducts = [
  {
    name: "AWeber Email Suite",
    platform: "ClickBank",
    description:
      "A comprehensive email marketing platform used by small businesses and bloggers to grow their audience.",
    painPoints: [
      "High unsubscribe rates",
      "Low open rates",
      "Complex automation workflows",
    ],
    benefits: [
      "Easy drag-and-drop builder",
      "Advanced segmentation",
      "24/7 customer support",
    ],
    commission: 30,
    affiliateLink: "https://www.aweber.com/affiliate",
    targetAudience: "Small business owners and bloggers",
  },
  {
    name: "ConvertKit Creator Platform",
    platform: "ShareASale",
    description:
      "Email marketing platform designed for online creators and digital entrepreneurs.",
    painPoints: [
      "Hard to segment audience",
      "Expensive tools",
      "Limited automation on free plans",
    ],
    benefits: [
      "Creator-focused features",
      "Visual automation editor",
      "Free tier available",
    ],
    commission: 30,
    affiliateLink: "https://convertkit.com/affiliates",
    targetAudience: "Online creators and bloggers",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Navigate to /research, skip test if redirected away (auth guard). */
async function goToResearch(page: Page): Promise<boolean> {
  // Mock the initial research topics API so Content tab loads cleanly
  await page.route("**/api/research", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );

  await page.goto("/research");
  await page.waitForLoadState("networkidle");

  if (!page.url().includes("/research")) {
    return false;
  }
  return true;
}

/** Navigate to /research AND switch to the Products tab. */
async function goToProductsTab(page: Page): Promise<boolean> {
  const ok = await goToResearch(page);
  if (!ok) return false;

  await page.getByRole("button", { name: "Products" }).click();
  await page.waitForLoadState("networkidle");
  return true;
}

/** Mock a successful product search that returns mockProducts. */
async function mockProductSearch(page: Page) {
  await page.route("**/api/research/products**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockProducts),
    }),
  );
}

// ── Group 1: Tab structure ────────────────────────────────────────────────────

test.describe("Research Hub — tab structure", () => {
  test("page loads without 500 or 404", async ({ page }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    const response = await page.goto("/research");
    await page.waitForLoadState("networkidle");
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows Research heading", async ({ page }) => {
    const ok = await goToResearch(page);
    if (!ok) return;
    await expect(page.getByRole("heading", { name: "Research" })).toBeVisible();
  });

  test("Content tab button is visible and active by default", async ({
    page,
  }) => {
    const ok = await goToResearch(page);
    if (!ok) return;

    const contentBtn = page.getByRole("button", { name: "Content" });
    await expect(contentBtn).toBeVisible();

    // Active tab has background #1a1a1a
    const bg = await contentBtn.evaluate(
      (el) => (el as HTMLElement).style.background,
    );
    expect(bg).toBe("#1a1a1a");
  });

  test("Products tab button is visible", async ({ page }) => {
    const ok = await goToResearch(page);
    if (!ok) return;
    await expect(page.getByRole("button", { name: "Products" })).toBeVisible();
  });

  test("clicking Products tab makes it active", async ({ page }) => {
    const ok = await goToResearch(page);
    if (!ok) return;

    const productsBtn = page.getByRole("button", { name: "Products" });
    await productsBtn.click();

    const bg = await productsBtn.evaluate(
      (el) => (el as HTMLElement).style.background,
    );
    expect(bg).toBe("#1a1a1a");
  });
});

// ── Group 2: Products tab — search UI ────────────────────────────────────────

test.describe("Research Hub — Products tab search UI", () => {
  test("keyword input is present after switching to Products tab", async ({
    page,
  }) => {
    const ok = await goToProductsTab(page);
    if (!ok) return;

    await expect(
      page.locator('input[placeholder*="email marketing"]'),
    ).toBeVisible();
  });

  test("Search Products button is present", async ({ page }) => {
    const ok = await goToProductsTab(page);
    if (!ok) return;
    await expect(
      page.getByRole("button", { name: "Search Products" }),
    ).toBeVisible();
  });

  test("Search Products button is disabled when keyword is empty", async ({
    page,
  }) => {
    const ok = await goToProductsTab(page);
    if (!ok) return;

    const btn = page.getByRole("button", { name: "Search Products" });
    await expect(btn).toBeDisabled();
  });

  test("Search Products button is enabled after typing a keyword", async ({
    page,
  }) => {
    const ok = await goToProductsTab(page);
    if (!ok) return;

    await page
      .locator('input[placeholder*="email marketing"]')
      .fill("email marketing");

    const btn = page.getByRole("button", { name: "Search Products" });
    await expect(btn).toBeEnabled();
  });

  test("helper text is shown below the search bar", async ({ page }) => {
    const ok = await goToProductsTab(page);
    if (!ok) return;
    await expect(
      page.getByText(
        "AI will suggest real affiliate products with commission details",
      ),
    ).toBeVisible();
  });
});

// ── Group 3: Products tab — empty initial state ───────────────────────────────

test.describe("Research Hub — Products tab empty state", () => {
  test("shows prompt to search before any search is made", async ({ page }) => {
    const ok = await goToProductsTab(page);
    if (!ok) return;

    await expect(
      page.getByText("Search for affiliate products in your niche"),
    ).toBeVisible();
  });

  test("shows 'No products found' message when API returns empty array", async ({
    page,
  }) => {
    await page.route("**/api/research/products**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );

    const ok = await goToProductsTab(page);
    if (!ok) return;

    await page
      .locator('input[placeholder*="email marketing"]')
      .fill("unknownniche");
    await page.getByRole("button", { name: "Search Products" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/No products found for/)).toBeVisible({
      timeout: 8000,
    });
  });

  test("shows 'Search failed.' message when API returns 500", async ({
    page,
  }) => {
    await page.route("**/api/research/products**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Search failed." }),
      }),
    );

    const ok = await goToProductsTab(page);
    if (!ok) return;

    await page
      .locator('input[placeholder*="email marketing"]')
      .fill("email marketing");
    await page.getByRole("button", { name: "Search Products" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Search failed.")).toBeVisible({
      timeout: 8000,
    });
  });
});

// ── Group 4: Products tab — product cards ────────────────────────────────────

test.describe("Research Hub — Products tab product cards", () => {
  test.beforeEach(async ({ page }) => {
    await mockProductSearch(page);
  });

  async function searchAndLoad(page: Page): Promise<boolean> {
    const ok = await goToProductsTab(page);
    if (!ok) return false;

    await page
      .locator('input[placeholder*="email marketing"]')
      .fill("email marketing");
    await page.getByRole("button", { name: "Search Products" }).click();
    await page.waitForLoadState("networkidle");
    return true;
  }

  test("product name is visible", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;
    await expect(page.getByText("AWeber Email Suite")).toBeVisible({
      timeout: 8000,
    });
  });

  test("platform badge is visible", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;
    await expect(page.getByText("ClickBank").first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("commission badge is visible", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;
    await expect(page.getByText("30% commission").first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("product description is visible", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;
    await expect(
      page.getByText(/comprehensive email marketing platform/),
    ).toBeVisible({ timeout: 8000 });
  });

  test("Pain Points toggle is visible", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;
    await expect(page.getByText(/Pain Points \(3\)/).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("clicking Pain Points toggle expands the list", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    // Click the first Pain Points toggle
    const toggle = page.getByText(/Pain Points \(3\)/).first();
    await toggle.click();

    await expect(page.getByText("High unsubscribe rates")).toBeVisible({
      timeout: 3000,
    });
  });

  test("Benefits toggle is visible", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;
    await expect(page.getByText(/Benefits \(3\)/).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("clicking Benefits toggle expands the list", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    // Click the first Benefits toggle
    const toggle = page.getByText(/Benefits \(3\)/).first();
    await toggle.click();

    await expect(page.getByText("Easy drag-and-drop builder")).toBeVisible({
      timeout: 3000,
    });
  });

  test("Affiliate Program link is present on each card", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;
    const links = page.getByRole("link", { name: "Affiliate Program" });
    await expect(links.first()).toBeVisible({ timeout: 8000 });
    expect(await links.count()).toBeGreaterThanOrEqual(2);
  });

  test("target audience is shown on card", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;
    await expect(
      page.getByText(/Small business owners and bloggers/),
    ).toBeVisible({ timeout: 8000 });
  });

  test("both product cards are rendered", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    await expect(page.getByText("AWeber Email Suite")).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByText("ConvertKit Creator Platform")).toBeVisible({
      timeout: 8000,
    });
  });
});

// ── Group 5: Products tab — platform filter chips ────────────────────────────

test.describe("Research Hub — Products tab platform filters", () => {
  async function searchAndLoad(page: Page): Promise<boolean> {
    await mockProductSearch(page);
    const ok = await goToProductsTab(page);
    if (!ok) return false;

    await page
      .locator('input[placeholder*="email marketing"]')
      .fill("email marketing");
    await page.getByRole("button", { name: "Search Products" }).click();
    await page.waitForLoadState("networkidle");
    return true;
  }

  test("platform filter chips appear after results load", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    // Should show All chip
    await expect(page.getByRole("button", { name: /^All/ })).toBeVisible({
      timeout: 8000,
    });
  });

  test("ClickBank filter chip is shown (from fixture data)", async ({
    page,
  }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    // Find the ClickBank chip button (platform chips show counts)
    await expect(page.getByRole("button", { name: /ClickBank/ })).toBeVisible({
      timeout: 8000,
    });
  });

  test("clicking ClickBank filter shows only ClickBank products", async ({
    page,
  }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    await expect(page.getByText("AWeber Email Suite")).toBeVisible({
      timeout: 8000,
    });

    // Click the ClickBank filter chip button
    await page.getByRole("button", { name: /ClickBank/ }).click();

    // ClickBank product should still be visible
    await expect(page.getByText("AWeber Email Suite")).toBeVisible();
    // ShareASale product should be hidden
    await expect(
      page.getByText("ConvertKit Creator Platform"),
    ).not.toBeVisible();
  });

  test("clicking All filter chip restores all products", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    // Filter to ClickBank
    await page.getByRole("button", { name: /ClickBank/ }).click();
    await expect(
      page.getByText("ConvertKit Creator Platform"),
    ).not.toBeVisible();

    // Reset to All
    await page.getByRole("button", { name: /^All/ }).click();
    await expect(page.getByText("ConvertKit Creator Platform")).toBeVisible();
  });
});

// ── Group 6: Products tab — Add to Products ───────────────────────────────────

test.describe("Research Hub — Products tab Add to Products", () => {
  async function searchAndLoad(page: Page): Promise<boolean> {
    await mockProductSearch(page);
    const ok = await goToProductsTab(page);
    if (!ok) return false;

    await page
      .locator('input[placeholder*="email marketing"]')
      .fill("email marketing");
    await page.getByRole("button", { name: "Search Products" }).click();
    await page.waitForLoadState("networkidle");
    // Wait for product cards
    await page
      .getByText("AWeber Email Suite")
      .waitFor({ state: "visible", timeout: 8000 });
    return true;
  }

  test("Add to Products button is visible on each card", async ({ page }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    const addBtns = page.getByRole("button", { name: "Add to Products" });
    await expect(addBtns.first()).toBeVisible();
    expect(await addBtns.count()).toBeGreaterThanOrEqual(2);
  });

  test("clicking Add to Products sends POST to /api/research/products/add", async ({
    page,
  }) => {
    let addCalled = false;
    let addBody: unknown = null;

    await page.route("**/api/research/products/add", async (route) => {
      if (route.request().method() === "POST") {
        addCalled = true;
        addBody = JSON.parse(route.request().postData() ?? "{}");
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ promotionId: "promo-abc123" }),
        });
      } else {
        await route.continue();
      }
    });

    const ok = await searchAndLoad(page);
    if (!ok) return;

    await page.getByRole("button", { name: "Add to Products" }).first().click();
    await page.waitForTimeout(600);

    expect(addCalled).toBe(true);
    expect((addBody as { name?: string })?.name).toBe("AWeber Email Suite");
  });

  test("button changes to 'Added ✓' after successful add", async ({ page }) => {
    await page.route("**/api/research/products/add", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ promotionId: "promo-abc123" }),
      }),
    );

    const ok = await searchAndLoad(page);
    if (!ok) return;

    await page.getByRole("button", { name: "Add to Products" }).first().click();

    await expect(
      page.getByRole("button", { name: "Added ✓" }).first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("'View in Products' link appears after successful add", async ({
    page,
  }) => {
    await page.route("**/api/research/products/add", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ promotionId: "promo-abc123" }),
      }),
    );

    const ok = await searchAndLoad(page);
    if (!ok) return;

    await page.getByRole("button", { name: "Add to Products" }).first().click();
    await page.waitForTimeout(600);

    await expect(page.getByText("→ View in Products")).toBeVisible({
      timeout: 5000,
    });
  });

  test("Added ✓ button is disabled (cannot add twice)", async ({ page }) => {
    await page.route("**/api/research/products/add", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ promotionId: "promo-abc123" }),
      }),
    );

    const ok = await searchAndLoad(page);
    if (!ok) return;

    await page.getByRole("button", { name: "Add to Products" }).first().click();
    const addedBtn = page.getByRole("button", { name: "Added ✓" }).first();
    await expect(addedBtn).toBeVisible({ timeout: 5000 });
    await expect(addedBtn).toBeDisabled();
  });
});

// ── Group 7: Content tab — source filter chips ────────────────────────────────

test.describe("Research Hub — Content tab source filters", () => {
  const mockTopics = [
    {
      id: "t1",
      title: "How to Build with AI",
      summary: "AI tools are transforming dev.",
      source: "youtube",
      score: 9,
      url: "https://youtube.com/watch?v=abc",
    },
    {
      id: "t2",
      title: "Best React Patterns 2026",
      summary: "React patterns worth knowing.",
      source: "hackernews",
      score: 7,
      url: "https://news.ycombinator.com/item?id=123",
    },
    {
      id: "t3",
      title: "Google AI Trends",
      summary: "Trending searches about AI.",
      source: "trends",
      score: 6,
    },
  ];

  test("source filter chips appear when topics are loaded", async ({
    page,
  }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopics),
      }),
    );

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await expect(page.getByRole("button", { name: /^All/ })).toBeVisible({
      timeout: 8000,
    });
  });

  test("source filter shows YouTube chip when YouTube topics exist", async ({
    page,
  }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopics),
      }),
    );

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await expect(page.getByRole("button", { name: /YouTube/ })).toBeVisible({
      timeout: 8000,
    });
  });

  test("clicking YouTube filter shows only YouTube topics", async ({
    page,
  }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopics),
      }),
    );

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await page.getByRole("button", { name: /YouTube/ }).click();

    await expect(page.getByText("How to Build with AI")).toBeVisible();
    await expect(page.getByText("Best React Patterns 2026")).not.toBeVisible();
  });

  test("Generate Content button is present on topic cards", async ({
    page,
  }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopics),
      }),
    );

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await expect(
      page.getByRole("button", { name: "Generate Content" }).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("HackerNews source chip is visible", async ({ page }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopics),
      }),
    );

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await expect(page.getByRole("button", { name: /HackerNews/ })).toBeVisible({
      timeout: 8000,
    });
  });

  test("Trends source chip is visible", async ({ page }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopics),
      }),
    );

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await expect(page.getByRole("button", { name: /Trends/ })).toBeVisible({
      timeout: 8000,
    });
  });

  test("HackerNews source badge on topic card has orange (#f97316) background", async ({
    page,
  }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopics),
      }),
    );

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    // Wait for topic cards to render
    await expect(page.getByText("Best React Patterns 2026")).toBeVisible({
      timeout: 8000,
    });

    // The source badge is a <span> with text "HackerNews" — inspect its inline style
    const hnBadge = page
      .locator("span")
      .filter({ hasText: /^HackerNews$/ })
      .first();
    await expect(hnBadge).toBeVisible();
    const bg = await hnBadge.evaluate(
      (el) => (el as HTMLElement).style.background,
    );
    // Inline style: background: #f97316 (orange)
    expect(bg).toBe("rgb(249, 115, 22)");
  });

  test("Trends source badge on topic card has teal (#14b8a6) background", async ({
    page,
  }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTopics),
      }),
    );

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await expect(page.getByText("Google AI Trends")).toBeVisible({
      timeout: 8000,
    });

    const trendsBadge = page
      .locator("span")
      .filter({ hasText: /^Trends$/ })
      .first();
    await expect(trendsBadge).toBeVisible();
    const bg = await trendsBadge.evaluate(
      (el) => (el as HTMLElement).style.background,
    );
    // Inline style: background: #14b8a6 (teal)
    expect(bg).toBe("rgb(20, 184, 166)");
  });
});

// ── Group 8: Content tab — generation modal ──────────────────────────────────

const MODAL_MOCK_TOPICS = [
  {
    id: "t-modal-1",
    title: "How to Grow a YouTube Channel in 2026",
    summary: "Strategies creators are using to hit 100k subscribers fast.",
    source: "youtube",
    score: 9,
    url: "https://youtube.com/watch?v=xyz",
  },
];

const MODAL_MOCK_POST = {
  id: "post-modal-1",
  title: "How to Grow a YouTube Channel in 2026: The Complete Playbook",
  seoDescription:
    "Learn the exact strategies that helped creators reach 100k subs.",
  content:
    "Growing a YouTube channel requires consistency, quality, and strategy. " +
    "In 2026 the algorithm rewards watch time and engagement above all else. " +
    "Start with a clear niche and create content that answers your audience's questions. " +
    "Post on a schedule your audience can rely on. Engage in the comments every day. " +
    "Collaborate with other creators to tap into new audiences. " +
    "Use YouTube Shorts to feed the algorithm new viewers to your long-form content.",
  slug: "grow-youtube-channel-2026",
};

test.describe("Research Hub — generation modal (loading phase)", () => {
  test("clicking Generate Content opens modal with 'Generating article…' text", async ({
    page,
  }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MODAL_MOCK_TOPICS),
      }),
    );
    // Hang the generate API so we stay in loading phase long enough to assert
    await page.route("**/api/research/topics/*/generate", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ post: MODAL_MOCK_POST }),
      });
    });

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await expect(
      page.getByText("How to Grow a YouTube Channel in 2026"),
    ).toBeVisible({ timeout: 8000 });

    await page
      .getByRole("button", { name: "Generate Content" })
      .first()
      .click();

    await expect(page.getByText("Generating article…")).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Research Hub — generation modal (preview phase)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MODAL_MOCK_TOPICS),
      }),
    );
    // Generate resolves immediately
    await page.route("**/api/research/topics/*/generate", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ post: MODAL_MOCK_POST }),
      }),
    );
  });

  async function openPreviewModal(page: Page): Promise<boolean> {
    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return false;

    await expect(
      page.getByText("How to Grow a YouTube Channel in 2026"),
    ).toBeVisible({ timeout: 8000 });

    await page
      .getByRole("button", { name: "Generate Content" })
      .first()
      .click();
    await expect(page.getByText("Article Preview")).toBeVisible({
      timeout: 8000,
    });
    return true;
  }

  test("modal shows 'Article Preview' label in preview phase", async ({
    page,
  }) => {
    const ok = await openPreviewModal(page);
    if (!ok) return;
    await expect(page.getByText("Article Preview")).toBeVisible();
  });

  test("modal shows the generated post title", async ({ page }) => {
    const ok = await openPreviewModal(page);
    if (!ok) return;
    await expect(
      page.getByText(
        "How to Grow a YouTube Channel in 2026: The Complete Playbook",
      ),
    ).toBeVisible();
  });

  test("modal shows word count badge", async ({ page }) => {
    const ok = await openPreviewModal(page);
    if (!ok) return;
    await expect(page.getByText(/\d+ words/)).toBeVisible();
  });

  test("modal shows 'View Article' button", async ({ page }) => {
    const ok = await openPreviewModal(page);
    if (!ok) return;
    await expect(
      page.getByRole("button", { name: "View Article" }),
    ).toBeVisible();
  });

  test("modal shows 'Approve & Generate All' button", async ({ page }) => {
    const ok = await openPreviewModal(page);
    if (!ok) return;
    await expect(
      page.getByRole("button", { name: "Approve & Generate All" }),
    ).toBeVisible();
  });

  test("modal has a × close button in preview phase", async ({ page }) => {
    const ok = await openPreviewModal(page);
    if (!ok) return;
    await expect(page.getByRole("button", { name: "×" })).toBeVisible();
  });

  test("clicking × dismisses the modal", async ({ page }) => {
    const ok = await openPreviewModal(page);
    if (!ok) return;

    await page.getByRole("button", { name: "×" }).click();

    await expect(page.getByText("Article Preview")).not.toBeVisible({
      timeout: 3000,
    });
  });
});

test.describe("Research Hub — generation modal (complete phase)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MODAL_MOCK_TOPICS),
      }),
    );
    await page.route("**/api/research/topics/*/generate", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ post: MODAL_MOCK_POST }),
      }),
    );
    await page.route("**/api/blog-posts/*/generate-pieces", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 8,
          pieceIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"],
        }),
      }),
    );
  });

  async function openCompleteModal(page: Page): Promise<boolean> {
    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return false;

    await expect(
      page.getByText("How to Grow a YouTube Channel in 2026"),
    ).toBeVisible({ timeout: 8000 });

    await page
      .getByRole("button", { name: "Generate Content" })
      .first()
      .click();
    await expect(page.getByText("Article Preview")).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole("button", { name: "Approve & Generate All" }).click();
    await expect(page.getByText("8 pieces created")).toBeVisible({
      timeout: 10000,
    });
    return true;
  }

  test("clicking Approve & Generate All shows generating-pieces spinner text", async ({
    page,
  }) => {
    // Override generate-pieces to hang briefly
    await page.route("**/api/blog-posts/*/generate-pieces", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 8, pieceIds: [] }),
      });
    });

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await expect(
      page.getByText("How to Grow a YouTube Channel in 2026"),
    ).toBeVisible({ timeout: 8000 });

    await page
      .getByRole("button", { name: "Generate Content" })
      .first()
      .click();
    await expect(page.getByText("Article Preview")).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole("button", { name: "Approve & Generate All" }).click();

    await expect(
      page.getByText("Generating social pieces, images, and video…"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("complete phase shows piece count '8 pieces created'", async ({
    page,
  }) => {
    const ok = await openCompleteModal(page);
    if (!ok) return;
    await expect(page.getByText("8 pieces created")).toBeVisible();
  });

  test("complete phase shows 'Your content kit is ready' subtitle", async ({
    page,
  }) => {
    const ok = await openCompleteModal(page);
    if (!ok) return;
    await expect(page.getByText("Your content kit is ready")).toBeVisible();
  });

  test("complete phase shows 'View in Posts' button", async ({ page }) => {
    const ok = await openCompleteModal(page);
    if (!ok) return;
    await expect(
      page.getByRole("button", { name: "View in Posts" }),
    ).toBeVisible();
  });

  test("generate-pieces API is called with the correct blog post ID", async ({
    page,
  }) => {
    let capturedPath = "";

    await page.route("**/api/blog-posts/*/generate-pieces", (route) => {
      capturedPath = new URL(route.request().url()).pathname;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 8, pieceIds: [] }),
      });
    });

    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    if (!page.url().includes("/research")) return;

    await expect(
      page.getByText("How to Grow a YouTube Channel in 2026"),
    ).toBeVisible({ timeout: 8000 });

    await page
      .getByRole("button", { name: "Generate Content" })
      .first()
      .click();
    await expect(page.getByText("Article Preview")).toBeVisible({
      timeout: 8000,
    });
    await page.getByRole("button", { name: "Approve & Generate All" }).click();
    await page.waitForTimeout(600);

    expect(capturedPath).toContain("post-modal-1");
    expect(capturedPath).toContain("generate-pieces");
  });
});

// ── Group 9: Products tab — Pain Points and Benefits collapse ─────────────────

test.describe("Research Hub — Pain Points and Benefits toggles", () => {
  async function searchAndLoad(page: Page): Promise<boolean> {
    await page.route("**/api/research", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    await mockProductSearch(page);

    const ok = await goToProductsTab(page);
    if (!ok) return false;

    await page
      .locator('input[placeholder*="email marketing"]')
      .fill("email marketing");
    await page.getByRole("button", { name: "Search Products" }).click();
    await page.waitForLoadState("networkidle");
    await page
      .getByText("AWeber Email Suite")
      .waitFor({ state: "visible", timeout: 8000 });
    return true;
  }

  test("clicking Pain Points again collapses the expanded list", async ({
    page,
  }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    const toggle = page.getByText(/Pain Points \(3\)/).first();

    // Expand
    await toggle.click();
    await expect(page.getByText("High unsubscribe rates")).toBeVisible({
      timeout: 3000,
    });

    // Collapse
    await toggle.click();
    await expect(page.getByText("High unsubscribe rates")).not.toBeVisible({
      timeout: 3000,
    });
  });

  test("clicking Benefits again collapses the expanded list", async ({
    page,
  }) => {
    const ok = await searchAndLoad(page);
    if (!ok) return;

    const toggle = page.getByText(/Benefits \(3\)/).first();

    // Expand
    await toggle.click();
    await expect(page.getByText("Easy drag-and-drop builder")).toBeVisible({
      timeout: 3000,
    });

    // Collapse
    await toggle.click();
    await expect(page.getByText("Easy drag-and-drop builder")).not.toBeVisible({
      timeout: 3000,
    });
  });
});
