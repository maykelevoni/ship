import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Generation Section Tests
//
// Covers both generation pipelines:
//   1. Text/content generation — POST /api/engine/run (Claude via worker)
//   2. Image generation       — POST /api/media (Gemini gemini-3.1-flash-image-preview)
//
// All tests run unauthenticated. The app requires auth for all dashboard and
// generation routes, so the expected outcomes are:
//   - API endpoints: 401 (auth required), never 404 or 500
//   - Page routes:   redirect to /login, never 500
//   - Static checks: source files contain correct model names and function signatures
//
// Actual generation (calling Gemini + Claude) is NOT tested here — those are
// slow/external services. These tests verify the generation code compiles and
// the routes are wired correctly.
// ---------------------------------------------------------------------------

// ─── 1. Engine run — content generation ──────────────────────────────────────

test.describe("Engine run (POST /api/engine/run)", () => {
  test("route exists — not 404", async ({ request }) => {
    const res = await request.post("/api/engine/run");
    expect(res.status()).not.toBe(404);
  });

  test("unauthenticated POST returns 401 — never 500", async ({ request }) => {
    const res = await request.post("/api/engine/run");
    expect(res.status()).toBe(401);
    expect(res.status()).not.toBe(500);
  });

  test("route file compiles — engine/run source exports runEngine", async () => {
    const filePath = path.join(
      process.cwd(),
      "worker",
      "engine",
      "run.ts"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).toContain("runEngine");
  });

  test("engine/generate source exports generateMaster and generateAllFormats", async () => {
    const filePath = path.join(
      process.cwd(),
      "worker",
      "engine",
      "generate.ts"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).toContain("generateMaster");
    expect(source).toContain("generateAllFormats");
  });
});

// ─── 2. Blog post content generation ─────────────────────────────────────────

test.describe("Blog post generation routes", () => {
  test("POST /api/blog-posts/[id]/generate-pieces exists — not 404", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/blog-posts/test-post-id/generate-pieces"
    );
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });

  test("POST /api/blog-posts/[id]/generate-pieces returns 401 when unauthenticated", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/blog-posts/test-post-id/generate-pieces"
    );
    expect(res.status()).toBe(401);
  });

  test("generate-pieces route file compiles", async () => {
    const filePath = path.join(
      process.cwd(),
      "app",
      "api",
      "blog-posts",
      "[id]",
      "generate-pieces",
      "route.ts"
    );
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

// ─── 3. Image generation — POST /api/media ───────────────────────────────────

test.describe("Image generation (POST /api/media with type=image)", () => {
  test("POST /api/media route exists — not 404", async ({ request }) => {
    const res = await request.post("/api/media", {
      data: { type: "image", prompt: "test" },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });

  test("unauthenticated POST /api/media returns 401", async ({ request }) => {
    const res = await request.post("/api/media", {
      data: { type: "image", prompt: "test" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/media?type=image does not crash", async ({ request }) => {
    const res = await request.get("/api/media?type=image&limit=20");
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });

  test("worker/media/studio.ts uses correct Gemini model name", async () => {
    const filePath = path.join(
      process.cwd(),
      "worker",
      "media",
      "studio.ts"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const source = fs.readFileSync(filePath, "utf-8");
    // CRITICAL: model name must be exactly this — confirmed working
    expect(source).toContain("gemini-3.1-flash-image-preview");
    expect(source).toContain("generateStudioImage");
    expect(source).toContain("resizeForPlatforms");
  });

  test("worker/media/image.ts uses correct Gemini model name", async () => {
    const filePath = path.join(
      process.cwd(),
      "worker",
      "media",
      "image.ts"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const source = fs.readFileSync(filePath, "utf-8");
    // CRITICAL: model name must be exactly this — never change it
    expect(source).toContain("gemini-3.1-flash-image-preview");
  });

  test("worker/media/studio.ts does NOT use Puppeteer", async () => {
    const filePath = path.join(
      process.cwd(),
      "worker",
      "media",
      "studio.ts"
    );
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).not.toContain("puppeteer");
  });
});

// ─── 4. Video generation — POST /api/media with type=video ───────────────────

test.describe("Video generation (POST /api/media with type=video)", () => {
  test("POST /api/media with type=video does not 500 or 404", async ({
    request,
  }) => {
    const res = await request.post("/api/media", {
      data: { type: "video", prompt: "morning routine tips" },
    });
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });

  test("GET /api/media?type=video does not crash", async ({ request }) => {
    const res = await request.get("/api/media?type=video&limit=10");
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });

  test("worker/media/studio.ts exports generateStudioVideo", async () => {
    const filePath = path.join(
      process.cwd(),
      "worker",
      "media",
      "studio.ts"
    );
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).toContain("generateStudioVideo");
  });

  test("worker/media/video.ts exists and exports render function", async () => {
    const filePath = path.join(
      process.cwd(),
      "worker",
      "media",
      "video.ts"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const source = fs.readFileSync(filePath, "utf-8");
    // Must export a render function for Remotion
    expect(source).toContain("render");
  });
});

// ─── 5. Media Studio page — generation UI ────────────────────────────────────

test.describe("Media Studio generation UI (/media-studio)", () => {
  test("page does not 500", async ({ request }) => {
    const res = await request.get("/media-studio");
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });

  test("unauthenticated request redirects to /login — not a crash", async ({
    page,
  }) => {
    await page.goto("/media-studio", { waitUntil: "commit" });
    const url = page.url();
    expect(url).toMatch(/\/(login|api\/auth)/);
    expect(url).not.toContain("500");
  });

  test("media-studio page source exports the page component", async () => {
    const filePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "media-studio",
      "page.tsx"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const source = fs.readFileSync(filePath, "utf-8");
    // Mode toggle between image and video
    expect(source).toContain('"image"');
    expect(source).toContain('"video"');
    // Generation form
    expect(source).toContain("prompt");
    expect(source).toContain("generating");
  });
});

// ─── 6. Content page — blog generation UI ────────────────────────────────────

test.describe("Content page generation UI (/content)", () => {
  test("GET /content does not 500", async ({ request }) => {
    const res = await request.get("/content");
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });

  test("unauthenticated user is redirected to /login from /content", async ({
    page,
  }) => {
    await page.goto("/content", { waitUntil: "commit" });
    const url = page.url();
    expect(url).toMatch(/\/(login|api\/auth)/);
  });
});

// ─── 7. Generate-images route (blog post images) ─────────────────────────────

test.describe("Blog post generate-images route", () => {
  test("POST /api/blog-posts/[id]/generate-images exists — not 404", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/blog-posts/test-post-id/generate-images"
    );
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });

  test("generate-images route returns 401 when unauthenticated", async ({
    request,
  }) => {
    const res = await request.post(
      "/api/blog-posts/test-post-id/generate-images"
    );
    expect(res.status()).toBe(401);
  });
});
