/**
 * Seed default templates and schedule entries.
 * Called from worker startup if tables are empty.
 * Idempotent — checks count before inserting.
 */

import { db } from '@/lib/db'

const DEFAULT_TEMPLATES = [
  {
    name: 'Thread (8–12 tweets)',
    platform: 'twitter',
    charLimit: 280,
    imageEnabled: false,
    videoEnabled: false,
    includeLink: true,
    aiInstructions:
      'Write an 8-12 tweet thread. Tweet 1 is a hook about the problem. Tweets 2-9 build value. Tweet 12 is CTA with link. Each tweet ≤ 280 chars. Numbered list format.',
  },
  {
    name: 'Short Tweet + Link',
    platform: 'twitter',
    charLimit: 240,
    imageEnabled: false,
    videoEnabled: false,
    includeLink: true,
    aiInstructions:
      'One punchy tweet under 240 chars. Problem-first hook. End with the link.',
  },
  {
    name: 'LinkedIn Image Post',
    platform: 'linkedin',
    charLimit: 1800,
    imageEnabled: true,
    imageWidth: 1200,
    imageHeight: 627,
    videoEnabled: false,
    includeLink: true,
    aiInstructions:
      '150-300 word post. Bold insight opening. 3-5 short paragraphs. ROI angle. End with a question. 2-3 hashtags. Founder voice.',
  },
  {
    name: 'Instagram Caption + Image',
    platform: 'instagram',
    charLimit: 2200,
    imageEnabled: true,
    imageWidth: 1080,
    imageHeight: 1080,
    videoEnabled: false,
    includeLink: false,
    aiInstructions:
      'Punchy caption under 150 words. Hook first line. 3 value points. CTA. 5-8 hashtags at end.',
  },
  {
    name: 'Facebook Post',
    platform: 'facebook',
    charLimit: 500,
    imageEnabled: true,
    imageWidth: 1200,
    imageHeight: 630,
    videoEnabled: false,
    includeLink: true,
    aiInstructions:
      '500 char max. Conversational tone. Tell a short story. End with a question to drive comments.',
  },
  {
    name: 'Reddit Post',
    platform: 'reddit',
    charLimit: null,
    imageEnabled: false,
    videoEnabled: false,
    includeLink: false,
    aiInstructions:
      'Community-first post. Choose best subreddit from: r/entrepreneur, r/SaaS, r/startups, r/smallbusiness, r/webdev. No hard sell. Return format: SUBREDDIT: r/xxx\nTITLE: ...\nBODY: ...',
  },
  {
    name: 'Email Newsletter',
    platform: 'email',
    charLimit: null,
    imageEnabled: false,
    videoEnabled: false,
    includeLink: true,
    aiInstructions:
      '400-600 word newsletter. Lead with the problem. Conversational and valuable. Natural product mention at end with clear CTA. Format: SUBJECT: ...\n\nBODY: ...',
  },
  {
    name: 'TikTok / Reels Video',
    platform: 'tiktok',
    charLimit: 150,
    imageEnabled: false,
    videoEnabled: true,
    videoWidth: 1080,
    videoHeight: 1920,
    includeLink: true,
    aiInstructions:
      '30-60 second video script. Return JSON: { hook, points: [3 items], reveal, cta }',
  },
] as const

/**
 * Default schedule entries — seeded after templates.
 * templateName is used to look up the templateId from freshly-seeded templates.
 */
const DEFAULT_SCHEDULE = [
  { time: '09:00', platform: 'twitter',   templateName: 'Short Tweet + Link' },
  { time: '10:00', platform: 'linkedin',  templateName: 'LinkedIn Image Post' },
  { time: '11:00', platform: 'tiktok',    templateName: 'TikTok / Reels Video' },
  { time: '12:00', platform: 'reddit',    templateName: 'Reddit Post' },
  { time: '14:00', platform: 'instagram', templateName: 'Instagram Caption + Image' },
  { time: '17:00', platform: 'email',     templateName: 'Email Newsletter' },
] as const

export async function seedDefaults(): Promise<void> {
  // ── Templates ─────────────────────────────────────────────────────────────
  const templateCount = await db.template.count()

  if (templateCount === 0) {
    console.log('[seeds] Seeding default templates…')

    await db.template.createMany({
      data: DEFAULT_TEMPLATES.map((t) => ({
        name: t.name,
        platform: t.platform,
        charLimit: t.charLimit ?? null,
        imageEnabled: t.imageEnabled,
        imageWidth: 'imageWidth' in t ? (t.imageWidth as number) : null,
        imageHeight: 'imageHeight' in t ? (t.imageHeight as number) : null,
        videoEnabled: t.videoEnabled,
        videoWidth: 'videoWidth' in t ? (t.videoWidth as number) : null,
        videoHeight: 'videoHeight' in t ? (t.videoHeight as number) : null,
        includeLink: t.includeLink,
        aiInstructions: t.aiInstructions,
      })),
    })

    console.log(`[seeds] ${DEFAULT_TEMPLATES.length} templates seeded.`)
  } else {
    console.log(`[seeds] Templates already seeded (${templateCount} found). Skipping.`)
  }

  // ── Schedule entries ───────────────────────────────────────────────────────
  const scheduleCount = await db.scheduleEntry.count()

  if (scheduleCount === 0) {
    console.log('[seeds] Seeding default schedule entries…')

    // Build a name → id map from the DB (works whether we just seeded or they
    // were already present from a previous run)
    const templates = await db.template.findMany({
      select: { id: true, name: true },
    })
    const templateIdByName = new Map(templates.map((t) => [t.name, t.id]))

    const entries = DEFAULT_SCHEDULE.map(({ time, platform, templateName }) => {
      const templateId = templateIdByName.get(templateName)
      if (!templateId) {
        throw new Error(
          `[seeds] Template not found for schedule entry: "${templateName}"`,
        )
      }
      return {
        time,
        platform,
        templateId,
        daysOfWeek: '[0,1,2,3,4,5,6]',
        active: true,
      }
    })

    await db.scheduleEntry.createMany({ data: entries })

    console.log(`[seeds] ${entries.length} schedule entries seeded.`)
  } else {
    console.log(
      `[seeds] Schedule entries already seeded (${scheduleCount} found). Skipping.`,
    )
  }
}
