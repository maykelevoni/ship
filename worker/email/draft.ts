import { db } from '@/lib/db'
import { generateText } from '@/lib/ai'

// ---------------------------------------------------------------------------
// generateEmailDraft — builds an EmailDraft from today's BlogPost + promos
// ---------------------------------------------------------------------------

export async function generateEmailDraft(): Promise<void> {
  // 1. Get today's date window (midnight UTC)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 2. Find today's BlogPost
  const blogPost = await db.blogPost.findFirst({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  })

  // 3. If none: log and return early
  if (!blogPost) {
    console.log('[email/draft] No blog post found for today — skipping email draft generation')
    return
  }

  // 4. Find today's top 3 PromotionOpportunity rows
  const opportunities = await db.promotionOpportunity.findMany({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
      status: 'new',
    },
    orderBy: { createdAt: 'asc' },
    take: 3,
  })

  // 5. Check if EmailDraft already exists for this blogPostId (idempotent)
  const existing = await db.emailDraft.findUnique({
    where: { blogPostId: blogPost.id },
  })

  if (existing) {
    console.log(`[email/draft] EmailDraft already exists for blogPostId ${blogPost.id} — skipping`)
    return
  }

  // 6. Build Claude prompt
  const contentExcerpt = blogPost.content.slice(0, 1500)

  const promoList =
    opportunities.length > 0
      ? opportunities
          .map((o, i) => `${i + 1}. ${o.title} (${o.type}): ${o.rationale}`)
          .join('\n')
      : 'No promotion opportunities available for today.'

  const system =
    'You are an email newsletter writer. Write a newsletter email from the provided blog post. ' +
    'Include: a compelling subject line, brief intro (2-3 sentences), a 150-200 word summary of the key insight, ' +
    'then 2-3 promotion slots (provided), and a clear CTA to read the full post. ' +
    'Return JSON: { subject: string, body: string }'

  const userPrompt =
    `Blog Post Title: ${blogPost.title}\n\n` +
    `Content Excerpt:\n${contentExcerpt}\n\n` +
    `Promotion Suggestions:\n${promoList}`

  // 7. Generate via AI and parse JSON response
  const result = await generateText(userPrompt, system)

  // Strip markdown code fences if present
  const raw = result.text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()

  const parsed = JSON.parse(raw) as { subject: string; body: string }
  const { subject, body } = parsed

  // 8. Save EmailDraft
  await db.emailDraft.create({
    data: {
      blogPostId: blogPost.id,
      subject,
      body,
      suggestedPromos: JSON.stringify(opportunities.map((o) => o.id)),
      status: 'pending',
    },
  })

  // 9. Log success
  console.log(`[email/draft] EmailDraft saved for blogPostId ${blogPost.id} (subject: "${subject}")`)
}
