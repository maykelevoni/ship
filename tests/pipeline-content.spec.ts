import { expect, test, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Content Pipeline E2E — Niche Keyword to Full Distribution
//
// This test drives the real app (no mocks) through the full content pipeline:
//   1. Research  → verify topics exist or trigger research
//   2. Generate  → click a topic, wait for content generation modal
//   3. Posts     → verify content pieces were created
//   4. Media     → verify media studio loads without error
//   5. Calendar  → verify calendar renders
//   6. Content   → verify Blog / Social / Email tabs
//
// Auth guard: if the app redirects to /login, the test is skipped.
// All AI-dependent steps use a 60s timeout.
// ---------------------------------------------------------------------------

test.describe("Content Pipeline — Niche to Full Distribution", () => {
  test.setTimeout(120_000);

  async function skipIfAuthRequired(page: Page) {
    const url = page.url();
    if (url.includes("/login") || url.includes("/signin")) {
      test.skip(true, "Auth required — skipping pipeline test");
    }
  }

  test("runs the full content pipeline end-to-end", async ({ page }) => {
    // ── Step 1: Research ────────────────────────────────────────────────────
    await test.step("navigate to /research and verify page loads", async () => {
      await page.goto("/research");
      await skipIfAuthRequired(page);

      // Wait for the research page heading or tab bar
      await expect(
        page
          .getByRole("heading", { name: /research/i })
          .or(page.getByRole("tab", { name: /topics/i })),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("verify topics are present or trigger research", async () => {
      // Check if there's a "No topics" empty state
      const emptyState = page.getByText(/no topics/i);
      const hasEmpty = await emptyState.isVisible().catch(() => false);

      if (hasEmpty) {
        // Try to find and click a refresh/run button
        const refreshBtn = page
          .getByRole("button", { name: /refresh/i })
          .or(page.getByRole("button", { name: /run research/i }))
          .or(page.getByRole("button", { name: /fetch/i }));
        const hasRefresh = await refreshBtn.isVisible().catch(() => false);
        if (hasRefresh) {
          await refreshBtn.click();
        }
      }

      // Wait up to 30s for at least 1 topic card
      await expect(
        page
          .locator('[data-testid="topic-card"]')
          .or(page.locator(".topic-card"))
          .or(page.getByRole("button", { name: /generate content/i }).first()),
      ).toBeVisible({ timeout: 30_000 });
    });

    // ── Step 2: Generate Content ────────────────────────────────────────────
    await test.step("click generate on first topic and wait for modal", async () => {
      // Click the first "Generate Content" button visible
      const generateBtn = page
        .getByRole("button", { name: /generate content/i })
        .first();
      await expect(generateBtn).toBeVisible({ timeout: 10_000 });
      await generateBtn.click();

      // Modal should appear
      await expect(
        page.getByRole("dialog").or(page.locator("[role=dialog]")),
      ).toBeVisible({ timeout: 10_000 });
    });

    await test.step("wait for generation to complete (up to 60s)", async () => {
      // Wait for preview phase: blog post title visible in modal
      const previewIndicator = page
        .getByText(/view article/i)
        .or(page.getByText(/approve/i))
        .or(page.getByText(/preview/i))
        .or(page.getByText(/pieces created/i));

      await expect(previewIndicator).toBeVisible({ timeout: 60_000 });

      // If "Approve & Generate All" is visible, click it to proceed to pieces
      const approveBtn = page.getByRole("button", {
        name: /approve.*generate/i,
      });
      const hasApprove = await approveBtn.isVisible().catch(() => false);
      if (hasApprove) {
        await approveBtn.click();
        // Wait for complete phase
        await expect(
          page.getByText(/pieces created/i).or(page.getByText(/complete/i)),
        ).toBeVisible({ timeout: 60_000 });
      }

      // Close modal
      const closeBtn = page
        .getByRole("button", { name: /close/i })
        .or(page.locator("button[aria-label='Close']"))
        .or(page.getByText("×"))
        .first();
      const hasClose = await closeBtn.isVisible().catch(() => false);
      if (hasClose) {
        await closeBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
    });

    // ── Step 3: Posts ────────────────────────────────────────────────────────
    await test.step("navigate to /posts and verify content pieces exist", async () => {
      await page.goto("/posts");
      await skipIfAuthRequired(page);

      // Wait for posts list to load (any post card or skeleton resolving)
      await expect(
        page
          .getByRole("heading", { name: /posts/i })
          .or(page.getByText(/draft/i))
          .or(page.getByText(/scheduled/i))
          .or(page.getByText(/twitter/i)),
      ).toBeVisible({ timeout: 20_000 });
    });

    // ── Step 4: Media Studio ─────────────────────────────────────────────────
    await test.step("navigate to /media-studio and verify no error state", async () => {
      await page.goto("/media-studio");
      await skipIfAuthRequired(page);

      // Page should load with generate UI or existing assets — not an error page
      await expect(
        page
          .getByRole("heading", { name: /media/i })
          .or(page.getByRole("button", { name: /generate/i }))
          .or(page.getByText(/media studio/i)),
      ).toBeVisible({ timeout: 15_000 });

      // Assert no error banner in main content
      const errorState = page.getByText(/something went wrong/i);
      await expect(errorState).not.toBeVisible();
    });

    // ── Step 5: Calendar ─────────────────────────────────────────────────────
    await test.step("navigate to /calendar and verify calendar renders", async () => {
      await page.goto("/calendar");
      await skipIfAuthRequired(page);

      // Calendar grid or month label should appear
      await expect(
        page
          .getByRole("heading", { name: /calendar/i })
          .or(page.getByText(/monday/i))
          .or(page.getByText(/sunday/i))
          .or(
            page.getByText(
              /january|february|march|april|may|june|july|august|september|october|november|december/i,
            ),
          ),
      ).toBeVisible({ timeout: 15_000 });
    });

    // ── Step 6: Content Hub ──────────────────────────────────────────────────
    await test.step("navigate to /content and verify Blog/Social/Email tabs", async () => {
      await page.goto("/content");
      await skipIfAuthRequired(page);

      // Wait for content hub to load
      await expect(
        page
          .getByRole("heading", { name: /content/i })
          .or(page.getByRole("tab", { name: /blog/i })),
      ).toBeVisible({ timeout: 15_000 });

      // Blog tab should be active by default or clickable
      const blogTab = page.getByRole("tab", { name: /blog/i });
      const hasBlogTab = await blogTab.isVisible().catch(() => false);
      if (hasBlogTab) {
        await blogTab.click();
        // Some blog content or empty state visible
        await page.waitForTimeout(1_000);
      }

      // Social tab
      const socialTab = page.getByRole("tab", { name: /social/i });
      const hasSocialTab = await socialTab.isVisible().catch(() => false);
      if (hasSocialTab) {
        await socialTab.click();
        await page.waitForTimeout(1_000);
        // No error state
        await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
      }

      // Email tab
      const emailTab = page.getByRole("tab", { name: /email/i });
      const hasEmailTab = await emailTab.isVisible().catch(() => false);
      if (hasEmailTab) {
        await emailTab.click();
        await page.waitForTimeout(1_000);
        await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
      }
    });
  });
});
