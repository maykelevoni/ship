import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Content Hub (/posts)
//
// Test strategy:
//   - Use page.route() to mock API calls so tests are DB-independent
//   - Auth guard: if redirected to login, skip the test (same pattern used
//     by audio-captioned-video.spec.ts and settings.spec.ts)
//   - Each test navigates to /posts and waits for networkidle
//
// Coverage:
//   1. Page loads and shows seven tabs (Blog, X, LinkedIn, TikTok, Instagram, Reddit, Email)
//   2. Blog tab is active by default
//   3. Tab switching — clicking X tab makes it active
//   4. Blog tab renders rows (title, Draft badge, Publish button)
//   5. Blog Publish button → "Published ✓" after success response
//   6. Social approve inline → PATCH called, badge updates to Approved
//   7. Social schedule inline → datetime input appears after clicking Schedule
//   8. Email Send button → POST /api/email-drafts/[id]/send called
//   9. Empty state → "No content yet" message shown
// ---------------------------------------------------------------------------

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Navigate to /posts and skip the test if auth redirects away. */
async function goToPosts(
  page: Parameters<Parameters<typeof test>[1]>[0]["page"],
) {
  await page.goto("/posts");
  await page.waitForLoadState("networkidle");
  if (!page.url().includes("/posts")) {
    return false; // redirected to login — skip
  }
  return true;
}

// ── Group 1: Page structure ───────────────────────────────────────────────────

test.describe("Content Hub — page structure", () => {
  test("page loads without 500 or 404", async ({ page }) => {
    const response = await page.goto("/posts");
    await page.waitForLoadState("networkidle");
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("shows the Posts heading", async ({ page }) => {
    const ok = await goToPosts(page);
    if (!ok) return;
    await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible();
  });

  test("shows all seven platform tabs", async ({ page }) => {
    const ok = await goToPosts(page);
    if (!ok) return;

    for (const label of [
      "Blog",
      "X",
      "LinkedIn",
      "TikTok",
      "Instagram",
      "Reddit",
      "Email",
    ]) {
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }
  });

  test("Blog tab is active by default on page load", async ({ page }) => {
    // Mock the blog-posts API so the tab content loads cleanly
    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );

    const ok = await goToPosts(page);
    if (!ok) return;

    // The Blog button should have the active background (#1a1a1a) applied via
    // its inline style. We verify it is present and is distinct from the others.
    const blogBtn = page.getByRole("button", { name: "Blog" });
    await expect(blogBtn).toBeVisible();

    // Active tab text is brighter (#e4e4e7) while inactive tabs are dimmer (#71717a).
    // Checking that the Blog button has a non-transparent background colour is
    // sufficient to confirm it is the selected tab.
    const bgColor = await blogBtn.evaluate(
      (el) => (el as HTMLElement).style.background,
    );
    expect(bgColor).toBe("#1a1a1a");
  });
});

// ── Group 2: Tab switching ────────────────────────────────────────────────────

test.describe("Content Hub — tab switching", () => {
  test("clicking X tab makes it active and fetches twitter content", async ({
    page,
  }) => {
    let twitterFetched = false;

    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    await page.route("**/api/posts?platform=twitter**", (route) => {
      twitterFetched = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], total: 0, page: 1, limit: 100 }),
      });
    });

    const ok = await goToPosts(page);
    if (!ok) return;

    const xBtn = page.getByRole("button", { name: "X" });
    await xBtn.click();
    await page.waitForLoadState("networkidle");

    // The X button should now have the active background
    const bgColor = await xBtn.evaluate(
      (el) => (el as HTMLElement).style.background,
    );
    expect(bgColor).toBe("#1a1a1a");

    expect(twitterFetched).toBe(true);
  });
});

// ── Group 3: Blog tab rows ────────────────────────────────────────────────────

test.describe("Content Hub — Blog tab rows", () => {
  const mockBlogPost = {
    id: "blog-1",
    title: "My Draft Blog Post",
    slug: "my-draft-blog-post",
    date: "2026-03-01T00:00:00.000Z",
    status: "draft",
    ghostId: "ghost-abc123",
    ghostUrl: null,
    createdAt: "2026-03-01T10:00:00.000Z",
    seoDescription: null,
    topic: null,
    piecesCount: 0,
  };

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockBlogPost]),
      }),
    );
  });

  test("renders the blog post title", async ({ page }) => {
    const ok = await goToPosts(page);
    if (!ok) return;
    await expect(page.getByText("My Draft Blog Post")).toBeVisible();
  });

  test("renders the Draft status badge", async ({ page }) => {
    const ok = await goToPosts(page);
    if (!ok) return;
    await expect(page.getByText("Draft")).toBeVisible();
  });

  test("renders the Publish button for a draft post with ghostId", async ({
    page,
  }) => {
    const ok = await goToPosts(page);
    if (!ok) return;
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
  });
});

// ── Group 4: Blog Publish button ──────────────────────────────────────────────

test.describe("Content Hub — Blog Publish action", () => {
  const mockBlogPost = {
    id: "blog-2",
    title: "Publish Me Post",
    slug: "publish-me-post",
    date: "2026-03-05T00:00:00.000Z",
    status: "draft",
    ghostId: "ghost-xyz789",
    ghostUrl: null,
    createdAt: "2026-03-05T08:00:00.000Z",
    seoDescription: null,
    topic: null,
    piecesCount: 0,
  };

  test("Publish button shows 'Published ✓' after success", async ({ page }) => {
    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockBlogPost]),
      }),
    );
    await page.route("**/api/blog-posts/blog-2/publish", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          ghostUrl: "https://ghost.example.com/publish-me-post",
        }),
      }),
    );

    const ok = await goToPosts(page);
    if (!ok) return;

    const publishBtn = page.getByRole("button", { name: "Publish" });
    await expect(publishBtn).toBeVisible();
    await publishBtn.click();

    await expect(page.getByRole("button", { name: "Published ✓" })).toBeVisible(
      { timeout: 5000 },
    );
  });
});

// ── Group 5: Social approve inline ───────────────────────────────────────────

test.describe("Content Hub — Social approve inline", () => {
  const mockSocialPost = {
    id: "social-1",
    platform: "twitter",
    promotionId: null,
    promotionName: null,
    date: "2026-03-10T00:00:00.000Z",
    status: "generated",
    contentPreview: "Check out this amazing new feature we just launched!",
    mediaPath: null,
    createdAt: "2026-03-10T09:00:00.000Z",
    scheduledAt: null,
  };

  test("clicking Approve sends PATCH and badge updates to Approved", async ({
    page,
  }) => {
    let patchCalled = false;
    let patchBody: unknown = null;

    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    await page.route("**/api/posts?platform=twitter**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [mockSocialPost],
          total: 1,
          page: 1,
          limit: 100,
        }),
      }),
    );
    await page.route("**/api/posts/social-1", async (route) => {
      if (route.request().method() === "PATCH") {
        patchCalled = true;
        patchBody = JSON.parse(route.request().postData() ?? "{}");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "social-1", status: "approved" }),
        });
      } else {
        await route.continue();
      }
    });

    const ok = await goToPosts(page);
    if (!ok) return;

    // Switch to X tab
    await page.getByRole("button", { name: "X" }).click();
    await page.waitForLoadState("networkidle");

    // Click Approve
    const approveBtn = page.getByRole("button", { name: "Approve" });
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // PATCH must have been called with status: 'approved'
    await page.waitForTimeout(500);
    expect(patchCalled).toBe(true);
    expect((patchBody as { status?: string })?.status).toBe("approved");

    // Optimistic update: badge should now show "Approved"
    await expect(page.getByText("Approved")).toBeVisible({ timeout: 3000 });
  });
});

// ── Group 6: Social schedule inline ──────────────────────────────────────────

test.describe("Content Hub — Social schedule inline", () => {
  const mockApprovedPost = {
    id: "social-2",
    platform: "twitter",
    promotionId: null,
    promotionName: null,
    date: "2026-03-12T00:00:00.000Z",
    status: "approved",
    contentPreview: "This post is approved and ready to be scheduled.",
    mediaPath: null,
    createdAt: "2026-03-12T10:00:00.000Z",
    scheduledAt: null,
  };

  test("clicking Schedule reveals the datetime-local input", async ({
    page,
  }) => {
    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    await page.route("**/api/posts?platform=twitter**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [mockApprovedPost],
          total: 1,
          page: 1,
          limit: 100,
        }),
      }),
    );

    const ok = await goToPosts(page);
    if (!ok) return;

    // Switch to X tab
    await page.getByRole("button", { name: "X" }).click();
    await page.waitForLoadState("networkidle");

    // Schedule button should be visible for an approved post with no scheduledAt
    const scheduleBtn = page.getByRole("button", { name: "Schedule" });
    await expect(scheduleBtn).toBeVisible();
    await scheduleBtn.click();

    // The inline datetime-local input must now be visible
    await expect(page.locator('input[type="datetime-local"]')).toBeVisible({
      timeout: 3000,
    });
  });
});

// ── Group 7: Email Send button ────────────────────────────────────────────────

test.describe("Content Hub — Email Send action", () => {
  const mockEmailDraft = {
    id: "email-1",
    subject: "Weekly Newsletter: Top Stories",
    status: "pending",
    sentAt: null,
    createdAt: "2026-03-15T07:00:00.000Z",
    blogPost: { title: "My Draft Blog Post", ghostUrl: null },
  };

  test("clicking Send calls POST /api/email-drafts/[id]/send", async ({
    page,
  }) => {
    let sendCalled = false;

    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    await page.route("**/api/email-drafts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockEmailDraft]),
      }),
    );
    await page.route("**/api/email-drafts/email-1/send", (route) => {
      sendCalled = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    const ok = await goToPosts(page);
    if (!ok) return;

    // Switch to Email tab
    await page.getByRole("button", { name: "Email" }).click();
    await page.waitForLoadState("networkidle");

    const sendBtn = page.getByRole("button", { name: "Send" });
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    await page.waitForTimeout(500);
    expect(sendCalled).toBe(true);
  });

  test("Send button shows 'Sent ✓' after success", async ({ page }) => {
    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    await page.route("**/api/email-drafts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockEmailDraft]),
      }),
    );
    await page.route("**/api/email-drafts/email-1/send", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    );

    const ok = await goToPosts(page);
    if (!ok) return;

    await page.getByRole("button", { name: "Email" }).click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByRole("button", { name: "Sent ✓" })).toBeVisible({
      timeout: 5000,
    });
  });
});

// ── Group 8: Empty state ──────────────────────────────────────────────────────

test.describe("Content Hub — empty state", () => {
  test("Blog tab shows 'No Blog content yet.' when API returns empty array", async ({
    page,
  }) => {
    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );

    const ok = await goToPosts(page);
    if (!ok) return;

    await expect(page.getByText("No Blog content yet.")).toBeVisible({
      timeout: 5000,
    });
  });

  test("X tab shows 'No X content yet.' when API returns empty data", async ({
    page,
  }) => {
    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    await page.route("**/api/posts?platform=twitter**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], total: 0, page: 1, limit: 100 }),
      }),
    );

    const ok = await goToPosts(page);
    if (!ok) return;

    await page.getByRole("button", { name: "X" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("No X content yet.")).toBeVisible({
      timeout: 5000,
    });
  });

  test("Email tab shows 'No Email content yet.' when API returns empty array", async ({
    page,
  }) => {
    await page.route("**/api/blog-posts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    await page.route("**/api/email-drafts", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );

    const ok = await goToPosts(page);
    if (!ok) return;

    await page.getByRole("button", { name: "Email" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("No Email content yet.")).toBeVisible({
      timeout: 5000,
    });
  });
});
