/**
 * Worker process entry point.
 * Runs alongside Next.js via concurrently.
 * Registers all cron jobs for content generation and posting.
 */

import cron from 'node-cron'
import { getSetting } from '@/lib/settings'
import { postPlatform } from './posting/scheduler'

async function runEngine(): Promise<void> {
  // Engine orchestration will be implemented in task 017.
  // Placeholder invoked by the daily cron.
  console.log('[worker] Engine run triggered.')
}

async function postTwitter(): Promise<void> {
  await postPlatform('twitter')
}

async function postLinkedIn(): Promise<void> {
  await postPlatform('linkedin')
}

async function postVideo(): Promise<void> {
  await postPlatform('video')
}

async function postReddit(): Promise<void> {
  await postPlatform('reddit')
}

async function postInstagram(): Promise<void> {
  await postPlatform('instagram')
}

async function sendEmail(): Promise<void> {
  await postPlatform('email')
}

async function start(): Promise<void> {
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

  // Staggered posting schedule
  cron.schedule('0 9 * * *', () => {
    postTwitter().catch((err) =>
      console.error('[worker] Twitter post failed:', err),
    )
  }, cronOptions)

  cron.schedule('0 10 * * *', () => {
    postLinkedIn().catch((err) =>
      console.error('[worker] LinkedIn post failed:', err),
    )
  }, cronOptions)

  cron.schedule('0 11 * * *', () => {
    postVideo().catch((err) =>
      console.error('[worker] Video post failed:', err),
    )
  }, cronOptions)

  cron.schedule('0 12 * * *', () => {
    postReddit().catch((err) =>
      console.error('[worker] Reddit post failed:', err),
    )
  }, cronOptions)

  cron.schedule('0 14 * * *', () => {
    postInstagram().catch((err) =>
      console.error('[worker] Instagram post failed:', err),
    )
  }, cronOptions)

  cron.schedule('0 17 * * *', () => {
    sendEmail().catch((err) =>
      console.error('[worker] Email send failed:', err),
    )
  }, cronOptions)

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
