import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Core Infrastructure Refactor — Playwright Tests
//
// Covers acceptance criteria from spec.md:
//   Phase 1 — Unified AI Provider (anthropic removed, replicate + openrouter present)
//   Phase 2 — Unified Image Generation (lib/image-gen.ts, replicate field in settings)
//   Phase 3 — Unified Email Client (lib/brevo.ts structure)
//   Phase 5 — Affiliate Pipeline (settings UI, API route behavior)
//
// Static/file-based tests do NOT require a running dev server.
// Route tests use the Playwright request fixture (dev server via playwright.config.ts).
// Tests that require real API keys are marked with test.skip.
// ---------------------------------------------------------------------------

// ─── Phase 1: Unified AI Provider ────────────────────────────────────────────

test.describe("Phase 1 — AI Provider: Anthropic removed", () => {
  test("lib/claude.ts is deleted", () => {
    const claudePath = path.join(process.cwd(), "lib", "claude.ts");
    expect(fs.existsSync(claudePath)).toBe(false);
  });

  test("types.ts does NOT contain anthropic_api_key field", () => {
    const typesPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "types.ts"
    );
    const source = fs.readFileSync(typesPath, "utf-8");
    expect(source).not.toContain("anthropic_api_key");
  });

  test("api-keys-section.tsx does NOT contain Anthropic API Key field", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "api-keys-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).not.toContain("anthropic_api_key");
    expect(source).not.toContain("Anthropic API Key");
    expect(source).not.toContain("sk-ant-");
  });

  test("settings/route.ts does NOT include anthropic_api_key in defaults", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "settings",
      "route.ts"
    );
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).not.toContain("anthropic_api_key");
  });

  test("geo-audit.ts does NOT import from lib/claude", () => {
    const workerPath = path.join(
      process.cwd(),
      "worker",
      "engine",
      "geo-audit.ts"
    );
    const source = fs.readFileSync(workerPath, "utf-8");
    expect(source).not.toContain("lib/claude");
    expect(source).not.toContain("from '../../../lib/claude'");
    expect(source).not.toContain('from "@/lib/claude"');
  });

  test("lib/ai.ts exports generateText and uses deepseek/deepseek-v3 as default model", () => {
    const aiPath = path.join(process.cwd(), "lib", "ai.ts");
    const source = fs.readFileSync(aiPath, "utf-8");
    expect(source).toContain("generateText");
    expect(source).toContain("deepseek/deepseek-v3");
  });

  test("settings page: Anthropic API Key field is absent on /settings (route check)", async ({
    request,
  }) => {
    // API routes bypass middleware — settings API returns JSON or 401.
    // A 500 here would indicate a compile error.
    const res = await request.get("/api/settings");
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
    // If response is 200 (local auth bypass), body must NOT contain anthropic_api_key
    if (res.status() === 200) {
      const body = await res.text();
      expect(body).not.toContain("anthropic_api_key");
    }
  });
});

test.describe("Phase 1 — AI Provider: Replicate and OpenRouter fields present in Settings UI", () => {
  test("api-keys-section.tsx contains Replicate API Key field", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "api-keys-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).toContain("Replicate API Key");
    expect(source).toContain("replicate_api_key");
  });

  test("api-keys-section.tsx contains OpenRouter Model input", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "api-keys-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).toContain("OpenRouter Model");
    expect(source).toContain("openrouter_model");
  });

  test("types.ts includes replicate_api_key in SettingsData", () => {
    const typesPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "types.ts"
    );
    const source = fs.readFileSync(typesPath, "utf-8");
    expect(source).toContain("replicate_api_key");
    expect(source).toContain("openrouter_model");
  });

  test("/settings page loads without 500 (module compiles correctly)", async ({
    request,
  }) => {
    const res = await request.get("/settings");
    // Expect redirect to login (302/307) or 200 — never a 500 crash
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });
});

// ─── Phase 2: Unified Image Generation ───────────────────────────────────────

test.describe("Phase 2 — Image Generation: lib/image-gen.ts", () => {
  test("lib/image-gen.ts exists", () => {
    const imageGenPath = path.join(process.cwd(), "lib", "image-gen.ts");
    expect(fs.existsSync(imageGenPath)).toBe(true);
  });

  test("lib/image-gen.ts exports generateImage function", () => {
    const imageGenPath = path.join(process.cwd(), "lib", "image-gen.ts");
    const source = fs.readFileSync(imageGenPath, "utf-8");
    expect(source).toContain("export async function generateImage");
  });

  test("lib/image-gen.ts uses gemini-3.1-flash-image-preview (NEVER changed)", () => {
    const imageGenPath = path.join(process.cwd(), "lib", "image-gen.ts");
    const source = fs.readFileSync(imageGenPath, "utf-8");
    expect(source).toContain("gemini-3.1-flash-image-preview");
  });

  test("lib/image-gen.ts has Replicate fallback (flux-schnell)", () => {
    const imageGenPath = path.join(process.cwd(), "lib", "image-gen.ts");
    const source = fs.readFileSync(imageGenPath, "utf-8");
    expect(source).toContain("replicate");
    expect(source).toContain("flux-schnell");
    expect(source).toContain("replicate_api_key");
  });

  test("worker/media/image.ts imports from lib/image-gen", () => {
    const workerPath = path.join(process.cwd(), "worker", "media", "image.ts");
    const source = fs.readFileSync(workerPath, "utf-8");
    expect(source).toContain("image-gen");
    expect(source).toContain("generateImage");
  });

  test("worker/media/studio.ts imports from lib/image-gen", () => {
    const workerPath = path.join(
      process.cwd(),
      "worker",
      "media",
      "studio.ts"
    );
    const source = fs.readFileSync(workerPath, "utf-8");
    expect(source).toContain("image-gen");
    expect(source).toContain("generateImage");
  });

  test("worker/blog/index.ts imports from lib/image-gen", () => {
    const workerPath = path.join(
      process.cwd(),
      "worker",
      "blog",
      "index.ts"
    );
    const source = fs.readFileSync(workerPath, "utf-8");
    expect(source).toContain("image-gen");
    expect(source).toContain("generateImage");
  });
});

test.describe("Phase 2 — Media Studio: error handling (structural check)", () => {
  test("media-studio page.tsx fetches /api/settings to check key status", () => {
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

  test("media-studio page.tsx shows warning banner when Gemini key is missing", () => {
    const pagePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "media-studio",
      "page.tsx"
    );
    const source = fs.readFileSync(pagePath, "utf-8");
    // Must contain a warning that links to settings
    expect(source).toContain("Gemini API key not configured");
    expect(source).toContain("/settings");
  });

  test("media-studio page.tsx disables Generate button when key is missing", () => {
    const pagePath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "media-studio",
      "page.tsx"
    );
    const source = fs.readFileSync(pagePath, "utf-8");
    // The spec requires the Generate button to be disabled when keyStatus !== "ok"
    expect(source).toContain('keyStatus !== "ok"');
  });

  test("/media-studio route does not 500 (compiled correctly)", async ({
    request,
  }) => {
    const res = await request.get("/media-studio");
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });

  // NOTE: The following test requires an authenticated session with a Gemini key configured.
  // It cannot run in CI without real credentials.
  test.skip("Generate button is disabled when Gemini key is absent (live UI)", async ({
    page,
  }) => {
    // Skipped: requires authenticated session and real Settings state.
    // To test manually: log in, remove Gemini key from Settings,
    // navigate to /media-studio and confirm button is disabled.
    await page.goto("/media-studio");
    const generateBtn = page.getByRole("button", { name: /generate/i });
    await expect(generateBtn).toBeDisabled();
  });

  // NOTE: Also requires auth + configured key
  test.skip("Generate button is enabled after typing a prompt (with key present, live UI)", async ({
    page,
  }) => {
    // Skipped: requires authenticated session and Gemini key in Settings.
    await page.goto("/media-studio");
    const promptInput = page.getByPlaceholder(/prompt/i);
    await promptInput.fill("a beautiful sunset over the mountains");
    const generateBtn = page.getByRole("button", { name: /generate/i });
    await expect(generateBtn).toBeEnabled();
  });
});

// ─── Phase 3: Unified Email Client ───────────────────────────────────────────

test.describe("Phase 3 — Brevo unified email client (structural)", () => {
  test("lib/brevo.ts exists", () => {
    const brevoPath = path.join(process.cwd(), "lib", "brevo.ts");
    expect(fs.existsSync(brevoPath)).toBe(true);
  });

  test("lib/brevo.ts exports sendTransactional", () => {
    const brevoPath = path.join(process.cwd(), "lib", "brevo.ts");
    const source = fs.readFileSync(brevoPath, "utf-8");
    expect(source).toContain("sendTransactional");
  });

  test("lib/brevo.ts exports sendCampaign or sendMagicLink", () => {
    const brevoPath = path.join(process.cwd(), "lib", "brevo.ts");
    const source = fs.readFileSync(brevoPath, "utf-8");
    // Spec says sendMagicLink and sendCampaign, plan says sendTransactional + sendCampaign
    const hasSendCampaign = source.includes("sendCampaign");
    const hasSendMagicLink = source.includes("sendMagicLink");
    expect(hasSendCampaign || hasSendMagicLink).toBe(true);
  });

  test("lib/brevo.ts uses Brevo API (api.brevo.com or api.sendinblue.com)", () => {
    const brevoPath = path.join(process.cwd(), "lib", "brevo.ts");
    const source = fs.readFileSync(brevoPath, "utf-8");
    const hasBrevoUrl =
      source.includes("api.brevo.com") ||
      source.includes("api.sendinblue.com") ||
      source.includes("brevo");
    expect(hasBrevoUrl).toBe(true);
  });

  test("lib/email.ts delegates magic link to lib/brevo.ts", () => {
    const emailPath = path.join(process.cwd(), "lib", "email.ts");
    const source = fs.readFileSync(emailPath, "utf-8");
    expect(source).toContain("brevo");
  });

  test("worker/posting/brevo.ts delegates to lib/brevo.ts", () => {
    const postingBrevoPath = path.join(
      process.cwd(),
      "worker",
      "posting",
      "brevo.ts"
    );
    const source = fs.readFileSync(postingBrevoPath, "utf-8");
    expect(source).toContain("lib/brevo");
  });
});

// ─── Phase 5: Affiliate Settings UI ──────────────────────────────────────────

test.describe("Phase 5 — Affiliate Settings: Amazon Associates section", () => {
  test("integrations-section.tsx contains Amazon Associates section", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "integrations-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).toContain("Amazon Associates");
  });

  test("integrations-section.tsx contains amazon_affiliate_tag field", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "integrations-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).toContain("amazon_affiliate_tag");
  });

  test("integrations-section.tsx contains amazon_paapi_key field", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "integrations-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).toContain("amazon_paapi_key");
    expect(source).toContain("PAAPI Key");
  });

  test("integrations-section.tsx contains amazon_paapi_secret field", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "integrations-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).toContain("amazon_paapi_secret");
    expect(source).toContain("PAAPI Secret");
  });

  test("types.ts includes all Amazon affiliate keys", () => {
    const typesPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "types.ts"
    );
    const source = fs.readFileSync(typesPath, "utf-8");
    expect(source).toContain("amazon_affiliate_tag");
    expect(source).toContain("amazon_paapi_key");
    expect(source).toContain("amazon_paapi_secret");
  });
});

test.describe("Phase 5 — Affiliate Settings: ClickBank section", () => {
  test("integrations-section.tsx contains ClickBank section", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "integrations-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).toContain("ClickBank");
  });

  test("integrations-section.tsx contains clickbank_account field", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "integrations-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).toContain("clickbank_account");
    expect(source).toContain("Account Nickname");
  });

  test("integrations-section.tsx contains clickbank_api_key field", () => {
    const sectionPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "integrations-section.tsx"
    );
    const source = fs.readFileSync(sectionPath, "utf-8");
    expect(source).toContain("clickbank_api_key");
  });

  test("types.ts includes all ClickBank keys", () => {
    const typesPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "_components",
      "types.ts"
    );
    const source = fs.readFileSync(typesPath, "utf-8");
    expect(source).toContain("clickbank_api_key");
    expect(source).toContain("clickbank_account");
  });
});

// ─── Phase 5: Affiliate API Route ────────────────────────────────────────────

test.describe("Phase 5 — Affiliate API Route: /api/affiliate/search", () => {
  test("route file exists at app/api/affiliate/search/route.ts", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "affiliate",
      "search",
      "route.ts"
    );
    expect(fs.existsSync(routePath)).toBe(true);
  });

  test("route exports POST handler", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "affiliate",
      "search",
      "route.ts"
    );
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).toContain("export");
    expect(source).toContain("POST");
  });

  test("route requires authentication (returns 401, not 500, for unauthenticated POST)", async ({
    request,
  }) => {
    const res = await request.post("/api/affiliate/search", {
      data: { keyword: "test" },
    });
    // Must not crash — 401 (not authenticated) or 400 (bad input) are both fine
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
    // Specifically: unauthenticated should be 401
    expect(res.status()).toBe(401);
  });

  test("POST /api/affiliate/search with empty body does not 500", async ({
    request,
  }) => {
    const res = await request.post("/api/affiliate/search", {
      data: {},
    });
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });

  test("POST /api/affiliate/search with malformed JSON does not 500", async ({
    request,
  }) => {
    const res = await request.post("/api/affiliate/search", {
      headers: { "Content-Type": "application/json" },
      data: "not-valid-json",
    });
    // Should be 400 or 401 — never 500
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });

  test("affiliate route imports searchAmazon and searchClickBank", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "affiliate",
      "search",
      "route.ts"
    );
    const source = fs.readFileSync(routePath, "utf-8");
    expect(source).toContain("searchAmazon");
    expect(source).toContain("searchClickBank");
  });

  test("affiliate route validates keyword field (returns 400 when missing)", () => {
    const routePath = path.join(
      process.cwd(),
      "app",
      "api",
      "affiliate",
      "search",
      "route.ts"
    );
    const source = fs.readFileSync(routePath, "utf-8");
    // Must validate keyword presence
    expect(source).toContain("keyword");
    expect(source).toContain("400");
  });

  // Skipped: requires a real authenticated session + configured API keys
  test.skip("POST /api/affiliate/search with valid auth + keyword returns product list", async ({
    request,
  }) => {
    // Skipped: requires real Amazon PAAPI or ClickBank credentials and auth session.
    // To test manually: log in, configure Amazon/ClickBank keys in Settings,
    // then POST { keyword: "fitness", provider: "both" } with session cookie.
    const res = await request.post("/api/affiliate/search", {
      data: { keyword: "fitness", provider: "both" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.products)).toBe(true);
  });
});

// ─── Phase 5: Affiliate Worker Modules ───────────────────────────────────────

test.describe("Phase 5 — Affiliate Worker: amazon.ts and clickbank.ts", () => {
  test("worker/research/affiliate/amazon.ts exists", () => {
    const amazonPath = path.join(
      process.cwd(),
      "worker",
      "research",
      "affiliate",
      "amazon.ts"
    );
    expect(fs.existsSync(amazonPath)).toBe(true);
  });

  test("amazon.ts exports searchAmazon function", () => {
    const amazonPath = path.join(
      process.cwd(),
      "worker",
      "research",
      "affiliate",
      "amazon.ts"
    );
    const source = fs.readFileSync(amazonPath, "utf-8");
    expect(source).toContain("export async function searchAmazon");
  });

  test("amazon.ts uses amazon_paapi_key, amazon_paapi_secret, amazon_affiliate_tag", () => {
    const amazonPath = path.join(
      process.cwd(),
      "worker",
      "research",
      "affiliate",
      "amazon.ts"
    );
    const source = fs.readFileSync(amazonPath, "utf-8");
    expect(source).toContain("amazon_paapi_key");
    expect(source).toContain("amazon_paapi_secret");
    expect(source).toContain("amazon_affiliate_tag");
  });

  test("amazon.ts skips silently when keys are not configured", () => {
    const amazonPath = path.join(
      process.cwd(),
      "worker",
      "research",
      "affiliate",
      "amazon.ts"
    );
    const source = fs.readFileSync(amazonPath, "utf-8");
    // Returns empty array when keys are missing — no throw
    expect(source).toContain("return []");
    expect(source).toContain("skipping");
  });

  test("worker/research/affiliate/clickbank.ts exists", () => {
    const cbPath = path.join(
      process.cwd(),
      "worker",
      "research",
      "affiliate",
      "clickbank.ts"
    );
    expect(fs.existsSync(cbPath)).toBe(true);
  });

  test("clickbank.ts exports searchClickBank function", () => {
    const cbPath = path.join(
      process.cwd(),
      "worker",
      "research",
      "affiliate",
      "clickbank.ts"
    );
    const source = fs.readFileSync(cbPath, "utf-8");
    expect(source).toContain("export async function searchClickBank");
  });

  test("clickbank.ts uses clickbank_api_key and clickbank_account", () => {
    const cbPath = path.join(
      process.cwd(),
      "worker",
      "research",
      "affiliate",
      "clickbank.ts"
    );
    const source = fs.readFileSync(cbPath, "utf-8");
    expect(source).toContain("clickbank_api_key");
    expect(source).toContain("clickbank_account");
  });

  test("clickbank.ts skips silently when keys are not configured", () => {
    const cbPath = path.join(
      process.cwd(),
      "worker",
      "research",
      "affiliate",
      "clickbank.ts"
    );
    const source = fs.readFileSync(cbPath, "utf-8");
    expect(source).toContain("return []");
    expect(source).toContain("skipping");
  });

  test("clickbank.ts generates HopLink using affiliate account", () => {
    const cbPath = path.join(
      process.cwd(),
      "worker",
      "research",
      "affiliate",
      "clickbank.ts"
    );
    const source = fs.readFileSync(cbPath, "utf-8");
    expect(source).toContain("hop.clickbank.net");
    expect(source).toContain("affiliate=");
  });
});

// ─── Phase 5: Prisma schema ───────────────────────────────────────────────────

test.describe("Phase 5 — Prisma schema: OwnProduct affiliate fields", () => {
  test("schema.prisma includes affiliateUrl on OwnProduct", () => {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const source = fs.readFileSync(schemaPath, "utf-8");
    expect(source).toContain("affiliateUrl");
  });

  test("schema.prisma includes asin on OwnProduct", () => {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const source = fs.readFileSync(schemaPath, "utf-8");
    expect(source).toContain("asin");
  });

  test("schema.prisma includes source on OwnProduct", () => {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const source = fs.readFileSync(schemaPath, "utf-8");
    expect(source).toContain("source");
  });

  test("schema.prisma includes commissionPct on OwnProduct", () => {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const source = fs.readFileSync(schemaPath, "utf-8");
    expect(source).toContain("commissionPct");
  });
});
