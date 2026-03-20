import fs from 'fs'
import path from 'path'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import type { Promotion } from '@prisma/client'

// ---------------------------------------------------------------------------
// Core renderer
// ---------------------------------------------------------------------------

export async function renderVideo(params: {
  script: { hook: string; points: string[]; reveal: string; cta: string }
  promotion: { name: string; url: string }
  outputPath: string
  accentColor?: string
}): Promise<string> {
  const { script, promotion, outputPath, accentColor = '#6366f1' } = params

  // 1. Bundle the Remotion template entry point
  const entryPoint = path.join(__dirname, '../templates/video/index.ts')
  const bundled = await bundle({ entryPoint })

  // 2. Build input props matching ShortFormVideoProps
  const inputProps = {
    hook: script.hook,
    points: script.points,
    reveal: script.reveal,
    cta: script.cta,
    url: promotion.url,
    productName: promotion.name,
    accentColor,
  }

  // 3. Select the composition from the bundle
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'ShortFormVideo',
    inputProps,
  })

  // 4. Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  fs.mkdirSync(outputDir, { recursive: true })

  // 5. Render to MP4
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
  })

  return outputPath
}

// ---------------------------------------------------------------------------
// Convenience wrapper for the daily engine
// ---------------------------------------------------------------------------

export async function renderVideoForPromotion(params: {
  promotion: Promotion
  videoScript: string // JSON string from generate.ts
  date: string
}): Promise<string> {
  const { promotion, videoScript, date } = params

  // Parse the JSON script produced by the VIDEO_SYSTEM prompt in generate.ts
  const script = JSON.parse(videoScript) as {
    hook: string
    points: string[]
    reveal: string
    cta: string
  }

  // Resolve output path and ensure the directory exists
  const outputDir = path.resolve('./media/videos')
  fs.mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${date}.mp4`)

  return renderVideo({
    script,
    promotion: { name: promotion.name, url: promotion.url },
    outputPath,
  })
}
