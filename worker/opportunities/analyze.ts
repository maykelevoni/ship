import { db } from '../../lib/db'
import { generateText } from '../../lib/ai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OpportunityType = 'affiliate' | 'ghost_offer' | 'digital_product' | 'product_gap'

interface RawOpportunity {
  type: OpportunityType
  title: string
  rationale: string
  searchQuery?: string
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export async function analyzeOpportunities(): Promise<void> {
  // 1. Get today's date range (midnight UTC)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 2. Fetch today's top 10 ResearchTopic rows
  const topics = await db.researchTopic.findMany({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { score: 'desc' },
    take: 10,
  })

  // 3. If none, log and return early
  if (topics.length === 0) {
    console.log('[opportunities] No research topics found for today — skipping analysis')
    return
  }

  console.log(`[opportunities] Found ${topics.length} research topic(s) for today`)

  // 4. Check if PromotionOpportunity rows already exist for today (idempotent)
  const existing = await db.promotionOpportunity.count({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  })

  if (existing > 0) {
    console.log(`[opportunities] ${existing} PromotionOpportunity row(s) already exist for today — skipping`)
    return
  }

  // 5. Build Claude prompt
  const system =
    'You are a monetization strategist. Given trending topics, generate exactly 8 monetization opportunities: 2 affiliate, 2 ghost_offer, 2 digital_product, 2 product_gap. Return JSON array of objects: { type, title, rationale, searchQuery? }'

  const topicsPayload = topics.map((t) => ({
    title: t.title,
    summary: t.summary ?? '',
    score: t.score,
  }))

  const prompt = JSON.stringify(topicsPayload)

  // 6. Generate with AI
  const result = await generateText(prompt, system)

  // 7. Parse JSON array from response
  let opportunities: RawOpportunity[]
  try {
    // Strip markdown code fences if present
    const cleaned = result.text.replace(/```(?:json)?\n?/g, '').trim()
    opportunities = JSON.parse(cleaned) as RawOpportunity[]
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    throw new Error(`[opportunities] Failed to parse AI response as JSON: ${detail}\nRaw response: ${result.text}`)
  }

  if (!Array.isArray(opportunities)) {
    throw new Error('[opportunities] AI response is not a JSON array')
  }

  // 8. Map to PromotionOpportunity creates and save
  const data = opportunities.map((opp) => ({
    date: today,
    type: opp.type,
    title: opp.title,
    rationale: opp.rationale,
    searchQuery: opp.type === 'affiliate' ? (opp.searchQuery ?? null) : null,
    status: 'new',
  }))

  await db.promotionOpportunity.createMany({ data })

  // 9. Log count saved
  console.log(`[opportunities] Saved ${data.length} PromotionOpportunity row(s) for today (provider: ${result.provider})`)
}
