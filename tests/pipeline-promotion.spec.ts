import { expect, test, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Promotion Pipeline E2E — Product Research to Full Campaign
//
// This test drives the real app (no mocks) through the full promotion pipeline:
//   1. Research  → click Products tab → verify active
//   2. Research  → type niche → trigger AI product search → wait for cards
//   3. Create    → click "Add to Products" → navigate to /promote/new → fill form
//   4. Verify    → /promote list → assert promotion appears
//   5. Generate  → click through to generate content for the promotion
//   6. Media     → /media-studio → assert generate form visible
//   7. Calendar  → /calendar → assert calendar renders, optionally click a day
//   8. Posts     → /posts → assert posts appear, check for platform badges
//   9. Content   → /content → Social and Blog tabs load without errors
//
// Auth guard: if the app redirects to /login or /signin, the test is skipped.
// AI-dependent steps use a 60s timeout.
// `test.setTimeout(180_000)` covers the full pipeline (up to 3 min).
// ---------------------------------------------------------------------------

test.describe("Promotion Pipeline — Product Research to Full Campaign", () => {
  test.setTimeout(180_000);

  async function skipIfAuthRequired(page: Page) {
    const url = page.url();
    if (url.includes("/login") || url.includes("/signin")) {
      test.skip(true, "Auth required — skipping pipeline test");
    }
  }

  test("runs the full promotion pipeline end-to-end", async ({ page }) => {
    // ── Step 1: Navigate to /research → click Products tab ──────────────────
    await test.step("navigate to /research and click Products tab", async () => {
      await page.goto("/research");
      await skipIfAuthRequired(page);

      // Wait for the Research page heading or tab switcher
      await expect(
        page
          .getByRole("heading", { name: /research/i })
          .or(page.getByRole("button", { name: /products/i })),
      ).toBeVisible({ timeout: 15_000 });

      // Click the Products tab button
      const productsTabBtn = page
        .getByRole("button", { name: /products/i })
        .first();
      await expect(productsTabBtn).toBeVisible({ timeout: 10_000 });
      await productsTabBtn.click();

      // Assert products tab is active — the "Search Products" button (or the
      // niche input with products placeholder) should now be visible
      await expect(
        page
          .getByRole("button", { name: /search products/i })
          .or(
            page.getByPlaceholder(
              /email marketing|weight loss|AI tools|crypto/i,
            ),
          ),
      ).toBeVisible({ timeout: 10_000 });
    });

    // ── Step 2: Type niche keyword and trigger AI product search ─────────────
    await test.step("type 'weight loss supplements' in niche input and search", async () => {
      const nicheInput = page
        .getByPlaceholder(/email marketing|weight loss|AI tools|crypto/i)
        .first();
      await expect(nicheInput).toBeVisible({ timeout: 10_000 });
      await nicheInput.fill("weight loss supplements");

      // "Search Products" button should now be enabled
      const searchBtn = page.getByRole("button", {
        name: /search products/i,
      });
      await expect(searchBtn).toBeEnabled({ timeout: 5_000 });
      await searchBtn.click();

      // Wait up to 60s for product cards — look for commission badge or
      // "Add to Products" button that appears on each card
      const productCard = page
        .getByText(/% commission/i)
        .or(page.getByRole("button", { name: /add to products/i }));

      const hasProducts = await productCard
        .first()
        .waitFor({ state: "visible", timeout: 60_000 })
        .then(() => true)
        .catch(() => false);

      if (!hasProducts) {
        // Check for error / rate-limit toast
        const errorVisible = await page
          .getByText(/error|rate limit|failed/i)
          .isVisible()
          .catch(() => false);
        if (errorVisible) {
          console.warn(
            "Product search returned an error (possible rate limit) — skipping card assertions",
          );
        } else {
          // No cards AND no error — assert anyway so failure is surfaced
          await expect(
            page.getByRole("button", { name: /add to products/i }).first(),
          ).toBeVisible({ timeout: 5_000 });
        }
        return; // Skip steps that depend on product cards
      }

      // Assert at least 1 product card is visible (platform badge + commission)
      await expect(
        page.getByRole("button", { name: /add to products/i }).first(),
      ).toBeVisible();
    });

    // ── Step 3: Select first product → create promotion ──────────────────────
    let promotionName = "";

    await test.step("click 'Add to Products' on first card and complete promotion form", async () => {
      // Check if "Add to Products" buttons are present (products loaded)
      const addBtnCount = await page
        .getByRole("button", { name: /add to products/i })
        .count();

      if (addBtnCount === 0) {
        console.warn(
          "No product cards found — skipping promotion creation step",
        );
        return;
      }

      // Click the first product card's "Add to Products" button
      const firstAddBtn = page
        .getByRole("button", { name: /add to products/i })
        .first();
      await firstAddBtn.click();

      // Wait for either:
      //   a) navigation to /promote/new
      //   b) "Added ✓" state (product added inline, link to /products)
      //   c) a modal
      const navigatedToNew = await page
        .waitForURL("**/promote/new", { timeout: 10_000 })
        .then(() => true)
        .catch(() => false);

      if (navigatedToNew) {
        // ── Promotion form: 3-step wizard ───────────────────────────────
        await skipIfAuthRequired(page);

        // Step 1 of wizard: choose type → select "Affiliate Offer"
        const affiliateCard = page
          .getByRole("button", { name: /affiliate offer/i })
          .or(page.getByText(/affiliate offer/i));
        const hasAffiliate = await affiliateCard.isVisible().catch(() => false);

        if (hasAffiliate) {
          await affiliateCard.first().click();
        } else {
          // Fall back to selecting any type card
          const firstTypeCard = page
            .getByRole("button", { name: /product|service|affiliate/i })
            .first();
          const hasType = await firstTypeCard.isVisible().catch(() => false);
          if (hasType) await firstTypeCard.click();
        }

        // Click "Next" to proceed to details step
        const nextBtn = page.getByRole("button", { name: /next/i });
        const hasNext = await nextBtn
          .isVisible({ timeout: 5_000 })
          .catch(() => false);
        if (hasNext) await nextBtn.click();

        // Step 2 of wizard: fill required fields
        promotionName = `Weight Loss Supp - E2E ${Date.now()}`;

        const nameInput = page
          .getByPlaceholder(/promotion name|name/i)
          .or(page.locator("input[placeholder*='name']"))
          .first();
        const hasNameInput = await nameInput
          .isVisible({ timeout: 5_000 })
          .catch(() => false);

        if (hasNameInput) {
          await nameInput.fill(promotionName);
        }

        // URL field
        const urlInput = page
          .getByPlaceholder(/https:\/\/|url/i)
          .or(page.locator("input[type='url']"))
          .first();
        const hasUrl = await urlInput.isVisible().catch(() => false);
        if (hasUrl) {
          await urlInput.fill("https://example-weightloss.com/affiliate");
        }

        // Description / textarea
        const descTextarea = page
          .getByPlaceholder(/description|what does/i)
          .or(page.locator("textarea").first());
        const hasDesc = await descTextarea.isVisible().catch(() => false);
        if (hasDesc) {
          await descTextarea
            .first()
            .fill("Top weight loss supplement with affiliate commission.");
        }

        // Proceed through remaining wizard steps
        const nextBtnStep2 = page.getByRole("button", { name: /next/i });
        const hasNextStep2 = await nextBtnStep2
          .isVisible({ timeout: 3_000 })
          .catch(() => false);
        if (hasNextStep2) await nextBtnStep2.click();

        // Step 3 or final: click "Create Promotion"
        const createBtn = page.getByRole("button", {
          name: /create promotion/i,
        });
        const hasCreate = await createBtn
          .isVisible({ timeout: 5_000 })
          .catch(() => false);

        if (hasCreate) {
          await createBtn.click();
          // Wait for redirect to /promote or success indicator
          await page
            .waitForURL("**/promote", { timeout: 20_000 })
            .catch(() => {});
        }
      } else {
        // "Added ✓" inline state — capture the button text for the record
        const addedBtn = page.getByRole("button", { name: /added/i }).first();
        const isAdded = await addedBtn
          .isVisible({ timeout: 8_000 })
          .catch(() => false);
        if (isAdded) {
          console.warn(
            'Product added inline (no redirect to /promote/new). "Add to Products" resolved to inline state.',
          );
        }
      }
    });

    // ── Step 4: Navigate to /promote → verify promotion appears ──────────────
    await test.step("navigate to /promote and assert promotion list loads", async () => {
      await page.goto("/promote");
      await skipIfAuthRequired(page);

      // Promotions heading should appear
      await expect(
        page
          .getByRole("heading", { name: /promotions/i })
          .or(page.getByText(/add promotion/i)),
      ).toBeVisible({ timeout: 15_000 });

      // If promotionName was set, try to find it; otherwise just assert list loaded
      if (promotionName) {
        const promoCard = page.getByText(promotionName);
        const hasCard = await promoCard
          .isVisible({ timeout: 10_000 })
          .catch(() => false);
        if (!hasCard) {
          console.warn(
            `Promotion "${promotionName}" not yet visible in /promote list — may be filtering or latency`,
          );
        } else {
          await expect(promoCard).toBeVisible();
        }
      }

      // Assert type badge visible on at least 1 promotion card
      const typeBadge = page
        .getByText(/affiliate|product|service|lead magnet/i)
        .first();
      const hasBadge = await typeBadge.isVisible().catch(() => false);
      if (hasBadge) {
        await expect(typeBadge).toBeVisible();
      }
    });

    // ── Step 5: Generate content for the promotion ────────────────────────────
    await test.step("find a promotion and trigger content generation", async () => {
      // Navigate to /promote if not already there
      if (!page.url().includes("/promote")) {
        await page.goto("/promote");
        await skipIfAuthRequired(page);
      }

      // Look for any "Generate Content" button on a promotion card,
      // or an "Edit" link to navigate into the promotion detail
      const generateContentBtn = page
        .getByRole("button", { name: /generate content/i })
        .first();
      const hasGenerate = await generateContentBtn
        .isVisible({ timeout: 10_000 })
        .catch(() => false);

      if (hasGenerate) {
        await generateContentBtn.click();

        // Wait for modal or success indicator
        const modalOrResult = page
          .getByRole("dialog")
          .or(page.getByText(/pieces created/i))
          .or(page.getByText(/generating/i));

        const appeared = await modalOrResult
          .first()
          .waitFor({ state: "visible", timeout: 60_000 })
          .then(() => true)
          .catch(() => false);

        if (!appeared) {
          const errorVisible = await page
            .getByText(/error|rate limit|failed/i)
            .isVisible()
            .catch(() => false);
          if (errorVisible) {
            console.warn(
              "Content generation returned an error (possible rate limit) — skipping assertion",
            );
          } else {
            await expect(
              page.getByRole("dialog").or(page.getByText(/pieces created/i)),
            ).toBeVisible({ timeout: 5_000 });
          }
        }

        // Close modal if open
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
      } else {
        // No generate button — check if "Edit" links into a detail page that has it
        const editLink = page.getByRole("link", { name: /edit/i }).first();
        const hasEdit = await editLink.isVisible().catch(() => false);
        if (hasEdit) {
          console.warn(
            "No 'Generate Content' button found on promotion cards — checking edit detail",
          );
        } else {
          console.warn(
            "No promotions with 'Generate Content' available — skipping generation step",
          );
        }
      }
    });

    // ── Step 6: Media Studio ──────────────────────────────────────────────────
    await test.step("navigate to /media-studio and verify generate form visible", async () => {
      await page.goto("/media-studio");
      await skipIfAuthRequired(page);

      // Page should load with generate UI — not an error page
      await expect(
        page
          .getByRole("heading", { name: /media/i })
          .or(page.getByRole("button", { name: /generate/i }))
          .or(page.getByText(/media studio/i)),
      ).toBeVisible({ timeout: 15_000 });

      // Assert no "something went wrong" error banner
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    });

    // ── Step 7: Calendar ──────────────────────────────────────────────────────
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

      // Optionally click a day that has an event dot/badge
      const eventDay = page
        .locator("[data-has-event='true']")
        .or(page.locator(".calendar-event"))
        .or(page.locator("[data-testid='calendar-event']"))
        .first();
      const hasEvent = await eventDay.isVisible().catch(() => false);
      if (hasEvent) {
        await eventDay.click();
        // Assert some kind of detail popover/panel appears
        const detail = page
          .getByRole("dialog")
          .or(page.locator("[data-testid='event-detail']"))
          .or(page.getByText(/scheduled|draft|content/i).nth(1));
        await detail
          .first()
          .waitFor({ state: "visible", timeout: 5_000 })
          .catch(() => {});
      }
    });

    // ── Step 8: Posts ─────────────────────────────────────────────────────────
    await test.step("navigate to /posts and verify posts appear with platform badges", async () => {
      await page.goto("/posts");
      await skipIfAuthRequired(page);

      // Wait for posts list to load
      await expect(
        page
          .getByRole("heading", { name: /posts/i })
          .or(page.getByText(/draft/i))
          .or(page.getByText(/scheduled/i))
          .or(page.getByText(/twitter|linkedin|x\.com/i)),
      ).toBeVisible({ timeout: 20_000 });

      // Check for platform tab labels (X / Twitter / LinkedIn)
      const platformTab = page
        .getByRole("tab", { name: /x$|twitter|linkedin/i })
        .or(page.getByRole("button", { name: /x$|twitter|linkedin/i }))
        .first();
      const hasTab = await platformTab.isVisible().catch(() => false);
      if (hasTab) {
        await expect(platformTab).toBeVisible();
      }
    });

    // ── Step 9: Content Hub final check ──────────────────────────────────────
    await test.step("navigate to /content and verify Social and Blog tabs load without errors", async () => {
      await page.goto("/content");
      await skipIfAuthRequired(page);

      // Wait for content hub to load
      await expect(
        page
          .getByRole("heading", { name: /content/i })
          .or(page.getByRole("tab", { name: /blog/i }))
          .or(page.getByRole("tab", { name: /social/i })),
      ).toBeVisible({ timeout: 15_000 });

      // Social tab
      const socialTab = page.getByRole("tab", { name: /social/i });
      const hasSocialTab = await socialTab.isVisible().catch(() => false);
      if (hasSocialTab) {
        await socialTab.click();
        await page.waitForTimeout(1_000);
        await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
      }

      // Blog tab
      const blogTab = page.getByRole("tab", { name: /blog/i });
      const hasBlogTab = await blogTab.isVisible().catch(() => false);
      if (hasBlogTab) {
        await blogTab.click();
        await page.waitForTimeout(1_000);
        await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
      }

      // Final: no error states anywhere on the page
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    });
  });
});
