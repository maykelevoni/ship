/**
 * Posting scheduler — called by each platform's cron job in worker/index.ts.
 * Fetches today's approved (or generated) content piece for the given platform
 * and dispatches it to the appropriate posting client.
 */

import { db } from '../../lib/db'
import { getSetting } from '../../lib/settings'
import { bus } from '../../lib/events'
import { postToPlatform } from './post-bridge'
import { sendEmail } from './resend'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Platform =
  | 'twitter'
  | 'linkedin'
  | 'video'
  | 'reddit'
  | 'instagram'
  | 'email'

interface ContentPiece {
  id: string
  platform: string
  content: string
  mediaPath: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the start and end of today in UTC so we can query by date range.
 */
function todayRange(): { gte: Date; lt: Date } {
  const now = new Date()
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { gte: start, lt: end }
}

/**
 * Fetches the content piece to post for the given platform today.
 * Priority: approved > generated (when gate_mode is off).
 * Returns null if nothing is available.
 */
async function fetchTodayPiece(
  platform: string,
): Promise<ContentPiece | null> {
  const range = todayRange()

  // 1. Try approved content first (always respected regardless of gate_mode)
  const approved = await db.contentPiece.findFirst({
    where: {
      platform,
      status: 'approved',
      date: range,
    },
    select: { id: true, platform: true, content: true, mediaPath: true },
  })

  if (approved) return approved

  // 2. If gate_mode is off, fall back to generated pieces
  const gateMode = await getSetting('gate_mode')
  if (gateMode === 'true') {
    return null
  }

  const generated = await db.contentPiece.findFirst({
    where: {
      platform,
      status: 'generated',
      date: range,
    },
    select: { id: true, platform: true, content: true, mediaPath: true },
  })

  return generated ?? null
}

/**
 * Fetch the associated image_card piece for platforms that need a media attachment
 * (LinkedIn, Instagram). The image_card piece shares the same date + promotionId
 * as the platform piece.
 */
async function fetchImageCard(platformPieceId: string): Promise<string | null> {
  // Look up the platform piece to get its promotionId + date
  const piece = await db.contentPiece.findUnique({
    where: { id: platformPieceId },
    select: { promotionId: true, date: true },
  })

  if (!piece) return null

  const range = todayRange()

  const imageCard = await db.contentPiece.findFirst({
    where: {
      promotionId: piece.promotionId,
      platform: 'image_card',
      date: range,
    },
    select: { mediaPath: true },
  })

  return imageCard?.mediaPath ?? null
}

/**
 * Mark a piece as "posting" (optimistically before the API call).
 */
async function markPosting(id: string): Promise<void> {
  await db.contentPiece.update({
    where: { id },
    data: { status: 'posting' },
  })
}

/**
 * Mark a piece as "posted" after a successful API call.
 */
async function markPosted(id: string, postBridgeId: string): Promise<void> {
  await db.contentPiece.update({
    where: { id },
    data: {
      status: 'posted',
      postedAt: new Date(),
      postBridgeId,
    },
  })
}

/**
 * Mark a piece as "failed" after an unsuccessful API call.
 */
async function markFailed(id: string, error: string): Promise<void> {
  await db.contentPiece.update({
    where: { id },
    data: {
      status: 'failed',
      error,
    },
  })
}

// ---------------------------------------------------------------------------
// Platform dispatch
// ---------------------------------------------------------------------------

/**
 * Dispatch a post to the correct client(s) based on platform.
 * Returns the post-bridge / email id on success.
 */
async function dispatch(piece: ContentPiece): Promise<string> {
  const { platform, content } = piece

  switch (platform) {
    case 'twitter': {
      const result = await postToPlatform({ platform: 'twitter', content })
      return result.id
    }

    case 'linkedin': {
      const mediaPath =
        piece.mediaPath ?? (await fetchImageCard(piece.id)) ?? undefined
      const result = await postToPlatform({
        platform: 'linkedin',
        content,
        mediaPath,
      })
      return result.id
    }

    case 'video': {
      // Post to TikTok, YouTube, and Instagram Reels in parallel using the same MP4
      const mediaPath = piece.mediaPath ?? undefined
      const [tiktok, youtube, reels] = await Promise.all([
        postToPlatform({ platform: 'tiktok', content, mediaPath }),
        postToPlatform({ platform: 'youtube', content, mediaPath }),
        // Instagram Reels — posted via the instagram platform with the video file
        postToPlatform({ platform: 'instagram', content, mediaPath }),
      ])
      // Return comma-separated IDs so callers can store them
      return [tiktok.id, youtube.id, reels.id].join(',')
    }

    case 'reddit': {
      const result = await postToPlatform({ platform: 'reddit', content })
      return result.id
    }

    case 'instagram': {
      const mediaPath =
        piece.mediaPath ?? (await fetchImageCard(piece.id)) ?? undefined
      const result = await postToPlatform({
        platform: 'instagram',
        content,
        mediaPath,
      })
      return result.id
    }

    case 'email': {
      // Content format expected: "SUBJECT: <subject>\nBODY: <body>"
      const lines = content.split('\n')
      const subjectLine = lines.find((l) => l.startsWith('SUBJECT:')) ?? ''
      const subject = subjectLine.replace(/^SUBJECT:\s*/, '').trim() || 'Newsletter'
      const bodyStart = content.indexOf('BODY:')
      const body =
        bodyStart !== -1 ? content.slice(bodyStart) : content
      const result = await sendEmail({ subject, body })
      return result.id
    }

    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}

// ---------------------------------------------------------------------------
// Core logic (with one retry)
// ---------------------------------------------------------------------------

/**
 * Attempt to post once. Updates DB status and emits SSE events.
 * Returns true on success, false on failure.
 */
async function attemptPost(piece: ContentPiece): Promise<boolean> {
  try {
    const postId = await dispatch(piece)

    await markPosted(piece.id, postId)

    bus.emit('post.posted', {
      contentPieceId: piece.id,
      platform: piece.platform,
      postBridgeId: postId,
      postedAt: new Date().toISOString(),
    })

    console.log(
      `[scheduler] Posted ${piece.platform} (id=${piece.id}, postId=${postId})`,
    )

    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    await markFailed(piece.id, message)

    bus.emit('post.failed', {
      contentPieceId: piece.id,
      platform: piece.platform,
      error: message,
    })

    console.error(
      `[scheduler] Failed to post ${piece.platform} (id=${piece.id}): ${message}`,
    )

    return false
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Called by each platform's cron job in worker/index.ts.
 * Fetches today's content piece for the given platform, posts it, and handles
 * one retry after 30 minutes on failure.
 */
export async function postPlatform(platform: string): Promise<void> {
  // Guard: check that the platform is enabled
  const enabledPlatformsRaw = await getSetting('enabled_platforms')
  if (enabledPlatformsRaw) {
    const enabledPlatforms = enabledPlatformsRaw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    if (enabledPlatforms.length > 0 && !enabledPlatforms.includes(platform)) {
      console.log(`[scheduler] Platform ${platform} is not enabled — skipping`)
      return
    }
  }

  const piece = await fetchTodayPiece(platform)

  if (!piece) {
    console.log(`[scheduler] No content for ${platform} today`)
    return
  }

  // Mark as posting before the API call
  await markPosting(piece.id)

  bus.emit('post.posting', {
    contentPieceId: piece.id,
    platform: piece.platform,
  })

  const success = await attemptPost(piece)

  if (!success) {
    // Retry exactly once after 30 minutes
    console.log(
      `[scheduler] Scheduling retry for ${platform} in 30 minutes (id=${piece.id})`,
    )
    setTimeout(async () => {
      console.log(`[scheduler] Retrying ${platform} (id=${piece.id})`)

      // Re-mark as posting for the retry attempt
      await markPosting(piece.id)

      bus.emit('post.posting', {
        contentPieceId: piece.id,
        platform: piece.platform,
      })

      await attemptPost(piece)
    }, 30 * 60 * 1000)
  }
}
