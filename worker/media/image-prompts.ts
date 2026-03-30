/**
 * image-prompts.ts
 *
 * Prompt builders for the Google Gemini image generation API.
 * Each function returns a prompt that produces a photorealistic marketing
 * image — pure visual scene, no text overlays.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImageStyle = 'text-card' | 'quote-card' | 'stat-card'

export interface TextCardData {
  headline: string
  subtext?: string
  /** Short badge label, e.g. "FREE EBOOK" — used to inform the scene */
  badge?: string
  /** Override the default indigo accent color (hex). Default: #6366f1 */
  accentColor?: string
}

export interface QuoteCardData {
  quote: string
  attribution?: string
}

export interface StatCardData {
  /** The main metric, e.g. "10x" */
  stat: string
  /** Explanatory label below the metric, e.g. "faster than doing it manually" */
  label: string
  /** Optional extra context sentence */
  context?: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const BASE_STYLE = `
Visual style requirements:
- Square 1:1 aspect ratio (1080×1080px), optimized for Instagram and LinkedIn.
- Photorealistic, highly detailed scene — real objects, real environments, real people or animals as relevant. NOT abstract shapes, gradients, or patterns.
- Cinematic lighting, professional photography quality, vivid and saturated colors.
- No text, no UI elements, no overlays, no watermarks — pure visual scene only.
- The result must look like a professional stock photo or film still, not a graphic design.
`.trim()

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

/**
 * Builds a Gemini prompt that generates a photorealistic marketing image
 * representing the topic visually — no text overlaid.
 */
export function buildTextCardPrompt(data: TextCardData): string {
  return `Create a stunning square photorealistic image (1:1 ratio).

SCENE: A photorealistic, cinematic image that visually represents this topic:
"${data.headline}"${data.subtext ? ` — ${data.subtext}` : ''}.
Show a real, vivid environment or scene directly related to this topic. No product mockups.

${BASE_STYLE}`
}

/**
 * Builds a Gemini prompt for a photorealistic image representing a quote's theme.
 */
export function buildQuoteCardPrompt(data: QuoteCardData): string {
  return `Create a stunning square photorealistic image (1:1 ratio).

SCENE: A photorealistic, cinematic image that visually represents the theme of:
"${data.quote}"${data.attribution ? ` by ${data.attribution}` : ''}.
Show a real, relevant scene — a person, environment, or subject that embodies the message.
Use cinematic lighting and vivid detail.

${BASE_STYLE}`
}

/**
 * Builds a Gemini prompt for a photorealistic image representing a statistic visually.
 */
export function buildStatCardPrompt(data: StatCardData): string {
  return `Create a stunning square photorealistic image (1:1 ratio).

SCENE: A photorealistic, cinematic image that visually represents:
"${data.label}"${data.context ? ` — ${data.context}` : ''}.
Show a real, relevant scene with strong visual impact that makes the concept feel credible and impressive.
Use dynamic lighting and professional photography style.

${BASE_STYLE}`
}

// ---------------------------------------------------------------------------
// Style picker
// ---------------------------------------------------------------------------

/**
 * Maps a promotion type string to the most appropriate ImageStyle.
 */
export function getStyleForPromotion(promotionType: string): ImageStyle {
  switch (promotionType) {
    case 'lead_magnet':
      return 'text-card'
    case 'product':
      return 'stat-card'
    default:
      return 'text-card'
  }
}
