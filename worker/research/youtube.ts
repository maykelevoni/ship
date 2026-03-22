import type { RawTopic } from './index'

export async function fetchYoutubeTrending(apiKey: string, region: string): Promise<RawTopic[]> {
  if (!apiKey) {
    console.log('[research/youtube] No API key configured — skipping')
    return []
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=${encodeURIComponent(region)}&maxResults=10&key=${encodeURIComponent(apiKey)}`
    const res = await fetch(url)

    if (!res.ok) {
      console.error(`[research/youtube] Request failed: ${res.status} ${res.statusText}`)
      return []
    }

    const data = await res.json() as {
      items?: Array<{
        id: string
        snippet: {
          title: string
          description: string
        }
      }>
    }

    if (!data.items) return []

    return data.items.map((item) => ({
      source: 'youtube',
      title: item.snippet.title,
      url: `https://youtube.com/watch?v=${item.id}`,
      summary: item.snippet.description.slice(0, 300),
    }))
  } catch (err) {
    console.error('[research/youtube] Error fetching trending videos', err instanceof Error ? err.message : String(err))
    return []
  }
}
