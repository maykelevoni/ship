import { db } from '../../lib/db'
import { bus } from '../../lib/events'
import { getSetting } from '../../lib/settings'
import { selectPromotion } from './rotation'
import { generateMaster, generateAllFormats } from './generate'
import { renderImageForPlatform } from '../media/image'
import { renderVideoForPromotion } from '../media/video'

// ---------------------------------------------------------------------------
// Logger helper — appends to a string buffer; caller saves it once at the end
// ---------------------------------------------------------------------------

function makeLogger() {
  let log = ''
  return {
    info(msg: string) {
      const line = `[${new Date().toISOString()}] ${msg}`
      console.log(line)
      log += line + '\n'
    },
    error(msg: string, err?: unknown) {
      const detail = err instanceof Error ? err.message : String(err ?? '')
      const line = `[${new Date().toISOString()}] ERROR: ${msg}${detail ? ` — ${detail}` : ''}`
      console.error(line)
      log += line + '\n'
    },
    get text() {
      return log
    },
  }
}

// ---------------------------------------------------------------------------
// Main orchestration
// ---------------------------------------------------------------------------

export async function runEngine(): Promise<void> {
  const logger = makeLogger()

  // 1. Create EngineRun record
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const engineRun = await db.engineRun.create({
    data: {
      date: today,
      status: 'running',
      log: '',
    },
  })

  const runId = engineRun.id

  // 2. Emit bus event: engine started
  bus.emit('engine.event', { type: 'engine.started', payload: { runId } })
  logger.info('Engine started')

  try {
    // 3. Select promotion via rotation
    const promotion = await selectPromotion()

    if (!promotion) {
      logger.info('No active promotions — engine run completed with no output')
      await db.engineRun.update({
        where: { id: runId },
        data: { status: 'completed', log: logger.text },
      })
      return
    }

    logger.info(`Promoting: ${promotion.name} (${promotion.type})`)

    // Date string used for file names
    const dateStr = today.toISOString().slice(0, 10) // YYYY-MM-DD

    // -----------------------------------------------------------------------
    // 5. Generate master piece
    // -----------------------------------------------------------------------
    logger.info('Generating master piece…')
    const master = await generateMaster(promotion)

    const masterPiece = await db.contentPiece.create({
      data: {
        promotionId: promotion.id,
        date: today,
        platform: 'master',
        content: master,
        status: 'generated',
      },
    })
    logger.info('Master piece saved')

    // -----------------------------------------------------------------------
    // 6. Generate all platform formats in parallel
    // -----------------------------------------------------------------------
    logger.info('Generating platform formats…')
    const formats = await generateAllFormats(promotion, master)

    const platformEntries = Object.entries(formats) as [string, string][]
    const savedPieces: Record<string, { id: string; content: string }> = {}

    for (const [platform, content] of platformEntries) {
      try {
        const piece = await db.contentPiece.create({
          data: {
            promotionId: promotion.id,
            date: today,
            platform,
            content,
            status: 'generated',
          },
        })
        savedPieces[platform] = { id: piece.id, content }

        bus.emit('engine.event', {
          type: 'content.generated',
          payload: { runId, platform, pieceId: piece.id },
        })
        logger.info(`Platform "${platform}" content saved (id: ${piece.id})`)
      } catch (err) {
        logger.error(`Failed to save content piece for platform "${platform}"`, err)
      }
    }

    // -----------------------------------------------------------------------
    // 7. Generate media in parallel
    // -----------------------------------------------------------------------
    logger.info('Generating media assets…')

    const linkedinContent = savedPieces['linkedin']?.content ?? master
    const instagramContent = savedPieces['instagram']?.content ?? master
    const videoScript = savedPieces['video']?.content ?? formats['video'] ?? ''

    const [linkedinResult, instagramResult, videoResult] = await Promise.allSettled([
      renderImageForPlatform({
        platform: 'linkedin',
        promotion,
        content: linkedinContent,
        date: dateStr,
      }),
      renderImageForPlatform({
        platform: 'instagram',
        promotion,
        content: instagramContent,
        date: dateStr,
      }),
      renderVideoForPromotion({
        promotion,
        videoScript,
        date: dateStr,
      }),
    ])

    // Save linkedin image path
    if (linkedinResult.status === 'fulfilled') {
      const linkedinId = savedPieces['linkedin']?.id
      if (linkedinId) {
        await db.contentPiece.update({
          where: { id: linkedinId },
          data: { mediaPath: linkedinResult.value },
        })
        logger.info(`LinkedIn image saved: ${linkedinResult.value}`)
      }
    } else {
      logger.error('LinkedIn image generation failed', linkedinResult.reason)
    }

    // Save instagram image path
    if (instagramResult.status === 'fulfilled') {
      const instagramId = savedPieces['instagram']?.id
      if (instagramId) {
        await db.contentPiece.update({
          where: { id: instagramId },
          data: { mediaPath: instagramResult.value },
        })
        logger.info(`Instagram image saved: ${instagramResult.value}`)
      }
    } else {
      logger.error('Instagram image generation failed', instagramResult.reason)
    }

    // Save video as its own ContentPiece
    if (videoResult.status === 'fulfilled') {
      const videoPath = videoResult.value
      // Update existing video piece if present, otherwise create a new one
      const existingVideoId = savedPieces['video']?.id
      if (existingVideoId) {
        await db.contentPiece.update({
          where: { id: existingVideoId },
          data: { mediaPath: videoPath },
        })
      } else {
        await db.contentPiece.create({
          data: {
            promotionId: promotion.id,
            date: today,
            platform: 'video',
            content: videoScript,
            mediaPath: videoPath,
            status: 'generated',
          },
        })
      }
      logger.info(`Video saved: ${videoPath}`)
    } else {
      logger.error('Video generation failed', videoResult.reason)
    }

    // -----------------------------------------------------------------------
    // 8. Apply gate mode
    // -----------------------------------------------------------------------
    const gateModeRaw = await getSetting('gate_mode')
    const gateMode = gateModeRaw === 'true'

    if (!gateMode) {
      logger.info('Gate mode OFF — auto-approving all content pieces')
      await db.contentPiece.updateMany({
        where: {
          promotionId: promotion.id,
          date: today,
          status: 'generated',
        },
        data: { status: 'approved', approved: true },
      })
    } else {
      logger.info('Gate mode ON — pieces remain "generated" pending user approval')
    }

    // -----------------------------------------------------------------------
    // 9. Update EngineRun with final status
    // -----------------------------------------------------------------------
    const contentCount = await db.contentPiece.count({
      where: { promotionId: promotion.id, date: today },
    })

    logger.info(`Engine completed — ${contentCount} content piece(s) saved`)

    await db.engineRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        promotionId: promotion.id,
        contentCount,
        log: logger.text,
      },
    })

    // 10. Emit engine.completed SSE event
    bus.emit('engine.event', {
      type: 'engine.completed',
      payload: { runId, contentCount },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error('Engine run failed', err)

    await db.engineRun
      .update({
        where: { id: runId },
        data: { status: 'failed', log: logger.text },
      })
      .catch(() => undefined)

    bus.emit('engine.event', {
      type: 'engine.failed',
      payload: { runId, error: message },
    })
  }
}
