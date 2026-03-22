/**
 * Worker process entry point.
 * Runs alongside Next.js via concurrently.
 * Registers all cron jobs for content generation and posting.
 */

import cron from 'node-cron'
import { getSetting } from '@/lib/settings'
import { postPlatform } from './posting/scheduler'
import { seedDefaults } from '@/lib/seeds'
import { db } from '@/lib/db'
import { runResearch } from './research/index'
import { runBlogGeneration } from './blog/index'
import { runSocialRepurposing } from './social/index'
import { generateEmailDraft } from './email/draft'
import { analyzeOpportunities } from './opportunities/analyze'
import { runEngine } from './engine/run'

async function loadSchedule(timezone: string): Promise<void> {
  const entries = await db.scheduleEntry.findMany({
    where: { active: true },
    include: { template: true },
  })
  for (const entry of entries) {
    const [hStr, mStr] = entry.time.split(':')
    const h = parseInt(hStr, 10)
    const m = parseInt(mStr, 10)
    const days = JSON.parse(entry.daysOfWeek) as number[]
    const dowExpr = days.length === 7 ? '*' : days.join(',')
    const expr = `${m} ${h} * * ${dowExpr}`
    cron.schedule(expr, () => {
      postPlatform(entry.platform).catch((err) =>
        console.error(`[worker] Post failed for ${entry.platform}:`, err),
      )
    }, { timezone })
    console.log(`[worker] Scheduled ${entry.platform} at ${entry.time} (days: ${dowExpr})`)
  }
}

async function start(): Promise<void> {
  // Seed default templates and schedule entries if tables are empty
  await seedDefaults()

  // Read settings with sensible defaults
  const hourStr = await getSetting('daily_run_hour')
  const hour = hourStr !== null ? parseInt(hourStr, 10) : 6
  const timezone =
    (await getSetting('timezone')) ?? 'America/New_York'

  const cronOptions = { timezone }

  // 6:00 — Research pull
  cron.schedule(`0 ${hour} * * *`, () => {
    runResearch().catch(err => console.error('[worker] Research failed:', err))
  }, cronOptions)

  // 6:30 — Blog generation
  cron.schedule(`30 ${hour} * * *`, () => {
    runBlogGeneration().catch(err => console.error('[worker] Blog generation failed:', err))
  }, cronOptions)

  // 7:00 — Social repurposing
  cron.schedule(`0 ${hour + 1} * * *`, () => {
    runSocialRepurposing().catch(err => console.error('[worker] Social repurposing failed:', err))
  }, cronOptions)

  // 7:30 — Email draft
  cron.schedule(`30 ${hour + 1} * * *`, () => {
    generateEmailDraft().catch(err => console.error('[worker] Email draft failed:', err))
  }, cronOptions)

  // 8:00 — Opportunities analysis
  cron.schedule(`0 ${hour + 2} * * *`, () => {
    analyzeOpportunities().catch(err => console.error('[worker] Opportunities failed:', err))
  }, cronOptions)

  // Also keep the existing engine run for promotions-based content (legacy)
  cron.schedule(`0 ${hour + 3} * * *`, () => {
    runEngine().catch(err => console.error('[worker] Engine run failed:', err))
  }, cronOptions)

  // Load posting schedule dynamically from DB
  await loadSchedule(timezone)

  const entryCount = await db.scheduleEntry.count()
  if (entryCount === 0) {
    console.warn('[worker] No schedule entries found — run seeding or add entries via Settings')
  }

  console.log(
    `[worker] Worker started. Pipeline: research ${hour}:00, blog ${hour}:30, social ${hour + 1}:00, email ${hour + 1}:30, opportunities ${hour + 2}:00, engine ${hour + 3}:00 (${timezone})`,
  )
}

start().catch((err) => {
  console.error('[worker] Failed to start worker:', err)
  process.exit(1)
})

// Keep process alive
process.on('SIGINT', () => {
  console.log('[worker] Shutting down...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('[worker] Shutting down...')
  process.exit(0)
})
