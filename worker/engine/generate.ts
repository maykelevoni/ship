import { generateText } from '../../lib/ai'
import type { AIProvider } from '../../lib/ai'
import type { Promotion, Template } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedPiece {
  content: string
  provider: AIProvider
}

// ─── Master Piece ────────────────────────────────────────────────────────────

const MASTER_SYSTEM = `You are an expert content marketer. Write a 400-600 word email newsletter piece \
about the following promotion. Lead with the problem, not the product. \
Be specific, conversational, and valuable even without the product. \
End with a natural mention of the product/offer and a clear CTA.`

function buildMasterPrompt(promotion: Promotion): string {
  const benefits = promotion.benefits
    ? (() => {
        try {
          return (JSON.parse(promotion.benefits) as string[]).join(', ')
        } catch {
          return promotion.benefits
        }
      })()
    : 'N/A'

  return `
Name: ${promotion.name}
Type: ${promotion.type}
Description: ${promotion.description}
Benefits: ${benefits}
Target Audience: ${promotion.targetAudience ?? 'General audience'}
URL: ${promotion.url}
`.trim()
}

export async function generateMaster(
  promotion: Promotion,
  template?: Template,
): Promise<GeneratedPiece> {
  let system = MASTER_SYSTEM

  if (template) {
    if (template.aiInstructions) {
      system = template.aiInstructions
    }
    if (template.charLimit) {
      system += `\n\nKeep under ${template.charLimit} characters.`
    }
  }

  const { text, provider } = await generateText(buildMasterPrompt(promotion), system)
  return { content: text, provider }
}

// ─── Platform Formats ────────────────────────────────────────────────────────

const TWITTER_SYSTEM =
  'You are a Twitter ghostwriter. Extract a viral 8-12 tweet thread from this email. ' +
  'Tweet 1 is a hook describing the problem. Tweets 2-4 are insight. Tweets 5-9 reveal the solution. ' +
  'Tweets 10-11 are social proof. Tweet 12 is CTA. Each tweet ≤ 280 chars. Return as numbered list.'

const LINKEDIN_SYSTEM =
  "Extract a 150-300 word LinkedIn post. Start with a bold insight (not 'I\\'m excited'). " +
  '3-5 short paragraphs. ROI angle. End with a question. 2-3 hashtags max. Founder voice.'

const REDDIT_SYSTEM =
  'Write a community-first Reddit post. Choose the best subreddit from: ' +
  'r/entrepreneur, r/SaaS, r/startups, r/smallbusiness, r/webdev. ' +
  'Title describes the problem. Body tells a story. Product mention is natural near end. ' +
  'No hard sell. Return format: SUBREDDIT: r/xxx\nTITLE: ...\nBODY: ...'

const INSTAGRAM_SYSTEM =
  'Write a punchy Instagram caption under 150 words. Hook first line. ' +
  '3 value points. CTA. 5-8 relevant hashtags at end.'

const VIDEO_SYSTEM =
  'Write a 30-60 second video script. Hook (0-3s, one punchy sentence). ' +
  '3 key points (3-15s, one sentence each). Product reveal (15-25s). ' +
  'CTA (25-30s, include URL). ' +
  'Return as JSON: { "hook": "...", "points": ["...", "...", "..."], "reveal": "...", "cta": "..." }'

const BASE_SYSTEMS: Record<string, string> = {
  twitter: TWITTER_SYSTEM,
  linkedin: LINKEDIN_SYSTEM,
  reddit: REDDIT_SYSTEM,
  instagram: INSTAGRAM_SYSTEM,
  video: VIDEO_SYSTEM,
}

function buildFormatPrompt(master: string, promotion: Promotion): string {
  return `Here is the master email newsletter piece to repurpose:\n\n${master}\n\nPromotion URL: ${promotion.url}`
}

function formatEmail(master: string, promotion: Promotion): GeneratedPiece {
  const subject = `${promotion.name} — ${promotion.description.slice(0, 60).trimEnd()}…`
  return {
    content: `SUBJECT: ${subject}\n\nBODY: ${master}`,
    provider: 'claude',
  }
}

function buildPlatformSystem(platform: string, template?: Template): string {
  const base = BASE_SYSTEMS[platform] ?? ''

  if (!template) return base

  // Template aiInstructions REPLACES the base system prompt
  let system = template.aiInstructions ?? base

  if (template.charLimit) {
    system += `\n\nKeep under ${template.charLimit} characters.`
  }

  return system
}

export async function generateAllFormats(
  promotion: Promotion,
  master: string,
  templates?: Record<string, Template>,
): Promise<Record<string, GeneratedPiece>> {
  const prompt = buildFormatPrompt(master, promotion)

  const platforms = ['twitter', 'linkedin', 'reddit', 'instagram', 'video'] as const

  const results = await Promise.allSettled(
    platforms.map((platform) => {
      const system = buildPlatformSystem(platform, templates?.[platform])
      return generateText(prompt, system)
    }),
  )

  function settle(
    result: PromiseSettledResult<{ text: string; provider: AIProvider }>,
    platform: string,
  ): GeneratedPiece {
    if (result.status === 'fulfilled') {
      return { content: result.value.text, provider: result.value.provider }
    }
    console.error(`[generate] ${platform} generation failed:`, result.reason)
    return { content: `[Generation failed for ${platform}]`, provider: 'claude' }
  }

  return {
    twitter: settle(results[0], 'twitter'),
    linkedin: settle(results[1], 'linkedin'),
    reddit: settle(results[2], 'reddit'),
    instagram: settle(results[3], 'instagram'),
    email: formatEmail(master, promotion),
    video: settle(results[4], 'video'),
  }
}
