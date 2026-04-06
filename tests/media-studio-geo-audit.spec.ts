import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Feature: Settings Media GEO Cleanup — Playwright Tests
//
// Tests cover:
// - Story 3: Media Studio error parsing + API key pre-check
// - Story 4: GEO Audit blog post integration
// - Story 5: contentlayer.config.ts removed
//
// Static/file-based tests — no dev server required.
// ---------------------------------------------------------------------------

test.describe("Media Studio — API key pre-check (Story 3)", () => {
  test("page.tsx fetches /api/settings on mount to check gemini_api_key", () => {
    const pagePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "media-studio",
      "page.tsx"
    );
    const source = fs.readFileSync(pagePath, "utf-8");
    expect(source).toContain("/api/settings");
    expect(source).toContain("gemini_api_key");
    expect(source).toContain("keyStatus");
  });

  test("page.tsx shows banner when Gemini key is missing", () => {
    const pagePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "media-studio",
      "page.tsx"
    );
    const source = fs.readFileSync(pagePath, "utf-8");
    expect(source).toContain("Gemini API key not configured");
    expect(source).toContain("/settings");
    expect(source).toContain("Settings →");
  });

  test("Generate button is disabled when keyStatus is not ok", () => {
    const pagePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "media-studio",
      "page.tsx"
    );
    const source = fs.readFileSync(pagePath, "utf-8");
    expect(source).toContain("keyStatus !== \"ok\"");
  });
});

test.describe("Media Studio — Error parsing in API route (Story 3)", () => {
  test("API route has parseGeminiError helper", () => {
    const routePath = path.join(process.cwd(), "app", "api", "media", "route.ts");
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).toContain("parseGeminiError");
    expect(source).toContain("429");
    expect(source).toContain("403");
    expect(source).toContain("401");
  });

  test("quota exceeded error maps to human-readable message", () => {
    const routePath = path.join(process.cwd(), "app", "api", "media", "route.ts");
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).toContain("Gemini API quota exceeded");
    expect(source).toContain("ai.google.dev");
  });

  test("auth error maps to human-readable message", () => {
    const routePath = path.join(process.cwd(), "app", "api", "media", "route.ts");
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).toContain("Invalid Gemini API key");
    expect(source).toContain("update it in Settings");
  });

  test("API route does not use raw err.message pattern for catch blocks", () => {
    const routePath = path.join(process.cwd(), "app", "api", "media", "route.ts");
    const source = fs.readFileSync(routePath, "utf-8");
    const rawPattern = "err instanceof Error ? err.message : String(err)";
    expect(source).not.toContain(rawPattern);
  });
});

test.describe("GEO Audit — Backend API routes (Story 4)", () => {
  test("POST /api/blog-posts/[id]/geo-audit route file exists", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "blog-posts",
      "[id]",
      "geo-audit",
      "route.ts"
    );
    expect(fs.existsSync(routePath)).toBe(true);
  });

  test("geo-audit route imports runGeoAudit from worker", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "blog-posts",
      "[id]",
      "geo-audit",
      "route.ts"
    );
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).toContain("runGeoAudit");
    expect(source).toContain("@/worker/engine/geo-audit");
  });

  test("old /api/promotions/[id]/geo-audit route is deleted", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "promotions",
      "[id]",
      "geo-audit"
    );
    expect(fs.existsSync(routePath)).toBe(false);
  });

  test("blog post detail route returns geo fields from BlogPost (no Promotion lookup)", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "blog-posts",
      "[id]",
      "route.ts"
    );
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).toContain("geoScore");
    expect(source).toContain("geoIssues");
    expect(source).toContain("geoAuditedAt");
    expect(source).not.toContain("db.promotion.findUnique");
    expect(source).not.toContain("db.promotion.findFirst");
  });

  test("blog post list route includes geoScore", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "blog-posts",
      "route.ts"
    );
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).toContain("geoScore");
  });
});

test.describe("GEO Audit — Frontend UI (Story 4)", () => {
  test("blog post detail page has GEO panel with score, issues, recommendations", () => {
    const pagePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "content",
      "[id]",
      "page.tsx"
    );
    const source = fs.readFileSync(pagePath, "utf-8");
    expect(source).toContain("GEO Optimization");
    expect(source).toContain("geoIssues");
    expect(source).toContain("geoAuditedAt");
    expect(source).toContain("geoScore");
    expect(source).toContain("Re-run GEO Audit");
    expect(source).toContain("Running…");
    expect(source).toContain("Not yet audited");
    expect(source).toContain("Issues");
    expect(source).toContain("Recommendations");
  });

  test("blog post detail page has auditing state and triggers geo-audit POST", () => {
    const pagePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "content",
      "[id]",
      "page.tsx"
    );
    const source = fs.readFileSync(pagePath, "utf-8");
    expect(source).toContain("auditing");
    expect(source).toContain("/geo-audit");
  });

  test("GEO score uses 0-100 scale thresholds (>=70, >=40) in detail page", () => {
    const pagePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "content",
      "[id]",
      "page.tsx"
    );
    const source = fs.readFileSync(pagePath, "utf-8");
    expect(source).toContain(">= 70");
    expect(source).toContain(">= 40");
  });

  test("blog post list page shows GEO score badge", () => {
    const pagePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "content",
      "page.tsx"
    );
    const source = fs.readFileSync(pagePath, "utf-8");
    expect(source).toContain("geoScore");
    expect(source).toContain("GEO");
  });

  test("promotion card has no geo score UI", () => {
    const cardPath = path.join(
      process.cwd(),
      "components",
      "dashboard",
      "promotion-card.tsx"
    );
    const source = fs.readFileSync(cardPath, "utf-8");
    expect(source).not.toContain("GeoScoreBar");
    expect(source).not.toContain("localGeoScore");
    expect(source).not.toContain("handleRunAudit");
    expect(source).not.toContain("/geo-audit");
  });
});

test.describe("GEO Audit — worker module", () => {
  test("geo-audit.ts exports runGeoAudit function", () => {
    const workerPath = path.join(process.cwd(), "worker", "engine", "geo-audit.ts");
    const source = fs.readFileSync(workerPath, "utf-8");
    expect(source).toContain("export async function runGeoAudit");
    expect(source).toContain("blogPostId");
    expect(source).toContain("title");
    expect(source).toContain("content");
  });

  test("geo-audit updates BlogPost with geoScore, geoIssues, geoAuditedAt", () => {
    const workerPath = path.join(process.cwd(), "worker", "engine", "geo-audit.ts");
    const source = fs.readFileSync(workerPath, "utf-8");
    expect(source).toContain("db.blogPost.update");
    expect(source).toContain("geoScore");
    expect(source).toContain("geoIssues");
    expect(source).toContain("geoAuditedAt");
  });
});

test.describe("Contentlayer cleanup (Story 5)", () => {
  test("contentlayer.config.ts is deleted from root", async () => {
    const configPath = path.join(process.cwd(), "contentlayer.config.ts");
    expect(fs.existsSync(configPath)).toBe(false);
  });
});
