/**
 * image.ts
 *
 * Renders social-media images using the Google Gemini API
 * (gemini-3.1-flash-image-preview). Produces PNG files from text prompts
 * built by the helpers in image-prompts.ts.
 *
 * No Puppeteer is used anywhere in this module.
 */

import fs from 'fs'
import path from 'path'
import { GoogleGenAI } from '@google/genai'
import type { Promotion } from '@prisma/client'
import { getSetting } from '../../lib/settings'
import {
  buildTextCardPrompt,
  buildQuoteCardPrompt,
  buildStatCardPrompt,
  getStyleForPromotion,
  type ImageStyle,
} from './image-prompts'

// ---------------------------------------------------------------------------
// Core renderer
// ---------------------------------------------------------------------------

export async function renderImage(params: {
  style: ImageStyle
  promptData: Record<string, string>
  outputPath: string
}): Promise<string> {
  const { style, promptData, outputPath } = params

  // 1. Fetch API key from Setting table
  const apiKey = await getSetting('gemini_api_key')
  if (!apiKey) {
    throw new Error('gemini_api_key not found in Setting table')
  }

  // 2. Initialize Gemini client
  const ai = new GoogleGenAI({ apiKey })

  // 3. Build the prompt string for the requested style
  let prompt: string
  switch (style) {
    case 'text-card':
      prompt = buildTextCardPrompt({
        headline: promptData.headline ?? '',
        subtext: promptData.subtext,
        badge: promptData.badge,
        url: promptData.url,
        accentColor: promptData.accentColor,
      })
      break
    case 'quote-card':
      prompt = buildQuoteCardPrompt({
        quote: promptData.quote ?? '',
        attribution: promptData.attribution,
        url: promptData.url,
      })
      break
    case 'stat-card':
      prompt = buildStatCardPrompt({
        stat: promptData.stat ?? '',
        label: promptData.label ?? '',
        context: promptData.context,
        url: promptData.url,
      })
      break
    default:
      throw new Error(`Unknown image style: ${style}`)
  }

  // 4. Call Gemini image generation API
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: prompt,
    config: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '1:1' },
    },
  })

  // 5. Extract base64 image data from response parts
  const parts = response.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((part: any) => part.inlineData)

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini response did not contain an image part')
  }

  const base64Data: string = imagePart.inlineData.data

  // 6. Write PNG to disk
  fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'))

  // 7. Return the output path
  return outputPath
}

// ---------------------------------------------------------------------------
// Platform-aware renderer
// ---------------------------------------------------------------------------

export async function renderImageForPlatform(params: {
  platform: 'linkedin' | 'instagram'
  promotion: Promotion
  content: string
  date: string
}): Promise<string> {
  const { platform, promotion, content, date } = params

  // Pick style based on promotion type
  const style = getStyleForPromotion(promotion.type)

  // Build promptData from promotion fields
  const promptData: Record<string, string> = {
    // text-card / stat-card shared fields
    headline: promotion.name,
    subtext: promotion.description,
    url: promotion.url,
    // quote-card fields
    quote: content,
    attribution: promotion.name,
    // stat-card fields
    stat: promotion.price ?? '',
    label: promotion.description,
  }

  // Ensure output directory exists
  const outputDir = path.resolve('./media/images')
  fs.mkdirSync(outputDir, { recursive: true })

  const outputPath = path.join(outputDir, `${date}-${platform}.png`)

  return renderImage({ style, promptData, outputPath })
}
