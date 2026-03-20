import { db } from '@/lib/db'
import { Promotion } from '@prisma/client'

/**
 * Select a promotion to feature today using weighted random selection.
 *
 * Rules:
 * 1. Only active promotions are eligible.
 * 2. Yesterday's promotion is excluded (no consecutive repeats).
 * 3. If fewer than 1 lead magnet was promoted in the last 5 engine runs,
 *    restrict candidates to lead_magnet type (fall back to all if none available).
 * 4. Weighted random: each promotion appears `weight` times in the pool.
 */
export async function selectPromotion(): Promise<Promotion | null> {
  // 1. Fetch all active promotions
  const activePromotions = await db.promotion.findMany({
    where: { status: 'active' },
  })

  if (activePromotions.length === 0) {
    return null
  }

  // 2. Find yesterday's promotion from the last engine run
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastRun = await db.engineRun.findFirst({
    where: {
      date: {
        gte: yesterday,
        lt: today,
      },
      promotionId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
  })

  const yesterdayPromotionId = lastRun?.promotionId ?? null

  // 3. Filter out yesterday's promotion
  let candidates = activePromotions.filter(
    (p) => p.id !== yesterdayPromotionId,
  )

  // If filtering left us with nothing (only one active promotion), fall back
  if (candidates.length === 0) {
    candidates = activePromotions
  }

  // 4. Check if lead magnet should be prioritized
  //    Count engine runs in last 5 days and how many featured a lead magnet
  const fiveDaysAgo = new Date()
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
  fiveDaysAgo.setHours(0, 0, 0, 0)

  const recentRuns = await db.engineRun.findMany({
    where: {
      date: { gte: fiveDaysAgo },
      promotionId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Gather promotion IDs from recent runs
  const recentPromotionIds = recentRuns
    .map((r) => r.promotionId)
    .filter((id): id is string => id !== null)

  // Look up which of those promotions were lead magnets
  let leadMagnetCountInLast5 = 0
  if (recentPromotionIds.length > 0) {
    const recentLeadMagnets = await db.promotion.count({
      where: {
        id: { in: recentPromotionIds },
        type: 'lead_magnet',
      },
    })
    leadMagnetCountInLast5 = recentLeadMagnets
  }

  // Prioritize lead magnets if fewer than 1 was promoted in the last 5 days
  if (leadMagnetCountInLast5 < 1) {
    const leadMagnetCandidates = candidates.filter(
      (p) => p.type === 'lead_magnet',
    )
    if (leadMagnetCandidates.length > 0) {
      candidates = leadMagnetCandidates
    }
    // else fall back to the full candidates list
  }

  // 5. Weighted random selection
  //    Build pool where each promotion appears `weight` times
  const pool: Promotion[] = []
  for (const promotion of candidates) {
    const weight = Math.max(1, promotion.weight)
    for (let i = 0; i < weight; i++) {
      pool.push(promotion)
    }
  }

  const selected = pool[Math.floor(Math.random() * pool.length)]
  return selected
}
