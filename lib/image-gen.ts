/**
 * image-gen.ts
 *
 * Unified image generation with Gemini primary and Replicate FLUX.1-schnell fallback.
 * All workers should import from here instead of initializing Gemini directly.
 */

import { GoogleGenAI } from "@google/genai";

import { getSetting } from "./settings";

// ---------------------------------------------------------------------------
// Error detection
// ---------------------------------------------------------------------------

function isQuotaOrAuthError(err: unknown): boolean {
  if (err == null) return false;
  const e = err as Record<string, unknown>;
  const status =
    (e.status as number | undefined) ?? (e.statusCode as number | undefined);
  if (status === 429 || status === 403 || status === 401) return true;
  const message = typeof e.message === "string" ? e.message.toLowerCase() : "";
  if (message.includes("quota") || message.includes("credit balance"))
    return true;
  return false;
}

// ---------------------------------------------------------------------------
// Gemini image generation
// ---------------------------------------------------------------------------

async function callGemini(params: {
  prompt: string;
  userId: string;
  parentBuffer?: Buffer;
}): Promise<Buffer> {
  const { prompt, userId, parentBuffer } = params;

  const apiKey =
    process.env.GEMINI_API_KEY ||
    (await getSetting("gemini_api_key", userId)) ||
    null;
  if (!apiKey) throw new Error("Gemini API key not configured");

  const ai = new GoogleGenAI({ apiKey });

  const contents: Array<{
    text?: string;
    inlineData?: { mimeType: string; data: string };
  }> = [];

  if (parentBuffer) {
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

  return Buffer.from(imagePart.inlineData.data, "base64");
}

// ---------------------------------------------------------------------------
// Replicate fallback (FLUX.1-schnell)
// ---------------------------------------------------------------------------

async function callReplicate(params: {
  prompt: string;
  userId: string;
}): Promise<Buffer> {
  const { prompt, userId } = params;

  const replicateKey = await getSetting("replicate_api_key", userId);
  if (!replicateKey) {
    throw new Error(
      "Image generation failed — configure Gemini or Replicate API key in Settings"
    );
  }

  // Create prediction
  const createRes = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          output_format: "png",
        },
      }),
    }
  );

  if (!createRes.ok) {
    const body = await createRes.text();
    throw new Error(`Replicate prediction failed: ${createRes.status} ${body}`);
  }

  const prediction = (await createRes.json()) as {
    id: string;
    urls: { get: string };
  };

  // Poll until complete (max 60s)
  const pollUrl = prediction.urls.get;
  const startTime = Date.now();

  while (Date.now() - startTime < 60000) {
    await new Promise((r) => setTimeout(r, 1000));

    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Token ${replicateKey}` },
    });

    if (!pollRes.ok) {
      const body = await pollRes.text();
      throw new Error(`Replicate poll failed: ${pollRes.status} ${body}`);
    }

    const result = (await pollRes.json()) as {
      status: string;
      output?: string[];
      error?: string;
    };

    if (result.status === "succeeded") {
      if (!result.output?.[0]) {
        throw new Error("Replicate succeeded but returned no output URL");
      }

      const imageRes = await fetch(result.output[0]);
      if (!imageRes.ok) {
        throw new Error(
          `Failed to download Replicate image: ${imageRes.status}`
        );
      }

      const arrayBuffer = await imageRes.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    if (result.status === "failed") {
      throw new Error(`Replicate prediction failed: ${result.error}`);
    }
  }

  throw new Error("Replicate prediction timed out (60s)");
}

// ---------------------------------------------------------------------------
// Unified export
// ---------------------------------------------------------------------------

export async function generateImage(params: {
  prompt: string;
  userId: string;
  parentBuffer?: Buffer;
}): Promise<Buffer> {
  const { prompt, userId, parentBuffer } = params;

  // Try Gemini first
  try {
    const buffer = await callGemini({ prompt, userId, parentBuffer });
    console.log("[image-gen] Generated with Gemini");
    return buffer;
  } catch (err) {
    if (!isQuotaOrAuthError(err)) {
      // Non-recoverable Gemini error — still try Replicate as ultimate fallback
      console.log("[image-gen] Gemini error, trying Replicate fallback:", err);
    } else {
      console.log(
        "[image-gen] Gemini quota/auth error, falling back to Replicate"
      );
    }
  }

  // Fallback to Replicate
  return callReplicate({ prompt, userId });
}
