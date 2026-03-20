/**
 * image-prompts.ts
 *
 * Prompt builders for the Google Gemini image generation API
 * (gemini-3.1-flash-image-preview).  Each function returns a detailed
 * natural-language string that instructs Gemini to produce a 1:1 square
 * social-media card with a dark background, white text, and an
 * indigo/purple accent.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImageStyle = 'text-card' | 'quote-card' | 'stat-card'

export interface TextCardData {
  headline: string
  subtext?: string
  /** Short badge label rendered at the top, e.g. "FREE EBOOK" */
  badge?: string
  /** URL displayed as small muted text at the bottom */
  url?: string
  /** Override the default indigo accent color (hex). Default: #6366f1 */
  accentColor?: string
}

export interface QuoteCardData {
  quote: string
  attribution?: string
  /** URL displayed as small muted text at the bottom */
  url?: string
}

export interface StatCardData {
  /** The main metric, e.g. "10x" */
  stat: string
  /** Explanatory label below the metric, e.g. "faster than doing it manually" */
  label: string
  /** Optional extra context sentence */
  context?: string
  /** URL displayed as small muted text at the bottom */
  url?: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DEFAULT_ACCENT = '#6366f1'

const BASE_STYLE = `
Design requirements:
- Perfectly square 1:1 aspect ratio, suitable for Instagram and LinkedIn posts.
- Background: solid near-black (#0f0f0f).
- All primary text: crisp, high-contrast white (#ffffff).
- Supporting / secondary text: light gray (#a1a1aa).
- Accent / highlight color: indigo-purple.
- Typography: modern, clean sans-serif (e.g. Inter, Geist, or similar).
- Layout: generous padding (≥8% of canvas width on every side), ample vertical
  breathing room between sections.
- No photographs, no gradients, no textures — flat, minimal, editorial.
- No clutter: only the elements described below.
- The final image must look polished enough to publish directly as a social post.
`.trim()

function urlLine(url?: string): string {
  return url ? `\n- Bottom: small muted gray URL text "${url}".` : ''
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

/**
 * Builds a Gemini image-generation prompt for a text/announcement card.
 *
 * Layout (top → bottom):
 *   [optional badge pill]  →  headline  →  [optional subtext]  →  [optional url]
 */
export function buildTextCardPrompt(data: TextCardData): string {
  const accent = data.accentColor ?? DEFAULT_ACCENT

  const badgeLine = data.badge
    ? `\n- Top-center: a small rounded pill badge with text "${data.badge}" in bold uppercase white letters on a solid ${accent} background.`
    : ''

  const subtextLine = data.subtext
    ? `\n- Below the headline: supporting text "${data.subtext}" in light gray, smaller font.`
    : ''

  return `Create a square social media image (1:1 ratio).

Layout (top to bottom):${badgeLine}
- Center: very large bold white headline text — "${data.headline}".${subtextLine}${urlLine(data.url)}

Accent color for this card: ${accent}.

${BASE_STYLE}`
}

/**
 * Builds a Gemini image-generation prompt for a pull-quote card.
 *
 * Layout (top → bottom):
 *   large opening quotation mark (accent)  →  quote text  →  [attribution]  →  [url]
 */
export function buildQuoteCardPrompt(data: QuoteCardData): string {
  const attributionLine = data.attribution
    ? `\n- Below the quote: attribution line "— ${data.attribution}" in light gray italic text, smaller than the quote.`
    : ''

  return `Create a square social media image (1:1 ratio).

Layout (top to bottom):
- Top-left: a very large decorative opening quotation mark (" ) in ${DEFAULT_ACCENT} indigo, acting as a visual anchor.
- Center: the quote text "${data.quote}" in large bold white, centered, with generous line-height.${attributionLine}${urlLine(data.url)}

${BASE_STYLE}`
}

/**
 * Builds a Gemini image-generation prompt for a statistics/metric card.
 *
 * Layout (top → bottom):
 *   giant stat number  →  label  →  [context]  →  [url]
 */
export function buildStatCardPrompt(data: StatCardData): string {
  const contextLine = data.context
    ? `\n- Below the label: a shorter context sentence "${data.context}" in light gray, smaller font.`
    : ''

  return `Create a square social media image (1:1 ratio).

Layout (top to bottom):
- Center: an enormous, bold white metric — "${data.stat}" — displayed in the largest possible font, visually dominant.
- Directly below: a bold white label — "${data.label}" — in a noticeably smaller but still large font.${contextLine}${urlLine(data.url)}
- A thin horizontal ${DEFAULT_ACCENT} indigo accent line separates the metric from the label.

${BASE_STYLE}`
}

// ---------------------------------------------------------------------------
// Style picker
// ---------------------------------------------------------------------------

/**
 * Maps a promotion type string to the most appropriate ImageStyle.
 *
 * | promotionType  | ImageStyle   |
 * |----------------|--------------|
 * | "lead_magnet"  | "text-card"  |
 * | "product"      | "stat-card"  |
 * | (default)      | "text-card"  |
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
