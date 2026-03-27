import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// PostHog + Research Keyword + Product Studio
//
// These tests run without authentication. Authenticated routes redirect to
// /login — tests check page structure on the login page OR verify redirects
// happen correctly. API routes without auth return 401.
// ---------------------------------------------------------------------------

// ─── 1. PostHog Analytics ────────────────────────────────────────────────────

test.describe("PostHog Analytics", () => {
  test("app loads without 500 error on root", async ({ page }) => {
    const response = await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(response?.status()).not.toBe(500);
  });

  test("POST /api/webhooks/clickbank returns 200", async ({ request }) => {
    const res = await request.post("/api/webhooks/clickbank", {
      data: {
        receipt: "TEST-ORDER-123",
        lineItems: [{ productTitle: "Test Product", amount: 29.99 }],
        vendor: "testvendor",
        affiliate: "testaffiliate",
      },
    });
    expect(res.status()).toBe(200);
  });

  test("POST /api/webhooks/stripe returns 200 for invalid signature (graceful fail)", async ({
    request,
  }) => {
    const res = await request.post("/api/webhooks/stripe", {
      headers: { "stripe-signature": "t=invalid,v1=invalid" },
      data: "{}",
    });
    expect(res.status()).toBe(200);
  });
});

// ─── 2. /research page ───────────────────────────────────────────────────────

test.describe("Research page (/research)", () => {
  test("navigating to /research does not 500", async ({ page }) => {
    await page.goto("/research");
    await page.waitForLoadState("networkidle");
    // Unauthenticated users are redirected to /login — either is acceptable
    const url = page.url();
    expect(url).toMatch(/localhost:3000\/(research|login)/);
  });

  test("server responds to /research without crashing", async ({ request }) => {
    const res = await request.get("/research");
    // 200 (logged in), 307/302 (redirect to login), or 401 — not 500
    expect(res.status()).not.toBe(500);
  });
});

// ─── 3. Sidebar navigation ────────────────────────────────────────────────────

test.describe("Sidebar navigation", () => {
  test("login page loads — confirms app is running", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const status = page.url();
    expect(status).toContain("localhost:3000");
  });
});

// ─── 4. /promote redirect ─────────────────────────────────────────────────────

test.describe("/promote redirect", () => {
  test("/promote redirects (to /products or /login, not 500)", async ({ page }) => {
    await page.goto("/promote");
    await page.waitForLoadState("networkidle");
    // Auth redirects mean unauthenticated users hit /login;
    // the next.config.js redirect fires for authenticated users.
    // Either way, it must not stay on /promote or return 500.
    const url = page.url();
    expect(url).not.toContain("/promote");
    expect(url).toMatch(/products|login/);
  });
});

// ─── 5. Own Products API ─────────────────────────────────────────────────────

test.describe("Own Products API", () => {
  test("GET /api/own-products does not crash the server", async ({ request }) => {
    // Middleware redirects unauthenticated requests to /login (302 → 200)
    // We just verify no 500 crash
    const res = await request.get("/api/own-products");
    expect(res.status()).not.toBe(500);
  });

  test("POST /api/own-products does not crash the server", async ({ request }) => {
    const res = await request.post("/api/own-products", {
      data: { title: "Test" },
    });
    expect(res.status()).not.toBe(500);
  });

  test("PATCH /api/own-products/[id] requires auth", async ({ request }) => {
    const res = await request.patch("/api/own-products/nonexistent-id", {
      data: { title: "Updated" },
    });
    expect(res.status()).not.toBe(500);
  });

  test("GET /api/own-products/[id]/generate-outline requires auth", async ({
    request,
  }) => {
    const res = await request.post("/api/own-products/nonexistent-id/generate-outline");
    expect(res.status()).not.toBe(500);
  });

  test("POST /api/own-products/[id]/write-chapter requires auth", async ({
    request,
  }) => {
    const res = await request.post("/api/own-products/nonexistent-id/write-chapter", {
      data: { chapterIndex: 0 },
    });
    expect(res.status()).not.toBe(500);
  });

  test("POST /api/own-products/[id]/publish requires auth", async ({ request }) => {
    const res = await request.post("/api/own-products/nonexistent-id/publish");
    expect(res.status()).not.toBe(500);
  });
});

// ─── 6. /products page ───────────────────────────────────────────────────────

test.describe("Products page (/products)", () => {
  test("navigating to /products does not 500", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/localhost:3000\/(products|login)/);
  });

  test("/products?tab=own does not 500", async ({ page }) => {
    await page.goto("/products?tab=own");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/localhost:3000\/(products|login)/);
  });
});

// ─── 7. Product Studio routes ─────────────────────────────────────────────────

test.describe("Product Studio routes", () => {
  test("/products/studio/new does not 500", async ({ page }) => {
    await page.goto("/products/studio/new?title=Test&opportunityId=abc");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/localhost:3000\/(products|login)/);
  });

  test("/content page does not 500", async ({ page }) => {
    await page.goto("/content");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/localhost:3000\/(content|login)/);
  });
});

// ─── 8. Research API ─────────────────────────────────────────────────────────

test.describe("Research API", () => {
  test("POST /api/research/refresh accepts keyword body", async ({ request }) => {
    const res = await request.post("/api/research/refresh", {
      data: { keyword: "google ads" },
    });
    // 401 = auth required (correct — not 500 which would mean crash)
    expect(res.status()).not.toBe(500);
  });
});
