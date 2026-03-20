import { getSetting } from './settings'

const BASE_URL = 'https://api.post-bridge.com'

export interface Account {
  id: string
  platform: string
  username: string
  connected: boolean
}

async function getHeaders(): Promise<HeadersInit> {
  const apiKey = await getSetting('postbridge_api_key')
  if (!apiKey) {
    throw new Error('postbridge_api_key is not configured in settings')
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
}

export async function schedulePost(params: {
  platform: string
  content: string
  mediaPath?: string
  scheduledAt: Date
}): Promise<{ id: string }> {
  const headers = await getHeaders()

  const body: Record<string, unknown> = {
    platform: params.platform,
    content: params.content,
    scheduled_at: params.scheduledAt.toISOString(),
  }
  if (params.mediaPath) {
    body.media_path = params.mediaPath
  }

  const response = await fetch(`${BASE_URL}/v1/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`post-bridge schedulePost failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  return { id: data.id }
}

export async function getConnectedAccounts(): Promise<Account[]> {
  const headers = await getHeaders()

  const response = await fetch(`${BASE_URL}/v1/accounts`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`post-bridge getConnectedAccounts failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  return data as Account[]
}
