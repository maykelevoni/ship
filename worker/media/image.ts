/**
 * image.ts
 *
 * Two-step image generation:
 * 1. Gemini generates a photorealistic background scene (no text)
 * 2. Sharp composites the exact post title + URL as text overlay
 *
 * This prevents Gemini from overriding our text with its own marketing copy.
 */

import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import type { Promotion } from "@prisma/client";
import sharp from "sharp";

import { getSetting } from "../../lib/settings";
import type { ImageStyle } from "./image-prompts";

// ---------------------------------------------------------------------------
// Step 1: Generate background scene with Gemini (no text)
// ---------------------------------------------------------------------------

async function generateBackgroundScene(params: {
  topic: string;
  description?: string;
  userId: string;
}): Promise<Buffer> {
  const { topic, description, userId } = params;

  const apiKey = await getSetting("gemini_api_key", userId);
  if (!apiKey) throw new Error("gemini_api_key not found in Setting table");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Create a stunning, photorealistic, cinematic background image for a social media post.

Topic: "${topic}"${description ? `\nContext: ${description}` : ""}

Visual requirements:
- Photorealistic scene that visually represents the topic above
- Show a real environment, people, or subject directly related to this topic
- Cinematic lighting, professional photography quality, vivid and dramatic
- Square 1:1 aspect ratio (1080x1080px)
- NO text, NO typography, NO words, NO overlays of any kind
- Pure visual scene only — text will be added separately`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: prompt,
    config: { responseModalities: ["IMAGE"] },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part: any) => part.inlineData);

  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini response did not contain an image part");
  }

  return Buffer.from(imagePart.inlineData.data, "base64");
}

// ---------------------------------------------------------------------------
// Step 2: Composite text overlay using Sharp
// ---------------------------------------------------------------------------

async function compositeTextOverlay(params: {
  backgroundBuffer: Buffer;
  headline: string;
  subtext?: string;
  url?: string;
  outputPath: string;
}): Promise<string> {
  const { backgroundBuffer, headline, subtext, url, outputPath } = params;

  const width = 1080;
  const height = 1080;
  const padding = 60;
  const lineHeight = 68;
  const fontSize = 58;

  // Resize background to 1080x1080
  const bg = await sharp(backgroundBuffer)
    .resize(width, height, { fit: "cover" })
    .toBuffer();

  // Wrap headline into lines (~30 chars per line)
  const words = headline.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > 30) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());

  // Text band height: dark solid bar at the BOTTOM covering ~40% of image
  const bandHeight = Math.min(
    lines.length * lineHeight +
      (subtext ? 70 : 0) +
      (url ? 50 : 0) +
      padding * 2,
    height * 0.55,
  );
  const bandY = height - bandHeight;

  // Y positions (from top of band)
  const headlineStartY = bandY + padding + fontSize;
  const subtextY = headlineStartY + lines.length * lineHeight + 28;
  const urlY = height - padding - 8;

  const headlineSvg = lines
    .map(
      (line, i) =>
        `<text x="${padding}" y="${headlineStartY + i * lineHeight}"
      font-size="${fontSize}" font-weight="bold" fill="white"
      font-family="Arial, Helvetica, sans-serif">${escapeXml(line)}</text>`,
    )
    .join("\n");

  const subtextSvg = subtext
    ? `<text x="${padding}" y="${subtextY}"
        font-size="30" fill="#d4d4d4"
        font-family="Arial, Helvetica, sans-serif"
        >${escapeXml(subtext.substring(0, 90))}${subtext.length > 90 ? "…" : ""}</text>`
    : "";

  const urlSvg = url
    ? `<text x="${padding}" y="${urlY}"
        font-size="24" fill="#a1a1aa"
        font-family="Arial, Helvetica, sans-serif">${escapeXml(url)}</text>`
    : "";

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- DEBUG: bright red band to confirm Sharp is running -->
  <rect x="0" y="0" width="${width}" height="40" fill="red"/>
  <!-- Solid dark band at bottom — covers Gemini's baked-in text -->
  <rect x="0" y="${bandY}" width="${width}" height="${bandHeight}" fill="rgba(0,0,0,0.82)"/>
  <!-- Thin accent line at top of band -->
  <rect x="0" y="${bandY}" width="${width}" height="4" fill="#6366f1"/>
  ${headlineSvg}
  ${subtextSvg}
  ${urlSvg}
</svg>`;

  const svgBuffer = Buffer.from(svg);

  await sharp(bg)
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png()
    .toFile(outputPath);

  return outputPath;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ---------------------------------------------------------------------------
// Core renderer (two-step)
// ---------------------------------------------------------------------------

export async function renderImage(params: {
  style: ImageStyle;
  promptData: Record<string, string>;
  outputPath: string;
  userId: string;
}): Promise<string> {
  const { promptData, outputPath, userId } = params;

  // Step 1: Generate background scene (Gemini, no text)
  const bgBuffer = await generateBackgroundScene({
    topic: promptData.headline ?? "",
    description: promptData.subtext,
    userId,
  });

  // Step 2: Composite exact text on top (Sharp)
  return compositeTextOverlay({
    backgroundBuffer: bgBuffer,
    headline: promptData.headline ?? "",
    subtext: promptData.subtext,
    url: promptData.url,
    outputPath,
  });
}

// ---------------------------------------------------------------------------
// Platform-aware renderer
// ---------------------------------------------------------------------------

export async function renderImageForPlatform(params: {
  platform: "linkedin" | "instagram";
  promotion: Promotion;
  postTitle: string;
  postDescription?: string;
  date: string;
  userId: string;
}): Promise<string> {
  const { platform, promotion, postTitle, postDescription, date, userId } =
    params;

  const promptData: Record<string, string> = {
    headline: postTitle,
    subtext: postDescription ?? "",
    url: promotion.url,
  };

  const outputDir = path.resolve("./media/images");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${date}-${platform}.png`);

  return renderImage({ style: "text-card", promptData, outputPath, userId });
}
