import { generateText } from '../../lib/claude'
import type { Promotion } from '@prisma/client'

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

export async function generateMaster(promotion: Promotion): Promise<string> {
  return generateText(buildMasterPrompt(promotion), MASTER_SYSTEM)
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

function buildFormatPrompt(master: string, promotion: Promotion): string {
  return `Here is the master email newsletter piece to repurpose:\n\n${master}\n\nPromotion URL: ${promotion.url}`
}

function formatEmail(master: string, promotion: Promotion): string {
  const subject = `${promotion.name} — ${promotion.description.slice(0, 60).trimEnd()}…`
  return `SUBJECT: ${subject}\n\nBODY: ${master}`
}

export async function generateAllFormats(
  promotion: Promotion,
  master: string,
): Promise<Record<string, string>> {
  const prompt = buildFormatPrompt(master, promotion)

  const results = await Promise.allSettled([
    generateText(prompt, TWITTER_SYSTEM),   // 0
    generateText(prompt, LINKEDIN_SYSTEM),  // 1
    generateText(prompt, REDDIT_SYSTEM),    // 2
    generateText(prompt, INSTAGRAM_SYSTEM), // 3
    Promise.resolve(formatEmail(master, promotion)), // 4
    generateText(prompt, VIDEO_SYSTEM),     // 5
  ])

  function settle(result: PromiseSettledResult<string>, platform: string): string {
    if (result.status === 'fulfilled') return result.value
    console.error(`[generate] ${platform} generation failed:`, result.reason)
    return `[Generation failed for ${platform}]`
  }

  return {
    twitter:   settle(results[0], 'twitter'),
    linkedin:  settle(results[1], 'linkedin'),
    reddit:    settle(results[2], 'reddit'),
    instagram: settle(results[3], 'instagram'),
    email:     settle(results[4], 'email'),
    video:     settle(results[5], 'video'),
  }
}
