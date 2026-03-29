/**
 * studio.ts
 *
 * Worker functions for the Media Studio feature.
 *
 * generateStudioImage — calls Gemini to produce a raw PNG (no text overlay),
 *   with optional parent image as inlineData context for iterative editing.
 *
 * resizeForPlatforms — uses Sharp to resize the base PNG to platform-specific
 *   dimensions and saves each to ./media/studio/.
 */

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { GoogleGenAI } from '@google/genai'
import { getSetting } from '../../lib/settings'

// ---------------------------------------------------------------------------
// Platform size definitions
// ---------------------------------------------------------------------------

const PLATFORM_SIZES = [
  { platform: 'blog',    width: 1200, height: 628  },
  { platform: 'tiktok',  width: 1080, height: 1920 },
  { platform: 'twitter', width: 1200, height: 675  },
] as const

// ---------------------------------------------------------------------------
// generateStudioImage
// ---------------------------------------------------------------------------

export async function generateStudioImage(params: {
  prompt: string
  parentFilePath?: string
  outputPath: string
}): Promise<{ buffer: Buffer; filePath: string }> {
  const { prompt, parentFilePath, outputPath } = params

  const apiKey = await getSetting('gemini_api_key')
  if (!apiKey) throw new Error('gemini_api_key not found in Setting table')

  const ai = new GoogleGenAI({ apiKey })

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  // Build contents array — optionally include parent image as inlineData
  const contents: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

  if (parentFilePath) {
    const parentBuffer = fs.readFileSync(parentFilePath)
    contents.push({
      inlineData: {
        mimeType: 'image/png',
        data: parentBuffer.toString('base64'),
      },
    })
  }

  contents.push({ text: prompt })

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: contents.length === 1 ? (contents[0].text ?? prompt) : contents,
    config: { responseModalities: ['IMAGE'] },
  })

  const parts = response.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((part: any) => part.inlineData)

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini response did not contain an image part')
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64')

  fs.writeFileSync(outputPath, buffer)

  return { buffer, filePath: outputPath }
}

// ---------------------------------------------------------------------------
// resizeForPlatforms
// ---------------------------------------------------------------------------

export async function resizeForPlatforms(params: {
  sourceBuffer: Buffer
  groupId: string
  outputDir: string
}): Promise<Array<{ platform: string; filePath: string; width: number; height: number }>> {
  const { sourceBuffer, groupId, outputDir } = params

  fs.mkdirSync(outputDir, { recursive: true })

  const results = await Promise.all(
    PLATFORM_SIZES.map(async ({ platform, width, height }) => {
      const outputPath = path.join(outputDir, `${groupId}-${platform}.png`)

      await sharp(sourceBuffer)
        .resize(width, height, { fit: 'cover' })
        .png()
        .toFile(outputPath)

      return { platform, filePath: outputPath, width, height }
    })
  )

  return results
}
