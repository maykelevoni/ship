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

async function runEngine(): Promise<void> {
  // Engine orchestration will be implemented in task 017.
  // Placeholder invoked by the daily cron.
  console.log('[worker] Engine run triggered.')
}

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

  // Daily engine run — generates all content
  cron.schedule(`0 ${hour} * * *`, () => {
    runEngine().catch((err) =>
      console.error('[worker] Engine run failed:', err),
    )
  }, cronOptions)

  // Load posting schedule dynamically from DB
  await loadSchedule(timezone)

  const entryCount = await db.scheduleEntry.count()
  if (entryCount === 0) {
    console.warn('[worker] No schedule entries found — run seeding or add entries via Settings')
  }

  console.log(
    `[worker] Worker started. Engine runs at ${hour}:00 ${timezone}`,
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
