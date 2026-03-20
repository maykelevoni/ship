import fs from 'fs'
import path from 'path'
import { getSetting } from '../../lib/settings'

const BASE_URL = 'https://api.post-bridge.com'

type Platform =
  | 'twitter'
  | 'linkedin'
  | 'reddit'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'bluesky'
  | 'threads'

async function getAuthHeader(): Promise<string> {
  const apiKey = await getSetting('postbridge_api_key')
  if (!apiKey) {
    throw new Error('postbridge_api_key is not configured in settings')
  }
  return `Bearer ${apiKey}`
}

async function uploadMedia(mediaPath: string, authHeader: string): Promise<string> {
  const fileBuffer = fs.readFileSync(mediaPath)
  const ext = path.extname(mediaPath).toLowerCase()
  const mimeType = ext === '.mp4' ? 'video/mp4' : 'image/png'
  const fileName = path.basename(mediaPath)

  const formData = new FormData()
  const blob = new Blob([fileBuffer], { type: mimeType })
  formData.append('file', blob, fileName)

  const response = await fetch(`${BASE_URL}/v1/media`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`post-bridge media upload failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  return data.id as string
}

async function doPostRequest(
  platform: Platform,
  content: string,
  mediaId: string | undefined,
  scheduledAt: Date | undefined,
  authHeader: string,
): Promise<{ id: string; status: string }> {
  const body: Record<string, unknown> = {
    platform,
    content,
  }

  if (mediaId) {
    body.media_id = mediaId
  }

  if (scheduledAt) {
    body.scheduled_at = scheduledAt.toISOString()
  }

  const response = await fetch(`${BASE_URL}/v1/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(body),
  })

  if (response.status === 429) {
    // Rate limited — wait 5 seconds and retry once
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const retry = await fetch(`${BASE_URL}/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    if (!retry.ok) {
      const text = await retry.text()
      throw new Error(`post-bridge postToPlatform retry failed (${retry.status}): ${text}`)
    }

    const retryData = await retry.json()
    return { id: retryData.id as string, status: (retryData.status as string) ?? 'scheduled' }
  }

  if (response.status === 401) {
    throw new Error('post-bridge API key is invalid or unauthorized (401)')
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`post-bridge postToPlatform failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  return { id: data.id as string, status: (data.status as string) ?? 'scheduled' }
}

export async function postToPlatform(params: {
  platform: Platform
  content: string
  mediaPath?: string
  scheduledAt?: Date
}): Promise<{ id: string; status: string }> {
  const authHeader = await getAuthHeader()

  let mediaId: string | undefined
  if (params.mediaPath) {
    mediaId = await uploadMedia(params.mediaPath, authHeader)
  }

  return doPostRequest(params.platform, params.content, mediaId, params.scheduledAt, authHeader)
}
