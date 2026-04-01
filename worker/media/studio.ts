/**
 * studio.ts
 *
 * Worker functions for the Media Studio feature.
 *
 * generateStudioImage — calls Gemini to produce a raw PNG (no text overlay),
 *   with optional parent image as inlineData context for iterative editing.
 *
 * resizeForPlatforms — uses Sharp to resize the base PNG to platform-specific
 *   dimensions and saves each to ./media/studio/.
 *
 * generateStudioVideo — calls Claude to generate (or extend) a short-form video
 *   script, then renders it with Remotion via renderVideo().
 */

import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";

import { generateText } from "../../lib/ai";
import { getSetting } from "../../lib/settings";
import { generateVoiceover } from "./audio";
import { renderCaptionedVideo } from "./video";

// ---------------------------------------------------------------------------
// Platform size definitions
// ---------------------------------------------------------------------------

const PLATFORM_SIZES = [
  { platform: "blog", width: 1200, height: 628 },
  { platform: "tiktok", width: 1080, height: 1920 },
  { platform: "twitter", width: 1200, height: 675 },
] as const;

// ---------------------------------------------------------------------------
// generateStudioImage
// ---------------------------------------------------------------------------

export async function generateStudioImage(params: {
  prompt: string;
  parentFilePath?: string;
  outputPath: string;
}): Promise<{ buffer: Buffer; filePath: string }> {
  const { prompt, parentFilePath, outputPath } = params;

  const apiKey = await getSetting("gemini_api_key");
  if (!apiKey) throw new Error("gemini_api_key not found in Setting table");

  const ai = new GoogleGenAI({ apiKey });

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Build contents array — optionally include parent image as inlineData
  const contents: Array<{
    text?: string;
    inlineData?: { mimeType: string; data: string };
  }> = [];

  if (parentFilePath) {
    const parentBuffer = fs.readFileSync(parentFilePath);
    contents.push({
      inlineData: {
        mimeType: "image/png",
        data: parentBuffer.toString("base64"),
      },
    });
  }

  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: contents.length === 1 ? (contents[0].text ?? prompt) : contents,
    config: { responseModalities: ["IMAGE"] },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part: any) => part.inlineData);

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini response did not contain an image part");
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");

  fs.writeFileSync(outputPath, buffer);

  return { buffer, filePath: outputPath };
}

// ---------------------------------------------------------------------------
// resizeForPlatforms
// ---------------------------------------------------------------------------

export async function resizeForPlatforms(params: {
  sourceBuffer: Buffer;
  groupId: string;
  outputDir: string;
}): Promise<
  Array<{ platform: string; filePath: string; width: number; height: number }>
> {
  const { sourceBuffer, groupId, outputDir } = params;

  fs.mkdirSync(outputDir, { recursive: true });

  const results = await Promise.all(
    PLATFORM_SIZES.map(async ({ platform, width, height }) => {
      const outputPath = path.join(outputDir, `${groupId}-${platform}.png`);

      await sharp(sourceBuffer)
        .resize(width, height, { fit: "cover" })
        .png()
        .toFile(outputPath);

      return { platform, filePath: outputPath, width, height };
    }),
  );

  return results;
}

// ---------------------------------------------------------------------------
// generateStudioVideo
// ---------------------------------------------------------------------------

const VIDEO_SCRIPT_SYSTEM = `You are a short-form social video scriptwriter.
Return ONLY a JSON object (no markdown, no explanation) with the following shape:
{
  "hook":   "<one punchy opening sentence that grabs attention>",
  "points": ["<point 1>", "<point 2>", "<point 3>"],
  "reveal": "<a surprising or satisfying revelation>",
  "cta":    "<call to action>"
}
All values must be short, conversational, and optimised for vertical video (TikTok / Reels).`;

export async function generateStudioVideo(params: {
  prompt: string;
  parentScript?: string; // JSON string of prior script; Claude will extend it
  backgroundImageDataUrl?: string; // kept for backwards compatibility — not used in new flow
  outputPath: string;
}): Promise<{
  filePath: string;
  script: string;
  audioPath: string;
  captionsJson: string;
}> {
  const { prompt, parentScript, backgroundImageDataUrl, outputPath } = params;

  // ---- Script generation (Gemini primary, OpenRouter fallback) ----
  const userMessage = parentScript
    ? `Existing script to extend (JSON):\n${parentScript}\n\nNew direction / additions:\n${prompt}`
    : prompt;

  const { text: rawScript } = await generateText(
    userMessage,
    VIDEO_SCRIPT_SYSTEM,
  );

  // Strip markdown code fences
  const raw = rawScript
    .replace(/^```[\w]*\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  const parsedScript = JSON.parse(raw) as {
    hook: string;
    points: string[];
    reveal: string;
    cta: string;
  };

  // ---- Generate 5 section images in parallel ----
  const sectionPrompts = [
    `Cinematic scene: ${parsedScript.hook}. Vertical 9:16 portrait, photorealistic, no text`,
    `Cinematic scene: ${parsedScript.points[0]}. Vertical 9:16 portrait, photorealistic, no text`,
    `Cinematic scene: ${parsedScript.points[1]}. Vertical 9:16 portrait, photorealistic, no text`,
    `Cinematic scene: ${parsedScript.points[2]}. Vertical 9:16 portrait, photorealistic, no text`,
    `Cinematic scene: ${parsedScript.reveal}. Vertical 9:16 portrait, photorealistic, no text`,
  ];

  const imageResults = await Promise.all(
    sectionPrompts.map((prompt, i) =>
      generateStudioImage({
        prompt,
        outputPath: outputPath.replace(".mp4", `-img${i}.png`),
      }),
    ),
  );
  const imageDataUrls = imageResults.map(
    (r) => `data:image/png;base64,${r.buffer.toString("base64")}`,
  );

  // ---- Generate ElevenLabs voiceover ----
  const narrationText =
    [
      parsedScript.hook,
      ...parsedScript.points,
      parsedScript.reveal,
      parsedScript.cta,
    ].join(". ") + ".";

  const audioOutputPath = outputPath.replace(".mp4", ".mp3");
  const { audioPath, audioDataUrl, captions, durationSeconds } =
    await generateVoiceover({
      text: narrationText,
      outputPath: audioOutputPath,
    });

  // ---- Render CaptionedSlideshow ----
  await renderCaptionedVideo({
    images: imageDataUrls,
    audioDataUrl,
    captions,
    durationSeconds,
    outputPath,
  });

  return {
    filePath: outputPath,
    script: JSON.stringify(parsedScript),
    audioPath,
    captionsJson: JSON.stringify(captions),
  };
}
