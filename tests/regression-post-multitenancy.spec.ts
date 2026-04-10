import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Regression tests — post multi-tenancy refactor
// Verifies that auth pages, protected routes, and API health endpoints
// are all intact after userId was added to all models and workers.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 1. Login page
// ---------------------------------------------------------------------------

test.describe("Login page (/login)", () => {
  test("loads with a non-error status", async ({ page }) => {
    const response = await page.goto("/login");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test('shows "Welcome back" heading', async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /welcome back/i })
    ).toBeVisible();
  });

  test("shows email input", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('shows "Sign In with Email" button', async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /sign in with email/i })
    ).toBeVisible();
  });

  test('shows "Don\'t have an account?" link', async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/don't have an account\?/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Register page
// ---------------------------------------------------------------------------

test.describe("Register page (/register)", () => {
  test("loads without a 500 error", async ({ page }) => {
    const response = await page.goto("/register");
    await page.waitForLoadState("networkidle");

    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test('shows "Create account" heading', async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    // Wait specifically for the heading to be visible
    await page.waitForSelector('h1', { state: 'visible' });

    await expect(
      page.getByRole("heading", { name: "Create account" })
    ).toBeVisible();
  });

  test("shows email input", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('shows "Sign Up with Email" button', async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /sign up with email/i })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Dashboard redirect behavior (unauthenticated)
// ---------------------------------------------------------------------------

test.describe("Unauthenticated redirect behavior", () => {
  const protectedRoutes = ["/promote", "/content", "/settings"];

  for (const route of protectedRoutes) {
    test(`GET ${route} redirects unauthenticated users to /login`, async ({
      page,
    }) => {
      const response = await page.goto(route);
      await page.waitForLoadState("networkidle");

      const finalUrl = page.url();
      const statusOk =
        response?.status() !== 500 && response?.status() !== 404;

      // Either the final URL contains /login (client-side redirect)
      // or the initial response was a 3xx redirect toward login.
      const redirectedToLogin =
        finalUrl.includes("/login") ||
        (response !== null &&
          response.status() >= 300 &&
          response.status() < 400);

      expect(statusOk).toBe(true);
      expect(redirectedToLogin).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Login page UI integrity
// ---------------------------------------------------------------------------

test.describe("Login page UI integrity", () => {
  test("back button is visible", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // The back button may be an anchor or a button; match by role or aria-label.
    const backButton = page
      .getByRole("link", { name: /back/i })
      .or(page.getByRole("button", { name: /back/i }));

    await expect(backButton.first()).toBeVisible();
  });

  test("no critical console errors on login page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const appErrors = errors.filter(
      (e) =>
        !e.includes("ERR_BLOCKED_BY_CLIENT") &&
        !e.includes("extension") &&
        !e.includes("favicon") &&
        !e.includes("404") &&  // Filter out 404 errors (missing static assets)
        !e.includes("Failed to load resource") &&
        !e.includes(".woff") &&  // Font files
        !e.includes(".woff2") &&
        !e.includes(".ttf") &&
        !e.includes(".map") &&  // Source maps
        !e.includes("manifest") &&
        !e.includes("net::ERR_")
    );

    expect(appErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 5. API health checks (unauthenticated)
// ---------------------------------------------------------------------------

test.describe("API health checks", () => {
  test("GET /api/auth/providers returns 200", async ({ request }) => {
    const response = await request.get("/api/auth/providers");
    expect(response.status()).toBe(200);
  });

  test("GET /api/auth/csrf returns 200 with a csrfToken", async ({
    request,
  }) => {
    const response = await request.get("/api/auth/csrf");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("csrfToken");
    expect(typeof body.csrfToken).toBe("string");
    expect(body.csrfToken.length).toBeGreaterThan(0);
  });
});
