import { GoogleGenAI } from "@google/genai";

import { getSetting } from "./settings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIProvider = "gemini" | "openrouter";

export interface AIResult {
  text: string;
  provider: AIProvider;
}

// ---------------------------------------------------------------------------
// Transient error check — these trigger fallback to next provider
// ---------------------------------------------------------------------------

function isTransient(err: unknown): boolean {
  if (err == null) return false;
  const e = err as Record<string, unknown>;
  const status =
    (e.status as number | undefined) ?? (e.statusCode as number | undefined);
  if (status !== undefined) {
    if (status === 429) return true;
    if (status >= 500 && status < 600) return true;
  }
  const message = typeof e.message === "string" ? e.message : "";
  if (
    message.toLowerCase().includes("timeout") ||
    message.includes("ETIMEDOUT")
  )
    return true;
  if (
    message.toLowerCase().includes("credit balance") ||
    message.toLowerCase().includes("quota")
  )
    return true;
  return false;
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

async function callGemini(
  prompt: string,
  system: string,
  key: string,
): Promise<string> {
  const genai = new GoogleGenAI({ apiKey: key });
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { systemInstruction: system },
  });
  return response.text ?? "";
}

async function callOpenRouter(
  prompt: string,
  system: string,
  key: string,
  model: string,
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`${res.status} ${body}`) as Error & {
      status: number;
    };
    err.status = res.status;
    throw err;
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Unified text generation — Gemini primary, OpenRouter fallback
// ---------------------------------------------------------------------------

export async function generateText(
  prompt: string,
  system: string,
): Promise<AIResult> {
  const geminiKey =
    process.env.GEMINI_API_KEY || (await getSetting("gemini_api_key")) || null;

  // 1. Gemini
  if (geminiKey) {
    try {
      const text = await callGemini(prompt, system, geminiKey);
      console.log("[ai] Generated with Gemini");
      return { text, provider: "gemini" };
    } catch (err) {
      if (!isTransient(err)) throw err;
      console.log("[ai] Gemini transient failure — trying OpenRouter");
    }
  }

  // 2. OpenRouter
  const openrouterKey = (await getSetting("openrouter_api_key")) || null;
  const openrouterModel =
    (await getSetting("openrouter_model")) || "openai/gpt-4o-mini";

  if (openrouterKey) {
    try {
      const text = await callOpenRouter(
        prompt,
        system,
        openrouterKey,
        openrouterModel,
      );
      console.log("[ai] Generated with OpenRouter");
      return { text, provider: "openrouter" };
    } catch (err) {
      if (!isTransient(err)) throw err;
      console.log("[ai] OpenRouter also failed");
    }
  }

  throw new Error(
    "[ai] All providers failed — configure a Gemini or OpenRouter API key in Settings",
  );
}
