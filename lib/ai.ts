import { generateText as claudeGenerate } from './claude'
import { getSetting } from './settings'
import { GoogleGenAI } from '@google/genai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIProvider = 'claude' | 'gemini'

export interface AIResult {
  text: string
  provider: AIProvider
}

// ---------------------------------------------------------------------------
// Error classification helpers
// ---------------------------------------------------------------------------

function isFallbackWorthy(err: unknown): boolean {
  if (err == null) return false
  const e = err as Record<string, unknown>

  // Check numeric status codes
  const status = (e.status as number | undefined) ?? (e.statusCode as number | undefined)
  if (status !== undefined) {
    if (status === 429) return true
    if (status >= 500 && status < 600) return true
  }

  // Check string error message for timeout indicators
  const message = typeof e.message === 'string' ? e.message : ''
  if (message.toLowerCase().includes('timeout') || message.includes('ETIMEDOUT')) {
    return true
  }

  return false
}

// ---------------------------------------------------------------------------
// Unified text generation — Claude first, Gemini fallback
// ---------------------------------------------------------------------------

export async function generateText(
  prompt: string,
  system: string,
): Promise<AIResult> {
  // ----- Attempt Claude ----
  let claudeError: unknown

  try {
    const text = await claudeGenerate(prompt, system)
    console.log('[ai] Generated with Claude')
    return { text, provider: 'claude' }
  } catch (err) {
    claudeError = err

    if (!isFallbackWorthy(err)) {
      // Auth errors (401), bad requests (400), etc. — don't try Gemini
      throw err
    }
  }

  // ----- Check fallback setting ----
  const fallbackEnabled = await getSetting('ai_fallback_enabled')
  if (fallbackEnabled === 'false') {
    // Fallback explicitly disabled — re-throw the original Claude error
    throw claudeError
  }

  // ----- Check Gemini API key ----
  const geminiKey = await getSetting('gemini_api_key')
  if (!geminiKey) {
    // No key configured — re-throw original Claude error
    throw claudeError
  }

  // ----- Log the fallback ----
  const claudeErr = claudeError as Record<string, unknown>
  const status = (claudeErr.status as number | undefined) ?? (claudeErr.statusCode as number | undefined)
  console.log(
    `[ai] Claude failed (${status ?? (claudeErr.message as string | undefined) ?? 'unknown'}), falling back to Gemini`,
  )

  // ----- Attempt Gemini ----
  try {
    const genai = new GoogleGenAI({ apiKey: geminiKey })
    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { systemInstruction: system },
    })
    const text = response.text ?? ''
    console.log('[ai] Generated with Gemini (fallback)')
    return { text, provider: 'gemini' }
  } catch (geminiErr) {
    const message = geminiErr instanceof Error ? geminiErr.message : String(geminiErr)
    throw new Error(`[ai] Both providers failed: ${message}`)
  }
}
