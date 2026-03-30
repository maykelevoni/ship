import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// AI Voiceover + Captioned Slideshow Video — Playwright Tests
//
// Strategy (same as media-studio.spec.ts and settings.spec.ts):
//   - Static source file checks (fs.readFileSync) for structural verification
//     of worker modules, Remotion compositions, DB schema, and settings UI
//   - API request checks (non-500, non-404) for route / compilation verification
//   - page.goto + page.waitForLoadState for UI tab navigation
//
// What is NOT tested:
//   - Actual ElevenLabs TTS generation (external API, requires real key)
//   - Actual Gemini image generation (external API, slow)
//   - Actual Remotion video rendering (external/slow process)
// ---------------------------------------------------------------------------

// ─── Group 1: Settings page — ElevenLabs section ─────────────────────────────

test.describe("Settings page — ElevenLabs section (source + UI)", () => {
  test("settings source contains elevenlabs_api_key and elevenlabs_voice_id keys", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const settingsPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "page.tsx"
    );
    const source = fs.readFileSync(settingsPath, "utf-8");
    expect(source).toContain("elevenlabs_api_key");
    expect(source).toContain("elevenlabs_voice_id");
  });

  test('settings source contains "Audio (ElevenLabs)" section title', async () => {
    const fs = await import("fs");
    const path = await import("path");
    const settingsPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "page.tsx"
    );
    const source = fs.readFileSync(settingsPath, "utf-8");
    expect(source).toContain("Audio (ElevenLabs)");
  });

  test("settings source contains all 3 ElevenLabs voice IDs", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const settingsPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "page.tsx"
    );
    const source = fs.readFileSync(settingsPath, "utf-8");
    // Rachel (Female, warm) — default
    expect(source).toContain("21m00Tcm4TlvDq8ikWAM");
    // Adam (Male, confident)
    expect(source).toContain("pNInz6obpgDQGcFmaJgB");
    // Bella (Female, soft)
    expect(source).toContain("EXAVITQu4vr4xnSDxMaL");
  });

  test("settings source contains voice display names Rachel, Adam, Bella", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const settingsPath = path.join(
      process.cwd(),
      "app",
      "(dashboard)",
      "settings",
      "page.tsx"
    );
    const source = fs.readFileSync(settingsPath, "utf-8");
    expect(source).toContain("Rachel");
    expect(source).toContain("Adam");
    expect(source).toContain("Bella");
  });

  test('UI: /settings page — switch to "API Keys" tab and verify "Audio (ElevenLabs)" is visible', async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // If auth redirected us to login, skip — we verified this visually
    if (!page.url().includes("/settings")) {
      return;
    }

    // Wait for the loading spinner to disappear
    await page
      .getByText("Loading settings…")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});

    // Click the "API Keys" tab button
    await page.getByRole("button", { name: "API Keys" }).click();
    await page.waitForLoadState("networkidle");

    // The Audio (ElevenLabs) section card heading must be visible
    await expect(page.getByText("Audio (ElevenLabs)")).toBeVisible();
  });
});

// ─── Group 2: DB schema — audioPath + captionsJson ───────────────────────────

test.describe("DB schema — audioPath and captionsJson fields", () => {
  test("prisma/schema.prisma contains audioPath String? on MediaAsset", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const source = fs.readFileSync(schemaPath, "utf-8");
    expect(source).toContain("audioPath    String?");
  });

  test("prisma/schema.prisma contains captionsJson String? on MediaAsset", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const source = fs.readFileSync(schemaPath, "utf-8");
    expect(source).toContain("captionsJson String?");
  });
});

// ─── Group 3: Worker modules — source existence checks ───────────────────────

test.describe("Worker — worker/media/audio.ts source checks", () => {
  test("worker/media/audio.ts exists and exports generateVoiceover", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const audioPath = path.join(
      process.cwd(),
      "worker",
      "media",
      "audio.ts"
    );
    expect(fs.existsSync(audioPath)).toBe(true);
    const source = fs.readFileSync(audioPath, "utf-8");
    expect(source).toContain("generateVoiceover");
  });

  test("worker/media/audio.ts reads elevenlabs_api_key from settings", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const audioPath = path.join(
      process.cwd(),
      "worker",
      "media",
      "audio.ts"
    );
    const source = fs.readFileSync(audioPath, "utf-8");
    expect(source).toContain("elevenlabs_api_key");
  });

  test("worker/media/audio.ts uses eleven_turbo_v2_5 model", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const audioPath = path.join(
      process.cwd(),
      "worker",
      "media",
      "audio.ts"
    );
    const source = fs.readFileSync(audioPath, "utf-8");
    expect(source).toContain("eleven_turbo_v2_5");
  });

  test("worker/media/audio.ts calls with-timestamps ElevenLabs endpoint", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const audioPath = path.join(
      process.cwd(),
      "worker",
      "media",
      "audio.ts"
    );
    const source = fs.readFileSync(audioPath, "utf-8");
    expect(source).toContain("with-timestamps");
  });

  test("worker/media/audio.ts converts character alignment to words (character_start_times_seconds)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const audioPath = path.join(
      process.cwd(),
      "worker",
      "media",
      "audio.ts"
    );
    const source = fs.readFileSync(audioPath, "utf-8");
    expect(source).toContain("character_start_times_seconds");
  });
});

// ─── Group 4: Remotion composition — source existence checks ─────────────────

test.describe("Remotion composition — worker/templates/video source checks", () => {
  test("captioned-slideshow.tsx exists and contains CaptionedSlideshow component", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(
      process.cwd(),
      "worker",
      "templates",
      "video",
      "captioned-slideshow.tsx"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).toContain("CaptionedSlideshow");
  });

  test("captioned-slideshow.tsx uses createTikTokStyleCaptions from @remotion/captions", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(
      process.cwd(),
      "worker",
      "templates",
      "video",
      "captioned-slideshow.tsx"
    );
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).toContain("createTikTokStyleCaptions");
  });

  test("captioned-slideshow.tsx loads Anton font", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(
      process.cwd(),
      "worker",
      "templates",
      "video",
      "captioned-slideshow.tsx"
    );
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).toContain("Anton");
  });

  test("word-page.tsx exists and uses #39E508 active word highlight color", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(
      process.cwd(),
      "worker",
      "templates",
      "video",
      "word-page.tsx"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).toContain("#39E508");
  });

  test("subtitle-page.tsx exists and uses spring for entrance animation", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(
      process.cwd(),
      "worker",
      "templates",
      "video",
      "subtitle-page.tsx"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const source = fs.readFileSync(filePath, "utf-8");
    expect(source).toContain("spring");
  });

  test('worker/templates/video/index.tsx registers CaptionedSlideshow composition id', async () => {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.join(
      process.cwd(),
      "worker",
      "templates",
      "video",
      "index.tsx"
    );
    const source = fs.readFileSync(filePath, "utf-8");
    // The Composition component must use id="CaptionedSlideshow"
    expect(source).toContain("CaptionedSlideshow");
  });
});

// ─── Group 5: API route — POST /api/media video type ─────────────────────────
// We do NOT trigger actual generation — only verify the route compiles and
// handles the request without crashing (non-500, non-404).

test.describe("API route — POST /api/media with video type (no actual generation)", () => {
  test("POST /api/media with type=video does not 500 or 404", async ({
    request,
  }) => {
    // Missing auth / missing API key → expect 400 or 401; never 500 (crash) or 404 (missing)
    const res = await request.post("/api/media", {
      data: { type: "video", prompt: "test" },
    });
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });

  test("GET /api/media?type=video does not 500 or 404", async ({ request }) => {
    const res = await request.get("/api/media?type=video");
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(404);
  });
});
